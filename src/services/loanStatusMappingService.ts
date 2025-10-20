/**
 * Loan Status Mapping Service
 * Provides consistent status mapping between loan_applications and loans tables
 */

export interface LoanStatusMapping {
  loanApplicationStatus: string;
  loansTableStatus: string;
  description: string;
  stage: 'application' | 'processing' | 'active' | 'completed' | 'default';
}

export class LoanStatusMappingService {
  // Define the complete status mapping between tables
  static readonly STATUS_MAPPING: LoanStatusMapping[] = [
    // Application Stage
    {
      loanApplicationStatus: 'pending',
      loansTableStatus: 'none',
      description: 'New loan application submitted',
      stage: 'application'
    },
    {
      loanApplicationStatus: 'under_review',
      loansTableStatus: 'none',
      description: 'Loan under credit assessment',
      stage: 'processing'
    },
    {
      loanApplicationStatus: 'pending_committee_review',
      loansTableStatus: 'none',
      description: 'Pending committee approval',
      stage: 'processing'
    },
    {
      loanApplicationStatus: 'approved',
      loansTableStatus: 'none',
      description: 'Loan approved, ready for disbursement',
      stage: 'processing'
    },
    {
      loanApplicationStatus: 'rejected',
      loansTableStatus: 'none',
      description: 'Loan rejected',
      stage: 'completed'
    },
    {
      loanApplicationStatus: 'cancelled',
      loansTableStatus: 'none',
      description: 'Loan cancelled',
      stage: 'completed'
    },
    
    // Active Stage (after disbursement)
    {
      loanApplicationStatus: 'disbursed',
      loansTableStatus: 'active',
      description: 'Loan disbursed and active',
      stage: 'active'
    },
    {
      loanApplicationStatus: 'closed',
      loansTableStatus: 'repaid',
      description: 'Loan fully repaid and closed',
      stage: 'completed'
    },
    
    // Default/Problem Stage
    {
      loanApplicationStatus: 'disbursed',
      loansTableStatus: 'overdue',
      description: 'Active loan with overdue payments',
      stage: 'default'
    },
    {
      loanApplicationStatus: 'disbursed',
      loansTableStatus: 'written_off',
      description: 'Loan written off due to default',
      stage: 'default'
    }
  ];

  /**
   * Get the correct loans table status for a given loan application status
   */
  static getLoansTableStatus(loanApplicationStatus: string): string {
    const mapping = this.STATUS_MAPPING.find(
      m => m.loanApplicationStatus === loanApplicationStatus
    );
    
    if (!mapping) {
      console.warn(`Unknown loan application status: ${loanApplicationStatus}`);
      return 'none';
    }
    
    return mapping.loansTableStatus;
  }

  /**
   * Get the correct loan application status for a given loans table status
   */
  static getLoanApplicationStatus(loansTableStatus: string): string {
    const mapping = this.STATUS_MAPPING.find(
      m => m.loansTableStatus === loansTableStatus
    );
    
    if (!mapping) {
      console.warn(`Unknown loans table status: ${loansTableStatus}`);
      return 'pending';
    }
    
    return mapping.loanApplicationStatus;
  }

  /**
   * Get all valid statuses for loan applications
   */
  static getLoanApplicationStatuses(): string[] {
    return [
      'pending',
      'under_review', 
      'pending_committee_review',
      'approved',
      'rejected',
      'disbursed',
      'closed',
      'cancelled'
    ];
  }

  /**
   * Get all valid statuses for loans table
   */
  static getLoansTableStatuses(): string[] {
    return [
      'active',
      'overdue', 
      'repaid',
      'written_off',
      'none'
    ];
  }

  /**
   * Check if a status is valid for loan applications
   */
  static isValidLoanApplicationStatus(status: string): boolean {
    return this.getLoanApplicationStatuses().includes(status);
  }

  /**
   * Check if a status is valid for loans table
   */
  static isValidLoansTableStatus(status: string): boolean {
    return this.getLoansTableStatuses().includes(status);
  }

  /**
   * Get status description
   */
  static getStatusDescription(loanApplicationStatus: string, loansTableStatus?: string): string {
    const mapping = this.STATUS_MAPPING.find(
      m => m.loanApplicationStatus === loanApplicationStatus && 
           (!loansTableStatus || m.loansTableStatus === loansTableStatus)
    );
    
    return mapping?.description || 'Unknown status';
  }

  /**
   * Get stage for a status combination
   */
  static getStage(loanApplicationStatus: string, loansTableStatus?: string): string {
    const mapping = this.STATUS_MAPPING.find(
      m => m.loanApplicationStatus === loanApplicationStatus && 
           (!loansTableStatus || m.loansTableStatus === loansTableStatus)
    );
    
    return mapping?.stage || 'application';
  }

  /**
   * Get all statuses that should appear in loan monitoring (active loans)
   */
  static getActiveLoanStatuses(): { loanApplication: string[], loans: string[] } {
    return {
      loanApplication: ['disbursed'],
      loans: ['active', 'overdue']
    };
  }

  /**
   * Get all statuses that should appear in loan restructuring
   */
  static getRestructuringLoanStatuses(): { loanApplication: string[], loans: string[] } {
    return {
      loanApplication: ['disbursed'],
      loans: ['active', 'overdue']
    };
  }

  /**
   * Get all statuses that should appear in loan closure
   */
  static getClosureLoanStatuses(): { loanApplication: string[], loans: string[] } {
    return {
      loanApplication: ['disbursed', 'closed'],
      loans: ['active', 'overdue', 'repaid']
    };
  }
}
