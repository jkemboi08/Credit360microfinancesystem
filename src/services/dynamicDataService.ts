/**
 * Dynamic Data Service
 * Provides methods to generate dynamic data with current dates and times
 */

import { DateUtils } from '../utils/dateUtils';

export class DynamicDataService {
  /**
   * Generate dynamic client data with current timestamps
   */
  static generateClientData(overrides: any = {}) {
    return {
      created_at: DateUtils.getCurrentISODate(),
      updated_at: DateUtils.getCurrentISODate(),
      last_login: DateUtils.addDaysToCurrent(-1),
      kyc_verification_date: DateUtils.addDaysToCurrent(-30),
      last_activity: DateUtils.addDaysToCurrent(-2),
      ...overrides
    };
  }

  /**
   * Generate dynamic loan data with current timestamps
   */
  static generateLoanData(overrides: any = {}) {
    const disbursementDate = DateUtils.addMonthsToCurrent(-3);
    const maturityDate = DateUtils.addMonthsToCurrent(9);
    
    return {
      created_at: DateUtils.getCurrentISODate(),
      updated_at: DateUtils.getCurrentISODate(),
      disbursement_date: disbursementDate.split('T')[0],
      maturity_date: maturityDate.split('T')[0],
      next_payment_date: DateUtils.addDaysToCurrent(30).split('T')[0],
      last_payment_date: DateUtils.addDaysToCurrent(-30).split('T')[0],
      last_contact_date: DateUtils.addDaysToCurrent(-5).split('T')[0],
      disbursement_date_enhanced: new Date(disbursementDate),
      last_provision_date: new Date(disbursementDate),
      ...overrides
    };
  }

  /**
   * Generate dynamic transaction data with current timestamps
   */
  static generateTransactionData(overrides: any = {}) {
    return {
      created_at: DateUtils.getCurrentISODate(),
      updated_at: DateUtils.getCurrentISODate(),
      transaction_date: DateUtils.getCurrentISODate(),
      processed_at: DateUtils.getCurrentISODate(),
      ...overrides
    };
  }

  /**
   * Generate dynamic repayment schedule
   */
  static generateRepaymentSchedule(loanAmount: number, termMonths: number, interestRate: number) {
    const monthlyPayment = loanAmount * (interestRate / 100 / 12) / (1 - Math.pow(1 + interestRate / 100 / 12, -termMonths));
    const schedule = [];
    
    for (let i = 0; i < termMonths; i++) {
      schedule.push({
        id: `payment_${i + 1}`,
        due_date: DateUtils.addMonthsToCurrent(i + 1).split('T')[0],
        amount: Math.round(monthlyPayment),
        status: i === 0 ? 'pending' : 'upcoming',
        created_at: DateUtils.getCurrentISODate()
      });
    }
    
    return schedule;
  }

  /**
   * Generate dynamic report data with current timestamps
   */
  static generateReportData(overrides: any = {}) {
    return {
      generated_at: DateUtils.getCurrentISODate(),
      report_date: DateUtils.getCurrentDateString(),
      quarter: DateUtils.getCurrentQuarter(),
      quarter_start: DateUtils.getCurrentQuarterStart(),
      quarter_end: DateUtils.getCurrentQuarterEnd(),
      fiscal_year_start: DateUtils.getFiscalYearStart(),
      fiscal_year_end: DateUtils.getFiscalYearEnd(),
      ...overrides
    };
  }

  /**
   * Generate dynamic audit log entry
   */
  static generateAuditLog(action: string, entity: string, details: any = {}) {
    return {
      id: DateUtils.generateTimestampId(),
      action,
      entity,
      details,
      timestamp: DateUtils.getCurrentISODate(),
      user_id: 'current_user',
      ip_address: '127.0.0.1',
      user_agent: navigator.userAgent,
      created_at: DateUtils.getCurrentISODate()
    };
  }

  /**
   * Generate dynamic notification data
   */
  static generateNotificationData(overrides: any = {}) {
    return {
      id: DateUtils.generateTimestampId(),
      created_at: DateUtils.getCurrentISODate(),
      scheduled_at: DateUtils.getCurrentISODate(),
      sent_at: null,
      delivered_at: null,
      read_at: null,
      ...overrides
    };
  }

  /**
   * Generate dynamic savings account data
   */
  static generateSavingsAccountData(overrides: any = {}) {
    return {
      created_at: DateUtils.getCurrentISODate(),
      updated_at: DateUtils.getCurrentISODate(),
      last_updated: DateUtils.getCurrentISODate(),
      last_activity: DateUtils.addDaysToCurrent(-2).split('T')[0],
      last_interest_posting: DateUtils.getEndOfCurrentMonth().split('T')[0],
      next_interest_posting: DateUtils.addMonthsToCurrent(1).split('T')[0],
      account_opened: DateUtils.addMonthsToCurrent(-12).split('T')[0],
      ...overrides
    };
  }

  /**
   * Generate dynamic compliance data
   */
  static generateComplianceData(overrides: any = {}) {
    return {
      created_at: DateUtils.getCurrentISODate(),
      updated_at: DateUtils.getCurrentISODate(),
      review_date: DateUtils.getCurrentDateString(),
      next_review_date: DateUtils.addMonthsToCurrent(6).split('T')[0],
      compliance_period_start: DateUtils.getStartOfCurrentYear(),
      compliance_period_end: DateUtils.getEndOfCurrentYear(),
      ...overrides
    };
  }

  /**
   * Generate dynamic analytics data
   */
  static generateAnalyticsData(overrides: any = {}) {
    return {
      generated_at: DateUtils.getCurrentISODate(),
      period_start: DateUtils.getStartOfCurrentMonth(),
      period_end: DateUtils.getEndOfCurrentMonth(),
      quarter: DateUtils.getCurrentQuarter(),
      year: new Date().getFullYear(),
      ...overrides
    };
  }

  /**
   * Update existing data with current timestamps
   */
  static updateTimestamps(data: any) {
    return {
      ...data,
      updated_at: DateUtils.getCurrentISODate(),
      last_modified: DateUtils.getCurrentISODate()
    };
  }

  /**
   * Generate dynamic ID with timestamp
   */
  static generateId(prefix: string = 'ID'): string {
    return `${prefix}_${DateUtils.generateTimestampId()}`;
  }

  /**
   * Generate dynamic reference number
   */
  static generateReference(prefix: string = 'REF'): string {
    const timestamp = DateUtils.getCurrentTimestamp();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${prefix}${timestamp}${random}`;
  }
}



