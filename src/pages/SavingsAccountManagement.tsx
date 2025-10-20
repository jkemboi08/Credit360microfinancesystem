import React, { useState, useEffect } from 'react';
import { DateUtils } from '../utils/dateUtils';
import Layout from '../components/Layout';
import { useSupabaseQuery } from '../hooks/useSupabase';
import {
  DollarSign,
  TrendingUp,
  Clock,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  Download,
  Filter,
  Search,
  Plus,
  Minus,
  Receipt,
  History,
  BarChart3,
  CreditCard,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  MoreHorizontal,
  FileSpreadsheet,
  File,
  Share2,
  FileText,
  Printer,
  Mail,
  BarChart,
  ArrowUp,
  ArrowDown,
  ArrowRight,
  Info,
  Zap,
  Smartphone,
  Building2,
  Globe,
  Mail as MailIcon,
  X,
  MapPin,
  Users,
  Calculator
} from 'lucide-react';
import CurrencyInput from '../components/CurrencyInput';
import toast from 'react-hot-toast';

// Local formatCurrency function
const formatCurrency: (amount: number, currency?: string) => string = (amount: number, currency: string = 'TZS') => {
  return new Intl.NumberFormat('en-TZ', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Local formatPercentage function
const formatPercentage = (value: number) => {
  return new Intl.NumberFormat('en-TZ', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value);
};

// Enhanced Interfaces for Savings Management

interface SavingsAnalyticsDashboard {
  realTimeMetrics: {
    totalSavings: number;
    accountCount: number;
    averageBalance: number;
    growthRate: number;
    turnoverRate: number;
  };
  distributionAnalysis: {
    byAccountType: SavingsTypeDistribution[];
    byBalance: BalanceDistribution[];
    byTenure: TenureDistribution[];
    byDemographics: DemographicDistribution[];
    byGeography: GeographicDistribution[];
  };
  performanceMetrics: {
    mobilizationRate: number;
    retentionRate: number;
    dormancyRate: number;
    averageGrowthRate: number;
    costOfFunds: number;
  };
  predictiveInsights: {
    projectedGrowth: GrowthProjection[];
    churnPrediction: ChurnPrediction[];
    seasonalPatterns: SeasonalPattern[];
    marketTrends: MarketTrend[];
  };
}

interface SavingsTypeDistribution {
  accountType: 'Compulsory' | 'Voluntary' | 'Fixed Deposit' | 'Contractual';
  accountTypeCode: string;
  accountCount: number;
  totalBalance: number;
  averageBalance: number;
  percentageOfTotal: number;
  growthRate: number;
  botReportMapping: {
    msp201LineItem: string;
    regulatoryCategory: string;
    liquidityWeight: number;
  };
  performance: {
    mobilizationEfficiency: number;
    retentionRate: number;
    averageAccountLife: number;
    transactionFrequency: number;
  };
}

interface BalanceDistribution {
  balanceRange: {
    min: number;
    max: number;
    label: string;
  };
  accountCount: number;
  totalBalance: number;
  percentageOfAccounts: number;
  percentageOfBalance: number;
  riskProfile: {
    concentrationRisk: number;
    withdrawalRisk: number;
    seasonalityRisk: number;
  };
  customerSegment: {
    segment: 'Micro' | 'Small' | 'Medium' | 'Large';
    typicalProfile: string;
    retentionProbability: number;
  };
}

interface CompulsorySavingsTracker {
  msp201C46Data: {
    currentBalance: number;
    previousBalance: number;
    netChange: number;
    changePercentage: number;
    lastUpdateTime: Date;
  };
  detailedBreakdown: {
    totalAccounts: number;
    byClientCategory: ClientCategoryBreakdown[];
    byLoanStatus: LoanStatusBreakdown[];
    byTenure: TenureBreakdown[];
    byBranch: BranchBreakdown[];
  };
  complianceMonitoring: {
    overallStatus: string;
    regulatoryCompliance: string;
    reportingAccuracy: string;
    dataQuality: string;
    mandatoryRatio: number;
    complianceRate: number;
    violationCount: number;
    violationDetails: ComplianceViolation[];
  };
  riskAnalysis: {
    concentrationRisk: {
      top10Percent: number;
      herfindahlIndex: number;
      giniCoefficient: number;
    };
    liquidityRisk: {
      withdrawalRate: number;
      averageHoldingPeriod: number;
      emergencyWithdrawalRate: number;
    };
    withdrawalRisk: number;
    collateralValue: number;
  };
}

interface GeographicSavingsDistribution {
  msp210RegionalData: {
    totalSavings: number;
    activeRegions: number;
    averagePerRegion: number;
    growthRate: number;
    totalRegions: number;
    coveragePercentage: number;
    regionalBreakdown: RegionalSavingsData[];
    lastUpdated: Date;
  };
  regionalAnalysis: RegionalPerformance[];
  urbanRuralAnalysis: {
    urban: UrbanRuralData;
    rural: UrbanRuralData;
    penetrationGap: number;
    accessibilityIndex: number;
  };
  branchPerformance: BranchSavingsMetrics[];
}

interface RegulatoryRatioMonitor {
  coreRatios: {
    liquidity: {
      currentRatio: number;
      targetRatio: number;
      status: string;
      liquidAssets: number;
      totalDeposits: number;
    };
    capital: {
      currentRatio: number;
      targetRatio: number;
      status: string;
      tier1Capital: number;
      riskWeightedAssets: number;
    };
    risk: {
      parRatio: number;
      maxParRatio: number;
      provisionCoverage: number;
      writeOffRate: number;
    };
    efficiency: {
      roa: number;
      targetRoa: number;
      roe: number;
      costToIncome: number;
    };
  };
  savingsImpactOnRatios: {
    liquidityImpact: {
      savingsContribution: number;
      ratioImpact: number;
    };
    capitalImpact: {
      savingsAsCapital: number;
      ratioBoost: number;
    };
    riskImpact: {
      savingsCollateral: number;
      riskReduction: number;
    };
    efficiencyImpact: {
      savingsRevenue: number;
      roaImprovement: number;
    };
  };
  botRequirements: {
    minimumLiquidityRatio: number;
    capitalAdequacyRatio: number;
    maximumSingleExposure: number;
    portfolioAtRiskLimit: number;
  };
  realTimeMonitoring: {
    currentRatios: CurrentRatioStatus[];
    alerts: RatioAlert[];
    trends: RatioTrend[];
    projections: RatioProjection[];
  };
  impactAnalysis: {
    savingsImpact: SavingsImpactOnRatios;
    scenarioAnalysis: ScenarioAnalysis[];
    stressTesting: StressTestResult[];
    mitigationStrategies: MitigationStrategy[];
  };
}

// Additional supporting interfaces
interface TenureDistribution {
  tenureRange: string;
  accountCount: number;
  totalBalance: number;
  averageBalance: number;
}

interface DemographicDistribution {
  category: string;
  value: string;
  accountCount: number;
  totalBalance: number;
  percentage: number;
}

interface GeographicDistribution {
  region: string;
  accountCount: number;
  totalBalance: number;
  averageBalance: number;
  growthRate: number;
}

interface GrowthProjection {
  period: string;
  projectedValue: number;
  confidence: number;
  scenario: string;
}

interface ChurnPrediction {
  accountId: string;
  churnProbability: number;
  riskFactors: string[];
  recommendedActions: string[];
}

interface SeasonalPattern {
  month: string;
  pattern: string;
  strength: number;
  impact: number;
}

interface MarketTrend {
  trend: string;
  direction: 'up' | 'down' | 'stable';
  magnitude: number;
  timeframe: string;
}

interface ClientCategoryBreakdown {
  category: 'Individual' | 'Group' | 'SME' | 'Agricultural';
  accountCount: number;
  totalBalance: number;
  percentageOfTotal: number;
  clientCount: number;
  totalCompulsorySavings: number;
  averageSavingsPerClient: number;
  complianceRate: number;
  loanRelationship: {
    totalLoansOutstanding: number;
    savingsToLoanRatio: number;
    averageLoanSize: number;
    riskCategory: 'Low' | 'Medium' | 'High';
  };
  performance: {
    collectionEfficiency: number;
    growthRate: number;
    retentionRate: number;
  };
}

interface LoanStatusBreakdown {
  status: string;
  accountCount: number;
  totalBalance: number;
  percentageOfTotal: number;
  totalSavings: number;
  averageSavings: number;
}

interface TenureBreakdown {
  tenureRange: string;
  accountCount: number;
  totalSavings: number;
  averageSavings: number;
}

interface BranchBreakdown {
  branchCode: string;
  branchName: string;
  accountCount: number;
  totalSavings: number;
  averageSavings: number;
  growthRate: number;
}

interface ComplianceViolation {
  clientId: string;
  clientName: string;
  loanAmount: number;
  requiredSavings: number;
  actualSavings: number;
  shortfall: number;
  violationPeriod: number;
  riskLevel: string;
}

interface RegionalSavingsData {
  regionCode: string;
  regionName: string;
  zone: 'Mainland' | 'Zanzibar';
  savingsMetrics: {
    totalSavings: number;
    accountCount: number;
    averageBalance: number;
    compulsorySavings: number;
    voluntarySavings: number;
    fixedDeposits: number;
  };
  demographics: {
    maleAccounts: number;
    femaleAccounts: number;
    youthAccounts: number;
    adultAccounts: number;
    seniorAccounts: number;
  };
  performance: {
    savingsPerCapita: number;
    penetrationRate: number;
    growthRate: number;
    retentionRate: number;
    mobilizationEfficiency: number;
  };
  economicContext: {
    populationSize: number;
    economicActivity: string[];
    seasonalityFactors: SeasonalityFactor[];
    competitiveIndex: number;
  };
  botIntegration: {
    msp210LineItem: string;
    contributionToTotal: number;
    validationStatus: 'passed' | 'failed' | 'pending';
  };
}

interface RegionalPerformance {
  regionName: string;
  totalSavings: number;
  accountCount: number;
  growthRate: number;
  marketShare: number;
  status: string;
  region: string;
  performanceScore: number;
  metrics: any;
}



interface UrbanRuralData {
  totalSavings: number;
  accountCount: number;
  percentageOfTotal: number;
  averageBalance: number;
  penetrationRate: number;
  growthRate: number;
}

interface BranchSavingsMetrics {
  branchCode: string;
  branchName: string;
  region: string;
  totalSavings: number;
  accountCount: number;
  efficiency: number;
  growth: number;
}








interface CurrentRatioStatus {
  category: string;
  complianceStatus: 'compliant' | 'warning' | 'violation';
  currentValue: number;
  requiredValue: number;
  buffer: number;
}

interface RatioAlert {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  ratio: string;
  currentValue: number;
  threshold: number;
  recommendedAction: string;
  timestamp: Date;
}

interface RatioTrend {
  ratio: string;
  values: { date: string; value: number }[];
  trend: 'up' | 'down' | 'stable';
  volatility: number;
}

interface RatioProjection {
  ratio: string;
  projectedValue: number;
  confidence: number;
  timeframe: string;
}

interface SavingsImpactOnRatios {
  liquidityImpact: {
    currentPLR: number;
    projectedPLR: number;
    impactMagnitude: number;
    complianceRisk: string;
  };
  capitalImpact: {
    currentCAR: number;
    projectedCAR: number;
    impactMagnitude: number;
    complianceRisk: string;
  };
  fundingStabilityImpact: {
    currentStability: number;
    projectedStability: number;
    diversificationImpact: number;
    maturityMismatchImpact: number;
  };
  operationalImpact: {
    costOfFundsImpact: number;
    netInterestMarginImpact: number;
    profitabilityImpact: number;
  };
  mitigationStrategies: string[];
}

interface ScenarioAnalysis {
  scenario: string;
  description: string;
  impact: number;
  probability: number;
  recommendedAction: string;
}

interface StressTestResult {
  scenario: string;
  liquidityImpact: number;
  capitalImpact: number;
  complianceStatus: string;
  recoveryTime: number;
  mitigationRequired: string[];
}

interface MitigationStrategy {
  strategy: string;
  description: string;
  effectiveness: number;
  cost: number;
  timeframe: string;
}

interface SeasonalityFactor {
  factor: string;
  impact: number;
  period: string;
}

// Mock data for demonstration
const mockSavingsAnalytics: SavingsAnalyticsDashboard = {
  realTimeMetrics: {
    totalSavings: 125000000,
    accountCount: 15420,
    averageBalance: 8100,
    growthRate: 0.125,
    turnoverRate: 0.08
  },
  distributionAnalysis: {
    byAccountType: [
      {
        accountType: 'Compulsory',
        accountTypeCode: 'COMP',
        accountCount: 8500,
        totalBalance: 75000000,
        averageBalance: 8824,
        percentageOfTotal: 0.60,
        growthRate: 0.15,
        botReportMapping: {
          msp201LineItem: 'C46',
          regulatoryCategory: 'Compulsory Savings',
          liquidityWeight: 0.8
        },
        performance: {
          mobilizationEfficiency: 0.85,
          retentionRate: 0.92,
          averageAccountLife: 24,
          transactionFrequency: 2.5
        }
      },
      {
        accountType: 'Voluntary',
        accountTypeCode: 'VOL',
        accountCount: 5200,
        totalBalance: 35000000,
        averageBalance: 6731,
        percentageOfTotal: 0.28,
        growthRate: 0.08,
        botReportMapping: {
          msp201LineItem: 'C44',
          regulatoryCategory: 'Voluntary Savings',
          liquidityWeight: 0.9
        },
        performance: {
          mobilizationEfficiency: 0.72,
          retentionRate: 0.88,
          averageAccountLife: 18,
          transactionFrequency: 3.2
        }
      },
      {
        accountType: 'Fixed Deposit',
        accountTypeCode: 'FD',
        accountCount: 1720,
        totalBalance: 15000000,
        averageBalance: 8721,
        percentageOfTotal: 0.12,
        growthRate: 0.20,
        botReportMapping: {
          msp201LineItem: 'C45',
          regulatoryCategory: 'Fixed Deposits',
          liquidityWeight: 0.3
        },
        performance: {
          mobilizationEfficiency: 0.95,
          retentionRate: 0.98,
          averageAccountLife: 36,
          transactionFrequency: 0.5
        }
      }
    ],
    byBalance: [
      {
        balanceRange: { min: 0, max: 1000, label: '0-1K' },
        accountCount: 3200,
        totalBalance: 1600000,
        percentageOfAccounts: 0.21,
        percentageOfBalance: 0.01,
        riskProfile: {
          concentrationRisk: 0.05,
          withdrawalRisk: 0.15,
          seasonalityRisk: 0.10
        },
        customerSegment: {
          segment: 'Micro',
          typicalProfile: 'New savers, low income',
          retentionProbability: 0.75
        }
      },
      {
        balanceRange: { min: 1000, max: 5000, label: '1K-5K' },
        accountCount: 6800,
        totalBalance: 20400000,
        percentageOfAccounts: 0.44,
        percentageOfBalance: 0.16,
        riskProfile: {
          concentrationRisk: 0.10,
          withdrawalRisk: 0.12,
          seasonalityRisk: 0.08
        },
        customerSegment: {
          segment: 'Small',
          typicalProfile: 'Regular savers, stable income',
          retentionProbability: 0.85
        }
      },
      {
        balanceRange: { min: 5000, max: 20000, label: '5K-20K' },
        accountCount: 4200,
        totalBalance: 42000000,
        percentageOfAccounts: 0.27,
        percentageOfBalance: 0.34,
        riskProfile: {
          concentrationRisk: 0.15,
          withdrawalRisk: 0.08,
          seasonalityRisk: 0.05
        },
        customerSegment: {
          segment: 'Medium',
          typicalProfile: 'Established savers, good income',
          retentionProbability: 0.92
        }
      },
      {
        balanceRange: { min: 20000, max: 100000, label: '20K-100K' },
        accountCount: 1200,
        totalBalance: 48000000,
        percentageOfAccounts: 0.08,
        percentageOfBalance: 0.38,
        riskProfile: {
          concentrationRisk: 0.25,
          withdrawalRisk: 0.05,
          seasonalityRisk: 0.03
        },
        customerSegment: {
          segment: 'Large',
          typicalProfile: 'High-value savers, business owners',
          retentionProbability: 0.96
        }
      }
    ],
    byTenure: [],
    byDemographics: [],
    byGeography: []
  },
  performanceMetrics: {
    mobilizationRate: 0.15,
    retentionRate: 0.90,
    dormancyRate: 0.05,
    averageGrowthRate: 0.12,
    costOfFunds: 0.08
  },
  predictiveInsights: {
    projectedGrowth: [],
    churnPrediction: [],
    seasonalPatterns: [],
    marketTrends: []
  }
};

const mockCompulsorySavings: CompulsorySavingsTracker = {
  msp201C46Data: {
    currentBalance: 75000000,
    previousBalance: 72000000,
    netChange: 3000000,
    changePercentage: 4.17,
    lastUpdateTime: new Date()
  },
  detailedBreakdown: {
    totalAccounts: 9700,
    byClientCategory: [
      {
        category: 'Individual',
        accountCount: 6500,
        totalBalance: 45000000,
        percentageOfTotal: 0.6,
        clientCount: 6500,
        totalCompulsorySavings: 45000000,
        averageSavingsPerClient: 6923,
        complianceRate: 0.95,
        loanRelationship: {
          totalLoansOutstanding: 180000000,
          savingsToLoanRatio: 0.25,
          averageLoanSize: 27692,
          riskCategory: 'Low'
        },
        performance: {
          collectionEfficiency: 0.92,
          growthRate: 0.15,
          retentionRate: 0.94
        }
      },
      {
        category: 'Group',
        accountCount: 1200,
        totalBalance: 18000000,
        percentageOfTotal: 0.24,
        clientCount: 1200,
        totalCompulsorySavings: 18000000,
        averageSavingsPerClient: 15000,
        complianceRate: 0.88,
        loanRelationship: {
          totalLoansOutstanding: 72000000,
          savingsToLoanRatio: 0.25,
          averageLoanSize: 60000,
          riskCategory: 'Medium'
        },
        performance: {
          collectionEfficiency: 0.85,
          growthRate: 0.12,
          retentionRate: 0.90
        }
      },
      {
        category: 'SME',
        accountCount: 800,
        totalBalance: 12000000,
        percentageOfTotal: 0.16,
        clientCount: 800,
        totalCompulsorySavings: 12000000,
        averageSavingsPerClient: 15000,
        complianceRate: 0.92,
        loanRelationship: {
          totalLoansOutstanding: 48000000,
          savingsToLoanRatio: 0.25,
          averageLoanSize: 60000,
          riskCategory: 'Medium'
        },
        performance: {
          collectionEfficiency: 0.88,
          growthRate: 0.18,
          retentionRate: 0.93
        }
      }
    ],
    byLoanStatus: [],
    byTenure: [],
    byBranch: []
  },
  complianceMonitoring: {
    overallStatus: 'Compliant',
    regulatoryCompliance: 'Compliant',
    reportingAccuracy: 'High',
    dataQuality: 'Excellent',
    mandatoryRatio: 0.20,
    complianceRate: 0.92,
    violationCount: 123,
    violationDetails: []
  },
  riskAnalysis: {
    concentrationRisk: {
      top10Percent: 0.25,
      herfindahlIndex: 0.15,
      giniCoefficient: 0.35
    },
    liquidityRisk: {
      withdrawalRate: 0.08,
      averageHoldingPeriod: 18,
      emergencyWithdrawalRate: 0.02
    },
    withdrawalRisk: 0.08,
    collateralValue: 60000000
  }
};

const SavingsAccountManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [transactionType, setTransactionType] = useState<'deposit' | 'withdrawal'>('deposit');
  const [searchTerm, setSearchTerm] = useState('');
  const [transactionFilter] = useState('all');
  
  // Fetch real data from Supabase with joined product information
  const { data: savingsAccounts, loading: savingsLoading } = useSupabaseQuery('savings_accounts', {
    select: '*, product:savings_products(*)',
    orderBy: { column: 'created_at', ascending: false }
  });
  
  const { data: savingsTransactions, loading: transactionsLoading } = useSupabaseQuery('savings_transactions', {
    select: '*',
    orderBy: { column: 'transaction_date', ascending: false }
  });
  
  const { data: clients, loading: clientsLoading } = useSupabaseQuery('clients', {
    select: '*',
    orderBy: { column: 'created_at', ascending: false }
  });
  
  // Enhanced state for new features
  const [savingsAnalytics, setSavingsAnalytics] = useState<SavingsAnalyticsDashboard | null>(null);
  const [compulsorySavings, setCompulsorySavings] = useState<CompulsorySavingsTracker | null>(null);
  const [geographicDistribution, setGeographicDistribution] = useState<GeographicSavingsDistribution | null>(null);
  const [regulatoryRatios, setRegulatoryRatios] = useState<RegulatoryRatioMonitor | null>(null);
  const [selectedAnalyticsView, setSelectedAnalyticsView] = useState<string>('overview');
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>('YTD');
  const [selectedRegion, setSelectedRegion] = useState<string>('');
  const [showAdvancedAnalytics, setShowAdvancedAnalytics] = useState(false);
  const [ratioAlerts, setRatioAlerts] = useState<any[]>([]);
  const [realTimeUpdates] = useState<boolean>(true);

  // Calculate real savings analytics from Supabase data
  const calculateSavingsAnalytics = () => {
    if (!savingsAccounts || savingsAccounts.length === 0) {
      return null;
    }

    const totalSavings = savingsAccounts.reduce((sum, acc) => sum + (acc.current_balance || 0), 0);
    const accountCount = savingsAccounts.length;
    const averageBalance = accountCount > 0 ? totalSavings / accountCount : 0;
    
    // Calculate growth rate (simplified - would need historical data for accurate calculation)
    const growthRate = 0.125; // This should be calculated from historical data
    
    // Calculate turnover rate from transactions
    const totalTransactions = savingsTransactions?.length || 0;
    const turnoverRate = totalTransactions > 0 ? totalTransactions / accountCount : 0;

    // Group by account type - get product type from joined data
    const accountTypeGroups = savingsAccounts.reduce((groups, acc) => {
      // Get product type from the product relationship or use a default
      const type = acc.product?.product_type || 'voluntary_savings';
      const displayType = type === 'voluntary_savings' ? 'Voluntary' : 
                         type === 'compulsory_savings' ? 'Compulsory' :
                         type === 'term_deposits' ? 'Term Deposit' :
                         type === 'special_purpose_savings' ? 'Special Purpose' : 'Voluntary';
      
      if (!groups[displayType]) {
        groups[displayType] = {
          accounts: [],
          totalBalance: 0
        };
      }
      groups[displayType].accounts.push(acc);
      groups[displayType].totalBalance += acc.current_balance || 0;
      return groups;
    }, {} as any);

    const byAccountType = Object.entries(accountTypeGroups).map(([type, data]: [string, any]) => ({
      accountType: type,
      accountTypeCode: type.substring(0, 4).toUpperCase(),
      accountCount: data.accounts.length,
      totalBalance: data.totalBalance,
      averageBalance: data.accounts.length > 0 ? data.totalBalance / data.accounts.length : 0,
      percentageOfTotal: totalSavings > 0 ? data.totalBalance / totalSavings : 0,
      growthRate: 0.15, // This should be calculated from historical data
      botReportMapping: {
        msp201LineItem: type === 'Compulsory' ? 'C46' : 'C44',
        regulatoryCategory: type === 'Compulsory' ? 'Compulsory Savings' : 'Voluntary Savings',
        liquidityWeight: type === 'Compulsory' ? 0.8 : 0.9
      },
      performance: {
        mobilizationEfficiency: 0.85, // This should be calculated from actual data
        retentionRate: 0.92, // This should be calculated from actual data
        averageAccountLife: 24, // This should be calculated from actual data
        transactionFrequency: 2.5 // This should be calculated from actual data
      }
    }));

    return {
      realTimeMetrics: {
        totalSavings,
        accountCount,
        averageBalance,
        growthRate,
        turnoverRate
      },
      distributionAnalysis: {
        byAccountType,
        byBalance: [], // This would need to be calculated from actual balance ranges
        byRegion: [], // This would need geographic data
        byAgeGroup: [] // This would need demographic data
      },
      performanceMetrics: {
        mobilizationEfficiency: 0.85,
        retentionRate: 0.92,
        averageAccountLife: 24,
        transactionFrequency: 2.5
      },
      riskMetrics: {
        concentrationRisk: 0.15,
        liquidityRisk: 0.08,
        withdrawalRisk: 0.12
      }
    };
  };

  // Enhanced Account History State
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState({
    date: true,
    type: true,
    description: true,
    debit: true,
    credit: true,
    balance: true,
    reference: false,
    channel: false,
    status: false
  });
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [expandedRows, setExpandedRows] = useState<number[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [showStatementDialog, setShowStatementDialog] = useState(false);
  const [statementConfig, setStatementConfig] = useState({
    type: 'custom',
    startDate: '',
    endDate: '',
    format: ['pdf'],
    sections: {
      summary: true,
      transactions: true,
      interest: true,
      fees: true,
      trends: true,
      tax: false
    },
    delivery: 'download'
  });
  const [balanceChartPeriod, setBalanceChartPeriod] = useState('12months');
  const [chartType, setChartType] = useState('line');
  const [showInterestDetails, setShowInterestDetails] = useState(false);

  // Enhanced helper functions


  const getComplianceStatusColor = (status: string) => {
    switch (status) {
      case 'compliant': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'violation': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getComplianceStatusIcon = (status: string) => {
    switch (status) {
      case 'compliant': return <CheckCircle2 className="w-4 h-4" />;
      case 'warning': return <AlertTriangle className="w-4 h-4" />;
      case 'violation': return <XCircle className="w-4 h-4" />;
      default: return <Info className="w-4 h-4" />;
    }
  };


  const getSegmentColor = (segment: string) => {
    switch (segment) {
      case 'Micro': return 'text-blue-600 bg-blue-50';
      case 'Small': return 'text-green-600 bg-green-50';
      case 'Medium': return 'text-yellow-600 bg-yellow-50';
      case 'Large': return 'text-purple-600 bg-purple-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  // Event handlers for enhanced features
  const handleAnalyticsViewChange = (view: string) => {
    setSelectedAnalyticsView(view);
  };

  const handleTimeframeChange = (timeframe: string) => {
    setSelectedTimeframe(timeframe);
    // Trigger data refresh based on timeframe
    refreshAnalyticsData(timeframe);
  };

  const handleRegionSelect = (region: string) => {
    setSelectedRegion(region);
    // Load region-specific data
    loadRegionalData(region);
  };

  const refreshAnalyticsData = (timeframe: string) => {
    // Simulate data refresh based on timeframe
    console.log(`Refreshing analytics data for ${timeframe}`);
    // In real implementation, this would fetch data from API
  };

  const loadRegionalData = (region: string) => {
    // Simulate loading region-specific data
    console.log(`Loading data for region: ${region}`);
    // In real implementation, this would fetch regional data from API
  };


  const handleRatioAlert = (alertId: string, action: string) => {
    console.log(`Handling ratio alert ${alertId} with action: ${action}`);
    // In real implementation, this would handle ratio alert actions
  };

  const generateComplianceReport = () => {
    console.log('Generating compliance report...');
    toast.success('Compliance report generated successfully');
  };

  const exportMSP201C46Data = () => {
    console.log('Exporting MSP2_01.C46 data...');
    toast.success('MSP2_01.C46 data exported successfully');
  };

  const generateRatioReport = () => {
    console.log('Generating ratio report...');
    toast.success('Ratio report generated successfully');
  };

  const runStressTest = () => {
    console.log('Running stress test...');
    toast.success('Stress test completed successfully');
  };

  // Initialize enhanced data on component mount
  useEffect(() => {
    // Calculate real analytics data from Supabase
    const analytics = calculateSavingsAnalytics();
    if (analytics) {
      setSavingsAnalytics(analytics);
    } else {
      // Fallback to mock data if no real data available
      setSavingsAnalytics(mockSavingsAnalytics);
    }
    
    // Initialize compulsory savings (would need real data calculation)
    setCompulsorySavings(mockCompulsorySavings);
  }, []);

  // Recalculate analytics when data changes
  useEffect(() => {
    if (savingsAccounts && savingsAccounts.length > 0) {
      const analytics = calculateSavingsAnalytics();
      if (analytics) {
        setSavingsAnalytics(analytics);
      }
    }
  }, [savingsAccounts, savingsTransactions]);

  // Initialize ratio alerts
  useEffect(() => {
    setRatioAlerts([
      {
        id: '1',
        ratio: 'Liquidity Ratio',
        message: 'Liquidity ratio is above target by 5%',
        severity: 'Low',
        timestamp: '2 hours ago'
      },
      {
        id: '2',
        ratio: 'Capital Adequacy',
        message: 'Capital ratio is within acceptable range',
        severity: 'Low',
        timestamp: '4 hours ago'
      }
    ]);
    
    // Initialize geographic distribution
    setGeographicDistribution({
      msp210RegionalData: {
        totalSavings: 125000000,
        activeRegions: 8,
        averagePerRegion: 15625000,
        growthRate: 0.12,
        totalRegions: 10,
        coveragePercentage: 80,
        regionalBreakdown: [],
        lastUpdated: new Date()
      },
      regionalAnalysis: [
        { regionName: 'Dar es Salaam', totalSavings: 45000000, accountCount: 5500, growthRate: 0.15, marketShare: 0.36, status: 'High Growth', region: 'Dar es Salaam', performanceScore: 0.95, metrics: {} },
        { regionName: 'Arusha', totalSavings: 25000000, accountCount: 3000, growthRate: 0.12, marketShare: 0.20, status: 'Stable', region: 'Arusha', performanceScore: 0.85, metrics: {} },
        { regionName: 'Mwanza', totalSavings: 20000000, accountCount: 2500, growthRate: 0.10, marketShare: 0.16, status: 'Stable', region: 'Mwanza', performanceScore: 0.80, metrics: {} },
        { regionName: 'Dodoma', totalSavings: 15000000, accountCount: 1800, growthRate: 0.08, marketShare: 0.12, status: 'Stable', region: 'Dodoma', performanceScore: 0.75, metrics: {} },
        { regionName: 'Tanga', totalSavings: 10000000, accountCount: 1200, growthRate: 0.05, marketShare: 0.08, status: 'Low Growth', region: 'Tanga', performanceScore: 0.70, metrics: {} },
        { regionName: 'Morogoro', totalSavings: 10000000, accountCount: 1200, growthRate: 0.06, marketShare: 0.08, status: 'Low Growth', region: 'Morogoro', performanceScore: 0.72, metrics: {} }
      ],
      urbanRuralAnalysis: {
        urban: { totalSavings: 80000000, accountCount: 10000, percentageOfTotal: 0.64, averageBalance: 8000, penetrationRate: 0.75, growthRate: 0.12 },
        rural: { totalSavings: 45000000, accountCount: 5400, percentageOfTotal: 0.36, averageBalance: 8333, penetrationRate: 0.45, growthRate: 0.08 },
        penetrationGap: 0.15,
        accessibilityIndex: 0.75
      },
      branchPerformance: [
        { branchCode: 'BR001', branchName: 'Main Branch', region: 'Dar es Salaam', totalSavings: 25000000, accountCount: 3000, efficiency: 0.85, growth: 0.12 },
        { branchCode: 'BR002', branchName: 'City Branch', region: 'Dar es Salaam', totalSavings: 20000000, accountCount: 2500, efficiency: 0.80, growth: 0.10 },
        { branchCode: 'BR003', branchName: 'Arusha Branch', region: 'Arusha', totalSavings: 25000000, accountCount: 3000, efficiency: 0.90, growth: 0.15 },
        { branchCode: 'BR004', branchName: 'Mwanza Branch', region: 'Mwanza', totalSavings: 20000000, accountCount: 2500, efficiency: 0.75, growth: 0.08 }
      ]
    });
    
    // Initialize regulatory ratios
    setRegulatoryRatios({
      coreRatios: {
        liquidity: {
          currentRatio: 0.25,
          targetRatio: 0.20,
          status: 'Compliant',
          liquidAssets: 50000000,
          totalDeposits: 200000000
        },
        capital: {
          currentRatio: 0.18,
          targetRatio: 0.15,
          status: 'Compliant',
          tier1Capital: 36000000,
          riskWeightedAssets: 200000000
        },
        risk: {
          parRatio: 0.03,
          maxParRatio: 0.05,
          provisionCoverage: 0.85,
          writeOffRate: 0.01
        },
        efficiency: {
          roa: 0.08,
          targetRoa: 0.06,
          roe: 0.15,
          costToIncome: 0.65
        }
      },
      savingsImpactOnRatios: {
        liquidityImpact: {
          savingsContribution: 125000000,
          ratioImpact: 0.05
        },
        capitalImpact: {
          savingsAsCapital: 25000000,
          ratioBoost: 0.03
        },
        riskImpact: {
          savingsCollateral: 100000000,
          riskReduction: 0.02
        },
        efficiencyImpact: {
          savingsRevenue: 10000000,
          roaImprovement: 0.02
        }
      },
      botRequirements: {
        minimumLiquidityRatio: 0.20,
        capitalAdequacyRatio: 0.15,
        maximumSingleExposure: 0.25,
        portfolioAtRiskLimit: 0.05
      },
      realTimeMonitoring: {
        currentRatios: [],
        alerts: [],
        trends: [],
        projections: []
      },
      impactAnalysis: {
        savingsImpact: {} as any,
        scenarioAnalysis: [],
        stressTesting: [],
        mitigationStrategies: []
      }
    });
    
    // Set up real-time updates if enabled
    if (realTimeUpdates) {
      const interval = setInterval(() => {
        // Simulate real-time data updates
        console.log('Updating real-time data...');
      }, 30000); // Update every 30 seconds
      
      return () => clearInterval(interval);
    }
  }, [realTimeUpdates]);

  // Account data state - use real data from database
  const [accountData, setAccountData] = useState({
    accountNumber: 'ACC001',
    accountName: 'John Doe',
    productType: 'Basic Savings',
    currency: 'TZS',
    availableBalance: 2500000,
    ledgerBalance: 2500000,
    clearedBalance: 2400000,
    unclearedDeposits: 100000,
    holdAmounts: 0,
    reservedFunds: 0,
    lastUpdated: DateUtils.getCurrentISODate(),
    status: 'active',
    subStatus: 'normal',
    daysSinceLastActivity: 2,
    kycCompliance: 'compliant',
    riskRating: 'low',
    interestRate: 2.5,
    totalInterestEarned: 125000,
    lastInterestPosting: DateUtils.getEndOfCurrentMonth().split('T')[0],
    nextInterestPosting: DateUtils.addMonthsToCurrent(1).split('T')[0],
    minimumBalance: 10000,
    accountOpened: '2023-01-15'
  });

  // Update account data when savings accounts data is loaded
  useEffect(() => {
    if (savingsAccounts && savingsAccounts.length > 0) {
      const firstAccount = savingsAccounts[0];
      setAccountData({
        accountNumber: firstAccount.account_number || 'N/A',
        accountName: firstAccount.account_name || 'N/A',
        productType: firstAccount.product?.product_name || 'Basic Savings',
        currency: 'TZS',
        availableBalance: firstAccount.available_balance || 0,
        ledgerBalance: firstAccount.current_balance || 0,
        clearedBalance: firstAccount.available_balance || 0,
        unclearedDeposits: (firstAccount.current_balance || 0) - (firstAccount.available_balance || 0),
        holdAmounts: firstAccount.pending_balance || 0,
        reservedFunds: 0,
        lastUpdated: firstAccount.updated_at || DateUtils.getCurrentISODate(),
        status: firstAccount.account_status || 'active',
        subStatus: 'normal',
        daysSinceLastActivity: firstAccount.last_transaction_date ? 
          Math.floor((new Date().getTime() - new Date(firstAccount.last_transaction_date).getTime()) / (1000 * 60 * 60 * 24)) : 0,
        kycCompliance: 'compliant',
        riskRating: 'low',
        interestRate: firstAccount.interest_rate_at_opening ? firstAccount.interest_rate_at_opening * 100 : 2.5,
        totalInterestEarned: firstAccount.interest_earned_not_posted || 0,
        lastInterestPosting: firstAccount.last_interest_posting_date || DateUtils.getEndOfCurrentMonth().split('T')[0],
        nextInterestPosting: DateUtils.addMonthsToCurrent(1).split('T')[0],
        minimumBalance: firstAccount.product?.minimum_balance || 10000,
        accountOpened: firstAccount.opened_date || '2023-01-15'
      });
    }
  }, [savingsAccounts]);

  // Update transactions when savings transactions data is loaded
  useEffect(() => {
    if (savingsTransactions && savingsTransactions.length > 0) {
      const realTransactions = savingsTransactions.map(transaction => ({
        id: transaction.id,
        date: transaction.transaction_date ? new Date(transaction.transaction_date).toISOString() : new Date().toISOString(),
        type: transaction.transaction_type,
        description: transaction.description || 'Transaction',
        amount: transaction.amount,
        balance: transaction.balance_after,
        reference: transaction.reference_number || '',
        channel: transaction.transaction_method,
        status: transaction.approved_at ? 'completed' : 'pending',
        fees: transaction.fees_charged || 0,
        createdBy: transaction.created_by,
        approvedBy: transaction.approved_by,
        approvedAt: transaction.approved_at
      }));
      setTransactions(realTransactions);
    }
  }, [savingsTransactions]);

  // Transaction form state
  const [transactionForm, setTransactionForm] = useState({
    amount: 0,
    currency: 'TZS',
    method: '',
    reference: '',
    purpose: '',
    beneficiary: '',
    authorization: '',
    description: ''
  });

  // Enhanced mock data for transactions - will be replaced with real data
  const [transactions, setTransactions] = useState([
    {
      id: 'TXN001',
      date: '2024-12-15T10:30:00Z',
      type: 'deposit',
      description: 'Mobile Deposit - Check #1234',
      amount: 250000,
      balance: 1254785,
      channel: 'Mobile App',
      reference: 'CHK1234',
      status: 'cleared',
      branch: 'Main Branch',
      category: 'deposit',
      subcategory: 'check_deposit',
      fees: 0,
      tax: 0,
      runningBalance: 1254785
    },
    {
      id: 'TXN002',
      date: '2024-12-12T14:20:00Z',
      type: 'withdrawal',
      description: 'ATM Withdrawal - Cash',
      amount: 20000,
      balance: 1004785,
      channel: 'ATM',
      reference: 'ATM001',
      status: 'cleared',
      branch: 'ATM-001',
      category: 'withdrawal',
      subcategory: 'atm_cash',
      fees: 500,
      tax: 0,
      runningBalance: 1004785
    },
    {
      id: 'TXN003',
      date: '2024-12-10T09:15:00Z',
      type: 'transfer',
      description: 'Transfer from Checking Account',
      amount: 100000,
      balance: 1024785,
      channel: 'Online Banking',
      reference: 'TRF001',
      status: 'cleared',
      branch: 'System',
      category: 'transfer',
      subcategory: 'internal_transfer',
      fees: 0,
      tax: 0,
      runningBalance: 1024785
    },
    {
      id: 'TXN004',
      date: '2024-12-08T16:45:00Z',
      type: 'payment',
      description: 'Bill Payment - Electric Company',
      amount: 12567,
      balance: 924785,
      channel: 'Online Banking',
      reference: 'BP001',
      status: 'cleared',
      branch: 'System',
      category: 'payment',
      subcategory: 'bill_payment',
      fees: 0,
      tax: 0,
      runningBalance: 924785
    },
    {
      id: 'TXN005',
      date: '2024-12-05T11:30:00Z',
      type: 'deposit',
      description: 'Cash Deposit - Teller',
      amount: 500000,
      balance: 937252,
      channel: 'Branch',
      reference: 'CASH001',
      status: 'cleared',
      branch: 'Main Branch',
      category: 'deposit',
      subcategory: 'cash_deposit',
      fees: 0,
      tax: 0,
      runningBalance: 937252
    },
    {
      id: 'TXN006',
      date: '2024-12-03T08:00:00Z',
      type: 'interest',
      description: 'Monthly Interest Posting',
      amount: 4567,
      balance: 437252,
      channel: 'System',
      reference: 'INT001',
      status: 'cleared',
      branch: 'System',
      category: 'interest',
      subcategory: 'monthly_interest',
      fees: 0,
      tax: 457,
      runningBalance: 437252
    },
    {
      id: 'TXN007',
      date: '2024-12-01T15:20:00Z',
      type: 'withdrawal',
      description: 'Teller Withdrawal',
      amount: 50000,
      balance: 432685,
      channel: 'Branch',
      reference: 'TEL001',
      status: 'cleared',
      branch: 'Main Branch',
      category: 'withdrawal',
      subcategory: 'teller_withdrawal',
      fees: 0,
      tax: 0,
      runningBalance: 432685
    }
  ]);

  // Interest posting history data
  const [interestHistory] = useState([
    {
      id: 'INT001',
      date: '2024-12-01',
      period: '2024-11-01 to 2024-11-30',
      rate: 4.25,
      balance: 112340,
      interest: 3979,
      tax: 398,
      netInterest: 3581,
      calculationMethod: 'Average Daily Balance',
      daysInPeriod: 30,
      averageDailyBalance: 112345.52
    },
    {
      id: 'INT002',
      date: '2024-11-01',
      period: '2024-10-01 to 2024-10-31',
      rate: 4.25,
      balance: 98760,
      interest: 3512,
      tax: 351,
      netInterest: 3161,
      calculationMethod: 'Average Daily Balance',
      daysInPeriod: 31,
      averageDailyBalance: 98760.00
    },
    {
      id: 'INT003',
      date: '2024-10-01',
      period: '2024-09-01 to 2024-09-30',
      rate: 4.25,
      balance: 82340,
      interest: 2928,
      tax: 293,
      netInterest: 2635,
      calculationMethod: 'Average Daily Balance',
      daysInPeriod: 30,
      averageDailyBalance: 82340.00
    }
  ]);


  // Helper functions for enhanced account history
  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleRowSelect = (index: number) => {
    setSelectedRows(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const handleRowExpand = (index: number) => {
    setExpandedRows(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const handleSelectAll = () => {
    if (selectedRows.length === transactions.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(transactions.map((_, index) => index));
    }
  };

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = searchTerm === '' || 
      transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.amount.toString().includes(searchTerm);
    
    const matchesType = transactionFilter === 'all' || transaction.type === transactionFilter;
    
    return matchesSearch && matchesType;
  });

  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    if (!sortConfig) return 0;
    
    const aValue = a[sortConfig.key as keyof typeof a];
    const bValue = b[sortConfig.key as keyof typeof b];
    
    if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const paginatedTransactions = sortedTransactions.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const totalPages = Math.ceil(filteredTransactions.length / pageSize);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit': return <ArrowUp className="w-4 h-4 text-green-600" />;
      case 'withdrawal': return <ArrowDown className="w-4 h-4 text-red-600" />;
      case 'transfer': return <ArrowRight className="w-4 h-4 text-blue-600" />;
      case 'interest': return <TrendingUp className="w-4 h-4 text-purple-600" />;
      case 'payment': return <CreditCard className="w-4 h-4 text-orange-600" />;
      default: return <DollarSign className="w-4 h-4 text-gray-600" />;
    }
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'Mobile App': return <Smartphone className="w-4 h-4" />;
      case 'ATM': return <CreditCard className="w-4 h-4" />;
      case 'Online Banking': return <Globe className="w-4 h-4" />;
      case 'Branch': return <Building2 className="w-4 h-4" />;
      case 'System': return <Zap className="w-4 h-4" />;
      default: return <CreditCard className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: '2-digit'
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const tabs = [
    { id: 'overview', label: 'Account Overview', icon: DollarSign },
    { id: 'transactions', label: 'Transaction Processing', icon: CreditCard },
    { id: 'history', label: 'Account History', icon: History },
    { id: 'interest', label: 'Interest Tracking', icon: TrendingUp },
    { id: 'analytics', label: 'Savings Analytics', icon: BarChart3 },
    { id: 'compulsory-savings', label: 'Compulsory Savings', icon: Shield },
    { id: 'geographic', label: 'Geographic Distribution', icon: MapPin },
    { id: 'regulatory-ratios', label: 'Regulatory Ratios', icon: Calculator }
  ];

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Savings Account Management</h1>
              {savingsLoading ? (
                <p className="text-blue-100">Loading account data from database...</p>
              ) : (
                <div>
                  <p className="text-blue-100">Account: {accountData.accountNumber} - {accountData.accountName}</p>
                  <p className="text-blue-200 text-sm mt-1">📊 Data source: Supabase Database</p>
                </div>
              )}
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowTransactionForm(true)}
                className="px-4 py-2 text-sm font-medium text-blue-600 bg-white rounded-lg hover:bg-blue-50 flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>New Transaction</span>
              </button>
              <button className="px-4 py-2 text-sm font-medium text-blue-600 bg-white border border-white rounded-lg hover:bg-blue-50 flex items-center space-x-2">
                <Download className="w-4 h-4" />
                <span>Export</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`whitespace-nowrap flex py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="-ml-0.5 mr-2 h-5 w-5" aria-hidden="true" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Account Overview */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Main Balance Panel */}
                  <div className="lg:col-span-2 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Account Balance</h3>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">Last updated:</span>
                        <span className="text-sm font-medium text-gray-900">
                          {new Date(accountData.lastUpdated).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="text-center">
                        <div className="text-4xl font-bold text-gray-900 mb-2">
                          {formatCurrency(accountData.availableBalance, accountData.currency)}
                        </div>
                        <div className="text-lg text-gray-600">Available Balance</div>
                        <div className="flex items-center justify-center space-x-4 mt-2">
                          <div className="flex items-center space-x-1 text-green-600">
                            <TrendingUp className="w-4 h-4" />
                            <span className="text-sm">+2.5% this month</span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-blue-200">
                        <div className="text-center">
                          <div className="text-lg font-semibold text-gray-700">
                            {formatCurrency(accountData.ledgerBalance, accountData.currency)}
                          </div>
                          <div className="text-sm text-gray-600">Ledger Balance</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-semibold text-gray-700">
                            {formatCurrency(accountData.clearedBalance, accountData.currency)}
                          </div>
                          <div className="text-sm text-gray-600">Cleared Balance</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Account Status */}
                  <div className="bg-white rounded-xl p-6 border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Status</h3>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Primary Status</span>
                        <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium ${
                          accountData.status === 'active' ? 'text-green-600 bg-green-100' : 'text-gray-600 bg-gray-100'
                        }`}>
                          <CheckCircle2 className="w-4 h-4" />
                          <span className="capitalize">{accountData.status}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">KYC Compliance</span>
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span className="text-sm font-medium text-green-600 capitalize">{accountData.kycCompliance}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Risk Rating</span>
                        <div className="flex items-center space-x-2">
                          <Shield className="w-4 h-4 text-green-500" />
                          <span className="text-sm font-medium text-green-600 capitalize">{accountData.riskRating}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Days Since Activity</span>
                        <span className="text-sm font-medium text-gray-900">{accountData.daysSinceLastActivity} days</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Balance Breakdown */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Uncleared Deposits</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {formatCurrency(accountData.unclearedDeposits, accountData.currency)}
                        </p>
                      </div>
                      <Clock className="w-8 h-8 text-yellow-500" />
                    </div>
                  </div>

                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Hold Amounts</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {formatCurrency(accountData.holdAmounts, accountData.currency)}
                        </p>
                      </div>
                      <AlertTriangle className="w-8 h-8 text-orange-500" />
                    </div>
                  </div>

                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Reserved Funds</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {formatCurrency(accountData.reservedFunds, accountData.currency)}
                        </p>
                      </div>
                      <Shield className="w-8 h-8 text-blue-500" />
                    </div>
                  </div>

                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Interest Rate</p>
                        <p className="text-lg font-semibold text-gray-900">{accountData.interestRate}%</p>
                      </div>
                      <TrendingUp className="w-8 h-8 text-green-500" />
                    </div>
                  </div>
                </div>

                {/* Interest Earned Summary */}
                <div className="bg-white rounded-xl p-6 border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Interest Earned to Date</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600 mb-2">
                        {formatCurrency(accountData.totalInterestEarned, accountData.currency)}
                      </div>
                      <div className="text-sm text-gray-600">Total Interest Earned (YTD)</div>
                    </div>

                    <div className="text-center">
                      <div className="text-2xl font-semibold text-gray-900 mb-2">
                        {new Date(accountData.lastInterestPosting).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-gray-600">Last Interest Posting</div>
                    </div>

                    <div className="text-center">
                      <div className="text-2xl font-semibold text-gray-900 mb-2">
                        {new Date(accountData.nextInterestPosting).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-gray-600">Next Interest Posting</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'transactions' && (
              <div className="space-y-6">
                {/* Transaction Processing */}
                <div className="bg-white rounded-xl p-6 border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">Transaction Processing</h3>
                  
                  {!showTransactionForm ? (
                    <div className="text-center py-12">
                      <CreditCard className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Process New Transaction</h3>
                      <p className="text-gray-600 mb-6">Select a transaction type to begin processing</p>
                      <div className="flex justify-center space-x-4">
                        <button
                          onClick={() => {
                            setTransactionType('deposit');
                            setShowTransactionForm(true);
                          }}
                          className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2"
                        >
                          <Plus className="w-5 h-5" />
                          <span>Deposit</span>
                        </button>
                        <button
                          onClick={() => {
                            setTransactionType('withdrawal');
                            setShowTransactionForm(true);
                          }}
                          className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center space-x-2"
                        >
                          <Minus className="w-5 h-5" />
                          <span>Withdrawal</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <h4 className="text-lg font-medium text-gray-900">
                          {transactionType === 'deposit' ? 'Deposit' : 'Withdrawal'} Transaction
                        </h4>
                        <button
                          onClick={() => setShowTransactionForm(false)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <XCircle className="w-6 h-6" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Amount *
                          </label>
                          <CurrencyInput
                            value={transactionForm.amount}
                            currency={transactionForm.currency}
                            onValueChange={(value) => setTransactionForm(prev => ({ ...prev, amount: value }))}
                            onCurrencyChange={(currency) => setTransactionForm(prev => ({ ...prev, currency }))}
                            placeholder="0.00"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            {transactionType === 'deposit' ? 'Deposit' : 'Withdrawal'} Method *
                          </label>
                          <select
                            value={transactionForm.method}
                            onChange={(e) => setTransactionForm(prev => ({ ...prev, method: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="">Select method</option>
                            {transactionType === 'deposit' ? (
                              <>
                                <option value="cash">Cash Deposit</option>
                                <option value="check">Check Deposit</option>
                                <option value="transfer">Electronic Transfer</option>
                                <option value="mobile">Mobile Money</option>
                                <option value="salary">Salary/Pension</option>
                              </>
                            ) : (
                              <>
                                <option value="cash">Cash Withdrawal</option>
                                <option value="transfer">Electronic Transfer</option>
                                <option value="check">Check Issuance</option>
                                <option value="mobile">Mobile Money</option>
                                <option value="bill">Bill Payment</option>
                              </>
                            )}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Reference Number
                          </label>
                          <input
                            type="text"
                            value={transactionForm.reference}
                            onChange={(e) => setTransactionForm(prev => ({ ...prev, reference: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Enter reference number"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Purpose
                          </label>
                          <select
                            value={transactionForm.purpose}
                            onChange={(e) => setTransactionForm(prev => ({ ...prev, purpose: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="">Select purpose</option>
                            <option value="personal">Personal Use</option>
                            <option value="business">Business</option>
                            <option value="emergency">Emergency</option>
                            <option value="investment">Investment</option>
                            <option value="other">Other</option>
                          </select>
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Description
                          </label>
                          <textarea
                            value={transactionForm.description}
                            onChange={(e) => setTransactionForm(prev => ({ ...prev, description: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            rows={3}
                            placeholder="Enter transaction description"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end space-x-4">
                        <button
                          onClick={() => setShowTransactionForm(false)}
                          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => {
                            // Handle transaction processing
                            toast.success('Transaction processed successfully!');
                            setShowTransactionForm(false);
                          }}
                          disabled={!transactionForm.amount || !transactionForm.method}
                          className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                        >
                          <CheckCircle className="w-4 h-4" />
                          <span>Process Transaction</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'history' && (
              <div className="space-y-6">
                {/* Enhanced Account History */}
                <div className="bg-white rounded-xl p-6 border border-gray-200">
                  {/* Header with Advanced Controls */}
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Transaction History - Account {accountData.accountNumber}</h3>
                      <p className="text-sm text-gray-600 mt-1">Advanced data grid with filtering and search capabilities</p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => setShowStatementDialog(true)}
                        className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700"
                      >
                        <FileText className="w-4 h-4" />
                        <span>Generate Statement</span>
                      </button>
                      <div className="flex items-center space-x-2">
                        <button className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                          <FileSpreadsheet className="w-4 h-4" />
                          <span>Export Excel</span>
                        </button>
                        <button className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                          <File className="w-4 h-4" />
                          <span>Export PDF</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Advanced Filter and Search Bar */}
                  <div className="mb-6 space-y-4">
                    <div className="flex items-center space-x-4">
                      <div className="flex-1 relative">
                        <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Smart search: 'electric bill payment', '$125.67', 'ATM withdrawal'..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <button
                        onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                        className="flex items-center space-x-2 px-4 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        <Filter className="w-4 h-4" />
                        <span>Advanced Filters</span>
                        <ChevronDown className={`w-4 h-4 transition-transform ${showAdvancedFilters ? 'rotate-180' : ''}`} />
                      </button>
                  </div>

                    {/* Advanced Filter Panel */}
                    {showAdvancedFilters && (
                      <div className="p-6 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
                            <div className="space-y-2">
                              <input
                                type="date"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="From"
                              />
                              <input
                                type="date"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="To"
                              />
                        </div>
                          </div>
                          
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Transaction Types</label>
                            <div className="space-y-2">
                              {['Deposits', 'Withdrawals', 'Transfers', 'Interest', 'Fees', 'Adjustments'].map(type => (
                                <label key={type} className="flex items-center">
                                  <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" defaultChecked />
                                  <span className="ml-2 text-sm text-gray-700">{type}</span>
                                </label>
                              ))}
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Amount Range</label>
                            <div className="space-y-2">
                              <input
                                type="number"
                                placeholder="Min amount"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              />
                              <input
                                type="number"
                                placeholder="Max amount"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              />
                        </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Channel</label>
                            <div className="space-y-2">
                              {['Branch', 'ATM', 'Mobile', 'Online', 'Phone', 'Mail'].map(channel => (
                                <label key={channel} className="flex items-center">
                                  <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" defaultChecked />
                                  <span className="ml-2 text-sm text-gray-700">{channel}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between mt-6">
                          <div className="flex items-center space-x-4">
                            <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">
                            Apply Filters
                          </button>
                            <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                              Clear All
                            </button>
                            <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                              Save Filter Set
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                  </div>

                  {/* Advanced Data Grid */}
                  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    {/* Column Visibility Controls */}
                    <div className="px-6 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <span className="text-sm font-medium text-gray-700">Columns:</span>
                        <div className="flex items-center space-x-2">
                          {Object.entries(selectedColumns).map(([key, visible]) => (
                            <label key={key} className="flex items-center">
                              <input
                                type="checkbox"
                                checked={visible}
                                onChange={(e) => setSelectedColumns(prev => ({ ...prev, [key]: e.target.checked }))}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="ml-1 text-sm text-gray-700 capitalize">{key}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-500">Rows per page:</span>
                        <select
                          value={pageSize}
                          onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                          className="px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value={25}>25</option>
                          <option value={50}>50</option>
                          <option value={100}>100</option>
                        </select>
                      </div>
                    </div>

                    {/* Data Table */}
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left">
                              <input
                                type="checkbox"
                                checked={selectedRows.length === transactions.length}
                                onChange={handleSelectAll}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                            </th>
                            {selectedColumns.date && (
                              <th 
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                onClick={() => handleSort('date')}
                              >
                                <div className="flex items-center space-x-1">
                                  <span>Date</span>
                                  {sortConfig?.key === 'date' && (
                                    sortConfig.direction === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                                  )}
                                </div>
                              </th>
                            )}
                            {selectedColumns.type && (
                              <th 
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                onClick={() => handleSort('type')}
                              >
                                <div className="flex items-center space-x-1">
                                  <span>Type</span>
                                  {sortConfig?.key === 'type' && (
                                    sortConfig.direction === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                                  )}
                                </div>
                              </th>
                            )}
                            {selectedColumns.description && (
                              <th 
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                onClick={() => handleSort('description')}
                              >
                                <div className="flex items-center space-x-1">
                                  <span>Description</span>
                                  {sortConfig?.key === 'description' && (
                                    sortConfig.direction === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                                  )}
                                </div>
                              </th>
                            )}
                            {selectedColumns.debit && (
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Debit</th>
                            )}
                            {selectedColumns.credit && (
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Credit</th>
                            )}
                            {selectedColumns.balance && (
                              <th 
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                onClick={() => handleSort('balance')}
                              >
                                <div className="flex items-center space-x-1">
                                  <span>Balance</span>
                                  {sortConfig?.key === 'balance' && (
                                    sortConfig.direction === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                                  )}
                                </div>
                              </th>
                            )}
                            {selectedColumns.channel && (
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Channel</th>
                            )}
                            {selectedColumns.status && (
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            )}
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                          {paginatedTransactions.map((transaction, index) => (
                            <React.Fragment key={transaction.id}>
                              <tr className={`hover:bg-gray-50 ${selectedRows.includes(index) ? 'bg-blue-50' : ''}`}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <input
                                    type="checkbox"
                                    checked={selectedRows.includes(index)}
                                    onChange={() => handleRowSelect(index)}
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                  />
                                </td>
                                {selectedColumns.date && (
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    <div>
                                      <div className="font-medium">{formatDate(transaction.date)}</div>
                                      <div className="text-gray-500 text-xs">{formatTime(transaction.date)}</div>
                                    </div>
                            </td>
                                )}
                                {selectedColumns.type && (
                            <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center space-x-2">
                                      {getTransactionIcon(transaction.type)}
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                transaction.type === 'deposit' 
                                  ? 'bg-green-100 text-green-800' 
                                          : transaction.type === 'withdrawal'
                                          ? 'bg-red-100 text-red-800'
                                          : transaction.type === 'interest'
                                          ? 'bg-purple-100 text-purple-800'
                                          : 'bg-blue-100 text-blue-800'
                                      }`}>
                                {transaction.type}
                              </span>
                                    </div>
                            </td>
                                )}
                                {selectedColumns.description && (
                                  <td className="px-6 py-4 text-sm text-gray-900">
                                    <div className="max-w-xs">
                                      <div className="font-medium">{transaction.description}</div>
                                      {transaction.reference && (
                                        <div className="text-gray-500 text-xs">Ref: {transaction.reference}</div>
                                      )}
                                    </div>
                            </td>
                                )}
                                {selectedColumns.debit && (
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    {transaction.type === 'withdrawal' || transaction.type === 'payment' ? (
                                      <span className="text-red-600">
                                {formatCurrency(transaction.amount, accountData.currency)}
                              </span>
                                    ) : (
                                      <span className="text-gray-400">-</span>
                                    )}
                            </td>
                                )}
                                {selectedColumns.credit && (
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    {transaction.type === 'deposit' || transaction.type === 'interest' || transaction.type === 'transfer' ? (
                                      <span className="text-green-600">
                                        +{formatCurrency(transaction.amount, accountData.currency)}
                                      </span>
                                    ) : (
                                      <span className="text-gray-400">-</span>
                                    )}
                                  </td>
                                )}
                                {selectedColumns.balance && (
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {formatCurrency(transaction.balance, accountData.currency)}
                            </td>
                                )}
                                {selectedColumns.channel && (
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    <div className="flex items-center space-x-2">
                                      {getChannelIcon(transaction.channel)}
                                      <span>{transaction.channel}</span>
                                    </div>
                            </td>
                                )}
                                {selectedColumns.status && (
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                transaction.status === 'cleared' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {transaction.status}
                              </span>
                            </td>
                                )}
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                  <div className="flex items-center space-x-2">
                                    <button 
                                      onClick={() => handleRowExpand(index)}
                                      className="text-blue-600 hover:text-blue-900"
                                      title="View Details"
                                    >
                                  <Eye className="w-4 h-4" />
                                </button>
                                    <button className="text-gray-600 hover:text-gray-900" title="Download Receipt">
                                  <Receipt className="w-4 h-4" />
                                </button>
                                    <button className="text-gray-600 hover:text-gray-900" title="More Actions">
                                      <MoreHorizontal className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                              
                              {/* Expandable Row Details */}
                              {expandedRows.includes(index) && (
                                <tr className="bg-gray-50">
                                  <td colSpan={Object.values(selectedColumns).filter(Boolean).length + 2} className="px-6 py-4">
                                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                                      <h4 className="font-medium text-gray-900 mb-3">Transaction Details</h4>
                                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                        <div>
                                          <span className="text-gray-500">Transaction ID:</span>
                                          <div className="font-medium">{transaction.id}</div>
                                        </div>
                                        <div>
                                          <span className="text-gray-500">Branch:</span>
                                          <div className="font-medium">{transaction.branch}</div>
                                        </div>
                                        <div>
                                          <span className="text-gray-500">Fees:</span>
                                          <div className="font-medium">{formatCurrency(transaction.fees ?? 0, accountData.currency)}</div>
                                        </div>
                                        <div>
                                          <span className="text-gray-500">Tax:</span>
                                          <div className="font-medium">{formatCurrency(transaction.tax ?? 0, accountData.currency)}</div>
                                        </div>
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                        ))}
                      </tbody>
                    </table>
                  </div>

                    {/* Pagination Controls */}
                    <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-700">
                            Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, filteredTransactions.length)} of {filteredTransactions.length} transactions
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handlePageChange(1)}
                            disabled={currentPage === 1}
                            className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <ChevronsLeft className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <span className="px-3 py-1 text-sm text-gray-700">
                            Page {currentPage} of {totalPages}
                          </span>
                          <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handlePageChange(totalPages)}
                            disabled={currentPage === totalPages}
                            className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <ChevronsRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Balance Trend Chart */}
                <div className="bg-white rounded-xl p-6 border border-gray-200">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Balance Trend Analysis</h3>
                      <p className="text-sm text-gray-600 mt-1">Interactive chart showing account balance over time</p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <select
                        value={balanceChartPeriod}
                        onChange={(e) => setBalanceChartPeriod(e.target.value)}
                        className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="6months">Last 6 months</option>
                        <option value="12months">Last 12 months</option>
                        <option value="24months">Last 24 months</option>
                        <option value="5years">Last 5 years</option>
                      </select>
                      <select
                        value={chartType}
                        onChange={(e) => setChartType(e.target.value)}
                        className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="line">Line Chart</option>
                        <option value="bar">Bar Chart</option>
                        <option value="area">Area Chart</option>
                      </select>
                      <button className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                        <Share2 className="w-4 h-4" />
                        <span>Share</span>
                      </button>
                    </div>
                  </div>

                  {/* Chart Placeholder */}
                  <div className="bg-gray-50 rounded-lg p-8 border-2 border-dashed border-gray-300">
                    <div className="text-center">
                      <BarChart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h4 className="text-lg font-medium text-gray-900 mb-2">Balance Trend Chart</h4>
                      <p className="text-gray-600 mb-4">
                        Interactive chart showing balance progression over {balanceChartPeriod.replace('months', ' months').replace('years', ' years')}
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
                        <div className="bg-white rounded-lg p-4 border border-gray-200">
                          <div className="text-2xl font-bold text-green-600">+116%</div>
                          <div className="text-sm text-gray-600">Growth Rate</div>
                        </div>
                        <div className="bg-white rounded-lg p-4 border border-gray-200">
                          <div className="text-2xl font-bold text-blue-600">+$583</div>
                          <div className="text-sm text-gray-600">Avg Monthly Growth</div>
                        </div>
                        <div className="bg-white rounded-lg p-4 border border-gray-200">
                          <div className="text-2xl font-bold text-purple-600">$13,001</div>
                          <div className="text-sm text-gray-600">Highest Balance</div>
                        </div>
                        <div className="bg-white rounded-lg p-4 border border-gray-200">
                          <div className="text-2xl font-bold text-orange-600">$5,234</div>
                          <div className="text-sm text-gray-600">Lowest Balance</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Chart Options */}
                  <div className="mt-6 flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <label className="flex items-center">
                        <input type="checkbox" defaultChecked className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                        <span className="ml-2 text-sm text-gray-700">Show Interest Postings</span>
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" defaultChecked className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                        <span className="ml-2 text-sm text-gray-700">Mark Large Transactions</span>
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                        <span className="ml-2 text-sm text-gray-700">Compare to Previous Year</span>
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                        <Download className="w-4 h-4" />
                        <span>Export Chart</span>
                      </button>
                      <button className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                        <Printer className="w-4 h-4" />
                        <span>Print</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Interest Posting History */}
                <div className="bg-white rounded-xl p-6 border border-gray-200">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Interest Posting History - 2024</h3>
                      <p className="text-sm text-gray-600 mt-1">Detailed tracking of interest calculations and postings</p>
                    </div>
                    <button
                      onClick={() => setShowInterestDetails(!showInterestDetails)}
                      className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      <Info className="w-4 h-4" />
                      <span>Calculation Details</span>
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Period</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rate</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Interest</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tax</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Net Interest</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {interestHistory.map((interest) => (
                          <tr key={interest.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {interest.date}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {interest.period}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {interest.rate}%
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatCurrency(interest.balance, accountData.currency)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                              +{formatCurrency(interest.interest, accountData.currency)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                              -{formatCurrency(interest.tax, accountData.currency)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {formatCurrency(interest.netInterest, accountData.currency)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <button className="text-blue-600 hover:text-blue-900">
                                <Eye className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Interest Summary */}
                  <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-sm text-gray-600">YTD Total Interest</div>
                      <div className="text-2xl font-bold text-green-600">
                        {formatCurrency(124785, accountData.currency)}
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-sm text-gray-600">Average Monthly Interest</div>
                      <div className="text-2xl font-bold text-blue-600">
                        {formatCurrency(10399, accountData.currency)}
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-sm text-gray-600">Net Interest (After Tax)</div>
                      <div className="text-2xl font-bold text-purple-600">
                        {formatCurrency(112306, accountData.currency)}
                      </div>
                    </div>
                  </div>

                  {/* Interest Calculation Details */}
                  {showInterestDetails && (
                    <div className="mt-6 bg-gray-50 rounded-lg p-6">
                      <h4 className="font-medium text-gray-900 mb-4">Interest Calculation Details</h4>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Calculation Method:</span>
                            <div className="font-medium">Average Daily Balance</div>
                          </div>
                          <div>
                            <span className="text-gray-500">Interest Rate:</span>
                            <div className="font-medium">4.25% APY</div>
                          </div>
                          <div>
                            <span className="text-gray-500">Days in Period:</span>
                            <div className="font-medium">30 days</div>
                          </div>
                          <div>
                            <span className="text-gray-500">Tax Rate:</span>
                            <div className="font-medium">10%</div>
                          </div>
                        </div>
                        <div className="border-t border-gray-200 pt-4">
                          <h5 className="font-medium text-gray-900 mb-2">Daily Balance Breakdown (November 2024)</h5>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500">Nov 1-15:</span>
                              <div className="font-medium">{formatCurrency(1045678, accountData.currency)} (15 days)</div>
                            </div>
                            <div>
                              <span className="text-gray-500">Nov 16-22:</span>
                              <div className="font-medium">{formatCurrency(1178923, accountData.currency)} (7 days)</div>
                            </div>
                            <div>
                              <span className="text-gray-500">Nov 23-30:</span>
                              <div className="font-medium">{formatCurrency(1199845, accountData.currency)} (8 days)</div>
                            </div>
                          </div>
                        </div>
                        <div className="border-t border-gray-200 pt-4">
                          <h5 className="font-medium text-gray-900 mb-2">Calculation Formula</h5>
                          <div className="bg-white rounded p-3 text-sm font-mono">
                            <div>Average Daily Balance: {formatCurrency(1123452, accountData.currency)}</div>
                            <div>Annual Rate: 4.25%</div>
                            <div>Daily Rate: 0.01164% (4.25% ÷ 365)</div>
                            <div>Interest = $11,234.52 × 0.01164% × 30</div>
                            <div>Gross Interest: {formatCurrency(3979, accountData.currency)}</div>
                            <div>Tax (10%): {formatCurrency(398, accountData.currency)}</div>
                            <div className="font-bold">Net Interest Posted: {formatCurrency(3581, accountData.currency)}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'interest' && (
              <div className="space-y-6">
                {/* Interest Tracking */}
                <div className="bg-white rounded-xl p-6 border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">Interest Posting History</h3>
                  
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Posting Date</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Period</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rate</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Interest</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tax</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Net</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        <tr className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date('2024-01-31').toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            January 2024
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            2.5%
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(2400000, accountData.currency)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                            {formatCurrency(5000, accountData.currency)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(0, accountData.currency)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                            {formatCurrency(5000, accountData.currency)}
                          </td>
                        </tr>
                        <tr className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date('2023-12-31').toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            December 2023
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            2.5%
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(2000000, accountData.currency)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                            {formatCurrency(4167, accountData.currency)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(0, accountData.currency)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                            {formatCurrency(4167, accountData.currency)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'analytics' && (
              <div className="space-y-6">
                {/* Enhanced Savings Analytics Dashboard */}
                <div className="bg-white rounded-xl p-6 border border-gray-200">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-gray-900">Savings Analytics Dashboard</h3>
                    <div className="flex items-center gap-4">
                      <select
                        value={selectedTimeframe}
                        onChange={(e) => handleTimeframeChange(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="YTD">Year to Date</option>
                        <option value="QTD">Quarter to Date</option>
                        <option value="MTD">Month to Date</option>
                        <option value="12M">Last 12 Months</option>
                      </select>
                      <button
                        onClick={() => setShowAdvancedAnalytics(!showAdvancedAnalytics)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        {showAdvancedAnalytics ? 'Hide' : 'Show'} Advanced
                      </button>
                    </div>
                  </div>

                  {/* Key Metrics Overview */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-blue-600">Total Savings</p>
                          <p className="text-2xl font-bold text-blue-900">
                            {formatCurrency(savingsAnalytics.realTimeMetrics.totalSavings)}
                          </p>
                          <p className="text-xs text-blue-600 mt-1">
                            +{formatPercentage(savingsAnalytics.realTimeMetrics.growthRate)} vs last period
                          </p>
                      </div>
                        <DollarSign className="w-8 h-8 text-blue-600" />
                    </div>
                      </div>

                    <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-green-600">Account Count</p>
                          <p className="text-2xl font-bold text-green-900">
                            {savingsAnalytics.realTimeMetrics.accountCount.toLocaleString()}
                          </p>
                          <p className="text-xs text-green-600 mt-1">
                            {formatPercentage(savingsAnalytics.realTimeMetrics.turnoverRate)} turnover rate
                          </p>
                    </div>
                        <Users className="w-8 h-8 text-green-600" />
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-purple-600">Average Balance</p>
                          <p className="text-2xl font-bold text-purple-900">
                            {formatCurrency(savingsAnalytics.realTimeMetrics.averageBalance)}
                          </p>
                          <p className="text-xs text-purple-600 mt-1">
                            Per account
                          </p>
                        </div>
                        <BarChart3 className="w-8 h-8 text-purple-600" />
                    </div>
                  </div>

                    <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-orange-600">Growth Rate</p>
                          <p className="text-2xl font-bold text-orange-900">
                            {formatPercentage(savingsAnalytics.realTimeMetrics.growthRate)}
                          </p>
                          <p className="text-xs text-orange-600 mt-1">
                            Year over year
                          </p>
                        </div>
                        <TrendingUp className="w-8 h-8 text-orange-600" />
                      </div>
                    </div>
                  </div>

                  {/* Distribution Analysis Charts */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    {/* Savings by Account Type */}
                    <div className="bg-gray-50 rounded-lg p-6">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">Savings by Account Type</h4>
                      <div className="space-y-4">
                        {savingsAnalytics.distributionAnalysis.byAccountType.map((type, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className={`w-3 h-3 rounded-full ${
                                type.accountType === 'Compulsory' ? 'bg-blue-500' :
                                type.accountType === 'Voluntary' ? 'bg-green-500' :
                                'bg-purple-500'
                              }`} />
                              <div>
                                <p className="font-medium text-gray-900">{type.accountType}</p>
                                <p className="text-sm text-gray-600">
                                  {type.accountCount.toLocaleString()} accounts
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-gray-900">
                                {formatCurrency(type.totalBalance)}
                              </p>
                              <p className="text-sm text-gray-600">
                                {formatPercentage(type.percentageOfTotal)} of total
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Balance Distribution */}
                    <div className="bg-gray-50 rounded-lg p-6">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">Balance Distribution</h4>
                      <div className="space-y-4">
                        {savingsAnalytics.distributionAnalysis.byBalance.map((balance, index) => (
                          <div key={index} className="p-3 bg-white rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-gray-900">{balance.balanceRange.label}</span>
                              <span className={`px-2 py-1 rounded text-xs ${getSegmentColor(balance.customerSegment.segment)}`}>
                                {balance.customerSegment.segment}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-sm text-gray-600">
                              <span>{balance.accountCount.toLocaleString()} accounts</span>
                              <span>{formatCurrency(balance.totalBalance)}</span>
                            </div>
                            <div className="mt-2">
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-blue-600 h-2 rounded-full" 
                                  style={{ width: `${balance.percentageOfAccounts * 100}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Performance Metrics */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Performance Indicators</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="bg-white rounded-lg p-4 text-center">
                        <p className="text-sm text-gray-600 mb-1">Mobilization Rate</p>
                        <p className="text-2xl font-bold text-green-600">
                          {formatPercentage(savingsAnalytics.performanceMetrics.mobilizationRate)}
                        </p>
                        <p className="text-xs text-gray-500">Target: 15%</p>
                      </div>
                      <div className="bg-white rounded-lg p-4 text-center">
                        <p className="text-sm text-gray-600 mb-1">Retention Rate</p>
                        <p className="text-2xl font-bold text-blue-600">
                          {formatPercentage(savingsAnalytics.performanceMetrics.retentionRate)}
                        </p>
                        <p className="text-xs text-gray-500">Target: 90%</p>
                      </div>
                      <div className="bg-white rounded-lg p-4 text-center">
                        <p className="text-sm text-gray-600 mb-1">Dormancy Rate</p>
                        <p className="text-2xl font-bold text-red-600">
                          {formatPercentage(savingsAnalytics.performanceMetrics.dormancyRate)}
                        </p>
                        <p className="text-xs text-gray-500">Max: 5%</p>
                      </div>
                      <div className="bg-white rounded-lg p-4 text-center">
                        <p className="text-sm text-gray-600 mb-1">Cost of Funds</p>
                        <p className="text-2xl font-bold text-orange-600">
                          {formatPercentage(savingsAnalytics.performanceMetrics.costOfFunds)}
                        </p>
                        <p className="text-xs text-gray-500">Target: 8%</p>
                      </div>
                    </div>
                  </div>

                  {/* Advanced Analytics (if enabled) */}
                  {showAdvancedAnalytics && (
                    <div className="mt-8 space-y-6">
                      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-6">
                        <h4 className="text-lg font-semibold text-gray-900 mb-4">Predictive Insights</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-white rounded-lg p-4">
                            <h5 className="font-medium text-gray-900 mb-2">Growth Projection</h5>
                            <p className="text-sm text-gray-600">
                              Based on current trends, savings are projected to grow by 15-20% in the next quarter.
                            </p>
                          </div>
                          <div className="bg-white rounded-lg p-4">
                            <h5 className="font-medium text-gray-900 mb-2">Risk Assessment</h5>
                            <p className="text-sm text-gray-600">
                              Low risk profile with 92% retention rate and stable growth patterns.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'compulsory-savings' && (
              <div className="space-y-6">
                {/* Enhanced Compulsory Savings Tracker */}
                <div className="bg-white rounded-xl p-6 border border-gray-200">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-gray-900">Compulsory Savings Tracker (MSP2_01.C46)</h3>
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => generateComplianceReport()}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        Generate Report
                      </button>
                      <button
                        onClick={() => exportMSP201C46Data()}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                      >
                        Export Data
                      </button>
                    </div>
                  </div>

                  {/* MSP2_01.C46 Summary */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 mb-8">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-semibold text-gray-900">MSP2_01.C46 Summary</h4>
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${getComplianceStatusColor(compulsorySavings.complianceMonitoring.overallStatus)}`} />
                        <span className="text-sm font-medium text-gray-700">
                          {compulsorySavings.complianceMonitoring.overallStatus}
                        </span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="bg-white rounded-lg p-4 text-center">
                        <p className="text-sm text-gray-600 mb-1">Current Balance</p>
                        <p className="text-2xl font-bold text-blue-600">
                          {formatCurrency(compulsorySavings.msp201C46Data.currentBalance)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatPercentage(compulsorySavings.msp201C46Data.changePercentage)} vs last period
                        </p>
                      </div>
                      <div className="bg-white rounded-lg p-4 text-center">
                        <p className="text-sm text-gray-600 mb-1">Net Change</p>
                        <p className={`text-2xl font-bold ${compulsorySavings.msp201C46Data.netChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(compulsorySavings.msp201C46Data.netChange)}
                        </p>
                        <p className="text-xs text-gray-500">This period</p>
                      </div>
                      <div className="bg-white rounded-lg p-4 text-center">
                        <p className="text-sm text-gray-600 mb-1">Account Count</p>
                        <p className="text-2xl font-bold text-purple-600">
                          {compulsorySavings.detailedBreakdown.totalAccounts.toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-500">Active accounts</p>
                      </div>
                      <div className="bg-white rounded-lg p-4 text-center">
                        <p className="text-sm text-gray-600 mb-1">Last Updated</p>
                        <p className="text-lg font-semibold text-gray-700">
                          {compulsorySavings.msp201C46Data.lastUpdateTime.toLocaleTimeString()}
                        </p>
                        <p className="text-xs text-gray-500">Real-time</p>
                      </div>
                    </div>
                  </div>

                  {/* Detailed Breakdown */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    {/* By Client Category */}
                    <div className="bg-gray-50 rounded-lg p-6">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">By Client Category</h4>
                      <div className="space-y-3">
                        {compulsorySavings.detailedBreakdown.byClientCategory.map((category, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className={`w-3 h-3 rounded-full ${
                                category.category === 'Individual' ? 'bg-blue-500' :
                                category.category === 'Group' ? 'bg-green-500' :
                                'bg-purple-500'
                              }`} />
                              <div>
                                <p className="font-medium text-gray-900">{category.category}</p>
                                <p className="text-sm text-gray-600">
                                  {category.accountCount.toLocaleString()} accounts
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-gray-900">
                                {formatCurrency(category.totalBalance)}
                              </p>
                              <p className="text-sm text-gray-600">
                                {formatPercentage(category.percentageOfTotal)} of total
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* By Loan Status */}
                    <div className="bg-gray-50 rounded-lg p-6">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">By Loan Status</h4>
                      <div className="space-y-3">
                        {compulsorySavings.detailedBreakdown.byLoanStatus.map((status, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className={`w-3 h-3 rounded-full ${
                                status.status === 'Current' ? 'bg-green-500' :
                                status.status === 'Past Due' ? 'bg-yellow-500' :
                                status.status === 'Default' ? 'bg-red-500' :
                                'bg-gray-500'
                              }`} />
                              <div>
                                <p className="font-medium text-gray-900">{status.status}</p>
                                <p className="text-sm text-gray-600">
                                  {status.accountCount.toLocaleString()} accounts
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-gray-900">
                                {formatCurrency(status.totalBalance)}
                              </p>
                              <p className="text-sm text-gray-600">
                                {formatPercentage(status.percentageOfTotal)} of total
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Compliance Monitoring */}
                  <div className="bg-gray-50 rounded-lg p-6 mb-8">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Compliance Monitoring</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-white rounded-lg p-4 text-center">
                        <div className="flex items-center justify-center mb-2">
                          {getComplianceStatusIcon(compulsorySavings.complianceMonitoring.regulatoryCompliance)}
                        </div>
                        <p className="text-sm text-gray-600 mb-1">Regulatory Compliance</p>
                        <p className={`text-lg font-semibold ${getComplianceStatusColor(compulsorySavings.complianceMonitoring.regulatoryCompliance)}`}>
                          {compulsorySavings.complianceMonitoring.regulatoryCompliance}
                        </p>
                      </div>
                      <div className="bg-white rounded-lg p-4 text-center">
                        <div className="flex items-center justify-center mb-2">
                          {getComplianceStatusIcon(compulsorySavings.complianceMonitoring.reportingAccuracy)}
                        </div>
                        <p className="text-sm text-gray-600 mb-1">Reporting Accuracy</p>
                        <p className={`text-lg font-semibold ${getComplianceStatusColor(compulsorySavings.complianceMonitoring.reportingAccuracy)}`}>
                          {compulsorySavings.complianceMonitoring.reportingAccuracy}
                        </p>
                      </div>
                      <div className="bg-white rounded-lg p-4 text-center">
                        <div className="flex items-center justify-center mb-2">
                          {getComplianceStatusIcon(compulsorySavings.complianceMonitoring.dataQuality)}
                        </div>
                        <p className="text-sm text-gray-600 mb-1">Data Quality</p>
                        <p className={`text-lg font-semibold ${getComplianceStatusColor(compulsorySavings.complianceMonitoring.dataQuality)}`}>
                          {compulsorySavings.complianceMonitoring.dataQuality}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Risk Analysis */}
                  <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Risk Analysis</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-white rounded-lg p-4">
                        <h5 className="font-medium text-gray-900 mb-2">Concentration Risk</h5>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Top 10% of accounts</span>
                            <span className="font-semibold">
                              {formatPercentage(compulsorySavings.riskAnalysis.concentrationRisk.top10Percent)} of total
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-red-500 h-2 rounded-full" 
                              style={{ width: `${compulsorySavings.riskAnalysis.concentrationRisk.top10Percent * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                      <div className="bg-white rounded-lg p-4">
                        <h5 className="font-medium text-gray-900 mb-2">Liquidity Risk</h5>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Withdrawal rate</span>
                            <span className="font-semibold">
                              {formatPercentage(compulsorySavings.riskAnalysis.liquidityRisk.withdrawalRate)} per month
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-yellow-500 h-2 rounded-full" 
                              style={{ width: `${compulsorySavings.riskAnalysis.liquidityRisk.withdrawalRate * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'geographic' && (
              <div className="space-y-6">
                {/* Enhanced Geographic Savings Distribution */}
                <div className="bg-white rounded-xl p-6 border border-gray-200">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-gray-900">Geographic Savings Distribution (MSP2_10)</h3>
                    <div className="flex items-center gap-4">
                      <select
                        value={selectedRegion}
                        onChange={(e) => handleRegionSelect(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="all">All Regions</option>
                        <option value="dar">Dar es Salaam</option>
                        <option value="arusha">Arusha</option>
                        <option value="mwanza">Mwanza</option>
                        <option value="dodoma">Dodoma</option>
                      </select>
                      <button
                        onClick={() => loadRegionalData(selectedRegion || 'all')}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        Refresh Data
                      </button>
                    </div>
                  </div>

                  {/* Regional Overview */}
                  <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6 mb-8">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Regional Overview</h4>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="bg-white rounded-lg p-4 text-center">
                        <p className="text-sm text-gray-600 mb-1">Total Regional Savings</p>
                        <p className="text-2xl font-bold text-green-600">
                          {formatCurrency(geographicDistribution?.msp210RegionalData?.totalSavings ?? 0)}
                        </p>
                        <p className="text-xs text-gray-500">Across all regions</p>
                      </div>
                      <div className="bg-white rounded-lg p-4 text-center">
                        <p className="text-sm text-gray-600 mb-1">Active Regions</p>
                        <p className="text-2xl font-bold text-blue-600">
                          {geographicDistribution?.msp210RegionalData.activeRegions ?? 0}
                        </p>
                        <p className="text-xs text-gray-500">With savings accounts</p>
                      </div>
                      <div className="bg-white rounded-lg p-4 text-center">
                        <p className="text-sm text-gray-600 mb-1">Average per Region</p>
                        <p className="text-2xl font-bold text-purple-600">
                          {formatCurrency(geographicDistribution?.msp210RegionalData.averagePerRegion ?? 0)}
                        </p>
                        <p className="text-xs text-gray-500">Mean regional balance</p>
                      </div>
                      <div className="bg-white rounded-lg p-4 text-center">
                        <p className="text-sm text-gray-600 mb-1">Growth Rate</p>
                        <p className="text-2xl font-bold text-orange-600">
                          {formatPercentage(geographicDistribution?.msp210RegionalData.growthRate ?? 0)}
                        </p>
                        <p className="text-xs text-gray-500">Year over year</p>
                      </div>
                    </div>
                  </div>

                  {/* Regional Performance Table */}
                  <div className="bg-gray-50 rounded-lg p-6 mb-8">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Regional Performance</h4>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Region</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Savings</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Account Count</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Growth Rate</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Market Share</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {geographicDistribution?.regionalAnalysis.map((region, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <MapPin className="w-4 h-4 text-gray-400 mr-2" />
                                  <span className="font-medium text-gray-900">{region.regionName}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {formatCurrency(region.totalSavings)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {region.accountCount.toLocaleString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`text-sm font-medium ${
                                  region.growthRate >= 0 ? 'text-green-600' : 'text-red-600'
                                }`}>
                                  {formatPercentage(region.growthRate)}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {formatPercentage(region.marketShare)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 py-1 text-xs rounded-full ${
                                  region.status === 'High Growth' ? 'bg-green-100 text-green-800' :
                                  region.status === 'Stable' ? 'bg-blue-100 text-blue-800' :
                                  'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {region.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Urban vs Rural Analysis */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-gray-50 rounded-lg p-6">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">Urban vs Rural Analysis</h4>
                      <div className="space-y-4">
                        <div className="bg-white rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-gray-900">Urban Areas</span>
                            <span className="text-sm text-gray-600">
                              {formatPercentage(geographicDistribution?.urbanRuralAnalysis?.urban?.percentageOfTotal ?? 0)} of total
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm text-gray-600">
                            <span>{formatCurrency(geographicDistribution?.urbanRuralAnalysis?.urban?.totalSavings ?? 0)}</span>
                            <span>{(geographicDistribution?.urbanRuralAnalysis?.urban?.accountCount ?? 0).toLocaleString()} accounts</span>
                          </div>
                          <div className="mt-2">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full" 
                                style={{ width: `${(geographicDistribution?.urbanRuralAnalysis?.urban?.percentageOfTotal ?? 0) * 100}%` }}
                              />
                            </div>
                          </div>
                        </div>
                        <div className="bg-white rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-gray-900">Rural Areas</span>
                            <span className="text-sm text-gray-600">
                              {formatPercentage(geographicDistribution?.urbanRuralAnalysis?.rural?.percentageOfTotal ?? 0)} of total
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm text-gray-600">
                            <span>{formatCurrency(geographicDistribution?.urbanRuralAnalysis?.rural?.totalSavings ?? 0)}</span>
                            <span>{(geographicDistribution?.urbanRuralAnalysis?.rural?.accountCount ?? 0).toLocaleString()} accounts</span>
                          </div>
                          <div className="mt-2">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-green-600 h-2 rounded-full" 
                                style={{ width: `${(geographicDistribution?.urbanRuralAnalysis?.rural?.percentageOfTotal ?? 0) * 100}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-6">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">Branch Performance by Region</h4>
                      <div className="space-y-3">
                        {(geographicDistribution?.branchPerformance || []).map((branch, index) => (
                          <div key={index} className="bg-white rounded-lg p-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-gray-900">{branch.branchName}</span>
                              <span className="text-sm text-gray-600">{branch.region}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm text-gray-600">
                              <span>{formatCurrency(branch.totalSavings)}</span>
                              <span className={`px-2 py-1 text-xs rounded ${
                                branch.efficiency >= 0.8 ? 'bg-green-100 text-green-800' :
                                branch.efficiency >= 0.6 ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {formatPercentage(branch.efficiency)} efficiency
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'regulatory-ratios' && (
              <div className="space-y-6">
                {/* Enhanced Regulatory Ratio Monitor */}
                <div className="bg-white rounded-xl p-6 border border-gray-200">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-gray-900">Regulatory Ratio Monitor</h3>
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => generateRatioReport()}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        Generate Report
                      </button>
                      <button
                        onClick={() => runStressTest()}
                        className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                      >
                        Run Stress Test
                      </button>
                    </div>
                  </div>

                  {/* Ratio Overview Dashboard */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-blue-600">Liquidity Ratio</p>
                          <p className="text-2xl font-bold text-blue-900">
                            {formatPercentage(regulatoryRatios?.coreRatios?.liquidity?.currentRatio ?? 0)}
                          </p>
                          <p className="text-xs text-blue-600 mt-1">
                            Target: {formatPercentage(regulatoryRatios?.coreRatios?.liquidity?.targetRatio ?? 0)}
                          </p>
                        </div>
                        <div className={`w-3 h-3 rounded-full ${
                          regulatoryRatios?.coreRatios.liquidity.status === 'Compliant' ? 'bg-green-500' :
                          regulatoryRatios?.coreRatios.liquidity.status === 'Warning' ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`} />
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-green-600">Capital Adequacy</p>
                          <p className="text-2xl font-bold text-green-900">
                            {formatPercentage(regulatoryRatios?.coreRatios?.capital?.currentRatio ?? 0)}
                          </p>
                          <p className="text-xs text-green-600 mt-1">
                            Target: {formatPercentage(regulatoryRatios?.coreRatios?.capital?.targetRatio ?? 0)}
                          </p>
                        </div>
                        <div className={`w-3 h-3 rounded-full ${
                          regulatoryRatios?.coreRatios.capital.status === 'Compliant' ? 'bg-green-500' :
                          regulatoryRatios?.coreRatios.capital.status === 'Warning' ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`} />
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-purple-600">PAR Ratio</p>
                          <p className="text-2xl font-bold text-purple-900">
                            {formatPercentage(regulatoryRatios?.coreRatios?.risk?.parRatio ?? 0)}
                          </p>
                          <p className="text-xs text-purple-600 mt-1">
                            Max: {formatPercentage(regulatoryRatios?.coreRatios?.risk?.maxParRatio ?? 0)}
                          </p>
                        </div>
                        <div className={`w-3 h-3 rounded-full ${
                          (regulatoryRatios?.coreRatios?.risk?.parRatio ?? 0) <= (regulatoryRatios?.coreRatios?.risk?.maxParRatio ?? 0) ? 'bg-green-500' : 'bg-red-500'
                        }`} />
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-orange-600">ROA</p>
                          <p className="text-2xl font-bold text-orange-900">
                            {formatPercentage(regulatoryRatios?.coreRatios?.efficiency?.roa ?? 0)}
                          </p>
                          <p className="text-xs text-orange-600 mt-1">
                            Target: {formatPercentage(regulatoryRatios?.coreRatios?.efficiency?.targetRoa ?? 0)}
                          </p>
                        </div>
                        <div className={`w-3 h-3 rounded-full ${
                          (regulatoryRatios?.coreRatios?.efficiency?.roa ?? 0) >= (regulatoryRatios?.coreRatios?.efficiency?.targetRoa ?? 0) ? 'bg-green-500' : 'bg-yellow-500'
                        }`} />
                      </div>
                    </div>
                  </div>

                  {/* Detailed Ratio Analysis Tabs */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <div className="flex space-x-1 mb-6">
                      {['Liquidity', 'Capital', 'Risk', 'Efficiency'].map((tab) => (
                        <button
                          key={tab}
                          className={`px-4 py-2 rounded-lg font-medium text-sm ${
                            selectedAnalyticsView === tab.toLowerCase() 
                              ? 'bg-blue-600 text-white' 
                              : 'bg-white text-gray-700 hover:bg-gray-100'
                          }`}
                          onClick={() => handleAnalyticsViewChange(tab.toLowerCase())}
                        >
                          {tab}
                        </button>
                      ))}
                    </div>

                    {selectedAnalyticsView === 'liquidity' && (
                      <div className="space-y-4">
                        <h4 className="text-lg font-semibold text-gray-900">Liquidity Analysis</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-white rounded-lg p-4">
                            <h5 className="font-medium text-gray-900 mb-2">Current Ratio Components</h5>
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span>Liquid Assets</span>
                                <span className="font-semibold">
                                  {formatCurrency(regulatoryRatios?.coreRatios?.liquidity?.liquidAssets ?? 0)}
                                </span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span>Total Deposits</span>
                                <span className="font-semibold">
                                  {formatCurrency(regulatoryRatios?.coreRatios?.liquidity?.totalDeposits ?? 0)}
                                </span>
                              </div>
                              <div className="flex justify-between text-sm font-medium">
                                <span>Current Ratio</span>
                                <span className="text-blue-600">
                                  {formatPercentage(regulatoryRatios?.coreRatios?.liquidity?.currentRatio ?? 0)}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="bg-white rounded-lg p-4">
                            <h5 className="font-medium text-gray-900 mb-2">Savings Impact</h5>
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span>Savings Contribution</span>
                                <span className="font-semibold">
                                  {formatCurrency(regulatoryRatios?.savingsImpactOnRatios?.liquidityImpact?.savingsContribution ?? 0)}
                                </span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span>Impact on Ratio</span>
                                <span className="font-semibold text-green-600">
                                  +{formatPercentage(regulatoryRatios?.savingsImpactOnRatios?.liquidityImpact?.ratioImpact ?? 0)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {selectedAnalyticsView === 'capital' && (
                      <div className="space-y-4">
                        <h4 className="text-lg font-semibold text-gray-900">Capital Adequacy Analysis</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-white rounded-lg p-4">
                            <h5 className="font-medium text-gray-900 mb-2">Capital Components</h5>
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span>Tier 1 Capital</span>
                                <span className="font-semibold">
                                  {formatCurrency(regulatoryRatios?.coreRatios?.capital?.tier1Capital ?? 0)}
                                </span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span>Risk Weighted Assets</span>
                                <span className="font-semibold">
                                  {formatCurrency(regulatoryRatios?.coreRatios?.capital?.riskWeightedAssets ?? 0)}
                                </span>
                              </div>
                              <div className="flex justify-between text-sm font-medium">
                                <span>Capital Ratio</span>
                                <span className="text-green-600">
                                  {formatPercentage(regulatoryRatios?.coreRatios?.capital?.currentRatio ?? 0)}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="bg-white rounded-lg p-4">
                            <h5 className="font-medium text-gray-900 mb-2">Savings Impact</h5>
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span>Savings as Capital</span>
                                <span className="font-semibold">
                                  {formatCurrency(regulatoryRatios?.savingsImpactOnRatios?.capitalImpact?.savingsAsCapital ?? 0)}
                                </span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span>Capital Ratio Boost</span>
                                <span className="font-semibold text-green-600">
                                  +{formatPercentage(regulatoryRatios?.savingsImpactOnRatios?.capitalImpact?.ratioBoost ?? 0)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {selectedAnalyticsView === 'risk' && (
                      <div className="space-y-4">
                        <h4 className="text-lg font-semibold text-gray-900">Risk Analysis</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-white rounded-lg p-4">
                            <h5 className="font-medium text-gray-900 mb-2">Risk Metrics</h5>
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span>Portfolio at Risk (PAR)</span>
                                <span className="font-semibold">
                                  {formatPercentage(regulatoryRatios?.coreRatios?.risk?.parRatio ?? 0)}
                                </span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span>Provision Coverage</span>
                                <span className="font-semibold">
                                  {formatPercentage(regulatoryRatios?.coreRatios?.risk?.provisionCoverage ?? 0)}
                                </span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span>Write-off Rate</span>
                                <span className="font-semibold">
                                  {formatPercentage(regulatoryRatios?.coreRatios?.risk?.writeOffRate ?? 0)}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="bg-white rounded-lg p-4">
                            <h5 className="font-medium text-gray-900 mb-2">Savings Risk Mitigation</h5>
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span>Savings Collateral</span>
                                <span className="font-semibold">
                                  {formatCurrency(regulatoryRatios?.savingsImpactOnRatios?.riskImpact?.savingsCollateral ?? 0)}
                                </span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span>Risk Reduction</span>
                                <span className="font-semibold text-green-600">
                                  -{formatPercentage(regulatoryRatios?.savingsImpactOnRatios?.riskImpact?.riskReduction ?? 0)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {selectedAnalyticsView === 'efficiency' && (
                      <div className="space-y-4">
                        <h4 className="text-lg font-semibold text-gray-900">Efficiency Analysis</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-white rounded-lg p-4">
                            <h5 className="font-medium text-gray-900 mb-2">Efficiency Metrics</h5>
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span>Return on Assets (ROA)</span>
                                <span className="font-semibold">
                                  {formatPercentage(regulatoryRatios?.coreRatios?.efficiency?.roa ?? 0)}
                                </span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span>Return on Equity (ROE)</span>
                                <span className="font-semibold">
                                  {formatPercentage(regulatoryRatios?.coreRatios?.efficiency?.roe ?? 0)}
                                </span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span>Cost to Income Ratio</span>
                                <span className="font-semibold">
                                  {formatPercentage(regulatoryRatios?.coreRatios?.efficiency?.costToIncome ?? 0)}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="bg-white rounded-lg p-4">
                            <h5 className="font-medium text-gray-900 mb-2">Savings Efficiency Impact</h5>
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span>Savings Revenue</span>
                                <span className="font-semibold">
                                  {formatCurrency(regulatoryRatios?.savingsImpactOnRatios?.efficiencyImpact?.savingsRevenue ?? 0)}
                                </span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span>ROA Improvement</span>
                                <span className="font-semibold text-green-600">
                                  +{formatPercentage(regulatoryRatios?.savingsImpactOnRatios?.efficiencyImpact?.roaImprovement ?? 0)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Real-time Alerts */}
                  <div className="mt-8 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Real-time Alerts</h4>
                    <div className="space-y-3">
                      {ratioAlerts.map((alert, index) => (
                        <div key={index} className="bg-white rounded-lg p-4 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${
                              alert.severity === 'High' ? 'bg-red-500' :
                              alert.severity === 'Medium' ? 'bg-yellow-500' :
                              'bg-blue-500'
                            }`} />
                            <div>
                              <p className="font-medium text-gray-900">{alert.ratio}</p>
                              <p className="text-sm text-gray-600">{alert.message}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-500">{alert.timestamp}</p>
                            <button
                              onClick={() => handleRatioAlert(alert.id, 'acknowledge')}
                              className="text-blue-600 hover:text-blue-800 text-sm"
                            >
                              Acknowledge
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Statement Generation Dialog */}
      {showStatementDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Generate Account Statement</h3>
              <button
                onClick={() => setShowStatementDialog(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Statement Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Statement Type</label>
                <div className="space-y-2">
                  {[
                    { id: 'monthly', label: 'Monthly (Dec 2024)', value: 'monthly' },
                    { id: 'quarterly', label: 'Quarterly (Q4 2024)', value: 'quarterly' },
                    { id: 'custom', label: 'Custom Range', value: 'custom' },
                    { id: 'annual', label: 'Annual (2024)', value: 'annual' }
                  ].map(option => (
                    <label key={option.id} className="flex items-center">
                      <input
                        type="radio"
                        name="statementType"
                        value={option.value}
                        checked={statementConfig.type === option.value}
                        onChange={(e) => setStatementConfig(prev => ({ ...prev, type: e.target.value }))}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Custom Date Range */}
              {statementConfig.type === 'custom' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Custom Date Range</label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">From</label>
                      <input
                        type="date"
                        value={statementConfig.startDate}
                        onChange={(e) => setStatementConfig(prev => ({ ...prev, startDate: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">To</label>
                      <input
                        type="date"
                        value={statementConfig.endDate}
                        onChange={(e) => setStatementConfig(prev => ({ ...prev, endDate: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Statement Format */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Statement Format</label>
                <div className="space-y-2">
                  {[
                    { id: 'pdf', label: 'PDF (Recommended)', icon: FileText },
                    { id: 'excel', label: 'Excel Spreadsheet', icon: FileSpreadsheet },
                    { id: 'csv', label: 'CSV Data File', icon: File },
                    { id: 'print', label: 'Print-Ready Format', icon: Printer }
                  ].map(format => (
                    <label key={format.id} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={statementConfig.format.includes(format.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setStatementConfig(prev => ({ 
                              ...prev, 
                              format: [...prev.format, format.id] 
                            }));
                          } else {
                            setStatementConfig(prev => ({ 
                              ...prev, 
                              format: prev.format.filter(f => f !== format.id) 
                            }));
                          }
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <format.icon className="w-4 h-4 ml-2 text-gray-600" />
                      <span className="ml-2 text-sm text-gray-700">{format.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Include Sections */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Include Sections</label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(statementConfig.sections).map(([key, value]) => (
                    <label key={key} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={value}
                        onChange={(e) => setStatementConfig(prev => ({ 
                          ...prev, 
                          sections: { ...prev.sections, [key]: e.target.checked } 
                        }))}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Delivery Method */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Delivery Method</label>
                <div className="space-y-2">
                  {[
                    { id: 'download', label: 'Download Now', icon: Download },
                    { id: 'email', label: 'Email to john.doe@email.com', icon: Mail },
                    { id: 'branch', label: 'Print at Branch', icon: Printer },
                    { id: 'mail', label: 'Mail to Address', icon: MailIcon }
                  ].map(method => (
                    <label key={method.id} className="flex items-center">
                      <input
                        type="radio"
                        name="delivery"
                        value={method.id}
                        checked={statementConfig.delivery === method.id}
                        onChange={(e) => setStatementConfig(prev => ({ ...prev, delivery: e.target.value }))}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <method.icon className="w-4 h-4 ml-2 text-gray-600" />
                      <span className="ml-2 text-sm text-gray-700">{method.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setShowStatementDialog(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">
                  Preview First
                </button>
                <button
                  onClick={() => {
                    toast.success('Statement generation started!');
                    setShowStatementDialog(false);
                  }}
                  className="px-6 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700"
                >
                  Generate Statement
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default SavingsAccountManagement;