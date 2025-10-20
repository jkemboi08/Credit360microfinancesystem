import { supabase, handleSupabaseError } from '../lib/supabaseClient';

export interface LoanDecisionData {
  loan_application_id: string;
  credit_assessment_id?: string;
  decision: 'approved' | 'rejected' | 'referred';
  decision_stage: 'loan_officer' | 'credit_committee' | 'final_approval';
  approved_amount?: number;
  approved_interest_rate?: number;
  approved_tenor?: number;
  conditions?: string[];
  rejection_reason?: string;
  decision_comments: string;
  decided_by_user_id: string;
  client_notified?: boolean;
  notification_method?: 'sms' | 'email' | 'both';
}

export class LoanDecisionService {
  // Record loan decision
  static async recordDecision(decisionData: LoanDecisionData) {
    try {
      const { data, error } = await supabase
        .from('loan_decisions')
        .insert({
          ...decisionData,
          decision_timestamp: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Update loan application status based on decision
      let newStatus = 'in_review';
      let updateData: any = {
        workflow_stage: decisionData.decision_stage,
        updated_at: new Date().toISOString()
      };

      switch (decisionData.decision) {
        case 'approved':
          newStatus = decisionData.decision_stage === 'final_approval' ? 'approved' : 'awaiting_approval';
          if (decisionData.approved_amount) updateData.approved_amount = decisionData.approved_amount;
          if (decisionData.approved_interest_rate) updateData.approved_interest_rate = decisionData.approved_interest_rate;
          if (decisionData.approved_tenor) updateData.approved_tenor = decisionData.approved_tenor;
          break;
        case 'rejected':
          newStatus = 'rejected';
          updateData.rejection_reason = decisionData.rejection_reason;
          break;
        case 'referred':
          newStatus = 'awaiting_approval';
          break;
      }

      updateData.status = newStatus;

      await supabase
        .from('loan_applications')
        .update(updateData)
        .eq('id', decisionData.loan_application_id);

      // Send notification to client (mock)
      if (decisionData.client_notified) {
        await this.sendClientNotification(
          decisionData.loan_application_id,
          decisionData.decision,
          decisionData.notification_method || 'both'
        );
      }

      return { data, error: null };
    } catch (error) {
      return { data: null, error: handleSupabaseError(error) };
    }
  }

  // Get decision history for loan application
  static async getDecisionHistory(loanApplicationId: string) {
    try {
      const { data, error } = await supabase
        .from('loan_decisions')
        .select(`
          *,
          profiles!loan_decisions_decided_by_user_id_fkey(name, email)
        `)
        .eq('loan_application_id', loanApplicationId)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return { data, error: null };
    } catch (error) {
      return { data: null, error: handleSupabaseError(error) };
    }
  }

  // Send notification to client (mock implementation)
  private static async sendClientNotification(
    loanApplicationId: string,
    decision: string,
    method: string
  ) {
    try {
      // Get client details
      const { data: application, error } = await supabase
        .from('loan_applications')
        .select(`
          *,
          clients(full_name, phone_number, user_id),
          profiles!inner(email)
        `)
        .eq('id', loanApplicationId)
        .single();

      if (error || !application) {
        console.error('Error getting application for notification:', error);
        return;
      }

      // Mock notification sending
      const notificationData = {
        client_name: application.clients.full_name,
        phone: application.clients.phone_number,
        email: application.profiles?.email,
        decision: decision,
        amount: application.approved_amount || application.requested_amount,
        loan_id: loanApplicationId
      };

      if (method === 'sms' || method === 'both') {
        console.log('Sending SMS notification:', {
          to: notificationData.phone,
          message: `Dear ${notificationData.client_name}, your loan application has been ${decision}. Amount: TZS ${notificationData.amount?.toLocaleString()}`
        });
      }

      if (method === 'email' || method === 'both') {
        console.log('Sending email notification:', {
          to: notificationData.email,
          subject: `Loan Application ${decision.charAt(0).toUpperCase() + decision.slice(1)}`,
          body: `Your loan application ${loanApplicationId} has been ${decision}.`
        });
      }

      // Log notification in audit trail
      await supabase
        .from('audit_logs')
        .insert({
          action: 'Client Notification Sent',
          details: `Sent ${decision} notification to ${notificationData.client_name} via ${method}`,
          category: 'notification',
          entity_type: 'loan_application',
          entity_id: loanApplicationId,
          is_encrypted: true
        });

    } catch (error) {
      console.error('Error sending client notification:', error);
    }
  }

  // Approve loan application
  static async approveLoan(
    loanApplicationId: string,
    approvedBy: string,
    approvalData: {
      amount?: number;
      interestRate?: number;
      tenor?: number;
      conditions?: string[];
      comments: string;
    }
  ) {
    const decisionData: LoanDecisionData = {
      loan_application_id: loanApplicationId,
      decision: 'approved',
      decision_stage: 'final_approval',
      approved_amount: approvalData.amount,
      approved_interest_rate: approvalData.interestRate,
      approved_tenor: approvalData.tenor,
      conditions: approvalData.conditions,
      decision_comments: approvalData.comments,
      decided_by_user_id: approvedBy,
      client_notified: true,
      notification_method: 'both'
    };

    return this.recordDecision(decisionData);
  }

  // Reject loan application
  static async rejectLoan(
    loanApplicationId: string,
    rejectedBy: string,
    rejectionData: {
      reason: string;
      comments: string;
    }
  ) {
    const decisionData: LoanDecisionData = {
      loan_application_id: loanApplicationId,
      decision: 'rejected',
      decision_stage: 'loan_officer',
      rejection_reason: rejectionData.reason,
      decision_comments: rejectionData.comments,
      decided_by_user_id: rejectedBy,
      client_notified: true,
      notification_method: 'both'
    };

    return this.recordDecision(decisionData);
  }
}