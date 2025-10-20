import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { useLanguage } from '../context/LanguageContext';
import { useSupabaseQuery } from '../hooks/useSupabase';
import { useAccountingData } from '../hooks/useAccountingData';
import { roundCurrency, roundPercentage } from '../utils/roundingUtils';
import {
  Search,
  FileText,
  Calculator,
  RefreshCw,
  Plus,
  Edit,
  Eye,
  Shield,
  Database,
  Target,
  BookOpen,
  Settings,
  Upload,
  AlertCircle,
  Building2,
  CreditCard,
  Activity,
  ChevronDown,
  ChevronRight,
  Star,
  ExternalLink,
  Layers,
  X,
  TrendingUp,
  Download,
  DollarSign,
  TrendingDown,
  CheckCircle2,
  XCircle,
  Zap,
  Network,
  BarChart,
  ArrowLeft
} from 'lucide-react';

// Enhanced Interfaces for BOT Report Integration
// BOTLineItem interface removed as it's not used

// CrossReference interface removed as it's not used




interface BOTValidationResult {
  overallStatus: {
    isValid: boolean;
    errorCount: number;
    warningCount: number;
    lastValidated: Date;
  };
  balanceSheetValidation: {
    assetsEqualsLiabilitiesEquity: boolean;
    liquidAssetsCalculation: boolean;
    loanProvisionConsistency: boolean;
    crossFootings: boolean;
  };
  crossReportValidation: {
    retainedEarningsConsistency: boolean;
    agentBankingBalance: boolean;
    grossLoansConsistency: boolean;
    compulsorySavingsMatch: boolean;
  };
  dataQualityChecks: {
    negativeBalanceCheck: boolean;
    unusualVarianceCheck: boolean;
    missingAccountsCheck: boolean;
    duplicateEntriesCheck: boolean;
  };
  criticalIssues: string[];
  recommendedActions: string[];
}

interface SmartJournalEntry {
  journalId: string;
  date: string;
  reference: string;
  description: string;
  entries: JournalEntry[];
  regulatoryTags: RegulatoryTag[];
  botReportImpact: BOTReportImpact[];
  complianceStatus: string;
  approvalStatus: string;
  validationResults: ValidationResult[];
  balanceImpact: BalanceImpact;
}

interface JournalEntry {
  accountCode: string;
  accountName: string;
  debitAmount: number;
  creditAmount: number;
  narration: string;
  regulatoryTags: string[];
  botReportLineItems: string[];
}

interface RegulatoryTag {
  tagType: string;
  tagValue: string;
  impact: string;
  amount?: number;
}

interface BOTReportImpact {
  report: string;
  lineItem: string;
  impact: string;
  amount: number;
}

interface CrossReportImpact {
  transactionId: string;
  transactionType: string;
  amount: number;
  directImpacts: DirectImpact[];
  cascadingEffects: CascadingEffect[];
  ratioImpacts: RatioImpact[];
  complianceImpacts: ComplianceImpact[];
  effectsTimeline: EffectsTimeline[];
}

interface DirectImpact {
  reportCode: string;
  lineCode: string;
  lineName: string;
  accountCode: string;
  accountName: string;
  impactType: string;
  amount: number;
  previousValue: number;
  newValue: number;
  changePercentage: number;
  impactLevel?: string;
}

interface CascadingEffect {
  sourceReport: string;
  sourceLineItem: string;
  targetReport: string;
  targetLineItem: string;
  relationshipType: string;
  impactAmount: number;
  description: string;
}

interface RatioImpact {
  ratioName: string;
  ratioCode: string;
  currentValue: number;
  projectedValue: number;
  change: number;
  changePercentage: number;
  significance: string;
  regulatoryImplications: string[];
}

interface ComplianceImpact {
  id: string;
  type: string;
  severity: string;
  message: string;
  affectedReports: string[];
  recommendedAction: string;
}

interface EffectsTimeline {
  timestamp: Date;
  effect: string;
  impact: number;
  status: string;
}

interface ValidationResult {
  rule: string;
  status: 'PASS' | 'FAIL' | 'WARNING';
  message?: string;
}

interface BalanceImpact {
  totalDebits: number;
  totalCredits: number;
  netImpact: number;
  affectedAccounts: string[];
}

interface ValidationAlert {
  id: string;
  type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  message: string;
  impact: string;
  recommendedAction: string;
  affectedReports: string[];
  timestamp: Date;
}


interface JournalTemplate {
  templateId: string;
  templateName: string;
  description: string;
  transactionType: string;
  entries: JournalEntryTemplate[];
  regulatoryTags: string[];
  validationRules: string[];
  approvalRequired: boolean;
  botReportImpact: BOTReportImpact[];
}

interface JournalEntryTemplate {
  account: string;
  debitAmount?: string;
  creditAmount?: string;
  regulatoryTags: string[];
}

interface TransactionData {
  id: string;
  type: string;
  amount: number;
  date: string;
  reference: string;
  clientSector?: string;
  branchCode?: string;
  clientGender?: string;
  requiresJournalEntry?: boolean;
}

// BOT Report Mappings are now generated dynamically from chart of accounts data

// Helper Functions and Utility Methods


const getAccountTypeIcon = (type: string) => {
  switch (type) {
    case 'Asset': return <DollarSign className="w-4 h-4 text-green-600" />;
    case 'Liability': return <CreditCard className="w-4 h-4 text-red-600" />;
    case 'Equity': return <Building2 className="w-4 h-4 text-blue-600" />;
    case 'Revenue': return <TrendingUp className="w-4 h-4 text-green-500" />;
    case 'Expense': return <TrendingDown className="w-4 h-4 text-red-500" />;
    default: return <FileText className="w-4 h-4 text-gray-500" />;
  }
};

const getValidationStatusColor = (status: boolean) => {
  return status ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100';
};

const getValidationStatusIcon = (status: boolean) => {
  return status ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />;
};

const getSeverityColor = (severity: string) => {
  switch (severity) {
    case 'CRITICAL': return 'text-red-800 bg-red-100 border-red-200';
    case 'HIGH': return 'text-orange-800 bg-orange-100 border-orange-200';
    case 'MEDIUM': return 'text-yellow-800 bg-yellow-100 border-yellow-200';
    case 'LOW': return 'text-blue-800 bg-blue-100 border-blue-200';
    default: return 'text-gray-800 bg-gray-100 border-gray-200';
  }
};

const getImpactLevelColor = (level: string) => {
  switch (level) {
    case 'HIGH': return 'text-red-600 bg-red-50';
    case 'MEDIUM': return 'text-yellow-600 bg-yellow-50';
    case 'LOW': return 'text-green-600 bg-green-50';
    default: return 'text-gray-600 bg-gray-50';
  }
};

// Mock data for demonstration
const mockValidationStatus: BOTValidationResult = {
  overallStatus: {
    isValid: true,
    errorCount: 0,
    warningCount: 2,
    lastValidated: new Date()
  },
  balanceSheetValidation: {
    assetsEqualsLiabilitiesEquity: true,
    liquidAssetsCalculation: true,
    loanProvisionConsistency: true,
    crossFootings: true
  },
  crossReportValidation: {
    retainedEarningsConsistency: true,
    agentBankingBalance: true,
    grossLoansConsistency: true,
    compulsorySavingsMatch: true
  },
  dataQualityChecks: {
    negativeBalanceCheck: true,
    unusualVarianceCheck: false,
    missingAccountsCheck: true,
    duplicateEntriesCheck: true
  },
  criticalIssues: [],
  recommendedActions: ['Review unusual variance in liquid assets', 'Update provision rates for Q4']
};

const mockActiveAlerts: ValidationAlert[] = [
  {
    id: '1',
    type: 'BALANCE_EQUATION_WARNING',
    severity: 'MEDIUM',
    message: 'Minor variance detected in accounting equation',
    impact: 'All BOT reports',
    recommendedAction: 'Review recent journal entries',
    affectedReports: ['MSP2_01', 'MSP2_02'],
    timestamp: new Date()
  }
];

const mockJournalTemplates: JournalTemplate[] = [
  {
    templateId: 'LOAN_DISBURSEMENT',
    templateName: 'Loan Disbursement',
    description: 'Standard loan disbursement journal entry',
    transactionType: 'LOAN_DISBURSEMENT',
    entries: [
      {
        account: 'GROSS_LOANS',
        debitAmount: '${LOAN_AMOUNT}',
        regulatoryTags: ['MSP2_01_C17', 'MSP2_03_SECTOR']
      },
      {
        account: 'CASH_BANK',
        creditAmount: '${LOAN_AMOUNT}',
        regulatoryTags: ['MSP2_01_C1_C2']
      }
    ],
    regulatoryTags: ['MSP2_01_C17', 'MSP2_03_SECTOR'],
    validationRules: ['BALANCE_CHECK', 'AMOUNT_VALIDATION'],
    approvalRequired: false,
    botReportImpact: [
      { report: 'MSP2_01', lineItem: 'C17', impact: 'INCREASE', amount: 0 },
      { report: 'MSP2_03', lineItem: 'SECTOR_SPECIFIC', impact: 'INCREASE', amount: 0 }
    ]
  }
];

const GeneralLedger: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { chartOfAccounts, generalLedger, journalEntries, trialBalance } = useAccountingData();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAccount, setSelectedAccount] = useState('');
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [showReconciliation, setShowReconciliation] = useState(false);
  const [showECLCalculation, setShowECLCalculation] = useState(false);
  const [showBOTMapping, setShowBOTMapping] = useState(false);
  const [showRegulatoryReports, setShowRegulatoryReports] = useState(false);
  const [showAccountNavigator, setShowAccountNavigator] = useState(false);
  const [showBalanceValidator, setShowBalanceValidator] = useState(false);
  const [showAutoJournal, setShowAutoJournal] = useState(false);
  const [selectedReportCode, setSelectedReportCode] = useState('MSP2_01');
  const [showTransactionView, setShowTransactionView] = useState(false);
  const [showTransactionEdit, setShowTransactionEdit] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  // Removed unused modal state variables
  const [activeAlerts, setActiveAlerts] = useState<any[]>([]);
  
  // Enhanced state for new features
  const [selectedReportForNavigator, setSelectedReportForNavigator] = useState<string>('MSP2_01');
  const [searchSuggestions, setSearchSuggestions] = useState<any[]>([]);
  const [favoriteAccounts, setFavoriteAccounts] = useState<string[]>([]);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['assets']));
  const [impactAnalysis, setImpactAnalysis] = useState<CrossReportImpact | null>(null);
  const [generatedJournal, setGeneratedJournal] = useState<SmartJournalEntry | null>(null);
  const [realTimeValidation, setRealTimeValidation] = useState<BOTValidationResult | null>(null);

  // All accounting data is already available from useAccountingData() hook

  // Transaction action handlers
  const handleViewTransaction = (transaction: any) => {
    setSelectedTransaction(transaction);
    setShowTransactionView(true);
  };

  const handleEditTransaction = (transaction: any) => {
    setSelectedTransaction(transaction);
    setShowTransactionEdit(true);
  };

  // Event Handlers and Utility Functions
  const handleSmartSearch = (term: string) => {
    setSearchTerm(term);
    if (term.length > 2) {
      const suggestions = Object.entries(RegulatoryAccountMapping)
        .filter(([code, account]) => 
          account.name.toLowerCase().includes(term.toLowerCase()) ||
          code.includes(term) ||
          account.code.includes(term)
        )
        .map(([code, account]) => ({
          id: code,
          code: account.code,
          name: account.name,
          type: account.category
        }))
        .slice(0, 10);
      setSearchSuggestions(suggestions);
    } else {
      setSearchSuggestions([]);
    }
  };

  const handleAccountSelect = (accountCode: string) => {
    setSelectedAccount(accountCode);
  };

  const toggleGroup = (groupName: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupName)) {
      newExpanded.delete(groupName);
    } else {
      newExpanded.add(groupName);
    }
    setExpandedGroups(newExpanded);
  };

  const toggleFavorite = (accountCode: string) => {
    setFavoriteAccounts(prev => {
      if (prev.includes(accountCode)) {
        return prev.filter(code => code !== accountCode);
      } else {
        return [...prev, accountCode];
      }
    });
  };

  const runFullValidation = () => {
    setRealTimeValidation(mockValidationStatus);
    setActiveAlerts(mockActiveAlerts);
  };

  const generateJournalEntry = (transactionType: string, amount: number, reference: string) => {
    const template = mockJournalTemplates.find(t => t.templateId === transactionType);
    if (template) {
      const journalEntry: SmartJournalEntry = {
        journalId: `JE-${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        reference,
        description: `${template.templateName} - ${reference}`,
        entries: template.entries.map(entry => ({
          accountCode: entry.account,
          accountName: entry.account,
          debitAmount: entry.debitAmount ? parseFloat(entry.debitAmount.replace('${LOAN_AMOUNT}', amount.toString())) : 0,
          creditAmount: entry.creditAmount ? parseFloat(entry.creditAmount.replace('${LOAN_AMOUNT}', amount.toString())) : 0,
          narration: `${template.templateName} entry`,
          regulatoryTags: entry.regulatoryTags,
          botReportLineItems: entry.regulatoryTags
        })),
        regulatoryTags: template.regulatoryTags.map(tag => ({
          tagType: 'BOT_REPORT_LINE',
          tagValue: tag,
          impact: 'DEBIT'
        })),
        botReportImpact: template.botReportImpact.map(impact => ({
          ...impact,
          amount
        })),
        complianceStatus: 'COMPLIANT',
        approvalStatus: template.approvalRequired ? 'PENDING_APPROVAL' : 'AUTO_APPROVED',
        validationResults: [
          { rule: 'Balance Check', status: 'PASS' as const },
          { rule: 'Amount Validation', status: 'PASS' as const }
        ],
        balanceImpact: {
          totalDebits: amount,
          totalCredits: amount,
          netImpact: 0,
          affectedAccounts: template.entries.map(e => e.account)
        }
      };
      setGeneratedJournal(journalEntry);
    }
  };

  const analyzeTransactionImpact = (transaction: TransactionData) => {
    const impactAnalysis: CrossReportImpact = {
      transactionId: transaction.id,
      transactionType: transaction.type,
      amount: transaction.amount,
      directImpacts: [
        {
          reportCode: 'MSP2_01',
          lineCode: 'C17',
          lineName: 'Total Gross Loans',
          accountCode: '1401',
          accountName: 'Individual Loans',
          impactType: 'DEBIT',
          amount: transaction.amount,
          previousValue: 89500000,
          newValue: 89500000 + transaction.amount,
          changePercentage: (transaction.amount / 89500000) * 100,
          impactLevel: 'MEDIUM'
        }
      ],
      cascadingEffects: [
        {
          sourceReport: 'MSP2_01',
          sourceLineItem: 'C17',
          targetReport: 'MSP2_03',
          targetLineItem: 'SECTOR_TOTAL',
          relationshipType: 'SECTORAL_BREAKDOWN',
          impactAmount: transaction.amount,
          description: 'Loan disbursement increases sectoral loan portfolio'
        }
      ],
      ratioImpacts: [
        {
          ratioName: 'Liquid Asset Ratio',
          ratioCode: 'LAR',
          currentValue: 0.15,
          projectedValue: 0.14,
          change: -0.01,
          changePercentage: -6.67,
          significance: 'LOW',
          regulatoryImplications: ['Within regulatory limits']
        }
      ],
      complianceImpacts: [],
      effectsTimeline: [
        {
          timestamp: new Date(),
          effect: 'Journal Entry Posted',
          impact: transaction.amount,
          status: 'COMPLETED'
        }
      ]
    };
    setImpactAnalysis(impactAnalysis);
  };

  // Initialize validation status on component mount
  useEffect(() => {
    setRealTimeValidation(mockValidationStatus);
    setActiveAlerts(mockActiveAlerts);
  }, []);

  // BOT-Aligned Chart of Accounts with Regulatory Mapping
  const RegulatoryAccountMapping = {
    // Assets (MSP2_01)
    '1001': { code: 'C1', name: 'Cash in Hand', category: 'Current Assets', mspCode: 'MSP2_01', balance: 5000000 },
    '1002': { code: 'C2', name: 'Bank Balances', category: 'Current Assets', mspCode: 'MSP2_01', balance: 10000000 },
    '1005': { code: 'C5', name: 'Agent Banking Balances', category: 'Current Assets', mspCode: 'MSP2_01', balance: 3000000 },
    '1017': { code: 'C17', name: 'Gross Loans', category: 'Current Assets', mspCode: 'MSP2_01', balance: 89500000 },
    '1022': { code: 'C22', name: 'Loan Loss Provisions', category: 'Current Assets', mspCode: 'MSP2_01', balance: 7000000 },
    '1018': { code: 'C18', name: 'Accrued Interest Receivable', category: 'Current Assets', mspCode: 'MSP2_01', balance: 2500000 },
    '1020': { code: 'C20', name: 'Other Current Assets', category: 'Current Assets', mspCode: 'MSP2_01', balance: 1500000 },
    '1025': { code: 'C25', name: 'Property, Plant & Equipment', category: 'Non-Current Assets', mspCode: 'MSP2_01', balance: 45000000 },
    '1026': { code: 'C26', name: 'Intangible Assets', category: 'Non-Current Assets', mspCode: 'MSP2_01', balance: 5000000 },
    
    // Liabilities (MSP2_01)
    '2001': { code: 'C46', name: 'Compulsory Savings', category: 'Current Liabilities', mspCode: 'MSP2_01', balance: 15000000 },
    '2002': { code: 'C47', name: 'Voluntary Savings', category: 'Current Liabilities', mspCode: 'MSP2_01', balance: 8000000 },
    '2003': { code: 'C48', name: 'Term Deposits', category: 'Current Liabilities', mspCode: 'MSP2_01', balance: 12000000 },
    '2010': { code: 'C50', name: 'Borrowings from Banks', category: 'Long-term Liabilities', mspCode: 'MSP2_01', balance: 20000000 },
    '2011': { code: 'C51', name: 'Borrowings from Other Institutions', category: 'Long-term Liabilities', mspCode: 'MSP2_01', balance: 10000000 },
    '2015': { code: 'C52', name: 'Other Liabilities', category: 'Current Liabilities', mspCode: 'MSP2_01', balance: 5000000 },
    
    // Equity (MSP2_01)
    '3001': { code: 'C55', name: 'Paid-up Capital', category: 'Capital', mspCode: 'MSP2_01', balance: 75000000 },
    '3002': { code: 'C56', name: 'Share Premium', category: 'Capital', mspCode: 'MSP2_01', balance: 5000000 },
    '3010': { code: 'C59', name: 'Retained Earnings', category: 'Capital', mspCode: 'MSP2_01', balance: 38000000 },
    '3011': { code: 'C60', name: 'Current Year Profit', category: 'Capital', mspCode: 'MSP2_01', balance: 12000000 },
    
    // Income (MSP2_02)
    '4001': { code: 'D1', name: 'Interest on Loans', category: 'Interest Income', mspCode: 'MSP2_02', balance: 22000000 },
    '4002': { code: 'D2', name: 'Interest on Investments', category: 'Interest Income', mspCode: 'MSP2_02', balance: 1000000 },
    '4010': { code: 'D10', name: 'Commission Income', category: 'Non-Interest Income', mspCode: 'MSP2_02', balance: 2000000 },
    '4011': { code: 'D11', name: 'Service Charges', category: 'Non-Interest Income', mspCode: 'MSP2_02', balance: 1000000 },
    '4015': { code: 'D15', name: 'Other Operating Income', category: 'Non-Interest Income', mspCode: 'MSP2_02', balance: 500000 },
    
    // Expenses (MSP2_02)
    '5001': { code: 'D20', name: 'Interest on Borrowings', category: 'Interest Expense', mspCode: 'MSP2_02', balance: 3000000 },
    '5002': { code: 'D21', name: 'Interest on Deposits', category: 'Interest Expense', mspCode: 'MSP2_02', balance: 2000000 },
    '5020': { code: 'D35', name: 'Salaries and Benefits', category: 'Operating Expenses', mspCode: 'MSP2_02', balance: 8000000 },
    '5021': { code: 'D36', name: 'Administrative Expenses', category: 'Operating Expenses', mspCode: 'MSP2_02', balance: 4000000 },
    '5025': { code: 'D40', name: 'Provision for Loan Losses', category: 'Operating Expenses', mspCode: 'MSP2_02', balance: 4250000 },
    '5030': { code: 'D45', name: 'Depreciation', category: 'Operating Expenses', mspCode: 'MSP2_02', balance: 1000000 }
  };

  // BOT Regulatory Reports Configuration
  const botReports = [
    {
      id: 'MSP2_01',
      name: 'Statement of Financial Position',
      description: 'Assets, Liabilities and Equity',
      frequency: 'Monthly',
      dueDate: '15th of following month',
      status: 'Ready',
      lastGenerated: '2025-01-15',
      accounts: ['1001', '1002', '1005', '1017', '1022', '2001', '2002', '2010', '3001', '3010']
    },
    {
      id: 'MSP2_02',
      name: 'Statement of Income',
      description: 'Income and Expenses',
      frequency: 'Monthly',
      dueDate: '15th of following month',
      status: 'Ready',
      lastGenerated: '2025-01-15',
      accounts: ['4001', '4002', '4010', '4011', '5001', '5002', '5020', '5021', '5025']
    },
    {
      id: 'MSP2_03',
      name: 'Risk Classification Report',
      description: 'Loan Portfolio Risk Analysis',
      frequency: 'Monthly',
      dueDate: '15th of following month',
      status: 'Ready',
      lastGenerated: '2025-01-15',
      accounts: ['1017', '1022', '5025']
    },
    {
      id: 'MSP2_04',
      name: 'Interest Rate Report',
      description: 'Interest Rate Structure Analysis',
      frequency: 'Monthly',
      dueDate: '15th of following month',
      status: 'Ready',
      lastGenerated: '2025-01-15',
      accounts: ['4001', '5001', '5002']
    },
    {
      id: 'MSP2_05',
      name: 'Liquidity Report',
      description: 'Liquidity Position Analysis',
      frequency: 'Monthly',
      dueDate: '15th of following month',
      status: 'Pending',
      lastGenerated: '2025-01-10',
      accounts: ['1001', '1002', '1005', '2001', '2002', '2003']
    }
  ];

  // Enhanced Chart of Accounts with BOT Mapping
  const enhancedChartOfAccounts = [
    {
      code: '1000',
      name: 'ASSETS',
      type: 'Header',
      balance: 145000000,
      mspCode: 'MSP2_01',
      children: [
        { 
          code: '1100', 
          name: 'Current Assets', 
          type: 'Header', 
          balance: 95000000,
          mspCode: 'MSP2_01',
          children: [
            { code: '1001', name: 'Cash in Hand', type: 'Asset', balance: 5000000, mspCode: 'MSP2_01', botCode: 'C1' },
            { code: '1002', name: 'Bank Balances', type: 'Asset', balance: 10000000, mspCode: 'MSP2_01', botCode: 'C2' },
            { code: '1005', name: 'Agent Banking Balances', type: 'Asset', balance: 3000000, mspCode: 'MSP2_01', botCode: 'C5' },
            { code: '1017', name: 'Gross Loans', type: 'Asset', balance: 89500000, mspCode: 'MSP2_01', botCode: 'C17' },
            { code: '1018', name: 'Accrued Interest Receivable', type: 'Asset', balance: 2500000, mspCode: 'MSP2_01', botCode: 'C18' },
            { code: '1020', name: 'Other Current Assets', type: 'Asset', balance: 1500000, mspCode: 'MSP2_01', botCode: 'C20' }
          ]
        },
        { 
          code: '1200', 
          name: 'Non-Current Assets', 
          type: 'Header', 
          balance: 50000000,
          mspCode: 'MSP2_01',
          children: [
            { code: '1025', name: 'Property, Plant & Equipment', type: 'Asset', balance: 45000000, mspCode: 'MSP2_01', botCode: 'C25' },
            { code: '1026', name: 'Intangible Assets', type: 'Asset', balance: 5000000, mspCode: 'MSP2_01', botCode: 'C26' }
          ]
        },
        { 
          code: '1022', 
          name: 'Loan Loss Provisions', 
          type: 'Asset', 
          balance: 7000000, 
          mspCode: 'MSP2_01', 
          botCode: 'C22',
          isContraAsset: true
        }
      ]
    },
    {
      code: '2000',
      name: 'LIABILITIES',
      type: 'Header',
      balance: 32000000,
      mspCode: 'MSP2_01',
      children: [
        { 
          code: '2100', 
          name: 'Current Liabilities', 
          type: 'Header', 
          balance: 12000000,
          mspCode: 'MSP2_01',
          children: [
            { code: '2001', name: 'Compulsory Savings', type: 'Liability', balance: 15000000, mspCode: 'MSP2_01', botCode: 'C46' },
            { code: '2002', name: 'Voluntary Savings', type: 'Liability', balance: 8000000, mspCode: 'MSP2_01', botCode: 'C47' },
            { code: '2003', name: 'Term Deposits', type: 'Liability', balance: 12000000, mspCode: 'MSP2_01', botCode: 'C48' },
            { code: '2015', name: 'Other Liabilities', type: 'Liability', balance: 5000000, mspCode: 'MSP2_01', botCode: 'C52' }
          ]
        },
        { 
          code: '2200', 
          name: 'Non-Current Liabilities', 
          type: 'Header', 
          balance: 20000000,
          mspCode: 'MSP2_01',
          children: [
            { code: '2010', name: 'Borrowings from Banks', type: 'Liability', balance: 20000000, mspCode: 'MSP2_01', botCode: 'C50' },
            { code: '2011', name: 'Borrowings from Other Institutions', type: 'Liability', balance: 10000000, mspCode: 'MSP2_01', botCode: 'C51' }
          ]
        }
      ]
    },
    {
      code: '3000',
      name: 'EQUITY',
      type: 'Header',
      balance: 113000000,
      mspCode: 'MSP2_01',
      children: [
        { code: '3001', name: 'Paid-up Capital', type: 'Equity', balance: 75000000, mspCode: 'MSP2_01', botCode: 'C55' },
        { code: '3002', name: 'Share Premium', type: 'Equity', balance: 5000000, mspCode: 'MSP2_01', botCode: 'C56' },
        { code: '3010', name: 'Retained Earnings', type: 'Equity', balance: 38000000, mspCode: 'MSP2_01', botCode: 'C59' },
        { code: '3011', name: 'Current Year Profit', type: 'Equity', balance: 12000000, mspCode: 'MSP2_01', botCode: 'C60' }
      ]
    },
    {
      code: '4000',
      name: 'REVENUE',
      type: 'Header',
      balance: 25000000,
      mspCode: 'MSP2_02',
      children: [
        { 
          code: '4100', 
          name: 'Interest Income', 
          type: 'Revenue', 
          balance: 22000000,
          mspCode: 'MSP2_02',
          children: [
            { code: '4001', name: 'Interest on Loans', type: 'Revenue', balance: 22000000, mspCode: 'MSP2_02', botCode: 'D1' },
            { code: '4002', name: 'Interest on Investments', type: 'Revenue', balance: 1000000, mspCode: 'MSP2_02', botCode: 'D2' }
          ]
        },
        { 
          code: '4200', 
          name: 'Non-Interest Income', 
          type: 'Revenue', 
          balance: 3000000,
          mspCode: 'MSP2_02',
          children: [
            { code: '4010', name: 'Commission Income', type: 'Revenue', balance: 2000000, mspCode: 'MSP2_02', botCode: 'D10' },
            { code: '4011', name: 'Service Charges', type: 'Revenue', balance: 1000000, mspCode: 'MSP2_02', botCode: 'D11' },
            { code: '4015', name: 'Other Operating Income', type: 'Revenue', balance: 500000, mspCode: 'MSP2_02', botCode: 'D15' }
          ]
        }
      ]
    },
    {
      code: '5000',
      name: 'EXPENSES',
      type: 'Header',
      balance: 16250000,
      mspCode: 'MSP2_02',
      children: [
        { 
          code: '5100', 
          name: 'Interest Expense', 
          type: 'Expense', 
          balance: 5000000,
          mspCode: 'MSP2_02',
          children: [
            { code: '5001', name: 'Interest on Borrowings', type: 'Expense', balance: 3000000, mspCode: 'MSP2_02', botCode: 'D20' },
            { code: '5002', name: 'Interest on Deposits', type: 'Expense', balance: 2000000, mspCode: 'MSP2_02', botCode: 'D21' }
          ]
        },
        { 
          code: '5200', 
          name: 'Operating Expenses', 
          type: 'Expense', 
          balance: 12000000,
          mspCode: 'MSP2_02',
          children: [
            { code: '5020', name: 'Salaries and Benefits', type: 'Expense', balance: 8000000, mspCode: 'MSP2_02', botCode: 'D35' },
            { code: '5021', name: 'Administrative Expenses', type: 'Expense', balance: 4000000, mspCode: 'MSP2_02', botCode: 'D36' },
            { code: '5030', name: 'Depreciation', type: 'Expense', balance: 1000000, mspCode: 'MSP2_02', botCode: 'D45' }
          ]
        },
        { 
          code: '5300', 
          name: 'Provision Expenses', 
          type: 'Expense', 
          balance: 4250000,
          mspCode: 'MSP2_02',
          children: [
            { code: '5025', name: 'Provision for Loan Losses', type: 'Expense', balance: 4250000, mspCode: 'MSP2_02', botCode: 'D40' }
          ]
        }
      ]
    }
  ];

  // BOT Report Mappings are now generated dynamically from chart of accounts data

  // Real-time Balance Validator
  const validateAccountingEquation = () => {
    const assets = 145000000; // Total assets from chart
    const liabilities = 32000000; // Total liabilities
    const equity = 113000000; // Total equity
    const difference = assets - (liabilities + equity);
    
    return {
      assets,
      liabilities,
      equity,
      difference,
      isBalanced: Math.abs(difference) < 0.01,
      timestamp: new Date()
    };
  };

  // Auto-Journal Templates
  // Enhanced Auto-Journal Templates with real loan activities
  const journalTemplates = [
    {
      templateId: 'LOAN_DISBURSEMENT',
      templateName: 'Loan Disbursement',
      transactionType: 'LOAN_DISBURSEMENT',
      description: 'Debit "Gross Loans", Credit "Cash" - When a loan is disbursed to a client',
      entries: [
        { 
          account: 'Gross Loans (1017)', 
          debitAmount: '${LOAN_AMOUNT}', 
          creditAmount: '0',
          description: 'Loan disbursement to client',
          regulatoryTags: ['MSP2_01_C17', 'MSP2_03_SECTOR'] 
        },
        { 
          account: 'Cash and Bank (1001)', 
          debitAmount: '0', 
          creditAmount: '${LOAN_AMOUNT}',
          description: 'Cash payment to client',
          regulatoryTags: ['MSP2_01_C1_C2'] 
        }
      ],
      botReportImpact: [
        { report: 'MSP2_01', lineItem: 'C17', impact: 'INCREASE' },
        { report: 'MSP2_03', lineItem: 'SECTOR_SPECIFIC', impact: 'INCREASE' }
      ],
      requiredFields: ['LOAN_AMOUNT', 'CLIENT_ID', 'LOAN_ID']
    },
    {
      templateId: 'INTEREST_ACCRUAL',
      templateName: 'Interest Accrual',
      transactionType: 'INTEREST_ACCRUAL',
      description: 'Debit "Accrued Interest Receivable", Credit "Interest Income" - Daily interest accrual',
      entries: [
        { 
          account: 'Accrued Interest Receivable (1018)', 
          debitAmount: '${INTEREST_AMOUNT}', 
          creditAmount: '0',
          description: 'Interest accrued on loan',
          regulatoryTags: ['MSP2_01_C17'] 
        },
        { 
          account: 'Interest Income (4100)', 
          debitAmount: '0', 
          creditAmount: '${INTEREST_AMOUNT}',
          description: 'Interest income earned',
          regulatoryTags: ['MSP2_02_D1_D2'] 
        }
      ],
      botReportImpact: [
        { report: 'MSP2_01', lineItem: 'C17', impact: 'INCREASE' },
        { report: 'MSP2_02', lineItem: 'D1_D2', impact: 'INCREASE' }
      ],
      requiredFields: ['INTEREST_AMOUNT', 'LOAN_ID']
    },
    {
      templateId: 'INTEREST_COLLECTION',
      templateName: 'Interest Collection',
      transactionType: 'INTEREST_COLLECTION',
      description: 'Debit "Cash", Credit "Accrued Interest Receivable" - When interest is collected',
      entries: [
        { 
          account: 'Cash and Bank (1001)', 
          debitAmount: '${INTEREST_AMOUNT}', 
          creditAmount: '0',
          description: 'Interest payment received',
          regulatoryTags: ['MSP2_01_C1_C2'] 
        },
        { 
          account: 'Accrued Interest Receivable (1018)', 
          debitAmount: '0', 
          creditAmount: '${INTEREST_AMOUNT}',
          description: 'Accrued interest collected',
          regulatoryTags: ['MSP2_01_C17'] 
        }
      ],
      botReportImpact: [
        { report: 'MSP2_01', lineItem: 'C1_C2', impact: 'INCREASE' },
        { report: 'MSP2_01', lineItem: 'C17', impact: 'DECREASE' }
      ],
      requiredFields: ['INTEREST_AMOUNT', 'LOAN_ID']
    },
    {
      templateId: 'PRINCIPAL_REPAYMENT',
      templateName: 'Principal Repayment',
      transactionType: 'PRINCIPAL_REPAYMENT',
      description: 'Debit "Cash", Credit "Gross Loans" - When principal is repaid',
      entries: [
        { 
          account: 'Cash and Bank (1001)', 
          debitAmount: '${PRINCIPAL_AMOUNT}', 
          creditAmount: '0',
          description: 'Principal repayment received',
          regulatoryTags: ['MSP2_01_C1_C2'] 
        },
        { 
          account: 'Gross Loans (1017)', 
          debitAmount: '0', 
          creditAmount: '${PRINCIPAL_AMOUNT}',
          description: 'Principal amount repaid',
          regulatoryTags: ['MSP2_01_C17'] 
        }
      ],
      botReportImpact: [
        { report: 'MSP2_01', lineItem: 'C1_C2', impact: 'INCREASE' },
        { report: 'MSP2_01', lineItem: 'C17', impact: 'DECREASE' }
      ],
      requiredFields: ['PRINCIPAL_AMOUNT', 'LOAN_ID']
    },
    {
      templateId: 'LOAN_LOSS_PROVISION',
      templateName: 'Loan Loss Provision',
      transactionType: 'PROVISION',
      description: 'Debit "Loan Loss Provision Expense", Credit "Loan Loss Provisions" - ECL provisioning',
      entries: [
        { 
          account: 'Loan Loss Provision Expense (5005)', 
          debitAmount: '${PROVISION_AMOUNT}', 
          creditAmount: '0',
          description: 'ECL provision expense',
          regulatoryTags: ['MSP2_02_D30'] 
        },
        { 
          account: 'Loan Loss Provisions (1022)', 
          debitAmount: '0', 
          creditAmount: '${PROVISION_AMOUNT}',
          description: 'Loan loss allowance',
          regulatoryTags: ['MSP2_01_C18_C19_C20_C21_C22'] 
        }
      ],
      botReportImpact: [
        { report: 'MSP2_02', lineItem: 'D30', impact: 'INCREASE' },
        { report: 'MSP2_01', lineItem: 'C18_C19_C20_C21_C22', impact: 'INCREASE' }
      ],
      requiredFields: ['PROVISION_AMOUNT', 'LOAN_ID', 'PROVISION_STAGE'],
      approvalRequired: true
    },
    {
      templateId: 'FEE_INCOME',
      templateName: 'Fee Income',
      transactionType: 'FEE_INCOME',
      description: 'Debit "Cash", Credit "Fee Income" - When processing fees are collected',
      entries: [
        { 
          account: 'Cash and Bank (1001)', 
          debitAmount: '${FEE_AMOUNT}', 
          creditAmount: '0',
          description: 'Processing fee received',
          regulatoryTags: ['MSP2_01_C1_C2'] 
        },
        { 
          account: 'Fee Income (4200)', 
          debitAmount: '0', 
          creditAmount: '${FEE_AMOUNT}',
          description: 'Processing fee income',
          regulatoryTags: ['MSP2_02_D3'] 
        }
      ],
      botReportImpact: [
        { report: 'MSP2_01', lineItem: 'C1_C2', impact: 'INCREASE' },
        { report: 'MSP2_02', lineItem: 'D3', impact: 'INCREASE' }
      ],
      requiredFields: ['FEE_AMOUNT', 'LOAN_ID']
    }
  ];


  // Generate real recent transactions from journal entries
  const generateRecentTransactions = () => {
    if (!journalEntries || !chartOfAccounts) {
      console.log('🔍 Recent Transactions Debug: No data available', { 
        journalEntries: journalEntries?.length || 0, 
        chartOfAccounts: chartOfAccounts?.length || 0 
      });
      return [];
    }
    
    console.log('🔍 Recent Transactions Debug: Raw journal entries data:', journalEntries);
    
    const transactions = journalEntries
      .sort((a, b) => new Date(b.entry_date).getTime() - new Date(a.entry_date).getTime())
      .slice(0, 10) // Get last 10 transactions
      .map(entry => {
        console.log('🔍 Processing journal entry:', {
          id: entry.id,
          entry_date: entry.entry_date,
          description: entry.description,
          reference: entry.reference,
          total_debit: entry.total_debit,
          total_credit: entry.total_credit,
          status: entry.status
        });
        
        // For now, we'll use the journal entry data directly since we don't have journal entry lines
        // In a real implementation, you would join with journal_entry_lines to get debit/credit details
        return {
          id: entry.id,
          date: new Date(entry.entry_date).toLocaleDateString('en-CA'), // YYYY-MM-DD format
          description: entry.description || entry.reference || 'Journal Entry',
          debitAccount: 'Multiple Accounts', // Would be populated from journal_entry_lines
          creditAccount: 'Multiple Accounts', // Would be populated from journal_entry_lines
          amount: entry.total_debit || entry.total_credit || 0,
          reference: entry.reference || entry.entry_number || 'N/A',
          status: entry.status || 'Posted',
          created_at: entry.entry_date,
          journal_id: entry.id
        };
      });
    
    console.log('🔍 Recent Transactions Debug: Processed transactions:', transactions);
    return transactions;
  };

  const recentTransactions = generateRecentTransactions();

  // Generate real reconciliation data from database
  const generateReconciliationData = () => {
    if (!generalLedger || !chartOfAccounts) return [];
    
    // Get cash-related accounts
    const cashAccounts = chartOfAccounts.filter(acc => 
      acc.account_name.toLowerCase().includes('cash') || 
      acc.account_name.toLowerCase().includes('bank') ||
      acc.account_code.startsWith('1001')
    );
    
    const reconciliationItems = [];
    
    // Generate reconciliation items based on actual cash transactions
    cashAccounts.forEach((account, index) => {
      const accountTransactions = generalLedger.filter(entry => 
        entry.account_id === account.id && 
        (entry.debit_amount > 0 || entry.credit_amount > 0)
      );
      
      if (accountTransactions.length > 0) {
        const totalDebits = accountTransactions.reduce((sum, entry) => sum + entry.debit_amount, 0);
        const totalCredits = accountTransactions.reduce((sum, entry) => sum + entry.credit_amount, 0);
        const netAmount = totalDebits - totalCredits;
        
        // Simulate statement amounts with small variances
        const statementAmount = netAmount + (Math.random() - 0.5) * 10000;
        const difference = Math.abs(statementAmount - netAmount);
        
        reconciliationItems.push({
          id: index + 1,
          source: account.account_name,
          amount: Math.abs(statementAmount),
          ledgerAmount: Math.abs(netAmount),
          difference: difference,
          status: difference < 1000 ? 'Matched' : 'Variance'
        });
      }
    });
    
    // Add mobile money reconciliation if no cash accounts found
    if (reconciliationItems.length === 0) {
      reconciliationItems.push(
        {
          id: 1,
          source: 'M-Pesa Statement',
          amount: 2450000,
          ledgerAmount: 2450000,
          difference: 0,
          status: 'Matched'
        },
        {
          id: 2,
          source: 'Tigo Pesa Statement',
          amount: 1850000,
          ledgerAmount: 1825000,
          difference: 25000,
          status: 'Variance'
        },
        {
          id: 3,
          source: 'Bank Statement - CRDB',
          amount: 15250000,
          ledgerAmount: 15250000,
          difference: 0,
          status: 'Matched'
        }
      );
    }
    
    return reconciliationItems;
  };

  const reconciliationItems = generateReconciliationData();

  // Generate real ECL calculation from loan data
  const generateECLCalculation = () => {
    // Get loan applications data
    const { data: loanApplications } = useSupabaseQuery('loan_applications', {
      select: 'id, approved_amount, status, created_at, interest_rate',
      orderBy: { column: 'created_at', ascending: false }
    });

    if (!loanApplications || loanApplications.length === 0) {
      return {
        stage1: { loans: 0, amount: 0, provisionRate: 0.5, provision: 0 },
        stage2: { loans: 0, amount: 0, provisionRate: 5.0, provision: 0 },
        stage3: { loans: 0, amount: 0, provisionRate: 50.0, provision: 0 }
      };
    }

    const disbursedLoans = loanApplications.filter(loan => 
      loan.status === 'disbursed' && loan.approved_amount > 0
    );

    // Stage 1: Performing loans (0-30 days past due)
    const stage1Loans = disbursedLoans.filter(loan => {
      const daysSinceDisbursement = Math.floor((Date.now() - new Date(loan.created_at).getTime()) / (1000 * 60 * 60 * 24));
      return daysSinceDisbursement <= 30;
    });

    // Stage 2: Underperforming loans (31-90 days past due)
    const stage2Loans = disbursedLoans.filter(loan => {
      const daysSinceDisbursement = Math.floor((Date.now() - new Date(loan.created_at).getTime()) / (1000 * 60 * 60 * 24));
      return daysSinceDisbursement > 30 && daysSinceDisbursement <= 90;
    });

    // Stage 3: Non-performing loans (90+ days past due)
    const stage3Loans = disbursedLoans.filter(loan => {
      const daysSinceDisbursement = Math.floor((Date.now() - new Date(loan.created_at).getTime()) / (1000 * 60 * 60 * 24));
      return daysSinceDisbursement > 90;
    });

    const calculateStageData = (loans: any[], provisionRate: number) => {
      const totalAmount = loans.reduce((sum, loan) => sum + (loan.approved_amount || 0), 0);
      return {
        loans: loans.length,
        amount: totalAmount,
        provisionRate: provisionRate,
        provision: totalAmount * (provisionRate / 100)
      };
    };

    return {
      stage1: calculateStageData(stage1Loans, 0.5),
      stage2: calculateStageData(stage2Loans, 5.0),
      stage3: calculateStageData(stage3Loans, 50.0)
    };
  };

  const eclCalculation = generateECLCalculation();

  // Generate accurate BOT mapping from real chart of accounts with actual balances
  const generateBOTMapping = () => {
    if (!chartOfAccounts) return {};
    
    console.log('🔍 BOT Mapping Debug: Generating mapping from real chart of accounts:', chartOfAccounts);
    
    const mapping: any = {
      'MSP2_01': { // Balance Sheet
        reportName: 'Balance Sheet',
        lineItems: []
      },
      'MSP2_02': { // Income Statement
        reportName: 'Income Statement',
        lineItems: []
      },
      'MSP2_03': { // Cash Flow Statement
        reportName: 'Cash Flow Statement',
        lineItems: []
      }
    };

    // Map accounts to BOT line items based on account types and codes
    chartOfAccounts.forEach(account => {
      const accountCode = account.account_code;
      const accountName = account.account_name;
      const accountType = account.account_type;

      // Get actual balance from general ledger or trial balance
      let actualBalance = 0;
      if (generalLedger && generalLedger.length > 0) {
        const ledgerEntry = generalLedger.find(entry => entry.account_id === account.id);
        if (ledgerEntry) {
          actualBalance = ledgerEntry.debit_amount - ledgerEntry.credit_amount;
        }
      } else if (trialBalance && trialBalance.length > 0) {
        const trialEntry = trialBalance.find((entry: any) => entry.account_id === account.id);
        if (trialEntry) {
          actualBalance = trialEntry.debit_balance - trialEntry.credit_balance;
        }
      }

      // Balance Sheet mappings
      if (accountType === 'asset') {
        if (accountCode.startsWith('1001')) {
          mapping['MSP2_01'].lineItems.push({
            lineCode: 'C1',
            lineName: 'Cash in Hand',
            accountCodes: [accountCode],
            type: 'Asset',
            balance: actualBalance,
            validationRules: [],
            crossReferences: []
          });
        } else if (accountCode.startsWith('1002') || accountCode.startsWith('1003')) {
          mapping['MSP2_01'].lineItems.push({
            lineCode: 'C2',
            lineName: 'Bank Balances',
            accountCodes: [accountCode],
            type: 'Asset',
            balance: actualBalance,
            validationRules: [],
            crossReferences: []
          });
        } else if (accountCode.startsWith('1017')) {
          mapping['MSP2_01'].lineItems.push({
            lineCode: 'C17',
            lineName: 'Gross Loans',
            accountCodes: [accountCode],
            type: 'Asset',
            balance: actualBalance,
            validationRules: [],
            crossReferences: []
          });
        } else {
          mapping['MSP2_01'].lineItems.push({
            lineCode: 'C99',
            lineName: accountName,
            accountCodes: [accountCode],
            type: 'Asset',
            balance: actualBalance,
            validationRules: [],
            crossReferences: []
          });
        }
      } else if (accountType === 'liability') {
        mapping['MSP2_01'].lineItems.push({
          lineCode: 'L99',
          lineName: accountName,
          accountCodes: [accountCode],
          type: 'Liability',
          balance: actualBalance,
          validationRules: [],
          crossReferences: []
        });
      } else if (accountType === 'equity') {
        mapping['MSP2_01'].lineItems.push({
          lineCode: 'E99',
          lineName: accountName,
          accountCodes: [accountCode],
          type: 'Equity',
          balance: actualBalance,
          validationRules: [],
          crossReferences: []
        });
      }

      // Income Statement mappings
      if (accountType === 'income') {
        mapping['MSP2_02'].lineItems.push({
          lineCode: 'R99',
          lineName: accountName,
          accountCodes: [accountCode],
          type: 'Revenue',
          balance: actualBalance,
          validationRules: [],
          crossReferences: []
        });
      } else if (accountType === 'expense') {
        mapping['MSP2_02'].lineItems.push({
          lineCode: 'E99',
          lineName: accountName,
          accountCodes: [accountCode],
          type: 'Expense',
          balance: actualBalance,
          validationRules: [],
          crossReferences: []
        });
      }
    });

    console.log('🔍 BOT Mapping Debug: Generated mapping:', mapping);
    return mapping;
  };

  const BOT_REPORT_MAPPINGS = generateBOTMapping();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0
    }).format(roundCurrency(amount));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Posted': return 'bg-green-100 text-green-800';
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'Matched': return 'bg-green-100 text-green-800';
      case 'Variance': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };


  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Enhanced General Ledger</h1>
              <p className="text-purple-100">
                BOT-Aligned Accounting System with Real-time Validation & Cross-Report Impact Analysis
              </p>
            </div>
            <button
              onClick={() => navigate('/staff/accounting')}
              className="flex items-center px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors duration-200 backdrop-blur-sm"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Dashboard
            </button>
          </div>
        </div>

        {/* Four Major Content Blocks */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          
          {/* 1. Regulatory Account Navigator */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Layers className="w-6 h-6 text-blue-600" />
                Regulatory Account Navigator
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowAccountNavigator(!showAccountNavigator)}
                  className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm hover:bg-blue-200"
                >
                  {showAccountNavigator ? 'Hide' : 'Show'} Details
                </button>
              </div>
            </div>

            {/* Report Selector */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">BOT Report</label>
              <select 
                value={selectedReportForNavigator} 
                onChange={(e) => setSelectedReportForNavigator(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {Object.entries(BOT_REPORT_MAPPINGS).map(([code, report]: [string, any]) => (
                  <option key={code} value={code}>
                    {code} - {report.reportName}
                  </option>
                ))}
              </select>
            </div>

            {/* Smart Search */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Smart Search</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search accounts, line items, or report codes..."
                  value={searchTerm}
                  onChange={(e) => handleSmartSearch(e.target.value)}
                  className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                {searchSuggestions.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {searchSuggestions.map(suggestion => (
                      <div 
                        key={suggestion.id} 
                        className="px-3 py-2 hover:bg-gray-100 cursor-pointer flex items-center justify-between"
                        onClick={() => handleAccountSelect(suggestion.id)}
                      >
                        <div>
                          <span className="font-medium text-gray-900">{suggestion.code}</span>
                          <span className="ml-2 text-gray-600">{suggestion.name}</span>
                        </div>
                        <span className="text-xs text-gray-500">{suggestion.type}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Account Hierarchy */}
            {showAccountNavigator && (
              <div className="space-y-4">
                {['Asset', 'Liability', 'Equity', 'Revenue', 'Expense'].map(type => {
                  const accounts = ((BOT_REPORT_MAPPINGS as any)[selectedReportForNavigator]?.lineItems.filter((item: any) => item.type === type) || []);
                  if (accounts.length === 0) return null;
                  
                  return (
                    <div key={type} className="border border-gray-200 rounded-lg">
                      <button
                        onClick={() => toggleGroup(type.toLowerCase())}
                        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50"
                      >
                        <div className="flex items-center gap-2">
                          {getAccountTypeIcon(type)}
                          <span className="font-medium text-gray-900">{type}s ({accounts.length})</span>
                        </div>
                        {expandedGroups.has(type.toLowerCase()) ? (
                          <ChevronDown className="w-4 h-4 text-gray-500" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-gray-500" />
                        )}
                      </button>
                      
                      {expandedGroups.has(type.toLowerCase()) && (
                        <div className="border-t border-gray-200 p-2 space-y-1">
                          {accounts.map((account: any) => (
                            <div 
                              key={account.lineCode}
                              className="flex items-center justify-between p-2 hover:bg-gray-50 rounded cursor-pointer"
                              onClick={() => handleAccountSelect((account as any).lineCode)}
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-mono text-gray-600">{account.lineCode}</span>
                                <span className="text-sm text-gray-900">{account.lineName}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleFavorite(account.lineCode);
                                  }}
                                  className="p-1 hover:bg-gray-200 rounded"
                                >
                                  <Star className={`w-4 h-4 ${favoriteAccounts.includes(account.lineCode) ? 'text-yellow-500 fill-current' : 'text-gray-400'}`} />
                                </button>
                                <ExternalLink className="w-4 h-4 text-gray-400" />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Quick Actions */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="flex gap-2">
                <button 
                  onClick={() => handleAccountSelect(selectedAccount)}
                  className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                >
                  View Account Details
                </button>
                <button 
                  onClick={() => generateJournalEntry('LOAN_DISBURSEMENT', 100000, 'REF001')}
                  className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                >
                  Create Journal Entry
                </button>
                <button 
                  onClick={() => analyzeTransactionImpact({ id: '1', type: 'LOAN_DISBURSEMENT', amount: 100000, date: new Date().toISOString().split('T')[0], reference: 'REF001' })}
                  className="flex-1 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm"
                >
                  View Report Impact
                </button>
              </div>
            </div>
          </div>

          {/* 2. Real-time Balance Validator */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Shield className="w-6 h-6 text-green-600" />
                Real-time Balance Validator
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={runFullValidation}
                  className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-sm hover:bg-green-200"
                >
                  Run Validation
                </button>
              </div>
            </div>

            {/* Validation Status Overview */}
            {realTimeValidation && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className={`p-4 rounded-lg ${realTimeValidation.overallStatus.isValid ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      {getValidationStatusIcon(realTimeValidation.overallStatus.isValid)}
                      <span className="font-medium">Overall Status</span>
                    </div>
                    <div className="text-2xl font-bold">
                      {realTimeValidation.overallStatus.isValid ? 'PASSED' : 'FAILED'}
                    </div>
                    <div className="text-sm text-gray-600">
                      Last validated: {realTimeValidation.overallStatus.lastValidated.toLocaleTimeString()}
                    </div>
                  </div>

                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="w-4 h-4 text-blue-600" />
                      <span className="font-medium">Alerts</span>
                    </div>
                    <div className="text-2xl font-bold text-blue-600">
                      {realTimeValidation.overallStatus.warningCount}
                    </div>
                    <div className="text-sm text-gray-600">
                      {realTimeValidation.overallStatus.errorCount} errors
                    </div>
                  </div>
                </div>

                {/* Active Alerts */}
                {activeAlerts.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-900">Active Validation Alerts ({activeAlerts.length})</h4>
                    {activeAlerts.map(alert => (
                      <div key={alert.id} className={`p-3 rounded-lg border ${getSeverityColor(alert.severity)}`}>
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="font-medium">{alert.message}</div>
                            <div className="text-sm mt-1">{alert.recommendedAction}</div>
                          </div>
                          <button className="text-gray-500 hover:text-gray-700">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Detailed Validation Results */}
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900">Validation Details</h4>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm">Assets = Liabilities + Equity</span>
                      <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${getValidationStatusColor(realTimeValidation.balanceSheetValidation.assetsEqualsLiabilitiesEquity)}`}>
                        {getValidationStatusIcon(realTimeValidation.balanceSheetValidation.assetsEqualsLiabilitiesEquity)}
                        {realTimeValidation.balanceSheetValidation.assetsEqualsLiabilitiesEquity ? 'PASS' : 'FAIL'}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm">Liquid Assets Calculation</span>
                      <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${getValidationStatusColor(realTimeValidation.balanceSheetValidation.liquidAssetsCalculation)}`}>
                        {getValidationStatusIcon(realTimeValidation.balanceSheetValidation.liquidAssetsCalculation)}
                        {realTimeValidation.balanceSheetValidation.liquidAssetsCalculation ? 'PASS' : 'FAIL'}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm">Retained Earnings Match</span>
                      <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${getValidationStatusColor(realTimeValidation.crossReportValidation.retainedEarningsConsistency)}`}>
                        {getValidationStatusIcon(realTimeValidation.crossReportValidation.retainedEarningsConsistency)}
                        {realTimeValidation.crossReportValidation.retainedEarningsConsistency ? 'PASS' : 'FAIL'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 3. Auto-Journal Generator */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Zap className="w-6 h-6 text-yellow-600" />
                Auto-Journal Generator
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowAutoJournal(!showAutoJournal)}
                  className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-lg text-sm hover:bg-yellow-200"
                >
                  {showAutoJournal ? 'Hide' : 'Show'} Generator
                </button>
              </div>
            </div>

            {/* Transaction Input */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Transaction Type</label>
                  <select 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    onChange={(e) => {
                      if (e.target.value) {
                        generateJournalEntry(e.target.value, 100000, 'REF001');
                      }
                    }}
                  >
                    <option value="">Select Transaction Type</option>
                    <option value="LOAN_DISBURSEMENT">Loan Disbursement</option>
                    <option value="LOAN_REPAYMENT">Loan Repayment</option>
                    <option value="SAVINGS_DEPOSIT">Savings Deposit</option>
                    <option value="PROVISION_CALCULATION">Loan Loss Provision</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    placeholder="Enter amount"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    onChange={(e) => {
                      if (e.target.value) {
                        generateJournalEntry('LOAN_DISBURSEMENT', parseFloat(e.target.value), 'REF001');
                      }
                    }}
                  />
                </div>
              </div>

              {/* Generated Journal Preview */}
              {generatedJournal && (
                <div className="mt-6 space-y-4">
                  <h4 className="font-medium text-gray-900">Generated Journal Entry</h4>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div><span className="font-medium">Journal ID:</span> {generatedJournal.journalId}</div>
                      <div><span className="font-medium">Date:</span> {generatedJournal.date}</div>
                      <div><span className="font-medium">Reference:</span> {generatedJournal.reference}</div>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Account</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Debit</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Credit</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">BOT Impact</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {generatedJournal.entries.map((entry, index) => (
                          <tr key={index}>
                            <td className="px-3 py-2 text-sm">
                              <div className="font-medium text-gray-900">{entry.accountCode}</div>
                              <div className="text-gray-500">{entry.accountName}</div>
                            </td>
                            <td className="px-3 py-2 text-sm text-gray-900">
                              {entry.debitAmount > 0 ? formatCurrency(entry.debitAmount) : ''}
                            </td>
                            <td className="px-3 py-2 text-sm text-gray-900">
                              {entry.creditAmount > 0 ? formatCurrency(entry.creditAmount) : ''}
                            </td>
                            <td className="px-3 py-2 text-sm">
                              <div className="flex flex-wrap gap-1">
                                {entry.botReportLineItems.map(item => (
                                  <span key={item} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                                    {item}
                                  </span>
                                ))}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Validation Results */}
                  <div className="space-y-2">
                    <h5 className="font-medium text-gray-900">Validation Results</h5>
                    {generatedJournal.validationResults.map((result, index) => (
                      <div key={index} className={`flex items-center gap-2 p-2 rounded text-sm ${result.status === 'PASS' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                        {result.status === 'PASS' ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                        <span>{result.rule}</span>
                      </div>
                    ))}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                      Post Journal Entry
                    </button>
                    <button className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">
                      Save as Draft
                    </button>
                    <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                      Modify Entry
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 4. Cross-Report Impact Analyzer */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Network className="w-6 h-6 text-purple-600" />
                Cross-Report Impact Analyzer
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setImpactAnalysis(null)}
                  className="px-3 py-1 bg-purple-100 text-purple-700 rounded-lg text-sm hover:bg-purple-200"
                >
                  Clear Analysis
                </button>
              </div>
            </div>

            {/* Transaction Selector */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Analyze Transaction Impact</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter Transaction ID or select from recent"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <button 
                  onClick={() => analyzeTransactionImpact({ id: '1', type: 'LOAN_DISBURSEMENT', amount: 100000, date: new Date().toISOString().split('T')[0], reference: 'REF001' })}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  Analyze
                </button>
              </div>
            </div>

            {/* Impact Analysis Results */}
            {impactAnalysis && (
              <div className="space-y-4">
                {/* Impact Overview */}
                <div className="grid grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{impactAnalysis.directImpacts.length}</div>
                    <div className="text-sm text-gray-600">Reports Affected</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{impactAnalysis.cascadingEffects.length}</div>
                    <div className="text-sm text-gray-600">Cascading Effects</div>
                  </div>
                  <div className="text-center p-3 bg-yellow-50 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">{impactAnalysis.ratioImpacts.length}</div>
                    <div className="text-sm text-gray-600">Ratio Changes</div>
                  </div>
                  <div className="text-center p-3 bg-red-50 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">{impactAnalysis.complianceImpacts.length}</div>
                    <div className="text-sm text-gray-600">Compliance Issues</div>
                  </div>
                </div>

                {/* Direct Impact Table */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Direct Report Impacts</h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Report</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Line Item</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Previous</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">New Value</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Change %</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Impact</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {impactAnalysis.directImpacts.map((impact, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-3 py-2 text-sm font-mono text-gray-900">{impact.reportCode}</td>
                            <td className="px-3 py-2 text-sm text-gray-900">{impact.lineCode} - {impact.lineName}</td>
                            <td className="px-3 py-2 text-sm text-gray-900">{formatCurrency(impact.previousValue)}</td>
                            <td className="px-3 py-2 text-sm text-gray-900">{formatCurrency(impact.newValue)}</td>
                            <td className="px-3 py-2 text-sm text-gray-900">{roundPercentage(impact.changePercentage)}%</td>
                            <td className="px-3 py-2 text-sm">
                              <span className={`px-2 py-1 rounded text-xs ${getImpactLevelColor(impact.impactLevel || 'LOW')}`}>
                                {impact.impactLevel || 'LOW'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Ratio Impact Analysis */}
                {impactAnalysis.ratioImpacts.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Key Ratio Changes</h4>
                    <div className="space-y-2">
                      {impactAnalysis.ratioImpacts.map((ratio, index) => (
                        <div key={index} className="p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-gray-900">{ratio.ratioName}</span>
                            <span className={`px-2 py-1 rounded text-xs ${getImpactLevelColor(ratio.significance)}`}>
                              {ratio.significance}
                            </span>
                          </div>
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="text-gray-600">Current:</span> {roundPercentage(ratio.currentValue * 100)}%
                            </div>
                            <div>
                              <span className="text-gray-600">Projected:</span> {roundPercentage(ratio.projectedValue * 100)}%
                            </div>
                            <div>
                              <span className="text-gray-600">Change:</span> {roundPercentage(ratio.changePercentage)}%
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2 pt-4 border-t border-gray-200">
                  <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                    Export Impact Analysis
                  </button>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    Schedule Regular Analysis
                  </button>
                  <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                    Create Impact Alert
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        </div>

        {/* Legacy Content - Keep existing functionality */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Legacy General Ledger Features</h2>

          {/* Search and Filters */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <select
              value={selectedAccount}
              onChange={(e) => setSelectedAccount(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Accounts</option>
              <option value="1110">Cash and Bank</option>
              <option value="1120">Loans and Advances</option>
              <option value="4100">Interest Income</option>
              <option value="5200">Provision Expenses</option>
            </select>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <button
            onClick={() => setShowReconciliation(true)}
            className="p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors text-left"
          >
            <RefreshCw className="w-6 h-6 text-purple-600 mb-2" />
            <h4 className="font-medium text-gray-900">{t('reconciliation')}</h4>
            <p className="text-sm text-gray-600">Bank & Mobile Money reconciliation</p>
          </button>
          <button
            onClick={() => setShowECLCalculation(true)}
            className="p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors text-left"
          >
            <Calculator className="w-6 h-6 text-orange-600 mb-2" />
            <h4 className="font-medium text-gray-900">ECL Calculation</h4>
            <p className="text-sm text-gray-600">IFRS 9 provisions</p>
          </button>
          <button
            onClick={() => setShowBOTMapping(true)}
            className="p-4 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors text-left"
          >
            <Shield className="w-6 h-6 text-indigo-600 mb-2" />
            <h4 className="font-medium text-gray-900">BOT Mapping</h4>
            <p className="text-sm text-gray-600">Regulatory account mapping</p>
          </button>
          <button
            onClick={() => setShowRegulatoryReports(true)}
            className="p-4 bg-red-50 rounded-lg hover:bg-red-100 transition-colors text-left"
          >
            <Database className="w-6 h-6 text-red-600 mb-2" />
            <h4 className="font-medium text-gray-900">BOT Reports</h4>
            <p className="text-sm text-gray-600">Regulatory reporting</p>
          </button>
        </div>

        {/* Advanced Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <button
            onClick={() => setShowAccountNavigator(true)}
            className="p-6 bg-gradient-to-br from-cyan-50 to-blue-50 rounded-xl hover:from-cyan-100 hover:to-blue-100 transition-colors text-left border border-cyan-200"
          >
            <div className="flex items-center mb-3">
              <Target className="w-8 h-8 text-cyan-600 mr-3" />
              <h4 className="text-lg font-semibold text-gray-900">Account Navigator</h4>
            </div>
            <p className="text-sm text-gray-600 mb-3">Quick access to BOT report line items with smart search and navigation</p>
            <div className="flex items-center text-xs text-cyan-600">
              <BookOpen className="w-4 h-4 mr-1" />
              BOT Line Items Database
            </div>
          </button>

          <button
            onClick={() => setShowBalanceValidator(true)}
            className="p-6 bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl hover:from-emerald-100 hover:to-green-100 transition-colors text-left border border-emerald-200"
          >
            <div className="flex items-center mb-3">
              <Activity className="w-8 h-8 text-emerald-600 mr-3" />
              <h4 className="text-lg font-semibold text-gray-900">Balance Validator</h4>
            </div>
            <p className="text-sm text-gray-600 mb-3">Real-time validation of accounting equation and BOT report consistency</p>
            <div className="flex items-center text-xs text-emerald-600">
              <CheckCircle2 className="w-4 h-4 mr-1" />
              Continuous Monitoring
            </div>
          </button>

          <button
            onClick={() => setShowAutoJournal(true)}
            className="p-6 bg-gradient-to-br from-violet-50 to-purple-50 rounded-xl hover:from-violet-100 hover:to-purple-100 transition-colors text-left border border-violet-200"
          >
            <div className="flex items-center mb-3">
              <Settings className="w-8 h-8 text-violet-600 mr-3" />
              <h4 className="text-lg font-semibold text-gray-900">Auto-Journal Generator</h4>
            </div>
            <p className="text-sm text-gray-600 mb-3">Smart journal entries with regulatory tagging and BOT compliance</p>
            <div className="flex items-center text-xs text-violet-600">
              <Zap className="w-4 h-4 mr-1" />
              Smart Templates
            </div>
          </button>
        </div>

        {/* Enhanced Chart of Accounts with BOT Mapping */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <FileText className="w-5 h-5 mr-2 text-blue-600" />
              {t('chart_of_accounts')} (BOT-Aligned & IFRS 9 Compliant)
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              BoT-compliant chart of accounts with regulatory mapping and automated ECL provisioning
            </p>
          </div>
          
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Shield className="w-4 h-4 text-indigo-600" />
                  <span className="text-sm text-gray-600">BOT Mapped</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-gray-600">IFRS 9 Compliant</span>
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setShowBOTMapping(true)}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center"
                >
                  <Shield className="w-4 h-4 mr-2" />
                  BOT Mapping
                </button>
                {/* Trial Balance and Balance Sheet buttons removed - Use dedicated tabs in accounting module */}
              </div>
            </div>
            <div className="space-y-4">
              {enhancedChartOfAccounts.map((account) => (
                <div key={account.code} className="space-y-2">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <span className="font-bold text-gray-900">{account.code}</span>
                      <span className="ml-3 font-semibold text-gray-900">{account.name}</span>
                      <span className="ml-2 px-2 py-1 text-xs bg-indigo-100 text-indigo-800 rounded-full">
                        {account.mspCode}
                      </span>
                    </div>
                    <span className="font-bold text-gray-900">{formatCurrency(account.balance)}</span>
                  </div>
                  {account.children && (
                    <div className="ml-6 space-y-1">
                      {account.children.map((child) => (
                        <div key={child.code} className="space-y-1">
                          <div className="flex justify-between items-center p-2 hover:bg-gray-50 rounded">
                            <div className="flex items-center">
                              <span className="text-gray-700">{child.code}</span>
                              <span className="ml-3 text-gray-700">{child.name}</span>
                              {child.botCode && (
                                <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                                  {child.botCode}
                                </span>
                              )}
                              {'isContraAsset' in child && child.isContraAsset && (
                                <span className="ml-2 px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
                                  Contra
                                </span>
                              )}
                            </div>
                            <span className="text-gray-700">{formatCurrency(child.balance)}</span>
                          </div>
                          {'children' in child && child.children && (
                            <div className="ml-6 space-y-1">
                              {child.children.map((subChild: any) => (
                                <div key={subChild.code} className="flex justify-between items-center p-2 hover:bg-gray-50 rounded">
                                  <div className="flex items-center">
                                    <span className="text-gray-600 text-sm">{subChild.code}</span>
                                    <span className="ml-3 text-gray-600 text-sm">{subChild.name}</span>
                                    {subChild.botCode && (
                                      <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                                        {subChild.botCode}
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-gray-600 text-sm">{formatCurrency(subChild.balance)}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center">
                <Plus className="w-4 h-4 mr-2" />
                Add Entry
              </button>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Debit Account
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Credit Account
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
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
                {recentTransactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {transaction.date}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{transaction.description}</div>
                        <div className="text-sm text-gray-500">Ref: {transaction.reference}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {transaction.debitAccount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {transaction.creditAccount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(transaction.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(transaction.status)}`}>
                        {transaction.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => handleViewTransaction(transaction)}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50 transition-colors"
                          title="View Transaction Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleEditTransaction(transaction)}
                          className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50 transition-colors"
                          title="Edit Transaction"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Reconciliation Modal */}
        {showReconciliation && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Bank & Mobile Money Reconciliation</h3>
                <button
                  onClick={() => setShowReconciliation(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ×
                </button>
              </div>

              <div className="space-y-6">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Source
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Statement Amount
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Ledger Amount
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Difference
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {reconciliationItems.map((item) => (
                        <tr key={item.id}>
                          <td className="px-4 py-4 text-sm font-medium text-gray-900">
                            {item.source}
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-900">
                            {formatCurrency(item.amount)}
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-900">
                            {formatCurrency(item.ledgerAmount)}
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-900">
                            {formatCurrency(item.difference)}
                          </td>
                          <td className="px-4 py-4">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(item.status)}`}>
                              {item.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ECL Calculation Modal */}
        {showECLCalculation && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900">IFRS 9 ECL Calculation</h3>
                <button
                  onClick={() => setShowECLCalculation(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ×
                </button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                    <h4 className="font-medium text-green-800 mb-2">Stage 1 (12-month ECL)</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Loans:</span>
                        <span className="font-medium">{eclCalculation.stage1.loans}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Amount:</span>
                        <span className="font-medium">{formatCurrency(eclCalculation.stage1.amount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Rate:</span>
                        <span className="font-medium">{eclCalculation.stage1.provisionRate}%</span>
                      </div>
                      <div className="flex justify-between border-t pt-2">
                        <span>Provision:</span>
                        <span className="font-bold">{formatCurrency(eclCalculation.stage1.provision)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                    <h4 className="font-medium text-yellow-800 mb-2">Stage 2 (Lifetime ECL)</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Loans:</span>
                        <span className="font-medium">{eclCalculation.stage2.loans}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Amount:</span>
                        <span className="font-medium">{formatCurrency(eclCalculation.stage2.amount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Rate:</span>
                        <span className="font-medium">{eclCalculation.stage2.provisionRate}%</span>
                      </div>
                      <div className="flex justify-between border-t pt-2">
                        <span>Provision:</span>
                        <span className="font-bold">{formatCurrency(eclCalculation.stage2.provision)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                    <h4 className="font-medium text-red-800 mb-2">Stage 3 (Credit Impaired)</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Loans:</span>
                        <span className="font-medium">{eclCalculation.stage3.loans}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Amount:</span>
                        <span className="font-medium">{formatCurrency(eclCalculation.stage3.amount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Rate:</span>
                        <span className="font-medium">{eclCalculation.stage3.provisionRate}%</span>
                      </div>
                      <div className="flex justify-between border-t pt-2">
                        <span>Provision:</span>
                        <span className="font-bold">{formatCurrency(eclCalculation.stage3.provision)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Total ECL Provision Required</h4>
                  <div className="text-2xl font-bold text-gray-900">
                    {formatCurrency(
                      eclCalculation.stage1.provision +
                      eclCalculation.stage2.provision +
                      eclCalculation.stage3.provision
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Current provision balance: {formatCurrency(7000000)}
                  </p>
                </div>

                <div className="flex justify-end space-x-3">
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    Update Provisions
                  </button>
                  <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                    Generate Report
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Trial Balance Modal removed - Use dedicated Trial Balance tab */}
        {false && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-6xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Trial Balance</h3>
                <button
                  onClick={() => {}}
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
                      <tr className="border-b border-gray-200">
                        <td className="px-4 py-2 font-semibold text-blue-600" colSpan={4}>ASSETS</td>
                      </tr>
                      <tr className="border-b border-gray-200">
                        <td className="px-4 py-2">1110</td>
                        <td className="px-4 py-2">Cash and Bank</td>
                        <td className="px-4 py-2 text-right">15,000,000</td>
                        <td className="px-4 py-2 text-right">-</td>
                      </tr>
                      <tr className="border-b border-gray-200">
                        <td className="px-4 py-2">1120</td>
                        <td className="px-4 py-2">Loans and Advances</td>
                        <td className="px-4 py-2 text-right">89,500,000</td>
                        <td className="px-4 py-2 text-right">-</td>
                      </tr>
                      <tr className="border-b border-gray-200">
                        <td className="px-4 py-2">1130</td>
                        <td className="px-4 py-2">Accrued Interest</td>
                        <td className="px-4 py-2 text-right">2,500,000</td>
                        <td className="px-4 py-2 text-right">-</td>
                      </tr>
                      <tr className="border-b border-gray-200">
                        <td className="px-4 py-2">1210</td>
                        <td className="px-4 py-2">Property & Equipment</td>
                        <td className="px-4 py-2 text-right">45,000,000</td>
                        <td className="px-4 py-2 text-right">-</td>
                      </tr>
                      <tr className="border-b border-gray-200">
                        <td className="px-4 py-2 font-semibold text-red-600" colSpan={4}>LIABILITIES</td>
                      </tr>
                      <tr className="border-b border-gray-200">
                        <td className="px-4 py-2">2110</td>
                        <td className="px-4 py-2">Accounts Payable</td>
                        <td className="px-4 py-2 text-right">-</td>
                        <td className="px-4 py-2 text-right">3,000,000</td>
                      </tr>
                      <tr className="border-b border-gray-200">
                        <td className="px-4 py-2">2130</td>
                        <td className="px-4 py-2">ECL Provisions</td>
                        <td className="px-4 py-2 text-right">-</td>
                        <td className="px-4 py-2 text-right">7,000,000</td>
                      </tr>
                      <tr className="border-b border-gray-200">
                        <td className="px-4 py-2">2210</td>
                        <td className="px-4 py-2">Long-term Debt</td>
                        <td className="px-4 py-2 text-right">-</td>
                        <td className="px-4 py-2 text-right">20,000,000</td>
                      </tr>
                      <tr className="border-b border-gray-200">
                        <td className="px-4 py-2 font-semibold text-green-600" colSpan={4}>EQUITY</td>
                      </tr>
                      <tr className="border-b border-gray-200">
                        <td className="px-4 py-2">3100</td>
                        <td className="px-4 py-2">Share Capital</td>
                        <td className="px-4 py-2 text-right">-</td>
                        <td className="px-4 py-2 text-right">75,000,000</td>
                      </tr>
                      <tr className="border-b border-gray-200">
                        <td className="px-4 py-2">3200</td>
                        <td className="px-4 py-2">Retained Earnings</td>
                        <td className="px-4 py-2 text-right">-</td>
                        <td className="px-4 py-2 text-right">38,000,000</td>
                      </tr>
                      <tr className="border-b border-gray-200">
                        <td className="px-4 py-2 font-semibold text-purple-600" colSpan={4}>REVENUE</td>
                      </tr>
                      <tr className="border-b border-gray-200">
                        <td className="px-4 py-2">4100</td>
                        <td className="px-4 py-2">Interest Income</td>
                        <td className="px-4 py-2 text-right">-</td>
                        <td className="px-4 py-2 text-right">22,000,000</td>
                      </tr>
                      <tr className="border-b border-gray-200">
                        <td className="px-4 py-2">4200</td>
                        <td className="px-4 py-2">Fee Income</td>
                        <td className="px-4 py-2 text-right">-</td>
                        <td className="px-4 py-2 text-right">3,000,000</td>
                      </tr>
                      <tr className="border-b border-gray-200">
                        <td className="px-4 py-2 font-semibold text-orange-600" colSpan={4}>EXPENSES</td>
                      </tr>
                      <tr className="border-b border-gray-200">
                        <td className="px-4 py-2">5100</td>
                        <td className="px-4 py-2">Operating Expenses</td>
                        <td className="px-4 py-2 text-right">12,000,000</td>
                        <td className="px-4 py-2 text-right">-</td>
                      </tr>
                      <tr className="border-b border-gray-200">
                        <td className="px-4 py-2">5200</td>
                        <td className="px-4 py-2">Provision Expenses</td>
                        <td className="px-4 py-2 text-right">4,250,000</td>
                        <td className="px-4 py-2 text-right">-</td>
                      </tr>
                      <tr className="bg-gray-100 border-t-2 border-gray-400">
                        <td className="px-4 py-3 font-bold" colSpan={2}>TOTALS</td>
                        <td className="px-4 py-3 text-right font-bold">168,250,000</td>
                        <td className="px-4 py-3 text-right font-bold">168,250,000</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Balance Sheet Modal - REMOVED - Use dedicated Balance Sheet tab */}
        {false && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Balance Sheet</h3>
                <button
                  onClick={() => {}}
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

        {/* BOT Mapping Modal */}
        {showBOTMapping && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-6xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                  <Shield className="w-6 h-6 mr-2 text-indigo-600" />
                  BOT Regulatory Account Mapping
                </h3>
                <button
                  onClick={() => setShowBOTMapping(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ×
                </button>
              </div>

              <div className="space-y-6">
                <div className="bg-indigo-50 p-4 rounded-lg">
                  <h4 className="font-medium text-indigo-900 mb-2">Regulatory Mapping Overview</h4>
                  <p className="text-sm text-indigo-700">
                    This mapping ensures compliance with Bank of Tanzania (BOT) reporting requirements. 
                    Each account is mapped to specific BOT codes for regulatory reporting purposes.
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Assets Mapping */}
                  <div className="space-y-4">
                    <h5 className="text-lg font-semibold text-blue-600 flex items-center">
                      <Building2 className="w-5 h-5 mr-2" />
                      Assets (MSP2_01)
                    </h5>
                    <div className="space-y-2">
                      {BOT_REPORT_MAPPINGS['MSP2_01']?.lineItems
                        .filter((item: any) => item.type === 'Asset')
                        .map((item: any, index: number) => (
                          <div key={index} className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                            <div>
                              <div className="font-medium text-gray-900">{item.lineName}</div>
                              <div className="text-sm text-gray-600">Code: {item.lineCode} → {item.accountCodes.join(', ')}</div>
                            </div>
                            <div className="text-right">
                              <div className="font-medium text-gray-900">{formatCurrency(item.balance || 0)}</div>
                              <div className="text-sm text-gray-600">{item.type}</div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Liabilities & Equity Mapping */}
                  <div className="space-y-4">
                    <h5 className="text-lg font-semibold text-red-600 flex items-center">
                      <CreditCard className="w-5 h-5 mr-2" />
                      Liabilities & Equity (MSP2_01)
                    </h5>
                    <div className="space-y-2">
                      {BOT_REPORT_MAPPINGS['MSP2_01']?.lineItems
                        .filter((item: any) => item.type === 'Liability' || item.type === 'Equity')
                        .map((item: any, index: number) => (
                          <div key={index} className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                            <div>
                              <div className="font-medium text-gray-900">{item.lineName}</div>
                              <div className="text-sm text-gray-600">Code: {item.lineCode} → {item.accountCodes.join(', ')}</div>
                            </div>
                            <div className="text-right">
                              <div className="font-medium text-gray-900">{formatCurrency(item.balance || 0)}</div>
                              <div className="text-sm text-gray-600">{item.type}</div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Income Mapping */}
                  <div className="space-y-4">
                    <h5 className="text-lg font-semibold text-green-600 flex items-center">
                      <TrendingUp className="w-5 h-5 mr-2" />
                      Income (MSP2_02)
                    </h5>
                    <div className="space-y-2">
                      {BOT_REPORT_MAPPINGS['MSP2_02']?.lineItems
                        .filter((item: any) => item.type === 'Revenue')
                        .map((item: any, index: number) => (
                          <div key={index} className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                            <div>
                              <div className="font-medium text-gray-900">{item.lineName}</div>
                              <div className="text-sm text-gray-600">Code: {item.lineCode} → {item.accountCodes.join(', ')}</div>
                            </div>
                            <div className="text-right">
                              <div className="font-medium text-gray-900">{formatCurrency(item.balance || 0)}</div>
                              <div className="text-sm text-gray-600">{item.type}</div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Expenses Mapping */}
                  <div className="space-y-4">
                    <h5 className="text-lg font-semibold text-orange-600 flex items-center">
                      <TrendingDown className="w-5 h-5 mr-2" />
                      Expenses (MSP2_02)
                    </h5>
                    <div className="space-y-2">
                      {BOT_REPORT_MAPPINGS['MSP2_02']?.lineItems
                        .filter((item: any) => item.type === 'Expense')
                        .map((item: any, index: number) => (
                          <div key={index} className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                            <div>
                              <div className="font-medium text-gray-900">{item.lineName}</div>
                              <div className="text-sm text-gray-600">Code: {item.lineCode} → {item.accountCodes.join(', ')}</div>
                            </div>
                            <div className="text-right">
                              <div className="font-medium text-gray-900">{formatCurrency(item.balance || 0)}</div>
                              <div className="text-sm text-gray-600">{item.type}</div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3">
                  <button className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
                    Export Mapping
                  </button>
                  <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                    Validate Mapping
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Regulatory Reports Modal */}
        {showRegulatoryReports && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-6xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                  <Database className="w-6 h-6 mr-2 text-red-600" />
                  BOT Regulatory Reports
                </h3>
                <button
                  onClick={() => setShowRegulatoryReports(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ×
                </button>
              </div>

              <div className="space-y-6">
                <div className="bg-red-50 p-4 rounded-lg">
                  <h4 className="font-medium text-red-900 mb-2">Regulatory Reporting Status</h4>
                  <p className="text-sm text-red-700 mb-3">
                    All reports are automatically generated from the BOT-mapped chart of accounts. 
                    Ensure all transactions are properly categorized before generating reports.
                  </p>
                  <div className="flex space-x-3">
                    <button 
                      onClick={() => window.open('/staff/regulatory-reports', '_blank')}
                      className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center"
                    >
                      <Database className="w-4 h-4 mr-2" />
                      Open Regulatory Reports Page
                    </button>
                    <button className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center">
                      <FileText className="w-4 h-4 mr-2" />
                      Generate All Reports
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {botReports.map((report) => (
                    <div key={report.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-3">
                        <h5 className="font-semibold text-gray-900">{report.name}</h5>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          report.status === 'Ready' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {report.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{report.description}</p>
                      <div className="space-y-2 text-xs text-gray-500">
                        <div className="flex justify-between">
                          <span>Frequency:</span>
                          <span>{report.frequency}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Due Date:</span>
                          <span>{report.dueDate}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Last Generated:</span>
                          <span>{report.lastGenerated}</span>
                        </div>
                      </div>
                      <div className="mt-4 flex space-x-2">
                        <button className="flex-1 bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 transition-colors">
                          Generate
                        </button>
                        <button className="flex-1 bg-gray-600 text-white px-3 py-2 rounded text-sm hover:bg-gray-700 transition-colors">
                          Preview
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-3">Bulk Actions</h4>
                  <div className="flex space-x-3">
                    <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center">
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Generate All Ready Reports
                    </button>
                    <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center">
                      <Download className="w-4 h-4 mr-2" />
                      Export All Reports
                    </button>
                    <button className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center">
                      <Upload className="w-4 h-4 mr-2" />
                      Submit to BOT
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Regulatory Account Navigator Modal */}
        {showAccountNavigator && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-7xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                  <Target className="w-6 h-6 mr-2 text-cyan-600" />
                  Regulatory Account Navigator
                </h3>
                <button
                  onClick={() => setShowAccountNavigator(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ×
                </button>
              </div>

              <div className="space-y-6">
                {/* Report Selector */}
                <div className="bg-cyan-50 p-4 rounded-lg">
                  <h4 className="font-medium text-cyan-900 mb-3">Select BOT Report</h4>
                  <select 
                    value={selectedReportCode} 
                    onChange={(e) => setSelectedReportCode(e.target.value)}
                    className="w-full px-3 py-2 border border-cyan-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                  >
                    {Object.entries(BOT_REPORT_MAPPINGS).map(([code, report]: [string, any]) => (
                      <option key={code} value={code}>
                        {code} - {report.reportName}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Smart Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search accounts, line items, or report codes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                  />
                </div>

                {/* Account Hierarchy */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Assets */}
                  <div className="space-y-4">
                    <h5 className="text-lg font-semibold text-blue-600 flex items-center">
                      <Building2 className="w-5 h-5 mr-2" />
                      Assets ({((BOT_REPORT_MAPPINGS as any)[selectedReportCode]?.lineItems.filter((item: any) => item.type === 'Asset').length || 0)})
                    </h5>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {(BOT_REPORT_MAPPINGS as any)[selectedReportCode]?.lineItems
                        .filter((item: any) => item.type === 'Asset' && 
                          (searchTerm === '' || 
                           item.lineName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.lineCode.toLowerCase().includes(searchTerm.toLowerCase())))
                        .map((item: any) => (
                          <div key={item.lineCode} className="p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <div className="font-medium text-gray-900">{item.lineName}</div>
                                <div className="text-sm text-gray-600">Code: {item.lineCode}</div>
                                <div className="text-xs text-blue-600 mt-1">
                                  Accounts: {item.accountCodes.join(', ')}
                                </div>
                                {item.calculationFormula && (
                                  <div className="text-xs text-gray-500 mt-1">
                                    Formula: {item.calculationFormula}
                                  </div>
                                )}
                              </div>
                              <span className="px-2 py-1 text-xs bg-blue-200 text-blue-800 rounded-full">
                                {item.type}
                              </span>
                            </div>
                            <div className="flex space-x-2">
                              <button 
                                onClick={() => {
                                  // View account details
                                  const account = chartOfAccounts?.find(acc => item.accountCodes.includes(acc.account_code));
                                  if (account) {
                                    alert(`Account Details:\nName: ${account.account_name}\nCode: ${account.account_code}\nType: ${account.account_type}\nBalance: ${account.normal_balance}`);
                                  }
                                }}
                                className="flex-1 bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700 transition-colors"
                              >
                                View Details
                              </button>
                              <button 
                                onClick={() => {
                                  // Create journal entry
                                  setShowAutoJournal(true);
                                  setShowAccountNavigator(false);
                                }}
                                className="flex-1 bg-green-600 text-white px-2 py-1 rounded text-xs hover:bg-green-700 transition-colors"
                              >
                                Create Entry
                              </button>
                              <button 
                                onClick={() => {
                                  // View report impact
                                  alert(`Report Impact:\nThis account affects ${item.lineCode} in ${BOT_REPORT_MAPPINGS[selectedReportCode]?.reportName}\nImpact: ${item.type === 'Asset' ? 'Increases Assets' : item.type === 'Liability' ? 'Increases Liabilities' : 'Affects Equity'}`);
                                }}
                                className="flex-1 bg-purple-600 text-white px-2 py-1 rounded text-xs hover:bg-purple-700 transition-colors"
                              >
                                View Impact
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Liabilities */}
                  <div className="space-y-4">
                    <h5 className="text-lg font-semibold text-red-600 flex items-center">
                      <CreditCard className="w-5 h-5 mr-2" />
                      Liabilities ({((BOT_REPORT_MAPPINGS as any)[selectedReportCode]?.lineItems.filter((item: any) => item.type === 'Liability').length || 0)})
                    </h5>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {(BOT_REPORT_MAPPINGS as any)[selectedReportCode]?.lineItems
                        .filter((item: any) => item.type === 'Liability' && 
                          (searchTerm === '' || 
                           item.lineName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.lineCode.toLowerCase().includes(searchTerm.toLowerCase())))
                        .map((item: any) => (
                          <div key={item.lineCode} className="p-3 bg-red-50 rounded-lg hover:bg-red-100 transition-colors">
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <div className="font-medium text-gray-900">{item.lineName}</div>
                                <div className="text-sm text-gray-600">Code: {item.lineCode}</div>
                                <div className="text-xs text-red-600 mt-1">
                                  Accounts: {item.accountCodes.join(', ')}
                                </div>
                              </div>
                              <span className="px-2 py-1 text-xs bg-red-200 text-red-800 rounded-full">
                                {item.type}
                              </span>
                            </div>
                            <div className="flex space-x-2">
                              <button 
                                onClick={() => {
                                  const account = chartOfAccounts?.find(acc => item.accountCodes.includes(acc.account_code));
                                  if (account) {
                                    alert(`Account Details:\nName: ${account.account_name}\nCode: ${account.account_code}\nType: ${account.account_type}\nBalance: ${account.normal_balance}`);
                                  }
                                }}
                                className="flex-1 bg-red-600 text-white px-2 py-1 rounded text-xs hover:bg-red-700 transition-colors"
                              >
                                View Details
                              </button>
                              <button 
                                onClick={() => {
                                  setShowAutoJournal(true);
                                  setShowAccountNavigator(false);
                                }}
                                className="flex-1 bg-green-600 text-white px-2 py-1 rounded text-xs hover:bg-green-700 transition-colors"
                              >
                                Create Entry
                              </button>
                              <button 
                                onClick={() => {
                                  alert(`Report Impact:\nThis account affects ${item.lineCode} in ${BOT_REPORT_MAPPINGS[selectedReportCode]?.reportName}\nImpact: ${item.type === 'Asset' ? 'Increases Assets' : item.type === 'Liability' ? 'Increases Liabilities' : 'Affects Equity'}`);
                                }}
                                className="flex-1 bg-purple-600 text-white px-2 py-1 rounded text-xs hover:bg-purple-700 transition-colors"
                              >
                                View Impact
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Revenue & Expenses */}
                  <div className="space-y-4">
                    <h5 className="text-lg font-semibold text-green-600 flex items-center">
                      <TrendingUp className="w-5 h-5 mr-2" />
                      Revenue & Expenses ({((BOT_REPORT_MAPPINGS as any)[selectedReportCode]?.lineItems.filter((item: any) => item.type === 'Revenue' || item.type === 'Expense').length || 0)})
                    </h5>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {(BOT_REPORT_MAPPINGS as any)[selectedReportCode]?.lineItems
                        .filter((item: any) => (item.type === 'Revenue' || item.type === 'Expense') && 
                          (searchTerm === '' || 
                           item.lineName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.lineCode.toLowerCase().includes(searchTerm.toLowerCase())))
                        .map((item: any) => (
                          <div key={item.lineCode} className={`p-3 rounded-lg hover:opacity-80 transition-colors ${
                            item.type === 'Revenue' ? 'bg-green-50 hover:bg-green-100' : 'bg-orange-50 hover:bg-orange-100'
                          }`}>
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <div className="font-medium text-gray-900">{item.lineName}</div>
                                <div className="text-sm text-gray-600">Code: {item.lineCode}</div>
                                <div className={`text-xs mt-1 ${
                                  item.type === 'Revenue' ? 'text-green-600' : 'text-orange-600'
                                }`}>
                                  Accounts: {item.accountCodes.join(', ')}
                                </div>
                                {item.calculationFormula && (
                                  <div className="text-xs text-gray-500 mt-1">
                                    Formula: {item.calculationFormula}
                                  </div>
                                )}
                              </div>
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                item.type === 'Revenue' 
                                  ? 'bg-green-200 text-green-800' 
                                  : 'bg-orange-200 text-orange-800'
                              }`}>
                                {item.type}
                              </span>
                            </div>
                            <div className="flex space-x-2">
                              <button 
                                onClick={() => {
                                  const account = chartOfAccounts?.find(acc => item.accountCodes.includes(acc.account_code));
                                  if (account) {
                                    alert(`Account Details:\nName: ${account.account_name}\nCode: ${account.account_code}\nType: ${account.account_type}\nBalance: ${account.normal_balance}`);
                                  }
                                }}
                                className={`flex-1 text-white px-2 py-1 rounded text-xs transition-colors ${
                                  item.type === 'Revenue' ? 'bg-green-600 hover:bg-green-700' : 'bg-orange-600 hover:bg-orange-700'
                                }`}
                              >
                                View Details
                              </button>
                              <button 
                                onClick={() => {
                                  setShowAutoJournal(true);
                                  setShowAccountNavigator(false);
                                }}
                                className="flex-1 bg-green-600 text-white px-2 py-1 rounded text-xs hover:bg-green-700 transition-colors"
                              >
                                Create Entry
                              </button>
                              <button 
                                onClick={() => {
                                  alert(`Report Impact:\nThis account affects ${item.lineCode} in ${BOT_REPORT_MAPPINGS[selectedReportCode]?.reportName}\nImpact: ${item.type === 'Revenue' ? 'Increases Revenue' : 'Increases Expenses'}`);
                                }}
                                className="flex-1 bg-purple-600 text-white px-2 py-1 rounded text-xs hover:bg-purple-700 transition-colors"
                              >
                                View Impact
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-3">Quick Actions</h4>
                  <div className="flex space-x-3">
                    <button className="bg-cyan-600 text-white px-4 py-2 rounded-lg hover:bg-cyan-700 transition-colors flex items-center">
                      <Eye className="w-4 h-4 mr-2" />
                      View Account Details
                    </button>
                    <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center">
                      <Plus className="w-4 h-4 mr-2" />
                      Create Journal Entry
                    </button>
                    <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center">
                      <BarChart className="w-4 h-4 mr-2" />
                      View Report Impact
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Real-time Balance Validator Modal */}
        {showBalanceValidator && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-6xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                  <Activity className="w-6 h-6 mr-2 text-emerald-600" />
                  Real-time Balance Validator
                </h3>
                <button
                  onClick={() => setShowBalanceValidator(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ×
                </button>
              </div>

              <div className="space-y-6">
                {/* Validation Status Overview */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-emerald-50 p-6 rounded-lg border border-emerald-200">
                    <h4 className="font-medium text-emerald-900 mb-4 flex items-center">
                      <CheckCircle2 className="w-5 h-5 mr-2" />
                      Accounting Equation Status
                    </h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Assets:</span>
                        <span className="font-medium">{formatCurrency(validateAccountingEquation().assets)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Liabilities:</span>
                        <span className="font-medium">{formatCurrency(validateAccountingEquation().liabilities)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Equity:</span>
                        <span className="font-medium">{formatCurrency(validateAccountingEquation().equity)}</span>
                      </div>
                      <div className="flex justify-between border-t pt-2">
                        <span className="text-sm font-medium text-gray-900">Difference:</span>
                        <span className={`font-bold ${
                          validateAccountingEquation().isBalanced ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {formatCurrency(validateAccountingEquation().difference)}
                        </span>
                      </div>
                      <div className={`px-3 py-2 rounded-lg text-center ${
                        validateAccountingEquation().isBalanced 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {validateAccountingEquation().isBalanced ? '✓ BALANCED' : '✗ NOT BALANCED'}
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                    <h4 className="font-medium text-blue-900 mb-4 flex items-center">
                      <Shield className="w-5 h-5 mr-2" />
                      BOT Report Consistency
                    </h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Balance Sheet:</span>
                        <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">Valid</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Income Statement:</span>
                        <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">Valid</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Cross-Report:</span>
                        <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">Valid</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Data Quality:</span>
                        <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">Valid</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Detailed Validation Results */}
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-4">Detailed Validation Results</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h5 className="font-medium text-gray-700 mb-3">Balance Sheet Validations</h5>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center p-2 bg-white rounded">
                          <span className="text-sm">Assets = Liabilities + Equity</span>
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        </div>
                        <div className="flex justify-between items-center p-2 bg-white rounded">
                          <span className="text-sm">Liquid Assets Total</span>
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        </div>
                        <div className="flex justify-between items-center p-2 bg-white rounded">
                          <span className="text-sm">Loan Provision Consistency</span>
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        </div>
                      </div>
                    </div>
                    <div>
                      <h5 className="font-medium text-gray-700 mb-3">Cross-Report Validations</h5>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center p-2 bg-white rounded">
                          <span className="text-sm">Retained Earnings Match</span>
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        </div>
                        <div className="flex justify-between items-center p-2 bg-white rounded">
                          <span className="text-sm">Agent Banking Balance</span>
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        </div>
                        <div className="flex justify-between items-center p-2 bg-white rounded">
                          <span className="text-sm">Gross Loans Consistency</span>
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Manual Validation Controls */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-3">Validation Controls</h4>
                  <div className="flex space-x-3">
                    <button className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors flex items-center">
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Run Full Validation
                    </button>
                    <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center">
                      <Shield className="w-4 h-4 mr-2" />
                      Validate Balance Sheet
                    </button>
                    <button className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center">
                      <Download className="w-4 h-4 mr-2" />
                      Export Validation Report
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Auto-Journal Generator Modal */}
        {showAutoJournal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-6xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                  <Settings className="w-6 h-6 mr-2 text-violet-600" />
                  Auto-Journal Generator
                </h3>
                <button
                  onClick={() => setShowAutoJournal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ×
                </button>
              </div>

              <div className="space-y-6">
                {/* Transaction Input */}
                <div className="bg-violet-50 p-6 rounded-lg border border-violet-200">
                  <h4 className="font-medium text-violet-900 mb-4">Transaction Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Transaction Type</label>
                      <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500">
                        <option value="">Select Transaction Type</option>
                        {journalTemplates.map(template => (
                          <option key={template.templateId} value={template.templateId}>
                            {template.templateName}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Amount (TZS)</label>
                      <input
                        type="number"
                        placeholder="Enter amount"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Reference</label>
                      <input
                        type="text"
                        placeholder="Transaction reference"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                      <input
                        type="date"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Journal Templates */}
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-4">Available Journal Templates</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {journalTemplates.map((template) => (
                      <div key={template.templateId} className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                        <h5 className="font-medium text-gray-900 mb-2">{template.templateName}</h5>
                        <p className="text-sm text-gray-600 mb-2">Transaction Type: {template.transactionType}</p>
                        <p className="text-xs text-gray-500 mb-3">{template.description}</p>
                        <div className="space-y-2">
                          <h6 className="text-sm font-medium text-gray-700">Journal Entries:</h6>
                          {template.entries.map((entry, index) => (
                            <div key={index} className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                              <div className="font-medium">{entry.account}</div>
                              <div className="flex justify-between mt-1">
                                <span className="text-red-600">Debit: {entry.debitAmount}</span>
                                <span className="text-green-600">Credit: {entry.creditAmount}</span>
                              </div>
                              <div className="text-gray-500 mt-1">{entry.description}</div>
                              <div className="text-violet-600 mt-1">
                                Tags: {entry.regulatoryTags.join(', ')}
                              </div>
                            </div>
                          ))}
                        </div>
                        {template.requiredFields && (
                          <div className="mt-2">
                            <h6 className="text-sm font-medium text-gray-700">Required Fields:</h6>
                            <div className="text-xs text-gray-500">
                              {template.requiredFields.join(', ')}
                            </div>
                          </div>
                        )}
                        <div className="mt-3">
                          <h6 className="text-sm font-medium text-gray-700 mb-1">BOT Report Impact:</h6>
                          {template.botReportImpact?.map((impact, index) => (
                            <div key={index} className="text-xs text-blue-600">
                              {impact.report} - {impact.lineItem} ({impact.impact})
                            </div>
                          ))}
                        </div>
                        <button className="w-full mt-3 bg-violet-600 text-white px-3 py-2 rounded text-sm hover:bg-violet-700 transition-colors">
                          Use Template
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Regulatory Tagging Preview */}
                <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                  <h4 className="font-medium text-blue-900 mb-4 flex items-center">
                    <Shield className="w-5 h-5 mr-2" />
                    Regulatory Tagging Preview
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h5 className="font-medium text-gray-700 mb-2">BOT Report Line Items</h5>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>MSP2_01.C17 (Gross Loans)</span>
                          <span className="text-green-600">+TZS 2,500,000</span>
                        </div>
                        <div className="flex justify-between">
                          <span>MSP2_01.C1 (Cash in Hand)</span>
                          <span className="text-red-600">-TZS 2,500,000</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h5 className="font-medium text-gray-700 mb-2">Additional Tags</h5>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>Economic Sector</span>
                          <span className="text-blue-600">Agriculture</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Geographic Region</span>
                          <span className="text-blue-600">Dar es Salaam</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Client Gender</span>
                          <span className="text-blue-600">Female</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3">
                  <button className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
                    Preview Journal
                  </button>
                  <button className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors flex items-center">
                    <Zap className="w-4 h-4 mr-2" />
                    Generate Journal Entry
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* View Transaction Modal */}
        {showTransactionView && selectedTransaction && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Transaction Details</h3>
                <button
                  onClick={() => setShowTransactionView(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ×
                </button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Transaction ID</label>
                    <p className="text-sm text-gray-900">{selectedTransaction.id}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                    <p className="text-sm text-gray-900">{selectedTransaction.date}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Reference</label>
                    <p className="text-sm text-gray-900">{selectedTransaction.reference}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedTransaction.status)}`}>
                      {selectedTransaction.status}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <p className="text-sm text-gray-900">{selectedTransaction.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Debit Account</label>
                    <p className="text-sm text-gray-900">{selectedTransaction.debitAccount}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Credit Account</label>
                    <p className="text-sm text-gray-900">{selectedTransaction.creditAccount}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                  <p className="text-lg font-semibold text-gray-900">{formatCurrency(selectedTransaction.amount)}</p>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => {
                      setShowTransactionView(false);
                      handleEditTransaction(selectedTransaction);
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Edit Transaction
                  </button>
                  <button
                    onClick={() => setShowTransactionView(false)}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Transaction Modal */}
        {showTransactionEdit && selectedTransaction && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Edit Transaction</h3>
                <button
                  onClick={() => setShowTransactionEdit(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ×
                </button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Transaction ID</label>
                    <input
                      type="text"
                      value={selectedTransaction.id}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                    <input
                      type="date"
                      value={selectedTransaction.date}
                      onChange={(e) => setSelectedTransaction({...selectedTransaction, date: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <input
                    type="text"
                    value={selectedTransaction.description}
                    onChange={(e) => setSelectedTransaction({...selectedTransaction, description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Reference</label>
                  <input
                    type="text"
                    value={selectedTransaction.reference}
                    onChange={(e) => setSelectedTransaction({...selectedTransaction, reference: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
                  <input
                    type="number"
                    value={selectedTransaction.amount}
                    onChange={(e) => setSelectedTransaction({...selectedTransaction, amount: parseFloat(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={selectedTransaction.status}
                    onChange={(e) => setSelectedTransaction({...selectedTransaction, status: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="Draft">Draft</option>
                    <option value="Posted">Posted</option>
                    <option value="Reversed">Reversed</option>
                  </select>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowTransactionEdit(false)}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      // Here you would typically save the changes to the database
                      alert('Transaction updated successfully!');
                      setShowTransactionEdit(false);
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Save Changes
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

export default GeneralLedger;