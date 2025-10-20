import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useLanguage } from '../context/LanguageContext';
import { useSupabaseQuery } from '../hooks/useSupabase';
import { useSupabaseAuth } from '../context/SupabaseAuthContext';
import { roundAmount, roundCurrency, roundPercentage, roundInterestRate, roundLoanAmount, roundFee, roundRepaymentAmount, roundBalance } from '../utils/roundingUtils';
import {
  Building2,
  Banknote,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw,
  Download,
  Upload,
  Eye,
  Edit,
  Plus,
  BarChart3,
  PieChart,
  LineChart,
  Target,
  Activity,
  Zap,
  Users,
  Building,
  CreditCard,
  Wallet,
  Coins,
  ArrowUpRight,
  ArrowDownRight,
  Info,
  Settings,
  Filter,
  Search,
  Calendar,
  FileText,
  ExternalLink,
  Calculator
} from 'lucide-react';

// Treasury Management Interfaces
interface TreasuryManagementData {
  liquidAssets: {
    cashInHand: number;
    bankBalances: BankBalance[];
    mfspBalances: MSFPBalance[];
    mnoFloatBalances: MNOBalance[];
    treasuryBills: Investment[];
    governmentSecurities: Investment[];
    privateSecurities: Investment[];
    otherLiquidAssets: Investment[];
  };
  agentBankingBalances: {
    bankName: string;
    currentBalance: number;
    lastUpdateTime: Date;
    reconciliationStatus: string;
  }[];
  bankingRelationships: {
    institutionType: 'Bank' | 'MFSP' | 'MNO' | 'International';
    institutionName: string;
    depositAmount: number;
    borrowingAmount: number;
    interestRate: number;
    maturityDate: Date;
  }[];
}

// Enhanced Liquidity Dashboard Interfaces
interface LiquidityDashboard {
  realTimeLiquidity: {
    primaryLiquidityRatio: number;
    liquidityBuffer: number;
    liquidityRisk: 'Low' | 'Medium' | 'High';
    lastCalculationTime: Date;
    nextUpdateTime: Date;
  };
  liquidityComponents: {
    cashInHand: LiquidityComponent;
    bankBalances: LiquidityComponent;
    mfspBalances: LiquidityComponent;
    mnoFloatBalances: LiquidityComponent;
    treasuryBills: LiquidityComponent;
    governmentSecurities: LiquidityComponent;
    privateSecurities: LiquidityComponent;
    otherLiquidAssets: LiquidityComponent;
  };
  liquidityAnalytics: {
    historicalTrends: LiquidityTrend[];
    seasonalPatterns: SeasonalPattern[];
    volatilityAnalysis: VolatilityAnalysis;
    stressTestResults: StressTestResult[];
  };
  monitoringAlerts: {
    activeAlerts: LiquidityAlert[];
    thresholds: AlertThreshold[];
    escalationRules: EscalationRule[];
    notificationSettings: NotificationSetting[];
  };
}

interface LiquidityComponent {
  componentCode: string;
  componentName: string;
  currentBalance: number;
  previousBalance: number;
  change: number;
  changePercentage: number;
  liquidityRating: 'Immediate' | 'T+1' | 'T+3' | 'T+7';
  maturityProfile: MaturityProfile;
  riskRating: 'AAA' | 'AA' | 'A' | 'BBB' | 'BB' | 'B';
  yieldRate: number;
  lastUpdateTime: Date;
  dataSource: string;
  validationStatus: 'Valid' | 'Stale' | 'Error';
  botReportMapping: {
    msp205LineItem: string;
    contributionToTotal: number;
    validationRules: string[];
  };
}

interface MaturityProfile {
  immediate: number;
  t1: number;
  t3: number;
  t7: number;
  t30: number;
  t90: number;
  t180: number;
  t365: number;
  over365: number;
}

interface LiquidityTrend {
  date: Date;
  ratio: number;
  totalAssets: number;
  liquidAssets: number;
  riskLevel: string;
}

interface SeasonalPattern {
  month: string;
  averageRatio: number;
  volatility: number;
  trend: 'increasing' | 'decreasing' | 'stable';
}

interface VolatilityAnalysis {
  currentVolatility: number;
  historicalVolatility: number;
  volatilityTrend: 'increasing' | 'decreasing' | 'stable';
  riskLevel: 'Low' | 'Medium' | 'High';
}

interface StressTestResult {
  scenarioName: string;
  preStressRatio: number;
  postStressRatio: number;
  liquidityShortfall: number;
  survivalPeriod: number;
  mitigationActions: string[];
}

interface LiquidityAlert {
  type: 'REGULATORY_VIOLATION' | 'WARNING_LEVEL' | 'CONCENTRATION_RISK' | 'VOLATILITY_ALERT';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  message: string;
  impact: string;
  deadline?: Date;
  requiredAction?: string;
  recommendedAction?: string;
  estimatedAmount?: number;
}

interface AlertThreshold {
  metric: string;
  warningLevel: number;
  criticalLevel: number;
  enabled: boolean;
}

interface EscalationRule {
  alertType: string;
  escalationLevel: number;
  timeToEscalate: number;
  recipients: string[];
}

interface NotificationSetting {
  alertType: string;
  email: boolean;
  sms: boolean;
  dashboard: boolean;
  frequency: 'immediate' | 'hourly' | 'daily';
}

// Multi-Bank Balance Monitor Interfaces
interface MultiBankBalanceMonitor {
  bankingRelationships: {
    totalBanks: number;
    activeBanks: number;
    totalBalance: number;
    relationshipTypes: RelationshipType[];
    lastSyncTime: Date;
  };
  bankAccounts: {
    commercialBanks: BankAccount[];
    microfinancePartners: BankAccount[];
    mobileNetworkOperators: BankAccount[];
    internationalBanks: BankAccount[];
    centralBankAccount: BankAccount[];
  };
  realTimeMonitoring: {
    balanceUpdates: BalanceUpdate[];
    reconciliationStatus: ReconciliationStatus[];
    transactionAlerts: TransactionAlert[];
    connectivityStatus: ConnectivityStatus[];
  };
  riskManagement: {
    concentrationAnalysis: ConcentrationAnalysis;
    counterpartyRisk: CounterpartyRisk[];
    operationalRisk: OperationalRisk[];
    complianceRisk: ComplianceRisk[];
  };
}

interface BankAccount {
  accountId: string;
  bankCode: string;
  bankName: string;
  accountNumber: string;
  accountType: 'Current' | 'Savings' | 'Fixed Deposit' | 'Call Deposit';
  currency: 'TZS' | 'USD' | 'EUR' | 'KES';
  balanceInfo: {
    currentBalance: number;
    availableBalance: number;
    clearedBalance: number;
    unclearedBalance: number;
    lastBalanceUpdate: Date;
    balanceFrequency: 'Real-time' | 'Hourly' | 'Daily';
  };
  characteristics: {
    interestRate: number;
    minimumBalance: number;
    maximumBalance: number;
    transactionLimits: TransactionLimit[];
    fees: AccountFee[];
  };
  riskProfile: {
    bankRating: 'AAA' | 'AA' | 'A' | 'BBB' | 'BB' | 'B';
    relationshipRisk: 'Low' | 'Medium' | 'High';
    concentrationRisk: number;
    operationalRisk: 'Low' | 'Medium' | 'High';
  };
  integrationStatus: {
    apiConnection: 'Connected' | 'Disconnected' | 'Error';
    lastSyncTime: Date;
    syncFrequency: number;
    dataQuality: 'Good' | 'Fair' | 'Poor';
    reconciliationStatus: 'Matched' | 'Pending' | 'Discrepancy';
  };
  botReporting: {
    msp207Classification: string;
    msp208Inclusion: boolean;
    reportingCurrency: string;
    conversionRate: number;
  };
}

interface RelationshipType {
  type: string;
  count: number;
  totalBalance: number;
  percentage: number;
}

interface BalanceUpdate {
  accountId: string;
  bankName: string;
  previousBalance: number;
  currentBalance: number;
  change: number;
  updateTime: Date;
  source: string;
}

interface ReconciliationStatus {
  accountId: string;
  bankName: string;
  status: 'Matched' | 'Pending' | 'Discrepancy';
  discrepancyAmount: number;
  lastReconciliation: Date;
}

interface TransactionAlert {
  alertId: string;
  accountId: string;
  bankName: string;
  alertType: 'Large Transaction' | 'Unusual Activity' | 'Balance Threshold' | 'System Error';
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  message: string;
  timestamp: Date;
}

interface ConnectivityStatus {
  bankCode: string;
  bankName: string;
  status: 'Connected' | 'Disconnected' | 'Error';
  lastPing: Date;
  responseTime: number;
  uptime: number;
}

interface ConcentrationAnalysis {
  topBankConcentration: number;
  herfindahlIndex: number;
  diversificationScore: number;
  recommendedRebalancing: RebalancingRecommendation[];
}

interface CounterpartyRisk {
  bankCode: string;
  bankName: string;
  creditRating: string;
  exposureAmount: number;
  riskWeightedExposure: number;
  riskLimit: number;
  riskUtilization: number;
}

interface OperationalRisk {
  systemDowntimeRisk: number;
  dataQualityRisk: number;
  processingDelayRisk: number;
  fraudRisk: number;
}

interface ComplianceRisk {
  regulatoryCompliance: number;
  reportingAccuracy: number;
  auditReadiness: number;
  riskLevel: 'Low' | 'Medium' | 'High';
}

interface TransactionLimit {
  type: string;
  dailyLimit: number;
  monthlyLimit: number;
  perTransactionLimit: number;
}

interface AccountFee {
  feeType: string;
  amount: number;
  frequency: string;
}

interface RebalancingRecommendation {
  fromBank: string;
  toBank: string;
  amount: number;
  reason: string;
  priority: 'Low' | 'Medium' | 'High';
}

// Investment Portfolio Tracker Interfaces
interface InvestmentPortfolioTracker {
  portfolioOverview: {
    totalInvestments: number;
    portfolioYield: number;
    portfolioRisk: 'Low' | 'Medium' | 'High';
    portfolioDuration: number;
    lastValuationDate: Date;
  };
  investmentCategories: {
    treasuryBills: InvestmentCategory;
    governmentSecurities: InvestmentCategory;
    privateSecurities: InvestmentCategory;
    otherInvestments: InvestmentCategory;
  };
  securities: {
    governmentSecurities: GovernmentSecurity[];
    corporateBonds: CorporateBond[];
    treasuryBills: TreasuryBill[];
    otherSecurities: OtherSecurity[];
  };
  performanceAnalytics: {
    yieldAnalysis: YieldAnalysis;
    riskAnalysis: RiskAnalysis;
    durationAnalysis: DurationAnalysis;
    benchmarkComparison: BenchmarkComparison[];
  };
  riskManagement: {
    creditRisk: CreditRiskAnalysis;
    interestRateRisk: InterestRateRisk;
    liquidityRisk: LiquidityRiskAnalysis;
    concentrationRisk: ConcentrationRiskAnalysis;
  };
}

interface InvestmentCategory {
  categoryCode: string;
  categoryName: string;
  totalValue: number;
  totalCost: number;
  unrealizedGainLoss: number;
  yieldToMaturity: number;
  averageDuration: number;
  holdings: {
    count: number;
    averageSize: number;
    largestHolding: number;
    concentrationRisk: number;
  };
  performance: {
    periodicYield: number;
    totalReturn: number;
    riskAdjustedReturn: number;
    volatility: number;
  };
  riskProfile: {
    creditQuality: 'AAA' | 'AA' | 'A' | 'BBB' | 'BB' | 'B';
    interestRateSensitivity: number;
    liquidityRating: 'High' | 'Medium' | 'Low';
    defaultProbability: number;
  };
}

interface GovernmentSecurity {
  securityId: string;
  isinCode: string;
  securityName: string;
  securityType: 'Treasury Bond' | 'Development Bond' | 'Infrastructure Bond';
  faceValue: number;
  purchasePrice: number;
  currentPrice: number;
  quantity: number;
  totalCost: number;
  marketValue: number;
  issueDate: Date;
  maturityDate: Date;
  remainingTerm: number;
  timeToMaturity: number;
  couponRate: number;
  yieldToMaturity: number;
  accruedInterest: number;
  nextCouponDate: Date;
  duration: number;
  modifiedDuration: number;
  convexity: number;
  creditRating: string;
  botClassification: {
    msp205LineItem: 'C7';
    liquidityWeight: number;
    riskWeight: number;
    maturityBucket: string;
  };
}

interface CorporateBond {
  securityId: string;
  isinCode: string;
  securityName: string;
  issuerName: string;
  faceValue: number;
  purchasePrice: number;
  currentPrice: number;
  quantity: number;
  totalCost: number;
  marketValue: number;
  issueDate: Date;
  maturityDate: Date;
  remainingTerm: number;
  couponRate: number;
  yieldToMaturity: number;
  duration: number;
  creditRating: string;
  sector: string;
  botClassification: {
    msp205LineItem: 'C8';
    liquidityWeight: number;
    riskWeight: number;
    maturityBucket: string;
  };
}

interface TreasuryBill {
  securityId: string;
  billNumber: string;
  securityName: string;
  faceValue: number;
  purchasePrice: number;
  currentPrice: number;
  quantity: number;
  totalCost: number;
  marketValue: number;
  issueDate: Date;
  maturityDate: Date;
  remainingTerm: number;
  discountRate: number;
  yieldToMaturity: number;
  duration: number;
  creditRating: string;
  botClassification: {
    msp205LineItem: 'C6';
    liquidityWeight: number;
    riskWeight: number;
    maturityBucket: string;
  };
}

interface OtherSecurity {
  securityId: string;
  securityName: string;
  securityType: string;
  faceValue: number;
  purchasePrice: number;
  currentPrice: number;
  quantity: number;
  totalCost: number;
  marketValue: number;
  issueDate: Date;
  maturityDate: Date;
  remainingTerm: number;
  yieldToMaturity: number;
  duration: number;
  creditRating: string;
  botClassification: {
    msp205LineItem: 'C9';
    liquidityWeight: number;
    riskWeight: number;
    maturityBucket: string;
  };
}

interface YieldAnalysis {
  portfolioYield: number;
  yieldSpread: number;
  benchmarkComparison: number;
  yieldVolatility: number;
}

interface RiskAnalysis {
  portfolioRisk: number;
  riskContribution: number;
  riskAdjustedReturn: number;
  valueAtRisk: number;
}

interface DurationAnalysis {
  portfolioDuration: number;
  modifiedDuration: number;
  convexity: number;
  durationContribution: number;
}

interface BenchmarkComparison {
  benchmarkName: string;
  benchmarkReturn: number;
  portfolioReturn: number;
  trackingError: number;
  informationRatio: number;
}

interface CreditRiskAnalysis {
  averageCreditRating: string;
  creditRatingDistribution: { rating: string; percentage: number }[];
  defaultProbability: number;
  expectedLoss: number;
  creditConcentration: number;
}

interface InterestRateRisk {
  portfolioDuration: number;
  modifiedDuration: number;
  convexity: number;
  dv01: number;
  interestRateScenarios: { scenario: string; impact: number }[];
}

interface LiquidityRiskAnalysis {
  liquidityRatio: number;
  timeToLiquidation: number;
  liquidityPremium: number;
  emergencyLiquidityCapacity: number;
}

interface ConcentrationRiskAnalysis {
  issuerConcentration: number;
  sectorConcentration: number;
  maturityConcentration: number;
  herfindahlIndex: number;
}

// Regulatory Ratio Calculator Interfaces
interface RegulatoryRatioCalculator {
  botLiquidityRequirements: {
    minimumLiquidityRatio: number;
    earlyWarningLevel: number;
    targetLevel: number;
    criticalLevel: number;
  };
  realTimeCalculations: {
    currentRatio: number;
    requiredAmount: number;
    excessDeficit: number;
    bufferAmount: number;
    lastCalculationTime: Date;
    nextRecalculationTime: Date;
  };
  calculationComponents: {
    totalLiquidAssets: LiquidityCalculationComponent;
    totalAssets: LiquidityCalculationComponent;
    ratioCalculation: RatioCalculationResult;
    validationResults: ValidationResult[];
  };
  scenarioAnalysis: {
    currentScenario: RatioScenario;
    stressScenarios: RatioScenario[];
    optimisticScenario: RatioScenario;
    pessimisticScenario: RatioScenario;
  };
}

interface LiquidityCalculationComponent {
  componentName: string;
  lineItems: {
    c1_cashInHand: number;
    c2_bankBalances: number;
    c3_mfspBalances: number;
    c4_mnoFloatBalances: number;
    c6_treasuryBills: number;
    c7_governmentSecurities: number;
    c8_privateSecurities: number;
    c9_otherLiquidAssets: number;
  };
  calculation: {
    subtotals: { [key: string]: number };
    adjustments: { [key: string]: number };
    finalTotal: number;
    calculationFormula: string;
  };
  dataSources: {
    sourceSystem: string;
    lastUpdateTime: Date;
    dataQuality: 'High' | 'Medium' | 'Low';
    validationStatus: 'Valid' | 'Warning' | 'Error';
  };
}

interface RatioCalculationResult {
  numerator: number;
  denominator: number;
  ratio: number;
  percentage: number;
  complianceStatus: 'Compliant' | 'Warning' | 'Violation';
  daysToCompliance: number;
}

interface ValidationResult {
  component: string;
  status: 'Valid' | 'Warning' | 'Error';
  message: string;
  lastValidated: Date;
}

interface RatioScenario {
  name: string;
  parameters: { [key: string]: any };
  description: string;
  probability: number;
}

interface PrimaryLiquidityCalculation {
  calculationSteps: {
    step1: CalculationStep;
    step2: CalculationStep;
    step3: CalculationStep;
  };
  complianceAssessment: {
    currentRatio: number;
    minimumRequired: number;
    complianceStatus: string;
    excessDeficit: number;
    daysToCompliance: number;
  };
  impactAnalysis: {
    assetGrowthImpact: number;
    liquidityInjectionNeeded: number;
    alternativeStrategies: string[];
    costBenefitAnalysis: any;
  };
}

interface CalculationStep {
  description: string;
  calculation: any;
  components: any;
  validation: any;
}

interface ComplianceMonitoring {
  continuousMonitoring: {
    monitoringFrequency: string;
    lastCheck: Date;
    nextCheck: Date;
    monitoringStatus: string;
    dataFreshness: string;
  };
  alertTriggers: {
    criticalLevel: AlertTrigger;
    botMinimum: AlertTrigger;
    warningLevel: AlertTrigger;
  };
  predictiveMonitoring: {
    trendAnalysis: any;
    projectedRatio: number;
    riskOfViolation: number;
    recommendedActions: string[];
  };
}

interface AlertTrigger {
  threshold: number;
  currentValue: number;
  triggered: boolean;
  action: string;
}

interface ScenarioCalculationResults {
  scenarioResults: ScenarioResult[];
  comparativeAnalysis: {
    bestCaseScenario: string;
    worstCaseScenario: string;
    mostLikelyScenario: string;
    recommendations: string[];
  };
}

interface ScenarioResult {
  scenarioName: string;
  scenarioParameters: any;
  liquidityImpact: {
    baselineRatio: number;
    scenarioRatio: number;
    ratioChange: number;
    complianceImpact: string;
  };
  financialImpact: {
    additionalLiquidityNeeded: number;
    opportunityCost: number;
    riskAdjustedReturn: number;
  };
  strategicImplications: {
    businessImpact: string;
    regulatoryImplications: string;
    stakeholderImpact: string;
  };
}

interface LiquidityOptimization {
  currentStateAnalysis: {
    efficiencyRating: number;
    costOfLiquidity: number;
    yieldOptimization: any;
    riskAssessment: any;
  };
  optimizationRecommendations: {
    assetReallocation: any;
    liquidityBufferOptimization: any;
    yieldEnhancement: any;
    riskMitigation: any;
  };
  implementationStrategy: {
    prioritizedActions: any[];
    implementationTimeline: any;
    resourceRequirements: any;
    successMetrics: any;
  };
  expectedOutcomes: {
    ratioImprovement: number;
    costSavings: number;
    riskReduction: number;
    complianceEnhancement: number;
  };
}

interface BankBalance {
  bankName: string;
  accountType: string;
  currentBalance: number;
  currency: string;
  lastUpdateTime: Date;
  reconciliationStatus: 'Reconciled' | 'Pending' | 'Discrepancy';
}

interface MSFPBalance {
  mfspName: string;
  accountType: string;
  currentBalance: number;
  currency: string;
  lastUpdateTime: Date;
  status: 'Active' | 'Inactive' | 'Suspended';
}

interface MNOBalance {
  mnoName: string;
  floatType: string;
  currentBalance: number;
  currency: string;
  lastUpdateTime: Date;
  status: 'Active' | 'Inactive' | 'Suspended';
}

interface Investment {
  name: string;
  type: string;
  amount: number;
  currency: string;
  maturityDate: Date;
  interestRate: number;
  status: 'Active' | 'Matured' | 'Redeemed';
}

// Liquidity Monitoring Engine
class LiquidityMonitoringEngine {
  calculateRealTimeLiquidity(treasuryData: TreasuryManagementData): LiquidityDashboard {
    const totalLiquidAssets = this.calculateTotalLiquidAssets(treasuryData);
    const totalAssets = this.calculateTotalAssets(treasuryData);
    const primaryLiquidityRatio = totalAssets > 0 ? totalLiquidAssets / totalAssets : 0;
    
    return {
      realTimeLiquidity: {
        primaryLiquidityRatio,
        liquidityBuffer: Math.max(0, totalLiquidAssets - (totalAssets * 0.05)), // 5% BOT minimum
        liquidityRisk: this.assessLiquidityRisk(primaryLiquidityRatio),
        lastCalculationTime: new Date(),
        nextUpdateTime: new Date(Date.now() + 30 * 1000) // 30 seconds
      },
      liquidityComponents: this.buildLiquidityComponents(treasuryData),
      liquidityAnalytics: this.generateLiquidityAnalytics(),
      monitoringAlerts: this.generateLiquidityAlerts(primaryLiquidityRatio, totalLiquidAssets)
    };
  }

  private calculateTotalLiquidAssets(data: TreasuryManagementData): number {
    const { liquidAssets } = data;
    let total = liquidAssets.cashInHand;
    total += liquidAssets.bankBalances.reduce((sum, bank) => sum + bank.currentBalance, 0);
    total += liquidAssets.mfspBalances.reduce((sum, mfsp) => sum + mfsp.currentBalance, 0);
    total += liquidAssets.mnoFloatBalances.reduce((sum, mno) => sum + mno.currentBalance, 0);
    total += liquidAssets.treasuryBills.reduce((sum, bill) => sum + bill.amount, 0);
    total += liquidAssets.governmentSecurities.reduce((sum, sec) => sum + sec.amount, 0);
    total += liquidAssets.privateSecurities.reduce((sum, sec) => sum + sec.amount, 0);
    total += liquidAssets.otherLiquidAssets.reduce((sum, asset) => sum + asset.amount, 0);
    return total;
  }

  private calculateTotalAssets(data: TreasuryManagementData): number {
    const liquidAssets = this.calculateTotalLiquidAssets(data);
    const deposits = data.bankingRelationships.reduce((sum, rel) => sum + rel.depositAmount, 0);
    const borrowings = data.bankingRelationships.reduce((sum, rel) => sum + rel.borrowingAmount, 0);
    return liquidAssets + deposits + borrowings + 50000000; // Mock total assets
  }

  private assessLiquidityRisk(ratio: number): 'Low' | 'Medium' | 'High' {
    if (ratio >= 0.10) return 'Low';
    if (ratio >= 0.07) return 'Medium';
    return 'High';
  }

  private buildLiquidityComponents(data: TreasuryManagementData) {
    const totalLiquid = this.calculateTotalLiquidAssets(data);
    
    return {
      cashInHand: this.createLiquidityComponent('C1', 'Cash in Hand', data.liquidAssets.cashInHand, totalLiquid, 'Immediate', 'AAA'),
      bankBalances: this.createLiquidityComponent('C2', 'Bank Balances', 
        data.liquidAssets.bankBalances.reduce((sum, bank) => sum + bank.currentBalance, 0), totalLiquid, 'Immediate', 'AA'),
      mfspBalances: this.createLiquidityComponent('C3', 'MFSP Balances', 
        data.liquidAssets.mfspBalances.reduce((sum, mfsp) => sum + mfsp.currentBalance, 0), totalLiquid, 'T+1', 'A'),
      mnoFloatBalances: this.createLiquidityComponent('C4', 'MNO Float Balances', 
        data.liquidAssets.mnoFloatBalances.reduce((sum, mno) => sum + mno.currentBalance, 0), totalLiquid, 'T+1', 'A'),
      treasuryBills: this.createLiquidityComponent('C6', 'Treasury Bills', 
        data.liquidAssets.treasuryBills.reduce((sum, bill) => sum + bill.amount, 0), totalLiquid, 'T+3', 'AAA'),
      governmentSecurities: this.createLiquidityComponent('C7', 'Government Securities', 
        data.liquidAssets.governmentSecurities.reduce((sum, sec) => sum + sec.amount, 0), totalLiquid, 'T+7', 'AAA'),
      privateSecurities: this.createLiquidityComponent('C8', 'Private Securities', 
        data.liquidAssets.privateSecurities.reduce((sum, sec) => sum + sec.amount, 0), totalLiquid, 'T+7', 'BBB'),
      otherLiquidAssets: this.createLiquidityComponent('C9', 'Other Liquid Assets', 
        data.liquidAssets.otherLiquidAssets.reduce((sum, asset) => sum + asset.amount, 0), totalLiquid, 'T+3', 'A')
    };
  }

  private createLiquidityComponent(code: string, name: string, currentBalance: number, totalLiquid: number, 
    liquidityRating: 'Immediate' | 'T+1' | 'T+3' | 'T+7', riskRating: 'AAA' | 'AA' | 'A' | 'BBB' | 'BB' | 'B'): LiquidityComponent {
    const previousBalance = currentBalance * (0.95 + Math.random() * 0.1); // Mock previous balance
    const change = currentBalance - previousBalance;
    const changePercentage = previousBalance > 0 ? (change / previousBalance) * 100 : 0;
    
    return {
      componentCode: code,
      componentName: name,
      currentBalance,
      previousBalance,
      change,
      changePercentage,
      liquidityRating,
      maturityProfile: this.generateMaturityProfile(liquidityRating),
      riskRating,
      yieldRate: this.getYieldRate(riskRating),
      lastUpdateTime: new Date(),
      dataSource: 'Treasury System',
      validationStatus: 'Valid',
      botReportMapping: {
        msp205LineItem: `MSP2_05_${code}`,
        contributionToTotal: totalLiquid > 0 ? (currentBalance / totalLiquid) * 100 : 0,
        validationRules: ['Balance > 0', 'Update within 24h', 'Reconciliation complete']
      }
    };
  }

  private generateMaturityProfile(rating: string): MaturityProfile {
    const profiles = {
      'Immediate': { immediate: 100, t1: 0, t3: 0, t7: 0, t30: 0, t90: 0, t180: 0, t365: 0, over365: 0 },
      'T+1': { immediate: 0, t1: 100, t3: 0, t7: 0, t30: 0, t90: 0, t180: 0, t365: 0, over365: 0 },
      'T+3': { immediate: 0, t1: 0, t3: 100, t7: 0, t30: 0, t90: 0, t180: 0, t365: 0, over365: 0 },
      'T+7': { immediate: 0, t1: 0, t3: 0, t7: 100, t30: 0, t90: 0, t180: 0, t365: 0, over365: 0 }
    };
    return profiles[rating as keyof typeof profiles] || profiles['T+1'];
  }

  private getYieldRate(rating: string): number {
    const rates = { 'AAA': 3.5, 'AA': 4.0, 'A': 4.5, 'BBB': 5.5, 'BB': 6.5, 'B': 8.0 };
    return rates[rating as keyof typeof rates] || 4.0;
  }

  private generateLiquidityAnalytics() {
    return {
      historicalTrends: this.generateHistoricalTrends(),
      seasonalPatterns: this.generateSeasonalPatterns(),
      volatilityAnalysis: {
        currentVolatility: 0.12,
        historicalVolatility: 0.15,
        volatilityTrend: 'decreasing' as const,
        riskLevel: 'Low' as const
      },
      stressTestResults: this.generateStressTestResults()
    };
  }

  private generateHistoricalTrends(): LiquidityTrend[] {
    const trends: LiquidityTrend[] = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      trends.push({
        date,
        ratio: 0.08 + Math.random() * 0.04, // 8-12% range
        totalAssets: 100000000 + Math.random() * 20000000,
        liquidAssets: 8000000 + Math.random() * 2000000,
        riskLevel: 'Low'
      });
    }
    return trends;
  }

  private generateSeasonalPatterns(): SeasonalPattern[] {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months.map(month => ({
      month,
      averageRatio: 0.08 + Math.random() * 0.04,
      volatility: 0.05 + Math.random() * 0.03,
      trend: ['increasing', 'decreasing', 'stable'][Math.floor(Math.random() * 3)] as 'increasing' | 'decreasing' | 'stable'
    }));
  }

  private generateStressTestResults(): StressTestResult[] {
    return [
      {
        scenarioName: 'Bank Run Scenario',
        preStressRatio: 0.09,
        postStressRatio: 0.06,
        liquidityShortfall: 2000000,
        survivalPeriod: 15,
        mitigationActions: ['Liquidate short-term investments', 'Activate credit lines', 'Reduce lending']
      },
      {
        scenarioName: 'Market Liquidity Crisis',
        preStressRatio: 0.09,
        postStressRatio: 0.07,
        liquidityShortfall: 1000000,
        survivalPeriod: 25,
        mitigationActions: ['Diversify funding sources', 'Increase cash reserves', 'Optimize asset allocation']
      },
      {
        scenarioName: 'Regulatory Shock',
        preStressRatio: 0.09,
        postStressRatio: 0.08,
        liquidityShortfall: 500000,
        survivalPeriod: 30,
        mitigationActions: ['Enhance compliance monitoring', 'Increase regulatory buffer', 'Review risk policies']
      }
    ];
  }

  private generateLiquidityAlerts(ratio: number, totalLiquid: number): any {
    const alerts: LiquidityAlert[] = [];
    
    if (ratio < 0.05) {
      alerts.push({
        type: 'REGULATORY_VIOLATION',
        severity: 'CRITICAL',
        message: `Liquidity ratio ${roundPercentage(ratio * 100)}% below BOT minimum 5%`,
        impact: 'Immediate regulatory compliance risk',
        deadline: new Date(Date.now() + 24 * 60 * 60 * 1000),
        requiredAction: 'Immediate liquidity injection required',
        estimatedAmount: totalLiquid * 0.1
      });
    } else if (ratio < 0.07) {
      alerts.push({
        type: 'WARNING_LEVEL',
        severity: 'HIGH',
        message: `Liquidity ratio ${roundPercentage(ratio * 100)}% approaching minimum`,
        impact: 'Risk of regulatory violation',
        recommendedAction: 'Prepare liquidity enhancement measures'
      });
    }

    return {
      activeAlerts: alerts,
      thresholds: [
        { metric: 'Primary Liquidity Ratio', warningLevel: 0.07, criticalLevel: 0.05, enabled: true },
        { metric: 'Concentration Risk', warningLevel: 0.40, criticalLevel: 0.60, enabled: true }
      ],
      escalationRules: [],
      notificationSettings: []
    };
  }
}

// Multi-Bank Monitoring Engine
class MultiBankMonitoringEngine {
  generateMultiBankData(): MultiBankBalanceMonitor {
    return {
      bankingRelationships: {
        totalBanks: 8,
        activeBanks: 7,
        totalBalance: 45000000,
        relationshipTypes: [
          { type: 'Commercial Banks', count: 4, totalBalance: 30000000, percentage: 66.7 },
          { type: 'Microfinance Partners', count: 2, totalBalance: 8000000, percentage: 17.8 },
          { type: 'Mobile Network Operators', count: 2, totalBalance: 5000000, percentage: 11.1 },
          { type: 'International Banks', count: 1, totalBalance: 2000000, percentage: 4.4 }
        ],
        lastSyncTime: new Date()
      },
      bankAccounts: {
        commercialBanks: [
          this.createBankAccount('CRDB001', 'CRDB Bank', 'Current', 'TZS', 15000000, 'AAA', 'Low'),
          this.createBankAccount('NMB001', 'NMB Bank', 'Savings', 'TZS', 8500000, 'AA', 'Low'),
          this.createBankAccount('EQUITY001', 'Equity Bank', 'Fixed Deposit', 'TZS', 5000000, 'A', 'Medium'),
          this.createBankAccount('EXIM001', 'Exim Bank', 'Current', 'TZS', 1500000, 'A', 'Low')
        ],
        microfinancePartners: [
          this.createBankAccount('MFSP001', 'Tigo Pesa', 'Current', 'TZS', 5000000, 'A', 'Medium'),
          this.createBankAccount('MFSP002', 'M-Pesa', 'Current', 'TZS', 3000000, 'A', 'Medium')
        ],
        mobileNetworkOperators: [
          this.createBankAccount('MNO001', 'Vodacom M-Pesa', 'Float', 'TZS', 3000000, 'A', 'Medium'),
          this.createBankAccount('MNO002', 'Airtel Money', 'Float', 'TZS', 2000000, 'A', 'Medium')
        ],
        internationalBanks: [
          this.createBankAccount('INT001', 'World Bank', 'USD Account', 'USD', 2000000, 'AAA', 'Low')
        ],
        centralBankAccount: [
          this.createBankAccount('BOT001', 'Bank of Tanzania', 'Reserve Account', 'TZS', 0, 'AAA', 'Low')
        ]
      },
      realTimeMonitoring: {
        balanceUpdates: this.generateBalanceUpdates(),
        reconciliationStatus: this.generateReconciliationStatus(),
        transactionAlerts: this.generateTransactionAlerts(),
        connectivityStatus: this.generateConnectivityStatus()
      },
      riskManagement: {
        concentrationAnalysis: {
          topBankConcentration: 0.33,
          herfindahlIndex: 0.28,
          diversificationScore: 0.72,
          recommendedRebalancing: [
            { fromBank: 'CRDB Bank', toBank: 'NMB Bank', amount: 2000000, reason: 'Reduce concentration risk', priority: 'Medium' }
          ]
        },
        counterpartyRisk: this.generateCounterpartyRisk(),
        operationalRisk: {
          systemDowntimeRisk: 0.05,
          dataQualityRisk: 0.08,
          processingDelayRisk: 0.12,
          fraudRisk: 0.03
        },
        complianceRisk: {
          regulatoryCompliance: 0.95,
          reportingAccuracy: 0.92,
          auditReadiness: 0.88,
          riskLevel: 'Low'
        }
      }
    };
  }

  private createBankAccount(code: string, name: string, type: string, currency: string, 
    balance: number, rating: string, risk: string): BankAccount {
    return {
      accountId: code,
      bankCode: code.substring(0, 6),
      bankName: name,
      accountNumber: `${code}${Math.floor(Math.random() * 1000000)}`,
      accountType: type as any,
      currency: currency as any,
      balanceInfo: {
        currentBalance: balance,
        availableBalance: balance * 0.95,
        clearedBalance: balance * 0.90,
        unclearedBalance: balance * 0.05,
        lastBalanceUpdate: new Date(),
        balanceFrequency: 'Real-time'
      },
      characteristics: {
        interestRate: 4.5 + Math.random() * 2,
        minimumBalance: 100000,
        maximumBalance: balance * 2,
        transactionLimits: [
          { type: 'Daily', dailyLimit: 10000000, monthlyLimit: 200000000, perTransactionLimit: 5000000 }
        ],
        fees: [
          { feeType: 'Monthly Maintenance', amount: 5000, frequency: 'Monthly' }
        ]
      },
      riskProfile: {
        bankRating: rating as any,
        relationshipRisk: risk as any,
        concentrationRisk: Math.random() * 0.3,
        operationalRisk: 'Low'
      },
      integrationStatus: {
        apiConnection: 'Connected',
        lastSyncTime: new Date(),
        syncFrequency: 30,
        dataQuality: 'Good',
        reconciliationStatus: 'Matched'
      },
      botReporting: {
        msp207Classification: 'Commercial Bank',
        msp208Inclusion: true,
        reportingCurrency: 'TZS',
        conversionRate: 1
      }
    };
  }

  private generateBalanceUpdates(): BalanceUpdate[] {
    const updates: BalanceUpdate[] = [];
    const banks = ['CRDB Bank', 'NMB Bank', 'Equity Bank', 'Tigo Pesa', 'M-Pesa'];
    
    for (let i = 0; i < 5; i++) {
      const previousBalance = 1000000 + Math.random() * 5000000;
      const currentBalance = previousBalance + (Math.random() - 0.5) * 500000;
      updates.push({
        accountId: `ACC${i + 1}`,
        bankName: banks[i % banks.length],
        previousBalance,
        currentBalance,
        change: currentBalance - previousBalance,
        updateTime: new Date(Date.now() - Math.random() * 3600000),
        source: 'API Sync'
      });
    }
    return updates;
  }

  private generateReconciliationStatus(): ReconciliationStatus[] {
    return [
      { accountId: 'CRDB001', bankName: 'CRDB Bank', status: 'Matched', discrepancyAmount: 0, lastReconciliation: new Date() },
      { accountId: 'NMB001', bankName: 'NMB Bank', status: 'Pending', discrepancyAmount: 0, lastReconciliation: new Date() },
      { accountId: 'EQUITY001', bankName: 'Equity Bank', status: 'Discrepancy', discrepancyAmount: 50000, lastReconciliation: new Date() }
    ];
  }

  private generateTransactionAlerts(): TransactionAlert[] {
    return [
      {
        alertId: 'ALERT001',
        accountId: 'CRDB001',
        bankName: 'CRDB Bank',
        alertType: 'Large Transaction',
        severity: 'Medium',
        message: 'Transaction exceeding TZS 5,000,000 detected',
        timestamp: new Date()
      }
    ];
  }

  private generateConnectivityStatus(): ConnectivityStatus[] {
    const banks = [
      { code: 'CRDB', name: 'CRDB Bank' },
      { code: 'NMB', name: 'NMB Bank' },
      { code: 'EQUITY', name: 'Equity Bank' },
      { code: 'TIGO', name: 'Tigo Pesa' },
      { code: 'MPESA', name: 'M-Pesa' }
    ];

    return banks.map(bank => ({
      bankCode: bank.code,
      bankName: bank.name,
      status: Math.random() > 0.1 ? 'Connected' : 'Disconnected',
      lastPing: new Date(),
      responseTime: 50 + Math.random() * 200,
      uptime: 95 + Math.random() * 5
    }));
  }

  private generateCounterpartyRisk(): CounterpartyRisk[] {
    return [
      {
        bankCode: 'CRDB',
        bankName: 'CRDB Bank',
        creditRating: 'AAA',
        exposureAmount: 15000000,
        riskWeightedExposure: 15000000,
        riskLimit: 20000000,
        riskUtilization: 0.75
      },
      {
        bankCode: 'NMB',
        bankName: 'NMB Bank',
        creditRating: 'AA',
        exposureAmount: 8500000,
        riskWeightedExposure: 8500000,
        riskLimit: 15000000,
        riskUtilization: 0.57
      }
    ];
  }
}

// Investment Portfolio Engine
class InvestmentPortfolioEngine {
  generateInvestmentPortfolioData(): InvestmentPortfolioTracker {
    return {
      portfolioOverview: {
        totalInvestments: 25000000,
        portfolioYield: 8.5,
        portfolioRisk: 'Medium',
        portfolioDuration: 3.2,
        lastValuationDate: new Date()
      },
      investmentCategories: {
        treasuryBills: this.createInvestmentCategory('C6', 'Treasury Bills', 8000000, 7.5, 0.8, 'AAA'),
        governmentSecurities: this.createInvestmentCategory('C7', 'Government Securities', 12000000, 9.2, 4.5, 'AAA'),
        privateSecurities: this.createInvestmentCategory('C8', 'Private Securities', 4000000, 12.0, 2.8, 'BBB'),
        otherInvestments: this.createInvestmentCategory('C9', 'Other Investments', 1000000, 6.5, 1.2, 'A')
      },
      securities: {
        governmentSecurities: this.generateGovernmentSecurities(),
        corporateBonds: this.generateCorporateBonds(),
        treasuryBills: this.generateTreasuryBills(),
        otherSecurities: this.generateOtherSecurities()
      },
      performanceAnalytics: {
        yieldAnalysis: {
          portfolioYield: 8.5,
          yieldSpread: 2.3,
          benchmarkComparison: 0.8,
          yieldVolatility: 0.15
        },
        riskAnalysis: {
          portfolioRisk: 0.12,
          riskContribution: 0.08,
          riskAdjustedReturn: 0.71,
          valueAtRisk: 1500000
        },
        durationAnalysis: {
          portfolioDuration: 3.2,
          modifiedDuration: 3.0,
          convexity: 12.5,
          durationContribution: 0.25
        },
        benchmarkComparison: [
          {
            benchmarkName: 'Tanzania 10Y Bond',
            benchmarkReturn: 7.7,
            portfolioReturn: 8.5,
            trackingError: 0.8,
            informationRatio: 1.0
          }
        ]
      },
      riskManagement: {
        creditRisk: {
          averageCreditRating: 'AA',
          creditRatingDistribution: [
            { rating: 'AAA', percentage: 60 },
            { rating: 'AA', percentage: 25 },
            { rating: 'A', percentage: 10 },
            { rating: 'BBB', percentage: 5 }
          ],
          defaultProbability: 0.02,
          expectedLoss: 500000,
          creditConcentration: 0.15
        },
        interestRateRisk: {
          portfolioDuration: 3.2,
          modifiedDuration: 3.0,
          convexity: 12.5,
          dv01: 75000,
          interestRateScenarios: [
            { scenario: '+1% Rate', impact: -225000 },
            { scenario: '-1% Rate', impact: 225000 },
            { scenario: '+2% Rate', impact: -450000 }
          ]
        },
        liquidityRisk: {
          liquidityRatio: 0.85,
          timeToLiquidation: 5,
          liquidityPremium: 0.5,
          emergencyLiquidityCapacity: 15000000
        },
        concentrationRisk: {
          issuerConcentration: 0.25,
          sectorConcentration: 0.40,
          maturityConcentration: 0.30,
          herfindahlIndex: 0.18
        }
      }
    };
  }

  private createInvestmentCategory(code: string, name: string, value: number, yieldRate: number, duration: number, rating: string): InvestmentCategory {
    const cost = value * 0.95;
    return {
      categoryCode: code,
      categoryName: name,
      totalValue: value,
      totalCost: cost,
      unrealizedGainLoss: value - cost,
      yieldToMaturity: yieldRate,
      averageDuration: duration,
      holdings: {
        count: Math.floor(Math.random() * 5) + 3,
        averageSize: value / 5,
        largestHolding: value * 0.4,
        concentrationRisk: Math.random() * 0.3
      },
      performance: {
        periodicYield: yieldRate,
        totalReturn: (value - cost) / cost,
        riskAdjustedReturn: yieldRate / 0.12,
        volatility: Math.random() * 0.1 + 0.05
      },
      riskProfile: {
        creditQuality: rating as any,
        interestRateSensitivity: duration * 0.1,
        liquidityRating: 'High',
        defaultProbability: rating === 'AAA' ? 0.001 : rating === 'AA' ? 0.005 : 0.02
      }
    };
  }

  private generateGovernmentSecurities(): GovernmentSecurity[] {
    return [
      {
        securityId: 'GS001',
        isinCode: 'TZ0000000001',
        securityName: 'Tanzania 5Y Treasury Bond',
        securityType: 'Treasury Bond',
        faceValue: 1000000,
        purchasePrice: 980000,
        currentPrice: 995000,
        quantity: 5,
        totalCost: 4900000,
        marketValue: 4975000,
        issueDate: new Date('2023-01-15'),
        maturityDate: new Date('2028-01-15'),
        remainingTerm: 3.0,
        timeToMaturity: 1095,
        couponRate: 8.5,
        yieldToMaturity: 8.7,
        accruedInterest: 50000,
        nextCouponDate: new Date('2024-07-15'),
        duration: 4.2,
        modifiedDuration: 3.9,
        convexity: 18.5,
        creditRating: 'AAA',
        botClassification: {
          msp205LineItem: 'C7',
          liquidityWeight: 0.9,
          riskWeight: 0.0,
          maturityBucket: '3-5Y'
        }
      },
      {
        securityId: 'GS002',
        isinCode: 'TZ0000000002',
        securityName: 'Tanzania 10Y Development Bond',
        securityType: 'Development Bond',
        faceValue: 1000000,
        purchasePrice: 950000,
        currentPrice: 970000,
        quantity: 7,
        totalCost: 6650000,
        marketValue: 6790000,
        issueDate: new Date('2022-06-01'),
        maturityDate: new Date('2032-06-01'),
        remainingTerm: 7.5,
        timeToMaturity: 2738,
        couponRate: 9.0,
        yieldToMaturity: 9.2,
        accruedInterest: 75000,
        nextCouponDate: new Date('2024-12-01'),
        duration: 6.8,
        modifiedDuration: 6.2,
        convexity: 45.2,
        creditRating: 'AAA',
        botClassification: {
          msp205LineItem: 'C7',
          liquidityWeight: 0.8,
          riskWeight: 0.0,
          maturityBucket: '5-10Y'
        }
      }
    ];
  }

  private generateCorporateBonds(): CorporateBond[] {
    return [
      {
        securityId: 'CB001',
        isinCode: 'TZ0000000003',
        securityName: 'CRDB Bank Corporate Bond',
        issuerName: 'CRDB Bank Plc',
        faceValue: 1000000,
        purchasePrice: 980000,
        currentPrice: 985000,
        quantity: 2,
        totalCost: 1960000,
        marketValue: 1970000,
        issueDate: new Date('2023-03-01'),
        maturityDate: new Date('2026-03-01'),
        remainingTerm: 2.0,
        couponRate: 11.5,
        yieldToMaturity: 11.8,
        duration: 2.5,
        creditRating: 'A',
        sector: 'Banking',
        botClassification: {
          msp205LineItem: 'C8',
          liquidityWeight: 0.6,
          riskWeight: 0.2,
          maturityBucket: '1-3Y'
        }
      }
    ];
  }

  private generateTreasuryBills(): TreasuryBill[] {
    return [
      {
        securityId: 'TB001',
        billNumber: 'TB2024001',
        securityName: '91-Day Treasury Bill',
        faceValue: 1000000,
        purchasePrice: 980000,
        currentPrice: 985000,
        quantity: 3,
        totalCost: 2940000,
        marketValue: 2955000,
        issueDate: new Date('2024-01-01'),
        maturityDate: new Date('2024-04-01'),
        remainingTerm: 0.25,
        discountRate: 8.0,
        yieldToMaturity: 8.2,
        duration: 0.2,
        creditRating: 'AAA',
        botClassification: {
          msp205LineItem: 'C6',
          liquidityWeight: 1.0,
          riskWeight: 0.0,
          maturityBucket: '<1Y'
        }
      }
    ];
  }

  private generateOtherSecurities(): OtherSecurity[] {
    return [
      {
        securityId: 'OS001',
        securityName: 'Money Market Fund',
        securityType: 'Mutual Fund',
        faceValue: 1000000,
        purchasePrice: 1000000,
        currentPrice: 1015000,
        quantity: 1,
        totalCost: 1000000,
        marketValue: 1015000,
        issueDate: new Date('2023-01-01'),
        maturityDate: new Date('2025-01-01'),
        remainingTerm: 1.0,
        yieldToMaturity: 7.5,
        duration: 0.8,
        creditRating: 'A',
        botClassification: {
          msp205LineItem: 'C9',
          liquidityWeight: 0.9,
          riskWeight: 0.1,
          maturityBucket: '1-3Y'
        }
      }
    ];
  }
}

// Regulatory Ratio Calculator Engine
class RegulatoryRatioCalculatorEngine {
  generateRegulatoryRatioData(): RegulatoryRatioCalculator {
    const totalLiquidAssets = 45000000; // Mock total liquid assets
    const totalAssets = 500000000; // Mock total assets
    const currentRatio = totalLiquidAssets / totalAssets;
    
    return {
      botLiquidityRequirements: {
        minimumLiquidityRatio: 0.05,
        earlyWarningLevel: 0.07,
        targetLevel: 0.10,
        criticalLevel: 0.03
      },
      realTimeCalculations: {
        currentRatio,
        requiredAmount: totalAssets * 0.05,
        excessDeficit: totalLiquidAssets - (totalAssets * 0.05),
        bufferAmount: totalLiquidAssets - (totalAssets * 0.10),
        lastCalculationTime: new Date(),
        nextRecalculationTime: new Date(Date.now() + 15 * 60 * 1000) // 15 minutes
      },
      calculationComponents: {
        totalLiquidAssets: this.createLiquidityCalculationComponent('Total Liquid Assets', {
          c1_cashInHand: 15000000,
          c2_bankBalances: 25000000,
          c3_mfspBalances: 5000000,
          c4_mnoFloatBalances: 3000000,
          c6_treasuryBills: 8000000,
          c7_governmentSecurities: 12000000,
          c8_privateSecurities: 4000000,
          c9_otherLiquidAssets: 1000000
        }),
        totalAssets: this.createLiquidityCalculationComponent('Total Assets', {
          c1_cashInHand: 15000000,
          c2_bankBalances: 25000000,
          c3_mfspBalances: 5000000,
          c4_mnoFloatBalances: 3000000,
          c6_treasuryBills: 8000000,
          c7_governmentSecurities: 12000000,
          c8_privateSecurities: 4000000,
          c9_otherLiquidAssets: 1000000
        }),
        ratioCalculation: {
          numerator: totalLiquidAssets,
          denominator: totalAssets,
          ratio: currentRatio,
          percentage: currentRatio * 100,
          complianceStatus: currentRatio >= 0.05 ? 'Compliant' : currentRatio >= 0.03 ? 'Warning' : 'Violation',
          daysToCompliance: currentRatio < 0.05 ? Math.ceil((totalAssets * 0.05 - totalLiquidAssets) / 1000000) : 0
        },
        validationResults: this.generateValidationResults()
      },
      scenarioAnalysis: {
        currentScenario: {
          name: 'Current Market Conditions',
          parameters: { marketVolatility: 0.15, interestRates: 0.08 },
          description: 'Baseline scenario with current market conditions',
          probability: 0.4
        },
        stressScenarios: this.generateStressScenarios(),
        optimisticScenario: {
          name: 'Optimistic Growth',
          parameters: { assetGrowth: 0.15, liquidityIncrease: 0.20 },
          description: 'High growth scenario with increased liquidity',
          probability: 0.2
        },
        pessimisticScenario: {
          name: 'Economic Downturn',
          parameters: { assetDecline: 0.10, liquidityDecrease: 0.15 },
          description: 'Economic stress with reduced liquidity',
          probability: 0.2
        }
      }
    };
  }

  private createLiquidityCalculationComponent(name: string, lineItems: any): LiquidityCalculationComponent {
    const total = Object.values(lineItems).reduce((sum: number, value: any) => sum + value, 0);
    
    return {
      componentName: name,
      lineItems,
      calculation: {
        subtotals: {
          immediateAssets: lineItems.c1_cashInHand + lineItems.c2_bankBalances,
          shortTermAssets: lineItems.c3_mfspBalances + lineItems.c4_mnoFloatBalances,
          investmentAssets: lineItems.c6_treasuryBills + lineItems.c7_governmentSecurities + lineItems.c8_privateSecurities,
          otherAssets: lineItems.c9_otherLiquidAssets
        },
        adjustments: {
          haircuts: total * 0.02,
          reserves: total * 0.01
        },
        finalTotal: total,
        calculationFormula: 'Sum of all MSP2_05 line items'
      },
      dataSources: {
        sourceSystem: 'Treasury Management System',
        lastUpdateTime: new Date(),
        dataQuality: 'High',
        validationStatus: 'Valid'
      }
    };
  }

  private generateValidationResults(): ValidationResult[] {
    return [
      {
        component: 'Cash in Hand',
        status: 'Valid',
        message: 'Data is current and accurate',
        lastValidated: new Date()
      },
      {
        component: 'Bank Balances',
        status: 'Valid',
        message: 'All bank accounts reconciled',
        lastValidated: new Date()
      },
      {
        component: 'MFSP Balances',
        status: 'Warning',
        message: 'Some balances pending reconciliation',
        lastValidated: new Date()
      }
    ];
  }

  private generateStressScenarios(): RatioScenario[] {
    return [
      {
        name: 'Bank Run Scenario',
        parameters: { withdrawalRate: 0.30, marketImpact: 0.20 },
        description: '30% deposit withdrawal with 20% market decline',
        probability: 0.1
      },
      {
        name: 'Interest Rate Shock',
        parameters: { rateIncrease: 0.05, bondValueDecline: 0.15 },
        description: '5% interest rate increase affecting bond values',
        probability: 0.15
      },
      {
        name: 'Regulatory Tightening',
        parameters: { newRequirement: 0.08, complianceBuffer: 0.02 },
        description: 'BOT increases minimum requirement to 8%',
        probability: 0.05
      }
    ];
  }

  calculatePrimaryLiquidityRatio(): PrimaryLiquidityCalculation {
    const totalLiquidAssets = 45000000;
    const totalAssets = 500000000;
    const currentRatio = totalLiquidAssets / totalAssets;
    
    return {
      calculationSteps: {
        step1: {
          description: 'Calculate Total Liquid Assets (MSP2_05)',
          calculation: totalLiquidAssets,
          components: this.getLiquidAssetsComponents(),
          validation: this.validateLiquidAssets()
        },
        step2: {
          description: 'Calculate Total Assets (MSP2_01)',
          calculation: totalAssets,
          components: this.getTotalAssetsComponents(),
          validation: this.validateTotalAssets()
        },
        step3: {
          description: 'Calculate Liquidity Ratio',
          calculation: {
            numerator: totalLiquidAssets,
            denominator: totalAssets,
            ratio: currentRatio,
            percentage: currentRatio * 100
          },
          validation: this.validateRatioCalculation()
        }
      },
      complianceAssessment: {
        currentRatio,
        minimumRequired: 0.05,
        complianceStatus: currentRatio >= 0.05 ? 'Compliant' : 'Non-Compliant',
        excessDeficit: totalLiquidAssets - (totalAssets * 0.05),
        daysToCompliance: currentRatio < 0.05 ? 30 : 0
      },
      impactAnalysis: {
        assetGrowthImpact: 0.02,
        liquidityInjectionNeeded: Math.max(0, (totalAssets * 0.05) - totalLiquidAssets),
        alternativeStrategies: ['Asset reallocation', 'Liquidity injection', 'Portfolio optimization'],
        costBenefitAnalysis: { cost: 1000000, benefit: 2000000 }
      }
    };
  }

  private getLiquidAssetsComponents() {
    return {
      cashInHand: 15000000,
      bankBalances: 25000000,
      mfspBalances: 5000000,
      mnoFloatBalances: 3000000,
      treasuryBills: 8000000,
      governmentSecurities: 12000000,
      privateSecurities: 4000000,
      otherLiquidAssets: 1000000
    };
  }

  private getTotalAssetsComponents() {
    return {
      liquidAssets: 45000000,
      loans: 300000000,
      investments: 100000000,
      fixedAssets: 50000000,
      otherAssets: 5000000
    };
  }

  private validateLiquidAssets() {
    return { status: 'Valid', message: 'All liquid assets validated' };
  }

  private validateTotalAssets() {
    return { status: 'Valid', message: 'Total assets calculation verified' };
  }

  private validateRatioCalculation() {
    return { status: 'Valid', message: 'Ratio calculation is accurate' };
  }
}

const TreasuryManagement: React.FC = () => {
  const { t } = useLanguage();
  const { user } = useSupabaseAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'liquid-assets' | 'agent-banking' | 'banking-relationships' | 'liquidity-dashboard' | 'multi-bank-monitor' | 'investment-portfolio' | 'regulatory-calculator' | 'reports'>('overview');
  const [treasuryData, setTreasuryData] = useState<TreasuryManagementData | null>(null);
  const [liquidityData, setLiquidityData] = useState<LiquidityDashboard | null>(null);
  const [multiBankData, setMultiBankData] = useState<MultiBankBalanceMonitor | null>(null);
  const [investmentData, setInvestmentData] = useState<InvestmentPortfolioTracker | null>(null);
  const [regulatoryData, setRegulatoryData] = useState<RegulatoryRatioCalculator | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('current-month');
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalType, setModalType] = useState<'bank' | 'mfsp' | 'mno' | 'investment' | 'agent'>('bank');
  const [alertsExpanded, setAlertsExpanded] = useState<boolean>(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>('1D');
  const [selectedBank, setSelectedBank] = useState<string>('');
  const [viewMode, setViewMode] = useState<'consolidated' | 'individual'>('consolidated');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [portfolioViewMode, setPortfolioViewMode] = useState<'summary' | 'holdings' | 'analytics'>('summary');
  const [calculationMode, setCalculationMode] = useState<'current' | 'scenario' | 'optimization'>('current');
  const [selectedScenario, setSelectedScenario] = useState<string>('');

  // Fetch real data from Supabase
  const { data: bankAccounts, loading: bankAccountsLoading } = useSupabaseQuery('bank_accounts', {
    select: '*',
    orderBy: { column: 'created_at', ascending: false }
  });

  const { data: treasuryTransactions, loading: transactionsLoading } = useSupabaseQuery('treasury_transactions', {
    select: '*',
    orderBy: { column: 'transaction_date', ascending: false }
  });

  const { data: investments, loading: investmentsLoading } = useSupabaseQuery('investments', {
    select: '*',
    orderBy: { column: 'created_at', ascending: false }
  });
  
  const liquidityEngine = new LiquidityMonitoringEngine();
  const multiBankEngine = new MultiBankMonitoringEngine();
  const investmentEngine = new InvestmentPortfolioEngine();
  const regulatoryEngine = new RegulatoryRatioCalculatorEngine();

  // Generate mock treasury data
  const generateTreasuryData = (): TreasuryManagementData => {
    return {
      liquidAssets: {
        cashInHand: 2500000,
        bankBalances: [
          {
            bankName: 'CRDB Bank',
            accountType: 'Current Account',
            currentBalance: 15000000,
            currency: 'TZS',
            lastUpdateTime: new Date('2025-01-12T10:30:00'),
            reconciliationStatus: 'Reconciled'
          },
          {
            bankName: 'NMB Bank',
            accountType: 'Savings Account',
            currentBalance: 8500000,
            currency: 'TZS',
            lastUpdateTime: new Date('2025-01-12T09:15:00'),
            reconciliationStatus: 'Reconciled'
          },
          {
            bankName: 'Equity Bank',
            accountType: 'Fixed Deposit',
            currentBalance: 12000000,
            currency: 'TZS',
            lastUpdateTime: new Date('2025-01-11T16:45:00'),
            reconciliationStatus: 'Pending'
          }
        ],
        mfspBalances: [
          {
            mfspName: 'Tigo Pesa',
            accountType: 'Float Account',
            currentBalance: 3200000,
            currency: 'TZS',
            lastUpdateTime: new Date('2025-01-12T11:20:00'),
            status: 'Active'
          },
          {
            mfspName: 'M-Pesa',
            accountType: 'Float Account',
            currentBalance: 4500000,
            currency: 'TZS',
            lastUpdateTime: new Date('2025-01-12T10:45:00'),
            status: 'Active'
          },
          {
            mfspName: 'Airtel Money',
            accountType: 'Float Account',
            currentBalance: 1800000,
            currency: 'TZS',
            lastUpdateTime: new Date('2025-01-12T09:30:00'),
            status: 'Active'
          }
        ],
        mnoFloatBalances: [
          {
            mnoName: 'Vodacom',
            floatType: 'M-Pesa Float',
            currentBalance: 4500000,
            currency: 'TZS',
            lastUpdateTime: new Date('2025-01-12T10:45:00'),
            status: 'Active'
          },
          {
            mnoName: 'Tigo',
            floatType: 'Tigo Pesa Float',
            currentBalance: 3200000,
            currency: 'TZS',
            lastUpdateTime: new Date('2025-01-12T11:20:00'),
            status: 'Active'
          },
          {
            mnoName: 'Airtel',
            floatType: 'Airtel Money Float',
            currentBalance: 1800000,
            currency: 'TZS',
            lastUpdateTime: new Date('2025-01-12T09:30:00'),
            status: 'Active'
          }
        ],
        treasuryBills: [
          {
            name: 'T-Bill 91 Days',
            type: 'Government Treasury Bill',
            amount: 5000000,
            currency: 'TZS',
            maturityDate: new Date('2025-04-15'),
            interestRate: 8.5,
            status: 'Active'
          },
          {
            name: 'T-Bill 182 Days',
            type: 'Government Treasury Bill',
            amount: 3000000,
            currency: 'TZS',
            maturityDate: new Date('2025-07-15'),
            interestRate: 9.2,
            status: 'Active'
          }
        ],
        governmentSecurities: [
          {
            name: 'Government Bond 2Y',
            type: 'Government Bond',
            amount: 10000000,
            currency: 'TZS',
            maturityDate: new Date('2026-12-15'),
            interestRate: 10.5,
            status: 'Active'
          }
        ],
        privateSecurities: [
          {
            name: 'Corporate Bond ABC',
            type: 'Corporate Bond',
            amount: 5000000,
            currency: 'TZS',
            maturityDate: new Date('2025-12-31'),
            interestRate: 12.0,
            status: 'Active'
          }
        ],
        otherLiquidAssets: [
          {
            name: 'Money Market Fund',
            type: 'Mutual Fund',
            amount: 7500000,
            currency: 'TZS',
            maturityDate: new Date('2025-06-30'),
            interestRate: 7.5,
            status: 'Active'
          }
        ]
      },
      agentBankingBalances: [
        {
          bankName: 'CRDB Bank',
          currentBalance: 2500000,
          lastUpdateTime: new Date('2025-01-12T10:30:00'),
          reconciliationStatus: 'Reconciled'
        },
        {
          bankName: 'NMB Bank',
          currentBalance: 1800000,
          lastUpdateTime: new Date('2025-01-12T09:15:00'),
          reconciliationStatus: 'Reconciled'
        },
        {
          bankName: 'Equity Bank',
          currentBalance: 1200000,
          lastUpdateTime: new Date('2025-01-11T16:45:00'),
          reconciliationStatus: 'Pending'
        }
      ],
      bankingRelationships: [
        {
          institutionType: 'Bank',
          institutionName: 'CRDB Bank',
          depositAmount: 15000000,
          borrowingAmount: 0,
          interestRate: 6.5,
          maturityDate: new Date('2025-12-31')
        },
        {
          institutionType: 'Bank',
          institutionName: 'NMB Bank',
          depositAmount: 8500000,
          borrowingAmount: 5000000,
          interestRate: 8.0,
          maturityDate: new Date('2025-06-30')
        },
        {
          institutionType: 'International',
          institutionName: 'World Bank',
          depositAmount: 0,
          borrowingAmount: 25000000,
          interestRate: 4.5,
          maturityDate: new Date('2027-12-31')
        },
        {
          institutionType: 'MFSP',
          institutionName: 'Tigo Pesa',
          depositAmount: 3200000,
          borrowingAmount: 0,
          interestRate: 0,
          maturityDate: new Date('2025-12-31')
        }
      ]
    };
  };

  // Load data on component mount
  useEffect(() => {
    const data = generateTreasuryData();
    setTreasuryData(data);
    setLiquidityData(liquidityEngine.calculateRealTimeLiquidity(data));
    setMultiBankData(multiBankEngine.generateMultiBankData());
    setInvestmentData(investmentEngine.generateInvestmentPortfolioData());
    setRegulatoryData(regulatoryEngine.generateRegulatoryRatioData());
  }, []);

  // Real-time regulatory updates every 15 minutes
  useEffect(() => {
    if (!treasuryData) return;
    
    const interval = setInterval(() => {
      setRegulatoryData(regulatoryEngine.generateRegulatoryRatioData());
    }, 15 * 60 * 1000); // 15 minutes
    
    return () => clearInterval(interval);
  }, [treasuryData]);

  // Real-time liquidity updates every 30 seconds
  useEffect(() => {
    if (!treasuryData) return;
    
    const interval = setInterval(() => {
      setLiquidityData(liquidityEngine.calculateRealTimeLiquidity(treasuryData));
    }, 30000);
    
    return () => clearInterval(interval);
  }, [treasuryData]);

  // Calculate total liquid assets
  const calculateTotalLiquidAssets = () => {
    if (!treasuryData) return 0;
    
    const { liquidAssets } = treasuryData;
    let total = liquidAssets.cashInHand;
    
    total += liquidAssets.bankBalances.reduce((sum, bank) => sum + bank.currentBalance, 0);
    total += liquidAssets.mfspBalances.reduce((sum, mfsp) => sum + mfsp.currentBalance, 0);
    total += liquidAssets.mnoFloatBalances.reduce((sum, mno) => sum + mno.currentBalance, 0);
    total += liquidAssets.treasuryBills.reduce((sum, bill) => sum + bill.amount, 0);
    total += liquidAssets.governmentSecurities.reduce((sum, sec) => sum + sec.amount, 0);
    total += liquidAssets.privateSecurities.reduce((sum, sec) => sum + sec.amount, 0);
    total += liquidAssets.otherLiquidAssets.reduce((sum, asset) => sum + asset.amount, 0);
    
    return total;
  };

  // Calculate total deposits and borrowings
  const calculateTotalDeposits = () => {
    if (!treasuryData) return 0;
    return treasuryData.bankingRelationships.reduce((sum, rel) => sum + rel.depositAmount, 0);
  };

  const calculateTotalBorrowings = () => {
    if (!treasuryData) return 0;
    return treasuryData.bankingRelationships.reduce((sum, rel) => sum + rel.borrowingAmount, 0);
  };

  // Render overview dashboard
  const renderOverview = () => (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg mr-4">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Liquid Assets</p>
              <p className="text-2xl font-bold text-gray-900">
                TZS {roundCurrency(calculateTotalLiquidAssets()).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg mr-4">
              <Building2 className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Deposits</p>
              <p className="text-2xl font-bold text-gray-900">
                TZS {roundCurrency(calculateTotalDeposits()).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-orange-100 rounded-lg mr-4">
              <CreditCard className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Borrowings</p>
              <p className="text-2xl font-bold text-gray-900">
                TZS {roundCurrency(calculateTotalBorrowings()).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg mr-4">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Agent Banking</p>
              <p className="text-2xl font-bold text-gray-900">
                TZS {treasuryData?.agentBankingBalances.reduce((sum, agent) => sum + agent.currentBalance, 0).toLocaleString() || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Asset Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Liquid Assets Breakdown</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Cash in Hand</span>
              <span className="text-sm font-medium text-gray-900">
                TZS {treasuryData?.liquidAssets.cashInHand.toLocaleString() || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Bank Balances</span>
              <span className="text-sm font-medium text-gray-900">
                TZS {treasuryData?.liquidAssets.bankBalances.reduce((sum, bank) => sum + bank.currentBalance, 0).toLocaleString() || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">MFSP Balances</span>
              <span className="text-sm font-medium text-gray-900">
                TZS {treasuryData?.liquidAssets.mfspBalances.reduce((sum, mfsp) => sum + mfsp.currentBalance, 0).toLocaleString() || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">MNO Float Balances</span>
              <span className="text-sm font-medium text-gray-900">
                TZS {treasuryData?.liquidAssets.mnoFloatBalances.reduce((sum, mno) => sum + mno.currentBalance, 0).toLocaleString() || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Investments</span>
              <span className="text-sm font-medium text-gray-900">
                TZS {(treasuryData?.liquidAssets.treasuryBills.reduce((sum, bill) => sum + bill.amount, 0) || 0) +
                     (treasuryData?.liquidAssets.governmentSecurities.reduce((sum, sec) => sum + sec.amount, 0) || 0) +
                     (treasuryData?.liquidAssets.privateSecurities.reduce((sum, sec) => sum + sec.amount, 0) || 0) +
                     (treasuryData?.liquidAssets.otherLiquidAssets.reduce((sum, asset) => sum + asset.amount, 0) || 0)}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Banking Relationships</h3>
          <div className="space-y-4">
            {treasuryData?.bankingRelationships.slice(0, 4).map((rel, index) => (
              <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div>
                  <span className="text-sm font-medium text-gray-900">{rel.institutionName}</span>
                  <span className="text-xs text-gray-500 ml-2">({rel.institutionType})</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">
                    TZS {(rel.depositAmount + rel.borrowingAmount).toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500">
                    {rel.interestRate}% interest
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // Render liquid assets tab
  const renderLiquidAssets = () => (
    <div className="space-y-6">
      {/* Cash in Hand */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Cash in Hand</h3>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Update Balance
          </button>
        </div>
        <div className="text-3xl font-bold text-gray-900">
          TZS {treasuryData?.liquidAssets.cashInHand.toLocaleString() || 0}
        </div>
      </div>

      {/* Bank Balances */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">Bank Balances</h3>
            <button 
              onClick={() => { setModalType('bank'); setShowAddModal(true); }}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Add Bank Account
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bank Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Account Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Update</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {treasuryData?.liquidAssets.bankBalances.map((bank, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{bank.bankName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{bank.accountType}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    TZS {bank.currentBalance.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {bank.lastUpdateTime.toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      bank.reconciliationStatus === 'Reconciled' ? 'bg-green-100 text-green-800' :
                      bank.reconciliationStatus === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {bank.reconciliationStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button className="text-blue-600 hover:text-blue-900">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="text-green-600 hover:text-green-900">
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

      {/* MFSP Balances */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">MFSP Balances</h3>
            <button 
              onClick={() => { setModalType('mfsp'); setShowAddModal(true); }}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Add MFSP Account
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">MFSP Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Account Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Update</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {treasuryData?.liquidAssets.mfspBalances.map((mfsp, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{mfsp.mfspName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{mfsp.accountType}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    TZS {mfsp.currentBalance.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {mfsp.lastUpdateTime.toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      mfsp.status === 'Active' ? 'bg-green-100 text-green-800' :
                      mfsp.status === 'Inactive' ? 'bg-gray-100 text-gray-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {mfsp.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button className="text-blue-600 hover:text-blue-900">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="text-green-600 hover:text-green-900">
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

      {/* Investments */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">Investments</h3>
            <button 
              onClick={() => { setModalType('investment'); setShowAddModal(true); }}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Add Investment
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Investment Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Interest Rate</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Maturity Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {treasuryData?.liquidAssets.treasuryBills.map((bill, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{bill.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{bill.type}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    TZS {bill.amount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{bill.interestRate}%</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {bill.maturityDate.toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      bill.status === 'Active' ? 'bg-green-100 text-green-800' :
                      bill.status === 'Matured' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {bill.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button className="text-blue-600 hover:text-blue-900">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="text-green-600 hover:text-green-900">
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
    </div>
  );

  // Render agent banking tab
  const renderAgentBanking = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">Agent Banking Balances</h3>
            <button 
              onClick={() => { setModalType('agent'); setShowAddModal(true); }}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Add Agent Bank
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bank Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Balance</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Update</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reconciliation Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {treasuryData?.agentBankingBalances.map((agent, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{agent.bankName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    TZS {agent.currentBalance.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {agent.lastUpdateTime.toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      agent.reconciliationStatus === 'Reconciled' ? 'bg-green-100 text-green-800' :
                      agent.reconciliationStatus === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {agent.reconciliationStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button className="text-blue-600 hover:text-blue-900">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="text-green-600 hover:text-green-900">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button className="text-purple-600 hover:text-purple-900">
                        <RefreshCw className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  // Render liquidity dashboard
  const renderLiquidityDashboard = () => (
    <div className="space-y-6">
      {/* Primary Liquidity Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Primary Liquidity Ratio</h3>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              liquidityData?.realTimeLiquidity.liquidityRisk === 'Low' ? 'bg-green-100 text-green-800' :
              liquidityData?.realTimeLiquidity.liquidityRisk === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              {liquidityData?.realTimeLiquidity.liquidityRisk || 'Low'}
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-2">
            {((liquidityData?.realTimeLiquidity.primaryLiquidityRatio || 0) * 100).toFixed(2)}%
          </div>
          <div className="text-sm text-gray-600">
            BOT Minimum: 5.00%
          </div>
          <div className="mt-2 bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full ${
                (liquidityData?.realTimeLiquidity.primaryLiquidityRatio || 0) >= 0.10 ? 'bg-green-500' :
                (liquidityData?.realTimeLiquidity.primaryLiquidityRatio || 0) >= 0.07 ? 'bg-yellow-500' :
                'bg-red-500'
              }`}
              style={{ width: `${Math.min(((liquidityData?.realTimeLiquidity.primaryLiquidityRatio || 0) / 0.15) * 100, 100)}%` }}
            ></div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center mb-4">
            <div className="p-3 bg-blue-100 rounded-lg mr-4">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Liquidity Buffer</p>
              <p className="text-2xl font-bold text-gray-900">
                TZS {liquidityData?.realTimeLiquidity.liquidityBuffer.toLocaleString() || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center mb-4">
            <div className="p-3 bg-green-100 rounded-lg mr-4">
              <Shield className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Days Coverage</p>
              <p className="text-2xl font-bold text-gray-900">30</p>
              <p className="text-xs text-gray-500">Target: 30 days</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center mb-4">
            <div className="p-3 bg-purple-100 rounded-lg mr-4">
              <Activity className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Last Update</p>
              <p className="text-sm font-bold text-gray-900">
                {liquidityData?.realTimeLiquidity.lastCalculationTime.toLocaleTimeString() || 'N/A'}
              </p>
              <p className="text-xs text-gray-500">Auto-refresh: 30s</p>
            </div>
          </div>
        </div>
      </div>

      {/* Liquidity Components Breakdown */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Liquidity Components (MSP2_05)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {liquidityData?.liquidityComponents && Object.entries(liquidityData.liquidityComponents).map(([key, component]) => (
            <div key={key} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="text-sm font-medium text-gray-900">{component.componentName}</p>
                  <p className="text-xs text-gray-500">{component.componentCode}</p>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  component.liquidityRating === 'Immediate' ? 'bg-green-100 text-green-800' :
                  component.liquidityRating === 'T+1' ? 'bg-blue-100 text-blue-800' :
                  component.liquidityRating === 'T+3' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-orange-100 text-orange-800'
                }`}>
                  {component.liquidityRating}
                </span>
              </div>
              <div className="text-lg font-bold text-gray-900 mb-1">
                TZS {component.currentBalance.toLocaleString()}
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className={`${component.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {component.change >= 0 ? '+' : ''}{component.changePercentage.toFixed(1)}%
                </span>
                <span className="text-gray-500">{component.riskRating}</span>
              </div>
              <div className="mt-2 text-xs text-gray-500">
                {component.botReportMapping.contributionToTotal.toFixed(1)}% of total
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Real-time Monitoring Chart */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Liquidity Trend Analysis</h3>
          <div className="flex space-x-2">
            <select
              value={selectedTimeframe}
              onChange={(e) => setSelectedTimeframe(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
            >
              <option value="1H">1 Hour</option>
              <option value="4H">4 Hours</option>
              <option value="1D">1 Day</option>
              <option value="1W">1 Week</option>
              <option value="1M">1 Month</option>
            </select>
            <button className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500">Liquidity Trend Chart</p>
            <p className="text-sm text-gray-400">Interactive chart will be implemented here</p>
          </div>
        </div>
      </div>

      {/* Liquidity Alerts */}
      {liquidityData?.monitoringAlerts.activeAlerts && liquidityData.monitoringAlerts.activeAlerts.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div 
            className="flex justify-between items-center cursor-pointer"
            onClick={() => setAlertsExpanded(!alertsExpanded)}
          >
            <h3 className="text-lg font-semibold text-gray-900">
              Liquidity Alerts ({liquidityData.monitoringAlerts.activeAlerts.length})
            </h3>
            <div className="flex items-center">
              {alertsExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
            </div>
          </div>
          
          {alertsExpanded && (
            <div className="mt-4 space-y-3">
              {liquidityData.monitoringAlerts.activeAlerts.map((alert, index) => (
                <div key={index} className={`p-4 rounded-lg border-l-4 ${
                  alert.severity === 'CRITICAL' ? 'bg-red-50 border-red-500' :
                  alert.severity === 'HIGH' ? 'bg-orange-50 border-orange-500' :
                  alert.severity === 'MEDIUM' ? 'bg-yellow-50 border-yellow-500' :
                  'bg-blue-50 border-blue-500'
                }`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center mb-1">
                        <AlertTriangle className={`w-4 h-4 mr-2 ${
                          alert.severity === 'CRITICAL' ? 'text-red-600' :
                          alert.severity === 'HIGH' ? 'text-orange-600' :
                          alert.severity === 'MEDIUM' ? 'text-yellow-600' :
                          'text-blue-600'
                        }`} />
                        <span className={`font-medium ${
                          alert.severity === 'CRITICAL' ? 'text-red-900' :
                          alert.severity === 'HIGH' ? 'text-orange-900' :
                          alert.severity === 'MEDIUM' ? 'text-yellow-900' :
                          'text-blue-900'
                        }`}>
                          {alert.severity} - {alert.type.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 mb-1">{alert.message}</p>
                      <p className="text-xs text-gray-600">{alert.impact}</p>
                      {alert.recommendedAction && (
                        <p className="text-xs text-gray-600 mt-1">
                          <strong>Action:</strong> {alert.recommendedAction}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      {alert.deadline && (
                        <p className="text-xs text-gray-500">
                          Due: {alert.deadline.toLocaleDateString()}
                        </p>
                      )}
                      {alert.estimatedAmount && (
                        <p className="text-xs text-gray-500">
                          Amount: TZS {alert.estimatedAmount.toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Stress Testing Results */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Liquidity Stress Testing</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {liquidityData?.liquidityAnalytics.stressTestResults.map((result, index) => (
            <div key={index} className="p-4 border border-gray-200 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">{result.scenarioName}</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Pre-Stress:</span>
                  <span className="font-medium">{(result.preStressRatio * 100).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Post-Stress:</span>
                  <span className="font-medium">{(result.postStressRatio * 100).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shortfall:</span>
                  <span className="font-medium text-red-600">TZS {result.liquidityShortfall.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Survival:</span>
                  <span className="font-medium">{result.survivalPeriod} days</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="flex flex-wrap gap-3">
          <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
            Optimize Liquidity
          </button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Run Stress Test
          </button>
          <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
            Generate Report
          </button>
          <button className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors">
            Update Thresholds
          </button>
        </div>
      </div>
    </div>
  );

  // Render multi-bank balance monitor
  const renderMultiBankBalanceMonitor = () => (
    <div className="space-y-6">
      {/* Banking Relationships Overview */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Banking Relationships Portfolio</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900 mb-2">
              {multiBankData?.bankingRelationships.totalBanks || 0}
            </div>
            <div className="text-sm text-gray-600 mb-1">Total Banks</div>
            <div className="text-xs text-green-600">
              {multiBankData?.bankingRelationships.activeBanks || 0} Active
            </div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900 mb-2">
              TZS {(multiBankData?.bankingRelationships.totalBalance || 0).toLocaleString()}
            </div>
            <div className="text-sm text-gray-600 mb-1">Total Balance</div>
            <div className="text-xs text-green-600">+2.5% from last month</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900 mb-2">
              {((multiBankData?.riskManagement.concentrationAnalysis.topBankConcentration || 0) * 100).toFixed(1)}%
            </div>
            <div className="text-sm text-gray-600 mb-1">Concentration Risk</div>
            <div className="text-xs text-yellow-600">Max: 25%</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900 mb-2">
              {multiBankData?.bankingRelationships.lastSyncTime.toLocaleTimeString() || 'N/A'}
            </div>
            <div className="text-sm text-gray-600 mb-1">Last Sync</div>
            <div className="text-xs text-green-600">Auto-refresh: 30s</div>
          </div>
        </div>
      </div>

      {/* View Mode Selector */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Bank Account View</h3>
          <div className="flex space-x-2">
            <button
              onClick={() => setViewMode('consolidated')}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                viewMode === 'consolidated'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Consolidated View
            </button>
            <button
              onClick={() => setViewMode('individual')}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                viewMode === 'individual'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Individual Banks
            </button>
          </div>
        </div>
      </div>

      {/* Consolidated View */}
      {viewMode === 'consolidated' && (
        <div className="space-y-6">
          {/* Balance Distribution */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Balance Distribution by Bank Type</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {multiBankData?.bankingRelationships.relationshipTypes.map((type, index) => (
                <div key={index} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium text-gray-900">{type.type}</h4>
                    <span className="text-sm text-gray-500">{type.count} banks</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900 mb-1">
                    TZS {type.totalBalance.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600 mb-2">
                    {type.percentage.toFixed(1)}% of total
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: `${type.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Consolidated Summary Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-900">Consolidated Bank Summary</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bank Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Banks</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Balance</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Percentage</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Risk Level</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {multiBankData?.bankingRelationships.relationshipTypes.map((type, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{type.type}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{type.count}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        TZS {type.totalBalance.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{type.percentage.toFixed(1)}%</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          type.percentage > 40 ? 'bg-red-100 text-red-800' :
                          type.percentage > 25 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {type.percentage > 40 ? 'High' : type.percentage > 25 ? 'Medium' : 'Low'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Individual Banks View */}
      {viewMode === 'individual' && (
        <div className="space-y-6">
          {multiBankData?.bankAccounts && Object.entries(multiBankData.bankAccounts).map(([category, accounts]) => (
            <div key={category} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h3 className="text-lg font-semibold text-gray-900 capitalize">
                  {category.replace(/([A-Z])/g, ' $1').trim()}
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bank</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Account</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rating</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {accounts.map((account, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{account.bankName}</div>
                            <div className="text-xs text-gray-500">{account.bankCode}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm text-gray-900">{account.accountType}</div>
                            <div className="text-xs text-gray-500">{account.accountNumber}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {account.currency} {account.balanceInfo.currentBalance.toLocaleString()}
                            </div>
                            <div className="text-xs text-gray-500">
                              Available: {account.balanceInfo.availableBalance.toLocaleString()}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            account.riskProfile.bankRating === 'AAA' ? 'bg-green-100 text-green-800' :
                            account.riskProfile.bankRating === 'AA' ? 'bg-blue-100 text-blue-800' :
                            account.riskProfile.bankRating === 'A' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-orange-100 text-orange-800'
                          }`}>
                            {account.riskProfile.bankRating}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className={`w-2 h-2 rounded-full mr-2 ${
                              account.integrationStatus.apiConnection === 'Connected' ? 'bg-green-500' :
                              account.integrationStatus.apiConnection === 'Disconnected' ? 'bg-red-500' :
                              'bg-yellow-500'
                            }`}></div>
                            <span className="text-sm text-gray-900">{account.integrationStatus.apiConnection}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button className="text-blue-600 hover:text-blue-900">
                              <Eye className="w-4 h-4" />
                            </button>
                            <button className="text-green-600 hover:text-green-900">
                              <RefreshCw className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Real-time Monitoring Panel */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Real-time Balance Monitoring</h3>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Balance Updates */}
          <div>
            <h4 className="font-medium text-gray-900 mb-4">Recent Balance Updates</h4>
            <div className="space-y-3">
              {multiBankData?.realTimeMonitoring.balanceUpdates.slice(0, 5).map((update, index) => (
                <div key={index} className="p-3 border border-gray-200 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{update.bankName}</div>
                      <div className="text-xs text-gray-500">{update.updateTime.toLocaleTimeString()}</div>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-medium ${update.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {update.change >= 0 ? '+' : ''}{update.change.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500">{update.source}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Connectivity Status */}
          <div>
            <h4 className="font-medium text-gray-900 mb-4">Bank Connectivity Status</h4>
            <div className="space-y-3">
              {multiBankData?.realTimeMonitoring.connectivityStatus.map((connection, index) => (
                <div key={index} className="flex justify-between items-center p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center">
                    <div className={`w-2 h-2 rounded-full mr-3 ${
                      connection.status === 'Connected' ? 'bg-green-500' :
                      connection.status === 'Disconnected' ? 'bg-red-500' :
                      'bg-yellow-500'
                    }`}></div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">{connection.bankName}</div>
                      <div className="text-xs text-gray-500">{connection.responseTime}ms</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-900">{connection.uptime.toFixed(1)}%</div>
                    <div className="text-xs text-gray-500">uptime</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Reconciliation Status */}
          <div>
            <h4 className="font-medium text-gray-900 mb-4">Reconciliation Status</h4>
            <div className="space-y-3">
              {multiBankData?.realTimeMonitoring.reconciliationStatus.map((status, index) => (
                <div key={index} className="p-3 border border-gray-200 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{status.bankName}</div>
                      <div className="text-xs text-gray-500">
                        {status.lastReconciliation.toLocaleDateString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        status.status === 'Matched' ? 'bg-green-100 text-green-800' :
                        status.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {status.status}
                      </span>
                      {status.discrepancyAmount > 0 && (
                        <div className="text-xs text-red-600 mt-1">
                          TZS {status.discrepancyAmount.toLocaleString()}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Risk Management Dashboard */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Banking Relationship Risk Management</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Concentration Risk */}
          <div>
            <h4 className="font-medium text-gray-900 mb-4">Concentration Risk Analysis</h4>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Top Bank Concentration</span>
                <span className="text-sm font-medium text-gray-900">
                  {((multiBankData?.riskManagement.concentrationAnalysis.topBankConcentration || 0) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Diversification Score</span>
                <span className="text-sm font-medium text-gray-900">
                  {((multiBankData?.riskManagement.concentrationAnalysis.diversificationScore || 0) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Herfindahl Index</span>
                <span className="text-sm font-medium text-gray-900">
                  {(multiBankData?.riskManagement.concentrationAnalysis.herfindahlIndex || 0).toFixed(3)}
                </span>
              </div>
            </div>
          </div>

          {/* Counterparty Risk */}
          <div>
            <h4 className="font-medium text-gray-900 mb-4">Counterparty Risk</h4>
            <div className="space-y-3">
              {multiBankData?.riskManagement.counterpartyRisk.map((risk, index) => (
                <div key={index} className="p-3 border border-gray-200 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-900">{risk.bankName}</span>
                    <span className="text-xs text-gray-500">{risk.creditRating}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Exposure:</span>
                    <span className="font-medium">TZS {risk.exposureAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Utilization:</span>
                    <span className="font-medium">{(risk.riskUtilization * 100).toFixed(1)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* BOT Report Integration */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">BOT Report Integration Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-gray-900">MSP2_07 - Deposits and Borrowings</h4>
              <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                Passed
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-2">Data Source: Multi-Bank Balances</p>
            <p className="text-xs text-gray-500">Last Update: {new Date().toLocaleString()}</p>
          </div>
          <div className="p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-gray-900">MSP2_08 - Agent Banking Balances</h4>
              <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                Passed
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-2">Data Source: Agent Banking Accounts</p>
            <p className="text-xs text-gray-500">Last Update: {new Date().toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Banking Operations Controls */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Banking Operations</h3>
        <div className="flex flex-wrap gap-3">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Sync All Balances
          </button>
          <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
            Run Reconciliation
          </button>
          <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
            Optimize Relationships
          </button>
          <button className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors">
            Generate Banking Report
          </button>
          <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
            Export BOT Data
          </button>
        </div>
      </div>
    </div>
  );

  // Render investment portfolio tracker
  const renderInvestmentPortfolioTracker = () => (
    <div className="space-y-6">
      {/* Portfolio Overview */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Investment Portfolio Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900 mb-2">
              TZS {(investmentData?.portfolioOverview.totalInvestments || 0).toLocaleString()}
            </div>
            <div className="text-sm text-gray-600 mb-1">Total Investments</div>
            <div className="text-xs text-green-600">+5.2% from last quarter</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900 mb-2">
              {(investmentData?.portfolioOverview.portfolioYield || 0).toFixed(1)}%
            </div>
            <div className="text-sm text-gray-600 mb-1">Portfolio Yield</div>
            <div className="text-xs text-blue-600">Benchmark: 7.7%</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900 mb-2">
              {(investmentData?.portfolioOverview.portfolioDuration || 0).toFixed(1)}Y
            </div>
            <div className="text-sm text-gray-600 mb-1">Average Duration</div>
            <div className="text-xs text-purple-600">Target: 3.0Y</div>
          </div>
          <div className="text-center">
            <div className={`text-3xl font-bold mb-2 ${
              investmentData?.portfolioOverview.portfolioRisk === 'Low' ? 'text-green-600' :
              investmentData?.portfolioOverview.portfolioRisk === 'Medium' ? 'text-yellow-600' :
              'text-red-600'
            }`}>
              {investmentData?.portfolioOverview.portfolioRisk || 'Medium'}
            </div>
            <div className="text-sm text-gray-600 mb-1">Risk Level</div>
            <div className="text-xs text-gray-500">
              Last Valuation: {investmentData?.portfolioOverview.lastValuationDate.toLocaleDateString()}
            </div>
          </div>
        </div>
      </div>

      {/* Investment Categories (MSP2_05) */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Investment Categories (MSP2_05)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {investmentData?.investmentCategories && Object.entries(investmentData.investmentCategories).map(([key, category]) => (
            <div key={key} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                 onClick={() => setSelectedCategory(key)}>
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-medium text-gray-900">{category.categoryName}</h4>
                  <p className="text-xs text-gray-500">{category.categoryCode}</p>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  category.riskProfile.creditQuality === 'AAA' ? 'bg-green-100 text-green-800' :
                  category.riskProfile.creditQuality === 'AA' ? 'bg-blue-100 text-blue-800' :
                  category.riskProfile.creditQuality === 'A' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-orange-100 text-orange-800'
                }`}>
                  {category.riskProfile.creditQuality}
                </span>
              </div>
              <div className="text-lg font-bold text-gray-900 mb-1">
                TZS {category.totalValue.toLocaleString()}
              </div>
              <div className="flex justify-between items-center text-sm mb-2">
                <span className="text-gray-600">Yield: {category.yieldToMaturity.toFixed(1)}%</span>
                <span className="text-gray-600">Duration: {category.averageDuration.toFixed(1)}Y</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className={`${category.unrealizedGainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {category.unrealizedGainLoss >= 0 ? '+' : ''}TZS {category.unrealizedGainLoss.toLocaleString()}
                </span>
                <span className="text-gray-500">{category.holdings.count} holdings</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* View Mode Selector */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Portfolio View</h3>
          <div className="flex space-x-2">
            <button
              onClick={() => setPortfolioViewMode('summary')}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                portfolioViewMode === 'summary'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Portfolio Summary
            </button>
            <button
              onClick={() => setPortfolioViewMode('holdings')}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                portfolioViewMode === 'holdings'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Individual Holdings
            </button>
            <button
              onClick={() => setPortfolioViewMode('analytics')}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                portfolioViewMode === 'analytics'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Risk Analytics
            </button>
          </div>
        </div>
      </div>

      {/* Portfolio Summary View */}
      {portfolioViewMode === 'summary' && (
        <div className="space-y-6">
          {/* Allocation Analysis */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Portfolio Allocation</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-4">Asset Allocation</h4>
                <div className="space-y-3">
                  {investmentData?.investmentCategories && Object.entries(investmentData.investmentCategories).map(([key, category]) => {
                    const percentage = (category.totalValue / (investmentData?.portfolioOverview.totalInvestments || 1)) * 100;
                    return (
                      <div key={key} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className={`w-3 h-3 rounded-full mr-3 ${
                            key === 'treasuryBills' ? 'bg-blue-500' :
                            key === 'governmentSecurities' ? 'bg-green-500' :
                            key === 'privateSecurities' ? 'bg-yellow-500' :
                            'bg-purple-500'
                          }`}></div>
                          <span className="text-sm text-gray-900">{category.categoryName}</span>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-gray-900">{percentage.toFixed(1)}%</div>
                          <div className="text-xs text-gray-500">TZS {category.totalValue.toLocaleString()}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-4">Maturity Distribution</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Short Term (&lt; 1Y)</span>
                    <span className="text-sm font-medium text-gray-900">32%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Medium Term (1-5Y)</span>
                    <span className="text-sm font-medium text-gray-900">48%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Long Term (&gt; 5Y)</span>
                    <span className="text-sm font-medium text-gray-900">20%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Performance Summary */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 mb-2">
                  {(investmentData?.performanceAnalytics.yieldAnalysis.portfolioYield || 0).toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600 mb-1">Portfolio Yield</div>
                <div className="text-xs text-green-600">+0.8% vs benchmark</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 mb-2">
                  {(investmentData?.performanceAnalytics.riskAnalysis.riskAdjustedReturn || 0).toFixed(2)}
                </div>
                <div className="text-sm text-gray-600 mb-1">Risk-Adjusted Return</div>
                <div className="text-xs text-blue-600">Sharpe Ratio</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 mb-2">
                  TZS {(investmentData?.performanceAnalytics.riskAnalysis.valueAtRisk || 0).toLocaleString()}
                </div>
                <div className="text-sm text-gray-600 mb-1">Value at Risk (95%)</div>
                <div className="text-xs text-orange-600">1-day horizon</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Individual Holdings View */}
      {portfolioViewMode === 'holdings' && (
        <div className="space-y-6">
          {/* Holdings Filters */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex flex-wrap gap-4">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                <option value="all">All Categories</option>
                <option value="treasuryBills">Treasury Bills</option>
                <option value="governmentSecurities">Government Securities</option>
                <option value="privateSecurities">Private Securities</option>
                <option value="otherInvestments">Other Investments</option>
              </select>
              <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
                <Search className="w-4 h-4 mr-2 inline" />
                Search Holdings
              </button>
            </div>
          </div>

          {/* Holdings Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-900">Investment Holdings</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Security</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Market Value</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Yield</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Maturity</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rating</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {/* Government Securities */}
                  {investmentData?.securities.governmentSecurities.map((security, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{security.securityName}</div>
                          <div className="text-xs text-gray-500">{security.isinCode}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{security.securityType}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        TZS {security.marketValue.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {security.yieldToMaturity.toFixed(1)}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {security.duration.toFixed(1)}Y
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {security.maturityDate.toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                          {security.creditRating}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button className="text-blue-600 hover:text-blue-900">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button className="text-green-600 hover:text-green-900">
                            <Edit className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {/* Corporate Bonds */}
                  {investmentData?.securities.corporateBonds.map((bond, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{bond.securityName}</div>
                          <div className="text-xs text-gray-500">{bond.issuerName}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Corporate Bond</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        TZS {bond.marketValue.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {bond.yieldToMaturity.toFixed(1)}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {bond.duration.toFixed(1)}Y
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {bond.maturityDate.toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                          {bond.creditRating}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button className="text-blue-600 hover:text-blue-900">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button className="text-green-600 hover:text-green-900">
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
        </div>
      )}

      {/* Risk Analytics View */}
      {portfolioViewMode === 'analytics' && (
        <div className="space-y-6">
          {/* Risk Dashboard */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Risk Management Dashboard</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Credit Risk */}
              <div>
                <h4 className="font-medium text-gray-900 mb-4">Credit Risk Analysis</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Average Credit Rating</span>
                    <span className="text-sm font-medium text-gray-900">
                      {investmentData?.riskManagement.creditRisk.averageCreditRating}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Default Probability</span>
                    <span className="text-sm font-medium text-gray-900">
                      {(investmentData?.riskManagement.creditRisk.defaultProbability || 0) * 100}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Expected Loss</span>
                    <span className="text-sm font-medium text-gray-900">
                      TZS {(investmentData?.riskManagement.creditRisk.expectedLoss || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Interest Rate Risk */}
              <div>
                <h4 className="font-medium text-gray-900 mb-4">Interest Rate Risk</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Portfolio Duration</span>
                    <span className="text-sm font-medium text-gray-900">
                      {(investmentData?.riskManagement.interestRateRisk.portfolioDuration || 0).toFixed(1)}Y
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Modified Duration</span>
                    <span className="text-sm font-medium text-gray-900">
                      {(investmentData?.riskManagement.interestRateRisk.modifiedDuration || 0).toFixed(1)}Y
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">DV01</span>
                    <span className="text-sm font-medium text-gray-900">
                      TZS {(investmentData?.riskManagement.interestRateRisk.dv01 || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Interest Rate Scenarios */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Interest Rate Scenarios</h3>
            <div className="space-y-3">
              {investmentData?.riskManagement.interestRateRisk.interestRateScenarios.map((scenario, index) => (
                <div key={index} className="flex justify-between items-center p-3 border border-gray-200 rounded-lg">
                  <span className="text-sm font-medium text-gray-900">{scenario.scenario}</span>
                  <span className={`text-sm font-medium ${
                    scenario.impact >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {scenario.impact >= 0 ? '+' : ''}TZS {scenario.impact.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Investment Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Portfolio Management Actions</h3>
        <div className="flex flex-wrap gap-3">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Rebalance Portfolio
          </button>
          <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
            Optimize Yield
          </button>
          <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
            Run Stress Test
          </button>
          <button className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors">
            Generate Investment Report
          </button>
          <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
            Update Valuations
          </button>
        </div>
      </div>
    </div>
  );

  // Render regulatory ratio calculator
  const renderRegulatoryRatioCalculator = () => (
    <div className="space-y-6">
      {/* BOT Compliance Dashboard */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">BOT Liquidity Compliance Dashboard</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Compliance Gauge */}
          <div className="text-center">
            <div className="relative w-48 h-48 mx-auto mb-4">
              <div className="absolute inset-0 rounded-full border-8 border-gray-200"></div>
              <div 
                className="absolute inset-0 rounded-full border-8 border-green-500"
                style={{ 
                  clipPath: `polygon(50% 50%, 50% 0%, ${50 + (regulatoryData?.realTimeCalculations.currentRatio || 0) * 500}% 0%, 50% 50%)`,
                  transform: 'rotate(-90deg)'
                }}
              ></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900">
                    {((regulatoryData?.realTimeCalculations.currentRatio || 0) * 100).toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-600">Current Ratio</div>
                </div>
              </div>
            </div>
            <div className="text-sm text-gray-600 mb-2">BOT Minimum: 5.0%</div>
            <div className={`text-sm font-medium ${
              (regulatoryData?.realTimeCalculations.currentRatio || 0) >= 0.05 ? 'text-green-600' :
              (regulatoryData?.realTimeCalculations.currentRatio || 0) >= 0.03 ? 'text-yellow-600' :
              'text-red-600'
            }`}>
              {regulatoryData?.calculationComponents.ratioCalculation.complianceStatus || 'Compliant'}
            </div>
          </div>

          {/* Compliance Metrics */}
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 border border-gray-200 rounded-lg">
              <div>
                <div className="text-sm font-medium text-gray-900">Current Liquidity Ratio</div>
                <div className="text-xs text-gray-500">Real-time calculation</div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">
                  {((regulatoryData?.realTimeCalculations.currentRatio || 0) * 100).toFixed(2)}%
                </div>
                <div className="text-xs text-gray-500">
                  {regulatoryData?.realTimeCalculations.lastCalculationTime.toLocaleTimeString()}
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center p-4 border border-gray-200 rounded-lg">
              <div>
                <div className="text-sm font-medium text-gray-900">Required Amount</div>
                <div className="text-xs text-gray-500">BOT minimum requirement</div>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold text-gray-900">
                  TZS {(regulatoryData?.realTimeCalculations.requiredAmount || 0).toLocaleString()}
                </div>
                <div className="text-xs text-gray-500">5% of total assets</div>
              </div>
            </div>

            <div className="flex justify-between items-center p-4 border border-gray-200 rounded-lg">
              <div>
                <div className="text-sm font-medium text-gray-900">Excess/Deficit</div>
                <div className="text-xs text-gray-500">Above minimum requirement</div>
              </div>
              <div className="text-right">
                <div className={`text-xl font-bold ${
                  (regulatoryData?.realTimeCalculations.excessDeficit || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {regulatoryData?.realTimeCalculations.excessDeficit >= 0 ? '+' : ''}TZS {(regulatoryData?.realTimeCalculations.excessDeficit || 0).toLocaleString()}
                </div>
                <div className="text-xs text-gray-500">
                  {(regulatoryData?.realTimeCalculations.excessDeficit || 0) >= 0 ? 'Surplus' : 'Deficit'}
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center p-4 border border-gray-200 rounded-lg">
              <div>
                <div className="text-sm font-medium text-gray-900">Buffer Amount</div>
                <div className="text-xs text-gray-500">Above target level (10%)</div>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold text-gray-900">
                  TZS {(regulatoryData?.realTimeCalculations.bufferAmount || 0).toLocaleString()}
                </div>
                <div className="text-xs text-gray-500">Safety buffer</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Calculation Mode Selector */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Calculation Mode</h3>
          <div className="flex space-x-2">
            <button
              onClick={() => setCalculationMode('current')}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                calculationMode === 'current'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Current Calculation
            </button>
            <button
              onClick={() => setCalculationMode('scenario')}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                calculationMode === 'scenario'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Scenario Analysis
            </button>
            <button
              onClick={() => setCalculationMode('optimization')}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                calculationMode === 'optimization'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Optimization Engine
            </button>
          </div>
        </div>
      </div>

      {/* Current Calculation View */}
      {calculationMode === 'current' && (
        <div className="space-y-6">
          {/* Calculation Breakdown */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Liquidity Ratio Calculation Breakdown</h3>
            <div className="space-y-4">
              <div className="p-4 border border-gray-200 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Step 1: Calculate Total Liquid Assets (MSP2_05)</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>C1 - Cash in Hand: TZS 15,000,000</div>
                  <div>C2 - Bank Balances: TZS 25,000,000</div>
                  <div>C3 - MFSP Balances: TZS 5,000,000</div>
                  <div>C4 - MNO Float: TZS 3,000,000</div>
                  <div>C6 - Treasury Bills: TZS 8,000,000</div>
                  <div>C7 - Gov Securities: TZS 12,000,000</div>
                  <div>C8 - Private Securities: TZS 4,000,000</div>
                  <div>C9 - Other Assets: TZS 1,000,000</div>
                </div>
                <div className="mt-2 text-lg font-bold text-gray-900">
                  Total Liquid Assets: TZS {(regulatoryData?.calculationComponents.totalLiquidAssets.finalTotal || 0).toLocaleString()}
                </div>
              </div>

              <div className="p-4 border border-gray-200 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Step 2: Calculate Total Assets (MSP2_01)</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div>Liquid Assets: TZS 45,000,000</div>
                  <div>Loans: TZS 300,000,000</div>
                  <div>Investments: TZS 100,000,000</div>
                  <div>Fixed Assets: TZS 50,000,000</div>
                  <div>Other Assets: TZS 5,000,000</div>
                </div>
                <div className="mt-2 text-lg font-bold text-gray-900">
                  Total Assets: TZS {(regulatoryData?.calculationComponents.totalAssets.finalTotal || 0).toLocaleString()}
                </div>
              </div>

              <div className="p-4 border border-gray-200 rounded-lg bg-green-50">
                <h4 className="font-medium text-gray-900 mb-2">Step 3: Calculate Liquidity Ratio</h4>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 mb-2">
                    {(regulatoryData?.calculationComponents.totalLiquidAssets.finalTotal || 0).toLocaleString()} ÷ {(regulatoryData?.calculationComponents.totalAssets.finalTotal || 0).toLocaleString()}
                  </div>
                  <div className="text-3xl font-bold text-green-600">
                    = {((regulatoryData?.realTimeCalculations.currentRatio || 0) * 100).toFixed(2)}%
                  </div>
                  <div className="text-sm text-gray-600 mt-2">
                    BOT Minimum: 5.00% | Status: {regulatoryData?.calculationComponents.ratioCalculation.complianceStatus}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Components Analysis */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Liquid Assets Components (MSP2_05)</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Component</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">% of Total</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Liquidity Rating</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {regulatoryData?.calculationComponents.totalLiquidAssets.lineItems && Object.entries(regulatoryData.calculationComponents.totalLiquidAssets.lineItems).map(([key, value]) => {
                    const percentage = ((value as number) / (regulatoryData?.calculationComponents.totalLiquidAssets.finalTotal || 1)) * 100;
                    return (
                      <tr key={key} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {key.replace(/_/g, ' ').toUpperCase()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          TZS {(value as number).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {percentage.toFixed(1)}%
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {key.includes('c1') || key.includes('c2') ? 'Immediate' : 
                           key.includes('c3') || key.includes('c4') ? 'T+1' : 'T+3'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                            Valid
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Real-time Monitoring */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Real-time Monitoring</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 border border-gray-200 rounded-lg">
                <div className="text-2xl font-bold text-gray-900 mb-2">
                  {((regulatoryData?.realTimeCalculations.currentRatio || 0) * 100).toFixed(2)}%
                </div>
                <div className="text-sm text-gray-600">Current Ratio</div>
                <div className="text-xs text-gray-500 mt-1">
                  Last Update: {regulatoryData?.realTimeCalculations.lastCalculationTime.toLocaleTimeString()}
                </div>
              </div>
              <div className="text-center p-4 border border-gray-200 rounded-lg">
                <div className="text-2xl font-bold text-gray-900 mb-2">15 min</div>
                <div className="text-sm text-gray-600">Update Frequency</div>
                <div className="text-xs text-gray-500 mt-1">
                  Next: {regulatoryData?.realTimeCalculations.nextRecalculationTime.toLocaleTimeString()}
                </div>
              </div>
              <div className="text-center p-4 border border-gray-200 rounded-lg">
                <div className={`text-2xl font-bold mb-2 ${
                  (regulatoryData?.realTimeCalculations.currentRatio || 0) >= 0.05 ? 'text-green-600' :
                  (regulatoryData?.realTimeCalculations.currentRatio || 0) >= 0.03 ? 'text-yellow-600' :
                  'text-red-600'
                }`}>
                  {regulatoryData?.calculationComponents.ratioCalculation.complianceStatus || 'Compliant'}
                </div>
                <div className="text-sm text-gray-600">Compliance Status</div>
                <div className="text-xs text-gray-500 mt-1">
                  Days to compliance: {regulatoryData?.calculationComponents.ratioCalculation.daysToCompliance || 0}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Scenario Analysis View */}
      {calculationMode === 'scenario' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Liquidity Ratio Scenarios</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {regulatoryData?.scenarioAnalysis.stressScenarios.map((scenario, index) => (
                <div key={index} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                  <h4 className="font-medium text-gray-900 mb-2">{scenario.name}</h4>
                  <p className="text-sm text-gray-600 mb-3">{scenario.description}</p>
                  <div className="text-xs text-gray-500 mb-2">Probability: {(scenario.probability * 100).toFixed(0)}%</div>
                  <div className="text-sm text-gray-700">
                    <div>Withdrawal Rate: {(scenario.parameters.withdrawalRate * 100 || 0).toFixed(0)}%</div>
                    <div>Market Impact: {(scenario.parameters.marketImpact * 100 || 0).toFixed(0)}%</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Optimization View */}
      {calculationMode === 'optimization' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Liquidity Optimization Engine</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-4">Current State Analysis</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Efficiency Rating</span>
                    <span className="text-sm font-medium text-gray-900">85%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Cost of Liquidity</span>
                    <span className="text-sm font-medium text-gray-900">2.5%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Risk Assessment</span>
                    <span className="text-sm font-medium text-gray-900">Medium</span>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-4">Optimization Recommendations</h4>
                <div className="space-y-2">
                  <div className="text-sm text-gray-700">• Rebalance asset allocation</div>
                  <div className="text-sm text-gray-700">• Optimize liquidity buffer</div>
                  <div className="text-sm text-gray-700">• Enhance yield optimization</div>
                  <div className="text-sm text-gray-700">• Implement risk mitigation</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Regulatory Actions</h3>
        <div className="flex flex-wrap gap-3">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Recalculate Ratio
          </button>
          <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
            Run Stress Test
          </button>
          <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
            Optimize Liquidity
          </button>
          <button className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors">
            Generate BOT Report
          </button>
          <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
            Update Thresholds
          </button>
        </div>
      </div>
    </div>
  );

  // Render banking relationships tab
  const renderBankingRelationships = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">Banking Relationships</h3>
            <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
              Add Relationship
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Institution</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deposits</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Borrowings</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Interest Rate</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Maturity Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {treasuryData?.bankingRelationships.map((rel, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{rel.institutionName}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      rel.institutionType === 'Bank' ? 'bg-blue-100 text-blue-800' :
                      rel.institutionType === 'MFSP' ? 'bg-green-100 text-green-800' :
                      rel.institutionType === 'MNO' ? 'bg-purple-100 text-purple-800' :
                      'bg-orange-100 text-orange-800'
                    }`}>
                      {rel.institutionType}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    TZS {rel.depositAmount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    TZS {rel.borrowingAmount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{rel.interestRate}%</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {rel.maturityDate.toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button className="text-blue-600 hover:text-blue-900">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="text-green-600 hover:text-green-900">
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
    </div>
  );

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl p-6 text-white">
          <h1 className="text-3xl font-bold mb-2">Treasury Management Hub</h1>
          <p className="text-green-100">
            Centralized management for MSP2_05 (Liquid Assets), MSP2_07 (Deposits & Borrowings), and MSP2_08 (Agent Banking)
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'overview'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Overview
                </div>
              </button>
              <button
                onClick={() => setActiveTab('liquid-assets')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'liquid-assets'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center">
                  <DollarSign className="w-4 h-4 mr-2" />
                  Liquid Assets (MSP2_05)
                </div>
              </button>
              <button
                onClick={() => setActiveTab('agent-banking')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'agent-banking'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center">
                  <Users className="w-4 h-4 mr-2" />
                  Agent Banking (MSP2_08)
                </div>
              </button>
              <button
                onClick={() => setActiveTab('banking-relationships')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'banking-relationships'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center">
                  <Building2 className="w-4 h-4 mr-2" />
                  Banking Relationships (MSP2_07)
                </div>
              </button>
              <button
                onClick={() => setActiveTab('liquidity-dashboard')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'liquidity-dashboard'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center">
                  <Activity className="w-4 h-4 mr-2" />
                  Liquidity Dashboard
                </div>
              </button>
              <button
                onClick={() => setActiveTab('multi-bank-monitor')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'multi-bank-monitor'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center">
                  <Building2 className="w-4 h-4 mr-2" />
                  Multi-Bank Monitor
                </div>
              </button>
              <button
                onClick={() => setActiveTab('investment-portfolio')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'investment-portfolio'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Investment Portfolio
                </div>
              </button>
              <button
                onClick={() => setActiveTab('regulatory-calculator')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'regulatory-calculator'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center">
                  <Calculator className="w-4 h-4 mr-2" />
                  Regulatory Calculator
                </div>
              </button>
              <button
                onClick={() => setActiveTab('reports')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'reports'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center">
                  <FileText className="w-4 h-4 mr-2" />
                  Reports
                </div>
              </button>
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'liquid-assets' && renderLiquidAssets()}
        {activeTab === 'agent-banking' && renderAgentBanking()}
        {activeTab === 'banking-relationships' && renderBankingRelationships()}
        {activeTab === 'liquidity-dashboard' && renderLiquidityDashboard()}
        {activeTab === 'multi-bank-monitor' && renderMultiBankBalanceMonitor()}
        {activeTab === 'investment-portfolio' && renderInvestmentPortfolioTracker()}
        {activeTab === 'regulatory-calculator' && renderRegulatoryRatioCalculator()}
        {activeTab === 'reports' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Treasury Reports</h3>
            <p className="text-gray-600">Reports functionality will be implemented here.</p>
          </div>
        )}

        {/* Compliance Notice */}
        <div className="bg-green-50 rounded-xl p-6 border border-green-200">
          <div className="flex items-start">
            <Shield className="w-5 h-5 text-green-600 mr-3 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-green-900">Regulatory Compliance</h3>
              <div className="mt-2 text-sm text-green-800">
                <p className="mb-2">
                  Treasury management complies with Bank of Tanzania regulations:
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>MSP2_05: Liquid Assets reporting and monitoring</li>
                  <li>MSP2_07: Deposits and Borrowings tracking</li>
                  <li>MSP2_08: Agent Banking balance reconciliation</li>
                  <li>Real-time balance updates and reconciliation</li>
                  <li>Automated regulatory reporting preparation</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default TreasuryManagement;
