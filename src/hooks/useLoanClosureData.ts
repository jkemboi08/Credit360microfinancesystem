/**
 * Custom hook for loan closure data management
 * Provides reactive data fetching with error handling and caching
 */

import { useState, useEffect, useCallback } from 'react';
import LoanClosureDataService, { LoanClosureData, LoanClosureMetrics } from '../services/loanClosureDataService';

export interface UseLoanClosureDataResult {
  loans: LoanClosureData[];
  metrics: LoanClosureMetrics;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useLoanClosureData = (): UseLoanClosureDataResult => {
  const [loans, setLoans] = useState<LoanClosureData[]>([]);
  const [metrics, setMetrics] = useState<LoanClosureMetrics>({
    activeLoans: 0,
    readyForClosure: 0,
    closedThisMonth: 0,
    totalRecovered: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const service = LoanClosureDataService.getInstance();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔄 useLoanClosureData - Fetching data...');

      // Fetch loans and metrics in parallel
      const [loansResult, metricsResult] = await Promise.all([
        service.getLoansForClosure(),
        service.getLoanClosureMetrics()
      ]);

      if (!loansResult.success) {
        throw new Error(loansResult.error || 'Failed to fetch loans');
      }

      if (!metricsResult.success) {
        console.warn('⚠️ Failed to fetch metrics, using defaults:', metricsResult.error);
      }

      setLoans(loansResult.data || []);
      setMetrics(metricsResult.data || {
        activeLoans: 0,
        readyForClosure: 0,
        closedThisMonth: 0,
        totalRecovered: 0
      });

      console.log('✅ useLoanClosureData - Data fetched successfully:', {
        loansCount: loansResult.data?.length || 0,
        metrics: metricsResult.data
      });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('❌ useLoanClosureData - Error:', errorMessage);
      setError(errorMessage);
      
      // Set empty data on error to prevent UI crashes
      setLoans([]);
      setMetrics({
        activeLoans: 0,
        readyForClosure: 0,
        closedThisMonth: 0,
        totalRecovered: 0
      });
    } finally {
      setLoading(false);
    }
  }, [service]);

  const refetch = useCallback(async () => {
    console.log('🔄 useLoanClosureData - Manual refetch requested');
    service.clearCache();
    await fetchData();
  }, [service, fetchData]);

  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Set up periodic refresh (every 5 minutes)
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('🔄 useLoanClosureData - Periodic refresh');
      fetchData();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [fetchData]);

  return {
    loans,
    metrics,
    loading,
    error,
    refetch
  };
};




