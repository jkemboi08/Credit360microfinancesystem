import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useSupabaseQuery } from '../hooks/useSupabase';
import { useAccountingData } from '../hooks/useAccountingData';
import {
  ArrowLeft, Download, RefreshCw, Search, Filter, Calendar,
  FileText, Calculator, TrendingUp, AlertCircle, CheckCircle, BarChart3, DollarSign, ArrowUpDown
} from 'lucide-react';

interface CashFlowItem {
  category: string;
  subcategory: string;
  amount: number;
  isOperating: boolean;
  isInvesting: boolean;
  isFinancing: boolean;
  isSubtotal: boolean;
  isNetChange: boolean;
}

const CashFlowPage: React.FC = () => {
  const [cashFlow, setCashFlow] = useState<CashFlowItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('current');
  const [operatingCashFlow, setOperatingCashFlow] = useState(0);
  const [investingCashFlow, setInvestingCashFlow] = useState(0);
  const [financingCashFlow, setFinancingCashFlow] = useState(0);
  const [netCashChange, setNetCashChange] = useState(0);
  const [beginningCash, setBeginningCash] = useState(0);
  const [endingCash, setEndingCash] = useState(0);

  // Fetch accounting data
  const { chartOfAccounts, trialBalance } = useAccountingData();

  // Calculate cash flow from real data
  const calculateCashFlow = () => {
    if (!chartOfAccounts || !trialBalance) return [];

    const cashFlowData: CashFlowItem[] = [];
    
    // Group accounts by type and category
    const accountsByType = chartOfAccounts.reduce((acc, account) => {
      const type = account.account_type;
      if (!acc[type]) acc[type] = [];
      acc[type].push(account);
      return acc;
    }, {} as any);

    // Process Operating Activities (Cash accounts)
    if (accountsByType.asset) {
      const cashAccounts = accountsByType.asset.filter(acc => 
        acc.account_name?.toLowerCase().includes('cash') || 
        acc.account_name?.toLowerCase().includes('bank')
      );

      const operatingCashFlow = cashAccounts.reduce((sum, acc) => {
        const tbAccount = trialBalance.find(tb => tb.account_id === acc.id);
        return sum + (tbAccount ? (tbAccount.debit_balance - tbAccount.credit_balance) : 0);
      }, 0);

      cashFlowData.push({
        category: 'OPERATING ACTIVITIES',
        subcategory: 'Cash from Operations',
        amount: operatingCashFlow,
        isOperating: true,
        isInvesting: false,
        isFinancing: false,
        isSubtotal: false,
        isNetChange: false
      });
    }

    // Process Investing Activities (Fixed Assets)
    if (accountsByType.asset) {
      const fixedAssets = accountsByType.asset.filter(acc => 
        acc.account_category?.toLowerCase().includes('fixed') ||
        acc.account_category?.toLowerCase().includes('property')
      );

      const investingCashFlow = fixedAssets.reduce((sum, acc) => {
        const tbAccount = trialBalance.find(tb => tb.account_id === acc.id);
        return sum + (tbAccount ? (tbAccount.debit_balance - tbAccount.credit_balance) : 0);
      }, 0);

      cashFlowData.push({
        category: 'INVESTING ACTIVITIES',
        subcategory: 'Fixed Asset Investments',
        amount: investingCashFlow,
        isOperating: false,
        isInvesting: true,
        isFinancing: false,
        isSubtotal: false,
        isNetChange: false
      });
    }

    // Process Financing Activities (Liabilities and Equity)
    if (accountsByType.liability || accountsByType.equity) {
      const financingAccounts = [
        ...(accountsByType.liability || []),
        ...(accountsByType.equity || [])
      ];

      const financingCashFlow = financingAccounts.reduce((sum, acc) => {
        const tbAccount = trialBalance.find(tb => tb.account_id === acc.id);
        if (acc.account_type === 'liability') {
          return sum + (tbAccount ? (tbAccount.credit_balance - tbAccount.debit_balance) : 0);
        } else {
          return sum + (tbAccount ? (tbAccount.credit_balance - tbAccount.debit_balance) : 0);
        }
      }, 0);

      cashFlowData.push({
        category: 'FINANCING ACTIVITIES',
        subcategory: 'Debt and Equity',
        amount: financingCashFlow,
        isOperating: false,
        isInvesting: false,
        isFinancing: true,
        isSubtotal: false,
        isNetChange: false
      });
    }

    return cashFlowData;
  };

  // Update cash flow when data changes
  useEffect(() => {
    if (chartOfAccounts && trialBalance) {
      const cashFlowData = calculateCashFlow();
      setCashFlow(cashFlowData);
      
      // Calculate totals
      const operating = cashFlowData.filter(item => item.isOperating);
      const investing = cashFlowData.filter(item => item.isInvesting);
      const financing = cashFlowData.filter(item => item.isFinancing);
      
      const operatingTotal = operating.reduce((sum, item) => sum + item.amount, 0);
      const investingTotal = investing.reduce((sum, item) => sum + item.amount, 0);
      const financingTotal = financing.reduce((sum, item) => sum + item.amount, 0);
      
      setOperatingCashFlow(operatingTotal);
      setInvestingCashFlow(investingTotal);
      setFinancingCashFlow(financingTotal);
      setNetCashChange(operatingTotal + investingTotal + financingTotal);
      setEndingCash(beginningCash + netCashChange);
      setLoading(false);
    }
  }, [chartOfAccounts, trialBalance]);

  // Fallback to mock data if no real data available
  useEffect(() => {
    if (!chartOfAccounts || !trialBalance) {
      const mockData: CashFlowItem[] = [
      // Operating Activities
      { category: 'OPERATING ACTIVITIES', subcategory: 'Net Income', amount: -500000, isOperating: true, isInvesting: false, isFinancing: false, isSubtotal: false, isNetChange: false },
      { category: 'OPERATING ACTIVITIES', subcategory: 'Depreciation', amount: 5000000, isOperating: true, isInvesting: false, isFinancing: false, isSubtotal: false, isNetChange: false },
      { category: 'OPERATING ACTIVITIES', subcategory: 'Changes in Working Capital', amount: 2000000, isOperating: true, isInvesting: false, isFinancing: false, isSubtotal: false, isNetChange: false },
      { category: 'OPERATING ACTIVITIES', subcategory: 'Net Cash from Operations', amount: 6500000, isOperating: true, isInvesting: false, isFinancing: false, isSubtotal: true, isNetChange: false },
      
      // Investing Activities
      { category: 'INVESTING ACTIVITIES', subcategory: 'Purchase of Equipment', amount: -10000000, isOperating: false, isInvesting: true, isFinancing: false, isSubtotal: false, isNetChange: false },
      { category: 'INVESTING ACTIVITIES', subcategory: 'Loan Disbursements', amount: -50000000, isOperating: false, isInvesting: true, isFinancing: false, isSubtotal: false, isNetChange: false },
      { category: 'INVESTING ACTIVITIES', subcategory: 'Loan Collections', amount: 45000000, isOperating: false, isInvesting: true, isFinancing: false, isSubtotal: false, isNetChange: false },
      { category: 'INVESTING ACTIVITIES', subcategory: 'Net Cash from Investing', amount: -15000000, isOperating: false, isInvesting: true, isFinancing: false, isSubtotal: true, isNetChange: false },
      
      // Financing Activities
      { category: 'FINANCING ACTIVITIES', subcategory: 'Customer Deposits', amount: 20000000, isOperating: false, isInvesting: false, isFinancing: true, isSubtotal: false, isNetChange: false },
      { category: 'FINANCING ACTIVITIES', subcategory: 'Borrowings', amount: 30000000, isOperating: false, isInvesting: false, isFinancing: true, isSubtotal: false, isNetChange: false },
      { category: 'FINANCING ACTIVITIES', subcategory: 'Dividend Payments', amount: -5000000, isOperating: false, isInvesting: false, isFinancing: true, isSubtotal: false, isNetChange: false },
      { category: 'FINANCING ACTIVITIES', subcategory: 'Net Cash from Financing', amount: 45000000, isOperating: false, isInvesting: false, isFinancing: true, isSubtotal: true, isNetChange: false },
      
      // Net Change
      { category: 'NET CHANGE', subcategory: 'Net Change in Cash', amount: 36500000, isOperating: false, isInvesting: false, isFinancing: false, isSubtotal: false, isNetChange: true },
      { category: 'CASH POSITION', subcategory: 'Beginning Cash', amount: 20000000, isOperating: false, isInvesting: false, isFinancing: false, isSubtotal: false, isNetChange: false },
      { category: 'CASH POSITION', subcategory: 'Ending Cash', amount: 56500000, isOperating: false, isInvesting: false, isFinancing: false, isSubtotal: false, isNetChange: false }
    ];

      setCashFlow(mockData);
      
      // Calculate totals
      const operatingCashFlow = mockData.filter(item => item.isOperating && !item.isSubtotal).reduce((sum, item) => sum + item.amount, 0);
      const investingCashFlow = mockData.filter(item => item.isInvesting && !item.isSubtotal).reduce((sum, item) => sum + item.amount, 0);
      const financingCashFlow = mockData.filter(item => item.isFinancing && !item.isSubtotal).reduce((sum, item) => sum + item.amount, 0);
      const netCashChange = operatingCashFlow + investingCashFlow + financingCashFlow;
      const beginningCash = 20000000;
      const endingCash = beginningCash + netCashChange;
      
      setOperatingCashFlow(operatingCashFlow);
      setInvestingCashFlow(investingCashFlow);
      setFinancingCashFlow(financingCashFlow);
      setNetCashChange(netCashChange);
      setBeginningCash(beginningCash);
      setEndingCash(endingCash);
      
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

  const getCategoryColor = (category: string, isSubtotal: boolean, isNetChange: boolean) => {
    if (isNetChange) {
      return 'text-blue-600 bg-blue-50 font-bold';
    }
    if (isSubtotal) {
      return 'text-gray-900 bg-gray-100 font-bold';
    }
    switch (category) {
      case 'OPERATING ACTIVITIES': return 'text-green-600 bg-green-50';
      case 'INVESTING ACTIVITIES': return 'text-blue-600 bg-blue-50';
      case 'FINANCING ACTIVITIES': return 'text-purple-600 bg-purple-50';
      case 'CASH POSITION': return 'text-orange-600 bg-orange-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const handleExport = () => {
    const csvContent = [
      ['Category', 'Subcategory', 'Amount'],
      ...cashFlow.map(item => [
        item.category,
        item.subcategory,
        item.amount.toLocaleString()
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cash-flow-${selectedPeriod}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading cash flow statement...</p>
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
              <h2 className="text-xl font-semibold text-gray-700">Cash Flow Statement</h2>
              <p className="text-gray-600">Cash movements for {selectedPeriod} period</p>
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center">
              <ArrowUpDown className="w-8 h-8 text-green-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Operating Cash Flow</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(operatingCashFlow)}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center">
              <BarChart3 className="w-8 h-8 text-blue-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Investing Cash Flow</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(investingCashFlow)}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center">
              <TrendingUp className="w-8 h-8 text-purple-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Financing Cash Flow</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(financingCashFlow)}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center">
              <DollarSign className="w-8 h-8 text-orange-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Net Cash Change</p>
                <p className={`text-2xl font-bold ${netCashChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(netCashChange)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Cash Flow Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Cash Flow Statement Details</h3>
            <p className="text-sm text-gray-600">Operating, investing, and financing activities</p>
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
                {cashFlow.map((item, index) => (
                  <tr key={index} className={`hover:bg-gray-50 ${item.isSubtotal || item.isNetChange ? 'border-t border-gray-300' : ''}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getCategoryColor(item.category, item.isSubtotal, item.isNetChange)}`}>
                        {item.category}
                      </span>
                    </td>
                    <td className={`px-6 py-4 text-sm ${item.isSubtotal || item.isNetChange ? 'font-bold text-gray-900' : 'text-gray-900'}`}>
                      {item.subcategory}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-medium ${item.isSubtotal || item.isNetChange ? 'text-gray-900' : 'text-gray-900'}`}>
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

export default CashFlowPage;
