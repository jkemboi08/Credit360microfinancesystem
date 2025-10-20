// errorHandling.ts
export interface SupabaseErrorResponse {
  message: string;
  code: string;
  details?: string;
}

export const handleSupabaseError = (error: any, customMessage?: string): SupabaseErrorResponse => {
  console.error('Supabase Error Log:', error);
  
  // Standardized error handling
  return {
    message: customMessage || error?.message || 'An unexpected error occurred',
    code: error?.code || error?.status || 'UNKNOWN_ERROR',
    details: error?.details || JSON.stringify(error)
  };
};

// Advanced error tracking (optional)
export const logErrorToMonitoring = (error: SupabaseErrorResponse) => {
  // Integrate with services like Sentry, LogRocket, etc.
  // Example with console for demonstration
  console.group('Supabase Error Tracking');
  console.error('Error Code:', error.code);
  console.error('Error Message:', error.message);
  console.error('Error Details:', error.details);
  console.groupEnd();

  // Potential integration with error tracking service
  // Sentry.captureException(new Error(error.message));
};