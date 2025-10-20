import { useState, useEffect, useCallback } from 'react';
import { loanProcessingService, type LoanApplication, type ProcessingMetrics } from '../services/loanProcessingService';
import { realtimeService, type RealtimeUpdate } from '../services/realtimeService';

export interface UseLoanProcessingOptions {
  filters?: {
    status?: string;
    assigned_to?: string;
    priority?: string;
    date_from?: string;
    date_to?: string;
    search?: string;
  };
  enableRealtime?: boolean;
  pageSize?: number;
}

export interface UseLoanProcessingReturn {
  applications: LoanApplication[];
  metrics: ProcessingMetrics | null;
  loading: boolean;
  error: string | null;
  totalCount: number;
  currentPage: number;
  totalPages: number;
  refresh: () => Promise<void>;
  updateApplication: (id: string, updates: Partial<LoanApplication>) => Promise<void>;
  processKYC: (id: string) => Promise<void>;
  processCRB: (id: string) => Promise<void>;
  processAssessment: (id: string) => Promise<void>;
  processApproval: (id: string, decision: 'approved' | 'rejected', comments: string) => Promise<void>;
  nextPage: () => void;
  prevPage: () => void;
  goToPage: (page: number) => void;
  setFilters: (filters: UseLoanProcessingOptions['filters']) => void;
}

export const useRealtimeLoanProcessing = (options: UseLoanProcessingOptions = {}): UseLoanProcessingReturn => {
  const {
    filters = {},
    enableRealtime = true,
    pageSize = 10
  } = options;

  const [applications, setApplications] = useState<LoanApplication[]>([]);
  const [metrics, setMetrics] = useState<ProcessingMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [currentFilters, setCurrentFilters] = useState(filters);

  const totalPages = Math.ceil(totalCount / pageSize);

  // Fetch applications
  const fetchApplications = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      setError(null);

      const { data, count } = await loanProcessingService.getApplications({
        ...currentFilters,
        limit: pageSize,
        offset: (page - 1) * pageSize
      });

      setApplications(data);
      setTotalCount(count || 0);
      setCurrentPage(page);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch applications');
    } finally {
      setLoading(false);
    }
  }, [currentFilters, pageSize]);

  // Fetch metrics
  const fetchMetrics = useCallback(async () => {
    try {
      const data = await loanProcessingService.getProcessingMetrics();
      setMetrics(data);
    } catch (err) {
      console.error('Failed to fetch metrics:', err);
    }
  }, []);

  // Refresh data
  const refresh = useCallback(async () => {
    await Promise.all([
      fetchApplications(currentPage),
      fetchMetrics()
    ]);
  }, [fetchApplications, fetchMetrics, currentPage]);

  // Update application
  const updateApplication = useCallback(async (id: string, updates: Partial<LoanApplication>) => {
    try {
      await loanProcessingService.updateApplicationStatus(
        id,
        updates.status || 'submitted',
        updates.processing_notes,
        updates.assigned_to
      );
      
      // Update local state
      setApplications(prev => 
        prev.map(app => 
          app.id === id ? { ...app, ...updates } : app
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update application');
    }
  }, []);

  // Process KYC
  const processKYC = useCallback(async (id: string) => {
    try {
      setLoading(true);
      await loanProcessingService.processKYCValidation(id, 'current-user-id');
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process KYC validation');
    } finally {
      setLoading(false);
    }
  }, [refresh]);

  // Process CRB
  const processCRB = useCallback(async (id: string) => {
    try {
      setLoading(true);
      await loanProcessingService.processCRBCheck(id, 'current-user-id');
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process CRB check');
    } finally {
      setLoading(false);
    }
  }, [refresh]);

  // Process assessment
  const processAssessment = useCallback(async (id: string) => {
    try {
      setLoading(true);
      await loanProcessingService.processCreditAssessment(id, 'current-user-id');
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process credit assessment');
    } finally {
      setLoading(false);
    }
  }, [refresh]);

  // Process approval
  const processApproval = useCallback(async (id: string, decision: 'approved' | 'rejected', comments: string) => {
    try {
      setLoading(true);
      await loanProcessingService.processApproval(id, decision, comments, 'current-user-id');
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process approval');
    } finally {
      setLoading(false);
    }
  }, [refresh]);

  // Pagination
  const nextPage = useCallback(() => {
    if (currentPage < totalPages) {
      fetchApplications(currentPage + 1);
    }
  }, [currentPage, totalPages, fetchApplications]);

  const prevPage = useCallback(() => {
    if (currentPage > 1) {
      fetchApplications(currentPage - 1);
    }
  }, [currentPage, fetchApplications]);

  const goToPage = useCallback((page: number) => {
    if (page >= 1 && page <= totalPages) {
      fetchApplications(page);
    }
  }, [totalPages, fetchApplications]);

  // Set filters
  const setFilters = useCallback((newFilters: UseLoanProcessingOptions['filters']) => {
    setCurrentFilters(newFilters || {});
    setCurrentPage(1);
  }, []);

  // Handle real-time updates
  const handleRealtimeUpdate = useCallback((update: RealtimeUpdate) => {
    if (update.table === 'loan_applications') {
      switch (update.type) {
        case 'INSERT':
          setApplications(prev => [update.record, ...prev]);
          setTotalCount(prev => prev + 1);
          break;
        case 'UPDATE':
          setApplications(prev => 
            prev.map(app => 
              app.id === update.record.id ? { ...app, ...update.record } : app
            )
          );
          break;
        case 'DELETE':
          setApplications(prev => 
            prev.filter(app => app.id !== update.record.id)
          );
          setTotalCount(prev => Math.max(0, prev - 1));
          break;
      }
    }
  }, []);

  // Initial load
  useEffect(() => {
    refresh();
  }, [refresh]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!enableRealtime) return;

    const channel = realtimeService.subscribeToLoanApplications(handleRealtimeUpdate, currentFilters);
    const metricsChannel = realtimeService.subscribeToMetrics(setMetrics);

    return () => {
      realtimeService.unsubscribe('loan-applications-updates');
      realtimeService.unsubscribe('processing-metrics');
    };
  }, [enableRealtime, currentFilters, handleRealtimeUpdate]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      realtimeService.unsubscribeAll();
    };
  }, []);

  return {
    applications,
    metrics,
    loading,
    error,
    totalCount,
    currentPage,
    totalPages,
    refresh,
    updateApplication,
    processKYC,
    processCRB,
    processAssessment,
    processApproval,
    nextPage,
    prevPage,
    goToPage,
    setFilters
  };
};
