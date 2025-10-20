/**
 * Loan Closure Data Validation Service
 * Ensures data integrity and provides validation for loan closure operations
 */

import { LoanClosureData } from './loanClosureDataService';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export class LoanClosureValidationService {
  /**
   * Validate loan closure data integrity
   */
  static validateLoanData(loan: LoanClosureData): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required field validations
    if (!loan.id || loan.id.trim() === '') {
      errors.push('Loan ID is required');
    }

    if (!loan.clientName || loan.clientName.trim() === '') {
      errors.push('Client name is required');
    }

    if (!loan.clientId || loan.clientId.trim() === '') {
      errors.push('Client ID is required');
    }

    // Financial validations
    if (loan.originalAmount <= 0) {
      errors.push('Original amount must be greater than 0');
    }

    if (loan.currentBalance < 0) {
      errors.push('Current balance cannot be negative');
    }

    if (loan.currentBalance > loan.originalAmount) {
      warnings.push('Current balance exceeds original amount - this may indicate data inconsistency');
    }

    if (loan.totalPaid < 0) {
      errors.push('Total paid amount cannot be negative');
    }

    if (loan.totalInterest < 0) {
      errors.push('Total interest cannot be negative');
    }

    if (loan.interestRate < 0 || loan.interestRate > 100) {
      warnings.push('Interest rate seems unusual - please verify');
    }

    if (loan.tenor <= 0) {
      warnings.push('Loan tenor should be greater than 0');
    }

    // Status validations
    const validStatuses = ['active', 'ready_for_closure', 'closed', 'default'];
    if (!validStatuses.includes(loan.status)) {
      errors.push(`Invalid loan status: ${loan.status}`);
    }

    // Business logic validations
    if (loan.status === 'closed' && !loan.closureDate) {
      warnings.push('Closed loan should have a closure date');
    }

    if (loan.status === 'ready_for_closure' && loan.currentBalance > loan.originalAmount * 0.1) {
      warnings.push('Loan marked as ready for closure but balance is more than 10% of original amount');
    }

    // Date validations
    if (loan.lastPaymentDate && loan.nextPaymentDate) {
      const lastPayment = new Date(loan.lastPaymentDate);
      const nextPayment = new Date(loan.nextPaymentDate);
      
      if (lastPayment > nextPayment) {
        warnings.push('Last payment date is after next payment date - please verify');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate multiple loans
   */
  static validateLoanArray(loans: LoanClosureData[]): ValidationResult {
    const allErrors: string[] = [];
    const allWarnings: string[] = [];

    loans.forEach((loan, index) => {
      const validation = this.validateLoanData(loan);
      
      if (validation.errors.length > 0) {
        allErrors.push(`Loan ${index + 1} (${loan.id}): ${validation.errors.join(', ')}`);
      }
      
      if (validation.warnings.length > 0) {
        allWarnings.push(`Loan ${index + 1} (${loan.id}): ${validation.warnings.join(', ')}`);
      }
    });

    return {
      isValid: allErrors.length === 0,
      errors: allErrors,
      warnings: allWarnings
    };
  }

  /**
   * Sanitize and fix common data issues
   */
  static sanitizeLoanData(loan: LoanClosureData): LoanClosureData {
    const sanitized = { ...loan };

    // Sanitize strings
    sanitized.clientName = sanitized.clientName?.trim() || 'Unknown Client';
    sanitized.clientId = sanitized.clientId?.trim() || 'unknown';
    sanitized.phone = sanitized.phone?.trim() || 'N/A';
    sanitized.closureReason = sanitized.closureReason?.trim() || '';

    // Ensure numeric values are valid
    sanitized.originalAmount = Math.max(0, sanitized.originalAmount || 0);
    sanitized.currentBalance = Math.max(0, sanitized.currentBalance || 0);
    sanitized.totalPaid = Math.max(0, sanitized.totalPaid || 0);
    sanitized.totalInterest = Math.max(0, sanitized.totalInterest || 0);
    sanitized.interestRate = Math.max(0, Math.min(100, sanitized.interestRate || 0));
    sanitized.tenor = Math.max(1, sanitized.tenor || 1);
    sanitized.monthlyPayment = Math.max(0, sanitized.monthlyPayment || 0);

    // Ensure status is valid
    const validStatuses = ['active', 'ready_for_closure', 'closed', 'default'];
    if (!validStatuses.includes(sanitized.status)) {
      sanitized.status = 'active';
    }

    // Fix date strings
    sanitized.lastPaymentDate = sanitized.lastPaymentDate || '';
    sanitized.nextPaymentDate = sanitized.nextPaymentDate || '';

    return sanitized;
  }

  /**
   * Check if loan is ready for closure based on business rules
   */
  static isReadyForClosure(loan: LoanClosureData): boolean {
    // Business rule: Ready for closure if 90% or more is paid
    const paymentPercentage = loan.originalAmount > 0 ? 
      (loan.totalPaid / loan.originalAmount) * 100 : 0;
    
    return paymentPercentage >= 90;
  }

  /**
   * Calculate closure metrics safely
   */
  static calculateClosureMetrics(loans: LoanClosureData[]): {
    activeLoans: number;
    readyForClosure: number;
    closedThisMonth: number;
    totalRecovered: number;
  } {
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();

    return {
      activeLoans: loans.filter(l => l.status === 'active').length,
      readyForClosure: loans.filter(l => this.isReadyForClosure(l)).length,
      closedThisMonth: loans.filter(l => {
        if (l.status !== 'closed' || !l.closureDate) return false;
        const closureDate = new Date(l.closureDate);
        return closureDate.getMonth() === thisMonth && closureDate.getFullYear() === thisYear;
      }).length,
      totalRecovered: loans
        .filter(l => l.status === 'closed')
        .reduce((sum, l) => sum + l.totalPaid, 0)
    };
  }
}

export default LoanClosureValidationService;




