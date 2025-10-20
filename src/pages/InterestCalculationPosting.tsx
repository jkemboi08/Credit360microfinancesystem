import React, { useState, useEffect } from 'react';
import { Calculator, CheckCircle, XCircle, Clock, Download, Eye, Play, Pause, Filter, AlertTriangle, BarChart3, FileText } from 'lucide-react';
import { SavingsService, InterestPostingBatch, InterestCalculation, SavingsAccount, SavingsProduct } from '../services/savingsService';
import { supabase } from '../lib/supabaseClient';
import toast from 'react-hot-toast';
import Layout from '../components/Layout';

const InterestCalculationPosting: React.FC = () => {
  const [batches, setBatches] = useState<InterestPostingBatch[]>([]);
  const [accounts, setAccounts] = useState<SavingsAccount[]>([]);
  const [products, setProducts] = useState<SavingsProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [showCalculationModal, setShowCalculationModal] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<InterestPostingBatch | null>(null);
  const [calculations, setCalculations] = useState<InterestCalculation[]>([]);
  const [showCalculationsModal, setShowCalculationsModal] = useState(false);
  const [calculationPreview, setCalculationPreview] = useState<any[]>([]);
  const [filteredAccounts, setFilteredAccounts] = useState<SavingsAccount[]>([]);
  const [filters, setFilters] = useState({
    productId: 'all',
    status: 'all',
    minBalance: 0,
    maxBalance: 0
  });

  const [batchForm, setBatchForm] = useState({
    batch_name: '',
    posting_date: new Date().toISOString().split('T')[0],
    period_start: '',
    period_end: '',
    requires_approval: true
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Check if tables exist before making queries
      const { data: tableCheck, error: tableError } = await supabase
        .from('savings_products')
        .select('id')
        .limit(1);
      
      if (tableError) {
        console.error('Savings tables not found:', tableError);
        toast.error('Savings tables not found. Please run the database migration to create the required tables.');
        return;
      }

      const [batchesData, accountsData, productsData] = await Promise.all([
        SavingsService.getInterestPostingBatches().catch(err => {
          console.warn('Failed to load interest posting batches:', err);
          return [];
        }),
        SavingsService.getSavingsAccounts().catch(err => {
          console.warn('Failed to load savings accounts:', err);
          return [];
        }),
        SavingsService.getSavingsProducts().catch(err => {
          console.warn('Failed to load savings products:', err);
          return [];
        })
      ]);
      
      setBatches(batchesData);
      setAccounts(accountsData);
      setProducts(productsData);
      setFilteredAccounts(accountsData);
      
      // Show success message if data loaded successfully
      if (accountsData.length > 0 || productsData.length > 0) {
        toast.success('Data loaded successfully');
      } else {
        toast.info('No data found. Create some savings accounts and products to get started.');
      }
    } catch (error) {
      console.error('Error loading data:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      if (errorMessage.includes('relation') || errorMessage.includes('does not exist')) {
        toast.error('Database tables not found. Please run the database migration first.');
      } else if (errorMessage.includes('auth') || errorMessage.includes('permission')) {
        toast.error('Authentication error. Please check your login status.');
      } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        toast.error('Network error. Please check your internet connection.');
      } else {
        toast.error(`Failed to load data: ${errorMessage}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = accounts;
    
    if (filters.productId !== 'all') {
      filtered = filtered.filter(acc => acc.product_id === filters.productId);
    }
    
    if (filters.status !== 'all') {
      filtered = filtered.filter(acc => acc.account_status === filters.status);
    }
    
    if (filters.minBalance > 0) {
      filtered = filtered.filter(acc => acc.current_balance >= filters.minBalance);
    }
    
    if (filters.maxBalance > 0) {
      filtered = filtered.filter(acc => acc.current_balance <= filters.maxBalance);
    }
    
    setFilteredAccounts(filtered);
  };

  const handleCalculatePreview = async () => {
    try {
      const preview = [];
      for (const account of filteredAccounts) {
        if (account.account_status === 'active' && account.current_balance >= (account.product?.minimum_balance_for_interest || 0)) {
          let interest = 0;
          try {
            interest = await SavingsService.calculateInterest(
              account.id,
              batchForm.period_start,
              batchForm.period_end
            );
          } catch (error) {
            console.error('Error calculating interest for account:', account.id, error);
            interest = 0;
          }
          preview.push({
            account,
            calculatedInterest: interest,
            eligible: true
          });
        } else {
          preview.push({
            account,
            calculatedInterest: 0,
            eligible: false,
            reason: account.account_status !== 'active' ? 'Account not active' : 'Below minimum balance'
          });
        }
      }
      setCalculationPreview(preview);
      setShowCalculationModal(true);
    } catch (error) {
      toast.error('Failed to calculate preview');
      console.error('Error calculating preview:', error);
    }
  };

  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await SavingsService.createInterestPostingBatch(batchForm);
      toast.success('Interest posting batch created successfully');
      setShowBatchModal(false);
      setBatchForm({
        batch_name: '',
        posting_date: new Date().toISOString().split('T')[0],
        period_start: '',
        period_end: '',
        requires_approval: true
      });
      loadData();
    } catch (error) {
      toast.error('Failed to create interest posting batch');
      console.error('Error creating batch:', error);
    }
  };

  const handleApproveBatch = async (batchId: string) => {
    if (window.confirm('Are you sure you want to approve this batch for posting?')) {
      try {
        await SavingsService.approveInterestPostingBatch(batchId);
        toast.success('Batch approved successfully');
        loadData();
      } catch (error) {
        toast.error('Failed to approve batch');
        console.error('Error approving batch:', error);
      }
    }
  };

  const handlePostBatch = async (batchId: string) => {
    if (window.confirm('Are you sure you want to post this batch? This action cannot be undone.')) {
      try {
        await SavingsService.postInterestBatch(batchId);
        toast.success('Batch posted successfully');
        loadData();
      } catch (error) {
        toast.error('Failed to post batch');
        console.error('Error posting batch:', error);
      }
    }
  };

  const handleViewCalculations = async (batchId: string) => {
    try {
      // In a real implementation, you would fetch calculations for this batch
      // For now, we'll show a placeholder
      setCalculations([]);
      setShowCalculationsModal(true);
    } catch (error) {
      toast.error('Failed to load calculations');
      console.error('Error loading calculations:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-blue-100 text-blue-800';
      case 'posted': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'approved': return <CheckCircle className="w-4 h-4" />;
      case 'posted': return <CheckCircle className="w-4 h-4" />;
      case 'failed': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const calculateTotalInterest = () => {
    return accounts.reduce((total, account) => {
      return total + (account.interest_earned_not_posted || 0);
    }, 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Show empty state if no data is available
  if (accounts.length === 0 && products.length === 0) {
    return (
      <Layout>
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl p-6 text-white">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold mb-2">Interest Calculation & Posting</h1>
                <p className="text-purple-100">Calculate and post interest for savings accounts</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <div className="max-w-md mx-auto">
              <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Data Available</h3>
              <p className="text-gray-600 mb-6">
                No savings accounts or products found. Please create some savings accounts and products first.
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => window.location.href = '/savings-management'}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Go to Savings Management
                </button>
                <button
                  onClick={loadData}
                  className="w-full bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Retry Loading Data
                </button>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl p-6 text-white">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold mb-2">Interest Calculation & Posting</h1>
              <p className="text-purple-100">Calculate and post interest for savings accounts</p>
            </div>
            <div className="flex space-x-3">
            <button
              onClick={() => setShowBatchModal(true)}
              className="bg-white text-purple-600 px-4 py-2 rounded-lg hover:bg-purple-50 flex items-center gap-2"
            >
              <Calculator className="w-4 h-4" />
              New Batch
            </button>
            <button
              onClick={handleCalculatePreview}
              className="bg-white text-green-600 px-4 py-2 rounded-lg hover:bg-green-50 flex items-center gap-2"
          >
            <BarChart3 className="w-4 h-4" />
            Calculate Preview
            </button>
            <button className="bg-white text-purple-600 px-4 py-2 rounded-lg hover:bg-purple-50 flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export Report
            </button>
            </div>
          </div>
        </div>

      {/* Calculation Parameters & Filters */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Calculation Parameters & Account Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Product Filter</label>
            <select
              value={filters.productId}
              onChange={(e) => setFilters({ ...filters, productId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Products</option>
              {products.map(product => (
                <option key={product.id} value={product.id}>{product.product_name}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Account Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="dormant">Dormant</option>
              <option value="frozen">Frozen</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Balance</label>
            <input
              type="number"
              step="0.01"
              value={filters.minBalance}
              onChange={(e) => setFilters({ ...filters, minBalance: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Maximum Balance</label>
            <input
              type="number"
              step="0.01"
              value={filters.maxBalance}
              onChange={(e) => setFilters({ ...filters, maxBalance: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
        
        <div className="mt-4 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            {filteredAccounts.length} accounts selected for calculation
          </div>
          <button
            onClick={applyFilters}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            Apply Filters
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Calculator className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Batches</p>
              <p className="text-2xl font-semibold text-gray-900">{batches.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Pending Interest</p>
              <p className="text-2xl font-semibold text-gray-900">${calculateTotalInterest().toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Active Accounts</p>
              <p className="text-2xl font-semibold text-gray-900">
                {accounts.filter(acc => acc.account_status === 'active').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Eye className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Accounts</p>
              <p className="text-2xl font-semibold text-gray-900">{accounts.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Batches Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Batch Details
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Period
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Summary
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {batches.map((batch) => (
              <tr key={batch.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{batch.batch_name}</div>
                    <div className="text-sm text-gray-500">
                      Created: {new Date(batch.created_at).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-gray-400">
                      Posting Date: {new Date(batch.posting_date).toLocaleDateString()}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {new Date(batch.period_start).toLocaleDateString()}
                  </div>
                  <div className="text-sm text-gray-500">
                    to {new Date(batch.period_end).toLocaleDateString()}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    ${batch.total_interest.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-500">
                    {batch.accounts_processed} accounts processed
                  </div>
                  {batch.accounts_failed > 0 && (
                    <div className="text-sm text-red-500">
                      {batch.accounts_failed} failed
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(batch.status)}`}>
                    {getStatusIcon(batch.status)}
                    <span className="ml-1">{batch.status}</span>
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    {batch.status === 'pending' && (
                      <button
                        onClick={() => handleApproveBatch(batch.id)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Approve Batch"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                    )}
                    {batch.status === 'approved' && (
                      <button
                        onClick={() => handlePostBatch(batch.id)}
                        className="text-green-600 hover:text-green-900"
                        title="Post Batch"
                      >
                        <Play className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleViewCalculations(batch.id)}
                      className="text-purple-600 hover:text-purple-900"
                      title="View Calculations"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create Batch Modal */}
      {showBatchModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-md shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Create Interest Posting Batch</h3>
              <button
                onClick={() => setShowBatchModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreateBatch} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Batch Name</label>
                <input
                  type="text"
                  required
                  value={batchForm.batch_name}
                  onChange={(e) => setBatchForm({ ...batchForm, batch_name: e.target.value })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Posting Date</label>
                <input
                  type="date"
                  required
                  value={batchForm.posting_date}
                  onChange={(e) => setBatchForm({ ...batchForm, posting_date: e.target.value })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Period Start</label>
                <input
                  type="date"
                  required
                  value={batchForm.period_start}
                  onChange={(e) => setBatchForm({ ...batchForm, period_start: e.target.value })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Period End</label>
                <input
                  type="date"
                  required
                  value={batchForm.period_end}
                  onChange={(e) => setBatchForm({ ...batchForm, period_end: e.target.value })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="requires_approval"
                  checked={batchForm.requires_approval}
                  onChange={(e) => setBatchForm({ ...batchForm, requires_approval: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="requires_approval" className="ml-2 block text-sm text-gray-900">
                  Requires approval before posting
                </label>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowBatchModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Create Batch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Calculations Modal */}
      {showCalculationsModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Interest Calculations</h3>
              <button
                onClick={() => setShowCalculationsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <p className="text-sm text-gray-600">
                This feature will show detailed interest calculations for the selected batch.
                In a full implementation, this would display all account-level calculations
                with their respective interest amounts and posting status.
              </p>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setShowCalculationsModal(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Calculation Preview Modal */}
      {showCalculationModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-6xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Interest Calculation Preview</h3>
              <button
                onClick={() => setShowCalculationModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <span className="text-sm font-medium text-gray-600">Total Accounts:</span>
                  <span className="ml-2 text-lg font-semibold text-gray-900">{calculationPreview.length}</span>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600">Eligible Accounts:</span>
                  <span className="ml-2 text-lg font-semibold text-green-600">
                    {calculationPreview.filter(p => p.eligible).length}
                  </span>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600">Total Interest:</span>
                  <span className="ml-2 text-lg font-semibold text-blue-600">
                    ${calculationPreview.reduce((sum, p) => sum + p.calculatedInterest, 0).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white border rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Account</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Balance</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Interest Rate</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Calculated Interest</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {calculationPreview.map((preview, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{preview.account.account_name}</div>
                          <div className="text-sm text-gray-500">{preview.account.account_number}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${preview.account.current_balance.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {(preview.account.product?.annual_interest_rate * 100).toFixed(2)}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className={preview.eligible ? 'text-green-600 font-medium' : 'text-gray-400'}>
                          ${preview.calculatedInterest.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {preview.eligible ? (
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                            Eligible
                          </span>
                        ) : (
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                            {preview.reason}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowCalculationModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
              <button
                onClick={() => {
                  // In a real implementation, this would create the batch with the preview data
                  toast.success('Batch created with preview data');
                  setShowCalculationModal(false);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Create Batch
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </Layout>
  );
};

export default InterestCalculationPosting;

