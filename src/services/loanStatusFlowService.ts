import { supabase } from '../lib/supabaseClient';
import { UnifiedApprovalService } from './unifiedApprovalService';

export interface LoanStatusFlow {
  stage: string;
  status: string;
  description: string;
  nextStage?: string;
  canProceed: boolean;
  requiredActions: string[];
  displayOrder: number;
}

export interface LoanStageMapping {
  [key: string]: {
    statuses: string[];
    description: string;
    nextStage?: string;
  };
}

export class LoanStatusFlowService {
  // Define the complete loan processing flow
  static readonly LOAN_FLOW_STAGES: LoanStatusFlow[] = [
    {
      stage: 'submitted',
      status: 'submitted',
      description: 'Loan application submitted',
      nextStage: 'credit_assessment',
      canProceed: true,
      requiredActions: ['Review application', 'Start credit assessment'],
      displayOrder: 1
    },
    {
      stage: 'credit_assessment',
      status: 'under_review',
      description: 'Under credit assessment',
      nextStage: 'approval',
      canProceed: true,
      requiredActions: ['Complete credit assessment', 'Generate risk score'],
      displayOrder: 2
    },
    {
      stage: 'approval',
      status: 'pending_initial_review',
      description: 'Pending initial approval',
      nextStage: 'contract_generation',
      canProceed: false,
      requiredActions: ['Review and approve/reject'],
      displayOrder: 3
    },
    {
      stage: 'approval',
      status: 'pending_supervisor_approval',
      description: 'Pending supervisor approval',
      nextStage: 'contract_generation',
      canProceed: false,
      requiredActions: ['Supervisor review and approval'],
      displayOrder: 4
    },
    {
      stage: 'approval',
      status: 'pending_manager_approval',
      description: 'Pending manager approval',
      nextStage: 'contract_generation',
      canProceed: false,
      requiredActions: ['Manager review and approval'],
      displayOrder: 5
    },
    {
      stage: 'approval',
      status: 'pending_committee_review',
      description: 'Pending committee review',
      nextStage: 'contract_generation',
      canProceed: false,
      requiredActions: ['Committee review and decision'],
      displayOrder: 6
    },
    {
      stage: 'approval',
      status: 'approved',
      description: 'Approved for contract generation',
      nextStage: 'contract_generation',
      canProceed: true,
      requiredActions: ['Generate loan contract'],
      displayOrder: 7
    },
    {
      stage: 'contract_generation',
      status: 'contract_generated',
      description: 'Contract generated',
      nextStage: 'contract_upload',
      canProceed: true,
      requiredActions: ['Send contract to client', 'Wait for signature'],
      displayOrder: 8
    },
    {
      stage: 'contract_upload',
      status: 'approved',
      description: 'Contract signed by client',
      nextStage: 'disbursement',
      canProceed: true,
      requiredActions: ['Verify contract', 'Prepare for disbursement'],
      displayOrder: 9
    },
    {
      stage: 'disbursement',
      status: 'ready_for_disbursement',
      description: 'Ready for disbursement',
      nextStage: 'disbursed',
      canProceed: true,
      requiredActions: ['Process disbursement'],
      displayOrder: 10
    },
    {
      stage: 'disbursed',
      status: 'disbursed',
      description: 'Loan disbursed',
      nextStage: 'monitoring',
      canProceed: true,
      requiredActions: ['Start loan monitoring'],
      displayOrder: 11
    },
    {
      stage: 'monitoring',
      status: 'active',
      description: 'Active loan - under monitoring',
      nextStage: 'closure',
      canProceed: true,
      requiredActions: ['Monitor repayments', 'Track performance'],
      displayOrder: 12
    },
    {
      stage: 'closure',
      status: 'completed',
      description: 'Loan completed/closed',
      nextStage: undefined,
      canProceed: false,
      requiredActions: ['Archive loan records'],
      displayOrder: 13
    },
    {
      stage: 'rejected',
      status: 'rejected',
      description: 'Loan rejected',
      nextStage: undefined,
      canProceed: false,
      requiredActions: ['Notify client', 'Archive application'],
      displayOrder: 14
    }
  ];

  // Define which statuses belong to which pages
  static readonly PAGE_STATUS_MAPPING: LoanStageMapping = {
    'loan_applications': {
      statuses: ['submitted'],
      description: 'New loan applications',
      nextStage: 'credit_assessment'
    },
    'credit_assessment': {
      statuses: ['under_review'],
      description: 'Loans under credit assessment',
      nextStage: 'approval'
    },
    'loan_processing': {
      statuses: [
        'submitted',
        'under_review',
        'pending_assessment',
        'assessment_complete',
        'pending_committee_review',
        'pending_committee_approval',
        'committee_approved',
        'approved',
        'contract_generated',
        'contract_uploaded'
      ],
      description: 'Loans in processing pipeline',
      nextStage: 'disbursement'
    },
    'committee_approval': {
      statuses: ['pending_committee_review'],
      description: 'Loans pending committee review',
      nextStage: 'contract_generation'
    },
    'disbursements': {
      statuses: ['approved', 'disbursed'],
      description: 'Loans with signed contracts ready for disbursement',
      nextStage: 'monitoring'
    },
    'loan_monitoring': {
      statuses: ['approved', 'disbursed', 'active'],
      description: 'Active loans under monitoring',
      nextStage: 'closure'
    },
    'loan_restructuring': {
      statuses: ['active', 'restructuring'],
      description: 'Loans under restructuring',
      nextStage: 'monitoring'
    },
    'loan_closure': {
      statuses: ['closed'],
      description: 'Closed loans',
      nextStage: undefined
    }
  };

  /**
   * Get the current stage and status for a loan application
   */
  static async getLoanStageStatus(loanApplicationId: string): Promise<{
    currentStage: string;
    currentStatus: string;
    canProceed: boolean;
    nextStage?: string;
    requiredActions: string[];
  } | null> {
    try {
      const { data: loan, error } = await supabase
        .from('loan_applications')
        .select('id, status, approval_status, contract_status')
        .eq('id', loanApplicationId)
        .single();

      if (error || !loan) {
        return null;
      }

      // Determine the current status based on approval_status and contract_status
      let currentStatus = loan.status;
      
      // If we have approval_status, use that for more granular status
      if (loan.approval_status) {
        currentStatus = loan.approval_status;
      }

      // Find the matching flow stage
      const flowStage = this.LOAN_FLOW_STAGES.find(stage => 
        stage.status === currentStatus || 
        (stage.stage === 'contract_generation' && loan.contract_status === 'generated') ||
        (stage.stage === 'contract_upload' && loan.contract_status === 'signed')
      );

      if (!flowStage) {
        return {
          currentStage: 'unknown',
          currentStatus: currentStatus,
          canProceed: false,
          requiredActions: ['Contact administrator']
        };
      }

      return {
        currentStage: flowStage.stage,
        currentStatus: flowStage.status,
        canProceed: flowStage.canProceed,
        nextStage: flowStage.nextStage,
        requiredActions: flowStage.requiredActions
      };
    } catch (error) {
      console.error('Error getting loan stage status:', error);
      return null;
    }
  }

  /**
   * Get loans for a specific page/stage
   */
  static async getLoansForPage(pageName: string): Promise<any[]> {
    try {
      const pageMapping = this.PAGE_STATUS_MAPPING[pageName];
      if (!pageMapping) {
        console.error(`Unknown page: ${pageName}`);
        return [];
      }

      let query = supabase
        .from('loan_applications')
        .select(`
          id,
          application_id,
          client_id,
          requested_amount,
          loan_purpose,
          repayment_period_months,
          status,
          approval_status,
          contract_status,
          created_at,
          updated_at,
          credit_score,
          risk_rating,
          assessment_score,
          committee_decision,
          committee_comments,
          committee_approved_by,
          committee_approved_at,
          clients (
            id,
            first_name,
            last_name,
            full_name,
            phone_number,
            email_address,
            client_type,
            street_name,
            house_number,
            area_of_residence
          )
        `);

      // Only apply status filter if statuses array is not empty
      if (pageMapping.statuses && pageMapping.statuses.length > 0) {
        // For committee approval, we need to check both status and approval_status columns
        if (pageName === 'committee_approval') {
          query = query.or(`status.in.(${pageMapping.statuses.join(',')}),approval_status.in.(${pageMapping.statuses.join(',')})`);
        } 
        // For disbursements, we need to check status='approved' AND contract_status in valid values
        else if (pageName === 'disbursements') {
          query = query.eq('status', 'approved').in('contract_status', ['signed_by_client', 'uploaded', 'verified']);
        } 
        else {
          query = query.in('status', pageMapping.statuses);
        }
      }

      const { data: loans, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error(`Error fetching loans for ${pageName}:`, error);
        return [];
      }

      console.log(`Loan Status Flow Service - ${pageName}:`, {
        pageName,
        statuses: pageMapping.statuses,
        loansFound: loans?.length || 0,
        loanStatuses: loans?.map(loan => ({ id: loan.id, status: loan.status })) || []
      });

      return loans || [];
    } catch (error) {
      console.error(`Error getting loans for page ${pageName}:`, error);
      return [];
    }
  }

  /**
   * Update loan status to next stage
   */
  static async moveToNextStage(
    loanApplicationId: string,
    userId: string,
    comments?: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const currentStage = await this.getLoanStageStatus(loanApplicationId);
      if (!currentStage) {
        return { success: false, message: 'Loan not found' };
      }

      if (!currentStage.canProceed) {
        return { success: false, message: 'Cannot proceed from current stage' };
      }

      const nextStage = currentStage.nextStage;
      if (!nextStage) {
        return { success: false, message: 'No next stage available' };
      }

      // Find the next stage status
      const nextFlowStage = this.LOAN_FLOW_STAGES.find(stage => 
        stage.stage === nextStage && stage.displayOrder > 
        this.LOAN_FLOW_STAGES.find(s => s.stage === currentStage.currentStage)?.displayOrder || 0
      );

      if (!nextFlowStage) {
        return { success: false, message: 'Next stage not found' };
      }

      // Update loan status
      const { error } = await supabase
        .from('loan_applications')
        .update({
          status: nextFlowStage.status,
          updated_at: new Date().toISOString(),
          updated_by_user_id: userId
        })
        .eq('id', loanApplicationId);

      if (error) {
        return { success: false, message: `Failed to update status: ${error.message}` };
      }

      // Record workflow step (skip if table doesn't exist)
      try {
        await supabase
          .from('loan_workflow_steps')
          .insert({
            loan_application_id: loanApplicationId,
            step_name: `moved_to_${nextStage}`,
            status: 'completed',
            completed_at: new Date().toISOString(),
            notes: comments || `Moved to ${nextStage}`,
            user_id: userId
          });
      } catch (error) {
        console.warn('Workflow steps table not available, skipping step recording:', error);
      }

      return { success: true, message: `Successfully moved to ${nextStage}` };
    } catch (error) {
      console.error('Error moving to next stage:', error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Failed to move to next stage' 
      };
    }
  }

  /**
   * Get all loans with their current stage information
   */
  static async getAllLoansWithStages(): Promise<any[]> {
    try {
      const { data: loans, error } = await supabase
        .from('loan_applications')
        .select(`
          id,
          client_id,
          requested_amount,
          loan_purpose,
          repayment_period_months,
          status,
          approval_status,
          contract_status,
          created_at,
          updated_at,
          clients (
            id,
            first_name,
            last_name,
            phone_number,
            email_address,
            client_type
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching loans:', error);
        return [];
      }

      // Enrich each loan with stage information
      const enrichedLoans = await Promise.all(
        (loans || []).map(async (loan) => {
          const stageInfo = await this.getLoanStageStatus(loan.id);
          return {
            ...loan,
            stageInfo
          };
        })
      );

      return enrichedLoans;
    } catch (error) {
      console.error('Error getting all loans with stages:', error);
      return [];
    }
  }

  /**
   * Get workflow progress for a loan
   */
  static getWorkflowProgress(currentStatus: string): number {
    const flowStage = this.LOAN_FLOW_STAGES.find(stage => stage.status === currentStatus);
    if (!flowStage) return 0;

    const totalStages = this.LOAN_FLOW_STAGES.length;
    return Math.round((flowStage.displayOrder / totalStages) * 100);
  }

  /**
   * Get status color for UI display
   */
  static getStatusColor(status: string): string {
    const statusColors: { [key: string]: string } = {
      'submitted': 'bg-blue-100 text-blue-800',
      'under_review': 'bg-yellow-100 text-yellow-800',
      'pending_initial_review': 'bg-orange-100 text-orange-800',
      'pending_supervisor_approval': 'bg-purple-100 text-purple-800',
      'pending_manager_approval': 'bg-indigo-100 text-indigo-800',
      'pending_committee_review': 'bg-red-100 text-red-800',
      'approved': 'bg-green-100 text-green-800',
      'contract_generated': 'bg-cyan-100 text-cyan-800',
      'contract_signed': 'bg-teal-100 text-teal-800',
      'ready_for_disbursement': 'bg-emerald-100 text-emerald-800',
      'disbursed': 'bg-lime-100 text-lime-800',
      'active': 'bg-green-100 text-green-800',
      'completed': 'bg-gray-100 text-gray-800',
      'rejected': 'bg-red-100 text-red-800'
    };

    return statusColors[status] || 'bg-gray-100 text-gray-800';
  }

  /**
   * Get stage description for UI display
   */
  static getStageDescription(stage: string, status: string): string {
    const flowStage = this.LOAN_FLOW_STAGES.find(s => s.stage === stage && s.status === status);
    return flowStage?.description || `${stage} - ${status}`;
  }
}

