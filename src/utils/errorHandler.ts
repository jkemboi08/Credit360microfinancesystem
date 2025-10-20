/**
 * Comprehensive Error Handling Utility
 * Provides centralized error handling, logging, and user-friendly error messages
 */

export interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  additionalData?: Record<string, any>;
}

export interface ErrorInfo {
  message: string;
  code?: string;
  statusCode?: number;
  userMessage: string;
  shouldRetry: boolean;
  logLevel: 'error' | 'warn' | 'info';
  context?: ErrorContext;
}

export class ErrorHandler {
  private static instance: ErrorHandler;
  private errorLog: ErrorInfo[] = [];

  public static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  /**
   * Handle different types of errors and return appropriate error info
   */
  public handleError(error: any, context?: ErrorContext): ErrorInfo {
    let errorInfo: ErrorInfo;

    if (error instanceof DatabaseError) {
      errorInfo = this.handleDatabaseError(error, context);
    } else if (error instanceof NetworkError) {
      errorInfo = this.handleNetworkError(error, context);
    } else if (error instanceof ValidationError) {
      errorInfo = this.handleValidationError(error, context);
    } else if (error instanceof AuthenticationError) {
      errorInfo = this.handleAuthenticationError(error, context);
    } else if (error instanceof AuthorizationError) {
      errorInfo = this.handleAuthorizationError(error, context);
    } else if (error instanceof BusinessLogicError) {
      errorInfo = this.handleBusinessLogicError(error, context);
    } else {
      errorInfo = this.handleGenericError(error, context);
    }

    // Log the error
    this.logError(errorInfo);

    return errorInfo;
  }

  /**
   * Handle database-related errors
   */
  private handleDatabaseError(error: DatabaseError, context?: ErrorContext): ErrorInfo {
    const errorCode = error.code || 'DATABASE_ERROR';
    
    switch (errorCode) {
      case 'PGRST201':
        return {
          message: 'Table or column not found in database',
          code: errorCode,
          statusCode: 404,
          userMessage: 'The requested data is not available. Please contact support if this persists.',
          shouldRetry: false,
          logLevel: 'error',
          context
        };
      
      case 'PGRST204':
        return {
          message: 'No rows returned from database query',
          code: errorCode,
          statusCode: 404,
          userMessage: 'No data found matching your criteria.',
          shouldRetry: false,
          logLevel: 'info',
          context
        };
      
      case 'PGRST301':
        return {
          message: 'Database connection failed',
          code: errorCode,
          statusCode: 503,
          userMessage: 'Unable to connect to the database. Please try again in a few moments.',
          shouldRetry: true,
          logLevel: 'error',
          context
        };
      
      case '23505': // Unique constraint violation
        return {
          message: 'Duplicate entry detected',
          code: errorCode,
          statusCode: 409,
          userMessage: 'This record already exists. Please check your input and try again.',
          shouldRetry: false,
          logLevel: 'warn',
          context
        };
      
      case '23503': // Foreign key constraint violation
        return {
          message: 'Referenced record not found',
          code: errorCode,
          statusCode: 400,
          userMessage: 'The referenced record does not exist. Please check your selection.',
          shouldRetry: false,
          logLevel: 'warn',
          context
        };
      
      case '23514': // Check constraint violation
        return {
          message: 'Data validation failed',
          code: errorCode,
          statusCode: 400,
          userMessage: 'The data entered does not meet the required criteria. Please check your input.',
          shouldRetry: false,
          logLevel: 'warn',
          context
        };
      
      default:
        return {
          message: 'Database operation failed',
          code: errorCode,
          statusCode: 500,
          userMessage: 'A database error occurred. Please try again or contact support.',
          shouldRetry: true,
          logLevel: 'error',
          context
        };
    }
  }

  /**
   * Handle network-related errors
   */
  private handleNetworkError(error: NetworkError, context?: ErrorContext): ErrorInfo {
    const statusCode = error.statusCode || 0;
    
    switch (statusCode) {
      case 0:
        return {
          message: 'Network connection failed',
          code: 'NETWORK_ERROR',
          statusCode: 0,
          userMessage: 'Unable to connect to the server. Please check your internet connection.',
          shouldRetry: true,
          logLevel: 'error',
          context
        };
      
      case 400:
        return {
          message: 'Bad request',
          code: 'BAD_REQUEST',
          statusCode: 400,
          userMessage: 'The request was invalid. Please check your input and try again.',
          shouldRetry: false,
          logLevel: 'warn',
          context
        };
      
      case 401:
        return {
          message: 'Unauthorized access',
          code: 'UNAUTHORIZED',
          statusCode: 401,
          userMessage: 'Your session has expired. Please log in again.',
          shouldRetry: false,
          logLevel: 'warn',
          context
        };
      
      case 403:
        return {
          message: 'Access forbidden',
          code: 'FORBIDDEN',
          statusCode: 403,
          userMessage: 'You do not have permission to perform this action.',
          shouldRetry: false,
          logLevel: 'warn',
          context
        };
      
      case 404:
        return {
          message: 'Resource not found',
          code: 'NOT_FOUND',
          statusCode: 404,
          userMessage: 'The requested resource was not found.',
          shouldRetry: false,
          logLevel: 'info',
          context
        };
      
      case 429:
        return {
          message: 'Rate limit exceeded',
          code: 'RATE_LIMITED',
          statusCode: 429,
          userMessage: 'Too many requests. Please wait a moment and try again.',
          shouldRetry: true,
          logLevel: 'warn',
          context
        };
      
      case 500:
        return {
          message: 'Internal server error',
          code: 'SERVER_ERROR',
          statusCode: 500,
          userMessage: 'A server error occurred. Please try again later.',
          shouldRetry: true,
          logLevel: 'error',
          context
        };
      
      case 503:
        return {
          message: 'Service unavailable',
          code: 'SERVICE_UNAVAILABLE',
          statusCode: 503,
          userMessage: 'The service is temporarily unavailable. Please try again later.',
          shouldRetry: true,
          logLevel: 'error',
          context
        };
      
      default:
        return {
          message: 'Network error occurred',
          code: 'NETWORK_ERROR',
          statusCode,
          userMessage: 'A network error occurred. Please try again.',
          shouldRetry: true,
          logLevel: 'error',
          context
        };
    }
  }

  /**
   * Handle validation errors
   */
  private handleValidationError(error: ValidationError, context?: ErrorContext): ErrorInfo {
    return {
      message: error.message,
      code: 'VALIDATION_ERROR',
      statusCode: 400,
      userMessage: error.userMessage || 'Please check your input and try again.',
      shouldRetry: false,
      logLevel: 'warn',
      context
    };
  }

  /**
   * Handle authentication errors
   */
  private handleAuthenticationError(error: AuthenticationError, context?: ErrorContext): ErrorInfo {
    return {
      message: error.message,
      code: 'AUTHENTICATION_ERROR',
      statusCode: 401,
      userMessage: 'Authentication failed. Please log in again.',
      shouldRetry: false,
      logLevel: 'warn',
      context
    };
  }

  /**
   * Handle authorization errors
   */
  private handleAuthorizationError(error: AuthorizationError, context?: ErrorContext): ErrorInfo {
    return {
      message: error.message,
      code: 'AUTHORIZATION_ERROR',
      statusCode: 403,
      userMessage: 'You do not have permission to perform this action.',
      shouldRetry: false,
      logLevel: 'warn',
      context
    };
  }

  /**
   * Handle business logic errors
   */
  private handleBusinessLogicError(error: BusinessLogicError, context?: ErrorContext): ErrorInfo {
    return {
      message: error.message,
      code: 'BUSINESS_LOGIC_ERROR',
      statusCode: 400,
      userMessage: error.userMessage || 'The operation cannot be completed due to business rules.',
      shouldRetry: false,
      logLevel: 'warn',
      context
    };
  }

  /**
   * Handle generic errors
   */
  private handleGenericError(error: any, context?: ErrorContext): ErrorInfo {
    const message = error?.message || 'An unexpected error occurred';
    
    return {
      message,
      code: 'UNKNOWN_ERROR',
      statusCode: 500,
      userMessage: 'An unexpected error occurred. Please try again or contact support.',
      shouldRetry: true,
      logLevel: 'error',
      context
    };
  }

  /**
   * Log error information
   */
  private logError(errorInfo: ErrorInfo): void {
    this.errorLog.push(errorInfo);
    
    const logMessage = `[${errorInfo.logLevel.toUpperCase()}] ${errorInfo.message}`;
    const logData = {
      ...errorInfo,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    switch (errorInfo.logLevel) {
      case 'error':
        console.error(logMessage, logData);
        break;
      case 'warn':
        console.warn(logMessage, logData);
        break;
      case 'info':
        console.info(logMessage, logData);
        break;
    }

    // In production, you might want to send this to a logging service
    // this.sendToLoggingService(logData);
  }

  /**
   * Get error history
   */
  public getErrorHistory(): ErrorInfo[] {
    return [...this.errorLog];
  }

  /**
   * Clear error history
   */
  public clearErrorHistory(): void {
    this.errorLog = [];
  }

  /**
   * Create a retry function with exponential backoff
   */
  public createRetryFunction<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): () => Promise<T> {
    return async (): Promise<T> => {
      let lastError: any;
      
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          return await fn();
        } catch (error) {
          lastError = error;
          
          if (attempt === maxRetries) {
            throw error;
          }
          
          const delay = baseDelay * Math.pow(2, attempt);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
      
      throw lastError;
    };
  }
}

// Custom Error Classes
export class DatabaseError extends Error {
  constructor(message: string, public code?: string, public statusCode?: number) {
    super(message);
    this.name = 'DatabaseError';
  }
}

export class NetworkError extends Error {
  constructor(message: string, public statusCode?: number) {
    super(message);
    this.name = 'NetworkError';
  }
}

export class ValidationError extends Error {
  constructor(message: string, public userMessage?: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthorizationError';
  }
}

export class BusinessLogicError extends Error {
  constructor(message: string, public userMessage?: string) {
    super(message);
    this.name = 'BusinessLogicError';
  }
}

// Export singleton instance
export const errorHandler = ErrorHandler.getInstance();

// Utility functions
export const handleAsyncError = async <T>(
  asyncFn: () => Promise<T>,
  context?: ErrorContext
): Promise<T> => {
  try {
    return await asyncFn();
  } catch (error) {
    const errorInfo = errorHandler.handleError(error, context);
    throw new Error(errorInfo.userMessage);
  }
};

export const withErrorHandling = <T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  context?: ErrorContext
) => {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args);
    } catch (error) {
      const errorInfo = errorHandler.handleError(error, context);
      throw new Error(errorInfo.userMessage);
    }
  };
};

































