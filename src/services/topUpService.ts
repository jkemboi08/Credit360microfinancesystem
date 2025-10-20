import { supabase } from '../lib/supabaseClient';
import { TopUpRequest, WorkflowStep } from '../types/topUp.types';

export class TopUpService {
  private static TABLE_NAME = 'topup_requests';
  private static WORKFLOW_TABLE_NAME = 'topup_approval_workflow';

  // Submit a new top-up request
  static async submitTopUpRequest(requestData: Partial<TopUpRequest>): Promise<TopUpRequest> {
    try {
      const requestNumber = `TR-2025-${Date.now().toString().slice(-6)}`;
      
      const { data, error } = await supabase
        .from(this.TABLE_NAME)
        .insert({
          request_number: requestNumber,
          client_id: requestData.clientId,
          existing_loan_id: requestData.existingLoanId,
          requested_amount: requestData.requestedAmount,
          selected_strategy: requestData.selectedStrategy,
          strategy_details: requestData.strategyDetails,
          disbursement_method: requestData.disbursementMethod,
          disbursement_details: requestData.disbursementDetails,
          processing_fee: requestData.fees?.processingFee,
          insurance_fee: requestData.fees?.insuranceFee,
          net_disbursement: requestData.fees?.netDisbursement,
          status: 'pending_credit_review',
          requires_dti_override: requestData.dtiOverride?.approved || false,
          dti_override_reason: requestData.dtiOverride?.reason,
          dti_override_approved_by: requestData.dtiOverride?.approvedBy,
          created_by: requestData.createdBy,
          staff_notes: requestData.staffNotes,
          requirements_checklist: requestData.requirementsChecklist
        })
        .select()
        .single();

      if (error) throw error;

      // Create workflow steps
      await this.createWorkflowSteps(data.id);

      return data;
    } catch (error) {
      console.error('Error submitting top-up request:', error);
      throw error;
    }
  }

  // Create workflow steps for a top-up request
  private static async createWorkflowSteps(requestId: string): Promise<void> {
    const workflowSteps = [
      {
        topup_request_id: requestId,
        step_name: 'credit_officer_review',
        step_order: 1,
        status: 'pending',
        assigned_to: null // Will be assigned by system
      },
      {
        topup_request_id: requestId,
        step_name: 'supervisor_approval',
        step_order: 2,
        status: 'pending',
        assigned_to: null
      },
      {
        topup_request_id: requestId,
        step_name: 'committee_approval',
        step_order: 3,
        status: 'pending',
        assigned_to: null
      },
      {
        topup_request_id: requestId,
        step_name: 'disbursement',
        step_order: 4,
        status: 'pending',
        assigned_to: null
      }
    ];

    const { error } = await supabase
      .from(this.WORKFLOW_TABLE_NAME)
      .insert(workflowSteps);

    if (error) throw error;
  }

  // Get all top-up requests
  static async getAllTopUpRequests(filters?: {
    status?: string;
    clientId?: string;
    page?: number;
    limit?: number;
  }): Promise<TopUpRequest[]> {
    try {
      let query = supabase
        .from(this.TABLE_NAME)
        .select(`
          *,
          clients (
            id,
            first_name,
            last_name,
            full_name,
            phone_number,
            email_address
          ),
          loan_applications (
            id,
            requested_amount,
            outstanding_balance,
            status
          )
        `)
        .order('created_at', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.clientId) {
        query = query.eq('client_id', filters.clientId);
      }

      if (filters?.page && filters?.limit) {
        const offset = (filters.page - 1) * filters.limit;
        query = query.range(offset, offset + filters.limit - 1);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching top-up requests:', error);
      throw error;
    }
  }

  // Get top-up request by ID
  static async getTopUpRequestById(id: string): Promise<TopUpRequest | null> {
    try {
      const { data, error } = await supabase
        .from(this.TABLE_NAME)
        .select(`
          *,
          clients (
            id,
            first_name,
            last_name,
            full_name,
            phone_number,
            email_address
          ),
          loan_applications (
            id,
            requested_amount,
            outstanding_balance,
            status
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error fetching top-up request:', error);
      throw error;
    }
  }

  // Update top-up request status
  static async updateTopUpRequestStatus(
    id: string, 
    status: string, 
    updatedBy: string,
    comments?: string
  ): Promise<void> {
    try {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString()
      };

      if (status === 'approved') {
        updateData.approved_by = updatedBy;
        updateData.approved_at = new Date().toISOString();
      }

      if (status === 'disbursed') {
        updateData.disbursed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from(this.TABLE_NAME)
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      // Update workflow step
      await this.updateWorkflowStep(id, status, updatedBy, comments);
    } catch (error) {
      console.error('Error updating top-up request status:', error);
      throw error;
    }
  }

  // Update workflow step
  private static async updateWorkflowStep(
    requestId: string,
    status: string,
    updatedBy: string,
    comments?: string
  ): Promise<void> {
    try {
      // Map status to step name
      const stepMapping: { [key: string]: string } = {
        'pending_credit_review': 'credit_officer_review',
        'pending_supervisor': 'supervisor_approval',
        'pending_committee': 'committee_approval',
        'approved': 'committee_approval',
        'disbursed': 'disbursement'
      };

      const stepName = stepMapping[status];
      if (!stepName) return;

      const { error } = await supabase
        .from(this.WORKFLOW_TABLE_NAME)
        .update({
          status: status === 'disbursed' ? 'approved' : 'approved',
          reviewed_by: updatedBy,
          reviewed_at: new Date().toISOString(),
          comments
        })
        .eq('topup_request_id', requestId)
        .eq('step_name', stepName);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating workflow step:', error);
      throw error;
    }
  }

  // Get workflow steps for a request
  static async getWorkflowSteps(requestId: string): Promise<WorkflowStep[]> {
    try {
      const { data, error } = await supabase
        .from(this.WORKFLOW_TABLE_NAME)
        .select(`
          *,
          staff (
            id,
            first_name,
            last_name
          )
        `)
        .eq('topup_request_id', requestId)
        .order('step_order', { ascending: true });

      if (error) throw error;

      return data?.map(step => ({
        stepName: step.step_name,
        stepOrder: step.step_order,
        status: step.status,
        assignedTo: step.assigned_to,
        reviewedBy: step.reviewed_by,
        reviewedAt: step.reviewed_at,
        comments: step.comments
      })) || [];
    } catch (error) {
      console.error('Error fetching workflow steps:', error);
      throw error;
    }
  }

  // Check if client has pending top-up requests
  static async hasPendingTopUpRequest(clientId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from(this.TABLE_NAME)
        .select('id')
        .eq('client_id', clientId)
        .in('status', ['pending_credit_review', 'pending_supervisor', 'pending_committee'])
        .limit(1);

      if (error) throw error;

      return data && data.length > 0;
    } catch (error) {
      console.error('Error checking pending top-up requests:', error);
      return false;
    }
  }

  // Get top-up statistics
  static async getTopUpStatistics(): Promise<{
    totalRequests: number;
    pendingRequests: number;
    approvedRequests: number;
    disbursedRequests: number;
    rejectedRequests: number;
  }> {
    try {
      const { data, error } = await supabase
        .from(this.TABLE_NAME)
        .select('status');

      if (error) throw error;

      const stats = {
        totalRequests: data?.length || 0,
        pendingRequests: data?.filter(r => ['pending_credit_review', 'pending_supervisor', 'pending_committee'].includes(r.status)).length || 0,
        approvedRequests: data?.filter(r => r.status === 'approved').length || 0,
        disbursedRequests: data?.filter(r => r.status === 'disbursed').length || 0,
        rejectedRequests: data?.filter(r => r.status === 'rejected').length || 0
      };

      return stats;
    } catch (error) {
      console.error('Error fetching top-up statistics:', error);
      throw error;
    }
  }
}

export default TopUpService;







