import React, { useState, useEffect, useCallback } from 'react';
import { 
  FileText, 
  Download, 
  Calendar, 
  Filter, 
  BarChart3, 
  PieChart, 
  TrendingUp,
  X,
  CheckCircle,
  AlertCircle,
  DollarSign,
  CreditCard,
  Users,
  Target,
  Activity,
  Shield,
  Clock,
  Globe,
  Tag,
  Database,
  Eye,
  Settings,
  RefreshCw,
  BookOpen,
  Calculator,
  TrendingDown,
  Zap,
  Building2,
  Wallet,
  Percent,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react';
import { SupabaseExpenseService } from '../../services/supabaseExpenseService';

interface ReportGenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ReportConfig {
  reportType: 'summary' | 'detailed' | 'category' | 'vendor' | 'budget' | 'ledger' | 'forecast' | 'kpi' | 'compliance' | 'cashflow' | 'profitability' | 'portfolio';
  dateRange: {
    start: string;
    end: string;
  };
  categories: string[];
  tags: string[];
  currencies: string[];
  accounts: string[];
  vendors: string[];
  format: 'pdf' | 'excel' | 'csv' | 'json';
  includeCharts: boolean;
  includeAuditInfo: boolean;
  groupBy: 'month' | 'category' | 'vendor' | 'account' | 'currency' | 'tag' | 'none';
  aggregationLevel: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  includeForecast: boolean;
  forecastPeriod: number; // months
  kpiMetrics: string[];
  complianceChecks: string[];
  customFilters: CustomFilter[];
}

interface CustomFilter {
  field: string;
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'between' | 'in' | 'not_in';
  value: any;
  label: string;
}

interface ReportType {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  category: 'financial' | 'operational' | 'compliance' | 'analytical';
  requiresCharts: boolean;
  requiresAudit: boolean;
  supportedFormats: string[];
  defaultGroupBy: string;
  kpiMetrics?: string[];
}

interface ReportData {
  summary: {
    totalExpenses: number;
    totalBudget: number;
    variance: number;
    categoryCount: number;
    vendorCount: number;
    currencyCount: number;
    accountCount: number;
    averageExpense: number;
    medianExpense: number;
    largestExpense: number;
    smallestExpense: number;
  };
  expenses: any[];
  categories: any[];
  vendors: any[];
  monthlyData: any[];
  ledgerEntries: LedgerEntry[];
  kpiMetrics: KPIMetric[];
  forecastData: ForecastData[];
  complianceData: ComplianceData[];
  cashflowData: CashflowData[];
  profitabilityData: ProfitabilityData[];
  portfolioData: PortfolioData[];
  auditTrail: AuditEntry[];
  charts: ChartData[];
}

interface LedgerEntry {
  accountNumber: string;
  accountName: string;
  debitAmount: number;
  creditAmount: number;
  balance: number;
  transactionCount: number;
  lastTransaction: string;
  category: string;
  subCategory?: string;
}

interface KPIMetric {
  name: string;
  value: number;
  target: number;
  variance: number;
  variancePercentage: number;
  trend: 'up' | 'down' | 'stable';
  period: string;
  category: 'financial' | 'operational' | 'risk' | 'growth';
  description: string;
  icon: React.ReactNode;
}

interface ForecastData {
  period: string;
  predicted: number;
  actual?: number;
  confidence: number;
  category: string;
  scenario: 'optimistic' | 'realistic' | 'pessimistic';
}

interface ComplianceData {
  checkName: string;
  status: 'pass' | 'fail' | 'warning';
  score: number;
  maxScore: number;
  details: string;
  recommendations: string[];
  lastChecked: string;
  nextCheck: string;
}

interface CashflowData {
  period: string;
  inflow: number;
  outflow: number;
  netCashflow: number;
  cumulativeCashflow: number;
  category: string;
}

interface ProfitabilityData {
  period: string;
  revenue: number;
  expenses: number;
  grossProfit: number;
  netProfit: number;
  profitMargin: number;
  roi: number;
  category: string;
}

interface PortfolioData {
  clientId: string;
  clientName: string;
  loanAmount: number;
  outstandingBalance: number;
  interestRate: number;
  term: number;
  status: 'active' | 'overdue' | 'completed' | 'defaulted';
  riskScore: number;
  lastPayment: string;
  nextPayment: string;
}

interface AuditEntry {
  id: string;
  action: string;
  user: string;
  timestamp: string;
  details: string;
  ipAddress: string;
  userAgent: string;
  changes: any;
}

interface ChartData {
  type: 'bar' | 'line' | 'pie' | 'area' | 'scatter';
  title: string;
  data: any[];
  xAxis: string;
  yAxis: string;
  colors: string[];
  options: any;
}

const ReportGenerationModal: React.FC<ReportGenerationModalProps> = ({ isOpen, onClose }) => {
  const [reportConfig, setReportConfig] = useState<ReportConfig>({
    reportType: 'summary',
    dateRange: {
      start: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0]
    },
    categories: [],
    tags: [],
    currencies: ['TZS'],
    accounts: [],
    vendors: [],
    format: 'pdf',
    includeCharts: true,
    includeAuditInfo: false,
    groupBy: 'month',
    aggregationLevel: 'monthly',
    includeForecast: false,
    forecastPeriod: 6,
    kpiMetrics: [],
    complianceChecks: [],
    customFilters: []
  });

  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [availableCategories, setAvailableCategories] = useState<any[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [availableCurrencies, setAvailableCurrencies] = useState<string[]>([]);
  const [availableAccounts, setAvailableAccounts] = useState<any[]>([]);
  const [availableVendors, setAvailableVendors] = useState<any[]>([]);
  const [previewData, setPreviewData] = useState<any>(null);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [selectedReportType, setSelectedReportType] = useState<ReportType | null>(null);

  // Define available report types
  const reportTypes: ReportType[] = [
    {
      id: 'summary',
      name: 'Summary Report',
      description: 'High-level overview of expenses and budget performance',
      icon: <BarChart3 className="h-5 w-5" />,
      category: 'financial',
      requiresCharts: true,
      requiresAudit: false,
      supportedFormats: ['pdf', 'excel', 'csv'],
      defaultGroupBy: 'month'
    },
    {
      id: 'detailed',
      name: 'Detailed Report',
      description: 'Comprehensive expense breakdown with all details',
      icon: <FileText className="h-5 w-5" />,
      category: 'financial',
      requiresCharts: false,
      requiresAudit: true,
      supportedFormats: ['pdf', 'excel', 'csv'],
      defaultGroupBy: 'none'
    },
    {
      id: 'ledger',
      name: 'Ledger Extract',
      description: 'Accounting ledger with debits, credits, and balances',
      icon: <BookOpen className="h-5 w-5" />,
      category: 'financial',
      requiresCharts: false,
      requiresAudit: true,
      supportedFormats: ['pdf', 'excel', 'csv'],
      defaultGroupBy: 'account'
    },
    {
      id: 'forecast',
      name: 'Forecast Report',
      description: 'Predictive analysis and future expense projections',
      icon: <TrendingUp className="h-5 w-5" />,
      category: 'analytical',
      requiresCharts: true,
      requiresAudit: false,
      supportedFormats: ['pdf', 'excel', 'json'],
      defaultGroupBy: 'month'
    },
    {
      id: 'kpi',
      name: 'KPI Dashboard',
      description: 'Key performance indicators for microfinance operations',
      icon: <Target className="h-5 w-5" />,
      category: 'operational',
      requiresCharts: true,
      requiresAudit: false,
      supportedFormats: ['pdf', 'excel', 'json'],
      defaultGroupBy: 'month',
      kpiMetrics: ['portfolio_quality', 'operational_efficiency', 'financial_performance', 'risk_metrics']
    },
    {
      id: 'compliance',
      name: 'Compliance Report',
      description: 'Regulatory compliance and audit trail analysis',
      icon: <Shield className="h-5 w-5" />,
      category: 'compliance',
      requiresCharts: false,
      requiresAudit: true,
      supportedFormats: ['pdf', 'excel', 'csv'],
      defaultGroupBy: 'month'
    },
    {
      id: 'cashflow',
      name: 'Cash Flow Analysis',
      description: 'Inflow and outflow analysis with liquidity metrics',
      icon: <DollarSign className="h-5 w-5" />,
      category: 'financial',
      requiresCharts: true,
      requiresAudit: false,
      supportedFormats: ['pdf', 'excel', 'json'],
      defaultGroupBy: 'month'
    },
    {
      id: 'profitability',
      name: 'Profitability Analysis',
      description: 'Revenue, costs, and profitability metrics',
      icon: <Calculator className="h-5 w-5" />,
      category: 'financial',
      requiresCharts: true,
      requiresAudit: false,
      supportedFormats: ['pdf', 'excel', 'json'],
      defaultGroupBy: 'month'
    },
    {
      id: 'portfolio',
      name: 'Portfolio Report',
      description: 'Loan portfolio performance and risk analysis',
      icon: <Users className="h-5 w-5" />,
      category: 'operational',
      requiresCharts: true,
      requiresAudit: true,
      supportedFormats: ['pdf', 'excel', 'csv'],
      defaultGroupBy: 'category'
    }
  ];

  // Load available data
  useEffect(() => {
    if (isOpen) {
      loadAvailableData();
    }
  }, [isOpen]);

  // Update selected report type when report type changes
  useEffect(() => {
    const reportType = reportTypes.find(rt => rt.id === reportConfig.reportType);
    setSelectedReportType(reportType || null);
  }, [reportConfig.reportType]);

  const loadAvailableData = async () => {
    try {
      const [categories, tags, currencies, accounts, vendors] = await Promise.all([
        loadAvailableCategories(),
        loadAvailableTags(),
        loadAvailableCurrencies(),
        loadAvailableAccounts(),
        loadAvailableVendors()
      ]);
    } catch (error) {
      console.error('Error loading available data:', error);
    }
  };

  const loadAvailableCategories = async () => {
    try {
      const categories = await SupabaseExpenseService.getExpenseCategories();
      setAvailableCategories(categories);
      return categories;
    } catch (error) {
      console.error('Error loading categories:', error);
      return [];
    }
  };

  const loadAvailableTags = async () => {
    try {
      // Mock data - in real implementation, this would come from the database
      const tags = ['urgent', 'recurring', 'approved', 'pending', 'over-budget', 'policy-violation'];
      setAvailableTags(tags);
      return tags;
    } catch (error) {
      console.error('Error loading tags:', error);
      return [];
    }
  };

  const loadAvailableCurrencies = async () => {
    try {
      // Mock data - in real implementation, this would come from the database
      const currencies = ['TZS', 'USD', 'EUR', 'GBP', 'KES', 'UGX'];
      setAvailableCurrencies(currencies);
      return currencies;
    } catch (error) {
      console.error('Error loading currencies:', error);
      return [];
    }
  };

  const loadAvailableAccounts = async () => {
    try {
      // Mock data - in real implementation, this would come from the accounting system
      const accounts = [
        { id: '1000', name: 'Cash', type: 'asset' },
        { id: '1100', name: 'Bank Account', type: 'asset' },
        { id: '2000', name: 'Accounts Payable', type: 'liability' },
        { id: '3000', name: 'Equity', type: 'equity' },
        { id: '4000', name: 'Revenue', type: 'revenue' },
        { id: '5000', name: 'Expenses', type: 'expense' }
      ];
      setAvailableAccounts(accounts);
      return accounts;
    } catch (error) {
      console.error('Error loading accounts:', error);
      return [];
    }
  };

  const loadAvailableVendors = async () => {
    try {
      // Mock data - in real implementation, this would come from the database
      const vendors = [
        { id: '1', name: 'ABC Office Supplies Ltd' },
        { id: '2', name: 'City Transport Co' },
        { id: '3', name: 'Tech Solutions Inc' },
        { id: '4', name: 'Power Company Ltd' },
        { id: '5', name: 'Water Authority' }
      ];
      setAvailableVendors(vendors);
      return vendors;
    } catch (error) {
      console.error('Error loading vendors:', error);
      return [];
    }
  };

  const generatePreview = async () => {
    setIsGenerating(true);
    try {
      const data = await fetchReportData();
      setPreviewData(data);
      setReportData(data);
    } catch (error) {
      console.error('Error generating preview:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const fetchReportData = async (): Promise<ReportData> => {
    try {
      // Fetch expenses based on date range and filters
      const expenses = await SupabaseExpenseService.getExpenses({
        startDate: reportConfig.dateRange.start,
        endDate: reportConfig.dateRange.end,
        categories: reportConfig.categories.length > 0 ? reportConfig.categories : undefined
      });

      // Calculate enhanced summary data
      const amounts = expenses.map(e => e.amount).sort((a, b) => a - b);
      const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
      const totalBudget = 50000000; // This would come from budget data
      const variance = totalBudget - totalExpenses;
      const averageExpense = amounts.length > 0 ? totalExpenses / amounts.length : 0;
      const medianExpense = amounts.length > 0 ? 
        amounts.length % 2 === 0 ? 
          (amounts[amounts.length / 2 - 1] + amounts[amounts.length / 2]) / 2 : 
          amounts[Math.floor(amounts.length / 2)] : 0;

      // Group by category
      const categoryData = expenses.reduce((acc, expense) => {
        const category = expense.category_name || 'Unknown';
        if (!acc[category]) {
          acc[category] = { category, total: 0, count: 0 };
        }
        acc[category].total += expense.amount;
        acc[category].count += 1;
        return acc;
      }, {} as any);

      // Group by vendor
      const vendorData = expenses.reduce((acc, expense) => {
        const vendor = expense.vendor_name || 'Unknown';
        if (!acc[vendor]) {
          acc[vendor] = { vendor, total: 0, count: 0 };
        }
        acc[vendor].total += expense.amount;
        acc[vendor].count += 1;
        return acc;
      }, {} as any);

      // Group by month
      const monthlyData = expenses.reduce((acc, expense) => {
        const month = new Date(expense.expense_date).toISOString().substr(0, 7);
        if (!acc[month]) {
          acc[month] = { month, total: 0, count: 0 };
        }
        acc[month].total += expense.amount;
        acc[month].count += 1;
        return acc;
      }, {} as any);

      // Generate additional data based on report type
      const ledgerEntries = generateLedgerEntries(expenses);
      const kpiMetrics = generateKPIMetrics(expenses, reportConfig);
      const forecastData = generateForecastData(expenses, reportConfig);
      const complianceData = generateComplianceData(expenses, reportConfig);
      const cashflowData = generateCashflowData(expenses, reportConfig);
      const profitabilityData = generateProfitabilityData(expenses, reportConfig);
      const portfolioData = generatePortfolioData(expenses, reportConfig);
      const auditTrail = generateAuditTrail(expenses, reportConfig);
      const charts = generateChartData(expenses, reportConfig);

      return {
        summary: {
          totalExpenses,
          totalBudget,
          variance,
          categoryCount: Object.keys(categoryData).length,
          vendorCount: Object.keys(vendorData).length,
          currencyCount: new Set(expenses.map(e => e.currency || 'TZS')).size,
          accountCount: new Set(expenses.map(e => e.account_number || '1000')).size,
          averageExpense,
          medianExpense,
          largestExpense: amounts.length > 0 ? amounts[amounts.length - 1] : 0,
          smallestExpense: amounts.length > 0 ? amounts[0] : 0
        },
        expenses,
        categories: Object.values(categoryData),
        vendors: Object.values(vendorData),
        monthlyData: Object.values(monthlyData),
        ledgerEntries,
        kpiMetrics,
        forecastData,
        complianceData,
        cashflowData,
        profitabilityData,
        portfolioData,
        auditTrail,
        charts
      };
    } catch (error) {
      console.error('Error fetching report data:', error);
      throw error;
    }
  };

  // Helper functions for generating additional data
  const generateLedgerEntries = (expenses: any[]): LedgerEntry[] => {
    // Mock ledger entries - in real implementation, this would come from accounting system
    return [
      {
        accountNumber: '5000',
        accountName: 'Office Supplies',
        debitAmount: 150000,
        creditAmount: 0,
        balance: 150000,
        transactionCount: 5,
        lastTransaction: '2025-01-15',
        category: 'Expenses',
        subCategory: 'Office Supplies'
      },
      {
        accountNumber: '2000',
        accountName: 'Accounts Payable',
        debitAmount: 0,
        creditAmount: 150000,
        balance: -150000,
        transactionCount: 5,
        lastTransaction: '2025-01-15',
        category: 'Liabilities',
        subCategory: 'Trade Payables'
      }
    ];
  };

  const generateKPIMetrics = (expenses: any[], config: ReportConfig): KPIMetric[] => {
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const expenseCount = expenses.length;
    const averageExpense = expenseCount > 0 ? totalExpenses / expenseCount : 0;
    
    return [
      {
        name: 'Total Expenses',
        value: totalExpenses,
        target: 50000000,
        variance: totalExpenses - 50000000,
        variancePercentage: ((totalExpenses - 50000000) / 50000000) * 100,
        trend: totalExpenses > 50000000 ? 'up' : 'down',
        period: 'Monthly',
        category: 'financial',
        description: 'Total monthly expenses',
        icon: <DollarSign className="h-4 w-4" />
      },
      {
        name: 'Expense Count',
        value: expenseCount,
        target: 100,
        variance: expenseCount - 100,
        variancePercentage: ((expenseCount - 100) / 100) * 100,
        trend: expenseCount > 100 ? 'up' : 'down',
        period: 'Monthly',
        category: 'operational',
        description: 'Number of expense transactions',
        icon: <Activity className="h-4 w-4" />
      },
      {
        name: 'Average Expense',
        value: averageExpense,
        target: 500000,
        variance: averageExpense - 500000,
        variancePercentage: ((averageExpense - 500000) / 500000) * 100,
        trend: averageExpense > 500000 ? 'up' : 'down',
        period: 'Monthly',
        category: 'financial',
        description: 'Average expense amount',
        icon: <Calculator className="h-4 w-4" />
      }
    ];
  };

  const generateForecastData = (expenses: any[], config: ReportConfig): ForecastData[] => {
    const monthlyTotals = expenses.reduce((acc, expense) => {
      const month = new Date(expense.expense_date).toISOString().substr(0, 7);
      if (!acc[month]) {
        acc[month] = 0;
      }
      acc[month] += expense.amount;
      return acc;
    }, {} as any);

    const months = Object.keys(monthlyTotals).sort();
    const forecastData: ForecastData[] = [];

    // Generate forecast for next 6 months
    for (let i = 1; i <= config.forecastPeriod; i++) {
      const futureDate = new Date();
      futureDate.setMonth(futureDate.getMonth() + i);
      const period = futureDate.toISOString().substr(0, 7);
      
      // Simple linear regression for forecasting
      const avgMonthly = Object.values(monthlyTotals).reduce((sum: number, val: any) => sum + val, 0) / months.length;
      const growthRate = 0.05; // 5% monthly growth
      
      forecastData.push({
        period,
        predicted: avgMonthly * Math.pow(1 + growthRate, i),
        confidence: Math.max(0.6, 1 - (i * 0.1)),
        category: 'All',
        scenario: 'realistic'
      });
    }

    return forecastData;
  };

  const generateComplianceData = (expenses: any[], config: ReportConfig): ComplianceData[] => {
    return [
      {
        checkName: 'Expense Approval Policy',
        status: 'pass',
        score: 95,
        maxScore: 100,
        details: 'All expenses properly approved according to policy',
        recommendations: ['Continue current approval process'],
        lastChecked: '2025-01-15',
        nextCheck: '2025-02-15'
      },
      {
        checkName: 'Documentation Requirements',
        status: 'warning',
        score: 80,
        maxScore: 100,
        details: 'Some expenses missing supporting documentation',
        recommendations: ['Implement mandatory document upload', 'Review expense submission process'],
        lastChecked: '2025-01-15',
        nextCheck: '2025-02-15'
      },
      {
        checkName: 'Budget Compliance',
        status: 'pass',
        score: 90,
        maxScore: 100,
        details: 'Expenses within budget limits',
        recommendations: ['Monitor spending trends'],
        lastChecked: '2025-01-15',
        nextCheck: '2025-02-15'
      }
    ];
  };

  const generateCashflowData = (expenses: any[], config: ReportConfig): CashflowData[] => {
    const monthlyData = expenses.reduce((acc, expense) => {
      const month = new Date(expense.expense_date).toISOString().substr(0, 7);
      if (!acc[month]) {
        acc[month] = { inflow: 0, outflow: 0 };
      }
      acc[month].outflow += expense.amount;
      return acc;
    }, {} as any);

    return Object.entries(monthlyData).map(([period, data]: [string, any]) => ({
      period,
      inflow: 10000000, // Mock revenue
      outflow: data.outflow,
      netCashflow: 10000000 - data.outflow,
      cumulativeCashflow: 10000000 - data.outflow,
      category: 'Operations'
    }));
  };

  const generateProfitabilityData = (expenses: any[], config: ReportConfig): ProfitabilityData[] => {
    const monthlyData = expenses.reduce((acc, expense) => {
      const month = new Date(expense.expense_date).toISOString().substr(0, 7);
      if (!acc[month]) {
        acc[month] = { expenses: 0 };
      }
      acc[month].expenses += expense.amount;
      return acc;
    }, {} as any);

    return Object.entries(monthlyData).map(([period, data]: [string, any]) => {
      const revenue = 15000000; // Mock revenue
      const expenses = data.expenses;
      const grossProfit = revenue - expenses;
      const netProfit = grossProfit - (expenses * 0.1); // 10% overhead
      
      return {
        period,
        revenue,
        expenses,
        grossProfit,
        netProfit,
        profitMargin: (netProfit / revenue) * 100,
        roi: (netProfit / expenses) * 100,
        category: 'Operations'
      };
    });
  };

  const generatePortfolioData = (expenses: any[], config: ReportConfig): PortfolioData[] => {
    // Mock portfolio data - in real implementation, this would come from loan management system
    return [
      {
        clientId: 'C001',
        clientName: 'John Doe',
        loanAmount: 5000000,
        outstandingBalance: 3000000,
        interestRate: 12,
        term: 24,
        status: 'active',
        riskScore: 75,
        lastPayment: '2025-01-01',
        nextPayment: '2025-02-01'
      },
      {
        clientId: 'C002',
        clientName: 'Jane Smith',
        loanAmount: 3000000,
        outstandingBalance: 0,
        interestRate: 15,
        term: 12,
        status: 'completed',
        riskScore: 85,
        lastPayment: '2025-01-15',
        nextPayment: 'N/A'
      }
    ];
  };

  const generateAuditTrail = (expenses: any[], config: ReportConfig): AuditEntry[] => {
    return [
      {
        id: 'A001',
        action: 'Report Generated',
        user: 'admin@microfinance.com',
        timestamp: new Date().toISOString(),
        details: 'Generated expense report for period',
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0...',
        changes: { reportType: config.reportType, dateRange: config.dateRange }
      }
    ];
  };

  const generateChartData = (expenses: any[], config: ReportConfig): ChartData[] => {
    const categoryData = expenses.reduce((acc, expense) => {
      const category = expense.category_name || 'Unknown';
      if (!acc[category]) {
        acc[category] = 0;
      }
      acc[category] += expense.amount;
      return acc;
    }, {} as any);

    return [
      {
        type: 'pie',
        title: 'Expenses by Category',
        data: Object.entries(categoryData).map(([name, value]) => ({ name, value })),
        xAxis: 'Category',
        yAxis: 'Amount',
        colors: ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6'],
        options: {}
      },
      {
        type: 'bar',
        title: 'Monthly Expense Trend',
        data: expenses.reduce((acc, expense) => {
          const month = new Date(expense.expense_date).toISOString().substr(0, 7);
          if (!acc[month]) {
            acc[month] = 0;
          }
          acc[month] += expense.amount;
          return acc;
        }, {} as any),
        xAxis: 'Month',
        yAxis: 'Amount',
        colors: ['#3B82F6'],
        options: {}
      }
    ];
  };

  const generateReport = async () => {
    setIsGeneratingReport(true);
    try {
      const data = reportData || await fetchReportData();
      
      switch (reportConfig.format) {
        case 'pdf':
          await generatePDFReport(data);
          break;
        case 'excel':
          await generateExcelReport(data);
          break;
        case 'csv':
          await generateCSVReport(data);
          break;
        case 'json':
          await generateJSONReport(data);
          break;
      }
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const generatePDFReport = async (data: ReportData) => {
    // This would use a library like jsPDF or Puppeteer
    // For now, we'll simulate the generation
    console.log('Generating PDF report...', data);
    
    // Simulate PDF generation
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Create a download link
    const blob = new Blob(['PDF Report Content'], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `expense_report_${reportConfig.dateRange.start}_to_${reportConfig.dateRange.end}.pdf`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const generateExcelReport = async (data: ReportData) => {
    // This would use a library like xlsx
    // For now, we'll simulate the generation
    console.log('Generating Excel report...', data);
    
    // Simulate Excel generation
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Create a download link
    const blob = new Blob(['Excel Report Content'], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `expense_report_${reportConfig.dateRange.start}_to_${reportConfig.dateRange.end}.xlsx`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const generateCSVReport = async (data: ReportData) => {
    // Generate CSV content
    const csvContent = generateCSVContent(data);
    
    // Create a download link
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `expense_report_${reportConfig.dateRange.start}_to_${reportConfig.dateRange.end}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const generateJSONReport = async (data: ReportData) => {
    // Generate JSON content
    const jsonContent = JSON.stringify(data, null, 2);
    
    // Create a download link
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `expense_report_${reportConfig.dateRange.start}_to_${reportConfig.dateRange.end}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const generateCSVContent = (data: ReportData): string => {
    const headers = ['Date', 'Category', 'Vendor', 'Amount', 'Description', 'Status'];
    const rows = data.expenses.map(expense => [
      expense.expense_date,
      expense.category_name,
      expense.vendor_name,
      expense.amount,
      expense.description,
      expense.approval_status
    ]);
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-7xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <h3 className="text-xl font-semibold text-gray-900">Enhanced Report Generation</h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200"
              >
                <Settings className="h-4 w-4 mr-1" />
                {showAdvancedOptions ? 'Hide' : 'Show'} Advanced
              </button>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Configuration Panel */}
          <div className="space-y-6">
            <h4 className="text-lg font-medium text-gray-900">Report Configuration</h4>
            
            {/* Report Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Report Type</label>
              <div className="grid grid-cols-1 gap-3">
                {reportTypes.map((reportType) => (
                  <div
                    key={reportType.id}
                    onClick={() => setReportConfig(prev => ({ ...prev, reportType: reportType.id as any }))}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      reportConfig.reportType === reportType.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`p-2 rounded-md ${
                        reportConfig.reportType === reportType.id
                          ? 'bg-blue-100 text-blue-600'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {reportType.icon}
                      </div>
                      <div className="flex-1">
                        <h5 className="font-medium text-gray-900">{reportType.name}</h5>
                        <p className="text-sm text-gray-600 mt-1">{reportType.description}</p>
                        <div className="flex items-center space-x-4 mt-2">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            reportType.category === 'financial' ? 'bg-green-100 text-green-700' :
                            reportType.category === 'operational' ? 'bg-blue-100 text-blue-700' :
                            reportType.category === 'compliance' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-purple-100 text-purple-700'
                          }`}>
                            {reportType.category}
                          </span>
                          {reportType.requiresCharts && (
                            <span className="text-xs text-gray-500 flex items-center">
                              <BarChart3 className="h-3 w-3 mr-1" />
                              Charts
                            </span>
                          )}
                          {reportType.requiresAudit && (
                            <span className="text-xs text-gray-500 flex items-center">
                              <Shield className="h-3 w-3 mr-1" />
                              Audit
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={reportConfig.dateRange.start}
                    onChange={(e) => setReportConfig(prev => ({ 
                      ...prev, 
                      dateRange: { ...prev.dateRange, start: e.target.value }
                    }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">End Date</label>
                  <input
                    type="date"
                    value={reportConfig.dateRange.end}
                    onChange={(e) => setReportConfig(prev => ({ 
                      ...prev, 
                      dateRange: { ...prev.dateRange, end: e.target.value }
                    }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
              </div>
            </div>

            {/* Basic Filters */}
            <div className="space-y-4">
              <h5 className="font-medium text-gray-900">Basic Filters</h5>
              
              {/* Categories */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Categories</label>
                <select
                  multiple
                  value={reportConfig.categories}
                  onChange={(e) => {
                    const selected = Array.from(e.target.selectedOptions, option => option.value);
                    setReportConfig(prev => ({ ...prev, categories: selected }));
                  }}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  size={3}
                >
                  {availableCategories.map(category => (
                    <option key={category.id} value={category.category_name}>
                      {category.category_name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-600 mt-1">Hold Ctrl/Cmd to select multiple</p>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
                <div className="flex flex-wrap gap-2">
                  {availableTags.map(tag => (
                    <label key={tag} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={reportConfig.tags.includes(tag)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setReportConfig(prev => ({ ...prev, tags: [...prev.tags, tag] }));
                          } else {
                            setReportConfig(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }));
                          }
                        }}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">{tag}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Currencies */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Currencies</label>
                <div className="flex flex-wrap gap-2">
                  {availableCurrencies.map(currency => (
                    <label key={currency} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={reportConfig.currencies.includes(currency)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setReportConfig(prev => ({ ...prev, currencies: [...prev.currencies, currency] }));
                          } else {
                            setReportConfig(prev => ({ ...prev, currencies: prev.currencies.filter(c => c !== currency) }));
                          }
                        }}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">{currency}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Advanced Options */}
            {showAdvancedOptions && (
              <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                <h5 className="font-medium text-gray-900">Advanced Options</h5>
                
                {/* Accounts */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Accounts</label>
                  <select
                    multiple
                    value={reportConfig.accounts}
                    onChange={(e) => {
                      const selected = Array.from(e.target.selectedOptions, option => option.value);
                      setReportConfig(prev => ({ ...prev, accounts: selected }));
                    }}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    size={3}
                  >
                    {availableAccounts.map(account => (
                      <option key={account.id} value={account.id}>
                        {account.name} ({account.type})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Vendors */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Vendors</label>
                  <select
                    multiple
                    value={reportConfig.vendors}
                    onChange={(e) => {
                      const selected = Array.from(e.target.selectedOptions, option => option.value);
                      setReportConfig(prev => ({ ...prev, vendors: selected }));
                    }}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    size={3}
                  >
                    {availableVendors.map(vendor => (
                      <option key={vendor.id} value={vendor.id}>
                        {vendor.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Aggregation Level */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Aggregation Level</label>
                  <select
                    value={reportConfig.aggregationLevel}
                    onChange={(e) => setReportConfig(prev => ({ ...prev, aggregationLevel: e.target.value as any }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>

                {/* Forecast Options */}
                {reportConfig.reportType === 'forecast' && (
                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={reportConfig.includeForecast}
                        onChange={(e) => setReportConfig(prev => ({ ...prev, includeForecast: e.target.checked }))}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">Include Forecast</span>
                    </label>
                    {reportConfig.includeForecast && (
                      <div className="mt-2">
                        <label className="block text-xs text-gray-600 mb-1">Forecast Period (months)</label>
                        <input
                          type="number"
                          min="1"
                          max="24"
                          value={reportConfig.forecastPeriod}
                          onChange={(e) => setReportConfig(prev => ({ ...prev, forecastPeriod: parseInt(e.target.value) }))}
                          className="w-full border border-gray-300 rounded-md px-3 py-2"
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* KPI Metrics */}
                {reportConfig.reportType === 'kpi' && selectedReportType?.kpiMetrics && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">KPI Metrics</label>
                    <div className="space-y-2">
                      {selectedReportType.kpiMetrics.map(metric => (
                        <label key={metric} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={reportConfig.kpiMetrics.includes(metric)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setReportConfig(prev => ({ ...prev, kpiMetrics: [...prev.kpiMetrics, metric] }));
                              } else {
                                setReportConfig(prev => ({ ...prev, kpiMetrics: prev.kpiMetrics.filter(m => m !== metric) }));
                              }
                            }}
                            className="mr-2"
                          />
                          <span className="text-sm text-gray-700 capitalize">{metric.replace('_', ' ')}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Format and Options */}
            <div className="space-y-4">
              <h5 className="font-medium text-gray-900">Output Options</h5>
              
              {/* Format */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Output Format</label>
                <div className="grid grid-cols-2 gap-3">
                  {selectedReportType?.supportedFormats.map(format => (
                    <label key={format} className="flex items-center p-2 border rounded-md hover:bg-gray-50">
                      <input
                        type="radio"
                        name="format"
                        value={format}
                        checked={reportConfig.format === format}
                        onChange={(e) => setReportConfig(prev => ({ ...prev, format: e.target.value as any }))}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700 uppercase">{format}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Options */}
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={reportConfig.includeCharts}
                    onChange={(e) => setReportConfig(prev => ({ ...prev, includeCharts: e.target.checked }))}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Include Charts</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={reportConfig.includeAuditInfo}
                    onChange={(e) => setReportConfig(prev => ({ ...prev, includeAuditInfo: e.target.checked }))}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Include Audit Information</span>
                </label>
              </div>

              {/* Group By */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Group By</label>
                <select
                  value={reportConfig.groupBy}
                  onChange={(e) => setReportConfig(prev => ({ ...prev, groupBy: e.target.value as any }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="none">No Grouping</option>
                  <option value="month">Month</option>
                  <option value="category">Category</option>
                  <option value="vendor">Vendor</option>
                  <option value="account">Account</option>
                  <option value="currency">Currency</option>
                  <option value="tag">Tag</option>
                </select>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <div className="flex space-x-3">
                <button
                  onClick={generatePreview}
                  disabled={isGenerating}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center"
                >
                  {isGenerating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Generating Preview...
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4 mr-2" />
                      Generate Preview
                    </>
                  )}
                </button>
                <button
                  onClick={generateReport}
                  disabled={!previewData || isGeneratingReport}
                  className={`flex-1 px-4 py-2 rounded-md transition-colors flex items-center justify-center ${
                    !previewData || isGeneratingReport
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  {isGeneratingReport ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Generating Report...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Download Report
                    </>
                  )}
                </button>
              </div>
              
              {/* Quick Actions */}
              <div className="flex space-x-2">
                <button
                  onClick={() => setReportConfig(prev => ({ ...prev, includeCharts: !prev.includeCharts }))}
                  className={`px-3 py-1 text-xs rounded-md transition-colors ${
                    reportConfig.includeCharts 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  <BarChart3 className="h-3 w-3 mr-1" />
                  Charts
                </button>
                <button
                  onClick={() => setReportConfig(prev => ({ ...prev, includeAuditInfo: !prev.includeAuditInfo }))}
                  className={`px-3 py-1 text-xs rounded-md transition-colors ${
                    reportConfig.includeAuditInfo 
                      ? 'bg-yellow-100 text-yellow-700' 
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  <Shield className="h-3 w-3 mr-1" />
                  Audit
                </button>
                <button
                  onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                  className={`px-3 py-1 text-xs rounded-md transition-colors ${
                    showAdvancedOptions 
                      ? 'bg-purple-100 text-purple-700' 
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  <Settings className="h-3 w-3 mr-1" />
                  Advanced
                </button>
              </div>
            </div>
          </div>

          {/* Enhanced Preview Panel */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-medium text-gray-900">Live Report Preview</h4>
              <div className="flex items-center space-x-2">
                <button
                  onClick={generatePreview}
                  disabled={isGenerating}
                  className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                >
                  <RefreshCw className={`h-4 w-4 ${isGenerating ? 'animate-spin' : ''}`} />
                </button>
                <span className="text-xs text-gray-500">
                  {previewData ? 'Last updated: ' + new Date().toLocaleTimeString() : 'No data'}
                </span>
              </div>
            </div>
            
            {previewData ? (
              <div className="space-y-6">
                {/* Enhanced Summary Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h5 className="font-medium text-blue-900">Total Expenses</h5>
                        <p className="text-2xl font-bold text-blue-600">
                          {formatCurrency(previewData.summary.totalExpenses)}
                        </p>
                      </div>
                      <DollarSign className="h-8 w-8 text-blue-400" />
                    </div>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h5 className="font-medium text-green-900">Variance</h5>
                        <p className={`text-2xl font-bold ${previewData.summary.variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(previewData.summary.variance)}
                        </p>
                      </div>
                      <TrendingUp className="h-8 w-8 text-green-400" />
                    </div>
                  </div>
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h5 className="font-medium text-purple-900">Avg Expense</h5>
                        <p className="text-2xl font-bold text-purple-600">
                          {formatCurrency(previewData.summary.averageExpense)}
                        </p>
                      </div>
                      <Calculator className="h-8 w-8 text-purple-400" />
                    </div>
                  </div>
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h5 className="font-medium text-orange-900">Count</h5>
                        <p className="text-2xl font-bold text-orange-600">
                          {previewData.summary.categoryCount}
                        </p>
                      </div>
                      <Activity className="h-8 w-8 text-orange-400" />
                    </div>
                  </div>
                </div>

                {/* Report Type Specific Content */}
                {reportConfig.reportType === 'ledger' && previewData.ledgerEntries && (
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h5 className="font-medium text-gray-900 mb-3 flex items-center">
                      <BookOpen className="h-4 w-4 mr-2" />
                      Ledger Entries Preview
                    </h5>
                    <div className="space-y-2">
                      {previewData.ledgerEntries.slice(0, 5).map((entry: LedgerEntry, index: number) => (
                        <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                          <div>
                            <span className="text-sm font-medium text-gray-900">{entry.accountName}</span>
                            <span className="text-xs text-gray-500 ml-2">({entry.accountNumber})</span>
                          </div>
                          <div className="text-right">
                            <span className={`text-sm font-medium ${entry.debitAmount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                              {entry.debitAmount > 0 ? `Dr: ${formatCurrency(entry.debitAmount)}` : `Cr: ${formatCurrency(entry.creditAmount)}`}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {reportConfig.reportType === 'kpi' && previewData.kpiMetrics && (
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h5 className="font-medium text-gray-900 mb-3 flex items-center">
                      <Target className="h-4 w-4 mr-2" />
                      KPI Metrics Preview
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {previewData.kpiMetrics.slice(0, 4).map((kpi: KPIMetric, index: number) => (
                        <div key={index} className="p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-900">{kpi.name}</span>
                            <div className="flex items-center">
                              {kpi.trend === 'up' ? <ArrowUp className="h-4 w-4 text-green-500" /> :
                               kpi.trend === 'down' ? <ArrowDown className="h-4 w-4 text-red-500" /> :
                               <Minus className="h-4 w-4 text-gray-500" />}
                            </div>
                          </div>
                          <div className="text-2xl font-bold text-gray-900">
                            {formatCurrency(kpi.value)}
                          </div>
                          <div className="text-xs text-gray-500">
                            Target: {formatCurrency(kpi.target)} ({kpi.variancePercentage.toFixed(1)}%)
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {reportConfig.reportType === 'forecast' && previewData.forecastData && (
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h5 className="font-medium text-gray-900 mb-3 flex items-center">
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Forecast Preview
                    </h5>
                    <div className="space-y-2">
                      {previewData.forecastData.slice(0, 6).map((forecast: ForecastData, index: number) => (
                        <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                          <span className="text-sm text-gray-700">{forecast.period}</span>
                          <div className="text-right">
                            <span className="text-sm font-medium text-gray-900">
                              {formatCurrency(forecast.predicted)}
                            </span>
                            <span className="text-xs text-gray-500 ml-2">
                              ({Math.round(forecast.confidence * 100)}% confidence)
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {reportConfig.reportType === 'compliance' && previewData.complianceData && (
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h5 className="font-medium text-gray-900 mb-3 flex items-center">
                      <Shield className="h-4 w-4 mr-2" />
                      Compliance Status
                    </h5>
                    <div className="space-y-2">
                      {previewData.complianceData.slice(0, 3).map((compliance: ComplianceData, index: number) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div className="flex items-center space-x-2">
                            <div className={`w-2 h-2 rounded-full ${
                              compliance.status === 'pass' ? 'bg-green-500' :
                              compliance.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                            }`}></div>
                            <span className="text-sm text-gray-900">{compliance.checkName}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-medium text-gray-900">
                              {compliance.score}/{compliance.maxScore}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Category Breakdown */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h5 className="font-medium text-gray-900 mb-3">Top Categories</h5>
                  <div className="space-y-2">
                    {previewData.categories.slice(0, 5).map((category: any, index: number) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="text-sm text-gray-700">{category.category}</span>
                        <span className="text-sm font-medium text-gray-900">
                          {formatCurrency(category.total)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Vendor Breakdown */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h5 className="font-medium text-gray-900 mb-3">Top Vendors</h5>
                  <div className="space-y-2">
                    {previewData.vendors.slice(0, 5).map((vendor: any, index: number) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="text-sm text-gray-700">{vendor.vendor}</span>
                        <span className="text-sm font-medium text-gray-900">
                          {formatCurrency(vendor.total)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Monthly Trend */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h5 className="font-medium text-gray-900 mb-3">Monthly Trend</h5>
                  <div className="space-y-2">
                    {previewData.monthlyData.slice(0, 6).map((month: any, index: number) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="text-sm text-gray-700">{month.month}</span>
                        <span className="text-sm font-medium text-gray-900">
                          {formatCurrency(month.total)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Chart Preview Placeholder */}
                {reportConfig.includeCharts && (
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h5 className="font-medium text-gray-900 mb-3 flex items-center">
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Chart Preview
                    </h5>
                    <div className="h-48 bg-gray-100 rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-600">Chart will be rendered in the final report</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Audit Trail Preview */}
                {reportConfig.includeAuditInfo && previewData.auditTrail && (
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h5 className="font-medium text-gray-900 mb-3 flex items-center">
                      <Shield className="h-4 w-4 mr-2" />
                      Audit Trail
                    </h5>
                    <div className="space-y-2">
                      {previewData.auditTrail.slice(0, 3).map((audit: AuditEntry, index: number) => (
                        <div key={index} className="p-2 bg-gray-50 rounded text-sm">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="font-medium text-gray-900">{audit.action}</span>
                              <span className="text-gray-500 ml-2">by {audit.user}</span>
                            </div>
                            <span className="text-xs text-gray-500">{audit.timestamp}</span>
                          </div>
                          <div className="text-xs text-gray-600 mt-1">{audit.details}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Generate a preview to see report data</p>
                <p className="text-sm text-gray-500 mt-2">Select a report type and configure filters to get started</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportGenerationModal;



























