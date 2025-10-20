/**
 * Error Handling Service
 * Centralized error handling, logging, and user feedback
 */

export interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  timestamp?: string;
  additionalData?: Record<string, any>;
}

export interface ErrorReport {
  id: string;
  message: string;
  stack?: string;
  context: ErrorContext;
  severity: 'low' | 'medium' | 'high' | 'critical';
  resolved: boolean;
  createdAt: string;
  resolvedAt?: string;
}

class ErrorHandlingService {
  private static instance: ErrorHandlingService;
  private errorQueue: ErrorReport[] = [];
  private maxQueueSize = 100;

  private constructor() {}

  public static getInstance(): ErrorHandlingService {
    if (!ErrorHandlingService.instance) {
      ErrorHandlingService.instance = new ErrorHandlingService();
    }
    return ErrorHandlingService.instance;
  }

  /**
   * Handle and log errors with context
   */
  public handleError(
    error: Error | string,
    context: ErrorContext = {},
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
  ): void {
    const errorMessage = typeof error === 'string' ? error : error.message;
    const errorStack = typeof error === 'object' ? error.stack : undefined;

    const errorReport: ErrorReport = {
      id: this.generateErrorId(),
      message: errorMessage,
      stack: errorStack,
      context: {
        ...context,
        timestamp: new Date().toISOString()
      },
      severity,
      resolved: false,
      createdAt: new Date().toISOString()
    };

    // Add to queue
    this.addToQueue(errorReport);

    // Log to console in development
    if (import.meta.env.DEV) {
      console.error('Error handled:', errorReport);
    }

    // Send to external logging service in production
    if (import.meta.env.PROD) {
      this.sendToExternalLogger(errorReport);
    }

    // Show user notification for high/critical errors
    if (severity === 'high' || severity === 'critical') {
      this.showUserNotification(errorMessage, severity);
    }
  }

  /**
   * Handle Supabase errors specifically
   */
  public handleSupabaseError(
    error: any,
    context: ErrorContext = {},
    fallbackMessage: string = 'Database operation failed'
  ): void {
    let message = fallbackMessage;
    let severity: 'low' | 'medium' | 'high' | 'critical' = 'medium';

    if (error?.message) {
      message = error.message;
      
      // Determine severity based on error type
      if (error.message.includes('permission denied') || error.message.includes('unauthorized')) {
        severity = 'high';
      } else if (error.message.includes('connection') || error.message.includes('timeout')) {
        severity = 'medium';
      } else if (error.message.includes('constraint') || error.message.includes('duplicate')) {
        severity = 'low';
      }
    }

    this.handleError(message, {
      ...context,
      action: 'supabase_operation',
      additionalData: {
        errorCode: error?.code,
        errorDetails: error?.details,
        errorHint: error?.hint
      }
    }, severity);
  }

  /**
   * Handle API errors
   */
  public handleApiError(
    error: any,
    context: ErrorContext = {},
    fallbackMessage: string = 'API request failed'
  ): void {
    let message = fallbackMessage;
    let severity: 'low' | 'medium' | 'high' | 'critical' = 'medium';

    if (error?.response?.data?.message) {
      message = error.response.data.message;
    } else if (error?.message) {
      message = error.message;
    }

    // Determine severity based on status code
    const statusCode = error?.response?.status || error?.status;
    if (statusCode >= 500) {
      severity = 'high';
    } else if (statusCode >= 400) {
      severity = 'medium';
    }

    this.handleError(message, {
      ...context,
      action: 'api_request',
      additionalData: {
        statusCode,
        url: error?.config?.url,
        method: error?.config?.method
      }
    }, severity);
  }

  /**
   * Get error statistics
   */
  public getErrorStatistics(): {
    total: number;
    bySeverity: Record<string, number>;
    recent: ErrorReport[];
  } {
    const total = this.errorQueue.length;
    const bySeverity = this.errorQueue.reduce((acc, error) => {
      acc[error.severity] = (acc[error.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const recent = this.errorQueue
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10);

    return { total, bySeverity, recent };
  }

  /**
   * Clear resolved errors
   */
  public clearResolvedErrors(): void {
    this.errorQueue = this.errorQueue.filter(error => !error.resolved);
  }

  /**
   * Mark error as resolved
   */
  public resolveError(errorId: string): void {
    const error = this.errorQueue.find(e => e.id === errorId);
    if (error) {
      error.resolved = true;
      error.resolvedAt = new Date().toISOString();
    }
  }

  private addToQueue(errorReport: ErrorReport): void {
    this.errorQueue.push(errorReport);
    
    // Maintain queue size
    if (this.errorQueue.length > this.maxQueueSize) {
      this.errorQueue = this.errorQueue.slice(-this.maxQueueSize);
    }
  }

  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private sendToExternalLogger(errorReport: ErrorReport): void {
    // In production, send to external logging service like Sentry
    if (import.meta.env.VITE_SENTRY_DSN) {
      // Sentry.captureException(new Error(errorReport.message), {
      //   extra: errorReport.context
      // });
    }

    // Send to custom logging endpoint
    if (import.meta.env.VITE_API_BASE_URL) {
      fetch(`${import.meta.env.VITE_API_BASE_URL}/logs/errors`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(errorReport)
      }).catch(() => {
        // Silently fail if logging service is unavailable
      });
    }
  }

  private showUserNotification(message: string, severity: 'high' | 'critical'): void {
    // Show toast notification or modal
    if (typeof window !== 'undefined' && window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent('show-error-notification', {
        detail: { message, severity }
      }));
    }
  }
}

export default ErrorHandlingService;



