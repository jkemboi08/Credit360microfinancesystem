/**
 * Utility functions for sanitizing UUID fields to prevent database errors
 */

/**
 * List of known UUID fields across the application
 */
export const UUID_FIELDS = [
  'id',
  'client_id',
  'tenant_id',
  'profile_id',
  'user_id',
  'loan_id',
  'guarantor_id',
  'collateral_id',
  'document_id',
  'group_id',
  'member_id',
  'created_by',
  'updated_by',
  'verified_by',
  'uploaded_by'
];

/**
 * Sanitizes an object by converting undefined or empty string UUID fields to null
 * This prevents "invalid input syntax for type uuid" errors in PostgreSQL
 * 
 * @param obj - The object to sanitize
 * @param customUuidFields - Additional UUID fields to check (optional)
 * @returns A new object with sanitized UUID fields
 */
export function sanitizeUuidFields(obj: any, customUuidFields: string[] = []): any {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  const allUuidFields = [...UUID_FIELDS, ...customUuidFields];
  const sanitized = { ...obj };
  
  allUuidFields.forEach(field => {
    if (field in sanitized && (sanitized[field] === undefined || sanitized[field] === '')) {
      sanitized[field] = null;
    }
  });
  
  return sanitized;
}

/**
 * Sanitizes an array of objects by applying UUID sanitization to each object
 * 
 * @param arr - Array of objects to sanitize
 * @param customUuidFields - Additional UUID fields to check (optional)
 * @returns A new array with sanitized objects
 */
export function sanitizeUuidFieldsArray(arr: any[], customUuidFields: string[] = []): any[] {
  if (!Array.isArray(arr)) {
    return arr;
  }
  
  return arr.map(obj => sanitizeUuidFields(obj, customUuidFields));
}

/**
 * Validates if a string is a valid UUID format
 * 
 * @param str - String to validate
 * @returns True if valid UUID, false otherwise
 */
export function isValidUuid(str: string | null | undefined): boolean {
  if (!str) return false;
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

/**
 * Safely converts a value to a UUID-compatible format
 * - Valid UUID strings are returned as-is
 * - Invalid/empty values are converted to null
 * 
 * @param value - Value to convert
 * @returns Valid UUID string or null
 */
export function toSafeUuid(value: any): string | null {
  if (!value) return null;
  
  const str = String(value).trim();
  return isValidUuid(str) ? str : null;
}

/**
 * Higher-order function that wraps Supabase operations with UUID sanitization
 * This ensures all data passed to database operations has properly sanitized UUID fields
 * 
 * @param operation - The Supabase operation function to wrap
 * @param customUuidFields - Additional UUID fields to sanitize (optional)
 * @returns Wrapped function with UUID sanitization
 */
export function withUuidSanitization<T extends any[], R>(
  operation: (...args: T) => Promise<R>,
  customUuidFields: string[] = []
): (...args: T) => Promise<R> {
  return async (...args: T): Promise<R> => {
    // Sanitize all arguments that are objects
    const sanitizedArgs = args.map(arg => {
      if (arg && typeof arg === 'object' && !Array.isArray(arg)) {
        return sanitizeUuidFields(arg, customUuidFields);
      }
      return arg;
    });
    
    return operation(...sanitizedArgs as T);
  };
}

/**
 * Creates a sanitized Supabase query builder with automatic UUID sanitization
 * This is a convenience function for common database operations
 * 
 * @param supabase - The Supabase client instance
 * @param table - The table name
 * @param customUuidFields - Additional UUID fields to sanitize (optional)
 * @returns Object with sanitized insert, update, and upsert methods
 */
export function createSanitizedQueryBuilder(
  supabase: any,
  table: string,
  customUuidFields: string[] = []
) {
  return {
    insert: (data: any) => {
      const sanitizedData = Array.isArray(data) 
        ? data.map(item => sanitizeUuidFields(item, customUuidFields))
        : sanitizeUuidFields(data, customUuidFields);
      return supabase.from(table).insert(sanitizedData);
    },
    
    update: (data: any) => {
      const sanitizedData = sanitizeUuidFields(data, customUuidFields);
      return supabase.from(table).update(sanitizedData);
    },
    
    upsert: (data: any) => {
      const sanitizedData = Array.isArray(data) 
        ? data.map(item => sanitizeUuidFields(item, customUuidFields))
        : sanitizeUuidFields(data, customUuidFields);
      return supabase.from(table).upsert(sanitizedData);
    }
  };
}
