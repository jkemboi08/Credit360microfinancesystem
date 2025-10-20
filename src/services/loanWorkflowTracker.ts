import { supabase } from '../lib/supabaseClient';

export interface LoanWorkflowStep {
  id: string;
  loanApplicationId: string;
  stepName: string;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  completedAt?: string;
  notes?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoanProgressStatus {
  loanApplicationId: string;
  currentStep: string;
  isAssessmentCompleted: boolean;
  isContractGenerated: boolean;
  isContractSigned: boolean;
  isContractVerified: boolean;
  isReadyForDisbursement: boolean;
  isReadyForCommittee: boolean;
  canGenerateContract: boolean;
  canUploadContract: boolean;
  canVerifyContract: boolean;
  canDisburse: boolean;
  nextStep: string;
  progressPercentage: number;
}

export class LoanWorkflowTracker {
  // Track workflow step completion
  static async recordWorkflowStep(
    loanApplicationId: string,
    stepName: string,
    status: 'completed' | 'in_progress' | 'skipped',
    userId: string,
    notes?: string
  ): Promise<LoanWorkflowStep> {
    try {
      const { data, error } = await supabase
        .from('loan_workflow_steps')
        .insert([{
          loan_application_id: loanApplicationId,
          step_name: stepName,
          status,
          completed_at: status === 'completed' ? new Date().toISOString() : null,
          notes,
          user_id: userId
        }])
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to record workflow step: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.warn('Workflow steps table not available, creating mock step record:', error);
      // Return a mock step record if table doesn't exist
      return {
        id: `mock-${Date.now()}`,
        loan_application_id: loanApplicationId,
        step_name: stepName,
        status: status,
        completed_at: status === 'completed' ? new Date().toISOString() : null,
        notes: notes,
        user_id: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    }
  }

  // Get comprehensive progress status for a loan application
  static async getLoanProgressStatus(loanApplicationId: string): Promise<LoanProgressStatus> {
    try {
      // Get loan application details
      const { data: loanApp, error: appError } = await supabase
        .from('loan_applications')
        .select(`
          id,
          status,
          contract_status,
          assessment_score,
          risk_grade,
          approved_amount,
          clients (
            first_name,
            last_name
          )
        `)
        .eq('id', loanApplicationId)
        .single();

      if (appError || !loanApp) {
        throw new Error('Loan application not found');
      }

      // Get workflow steps (skip if table doesn't exist)
      let workflowSteps: any[] = [];
      try {
        const { data, error: stepsError } = await supabase
          .from('loan_workflow_steps')
          .select('*')
          .eq('loan_application_id', loanApplicationId)
          .order('created_at', { ascending: true });
        
        if (stepsError) {
          console.warn('Workflow steps table not available, using empty steps:', stepsError);
        } else {
          workflowSteps = data || [];
        }
      } catch (error) {
        console.warn('Workflow steps table not available, using empty steps:', error);
      }

      // Get contract status
      const { data: contracts, error: contractError } = await supabase
        .from('loan_contracts')
        .select('*')
        .eq('loan_application_id', loanApplicationId)
        .order('created_at', { ascending: false })
        .limit(1);

      if (contractError) {
        console.warn('Failed to fetch contracts:', contractError);
      }

      const contract = contracts?.[0];

      console.log('🔍 Contract status debug:', {
        loanApplicationId,
        contract: contract ? {
          id: contract.id,
          status: contract.status,
          created_at: contract.created_at
        } : null,
        contractsCount: contracts?.length || 0
      });

      // Determine current step and progress
      const isAssessmentCompleted = loanApp.status === 'approved' || 
                                   loanApp.status === 'pending_committee_review' ||
                                   loanApp.assessment_score > 0;

      const isContractGenerated = contract?.status === 'generated' || 
                                 contract?.status === 'sent_to_client' ||
                                 contract?.status === 'uploaded' ||
                                 contract?.status === 'verified';

      const isContractSigned = contract?.status === 'uploaded' || 
                              contract?.status === 'verified' ||
                              contract?.status === 'signed_by_client' ||
                              contract?.status === 'signed';

      const isContractVerified = contract?.status === 'verified';

      console.log('🔍 Contract validation flags:', {
        loanApplicationId,
        isAssessmentCompleted,
        isContractGenerated,
        isContractSigned,
        isContractVerified,
        contractStatus: contract?.status
      });

      const isReadyForDisbursement = isContractVerified && 
                                    (loanApp.approved_amount || loanApp.status === 'approved');

      const isReadyForCommittee = loanApp.status === 'pending_committee_review';

      // Determine next step
      let nextStep = 'assessment';
      let currentStep = 'assessment';
      let progressPercentage = 0;

      if (!isAssessmentCompleted) {
        currentStep = 'assessment';
        nextStep = 'assessment';
        progressPercentage = 0;
      } else if (!isContractGenerated) {
        currentStep = 'contract_generation';
        nextStep = 'contract_generation';
        progressPercentage = 25;
      } else if (!isContractSigned) {
        currentStep = 'contract_upload';
        nextStep = 'contract_upload';
        progressPercentage = 50;
      } else if (!isContractVerified) {
        currentStep = 'contract_verification';
        nextStep = 'contract_verification';
        progressPercentage = 75;
      } else if (isReadyForCommittee) {
        currentStep = 'committee_review';
        nextStep = 'committee_review';
        progressPercentage = 90;
      } else if (isReadyForDisbursement) {
        currentStep = 'disbursement';
        nextStep = 'disbursement';
        progressPercentage = 100;
      }

      return {
        loanApplicationId,
        currentStep,
        isAssessmentCompleted,
        isContractGenerated,
        isContractSigned,
        isContractVerified,
        isReadyForDisbursement,
        isReadyForCommittee,
        canGenerateContract: isAssessmentCompleted && !isContractGenerated,
        canUploadContract: isContractGenerated && !isContractSigned,
        canVerifyContract: isContractSigned && !isContractVerified,
        canDisburse: isContractVerified && isReadyForDisbursement,
        nextStep,
        progressPercentage
      };
    } catch (error) {
      console.error('Error getting loan progress status:', error);
      throw error;
    }
  }

  // Update loan application status based on workflow progress
  static async updateLoanStatus(
    loanApplicationId: string,
    newStatus: string,
    userId: string,
    notes?: string
  ): Promise<void> {
    const { error } = await supabase
      .from('loan_applications')
      .update({
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', loanApplicationId);

    if (error) {
      throw new Error(`Failed to update loan status: ${error.message}`);
    }

    // Record the status change
    await this.recordWorkflowStep(
      loanApplicationId,
      'status_update',
      'completed',
      userId,
      `Status updated to: ${newStatus}. ${notes || ''}`
    );
  }

  // Move loan to disbursement queue (remove from processing list)
  static async moveToDisbursementQueue(
    loanApplicationId: string,
    userId: string
  ): Promise<void> {
    // Update status to ready for disbursement
    await this.updateLoanStatus(
      loanApplicationId,
      'ready_for_disbursement',
      userId,
      'Moved to disbursement queue'
    );

    // Record workflow step
    await this.recordWorkflowStep(
      loanApplicationId,
      'moved_to_disbursement',
      'completed',
      userId,
      'Loan moved to disbursement queue'
    );
  }

  // Move loan to committee approval queue
  static async moveToCommitteeQueue(
    loanApplicationId: string,
    userId: string
  ): Promise<void> {
    // Update status to pending committee review
    await this.updateLoanStatus(
      loanApplicationId,
      'pending_committee_review',
      userId,
      'Moved to committee approval queue'
    );

    // Record workflow step
    await this.recordWorkflowStep(
      loanApplicationId,
      'moved_to_committee',
      'completed',
      userId,
      'Loan moved to committee approval queue'
    );
  }

  // Get loans that should be removed from processing list
  static async getLoansToRemoveFromProcessing(): Promise<string[]> {
    const { data, error } = await supabase
      .from('loan_applications')
      .select('id')
      .in('status', ['disbursed', 'closed', 'pending_committee_review'])
      .in('contract_status', ['verified', 'disbursed']);

    if (error) {
      console.error('Error fetching loans to remove:', error);
      return [];
    }

    return data?.map(loan => loan.id) || [];
  }

  // Validate workflow progression
  static async validateWorkflowProgression(
    loanApplicationId: string,
    requestedAction: string
  ): Promise<{ isValid: boolean; message: string }> {
    const progress = await this.getLoanProgressStatus(loanApplicationId);

    console.log('🔍 Contract validation debug:', {
      loanApplicationId,
      requestedAction,
      progress: {
        isAssessmentCompleted: progress.isAssessmentCompleted,
        isContractGenerated: progress.isContractGenerated,
        isContractSigned: progress.isContractSigned,
        isContractVerified: progress.isContractVerified,
        currentStep: progress.currentStep,
        nextStep: progress.nextStep
      }
    });

    switch (requestedAction) {
      case 'generate_contract':
        if (!progress.isAssessmentCompleted) {
          return { isValid: false, message: 'Loan must be assessed and approved before contract generation' };
        }
        if (progress.isContractGenerated) {
          return { isValid: false, message: 'Contract has already been generated' };
        }
        return { isValid: true, message: 'Contract generation is valid' };

      case 'upload_contract':
        if (!progress.isContractGenerated) {
          return { isValid: false, message: 'Contract must be generated before upload' };
        }
        if (progress.isContractSigned) {
          return { isValid: false, message: 'Contract has already been uploaded and signed' };
        }
        return { isValid: true, message: 'Contract upload is valid' };

      case 'verify_contract':
        if (!progress.isContractSigned) {
          return { isValid: false, message: 'Contract must be uploaded before verification' };
        }
        if (progress.isContractVerified) {
          return { isValid: false, message: 'Contract has already been verified' };
        }
        return { isValid: true, message: 'Contract verification is valid' };

      default:
        return { isValid: false, message: 'Invalid action requested' };
    }
  }
}
