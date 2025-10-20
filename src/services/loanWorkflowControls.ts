import { supabase } from '../lib/supabaseClient';
import { LoanStatusUpdateService } from './loanStatusUpdateService';
import { UnifiedApprovalService } from './unifiedApprovalService';

export interface WorkflowState {
  loanApplicationId: string;
  currentStage: 'submitted' | 'assessment' | 'contract_generation' | 'contract_upload' | 'verification' | 'disbursement' | 'completed';
  status: 'pending' | 'in_progress' | 'completed' | 'recalled' | 'rejected';
  submittedBy: string;
  submittedAt: string;
  recalledBy?: string;
  recalledAt?: string;
  recallReason?: string;
  canBeRecalled: boolean;
  nextStage: string;
  isLocked: boolean;
}

export interface WorkflowAction {
  action: 'submit' | 'recall' | 'approve' | 'reject';
  loanApplicationId: string;
  userId: string;
  reason?: string;
  targetStage?: string;
}

export class LoanWorkflowControls {
  // Check if a loan can be submitted to the next stage
  static async canSubmitToNextStage(
    loanApplicationId: string, 
    targetStage: string, 
    userId: string
  ): Promise<{ canSubmit: boolean; reason?: string; currentState?: WorkflowState }> {
    try {
      // Get current workflow state
      const currentState = await this.getWorkflowState(loanApplicationId);
      
      if (!currentState) {
        return { canSubmit: false, reason: 'Loan application not found' };
      }

      // Check if loan is already in the target stage or beyond
      const stageOrder = ['submitted', 'assessment', 'contract_generation', 'contract_upload', 'verification', 'disbursement', 'completed'];
      const currentStageIndex = stageOrder.indexOf(currentState.currentStage);
      const targetStageIndex = stageOrder.indexOf(targetStage);

      if (currentState.isLocked) {
        return { 
          canSubmit: false, 
          reason: 'Loan is currently locked and cannot be moved',
          currentState 
        };
      }

      if (currentState.status === 'recalled') {
        return { 
          canSubmit: false, 
          reason: 'Loan has been recalled and needs to be resubmitted from previous stage',
          currentState 
        };
      }

      if (currentState.status === 'completed') {
        return { 
          canSubmit: false, 
          reason: 'Loan processing is already completed',
          currentState 
        };
      }

      if (targetStageIndex <= currentStageIndex) {
        return { 
          canSubmit: false, 
          reason: `Loan is already at or beyond ${targetStage} stage`,
          currentState 
        };
      }

      // Check if there's already a pending submission to the target stage (skip if table doesn't exist)
      try {
        const { data: existingSubmission, error } = await supabase
          .from('loan_workflow_submissions')
          .select('*')
          .eq('loan_application_id', loanApplicationId)
          .eq('target_stage', targetStage)
          .eq('status', 'pending')
          .single();

        if (existingSubmission && !error) {
          return { 
            canSubmit: false, 
            reason: `Loan has already been submitted to ${targetStage} stage`,
            currentState 
          };
        }
      } catch (error) {
        console.warn('Workflow submission table not available, skipping submission check:', error);
      }

      return { canSubmit: true, currentState };
    } catch (error) {
      console.error('Error checking submission eligibility:', error);
      return { canSubmit: false, reason: 'Error checking submission eligibility' };
    }
  }

  // Submit loan to next stage
  static async submitToNextStage(
    loanApplicationId: string,
    targetStage: string,
    userId: string,
    notes?: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Check if submission is allowed
      const { canSubmit, reason } = await this.canSubmitToNextStage(loanApplicationId, targetStage, userId);
      
      if (!canSubmit) {
        return { success: false, message: reason || 'Submission not allowed' };
      }

      // Create workflow submission record (skip if table doesn't exist)
      try {
        const { error: submissionError } = await supabase
          .from('loan_workflow_submissions')
          .insert({
            loan_application_id: loanApplicationId,
            current_stage: (await this.getWorkflowState(loanApplicationId))?.currentStage || 'submitted',
            target_stage: targetStage,
            submitted_by: userId,
            status: 'pending',
            notes: notes,
            submitted_at: new Date().toISOString()
          });

        if (submissionError) {
          console.warn('Workflow submission table not available, continuing without submission record:', submissionError.message);
          // Continue without the submission record - this is not critical for the workflow
        }
      } catch (error) {
        console.warn('Workflow submission table not available, continuing without submission record:', error);
        // Continue without the submission record - this is not critical for the workflow
      }

      // Update loan application status
      const statusMap: Record<string, string> = {
        'assessment': 'under_review',
        'contract_generation': 'approved',
        'contract_upload': 'contract_generated',
        'verification': 'contract_uploaded',
        'disbursement': 'verified',
        'completed': 'disbursed'
      };

      const newStatus = statusMap[targetStage] || 'pending';
      
      // Update loan status using the specialized service
      const updateResult = await LoanStatusUpdateService.updateLoanStatus(
        loanApplicationId,
        newStatus,
        userId
      );

      if (!updateResult.success) {
        console.error('Error updating loan status:', updateResult.message);
        return { success: false, message: updateResult.message };
      }

      // Record workflow step
      await this.recordWorkflowStep(loanApplicationId, `submitted_to_${targetStage}`, 'completed', userId, notes);

      return { success: true, message: `Loan successfully submitted to ${targetStage} stage` };
    } catch (error) {
      console.error('Error submitting to next stage:', error);
      return { success: false, message: 'Error submitting to next stage' };
    }
  }

  // Recall loan from current stage
  static async recallLoan(
    loanApplicationId: string,
    userId: string,
    reason: string,
    targetStage?: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const currentState = await this.getWorkflowState(loanApplicationId);
      
      if (!currentState) {
        return { success: false, message: 'Loan application not found' };
      }

      if (!currentState.canBeRecalled) {
        return { success: false, message: 'Loan cannot be recalled from current stage' };
      }

      // Create recall record
      const { error: recallError } = await supabase
        .from('loan_workflow_recalls')
        .insert({
          loan_application_id: loanApplicationId,
          recalled_from_stage: currentState.currentStage,
          recalled_to_stage: targetStage || this.getPreviousStage(currentState.currentStage),
          recalled_by: userId,
          reason: reason,
          recalled_at: new Date().toISOString()
        });

      if (recallError) {
        console.error('Error creating recall record:', recallError);
        return { success: false, message: 'Failed to create recall record' };
      }

      // Update loan status to recalled
      const { error: updateError } = await supabase
        .from('loan_applications')
        .update({
          status: 'recalled',
          updated_at: new Date().toISOString()
        })
        .eq('id', loanApplicationId);

      if (updateError) {
        console.error('Error updating loan status:', updateError);
        return { success: false, message: 'Failed to update loan status' };
      }

      // Record workflow step
      await this.recordWorkflowStep(loanApplicationId, 'recalled', 'completed', userId, reason);

      return { success: true, message: 'Loan successfully recalled' };
    } catch (error) {
      console.error('Error recalling loan:', error);
      return { success: false, message: 'Error recalling loan' };
    }
  }

  // Get current workflow state
  static async getWorkflowState(loanApplicationId: string): Promise<WorkflowState | null> {
    try {
      const { data: loan, error } = await supabase
        .from('loan_applications')
        .select(`
          id,
          status,
          contract_status,
          created_at,
          updated_at
        `)
        .eq('id', loanApplicationId)
        .single();

      if (error || !loan) {
        return null;
      }

      // Determine current stage based on status
      const currentStage = this.determineCurrentStage(loan.status, loan.contract_status);
      const canBeRecalled = this.canBeRecalled(currentStage, loan.status);
      const nextStage = this.getNextStage(currentStage);

      return {
        loanApplicationId,
        currentStage,
        status: loan.status === 'recalled' ? 'recalled' : 'in_progress',
        submittedBy: 'system', // This would be fetched from user context
        submittedAt: loan.created_at,
        canBeRecalled,
        nextStage,
        isLocked: loan.status === 'disbursed' || loan.status === 'completed'
      };
    } catch (error) {
      console.error('Error getting workflow state:', error);
      return null;
    }
  }

  // Determine current stage based on status
  private static determineCurrentStage(status: string, contractStatus?: string): WorkflowState['currentStage'] {
    switch (status) {
      case 'submitted':
        return 'submitted';
      case 'under_review':
      case 'pending_committee_review':
        return 'assessment';
      case 'approved':
        return contractStatus === 'generated' ? 'contract_generation' : 'assessment';
      case 'contract_generated':
        return 'contract_upload';
      case 'contract_uploaded':
        return 'verification';
      case 'verified':
        return 'disbursement';
      case 'disbursed':
        return 'completed';
      default:
        return 'submitted';
    }
  }

  // Check if stage can be recalled
  private static canBeRecalled(stage: string, status: string): boolean {
    if (status === 'disbursed' || status === 'completed') {
      return false;
    }
    
    const recallableStages = ['assessment', 'contract_generation', 'contract_upload', 'verification'];
    return recallableStages.includes(stage);
  }

  // Get next stage
  private static getNextStage(currentStage: string): string {
    const stageOrder = ['submitted', 'assessment', 'contract_generation', 'contract_upload', 'verification', 'disbursement', 'completed'];
    const currentIndex = stageOrder.indexOf(currentStage);
    return currentIndex < stageOrder.length - 1 ? stageOrder[currentIndex + 1] : 'completed';
  }

  // Get previous stage
  private static getPreviousStage(currentStage: string): string {
    const stageOrder = ['submitted', 'assessment', 'contract_generation', 'contract_upload', 'verification', 'disbursement', 'completed'];
    const currentIndex = stageOrder.indexOf(currentStage);
    return currentIndex > 0 ? stageOrder[currentIndex - 1] : 'submitted';
  }

  // Record workflow step
  private static async recordWorkflowStep(
    loanApplicationId: string,
    stepName: string,
    status: string,
    userId: string,
    notes?: string
  ): Promise<void> {
    try {
      await supabase
        .from('loan_workflow_steps')
        .insert({
          loan_application_id: loanApplicationId,
          step_name: stepName,
          status: status,
          completed_at: new Date().toISOString(),
          notes: notes,
          user_id: userId
        });
    } catch (error) {
      console.warn('Workflow steps table not available, skipping step recording:', error);
    }
  }

  // Get workflow history for a loan
  static async getWorkflowHistory(loanApplicationId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('loan_workflow_steps')
        .select(`
          *,
          users:user_id (
            id,
            email
          )
        `)
        .eq('loan_application_id', loanApplicationId)
        .order('completed_at', { ascending: false });

      if (error) {
        console.warn('Workflow steps table not available, returning empty history:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.warn('Workflow steps table not available, returning empty history:', error);
      return [];
    }
  }

  // Initialize approval workflow for a loan application
  static async initializeApprovalWorkflow(
    loanApplicationId: string,
    userId: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Get loan application details
      const { data: loan, error: loanError } = await supabase
        .from('loan_applications')
        .select('id, requested_amount, client_type')
        .eq('id', loanApplicationId)
        .single();

      if (loanError || !loan) {
        return { success: false, message: 'Loan application not found' };
      }

      // Determine appropriate approval level
      const approvalLevel = await UnifiedApprovalService.determineApprovalLevel(
        loan.requested_amount,
        loan.client_type
      );

      if (!approvalLevel) {
        return { success: false, message: 'No appropriate approval level found' };
      }

      // Create approval assignment
      await UnifiedApprovalService.createApprovalAssignment(
        loanApplicationId,
        approvalLevel.id,
        null, // assigned_to_user_id - will be assigned later
        userId
      );

      return { success: true, message: 'Approval workflow initialized successfully' };
    } catch (error) {
      console.error('Error initializing approval workflow:', error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Failed to initialize approval workflow' 
      };
    }
  }

  // Check if loan can proceed to next stage based on approval status
  static async canProceedToNextStage(
    loanApplicationId: string,
    targetStage: string
  ): Promise<{ canProceed: boolean; reason?: string }> {
    try {
      const workflowState = await UnifiedApprovalService.getApprovalWorkflowState(loanApplicationId);
      
      if (!workflowState) {
        return { canProceed: false, reason: 'Workflow state not found' };
      }

      // Check if approval is required for the target stage
      const approvalRequiredStages = ['contract_generation', 'disbursement'];
      
      if (approvalRequiredStages.includes(targetStage)) {
        if (workflowState.approvalStatus !== 'approved') {
          return { 
            canProceed: false, 
            reason: `Loan must be approved before proceeding to ${targetStage}` 
          };
        }
      }

      return { canProceed: true };
    } catch (error) {
      console.error('Error checking stage progression:', error);
      return { canProceed: false, reason: 'Error checking stage progression' };
    }
  }

  // Get comprehensive workflow status including approval information
  static async getComprehensiveWorkflowStatus(loanApplicationId: string): Promise<{
    workflowState: WorkflowState | null;
    approvalState: any;
    canProceed: boolean;
    nextSteps: string[];
  }> {
    try {
      const [workflowState, approvalState] = await Promise.all([
        this.getWorkflowState(loanApplicationId),
        UnifiedApprovalService.getApprovalWorkflowState(loanApplicationId)
      ]);

      const nextSteps: string[] = [];
      
      if (approvalState && approvalState.approvalStatus !== 'approved') {
        nextSteps.push('Complete approval process');
      } else if (workflowState) {
        nextSteps.push(`Proceed to ${workflowState.nextStage}`);
      }

      return {
        workflowState,
        approvalState,
        canProceed: approvalState?.approvalStatus === 'approved' || false,
        nextSteps
      };
    } catch (error) {
      console.error('Error getting comprehensive workflow status:', error);
      return {
        workflowState: null,
        approvalState: null,
        canProceed: false,
        nextSteps: ['Fix workflow errors']
      };
    }
  }
}























