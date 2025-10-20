import { useState, useEffect } from 'react';
import TopUpService from '../services/topUpService';
import { TopUpRequest, WorkflowStep } from '../types/topUp.types';

export const useTopUpRequests = (filters?: {
  status?: string;
  clientId?: string;
  page?: number;
  limit?: number;
}) => {
  const [requests, setRequests] = useState<TopUpRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadRequests();
  }, [filters]);

  const loadRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await TopUpService.getAllTopUpRequests(filters);
      setRequests(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load top-up requests');
    } finally {
      setLoading(false);
    }
  };

  const refresh = () => {
    loadRequests();
  };

  return {
    requests,
    loading,
    error,
    refresh
  };
};

export const useTopUpRequest = (id: string) => {
  const [request, setRequest] = useState<TopUpRequest | null>(null);
  const [workflowSteps, setWorkflowSteps] = useState<WorkflowStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadRequest();
    }
  }, [id]);

  const loadRequest = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [requestData, workflowData] = await Promise.all([
        TopUpService.getTopUpRequestById(id),
        TopUpService.getWorkflowSteps(id)
      ]);
      
      setRequest(requestData);
      setWorkflowSteps(workflowData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load top-up request');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (status: string, updatedBy: string, comments?: string) => {
    try {
      await TopUpService.updateTopUpRequestStatus(id, status, updatedBy, comments);
      await loadRequest(); // Refresh data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status');
      throw err;
    }
  };

  const refresh = () => {
    loadRequest();
  };

  return {
    request,
    workflowSteps,
    loading,
    error,
    updateStatus,
    refresh
  };
};

export const useTopUpStatistics = () => {
  const [statistics, setStatistics] = useState({
    totalRequests: 0,
    pendingRequests: 0,
    approvedRequests: 0,
    disbursedRequests: 0,
    rejectedRequests: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStatistics();
  }, []);

  const loadStatistics = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await TopUpService.getTopUpStatistics();
      setStatistics(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  const refresh = () => {
    loadStatistics();
  };

  return {
    statistics,
    loading,
    error,
    refresh
  };
};

export const useTopUpSubmission = () => {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitRequest = async (requestData: Partial<TopUpRequest>) => {
    try {
      setSubmitting(true);
      setError(null);
      const result = await TopUpService.submitTopUpRequest(requestData);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit top-up request';
      setError(errorMessage);
      throw err;
    } finally {
      setSubmitting(false);
    }
  };

  return {
    submitRequest,
    submitting,
    error
  };
};







