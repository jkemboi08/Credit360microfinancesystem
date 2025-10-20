import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useSupabaseQuery } from '../hooks/useSupabase';
import { useAccountingData } from '../hooks/useAccountingData';
import {
  ArrowLeft, Download, RefreshCw, Search, Filter, Calendar,
  FileText, Calculator, TrendingUp, AlertCircle, CheckCircle
} from 'lucide-react';

interface TrialBalanceEntry {
  accountCode: string;
  accountName: string;
  debitBalance: number;
  creditBalance: number;
  accountType: 'Asset' | 'Liability' | 'Equity' | 'Revenue' | 'Expense';
}

const TrialBalancePage: React.FC = () => {
  const [trialBalance, setTrialBalance] = useState<TrialBalanceEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [selectedPeriod, setSelectedPeriod] = useState('current');
  const [totalDebits, setTotalDebits] = useState(0);
  const [totalCredits, setTotalCredits] = useState(0);

  // Fetch accounting data
  const { trialBalance: trialBalanceData, chartOfAccounts } = useAccountingData();

  // Convert Supabase data to trial balance format
  const convertToTrialBalance = () => {
    if (!trialBalanceData || !chartOfAccounts) return [];

    return trialBalanceData.map(tb => {
      const account = chartOfAccounts.find(acc => acc.id === tb.account_id);
      return {
        accountCode: account?.account_code || '',
        accountName: account?.account_name || '',
        debitBalance: tb.debit_balance || 0,
        creditBalance: tb.credit_balance || 0,
        accountType: account?.account_type || ''
      };
    });
  };

  // Update trial balance when data changes
  useEffect(() => {
    if (trialBalanceData && chartOfAccounts) {
      const trialBalanceEntries = convertToTrialBalance();
      setTrialBalance(trialBalanceEntries);
      
      // Calculate totals
      const totalDebits = trialBalanceEntries.reduce((sum, entry) => sum + entry.debitBalance, 0);
      const totalCredits = trialBalanceEntries.reduce((sum, entry) => sum + entry.creditBalance, 0);
      
      setTotalDebits(totalDebits);
      setTotalCredits(totalCredits);
      setLoading(false);
    }
  }, [trialBalanceData, chartOfAccounts]);

  // Show empty state if no real data available
  useEffect(() => {
    if (!trialBalanceData || !chartOfAccounts) {
      setTrialBalance([]);
      setTotalDebits(0);
      setTotalCredits(0);
      setLoading(false);
    }
  }, [trialBalanceData, chartOfAccounts]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const filteredData = trialBalance.filter(entry => {
    const matchesSearch = entry.accountName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.accountCode.includes(searchTerm);
    const matchesFilter = filterType === 'all' || entry.accountType === filterType;
    return matchesSearch && matchesFilter;
  });

  const handleExport = () => {
    const csvContent = [
      ['Account Code', 'Account Name', 'Account Type', 'Debit Balance', 'Credit Balance'],
      ...filteredData.map(entry => [
        entry.accountCode,
        entry.accountName,
        entry.accountType,
        entry.debitBalance.toLocaleString(),
        entry.creditBalance.toLocaleString()
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trial-balance-${selectedPeriod}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getAccountTypeColor = (type: string) => {
    switch (type) {
      case 'Asset': return 'text-blue-600 bg-blue-50';
      case 'Liability': return 'text-red-600 bg-red-50';
      case 'Equity': return 'text-green-600 bg-green-50';
      case 'Revenue': return 'text-purple-600 bg-purple-50';
      case 'Expense': return 'text-orange-600 bg-orange-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading trial balance...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => window.history.back()}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">RYTHM Microfinance Limited</h1>
              <h2 className="text-xl font-semibold text-gray-700">Trial Balance</h2>
              <p className="text-gray-600">Financial position overview for {selectedPeriod} period</p>
            </div>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handleExport}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center space-x-2">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search accounts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Account Types</option>
            <option value="Asset">Assets</option>
            <option value="Liability">Liabilities</option>
            <option value="Equity">Equity</option>
            <option value="Revenue">Revenue</option>
            <option value="Expense">Expenses</option>
          </select>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="current">Current Period</option>
            <option value="previous">Previous Period</option>
            <option value="ytd">Year to Date</option>
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center">
              <Calculator className="w-8 h-8 text-blue-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Total Debits</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalDebits)}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center">
              <TrendingUp className="w-8 h-8 text-green-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Total Credits</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalCredits)}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center">
              {Math.abs(totalDebits - totalCredits) < 1 ? (
                <CheckCircle className="w-8 h-8 text-green-600 mr-3" />
              ) : (
                <AlertCircle className="w-8 h-8 text-red-600 mr-3" />
              )}
              <div>
                <p className="text-sm text-gray-600">Balance Status</p>
                <p className={`text-2xl font-bold ${Math.abs(totalDebits - totalCredits) < 1 ? 'text-green-600' : 'text-red-600'}`}>
                  {Math.abs(totalDebits - totalCredits) < 1 ? 'Balanced' : 'Out of Balance'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Trial Balance Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Trial Balance Details</h3>
            <p className="text-sm text-gray-600">All accounts with their respective debit and credit balances</p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Account Code</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Account Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Debit Balance</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Credit Balance</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredData.map((entry, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {entry.accountCode}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {entry.accountName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getAccountTypeColor(entry.accountType)}`}>
                        {entry.accountType}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      {entry.debitBalance > 0 ? formatCurrency(entry.debitBalance) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      {entry.creditBalance > 0 ? formatCurrency(entry.creditBalance) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr className="font-semibold">
                  <td colSpan={3} className="px-6 py-4 text-right text-sm text-gray-900">
                    TOTALS:
                  </td>
                  <td className="px-6 py-4 text-right text-sm text-gray-900">
                    {formatCurrency(totalDebits)}
                  </td>
                  <td className="px-6 py-4 text-right text-sm text-gray-900">
                    {formatCurrency(totalCredits)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrialBalancePage;
