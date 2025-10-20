// Real-time Data Hook
// Provides React components with real-time data synchronization using Supabase

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { realtimeDataService, DataUpdateEvent, RealtimeDataUpdate, CrossModuleData } from '../services/realtimeDataService';

export interface UseRealtimeDataOptions {
  events?: DataUpdateEvent[];
  autoSync?: boolean;
  syncInterval?: number;
}

export const useRealtimeData = (options: UseRealtimeDataOptions = {}) => {
  const {
    events = ['expense_created', 'expense_updated', 'expense_approved', 'staff_salary_updated', 'bot_report_updated'],
    autoSync = true,
    syncInterval = 5000
  } = options;

  const [crossModuleData, setCrossModuleData] = useState<CrossModuleData | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isConnected, setIsConnected] = useState(true);
  const [updateCount, setUpdateCount] = useState(0);

  // Handle real-time updates
  const handleRealtimeUpdate = useCallback((update: RealtimeDataUpdate) => {
    console.log('Real-time update received:', update);
    
    // Update cross-module data
    const newData = realtimeDataService.getCrossModuleData();
    if (newData) {
      setCrossModuleData(newData);
      setLastUpdate(new Date());
      setUpdateCount(prev => prev + 1);
    }
  }, []);

  // Subscribe to real-time events
  useEffect(() => {
    const unsubscribeFunctions: (() => void)[] = [];

    events.forEach(eventType => {
      const unsubscribe = realtimeDataService.subscribe(eventType, handleRealtimeUpdate);
      unsubscribeFunctions.push(unsubscribe);
    });

    return () => {
      unsubscribeFunctions.forEach(unsubscribe => unsubscribe());
    };
  }, [events, handleRealtimeUpdate]);

  // Auto-sync mechanism
  useEffect(() => {
    if (!autoSync) return;

    const interval = setInterval(() => {
      realtimeDataService.forceSynchronization();
    }, syncInterval);

    return () => clearInterval(interval);
  }, [autoSync, syncInterval]);

  // Initial data load
  useEffect(() => {
    const initialData = realtimeDataService.getCrossModuleData();
    if (initialData) {
      setCrossModuleData(initialData);
      setLastUpdate(new Date());
    }
  }, []);

  // Force synchronization
  const forceSync = useCallback(() => {
    realtimeDataService.forceSynchronization();
  }, []);

  // Emit custom event
  const emitEvent = useCallback((eventType: DataUpdateEvent, data: any, userId?: string) => {
    realtimeDataService.emit(eventType, data, userId);
  }, []);

  return {
    crossModuleData,
    lastUpdate,
    isConnected,
    updateCount,
    forceSync,
    emitEvent
  };
};

// Specialized hooks for specific modules
export const useExpenseRealtimeData = () => {
  return useRealtimeData({
    events: ['expense_created', 'expense_updated', 'expense_approved', 'expense_rejected']
  });
};

export const useStaffRealtimeData = () => {
  return useRealtimeData({
    events: ['staff_salary_updated', 'staff_benefit_updated', 'expense_created']
  });
};

export const useBOTReportRealtimeData = () => {
  return useRealtimeData({
    events: ['expense_created', 'expense_updated', 'bot_report_updated']
  });
};

export const useBudgetRealtimeData = () => {
  return useRealtimeData({
    events: ['expense_created', 'expense_updated', 'budget_updated']
  });
};




























