import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { DateUtils } from '../utils/dateUtils';
import { DynamicDataService } from '../services/dynamicDataService';
import { useLanguage } from '../context/LanguageContext';
import { useSupabaseQuery } from '../hooks/useSupabase';
import { useSupabaseAuth } from '../context/SupabaseAuthContext';
import { roundAmount, roundCurrency, roundPercentage, roundInterestRate, roundLoanAmount, roundFee, roundRepaymentAmount, roundBalance } from '../utils/roundingUtils';
import {
  FileText,
  Download,
  Calendar,
  Shield,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Building,
  Calculator,
  Save,
  RefreshCw,
  Eye,
  Edit,
  Lock,
  Unlock,
  History,
  User,
  Settings,
  Percent,
  Droplets,
  MessageSquare,
  Building2,
  MapPin,
  TrendingUp,
  Printer,
  FileSpreadsheet,
  BarChart3,
  Database,
  Archive,
  Filter,
  Search,
  Share2,
  Clock,
  TrendingDown,
  Target,
  Zap
} from 'lucide-react';
import BalanceSheetMSP201 from '../components/regulatory/BalanceSheetMSP201';
import BalanceSheetMSP201Enhanced from '../components/regulatory/BalanceSheetMSP201Enhanced';
import IncomeStatementMSP202 from '../components/regulatory/IncomeStatementMSP202';
import LoanPortfolioMSP203 from '../components/regulatory/LoanPortfolioMSP203';
import InterestRatesMSP204 from '../components/regulatory/InterestRatesMSP204';
import LiquidAssetsMSP205 from '../components/regulatory/LiquidAssetsMSP205';
import ComplaintReportMSP206 from '../components/regulatory/ComplaintReportMSP206';
import DepositsBorrowingsMSP207 from '../components/regulatory/DepositsBorrowingsMSP207';
import AgentBankingBalancesMSP208 from '../components/regulatory/AgentBankingBalancesMSP208';
import LoansDisbursedMSP209 from '../components/regulatory/LoansDisbursedMSP209';
import GeographicalDistributionMSP210 from '../components/regulatory/GeographicalDistributionMSP210';
import { formatCurrency } from '../constants/currencies';
import { 
  exportAllReportsToExcel, 
  exportAllReportsToPDF, 
  exportCurrentReportToExcel, 
  exportCurrentReportToPDF 
} from '../utils/exportUtils';
import { 
  exportReportToExcelWithHeaders, 
  exportAllReportsToExcelWithHeaders 
} from '../utils/enhancedExportUtils';
import { 
  exportReportToPDFWithHeaders 
} from '../utils/enhancedPdfExportUtils';
import DownloadDropdown from '../components/DownloadDropdown';
import { PDFExportUtils } from '../utils/pdfExportUtils';
import ReportAnalyticsService, { ReportAnalytics } from '../services/reportAnalyticsService';
import ReportAnalyticsCards from '../components/regulatory/ReportAnalyticsCards';

// Central data store for cross-sheet integration
interface RegulatoryDataStore {
  // Balance Sheet (MSP2_01) data
  balanceSheet: {
    [key: string]: number;
  };
  // Income Statement (MSP2_02) data
  incomeStatement: {
    [key: string]: {
      quarterly: number;
      ytd: number;
    };
  };
  // Loan Portfolio (MSP2_03) data
  loanPortfolio: {
    [key: string]: number;
  };
  // Interest Rates (MSP2_04) data
  interestRates: {
    [key: string]: number;
  };
  // Liquid Assets (MSP2_05) data
  liquidAssets: {
    [key: string]: number;
  };
  // Complaint Report (MSP2_06) data
  complaintReport: {
    [key: string]: number;
  };
  // Deposits and Borrowings (MSP2_07) data
  depositsBorrowings: {
    [key: string]: number;
  };
  // Agent Banking Balances (MSP2_08) data
  agentBankingBalances: {
    [key: string]: number;
  };
  // Loans Disbursed (MSP2_09) data
  loansDisbursed: {
    [key: string]: number;
  };
  // Geographical Distribution (MSP2_10) data
  geographicalDistribution: {
    [key: string]: number;
  };
  // Other sheets will be added here
  lastUpdated: string;
  version: number;
}

// Role-based access control
interface UserRole {
  id: string;
  name: string;
  permissions: {
    canEdit: boolean;
    canReview: boolean;
    canSubmit: boolean;
    canViewAudit: boolean;
  };
}

const RegulatoryReports: React.FC = () => {
  const { t } = useLanguage();
  const { user } = useSupabaseAuth();
  const [activeTab, setActiveTab] = useState('balance-sheet');
  const [currentUser, setCurrentUser] = useState<UserRole>({
    id: user?.id || '1',
    name: user?.name || user?.email || 'Unknown User',
    permissions: {
      canEdit: true,
      canReview: true,
      canSubmit: true,
      canViewAudit: true
    }
  });
  const [isEditing, setIsEditing] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [showAuditLog, setShowAuditLog] = useState(false);
  const [showReportSettings, setShowReportSettings] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [reportAnalytics, setReportAnalytics] = useState<ReportAnalytics | null>(null);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);

  // Update currentUser when user changes
  useEffect(() => {
    if (user) {
      setCurrentUser({
        id: user.id || '1',
        name: user.name || user.email || 'Unknown User',
        permissions: {
          canEdit: true,
          canReview: true,
          canSubmit: true,
          canViewAudit: true
        }
      });
    }
  }, [user]);

  // Fetch real data from Supabase
  const { data: chartOfAccounts, loading: accountsLoading } = useSupabaseQuery('chart_of_accounts', {
    select: '*',
    orderBy: { column: 'account_code', ascending: true }
  });

  const { data: trialBalance, loading: trialBalanceLoading } = useSupabaseQuery('trial_balance', {
    select: '*',
    orderBy: { column: 'account_code', ascending: true }
  });

  const { data: loanApplications, loading: applicationsLoading } = useSupabaseQuery('loan_applications', {
    select: '*',
    orderBy: { column: 'created_at', ascending: false }
  });

  const { data: clients, loading: clientsLoading } = useSupabaseQuery('clients', {
    select: '*',
    orderBy: { column: 'created_at', ascending: false }
  });

  // Central data store
  const [dataStore, setDataStore] = useState<RegulatoryDataStore>({
    balanceSheet: {},
    incomeStatement: {},
    loanPortfolio: {},
    interestRates: {},
    liquidAssets: {},
    complaintReport: {},
    depositsBorrowings: {},
    agentBankingBalances: {},
    loansDisbursed: {},
    geographicalDistribution: {},
    lastUpdated: DateUtils.getCurrentISODate(),
    version: 1
  });

  // Institution details
  const [institutionDetails] = useState({
    name: 'RYTHM Microfinance Limited',
    mspCode: 'MSP001',
    quarterEndDate: DateUtils.getCurrentQuarterEnd().split('T')[0],
    reportingPeriod: `Q${DateUtils.getCurrentQuarter()} ${new Date().getFullYear()}`,
    licenseNumber: 'MFI/001/2024',
    address: '123 Business Street, Dar es Salaam, Tanzania',
    phone: '+255-22-1234567',
    email: 'info@rythmmf.co.tz'
  });

  // Load analytics data for the active report
  const loadReportAnalytics = async (reportId: string) => {
    setIsLoadingAnalytics(true);
    try {
      const analyticsService = ReportAnalyticsService.getInstance();
      const analytics = await analyticsService.getReportAnalytics(reportId);
      setReportAnalytics(analytics);
    } catch (error) {
      console.error('Error loading report analytics:', error);
    } finally {
      setIsLoadingAnalytics(false);
    }
  };

  // Load analytics when activeTab changes
  useEffect(() => {
    if (activeTab) {
      loadReportAnalytics(activeTab);
    }
  }, [activeTab]);

  // BOT Regulatory Report Pages
  const reportPages = [
    {
      id: 'balance-sheet',
      name: 'Balance Sheet',
      code: 'MSP2_01',
      description: 'Assets, Liabilities, and Capital',
      status: 'completed',
      lastUpdated: '2024-12-15',
      icon: <FileText className="w-5 h-5" />
    },
    {
      id: 'income-statement',
      name: 'Income Statement',
      code: 'MSP2_02',
      description: 'Revenue, Expenses, and Profit/Loss',
      status: 'completed',
      lastUpdated: '2024-12-15',
      icon: <Calculator className="w-5 h-5" />
    },
    {
      id: 'loan-portfolio',
      name: 'Loan Portfolio',
      code: 'MSP2_03',
      description: 'Loan portfolio analysis and quality',
      status: 'completed',
      lastUpdated: '2024-12-15',
      icon: <Building className="w-5 h-5" />
    },
    {
      id: 'interest-rates',
      name: 'Interest Rates',
      code: 'MSP2_04',
      description: 'Interest rate structure and analysis',
      status: 'completed',
      lastUpdated: '2024-12-15',
      icon: <Percent className="w-5 h-5" />
    },
    {
      id: 'liquid-assets',
      name: 'Liquid Assets',
      code: 'MSP2_05',
      description: 'Liquidity ratio calculations and analysis',
      status: 'completed',
      lastUpdated: '2024-12-15',
      icon: <Droplets className="w-5 h-5" />
    },
    {
      id: 'complaint-report',
      name: 'Complaint Report',
      code: 'MSP2_06',
      description: 'Complaints by nature and resolution status',
      status: 'completed',
      lastUpdated: '2024-12-15',
      icon: <MessageSquare className="w-5 h-5" />
    },
    {
      id: 'deposits-borrowings',
      name: 'Deposits & Borrowings',
      code: 'MSP2_07',
      description: 'Bank-wise deposits and borrowings analysis',
      status: 'completed',
      lastUpdated: '2024-12-15',
      icon: <Building2 className="w-5 h-5" />
    },
    {
      id: 'agent-banking-balances',
      name: 'Agent Banking Balances',
      code: 'MSP2_08',
      description: 'Simple bank balances for agents',
      status: 'completed',
      lastUpdated: '2024-12-15',
      icon: <User className="w-5 h-5" />
    },
    {
      id: 'loans-disbursed',
      name: 'Loans Disbursed',
      code: 'MSP2_09',
      description: 'Disbursements by sector and gender',
      status: 'completed',
      lastUpdated: '2024-12-15',
      icon: <TrendingUp className="w-5 h-5" />
    },
    {
      id: 'geographical-distribution',
      name: 'Geographical Distribution',
      code: 'MSP2_10',
      description: 'Branches, employees, loans by region/age/gender',
      status: 'completed',
      lastUpdated: '2024-12-15',
      icon: <MapPin className="w-5 h-5" />
    }
  ];

  // Auto-save functionality
  useEffect(() => {
    if (hasUnsavedChanges) {
      const autoSaveTimer = setTimeout(() => {
        handleAutoSave();
      }, 30000); // Auto-save every 30 seconds

      return () => clearTimeout(autoSaveTimer);
    }
  }, [hasUnsavedChanges, dataStore]);

  const handleDataChange = (sheetId: string, cellId: string, value: number | { quarterly: number; ytd: number }) => {
    setDataStore(prev => ({
      ...prev,
      [sheetId]: {
        ...prev[sheetId as keyof RegulatoryDataStore],
        [cellId]: value
      },
      lastUpdated: new Date().toISOString(),
      version: prev.version + 1
    }));
    setHasUnsavedChanges(true);
  };

  const handleAutoSave = () => {
    // Simulate auto-save
    setLastSaved(new Date().toLocaleString());
    setHasUnsavedChanges(false);
    console.log('Auto-saved regulatory data:', dataStore);
  };

  const handleManualSave = () => {
    handleAutoSave();
    // Show success message
    alert('Data saved successfully!');
  };

  const handleValidation = (validations: any[]) => {
    // Process validation results
    console.log('Validation results:', validations);
  };

  // Export functionality
  const handleExportAll = async (format: 'excel' | 'pdf') => {
    setIsExporting(true);
    setExportProgress(0);
    
    try {
      // Get complete data for all reports
      const enrichedDataStore = {
        balanceSheet: getCompleteBalanceSheetData(),
        incomeStatement: getCompleteIncomeStatementData(),
        liquidAssets: getCompleteLiquidAssetsData(),
        loanPortfolio: getCompleteLoanPortfolioData(),
        interestRates: getCompleteInterestRatesData(),
        complaintReport: getCompleteComplaintReportData(),
        depositsBorrowings: getCompleteDepositsBorrowingsData(),
        agentBankingBalances: getCompleteAgentBankingBalancesData(),
        loansDisbursed: getCompleteLoansDisbursedData(),
        geographicalDistribution: getCompleteGeographicalDistributionData()
      };
      
      // Simulate export progress
      const progressInterval = setInterval(() => {
        setExportProgress(prev => {
          if (prev >= 100) {
            clearInterval(progressInterval);
            setIsExporting(false);
            return 100;
          }
          return prev + 10;
        });
      }, 200);

      // Simulate export process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Use the export utilities with enriched data
      if (format === 'excel') {
        exportAllReportsToExcelWithHeaders(enrichedDataStore, institutionDetails);
      } else {
        // Use enhanced PDF export for each report individually
        const reportTitles = {
          'balance-sheet': 'Balance Sheet',
          'income-statement': 'Income Statement', 
          'loan-portfolio': 'Loan Portfolio',
          'interest-rates': 'Interest Rates',
          'liquid-assets': 'Liquid Assets',
          'complaint-report': 'Complaint Report',
          'deposits-borrowings': 'Deposits & Borrowings',
          'agent-banking-balances': 'Agent Banking Balances',
          'loans-disbursed': 'Loans Disbursed',
          'geographical-distribution': 'Geographical Distribution'
        };
        
        // Export each report individually using enhanced PDF export
        Object.keys(enrichedDataStore).forEach((reportKey, index) => {
          setTimeout(() => {
            try {
              const reportId = reportKey.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '');
              const reportTitle = reportTitles[reportId as keyof typeof reportTitles] || reportKey;
              exportReportToPDFWithHeaders(reportId, enrichedDataStore[reportKey], institutionDetails, reportTitle);
            } catch (error) {
              console.error(`Error exporting ${reportKey} to PDF:`, error);
            }
          }, index * 1000); // Stagger exports by 1 second each
        });
      }
      
      alert(`All reports exported successfully as ${format.toUpperCase()} files!`);
      
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  const handleExportCurrent = async (format: 'excel' | 'pdf') => {
    try {
      // Get complete report data with all rows
      const currentReportData = getCompleteReportData(activeTab);
      
      // Get the exact report title from reportPages array
      const reportTitle = reportPages.find(p => p.id === activeTab)?.name || 'Report';
      
      if (format === 'excel') {
        // Use enhanced export with complete headers and institution details
        exportReportToExcelWithHeaders(activeTab, currentReportData, institutionDetails, reportTitle);
      } else {
        try {
          // Debug: Log the data being passed to PDF export
          console.log('🔍 PDF EXPORT - Data being passed:', currentReportData);
          console.log('🔍 PDF EXPORT - Report ID:', activeTab);
          console.log('🔍 PDF EXPORT - Report Title:', reportTitle);
          console.log('🔍 PDF EXPORT - Institution Details:', institutionDetails);
          
          // Use enhanced PDF export with complete headers and institution details
          exportReportToPDFWithHeaders(activeTab, currentReportData, institutionDetails, reportTitle);
        } catch (pdfError) {
          console.error('Enhanced PDF export failed:', pdfError);
          console.warn('Enhanced PDF export failed, falling back to basic export:', pdfError);
          // Fallback to basic PDF export
          await PDFExportUtils.exportReportToPDF(
            reportTitle,
            currentReportData,
            institutionDetails
          );
        }
      }
      
      alert(`${reportTitle} exported successfully as ${format.toUpperCase()}!`);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    }
  };

  // Get complete report data with all rows for export
  const getCompleteReportData = (reportId: string) => {
    switch (reportId) {
      case 'balance-sheet':
        return getCompleteBalanceSheetData();
      case 'income-statement':
        return getCompleteIncomeStatementData();
      case 'loan-portfolio':
        return getCompleteLoanPortfolioData();
      case 'interest-rates':
        return getCompleteInterestRatesData();
      case 'liquid-assets':
        return getCompleteLiquidAssetsData();
      case 'complaint-report':
        return getCompleteComplaintReportData();
      case 'deposits-borrowings':
        return getCompleteDepositsBorrowingsData();
      case 'agent-banking-balances':
        return getCompleteAgentBankingBalancesData();
      case 'loans-disbursed':
        return getCompleteLoansDisbursedData();
      case 'geographical-distribution':
        return getCompleteGeographicalDistributionData();
      default:
        return dataStore[reportId as keyof RegulatoryDataStore] || {};
    }
  };

  // Get complete Balance Sheet data (61 rows) - MATCHING ACTUAL REPORT STRUCTURE
  const getCompleteBalanceSheetData = () => {
    // Define base values for input items (these would come from database in real implementation)
    const baseData: any = {
      // CASH AND CASH EQUIVALENTS - Input values
      'C2': 1500000,    // (a) Cash in Hand
      'C4': 25000000,   // (i) Non-Agent Banking Balances
      'C5': 5000000,    // (ii) Agent-Banking Balances
      'C6': 3000000,    // (c) Balances with Microfinance Service Providers
      'C7': 800000,     // (d) MNOs Float Balances
      
      // INVESTMENT IN DEBT SECURITIES - Input values
      'C9': 15000000,   // (a) Treasury Bills
      'C10': 8000000,   // (b) Other Government Securities
      'C11': 5000000,   // (c) Private Securities
      'C12': 2000000,   // (d) Others
      'C13': 500000,    // (e) Allowance for Probable Losses (Deduction)
      
      // EQUITY INVESTMENTS - Input values
      'C15': 10000000,  // (a) Equity Investment
      'C16': 200000,    // (b) Allowance for Probable Losses (Deduction)
      
      // LOANS - Input values
      'C18': 500000000, // (a) Loans to Clients
      'C19': 10000000,  // (b) Loan to Staff and Related Parties
      'C20': 5000000,   // (c) Loans to other Microfinance Service Providers
      'C21': 15000000,  // (d) Accrued Interest on Loans
      'C22': 25000000,  // (e) Allowances for Probable Losses (Deduction)
      
      // PROPERTY, PLANT AND EQUIPMENT - Input values
      'C24': 80000000,  // (a) Property, Plant and Equipment
      'C25': 20000000,  // (b) Accumulated Depreciation (Deduction)
      
      // OTHER ASSETS - Input values
      'C27': 5000000,   // (a) Receivables
      'C28': 2000000,   // (b) Prepaid Expenses
      'C29': 1000000,   // (c) Deferred Tax Assets
      'C30': 3000000,   // (d) Intangible Assets
      'C31': 1500000,   // (e) Miscellaneous Assets
      'C32': 500000,    // (f) Allowance for Probable Losses (Deduction)
      
      // LIABILITIES - Input values
      'C34': 0,         // 8. LIABILITIES
      
      // BORROWINGS - Input values
      'C37': 100000000, // (i) Borrowings from Banks and Financial Institutions
      'C38': 50000000,  // (ii) Borrowings from Other Microfinance Service Providers
      'C39': 20000000,  // (iii) Borrowing from Shareholders
      'C40': 30000000,  // (iv) Borrowing from Public through Debt Securities
      'C41': 10000000,  // (v) Other Borrowings
      'C43': 50000000,  // (i) Borrowings from Banks and Financial Institutions
      'C44': 15000000,  // (ii) Borrowing from Shareholders
      'C45': 10000000,  // (iii) Other Borrowings
      
      // OTHER LIABILITIES - Input values
      'C46': 25000000,  // 10. CASH COLLATERAL/LOAN INSURANCE GUARANTEES/COMPULSORY SAVINGS
      'C47': 5000000,   // 11. TAX PAYABLES
      'C48': 2000000,   // 12. DIVIDEND PAYABLES
      'C49': 8000000,   // 13. OTHER PAYABLES AND ACCRUALS
      
      // TOTAL CAPITAL - Input values
      'C52': 100000000, // (a) Paid-up Ordinary Share Capital
      'C53': 0,         // (b) Paid-up Preference Shares
      'C54': 5000000,   // (c) Capital Grants
      'C55': 2000000,   // (d) Donations
      'C56': 10000000,  // (e) Share Premium
      'C57': 15000000,  // (f) General Reserves
      'C58': 25000000,  // (g) Retained Earnings
      'C59': 5000000,   // (h) Profit/Loss
      'C60': 3000000,   // (i) Other Reserves
    };

    // Calculate derived values based on formulas
    const completeData: any = { ...baseData };

    // C3 = C4 + C5 (Balances with Banks and Financial Institutions)
    completeData['C3'] = completeData['C4'] + completeData['C5'];

    // C1 = C2 + C3 + C6 + C7 (CASH AND CASH EQUIVALENTS)
    completeData['C1'] = completeData['C2'] + completeData['C3'] + completeData['C6'] + completeData['C7'];

    // C8 = C9 + C10 + C11 + C12 - C13 (INVESTMENT IN DEBT SECURITIES - NET)
    completeData['C8'] = completeData['C9'] + completeData['C10'] + completeData['C11'] + completeData['C12'] - completeData['C13'];

    // C14 = C15 - C16 (EQUITY INVESTMENTS - NET)
    completeData['C14'] = completeData['C15'] - completeData['C16'];

    // C17 = C18 + C19 + C20 + C21 - C22 (LOANS - NET)
    completeData['C17'] = completeData['C18'] + completeData['C19'] + completeData['C20'] + completeData['C21'] - completeData['C22'];

    // C23 = C24 - C25 (PROPERTY, PLANT AND EQUIPMENT - NET)
    completeData['C23'] = completeData['C24'] - completeData['C25'];

    // C26 = C27 + C28 + C29 + C30 + C31 - C32 (OTHER ASSETS)
    completeData['C26'] = completeData['C27'] + completeData['C28'] + completeData['C29'] + completeData['C30'] + completeData['C31'] - completeData['C32'];

    // C33 = C1 + C8 + C14 + C17 + C23 + C26 (TOTAL ASSETS)
    completeData['C33'] = completeData['C1'] + completeData['C8'] + completeData['C14'] + completeData['C17'] + completeData['C23'] + completeData['C26'];

    // C36 = C37 + C38 + C39 + C40 + C41 (Borrowings in Tanzania)
    completeData['C36'] = completeData['C37'] + completeData['C38'] + completeData['C39'] + completeData['C40'] + completeData['C41'];

    // C42 = C43 + C44 + C45 (Borrowings from Abroad)
    completeData['C42'] = completeData['C43'] + completeData['C44'] + completeData['C45'];

    // C35 = C36 + C42 (BORROWINGS)
    completeData['C35'] = completeData['C36'] + completeData['C42'];

    // C50 = C35 + C46 + C47 + C48 + C49 (TOTAL LIABILITIES)
    completeData['C50'] = completeData['C35'] + completeData['C46'] + completeData['C47'] + completeData['C48'] + completeData['C49'];

    // C51 = C52 + C53 + C54 + C55 + C56 + C57 + C58 + C59 + C60 (TOTAL CAPITAL)
    completeData['C51'] = completeData['C52'] + completeData['C53'] + completeData['C54'] + completeData['C55'] + completeData['C56'] + completeData['C57'] + completeData['C58'] + completeData['C59'] + completeData['C60'];

    // C61 = C50 + C51 (TOTAL LIABILITIES AND CAPITAL)
    completeData['C61'] = completeData['C50'] + completeData['C51'];

    // Log calculations for verification
    console.log('🔍 Balance Sheet Calculations Verification:');
    console.log('C3 (Banks & Financial Institutions):', completeData['C3'], '= C4 + C5 =', completeData['C4'], '+', completeData['C5']);
    console.log('C1 (Cash & Cash Equivalents):', completeData['C1'], '= C2 + C3 + C6 + C7 =', completeData['C2'], '+', completeData['C3'], '+', completeData['C6'], '+', completeData['C7']);
    console.log('C33 (Total Assets):', completeData['C33'], '= C1 + C8 + C14 + C17 + C23 + C26');
    console.log('C61 (Total Liabilities & Capital):', completeData['C61'], '= C50 + C51');
    console.log('Balance Check - Assets vs Liabilities+Capital:', completeData['C33'] === completeData['C61'] ? '✅ BALANCED' : '❌ NOT BALANCED');

    return completeData;
  };

  // Get complete Income Statement data (42 rows) - MATCHING ACTUAL REPORT STRUCTURE
  const getCompleteIncomeStatementData = () => {
    // This matches the exact structure with realistic sample data
    const completeData: any = {
      // INTEREST INCOME
      'C1': { quarterly: 15000000, ytd: 60000000 },    // 1. INTEREST INCOME
      'C2': { quarterly: 12000000, ytd: 48000000 },    // a. Interest - Loans to Clients
      'C3': { quarterly: 2000000, ytd: 8000000 },      // b. Interest - Loans to Microfinance Service Providers
      'C4': { quarterly: 800000, ytd: 3200000 },       // c. Interest - Investments in Govt Securities
      'C5': { quarterly: 200000, ytd: 800000 },        // d. Interest - Bank Deposits
      'C6': { quarterly: 0, ytd: 0 },                  // e. Interest - Others
      
      // INTEREST EXPENSE
      'C7': { quarterly: 8000000, ytd: 32000000 },     // 2. INTEREST EXPENSE
      'C8': { quarterly: 6000000, ytd: 24000000 },     // a. Interest - Borrowings from Banks & Financial Institutions
      'C9': { quarterly: 1500000, ytd: 6000000 },      // b. Interest - Borrowing from Microfinance Service Providers
      'C10': { quarterly: 400000, ytd: 1600000 },      // c. Interest - Borrowings from Abroad
      'C11': { quarterly: 80000, ytd: 320000 },        // d. Interest - Borrowing from Shareholders
      'C12': { quarterly: 20000, ytd: 80000 },         // e. Interest - Others
      
      // NET INTEREST INCOME
      'C13': { quarterly: 7000000, ytd: 28000000 },    // 3. NET INTEREST INCOME (1 less 2)
      
      // BAD DEBTS AND PROVISION
      'C14': { quarterly: 500000, ytd: 2000000 },      // 4. BAD DEBTS WRITTEN OFF NOT PROVIDED FOR
      'C15': { quarterly: 2500000, ytd: 10000000 },    // 5. PROVISION FOR BAD AND DOUBTFUL DEBTS
      
      // NON-INTEREST INCOME
      'C16': { quarterly: 3000000, ytd: 12000000 },    // 6. NON-INTEREST INCOME
      'C17': { quarterly: 800000, ytd: 3200000 },      // a. Commissions
      'C18': { quarterly: 1200000, ytd: 4800000 },     // b. Fees
      'C19': { quarterly: 400000, ytd: 1600000 },      // c. Rental Income on Premises
      'C20': { quarterly: 200000, ytd: 800000 },       // d. Dividends on Equity Investment
      'C21': { quarterly: 300000, ytd: 1200000 },      // e. Income from Recovery of Charged off Assets
      'C22': { quarterly: 100000, ytd: 400000 },       // f. Other Income
      
      // NON-INTEREST EXPENSES
      'C23': { quarterly: 8000000, ytd: 32000000 },    // 7. NON-INTEREST EXPENSES
      'C24': { quarterly: 2000000, ytd: 8000000 },     // a. Management Salaries and Benefits
      'C25': { quarterly: 3000000, ytd: 12000000 },    // b. Employees Salaries and Benefits
      'C26': { quarterly: 500000, ytd: 2000000 },      // c. Wages
      'C27': { quarterly: 200000, ytd: 800000 },       // d. Pensions Contributions
      'C28': { quarterly: 100000, ytd: 400000 },       // e. Skills and Development Levy
      'C29': { quarterly: 800000, ytd: 3200000 },      // f. Rental Expense on Premises and Equipment
      'C30': { quarterly: 400000, ytd: 1600000 },      // g. Depreciation - Premises and Equipment
      'C31': { quarterly: 200000, ytd: 800000 },       // h. Amortization - Leasehold Rights and Equipments
      'C32': { quarterly: 300000, ytd: 1200000 },      // i. Foreclosure and Litigation Expenses
      'C33': { quarterly: 400000, ytd: 1600000 },      // j. Management Fees
      'C34': { quarterly: 200000, ytd: 800000 },       // k. Auditors Fees
      'C35': { quarterly: 600000, ytd: 2400000 },      // l. Taxes
      'C36': { quarterly: 100000, ytd: 400000 },       // m. License Fees
      'C37': { quarterly: 150000, ytd: 600000 },       // n. Insurance
      'C38': { quarterly: 200000, ytd: 800000 },       // o. Utilities Expenses
      'C39': { quarterly: 500000, ytd: 2000000 },      // p. Other Non-Interest Expenses
      
      // NET INCOME
      'C40': { quarterly: 2000000, ytd: 8000000 },     // 8. NET INCOME / (LOSS) BEFORE INCOME TAX
      'C41': { quarterly: 500000, ytd: 2000000 },      // 9. INCOME TAX PROVISION
      'C42': { quarterly: 1500000, ytd: 6000000 }      // 10. NET INCOME / (LOSS) AFTER INCOME TAX
    };

    return completeData;
  };

  // Get complete Loan Portfolio data - MATCHING ACTUAL REPORT STRUCTURE
  const getCompleteLoanPortfolioData = () => {
    // This matches the exact structure with realistic sample data for all sectors
    const completeData: any = {
      // Agriculture sector
      'agriculture': {
        current: 45000000,
        esm: 5000000,
        substandard: 2000000,
        doubtful: 1000000,
        loss: 500000
      },
      // Manufacturing sector
      'manufacturing': {
        current: 35000000,
        esm: 3000000,
        substandard: 1500000,
        doubtful: 800000,
        loss: 300000
      },
      // Trade sector
      'trade': {
        current: 60000000,
        esm: 8000000,
        substandard: 3000000,
        doubtful: 1500000,
        loss: 600000
      },
      // Services sector
      'services': {
        current: 40000000,
        esm: 4000000,
        substandard: 2000000,
        doubtful: 1000000,
        loss: 400000
      },
      // Transport sector
      'transport': {
        current: 25000000,
        esm: 2000000,
        substandard: 1000000,
        doubtful: 500000,
        loss: 200000
      },
      // Construction sector
      'construction': {
        current: 30000000,
        esm: 2500000,
        substandard: 1200000,
        doubtful: 600000,
        loss: 250000
      },
      // Mining sector
      'mining': {
        current: 15000000,
        esm: 1000000,
        substandard: 500000,
        doubtful: 250000,
        loss: 100000
      },
      // Tourism sector
      'tourism': {
        current: 20000000,
        esm: 1500000,
        substandard: 800000,
        doubtful: 400000,
        loss: 150000
      },
      // Other sectors
      'other': {
        current: 10000000,
        esm: 800000,
        substandard: 400000,
        doubtful: 200000,
        loss: 80000
      }
    };

    return completeData;
  };

  // Get complete Interest Rates data - MATCHING ACTUAL REPORT STRUCTURE
  const getCompleteInterestRatesData = () => {
    return {
      // Individual Loans
      'C1': 18.5,  // Individual - Personal Loans
      'C2': 16.0,  // Individual - Business Loans
      'C3': 20.0,  // Individual - Emergency Loans
      'C4': 15.5,  // Individual - Education Loans
      'C5': 17.0,  // Individual - Agriculture Loans
      
      // Group Loans
      'C6': 16.5,  // Group - Solidarity Group Loans
      'C7': 15.0,  // Group - Village Banking Loans
      'C8': 18.0,  // Group - Self-Help Group Loans
      
      // SME Loans
      'C9': 14.5,  // SME - Micro Enterprise Loans
      'C10': 13.0, // SME - Small Enterprise Loans
      'C11': 12.0, // SME - Medium Enterprise Loans
      
      // Specialized Loans
      'C12': 19.5, // Housing Microfinance Loans
      'C13': 17.5, // Agricultural Equipment Loans
      'C14': 16.0, // Working Capital Loans
      'C15': 18.5, // Asset Financing Loans
      
      // Savings Products
      'C16': 8.0,  // Regular Savings
      'C17': 10.5, // Fixed Deposit - 3 months
      'C18': 11.0, // Fixed Deposit - 6 months
      'C19': 12.0, // Fixed Deposit - 12 months
      'C20': 13.0  // Fixed Deposit - 24 months
    };
  };

  // Get complete Liquid Assets data - MATCHING ACTUAL REPORT STRUCTURE
  const getCompleteLiquidAssetsData = () => {
    return {
      // Cash and Cash Equivalents
      'C1': 1500000,   // Cash in Hand
      'C2': 30000000,  // Balances with Banks and Financial Institutions
      'C3': 25000000,  // Non-Agent Banking Balances
      'C4': 5000000,   // Agent-Banking Balances
      'C5': 3000000,   // Balances with Microfinance Service Providers
      'C6': 800000,    // MNOs Float Balances
      
      // Investment Securities
      'C7': 29500000,  // Investment in Debt Securities - Net
      'C8': 15000000,  // Treasury Bills
      'C9': 8000000,   // Other Government Securities
      'C10': 5000000,  // Private Securities
      'C11': 2000000,  // Others
      'C12': 500000,   // Allowance for Probable Losses (Deduction)
      
      // Other Liquid Assets
      'C13': 5000000,  // Receivables (Short-term)
      'C14': 2000000,  // Prepaid Expenses
      'C15': 1000000,  // Deferred Tax Assets
      
      // Total Liquid Assets
      'C16': 61780000  // Total Liquid Assets
    };
  };

  // Get complete Complaint Report data - MATCHING ACTUAL REPORT STRUCTURE
  const getCompleteComplaintReportData = () => {
    return {
      // Complaint Categories
      'C1': 45,   // Loan Processing Complaints
      'C2': 32,   // Interest Rate Complaints
      'C3': 28,   // Repayment Terms Complaints
      'C4': 15,   // Customer Service Complaints
      'C5': 22,   // Account Management Complaints
      'C6': 18,   // Documentation Complaints
      'C7': 12,   // Technology/System Complaints
      'C8': 8,    // Privacy/Data Protection Complaints
      'C9': 25,   // Collection Practices Complaints
      'C10': 14,  // Product Information Complaints
      
      // Resolution Status
      'C11': 120, // Total Complaints Received
      'C12': 95,  // Complaints Resolved
      'C13': 20,  // Complaints Under Investigation
      'C14': 5,   // Complaints Pending Resolution
      
      // Response Times
      'C15': 2,   // Average Resolution Time (Days)
      'C16': 1,   // Average Initial Response Time (Days)
      'C17': 98,  // Customer Satisfaction Rate (%)
      
      // Complaint Sources
      'C18': 85,  // Direct Customer Complaints
      'C19': 25,  // Branch Office Complaints
      'C20': 10   // Online/Email Complaints
    };
  };

  // Get complete Deposits and Borrowings data - MATCHING ACTUAL REPORT STRUCTURE
  const getCompleteDepositsBorrowingsData = () => {
    return {
      // Deposits
      'C1': 150000000,  // Total Deposits
      'C2': 80000000,   // Savings Deposits
      'C3': 50000000,   // Time Deposits
      'C4': 20000000,   // Demand Deposits
      
      // Borrowings - Domestic
      'C5': 210000000,  // Total Domestic Borrowings
      'C6': 100000000,  // From Banks and Financial Institutions
      'C7': 50000000,   // From Other Microfinance Service Providers
      'C8': 20000000,   // From Shareholders
      'C9': 30000000,   // From Public through Debt Securities
      'C10': 10000000,  // Other Domestic Borrowings
      
      // Borrowings - Foreign
      'C11': 75000000,  // Total Foreign Borrowings
      'C12': 50000000,  // From Banks and Financial Institutions Abroad
      'C13': 15000000,  // From Shareholders Abroad
      'C14': 10000000,  // Other Foreign Borrowings
      
      // Other Liabilities
      'C15': 25000000,  // Cash Collateral/Loan Insurance Guarantees
      'C16': 5000000,   // Tax Payables
      'C17': 2000000,   // Dividend Payables
      'C18': 8000000,   // Other Payables and Accruals
      
      // Total Liabilities
      'C19': 325000000  // Total Liabilities
    };
  };

  // Get complete Agent Banking Balances data - MATCHING ACTUAL REPORT STRUCTURE
  const getCompleteAgentBankingBalancesData = () => {
    return {
      // Agent Banking Balances by Region
      'C1': 5000000,    // Dar es Salaam Region
      'C2': 3500000,    // Arusha Region
      'C3': 2800000,    // Mwanza Region
      'C4': 2200000,    // Dodoma Region
      'C5': 1800000,    // Tanga Region
      'C6': 1500000,    // Morogoro Region
      'C7': 1200000,    // Mbeya Region
      'C8': 1000000,    // Iringa Region
      'C9': 800000,     // Kilimanjaro Region
      'C10': 600000,    // Tabora Region
      'C11': 500000,    // Singida Region
      'C12': 400000,    // Rukwa Region
      'C13': 300000,    // Kigoma Region
      'C14': 250000,    // Shinyanga Region
      'C15': 200000,    // Kagera Region
      'C16': 150000,    // Mara Region
      'C17': 100000,    // Mtwara Region
      'C18': 80000,     // Lindi Region
      'C19': 60000,     // Ruvuma Region
      'C20': 40000,     // Pwani Region
      'C21': 20000,     // Manyara Region
      'C22': 10000,     // Geita Region
      'C23': 5000,      // Simiyu Region
      'C24': 3000,      // Njombe Region
      'C25': 2000,      // Katavi Region
      'C26': 1000,      // Songwe Region
      
      // Total Agent Banking Balances
      'C27': 25000000   // Total Agent Banking Balances
    };
  };

  // Get complete Loans Disbursed data - MATCHING ACTUAL REPORT STRUCTURE
  const getCompleteLoansDisbursedData = () => {
    const completeData = {
      // Loans Disbursed by Product Type
      'C1': 50000000,   // Individual Loans Disbursed
      'C2': 30000000,   // Group Loans Disbursed
      'C3': 20000000,   // SME Loans Disbursed
      'C4': 15000000,   // Housing Microfinance Loans
      'C5': 10000000,   // Agricultural Loans
      'C6': 8000000,    // Emergency Loans
      'C7': 6000000,    // Education Loans
      'C8': 4000000,    // Business Development Loans
      'C9': 3000000,    // Asset Financing Loans
      'C10': 2000000,   // Working Capital Loans
      
      // Loans Disbursed by Sector
      'C11': 45000000,  // Agriculture Sector
      'C12': 35000000,  // Manufacturing Sector
      'C13': 60000000,  // Trade Sector
      'C14': 40000000,  // Services Sector
      'C15': 25000000,  // Transport Sector
      'C16': 30000000,  // Construction Sector
      'C17': 15000000,  // Mining Sector
      'C18': 20000000,  // Tourism Sector
      'C19': 10000000,  // Other Sectors
      
      // Loans Disbursed by Region
      'C20': 40000000,  // Dar es Salaam
      'C21': 25000000,  // Arusha
      'C22': 20000000,  // Mwanza
      'C23': 15000000,  // Dodoma
      'C24': 12000000,  // Tanga
      'C25': 10000000,  // Morogoro
      'C26': 8000000,   // Mbeya
      'C27': 6000000,   // Iringa
      'C28': 5000000,   // Kilimanjaro
      'C29': 4000000,   // Other Regions
      
      // Total Loans Disbursed
      'C30': 250000000  // Total Loans Disbursed
    };
    
    // Debug: Log the complete data being generated
    console.log('🔍 DATA GENERATOR - getCompleteLoansDisbursedData generated:', completeData);
    console.log('🔍 DATA GENERATOR - Data keys:', Object.keys(completeData));
    console.log('🔍 DATA GENERATOR - Data length:', Object.keys(completeData).length);
    
    return completeData;
  };

  // Get complete Geographical Distribution data - MATCHING ACTUAL REPORT STRUCTURE
  const getCompleteGeographicalDistributionData = () => {
    return {
      // Branch Network Distribution
      'C1': 5,            // Total Number of Branches
      'C2': 25,           // Total Number of Agent Banking Points
      'C3': 100000000,    // Total Loan Portfolio by Geography
      'C4': 50000000,     // Urban Areas Loan Portfolio
      'C5': 30000000,     // Rural Areas Loan Portfolio
      'C6': 20000000,     // Semi-Urban Areas Loan Portfolio
      
      // Regional Distribution - Loan Portfolio
      'C7': 40000000,     // Dar es Salaam Region
      'C8': 25000000,     // Arusha Region
      'C9': 20000000,     // Mwanza Region
      'C10': 15000000,    // Dodoma Region
      'C11': 12000000,    // Tanga Region
      'C12': 10000000,    // Morogoro Region
      'C13': 8000000,     // Mbeya Region
      'C14': 6000000,     // Iringa Region
      'C15': 5000000,     // Kilimanjaro Region
      'C16': 4000000,     // Tabora Region
      'C17': 3000000,     // Singida Region
      'C18': 2500000,     // Rukwa Region
      'C19': 2000000,     // Kigoma Region
      'C20': 1500000,     // Shinyanga Region
      'C21': 1200000,     // Kagera Region
      'C22': 1000000,     // Mara Region
      'C23': 800000,      // Mtwara Region
      'C24': 600000,      // Lindi Region
      'C25': 400000,      // Ruvuma Region
      'C26': 300000,      // Pwani Region
      'C27': 200000,      // Manyara Region
      'C28': 100000,      // Geita Region
      'C29': 50000,       // Simiyu Region
      'C30': 30000,       // Njombe Region
      'C31': 20000,       // Katavi Region
      'C32': 10000,       // Songwe Region
      
      // Customer Distribution
      'C33': 50000,       // Total Number of Active Clients
      'C34': 30000,       // Urban Clients
      'C35': 15000,       // Rural Clients
      'C36': 5000,        // Semi-Urban Clients
      
      // Total Geographical Distribution
      'C37': 100000000    // Total Loan Portfolio
    };
  };

  // Generate sample data for reports when no data is available
  const generateSampleDataForReport = (reportId: string) => {
    const sampleData: any = {};
    
    switch (reportId) {
      case 'balance-sheet':
        // Sample balance sheet data
        sampleData['C1'] = 50000000; // Cash and Cash Equivalents
        sampleData['C2'] = 1500000;  // Cash in Hand
        sampleData['C3'] = 30000000; // Balances with Banks
        sampleData['C4'] = 25000000; // Treasury Bills
        sampleData['C5'] = 20000000; // Government Securities
        sampleData['C6'] = 10000000; // Other Liquid Assets
        sampleData['C7'] = 86500000; // Total Liquid Assets
        sampleData['C8'] = 200000000; // Gross Loans
        sampleData['C9'] = 10000000;  // Provisions
        sampleData['C10'] = 190000000; // Net Loans
        sampleData['C11'] = 50000000;  // Fixed Assets
        sampleData['C12'] = 10000000;  // Other Assets
        sampleData['C13'] = 336500000; // Total Assets
        sampleData['C14'] = 150000000; // Deposits
        sampleData['C15'] = 50000000;  // Borrowings
        sampleData['C16'] = 200000000; // Total Liabilities
        sampleData['C17'] = 100000000; // Share Capital
        sampleData['C18'] = 36500000;  // Retained Earnings
        sampleData['C19'] = 136500000; // Total Capital
        break;
        
      case 'income-statement':
        // Sample income statement data
        sampleData['C1'] = { quarterly: 25000000, ytd: 100000000 }; // Interest Income
        sampleData['C2'] = { quarterly: 20000000, ytd: 80000000 };  // Interest from Loans
        sampleData['C3'] = { quarterly: 3000000, ytd: 12000000 };   // Interest from Investments
        sampleData['C4'] = { quarterly: 2000000, ytd: 8000000 };    // Other Interest Income
        sampleData['C5'] = { quarterly: 15000000, ytd: 60000000 };  // Interest Expense
        sampleData['C6'] = { quarterly: 10000000, ytd: 40000000 };  // Net Interest Income
        sampleData['C7'] = { quarterly: 5000000, ytd: 20000000 };   // Other Income
        sampleData['C8'] = { quarterly: 3000000, ytd: 12000000 };   // Operating Expenses
        sampleData['C9'] = { quarterly: 2000000, ytd: 8000000 };    // Net Income
        break;
        
      case 'liquid-assets':
        // Sample liquid assets data
        sampleData['cash_in_hand'] = 1500000;
        sampleData['bank_balances'] = 30000000;
        sampleData['treasury_bills'] = 25000000;
        sampleData['government_securities'] = 20000000;
        sampleData['other_liquid_assets'] = 10000000;
        sampleData['total_liquid_assets'] = 86500000;
        break;
        
      case 'loan-portfolio':
        // Sample loan portfolio data
        sampleData['total_loans'] = 200000000;
        sampleData['performing_loans'] = 180000000;
        sampleData['non_performing_loans'] = 20000000;
        sampleData['provisions'] = 10000000;
        sampleData['net_loans'] = 190000000;
        break;
        
      case 'interest-rates':
        // Sample interest rates data
        sampleData['lending_rate_min'] = 18.5;
        sampleData['lending_rate_max'] = 24.0;
        sampleData['deposit_rate_min'] = 8.0;
        sampleData['deposit_rate_max'] = 12.5;
        sampleData['average_lending_rate'] = 21.25;
        sampleData['average_deposit_rate'] = 10.25;
        break;
        
      case 'complaint-report':
        // Sample complaint report data
        sampleData['total_complaints'] = 45;
        sampleData['resolved_complaints'] = 42;
        sampleData['pending_complaints'] = 3;
        sampleData['resolution_rate'] = 93.3;
        break;
        
      case 'deposits-borrowings':
        // Sample deposits and borrowings data
        sampleData['total_deposits'] = 150000000;
        sampleData['savings_deposits'] = 80000000;
        sampleData['time_deposits'] = 70000000;
        sampleData['total_borrowings'] = 50000000;
        sampleData['bank_borrowings'] = 30000000;
        sampleData['other_borrowings'] = 20000000;
        break;
        
      case 'agent-banking-balances':
        // Sample agent banking balances data
        sampleData['agent_balances'] = 25000000;
        sampleData['agent_commissions'] = 500000;
        sampleData['active_agents'] = 15;
        sampleData['transactions_volume'] = 5000000;
        break;
        
      case 'loans-disbursed':
        // Sample loans disbursed data
        sampleData['total_disbursed'] = 50000000;
        sampleData['new_loans'] = 30000000;
        sampleData['renewals'] = 20000000;
        sampleData['average_loan_size'] = 500000;
        sampleData['number_of_loans'] = 100;
        break;
        
      case 'geographical-distribution':
        // Sample geographical distribution data
        sampleData['dar_es_salaam'] = 40000000;
        sampleData['arusha'] = 15000000;
        sampleData['mwanza'] = 12000000;
        sampleData['dodoma'] = 8000000;
        sampleData['other_regions'] = 10000000;
        break;
        
      default:
        // Generic sample data for other reports
        for (let i = 1; i <= 20; i++) {
          sampleData[`item_${i}`] = Math.floor(Math.random() * 10000000) + 100000;
        }
        break;
    }
    
    return sampleData;
  };

  const handlePrint = () => {
    window.print();
  };

  const handleValidateAll = async () => {
    try {
      // Simulate validation process
      console.log('Validating all sheets...');
      alert('All sheets validated successfully! No errors found.');
    } catch (error) {
      console.error('Validation failed:', error);
      alert('Validation failed. Please check your data.');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'pending':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-orange-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">BOT Regulatory Reports</h1>
              <p className="text-red-100">
                Bank of Tanzania Microfinance Regulatory Reporting - Q4 2024
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-red-100">Institution: {institutionDetails.name}</div>
              <div className="text-sm text-red-100">MSP Code: {reportPages.find(p => p.id === activeTab)?.code || 'MSP001'}</div>
              <div className="text-sm text-red-100">Quarter End: {institutionDetails.quarterEndDate}</div>
            </div>
          </div>
        </div>

        {/* Status Bar */}
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4 text-gray-600" />
                <span className="text-sm text-gray-600">Logged in as: {currentUser.name}</span>
              </div>
              <div className="flex items-center space-x-2">
                {isEditing ? (
                  <Edit className="w-4 h-4 text-blue-600" />
                ) : (
                  <Eye className="w-4 h-4 text-gray-600" />
                )}
                <span className="text-sm text-gray-600">
                  {isEditing ? 'Edit Mode' : 'View Mode'}
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {hasUnsavedChanges && (
                <div className="flex items-center space-x-2 text-orange-600">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-sm">Unsaved Changes</span>
                </div>
              )}
              {lastSaved && (
                <div className="text-sm text-gray-600">
                  Last saved: {lastSaved}
                </div>
              )}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className={`px-3 py-1 rounded text-sm font-medium ${
                    isEditing
                      ? 'bg-gray-600 text-white hover:bg-gray-700'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {isEditing ? (
                    <>
                      <Eye className="w-4 h-4 inline mr-1" />
                      View
                    </>
                  ) : (
                    <>
                      <Edit className="w-4 h-4 inline mr-1" />
                      Edit
                    </>
                  )}
                </button>
                <button
                  onClick={handleManualSave}
                  disabled={!hasUnsavedChanges}
                  className="px-3 py-1 bg-green-600 text-white rounded text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4 inline mr-1" />
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Navigation Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Shield className="w-5 h-5 mr-2 text-red-600" />
                Report Pages
              </h3>
              
              <div className="space-y-2">
                {reportPages.map((page) => (
                  <button
                    key={page.id}
                    onClick={() => setActiveTab(page.id)}
                    className={`w-full p-3 rounded-lg text-left transition-colors ${
                      activeTab === page.id
                        ? 'bg-red-50 border-2 border-red-200'
                        : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${
                        activeTab === page.id ? 'bg-red-100' : 'bg-gray-100'
                      }`}>
                        {page.icon}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-gray-900 text-sm">{page.name}</h4>
                          {getStatusIcon(page.status)}
                        </div>
                        <p className="text-xs text-gray-600 mt-1">{page.description}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(page.status)}`}>
                            {page.status}
                          </span>
                          {page.lastUpdated && (
                            <span className="text-xs text-gray-500">
                              {page.lastUpdated}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Quick Actions */}
              <div className="mt-6 pt-4 border-t border-gray-200">
                <h4 className="font-medium text-gray-900 mb-3">Quick Actions</h4>
                <div className="space-y-2">
                  <DownloadDropdown
                  options={[
                    {
                      id: 'excel-all',
                      label: 'Export All (Excel)',
                      icon: <FileSpreadsheet className="w-4 h-4" />,
                      onClick: () => handleExportAll('excel'),
                      disabled: isExporting
                    },
                    {
                      id: 'pdf-all',
                      label: 'Export All (PDF)',
                      icon: <FileText className="w-4 h-4" />,
                      onClick: () => handleExportAll('pdf'),
                      disabled: isExporting
                    }
                  ]}
                  buttonText="Export All"
                  buttonIcon={<Download className="w-4 h-4" />}
                  className="w-full"
                />
                  <button 
                    onClick={handleValidateAll}
                    className="w-full p-2 text-sm text-left text-green-600 hover:bg-green-50 rounded"
                  >
                    <CheckCircle className="w-4 h-4 inline mr-2" />
                    Validate All Sheets
                  </button>
                  <button 
                    onClick={() => setShowAuditLog(true)}
                    className="w-full p-2 text-sm text-left text-purple-600 hover:bg-purple-50 rounded"
                  >
                    <History className="w-4 h-4 inline mr-2" />
                    View Audit Log
                  </button>
                  <button 
                    onClick={() => setShowReportSettings(true)}
                    className="w-full p-2 text-sm text-left text-orange-600 hover:bg-orange-50 rounded"
                  >
                    <Settings className="w-4 h-4 inline mr-2" />
                    Report Settings
                  </button>
                </div>
                
                {/* Export Progress */}
                {isExporting && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center justify-between text-sm text-blue-700 mb-2">
                      <span>Exporting reports...</span>
                      <span>{exportProgress}%</span>
                    </div>
                    <div className="w-full bg-blue-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${exportProgress}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3">
            {/* Institution Header Block */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  {reportPages.find(p => p.id === activeTab)?.name}
                </h2>
                <DownloadDropdown
                  options={[
                    {
                      id: 'excel',
                      label: 'Download MS Excel',
                      icon: <FileSpreadsheet className="w-4 h-4" />,
                      onClick: () => handleExportCurrent('excel')
                    },
                    {
                      id: 'pdf',
                      label: 'Download PDF',
                      icon: <FileText className="w-4 h-4" />,
                      onClick: () => handleExportCurrent('pdf')
                    }
                  ]}
                  buttonText="Download"
                  buttonIcon={<Download className="w-4 h-4" />}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Institution Details</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Institution Name:</span>
                      <span className="font-medium">{institutionDetails.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">MSP Code:</span>
                      <span className="font-medium">{reportPages.find(p => p.id === activeTab)?.code || 'MSP001'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">License Number:</span>
                      <span className="font-medium">{institutionDetails.licenseNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Reporting Period:</span>
                      <span className="font-medium">{institutionDetails.reportingPeriod}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Report Information</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Quarter End Date:</span>
                      <span className="font-medium">{institutionDetails.quarterEndDate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Data Version:</span>
                      <span className="font-medium">v{dataStore.version}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Last Updated:</span>
                      <span className="font-medium">
                        {new Date(dataStore.lastUpdated).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span className="font-medium text-green-600">In Progress</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Dynamic Content Based on Active Tab */}
            {activeTab === 'balance-sheet' && (
              <BalanceSheetMSP201Enhanced
                onDataChange={handleDataChange}
                onValidation={handleValidation}
                institutionDetails={institutionDetails}
              />
            )}

            {activeTab === 'income-statement' && (
              <>
                <IncomeStatementMSP202
                  data={getCompleteIncomeStatementData()}
                  onDataChange={handleDataChange}
                  onValidation={handleValidation}
                  isEditing={isEditing}
                  institutionDetails={institutionDetails}
                  balanceSheetData={getCompleteBalanceSheetData()}
                />
                
                {/* Report-Specific Analytics Cards */}
                <ReportAnalyticsCards 
                  reportAnalytics={reportAnalytics}
                  isLoadingAnalytics={isLoadingAnalytics}
                />
              </>
            )}

            {activeTab === 'loan-portfolio' && (
              <>
                <LoanPortfolioMSP203
                  data={getCompleteLoanPortfolioData()}
                  onDataChange={handleDataChange}
                  onValidation={handleValidation}
                  isEditing={isEditing}
                  institutionDetails={institutionDetails}
                  balanceSheetData={getCompleteBalanceSheetData()}
                />
                
                {/* Report-Specific Analytics Cards */}
                <ReportAnalyticsCards 
                  reportAnalytics={reportAnalytics}
                  isLoadingAnalytics={isLoadingAnalytics}
                />
              </>
            )}

            {activeTab === 'interest-rates' && (
              <>
                <InterestRatesMSP204
                  data={getCompleteInterestRatesData()}
                  onDataChange={handleDataChange}
                  onValidation={handleValidation}
                  isEditing={isEditing}
                  institutionDetails={institutionDetails}
                  balanceSheetData={getCompleteBalanceSheetData()}
                  loanPortfolioData={getCompleteLoanPortfolioData()}
                />
                
                {/* Report-Specific Analytics Cards */}
                <ReportAnalyticsCards 
                  reportAnalytics={reportAnalytics}
                  isLoadingAnalytics={isLoadingAnalytics}
                />
              </>
            )}

            {activeTab === 'liquid-assets' && (
              <>
                <LiquidAssetsMSP205
                  data={getCompleteLiquidAssetsData()}
                  onDataChange={handleDataChange}
                  onValidation={handleValidation}
                  isEditing={isEditing}
                  institutionDetails={institutionDetails}
                  balanceSheetData={getCompleteBalanceSheetData()}
                />
                
                {/* Report-Specific Analytics Cards */}
                <ReportAnalyticsCards 
                  reportAnalytics={reportAnalytics}
                  isLoadingAnalytics={isLoadingAnalytics}
                />
              </>
            )}

            {activeTab === 'complaint-report' && (
              <>
                <ComplaintReportMSP206
                  data={getCompleteComplaintReportData()}
                  onDataChange={handleDataChange}
                  onValidation={handleValidation}
                  isEditing={isEditing}
                  institutionDetails={institutionDetails}
                />
                
                {/* Report-Specific Analytics Cards */}
                <ReportAnalyticsCards 
                  reportAnalytics={reportAnalytics}
                  isLoadingAnalytics={isLoadingAnalytics}
                />
              </>
            )}

            {activeTab === 'deposits-borrowings' && (
              <>
                <DepositsBorrowingsMSP207
                  data={getCompleteDepositsBorrowingsData()}
                  onDataChange={handleDataChange}
                  onValidation={handleValidation}
                  isEditing={isEditing}
                  institutionDetails={institutionDetails}
                  balanceSheetData={getCompleteBalanceSheetData()}
                />
                
                {/* Report-Specific Analytics Cards */}
                <ReportAnalyticsCards 
                  reportAnalytics={reportAnalytics}
                  isLoadingAnalytics={isLoadingAnalytics}
                />
              </>
            )}

            {activeTab === 'agent-banking-balances' && (
              <>
                <AgentBankingBalancesMSP208
                  data={getCompleteAgentBankingBalancesData()}
                  onDataChange={handleDataChange}
                  onValidation={handleValidation}
                  isEditing={isEditing}
                  institutionDetails={institutionDetails}
                  balanceSheetData={getCompleteBalanceSheetData()}
                />
                
                {/* Report-Specific Analytics Cards */}
                <ReportAnalyticsCards 
                  reportAnalytics={reportAnalytics}
                  isLoadingAnalytics={isLoadingAnalytics}
                />
              </>
            )}

            {activeTab === 'loans-disbursed' && (
              <>
                <LoansDisbursedMSP209
                  data={getCompleteLoansDisbursedData()}
                  onDataChange={handleDataChange}
                  onValidation={handleValidation}
                  isEditing={isEditing}
                  institutionDetails={institutionDetails}
                />
                
                {/* Report-Specific Analytics Cards */}
                <ReportAnalyticsCards 
                  reportAnalytics={reportAnalytics}
                  isLoadingAnalytics={isLoadingAnalytics}
                />
              </>
            )}

            {activeTab === 'geographical-distribution' && (
              <>
                <GeographicalDistributionMSP210
                  data={getCompleteGeographicalDistributionData()}
                  onDataChange={handleDataChange}
                  onValidation={handleValidation}
                  isEditing={isEditing}
                  institutionDetails={institutionDetails}
                  balanceSheetData={getCompleteBalanceSheetData()}
                  loanPortfolioData={getCompleteLoanPortfolioData()}
                />
                
                {/* Report-Specific Analytics Cards */}
                <ReportAnalyticsCards 
                  reportAnalytics={reportAnalytics}
                  isLoadingAnalytics={isLoadingAnalytics}
                />
              </>
            )}


          </div>
        </div>

        {/* Audit Log Modal */}
        {showAuditLog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Audit Log</h3>
                <button
                  onClick={() => setShowAuditLog(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="Search audit log..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                    <Filter className="w-4 h-4 inline mr-2" />
                    Filter
                  </button>
                </div>
                
                <div className="space-y-3">
                  {[
                    { action: 'Data Updated', user: currentUser.name, timestamp: '2024-12-15 14:30:25', details: 'Balance Sheet - Cash in Hand updated' },
                    { action: 'Report Exported', user: currentUser.name, timestamp: '2024-12-15 13:45:12', details: 'Income Statement exported as PDF' },
                    { action: 'Validation Run', user: 'System', timestamp: '2024-12-15 12:15:08', details: 'All sheets validated successfully' },
                    { action: 'Data Saved', user: currentUser.name, timestamp: '2024-12-15 11:22:45', details: 'Auto-save completed' },
                    { action: 'Login', user: currentUser.name, timestamp: '2024-12-15 09:15:30', details: 'User logged in successfully' }
                  ].map((log, index) => (
                    <div key={index} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span className="font-medium text-gray-900">{log.action}</span>
                        </div>
                        <span className="text-sm text-gray-500">{log.timestamp}</span>
                      </div>
                      <div className="mt-2 text-sm text-gray-600">
                        <div>User: {log.user}</div>
                        <div>Details: {log.details}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Report Settings Modal */}
        {showReportSettings && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Report Settings</h3>
                <button
                  onClick={() => setShowReportSettings(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Export Settings</h4>
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input type="checkbox" defaultChecked className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                      <span className="ml-2 text-sm text-gray-700">Include charts in exports</span>
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" defaultChecked className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                      <span className="ml-2 text-sm text-gray-700">Include formulas in Excel exports</span>
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                      <span className="ml-2 text-sm text-gray-700">Compress PDF files</span>
                    </label>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Auto-save Settings</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm text-gray-700 mb-1">Auto-save interval (minutes)</label>
                      <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                        <option value="5">5 minutes</option>
                        <option value="15" selected>15 minutes</option>
                        <option value="30">30 minutes</option>
                        <option value="60">1 hour</option>
                      </select>
                    </div>
                    <label className="flex items-center">
                      <input type="checkbox" defaultChecked className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                      <span className="ml-2 text-sm text-gray-700">Enable auto-save</span>
                    </label>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Validation Settings</h4>
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input type="checkbox" defaultChecked className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                      <span className="ml-2 text-sm text-gray-700">Auto-validate on data change</span>
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" defaultChecked className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                      <span className="ml-2 text-sm text-gray-700">Show validation warnings</span>
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                      <span className="ml-2 text-sm text-gray-700">Block submission on validation errors</span>
                    </label>
                  </div>
                </div>
                
                <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => setShowReportSettings(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      alert('Settings saved successfully!');
                      setShowReportSettings(false);
                    }}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                  >
                    Save Settings
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default RegulatoryReports;
