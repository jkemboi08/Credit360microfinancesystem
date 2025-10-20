import { supabase } from '../lib/supabaseClient';

export interface ApprovalLevel {
  id: string;
  level_name: string;
  min_amount: number;
  max_amount: number;
  requires_committee_approval: boolean;
  committee_threshold: number | null;
  approval_authority: string;
  is_active: boolean;
}

export interface ApprovalLevelAssignment {
  id: string;
  loan_application_id: string;
  approval_level_id: string;
  assigned_to_user_id: string | null;
  status: 'pending' | 'approved' | 'rejected';
  comments: string | null;
  approved_at: string | null;
  created_at: string;
  created_by_user_id: string;
}

export interface ApprovalWorkflowState {
  loanApplicationId: string;
  currentApprovalLevel: ApprovalLevel | null;
  currentAssignment: ApprovalLevelAssignment | null;
  approvalStatus: string;
  canApprove: boolean;
  canReject: boolean;
  nextApprovalLevel: ApprovalLevel | null;
  isCommitteeRequired: boolean;
  workflowProgress: number;
}

export class UnifiedApprovalService {
  /**
   * Get all active approval levels
   */
  static async getApprovalLevels(): Promise<ApprovalLevel[]> {
    try {
      const { data, error } = await supabase
        .from('approval_levels')
        .select('*')
        .eq('is_active', true)
        .order('min_amount', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching approval levels:', error);
      throw error;
    }
  }

  /**
   * Determine the appropriate approval level for a loan application
   */
  static async determineApprovalLevel(loanAmount: number, clientType: string): Promise<ApprovalLevel | null> {
    try {
      const approvalLevels = await this.getApprovalLevels();
      
      // Find the appropriate level based on loan amount
      const appropriateLevel = approvalLevels.find(level => 
        loanAmount >= level.min_amount && loanAmount <= level.max_amount
      );

      return appropriateLevel || null;
    } catch (error) {
      console.error('Error determining approval level:', error);
      throw error;
    }
  }

  /**
   * Create approval level assignment for a loan application
   */
  static async createApprovalAssignment(
    loanApplicationId: string,
    approvalLevelId: string,
    assignedToUserId: string | null,
    createdByUserId: string
  ): Promise<ApprovalLevelAssignment> {
    try {
      const { data, error } = await supabase
        .from('approval_level_assignments')
        .insert({
          loan_application_id: loanApplicationId,
          approval_level_id: approvalLevelId,
          assigned_to_user_id: assignedToUserId,
          status: 'pending',
          created_by_user_id: createdByUserId
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating approval assignment:', error);
      throw error;
    }
  }

  /**
   * Get current approval workflow state for a loan application
   */
  static async getApprovalWorkflowState(loanApplicationId: string): Promise<ApprovalWorkflowState> {
    try {
      // Get loan application details
      const { data: loan, error: loanError } = await supabase
        .from('loan_applications')
        .select(`
          id,
          requested_amount,
          client_type,
          approval_status,
          committee_review_required,
          approval_level
        `)
        .eq('id', loanApplicationId)
        .single();

      if (loanError || !loan) {
        throw new Error('Loan application not found');
      }

      // Get current approval level assignment
      const { data: assignment, error: assignmentError } = await supabase
        .from('approval_level_assignments')
        .select(`
          *,
          approval_levels (*)
        `)
        .eq('loan_application_id', loanApplicationId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      const currentAssignment = assignment?.approval_levels ? {
        ...assignment,
        approval_level: assignment.approval_levels
      } : null;

      // Determine if committee review is required
      const isCommitteeRequired = loan.committee_review_required || 
        (currentAssignment?.approval_level?.requires_committee_approval && 
         loan.requested_amount >= (currentAssignment.approval_level.committee_threshold || 0));

      // Calculate workflow progress
      const workflowProgress = this.calculateWorkflowProgress(loan.approval_status, isCommitteeRequired);

      // Determine if user can approve/reject (this would need user context)
      const canApprove = this.canUserApprove(loan.approval_status, currentAssignment);
      const canReject = this.canUserReject(loan.approval_status, currentAssignment);

      return {
        loanApplicationId,
        currentApprovalLevel: currentAssignment?.approval_level || null,
        currentAssignment: currentAssignment || null,
        approvalStatus: loan.approval_status,
        canApprove,
        canReject,
        nextApprovalLevel: null, // Would need to determine based on current level
        isCommitteeRequired,
        workflowProgress
      };
    } catch (error) {
      console.error('Error getting approval workflow state:', error);
      throw error;
    }
  }

  /**
   * Process approval action
   */
  static async processApprovalAction(
    loanApplicationId: string,
    action: 'approve' | 'reject' | 'refer_to_committee',
    userId: string,
    comments?: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const workflowState = await this.getApprovalWorkflowState(loanApplicationId);
      
      if (!workflowState.currentAssignment) {
        return { success: false, message: 'No pending approval assignment found' };
      }

      // Update approval assignment
      const { error: assignmentError } = await supabase
        .from('approval_level_assignments')
        .update({
          status: action === 'approve' ? 'approved' : 'rejected',
          comments: comments || null,
          approved_at: action === 'approve' ? new Date().toISOString() : null
        })
        .eq('id', workflowState.currentAssignment.id);

      if (assignmentError) throw assignmentError;

      // Determine new approval status
      let newApprovalStatus = workflowState.approvalStatus;
      let newApprovalLevel = workflowState.currentApprovalLevel?.approval_authority || 'staff';
      let newLoanStatus = loanApplication.status;

      if (action === 'approve') {
        if (workflowState.isCommitteeRequired && workflowState.currentApprovalLevel?.approval_authority !== 'committee') {
          newApprovalStatus = 'pending_committee_review';
          newApprovalLevel = 'committee';
          newLoanStatus = 'pending_committee_review';
        } else {
          newApprovalStatus = 'approved';
          newLoanStatus = 'approved';
        }
      } else if (action === 'reject') {
        newApprovalStatus = 'rejected';
        newLoanStatus = 'rejected';
      } else if (action === 'refer_to_committee') {
        newApprovalStatus = 'pending_committee_review';
        newApprovalLevel = 'committee';
        newLoanStatus = 'pending_committee_review';
      }

      // Update loan application
      const { error: loanError } = await supabase
        .from('loan_applications')
        .update({
          status: newLoanStatus,
          approval_status: newApprovalStatus,
          approval_level: newApprovalLevel,
          approved_by: action === 'approve' ? userId : null,
          approved_at: action === 'approve' ? new Date().toISOString() : null,
          rejection_reason: action === 'reject' ? comments : null,
          updated_at: new Date().toISOString()
        })
        .eq('id', loanApplicationId);

      if (loanError) throw loanError;

      // Record in approval history
      await this.recordApprovalHistory(
        loanApplicationId,
        action,
        userId,
        comments,
        newApprovalLevel,
        workflowState.approvalStatus,
        newApprovalStatus
      );

      // If approved and not committee required, create next level assignment if needed
      if (action === 'approve' && !workflowState.isCommitteeRequired) {
        await this.createNextLevelAssignment(loanApplicationId, userId);
      }

      return { 
        success: true, 
        message: `Loan ${action}d successfully` 
      };
    } catch (error) {
      console.error('Error processing approval action:', error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Failed to process approval action' 
      };
    }
  }

  /**
   * Fix loan status based on proper approval levels
   * This function corrects loans that have incorrect statuses due to hardcoded thresholds
   */
  static async fixLoanStatusBasedOnApprovalLevels(loanApplicationId: string): Promise<{ success: boolean; message: string }> {
    try {
      // Get loan application details
      const { data: loan, error: loanError } = await supabase
        .from('loan_applications')
        .select(`
          id,
          requested_amount,
          client_type,
          approval_status,
          status,
          committee_review_required,
          approval_level
        `)
        .eq('id', loanApplicationId)
        .single();

      if (loanError || !loan) {
        return { success: false, message: 'Loan application not found' };
      }

      // Determine correct approval level
      const correctApprovalLevel = await this.determineApprovalLevel(loan.requested_amount, loan.client_type);
      
      if (!correctApprovalLevel) {
        return { success: false, message: 'Could not determine appropriate approval level' };
      }

      // Check if committee review is actually required
      const isCommitteeRequired = correctApprovalLevel.requires_committee_approval && 
        loan.requested_amount >= (correctApprovalLevel.committee_threshold || 0);

      // Determine correct status
      let correctStatus = loan.status;
      let correctApprovalStatus = loan.approval_status;

      if (loan.status === 'pending_committee_review' && !isCommitteeRequired) {
        // This loan should not be in committee review
        correctStatus = 'approved';
        correctApprovalStatus = 'approved';
      } else if (loan.status !== 'pending_committee_review' && isCommitteeRequired) {
        // This loan should be in committee review
        correctStatus = 'pending_committee_review';
        correctApprovalStatus = 'pending_committee_review';
      }

      // Update loan if status needs to be corrected
      if (correctStatus !== loan.status || correctApprovalStatus !== loan.approval_status) {
        const { error: updateError } = await supabase
          .from('loan_applications')
          .update({
            status: correctStatus,
            approval_status: correctApprovalStatus,
            approval_level: correctApprovalLevel.approval_authority,
            committee_review_required: isCommitteeRequired,
            updated_at: new Date().toISOString()
          })
          .eq('id', loanApplicationId);

        if (updateError) {
          return { success: false, message: `Failed to update loan status: ${updateError.message}` };
        }

        return { 
          success: true, 
          message: `Loan status corrected from ${loan.status} to ${correctStatus}` 
        };
      }

      return { success: true, message: 'Loan status is already correct' };
    } catch (error) {
      console.error('Error fixing loan status:', error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Failed to fix loan status' 
      };
    }
  }

  /**
   * Fix all loans with incorrect statuses based on approval levels
   */
  static async fixAllLoanStatuses(): Promise<{ success: boolean; message: string; fixedCount: number }> {
    try {
      // Get all loans that might have incorrect statuses
      const { data: loans, error: loansError } = await supabase
        .from('loan_applications')
        .select(`
          id,
          requested_amount,
          client_type,
          approval_status,
          status,
          committee_review_required,
          approval_level
        `)
        .in('status', ['pending_committee_review', 'approved', 'under_review']);

      if (loansError) {
        return { success: false, message: `Failed to fetch loans: ${loansError.message}`, fixedCount: 0 };
      }

      let fixedCount = 0;
      const results = [];

      for (const loan of loans) {
        const result = await this.fixLoanStatusBasedOnApprovalLevels(loan.id);
        if (result.success && result.message.includes('corrected')) {
          fixedCount++;
        }
        results.push({ loanId: loan.id, ...result });
      }

      return { 
        success: true, 
        message: `Fixed ${fixedCount} out of ${loans.length} loans`, 
        fixedCount 
      };
    } catch (error) {
      console.error('Error fixing all loan statuses:', error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Failed to fix loan statuses', 
        fixedCount: 0 
      };
    }
  }

  /**
   * Record approval history
   */
  private static async recordApprovalHistory(
    loanApplicationId: string,
    action: string,
    userId: string,
    comments: string | undefined,
    approvalLevel: string,
    previousStatus: string,
    newStatus: string
  ): Promise<void> {
    try {
      await supabase
        .from('loan_approval_history')
        .insert({
          loan_application_id: loanApplicationId,
          action: action,
          performed_by: userId,
          comments: comments || null,
          approval_level: approvalLevel,
          previous_status: previousStatus,
          new_status: newStatus
        });
    } catch (error) {
      console.warn('Failed to record approval history:', error);
      // Don't throw error as this is not critical
    }
  }

  /**
   * Create next level assignment if needed
   */
  private static async createNextLevelAssignment(
    loanApplicationId: string,
    userId: string
  ): Promise<void> {
    try {
      // This would determine if there's a next approval level needed
      // For now, we'll skip this as it depends on the specific business logic
      console.log('Next level assignment logic would go here');
    } catch (error) {
      console.warn('Failed to create next level assignment:', error);
    }
  }

  /**
   * Calculate workflow progress percentage
   */
  private static calculateWorkflowProgress(approvalStatus: string, isCommitteeRequired: boolean): number {
    const statusProgress: Record<string, number> = {
      'pending_initial_review': 20,
      'pending_supervisor_approval': 40,
      'pending_manager_approval': 60,
      'pending_committee_review': isCommitteeRequired ? 80 : 100,
      'approved': 100,
      'rejected': 0
    };

    return statusProgress[approvalStatus] || 0;
  }

  /**
   * Check if user can approve (simplified - would need user role context)
   */
  private static canUserApprove(approvalStatus: string, assignment: any): boolean {
    // This is simplified - in reality, you'd check user role and permissions
    return approvalStatus === 'pending_initial_review' || 
           approvalStatus === 'pending_supervisor_approval' ||
           approvalStatus === 'pending_manager_approval' ||
           approvalStatus === 'pending_committee_review';
  }

  /**
   * Check if user can reject (simplified - would need user role context)
   */
  private static canUserReject(approvalStatus: string, assignment: any): boolean {
    // This is simplified - in reality, you'd check user role and permissions
    return approvalStatus !== 'approved' && approvalStatus !== 'rejected';
  }

  /**
   * Get approval assignments for a loan application
   */
  static async getApprovalAssignments(loanApplicationId: string): Promise<ApprovalLevelAssignment[]> {
    try {
      const { data, error } = await supabase
        .from('approval_level_assignments')
        .select(`
          *,
          approval_levels (*)
        `)
        .eq('loan_application_id', loanApplicationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching approval assignments:', error);
      throw error;
    }
  }

  /**
   * Get approval history for a loan application
   */
  static async getApprovalHistory(loanApplicationId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('loan_approval_history')
        .select(`
          *,
          users:performed_by (
            id,
            email
          )
        `)
        .eq('loan_application_id', loanApplicationId)
        .order('performed_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching approval history:', error);
      throw error;
    }
  }
}
