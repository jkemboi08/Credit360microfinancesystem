/**
 * Unit tests for PAYE Calculator
 * Tests all tax brackets and edge cases
 */

import { 
  calculatePAYE, 
  calculateNSSFEmployee, 
  calculateNSSFEmployer, 
  calculateTaxableAmount,
  validatePAYECalculation,
  EXAMPLE_CALCULATIONS 
} from '../payeCalculator';

describe('PAYE Calculator', () => {
  describe('calculatePAYE', () => {
    it('should return 0 tax for income below 270,000', () => {
      const result = calculatePAYE(200000);
      expect(result.taxAmount).toBe(0);
      expect(result.effectiveRate).toBe(0);
    });

    it('should calculate tax correctly for income 270,001 - 520,000', () => {
      const result = calculatePAYE(520000);
      expect(result.taxAmount).toBe(20000); // (520,000 - 270,000) × 8%
      expect(result.effectiveRate).toBeCloseTo(3.85, 2);
    });

    it('should calculate tax correctly for income 520,001 - 760,000', () => {
      const result = calculatePAYE(760000);
      expect(result.taxAmount).toBe(68000); // 20,000 + (760,000 - 520,000) × 20%
      expect(result.effectiveRate).toBeCloseTo(8.95, 2);
    });

    it('should calculate tax correctly for income 760,001 - 1,000,000', () => {
      const result = calculatePAYE(1000000);
      expect(result.taxAmount).toBe(128000); // 68,000 + (1,000,000 - 760,000) × 25%
      expect(result.effectiveRate).toBeCloseTo(12.8, 2);
    });

    it('should calculate tax correctly for income above 1,000,000', () => {
      const result = calculatePAYE(1240000);
      expect(result.taxAmount).toBe(200000); // 128,000 + (1,240,000 - 1,000,000) × 30%
      expect(result.effectiveRate).toBeCloseTo(16.13, 2);
    });

    it('should handle non-resident employees with flat 30% rate', () => {
      const result = calculatePAYE(1000000, false);
      expect(result.taxAmount).toBe(300000); // 1,000,000 × 30%
      expect(result.effectiveRate).toBe(30);
    });

    it('should throw error for negative income', () => {
      expect(() => calculatePAYE(-1000)).toThrow('Income cannot be negative');
    });

    it('should throw error for invalid income', () => {
      expect(() => calculatePAYE(NaN)).toThrow('Income must be a valid number');
    });

    it('should round tax amounts to nearest shilling', () => {
      const result = calculatePAYE(270001);
      expect(result.taxAmount).toBe(1); // (270,001 - 270,000) × 8% = 0.08, rounded to 1
    });
  });

  describe('calculateNSSFEmployee', () => {
    it('should calculate 10% of gross pay', () => {
      expect(calculateNSSFEmployee(1000000)).toBe(100000);
      expect(calculateNSSFEmployee(500000)).toBe(50000);
    });

    it('should round to nearest shilling', () => {
      expect(calculateNSSFEmployee(1000001)).toBe(100000);
    });

    it('should throw error for negative gross pay', () => {
      expect(() => calculateNSSFEmployee(-1000)).toThrow('Gross pay cannot be negative');
    });
  });

  describe('calculateNSSFEmployer', () => {
    it('should calculate 10% of gross pay', () => {
      expect(calculateNSSFEmployer(1000000)).toBe(100000);
      expect(calculateNSSFEmployer(500000)).toBe(50000);
    });

    it('should round to nearest shilling', () => {
      expect(calculateNSSFEmployer(1000001)).toBe(100000);
    });

    it('should throw error for negative gross pay', () => {
      expect(() => calculateNSSFEmployer(-1000)).toThrow('Gross pay cannot be negative');
    });
  });

  describe('calculateTaxableAmount', () => {
    it('should calculate gross pay minus NSSF employee contribution', () => {
      expect(calculateTaxableAmount(1000000)).toBe(900000); // 1,000,000 - 100,000
      expect(calculateTaxableAmount(500000)).toBe(450000); // 500,000 - 50,000
    });

    it('should round to nearest shilling', () => {
      expect(calculateTaxableAmount(1000001)).toBe(900001);
    });

    it('should throw error for negative gross pay', () => {
      expect(() => calculateTaxableAmount(-1000)).toThrow('Gross pay cannot be negative');
    });
  });

  describe('validatePAYECalculation', () => {
    it('should validate correct tax calculation', () => {
      const result = validatePAYECalculation(520000, 20000);
      expect(result.isValid).toBe(true);
      expect(result.expectedTax).toBe(20000);
      expect(result.difference).toBe(0);
    });

    it('should detect incorrect tax calculation', () => {
      const result = validatePAYECalculation(520000, 15000);
      expect(result.isValid).toBe(false);
      expect(result.expectedTax).toBe(20000);
      expect(result.difference).toBe(5000);
    });

    it('should allow small rounding differences', () => {
      const result = validatePAYECalculation(270001, 1);
      expect(result.isValid).toBe(true);
    });
  });

  describe('Example Calculations', () => {
    it('should match example calculations from requirements', () => {
      // Income TZS 520,000 → Tax = (520,000 - 270,000) × 8% = TZS 20,000
      expect(EXAMPLE_CALCULATIONS.income520k.taxAmount).toBe(20000);
      
      // Income TZS 760,000 → Tax = 20,000 + (760,000 - 520,000) × 20% = TZS 68,000
      expect(EXAMPLE_CALCULATIONS.income760k.taxAmount).toBe(68000);
      
      // Income TZS 1,000,000 → Tax = 68,000 + (1,000,000 - 760,000) × 25% = TZS 128,000
      expect(EXAMPLE_CALCULATIONS.income1m.taxAmount).toBe(128000);
      
      // Income TZS 1,240,000 → Tax = 128,000 + (1,240,000 - 1,000,000) × 30% = TZS 200,000
      expect(EXAMPLE_CALCULATIONS.income1240k.taxAmount).toBe(200000);
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero income', () => {
      const result = calculatePAYE(0);
      expect(result.taxAmount).toBe(0);
      expect(result.effectiveRate).toBe(0);
    });

    it('should handle very large income', () => {
      const result = calculatePAYE(10000000);
      expect(result.taxAmount).toBeGreaterThan(0);
      expect(result.effectiveRate).toBeLessThanOrEqual(30);
    });

    it('should handle income exactly at bracket boundaries', () => {
      const result270k = calculatePAYE(270000);
      expect(result270k.taxAmount).toBe(0);

      const result270k1 = calculatePAYE(270001);
      expect(result270k1.taxAmount).toBe(1);
    });
  });
});
