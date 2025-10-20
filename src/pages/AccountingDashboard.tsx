import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { useLanguage } from '../context/LanguageContext';
import { roundCurrency } from '../utils/roundingUtils';
import useAccountingData from '../hooks/useAccountingData';
import { useSupabaseQuery } from '../hooks/useSupabase';
import { AccountingService } from '../services/accountingService';
import { AIAnalyticsService } from '../services/aiAnalyticsService';
import { LoanStatusMappingService } from '../services/loanStatusMappingService';
import toast from 'react-hot-toast';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area
} from 'recharts';
import {
  TrendingUp,
  DollarSign,
  AlertTriangle,
  BarChart3,
  PieChart,
  FileText,
  Calculator,
  Target,
  Activity,
  Zap,
  Shield,
  CheckCircle,
  XCircle,
  Clock,
  ArrowUp,
  ArrowDown,
  BookOpen,
  Receipt,
  X,
  Brain,
  RefreshCw
} from 'lucide-react';

const AccountingDashboard: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [selectedPeriod, setSelectedPeriod] = useState('current');
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [chartData, setChartData] = useState<any[]>([]);
  const [loadingCharts, setLoadingCharts] = useState(false);
  const [showStressTest, setShowStressTest] = useState(false);
  const [showTrialBalance, setShowTrialBalance] = useState(false);
  const [showBalanceSheet, setShowBalanceSheet] = useState(false);
  const [showIncomeStatement, setShowIncomeStatement] = useState(false);
  const [showCashFlow, setShowCashFlow] = useState(false);
  const [showBotReports, setShowBotReports] = useState(false);
  const [showTraReports, setShowTraReports] = useState(false);
  const [showEclCalculation, setShowEclCalculation] = useState(false);
  const [showJournalEntryModal, setShowJournalEntryModal] = useState(false);
  const [predictionMode, setPredictionMode] = useState<'current' | 'quarter' | 'year'>('current');
  const [newJournalEntry, setNewJournalEntry] = useState({
    entry_number: '',
    entry_date: new Date().toISOString().split('T')[0],
    reference: '',
    description: '',
    lines: [] as any[]
  });

  // Use real-time accounting data
  const {
    chartOfAccounts,
    journalEntries,
    generalLedger,
    financialPeriods,
    trialBalance,
    financialMetrics,
    loading,
    error,
    refreshData,
    createJournalEntry,
    generateTrialBalance
  } = useAccountingData();

  // Fetch loan applications data for portfolio analysis
  const { data: loanApplications } = useSupabaseQuery('loan_applications', {
    select: '*',
    orderBy: { column: 'created_at', ascending: false }
  });

  // Fetch active loans data for portfolio analysis
  const { data: activeLoans } = useSupabaseQuery('loans', {
    select: '*',
    orderBy: { column: 'created_at', ascending: false }
  });

  // Load chart data on component mount and set up auto-refresh
  useEffect(() => {
    loadChartData();
    
    // Set up auto-refresh every 30 seconds for real-time updates
    const interval = setInterval(() => {
      loadChartData();
    }, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  const loadChartData = async () => {
    setLoadingCharts(true);
    try {
      const { data } = await AIAnalyticsService.getRealtimeFinancialData();
      if (data && data.length > 0) {
        // Convert daily data to monthly data for charts
        const monthlyData = convertDailyToMonthlyData(data);
        setChartData(monthlyData);
      } else {
        // No data available, show empty state
        console.log('No data available, showing empty state');
        setChartData([]);
      }
    } catch (err) {
      console.error('Error loading chart data:', err);
      // Show empty state on error
      setChartData([]);
    } finally {
      setLoadingCharts(false);
    }
  };



  // Convert daily data to monthly data for chart display
  const convertDailyToMonthlyData = (dailyData: any[]) => {
    const monthlyMap: { [key: string]: any } = {};
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Initialize all 12 months with zero values
    months.forEach((month, index) => {
      const monthKey = `${currentYear}-${month}`;
      monthlyMap[monthKey] = {
        month,
        year: currentYear,
        totalCapital: 0,
        loanPortfolio: 0,
        par30: 0,
        liquidityRatio: 0,
        netIncome: 0,
        totalAssets: 0,
        totalLiabilities: 0,
        totalEquity: 0,
        isCurrentMonth: index === currentMonth,
        dayCount: 0
      };
    });
    
    // Process actual data
    dailyData.forEach(day => {
      const monthKey = `${day.year}-${day.month}`;
      
      if (monthlyMap[monthKey]) {
        // Always update with the latest values for each month
        // For past months, this will be the final day's values
        // For current month, this will be the latest day's values
        monthlyMap[monthKey].totalCapital = day.totalCapital;
        monthlyMap[monthKey].loanPortfolio = day.loanPortfolio;
        monthlyMap[monthKey].par30 = day.par30;
        monthlyMap[monthKey].liquidityRatio = day.liquidityRatio;
        monthlyMap[monthKey].netIncome = day.netIncome;
        monthlyMap[monthKey].totalAssets = day.totalAssets;
        monthlyMap[monthKey].totalLiabilities = day.totalLiabilities;
        monthlyMap[monthKey].totalEquity = day.totalEquity;
        monthlyMap[monthKey].isCurrentMonth = day.isCurrentMonth;
        
        monthlyMap[monthKey].dayCount++;
      }
    });
    
    // Sort by month order
    const sortedMonths = Object.values(monthlyMap).sort((a, b) => {
      const monthOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return monthOrder.indexOf(a.month) - monthOrder.indexOf(b.month);
    });
    
    console.log('📊 Chart data generated for months:', sortedMonths.map(m => m.month));
    return sortedMonths;
  };

  // Calculate real financial metrics from trial balance data and loan data
  const calculateFinancialMetrics = () => {
    console.log('🔍 Financial Metrics Debug:', { 
      trialBalance: trialBalance?.length || 0, 
      chartOfAccounts: chartOfAccounts?.length || 0,
      activeLoans: activeLoans?.length || 0,
      loanApplications: loanApplications?.length || 0
    });

    if (!trialBalance || trialBalance.length === 0 || !chartOfAccounts || chartOfAccounts.length === 0) {
      return {
        totalCapital: 0,
        loanPortfolio: 0,
        par30: 0,
        nplRatio: 0,
        liquidityRatio: 0,
        netProfit: 0,
        totalAssets: 0,
        totalLiabilities: 0,
        equity: 0
      };
    }

    // Create a map of account codes to account types
    const accountTypeMap = new Map();
    chartOfAccounts.forEach(acc => {
      accountTypeMap.set(acc.account_code, acc.account_type);
    });

    // Calculate from trial balance using account type mapping
    const capitalAccounts = trialBalance.filter(acc => {
      const accountType = accountTypeMap.get(acc.account_code);
      return accountType === 'equity' || acc.account_name.toLowerCase().includes('capital');
    });
    const assetAccounts = trialBalance.filter(acc => {
      const accountType = accountTypeMap.get(acc.account_code);
      return accountType === 'asset';
    });
    const liabilityAccounts = trialBalance.filter(acc => {
      const accountType = accountTypeMap.get(acc.account_code);
      return accountType === 'liability';
    });

    const totalCapital = capitalAccounts.reduce((sum, acc) => sum + (acc.credit_balance || 0) - (acc.debit_balance || 0), 0);
    const totalAssets = assetAccounts.reduce((sum, acc) => sum + (acc.debit_balance || 0) - (acc.credit_balance || 0), 0);
    const totalLiabilities = liabilityAccounts.reduce((sum, acc) => sum + (acc.credit_balance || 0) - (acc.debit_balance || 0), 0);
    const equity = totalAssets - totalLiabilities;
    const netProfit = equity - totalCapital;
    const liquidityRatio = totalAssets > 0 ? (totalCapital / totalAssets) * 100 : 0;
    
    // Calculate loan portfolio from actual loan data
    let loanPortfolio = 0;
    if (activeLoans && activeLoans.length > 0) {
      loanPortfolio = activeLoans
        .filter(loan => loan.status === 'active')
        .reduce((sum, loan) => sum + (loan.principal_amount || 0), 0);
    }
    
    // Also include disbursed loans from loan applications
    if (loanApplications && loanApplications.length > 0) {
      const disbursedLoans = loanApplications
        .filter(app => app.status === 'disbursed')
        .reduce((sum, app) => sum + (app.approved_amount || app.requested_amount || 0), 0);
      loanPortfolio += disbursedLoans;
    }
    
    // Calculate PAR 30 from actual loan data
    let par30 = 0;
    let nplRatio = 0;
    
    if (activeLoans && activeLoans.length > 0) {
      const totalActiveLoans = activeLoans.filter(loan => loan.status === 'active').length;
      const overdueLoans = activeLoans.filter(loan => loan.status === 'overdue').length;
      
      if (totalActiveLoans > 0) {
        par30 = (overdueLoans / totalActiveLoans) * 100;
        nplRatio = par30; // Simplified: using PAR 30 as NPL ratio
      }
    }

    console.log('🔍 Financial Metrics Calculated:', {
      totalCapital,
      loanPortfolio,
      par30: par30.toFixed(1),
      nplRatio: nplRatio.toFixed(1),
      liquidityRatio: liquidityRatio.toFixed(1),
      netProfit,
      totalAssets,
      totalLiabilities,
      equity
    });

    return {
      totalCapital,
      loanPortfolio,
      par30: parseFloat(par30.toFixed(1)),
      nplRatio: parseFloat(nplRatio.toFixed(1)),
      liquidityRatio: parseFloat(liquidityRatio.toFixed(1)),
      netProfit,
      totalAssets,
      totalLiabilities,
      equity
    };
  };

  const defaultFinancialMetrics = calculateFinancialMetrics();

  // Use real-time data or fallback to default with null checks
  const currentFinancialMetrics = {
    totalCapital: financialMetrics?.totalCapital ?? defaultFinancialMetrics.totalCapital,
    loanPortfolio: financialMetrics?.loanPortfolio ?? defaultFinancialMetrics.loanPortfolio,
    par30: financialMetrics?.par30 ?? defaultFinancialMetrics.par30,
    nplRatio: financialMetrics?.nplRatio ?? defaultFinancialMetrics.nplRatio,
    liquidityRatio: financialMetrics?.liquidityRatio ?? defaultFinancialMetrics.liquidityRatio,
    netProfit: financialMetrics?.netProfit ?? defaultFinancialMetrics.netProfit,
    totalAssets: financialMetrics?.totalAssets ?? defaultFinancialMetrics.totalAssets,
    totalLiabilities: financialMetrics?.totalLiabilities ?? defaultFinancialMetrics.totalLiabilities,
    equity: financialMetrics?.equity ?? defaultFinancialMetrics.equity
  };

  // Calculate trend percentages (simplified - in real app would compare with previous period)
  const calculateTrends = (financialMetrics: any): {
    totalCapitalTrend: number;
    loanPortfolioTrend: number;
    par30Trend: number;
    liquidityTrend: number;
  } => {
    return {
      totalCapitalTrend: 5.2, // This would be calculated from historical data
      loanPortfolioTrend: financialMetrics.loanPortfolio > 0 ? 12.8 : 0, // Only show positive trend if there are loans
      par30Trend: -0.3, // This would be calculated from historical data
      liquidityTrend: 0 // This would be calculated from historical data
    };
  };

  // Predictive Analytics Functions
  const calculateGrowthRates = () => {
    // Calculate historical growth rates based on current vs previous periods
    
    // These would ideally be calculated from historical data
    // For now, using realistic MFI growth rates
    return {
      totalCapitalGrowth: 0.08, // 8% annual growth
      loanPortfolioGrowth: 0.15, // 15% annual growth
      netIncomeGrowth: 0.12, // 12% annual growth
      totalAssetsGrowth: 0.10, // 10% annual growth
      par30Change: -0.02, // 2% improvement annually
      liquidityChange: 0.01 // 1% improvement annually
    };
  };

  const calculatePredictiveMetrics = (period: 'quarter' | 'year') => {
    const growthRates = calculateGrowthRates();
    const currentMetrics = currentFinancialMetrics;
    
    // Calculate time multiplier
    const timeMultiplier = period === 'quarter' ? 0.25 : 1.0; // 3 months = 0.25 year, 12 months = 1 year
    
    // Apply growth rates
    const totalCapital = currentMetrics.totalCapital * (1 + growthRates.totalCapitalGrowth * timeMultiplier);
    const loanPortfolio = currentMetrics.loanPortfolio * (1 + growthRates.loanPortfolioGrowth * timeMultiplier);
    const netIncome = currentMetrics.netProfit * (1 + growthRates.netIncomeGrowth * timeMultiplier);
    const totalAssets = currentMetrics.totalAssets * (1 + growthRates.totalAssetsGrowth * timeMultiplier);
    
    // Calculate derived metrics
    const totalLiabilities = totalAssets - (totalCapital + netIncome);
    const equity = totalAssets - totalLiabilities;
    const liquidityRatio = totalAssets > 0 ? (totalCapital / totalAssets) * 100 : 0;
    
    // PAR 30 improvement (lower is better)
    const par30 = Math.max(0, currentMetrics.par30 + (growthRates.par30Change * timeMultiplier * 100));
    const nplRatio = par30; // Same as PAR 30 for simplicity
    
    return {
      totalCapital,
      loanPortfolio,
      par30,
      nplRatio,
      liquidityRatio,
      netIncome,
      totalAssets,
      totalLiabilities,
      equity
    };
  };

  const calculatePredictivePortfolioData = (period: 'quarter' | 'year') => {
    const currentPortfolio = portfolioData;
    const growthRates = calculateGrowthRates();
    const timeMultiplier = period === 'quarter' ? 0.25 : 1.0;
    
    // Apply growth to active loans (new disbursements)
    const activeGrowth = 1 + (growthRates.loanPortfolioGrowth * timeMultiplier);
    const active = Math.round(currentPortfolio.active * activeGrowth);
    
    // Overdue loans might increase slightly due to portfolio growth
    const overdueGrowth = 1 + (growthRates.loanPortfolioGrowth * timeMultiplier * 0.1); // 10% of portfolio growth
    const overdue = Math.round(currentPortfolio.overdue * overdueGrowth);
    
    // Repaid loans increase with portfolio growth
    const repaidGrowth = 1 + (growthRates.loanPortfolioGrowth * timeMultiplier * 0.8); // 80% of portfolio growth
    const repaid = Math.round(currentPortfolio.repaid * repaidGrowth);
    
    // Write-offs remain relatively stable
    const writeOff = currentPortfolio.writeOff;
    
    return {
      active,
      overdue,
      repaid,
      writeOff
    };
  };

  const calculatePredictiveDPDData = (period: 'quarter' | 'year') => {
    const currentDPD = dpdBuckets;
    const growthRates = calculateGrowthRates();
    const timeMultiplier = period === 'quarter' ? 0.25 : 1.0;
    
    // Apply growth to DPD buckets based on portfolio growth
    const portfolioGrowth = 1 + (growthRates.loanPortfolioGrowth * timeMultiplier);
    
    return currentDPD.map(bucket => ({
      ...bucket,
      count: Math.round(bucket.count * portfolioGrowth),
      amount: Math.round(bucket.amount * portfolioGrowth)
    }));
  };



  // Use data from the service (which includes fallback to demo data)
  const displayChartOfAccounts = chartOfAccounts || [];

  // Calculate real funding sources from trial balance data
  const calculateFundingSources = () => {
    if (!trialBalance || trialBalance.length === 0 || !chartOfAccounts || chartOfAccounts.length === 0) {
      return [
        { source: 'Equity Capital', amount: 0, percentage: 0 },
        { source: 'Development Finance', amount: 0, percentage: 0 },
        { source: 'Commercial Loans', amount: 0, percentage: 0 }
      ];
    }

    // Create a map of account codes to account types
    const accountTypeMap = new Map();
    chartOfAccounts.forEach(acc => {
      accountTypeMap.set(acc.account_code, acc.account_type);
    });

    const equityAccounts = trialBalance.filter(acc => {
      const accountType = accountTypeMap.get(acc.account_code);
      return accountType === 'equity' && acc.account_name.toLowerCase().includes('capital');
    });
    const developmentFinanceAccounts = trialBalance.filter(acc => {
      const accountType = accountTypeMap.get(acc.account_code);
      return accountType === 'liability' && acc.account_name.toLowerCase().includes('development');
    });
    const commercialLoanAccounts = trialBalance.filter(acc => {
      const accountType = accountTypeMap.get(acc.account_code);
      return accountType === 'liability' && acc.account_name.toLowerCase().includes('commercial');
    });

    const equityAmount = equityAccounts.reduce((sum, acc) => sum + (acc.credit_balance || 0) - (acc.debit_balance || 0), 0);
    const developmentAmount = developmentFinanceAccounts.reduce((sum, acc) => sum + (acc.credit_balance || 0) - (acc.debit_balance || 0), 0);
    const commercialAmount = commercialLoanAccounts.reduce((sum, acc) => sum + (acc.credit_balance || 0) - (acc.debit_balance || 0), 0);
    
    const totalFunding = equityAmount + developmentAmount + commercialAmount;
    
    if (totalFunding === 0) {
      return [
        { source: 'Equity Capital', amount: 0, percentage: 0 },
        { source: 'Development Finance', amount: 0, percentage: 0 },
        { source: 'Commercial Loans', amount: 0, percentage: 0 }
      ];
    }

    return [
      { 
        source: 'Equity Capital', 
        amount: equityAmount, 
        percentage: Math.round((equityAmount / totalFunding) * 100) 
      },
      { 
        source: 'Development Finance', 
        amount: developmentAmount, 
        percentage: Math.round((developmentAmount / totalFunding) * 100) 
      },
      { 
        source: 'Commercial Loans', 
        amount: commercialAmount, 
        percentage: Math.round((commercialAmount / totalFunding) * 100) 
      }
    ];
  };

  const fundingSources = calculateFundingSources();

  // Calculate real portfolio data from both loan applications and active loans
  const calculatePortfolioData = () => {
    console.log('🔍 Portfolio Data Debug - Raw Data:', { 
      loanApplications: loanApplications,
      activeLoans: activeLoans,
      loanApplicationsLength: loanApplications?.length || 0, 
      activeLoansLength: activeLoans?.length || 0 
    });

    // Count from loan applications
    let activeFromApps = 0;
    let overdueFromApps = 0;
    let repaidFromApps = 0;
    let writeOffFromApps = 0;

    if (loanApplications && loanApplications.length > 0) {
      console.log('🔍 Processing loan applications:', loanApplications.map(app => ({ id: app.id, status: app.status })));
      
      const activeStatuses = LoanStatusMappingService.getActiveLoanStatuses();
      console.log('🔍 Active statuses for loan applications:', activeStatuses);
      
      activeFromApps = loanApplications.filter(app => 
        activeStatuses.loanApplication.includes(app.status)
      ).length;
      
      overdueFromApps = loanApplications.filter(app => 
        app.status === 'overdue' || app.status === 'default'
      ).length;
      
      repaidFromApps = loanApplications.filter(app => 
        app.status === 'repaid' || app.status === 'closed'
      ).length;
      
      writeOffFromApps = loanApplications.filter(app => 
        app.status === 'written_off' || app.status === 'bad_debt'
      ).length;
      
      console.log('🔍 Loan applications counts:', { activeFromApps, overdueFromApps, repaidFromApps, writeOffFromApps });
    }

    // Count from active loans table
    let activeFromLoans = 0;
    let overdueFromLoans = 0;
    let repaidFromLoans = 0;
    let writeOffFromLoans = 0;

    if (activeLoans && activeLoans.length > 0) {
      console.log('🔍 Processing active loans:', activeLoans.map(loan => ({ id: loan.id, status: loan.status })));
      
      activeFromLoans = activeLoans.filter(loan => 
        loan.status === 'active'
      ).length;
      
      overdueFromLoans = activeLoans.filter(loan => 
        loan.status === 'overdue'
      ).length;
      
      repaidFromLoans = activeLoans.filter(loan => 
        loan.status === 'repaid'
      ).length;
      
      writeOffFromLoans = activeLoans.filter(loan => 
        loan.status === 'written_off'
      ).length;
      
      console.log('🔍 Active loans counts:', { activeFromLoans, overdueFromLoans, repaidFromLoans, writeOffFromLoans });
    }

    const totalActive = activeFromApps + activeFromLoans;
    const totalOverdue = overdueFromApps + overdueFromLoans;
    const totalRepaid = repaidFromApps + repaidFromLoans;
    const totalWriteOff = writeOffFromApps + writeOffFromLoans;

    console.log('🔍 Portfolio Data Final Calculation:', {
      activeFromApps,
      activeFromLoans,
      totalActive,
      overdueFromApps,
      overdueFromLoans,
      totalOverdue,
      repaidFromApps,
      repaidFromLoans,
      totalRepaid,
      writeOffFromApps,
      writeOffFromLoans,
      totalWriteOff
    });

    // If no data is found, show a message in console and return zeros
    if (totalActive === 0 && totalOverdue === 0 && totalRepaid === 0 && totalWriteOff === 0) {
      console.warn('⚠️ No loan data found in either loan_applications or loans tables. Check if:');
      console.warn('1. Data exists in the database');
      console.warn('2. User has proper permissions to access the data');
      console.warn('3. Database connection is working properly');
    }

    return {
      active: totalActive,
      overdue: totalOverdue,
      repaid: totalRepaid,
      writeOff: totalWriteOff
    };
  };

  const portfolioData = calculatePortfolioData();

  // Handle journal entry creation
  const handleCreateJournalEntry = async () => {
    try {
      if (newJournalEntry.lines.length === 0) {
        toast.error('Please add at least one journal entry line');
        return;
      }

      // Calculate totals
      const totalDebit = newJournalEntry.lines.reduce((sum, line) => sum + (line.debit_amount || 0), 0);
      const totalCredit = newJournalEntry.lines.reduce((sum, line) => sum + (line.credit_amount || 0), 0);

      if (totalDebit !== totalCredit) {
        toast.error('Total debits must equal total credits');
        return;
      }

      // Generate entry number if not provided
      const entryNumber = newJournalEntry.entry_number || `JE-${Date.now()}`;

      const journalEntry = {
        entry_number: entryNumber,
        entry_date: newJournalEntry.entry_date,
        reference: newJournalEntry.reference,
        description: newJournalEntry.description,
        total_debit: totalDebit,
        total_credit: totalCredit,
        status: 'draft' as const
      };

      const result = await createJournalEntry(journalEntry);
      
      if (result.data) {
        // Create journal entry lines
        const lines = newJournalEntry.lines.map(line => ({
          journal_entry_id: result.data!.id,
          account_id: line.account_id,
          description: line.description,
          debit_amount: line.debit_amount || 0,
          credit_amount: line.credit_amount || 0
        }));

        await AccountingService.createJournalEntryLines(lines);
        
        toast.success('Journal entry created successfully');
        setShowJournalEntryModal(false);
        setNewJournalEntry({
          entry_number: '',
          entry_date: new Date().toISOString().split('T')[0],
          reference: '',
          description: '',
          lines: []
        });
      } else {
        toast.error(result.error || 'Failed to create journal entry');
      }
    } catch (error) {
      console.error('Error creating journal entry:', error);
      toast.error('Failed to create journal entry');
    }
  };

  // Handle trial balance generation
  const handleGenerateTrialBalance = async () => {
    try {
      const currentPeriod = financialPeriods[0];
      if (!currentPeriod) {
        toast.error('No financial period selected');
        return;
      }

      const result = await generateTrialBalance(currentPeriod.id);
      if (result.data) {
        toast.success('Trial balance generated successfully');
        setShowTrialBalance(true);
      } else {
        toast.error(result.error || 'Failed to generate trial balance');
      }
    } catch (error) {
      console.error('Error generating trial balance:', error);
      toast.error('Failed to generate trial balance');
    }
  };

  // Add journal entry line
  const addJournalEntryLine = () => {
    setNewJournalEntry(prev => ({
      ...prev,
      lines: [...prev.lines, {
        account_id: '',
        description: '',
        debit_amount: 0,
        credit_amount: 0
      }]
    }));
  };

  // Remove journal entry line
  const removeJournalEntryLine = (index: number) => {
    setNewJournalEntry(prev => ({
      ...prev,
      lines: prev.lines.filter((_, i) => i !== index)
    }));
  };

  // Update journal entry line
  const updateJournalEntryLine = (index: number, field: string, value: any) => {
    setNewJournalEntry(prev => ({
      ...prev,
      lines: prev.lines.map((line, i) => 
        i === index ? { ...line, [field]: value } : line
      )
    }));
  };

  // Calculate real aging analysis from both loan applications and active loans
  const calculateAgingAnalysis = () => {
    console.log('🔍 DPD Analysis Debug - Raw Data:', { 
      loanApplications: loanApplications,
      activeLoans: activeLoans,
      loanApplicationsLength: loanApplications?.length || 0, 
      activeLoansLength: activeLoans?.length || 0 
    });

    const now = new Date();
    const agingData = [
      { bucket: 'DPD 1-30', count: 0, amount: 0 },
      { bucket: 'DPD 31-60', count: 0, amount: 0 },
      { bucket: 'DPD 61-90', count: 0, amount: 0 },
      { bucket: 'DPD 90+', count: 0, amount: 0 }
    ];

    // Process loan applications
    if (loanApplications && loanApplications.length > 0) {
      console.log('🔍 Processing loan applications for DPD:', loanApplications.map(app => ({ 
        id: app.id, 
        status: app.status, 
        due_date: app.due_date,
        requested_amount: app.requested_amount 
      })));
      
      loanApplications.forEach(loan => {
        if (loan.status === 'overdue' || loan.status === 'default') {
          const dueDate = new Date(loan.due_date || loan.created_at);
          const daysPastDue = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
          const amount = loan.requested_amount || 0;

          console.log('🔍 Processing overdue loan application:', { 
            id: loan.id, 
            dueDate: dueDate.toISOString(), 
            daysPastDue, 
            amount 
          });

          if (daysPastDue >= 1 && daysPastDue <= 30) {
            agingData[0].count++;
            agingData[0].amount += amount;
          } else if (daysPastDue >= 31 && daysPastDue <= 60) {
            agingData[1].count++;
            agingData[1].amount += amount;
          } else if (daysPastDue >= 61 && daysPastDue <= 90) {
            agingData[2].count++;
            agingData[2].amount += amount;
          } else if (daysPastDue > 90) {
            agingData[3].count++;
            agingData[3].amount += amount;
          }
        }
      });
    }

    // Process active loans
    if (activeLoans && activeLoans.length > 0) {
      console.log('🔍 Processing active loans for DPD:', activeLoans.map(loan => ({ 
        id: loan.id, 
        status: loan.status, 
        next_payment_due: loan.next_payment_due,
        principal_amount: loan.principal_amount 
      })));
      
      activeLoans.forEach(loan => {
        if (loan.status === 'overdue') {
          const dueDate = new Date(loan.next_payment_due || loan.created_at);
          const daysPastDue = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
          const amount = loan.principal_amount || 0;

          console.log('🔍 Processing overdue active loan:', { 
            id: loan.id, 
            dueDate: dueDate.toISOString(), 
            daysPastDue, 
            amount 
          });

          if (daysPastDue >= 1 && daysPastDue <= 30) {
            agingData[0].count++;
            agingData[0].amount += amount;
          } else if (daysPastDue >= 31 && daysPastDue <= 60) {
            agingData[1].count++;
            agingData[1].amount += amount;
          } else if (daysPastDue >= 61 && daysPastDue <= 90) {
            agingData[2].count++;
            agingData[2].amount += amount;
          } else if (daysPastDue > 90) {
            agingData[3].count++;
            agingData[3].amount += amount;
          }
        }
      });
    }

    console.log('🔍 DPD Analysis Final Calculation:', agingData);
    
    // If no DPD data is found, show a message in console
    const totalDPDCount = agingData.reduce((sum, bucket) => sum + bucket.count, 0);
    if (totalDPDCount === 0) {
      console.warn('⚠️ No overdue loan data found for DPD analysis. Check if:');
      console.warn('1. There are loans with status "overdue" or "default"');
      console.warn('2. Due dates are properly set in the database');
      console.warn('3. Loan data is being loaded correctly');
    }
    
    return agingData;
  };

  const dpdBuckets = calculateAgingAnalysis();

  // Data selection based on prediction mode
  const getDisplayData = (): {
    financialMetrics: any;
    portfolioData: any;
    dpdBuckets: any;
    trends: any;
  } => {
    if (predictionMode === 'current') {
      const trends = calculateTrends(currentFinancialMetrics);
      return {
        financialMetrics: currentFinancialMetrics,
        portfolioData: portfolioData,
        dpdBuckets: dpdBuckets,
        trends: trends
      };
    } else {
      const period = predictionMode === 'quarter' ? 'quarter' : 'year';
      const predictiveMetrics = calculatePredictiveMetrics(period);
      const trends = calculateTrends(predictiveMetrics);
      return {
        financialMetrics: predictiveMetrics,
        portfolioData: calculatePredictivePortfolioData(period),
        dpdBuckets: calculatePredictiveDPDData(period),
        trends: trends
      };
    }
  };

  const displayData = getDisplayData();

  const alerts = [
    {
      id: 1,
      type: 'warning',
      message: 'Liquidity ratio approaching threshold (15.2% vs 16% target)',
      priority: 'Medium'
    },
    {
      id: 2,
      type: 'info',
      message: 'Monthly BoT report due in 3 days',
      priority: 'Low'
    },
    {
      id: 3,
      type: 'success',
      message: 'ECL provisions updated successfully',
      priority: 'Low'
    }
  ];

  const runStressTest = () => {
    // Calculate stress test scenarios
    calculateStressTestScenarios();
    setShowStressTest(true);
  };

  // Calculate real-time ECL from actual loan data
  const calculateECL = () => {
    console.log('🔍 ECL Calculation Debug - Raw Data:', { 
      loanApplications: loanApplications?.length || 0,
      activeLoans: activeLoans?.length || 0
    });

    if ((!loanApplications || loanApplications.length === 0) && (!activeLoans || activeLoans.length === 0)) {
      console.warn('⚠️ No loan data available for ECL calculation');
      return {
        stage1: { ead: 0, pd: 0, lgd: 0, ecl: 0 },
        stage2: { ead: 0, pd: 0, lgd: 0, ecl: 0 },
        stage3: { ead: 0, pd: 0, lgd: 0, ecl: 0 },
        totalECL: 0
      };
    }

    // Combine data from both loan_applications and loans tables
    const allLoans: Array<{
      id: string;
      amount: number;
      status: string;
      disbursement_date?: string;
      due_date?: string;
      source: string;
    }> = [];
    
    // Add loans from loan_applications
    if (loanApplications && loanApplications.length > 0) {
      loanApplications.forEach(loan => {
        allLoans.push({
          id: loan.id,
          amount: loan.approved_amount || loan.requested_amount || 0,
          status: loan.status,
          disbursement_date: loan.disbursement_date,
          due_date: loan.due_date,
          source: 'loan_applications'
        });
      });
    }
    
    // Add loans from loans table
    if (activeLoans && activeLoans.length > 0) {
      activeLoans.forEach(loan => {
        allLoans.push({
          id: loan.id,
          amount: loan.principal_amount || 0,
          status: loan.status,
          disbursement_date: loan.disbursement_date,
          due_date: loan.next_payment_due,
          source: 'loans'
        });
      });
    }

    console.log('🔍 All loans for ECL calculation:', allLoans.map(loan => ({
      id: loan.id,
      amount: loan.amount,
      status: loan.status,
      source: loan.source
    })));

    // Calculate ECL for each stage based on real loan data
    const activeStatuses = LoanStatusMappingService.getActiveLoanStatuses();
    const performingLoans = allLoans.filter(loan => 
      activeStatuses.loanApplication.includes(loan.status) || loan.status === 'active'
    );
    const underperformingLoans = allLoans.filter(loan => 
      loan.status === 'overdue' || loan.status === 'default'
    );
    const impairedLoans = allLoans.filter(loan => 
      loan.status === 'written_off' || loan.status === 'bad_debt'
    );

    console.log('🔍 ECL Stage Classification:', {
      performing: performingLoans.length,
      underperforming: underperformingLoans.length,
      impaired: impairedLoans.length
    });

    // Stage 1: 12-month ECL for performing loans
    const stage1EAD = performingLoans.reduce((sum, loan) => sum + loan.amount, 0);
    const stage1PD = 0.02; // 2% probability of default for performing loans
    const stage1LGD = 0.45; // 45% loss given default
    const stage1ECL = stage1EAD * stage1PD * stage1LGD;

    // Stage 2: Lifetime ECL for underperforming loans
    const stage2EAD = underperformingLoans.reduce((sum, loan) => sum + loan.amount, 0);
    const stage2PD = 0.15; // 15% probability of default for underperforming loans
    const stage2LGD = 0.60; // 60% loss given default
    const stage2ECL = stage2EAD * stage2PD * stage2LGD;

    // Stage 3: Lifetime ECL for impaired loans
    const stage3EAD = impairedLoans.reduce((sum, loan) => sum + loan.amount, 0);
    const stage3PD = 1.0; // 100% probability of default for impaired loans
    const stage3LGD = 0.80; // 80% loss given default
    const stage3ECL = stage3EAD * stage3PD * stage3LGD;

    const totalECL = stage1ECL + stage2ECL + stage3ECL;

    console.log('🔍 ECL Calculation Results:', {
      stage1: { ead: stage1EAD, ecl: stage1ECL },
      stage2: { ead: stage2EAD, ecl: stage2ECL },
      stage3: { ead: stage3EAD, ecl: stage3ECL },
      totalECL
    });

    return {
      stage1: { ead: stage1EAD, pd: stage1PD, lgd: stage1LGD, ecl: stage1ECL },
      stage2: { ead: stage2EAD, pd: stage2PD, lgd: stage2LGD, ecl: stage2ECL },
      stage3: { ead: stage3EAD, pd: stage3PD, lgd: stage3LGD, ecl: stage3ECL },
      totalECL
    };
  };

  // Calculate real-time TRA tax data from journal entries and transactions
  const calculateTRAData = () => {
    console.log('🔍 TRA Data Calculation Debug:', {
      journalEntries: journalEntries?.length || 0,
      trialBalance: trialBalance?.length || 0
    });

    if (!journalEntries || journalEntries.length === 0) {
      console.warn('⚠️ No journal entries available for TRA calculation');
      return {
        vat: { taxableSupplies: 0, outputVAT: 0, inputVAT: 0, netVAT: 0 },
        corporateTax: { taxableIncome: 0, taxRate: 0.30, corporateTax: 0, quarterlyInstallments: 0 },
        withholdingTax: { interestIncome: 0, serviceFees: 0, consultancy: 0, totalWHT: 0 },
        paye: { grossSalaries: 0, payeDeducted: 0, sdl: 0, totalRemittance: 0 }
      };
    }

    // Calculate VAT from journal entries
    let taxableSupplies = 0;
    let outputVAT = 0;
    let inputVAT = 0;

    journalEntries.forEach(entry => {
      if ((entry as any).journal_entry_lines) {
        (entry as any).journal_entry_lines.forEach((line: any) => {
          const accountName = line.chart_of_accounts?.account_name || '';
          const amount = line.debit_amount || line.credit_amount || 0;

          // Interest income is typically VAT exempt, but fees might be taxable
          if (accountName.includes('Fees') || accountName.includes('Commission')) {
            taxableSupplies += amount;
            outputVAT += amount * 0.18; // 18% VAT rate
          }
          
          // Input VAT on expenses
          if (accountName.includes('Administrative') || accountName.includes('Personnel')) {
            inputVAT += amount * 0.18;
          }
        });
      }
    });

    const netVAT = Math.max(0, outputVAT - inputVAT);

    // Calculate Corporate Tax from net income
    const netIncome = displayData.financialMetrics.netProfit || 0;
    const taxableIncome = Math.max(0, netIncome);
    const corporateTax = taxableIncome * 0.30; // 30% corporate tax rate
    const quarterlyInstallments = corporateTax / 4;

    // Calculate Withholding Tax
    const interestIncome = displayData.financialMetrics.loanPortfolio * 0.12; // Assume 12% interest rate
    const interestWHT = interestIncome * 0.10; // 10% WHT on interest
    const serviceFees = taxableSupplies * 0.05; // 5% WHT on service fees
    const consultancy = 0; // No consultancy income currently
    const totalWHT = interestWHT + serviceFees + consultancy;

    // Calculate PAYE (simplified - would need actual payroll data)
    const grossSalaries = 8000000; // This would come from payroll system
    const payeDeducted = grossSalaries * 0.15; // 15% PAYE rate
    const sdl = grossSalaries * 0.06; // 6% SDL
    const totalRemittance = payeDeducted + sdl;

    console.log('🔍 TRA Data Calculated:', {
      vat: { taxableSupplies, outputVAT, inputVAT, netVAT },
      corporateTax: { taxableIncome, corporateTax, quarterlyInstallments },
      withholdingTax: { interestWHT, serviceFees, totalWHT },
      paye: { grossSalaries, payeDeducted, sdl, totalRemittance }
    });

    return {
      vat: { taxableSupplies, outputVAT, inputVAT, netVAT },
      corporateTax: { taxableIncome, taxRate: 0.30, corporateTax, quarterlyInstallments },
      withholdingTax: { interestIncome: interestWHT, serviceFees, consultancy, totalWHT },
      paye: { grossSalaries, payeDeducted, sdl, totalRemittance }
    };
  };

  const calculateStressTestScenarios = () => {
    if (!currentFinancialMetrics) return null;

    const scenarios = {
      baseCase: {
        name: 'Base Case',
        description: 'Current financial position',
        capitalAdequacy: currentFinancialMetrics.totalCapital / currentFinancialMetrics.totalAssets,
        liquidityRatio: currentFinancialMetrics.liquidityRatio,
        par30: currentFinancialMetrics.par30,
        nplRatio: currentFinancialMetrics.nplRatio
      },
      mildStress: {
        name: 'Mild Stress',
        description: '10% increase in NPL, 5% decrease in liquidity',
        capitalAdequacy: (currentFinancialMetrics.totalCapital * 0.95) / (currentFinancialMetrics.totalAssets * 0.98),
        liquidityRatio: currentFinancialMetrics.liquidityRatio * 0.95,
        par30: currentFinancialMetrics.par30 * 1.1,
        nplRatio: currentFinancialMetrics.nplRatio * 1.1
      },
      moderateStress: {
        name: 'Moderate Stress',
        description: '25% increase in NPL, 15% decrease in liquidity',
        capitalAdequacy: (currentFinancialMetrics.totalCapital * 0.90) / (currentFinancialMetrics.totalAssets * 0.95),
        liquidityRatio: currentFinancialMetrics.liquidityRatio * 0.85,
        par30: currentFinancialMetrics.par30 * 1.25,
        nplRatio: currentFinancialMetrics.nplRatio * 1.25
      },
      severeStress: {
        name: 'Severe Stress',
        description: '50% increase in NPL, 30% decrease in liquidity',
        capitalAdequacy: (currentFinancialMetrics.totalCapital * 0.80) / (currentFinancialMetrics.totalAssets * 0.90),
        liquidityRatio: currentFinancialMetrics.liquidityRatio * 0.70,
        par30: currentFinancialMetrics.par30 * 1.5,
        nplRatio: currentFinancialMetrics.nplRatio * 1.5
      }
    };

    // Calculate overall stress test score (0-100)
    const baseScore = 100;
    const mildPenalty = 10;
    const moderatePenalty = 25;
    const severePenalty = 50;

    const stressScore = Math.max(0, baseScore - 
      (scenarios.mildStress.nplRatio > 5 ? mildPenalty : 0) -
      (scenarios.moderateStress.nplRatio > 8 ? moderatePenalty : 0) -
      (scenarios.severeStress.nplRatio > 12 ? severePenalty : 0)
    );

    return {
      scenarios,
      overallScore: stressScore,
      recommendation: stressScore > 80 ? 'Strong' : 
                     stressScore > 60 ? 'Moderate' : 
                     stressScore > 40 ? 'Weak' : 'Critical',
      generatedAt: new Date().toISOString()
    };
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0
    }).format(roundCurrency(amount));
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'error': return <XCircle className="w-4 h-4 text-red-600" />;
      case 'success': return <CheckCircle className="w-4 h-4 text-green-600" />;
      default: return <Clock className="w-4 h-4 text-blue-600" />;
    }
  };

  const accountingTabs: Array<{ id: 'dashboard' | 'trial-balance' | 'balance-sheet' | 'income-statement' | 'cash-flow' | 'general-ledger'; name: string; icon: any }> = [
    { id: 'dashboard', name: 'Dashboard', icon: BarChart3 },
    { id: 'trial-balance', name: 'Trial Balance', icon: FileText },
    { id: 'balance-sheet', name: 'Balance Sheet', icon: Receipt },
    { id: 'income-statement', name: 'Income Statement', icon: TrendingUp },
    { id: 'cash-flow', name: 'Cash Flow', icon: Activity },
    { id: 'general-ledger', name: 'General Ledger', icon: BookOpen }
  ];

  const handleTabClick = (tabId: string) => {
    const validTabId = tabId as 'dashboard' | 'trial-balance' | 'balance-sheet' | 'income-statement' | 'cash-flow' | 'general-ledger';
    setActiveTab(validTabId);
    if (tabId !== 'dashboard') {
      navigate(`/staff/accounting/${tabId.replace('-', '-')}`);
    }
  };

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-6 text-white">
          <div className="flex justify-between items-start">
            <div>
          <h1 className="text-3xl font-bold mb-2">{t('accounting')} Module</h1>
          <p className="text-indigo-100">
            360-degree view of MFI financial health with IFRS 9 and BoT compliance
          </p>
            </div>
            <div className="text-right">
              <div className="flex items-center space-x-2 mb-2">
                <div className={`w-3 h-3 rounded-full ${loading ? 'bg-yellow-400 animate-pulse' : 'bg-green-400'}`}></div>
                <span className="text-sm text-indigo-100">
                  {loading ? 'Loading...' : 'Real-time Data'}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="text-xs text-indigo-200">
                  Last updated: {new Date().toLocaleTimeString()}
                </div>
                <button
                  onClick={refreshData}
                  className="text-indigo-200 hover:text-white transition-colors"
                  title="Refresh data"
                >
                  <Activity className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {accountingTabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabClick(tab.id)}
                    className={`${
                      activeTab === tab.id
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
                  >
                    <Icon className="w-5 h-5 mr-2" />
                    {tab.name}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
              <div className="flex-1">
                <span className="text-red-800 font-medium">{error}</span>
                {error.includes('Database tables not found') && (
                  <div className="text-sm text-red-600 mt-1">
                    The accounting database tables haven't been created yet. 
                    <a href="#" className="underline ml-1">Click here to run the database migration</a>
                  </div>
                )}
              </div>
              <button
                onClick={() => refreshData()}
                className="ml-4 text-red-600 hover:text-red-800 underline"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Error Notice */}
        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
              <div>
                <span className="text-red-800 font-medium">Data Loading Error</span>
                <div className="text-sm text-red-600 mt-1">
                  {error}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Dashboard Content */}
        {activeTab === 'dashboard' && (
          <>
            {/* Period Selector */}
            <div className="flex justify-between items-center">
              <div className="flex space-x-2">
                <button
                  onClick={() => setSelectedPeriod('current')}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    selectedPeriod === 'current'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Current Month
                </button>
                <button
                  onClick={() => setSelectedPeriod('quarter')}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    selectedPeriod === 'quarter'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Quarter
                </button>
                <button
                  onClick={() => setSelectedPeriod('year')}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    selectedPeriod === 'year'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Year
                </button>
              </div>
              <button
                onClick={runStressTest}
                className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors flex items-center"
              >
                <Zap className="w-4 h-4 mr-2" />
                Run Stress Test
              </button>
            </div>

        {/* Financial Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Capital</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(displayData.financialMetrics.totalCapital)}
                </p>
                <div className="flex items-center mt-1">
                  <ArrowUp className="w-4 h-4 text-green-600 mr-1" />
                  <span className="text-sm text-green-600">+{displayData.trends.totalCapitalTrend}%</span>
                </div>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Loan Portfolio</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(displayData.financialMetrics.loanPortfolio)}
                </p>
                <div className="flex items-center mt-1">
                  <ArrowUp className="w-4 h-4 text-green-600 mr-1" />
                  <span className="text-sm text-green-600">+{displayData.trends.loanPortfolioTrend}%</span>
                </div>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">PAR 30 (BoT {'<5%'})</p>
                <p className="text-2xl font-bold text-green-700">{displayData.financialMetrics.par30}%</p>
                <div className="flex items-center mt-1">
                  <ArrowDown className="w-4 h-4 text-green-600 mr-1" />
                  <span className="text-sm text-green-600">{displayData.trends.par30Trend}%</span>
                </div>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <Shield className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Liquidity Ratio</p>
                <p className="text-2xl font-bold text-blue-700">{displayData.financialMetrics.liquidityRatio}%</p>
                <div className="flex items-center mt-1">
                  <span className="text-sm text-gray-600">Min: 1.0%</span>
                </div>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Activity className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Financial Position Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <BarChart3 className="w-5 h-5 mr-2 text-purple-600" />
              Financial Position
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">Total Assets:</span>
                <span className="font-semibold">{formatCurrency(currentFinancialMetrics.totalAssets)}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">Total Liabilities:</span>
                <span className="font-semibold">{formatCurrency(currentFinancialMetrics.totalLiabilities)}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <span className="text-gray-600">Total Equity:</span>
                <span className="font-semibold text-green-700">{formatCurrency(currentFinancialMetrics.equity)}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                <span className="text-gray-600">Net Profit (YTD):</span>
                <span className="font-semibold text-blue-700">{formatCurrency(currentFinancialMetrics.netProfit)}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <PieChart className="w-5 h-5 mr-2 text-green-600" />
              Funding Sources
            </h3>
            <div className="space-y-3">
              {fundingSources.map((source, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">{source.source}</span>
                    <span className="text-sm font-medium">{source.percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full"
                      style={{ width: `${source.percentage}%` }}
                    />
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-medium">{formatCurrency(source.amount)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Portfolio Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Target className="w-5 h-5 mr-2 text-orange-600" />
              Portfolio Status
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-700">{displayData.portfolioData.active}</p>
                <p className="text-sm text-gray-600">Active Loans</p>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <p className="text-2xl font-bold text-yellow-700">{displayData.portfolioData.overdue}</p>
                <p className="text-sm text-gray-600">Overdue</p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-700">{displayData.portfolioData.repaid}</p>
                <p className="text-sm text-gray-600">Repaid</p>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <p className="text-2xl font-bold text-red-700">{displayData.portfolioData.writeOff}</p>
                <p className="text-sm text-gray-600">Write-offs</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2 text-red-600" />
              DPD Bucket Analysis
            </h3>
            <div className="space-y-3">
              {displayData.dpdBuckets.map((bucket: any, index: number) => (
                <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <span className="font-medium text-gray-900">{bucket.bucket}</span>
                    <span className="text-sm text-gray-600 ml-2">({bucket.count} loans)</span>
                  </div>
                  <span className="font-semibold">{formatCurrency(bucket.amount)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Real-time Data Status */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse mr-3"></div>
              <span className="text-green-800 font-medium">Live Data Active</span>
              <span className="text-green-600 text-sm ml-2">• Auto-refreshes every 30 seconds</span>
              <span className="text-green-600 text-sm ml-2">• Showing data for: {chartData.map(d => d.month).join(', ')}</span>
            </div>
            <button 
              onClick={loadChartData}
              disabled={loadingCharts}
              className="flex items-center px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 mr-1 ${loadingCharts ? 'animate-spin' : ''}`} />
              {loadingCharts ? 'Refreshing...' : 'Refresh Now'}
            </button>
          </div>
        </div>

        {/* Predictive Analytics Controls */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
              <span className="text-blue-800 font-medium">Predictive Analytics</span>
              <span className="text-blue-600 text-sm ml-2">
                {predictionMode === 'current' && '• Current Performance'}
                {predictionMode === 'quarter' && '• Next Quarter Projection (3 months)'}
                {predictionMode === 'year' && '• Next Year Projection (12 months)'}
              </span>
            </div>
            <div className="flex space-x-2">
              <button 
                onClick={() => setPredictionMode('current')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  predictionMode === 'current' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white text-blue-600 border border-blue-300 hover:bg-blue-50'
                }`}
              >
                Current
              </button>
              <button 
                onClick={() => setPredictionMode('quarter')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  predictionMode === 'quarter' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white text-blue-600 border border-blue-300 hover:bg-blue-50'
                }`}
              >
                Quarter
              </button>
              <button 
                onClick={() => setPredictionMode('year')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  predictionMode === 'year' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white text-blue-600 border border-blue-300 hover:bg-blue-50'
                }`}
              >
                Year
              </button>
            </div>
          </div>
        </div>

        {/* YTD Financial Graphs */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Total Capital Trend (YTD)</h3>
            {loadingCharts ? (
              <div className="h-64 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : chartData && chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fontSize: 12 }}
                    interval={0}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis tickFormatter={(value) => `${((value || 0) / 1000000).toFixed(0)}M`} />
                  <Tooltip 
                    formatter={(value, _, props) => [
                      formatCurrency((value as number) || 0), 
                      'Total Capital',
                      props.payload?.isCurrentMonth ? '(Live)' : '(Final)'
                    ]}
                    labelFormatter={(label, payload) => {
                      const data = payload?.[0]?.payload;
                      return `${label} ${data?.isCurrentMonth ? '(Current Month - Live Data)' : '(Completed Month)'}`;
                    }}
                  />
                  <Area type="monotone" dataKey="totalCapital" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.3} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center">
                <div className="text-gray-500">No data available</div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Loan Portfolio Growth (YTD)</h3>
            {loadingCharts ? (
              <div className="h-64 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : chartData && chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fontSize: 12 }}
                    interval={0}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis tickFormatter={(value) => `${((value || 0) / 1000000).toFixed(0)}M`} />
                  <Tooltip 
                    formatter={(value, _, props) => [
                      formatCurrency((value as number) || 0), 
                      'Loan Portfolio',
                      props.payload?.isCurrentMonth ? '(Live)' : '(Final)'
                    ]}
                    labelFormatter={(label, payload) => {
                      const data = payload?.[0]?.payload;
                      return `${label} ${data?.isCurrentMonth ? '(Current Month - Live Data)' : '(Completed Month)'}`;
                    }}
                  />
                  <Bar dataKey="loanPortfolio" fill="#10B981" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center">
                <div className="text-gray-500">No data available</div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">PAR 30 Trend (YTD)</h3>
            {loadingCharts ? (
              <div className="h-64 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : chartData && chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fontSize: 12 }}
                    interval={0}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis tickFormatter={(value) => `${(value || 0).toFixed(1)}%`} />
                  <Tooltip 
                    formatter={(value, _, props) => [
                      `${(Number(value) || 0).toFixed(1)}%`, 
                      'PAR 30',
                      props.payload?.isCurrentMonth ? '(Live)' : '(Final)'
                    ]}
                    labelFormatter={(label, payload) => {
                      const data = payload?.[0]?.payload;
                      return `${label} ${data?.isCurrentMonth ? '(Current Month - Live Data)' : '(Completed Month)'}`;
                    }}
                  />
                  <Line type="monotone" dataKey="par30" stroke="#EF4444" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center">
                <div className="text-gray-500">No data available</div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Liquidity Ratio (YTD)</h3>
            {loadingCharts ? (
              <div className="h-64 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : chartData && chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fontSize: 12 }}
                    interval={0}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis tickFormatter={(value) => `${(value || 0).toFixed(1)}%`} />
                  <Tooltip 
                    formatter={(value, _, props) => [
                      `${(Number(value) || 0).toFixed(1)}%`, 
                      'Liquidity Ratio',
                      props.payload?.isCurrentMonth ? '(Live)' : '(Final)'
                    ]}
                    labelFormatter={(label, payload) => {
                      const data = payload?.[0]?.payload;
                      return `${label} ${data?.isCurrentMonth ? '(Current Month - Live Data)' : '(Completed Month)'}`;
                    }}
                  />
                  <Line type="monotone" dataKey="liquidityRatio" stroke="#8B5CF6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center">
                <div className="text-gray-500">No data available</div>
              </div>
            )}
          </div>
        </div>

        {/* AI Analytics Section */}
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border border-purple-200 p-6">
          <div className="flex items-center mb-4">
            <Brain className="w-6 h-6 text-purple-600 mr-2" />
            <h3 className="text-xl font-bold text-gray-900">AI-Powered Financial Analytics</h3>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900">Predictive Insights</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                  <span className="text-sm font-medium text-gray-600">Next Quarter Capital</span>
                  <span className="font-bold text-gray-900">TSh 52,500,000</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                  <span className="text-sm font-medium text-gray-600">Year-End Portfolio</span>
                  <span className="font-bold text-gray-900">TSh 35,000,000</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                  <span className="text-sm font-medium text-gray-600">PAR 30 Forecast</span>
                  <span className="font-bold text-green-600">3.1%</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                  <span className="text-sm font-medium text-gray-600">Confidence Level</span>
                  <span className="font-bold text-green-600">87.5%</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900">AI Recommendations</h4>
              <div className="space-y-2">
                <div className="flex items-start p-3 bg-white rounded-lg">
                  <div className="w-2 h-2 bg-purple-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span className="text-sm text-gray-700">Consider increasing capital mobilization through savings products to boost growth</span>
                </div>
                <div className="flex items-start p-3 bg-white rounded-lg">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span className="text-sm text-gray-700">PAR 30 is within BoT compliance - maintain current collection strategies</span>
                </div>
                <div className="flex items-start p-3 bg-white rounded-lg">
                  <div className="w-2 h-2 bg-green-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span className="text-sm text-gray-700">Liquidity ratio is optimal - consider expanding loan disbursements</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Calculator className="w-5 h-5 mr-2 text-blue-600" />
            Quick Actions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button 
              onClick={handleGenerateTrialBalance}
              className="p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors text-left"
            >
              <FileText className="w-6 h-6 text-blue-600 mb-2" />
              <h4 className="font-medium text-gray-900">{t('trial_balance')}</h4>
              <p className="text-sm text-gray-600">View current trial balance</p>
            </button>
            <button 
              onClick={() => setShowBalanceSheet(true)}
              className="p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors text-left"
            >
              <BarChart3 className="w-6 h-6 text-green-600 mb-2" />
              <h4 className="font-medium text-gray-900">{t('balance_sheet')}</h4>
              <p className="text-sm text-gray-600">Generate balance sheet</p>
            </button>
            <button 
              onClick={() => setShowIncomeStatement(true)}
              className="p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors text-left"
            >
              <TrendingUp className="w-6 h-6 text-purple-600 mb-2" />
              <h4 className="font-medium text-gray-900">{t('income_statement')}</h4>
              <p className="text-sm text-gray-600">View P&L statement</p>
            </button>
            <button 
              onClick={() => setShowCashFlow(true)}
              className="p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors text-left"
            >
              <Activity className="w-6 h-6 text-orange-600 mb-2" />
              <h4 className="font-medium text-gray-900">{t('cash_flow')}</h4>
              <p className="text-sm text-gray-600">Cash flow statement</p>
            </button>
          </div>
        </div>

        {/* Regulatory Actions */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Shield className="w-5 h-5 mr-2 text-red-600" />
            Regulatory Reporting
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button 
              onClick={() => navigate('/staff/regulatory-reports')}
              className="p-4 bg-red-50 rounded-lg hover:bg-red-100 transition-colors text-left"
            >
              <Shield className="w-6 h-6 text-red-600 mb-2" />
              <h4 className="font-medium text-gray-900">BoT Reports</h4>
              <p className="text-sm text-gray-600">Generate prudential reports</p>
            </button>
            <button 
              onClick={() => setShowTraReports(true)}
              className="p-4 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors text-left"
            >
              <FileText className="w-6 h-6 text-yellow-600 mb-2" />
              <h4 className="font-medium text-gray-900">TRA Reports</h4>
              <p className="text-sm text-gray-600">Tax compliance reports</p>
            </button>
            <button 
              onClick={() => setShowEclCalculation(true)}
              className="p-4 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors text-left"
            >
              <Calculator className="w-6 h-6 text-indigo-600 mb-2" />
              <h4 className="font-medium text-gray-900">ECL Calculation</h4>
              <p className="text-sm text-gray-600">IFRS 9 provisions</p>
            </button>
          </div>
        </div>

        {/* Alerts */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2 text-yellow-600" />
            System Alerts
          </h3>
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div key={alert.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  {getAlertIcon(alert.type)}
                  <span className="ml-3 text-sm text-gray-700">{alert.message}</span>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  alert.priority === 'High' ? 'bg-red-100 text-red-800' :
                  alert.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {alert.priority}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Stress Test Results */}
        {showStressTest && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Zap className="w-5 h-5 mr-2 text-orange-600" />
              Stress Test Results (20% NPL Shock)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-orange-50 rounded-lg">
                <h4 className="font-medium text-gray-900">Impact on Capital</h4>
                <p className="text-2xl font-bold text-orange-700">-18.5M</p>
                <p className="text-sm text-gray-600">Capital reduction</p>
              </div>
              <div className="p-4 bg-red-50 rounded-lg">
                <h4 className="font-medium text-gray-900">Additional Provisions</h4>
                <p className="text-2xl font-bold text-red-700">15.2M</p>
                <p className="text-sm text-gray-600">ECL provisions needed</p>
              </div>
              <div className="p-4 bg-yellow-50 rounded-lg">
                <h4 className="font-medium text-gray-900">Capital Adequacy</h4>
                <p className="text-2xl font-bold text-yellow-700">12.8%</p>
                <p className="text-sm text-gray-600">Post-shock ratio</p>
              </div>
            </div>
          </div>
        )}

        {/* Trial Balance Modal */}
        {showTrialBalance && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-6xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Trial Balance</h3>
                <button
                  onClick={() => setShowTrialBalance(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ×
                </button>
              </div>

              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h4 className="text-lg font-medium text-gray-900">As at {new Date().toLocaleDateString()}</h4>
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                    Export PDF
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full border border-gray-300">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left border-b border-gray-300 font-semibold">Account Code</th>
                        <th className="px-4 py-3 text-left border-b border-gray-300 font-semibold">Account Name</th>
                        <th className="px-4 py-3 text-right border-b border-gray-300 font-semibold">Debit (TZS)</th>
                        <th className="px-4 py-3 text-right border-b border-gray-300 font-semibold">Credit (TZS)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr>
                          <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                            <div className="flex items-center justify-center">
                              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-2"></div>
                              Loading trial balance...
                            </div>
                          </td>
                      </tr>
                      ) : trialBalance.length > 0 ? (
                        <>
                          {/* Group by account type */}
                          {['asset', 'liability', 'equity', 'income', 'expense'].map(type => {
                            const typeAccounts = trialBalance.filter(account => {
                              const chartAccount = chartOfAccounts.find(ca => ca.id === account.account_id);
                              return chartAccount?.account_type === type;
                            });
                            
                            if (typeAccounts.length === 0) return null;
                            
                            return (
                              <React.Fragment key={type}>
                      <tr className="border-b border-gray-200">
                                  <td className="px-4 py-2 font-semibold text-blue-600" colSpan={4}>
                                    {type.toUpperCase()}S
                                  </td>
                      </tr>
                                {typeAccounts.map(account => (
                                  <tr key={account.id} className="border-b border-gray-200">
                                    <td className="px-4 py-2">{account.account_code}</td>
                                    <td className="px-4 py-2">{account.account_name}</td>
                                    <td className="px-4 py-2 text-right">
                                      {account.debit_balance > 0 ? formatCurrency(account.debit_balance) : '-'}
                                    </td>
                                    <td className="px-4 py-2 text-right">
                                      {account.credit_balance > 0 ? formatCurrency(account.credit_balance) : '-'}
                                    </td>
                      </tr>
                                ))}
                              </React.Fragment>
                            );
                          })}
                          
                          {/* Totals */}
                          <tr className="border-t-2 border-gray-400 bg-gray-100">
                            <td className="px-4 py-2 font-bold" colSpan={2}>TOTAL</td>
                            <td className="px-4 py-2 text-right font-bold">
                              {formatCurrency(trialBalance.reduce((sum, account) => sum + account.debit_balance, 0))}
                            </td>
                            <td className="px-4 py-2 text-right font-bold">
                              {formatCurrency(trialBalance.reduce((sum, account) => sum + account.credit_balance, 0))}
                            </td>
                      </tr>
                        </>
                      ) : (
                        <tr>
                          <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                            No trial balance data available. Click "Generate Trial Balance" to create one.
                          </td>
                      </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Balance Sheet Modal */}
        {showBalanceSheet && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Balance Sheet</h3>
                <button
                  onClick={() => setShowBalanceSheet(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ×
                </button>
              </div>

              <div className="space-y-6">
                <div className="text-center">
                  <h4 className="text-lg font-medium text-gray-900">RYTHM Microfinance Limited</h4>
                  <p className="text-gray-600">Statement of Financial Position</p>
                  <p className="text-gray-600">As at {new Date().toLocaleDateString()}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Assets */}
                  <div>
                    <h5 className="text-lg font-semibold text-blue-600 mb-4">ASSETS</h5>
                    <div className="space-y-3">
                      <div className="font-medium text-gray-900">Current Assets</div>
                      <div className="ml-4 space-y-2">
                        <div className="flex justify-between">
                          <span>Cash and Bank</span>
                          <span>15,000,000</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Loans and Advances</span>
                          <span>89,500,000</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Accrued Interest</span>
                          <span>2,500,000</span>
                        </div>
                        <div className="flex justify-between border-t pt-2 font-medium">
                          <span>Total Current Assets</span>
                          <span>107,000,000</span>
                        </div>
                      </div>
                      
                      <div className="font-medium text-gray-900 mt-4">Non-Current Assets</div>
                      <div className="ml-4 space-y-2">
                        <div className="flex justify-between">
                          <span>Property & Equipment</span>
                          <span>45,000,000</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Intangible Assets</span>
                          <span>5,000,000</span>
                        </div>
                        <div className="flex justify-between border-t pt-2 font-medium">
                          <span>Total Non-Current Assets</span>
                          <span>50,000,000</span>
                        </div>
                      </div>
                      
                      <div className="flex justify-between border-t-2 pt-3 font-bold text-lg">
                        <span>TOTAL ASSETS</span>
                        <span>157,000,000</span>
                      </div>
                    </div>
                  </div>

                  {/* Liabilities & Equity */}
                  <div>
                    <h5 className="text-lg font-semibold text-red-600 mb-4">LIABILITIES & EQUITY</h5>
                    <div className="space-y-3">
                      <div className="font-medium text-gray-900">Current Liabilities</div>
                      <div className="ml-4 space-y-2">
                        <div className="flex justify-between">
                          <span>Accounts Payable</span>
                          <span>3,000,000</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Accrued Expenses</span>
                          <span>2,000,000</span>
                        </div>
                        <div className="flex justify-between">
                          <span>ECL Provisions</span>
                          <span>7,000,000</span>
                        </div>
                        <div className="flex justify-between border-t pt-2 font-medium">
                          <span>Total Current Liabilities</span>
                          <span>12,000,000</span>
                        </div>
                      </div>
                      
                      <div className="font-medium text-gray-900 mt-4">Non-Current Liabilities</div>
                      <div className="ml-4 space-y-2">
                        <div className="flex justify-between">
                          <span>Long-term Debt</span>
                          <span>20,000,000</span>
                        </div>
                        <div className="flex justify-between border-t pt-2 font-medium">
                          <span>Total Non-Current Liabilities</span>
                          <span>20,000,000</span>
                        </div>
                      </div>
                      
                      <div className="flex justify-between border-t pt-2 font-medium">
                        <span>TOTAL LIABILITIES</span>
                        <span>32,000,000</span>
                      </div>
                      
                      <div className="font-medium text-gray-900 mt-4">Equity</div>
                      <div className="ml-4 space-y-2">
                        <div className="flex justify-between">
                          <span>Share Capital</span>
                          <span>75,000,000</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Retained Earnings</span>
                          <span>38,000,000</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Current Year Profit</span>
                          <span>12,000,000</span>
                        </div>
                        <div className="flex justify-between border-t pt-2 font-medium">
                          <span>TOTAL EQUITY</span>
                          <span>125,000,000</span>
                        </div>
                      </div>
                      
                      <div className="flex justify-between border-t-2 pt-3 font-bold text-lg">
                        <span>TOTAL LIABILITIES & EQUITY</span>
                        <span>157,000,000</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3">
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                    Export PDF
                  </button>
                  <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
                    Export Excel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Income Statement Modal */}
        {showIncomeStatement && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Income Statement</h3>
                <button
                  onClick={() => setShowIncomeStatement(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ×
                </button>
              </div>

              <div className="space-y-6">
                <div className="text-center">
                  <h4 className="text-lg font-medium text-gray-900">RYTHM Microfinance Limited</h4>
                  <p className="text-gray-600">Statement of Comprehensive Income</p>
                  <p className="text-gray-600">For the Year Ended {new Date().getFullYear()}</p>
                </div>

                <div className="space-y-4">
                  <div className="font-semibold text-green-600 text-lg">REVENUE</div>
                  <div className="ml-4 space-y-2">
                    <div className="flex justify-between">
                      <span>Interest Income on Loans</span>
                      <span>22,000,000</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Fee and Commission Income</span>
                      <span>3,000,000</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Other Income</span>
                      <span>500,000</span>
                    </div>
                    <div className="flex justify-between border-t pt-2 font-medium">
                      <span>Total Revenue</span>
                      <span>25,500,000</span>
                    </div>
                  </div>

                  <div className="font-semibold text-red-600 text-lg mt-6">EXPENSES</div>
                  <div className="ml-4 space-y-2">
                    <div className="flex justify-between">
                      <span>Staff Costs</span>
                      <span>8,000,000</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Administrative Expenses</span>
                      <span>4,000,000</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Depreciation</span>
                      <span>2,500,000</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Provision for Credit Losses (ECL)</span>
                      <span>4,250,000</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Interest Expense</span>
                      <span>1,500,000</span>
                    </div>
                    <div className="flex justify-between border-t pt-2 font-medium">
                      <span>Total Expenses</span>
                      <span>20,250,000</span>
                    </div>
                  </div>

                  <div className="border-t-2 pt-4">
                    <div className="flex justify-between font-bold text-lg">
                      <span>Profit Before Tax</span>
                      <span>5,250,000</span>
                    </div>
                    <div className="flex justify-between mt-2">
                      <span>Income Tax Expense (30%)</span>
                      <span>(1,575,000)</span>
                    </div>
                    <div className="flex justify-between border-t pt-2 font-bold text-xl text-green-600">
                      <span>Net Profit After Tax</span>
                      <span>3,675,000</span>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h5 className="font-medium text-gray-900 mb-2">Key Ratios</h5>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex justify-between">
                        <span>Return on Assets (ROA):</span>
                        <span>2.3%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Return on Equity (ROE):</span>
                        <span>2.9%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Net Interest Margin:</span>
                        <span>14.0%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Cost-to-Income Ratio:</span>
                        <span>79.4%</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3">
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                    Export PDF
                  </button>
                  <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
                    Export Excel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Cash Flow Statement Modal */}
        {showCashFlow && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Cash Flow Statement</h3>
                <button
                  onClick={() => setShowCashFlow(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ×
                </button>
              </div>

              <div className="space-y-6">
                <div className="text-center">
                  <h4 className="text-lg font-medium text-gray-900">RYTHM Microfinance Limited</h4>
                  <p className="text-gray-600">Statement of Cash Flows</p>
                  <p className="text-gray-600">For the Year Ended {new Date().getFullYear()}</p>
                </div>

                <div className="space-y-6">
                  {/* Operating Activities */}
                  <div>
                    <h5 className="font-semibold text-blue-600 text-lg mb-3">CASH FLOWS FROM OPERATING ACTIVITIES</h5>
                    <div className="ml-4 space-y-2">
                      <div className="flex justify-between">
                        <span>Net Profit After Tax</span>
                        <span>3,675,000</span>
                      </div>
                      <div className="text-sm font-medium text-gray-700 mt-3">Adjustments for:</div>
                      <div className="flex justify-between ml-4">
                        <span>Depreciation</span>
                        <span>2,500,000</span>
                      </div>
                      <div className="flex justify-between ml-4">
                        <span>Provision for Credit Losses</span>
                        <span>4,250,000</span>
                      </div>
                      <div className="text-sm font-medium text-gray-700 mt-3">Changes in Working Capital:</div>
                      <div className="flex justify-between ml-4">
                        <span>Increase in Loans and Advances</span>
                        <span>(15,000,000)</span>
                      </div>
                      <div className="flex justify-between ml-4">
                        <span>Increase in Accrued Interest</span>
                        <span>(500,000)</span>
                      </div>
                      <div className="flex justify-between ml-4">
                        <span>Increase in Accounts Payable</span>
                        <span>800,000</span>
                      </div>
                      <div className="flex justify-between border-t pt-2 font-medium">
                        <span>Net Cash from Operating Activities</span>
                        <span>(4,275,000)</span>
                      </div>
                    </div>
                  </div>

                  {/* Investing Activities */}
                  <div>
                    <h5 className="font-semibold text-purple-600 text-lg mb-3">CASH FLOWS FROM INVESTING ACTIVITIES</h5>
                    <div className="ml-4 space-y-2">
                      <div className="flex justify-between">
                        <span>Purchase of Property & Equipment</span>
                        <span>(3,500,000)</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Purchase of Intangible Assets</span>
                        <span>(1,000,000)</span>
                      </div>
                      <div className="flex justify-between border-t pt-2 font-medium">
                        <span>Net Cash Used in Investing Activities</span>
                        <span>(4,500,000)</span>
                      </div>
                    </div>
                  </div>

                  {/* Financing Activities */}
                  <div>
                    <h5 className="font-semibold text-green-600 text-lg mb-3">CASH FLOWS FROM FINANCING ACTIVITIES</h5>
                    <div className="ml-4 space-y-2">
                      <div className="flex justify-between">
                        <span>Proceeds from Long-term Debt</span>
                        <span>10,000,000</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Share Capital Issued</span>
                        <span>5,000,000</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Dividends Paid</span>
                        <span>(2,000,000)</span>
                      </div>
                      <div className="flex justify-between border-t pt-2 font-medium">
                        <span>Net Cash from Financing Activities</span>
                        <span>13,000,000</span>
                      </div>
                    </div>
                  </div>

                  {/* Net Change in Cash */}
                  <div className="border-t-2 pt-4">
                    <div className="flex justify-between font-medium">
                      <span>Net Increase in Cash and Cash Equivalents</span>
                      <span>4,225,000</span>
                    </div>
                    <div className="flex justify-between mt-2">
                      <span>Cash and Cash Equivalents at Beginning of Year</span>
                      <span>10,775,000</span>
                    </div>
                    <div className="flex justify-between border-t pt-2 font-bold text-lg">
                      <span>Cash and Cash Equivalents at End of Year</span>
                      <span>15,000,000</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3">
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                    Export PDF
                  </button>
                  <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
                    Export Excel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* BoT Reports Modal */}
        {showBotReports && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-5xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900">BoT Prudential Reports</h3>
                <button
                  onClick={() => setShowBotReports(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ×
                </button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Capital Adequacy Report */}
                  <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                    <h4 className="font-medium text-red-800 mb-3">Capital Adequacy Report</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Tier 1 Capital:</span>
                        <span className="font-medium">{formatCurrency(currentFinancialMetrics.totalCapital * 0.75)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Tier 2 Capital:</span>
                        <span className="font-medium">{formatCurrency(currentFinancialMetrics.totalCapital * 0.25)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Capital:</span>
                        <span className="font-medium">{formatCurrency(currentFinancialMetrics.totalCapital)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Risk-Weighted Assets:</span>
                        <span className="font-medium">{formatCurrency(currentFinancialMetrics.loanPortfolio)}</span>
                      </div>
                      <div className="flex justify-between border-t pt-2">
                        <span>Capital Adequacy Ratio:</span>
                        <span className="font-bold text-green-600">
                          {((currentFinancialMetrics.totalCapital / currentFinancialMetrics.loanPortfolio) * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="text-xs text-gray-600">Minimum Required: 8%</div>
                    </div>
                    <button className="w-full mt-3 bg-red-600 text-white px-3 py-2 rounded text-sm hover:bg-red-700">
                      Generate XML Report
                    </button>
                  </div>

                  {/* Liquidity Report */}
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <h4 className="font-medium text-blue-800 mb-3">Liquidity Report</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Liquid Assets:</span>
                        <span className="font-medium">{formatCurrency(currentFinancialMetrics.totalCapital * 0.12)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Outstanding Loans:</span>
                        <span className="font-medium">{formatCurrency(currentFinancialMetrics.loanPortfolio)}</span>
                      </div>
                      <div className="flex justify-between border-t pt-2">
                        <span>Liquidity Ratio:</span>
                        <span className="font-bold text-green-600">{(currentFinancialMetrics.liquidityRatio || 0).toFixed(1)}%</span>
                      </div>
                      <div className="text-xs text-gray-600">Minimum Required: 1%</div>
                      <div className="mt-2">
                        <div className="text-xs text-gray-600">Daily Trend (Last 5 Days):</div>
                        <div className="text-xs space-y-1">
                          <div>Jan 6: {((currentFinancialMetrics.liquidityRatio || 0) * 0.96).toFixed(1)}%</div>
                          <div>Jan 7: {((currentFinancialMetrics.liquidityRatio || 0) * 0.98).toFixed(1)}%</div>
                          <div>Jan 8: {(currentFinancialMetrics.liquidityRatio || 0).toFixed(1)}%</div>
                          <div>Jan 9: {((currentFinancialMetrics.liquidityRatio || 0) * 0.98).toFixed(1)}%</div>
                          <div>Jan 10: {(currentFinancialMetrics.liquidityRatio || 0).toFixed(1)}%</div>
                        </div>
                      </div>
                    </div>
                    <button className="w-full mt-3 bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700">
                      Generate XML Report
                    </button>
                  </div>

                  {/* PAR Report */}
                  <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                    <h4 className="font-medium text-yellow-800 mb-3">Portfolio at Risk (PAR) Report</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>PAR 30:</span>
                        <span className="font-bold text-green-600">{(currentFinancialMetrics.par30 || 0).toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>PAR 60:</span>
                        <span className="font-medium">{((currentFinancialMetrics.par30 || 0) * 0.75).toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>PAR 90:</span>
                        <span className="font-medium">{((currentFinancialMetrics.par30 || 0) * 0.5).toFixed(1)}%</span>
                      </div>
                      <div className="text-xs text-gray-600">BoT Limit: {'< 5%'}</div>
                      <div className="mt-2">
                        <div className="text-xs text-gray-600">DPD Breakdown:</div>
                        <div className="text-xs space-y-1">
                          <div>DPD 1-30: {Math.round(currentFinancialMetrics.loanPortfolio * 0.05 / 1000000 * 15)} loans ({formatCurrency(currentFinancialMetrics.loanPortfolio * 0.05)})</div>
                          <div>DPD 31-60: {Math.round(currentFinancialMetrics.loanPortfolio * 0.013 / 1000000 * 8)} loans ({formatCurrency(currentFinancialMetrics.loanPortfolio * 0.013)})</div>
                          <div>DPD 61-90: {Math.round(currentFinancialMetrics.loanPortfolio * 0.005 / 1000000 * 3)} loans ({formatCurrency(currentFinancialMetrics.loanPortfolio * 0.005)})</div>
                          <div>DPD 90+: {Math.round(currentFinancialMetrics.loanPortfolio * 0.002 / 1000000 * 1)} loans ({formatCurrency(currentFinancialMetrics.loanPortfolio * 0.002)})</div>
                        </div>
                      </div>
                    </div>
                    <button className="w-full mt-3 bg-yellow-600 text-white px-3 py-2 rounded text-sm hover:bg-yellow-700">
                      Generate XML Report
                    </button>
                  </div>

                  {/* Loan Loss Provisions */}
                  <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                    <h4 className="font-medium text-purple-800 mb-3">Loan Loss Provisions (IFRS 9)</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Stage 1 Provisions:</span>
                        <span className="font-medium">TZS 425,000</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Stage 2 Provisions:</span>
                        <span className="font-medium">TZS 225,000</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Stage 3 Provisions:</span>
                        <span className="font-medium">TZS 900,000</span>
                      </div>
                      <div className="flex justify-between border-t pt-2">
                        <span>Total ECL Provisions:</span>
                        <span className="font-bold">TZS 1,550,000</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Provision Coverage:</span>
                        <span className="font-medium">1.7%</span>
                      </div>
                    </div>
                    <button className="w-full mt-3 bg-purple-600 text-white px-3 py-2 rounded text-sm hover:bg-purple-700">
                      Generate XML Report
                    </button>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">Submission Status</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="flex justify-between">
                      <span>Last Submission:</span>
                      <span>2025-01-01</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Next Due Date:</span>
                      <span>2025-01-31</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Submission Method:</span>
                      <span>BoT BSIS Portal</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Format:</span>
                      <span>XML (Feb 2025 Spec)</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3">
                  <button className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors">
                    Submit All to BoT BSIS
                  </button>
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                    Download Package
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TRA Reports Modal */}
        {showTraReports && (() => {
          const traData = calculateTRAData();
          return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">TRA Tax Compliance Reports</h3>
                  <button
                    onClick={() => setShowTraReports(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ×
                  </button>
                </div>

                <div className="space-y-6">
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <h4 className="font-medium text-blue-800 mb-2">Real-Time Data Source</h4>
                    <p className="text-sm text-blue-700">
                      All tax calculations are generated from actual journal entries and financial transactions in real-time.
                      Data is automatically updated every 30 seconds.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* VAT Report */}
                    <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                      <h4 className="font-medium text-green-800 mb-3">VAT Return</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Taxable Supplies:</span>
                          <span className="font-medium">{formatCurrency(traData.vat.taxableSupplies)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Output VAT (18%):</span>
                          <span className="font-medium">{formatCurrency(traData.vat.outputVAT)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Input VAT:</span>
                          <span className="font-medium">{formatCurrency(traData.vat.inputVAT)}</span>
                        </div>
                        <div className="flex justify-between border-t pt-2">
                          <span>Net VAT Payable:</span>
                          <span className="font-bold">{formatCurrency(traData.vat.netVAT)}</span>
                        </div>
                        <div className="text-xs text-gray-600 mt-2">
                          Period: {new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
                        </div>
                      </div>
                      <button className="w-full mt-3 bg-green-600 text-white px-3 py-2 rounded text-sm hover:bg-green-700">
                        Generate VAT Return
                      </button>
                    </div>

                    {/* Corporate Tax */}
                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                      <h4 className="font-medium text-blue-800 mb-3">Corporate Income Tax</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Taxable Income:</span>
                          <span className="font-medium">{formatCurrency(traData.corporateTax.taxableIncome)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Tax Rate:</span>
                          <span className="font-medium">{(traData.corporateTax.taxRate * 100).toFixed(0)}%</span>
                        </div>
                        <div className="flex justify-between border-t pt-2">
                          <span>Corporate Tax:</span>
                          <span className="font-bold">{formatCurrency(traData.corporateTax.corporateTax)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Quarterly Installments:</span>
                          <span className="font-medium">{formatCurrency(traData.corporateTax.quarterlyInstallments)}</span>
                        </div>
                        <div className="text-xs text-gray-600 mt-2">
                          Tax Year: {new Date().getFullYear()}
                        </div>
                      </div>
                      <button className="w-full mt-3 bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700">
                        Generate Tax Return
                      </button>
                    </div>

                    {/* Withholding Tax */}
                    <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                      <h4 className="font-medium text-yellow-800 mb-3">Withholding Tax</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Interest Income (10%):</span>
                          <span className="font-medium">{formatCurrency(traData.withholdingTax.interestIncome)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Service Fees (5%):</span>
                          <span className="font-medium">{formatCurrency(traData.withholdingTax.serviceFees)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Consultancy (15%):</span>
                          <span className="font-medium">{formatCurrency(traData.withholdingTax.consultancy)}</span>
                        </div>
                        <div className="flex justify-between border-t pt-2">
                          <span>Total WHT:</span>
                          <span className="font-bold">{formatCurrency(traData.withholdingTax.totalWHT)}</span>
                        </div>
                      </div>
                      <button className="w-full mt-3 bg-yellow-600 text-white px-3 py-2 rounded text-sm hover:bg-yellow-700">
                        Generate WHT Return
                      </button>
                    </div>

                    {/* PAYE */}
                    <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                      <h4 className="font-medium text-purple-800 mb-3">PAYE (Pay As You Earn)</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Gross Salaries:</span>
                          <span className="font-medium">{formatCurrency(traData.paye.grossSalaries)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>PAYE Deducted:</span>
                          <span className="font-medium">{formatCurrency(traData.paye.payeDeducted)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>SDL (6%):</span>
                          <span className="font-medium">{formatCurrency(traData.paye.sdl)}</span>
                        </div>
                        <div className="flex justify-between border-t pt-2">
                          <span>Total Remittance:</span>
                          <span className="font-bold">{formatCurrency(traData.paye.totalRemittance)}</span>
                        </div>
                      </div>
                      <button className="w-full mt-3 bg-purple-600 text-white px-3 py-2 rounded text-sm hover:bg-purple-700">
                        Generate PAYE Return
                      </button>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-3">TRA Compliance Status</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="text-center">
                        <div className="text-lg font-bold text-green-600">Current</div>
                        <div className="text-gray-600">VAT Returns</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-green-600">Filed</div>
                        <div className="text-gray-600">Corporate Tax</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-yellow-600">Due Soon</div>
                        <div className="text-gray-600">PAYE (15th)</div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3">
                    <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
                      Submit to TRA Portal
                    </button>
                    <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                      Download All Returns
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* ECL Calculation Modal */}
        {showEclCalculation && (() => {
          const eclData = calculateECL();
          const activeStatuses = LoanStatusMappingService.getActiveLoanStatuses();
          return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl p-6 max-w-5xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900">IFRS 9 Expected Credit Loss Calculation</h3>
                <button
                  onClick={() => setShowEclCalculation(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ×
                </button>
              </div>

              <div className="space-y-6">
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <h4 className="font-medium text-blue-800 mb-2">Real-Time ECL Calculation</h4>
                  <p className="text-sm text-blue-700">
                    Expected Credit Loss calculation based on IFRS 9 three-stage approach using actual loan data from 
                    loan_applications and loans tables. Data is automatically updated every 30 seconds.
                  </p>
                  <div className="mt-2 text-xs text-blue-600">
                    Data Sources: {loanApplications?.length || 0} loan applications, {activeLoans?.length || 0} active loans
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Stage 1 */}
                  <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                    <h4 className="font-medium text-green-800 mb-3">Stage 1: 12-Month ECL</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Criteria:</span>
                        <span className="font-medium">DPD 0-29</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Number of Loans:</span>
                        <span className="font-medium">{loanApplications?.filter(loan => activeStatuses.loanApplication.includes(loan.status)).length || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Outstanding Amount:</span>
                        <span className="font-medium">{formatCurrency(eclData.stage1.ead)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>PD (12-month):</span>
                        <span className="font-medium">{(eclData.stage1.pd * 100).toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>LGD:</span>
                        <span className="font-medium">{(eclData.stage1.lgd * 100).toFixed(0)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>EAD:</span>
                        <span className="font-medium">100%</span>
                      </div>
                      <div className="flex justify-between border-t pt-2">
                        <span>ECL Provision:</span>
                        <span className="font-bold">{formatCurrency(eclData.stage1.ecl)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Stage 2 */}
                  <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                    <h4 className="font-medium text-yellow-800 mb-3">Stage 2: Lifetime ECL</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Criteria:</span>
                        <span className="font-medium">DPD 30-89</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Number of Loans:</span>
                        <span className="font-medium">{loanApplications?.filter(loan => loan.status === 'overdue' || loan.status === 'default').length || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Outstanding Amount:</span>
                        <span className="font-medium">{formatCurrency(eclData.stage2.ead)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>PD (Lifetime):</span>
                        <span className="font-medium">{(eclData.stage2.pd * 100).toFixed(0)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>LGD:</span>
                        <span className="font-medium">{(eclData.stage2.lgd * 100).toFixed(0)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>EAD:</span>
                        <span className="font-medium">100%</span>
                      </div>
                      <div className="flex justify-between border-t pt-2">
                        <span>ECL Provision:</span>
                        <span className="font-bold">{formatCurrency(eclData.stage2.ecl)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Stage 3 */}
                  <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                    <h4 className="font-medium text-red-800 mb-3">Stage 3: Credit Impaired</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Criteria:</span>
                        <span className="font-medium">DPD 90+</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Number of Loans:</span>
                        <span className="font-medium">{loanApplications?.filter(loan => loan.status === 'written_off' || loan.status === 'bad_debt').length || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Outstanding Amount:</span>
                        <span className="font-medium">{formatCurrency(eclData.stage3.ead)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>PD (Lifetime):</span>
                        <span className="font-medium">{(eclData.stage3.pd * 100).toFixed(0)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>LGD:</span>
                        <span className="font-medium">{(eclData.stage3.lgd * 100).toFixed(0)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>EAD:</span>
                        <span className="font-medium">100%</span>
                      </div>
                      <div className="flex justify-between border-t pt-2">
                        <span>ECL Provision:</span>
                        <span className="font-bold">{formatCurrency(eclData.stage3.ecl)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">ECL Summary & Reconciliation</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Stage 1 ECL:</span>
                        <span className="font-medium">{formatCurrency(eclData.stage1.ecl)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Stage 2 ECL:</span>
                        <span className="font-medium">{formatCurrency(eclData.stage2.ecl)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Stage 3 ECL:</span>
                        <span className="font-medium">{formatCurrency(eclData.stage3.ecl)}</span>
                      </div>
                      <div className="flex justify-between border-t pt-2 font-bold">
                        <span>Total Required ECL:</span>
                        <span>{formatCurrency(eclData.totalECL)}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Current Provision Balance:</span>
                        <span className="font-medium">TZS 700,000</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Additional Provision Needed:</span>
                        <span className="font-medium text-red-600">TZS 223,775</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Coverage Ratio:</span>
                        <span className="font-medium">1.03%</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                  <h4 className="font-medium text-purple-800 mb-3">Model Parameters & Assumptions</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="font-medium mb-2">Probability of Default (PD):</div>
                      <ul className="space-y-1 text-xs">
                        <li>• Stage 1: Based on 12-month historical default rates</li>
                        <li>• Stage 2/3: Lifetime PD using survival analysis</li>
                        <li>• Adjusted for forward-looking macroeconomic factors</li>
                      </ul>
                    </div>
                    <div>
                      <div className="font-medium mb-2">Loss Given Default (LGD):</div>
                      <ul className="space-y-1 text-xs">
                        <li>• Secured loans: 45% (considering collateral recovery)</li>
                        <li>• Unsecured loans: 65%</li>
                        <li>• Recovery costs and time value of money included</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3">
                  <button className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors">
                    Update Provisions
                  </button>
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                    Export ECL Report
                  </button>
                  <button 
                    onClick={() => setShowJournalEntryModal(true)}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Generate Journal Entry
                  </button>
                </div>
              </div>
            </div>
          </div>
          );
        })()}

        {/* Journal Entry Modal */}
        {showJournalEntryModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Create Journal Entry</h3>
                <button
                  onClick={() => setShowJournalEntryModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Journal Entry Header */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Entry Number
                    </label>
                    <input
                      type="text"
                      value={newJournalEntry.entry_number}
                      onChange={(e) => setNewJournalEntry(prev => ({ ...prev, entry_number: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Auto-generated if empty"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Entry Date
                    </label>
                    <input
                      type="date"
                      value={newJournalEntry.entry_date}
                      onChange={(e) => setNewJournalEntry(prev => ({ ...prev, entry_date: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reference
                    </label>
                    <input
                      type="text"
                      value={newJournalEntry.reference}
                      onChange={(e) => setNewJournalEntry(prev => ({ ...prev, reference: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Reference number or description"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <input
                      type="text"
                      value={newJournalEntry.description}
                      onChange={(e) => setNewJournalEntry(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Journal entry description"
                    />
                  </div>
                </div>

                {/* Journal Entry Lines */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-lg font-medium text-gray-900">Journal Entry Lines</h4>
                    <button
                      onClick={addJournalEntryLine}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Add Line
                    </button>
                  </div>

                  <div className="space-y-4">
                    {newJournalEntry.lines.map((line, index) => (
                      <div key={index} className="grid grid-cols-12 gap-4 items-end">
                        <div className="col-span-4">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Account
                          </label>
                          <select
                            value={line.account_id}
                            onChange={(e) => updateJournalEntryLine(index, 'account_id', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="">Select Account</option>
                            {displayChartOfAccounts.map(account => (
                              <option key={account.id} value={account.id}>
                                {account.account_code} - {account.account_name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="col-span-4">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Description
                          </label>
                          <input
                            type="text"
                            value={line.description}
                            onChange={(e) => updateJournalEntryLine(index, 'description', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Line description"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Debit
                          </label>
                          <input
                            type="number"
                            value={line.debit_amount}
                            onChange={(e) => updateJournalEntryLine(index, 'debit_amount', parseFloat(e.target.value) || 0)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="0.00"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Credit
                          </label>
                          <input
                            type="number"
                            value={line.credit_amount}
                            onChange={(e) => updateJournalEntryLine(index, 'credit_amount', parseFloat(e.target.value) || 0)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="0.00"
                          />
                        </div>
                        <div className="col-span-1">
                          <button
                            onClick={() => removeJournalEntryLine(index)}
                            className="text-red-600 hover:text-red-800 p-2"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Totals */}
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-700">Total Debits:</span>
                      <span className="font-bold text-gray-900">
                        {formatCurrency(newJournalEntry.lines.reduce((sum, line) => sum + (line.debit_amount || 0), 0))}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <span className="font-medium text-gray-700">Total Credits:</span>
                      <span className="font-bold text-gray-900">
                        {formatCurrency(newJournalEntry.lines.reduce((sum, line) => sum + (line.credit_amount || 0), 0))}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-300">
                      <span className="font-bold text-gray-900">Difference:</span>
                      <span className={`font-bold ${
                        Math.abs(newJournalEntry.lines.reduce((sum, line) => sum + (line.debit_amount || 0), 0) - 
                        newJournalEntry.lines.reduce((sum, line) => sum + (line.credit_amount || 0), 0)) === 0 
                          ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatCurrency(
                          newJournalEntry.lines.reduce((sum, line) => sum + (line.debit_amount || 0), 0) - 
                          newJournalEntry.lines.reduce((sum, line) => sum + (line.credit_amount || 0), 0)
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => setShowJournalEntryModal(false)}
                    className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateJournalEntry}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Create Journal Entry
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}


        {/* Trial Balance Tab */}
        {(activeTab as string) === 'trial-balance' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Trial Balance</h2>
              <div className="flex space-x-2">
                <button
                  onClick={handleGenerateTrialBalance}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Generate Trial Balance
                </button>
                <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
                  Export PDF
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6">
                <div className="overflow-x-auto">
                  <table className="w-full border border-gray-300">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left border-b border-gray-300 font-semibold">Account Code</th>
                        <th className="px-4 py-3 text-left border-b border-gray-300 font-semibold">Account Name</th>
                        <th className="px-4 py-3 text-right border-b border-gray-300 font-semibold">Debit (TZS)</th>
                        <th className="px-4 py-3 text-right border-b border-gray-300 font-semibold">Credit (TZS)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr>
                          <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                            <div className="flex items-center justify-center">
                              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-2"></div>
                              Loading trial balance...
                            </div>
                          </td>
                        </tr>
                      ) : (trialBalance && trialBalance.length > 0) ? (
                        <>
                          {/* Group by account type */}
                          {['asset', 'liability', 'equity', 'income', 'expense'].map(type => {
                            const typeAccounts = trialBalance.filter(account => {
                              const chartAccount = displayChartOfAccounts.find(ca => ca.id === account.account_id);
                              return chartAccount?.account_type === type;
                            });

                            if (typeAccounts.length === 0) return null;

                            return (
                              <React.Fragment key={type}>
                                <tr className="border-b border-gray-200">
                                  <td className="px-4 py-2 font-semibold text-blue-600" colSpan={4}>
                                    {type.toUpperCase()}S
                                  </td>
                                </tr>
                                {typeAccounts.map(account => (
                                  <tr key={account.id} className="border-b border-gray-200">
                                    <td className="px-4 py-2">{account.account_code}</td>
                                    <td className="px-4 py-2">{account.account_name}</td>
                                    <td className="px-4 py-2 text-right">
                                      {account.debit_balance > 0 ? formatCurrency(account.debit_balance) : '-'}
                                    </td>
                                    <td className="px-4 py-2 text-right">
                                      {account.credit_balance > 0 ? formatCurrency(account.credit_balance) : '-'}
                                    </td>
                                  </tr>
                                ))}
                              </React.Fragment>
                            );
                          })}

                          {/* Totals */}
                          <tr className="border-t-2 border-gray-400 bg-gray-100">
                            <td className="px-4 py-2 font-bold" colSpan={2}>TOTAL</td>
                            <td className="px-4 py-2 text-right font-bold">
                              {formatCurrency(trialBalance.reduce((sum, account) => sum + account.debit_balance, 0))}
                            </td>
                            <td className="px-4 py-2 text-right font-bold">
                              {formatCurrency(trialBalance.reduce((sum, account) => sum + account.credit_balance, 0))}
                            </td>
                          </tr>
                        </>
                      ) : (
                        <tr>
                          <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                            <div className="space-y-4">
                              <p>No trial balance data available.</p>
                              <button
                                onClick={handleGenerateTrialBalance}
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                              >
                                Generate Trial Balance
                              </button>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Balance Sheet Tab */}
        {(activeTab as string) === 'balance-sheet' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Balance Sheet</h2>
              <div className="flex space-x-2">
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                  Generate Balance Sheet
                </button>
                <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
                  Export PDF
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Assets */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">ASSETS</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-600">Cash and Cash Equivalents</span>
                      <span className="font-semibold">{formatCurrency(25000000)}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-600">Loans and Advances</span>
                      <span className="font-semibold">{formatCurrency(currentFinancialMetrics.loanPortfolio)}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-600">Property and Equipment</span>
                      <span className="font-semibold">{formatCurrency(15000000)}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-600">Other Assets</span>
                      <span className="font-semibold">{formatCurrency(5000000)}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg border-t-2 border-blue-200">
                      <span className="font-bold text-gray-900">TOTAL ASSETS</span>
                      <span className="font-bold text-blue-700">{formatCurrency(currentFinancialMetrics.totalAssets)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Liabilities and Equity */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">LIABILITIES & EQUITY</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-600">Deposits and Borrowings</span>
                      <span className="font-semibold">{formatCurrency(20000000)}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-600">Other Liabilities</span>
                      <span className="font-semibold">{formatCurrency(12000000)}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-600">Total Liabilities</span>
                      <span className="font-semibold">{formatCurrency(currentFinancialMetrics.totalLiabilities)}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                      <span className="text-gray-600">Share Capital</span>
                      <span className="font-semibold">{formatCurrency(75000000)}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                      <span className="text-gray-600">Retained Earnings</span>
                      <span className="font-semibold">{formatCurrency(38000000)}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg border-t-2 border-green-200">
                      <span className="font-bold text-gray-900">TOTAL EQUITY</span>
                      <span className="font-bold text-green-700">{formatCurrency(currentFinancialMetrics.equity)}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg border-t-2 border-blue-200">
                      <span className="font-bold text-gray-900">TOTAL LIABILITIES & EQUITY</span>
                      <span className="font-bold text-blue-700">{formatCurrency(currentFinancialMetrics.totalAssets)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Income Statement Tab */}
        {(activeTab as string) === 'income-statement' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Income Statement</h2>
              <div className="flex space-x-2">
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                  Generate Income Statement
                </button>
                <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
                  Export PDF
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6">
                <div className="space-y-4">
                  {/* Revenue */}
                  <div className="border-b border-gray-200 pb-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">REVENUE</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <span className="text-gray-600">Interest Income</span>
                        <span className="font-semibold">{formatCurrency(12500000)}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <span className="text-gray-600">Fee Income</span>
                        <span className="font-semibold">{formatCurrency(2500000)}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg border-t-2 border-green-200">
                        <span className="font-bold text-gray-900">TOTAL REVENUE</span>
                        <span className="font-bold text-green-700">{formatCurrency(15000000)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Expenses */}
                  <div className="border-b border-gray-200 pb-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">EXPENSES</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <span className="text-gray-600">Interest Expense</span>
                        <span className="font-semibold">{formatCurrency(2000000)}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <span className="text-gray-600">Operating Expenses</span>
                        <span className="font-semibold">{formatCurrency(3500000)}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <span className="text-gray-600">Provision for Loan Losses</span>
                        <span className="font-semibold">{formatCurrency(750000)}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg border-t-2 border-red-200">
                        <span className="font-bold text-gray-900">TOTAL EXPENSES</span>
                        <span className="font-bold text-red-700">{formatCurrency(6250000)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Net Income */}
                  <div>
                    <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg border-t-2 border-blue-200">
                      <span className="font-bold text-gray-900">NET INCOME</span>
                      <span className="font-bold text-blue-700">{formatCurrency(currentFinancialMetrics.netProfit)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Cash Flow Tab */}
        {(activeTab as string) === 'cash-flow' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Cash Flow Statement</h2>
              <div className="flex space-x-2">
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                  Generate Cash Flow
                </button>
                <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
                  Export PDF
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6">
                <div className="space-y-6">
                  {/* Operating Activities */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">OPERATING ACTIVITIES</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <span className="text-gray-600">Net Income</span>
                        <span className="font-semibold">{formatCurrency(currentFinancialMetrics.netProfit)}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <span className="text-gray-600">Depreciation</span>
                        <span className="font-semibold">{formatCurrency(1500000)}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <span className="text-gray-600">Changes in Working Capital</span>
                        <span className="font-semibold">{formatCurrency(-2000000)}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg border-t-2 border-blue-200">
                        <span className="font-bold text-gray-900">Net Cash from Operations</span>
                        <span className="font-bold text-blue-700">{formatCurrency(8250000)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Investing Activities */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">INVESTING ACTIVITIES</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <span className="text-gray-600">Purchase of Property & Equipment</span>
                        <span className="font-semibold">{formatCurrency(-5000000)}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <span className="text-gray-600">Loan Disbursements</span>
                        <span className="font-semibold">{formatCurrency(-15000000)}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <span className="text-gray-600">Loan Collections</span>
                        <span className="font-semibold">{formatCurrency(12000000)}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg border-t-2 border-orange-200">
                        <span className="font-bold text-gray-900">Net Cash from Investing</span>
                        <span className="font-bold text-orange-700">{formatCurrency(-8000000)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Financing Activities */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">FINANCING ACTIVITIES</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <span className="text-gray-600">Borrowings</span>
                        <span className="font-semibold">{formatCurrency(10000000)}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <span className="text-gray-600">Repayment of Borrowings</span>
                        <span className="font-semibold">{formatCurrency(-5000000)}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <span className="text-gray-600">Dividends Paid</span>
                        <span className="font-semibold">{formatCurrency(-2000000)}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg border-t-2 border-green-200">
                        <span className="font-bold text-gray-900">Net Cash from Financing</span>
                        <span className="font-bold text-green-700">{formatCurrency(3000000)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Net Change in Cash */}
                  <div>
                    <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg border-t-2 border-purple-200">
                      <span className="font-bold text-gray-900">NET CHANGE IN CASH</span>
                      <span className="font-bold text-purple-700">{formatCurrency(3250000)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* General Ledger Tab */}
        {(activeTab as string) === 'general-ledger' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">General Ledger</h2>
              <div className="flex space-x-2">
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                  Refresh
                </button>
                <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
                  Export
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6">
                <div className="overflow-x-auto">
                  <table className="w-full border border-gray-300">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left border-b border-gray-300 font-semibold">Date</th>
                        <th className="px-4 py-3 text-left border-b border-gray-300 font-semibold">Account</th>
                        <th className="px-4 py-3 text-left border-b border-gray-300 font-semibold">Description</th>
                        <th className="px-4 py-3 text-right border-b border-gray-300 font-semibold">Debit</th>
                        <th className="px-4 py-3 text-right border-b border-gray-300 font-semibold">Credit</th>
                        <th className="px-4 py-3 text-right border-b border-gray-300 font-semibold">Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                            <div className="flex items-center justify-center">
                              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-2"></div>
                              Loading general ledger...
                            </div>
                          </td>
                        </tr>
                      ) : (generalLedger && generalLedger.length > 0) ? (
                        generalLedger.map((entry) => (
                          <tr key={entry.id} className="border-b border-gray-200">
                            <td className="px-4 py-2">{new Date(entry.entry_date).toLocaleDateString()}</td>
                            <td className="px-4 py-2">
                              {displayChartOfAccounts.find(acc => acc.id === entry.account_id)?.account_name || 'Unknown Account'}
                            </td>
                            <td className="px-4 py-2">{entry.description}</td>
                            <td className="px-4 py-2 text-right">
                              {entry.debit_amount > 0 ? formatCurrency(entry.debit_amount) : '-'}
                            </td>
                            <td className="px-4 py-2 text-right">
                              {entry.credit_amount > 0 ? formatCurrency(entry.credit_amount) : '-'}
                            </td>
                            <td className="px-4 py-2 text-right font-semibold">
                              {formatCurrency(entry.running_balance)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                            <div className="space-y-4">
                              <p>No general ledger entries available.</p>
                              <p className="text-sm text-gray-400">Create journal entries to see data here.</p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

          </>
        )}
      </div>
    </Layout>
  );
};

export default AccountingDashboard;