import { useEffect, useCallback, useState } from 'react';
import { realTimeStatusService, StatusUpdateEvent } from '../services/realTimeStatusService';

export interface UseRealTimeStatusOptions {
  onStatusChange?: (event: StatusUpdateEvent) => void;
  onNewLoan?: (event: StatusUpdateEvent) => void;
  onLoanRemoved?: (event: StatusUpdateEvent) => void;
  enabled?: boolean;
}

export interface UseRealTimeStatusReturn {
  isConnected: boolean;
  lastUpdate: StatusUpdateEvent | null;
  error: string | null;
}

export const useRealTimeStatus = (options: UseRealTimeStatusOptions = {}): UseRealTimeStatusReturn => {
  const {
    onStatusChange,
    onNewLoan,
    onLoanRemoved,
    enabled = true
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<StatusUpdateEvent | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleStatusUpdate = useCallback((event: StatusUpdateEvent) => {
    try {
      setLastUpdate(event);
      setError(null);

      // Call appropriate callback based on event type
      switch (event.type) {
        case 'status_change':
          onStatusChange?.(event);
          break;
        case 'new_loan':
          onNewLoan?.(event);
          break;
        case 'loan_removed':
          onLoanRemoved?.(event);
          break;
      }
    } catch (err) {
      console.error('Error handling status update:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [onStatusChange, onNewLoan, onLoanRemoved]);

  useEffect(() => {
    if (!enabled) return;

    let unsubscribe: (() => void) | undefined;

    try {
      unsubscribe = realTimeStatusService.subscribe(handleStatusUpdate);
      setIsConnected(true);
      setError(null);
    } catch (err) {
      console.error('Error setting up real-time status subscription:', err);
      setError(err instanceof Error ? err.message : 'Failed to connect to real-time updates');
      setIsConnected(false);
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
        setIsConnected(false);
      }
    };
  }, [enabled, handleStatusUpdate]);

  return {
    isConnected,
    lastUpdate,
    error
  };
};








