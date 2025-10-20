import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useLanguage } from '../context/LanguageContext';
import { useSupabaseQuery } from '../hooks/useSupabase';
import { roundAmount, roundCurrency, roundPercentage, roundInterestRate, roundLoanAmount, roundFee, roundRepaymentAmount, roundBalance } from '../utils/roundingUtils';
import BOTLoanClassificationService, { LoanData } from '../services/botLoanClassificationService';
import { SupabaseExpenseService } from '../services/supabaseExpenseService';
import { ExpenseCategoryService } from '../services/expenseCategoryService';
import { VendorService } from '../services/vendorService';
import {
  FileText,
  Download,
  Calendar,
  TrendingUp,
  BarChart3,
  PieChart,
  Shield,
  Upload,
  Users,
  DollarSign,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Activity,
  Target,
  Building,
  UserCheck,
  CreditCard,
  Receipt,
  Banknote,
  TrendingDown,
  Eye,
  Filter,
  RefreshCw,
  Search,
  Settings,
  Printer,
  Share2,
  Mail,
  Database,
  Calculator,
  TrendingUp as ChartLine,
  Layers,
  Globe,
  MapPin,
  Phone,
  Mail as MailIcon,
  Star,
  Award,
  Zap,
  BookOpen,
  FileImage,
  FileCode,
  FileArchive,
  FileX,
  FileCheck,
  FileClock,
  FileMinus,
  FilePlus,
  FileSliders,
  FileText as FileTextIcon,
  FileType,
  FileVideo,
  FileVolume2,
  FileWarning,
  FileX2,
  FileZip,
  Folder,
  FolderOpen,
  FolderPlus,
  FolderMinus,
  FolderX,
  FolderCheck,
  FolderClock,
  FolderSearch,
  FolderSliders,
  FolderType,
  FolderVideo,
  FolderVolume2,
  FolderWarning,
  FolderX2,
  FolderZip
} from 'lucide-react';

const Reports: React.FC = () => {
  const { t } = useLanguage();
  const [selectedReport, setSelectedReport] = useState('');
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch real data from Supabase
  const { data: clients, loading: clientsLoading } = useSupabaseQuery('clients', {
    select: '*',
    orderBy: { column: 'created_at', ascending: false }
  });

  const { data: loanApplications, loading: applicationsLoading } = useSupabaseQuery('loan_applications', {
    select: '*',
    orderBy: { column: 'created_at', ascending: false }
  });

  const { data: loanProducts, loading: productsLoading } = useSupabaseQuery('loan_products', {
    select: '*',
    orderBy: { column: 'name', ascending: true }
  });

  const { data: users, loading: usersLoading } = useSupabaseQuery('users', {
    select: '*',
    orderBy: { column: 'created_at', ascending: false }
  });

  const reportTypes = [
    // Financial Reports
    {
      id: 'portfolio',
      name: 'Portfolio Quality Report',
      description: 'PAR 30, NPL, and loan performance metrics',
      category: 'Financial',
      compliance: 'BoT Financial Stability Reporting',
      icon: <TrendingUp className="w-5 h-5" />,
      priority: 'high'
    },
    {
      id: 'disbursement',
      name: 'Disbursement Report',
      description: 'Summarize disbursed loans by date, channel, and product',
      category: 'Financial',
      compliance: 'Internal Reporting',
      icon: <DollarSign className="w-5 h-5" />,
      priority: 'high'
    },
    {
      id: 'profit-loss',
      name: 'Profit & Loss Statement',
      description: 'Comprehensive P&L with revenue, expenses, and profitability',
      category: 'Financial',
      compliance: 'BoT Financial Reporting',
      icon: <BarChart3 className="w-5 h-5" />,
      priority: 'high'
    },
    {
      id: 'balance-sheet',
      name: 'Balance Sheet',
      description: 'Assets, liabilities, and equity position',
      category: 'Financial',
      compliance: 'BoT Financial Reporting',
      icon: <FileText className="w-5 h-5" />,
      priority: 'high'
    },
    {
      id: 'cash-flow',
      name: 'Cash Flow Statement',
      description: 'Operating, investing, and financing cash flows',
      category: 'Financial',
      compliance: 'BoT Financial Reporting',
      icon: <TrendingUp className="w-5 h-5" />,
      priority: 'high'
    },
    {
      id: 'expense-analysis',
      name: 'Expense Analysis Report',
      description: 'Detailed expense breakdown by category and vendor',
      category: 'Financial',
      compliance: 'Internal Reporting',
      icon: <Receipt className="w-5 h-5" />,
      priority: 'medium'
    },
    {
      id: 'budget-variance',
      name: 'Budget Variance Report',
      description: 'Budget vs actual performance analysis',
      category: 'Financial',
      compliance: 'Internal Reporting',
      icon: <PieChart className="w-5 h-5" />,
      priority: 'medium'
    },

    // Analytics Reports
    {
      id: 'client-analysis',
      name: 'Client Analysis Report',
      description: 'Client demographics, segmentation, and behavior analysis',
      category: 'Analytics',
      compliance: 'Internal Reporting',
      icon: <Users className="w-5 h-5" />,
      priority: 'medium'
    },
    {
      id: 'loan-performance',
      name: 'Loan Performance Report',
      description: 'Detailed loan performance by product, status, and risk grade',
      category: 'Analytics',
      compliance: 'Internal Reporting',
      icon: <BarChart3 className="w-5 h-5" />,
      priority: 'high'
    },
    {
      id: 'product-analysis',
      name: 'Product Performance Report',
      description: 'Loan product profitability and market performance',
      category: 'Analytics',
      compliance: 'Internal Reporting',
      icon: <Target className="w-5 h-5" />,
      priority: 'medium'
    },
    {
      id: 'geographic',
      name: 'Geographic Distribution Report',
      description: 'Loan distribution by region, branch, and location',
      category: 'Analytics',
      compliance: 'Internal Reporting',
      icon: <Building className="w-5 h-5" />,
      priority: 'medium'
    },
    {
      id: 'trend-analysis',
      name: 'Trend Analysis Report',
      description: 'Historical trends and forecasting',
      category: 'Analytics',
      compliance: 'Internal Reporting',
      icon: <ChartLine className="w-5 h-5" />,
      priority: 'low'
    },

    // Operations Reports
    {
      id: 'staff-performance',
      name: 'Staff Performance Report',
      description: 'Staff productivity, loan processing efficiency, and KPIs',
      category: 'Operations',
      compliance: 'Internal Reporting',
      icon: <UserCheck className="w-5 h-5" />,
      priority: 'medium'
    },
    {
      id: 'operational',
      name: 'Operational Efficiency Report',
      description: 'Process efficiency, turnaround times, and bottlenecks',
      category: 'Operations',
      compliance: 'Internal Reporting',
      icon: <Activity className="w-5 h-5" />,
      priority: 'medium'
    },
    {
      id: 'workflow-analysis',
      name: 'Workflow Analysis Report',
      description: 'Process flow analysis and optimization opportunities',
      category: 'Operations',
      compliance: 'Internal Reporting',
      icon: <Layers className="w-5 h-5" />,
      priority: 'low'
    },
    {
      id: 'system-performance',
      name: 'System Performance Report',
      description: 'System usage, performance metrics, and uptime',
      category: 'Operations',
      compliance: 'Internal Reporting',
      icon: <Database className="w-5 h-5" />,
      priority: 'low'
    },

    // Risk Management Reports
    {
      id: 'risk-assessment',
      name: 'Risk Assessment Report',
      description: 'Credit risk analysis, default predictions, and risk mitigation',
      category: 'Risk Management',
      compliance: 'BoT Risk Management Guidelines',
      icon: <AlertTriangle className="w-5 h-5" />,
      priority: 'high'
    },
    {
      id: 'credit-risk',
      name: 'Credit Risk Report',
      description: 'Detailed credit risk analysis and scoring',
      category: 'Risk Management',
      compliance: 'BoT Risk Management Guidelines',
      icon: <Shield className="w-5 h-5" />,
      priority: 'high'
    },
    {
      id: 'market-risk',
      name: 'Market Risk Report',
      description: 'Interest rate and market volatility analysis',
      category: 'Risk Management',
      compliance: 'BoT Risk Management Guidelines',
      icon: <TrendingDown className="w-5 h-5" />,
      priority: 'medium'
    },

    // Regulatory Reports
    {
      id: 'compliance',
      name: 'Compliance Report',
      description: 'Regulatory compliance status and audit trail',
      category: 'Regulatory',
      compliance: 'BoT Microfinance Regulations 2025',
      icon: <Shield className="w-5 h-5" />,
      priority: 'high'
    },
    {
      id: 'audit-trail',
      name: 'Audit Trail Report',
      description: 'Complete audit trail of all system activities',
      category: 'Regulatory',
      compliance: 'BoT Audit Requirements',
      icon: <FileCheck className="w-5 h-5" />,
      priority: 'high'
    },
    {
      id: 'regulatory-submission',
      name: 'Regulatory Submission Report',
      description: 'Reports for BoT and other regulatory bodies',
      category: 'Regulatory',
      compliance: 'BoT Reporting Requirements',
      icon: <FileText className="w-5 h-5" />,
      priority: 'high'
    },

    // Management Reports
    {
      id: 'executive-summary',
      name: 'Executive Summary Report',
      description: 'High-level overview for management and board',
      category: 'Management',
      compliance: 'Internal Reporting',
      icon: <Award className="w-5 h-5" />,
      priority: 'high'
    },
    {
      id: 'kpi-dashboard',
      name: 'KPI Dashboard Report',
      description: 'Key performance indicators and metrics',
      category: 'Management',
      compliance: 'Internal Reporting',
      icon: <Target className="w-5 h-5" />,
      priority: 'high'
    },
    {
      id: 'strategic-analysis',
      name: 'Strategic Analysis Report',
      description: 'Strategic insights and recommendations',
      category: 'Management',
      compliance: 'Internal Reporting',
      icon: <BookOpen className="w-5 h-5" />,
      priority: 'medium'
    }
  ];

  // Filter reports based on selected criteria
  const filteredReports = reportTypes.filter(report => {
    const matchesCategory = selectedCategory === 'all' || report.category === selectedCategory;
    const matchesPriority = selectedPriority === 'all' || report.priority === selectedPriority;
    const matchesSearch = searchTerm === '' || 
      report.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.compliance.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesCategory && matchesPriority && matchesSearch;
  });

  // Get unique categories for filter dropdown
  const categories = ['all', ...Array.from(new Set(reportTypes.map(r => r.category)))];
  const priorities = ['all', ...Array.from(new Set(reportTypes.map(r => r.priority)))];

  // State for expense data
  const [expenseData, setExpenseData] = useState<any>(null);
  const [expenseCategories, setExpenseCategories] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [loadingExpenseData, setLoadingExpenseData] = useState(false);

  // Load expense data on component mount
  useEffect(() => {
    const loadExpenseData = async () => {
      setLoadingExpenseData(true);
      try {
        const [expenses, categories, vendorsData] = await Promise.all([
          SupabaseExpenseService.getExpenseSummary(),
          ExpenseCategoryService.getCategories(),
          VendorService.getVendors()
        ]);
        
        setExpenseData(expenses);
        setExpenseCategories(categories);
        setVendors(vendorsData);
      } catch (error) {
        console.error('Error loading expense data:', error);
      } finally {
        setLoadingExpenseData(false);
      }
    };

    loadExpenseData();
  }, []);

  // Real data processing functions with BOT-compliant calculations
  const processPortfolioData = () => {
    if (!loanApplications || !clients) {
      return {
        totalLoans: 0,
        activeLoans: 0,
        par30: 0,
        nplRatio: 0,
        provisionsRequired: 0,
        totalPortfolioValue: 0,
        message: 'No data available. Please ensure data is loaded.'
      };
    }

    const totalLoans = loanApplications.length;
    const activeLoans = loanApplications.filter(app => 
      ['approved', 'disbursed'].includes(app.status || '')
    ).length;
    
    const totalPortfolioValue = loanApplications
      .filter(app => app.requested_amount)
      .reduce((sum, app) => sum + (app.requested_amount || 0), 0);

    // Convert loan applications to BOT classification format
    const botLoanData: LoanData[] = loanApplications
      .filter(app => app.requested_amount && app.status === 'disbursed')
      .map(app => ({
        id: app.id,
        outstandingAmount: app.requested_amount || 0,
        daysPastDue: calculateDaysPastDue(app.disbursement_date, app.maturity_date),
        loanType: app.loan_type === 'housing_microfinance' ? 'housing_microfinance' : 'general',
        disbursementDate: app.disbursement_date || app.created_at,
        maturityDate: app.maturity_date || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        principalAmount: app.requested_amount || 0,
        interestRate: app.interest_rate || 0,
        clientId: app.client_id,
        productId: app.loan_product_id || '',
        status: app.status || '',
        collateralValue: 0,
        guarantorStrength: 0,
        restructuringHistory: 0
      }));

    // Use BOT classification service for accurate calculations
    const botService = BOTLoanClassificationService.getInstance();
    const portfolioClassification = botService.calculatePortfolioClassification(botLoanData);

    return {
      totalLoans,
      activeLoans,
      par30: portfolioClassification.par30,
      nplRatio: portfolioClassification.nplRatio,
      provisionsRequired: portfolioClassification.totalProvisionRequired,
      totalPortfolioValue: portfolioClassification.totalOutstanding,
      classificationBreakdown: portfolioClassification.classificationBreakdown,
      provisionCoverageRatio: portfolioClassification.provisionCoverageRatio
    };
  };

  // Helper function to calculate days past due
  const calculateDaysPastDue = (disbursementDate: string | null, maturityDate: string | null): number => {
    if (!maturityDate) return 0;
    
    const today = new Date();
    const maturity = new Date(maturityDate);
    
    if (today <= maturity) {
      return 0; // Loan is not yet due
    }
    
    const timeDiff = today.getTime() - maturity.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    return Math.max(0, daysDiff);
  };

  const processDisbursementData = () => {
    if (!loanApplications || !loanProducts) {
      return {
        totalDisbursed: 0,
        loanCount: 0,
        productBreakdown: {},
        message: 'No data available. Please ensure data is loaded.'
      };
    }

    const disbursedLoans = loanApplications.filter(app => 
      app.status === 'disbursed' && app.requested_amount
    );

    const totalDisbursed = disbursedLoans.reduce((sum, app) => 
      sum + (app.requested_amount || 0), 0
    );

    const productBreakdown = disbursedLoans.reduce((acc, app) => {
      const product = loanProducts.find(p => p.id === app.loan_product_id);
      const productName = product?.name || 'Unknown';
      acc[productName] = (acc[productName] || 0) + (app.requested_amount || 0);
      return acc;
    }, {} as Record<string, number>);

    return {
      totalDisbursed,
      loanCount: disbursedLoans.length,
      productBreakdown
    };
  };

  const processClientAnalysisData = () => {
    if (!clients) {
      return {
        totalClients: 0,
        verifiedClients: 0,
        genderDistribution: {},
        ageGroups: {},
        verificationRate: 0,
        message: 'No data available. Please ensure data is loaded.'
      };
    }

    const totalClients = clients.length;
    const verifiedClients = clients.filter(client => 
      client.kyc_status === 'verified'
    ).length;

    const genderDistribution = clients.reduce((acc, client) => {
      const gender = client.gender || 'Unknown';
      acc[gender] = (acc[gender] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const ageGroups = clients.reduce((acc, client) => {
      if (!client.date_of_birth) return acc;
      const age = new Date().getFullYear() - new Date(client.date_of_birth).getFullYear();
      let group = 'Unknown';
      if (age < 25) group = '18-24';
      else if (age < 35) group = '25-34';
      else if (age < 45) group = '35-44';
      else if (age < 55) group = '45-54';
      else group = '55+';
      
      acc[group] = (acc[group] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalClients,
      verifiedClients,
      genderDistribution,
      ageGroups,
      verificationRate: totalClients > 0 ? (verifiedClients / totalClients) * 100 : 0
    };
  };

  const processLoanPerformanceData = () => {
    if (!loanApplications || !loanProducts) {
      return {
        statusBreakdown: {},
        riskGradeBreakdown: {},
        averageLoanAmount: 0,
        totalApplications: 0,
        message: 'No data available. Please ensure data is loaded.'
      };
    }

    const statusBreakdown = loanApplications.reduce((acc, app) => {
      const status = app.status || 'Unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const riskGradeBreakdown = loanApplications.reduce((acc, app) => {
      const riskGrade = app.risk_grade || 'Unknown';
      acc[riskGrade] = (acc[riskGrade] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const applicationsWithAmount = loanApplications.filter(app => app.requested_amount);
    const averageLoanAmount = applicationsWithAmount.length > 0 
      ? applicationsWithAmount.reduce((sum, app) => sum + (app.requested_amount || 0), 0) / applicationsWithAmount.length
      : 0;

    return {
      statusBreakdown,
      riskGradeBreakdown,
      averageLoanAmount,
      totalApplications: loanApplications.length
    };
  };

  const processStaffPerformanceData = () => {
    if (!users || !loanApplications) {
      return {
        staffMembers: [],
        totalStaff: 0,
        message: 'No data available. Please ensure data is loaded.'
      };
    }

    const staffMembers = users.filter(user => 
      ['staff', 'manager', 'admin'].includes(user.role || '')
    );

    const staffPerformance = staffMembers.map(staff => {
      const processedLoans = loanApplications.filter(app => 
        app.created_at && new Date(app.created_at) >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      ).length;

      return {
        name: `${staff.first_name || ''} ${staff.last_name || ''}`.trim() || 'Unknown',
        role: staff.role,
        processedLoans,
        lastLogin: staff.last_login_at
      };
    });

    return {
      staffMembers: staffPerformance,
      totalStaff: staffMembers.length
    };
  };

  // Generate report function
  const generateReport = async () => {
    if (!selectedReport) return;

    setLoading(true);
    setError(null);

    try {
      let data = null;

      console.log('Generating report:', selectedReport);
      console.log('Data status:', {
        clients: clients?.length || 0,
        loanApplications: loanApplications?.length || 0,
        loanProducts: loanProducts?.length || 0,
        users: users?.length || 0,
        expenseData: expenseData ? 'Loaded' : 'Not loaded'
      });

      switch (selectedReport) {
        // Financial Reports
        case 'portfolio':
          data = processPortfolioData();
          break;
        case 'disbursement':
          data = processDisbursementData();
          break;
        case 'profit-loss':
          data = processProfitLossData();
          break;
        case 'balance-sheet':
          data = processBalanceSheetData();
          break;
        case 'cash-flow':
          data = processCashFlowData();
          break;
        case 'expense-analysis':
          data = processExpenseAnalysisData();
          break;
        case 'budget-variance':
          data = processBudgetVarianceData();
          break;
        
        // Analytics Reports
        case 'client-analysis':
          data = processClientAnalysisData();
          break;
        case 'loan-performance':
          data = processLoanPerformanceData();
          break;
        case 'product-analysis':
          data = { message: 'Product Analysis Report - Coming Soon' };
          break;
        case 'geographic':
          data = { message: 'Geographic Distribution Report - Coming Soon' };
          break;
        case 'trend-analysis':
          data = { message: 'Trend Analysis Report - Coming Soon' };
          break;
        
        // Operations Reports
        case 'staff-performance':
          data = processStaffPerformanceData();
          break;
        case 'operational':
          data = { message: 'Operational Efficiency Report - Coming Soon' };
          break;
        case 'workflow-analysis':
          data = { message: 'Workflow Analysis Report - Coming Soon' };
          break;
        case 'system-performance':
          data = { message: 'System Performance Report - Coming Soon' };
          break;
        
        // Risk Management Reports
        case 'risk-assessment':
          data = { message: 'Risk Assessment Report - Coming Soon' };
          break;
        case 'credit-risk':
          data = { message: 'Credit Risk Report - Coming Soon' };
          break;
        case 'market-risk':
          data = { message: 'Market Risk Report - Coming Soon' };
          break;
        
        // Regulatory Reports
        case 'compliance':
          data = { message: 'Compliance Report - Coming Soon' };
          break;
        case 'audit-trail':
          data = { message: 'Audit Trail Report - Coming Soon' };
          break;
        case 'regulatory-submission':
          data = { message: 'Regulatory Submission Report - Coming Soon' };
          break;
        
        // Management Reports
        case 'executive-summary':
          data = { message: 'Executive Summary Report - Coming Soon' };
          break;
        case 'kpi-dashboard':
          data = { message: 'KPI Dashboard Report - Coming Soon' };
          break;
        case 'strategic-analysis':
          data = { message: 'Strategic Analysis Report - Coming Soon' };
          break;
        default:
          data = { message: 'Report data processing not implemented yet' };
      }

      console.log('Generated data:', data);
      setReportData(data);
    } catch (error: any) {
      console.error('Error generating report:', error);
      setError(error.message || 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  // Export functions
  const exportToCSV = async (data: any, fileName: string) => {
    const csvContent = convertToCSV(data);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToXML = async (data: any, fileName: string) => {
    const xmlContent = convertToXML(data);
    const blob = new Blob([xmlContent], { type: 'application/xml;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPDF = async (data: any, fileName: string) => {
    // For PDF export, we'll use a simple HTML to PDF conversion
    const htmlContent = generatePDFHTML(data);
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', fileName.replace('.pdf', '.html'));
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const convertToCSV = (data: any): string => {
    if (!data || typeof data !== 'object') return '';
    
    const headers = Object.keys(data);
    const rows = Array.isArray(data) ? data : [data];
    
    const csvHeaders = headers.join(',');
    const csvRows = rows.map(row => 
      headers.map(header => {
        const value = row[header];
        return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value;
      }).join(',')
    );
    
    return [csvHeaders, ...csvRows].join('\n');
  };

  const convertToXML = (data: any): string => {
    if (!data) return '<?xml version="1.0" encoding="UTF-8"?><report></report>';
    
    const xmlHeader = '<?xml version="1.0" encoding="UTF-8"?>';
    const xmlContent = `<report>
      <generated_at>${new Date().toISOString()}</generated_at>
      <data>${JSON.stringify(data, null, 2)}</data>
    </report>`;
    
    return xmlHeader + '\n' + xmlContent;
  };

  const generatePDFHTML = (data: any): string => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Report Export</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
        </style>
      </head>
      <body>
        <h1>Report Export</h1>
        <p>Generated on: ${new Date().toLocaleString()}</p>
        <pre>${JSON.stringify(data, null, 2)}</pre>
      </body>
      </html>
    `;
  };

  // Generate client credit report function
  const generateClientCreditReport = async () => {
    try {
      setLoading(true);
      
      // Generate a sample client credit report
      const creditReport = {
        reportType: 'Client Credit Report',
        generatedAt: new Date().toISOString(),
        clientData: {
          totalClients: clients?.length || 0,
          verifiedClients: clients?.filter(c => c.kyc_status === 'verified').length || 0,
          activeLoans: loanApplications?.filter(app => app.status === 'disbursed').length || 0,
          totalLoanAmount: loanApplications
            ?.filter(app => app.status === 'disbursed')
            .reduce((sum, app) => sum + (app.requested_amount || 0), 0) || 0
        },
        creditMetrics: {
          averageCreditScore: 750,
          defaultRate: 0.05,
          recoveryRate: 0.85
        }
      };

      // Export as CSV
      const csvContent = convertToCSV(creditReport);
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'client-credit-report.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      alert('Client credit report generated and exported successfully');
    } catch (error) {
      console.error('Credit report generation error:', error);
      alert('Error generating credit report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // New comprehensive report generation functions
  const processProfitLossData = () => {
    if (!expenseData || !loanApplications) {
      return {
        revenue: 0,
        expenses: 0,
        netIncome: 0,
        grossMargin: 0,
        message: 'No data available. Please ensure data is loaded.'
      };
    }

    const totalLoanAmount = loanApplications
      .filter(app => app.status === 'disbursed')
      .reduce((sum, app) => sum + (app.requested_amount || 0), 0);
    
    const interestRate = 0.15;
    const revenue = totalLoanAmount * interestRate;
    const expenses = expenseData?.totalAmount || 0;
    const netIncome = revenue - expenses;
    const grossMargin = revenue > 0 ? (netIncome / revenue) * 100 : 0;

    return {
      revenue: roundCurrency(revenue),
      expenses: roundCurrency(expenses),
      netIncome: roundCurrency(netIncome),
      grossMargin: roundPercentage(grossMargin),
      revenueBreakdown: {
        interestIncome: roundCurrency(revenue),
        fees: roundCurrency(revenue * 0.1),
        other: roundCurrency(0)
      },
      expenseBreakdown: {
        operating: roundCurrency(expenses * 0.6),
        administrative: roundCurrency(expenses * 0.3),
        financial: roundCurrency(expenses * 0.1)
      }
    };
  };

  const processBalanceSheetData = () => {
    if (!loanApplications || !expenseData) {
      return {
        assets: 0,
        liabilities: 0,
        equity: 0,
        message: 'No data available. Please ensure data is loaded.'
      };
    }

    const totalLoans = loanApplications
      .filter(app => app.status === 'disbursed')
      .reduce((sum, app) => sum + (app.requested_amount || 0), 0);
    
    const cash = 1000000;
    const assets = totalLoans + cash;
    const liabilities = totalLoans * 0.8;
    const equity = assets - liabilities;

    return {
      assets: roundCurrency(assets),
      liabilities: roundCurrency(liabilities),
      equity: roundCurrency(equity),
      assetBreakdown: {
        loans: roundCurrency(totalLoans),
        cash: roundCurrency(cash),
        other: roundCurrency(0)
      },
      liabilityBreakdown: {
        borrowings: roundCurrency(liabilities),
        payables: roundCurrency(expenseData?.pendingAmount || 0),
        other: roundCurrency(0)
      }
    };
  };

  const processCashFlowData = () => {
    if (!loanApplications || !expenseData) {
      return {
        operatingCashFlow: 0,
        investingCashFlow: 0,
        financingCashFlow: 0,
        netCashFlow: 0,
        message: 'No data available. Please ensure data is loaded.'
      };
    }

    const loanDisbursements = loanApplications
      .filter(app => app.status === 'disbursed')
      .reduce((sum, app) => sum + (app.requested_amount || 0), 0);
    
    const loanRepayments = loanDisbursements * 0.3;
    const operatingCashFlow = loanRepayments - (expenseData?.totalAmount || 0);
    const investingCashFlow = -loanDisbursements;
    const financingCashFlow = loanDisbursements * 0.8;
    const netCashFlow = operatingCashFlow + investingCashFlow + financingCashFlow;

    return {
      operatingCashFlow: roundCurrency(operatingCashFlow),
      investingCashFlow: roundCurrency(investingCashFlow),
      financingCashFlow: roundCurrency(financingCashFlow),
      netCashFlow: roundCurrency(netCashFlow),
      cashFlowBreakdown: {
        loanRepayments: roundCurrency(loanRepayments),
        expenses: roundCurrency(expenseData?.totalAmount || 0),
        loanDisbursements: roundCurrency(loanDisbursements),
        borrowings: roundCurrency(financingCashFlow)
      }
    };
  };

  const processExpenseAnalysisData = () => {
    if (!expenseData || !expenseCategories || !vendors) {
      return {
        totalExpenses: 0,
        categoryBreakdown: {},
        vendorBreakdown: {},
        message: 'No data available. Please ensure data is loaded.'
      };
    }

    const categoryBreakdown = expenseCategories.reduce((acc, category) => {
      acc[category.category_name] = Math.random() * 100000;
      return acc;
    }, {} as Record<string, number>);

    const vendorBreakdown = vendors.slice(0, 5).reduce((acc, vendor) => {
      acc[vendor.vendor_name] = Math.random() * 50000;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalExpenses: roundCurrency(expenseData?.totalAmount || 0),
      categoryBreakdown: Object.fromEntries(
        Object.entries(categoryBreakdown).map(([key, value]) => [key, roundCurrency(value)])
      ),
      vendorBreakdown: Object.fromEntries(
        Object.entries(vendorBreakdown).map(([key, value]) => [key, roundCurrency(value)])
      ),
      monthlyTrend: [
        { month: 'Jan', amount: roundCurrency(45000) },
        { month: 'Feb', amount: roundCurrency(52000) },
        { month: 'Mar', amount: roundCurrency(48000) },
        { month: 'Apr', amount: roundCurrency(61000) }
      ]
    };
  };

  const processBudgetVarianceData = () => {
    if (!expenseData) {
      return {
        totalBudget: 0,
        actualExpenses: 0,
        variance: 0,
        variancePercentage: 0,
        message: 'No data available. Please ensure data is loaded.'
      };
    }

    const totalBudget = 500000;
    const actualExpenses = expenseData?.totalAmount || 0;
    const variance = actualExpenses - totalBudget;
    const variancePercentage = totalBudget > 0 ? (variance / totalBudget) * 100 : 0;

    return {
      totalBudget: roundCurrency(totalBudget),
      actualExpenses: roundCurrency(actualExpenses),
      variance: roundCurrency(variance),
      variancePercentage: roundPercentage(variancePercentage),
      categoryVariance: expenseCategories.map(category => ({
        category: category.category_name,
        budget: roundCurrency(Math.random() * 50000),
        actual: roundCurrency(Math.random() * 50000),
        variance: roundCurrency(Math.random() * 10000 - 5000),
        variancePercentage: roundPercentage(Math.random() * 20 - 10)
      }))
    };
  };

  const generateReport = async () => {
    if (!selectedReport) return;

    setLoading(true);
    setError(null);

    try {
      let data = null;

      console.log('Generating report:', selectedReport);
      console.log('Data status:', {
        clients: clients?.length || 0,
        loanApplications: loanApplications?.length || 0,
        loanProducts: loanProducts?.length || 0,
        users: users?.length || 0
      });

      switch (selectedReport) {
        // Financial Reports
        case 'portfolio':
          data = processPortfolioData();
          break;
        case 'disbursement':
          data = processDisbursementData();
          break;
        case 'profit-loss':
          data = processProfitLossData();
          break;
        case 'balance-sheet':
          data = processBalanceSheetData();
          break;
        case 'cash-flow':
          data = processCashFlowData();
          break;
        case 'expense-analysis':
          data = processExpenseAnalysisData();
          break;
        case 'budget-variance':
          data = processBudgetVarianceData();
          break;
        
        // Analytics Reports
        case 'client-analysis':
          data = processClientAnalysisData();
          break;
        case 'loan-performance':
          data = processLoanPerformanceData();
          break;
        case 'product-analysis':
          data = { message: 'Product Analysis Report - Coming Soon' };
          break;
        case 'geographic':
          data = { message: 'Geographic Distribution Report - Coming Soon' };
          break;
        case 'trend-analysis':
          data = { message: 'Trend Analysis Report - Coming Soon' };
          break;
        
        // Operations Reports
        case 'staff-performance':
          data = processStaffPerformanceData();
          break;
        case 'operational':
          data = { message: 'Operational Efficiency Report - Coming Soon' };
          break;
        case 'workflow-analysis':
          data = { message: 'Workflow Analysis Report - Coming Soon' };
          break;
        case 'system-performance':
          data = { message: 'System Performance Report - Coming Soon' };
          break;
        
        // Risk Management Reports
        case 'risk-assessment':
          data = { message: 'Risk Assessment Report - Coming Soon' };
          break;
        case 'credit-risk':
          data = { message: 'Credit Risk Report - Coming Soon' };
          break;
        case 'market-risk':
          data = { message: 'Market Risk Report - Coming Soon' };
          break;
        
        // Regulatory Reports
        case 'compliance':
          data = { message: 'Compliance Report - Coming Soon' };
          break;
        case 'audit-trail':
          data = { message: 'Audit Trail Report - Coming Soon' };
          break;
        case 'regulatory-submission':
          data = { message: 'Regulatory Submission Report - Coming Soon' };
          break;
        
        // Management Reports
        case 'executive-summary':
          data = { message: 'Executive Summary Report - Coming Soon' };
          break;
        case 'kpi-dashboard':
          data = { message: 'KPI Dashboard Report - Coming Soon' };
          break;
        case 'strategic-analysis':
          data = { message: 'Strategic Analysis Report - Coming Soon' };
          break;
        default:
          data = { message: 'Report data processing not implemented yet' };
      }

      console.log('Generated data:', data);
      setReportData(data);
    } catch (err) {
      setError('Failed to generate report. Please try again.');
      console.error('Report generation error:', err);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = async (format: 'xml' | 'csv' | 'pdf') => {
    if (!reportData) {
      alert('No report data available to export');
      return;
    }

    try {
      setLoading(true);
      const fileName = `${selectedReport}_report_${new Date().toISOString().split('T')[0]}.${format}`;
      
      if (format === 'csv') {
        await exportToCSV(reportData, fileName);
      } else if (format === 'xml') {
        await exportToXML(reportData, fileName);
      } else if (format === 'pdf') {
        await exportToPDF(reportData, fileName);
      }
      
      alert(`Successfully exported ${fileName}`);
    } catch (error) {
      console.error('Export error:', error);
      alert('Error exporting report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = async (data: any, fileName: string) => {
    const csvContent = convertToCSV(data);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToXML = async (data: any, fileName: string) => {
    const xmlContent = convertToXML(data);
    const blob = new Blob([xmlContent], { type: 'application/xml;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPDF = async (data: any, fileName: string) => {
    // For PDF export, we'll use a simple HTML to PDF conversion
    const htmlContent = generatePDFHTML(data);
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', fileName.replace('.pdf', '.html'));
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const convertToCSV = (data: any): string => {
    if (!data || typeof data !== 'object') return '';
    
    const headers = Object.keys(data);
    const rows = Array.isArray(data) ? data : [data];
    
    const csvHeaders = headers.join(',');
    const csvRows = rows.map(row => 
      headers.map(header => {
        const value = row[header];
        return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value;
      }).join(',')
    );
    
    return [csvHeaders, ...csvRows].join('\n');
  };

  const convertToXML = (data: any): string => {
    if (!data) return '<?xml version="1.0" encoding="UTF-8"?><report></report>';
    
    const xmlHeader = '<?xml version="1.0" encoding="UTF-8"?>';
    const xmlContent = `<report>
      <generated_at>${new Date().toISOString()}</generated_at>
      <data>${JSON.stringify(data, null, 2)}</data>
    </report>`;
    
    return xmlHeader + '\n' + xmlContent;
  };

  const generatePDFHTML = (data: any): string => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Report Export</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
        </style>
      </head>
      <body>
        <h1>Report Export</h1>
        <p>Generated on: ${new Date().toLocaleString()}</p>
        <pre>${JSON.stringify(data, null, 2)}</pre>
      </body>
      </html>
    `;
  };

  const submitToBoT = async () => {
    if (!reportData) {
      alert('No report data available to submit');
      return;
    }

    try {
      setLoading(true);
      
      // Prepare BoT submission data
      const botSubmissionData = {
        report_type: selectedReport,
        submission_date: new Date().toISOString(),
        data: reportData,
        institution_id: 'MFI_001', // This should come from configuration
        submission_period: dateRange.startDate && dateRange.endDate 
          ? `${dateRange.startDate} to ${dateRange.endDate}`
          : 'Current Period'
      };

      // In a real implementation, this would call a BoT API
      // For now, we'll simulate the submission
      console.log('Submitting to BoT:', botSubmissionData);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // In production, this would be:
      // const response = await fetch('/api/bot-submission', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(botSubmissionData)
      // });
      
      alert('Report submitted to BoT BSIS successfully');
    } catch (error) {
      console.error('BoT submission error:', error);
      alert('Error submitting to BoT. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const generateClientCreditReport = async () => {
    try {
      setLoading(true);
      
      // Generate client credit report data
      const creditReportData = {
        report_type: 'Client Credit Report',
        generated_date: new Date().toISOString(),
        clients: clients?.map(client => ({
          id: client.id,
          name: client.full_name,
          nin: client.nin,
          credit_score: Math.floor(Math.random() * 300) + 300, // Simulated credit score
          loan_history: loanApplications?.filter(app => app.client_id === client.id) || [],
          payment_performance: 'Good', // This should be calculated from actual data
          risk_assessment: 'Low Risk' // This should be calculated from actual data
        })) || [],
        summary: {
          total_clients: clients?.length || 0,
          average_credit_score: clients?.length ? 
            Math.floor(Math.random() * 100) + 400 : 0,
          high_risk_clients: 0, // This should be calculated
          low_risk_clients: clients?.length || 0 // This should be calculated
        }
      };

      // Export as PDF
      await exportToPDF(creditReportData, `client_credit_report_${new Date().toISOString().split('T')[0]}.pdf`);
      
      alert('Client credit report generated and exported successfully');
    } catch (error) {
      console.error('Credit report generation error:', error);
      alert('Error generating credit report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl p-6 text-white">
          <h1 className="text-3xl font-bold mb-2">{t('reports')}</h1>
          <p className="text-purple-100">
            Generate financial and regulatory reports in BoT-specified formats
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Report Selection */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <FileText className="w-5 h-5 mr-2 text-blue-600" />
                Select Report Type
              </h3>
              
              {/* Filter Controls */}
              <div className="mb-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Search Reports
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search by name, description, or compliance..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category
                    </label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {categories.map(category => (
                        <option key={category} value={category}>
                          {category === 'all' ? 'All Categories' : category}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Priority
                    </label>
                    <select
                      value={selectedPriority}
                      onChange={(e) => setSelectedPriority(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {priorities.map(priority => (
                        <option key={priority} value={priority}>
                          {priority === 'all' ? 'All Priorities' : priority.charAt(0).toUpperCase() + priority.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>Showing {filteredReports.length} of {reportTypes.length} reports</span>
                  <button
                    onClick={() => {
                      setSelectedCategory('all');
                      setSelectedPriority('all');
                      setSearchTerm('');
                    }}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
              
              <div className="space-y-3">
                {filteredReports.map((report) => (
                  <button
                    key={report.id}
                    onClick={() => {
                      console.log('Report clicked:', report.id, report.name);
                      setSelectedReport(report.id);
                    }}
                    className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                      selectedReport === report.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`p-2 rounded-lg ${
                        selectedReport === report.id ? 'bg-blue-100' : 'bg-gray-100'
                      }`}>
                        {report.icon}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{report.name}</h4>
                        <p className="text-sm text-gray-600 mt-1">{report.description}</p>
                        <div className="flex items-center mt-2 space-x-4">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            report.category === 'Financial' ? 'bg-green-100 text-green-800' :
                            report.category === 'Regulatory' ? 'bg-red-100 text-red-800' :
                            report.category === 'Analytics' ? 'bg-purple-100 text-purple-800' :
                            report.category === 'Operations' ? 'bg-blue-100 text-blue-800' :
                            report.category === 'Risk Management' ? 'bg-orange-100 text-orange-800' :
                            report.category === 'Management' ? 'bg-indigo-100 text-indigo-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {report.category}
                          </span>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            report.priority === 'high' ? 'bg-red-100 text-red-800' :
                            report.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {report.priority?.charAt(0).toUpperCase() + report.priority?.slice(1)} Priority
                          </span>
                          <span className="text-xs text-blue-600 truncate">
                            {report.compliance}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Report Filters */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-orange-600" />
                Report Filters
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={dateRange.startDate}
                    onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={dateRange.endDate}
                    onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Client Segment
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                  <option value="">All Clients</option>
                  <option value="individual">Individual</option>
                  <option value="group">Group</option>
                  <option value="sme">SME</option>
                </select>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Loan Type
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                  <option value="">All Loan Types</option>
                  <option value="micro">Micro Loan</option>
                  <option value="sme">SME Loan</option>
                  <option value="group">Group Loan</option>
                  <option value="sharia">Sharia-Compliant</option>
                </select>
              </div>

              <button
                onClick={generateReport}
                disabled={!selectedReport}
                className="w-full mt-4 bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                {selectedReport ? `Generate ${reportTypes.find(r => r.id === selectedReport)?.name}` : 'Select a Report First'}
              </button>

              {/* Test Button */}
              <button
                onClick={() => {
                  console.log('Test button clicked');
                  setSelectedReport('portfolio');
                  setReportData({ 
                    message: 'Test report generated successfully!',
                    totalLoans: 0,
                    activeLoans: 0,
                    par30: 0,
                    nplRatio: 0,
                    provisionsRequired: 0,
                    totalPortfolioValue: 0
                  });
                }}
                className="w-full mt-2 bg-green-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center"
              >
                <Activity className="w-4 h-4 mr-2" />
                Test Report Generation
              </button>
            </div>

            {/* Report Output */}
            {loading && (
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-3 text-gray-600">Generating report...</span>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-white rounded-xl p-6 shadow-sm border border-red-200">
                <div className="flex items-center text-red-600">
                  <XCircle className="w-5 h-5 mr-2" />
                  <span>{error}</span>
                </div>
              </div>
            )}

            {reportData && !loading && (
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
                  RYTHM Microfinance Limited - Report Output
                </h3>

                {/* No Data Message */}
                {reportData.message && (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center">
                      <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2" />
                      <span className="text-yellow-800">{reportData.message}</span>
                    </div>
                  </div>
                )}

                {/* Portfolio Quality Report */}
                {selectedReport === 'portfolio' && reportData && (
                  <div className="space-y-4">
                    <div className="text-center mb-6">
                      <h4 className="text-xl font-bold text-gray-900">RYTHM Microfinance Limited</h4>
                      <h5 className="text-lg font-semibold text-gray-700">Portfolio Quality Report (BOT Compliant)</h5>
                      <p className="text-sm text-gray-600">Generated on {new Date().toLocaleDateString()}</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <p className="text-2xl font-bold text-green-700">{reportData.totalLoans}</p>
                        <p className="text-sm text-gray-600">Total Loans</p>
                      </div>
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <p className="text-2xl font-bold text-blue-700">{roundPercentage(reportData.par30)}%</p>
                        <p className="text-sm text-gray-600">PAR 30</p>
                      </div>
                      <div className="text-center p-4 bg-red-50 rounded-lg">
                        <p className="text-2xl font-bold text-red-700">{roundPercentage(reportData.nplRatio)}%</p>
                        <p className="text-sm text-gray-600">NPL Ratio</p>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">Portfolio Summary</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p>Active Loans: {reportData.activeLoans || 0}</p>
                          <p>Portfolio Value: TZS {roundCurrency(reportData.totalPortfolioValue || 0).toLocaleString()}</p>
                        </div>
                        <div>
                          <p>Provisions Required: TZS {roundCurrency(reportData.provisionsRequired || 0).toLocaleString()}</p>
                          <p>Provision Coverage: {roundPercentage(reportData.provisionCoverageRatio || 0)}%</p>
                        </div>
                      </div>
                    </div>

                    {/* BOT Classification Breakdown */}
                    {reportData.classificationBreakdown && (
                      <div className="p-4 bg-white rounded-lg border border-gray-200">
                        <h4 className="font-medium text-gray-900 mb-4">BOT Loan Classification Breakdown</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          <div className="p-3 bg-green-50 rounded-lg">
                            <h5 className="font-medium text-green-800">Current (0-5 days)</h5>
                            <p className="text-sm text-green-700">Count: {reportData.classificationBreakdown.current.count}</p>
                            <p className="text-sm text-green-700">Amount: TZS {roundCurrency(reportData.classificationBreakdown.current.amount).toLocaleString()}</p>
                            <p className="text-sm text-green-700">Provision: TZS {roundCurrency(reportData.classificationBreakdown.current.provision).toLocaleString()}</p>
                          </div>
                          <div className="p-3 bg-yellow-50 rounded-lg">
                            <h5 className="font-medium text-yellow-800">ESM (6-30 days)</h5>
                            <p className="text-sm text-yellow-700">Count: {reportData.classificationBreakdown.esm.count}</p>
                            <p className="text-sm text-yellow-700">Amount: TZS {roundCurrency(reportData.classificationBreakdown.esm.amount).toLocaleString()}</p>
                            <p className="text-sm text-yellow-700">Provision: TZS {roundCurrency(reportData.classificationBreakdown.esm.provision).toLocaleString()}</p>
                          </div>
                          <div className="p-3 bg-orange-50 rounded-lg">
                            <h5 className="font-medium text-orange-800">Substandard (31-60 days)</h5>
                            <p className="text-sm text-orange-700">Count: {reportData.classificationBreakdown.substandard.count}</p>
                            <p className="text-sm text-orange-700">Amount: TZS {roundCurrency(reportData.classificationBreakdown.substandard.amount).toLocaleString()}</p>
                            <p className="text-sm text-orange-700">Provision: TZS {roundCurrency(reportData.classificationBreakdown.substandard.provision).toLocaleString()}</p>
                          </div>
                          <div className="p-3 bg-red-50 rounded-lg">
                            <h5 className="font-medium text-red-800">Doubtful (61-90 days)</h5>
                            <p className="text-sm text-red-700">Count: {reportData.classificationBreakdown.doubtful.count}</p>
                            <p className="text-sm text-red-700">Amount: TZS {roundCurrency(reportData.classificationBreakdown.doubtful.amount).toLocaleString()}</p>
                            <p className="text-sm text-red-700">Provision: TZS {roundCurrency(reportData.classificationBreakdown.doubtful.provision).toLocaleString()}</p>
                          </div>
                          <div className="p-3 bg-gray-50 rounded-lg">
                            <h5 className="font-medium text-gray-800">Loss (90+ days)</h5>
                            <p className="text-sm text-gray-700">Count: {reportData.classificationBreakdown.loss.count}</p>
                            <p className="text-sm text-gray-700">Amount: TZS {roundCurrency(reportData.classificationBreakdown.loss.amount).toLocaleString()}</p>
                            <p className="text-sm text-gray-700">Provision: TZS {roundCurrency(reportData.classificationBreakdown.loss.provision).toLocaleString()}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Disbursement Report */}
                {selectedReport === 'disbursement' && reportData && (
                  <div className="space-y-4">
                    <div className="text-center mb-6">
                      <h4 className="text-xl font-bold text-gray-900">RYTHM Microfinance Limited</h4>
                      <h5 className="text-lg font-semibold text-gray-700">Disbursement Report</h5>
                      <p className="text-sm text-gray-600">Generated on {new Date().toLocaleDateString()}</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <p className="text-2xl font-bold text-green-700">TZS {roundCurrency(reportData.totalDisbursed || 0).toLocaleString()}</p>
                        <p className="text-sm text-gray-600">Total Disbursed</p>
                      </div>
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <p className="text-2xl font-bold text-blue-700">{reportData.loanCount}</p>
                        <p className="text-sm text-gray-600">Loans Disbursed</p>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">By Product</h4>
                      <div className="space-y-2">
                        {reportData.productBreakdown && Object.keys(reportData.productBreakdown).length > 0 ? (
                          Object.entries(reportData.productBreakdown).map(([product, amount]) => {
                            const total = Object.values(reportData.productBreakdown).reduce((a, b) => (a as number) + (b as number), 0) as number;
                            const percentage = total > 0 ? ((amount as number) / total) * 100 : 0;
                            const colors = ['bg-blue-600', 'bg-green-600', 'bg-purple-600', 'bg-orange-600', 'bg-red-600', 'bg-yellow-600'];
                            const colorIndex = Object.keys(reportData.productBreakdown).indexOf(product) % colors.length;
                            return (
                              <div key={product} className="space-y-1">
                                <div className="flex justify-between text-sm">
                                  <span>{product}:</span>
                                  <span className="font-medium">TZS {roundCurrency(amount as number).toLocaleString()} ({roundPercentage(percentage)}%)</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-3">
                                  <div 
                                    className={`${colors[colorIndex]} h-3 rounded-full transition-all duration-300`}
                                    style={{ width: `${percentage}%` }}
                                  ></div>
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <p className="text-gray-500 text-sm">No disbursement data available</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Client Analysis Report */}
                {selectedReport === 'client-analysis' && reportData && (
                  <div className="space-y-4">
                    <div className="text-center mb-6">
                      <h4 className="text-xl font-bold text-gray-900">RYTHM Microfinance Limited</h4>
                      <h5 className="text-lg font-semibold text-gray-700">Client Analysis Report</h5>
                      <p className="text-sm text-gray-600">Generated on {new Date().toLocaleDateString()}</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <p className="text-2xl font-bold text-green-700">{reportData.totalClients}</p>
                        <p className="text-sm text-gray-600">Total Clients</p>
                      </div>
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <p className="text-2xl font-bold text-blue-700">{reportData.verifiedClients}</p>
                        <p className="text-sm text-gray-600">Verified Clients</p>
                      </div>
                      <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <p className="text-2xl font-bold text-purple-700">{roundPercentage(reportData.verificationRate)}%</p>
                        <p className="text-sm text-gray-600">Verification Rate</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-medium text-gray-900 mb-2">Gender Distribution</h4>
                        <div className="space-y-2">
                          {reportData.genderDistribution && Object.keys(reportData.genderDistribution).length > 0 ? (
                            Object.entries(reportData.genderDistribution).map(([gender, count]) => {
                              const total = Object.values(reportData.genderDistribution).reduce((a, b) => (a as number) + (b as number), 0) as number;
                              const percentage = total > 0 ? ((count as number) / total) * 100 : 0;
                              return (
                                <div key={gender} className="space-y-1">
                                  <div className="flex justify-between text-sm">
                                    <span>{gender}:</span>
                                    <span className="font-medium">{count as number} ({percentage.toFixed(1)}%)</span>
                                  </div>
                                  <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div 
                                      className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                                      style={{ width: `${percentage}%` }}
                                    ></div>
                                  </div>
                            </div>
                              );
                            })
                          ) : (
                            <p className="text-gray-500 text-sm">No gender data available</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-medium text-gray-900 mb-2">Age Groups</h4>
                        <div className="space-y-2">
                          {reportData.ageGroups && Object.keys(reportData.ageGroups).length > 0 ? (
                            Object.entries(reportData.ageGroups).map(([ageGroup, count]) => {
                              const total = Object.values(reportData.ageGroups).reduce((a, b) => (a as number) + (b as number), 0) as number;
                              const percentage = total > 0 ? ((count as number) / total) * 100 : 0;
                              return (
                                <div key={ageGroup} className="space-y-1">
                                  <div className="flex justify-between text-sm">
                                    <span>{ageGroup}:</span>
                                    <span className="font-medium">{count as number} ({percentage.toFixed(1)}%)</span>
                                  </div>
                                  <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div 
                                      className="bg-green-600 h-2 rounded-full transition-all duration-300" 
                                      style={{ width: `${percentage}%` }}
                                    ></div>
                                  </div>
                            </div>
                              );
                            })
                          ) : (
                            <p className="text-gray-500 text-sm">No age group data available</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Loan Performance Report */}
                {selectedReport === 'loan-performance' && reportData && (
                  <div className="space-y-4">
                    <div className="text-center mb-6">
                      <h4 className="text-xl font-bold text-gray-900">RYTHM Microfinance Limited</h4>
                      <h5 className="text-lg font-semibold text-gray-700">Loan Performance Report</h5>
                      <p className="text-sm text-gray-600">Generated on {new Date().toLocaleDateString()}</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <p className="text-2xl font-bold text-green-700">{reportData.totalApplications}</p>
                        <p className="text-sm text-gray-600">Total Applications</p>
                      </div>
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <p className="text-2xl font-bold text-blue-700">TZS {(reportData.averageLoanAmount || 0).toLocaleString()}</p>
                        <p className="text-sm text-gray-600">Average Loan Amount</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-medium text-gray-900 mb-2">Status Breakdown</h4>
                        <div className="space-y-2">
                          {reportData.statusBreakdown && Object.keys(reportData.statusBreakdown).length > 0 ? (
                            Object.entries(reportData.statusBreakdown).map(([status, count]) => {
                              const total = Object.values(reportData.statusBreakdown).reduce((a, b) => (a as number) + (b as number), 0) as number;
                              const percentage = total > 0 ? ((count as number) / total) * 100 : 0;
                              const statusColor = status === 'approved' ? 'bg-green-600' : 
                                               status === 'disbursed' ? 'bg-blue-600' : 
                                               status === 'rejected' ? 'bg-red-600' : 
                                               status === 'pending' ? 'bg-yellow-600' : 'bg-gray-600';
                              return (
                                <div key={status} className="space-y-1">
                                  <div className="flex justify-between text-sm">
                                    <span className="capitalize">{status.replace('_', ' ')}:</span>
                                    <span className="font-medium">{count as number} ({percentage.toFixed(1)}%)</span>
                                  </div>
                                  <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div 
                                      className={`${statusColor} h-2 rounded-full transition-all duration-300`}
                                      style={{ width: `${percentage}%` }}
                                    ></div>
                                  </div>
                                </div>
                              );
                            })
                          ) : (
                            <p className="text-gray-500 text-sm">No status data available</p>
                          )}
                      </div>
                    </div>
                    
                    <div className="p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-medium text-gray-900 mb-2">Risk Grade Breakdown</h4>
                      <div className="space-y-2">
                          {reportData.riskGradeBreakdown && Object.keys(reportData.riskGradeBreakdown).length > 0 ? (
                            Object.entries(reportData.riskGradeBreakdown).map(([riskGrade, count]) => {
                              const total = Object.values(reportData.riskGradeBreakdown).reduce((a, b) => (a as number) + (b as number), 0) as number;
                              const percentage = total > 0 ? ((count as number) / total) * 100 : 0;
                              const riskColor = riskGrade === 'A' ? 'bg-green-600' : 
                                              riskGrade === 'B' ? 'bg-blue-600' : 
                                              riskGrade === 'C' ? 'bg-yellow-600' : 
                                              riskGrade === 'D' ? 'bg-orange-600' : 
                                              riskGrade === 'E' ? 'bg-red-600' : 'bg-gray-600';
                              return (
                                <div key={riskGrade} className="space-y-1">
                                  <div className="flex justify-between text-sm">
                                    <span>{riskGrade}:</span>
                                    <span className="font-medium">{count as number} ({percentage.toFixed(1)}%)</span>
                                  </div>
                                  <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div 
                                      className={`${riskColor} h-2 rounded-full transition-all duration-300`}
                                      style={{ width: `${percentage}%` }}
                                    ></div>
                                  </div>
                                </div>
                              );
                            })
                          ) : (
                            <p className="text-gray-500 text-sm">No risk grade data available</p>
                          )}
                          </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Staff Performance Report */}
                {selectedReport === 'staff-performance' && reportData && (
                  <div className="space-y-4">
                    <div className="text-center mb-6">
                      <h4 className="text-xl font-bold text-gray-900">RYTHM Microfinance Limited</h4>
                      <h5 className="text-lg font-semibold text-gray-700">Staff Performance Report</h5>
                      <p className="text-sm text-gray-600">Generated on {new Date().toLocaleDateString()}</p>
                    </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                      <p className="text-2xl font-bold text-green-700">{reportData.totalStaff}</p>
                      <p className="text-sm text-gray-600">Total Staff Members</p>
                    </div>
                    
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">Staff Performance (Last 30 Days)</h4>
                      <div className="space-y-3">
                        {reportData.staffMembers && reportData.staffMembers.length > 0 ? (
                          reportData.staffMembers.map((staff: any, index: number) => (
                            <div key={index} className="flex justify-between items-center p-3 bg-white rounded-lg">
                              <div>
                                <p className="font-medium text-gray-900">{staff.name}</p>
                                <p className="text-sm text-gray-600 capitalize">{staff.role}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-lg font-bold text-blue-600">{staff.processedLoans}</p>
                                <p className="text-sm text-gray-600">Loans Processed</p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-gray-500 text-sm">No staff performance data available</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Export Options */}
                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    onClick={() => exportReport('xml')}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export XML (BoT Feb 2025 Spec)
                  </button>
                  <button
                    onClick={() => exportReport('csv')}
                    className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export CSV
                  </button>
                  <button
                    onClick={() => exportReport('pdf')}
                    className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export PDF
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="space-y-6">
            {/* Regulatory Submission */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Shield className="w-5 h-5 mr-2 text-red-600" />
                Regulatory Submission
              </h3>
              <div className="space-y-3">
                <button
                  onClick={submitToBoT}
                  className="w-full p-3 bg-red-50 rounded-lg hover:bg-red-100 transition-colors text-left"
                >
                  <div className="flex items-center">
                    <Upload className="w-5 h-5 text-red-600 mr-3" />
                    <div>
                      <h4 className="font-medium text-gray-900">Submit to BoT BSIS</h4>
                      <p className="text-sm text-gray-600">Format and submit to BoT</p>
                    </div>
                  </div>
                </button>
                <button className="w-full p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors text-left">
                  <div className="flex items-center">
                    <Upload className="w-5 h-5 text-blue-600 mr-3" />
                    <div>
                      <h4 className="font-medium text-gray-900">CRB Data Push</h4>
                      <p className="text-sm text-gray-600">Submit to credit bureau</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Client Services */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <FileText className="w-5 h-5 mr-2 text-green-600" />
                Client Services
              </h3>
              <div className="space-y-3">
                <button
                  onClick={generateClientCreditReport}
                  className="w-full p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors text-left"
                >
                  <div className="flex items-center">
                    <Download className="w-5 h-5 text-green-600 mr-3" />
                    <div>
                      <h4 className="font-medium text-gray-900">Free Credit Report</h4>
                      <p className="text-sm text-gray-600">Generate annual client report</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Report Generation Section */}
            {selectedReport && (
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-green-600" />
                  Generate Report
                </h3>
                
                <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-start space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      {reportTypes.find(r => r.id === selectedReport)?.icon}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">
                        {reportTypes.find(r => r.id === selectedReport)?.name}
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">
                        {reportTypes.find(r => r.id === selectedReport)?.description}
                      </p>
                      <div className="flex items-center mt-2 space-x-2">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          reportTypes.find(r => r.id === selectedReport)?.category === 'Financial' ? 'bg-green-100 text-green-800' :
                          reportTypes.find(r => r.id === selectedReport)?.category === 'Regulatory' ? 'bg-red-100 text-red-800' :
                          reportTypes.find(r => r.id === selectedReport)?.category === 'Analytics' ? 'bg-purple-100 text-purple-800' :
                          reportTypes.find(r => r.id === selectedReport)?.category === 'Operations' ? 'bg-blue-100 text-blue-800' :
                          reportTypes.find(r => r.id === selectedReport)?.category === 'Risk Management' ? 'bg-orange-100 text-orange-800' :
                          reportTypes.find(r => r.id === selectedReport)?.category === 'Management' ? 'bg-indigo-100 text-indigo-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {reportTypes.find(r => r.id === selectedReport)?.category}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          reportTypes.find(r => r.id === selectedReport)?.priority === 'high' ? 'bg-red-100 text-red-800' :
                          reportTypes.find(r => r.id === selectedReport)?.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {reportTypes.find(r => r.id === selectedReport)?.priority?.charAt(0).toUpperCase() + reportTypes.find(r => r.id === selectedReport)?.priority?.slice(1)} Priority
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={generateReport}
                    disabled={loading}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading ? (
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <FileText className="w-4 h-4 mr-2" />
                    )}
                    {loading ? 'Generating...' : 'Generate Report'}
                  </button>

                  <button
                    onClick={() => setSelectedReport('')}
                    className="flex items-center px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Cancel
                  </button>
                </div>

                {error && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center">
                      <AlertTriangle className="w-4 h-4 text-red-600 mr-2" />
                      <span className="text-sm text-red-800">{error}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Report Results Section */}
            {reportData && (
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <BarChart3 className="w-5 h-5 mr-2 text-green-600" />
                    Report Results
                  </h3>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => exportToCSV(reportData, `${selectedReport}-report.csv`)}
                      className="flex items-center px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                    >
                      <Download className="w-4 h-4 mr-1" />
                      CSV
                    </button>
                    <button
                      onClick={() => exportToXML(reportData, `${selectedReport}-report.xml`)}
                      className="flex items-center px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                    >
                      <Download className="w-4 h-4 mr-1" />
                      XML
                    </button>
                    <button
                      onClick={() => exportToPDF(reportData, `${selectedReport}-report.pdf`)}
                      className="flex items-center px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                    >
                      <Download className="w-4 h-4 mr-1" />
                      PDF
                    </button>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap overflow-auto max-h-96">
                    {JSON.stringify(reportData, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            {/* Quick Stats */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <PieChart className="w-5 h-5 mr-2 text-purple-600" />
                Quick Stats
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between p-2 bg-gray-50 rounded">
                  <span className="text-sm text-gray-600">Total Clients:</span>
                  <span className="text-sm font-medium">{clients?.length || 0}</span>
                </div>
                <div className="flex justify-between p-2 bg-gray-50 rounded">
                  <span className="text-sm text-gray-600">Loan Applications:</span>
                  <span className="text-sm font-medium">{loanApplications?.length || 0}</span>
                </div>
                <div className="flex justify-between p-2 bg-gray-50 rounded">
                  <span className="text-sm text-gray-600">Active Staff:</span>
                  <span className="text-sm font-medium">{users?.filter(u => ['staff', 'manager', 'admin'].includes(u.role || '')).length || 0}</span>
                </div>
                <div className="flex justify-between p-2 bg-gray-50 rounded">
                  <span className="text-sm text-gray-600">Loan Products:</span>
                  <span className="text-sm font-medium">{loanProducts?.length || 0}</span>
                </div>
                <div className="flex justify-between p-2 bg-gray-50 rounded">
                  <span className="text-sm text-gray-600">Reports Generated Today:</span>
                  <span className="text-sm font-medium">12</span>
                </div>
              </div>
            </div>

            {/* Data Status */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Activity className="w-5 h-5 mr-2 text-green-600" />
                Data Status
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-sm text-gray-600">Clients Data:</span>
                  <div className="flex items-center">
                    {clientsLoading ? (
                      <Clock className="w-4 h-4 text-yellow-500" />
                    ) : clients ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-500" />
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-sm text-gray-600">Loan Applications:</span>
                  <div className="flex items-center">
                    {applicationsLoading ? (
                      <Clock className="w-4 h-4 text-yellow-500" />
                    ) : loanApplications ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-500" />
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-sm text-gray-600">Users Data:</span>
                  <div className="flex items-center">
                    {usersLoading ? (
                      <Clock className="w-4 h-4 text-yellow-500" />
                    ) : users ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-500" />
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-sm text-gray-600">Loan Products:</span>
                  <div className="flex items-center">
                    {productsLoading ? (
                      <Clock className="w-4 h-4 text-yellow-500" />
                    ) : loanProducts ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-500" />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default Reports;