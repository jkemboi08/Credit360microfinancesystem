import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useSupabaseQuery } from '../hooks/useSupabase';
import {
  ArrowLeft, Download, RefreshCw, Search, Filter, Calendar,
  FileText, Calculator, TrendingUp, AlertCircle, CheckCircle, BarChart3
} from 'lucide-react';

interface BalanceSheetItem {
  category: string;
  subcategory: string;
  amount: number;
  isAsset: boolean;
  isCurrent: boolean;
}

const BalanceSheetPage: React.FC = () => {
  const [balanceSheet, setBalanceSheet] = useState<BalanceSheetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('current');
  const [totalAssets, setTotalAssets] = useState(0);
  const [totalLiabilities, setTotalLiabilities] = useState(0);
  const [totalEquity, setTotalEquity] = useState(0);

  // Fetch real data from Supabase
  const { data: chartOfAccounts, loading: accountsLoading } = useSupabaseQuery('chart_of_accounts', {
    select: '*',
    orderBy: { column: 'account_code', ascending: true }
  });

  const { data: trialBalance, loading: trialBalanceLoading } = useSupabaseQuery('trial_balance', {
    select: '*',
    orderBy: { column: 'account_code', ascending: true }
  });

  // Calculate balance sheet from real data
  const calculateBalanceSheet = () => {
    if (!chartOfAccounts || !trialBalance) return [];

    const balanceSheetData: BalanceSheetItem[] = [];
    
    // Group accounts by type and category
    const accountsByType = chartOfAccounts.reduce((acc, account) => {
      const type = account.account_type;
      if (!acc[type]) acc[type] = [];
      acc[type].push(account);
      return acc;
    }, {} as any);

    // Process Assets
    if (accountsByType.asset) {
      const currentAssets = accountsByType.asset.filter(acc => 
        acc.account_category?.toLowerCase().includes('current')
      );
      const nonCurrentAssets = accountsByType.asset.filter(acc => 
        !acc.account_category?.toLowerCase().includes('current')
      );

      // Current Assets
      const currentAssetsTotal = currentAssets.reduce((sum, acc) => {
        const tbAccount = trialBalance.find(tb => tb.account_id === acc.id);
        return sum + (tbAccount ? (tbAccount.debit_balance - tbAccount.credit_balance) : 0);
      }, 0);

      balanceSheetData.push({
        category: 'ASSETS',
        subcategory: 'Current Assets',
        amount: currentAssetsTotal,
        isAsset: true,
        isCurrent: true
      });

      // Non-Current Assets
      const nonCurrentAssetsTotal = nonCurrentAssets.reduce((sum, acc) => {
        const tbAccount = trialBalance.find(tb => tb.account_id === acc.id);
        return sum + (tbAccount ? (tbAccount.debit_balance - tbAccount.credit_balance) : 0);
      }, 0);

      balanceSheetData.push({
        category: 'ASSETS',
        subcategory: 'Non-Current Assets',
        amount: nonCurrentAssetsTotal,
        isAsset: true,
        isCurrent: false
      });
    }

    // Process Liabilities
    if (accountsByType.liability) {
      const currentLiabilities = accountsByType.liability.filter(acc => 
        acc.account_category?.toLowerCase().includes('current')
      );
      const nonCurrentLiabilities = accountsByType.liability.filter(acc => 
        !acc.account_category?.toLowerCase().includes('current')
      );

      // Current Liabilities
      const currentLiabilitiesTotal = currentLiabilities.reduce((sum, acc) => {
        const tbAccount = trialBalance.find(tb => tb.account_id === acc.id);
        return sum + (tbAccount ? (tbAccount.credit_balance - tbAccount.debit_balance) : 0);
      }, 0);

      balanceSheetData.push({
        category: 'LIABILITIES',
        subcategory: 'Current Liabilities',
        amount: currentLiabilitiesTotal,
        isAsset: false,
        isCurrent: true
      });

      // Non-Current Liabilities
      const nonCurrentLiabilitiesTotal = nonCurrentLiabilities.reduce((sum, acc) => {
        const tbAccount = trialBalance.find(tb => tb.account_id === acc.id);
        return sum + (tbAccount ? (tbAccount.credit_balance - tbAccount.debit_balance) : 0);
      }, 0);

      balanceSheetData.push({
        category: 'LIABILITIES',
        subcategory: 'Non-Current Liabilities',
        amount: nonCurrentLiabilitiesTotal,
        isAsset: false,
        isCurrent: false
      });
    }

    // Process Equity
    if (accountsByType.equity) {
      const equityTotal = accountsByType.equity.reduce((sum, acc) => {
        const tbAccount = trialBalance.find(tb => tb.account_id === acc.id);
        return sum + (tbAccount ? (tbAccount.credit_balance - tbAccount.debit_balance) : 0);
      }, 0);

      balanceSheetData.push({
        category: 'EQUITY',
        subcategory: 'Share Capital',
        amount: equityTotal,
        isAsset: false,
        isCurrent: false
      });
    }

    return balanceSheetData;
  };

  // Update balance sheet when data changes
  useEffect(() => {
    if (chartOfAccounts && trialBalance) {
      const balanceSheetData = calculateBalanceSheet();
      setBalanceSheet(balanceSheetData);
      
      // Calculate totals
      const assets = balanceSheetData.filter(item => item.isAsset);
      const liabilities = balanceSheetData.filter(item => !item.isAsset && item.category === 'LIABILITIES');
      const equity = balanceSheetData.filter(item => !item.isAsset && item.category === 'EQUITY');
      
      setTotalAssets(assets.reduce((sum, item) => sum + item.amount, 0));
      setTotalLiabilities(liabilities.reduce((sum, item) => sum + item.amount, 0));
      setTotalEquity(equity.reduce((sum, item) => sum + item.amount, 0));
      setLoading(false);
    }
  }, [chartOfAccounts, trialBalance]);

  // Fallback to mock data if no real data available
  useEffect(() => {
    if (!chartOfAccounts || !trialBalance) {
      const mockData: BalanceSheetItem[] = [
      // Assets
      { category: 'ASSETS', subcategory: 'Current Assets', amount: 40000000, isAsset: true, isCurrent: true },
      { category: 'ASSETS', subcategory: 'Cash and Cash Equivalents', amount: 25000000, isAsset: true, isCurrent: true },
      { category: 'ASSETS', subcategory: 'Accounts Receivable', amount: 15000000, isAsset: true, isCurrent: true },
      
      { category: 'ASSETS', subcategory: 'Non-Current Assets', amount: 575000000, isAsset: true, isCurrent: false },
      { category: 'ASSETS', subcategory: 'Loan Portfolio', amount: 500000000, isAsset: true, isCurrent: false },
      { category: 'ASSETS', subcategory: 'Property, Plant & Equipment', amount: 75000000, isAsset: true, isCurrent: false },
      
      // Liabilities
      { category: 'LIABILITIES', subcategory: 'Current Liabilities', amount: 188500000, isAsset: false, isCurrent: true },
      { category: 'LIABILITIES', subcategory: 'Customer Deposits', amount: 180000000, isAsset: false, isCurrent: true },
      { category: 'LIABILITIES', subcategory: 'Accrued Expenses', amount: 8500000, isAsset: false, isCurrent: true },
      
      { category: 'LIABILITIES', subcategory: 'Non-Current Liabilities', amount: 200000000, isAsset: false, isCurrent: false },
      { category: 'LIABILITIES', subcategory: 'Long-term Borrowings', amount: 200000000, isAsset: false, isCurrent: false },
      
      // Equity
      { category: 'EQUITY', subcategory: 'Share Capital', amount: 100000000, isAsset: false, isCurrent: false },
      { category: 'EQUITY', subcategory: 'Retained Earnings', amount: 45000000, isAsset: false, isCurrent: false },
      { category: 'EQUITY', subcategory: 'Current Year Profit', amount: 25000000, isAsset: false, isCurrent: false }
    ];

      setBalanceSheet(mockData);
      
      // Calculate totals
      const totalAssets = mockData.filter(item => item.isAsset).reduce((sum, item) => sum + item.amount, 0);
      const totalLiabilities = mockData.filter(item => !item.isAsset && item.category === 'LIABILITIES').reduce((sum, item) => sum + item.amount, 0);
      const totalEquity = mockData.filter(item => !item.isAsset && item.category === 'EQUITY').reduce((sum, item) => sum + item.amount, 0);
      
      setTotalAssets(totalAssets);
      setTotalLiabilities(totalLiabilities);
      setTotalEquity(totalEquity);
      
      setLoading(false);
    }
  }, [chartOfAccounts, trialBalance]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'ASSETS': return 'text-blue-600 bg-blue-50';
      case 'LIABILITIES': return 'text-red-600 bg-red-50';
      case 'EQUITY': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const handleExport = () => {
    const csvContent = [
      ['Category', 'Subcategory', 'Amount'],
      ...balanceSheet.map(item => [
        item.category,
        item.subcategory,
        item.amount.toLocaleString()
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `balance-sheet-${selectedPeriod}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading balance sheet...</p>
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
              <h2 className="text-xl font-semibold text-gray-700">Balance Sheet</h2>
              <p className="text-gray-600">Financial position as of {selectedPeriod} period</p>
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
              <BarChart3 className="w-8 h-8 text-blue-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Total Assets</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalAssets)}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center">
              <TrendingUp className="w-8 h-8 text-red-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Total Liabilities</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalLiabilities)}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center">
              <CheckCircle className="w-8 h-8 text-green-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Total Equity</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalEquity)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Balance Sheet Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Balance Sheet Details</h3>
            <p className="text-sm text-gray-600">Assets, Liabilities, and Equity breakdown</p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subcategory</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {balanceSheet.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getCategoryColor(item.category)}`}>
                        {item.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {item.subcategory}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-medium">
                      {formatCurrency(item.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr className="font-bold text-lg">
                  <td colSpan={2} className="px-6 py-4 text-right text-gray-900">
                    TOTAL ASSETS:
                  </td>
                  <td className="px-6 py-4 text-right text-gray-900">
                    {formatCurrency(totalAssets)}
                  </td>
                </tr>
                <tr className="font-bold text-lg">
                  <td colSpan={2} className="px-6 py-4 text-right text-gray-900">
                    TOTAL LIABILITIES:
                  </td>
                  <td className="px-6 py-4 text-right text-gray-900">
                    {formatCurrency(totalLiabilities)}
                  </td>
                </tr>
                <tr className="font-bold text-lg">
                  <td colSpan={2} className="px-6 py-4 text-right text-gray-900">
                    TOTAL EQUITY:
                  </td>
                  <td className="px-6 py-4 text-right text-gray-900">
                    {formatCurrency(totalEquity)}
                  </td>
                </tr>
                <tr className="font-bold text-lg border-t-2 border-gray-400">
                  <td colSpan={2} className="px-6 py-4 text-right text-gray-900">
                    LIABILITIES + EQUITY:
                  </td>
                  <td className="px-6 py-4 text-right text-gray-900">
                    {formatCurrency(totalLiabilities + totalEquity)}
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

export default BalanceSheetPage;
