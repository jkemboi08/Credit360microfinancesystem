/**
 * Utility to update all hardcoded dates to dynamic dates
 * This script helps ensure all dates are current and dynamic
 */

import { DateUtils } from './dateUtils';
import { DynamicDataService } from '../services/dynamicDataService';

export class UpdateDynamicDates {
  /**
   * Update all hardcoded dates in mock data
   */
  static updateMockData() {
    return {
      // Current date references
      currentDate: DateUtils.getCurrentDateString(),
      currentDateTime: DateUtils.getCurrentISODate(),
      currentTimestamp: DateUtils.getCurrentTimestamp(),
      
      // Relative dates
      yesterday: DateUtils.addDaysToCurrent(-1).split('T')[0],
      lastWeek: DateUtils.addDaysToCurrent(-7).split('T')[0],
      lastMonth: DateUtils.addMonthsToCurrent(-1).split('T')[0],
      lastQuarter: DateUtils.addMonthsToCurrent(-3).split('T')[0],
      lastYear: DateUtils.addYearsToCurrent(-1).split('T')[0],
      
      // Future dates
      tomorrow: DateUtils.addDaysToCurrent(1).split('T')[0],
      nextWeek: DateUtils.addDaysToCurrent(7).split('T')[0],
      nextMonth: DateUtils.addMonthsToCurrent(1).split('T')[0],
      nextQuarter: DateUtils.addMonthsToCurrent(3).split('T')[0],
      nextYear: DateUtils.addYearsToCurrent(1).split('T')[0],
      
      // Period boundaries
      startOfMonth: DateUtils.getStartOfCurrentMonth().split('T')[0],
      endOfMonth: DateUtils.getEndOfCurrentMonth().split('T')[0],
      startOfQuarter: DateUtils.getCurrentQuarterStart().split('T')[0],
      endOfQuarter: DateUtils.getCurrentQuarterEnd().split('T')[0],
      startOfYear: DateUtils.getStartOfCurrentYear().split('T')[0],
      endOfYear: DateUtils.getEndOfCurrentYear().split('T')[0],
      
      // Fiscal year
      fiscalYearStart: DateUtils.getFiscalYearStart().split('T')[0],
      fiscalYearEnd: DateUtils.getFiscalYearEnd().split('T')[0],
      
      // Current period info
      currentQuarter: DateUtils.getCurrentQuarter(),
      currentYear: new Date().getFullYear(),
      currentMonth: new Date().getMonth() + 1,
      currentDay: new Date().getDate()
    };
  }

  /**
   * Generate dynamic report metadata
   */
  static generateReportMetadata() {
    return {
      generatedAt: DateUtils.getCurrentISODate(),
      generatedBy: 'System',
      reportDate: DateUtils.getCurrentDateString(),
      reportTime: DateUtils.getCurrentTime(),
      reportTimestamp: DateUtils.getReportTimestamp(),
      quarter: DateUtils.getCurrentQuarter(),
      year: new Date().getFullYear(),
      period: {
        start: DateUtils.getCurrentQuarterStart(),
        end: DateUtils.getCurrentQuarterEnd()
      },
      fiscalYear: {
        start: DateUtils.getFiscalYearStart(),
        end: DateUtils.getFiscalYearEnd()
      }
    };
  }

  /**
   * Update transaction data with current timestamps
   */
  static updateTransactionData(transaction: any) {
    return {
      ...transaction,
      created_at: DateUtils.getCurrentISODate(),
      updated_at: DateUtils.getCurrentISODate(),
      transaction_date: DateUtils.getCurrentISODate(),
      processed_at: DateUtils.getCurrentISODate()
    };
  }

  /**
   * Update loan data with current timestamps
   */
  static updateLoanData(loan: any) {
    return {
      ...loan,
      created_at: DateUtils.getCurrentISODate(),
      updated_at: DateUtils.getCurrentISODate(),
      last_updated: DateUtils.getCurrentISODate(),
      last_contact: DateUtils.addDaysToCurrent(-1).split('T')[0]
    };
  }

  /**
   * Update client data with current timestamps
   */
  static updateClientData(client: any) {
    return {
      ...client,
      created_at: DateUtils.getCurrentISODate(),
      updated_at: DateUtils.getCurrentISODate(),
      last_login: DateUtils.addDaysToCurrent(-1),
      last_activity: DateUtils.addDaysToCurrent(-2).split('T')[0]
    };
  }

  /**
   * Generate dynamic audit trail
   */
  static generateAuditTrail(action: string, entity: string, details: any = {}) {
    return {
      id: DateUtils.generateTimestampId(),
      action,
      entity,
      details,
      timestamp: DateUtils.getCurrentISODate(),
      user_id: 'system',
      ip_address: '127.0.0.1',
      user_agent: navigator.userAgent,
      created_at: DateUtils.getCurrentISODate()
    };
  }

  /**
   * Update all dates in a data object
   */
  static updateAllDates(data: any): any {
    if (typeof data !== 'object' || data === null) {
      return data;
    }

    if (Array.isArray(data)) {
      return data.map(item => this.updateAllDates(item));
    }

    const updated: any = {};
    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'string' && this.isDateString(value)) {
        // Replace hardcoded dates with dynamic ones
        updated[key] = this.getDynamicDateReplacement(value);
      } else if (typeof value === 'object' && value !== null) {
        updated[key] = this.updateAllDates(value);
      } else {
        updated[key] = value;
      }
    }

    return updated;
  }

  /**
   * Check if a string looks like a date
   */
  private static isDateString(str: string): boolean {
    return /^\d{4}-\d{2}-\d{2}$/.test(str) || 
           /^\d{4}-\d{2}-\d{2}T/.test(str) ||
           /^\d{2}\/\d{2}\/\d{4}$/.test(str);
  }

  /**
   * Get dynamic date replacement for a hardcoded date
   */
  private static getDynamicDateReplacement(dateStr: string): string {
    // This is a simplified replacement logic
    // In a real implementation, you'd analyze the context to determine the appropriate dynamic date
    
    if (dateStr.includes('2024-') || dateStr.includes('2025-')) {
      // Replace with current date
      return DateUtils.getCurrentDateString();
    }
    
    return dateStr;
  }

  /**
   * Ensure all new data uses dynamic dates
   */
  static ensureDynamicDates(data: any): any {
    return {
      ...data,
      created_at: DateUtils.getCurrentISODate(),
      updated_at: DateUtils.getCurrentISODate(),
      last_updated: DateUtils.getCurrentISODate()
    };
  }
}

export default UpdateDynamicDates;



