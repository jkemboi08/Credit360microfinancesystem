/**
 * Rounding utility functions for consistent financial calculations across the application
 */

/**
 * Rounds amounts appropriately based on their value
 * - Amounts < 100: Round to nearest whole number
 * - Amounts < 1,000: Round to nearest 10
 * - Amounts >= 1,000: Round to nearest 100
 */
export const roundAmount = (amount: number): number => {
  if (isNaN(amount) || !isFinite(amount)) {
    return 0;
  }
  
  if (amount < 100) {
    return Math.round(amount); // Round to nearest whole number for small amounts
  } else if (amount < 1000) {
    return Math.round(amount / 10) * 10; // Round to nearest 10
  } else {
    return Math.round(amount / 100) * 100; // Round to nearest 100
  }
};

/**
 * Rounds currency amounts for display purposes
 * Always rounds to nearest whole number for currency display
 */
export const roundCurrency = (amount: number): number => {
  if (isNaN(amount) || !isFinite(amount)) {
    return 0;
  }
  return Math.round(amount);
};

/**
 * Rounds percentage values to 2 decimal places
 */
export const roundPercentage = (value: number): number => {
  if (isNaN(value) || !isFinite(value)) {
    return 0;
  }
  return Math.round(value * 100) / 100;
};

/**
 * Rounds interest rates to 2 decimal places
 */
export const roundInterestRate = (rate: number): number => {
  if (isNaN(rate) || !isFinite(rate)) {
    return 0;
  }
  return Math.round(rate * 100) / 100;
};

/**
 * Rounds loan amounts and large financial figures
 * Uses the same logic as roundAmount but with additional validation
 */
export const roundLoanAmount = (amount: number): number => {
  if (isNaN(amount) || !isFinite(amount) || amount < 0) {
    return 0;
  }
  return roundAmount(amount);
};

/**
 * Rounds management fees and small charges
 * Always rounds to nearest whole number
 */
export const roundFee = (fee: number): number => {
  if (isNaN(fee) || !isFinite(fee)) {
    return 0;
  }
  return Math.round(fee);
};

/**
 * Rounds repayment schedule amounts
 * Uses smart rounding based on amount size
 */
export const roundRepaymentAmount = (amount: number): number => {
  if (isNaN(amount) || !isFinite(amount)) {
    return 0;
  }
  return roundAmount(amount);
};

/**
 * Rounds balance amounts ensuring they don't go negative
 */
export const roundBalance = (balance: number): number => {
  if (isNaN(balance) || !isFinite(balance)) {
    return 0;
  }
  return Math.max(0, roundAmount(balance));
};

/**
 * Formats currency amounts with comma separators for accounting display
 * Example: 1000000 -> "1,000,000"
 */
export const formatCurrency = (amount: number): string => {
  if (isNaN(amount) || !isFinite(amount)) {
    return '0';
  }
  
  // Round to nearest whole number first
  const roundedAmount = Math.round(amount);
  
  // Format with comma separators
  return roundedAmount.toLocaleString('en-US');
};

/**
 * Formats currency amounts with TZS symbol and comma separators
 * Example: 1000000 -> "TZS 1,000,000"
 */
export const formatCurrencyWithSymbol = (amount: number, currency: string = 'TZS'): string => {
  if (isNaN(amount) || !isFinite(amount)) {
    return `${currency} 0`;
  }
  
  // Round to nearest whole number first
  const roundedAmount = Math.round(amount);
  
  // Format with currency symbol and comma separators
  return `${currency} ${roundedAmount.toLocaleString('en-US')}`;
};



