import { useState, useEffect, useCallback, useRef } from 'react';
import { AccountingService, ChartOfAccount, JournalEntry, GeneralLedgerEntry, FinancialPeriod, TrialBalance, FinancialRatio, Budget } from '../services/accountingService';

export const useAccountingData = () => {
  const [chartOfAccounts, setChartOfAccounts] = useState<ChartOfAccount[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [generalLedger, setGeneralLedger] = useState<GeneralLedgerEntry[]>([]);
  const [financialPeriods, setFinancialPeriods] = useState<FinancialPeriod[]>([]);
  const [trialBalance, setTrialBalance] = useState<TrialBalance[]>([]);
  const [financialRatios, setFinancialRatios] = useState<FinancialRatio[]>([]);
  const [budget, setBudget] = useState<Budget[]>([]);
  const [financialMetrics, setFinancialMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isLoadingRef = useRef(false); // Prevent multiple simultaneous loads

  // Load initial data
  const loadData = useCallback(async () => {
    // Prevent multiple simultaneous loads
    if (isLoadingRef.current) {
      console.log('Load data already in progress, skipping...');
      return;
    }

    try {
      isLoadingRef.current = true;
      setLoading(true);
      setError(null);
      console.log('🔄 Loading accounting data...');

      // Load basic data first
      const [
        chartResult,
        journalResult,
        ledgerResult,
        periodsResult
      ] = await Promise.all([
        AccountingService.getChartOfAccounts(),
        AccountingService.getJournalEntries(100),
        AccountingService.getGeneralLedger(),
        AccountingService.getFinancialPeriods()
      ]);

      // Set basic data
      if (chartResult.data) setChartOfAccounts(chartResult.data);
      if (journalResult.data) {
        console.log('🔍 useAccountingData: Journal entries loaded:', journalResult.data);
        setJournalEntries(journalResult.data);
      }
      if (ledgerResult.data) setGeneralLedger(ledgerResult.data);
      
      if (periodsResult.data) {
        setFinancialPeriods(periodsResult.data);
        
        // Load period-specific data for current period
        if (periodsResult.data.length > 0) {
          const currentPeriod = periodsResult.data[0];
          const [trialResult, ratiosResult, budgetResult, metricsResult] = await Promise.all([
            AccountingService.getTrialBalance(currentPeriod.id),
            AccountingService.getFinancialRatios(currentPeriod.id),
            AccountingService.getBudget(currentPeriod.id),
            AccountingService.getFinancialMetrics(currentPeriod.id)
          ]);
          
          if (trialResult.data) setTrialBalance(trialResult.data);
          if (ratiosResult.data) setFinancialRatios(ratiosResult.data);
          if (budgetResult.data) setBudget(budgetResult.data);
          if (metricsResult.data) setFinancialMetrics(metricsResult.data);
        }
      }

      // Check for errors and provide specific error messages
      const errors = [
        { source: 'Chart of Accounts', error: chartResult.error },
        { source: 'Journal Entries', error: journalResult.error },
        { source: 'General Ledger', error: ledgerResult.error },
        { source: 'Financial Periods', error: periodsResult.error }
      ].filter(item => item.error);

      if (errors.length > 0) {
        const errorMessage = errors.length === 1 
          ? `${errors[0].source}: ${errors[0].error}`
          : `Multiple errors: ${errors.map(e => e.source).join(', ')}`;
        setError(errorMessage);
        console.error('Accounting data loading errors:', errors);
      }
    } catch (err) {
      console.error('Error loading accounting data:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      
      // Check if it's a database connection issue
      if (errorMessage.includes('relation') || errorMessage.includes('does not exist')) {
        setError('Database tables not found. Please run the database migration first.');
      } else if (errorMessage.includes('auth') || errorMessage.includes('permission')) {
        setError('Authentication error. Please check your login status.');
      } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        setError('Network error. Please check your internet connection.');
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
      console.log('✅ Accounting data loading completed');
    }
  }, []); // No dependencies to prevent infinite loop

  // Load data for specific period
  const loadPeriodData = useCallback(async (periodId: string) => {
    try {
      setLoading(true);
      setError(null);

      const [trialResult, ratiosResult, budgetResult, metricsResult] = await Promise.all([
        AccountingService.getTrialBalance(periodId),
        AccountingService.getFinancialRatios(periodId),
        AccountingService.getBudget(periodId),
        AccountingService.getFinancialMetrics(periodId)
      ]);

      if (trialResult.data) setTrialBalance(trialResult.data);
      if (ratiosResult.data) setFinancialRatios(ratiosResult.data);
      if (budgetResult.data) setBudget(budgetResult.data);
      if (metricsResult.data) setFinancialMetrics(metricsResult.data);

      if (trialResult.error) setError(trialResult.error);
      if (ratiosResult.error) setError(ratiosResult.error);
      if (budgetResult.error) setError(budgetResult.error);
      if (metricsResult.error) setError(metricsResult.error);
    } catch (err) {
      console.error('Error loading period data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  // Set up real-time subscriptions (temporarily disabled to fix flashing)
  useEffect(() => {
    console.log('🔌 Setting up real-time subscriptions...');
    
    // Temporarily disable subscriptions to fix flashing issue
    // TODO: Re-enable once the flashing issue is resolved
    /*
    const subscriptions: any[] = [];

    // Subscribe to journal entries changes
    const journalSubscription = AccountingService.subscribeToJournalEntries((payload) => {
      console.log('📝 Journal entry change:', payload);
      if (payload.eventType === 'INSERT') {
        setJournalEntries(prev => [payload.new, ...prev]);
      } else if (payload.eventType === 'UPDATE') {
        setJournalEntries(prev => 
          prev.map(entry => entry.id === payload.new.id ? payload.new : entry)
        );
      } else if (payload.eventType === 'DELETE') {
        setJournalEntries(prev => 
          prev.filter(entry => entry.id !== payload.old.id)
        );
      }
    });

    // Subscribe to general ledger changes
    const ledgerSubscription = AccountingService.subscribeToGeneralLedger((payload) => {
      console.log('📊 General ledger change:', payload);
      if (payload.eventType === 'INSERT') {
        setGeneralLedger(prev => [payload.new, ...prev]);
      } else if (payload.eventType === 'UPDATE') {
        setGeneralLedger(prev => 
          prev.map(entry => entry.id === payload.new.id ? payload.new : entry)
        );
      } else if (payload.eventType === 'DELETE') {
        setGeneralLedger(prev => 
          prev.filter(entry => entry.id !== payload.old.id)
        );
      }
    });

    // Subscribe to trial balance changes
    const trialSubscription = AccountingService.subscribeToTrialBalance((payload) => {
      console.log('⚖️ Trial balance change:', payload);
      if (payload.eventType === 'INSERT') {
        setTrialBalance(prev => [payload.new, ...prev]);
      } else if (payload.eventType === 'UPDATE') {
        setTrialBalance(prev => 
          prev.map(entry => entry.id === payload.new.id ? payload.new : entry)
        );
      } else if (payload.eventType === 'DELETE') {
        setTrialBalance(prev => 
          prev.filter(entry => entry.id !== payload.old.id)
        );
      }
    });

    subscriptions.push(journalSubscription, ledgerSubscription, trialSubscription);

    // Cleanup subscriptions on unmount
    return () => {
      subscriptions.forEach(subscription => {
        if (subscription && subscription.unsubscribe) {
          subscription.unsubscribe();
        }
      });
    };
    */
  }, []);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []); // Only run once on mount

  // Refresh data
  const refreshData = useCallback(() => {
    loadData();
  }, []);

  // Create new journal entry
  const createJournalEntry = useCallback(async (entry: Omit<JournalEntry, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const result = await AccountingService.createJournalEntry(entry);
      if (result.data) {
        setJournalEntries(prev => [result.data!, ...prev]);
      }
      return result;
    } catch (err) {
      console.error('Error creating journal entry:', err);
      return { data: null, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  }, []);

  // Post journal entry
  const postJournalEntry = useCallback(async (journalEntryId: string) => {
    try {
      const result = await AccountingService.postJournalEntry(journalEntryId);
      if (result.data) {
        // Update journal entries state instead of reloading all data
        setJournalEntries(prev => 
          prev.map(entry => 
            entry.id === journalEntryId 
              ? { ...entry, status: 'posted' as const }
              : entry
          )
        );
      }
      return result;
    } catch (err) {
      console.error('Error posting journal entry:', err);
      return { data: null, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  }, []);

  // Generate trial balance
  const generateTrialBalance = useCallback(async (periodId: string) => {
    try {
      const result = await AccountingService.generateTrialBalance(periodId);
      if (result.data) {
        setTrialBalance(result.data);
      }
      return result;
    } catch (err) {
      console.error('Error generating trial balance:', err);
      return { data: null, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  }, []);

  return {
    // Data
    chartOfAccounts,
    journalEntries,
    generalLedger,
    financialPeriods,
    trialBalance,
    financialRatios,
    budget,
    financialMetrics,
    
    // State
    loading,
    error,
    
    // Actions
    loadData,
    loadPeriodData,
    refreshData,
    createJournalEntry,
    postJournalEntry,
    generateTrialBalance,
    
    // Setters for manual updates
    setChartOfAccounts,
    setJournalEntries,
    setGeneralLedger,
    setFinancialPeriods,
    setTrialBalance,
    setFinancialRatios,
    setBudget,
    setFinancialMetrics,
    setError
  };
};

export default useAccountingData;
