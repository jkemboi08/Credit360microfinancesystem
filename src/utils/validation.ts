/**
 * Data Validation Utility
 * Provides comprehensive validation functions for form data and API inputs
 */

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  custom?: (value: any) => boolean | string;
  message?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export class Validator {
  private rules: Record<string, ValidationRule[]> = {};

  /**
   * Add validation rules for a field
   */
  public addRule(field: string, rule: ValidationRule): Validator {
    if (!this.rules[field]) {
      this.rules[field] = [];
    }
    this.rules[field].push(rule);
    return this;
  }

  /**
   * Validate a single field
   */
  public validateField(field: string, value: any): string | null {
    const fieldRules = this.rules[field] || [];
    
    for (const rule of fieldRules) {
      const error = this.validateRule(value, rule);
      if (error) {
        return error;
      }
    }
    
    return null;
  }

  /**
   * Validate all fields
   */
  public validate(data: Record<string, any>): ValidationResult {
    const errors: Record<string, string> = {};
    let isValid = true;

    for (const field in this.rules) {
      const value = data[field];
      const error = this.validateField(field, value);
      
      if (error) {
        errors[field] = error;
        isValid = false;
      }
    }

    return { isValid, errors };
  }

  /**
   * Validate a single rule
   */
  private validateRule(value: any, rule: ValidationRule): string | null {
    // Required validation
    if (rule.required && (value === undefined || value === null || value === '')) {
      return rule.message || `${this.getFieldName(rule)} is required`;
    }

    // Skip other validations if value is empty and not required
    if (!rule.required && (value === undefined || value === null || value === '')) {
      return null;
    }

    // String length validation
    if (typeof value === 'string') {
      if (rule.minLength && value.length < rule.minLength) {
        return rule.message || `${this.getFieldName(rule)} must be at least ${rule.minLength} characters`;
      }
      if (rule.maxLength && value.length > rule.maxLength) {
        return rule.message || `${this.getFieldName(rule)} must be no more than ${rule.maxLength} characters`;
      }
    }

    // Number validation
    if (typeof value === 'number') {
      if (rule.min !== undefined && value < rule.min) {
        return rule.message || `${this.getFieldName(rule)} must be at least ${rule.min}`;
      }
      if (rule.max !== undefined && value > rule.max) {
        return rule.message || `${this.getFieldName(rule)} must be no more than ${rule.max}`;
      }
    }

    // Pattern validation
    if (rule.pattern && typeof value === 'string' && !rule.pattern.test(value)) {
      return rule.message || `${this.getFieldName(rule)} format is invalid`;
    }

    // Custom validation
    if (rule.custom) {
      const result = rule.custom(value);
      if (result !== true) {
        return typeof result === 'string' ? result : rule.message || `${this.getFieldName(rule)} is invalid`;
      }
    }

    return null;
  }

  /**
   * Get field name for error messages
   */
  private getFieldName(rule: ValidationRule): string {
    return rule.message ? rule.message.split(' ')[0] : 'This field';
  }

  /**
   * Clear all rules
   */
  public clear(): Validator {
    this.rules = {};
    return this;
  }
}

// Common validation patterns
export const ValidationPatterns = {
  email: /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/,
  phone: /^[0-9+\-\s()]+$/,
  tanzaniaPhone: /^(\+255|0)[0-9]{9}$/,
  idNumber: /^[0-9]{8,20}$/,
  amount: /^\d+(\.\d{1,2})?$/,
  percentage: /^(100(\.0{1,2})?|[0-9]{1,2}(\.[0-9]{1,2})?)$/,
  alphanumeric: /^[A-Za-z0-9\s]+$/,
  lettersOnly: /^[A-Za-z\s]+$/,
  numbersOnly: /^[0-9]+$/,
  url: /^https?:\/\/.+/,
  date: /^\d{4}-\d{2}-\d{2}$/,
  time: /^\d{2}:\d{2}$/,
  datetime: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/
};

// Common validation rules
export const CommonRules = {
  required: (message?: string): ValidationRule => ({
    required: true,
    message
  }),

  email: (message?: string): ValidationRule => ({
    pattern: ValidationPatterns.email,
    message: message || 'Please enter a valid email address'
  }),

  phone: (message?: string): ValidationRule => ({
    pattern: ValidationPatterns.phone,
    message: message || 'Please enter a valid phone number'
  }),

  tanzaniaPhone: (message?: string): ValidationRule => ({
    pattern: ValidationPatterns.tanzaniaPhone,
    message: message || 'Please enter a valid Tanzanian phone number'
  }),

  idNumber: (message?: string): ValidationRule => ({
    pattern: ValidationPatterns.idNumber,
    message: message || 'Please enter a valid ID number'
  }),

  amount: (message?: string): ValidationRule => ({
    pattern: ValidationPatterns.amount,
    message: message || 'Please enter a valid amount'
  }),

  percentage: (message?: string): ValidationRule => ({
    pattern: ValidationPatterns.percentage,
    message: message || 'Please enter a valid percentage (0-100)'
  }),

  minLength: (min: number, message?: string): ValidationRule => ({
    minLength: min,
    message: message || `Must be at least ${min} characters`
  }),

  maxLength: (max: number, message?: string): ValidationRule => ({
    maxLength: max,
    message: message || `Must be no more than ${max} characters`
  }),

  min: (min: number, message?: string): ValidationRule => ({
    min,
    message: message || `Must be at least ${min}`
  }),

  max: (max: number, message?: string): ValidationRule => ({
    max,
    message: message || `Must be no more than ${max}`
  }),

  range: (min: number, max: number, message?: string): ValidationRule => ({
    min,
    max,
    message: message || `Must be between ${min} and ${max}`
  }),

  custom: (validator: (value: any) => boolean | string, message?: string): ValidationRule => ({
    custom: validator,
    message
  })
};

// Specific validation functions
export const validateLoanApplication = (data: any): ValidationResult => {
  const validator = new Validator();

  validator
    .addRule('client_id', CommonRules.required('Client is required'))
    .addRule('requested_amount', CommonRules.required('Loan amount is required'))
    .addRule('requested_amount', CommonRules.min(10000, 'Minimum loan amount is 10,000 TSh'))
    .addRule('requested_amount', CommonRules.max(10000000, 'Maximum loan amount is 10,000,000 TSh'))
    .addRule('loan_purpose', CommonRules.required('Loan purpose is required'))
    .addRule('loan_purpose', CommonRules.minLength(10, 'Loan purpose must be at least 10 characters'))
    .addRule('term_months', CommonRules.required('Loan term is required'))
    .addRule('term_months', CommonRules.min(1, 'Minimum loan term is 1 month'))
    .addRule('term_months', CommonRules.max(60, 'Maximum loan term is 60 months'))
    .addRule('interest_rate', CommonRules.required('Interest rate is required'))
    .addRule('interest_rate', CommonRules.min(0, 'Interest rate cannot be negative'))
    .addRule('interest_rate', CommonRules.max(50, 'Interest rate cannot exceed 50%'));

  return validator.validate(data);
};

export const validateClient = (data: any): ValidationResult => {
  const validator = new Validator();

  validator
    .addRule('first_name', CommonRules.required('First name is required'))
    .addRule('first_name', CommonRules.minLength(2, 'First name must be at least 2 characters'))
    .addRule('first_name', CommonRules.maxLength(50, 'First name must be no more than 50 characters'))
    .addRule('last_name', CommonRules.required('Last name is required'))
    .addRule('last_name', CommonRules.minLength(2, 'Last name must be at least 2 characters'))
    .addRule('last_name', CommonRules.maxLength(50, 'Last name must be no more than 50 characters'))
    .addRule('phone_number', CommonRules.required('Phone number is required'))
    .addRule('phone_number', CommonRules.tanzaniaPhone('Please enter a valid Tanzanian phone number'))
    .addRule('email_address', CommonRules.email('Please enter a valid email address'))
    .addRule('id_number', CommonRules.required('ID number is required'))
    .addRule('id_number', CommonRules.idNumber('Please enter a valid ID number'))
    .addRule('date_of_birth', CommonRules.required('Date of birth is required'))
    .addRule('date_of_birth', CommonRules.custom(
      (value) => {
        const date = new Date(value);
        const today = new Date();
        const age = today.getFullYear() - date.getFullYear();
        return age >= 18 && age <= 100;
      },
      'Age must be between 18 and 100 years'
    ))
    .addRule('monthly_income', CommonRules.required('Monthly income is required'))
    .addRule('monthly_income', CommonRules.min(0, 'Monthly income cannot be negative'))
    .addRule('monthly_income', CommonRules.max(10000000, 'Monthly income cannot exceed 10,000,000 TSh'));

  return validator.validate(data);
};

export const validateExpense = (data: any): ValidationResult => {
  const validator = new Validator();

  validator
    .addRule('amount', CommonRules.required('Expense amount is required'))
    .addRule('amount', CommonRules.min(1, 'Expense amount must be greater than 0'))
    .addRule('amount', CommonRules.max(1000000, 'Expense amount cannot exceed 1,000,000 TSh'))
    .addRule('description', CommonRules.required('Expense description is required'))
    .addRule('description', CommonRules.minLength(10, 'Description must be at least 10 characters'))
    .addRule('description', CommonRules.maxLength(500, 'Description must be no more than 500 characters'))
    .addRule('expense_date', CommonRules.required('Expense date is required'))
    .addRule('expense_date', CommonRules.custom(
      (value) => {
        const date = new Date(value);
        const today = new Date();
        const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        return date >= thirtyDaysAgo && date <= today;
      },
      'Expense date must be within the last 30 days'
    ))
    .addRule('category_id', CommonRules.required('Expense category is required'));

  return validator.validate(data);
};

export const validateUser = (data: any): ValidationResult => {
  const validator = new Validator();

  validator
    .addRule('email', CommonRules.required('Email is required'))
    .addRule('email', CommonRules.email('Please enter a valid email address'))
    .addRule('first_name', CommonRules.required('First name is required'))
    .addRule('first_name', CommonRules.minLength(2, 'First name must be at least 2 characters'))
    .addRule('last_name', CommonRules.required('Last name is required'))
    .addRule('last_name', CommonRules.minLength(2, 'Last name must be at least 2 characters'))
    .addRule('role', CommonRules.required('Role is required'))
    .addRule('role', CommonRules.custom(
      (value) => ['admin', 'manager', 'staff'].includes(value),
      'Role must be admin, manager, or staff'
    ))
    .addRule('phone_number', CommonRules.tanzaniaPhone('Please enter a valid Tanzanian phone number'));

  return validator.validate(data);
};

// Utility functions
export const sanitizeInput = (input: any): any => {
  if (typeof input === 'string') {
    return input.trim();
  }
  return input;
};

export const formatValidationErrors = (errors: Record<string, string>): string => {
  return Object.values(errors).join(', ');
};

export const hasValidationErrors = (result: ValidationResult): boolean => {
  return !result.isValid && Object.keys(result.errors).length > 0;
};

// Export default validator instance
export const validator = new Validator();

































