// Loan Workflow State Machine
// Manages the complete loan processing workflow with proper state transitions

export interface LoanWorkflowState {
  id: string;
  status: LoanStatus;
  contractStatus: ContractStatus;
  approvalLevel: ApprovalLevel;
  committeeRequired: boolean;
  canApprove: boolean;
  canForwardToCommittee: boolean;
  canGenerateContract: boolean;
  canUploadContract: boolean;
  canMoveToDisbursement: boolean;
  nextSteps: string[];
  uiIndicators: {
    creditAssessment: 'completed' | 'in_progress' | 'locked' | 'error';
    contractGeneration: 'completed' | 'in_progress' | 'locked' | 'error';
    contractUpload: 'completed' | 'in_progress' | 'locked' | 'error';
    disbursement: 'completed' | 'in_progress' | 'locked' | 'error';
  };
}

export type LoanStatus = 
  | 'submitted'
  | 'under_review'
  | 'pending_assessment'
  | 'assessment_complete'
  | 'pending_committee_review'
  | 'pending_committee_approval'
  | 'committee_approved'
  | 'approved'
  | 'contract_generated'
  | 'contract_uploaded'
  | 'contract_signed'
  | 'ready_for_disbursement'
  | 'disbursed'
  | 'rejected'
  | 'archived';

export type ContractStatus = 
  | 'not_generated'
  | 'generated'
  | 'uploaded'
  | 'signed'
  | 'verified';

export interface ApprovalLevel {
  id: string;
  name: string;
  maxAmount: number;
  authority: 'MANAGER' | 'DIRECTOR' | 'CEO' | 'COMMITTEE';
  committeeRequired: boolean;
}

export class LoanWorkflowStateMachine {
  private static instance: LoanWorkflowStateMachine;
  
  public static getInstance(): LoanWorkflowStateMachine {
    if (!LoanWorkflowStateMachine.instance) {
      LoanWorkflowStateMachine.instance = new LoanWorkflowStateMachine();
    }
    return LoanWorkflowStateMachine.instance;
  }

  /**
   * Calculate the current workflow state for a loan
   */
  public calculateWorkflowState(
    loan: any,
    approvalLevels: ApprovalLevel[],
    generatedContracts: Set<string>
  ): LoanWorkflowState {
    const currentApprovalLevel = this.getApprovalLevel(loan, approvalLevels);
    const committeeRequired = this.isCommitteeRequired(loan, currentApprovalLevel);
    
    // Enhanced contract status detection
    const isContractGenerated = generatedContracts.has(loan.id) || 
                               loan.contract_status === 'generated' ||
                               loan.contract_status === 'created' ||
                               loan.contract_status === 'draft';
    
    console.log('🔍 Workflow State Calculation:', {
      loanId: loan.id,
      loanStatus: loan.status,
      contractStatus: loan.contract_status,
      isContractGenerated,
      generatedContracts: Array.from(generatedContracts),
      canUploadContract: this.canUploadContract(loan, isContractGenerated)
    });
    
    return {
      id: loan.id,
      status: loan.status,
      contractStatus: isContractGenerated ? 'generated' : (loan.contract_status || 'not_generated'),
      approvalLevel: currentApprovalLevel,
      committeeRequired,
      canApprove: this.canApproveLoan(loan, currentApprovalLevel, committeeRequired),
      canForwardToCommittee: this.canForwardToCommittee(loan, committeeRequired),
      canGenerateContract: this.canGenerateContract(loan, isContractGenerated),
      canUploadContract: this.canUploadContract(loan, isContractGenerated),
      canMoveToDisbursement: this.canMoveToDisbursement(loan),
      nextSteps: this.getNextSteps(loan, currentApprovalLevel, committeeRequired, isContractGenerated),
      uiIndicators: this.calculateUIIndicators(loan, isContractGenerated)
    };
  }

  /**
   * Get the appropriate approval level for a loan
   */
  private getApprovalLevel(loan: any, approvalLevels: ApprovalLevel[]): ApprovalLevel {
    const loanAmount = parseFloat(loan.requested_amount) || 0;
    
    // Find the appropriate approval level based on loan amount
    const sortedLevels = approvalLevels.sort((a, b) => a.maxAmount - b.maxAmount);
    const appropriateLevel = sortedLevels.find(level => loanAmount <= level.maxAmount) || sortedLevels[sortedLevels.length - 1];
    
    return appropriateLevel;
  }

  /**
   * Check if committee approval is required
   */
  private isCommitteeRequired(loan: any, approvalLevel: ApprovalLevel): boolean {
    // Committee required if:
    // 1. Approval level requires committee
    // 2. Loan amount exceeds certain threshold
    // 3. Risk score is high
    const loanAmount = parseFloat(loan.requested_amount) || 0;
    const riskScore = loan.assessment_score || 0;
    
    return approvalLevel.committeeRequired || 
           loanAmount > 5000000 || // 5M threshold
           riskScore < 600; // High risk threshold
  }

  /**
   * Check if loan can be approved directly
   */
  private canApproveLoan(loan: any, approvalLevel: ApprovalLevel, committeeRequired: boolean): boolean {
    if (loan.status !== 'pending_assessment' && loan.status !== 'assessment_complete') {
      return false;
    }
    
    if (committeeRequired) {
      return false; // Must go to committee
    }
    
    // Check if user has authority to approve at this level
    return approvalLevel.authority !== 'COMMITTEE';
  }

  /**
   * Check if loan can be forwarded to committee
   */
  private canForwardToCommittee(loan: any, committeeRequired: boolean): boolean {
    if (loan.status !== 'pending_assessment' && loan.status !== 'assessment_complete') {
      return false;
    }
    
    return committeeRequired || loan.status === 'assessment_complete';
  }

  /**
   * Check if contract can be generated
   */
  private canGenerateContract(loan: any, isContractGenerated: boolean): boolean {
    if (isContractGenerated) {
      return false; // Already generated
    }
    
    return loan.status === 'approved' || loan.status === 'committee_approved';
  }

  /**
   * Check if contract can be uploaded
   */
  private canUploadContract(loan: any, isContractGenerated: boolean): boolean {
    console.log('🔍 canUploadContract check:', {
      loanId: loan.id,
      isContractGenerated,
      loanStatus: loan.status,
      contractStatus: loan.contract_status
    });
    
    // Allow upload if contract is generated OR if loan is approved (we can create contract on demand)
    const canUpload = isContractGenerated || 
                     loan.status === 'approved' || 
                     loan.status === 'committee_approved' || 
                     loan.status === 'contract_generated';
    
    console.log('✅ canUploadContract result:', canUpload);
    return canUpload;
  }

  /**
   * Check if loan can move to disbursement
   */
  private canMoveToDisbursement(loan: any): boolean {
    return loan.status === 'contract_signed' || loan.status === 'contract_uploaded';
  }

  /**
   * Get next possible steps for the loan
   */
  private getNextSteps(loan: any, approvalLevel: ApprovalLevel, committeeRequired: boolean, isContractGenerated: boolean): string[] {
    const steps: string[] = [];
    
    if (this.canApproveLoan(loan, approvalLevel, committeeRequired)) {
      steps.push('Approve Loan');
    }
    
    if (this.canForwardToCommittee(loan, committeeRequired)) {
      steps.push('Forward to Committee');
    }
    
    if (this.canGenerateContract(loan, isContractGenerated)) {
      steps.push('Generate Contract');
    }
    
    if (this.canUploadContract(loan, isContractGenerated)) {
      steps.push('Upload Contract');
    }
    
    if (this.canMoveToDisbursement(loan)) {
      steps.push('Move to Disbursement');
    }
    
    return steps;
  }

  /**
   * Calculate UI indicators for each step
   */
  private calculateUIIndicators(loan: any, isContractGenerated: boolean): LoanWorkflowState['uiIndicators'] {
    return {
      creditAssessment: this.getCreditAssessmentIndicator(loan),
      contractGeneration: this.getContractGenerationIndicator(loan, isContractGenerated),
      contractUpload: this.getContractUploadIndicator(loan, isContractGenerated),
      disbursement: this.getDisbursementIndicator(loan)
    };
  }

  private getCreditAssessmentIndicator(loan: any): 'completed' | 'in_progress' | 'locked' | 'error' {
    if (loan.status === 'rejected') return 'error';
    if (['approved', 'committee_approved', 'contract_generated', 'contract_uploaded', 'contract_signed', 'ready_for_disbursement', 'disbursed'].includes(loan.status)) {
      return 'completed';
    }
    if (['pending_assessment', 'assessment_complete', 'pending_committee_review', 'pending_committee_approval'].includes(loan.status)) {
      return 'in_progress';
    }
    return 'locked';
  }

  private getContractGenerationIndicator(loan: any, isContractGenerated: boolean): 'completed' | 'in_progress' | 'locked' | 'error' {
    if (isContractGenerated || ['contract_uploaded', 'contract_signed', 'ready_for_disbursement', 'disbursed'].includes(loan.status)) {
      return 'completed';
    }
    if (['approved', 'committee_approved'].includes(loan.status)) {
      return 'in_progress';
    }
    return 'locked';
  }

  private getContractUploadIndicator(loan: any, isContractGenerated: boolean): 'completed' | 'in_progress' | 'locked' | 'error' {
    if (['contract_uploaded', 'contract_signed', 'ready_for_disbursement', 'disbursed'].includes(loan.status)) {
      return 'completed';
    }
    if (isContractGenerated && ['approved', 'committee_approved', 'contract_generated'].includes(loan.status)) {
      return 'in_progress';
    }
    return 'locked';
  }

  private getDisbursementIndicator(loan: any): 'completed' | 'in_progress' | 'locked' | 'error' {
    if (loan.status === 'disbursed') return 'completed';
    if (['contract_signed', 'ready_for_disbursement'].includes(loan.status)) {
      return 'in_progress';
    }
    return 'locked';
  }

  /**
   * Execute a workflow action
   */
  public async executeAction(
    action: 'approve' | 'forward_to_committee' | 'reject' | 'generate_contract' | 'upload_contract' | 'move_to_disbursement',
    loanId: string,
    userId: string,
    additionalData?: any
  ): Promise<{ success: boolean; newStatus: LoanStatus; message: string }> {
    try {
      switch (action) {
        case 'approve':
          return await this.approveLoan(loanId, userId, additionalData);
        case 'forward_to_committee':
          return await this.forwardToCommittee(loanId, userId, additionalData);
        case 'reject':
          return await this.rejectLoan(loanId, userId, additionalData);
        case 'generate_contract':
          return await this.generateContract(loanId, userId, additionalData);
        case 'upload_contract':
          return await this.uploadContract(loanId, userId, additionalData);
        case 'move_to_disbursement':
          return await this.moveToDisbursement(loanId, userId, additionalData);
        default:
          return { success: false, newStatus: 'submitted', message: 'Invalid action' };
      }
    } catch (error) {
      console.error('Error executing workflow action:', error);
      return { 
        success: false, 
        newStatus: 'submitted', 
        message: `Failed to execute ${action}: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  private async approveLoan(loanId: string, userId: string, additionalData?: any): Promise<{ success: boolean; newStatus: LoanStatus; message: string }> {
    // Implementation would update database
    return { success: true, newStatus: 'approved', message: 'Loan approved successfully' };
  }

  private async forwardToCommittee(loanId: string, userId: string, additionalData?: any): Promise<{ success: boolean; newStatus: LoanStatus; message: string }> {
    // Implementation would update database
    return { success: true, newStatus: 'pending_committee_approval', message: 'Loan forwarded to committee for review' };
  }

  private async rejectLoan(loanId: string, userId: string, additionalData?: any): Promise<{ success: boolean; newStatus: LoanStatus; message: string }> {
    // Implementation would update database
    return { success: true, newStatus: 'rejected', message: 'Loan rejected' };
  }

  private async generateContract(loanId: string, userId: string, additionalData?: any): Promise<{ success: boolean; newStatus: LoanStatus; message: string }> {
    try {
      console.log('🔧 State machine - generateContract called for loan:', loanId, 'user:', userId);
      
      // Import ContractService dynamically to avoid circular dependencies
      const { ContractService } = await import('./contractService');
      console.log('✅ ContractService imported successfully');
      
      // Get loan application data to extract required fields
      const { supabase } = await import('../lib/supabaseClient');
      const { data: loanData, error: loanError } = await supabase
        .from('loan_applications')
        .select('*')
        .eq('id', loanId)
        .single();
      
      if (loanError || !loanData) {
        console.error('❌ Error fetching loan data:', loanError);
        return { success: false, newStatus: 'approved', message: 'Failed to fetch loan data' };
      }
      
      console.log('📋 Loan data fetched:', loanData);
      
      // Calculate loan terms (you can adjust these calculations based on your business logic)
      const loanAmount = parseFloat(loanData.requested_amount) || 0;
      const interestRate = 0.15; // 15% annual interest rate
      const managementFeeRate = 0.02; // 2% management fee
      const repaymentPeriodMonths = 12; // 12 months default
      const totalInterest = loanAmount * interestRate;
      const totalManagementFee = loanAmount * managementFeeRate;
      const totalRepaymentAmount = loanAmount + totalInterest + totalManagementFee;
      const monthlyPayment = totalRepaymentAmount / repaymentPeriodMonths;
      
      // Create contract record in the database with all required fields
      const contractData = {
        loan_application_id: loanId,
        client_id: loanData.client_id,
        status: 'generated' as const,
        contract_type: 'loan_agreement',
        loan_amount: loanAmount,
        interest_rate: interestRate,
        management_fee_rate: managementFeeRate,
        repayment_period_months: repaymentPeriodMonths,
        total_repayment_amount: totalRepaymentAmount,
        monthly_payment: monthlyPayment,
        created_by_user_id: userId,
        updated_by_user_id: userId
      };
      
      console.log('🔧 Creating contract with data:', contractData);
      const newContract = await ContractService.createContract(contractData);
      console.log('✅ Contract record created in database via state machine:', newContract);
      
      return { success: true, newStatus: 'contract_generated', message: 'Contract generated successfully' };
    } catch (error) {
      console.error('❌ Error creating contract record in state machine:', error);
      return { success: false, newStatus: 'approved', message: 'Failed to create contract record' };
    }
  }

  private async uploadContract(loanId: string, userId: string, additionalData?: any): Promise<{ success: boolean; newStatus: LoanStatus; message: string }> {
    // Implementation would update database
    return { success: true, newStatus: 'contract_signed', message: 'Contract uploaded successfully' };
  }

  private async moveToDisbursement(loanId: string, userId: string, additionalData?: any): Promise<{ success: boolean; newStatus: LoanStatus; message: string }> {
    // Implementation would update database
    return { success: true, newStatus: 'ready_for_disbursement', message: 'Loan moved to disbursement queue' };
  }
}

export default LoanWorkflowStateMachine;

