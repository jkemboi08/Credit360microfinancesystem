/**
 * Date and Time Utilities
 * Provides consistent date/time handling across the application
 */

export class DateUtils {
  /**
   * Get current date in ISO string format
   */
  static getCurrentISODate(): string {
    return new Date().toISOString();
  }

  /**
   * Get current date in YYYY-MM-DD format
   */
  static getCurrentDateString(): string {
    return new Date().toISOString().split('T')[0];
  }

  /**
   * Get current date in DD/MM/YYYY format
   */
  static getCurrentDateFormatted(): string {
    return new Date().toLocaleDateString('en-GB');
  }

  /**
   * Get current timestamp
   */
  static getCurrentTimestamp(): number {
    return Date.now();
  }

  /**
   * Get current date object
   */
  static getCurrentDate(): Date {
    return new Date();
  }

  /**
   * Format date for display
   */
  static formatDate(date: Date | string, format: 'short' | 'long' | 'time' = 'short'): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    switch (format) {
      case 'short':
        return dateObj.toLocaleDateString('en-GB');
      case 'long':
        return dateObj.toLocaleDateString('en-GB', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      case 'time':
        return dateObj.toLocaleString('en-GB');
      default:
        return dateObj.toLocaleDateString('en-GB');
    }
  }

  /**
   * Add days to current date
   */
  static addDaysToCurrent(days: number): string {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString();
  }

  /**
   * Add months to current date
   */
  static addMonthsToCurrent(months: number): string {
    const date = new Date();
    date.setMonth(date.getMonth() + months);
    return date.toISOString();
  }

  /**
   * Add years to current date
   */
  static addYearsToCurrent(years: number): string {
    const date = new Date();
    date.setFullYear(date.getFullYear() + years);
    return date.toISOString();
  }

  /**
   * Get start of current month
   */
  static getStartOfCurrentMonth(): string {
    const date = new Date();
    date.setDate(1);
    date.setHours(0, 0, 0, 0);
    return date.toISOString();
  }

  /**
   * Get end of current month
   */
  static getEndOfCurrentMonth(): string {
    const date = new Date();
    date.setMonth(date.getMonth() + 1);
    date.setDate(0);
    date.setHours(23, 59, 59, 999);
    return date.toISOString();
  }

  /**
   * Get start of current year
   */
  static getStartOfCurrentYear(): string {
    const date = new Date();
    date.setMonth(0);
    date.setDate(1);
    date.setHours(0, 0, 0, 0);
    return date.toISOString();
  }

  /**
   * Get end of current year
   */
  static getEndOfCurrentYear(): string {
    const date = new Date();
    date.setMonth(11);
    date.setDate(31);
    date.setHours(23, 59, 59, 999);
    return date.toISOString();
  }

  /**
   * Get current quarter
   */
  static getCurrentQuarter(): number {
    const month = new Date().getMonth();
    return Math.floor(month / 3) + 1;
  }

  /**
   * Get current quarter start date
   */
  static getCurrentQuarterStart(): string {
    const date = new Date();
    const quarter = this.getCurrentQuarter();
    const startMonth = (quarter - 1) * 3;
    date.setMonth(startMonth);
    date.setDate(1);
    date.setHours(0, 0, 0, 0);
    return date.toISOString();
  }

  /**
   * Get current quarter end date
   */
  static getCurrentQuarterEnd(): string {
    const date = new Date();
    const quarter = this.getCurrentQuarter();
    const endMonth = quarter * 3 - 1;
    date.setMonth(endMonth);
    date.setDate(0);
    date.setHours(23, 59, 59, 999);
    return date.toISOString();
  }

  /**
   * Get relative date (e.g., "2 days ago", "next week")
   */
  static getRelativeDate(date: Date | string): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffInMs = now.getTime() - dateObj.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays === -1) return 'Tomorrow';
    if (diffInDays > 0) return `${diffInDays} days ago`;
    if (diffInDays < 0) return `In ${Math.abs(diffInDays)} days`;
    
    return this.formatDate(dateObj);
  }

  /**
   * Check if date is today
   */
  static isToday(date: Date | string): boolean {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const today = new Date();
    return dateObj.toDateString() === today.toDateString();
  }

  /**
   * Check if date is in the past
   */
  static isPast(date: Date | string): boolean {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj < new Date();
  }

  /**
   * Check if date is in the future
   */
  static isFuture(date: Date | string): boolean {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj > new Date();
  }

  /**
   * Get days between two dates
   */
  static getDaysBetween(date1: Date | string, date2: Date | string): number {
    const d1 = typeof date1 === 'string' ? new Date(date1) : date1;
    const d2 = typeof date2 === 'string' ? new Date(date2) : date2;
    const diffInMs = Math.abs(d2.getTime() - d1.getTime());
    return Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  }

  /**
   * Generate a unique timestamp for IDs
   */
  static generateTimestampId(): string {
    return Date.now().toString();
  }

  /**
   * Get current time in HH:MM format
   */
  static getCurrentTime(): string {
    return new Date().toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Get current date and time for reports
   */
  static getReportTimestamp(): string {
    return new Date().toLocaleString('en-GB', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  /**
   * Get fiscal year start (assuming April 1st)
   */
  static getFiscalYearStart(): string {
    const date = new Date();
    const currentYear = date.getFullYear();
    const fiscalStart = new Date(currentYear, 3, 1); // April 1st
    
    if (date < fiscalStart) {
      fiscalStart.setFullYear(currentYear - 1);
    }
    
    fiscalStart.setHours(0, 0, 0, 0);
    return fiscalStart.toISOString();
  }

  /**
   * Get fiscal year end (assuming March 31st)
   */
  static getFiscalYearEnd(): string {
    const date = new Date();
    const currentYear = date.getFullYear();
    const fiscalEnd = new Date(currentYear + 1, 2, 31); // March 31st
    
    if (date.getMonth() < 3) {
      fiscalEnd.setFullYear(currentYear);
    }
    
    fiscalEnd.setHours(23, 59, 59, 999);
    return fiscalEnd.toISOString();
  }
}

/**
 * Hook for reactive date/time updates
 */
export const useCurrentDateTime = (updateInterval: number = 1000) => {
  const [currentDateTime, setCurrentDateTime] = React.useState(() => DateUtils.getCurrentISODate());

  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrentDateTime(DateUtils.getCurrentISODate());
    }, updateInterval);

    return () => clearInterval(interval);
  }, [updateInterval]);

  return currentDateTime;
};

// Import React for the hook
import React from 'react';



