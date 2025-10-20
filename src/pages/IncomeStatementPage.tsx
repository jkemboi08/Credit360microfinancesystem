import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useSupabaseQuery } from '../hooks/useSupabase';
import {
  ArrowLeft, Download, RefreshCw, Search, Filter, Calendar,
  FileText, Calculator, TrendingUp, AlertCircle, CheckCircle, BarChart3, DollarSign
} from 'lucide-react';

interface IncomeStatementItem {
  category: string;
  subcategory: string;
  amount: number;
  isRevenue: boolean;
  isExpense: boolean;
  isSubtotal: boolean;
}

const IncomeStatementPage: React.FC = () => {
  const [incomeStatement, setIncomeStatement] = useState<IncomeStatementItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('current');
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [netIncome, setNetIncome] = useState(0);

  // Fetch real data from Supabase
  const { data: chartOfAccounts, loading: accountsLoading } = useSupabaseQuery('chart_of_accounts', {
    select: '*',
    orderBy: { column: 'account_code', ascending: true }
  });

  const { data: trialBalance, loading: trialBalanceLoading } = useSupabaseQuery('trial_balance', {
    select: '*',
    orderBy: { column: 'account_code', ascending: true }
  });

  // Calculate income statement from real data
  const calculateIncomeStatement = () => {
    if (!chartOfAccounts || !trialBalance) return [];

    const incomeStatementData: IncomeStatementItem[] = [];
    
    // Group accounts by type and category
    const accountsByType = chartOfAccounts.reduce((acc, account) => {
      const type = account.account_type;
      if (!acc[type]) acc[type] = [];
      acc[type].push(account);
      return acc;
    }, {} as any);

    // Process Revenue (Income accounts)
    if (accountsByType.income) {
      const revenueTotal = accountsByType.income.reduce((sum, acc) => {
        const tbAccount = trialBalance.find(tb => tb.account_id === acc.id);
        return sum + (tbAccount ? (tbAccount.credit_balance - tbAccount.debit_balance) : 0);
      }, 0);

      incomeStatementData.push({
        category: 'REVENUE',
        subcategory: 'Interest Income',
        amount: revenueTotal,
        isRevenue: true,
        isExpense: false
      });
    }

    // Process Expenses
    if (accountsByType.expense) {
      const expenseTotal = accountsByType.expense.reduce((sum, acc) => {
        const tbAccount = trialBalance.find(tb => tb.account_id === acc.id);
        return sum + (tbAccount ? (tbAccount.debit_balance - tbAccount.credit_balance) : 0);
      }, 0);

      incomeStatementData.push({
        category: 'EXPENSES',
        subcategory: 'Operating Expenses',
        amount: expenseTotal,
        isRevenue: false,
        isExpense: true
      });
    }

    return incomeStatementData;
  };

  // Update income statement when data changes
  useEffect(() => {
    if (chartOfAccounts && trialBalance) {
      const incomeStatementData = calculateIncomeStatement();
      setIncomeStatement(incomeStatementData);
      
      // Calculate totals
      const revenue = incomeStatementData.filter(item => item.isRevenue);
      const expenses = incomeStatementData.filter(item => item.isExpense);
      
      setTotalRevenue(revenue.reduce((sum, item) => sum + item.amount, 0));
      setTotalExpenses(expenses.reduce((sum, item) => sum + item.amount, 0));
      setNetIncome(totalRevenue - totalExpenses);
      setLoading(false);
    }
  }, [chartOfAccounts, trialBalance]);

  // Fallback to mock data if no real data available
  useEffect(() => {
    if (!chartOfAccounts || !trialBalance) {
      const mockData: IncomeStatementItem[] = [
      // Revenue
      { category: 'REVENUE', subcategory: 'Interest Income', amount: 35000000, isRevenue: true, isExpense: false, isSubtotal: false },
      { category: 'REVENUE', subcategory: 'Fee Income', amount: 8500000, isRevenue: true, isExpense: false, isSubtotal: false },
      { category: 'REVENUE', subcategory: 'Other Income', amount: 2000000, isRevenue: true, isExpense: false, isSubtotal: false },
      { category: 'REVENUE', subcategory: 'TOTAL REVENUE', amount: 45500000, isRevenue: true, isExpense: false, isSubtotal: true },
      
      // Expenses
      { category: 'EXPENSES', subcategory: 'Interest Expense', amount: 12000000, isRevenue: false, isExpense: true, isSubtotal: false },
      { category: 'EXPENSES', subcategory: 'Staff Costs', amount: 18000000, isRevenue: false, isExpense: true, isSubtotal: false },
      { category: 'EXPENSES', subcategory: 'Administrative Expenses', amount: 8000000, isRevenue: false, isExpense: true, isSubtotal: false },
      { category: 'EXPENSES', subcategory: 'Depreciation', amount: 5000000, isRevenue: false, isExpense: true, isSubtotal: false },
      { category: 'EXPENSES', subcategory: 'Other Expenses', amount: 3000000, isRevenue: false, isExpense: true, isSubtotal: false },
      { category: 'EXPENSES', subcategory: 'TOTAL EXPENSES', amount: 46000000, isRevenue: false, isExpense: true, isSubtotal: true },
      
      // Net Income
      { category: 'NET INCOME', subcategory: 'NET INCOME', amount: -500000, isRevenue: false, isExpense: false, isSubtotal: false }
    ];

      setIncomeStatement(mockData);
      
      // Calculate totals
      const totalRevenue = mockData.filter(item => item.isRevenue && !item.isSubtotal).reduce((sum, item) => sum + item.amount, 0);
      const totalExpenses = mockData.filter(item => item.isExpense && !item.isSubtotal).reduce((sum, item) => sum + item.amount, 0);
      const netIncome = totalRevenue - totalExpenses;
      
      setTotalRevenue(totalRevenue);
      setTotalExpenses(totalExpenses);
      setNetIncome(netIncome);
      
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

  const getCategoryColor = (category: string, isSubtotal: boolean) => {
    if (isSubtotal) {
      return 'text-gray-900 bg-gray-100 font-bold';
    }
    switch (category) {
      case 'REVENUE': return 'text-green-600 bg-green-50';
      case 'EXPENSES': return 'text-red-600 bg-red-50';
      case 'NET INCOME': return netIncome >= 0 ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const handleExport = () => {
    const csvContent = [
      ['Category', 'Subcategory', 'Amount'],
      ...incomeStatement.map(item => [
        item.category,
        item.subcategory,
        item.amount.toLocaleString()
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `income-statement-${selectedPeriod}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading income statement...</p>
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
              <h2 className="text-xl font-semibold text-gray-700">Income Statement</h2>
              <p className="text-gray-600">Profit and loss for {selectedPeriod} period</p>
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
              <DollarSign className="w-8 h-8 text-green-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalRevenue)}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center">
              <TrendingUp className="w-8 h-8 text-red-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Total Expenses</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalExpenses)}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center">
              {netIncome >= 0 ? (
                <CheckCircle className="w-8 h-8 text-green-600 mr-3" />
              ) : (
                <AlertCircle className="w-8 h-8 text-red-600 mr-3" />
              )}
              <div>
                <p className="text-sm text-gray-600">Net Income</p>
                <p className={`text-2xl font-bold ${netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(netIncome)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Income Statement Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Income Statement Details</h3>
            <p className="text-sm text-gray-600">Revenue, expenses, and net income breakdown</p>
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
                {incomeStatement.map((item, index) => (
                  <tr key={index} className={`hover:bg-gray-50 ${item.isSubtotal ? 'border-t border-gray-300' : ''}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getCategoryColor(item.category, item.isSubtotal)}`}>
                        {item.category}
                      </span>
                    </td>
                    <td className={`px-6 py-4 text-sm ${item.isSubtotal ? 'font-bold text-gray-900' : 'text-gray-900'}`}>
                      {item.subcategory}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-medium ${item.isSubtotal ? 'text-gray-900' : 'text-gray-900'}`}>
                      {formatCurrency(item.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IncomeStatementPage;
