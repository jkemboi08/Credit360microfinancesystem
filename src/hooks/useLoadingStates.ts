/**
 * Loading States Hook
 * Provides centralized loading state management for better UX
 */

import { useState, useCallback, useRef, useEffect } from 'react';

export interface LoadingState {
  isLoading: boolean;
  error: string | null;
  retryCount: number;
  lastRetry: Date | null;
}

export interface LoadingOptions {
  maxRetries?: number;
  retryDelay?: number;
  timeout?: number;
  onError?: (error: Error) => void;
  onSuccess?: () => void;
  onRetry?: (retryCount: number) => void;
}

export interface LoadingActions {
  startLoading: () => void;
  stopLoading: () => void;
  setError: (error: string | null) => void;
  retry: () => void;
  reset: () => void;
}

export const useLoadingStates = (options: LoadingOptions = {}) => {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    timeout = 30000,
    onError,
    onSuccess,
    onRetry
  } = options;

  const [loadingState, setLoadingState] = useState<LoadingState>({
    isLoading: false,
    error: null,
    retryCount: 0,
    lastRetry: null
  });

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const startLoading = useCallback(() => {
    setLoadingState(prev => ({
      ...prev,
      isLoading: true,
      error: null
    }));

    // Set timeout
    if (timeout > 0) {
      timeoutRef.current = setTimeout(() => {
        setLoadingState(prev => ({
          ...prev,
          isLoading: false,
          error: 'Operation timed out. Please try again.'
        }));
      }, timeout);
    }
  }, [timeout]);

  const stopLoading = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    setLoadingState(prev => ({
      ...prev,
      isLoading: false
    }));

    onSuccess?.();
  }, [onSuccess]);

  const setError = useCallback((error: string | null) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    setLoadingState(prev => ({
      ...prev,
      isLoading: false,
      error
    }));

    if (error) {
      onError?.(new Error(error));
    }
  }, [onError]);

  const retry = useCallback(() => {
    if (loadingState.retryCount >= maxRetries) {
      setError('Maximum retry attempts reached. Please try again later.');
      return;
    }

    setLoadingState(prev => ({
      ...prev,
      retryCount: prev.retryCount + 1,
      lastRetry: new Date(),
      error: null
    }));

    onRetry?.(loadingState.retryCount + 1);

    // Delay before retry
    retryTimeoutRef.current = setTimeout(() => {
      startLoading();
    }, retryDelay);
  }, [loadingState.retryCount, maxRetries, retryDelay, onRetry, startLoading, setError]);

  const reset = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }

    setLoadingState({
      isLoading: false,
      error: null,
      retryCount: 0,
      lastRetry: null
    });
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  const actions: LoadingActions = {
    startLoading,
    stopLoading,
    setError,
    retry,
    reset
  };

  return {
    ...loadingState,
    actions,
    canRetry: loadingState.retryCount < maxRetries,
    isRetrying: loadingState.retryCount > 0
  };
};

// Higher-order component for loading states
export const withLoadingStates = <P extends object>(
  Component: React.ComponentType<P>,
  options: LoadingOptions = {}
) => {
  return (props: P) => {
    const loadingStates = useLoadingStates(options);
    return <Component {...props} loadingStates={loadingStates} />;
  };
};

// Loading spinner component
export const LoadingSpinner: React.FC<{
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
}> = ({ size = 'md', text, className = '' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className={`animate-spin rounded-full border-b-2 border-blue-600 ${sizeClasses[size]}`}></div>
      {text && (
        <p className="mt-2 text-sm text-gray-600">{text}</p>
      )}
    </div>
  );
};

// Error display component
export const ErrorDisplay: React.FC<{
  error: string;
  onRetry?: () => void;
  canRetry?: boolean;
  className?: string;
}> = ({ error, onRetry, canRetry = true, className = '' }) => {
  return (
    <div className={`flex flex-col items-center justify-center p-4 ${className}`}>
      <div className="text-red-500 text-lg font-semibold mb-2">Error</div>
      <div className="text-gray-600 text-sm mb-4 text-center">{error}</div>
      {onRetry && canRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Try Again
        </button>
      )}
    </div>
  );
};

// Loading overlay component
export const LoadingOverlay: React.FC<{
  isLoading: boolean;
  text?: string;
  children: React.ReactNode;
}> = ({ isLoading, text, children }) => {
  if (!isLoading) {
    return <>{children}</>;
  }

  return (
    <div className="relative">
      {children}
      <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
        <LoadingSpinner size="lg" text={text} />
      </div>
    </div>
  );
};

// Skeleton loading component
export const SkeletonLoader: React.FC<{
  lines?: number;
  className?: string;
}> = ({ lines = 3, className = '' }) => {
  return (
    <div className={`animate-pulse ${className}`}>
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className={`h-4 bg-gray-200 rounded mb-2 ${
            index === lines - 1 ? 'w-3/4' : 'w-full'
          }`}
        />
      ))}
    </div>
  );
};

// Table skeleton loader
export const TableSkeletonLoader: React.FC<{
  rows?: number;
  columns?: number;
  className?: string;
}> = ({ rows = 5, columns = 4, className = '' }) => {
  return (
    <div className={`animate-pulse ${className}`}>
      <div className="space-y-4">
        {/* Header */}
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {Array.from({ length: columns }).map((_, index) => (
            <div key={index} className="h-4 bg-gray-200 rounded" />
          ))}
        </div>
        
        {/* Rows */}
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
            {Array.from({ length: columns }).map((_, colIndex) => (
              <div key={colIndex} className="h-4 bg-gray-200 rounded" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

// Card skeleton loader
export const CardSkeletonLoader: React.FC<{
  className?: string;
}> = ({ className = '' }) => {
  return (
    <div className={`animate-pulse bg-white rounded-lg shadow p-6 ${className}`}>
      <div className="flex items-center mb-4">
        <div className="w-8 h-8 bg-gray-200 rounded-full mr-3" />
        <div className="h-4 bg-gray-200 rounded w-1/3" />
      </div>
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 rounded w-full" />
        <div className="h-4 bg-gray-200 rounded w-2/3" />
        <div className="h-4 bg-gray-200 rounded w-1/2" />
      </div>
    </div>
  );
};

export default useLoadingStates;

































