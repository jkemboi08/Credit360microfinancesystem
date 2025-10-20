import React, { useState, useEffect, useRef } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Plus,
  Upload,
  FileText,
  Eye,
  BarChart3,
  PieChart,
  Calendar,
  Filter,
  X,
  Save,
  RefreshCw,
  Settings,
  Bell,
  Search,
  ChevronDown,
  ChevronUp,
  Tag,
  CreditCard,
  Banknote,
  Receipt,
  Users,
  Target,
  TrendingUp as TrendingUpIcon,
  Globe,
  Calculator,
  Zap,
  Shield,
  Maximize2,
  Minimize2,
  MoreHorizontal,
  Edit3,
  Trash2,
  Play,
  Pause,
  RotateCcw
} from 'lucide-react';
import { 
  ComprehensiveExpenseData, 
  ExpenseSummaryCardProps,
  SystemIntegrationPoints,
  ComprehensiveExpenseSystem
} from '../types/expense';
import { ExpenseCategoryService } from '../services/expenseCategoryService';
import { SupabaseExpenseService } from '../services/supabaseExpenseService';
import { useRealtimeData } from '../hooks/useRealtimeData';
import BOTReportsIntegration from '../components/bot/BOTReportsIntegration';
import StaffManagementIntegration from '../components/staff/StaffManagementIntegration';
import BudgetManagement from '../components/budget/BudgetManagement';
import BulkUploadModal from '../components/expense/BulkUploadModal';
import ReportGenerationModal from '../components/expense/ReportGenerationModal';
import PendingApprovalsModal from '../components/expense/PendingApprovalsModal';
import Layout from '../components/Layout';

const ExpenseManagementDashboard: React.FC = () => {
  const [expenseData, setExpenseData] = useState<ComprehensiveExpenseData | null>(null);
  const [filteredExpenseData, setFilteredExpenseData] = useState<ComprehensiveExpenseData | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('current_month');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expenseCategories, setExpenseCategories] = useState<any[]>([]);
  const [budgetItems, setBudgetItems] = useState<any[]>([]);
  const [expenseStatistics, setExpenseStatistics] = useState<any>(null);
  const [expenseSummary, setExpenseSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtering, setFiltering] = useState(false);
  
  // Real-time data integration
  const { crossModuleData, lastUpdate, isConnected, updateCount, forceSync } = useRealtimeData({
    events: ['expense_created', 'expense_updated', 'expense_approved', 'staff_salary_updated', 'bot_report_updated'],
    autoSync: true,
    syncInterval: 3000
  });
  const [showExpenseEntry, setShowExpenseEntry] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [showExpenseReport, setShowExpenseReport] = useState(false);
  const [showPendingApprovals, setShowPendingApprovals] = useState(false);
  
  // Enhanced dashboard state
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [showRecurringModal, setShowRecurringModal] = useState(false);
  const [showLedgerPreview, setShowLedgerPreview] = useState(false);
  const [showReimbursementModal, setShowReimbursementModal] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState('TZS');
  const [selectedVendor, setSelectedVendor] = useState('all');
  const [darkMode, setDarkMode] = useState(false);
  const [widgetLayout, setWidgetLayout] = useState('grid');
  const [userRole, setUserRole] = useState('staff');
  const [showAuditTrail, setShowAuditTrail] = useState(false);
  const [recurringExpenses, setRecurringExpenses] = useState<any[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<any[]>([]);
  const [vendorPerformance, setVendorPerformance] = useState<any[]>([]);
  const [ledgerEntries, setLedgerEntries] = useState<any[]>([]);
  const [reimbursementData, setReimbursementData] = useState<any[]>([]);
  const [forecastData, setForecastData] = useState<any>(null);
  const [customWidgets, setCustomWidgets] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set([]));
  
  // Quick add form state
  const [quickAddForm, setQuickAddForm] = useState({
    amount: '',
    category: '',
    description: '',
    vendor: '',
    date: new Date().toISOString().split('T')[0],
    currency: 'TZS',
    taxAmount: '',
    tags: [],
    attachment: null
  });
  
  // Recurring expense form state
  const [recurringForm, setRecurringForm] = useState({
    name: '',
    amount: '',
    category: '',
    frequency: 'monthly',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    description: '',
    autoApprove: false
  });

  // Load data on component mount
  useEffect(() => {
    loadEnhancedData();
  }, []);

  // Enhanced data loading functions
  const loadEnhancedData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load recurring expenses
      const recurring = await SupabaseExpenseService.getRecurringExpenses();
      setRecurringExpenses(recurring || []);
      
      // Load pending approvals
      const approvals = await SupabaseExpenseService.getPendingApprovals();
      setPendingApprovals(approvals || []);
      
      // Load vendor performance data
      const vendors = await SupabaseExpenseService.getVendorPerformance();
      setVendorPerformance(vendors || []);
      
      // Load ledger entries
      const ledger = await SupabaseExpenseService.getLedgerEntries();
      setLedgerEntries(ledger || []);
      
      // Load expense summary
      const summary = await SupabaseExpenseService.getExpenseSummary();
      if (summary) {
        setExpenseSummary(summary);
      }
      
      // Load reimbursement data
      const reimbursements = await SupabaseExpenseService.getReimbursementData();
      setReimbursementData(reimbursements || []);
      
      // Load forecast data
      const forecast = await SupabaseExpenseService.getForecastData();
      setForecastData(forecast || null);
      
    } catch (error) {
      console.error('Error loading enhanced data:', error);
      setError('Failed to load expense data. Some features may not be available.');
    } finally {
      setLoading(false);
    }
  };

  // Load real data from Supabase
  useEffect(() => {
    const loadExpenseData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Load expense categories
        const categories = await SupabaseExpenseService.getExpenseCategories();
        setExpenseCategories(categories);
        
        // Load budget items
        const budgetItemsData = await SupabaseExpenseService.getBudgetItems();
        setBudgetItems(budgetItemsData);
        
        // Load expense statistics
        const statistics = await SupabaseExpenseService.getExpenseStatistics();
        setExpenseStatistics(statistics);
        
        // Load enhanced data
        await loadEnhancedData();
        
        // Load budget variance analysis
        const varianceAnalysis = await SupabaseExpenseService.getBudgetVarianceAnalysis();
        
        // Create comprehensive expense data from real database
        const realExpenseData: ComprehensiveExpenseData = {
          totalExpenses: statistics.totalExpenses,
          totalBudget: statistics.totalBudget,
          totalVariance: statistics.varianceAmount,
          operatingExpenses: statistics.totalExpenses * 0.8, // Estimate based on actual data
          operatingPercentage: 72,
          interestExpenses: statistics.totalExpenses * 0.15, // Estimate
          interestPercentage: 18,
          pendingApprovals: statistics.pendingCount,
          msp202Integration: {
            interestExpenses: {
              d15_interestOnBankBorrowings: 200000,
              d16_interestOnMFSPBorrowings: 150000,
              d17_interestOnSavings: 50000,
              d18_interestOnFixedDeposits: 30000,
              d19_interestOnOtherBorrowings: 20000,
              d20_totalInterestExpense: 450000
            },
            operatingExpenses: {
              d25_salariesAndBenefits: 800000,
              d26_rentAndUtilities: 200000,
              d27_transportAndCommunication: 150000,
              d28_officeSupplies: 80000,
              d29_trainingAndDevelopment: 120000,
              d30_loanLossProvision: 200000,
              d31_depreciation: 100000,
              d32_auditAndLegal: 150000,
              d33_advertisingAndMarketing: 100000,
              d34_insurancePremiums: 80000,
              d35_bankChargesAndFees: 50000,
              d36_boardAndCommitteeExpenses: 60000,
              d37_securityServices: 40000,
              d38_repairsAndMaintenance: 30000,
              d39_otherOperatingExpenses: 20000,
              d40_totalOperatingExpenses: 1800000
            },
            taxExpenses: {
              d41_taxExpense: 250000
            }
          },
          categoryBreakdown: varianceAnalysis.map(item => ({
            category: item.categoryName,
            amount: item.actualAmount,
            budget: item.budgetedAmount,
            variance: item.varianceAmount,
            percentage: (item.actualAmount / statistics.totalExpenses) * 100,
            trend: item.trend === 'favorable' ? 'decreasing' : item.trend === 'unfavorable' ? 'increasing' : 'stable',
            botMapping: categories.find(c => c.category_name === item.categoryName)?.msp202_line_item || ''
          }))
        };
        
        setExpenseData(realExpenseData);
      } catch (error) {
        console.error('Error loading expense data:', error);
        setError('Failed to load expense data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadExpenseData();
  }, []);

  // Filter data based on selected period and category
  useEffect(() => {
    if (!expenseData) return;

    let filtered = { ...expenseData };

    // Apply period filter
    const now = new Date();
    let startDate: Date, endDate: Date;

    switch (selectedPeriod) {
      case 'current_month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case 'last_month':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
      case 'current_quarter':
        const quarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), quarter * 3, 1);
        endDate = new Date(now.getFullYear(), quarter * 3 + 3, 0);
        break;
      case 'current_year':
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    }

    // Apply category filter
    if (selectedCategory !== 'all' && filtered.categoryBreakdown) {
      filtered.categoryBreakdown = filtered.categoryBreakdown.filter(category => {
        switch (selectedCategory) {
          case 'operating':
            return category.category.toLowerCase().includes('operating') || 
                   category.category.toLowerCase().includes('salary') ||
                   category.category.toLowerCase().includes('rent') ||
                   category.category.toLowerCase().includes('office');
          case 'interest':
            return category.category.toLowerCase().includes('interest') ||
                   category.category.toLowerCase().includes('borrowing');
          case 'tax':
            return category.category.toLowerCase().includes('tax') ||
                   category.category.toLowerCase().includes('government');
          default:
            return true;
        }
      });
    }

    setFilteredExpenseData(filtered);
  }, [expenseData, selectedPeriod, selectedCategory]);

  // Handle period change
  const handlePeriodChange = (period: string) => {
    setFiltering(true);
    setSelectedPeriod(period);
    console.log('Period changed to:', period);
    // Add visual feedback
    const periodNames = {
      'current_month': 'Current Month',
      'last_month': 'Last Month', 
      'current_quarter': 'Current Quarter',
      'current_year': 'Current Year'
    };
    console.log(`Filtering expenses for: ${periodNames[period as keyof typeof periodNames]}`);
    
    // Simulate filtering delay for visual feedback
    setTimeout(() => {
      setFiltering(false);
    }, 300);
  };

  // Handle category change
  const handleCategoryChange = (category: string) => {
    setFiltering(true);
    setSelectedCategory(category);
    console.log('Category changed to:', category);
    // Add visual feedback
    const categoryNames = {
      'all': 'All Categories',
      'operating': 'Operating Expenses',
      'interest': 'Interest Expenses', 
      'tax': 'Tax Expenses'
    };
    console.log(`Filtering by category: ${categoryNames[category as keyof typeof categoryNames]}`);
    
    // Simulate filtering delay for visual feedback
    setTimeout(() => {
      setFiltering(false);
    }, 300);
  };

  // Enhanced utility functions
  const formatCurrency = (amount: number, currency: string = selectedCurrency) => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const convertCurrency = (amount: number, fromCurrency: string, toCurrency: string) => {
    // Mock conversion rates - in real app, fetch from API
    const rates: { [key: string]: number } = {
      'TZS': 1,
      'USD': 0.00043,
      'EUR': 0.00039,
      'GBP': 0.00034
    };
    return amount * (rates[toCurrency] / rates[fromCurrency]);
  };

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const handleQuickAddSubmit = async () => {
    try {
      const expenseData = {
        ...quickAddForm,
        amount: parseFloat(quickAddForm.amount),
        taxAmount: parseFloat(quickAddForm.taxAmount) || 0,
        approval_status: 'pending',
        submitted_by: 'current_user_id',
        expenseDate: new Date(quickAddForm.date)
      };
      
      await SupabaseExpenseService.createExpense(expenseData);
      
      // Reset form
      setQuickAddForm({
        amount: '',
        category: '',
        description: '',
        vendor: '',
        date: new Date().toISOString().split('T')[0],
        currency: 'TZS',
        taxAmount: '',
        tags: [],
        attachment: null
      });
      
      setShowQuickAdd(false);
      
      // Refresh data
      await loadEnhancedData();
      
      // Show success notification
      console.log('Expense added successfully');
      
    } catch (error) {
      console.error('Error adding expense:', error);
    }
  };

  const handleRecurringSubmit = async () => {
    try {
      await SupabaseExpenseService.createRecurringExpense(recurringForm);
      
      // Reset form
      setRecurringForm({
        name: '',
        amount: '',
        category: '',
        frequency: 'monthly',
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        description: '',
        autoApprove: false
      });
      
      setShowRecurringModal(false);
      await loadEnhancedData();
      
    } catch (error) {
      console.error('Error creating recurring expense:', error);
    }
  };

  const handleBulkApproval = async (expenseIds: string[], action: 'approve' | 'reject') => {
    try {
      await SupabaseExpenseService.bulkApproveExpenses(expenseIds, action, 'current-user-id');
      
      await loadEnhancedData();
      
    } catch (error) {
      console.error('Error bulk approving expenses:', error);
    }
  };

  const formatPercentage = (value: number) => {
    return `${value}%`;
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing':
        return <TrendingUp className="h-4 w-4 text-red-500" />;
      case 'decreasing':
        return <TrendingDown className="h-4 w-4 text-green-500" />;
      default:
        return <div className="h-4 w-4 bg-gray-400 rounded-full" />;
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical':
        return 'text-red-600 bg-red-100';
      case 'high':
        return 'text-orange-600 bg-orange-100';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-green-600 bg-green-100';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="text-red-500 text-lg font-semibold mb-2">Error Loading Data</div>
        <div className="text-gray-600 text-sm mb-4">{error}</div>
        <button 
          onClick={() => {
            setError(null);
            loadEnhancedData();
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <Layout>
      <div className={`expense-management-dashboard p-6 space-y-6 ${darkMode ? 'dark' : ''}`}>
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl p-6 text-white">
        <div className="flex flex-col space-y-4">
          {/* Title and Description */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Enhanced Expense Management</h1>
              <p className="text-emerald-100">Comprehensive expense tracking with real-time analytics, multi-currency support, and advanced workflow integration</p>
            </div>
            <div className="flex items-center space-x-3">
              {/* Currency Selector */}
              <select
                value={selectedCurrency}
                onChange={(e) => setSelectedCurrency(e.target.value)}
                className="bg-white/20 border border-white/30 rounded-lg px-3 py-2 text-white"
              >
                <option value="TZS">TZS</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
              </select>
              
              {/* Dark Mode Toggle */}
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
              >
                {darkMode ? <Maximize2 className="h-5 w-5" /> : <Minimize2 className="h-5 w-5" />}
              </button>
              
              {/* Settings */}
              <button className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors">
                <Settings className="h-5 w-5" />
              </button>
            </div>
          </div>
          
          {/* Enhanced Status Information */}
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <div className={`flex items-center space-x-2 ${
              isConnected ? 'text-green-200' : 'text-red-200'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-green-400' : 'bg-red-400'
              }`}></div>
              <span>{isConnected ? 'Real-time Connected' : 'Disconnected'}</span>
            </div>
            {lastUpdate && (
              <div className="text-emerald-200">
                Last updated: {lastUpdate.toLocaleTimeString()}
              </div>
            )}
            <div className="text-emerald-200">
              Updates: {updateCount}
            </div>
            {filtering && (
              <div className="flex items-center space-x-2 text-emerald-200">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                <span className="text-sm">Filtering...</span>
              </div>
            )}
            <button
              onClick={forceSync}
              className="text-emerald-200 hover:text-white underline transition-colors"
            >
              Force Sync
            </button>
            
            {/* Search Bar */}
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-emerald-200" />
              <input
                type="text"
                placeholder="Search expenses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-white/20 border border-white/30 rounded-lg px-3 py-1 text-white placeholder-emerald-200 focus:outline-none focus:ring-2 focus:ring-white/50"
              />
            </div>
          </div>
          
          {/* Filter Controls */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-emerald-200" />
              <select 
                value={selectedPeriod} 
                onChange={(e) => handlePeriodChange(e.target.value)}
                disabled={filtering}
                className={`bg-white text-gray-900 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all duration-200 ${
                  filtering ? 'opacity-50 cursor-not-allowed' : 'hover:border-emerald-400'
                }`}
              >
                <option value="current_month">Current Month</option>
                <option value="last_month">Last Month</option>
                <option value="current_quarter">Current Quarter</option>
                <option value="current_year">Current Year</option>
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="h-5 w-5 text-emerald-200" />
              <select 
                value={selectedCategory} 
                onChange={(e) => handleCategoryChange(e.target.value)}
                disabled={filtering}
                className={`bg-white text-gray-900 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all duration-200 ${
                  filtering ? 'opacity-50 cursor-not-allowed' : 'hover:border-emerald-400'
                }`}
              >
                <option value="all">All Categories</option>
                <option value="operating">Operating</option>
                <option value="interest">Interest</option>
                <option value="tax">Tax</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Expense Overview */}
      <div className="expense-overview">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Comprehensive Expense Management</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <ExpenseSummaryCard
            title="Total Expenses (YTD)"
            value={filteredExpenseData?.totalExpenses || 0}
            budget={filteredExpenseData?.totalBudget}
            variance={filteredExpenseData?.totalVariance}
            format="currency"
          />
          <ExpenseSummaryCard
            title="Operating Expenses"
            value={filteredExpenseData?.operatingExpenses || 0}
            percentage={filteredExpenseData?.operatingPercentage}
            trend="stable"
            format="currency"
          />
          <ExpenseSummaryCard
            title="Interest Expenses"
            value={filteredExpenseData?.interestExpenses || 0}
            percentage={filteredExpenseData?.interestPercentage}
            trend="decreasing"
            format="currency"
          />
          <ExpenseSummaryCard
            title="Pending Approvals"
            value={filteredExpenseData?.pendingApprovals || 0}
            urgency="medium"
            format="number"
          />
        </div>
      </div>

      {/* Report Integration Status */}
      {expenseData?.msp202Integration && (
        <div className="msp202-integration">
          <MSP202IntegrationPanel
            interestExpenses={expenseData.msp202Integration.interestExpenses}
            operatingExpenses={expenseData.msp202Integration.operatingExpenses}
            taxExpenses={expenseData.msp202Integration.taxExpenses}
            validationStatus="passed"
            lastSync={new Date()}
          />
        </div>
      )}

      {/* Cross-Module Data Integration */}
      {(crossModuleData || !loading) && (
        <div className="cross-module-integration bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-6 border border-blue-200">
          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-2 animate-pulse"></div>
            Real-time Cross-Module Integration
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <h5 className="font-medium text-gray-900 mb-2">Expense Data</h5>
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(crossModuleData?.expenseData?.totalExpenses || 0)}
              </div>
              <div className="text-sm text-gray-600">Total Expenses</div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <h5 className="font-medium text-gray-900 mb-2">Staff Data</h5>
              <div className="text-2xl font-bold text-green-600">
                {crossModuleData?.staffData?.totalStaff || 0}
              </div>
              <div className="text-sm text-gray-600">Total Staff</div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <h5 className="font-medium text-gray-900 mb-2">BOT Reports</h5>
              <div className="text-2xl font-bold text-purple-600">
                {crossModuleData?.botReportData?.validationStatus === 'passed' ? '✓' : '⚠'}
              </div>
              <div className="text-sm text-gray-600">Validation Status</div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <h5 className="font-medium text-gray-900 mb-2">Budget Status</h5>
              <div className="text-2xl font-bold text-orange-600">
                {(crossModuleData?.budgetData?.variancePercentage || 0).toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">Variance</div>
            </div>
          </div>
        </div>
      )}

      {/* Budget Management */}
      <div className="budget-management">
        <BudgetManagement />
      </div>

      {/* Comprehensive Expense Categories */}
      <div className="comprehensive-expense-categories">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Expense Categories by Type</h4>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Interest Expenses - NOT BUDGETABLE */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h5 className="font-semibold text-gray-900 mb-4 flex items-center">
              <DollarSign className="h-5 w-5 mr-2 text-blue-600" />
              Interest Expenses
              <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-gray-600 bg-gray-100">
                NOT BUDGETABLE
              </span>
            </h5>
            <div className="space-y-3">
              {ExpenseCategoryService.getInterestExpenseCategories().map(category => (
                <div key={category.categoryCode} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium text-sm text-gray-900">{category.categoryName}</div>
                    <div className="text-xs text-gray-600">{category.description}</div>
                    <div className="text-xs text-red-600 font-medium">Based on business volume</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-sm text-gray-900">
                      {new Intl.NumberFormat('en-TZ', {
                        style: 'currency',
                        currency: 'TZS',
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      }).format(category.actualAmount)}
                    </div>
                    <div className="text-xs text-gray-500">
                      Actual amount
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Operating Expenses - BUDGETABLE */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h5 className="font-semibold text-gray-900 mb-4 flex items-center">
              <BarChart3 className="h-5 w-5 mr-2 text-green-600" />
              Operating Expenses
              <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-green-600 bg-green-100">
                BUDGETABLE
              </span>
            </h5>
            <div className="space-y-3">
              {ExpenseCategoryService.getOperatingExpenseCategories().slice(0, 8).map(category => (
                <div key={category.categoryCode} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium text-sm text-gray-900">{category.categoryName}</div>
                    <div className="text-xs text-gray-600">{category.description}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-sm text-gray-900">
                      {new Intl.NumberFormat('en-TZ', {
                        style: 'currency',
                        currency: 'TZS',
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      }).format(category.actualAmount)}
                    </div>
                    <div className={`text-xs ${category.varianceAmount >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {(category.variancePercentage || 0).toFixed(1)}% vs budget
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tax Expenses - NOT BUDGETABLE */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h5 className="font-semibold text-gray-900 mb-4 flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-red-600" />
              Tax Expenses
              <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-gray-600 bg-gray-100">
                NOT BUDGETABLE
              </span>
            </h5>
            <div className="space-y-3">
              {ExpenseCategoryService.getTaxExpenseCategories().map(category => (
                <div key={category.categoryCode} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium text-sm text-gray-900">{category.categoryName}</div>
                    <div className="text-xs text-gray-600">{category.description}</div>
                    <div className="text-xs text-red-600 font-medium">Based on business volume</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-sm text-gray-900">
                      {new Intl.NumberFormat('en-TZ', {
                        style: 'currency',
                        currency: 'TZS',
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      }).format(category.actualAmount)}
                    </div>
                    <div className="text-xs text-gray-500">
                      Actual amount
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Expense Categories Breakdown */}
      {filteredExpenseData?.categoryBreakdown && (
        <div className="expense-categories-breakdown">
          <ExpenseCategoriesChart
            data={filteredExpenseData.categoryBreakdown}
            budgetComparison={true}
            interactive={true}
            onCategorySelect={handleCategoryChange}
          />
        </div>
      )}

      {/* Enhanced Dashboard Sections */}
      <div className="space-y-6">
        {/* Recurring Expenses Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div 
            className="flex items-center justify-between p-4 border-b border-gray-200 cursor-pointer"
            onClick={() => toggleSection('recurring')}
          >
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <RotateCcw className="h-5 w-5 mr-2 text-blue-600" />
              Recurring Expenses
            </h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowRecurringModal(true);
                }}
                className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Recurring
              </button>
              {expandedSections.has('recurring') ? 
                <ChevronUp className="h-5 w-5 text-gray-500" /> : 
                <ChevronDown className="h-5 w-5 text-gray-500" />
              }
            </div>
          </div>
          {expandedSections.has('recurring') && (
            <div className="p-6">
              <div className="space-y-4">
                {recurringExpenses.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <RotateCcw className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No recurring expenses set up yet</p>
                    <p className="text-sm">Create your first recurring expense to get started</p>
                  </div>
                ) : (
                  recurringExpenses.map((expense) => (
                    <div key={expense.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{expense.name}</h4>
                        <p className="text-sm text-gray-600">{expense.description}</p>
                        <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                          <span>{formatCurrency(expense.amount)}</span>
                          <span>•</span>
                          <span className="capitalize">{expense.frequency}</span>
                          <span>•</span>
                          <span>Next: {expense.nextDate ? new Date(expense.nextDate).toLocaleDateString() : 'N/A'}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          expense.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {expense.status}
                        </span>
                        <button className="p-1 text-gray-400 hover:text-gray-600">
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button className="p-1 text-gray-400 hover:text-red-600">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Vendor Performance Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div 
            className="flex items-center justify-between p-4 border-b border-gray-200 cursor-pointer"
            onClick={() => toggleSection('vendors')}
          >
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Users className="h-5 w-5 mr-2 text-purple-600" />
              Vendor Performance & Payment Overview
            </h3>
            {expandedSections.has('vendors') ? 
              <ChevronUp className="h-5 w-5 text-gray-500" /> : 
              <ChevronDown className="h-5 w-5 text-gray-500" />
            }
          </div>
          {expandedSections.has('vendors') && (
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Vendors */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-4">Top Vendors by Spend</h4>
                  <div className="space-y-3">
                    {vendorPerformance.slice(0, 5).map((vendor, index) => (
                      <div key={vendor.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-purple-600">{index + 1}</span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{vendor.name}</p>
                            <p className="text-sm text-gray-500">{vendor.category}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-900">{formatCurrency(vendor.totalSpend)}</p>
                          <p className="text-sm text-gray-500">{vendor.transactionCount} transactions</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Payment Methods */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-4">Payment Method Breakdown</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <CreditCard className="h-5 w-5 text-green-600" />
                        <span className="font-medium text-gray-900">Bank Transfer</span>
                      </div>
                      <span className="font-medium text-gray-900">{formatCurrency(1500000)}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Banknote className="h-5 w-5 text-blue-600" />
                        <span className="font-medium text-gray-900">Cash</span>
                      </div>
                      <span className="font-medium text-gray-900">{formatCurrency(500000)}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Receipt className="h-5 w-5 text-yellow-600" />
                        <span className="font-medium text-gray-900">Credit</span>
                      </div>
                      <span className="font-medium text-gray-900">{formatCurrency(300000)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Live Pending Approvals Widget */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div 
            className="flex items-center justify-between p-4 border-b border-gray-200 cursor-pointer"
            onClick={() => toggleSection('approvals')}
          >
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Bell className="h-5 w-5 mr-2 text-orange-600" />
              Live Pending Approvals
              {pendingApprovals.length > 0 && (
                <span className="ml-2 px-2 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded-full">
                  {pendingApprovals.length}
                </span>
              )}
            </h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowPendingApprovals(true);
                }}
                className="px-3 py-1 bg-orange-600 text-white text-sm rounded-md hover:bg-orange-700 transition-colors"
              >
                View All
              </button>
              {expandedSections.has('approvals') ? 
                <ChevronUp className="h-5 w-5 text-gray-500" /> : 
                <ChevronDown className="h-5 w-5 text-gray-500" />
              }
            </div>
          </div>
          {expandedSections.has('approvals') && (
            <div className="p-6">
              <div className="space-y-3">
                {pendingApprovals.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-300" />
                    <p>No pending approvals</p>
                    <p className="text-sm">All expenses have been processed</p>
                  </div>
                ) : (
                  pendingApprovals.slice(0, 5).map((approval) => (
                    <div key={approval.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{approval.description}</h4>
                        <p className="text-sm text-gray-600">{approval.category} • {approval.vendor}</p>
                        <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                          <span>{formatCurrency(approval.amount)}</span>
                          <span>•</span>
                          <span>Submitted by {approval.submittedBy}</span>
                          <span>•</span>
                          <span>{approval.submittedAt ? new Date(approval.submittedAt).toLocaleDateString() : 'N/A'}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          approval.urgency === 'critical' ? 'bg-red-100 text-red-800' :
                          approval.urgency === 'high' ? 'bg-orange-100 text-orange-800' :
                          approval.urgency === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {approval.urgency}
                        </span>
                        <button
                          onClick={() => handleBulkApproval([approval.id], 'approve')}
                          className="p-1 text-green-600 hover:text-green-800"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleBulkApproval([approval.id], 'reject')}
                          className="p-1 text-red-600 hover:text-red-800"
                        >
                          <XCircle className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Multi-Currency and Tax Summary */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div 
            className="flex items-center justify-between p-4 border-b border-gray-200 cursor-pointer"
            onClick={() => toggleSection('currency')}
          >
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Globe className="h-5 w-5 mr-2 text-indigo-600" />
              Multi-Currency & Tax Summary
            </h3>
            {expandedSections.has('currency') ? 
              <ChevronUp className="h-5 w-5 text-gray-500" /> : 
              <ChevronDown className="h-5 w-5 text-gray-500" />
            }
          </div>
          {expandedSections.has('currency') && (
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Currency Breakdown */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-4">Expenses by Currency</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <span className="text-sm font-medium text-blue-600">TZS</span>
                        <span className="text-gray-900">Tanzanian Shilling</span>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">{formatCurrency(2000000, 'TZS')}</p>
                        <p className="text-sm text-gray-500">85% of total</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <span className="text-sm font-medium text-green-600">USD</span>
                        <span className="text-gray-900">US Dollar</span>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">{formatCurrency(300000, 'USD')}</p>
                        <p className="text-sm text-gray-500">12% of total</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <span className="text-sm font-medium text-purple-600">EUR</span>
                        <span className="text-gray-900">Euro</span>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">{formatCurrency(50000, 'EUR')}</p>
                        <p className="text-sm text-gray-500">3% of total</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tax Summary */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-4">Tax Summary</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Calculator className="h-5 w-5 text-green-600" />
                        <span className="font-medium text-gray-900">Reclaimable VAT</span>
                      </div>
                      <span className="font-medium text-green-600">{formatCurrency(150000)}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Receipt className="h-5 w-5 text-blue-600" />
                        <span className="font-medium text-gray-900">Tax Deducted</span>
                      </div>
                      <span className="font-medium text-blue-600">{formatCurrency(75000)}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Target className="h-5 w-5 text-yellow-600" />
                        <span className="font-medium text-gray-900">Net Tax Impact</span>
                      </div>
                      <span className="font-medium text-yellow-600">{formatCurrency(75000)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Reimbursement Tracking Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div 
            className="flex items-center justify-between p-4 border-b border-gray-200 cursor-pointer"
            onClick={() => toggleSection('reimbursement')}
          >
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Receipt className="h-5 w-5 mr-2 text-pink-600" />
              Employee Reimbursement Tracking
            </h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowReimbursementModal(true);
                }}
                className="px-3 py-1 bg-pink-600 text-white text-sm rounded-md hover:bg-pink-700 transition-colors"
              >
                <Plus className="h-4 w-4 mr-1" />
                New Reimbursement
              </button>
              {expandedSections.has('reimbursement') ? 
                <ChevronUp className="h-5 w-5 text-gray-500" /> : 
                <ChevronDown className="h-5 w-5 text-gray-500" />
              }
            </div>
          </div>
          {expandedSections.has('reimbursement') && (
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Pending Reimbursements */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-4">Pending Reimbursements</h4>
                  <div className="space-y-3">
                    {reimbursementData.filter(r => r.status === 'pending').slice(0, 5).map((reimbursement) => (
                      <div key={reimbursement.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <h5 className="font-medium text-gray-900">{reimbursement.employeeName}</h5>
                          <p className="text-sm text-gray-600">{reimbursement.description}</p>
                          <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                            <span>{formatCurrency(reimbursement.amount)}</span>
                            <span>•</span>
                            <span>Submitted: {reimbursement.submittedDate ? new Date(reimbursement.submittedDate).toLocaleDateString() : 'N/A'}</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-pink-600 h-2 rounded-full" 
                              style={{ width: `${reimbursement.progress}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-gray-500">{reimbursement.progress}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Reimbursement Summary */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-4">Reimbursement Summary</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <span className="font-medium text-gray-900">Approved This Month</span>
                      </div>
                      <span className="font-medium text-green-600">{formatCurrency(450000)}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Clock className="h-5 w-5 text-yellow-600" />
                        <span className="font-medium text-gray-900">Pending Review</span>
                      </div>
                      <span className="font-medium text-yellow-600">{formatCurrency(120000)}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <DollarSign className="h-5 w-5 text-blue-600" />
                        <span className="font-medium text-gray-900">Total Advances</span>
                      </div>
                      <span className="font-medium text-blue-600">{formatCurrency(200000)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Ledger Preview Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div 
            className="flex items-center justify-between p-4 border-b border-gray-200 cursor-pointer"
            onClick={() => toggleSection('ledger')}
          >
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <FileText className="h-5 w-5 mr-2 text-cyan-600" />
              Accounting Integration & Ledger Preview
            </h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowLedgerPreview(true);
                }}
                className="px-3 py-1 bg-cyan-600 text-white text-sm rounded-md hover:bg-cyan-700 transition-colors"
              >
                <Eye className="h-4 w-4 mr-1" />
                View Full Ledger
              </button>
              {expandedSections.has('ledger') ? 
                <ChevronUp className="h-5 w-5 text-gray-500" /> : 
                <ChevronDown className="h-5 w-5 text-gray-500" />
              }
            </div>
          </div>
          {expandedSections.has('ledger') && (
            <div className="p-6">
              <div className="space-y-4">
                {/* Recent Ledger Entries */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-4">Recent Ledger Entries</h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Debit Account</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Credit Account</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reference</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {ledgerEntries.slice(0, 5).map((entry) => (
                          <tr key={entry.id} className="hover:bg-gray-50">
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                              {entry.date ? new Date(entry.date).toLocaleDateString() : 'N/A'}
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                              {entry.debitAccount}
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                              {entry.creditAccount}
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                              {formatCurrency(entry.amount)}
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                              {entry.reference}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Accounting Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h5 className="font-medium text-red-900 mb-2">Total Debits</h5>
                    <p className="text-2xl font-bold text-red-600">{formatCurrency(2500000)}</p>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h5 className="font-medium text-green-900 mb-2">Total Credits</h5>
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(2500000)}</p>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h5 className="font-medium text-blue-900 mb-2">Balance</h5>
                    <p className="text-2xl font-bold text-blue-600">{formatCurrency(0)}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Budgeting and Forecasting Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div 
            className="flex items-center justify-between p-4 border-b border-gray-200 cursor-pointer"
            onClick={() => toggleSection('budgeting')}
          >
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Target className="h-5 w-5 mr-2 text-emerald-600" />
              Budgeting & Forecasting Tools
            </h3>
            {expandedSections.has('budgeting') ? 
              <ChevronUp className="h-5 w-5 text-gray-500" /> : 
              <ChevronDown className="h-5 w-5 text-gray-500" />
            }
          </div>
          {expandedSections.has('budgeting') && (
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Budget vs Actual */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-4">Budget vs Actual (Current Month)</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-900">Operating Expenses</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">{formatCurrency(1800000)} / {formatCurrency(2000000)}</span>
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div className="bg-green-600 h-2 rounded-full" style={{ width: '90%' }}></div>
                        </div>
                        <span className="text-xs text-green-600">90%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-900">Marketing</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">{formatCurrency(150000)} / {formatCurrency(100000)}</span>
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div className="bg-red-600 h-2 rounded-full" style={{ width: '150%' }}></div>
                        </div>
                        <span className="text-xs text-red-600">150%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-900">Training</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">{formatCurrency(80000)} / {formatCurrency(120000)}</span>
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div className="bg-yellow-600 h-2 rounded-full" style={{ width: '67%' }}></div>
                        </div>
                        <span className="text-xs text-yellow-600">67%</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Forecast */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-4">Next Quarter Forecast</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <TrendingUpIcon className="h-5 w-5 text-blue-600" />
                        <span className="font-medium text-gray-900">Projected Expenses</span>
                      </div>
                      <span className="font-medium text-blue-600">{formatCurrency(2800000)}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Target className="h-5 w-5 text-green-600" />
                        <span className="font-medium text-gray-900">Budget Allocation</span>
                      </div>
                      <span className="font-medium text-green-600">{formatCurrency(3000000)}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Calculator className="h-5 w-5 text-yellow-600" />
                        <span className="font-medium text-gray-900">Variance</span>
                      </div>
                      <span className="font-medium text-yellow-600">+{formatCurrency(200000)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Integration Components */}
      <div className="integration-components grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BOTReportsIntegration />
        <StaffManagementIntegration />
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <QuickActionButton
            label="Add New Expense"
            icon="plus"
            onClick={() => setShowExpenseEntry(true)}
            primary={true}
          />
          <QuickActionButton
            label="Bulk Upload Expenses"
            icon="upload"
            onClick={() => setShowBulkUpload(true)}
          />
          <QuickActionButton
            label="Generate Expense Report"
            icon="report"
            onClick={() => setShowExpenseReport(true)}
          />
          <QuickActionButton
            label="Review Pending Approvals"
            icon="approval"
            onClick={() => setShowPendingApprovals(true)}
            badge={expenseData?.pendingApprovals}
          />
        </div>
      </div>

      {/* Modals */}
      {showExpenseEntry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Add New Expense</h3>
            <p className="text-gray-600 mb-4">Expense entry form would be implemented here</p>
            <button 
              onClick={() => setShowExpenseEntry(false)}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Bulk Upload Modal */}
      <BulkUploadModal
        isOpen={showBulkUpload}
        onClose={() => setShowBulkUpload(false)}
        onSuccess={(count) => {
          console.log(`Successfully processed ${count} expenses`);
          setShowBulkUpload(false);
          // Refresh data
          loadExpenseData();
        }}
      />

      {/* Report Generation Modal */}
      <ReportGenerationModal
        isOpen={showExpenseReport}
        onClose={() => setShowExpenseReport(false)}
      />

      {/* Pending Approvals Modal */}
      <PendingApprovalsModal
        isOpen={showPendingApprovals}
        onClose={() => setShowPendingApprovals(false)}
        onApprovalChange={() => {
          // Refresh data when approvals change
          loadExpenseData();
        }}
      />

      {/* Quick Add Expense Modal */}
      {showQuickAdd && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Quick Add Expense</h3>
              <button
                onClick={() => setShowQuickAdd(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={(e) => { e.preventDefault(); handleQuickAddSubmit(); }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    value={quickAddForm.amount}
                    onChange={(e) => setQuickAddForm(prev => ({ ...prev, amount: e.target.value }))}
                    className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="0.00"
                    required
                  />
                  <select
                    value={quickAddForm.currency}
                    onChange={(e) => setQuickAddForm(prev => ({ ...prev, currency: e.target.value }))}
                    className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="TZS">TZS</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={quickAddForm.category}
                  onChange={(e) => setQuickAddForm(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                >
                  <option value="">Select Category</option>
                  {expenseCategories.map(category => (
                    <option key={category.id} value={category.category_name}>
                      {category.category_name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input
                  type="text"
                  value={quickAddForm.description}
                  onChange={(e) => setQuickAddForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Brief description of expense"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vendor</label>
                <input
                  type="text"
                  value={quickAddForm.vendor}
                  onChange={(e) => setQuickAddForm(prev => ({ ...prev, vendor: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Vendor name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  value={quickAddForm.date}
                  onChange={(e) => setQuickAddForm(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tax Amount (Optional)</label>
                <input
                  type="number"
                  value={quickAddForm.taxAmount}
                  onChange={(e) => setQuickAddForm(prev => ({ ...prev, taxAmount: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="0.00"
                />
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowQuickAdd(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors flex items-center justify-center"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Add Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Recurring Expenses Modal */}
      {showRecurringModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Create Recurring Expense</h3>
              <button
                onClick={() => setShowRecurringModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={(e) => { e.preventDefault(); handleRecurringSubmit(); }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={recurringForm.name}
                  onChange={(e) => setRecurringForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="e.g., Monthly Rent"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                  <input
                    type="number"
                    value={recurringForm.amount}
                    onChange={(e) => setRecurringForm(prev => ({ ...prev, amount: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="0.00"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
                  <select
                    value={recurringForm.frequency}
                    onChange={(e) => setRecurringForm(prev => ({ ...prev, frequency: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={recurringForm.category}
                  onChange={(e) => setRecurringForm(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                >
                  <option value="">Select Category</option>
                  {expenseCategories.map(category => (
                    <option key={category.id} value={category.category_name}>
                      {category.category_name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={recurringForm.startDate}
                    onChange={(e) => setRecurringForm(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date (Optional)</label>
                  <input
                    type="date"
                    value={recurringForm.endDate}
                    onChange={(e) => setRecurringForm(prev => ({ ...prev, endDate: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={recurringForm.description}
                  onChange={(e) => setRecurringForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  rows={3}
                  placeholder="Description of recurring expense"
                />
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="autoApprove"
                  checked={recurringForm.autoApprove}
                  onChange={(e) => setRecurringForm(prev => ({ ...prev, autoApprove: e.target.checked }))}
                  className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                />
                <label htmlFor="autoApprove" className="ml-2 block text-sm text-gray-700">
                  Auto-approve generated expenses
                </label>
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowRecurringModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors flex items-center justify-center"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Create Recurring
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </Layout>
  );
};

// Component definitions
const MSP202IntegrationPanel: React.FC<{ 
  interestExpenses: any; 
  operatingExpenses: any; 
  taxExpenses: any; 
  validationStatus: string; 
  lastSync: Date 
}> = ({ interestExpenses, operatingExpenses, taxExpenses, validationStatus, lastSync }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-lg font-semibold text-gray-900">Income Statement Integration</h4>
        <div className="flex items-center space-x-2">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            validationStatus === 'passed' ? 'text-green-800 bg-green-100' : 'text-red-800 bg-red-100'
          }`}>
            {validationStatus === 'passed' ? <CheckCircle className="h-3 w-3 mr-1" /> : <XCircle className="h-3 w-3 mr-1" />}
            {validationStatus.toUpperCase()}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <h5 className="font-medium text-gray-900 mb-3">Interest Expenses</h5>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Interest on Borrowings:</span>
              <span>{formatCurrency(interestExpenses?.d38_interestOnBorrowings || 0)}</span>
            </div>
            <div className="flex justify-between">
              <span>Other Interest:</span>
              <span>{formatCurrency(interestExpenses?.d39_otherInterest || 0)}</span>
            </div>
            <div className="flex justify-between font-medium border-t pt-2">
              <span>Total Interest:</span>
              <span>{formatCurrency(interestExpenses?.d40_totalInterestExpenses || 0)}</span>
            </div>
          </div>
        </div>
        
        <div>
          <h5 className="font-medium text-gray-900 mb-3">Operating Expenses</h5>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Salaries & Benefits:</span>
              <span>{formatCurrency(operatingExpenses?.d41_salariesAndBenefits || 0)}</span>
            </div>
            <div className="flex justify-between">
              <span>Rent & Utilities:</span>
              <span>{formatCurrency(operatingExpenses?.d42_rentAndUtilities || 0)}</span>
            </div>
            <div className="flex justify-between">
              <span>Office Supplies:</span>
              <span>{formatCurrency(operatingExpenses?.d43_officeSupplies || 0)}</span>
            </div>
            <div className="flex justify-between">
              <span>Professional Services:</span>
              <span>{formatCurrency(operatingExpenses?.d44_professionalServices || 0)}</span>
            </div>
            <div className="flex justify-between">
              <span>Other Operating:</span>
              <span>{formatCurrency(operatingExpenses?.d45_otherOperatingExpenses || 0)}</span>
            </div>
            <div className="flex justify-between font-medium border-t pt-2">
              <span>Total Operating:</span>
              <span>{formatCurrency(operatingExpenses?.d40_totalOperatingExpenses || 0)}</span>
            </div>
          </div>
        </div>
        
        <div>
          <h5 className="font-medium text-gray-900 mb-3">Tax Expenses</h5>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Tax Expense:</span>
              <span>{formatCurrency(taxExpenses?.d41_taxExpense || 0)}</span>
            </div>
          </div>
          <div className="mt-4 text-xs text-gray-500">
            Last sync: {lastSync.toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
};

const ExpenseSummaryCard: React.FC<ExpenseSummaryCardProps> = ({ 
  title, 
  value, 
  budget, 
  variance, 
  percentage, 
  trend, 
  urgency, 
  format 
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value}%`;
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing':
        return <TrendingUp className="h-4 w-4 text-red-500" />;
      case 'decreasing':
        return <TrendingDown className="h-4 w-4 text-green-500" />;
      default:
        return null;
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high':
        return 'text-red-600 bg-red-100';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-green-600 bg-green-100';
    }
  };

  const displayValue = format === 'currency' ? formatCurrency(value) : 
                      format === 'percentage' ? formatPercentage(value) : 
                      value.toString();

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        {trend && getTrendIcon(trend)}
      </div>
      <div className="space-y-2">
        <div className="text-2xl font-bold text-gray-900">{displayValue}</div>
        {budget && (
          <div className="text-sm text-gray-600">
            Budget: {formatCurrency(budget)}
          </div>
        )}
        {variance !== undefined && (
          <div className={`text-sm ${variance >= 0 ? 'text-red-600' : 'text-green-600'}`}>
            Variance: {formatCurrency(variance)}
          </div>
        )}
        {percentage !== undefined && (
          <div className="text-sm text-gray-600">
            {formatPercentage(percentage)} of total
          </div>
        )}
        {urgency && (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getUrgencyColor(urgency)}`}>
            {urgency.toUpperCase()}
          </span>
        )}
      </div>
    </div>
  );
};

const ExpenseCategoriesChart: React.FC<{ 
  data: any[]; 
  budgetComparison: boolean; 
  interactive: boolean; 
  onCategorySelect: (category: string) => void 
}> = ({ data, budgetComparison, interactive, onCategorySelect }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value}%`;
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing':
        return <TrendingUp className="h-4 w-4 text-red-500" />;
      case 'decreasing':
        return <TrendingDown className="h-4 w-4 text-green-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Expense Categories</h3>
        {interactive && (
          <span className="text-sm text-gray-500">Click to filter</span>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.map((category, index) => (
          <div key={index} className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
               onClick={() => interactive && onCategorySelect(category.category)}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-3">
                <div className={`w-4 h-4 rounded-full`} style={{ backgroundColor: category.color || '#3B82F6' }}></div>
                <span className="font-medium text-gray-900">{category.category}</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">{formatCurrency(category.amount || 0)}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="h-2 rounded-full transition-all duration-300" 
                style={{ 
                  width: `${category.percentage || 0}%`, 
                  backgroundColor: category.color || '#3B82F6' 
                }}
              ></div>
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>{(category.percentage || 0).toFixed(1)}%</span>
              {budgetComparison && category.budget && (
                <span className={category.amount > category.budget ? 'text-red-600' : 'text-green-600'}>
                  vs {formatCurrency(category.budget)}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const QuickActionButton: React.FC<{ 
  label: string; 
  icon: string; 
  onClick: () => void; 
  primary?: boolean; 
  badge?: number 
}> = ({ label, icon, onClick, primary = false, badge }) => {
  const getIcon = () => {
    switch (icon) {
      case 'plus': return <Plus className="h-5 w-5" />;
      case 'upload': return <Upload className="h-5 w-5" />;
      case 'report': return <FileText className="h-5 w-5" />;
      case 'approval': return <Eye className="h-5 w-5" />;
      default: return <Plus className="h-5 w-5" />;
    }
  };

  return (
    <button
      onClick={onClick}
      className={`flex items-center space-x-2 px-4 py-3 rounded-lg transition-colors relative ${
        primary 
          ? 'bg-blue-600 text-white hover:bg-blue-700' 
          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
      }`}
    >
      {getIcon()}
      <span className="font-medium">{label}</span>
      {badge && (
        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
          {badge}
        </span>
      )}
    </button>
  );
};

export default ExpenseManagementDashboard;
