/**
 * Validation Service
 * Centralized data validation and sanitization
 */

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  min?: number;
  max?: number;
  type?: 'string' | 'number' | 'email' | 'phone' | 'date' | 'url' | 'boolean';
  custom?: (value: any) => boolean | string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string[]>;
  sanitizedData: Record<string, any>;
}

export class ValidationService {
  private static instance: ValidationService;

  private constructor() {}

  public static getInstance(): ValidationService {
    if (!ValidationService.instance) {
      ValidationService.instance = new ValidationService();
    }
    return ValidationService.instance;
  }

  /**
   * Validate data against rules
   */
  public validate(data: Record<string, any>, rules: Record<string, ValidationRule>): ValidationResult {
    const errors: Record<string, string[]> = {};
    const sanitizedData: Record<string, any> = {};

    for (const [field, rule] of Object.entries(rules)) {
      const value = data[field];
      const fieldErrors: string[] = [];

      // Required validation
      if (rule.required && (value === undefined || value === null || value === '')) {
        fieldErrors.push(`${field} is required`);
      }

      // Skip other validations if value is empty and not required
      if (!value && !rule.required) {
        sanitizedData[field] = value;
        continue;
      }

      // Type validation
      if (rule.type && !this.validateType(value, rule.type)) {
        fieldErrors.push(`${field} must be a valid ${rule.type}`);
      }

      // Length validation
      if (rule.minLength && typeof value === 'string' && value.length < rule.minLength) {
        fieldErrors.push(`${field} must be at least ${rule.minLength} characters long`);
      }

      if (rule.maxLength && typeof value === 'string' && value.length > rule.maxLength) {
        fieldErrors.push(`${field} must be no more than ${rule.maxLength} characters long`);
      }

      // Numeric validation
      if (rule.min !== undefined && typeof value === 'number' && value < rule.min) {
        fieldErrors.push(`${field} must be at least ${rule.min}`);
      }

      if (rule.max !== undefined && typeof value === 'number' && value > rule.max) {
        fieldErrors.push(`${field} must be no more than ${rule.max}`);
      }

      // Pattern validation
      if (rule.pattern && typeof value === 'string' && !rule.pattern.test(value)) {
        fieldErrors.push(`${field} format is invalid`);
      }

      // Custom validation
      if (rule.custom) {
        const customResult = rule.custom(value);
        if (customResult !== true) {
          fieldErrors.push(typeof customResult === 'string' ? customResult : `${field} is invalid`);
        }
      }

      // Sanitize data
      sanitizedData[field] = this.sanitizeValue(value, rule.type);

      if (fieldErrors.length > 0) {
        errors[field] = fieldErrors;
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      sanitizedData
    };
  }

  /**
   * Validate client data
   */
  public validateClientData(data: any): ValidationResult {
    const rules: Record<string, ValidationRule> = {
      first_name: {
        required: true,
        type: 'string',
        minLength: 2,
        maxLength: 50,
        pattern: /^[a-zA-Z\s]+$/
      },
      last_name: {
        required: true,
        type: 'string',
        minLength: 2,
        maxLength: 50,
        pattern: /^[a-zA-Z\s]+$/
      },
      email_address: {
        type: 'email',
        maxLength: 100
      },
      phone_number: {
        required: true,
        type: 'phone',
        pattern: /^\+?[1-9]\d{1,14}$/
      },
      national_id_number: {
        required: true,
        type: 'string',
        minLength: 5,
        maxLength: 20,
        pattern: /^[A-Z0-9]+$/
      },
      date_of_birth: {
        required: true,
        type: 'date',
        custom: (value) => {
          const date = new Date(value);
          const now = new Date();
          const age = now.getFullYear() - date.getFullYear();
          return age >= 18 && age <= 100 ? true : 'Age must be between 18 and 100 years';
        }
      },
      net_monthly_salary: {
        type: 'number',
        min: 0,
        max: 10000000
      },
      average_monthly_income: {
        type: 'number',
        min: 0,
        max: 10000000
      }
    };

    return this.validate(data, rules);
  }

  /**
   * Validate loan application data
   */
  public validateLoanApplicationData(data: any): ValidationResult {
    const rules: Record<string, ValidationRule> = {
      requested_amount: {
        required: true,
        type: 'number',
        min: 10000,
        max: 50000000
      },
      repayment_period_months: {
        required: true,
        type: 'number',
        min: 1,
        max: 60
      },
      loan_purpose: {
        required: true,
        type: 'string',
        minLength: 10,
        maxLength: 500
      },
      affordable_repayment_amount: {
        required: true,
        type: 'number',
        min: 1000,
        max: 1000000
      },
      source_of_income: {
        required: true,
        type: 'string',
        minLength: 5,
        maxLength: 100
      },
      net_monthly_salary: {
        type: 'number',
        min: 0,
        max: 10000000
      },
      average_monthly_income: {
        type: 'number',
        min: 0,
        max: 10000000
      }
    };

    return this.validate(data, rules);
  }

  /**
   * Validate group data
   */
  public validateGroupData(data: any): ValidationResult {
    const rules: Record<string, ValidationRule> = {
      name: {
        required: true,
        type: 'string',
        minLength: 3,
        maxLength: 100
      },
      description: {
        type: 'string',
        maxLength: 500
      },
      group_type: {
        required: true,
        type: 'string',
        custom: (value) => {
          const validTypes = ['solidarity', 'self_help', 'investment_club', 'village_bank', 'cooperative'];
          return validTypes.includes(value) ? true : 'Invalid group type';
        }
      },
      guarantee_value: {
        required: true,
        type: 'number',
        min: 0,
        max: 10000000
      },
      collective_guarantee_amount: {
        required: true,
        type: 'number',
        min: 0,
        max: 100000000
      },
      total_members: {
        required: true,
        type: 'number',
        min: 5,
        max: 50
      }
    };

    return this.validate(data, rules);
  }

  /**
   * Sanitize input data
   */
  public sanitizeInput(input: any): any {
    if (typeof input === 'string') {
      return input
        .trim()
        .replace(/[<>]/g, '') // Remove potential HTML tags
        .replace(/javascript:/gi, '') // Remove javascript: protocol
        .replace(/on\w+=/gi, ''); // Remove event handlers
    }
    return input;
  }

  /**
   * Validate file upload
   */
  public validateFile(file: File, allowedTypes: string[], maxSize: number): ValidationResult {
    const errors: Record<string, string[]> = {};
    const sanitizedData: Record<string, any> = {};

    // Check file type
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    if (!fileExtension || !allowedTypes.includes(fileExtension)) {
      errors.file = [`File type must be one of: ${allowedTypes.join(', ')}`];
    }

    // Check file size
    if (file.size > maxSize) {
      errors.file = [`File size must be less than ${this.formatFileSize(maxSize)}`];
    }

    // Check file name
    if (file.name.length > 255) {
      errors.file = ['File name must be less than 255 characters'];
    }

    if (Object.keys(errors).length === 0) {
      sanitizedData.file = {
        name: this.sanitizeInput(file.name),
        size: file.size,
        type: file.type,
        lastModified: file.lastModified
      };
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      sanitizedData
    };
  }

  private validateType(value: any, type: string): boolean {
    switch (type) {
      case 'string':
        return typeof value === 'string';
      case 'number':
        return typeof value === 'number' && !isNaN(value);
      case 'email':
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      case 'phone':
        return /^\+?[1-9]\d{1,14}$/.test(value);
      case 'date':
        return !isNaN(Date.parse(value));
      case 'url':
        try {
          new URL(value);
          return true;
        } catch {
          return false;
        }
      case 'boolean':
        return typeof value === 'boolean';
      default:
        return true;
    }
  }

  private sanitizeValue(value: any, type?: string): any {
    if (typeof value === 'string') {
      const sanitized = this.sanitizeInput(value);
      if (type === 'email') {
        return sanitized.toLowerCase();
      }
      return sanitized;
    }
    return value;
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

export default ValidationService;



