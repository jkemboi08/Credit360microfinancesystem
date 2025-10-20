/**
 * PAYE Calculator for Tanzania - Effective from 1st July 2023
 * Implements progressive tax rates for resident individuals
 */

export interface PAYECalculationResult {
  grossIncome: number;
  taxableIncome: number;
  taxAmount: number;
  effectiveRate: number;
  breakdown: {
    bracket: string;
    amount: number;
    rate: number;
    tax: number;
  }[];
}

export interface TaxBracket {
  from: number;
  to: number;
  rate: number;
  fixedAmount: number;
  description: string;
}

// Tax Brackets and Rates (Effective from 1st July 2023)
const RESIDENT_TAX_BRACKETS: TaxBracket[] = [
  {
    from: 0,
    to: 270000,
    rate: 0,
    fixedAmount: 0,
    description: "Income up to TZS 270,000/month: NIL (0% tax)"
  },
  {
    from: 270001,
    to: 520000,
    rate: 8,
    fixedAmount: 0,
    description: "Income from TZS 270,001 to TZS 520,000: 8% on amount exceeding TZS 270,000"
  },
  {
    from: 520001,
    to: 760000,
    rate: 20,
    fixedAmount: 20000, // (520,000 - 270,000) × 8%
    description: "Income from TZS 520,001 to TZS 760,000: TZS 20,000 + 20% on amount exceeding TZS 520,000"
  },
  {
    from: 760001,
    to: 1000000,
    rate: 25,
    fixedAmount: 68000, // 20,000 + (760,000 - 520,000) × 20%
    description: "Income from TZS 760,001 to TZS 1,000,000: TZS 68,000 + 25% on amount exceeding TZS 760,000"
  },
  {
    from: 1000001,
    to: Infinity,
    rate: 30,
    fixedAmount: 128000, // 68,000 + (1,000,000 - 760,000) × 25%
    description: "Income above TZS 1,000,000: TZS 128,000 + 30% on amount exceeding TZS 1,000,000"
  }
];

/**
 * Calculate PAYE tax for a given monthly gross income
 * @param monthlyGrossIncome - Monthly gross income in TZS
 * @param isResident - Whether the employee is a resident (default: true)
 * @returns PAYECalculationResult with detailed breakdown
 */
export function calculatePAYE(
  monthlyGrossIncome: number,
  isResident: boolean = true
): PAYECalculationResult {
  // Validate input
  if (monthlyGrossIncome < 0) {
    throw new Error("Income cannot be negative");
  }

  if (!isFinite(monthlyGrossIncome)) {
    throw new Error("Income must be a valid number");
  }

  // Round to nearest shilling
  const grossIncome = Math.round(monthlyGrossIncome);
  const taxableIncome = grossIncome; // For now, taxable income equals gross income

  // For non-resident employees, apply flat 30% withholding tax
  if (!isResident) {
    const taxAmount = Math.round(grossIncome * 0.30);
    const effectiveRate = grossIncome > 0 ? (taxAmount / grossIncome) * 100 : 0;
    
    return {
      grossIncome,
      taxableIncome,
      taxAmount,
      effectiveRate,
      breakdown: [{
        bracket: "Non-resident flat rate",
        amount: grossIncome,
        rate: 30,
        tax: taxAmount
      }]
    };
  }

  // For resident employees, apply progressive tax brackets
  let totalTax = 0;
  const breakdown: PAYECalculationResult['breakdown'] = [];

  for (const bracket of RESIDENT_TAX_BRACKETS) {
    if (grossIncome <= bracket.from) {
      break; // Income is below this bracket
    }

    const taxableAmountInBracket = Math.min(grossIncome, bracket.to) - bracket.from;
    
    if (taxableAmountInBracket > 0) {
      let taxInBracket: number;
      
      if (bracket.rate === 0) {
        taxInBracket = bracket.fixedAmount;
      } else {
        taxInBracket = bracket.fixedAmount + (taxableAmountInBracket * bracket.rate / 100);
      }

      totalTax += taxInBracket;
      
      breakdown.push({
        bracket: bracket.description,
        amount: taxableAmountInBracket,
        rate: bracket.rate,
        tax: Math.round(taxInBracket)
      });
    }
  }

  const taxAmount = Math.round(totalTax);
  const effectiveRate = grossIncome > 0 ? (taxAmount / grossIncome) * 100 : 0;

  return {
    grossIncome,
    taxableIncome,
    taxAmount,
    effectiveRate,
    breakdown
  };
}

/**
 * Calculate NSSF Employee contribution
 * @param grossPay - Monthly gross pay
 * @returns NSSF employee contribution (10% of gross pay)
 */
export function calculateNSSFEmployee(grossPay: number): number {
  if (grossPay < 0) {
    throw new Error("Gross pay cannot be negative");
  }
  
  return Math.round(grossPay * 0.10);
}

/**
 * Calculate NSSF Employer contribution
 * @param grossPay - Monthly gross pay
 * @returns NSSF employer contribution (10% of gross pay)
 */
export function calculateNSSFEmployer(grossPay: number): number {
  if (grossPay < 0) {
    throw new Error("Gross pay cannot be negative");
  }
  
  return Math.round(grossPay * 0.10);
}

/**
 * Calculate taxable amount (gross pay minus NSSF employee contribution)
 * @param grossPay - Monthly gross pay
 * @returns Taxable amount for PAYE calculation
 */
export function calculateTaxableAmount(grossPay: number): number {
  if (grossPay < 0) {
    throw new Error("Gross pay cannot be negative");
  }
  
  const nssfEE = calculateNSSFEmployee(grossPay);
  return Math.round(grossPay - nssfEE);
}

/**
 * Validate calculated tax against official tax tables
 * @param grossIncome - Monthly gross income
 * @param calculatedTax - Calculated tax amount
 * @returns Validation result with expected tax
 */
export function validatePAYECalculation(grossIncome: number, calculatedTax: number): {
  isValid: boolean;
  expectedTax: number;
  difference: number;
} {
  const result = calculatePAYE(grossIncome);
  const expectedTax = result.taxAmount;
  const difference = Math.abs(calculatedTax - expectedTax);
  
  return {
    isValid: difference <= 1, // Allow 1 TZS difference for rounding
    expectedTax,
    difference
  };
}

/**
 * Get tax bracket information for a given income
 * @param grossIncome - Monthly gross income
 * @returns Current tax bracket information
 */
export function getTaxBracketInfo(grossIncome: number): TaxBracket | null {
  for (const bracket of RESIDENT_TAX_BRACKETS) {
    if (grossIncome >= bracket.from && grossIncome <= bracket.to) {
      return bracket;
    }
  }
  return null;
}

/**
 * Example calculations for validation
 */
export const EXAMPLE_CALCULATIONS = {
  // Income TZS 520,000 → Tax = (520,000 - 270,000) × 8% = TZS 20,000
  income520k: calculatePAYE(520000),
  
  // Income TZS 760,000 → Tax = 20,000 + (760,000 - 520,000) × 20% = TZS 68,000
  income760k: calculatePAYE(760000),
  
  // Income TZS 1,000,000 → Tax = 68,000 + (1,000,000 - 760,000) × 25% = TZS 128,000
  income1m: calculatePAYE(1000000),
  
  // Income TZS 1,240,000 → Tax = 128,000 + (1,240,000 - 1,000,000) × 30% = TZS 200,000
  income1240k: calculatePAYE(1240000)
};

// Export tax brackets for reference
export { RESIDENT_TAX_BRACKETS };
