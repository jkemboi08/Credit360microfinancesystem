import { supabase } from '../lib/supabaseClient';
import { UnifiedApprovalService } from './unifiedApprovalService';

export interface LoanWorkflowStep {
  id: string;
  step_name: string;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  completed_at?: string;
  notes?: string;
  user_id: string;
}

export interface DisbursementQueueItem {
  id?: string;
  loan_application_id: string;
  client_id: string;
  client_name: string;
  loan_amount: number;
  approved_amount: number;
  interest_rate: number;
  term_months: number;
  disbursement_date: string;
  status: 'pending' | 'ready' | 'processing' | 'completed' | 'cancelled';
  created_at?: string;
  updated_at?: string;
  created_by_user_id: string;
}

export class LoanWorkflowService {
  static WORKFLOW_STEPS_TABLE = 'loan_workflow_steps';
  static DISBURSEMENT_QUEUE_TABLE = 'disbursement_queue';

  // Update loan application status
  static async updateLoanStatus(loanApplicationId: string, status: string, userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('loan_applications')
        .update({ 
          status,
          updated_at: new Date().toISOString(),
          updated_by_user_id: userId
        })
        .eq('id', loanApplicationId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating loan status:', error);
      throw error;
    }
  }

  // Record workflow step completion
  static async recordWorkflowStep(
    loanApplicationId: string, 
    stepName: string, 
    status: 'completed' | 'in_progress' | 'skipped',
    userId: string,
    notes?: string
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from(this.WORKFLOW_STEPS_TABLE)
        .insert({
          loan_application_id: loanApplicationId,
          step_name: stepName,
          status,
          completed_at: status === 'completed' ? new Date().toISOString() : null,
          notes,
          user_id: userId
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error recording workflow step:', error);
      throw error;
    }
  }

  // Get workflow steps for a loan application
  static async getWorkflowSteps(loanApplicationId: string): Promise<LoanWorkflowStep[]> {
    try {
      const { data, error } = await supabase
        .from(this.WORKFLOW_STEPS_TABLE)
        .select('*')
        .eq('loan_application_id', loanApplicationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching workflow steps:', error);
      throw error;
    }
  }

  // Approve loan and move to contract generation
  static async approveLoan(
    loanApplicationId: string, 
    userId: string, 
    decision: string,
    comments?: string
  ): Promise<void> {
    try {
      // Use unified approval service for approval
      const result = await UnifiedApprovalService.processApprovalAction(
        loanApplicationId,
        'approve',
        userId,
        comments
      );

      if (!result.success) {
        throw new Error(result.message);
      }
      
      // Record assessment completion
      await this.recordWorkflowStep(
        loanApplicationId, 
        'credit_assessment', 
        'completed', 
        userId,
        `Decision: ${decision}. ${comments || ''}`
      );

      // Record contract generation start
      await this.recordWorkflowStep(
        loanApplicationId, 
        'contract_generation', 
        'in_progress', 
        userId
      );
    } catch (error) {
      console.error('Error approving loan:', error);
      throw error;
    }
  }

  // Mark contract as generated
  static async markContractGenerated(loanApplicationId: string, userId: string): Promise<void> {
    try {
      await this.recordWorkflowStep(
        loanApplicationId, 
        'contract_generation', 
        'completed', 
        userId,
        'Contract document generated successfully'
      );

      await this.recordWorkflowStep(
        loanApplicationId, 
        'contract_upload', 
        'in_progress', 
        userId
      );

      // Update loan status
      await this.updateLoanStatus(loanApplicationId, 'contract_generated', userId);
    } catch (error) {
      console.error('Error marking contract as generated:', error);
      throw error;
    }
  }

  // Mark contract as uploaded and signed
  static async markContractUploaded(loanApplicationId: string, userId: string): Promise<void> {
    try {
      await this.recordWorkflowStep(
        loanApplicationId, 
        'contract_upload', 
        'completed', 
        userId,
        'Signed contract uploaded successfully'
      );

      await this.recordWorkflowStep(
        loanApplicationId, 
        'final_approval', 
        'in_progress', 
        userId
      );

      // Update loan status
      await this.updateLoanStatus(loanApplicationId, 'contract_signed', userId);
    } catch (error) {
      console.error('Error marking contract as uploaded:', error);
      throw error;
    }
  }

  // Final approval for disbursement
  static async finalApproval(
    loanApplicationId: string, 
    userId: string,
    loanData: any
  ): Promise<void> {
    try {
      // Record final approval
      await this.recordWorkflowStep(
        loanApplicationId, 
        'final_approval', 
        'completed', 
        userId,
        'Final approval granted for disbursement'
      );

      // Update loan status
      await this.updateLoanStatus(loanApplicationId, 'ready_for_disbursement', userId);

      // Add to disbursement queue
      await this.addToDisbursementQueue(loanApplicationId, loanData, userId);
    } catch (error) {
      console.error('Error in final approval:', error);
      throw error;
    }
  }

  // Add loan to disbursement queue
  static async addToDisbursementQueue(
    loanApplicationId: string, 
    loanData: any, 
    userId: string
  ): Promise<DisbursementQueueItem> {
    try {
      const disbursementItem = {
        loan_application_id: loanApplicationId,
        client_id: loanData.client_id,
        client_name: loanData.client_name,
        loan_amount: loanData.loan_amount,
        approved_amount: loanData.approved_amount || loanData.loan_amount,
        interest_rate: loanData.interest_rate,
        term_months: loanData.term_months,
        disbursement_date: loanData.disbursement_date || new Date().toISOString().split('T')[0],
        status: 'pending' as const,
        created_by_user_id: userId
      };

      const { data, error } = await supabase
        .from(this.DISBURSEMENT_QUEUE_TABLE)
        .insert([disbursementItem])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error adding to disbursement queue:', error);
      throw error;
    }
  }

  // Get disbursement queue
  static async getDisbursementQueue(): Promise<DisbursementQueueItem[]> {
    try {
      const { data, error } = await supabase
        .from(this.DISBURSEMENT_QUEUE_TABLE)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching disbursement queue:', error);
      throw error;
    }
  }

  // Update disbursement item status
  static async updateDisbursementStatus(
    disbursementId: string, 
    status: string, 
    userId: string
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from(this.DISBURSEMENT_QUEUE_TABLE)
        .update({
          status,
          updated_at: new Date().toISOString(),
          updated_by_user_id: userId
        })
        .eq('id', disbursementId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating disbursement status:', error);
      throw error;
    }
  }
}




