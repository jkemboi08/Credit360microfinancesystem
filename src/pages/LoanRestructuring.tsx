import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout';
import { useLanguage } from '../context/LanguageContext';
import RepaymentRestructuringService from '../services/repaymentRestructuringService';
import { supabase } from '../lib/supabaseClient';
import { LoanStatusMappingService } from '../services/loanStatusMappingService';
import { LoanSyncService } from '../utils/loanSyncService';
import {
  RefreshCw,
  Calculator,
  CheckCircle,
  Clock,
  FileText,
  TrendingUp,
  BarChart3,
  User,
  Calendar,
  Save,
  Send,
  Shield,
  Download,
  Printer,
  ExternalLink,
  X,
  Info,
  TrendingDown,
  Percent,
  Search,
  Activity
} from 'lucide-react';

interface Loan {
  id: string;
  clientName: string;
  clientId: string;
  phone: string;
  email?: string;
  originalAmount: number;
  currentBalance: number;
  interestRate: number;
  originalTenor: number;
  remainingTenor: number;
  monthlyPayment: number;
  lastPaymentDate: string;
  nextPaymentDate: string;
  daysPastDue: number;
  status: 'active' | 'past_due' | 'at_risk' | 'default';
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  restructuringCount: number;
  maxRestructuringAllowed: number;
  productType?: string;
  disbursementDate?: string;
  totalPaidToDate?: number;
  interestAccrued?: number;
  paymentPerformance?: number;
  creditScore?: number;
  debtToIncomeRatio?: number;
  loanPerformanceRating?: 'excellent' | 'good' | 'fair' | 'poor';
}

interface Client {
  id: string;
  name: string;
  phone: string;
  email?: string;
  riskRating: 'low' | 'medium' | 'high' | 'critical';
  lastPaymentDate: string;
  totalLoans: number;
  activeLoans: number;
  totalOutstanding: number;
}

interface PaymentHistory {
  month: string;
  status: 'on_time' | 'late' | 'missed';
  amount: number;
  dueDate: string;
  paidDate?: string;
}

interface RestructuringType {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  isAvailable: boolean;
}

interface SettlementCalculation {
  outstandingPrincipal: number;
  accruedInterest: number;
  prepaymentPenalty: number;
  totalSettlementAmount: number;
  penaltyStructure: {
    individual: number;
    group: number;
    sme: number;
    agricultural: number;
  };
  waiverConditions: {
    noMissedPayments24Months: boolean;
    loyalClient3Years: boolean;
    financialHardship: boolean;
  };
}

interface TopUpEligibility {
  paymentHistoryScore: number;
  currentDebtToIncomeRatio: number;
  creditBureauCheck: 'passed' | 'failed' | 'pending';
  maximumTopUpAmount: number;
  eligibilityCriteria: {
    min12MonthsHistory: boolean;
    noOverdue30Days: boolean;
    incomeVerificationUpToDate: boolean;
    loanPerformanceRating: string;
  };
}

interface TopUpCalculation {
  currentOutstanding: number;
  requestedTopUp: number;
  newTotalLoanAmount: number;
  pricingOptions: {
    blendedRate: {
      existingBalance: number;
      topUpAmount: number;
      newBlendedRate: number;
      newEMI: number;
    };
    separateFacility: {
      existingLoanEMI: number;
      newTopUpEMI: number;
      totalMonthlyPayment: number;
    };
    freshLoan: {
      settlementAmount: number;
      newLoanAmount: number;
      newEMI: number;
    };
  };
}

interface TermModification {
  current: {
    remainingTenure: number;
    monthlyEMI: number;
    totalInterest: number;
  };
  options: Array<{
    tenure: number;
    monthlyEMI: number;
    totalInterest: number;
    additionalCost: number;
  }>;
  extensionJustification: {
    reason: string;
    comments: string;
  };
  reductionOptions: Array<{
    paymentIncrease: number;
    newEMI: number;
    newTenure: number;
    interestSaved: number;
  }>;
}

interface RestructuringProposal {
  newTenor: number;
  newInterestRate: number;
  gracePeriod: number;
  newMonthlyPayment: number;
  totalInterestSavings: number;
  totalPaymentReduction: number;
  reason: string;
  justification: string;
}

interface RestructuringImpact {
  originalSchedule: any[];
  newSchedule: any[];
  impactAnalysis: {
    monthlyPaymentChange: number;
    totalInterestChange: number;
    totalPaymentChange: number;
    riskReduction: string;
  };
}

interface LoanRestructuring {
  id: string;
  loan_id: string;
  client_id: string;
  restructuring_type: string;
  original_terms: any;
  new_terms: any;
  reason: string;
  justification?: string;
  status: 'pending' | 'under_review' | 'approved' | 'rejected' | 'cancelled' | 'implemented';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  risk_assessment: 'low' | 'medium' | 'high' | 'critical';
  original_monthly_payment?: number;
  new_monthly_payment?: number;
  payment_reduction_amount?: number;
  term_extension_months?: number;
  interest_rate_adjustment?: number;
  total_interest_savings?: number;
  total_interest_increase?: number;
  submitted_at: string;
  submitted_by?: string;
  reviewed_at?: string;
  reviewed_by?: string;
  approved_at?: string;
  approved_by?: string;
  rejected_at?: string;
  rejected_by?: string;
  rejection_reason?: string;
  effective_date?: string;
  implemented_at?: string;
  implemented_by?: string;
  restructuring_count: number;
  max_restructuring_allowed: number;
  created_at: string;
  updated_at: string;
  // Joined data
  client_name?: string;
  phone_number?: string;
  email_address?: string;
  client_risk_level?: string;
  credit_score?: number;
  product_name?: string;
  principal_amount?: number;
  current_balance?: number;
  outstanding_balance?: number;
  current_interest_rate?: number;
  current_tenor_months?: number;
  current_monthly_payment?: number;
  loan_status?: string;
  days_past_due?: number;
  loan_risk_rating?: string;
  disbursement_date?: string;
  maturity_date?: string;
  next_payment_due?: string;
  total_paid?: number;
  late_payments_count?: number;
  on_time_payments_count?: number;
}

const LoanRestructuring: React.FC = () => {
  const { language } = useLanguage();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showRestructuringModal, setShowRestructuringModal] = useState(false);
  const [showImpactModal, setShowImpactModal] = useState(false);
  const [proposal, setProposal] = useState<RestructuringProposal>({
    newTenor: 0,
    newInterestRate: 0,
    gracePeriod: 0,
    newMonthlyPayment: 0,
    totalInterestSavings: 0,
    totalPaymentReduction: 0,
    reason: '',
    justification: ''
  });
  const [impact, setImpact] = useState<RestructuringImpact | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingLoans, setIsLoadingLoans] = useState(false);
  
  // Enhanced state for new functionality
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([]);
  const [activeRestructuringTab, setActiveRestructuringTab] = useState('early_settlement');
  const [settlementCalculation, setSettlementCalculation] = useState<SettlementCalculation | null>(null);
  const [topUpEligibility, setTopUpEligibility] = useState<TopUpEligibility | null>(null);
  const [topUpCalculation] = useState<TopUpCalculation | null>(null);
  const [termModification, setTermModification] = useState<TermModification | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Loan restructuring data state
  const [restructuringData, setRestructuringData] = useState<LoanRestructuring[]>([]);
  const [isLoadingRestructuring, setIsLoadingRestructuring] = useState(false);
  const [selectedRestructuring, setSelectedRestructuring] = useState<LoanRestructuring | null>(null);
  
  // Client data for mapping
  const [clientsData, setClientsData] = useState<{[key: string]: any}>({});
  const [filterProductType, setFilterProductType] = useState('all');
  const [filterPaymentStatus, setFilterPaymentStatus] = useState('all');

  // Restructuring types configuration
  const restructuringTypes: RestructuringType[] = [
    {
      id: 'early_settlement',
      name: language === 'en' ? 'Early Settlement' : 'Malipo ya Mapema',
      description: language === 'en' ? 'Close loan before maturity' : 'Funga mkopo kabla ya muda',
      icon: <CheckCircle className="w-5 h-5" />,
      isAvailable: true
    },
    {
      id: 'loan_topup',
      name: language === 'en' ? 'Loan Top-Up' : 'Kuongeza Mkopo',
      description: language === 'en' ? 'Increase existing loan amount' : 'Ongeza kiasi cha mkopo',
      icon: <TrendingUp className="w-5 h-5" />,
      isAvailable: true
    },
    {
      id: 'term_extension',
      name: language === 'en' ? 'Term Extension' : 'Kuongeza Muda',
      description: language === 'en' ? 'Reduce EMI by extending period' : 'Punguza EMI kwa kuongeza muda',
      icon: <Clock className="w-5 h-5" />,
      isAvailable: true
    },
    {
      id: 'term_reduction',
      name: language === 'en' ? 'Term Reduction' : 'Kupunguza Muda',
      description: language === 'en' ? 'Increase EMI to finish early' : 'Ongeza EMI ili kumaliza mapema',
      icon: <TrendingDown className="w-5 h-5" />,
      isAvailable: true
    },
    {
      id: 'rate_adjustment',
      name: language === 'en' ? 'Rate Adjustment' : 'Marekebisho ya Kiwango',
      description: language === 'en' ? 'Modify interest rate' : 'Rekebisha kiwango cha riba',
      icon: <Percent className="w-5 h-5" />,
      isAvailable: true
    }
  ];

  // Load clients data first
  useEffect(() => {
    loadClients();
  }, []);

  // Load loans and restructuring when clients data is available
  useEffect(() => {
    if (Object.keys(clientsData).length > 0) {
    loadLoans();
    loadRestructuringRequests();
    }
  }, [clientsData]);
    
    // Set up real-time updates
  useEffect(() => {
    RepaymentRestructuringService.subscribeToRestructuring((payload) => {
      console.log('Restructuring update received:', payload);
      loadRestructuringRequests();
    });

    RepaymentRestructuringService.subscribeToApprovals((payload) => {
      console.log('Approval update received:', payload);
      loadRestructuringRequests();
    });

    return () => {
      // Cleanup subscriptions
    };
  }, []);

  // Load clients data for mapping
  const loadClients = async () => {
    try {
      console.log('🔍 Loading clients data...');
      const { data, error } = await supabase
        .from('clients')
        .select('id, full_name, phone_number, email_address, risk_level, credit_score');

      if (error) {
        console.error('❌ Error loading clients:', error);
        return;
      }

      // Create a map for easy lookup
      const clientsMap: {[key: string]: any} = {};
      data?.forEach(client => {
        clientsMap[client.id] = client;
      });

      setClientsData(clientsMap);
      console.log('✅ Successfully loaded clients:', data?.length || 0);
    } catch (error) {
      console.error('Error loading clients:', error);
    }
  };

  // Load loans from database
  const loadLoans = async () => {
    try {
      setIsLoadingLoans(true);
      console.log('🔍 Loading loans with sync service...');
      
      // First, ensure data is synced
      console.log('🔄 Syncing disbursed loans to monitoring table...');
      const syncResult = await LoanSyncService.syncAllDisbursedLoans();
      if (syncResult.success) {
        console.log(`✅ Sync completed: ${syncResult.synced} loans synced`);
      } else {
        console.warn('⚠️ Sync had issues:', syncResult.errors);
      }
      
      // Get correct status values for active loans
      const activeStatuses = LoanStatusMappingService.getActiveLoanStatuses();
      
      let { data: loansData, error: loansError } = await supabase
        .from('loans')
        .select('*')
        .in('status', activeStatuses.loans)
        .order('created_at', { ascending: false });

      if (loansError) {
        console.error('❌ Error loading loans:', loansError);
        console.error('❌ Error details:', {
          message: loansError.message,
          details: loansError.details,
          hint: loansError.hint,
          code: loansError.code
        });
        return;
      }

      console.log('✅ Successfully loaded loans from database');
      console.log('📊 Raw loans data:', loansData);

      // Transform data to match component expectations
      const transformedLoans: Loan[] = loansData?.map((loan: any) => {
        const daysPastDue = loan.days_past_due || 0;
        const nextPaymentDate = loan.next_payment_due || loan.next_payment_date;

        // Use actual database status, but map to our interface
        let status: 'active' | 'past_due' | 'at_risk' | 'default' = 'active';
        let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';

        // Map database status to our interface
        if (loan.status === 'overdue') {
          status = 'past_due';
          riskLevel = 'high';
        } else if (loan.status === 'active') {
          // For active loans, determine risk based on days past due
        if (daysPastDue >= 90) {
          status = 'default';
          riskLevel = 'critical';
        } else if (daysPastDue >= 30) {
          status = 'past_due';
          riskLevel = 'high';
        } else if (daysPastDue >= 7) {
          status = 'at_risk';
          riskLevel = 'medium';
          } else {
            status = 'active';
            riskLevel = 'low';
          }
        } else {
          // For any other status, default to active (shouldn't happen due to filtering)
          status = 'active';
          riskLevel = 'low';
        }

        // Calculate additional fields using actual database fields
        const totalPaidToDate = loan.total_paid || 0;
        const currentBalance = loan.current_balance || loan.outstanding_balance || 0;
        const interestAccrued = loan.interest_paid || 0;
        const paymentPerformance = Math.max(0, 100 - (daysPastDue * 2)); // Simplified calculation

        // Get client data from our clients map
        const client = clientsData[loan.client_id] || {};

        return {
          id: loan.id.toString(),
          clientName: client.full_name || `Client ${loan.client_id?.substring(0, 8) || 'Unknown'}`,
          clientId: loan.client_id?.toString() || 'unknown',
          phone: client.phone_number || 'N/A',
          email: client.email_address || 'N/A',
          originalAmount: loan.principal_amount || loan.loan_amount || 0,
          currentBalance: currentBalance,
          interestRate: loan.interest_rate || 12.5,
          originalTenor: loan.tenor_months || 12,
          remainingTenor: Math.max(0, (loan.tenor_months || 12) - Math.floor((new Date().getTime() - new Date(loan.disbursement_date).getTime()) / (1000 * 60 * 60 * 24 * 30))),
          monthlyPayment: loan.monthly_payment || (loan.loan_amount / (loan.tenor_months || 12)),
          lastPaymentDate: loan.last_payment_date || loan.disbursement_date,
          nextPaymentDate: nextPaymentDate,
          daysPastDue,
          status,
          riskLevel: loan.risk_rating || riskLevel,
          restructuringCount: 0, // Would need to be calculated from restructuring table
          maxRestructuringAllowed: 3,
          productType: `Product ${loan.loan_product_id?.substring(0, 8) || 'Standard'}`,
          disbursementDate: loan.disbursement_date,
          totalPaidToDate,
          interestAccrued,
          paymentPerformance,
          creditScore: 650, // Default value
          debtToIncomeRatio: 0.3, // Would need to be calculated from financial data
          loanPerformanceRating: paymentPerformance >= 90 ? 'excellent' : 
                                paymentPerformance >= 75 ? 'good' : 
                                paymentPerformance >= 50 ? 'fair' : 'poor'
        };
      }) || [];

      console.log('🔍 Debug - Raw loans data from database:', loansData);
      console.log('🔍 Debug - Transformed loans:', transformedLoans);
      console.log('🔍 Debug - Number of loans loaded:', transformedLoans.length);

      setLoans(transformedLoans);
    } catch (error) {
      console.error('Error loading loans:', error);
    } finally {
      setIsLoadingLoans(false);
    }
  };

  // Load client loans for selected client (currently unused but available for future use)
  /*
  const loadClientLoans = async (clientId: string) => {
    try {
      const clientLoans = loans.filter(loan => loan.clientId === clientId);
      
      // Load client information
      const client = clientLoans[0];
      if (client) {
        setSelectedClient({
          id: client.clientId,
          name: client.clientName,
          phone: client.phone,
          email: client.email,
          riskRating: client.riskLevel,
          lastPaymentDate: client.lastPaymentDate,
          totalLoans: clientLoans.length,
          activeLoans: clientLoans.filter(l => l.status === 'active').length,
          totalOutstanding: clientLoans.reduce((sum, l) => sum + l.currentBalance, 0)
        });
      }
    } catch (error) {
      console.error('Error loading client loans:', error);
    }
  };
  */

  // Load payment history for selected loan
  const loadPaymentHistory = async (loanId: string) => {
    try {
      // Skip payment history for now to avoid database errors
      console.log('⏭️ Skipping payment history to avoid database errors');
      setPaymentHistory([]);
        return;
    } catch (error) {
      console.error('Error loading payment history:', error);
    }
  };

  // Load restructuring requests from loan_restructuring table
  const loadRestructuringRequests = useCallback(async () => {
    try {
      setIsLoadingRestructuring(true);
      console.log('🔍 Loading restructuring requests from database...');
      
      // First try a simple query without complex joins
      let { data, error } = await supabase
        .from('loan_restructuring')
        .select('*')
        .order('submitted_at', { ascending: false });

      // If that fails, try an even simpler approach
      if (error) {
        console.log('⚠️ Complex query failed, trying simple query...', error);
        const simpleQuery = await supabase
          .from('loan_restructuring')
          .select('*')
          .limit(10);
        
        data = simpleQuery.data;
        error = simpleQuery.error;
      }

      if (error) {
        console.error('❌ Error loading restructuring requests:', error);
        return;
      }

      console.log('✅ Successfully loaded restructuring requests:', data?.length || 0);
      
      // Transform the data to match our interface
      const transformedData: LoanRestructuring[] = data?.map((item: any) => ({
        id: item.id,
        loan_id: item.loan_id,
        client_id: item.client_id,
        restructuring_type: item.restructuring_type,
        original_terms: item.original_terms,
        new_terms: item.new_terms,
        reason: item.reason,
        justification: item.justification,
        status: item.status,
        priority: item.priority,
        risk_assessment: item.risk_assessment,
        original_monthly_payment: item.original_monthly_payment,
        new_monthly_payment: item.new_monthly_payment,
        payment_reduction_amount: item.payment_reduction_amount,
        term_extension_months: item.term_extension_months,
        interest_rate_adjustment: item.interest_rate_adjustment,
        total_interest_savings: item.total_interest_savings,
        total_interest_increase: item.total_interest_increase,
        submitted_at: item.submitted_at,
        submitted_by: item.submitted_by,
        reviewed_at: item.reviewed_at,
        reviewed_by: item.reviewed_by,
        approved_at: item.approved_at,
        approved_by: item.approved_by,
        rejected_at: item.rejected_at,
        rejected_by: item.rejected_by,
        rejection_reason: item.rejection_reason,
        effective_date: item.effective_date,
        implemented_at: item.implemented_at,
        implemented_by: item.implemented_by,
        restructuring_count: item.restructuring_count,
        max_restructuring_allowed: item.max_restructuring_allowed,
        created_at: item.created_at,
        updated_at: item.updated_at,
        // Get client data from our clients map
        client_name: (() => {
          const client = clientsData[item.client_id] || {};
          return client.full_name || `Client ${item.client_id?.substring(0, 8) || 'Unknown'}`;
        })(),
        phone_number: (() => {
          const client = clientsData[item.client_id] || {};
          return client.phone_number || 'N/A';
        })(),
        email_address: (() => {
          const client = clientsData[item.client_id] || {};
          return client.email_address || 'N/A';
        })(),
        client_risk_level: (() => {
          const client = clientsData[item.client_id] || {};
          return client.risk_level || 'low';
        })(),
        credit_score: (() => {
          const client = clientsData[item.client_id] || {};
          return client.credit_score || 650;
        })(),
        product_name: 'Standard Loan',
        principal_amount: 0,
        current_balance: 0,
        outstanding_balance: 0,
        current_interest_rate: 12.5,
        current_tenor_months: 12,
        current_monthly_payment: 0,
        loan_status: 'active', // This is for restructuring requests, not actual loan status
        days_past_due: 0,
        loan_risk_rating: 'low',
        disbursement_date: new Date().toISOString().split('T')[0],
        maturity_date: new Date().toISOString().split('T')[0],
        next_payment_due: new Date().toISOString().split('T')[0],
        total_paid: 0,
        late_payments_count: 0,
        on_time_payments_count: 0,
      })) || [];

      setRestructuringData(transformedData);
      console.log('📊 Transformed restructuring data:', transformedData.length, 'records');
      
    } catch (error) {
      console.error('Error loading restructuring requests:', error);
    } finally {
      setIsLoadingRestructuring(false);
    }
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'past_due': return 'bg-yellow-100 text-yellow-800';
      case 'at_risk': return 'bg-orange-100 text-orange-800';
      case 'default': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Calculate settlement amount
  const calculateSettlement = (loan: Loan) => {
    const outstandingPrincipal = loan.currentBalance;
    const accruedInterest = loan.interestAccrued || 0;
    
    // Calculate penalty based on product type
    let penaltyRate = 0.02; // Default 2%
    if (loan.productType?.toLowerCase().includes('group')) {
      penaltyRate = 0.01; // 1% for group loans
    } else if (loan.productType?.toLowerCase().includes('sme')) {
      penaltyRate = 0.03; // 3% for SME loans
    } else if (loan.productType?.toLowerCase().includes('agricultural')) {
      penaltyRate = 0.015; // 1.5% for agricultural loans
    }
    
    const prepaymentPenalty = outstandingPrincipal * penaltyRate;
    const totalSettlementAmount = outstandingPrincipal + accruedInterest + prepaymentPenalty;
    
    // Check waiver conditions
    const noMissedPayments24Months = loan.paymentPerformance && loan.paymentPerformance >= 95;
    const loyalClient3Years = loan.originalTenor >= 36; // Simplified check
    const financialHardship = loan.riskLevel === 'high' || loan.riskLevel === 'critical';
    
    const settlement: SettlementCalculation = {
      outstandingPrincipal,
      accruedInterest,
      prepaymentPenalty,
      totalSettlementAmount,
      penaltyStructure: {
        individual: 0.02,
        group: 0.01,
        sme: 0.03,
        agricultural: 0.015
      },
      waiverConditions: {
        noMissedPayments24Months: !!noMissedPayments24Months,
        loyalClient3Years: !!loyalClient3Years,
        financialHardship: !!financialHardship
      }
    };
    
    setSettlementCalculation(settlement);
  };

  // Calculate top-up eligibility
  const calculateTopUpEligibility = (loan: Loan) => {
    const paymentHistoryScore = loan.paymentPerformance || 0;
    const currentDebtToIncomeRatio = loan.debtToIncomeRatio || 0.3;
    const creditBureauCheck = loan.creditScore && loan.creditScore >= 600 ? 'passed' : 'failed';
    
    // Calculate maximum top-up amount (simplified)
    const maximumTopUpAmount = loan.originalAmount * 0.5; // 50% of original amount
    
    const eligibility: TopUpEligibility = {
      paymentHistoryScore,
      currentDebtToIncomeRatio,
      creditBureauCheck: creditBureauCheck as 'passed' | 'failed' | 'pending',
      maximumTopUpAmount,
      eligibilityCriteria: {
        min12MonthsHistory: loan.originalTenor >= 12,
        noOverdue30Days: loan.daysPastDue < 30,
        incomeVerificationUpToDate: true, // Would need to check actual data
        loanPerformanceRating: loan.loanPerformanceRating || 'fair'
      }
    };
    
    setTopUpEligibility(eligibility);
  };

  // Calculate top-up options (currently unused but available for future use)
  /*
  const calculateTopUpOptions = (loan: Loan, requestedTopUp: number) => {
    const currentOutstanding = loan.currentBalance;
    const newTotalLoanAmount = currentOutstanding + requestedTopUp;
    
    // Blended rate calculation
    const existingRate = loan.interestRate;
    const topUpRate = existingRate + 1; // 1% higher for top-up
    const blendedRate = ((currentOutstanding * existingRate) + (requestedTopUp * topUpRate)) / newTotalLoanAmount;
    const newEMI = (newTotalLoanAmount * blendedRate / 100) / 12;
    
    // Separate facility calculation
    const existingEMI = loan.monthlyPayment;
    const topUpEMI = (requestedTopUp * topUpRate / 100) / 12;
    const totalMonthlyPayment = existingEMI + topUpEMI;
    
    // Fresh loan calculation
    const settlementAmount = currentOutstanding + (loan.interestAccrued || 0);
    const freshLoanAmount = newTotalLoanAmount;
    const freshEMI = (freshLoanAmount * existingRate / 100) / 12;
    
    const calculation: TopUpCalculation = {
      currentOutstanding,
      requestedTopUp,
      newTotalLoanAmount,
      pricingOptions: {
        blendedRate: {
          existingBalance: currentOutstanding,
          topUpAmount: requestedTopUp,
          newBlendedRate: blendedRate,
          newEMI
        },
        separateFacility: {
          existingLoanEMI: existingEMI,
          newTopUpEMI: topUpEMI,
          totalMonthlyPayment
        },
        freshLoan: {
          settlementAmount,
          newLoanAmount: freshLoanAmount,
          newEMI: freshEMI
        }
      }
    };
    
    setTopUpCalculation(calculation);
  };
  */

  // Calculate term modification options
  const calculateTermModification = (loan: Loan) => {
    const current = {
      remainingTenure: loan.remainingTenor,
      monthlyEMI: loan.monthlyPayment,
      totalInterest: (loan.monthlyPayment * loan.remainingTenor) - loan.currentBalance
    };
    
    // Extension options
    const options = [
      { tenure: loan.remainingTenor + 12, monthlyEMI: 0, totalInterest: 0, additionalCost: 0 },
      { tenure: loan.remainingTenor + 24, monthlyEMI: 0, totalInterest: 0, additionalCost: 0 },
      { tenure: loan.remainingTenor + 36, monthlyEMI: 0, totalInterest: 0, additionalCost: 0 }
    ];
    
    // Calculate EMI for each option
    options.forEach(option => {
      const monthlyRate = loan.interestRate / 100 / 12;
      option.monthlyEMI = (loan.currentBalance * monthlyRate * Math.pow(1 + monthlyRate, option.tenure)) / 
                         (Math.pow(1 + monthlyRate, option.tenure) - 1);
      option.totalInterest = (option.monthlyEMI * option.tenure) - loan.currentBalance;
      option.additionalCost = option.totalInterest - current.totalInterest;
    });
    
    // Reduction options
    const reductionOptions = [
      { paymentIncrease: 20, newEMI: 0, newTenure: 0, interestSaved: 0 },
      { paymentIncrease: 30, newEMI: 0, newTenure: 0, interestSaved: 0 },
      { paymentIncrease: 50, newEMI: 0, newTenure: 0, interestSaved: 0 }
    ];
    
    // Calculate reduction options
    reductionOptions.forEach(option => {
      option.newEMI = loan.monthlyPayment * (1 + option.paymentIncrease / 100);
      const monthlyRate = loan.interestRate / 100 / 12;
      option.newTenure = Math.ceil(Math.log(1 + (loan.currentBalance * monthlyRate) / option.newEMI) / Math.log(1 + monthlyRate));
      const newTotalInterest = (option.newEMI * option.newTenure) - loan.currentBalance;
      option.interestSaved = current.totalInterest - newTotalInterest;
    });
    
    const modification: TermModification = {
      current,
      options,
      extensionJustification: {
        reason: '',
        comments: ''
      },
      reductionOptions
    };
    
    setTermModification(modification);
  };

  const calculateRestructuringImpact = (loan: Loan, proposal: RestructuringProposal): RestructuringImpact => {
    const originalMonthlyRate = loan.interestRate / 100 / 12;
    const newMonthlyRate = proposal.newInterestRate / 100 / 12;
    
    // Calculate original remaining payments
    const originalRemainingPayments = loan.remainingTenor;
    const originalMonthlyPayment = loan.monthlyPayment;
    
    // Calculate new monthly payment
    const newTenor = proposal.newTenor;
    const newMonthlyPayment = (loan.currentBalance * newMonthlyRate * Math.pow(1 + newMonthlyRate, newTenor)) / 
                             (Math.pow(1 + newMonthlyRate, newTenor) - 1);
    
    // Calculate total interest for original vs new
    const originalTotalInterest = originalMonthlyPayment * originalRemainingPayments - loan.currentBalance;
    const newTotalInterest = newMonthlyPayment * newTenor - loan.currentBalance;
    
    const impact: RestructuringImpact = {
      originalSchedule: [],
      newSchedule: [],
      impactAnalysis: {
        monthlyPaymentChange: newMonthlyPayment - originalMonthlyPayment,
        totalInterestChange: newTotalInterest - originalTotalInterest,
        totalPaymentChange: (newMonthlyPayment * newTenor) - (originalMonthlyPayment * originalRemainingPayments),
        riskReduction: proposal.newMonthlyPayment < originalMonthlyPayment ? 'High' : 'Low'
      }
    };

    // Generate original schedule
    let balance = loan.currentBalance;
    for (let i = 1; i <= originalRemainingPayments; i++) {
      const interest = balance * originalMonthlyRate;
      const principal = originalMonthlyPayment - interest;
      balance -= principal;
      
      impact.originalSchedule.push({
        payment: i,
        principal,
        interest,
        total: originalMonthlyPayment,
        balance: Math.max(0, balance)
      });
    }

    // Generate new schedule
    balance = loan.currentBalance;
    for (let i = 1; i <= newTenor; i++) {
      const interest = balance * newMonthlyRate;
      const principal = newMonthlyPayment - interest;
      balance -= principal;
      
      impact.newSchedule.push({
        payment: i,
        principal,
        interest,
        total: newMonthlyPayment,
        balance: Math.max(0, balance)
      });
    }

    return impact;
  };

  // Legacy function - keeping for compatibility
  // const handleInitiateRestructuring = (loan: Loan) => {
  //   setSelectedLoan(loan);
  //   setProposal({
  //     newTenor: loan.remainingTenor + 3, // Default to 3 months extension
  //     newInterestRate: loan.interestRate,
  //     gracePeriod: 0,
  //     newMonthlyPayment: 0,
  //     totalInterestSavings: 0,
  //     totalPaymentReduction: 0,
  //     reason: '',
  //     justification: ''
  //   });
  //   setShowRestructuringModal(true);
  // };

  // const handleSelectClient = (clientId: string) => {
  //   loadClientLoans(clientId);
  // };

  const handleSelectLoan = (loan: Loan) => {
    setSelectedLoan(loan);
    loadPaymentHistory(loan.id);
    
    // Calculate appropriate restructuring options based on tab
    if (activeRestructuringTab === 'early_settlement') {
      calculateSettlement(loan);
    } else if (activeRestructuringTab === 'loan_topup') {
      calculateTopUpEligibility(loan);
    } else if (activeRestructuringTab === 'term_extension' || activeRestructuringTab === 'term_reduction') {
      calculateTermModification(loan);
    }
  };

  const handleSaveDraft = () => {
    // Save current proposal as draft
    console.log('Saving draft...');
  };

  const handleGenerateReport = () => {
    // Generate restructuring report
    console.log('Generating report for:', selectedLoan);
  };

  const handlePrintApplication = () => {
    // Print restructuring application
    window.print();
  };

  const handleTabChange = (tabId: string) => {
    setActiveRestructuringTab(tabId);
    if (selectedLoan) {
      if (tabId === 'early_settlement') {
        calculateSettlement(selectedLoan);
      } else if (tabId === 'loan_topup') {
        calculateTopUpEligibility(selectedLoan);
      } else if (tabId === 'term_extension' || tabId === 'term_reduction') {
        calculateTermModification(selectedLoan);
      }
    }
  };

  // Filter loans based on search and filters
  const filteredLoans = loans.filter(loan => {
    const matchesSearch = loan.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         loan.id.includes(searchTerm) ||
                         loan.clientId.includes(searchTerm);
    const matchesProductType = filterProductType === 'all' || 
                              loan.productType?.toLowerCase().includes(filterProductType.toLowerCase());
    const matchesPaymentStatus = filterPaymentStatus === 'all' || loan.status === filterPaymentStatus;
    
    return matchesSearch && matchesProductType && matchesPaymentStatus;
  });

  const handleCalculateImpact = async () => {
    if (!selectedLoan) return;
    
    setIsCalculating(true);
    
    try {
      // Calculate restructuring impact using Supabase function
      const { data: impactData, error: impactError } = await RepaymentRestructuringService.calculateRestructuringImpact(
        selectedLoan.currentBalance,
        selectedLoan.interestRate,
        selectedLoan.remainingTenor,
        proposal.newInterestRate,
        proposal.newTenor,
        proposal.gracePeriod
      );

      if (impactError) {
        alert(`Error calculating impact: ${impactError}`);
        return;
      }

      if (!impactData) {
        alert('Unable to calculate restructuring impact');
        return;
      }

      const updatedProposal = {
        ...proposal,
        newMonthlyPayment: impactData.new_monthly_payment,
        totalInterestSavings: impactData.total_interest_savings,
        totalPaymentReduction: impactData.total_payment_reduction,
        // newTotalAmount: impactData.new_total_amount
      };
      
      setProposal(updatedProposal);
      
      const impactAnalysis = calculateRestructuringImpact(selectedLoan, updatedProposal);
      setImpact(impactAnalysis);
      
    } catch (error) {
      console.error('Error calculating impact:', error);
      alert('Error calculating restructuring impact. Please try again.');
    } finally {
      setIsCalculating(false);
    }
  };

  const handleSubmitProposal = async () => {
    if (!selectedLoan || !impact) return;
    
    setIsSubmitting(true);
    
    try {
      // Create restructuring request
      const { data, error } = await RepaymentRestructuringService.createRestructuringRequest({
        loan_id: parseInt(selectedLoan.id),
        client_id: parseInt(selectedLoan.clientId),
        original_tenor: selectedLoan.originalTenor,
        original_interest_rate: selectedLoan.interestRate,
        original_monthly_payment: selectedLoan.monthlyPayment,
        original_principal_balance: selectedLoan.currentBalance,
        new_tenor: proposal.newTenor,
        new_interest_rate: proposal.newInterestRate,
        new_monthly_payment: proposal.newMonthlyPayment,
        grace_period: proposal.gracePeriod,
        total_interest_savings: proposal.totalInterestSavings,
        total_payment_reduction: proposal.totalPaymentReduction,
        new_total_amount: 0, // proposal.newTotalAmount,
        reason: proposal.reason,
        justification: proposal.justification,
        client_consent: true,
        priority: 'medium'
      });

      if (error) {
        alert(`Error creating restructuring request: ${error}`);
        return;
      }

      // Create approval instance
      const { data: workflows } = await RepaymentRestructuringService.getApprovalWorkflows('restructuring');
      if (workflows && workflows?.length > 0) {
        await RepaymentRestructuringService.createApprovalInstance(
          workflows[0].id,
          'restructuring',
          data?.id || '',
          'medium'
        );
      }

      alert(`Restructuring proposal submitted for ${selectedLoan.clientName}. Awaiting manager approval.`);
      setShowRestructuringModal(false);
      
      // Reload data
      await loadRestructuringRequests();
      
    } catch (error) {
      console.error('Error submitting proposal:', error);
      alert('Error submitting proposal. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // const handleViewImpact = (loan: Loan) => {
  //   setSelectedLoan(loan);
  //   setShowImpactModal(true);
  // };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-600 to-red-600 rounded-xl p-6 text-white">
          <div className="flex justify-between items-start">
            <div>
          <h1 className="text-3xl font-bold mb-2">
                {language === 'en' ? 'Enhanced Loan Restructuring' : 'Urekebishaji wa Mikopo wa Kina'}
          </h1>
          <p className="text-orange-100">
            {language === 'en' 
                  ? 'Comprehensive loan restructuring with real-time calculations and client context'
                  : 'Urekebishaji wa kina wa mikopo na mahesabu ya wakati halisi na muktadha wa mteja'
            }
          </p>
        </div>

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <button
                onClick={handleSaveDraft}
                className="px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors flex items-center"
              >
                <Save className="w-4 h-4 mr-2" />
                {language === 'en' ? 'Save Draft' : 'Hifadhi Rasimu'}
              </button>
              <button
                onClick={handleGenerateReport}
                className="px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors flex items-center"
              >
                <FileText className="w-4 h-4 mr-2" />
                {language === 'en' ? 'Generate Report' : 'Tengeneza Ripoti'}
              </button>
              <button
                onClick={handlePrintApplication}
                className="px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors flex items-center"
              >
                <Printer className="w-4 h-4 mr-2" />
                {language === 'en' ? 'Print Application' : 'Chapisha Maombi'}
              </button>
            </div>
          </div>
        </div>

        {/* Client Context Panel */}
        {selectedClient && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex justify-between items-start">
              <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <User className="w-5 h-5 mr-2 text-blue-600" />
                  {language === 'en' ? 'Client Context' : 'Muktadha wa Mteja'}
          </h3>
          
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="text-sm text-blue-600 mb-1">
                      {language === 'en' ? 'Client ID & Name' : 'Kitambulisho na Jina'}
              </div>
                    <div className="font-semibold text-gray-900">{selectedClient.id}</div>
                    <div className="text-sm text-gray-600">{selectedClient.name}</div>
            </div>
                  
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="text-sm text-green-600 mb-1">
                      {language === 'en' ? 'Current Loan Details' : 'Maelezo ya Mkopo wa Sasa'}
              </div>
                    <div className="font-semibold text-gray-900">
                      {formatCurrency(selectedClient.totalOutstanding)}
            </div>
                    <div className="text-sm text-gray-600">
                      {selectedClient.activeLoans} {language === 'en' ? 'active loans' : 'mikopo hai'}
              </div>
            </div>
                  
                  <div className="bg-yellow-50 rounded-lg p-4">
                    <div className="text-sm text-yellow-600 mb-1">
                      {language === 'en' ? 'Risk Rating' : 'Kiwango cha Hatari'}
              </div>
                    <div className={`font-semibold px-2 py-1 rounded text-xs ${getRiskLevelColor(selectedClient.riskRating)}`}>
                      {selectedClient.riskRating.toUpperCase()}
            </div>
                    <div className="text-sm text-gray-600">
                      {language === 'en' ? 'Last Payment' : 'Malipo ya Mwisho'}: {selectedClient.lastPaymentDate}
          </div>
        </div>

                  <div className="bg-purple-50 rounded-lg p-4">
                    <div className="text-sm text-purple-600 mb-1">
                      {language === 'en' ? 'Quick Links' : 'Viungo vya Haraka'}
                    </div>
                    <div className="space-y-1">
                      <button className="text-xs text-purple-600 hover:text-purple-800 flex items-center">
                        <ExternalLink className="w-3 h-3 mr-1" />
                        {language === 'en' ? 'View Full Profile' : 'Ona Profaili Kamili'}
                      </button>
                      <button className="text-xs text-purple-600 hover:text-purple-800 flex items-center">
                        <BarChart3 className="w-3 h-3 mr-1" />
                        {language === 'en' ? 'Loan History' : 'Historia ya Mikopo'}
                      </button>
                      <button className="text-xs text-purple-600 hover:text-purple-800 flex items-center">
                        <Calendar className="w-3 h-3 mr-1" />
                        {language === 'en' ? 'Payment Schedule' : 'Ratiba ya Malipo'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              <button
                onClick={() => setSelectedClient(null)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* RESTRUCTURING DATA SECTION */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Activity className="w-5 h-5 mr-2 text-green-600" />
              {language === 'en' ? 'Loan Restructuring Requests' : 'Maombi ya Marekebisho ya Mikopo'}
            </h3>
            <div className="text-sm text-gray-500">
              {isLoadingRestructuring ? (
                <span className="text-blue-600">Loading...</span>
              ) : (
                <span>📊 {restructuringData.length} requests from database</span>
              )}
            </div>
          </div>

          {isLoadingRestructuring ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
              <p className="text-gray-500 mt-2">Loading restructuring data...</p>
            </div>
          ) : restructuringData.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {language === 'en' ? 'Client' : 'Mteja'}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {language === 'en' ? 'Type' : 'Aina'}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {language === 'en' ? 'Status' : 'Hali'}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {language === 'en' ? 'Priority' : 'Kipaumbele'}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {language === 'en' ? 'Amount' : 'Kiasi'}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {language === 'en' ? 'Submitted' : 'Iliwasilishwa'}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {language === 'en' ? 'Actions' : 'Vitendo'}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {restructuringData.map((restructuring) => (
                    <tr key={restructuring.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {restructuring.client_name || 'Unknown Client'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {restructuring.phone_number || 'N/A'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {restructuring.restructuring_type.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          restructuring.status === 'approved' ? 'bg-green-100 text-green-800' :
                          restructuring.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          restructuring.status === 'rejected' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {restructuring.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          restructuring.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                          restructuring.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                          restructuring.priority === 'normal' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {restructuring.priority.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {restructuring.current_balance ? new Intl.NumberFormat('en-TZ', {
                          style: 'currency',
                          currency: 'TZS',
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        }).format(restructuring.current_balance) : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(restructuring.submitted_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => setSelectedRestructuring(restructuring)}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          {language === 'en' ? 'View' : 'Ona'}
                        </button>
                        <button
                          onClick={() => console.log('Edit restructuring:', restructuring.id)}
                          className="text-green-600 hover:text-green-900"
                        >
                          {language === 'en' ? 'Edit' : 'Hariri'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">
                {language === 'en' 
                  ? 'No restructuring requests found in database' 
                  : 'Hakuna maombi ya marekebisho yamepatikana kwenye hifadhidata'
                }
              </p>
            </div>
          )}
        </div>

        {/* SECTION 1: LOAN SELECTION & OVERVIEW */}
        <div className="space-y-6">
          {/* Content Block 1A: Select Loan for Restructuring */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Search className="w-5 h-5 mr-2 text-blue-600" />
              {language === 'en' ? 'Select Loan for Restructuring' : 'Chagua Mkopo wa Marekebisho'}
            </h3>
            
            {/* Search and Filters */}
            <div className="mb-6 space-y-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder={language === 'en' ? 'Search by client name, loan ID, or client ID...' : 'Tafuta kwa jina la mteja, kitambulisho cha mkopo...'}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
          </div>
          
                <div className="flex gap-4">
                  <select
                    value={filterProductType}
                    onChange={(e) => setFilterProductType(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">{language === 'en' ? 'All Products' : 'Bidhaa Zote'}</option>
                    <option value="individual">{language === 'en' ? 'Individual' : 'Binafsi'}</option>
                    <option value="group">{language === 'en' ? 'Group' : 'Kikundi'}</option>
                    <option value="sme">{language === 'en' ? 'SME' : 'Biashara Ndogo'}</option>
                    <option value="agricultural">{language === 'en' ? 'Agricultural' : 'Kilimo'}</option>
                  </select>
                  
                  <select
                    value={filterPaymentStatus}
                    onChange={(e) => setFilterPaymentStatus(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">{language === 'en' ? 'All Status' : 'Hali Zote'}</option>
                    <option value="active">{language === 'en' ? 'Active' : 'Aktifu'}</option>
                    <option value="past_due">{language === 'en' ? 'Past Due' : 'Imechelewa'}</option>
                    <option value="at_risk">{language === 'en' ? 'At Risk' : 'Ina Hatari'}</option>
                    <option value="default">{language === 'en' ? 'Default' : 'Imeshindwa'}</option>
                  </select>
                </div>
              </div>
            </div>
            
            {/* Client Loan Portfolio Display */}
            <div className="mb-4 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                📊 {language === 'en' ? 'Data loaded from loans table' : 'Data imepakiwa kutoka jedwali la mikopo'}
                {isLoadingLoans && (
                  <span className="ml-2 text-blue-600">
                    {language === 'en' ? 'Loading...' : 'Inapakia...'}
                  </span>
                )}
              </div>
              <div className="text-sm text-gray-500">
                {isLoadingLoans ? (
                  <span className="text-blue-600">{language === 'en' ? 'Loading loans...' : 'Inapakia mikopo...'}</span>
                ) : (
                  <span>{language === 'en' ? `Showing ${filteredLoans.length} of ${loans.length} loans` : `Inaonyesha ${filteredLoans.length} ya ${loans.length} mikopo`}</span>
                )}
              </div>
            </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {language === 'en' ? 'Loan ID' : 'Kitambulisho cha Mkopo'}
                  </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {language === 'en' ? 'Client Name' : 'Jina la Mteja'}
                  </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {language === 'en' ? 'Product Type' : 'Aina ya Bidhaa'}
                  </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {language === 'en' ? 'Disbursed Amount' : 'Kiasi cha Kutolewa'}
                  </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {language === 'en' ? 'Outstanding Balance' : 'Salio la Baki'}
                  </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {language === 'en' ? 'EMI' : 'Malipo ya Mwezi'}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {language === 'en' ? 'Next Due Date' : 'Tarehe ya Malipo ya Pili'}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {language === 'en' ? 'Status' : 'Hali'}
                  </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {language === 'en' ? 'Actions' : 'Vitendo'}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                  {filteredLoans.map((loan) => (
                  <tr key={loan.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{loan.id}</div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{loan.clientName}</div>
                        <div className="text-sm text-gray-500">{loan.phone}</div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">{loan.productType}</span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{formatCurrency(loan.originalAmount)}</div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{formatCurrency(loan.currentBalance)}</div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{formatCurrency(loan.monthlyPayment)}</div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{loan.nextPaymentDate}</div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(loan.status)}`}>
                          {loan.status === 'active' ? (language === 'en' ? 'Active' : 'Aktifu') :
                           loan.status === 'past_due' ? (language === 'en' ? 'Past Due' : 'Imechelewa') :
                           loan.status === 'at_risk' ? (language === 'en' ? 'At Risk' : 'Ina Hatari') :
                           (language === 'en' ? 'Default' : 'Imeshindwa')}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleSelectLoan(loan)}
                          className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs"
                        >
                          {language === 'en' ? 'Select' : 'Chagua'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
                        </div>
                        </div>

          {/* Content Block 1B: Current Loan Summary Dashboard */}
          {selectedLoan && (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <BarChart3 className="w-5 h-5 mr-2 text-green-600" />
                {language === 'en' ? 'Current Loan Summary Dashboard' : 'Dashibodi ya Muhtasari wa Mkopo wa Sasa'}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="text-sm text-blue-600 mb-1">
                    {language === 'en' ? 'Original Loan Amount' : 'Kiasi cha Mkopo wa Asili'}
                        </div>
                  <div className="text-2xl font-bold text-blue-700">
                    {formatCurrency(selectedLoan.originalAmount)}
                      </div>
                </div>
                
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="text-sm text-green-600 mb-1">
                    {language === 'en' ? 'Outstanding Principal' : 'Mkuu wa Baki'}
                  </div>
                  <div className="text-2xl font-bold text-green-700">
                    {formatCurrency(selectedLoan.currentBalance)}
                  </div>
                </div>
                
                <div className="bg-yellow-50 rounded-lg p-4">
                  <div className="text-sm text-yellow-600 mb-1">
                    {language === 'en' ? 'Interest Accrued' : 'Riba Iliyokuzwa'}
                  </div>
                  <div className="text-2xl font-bold text-yellow-700">
                    {formatCurrency(selectedLoan.interestAccrued || 0)}
                  </div>
                </div>
                
                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="text-sm text-purple-600 mb-1">
                    {language === 'en' ? 'Total Paid to Date' : 'Jumla ya Kulipwa hadi Sasa'}
                  </div>
                  <div className="text-2xl font-bold text-purple-700">
                    {formatCurrency(selectedLoan.totalPaidToDate || 0)}
                  </div>
                </div>
                
                <div className="bg-orange-50 rounded-lg p-4">
                  <div className="text-sm text-orange-600 mb-1">
                    {language === 'en' ? 'Remaining Tenure' : 'Muda Ulioobaki'}
                  </div>
                  <div className="text-2xl font-bold text-orange-700">
                    {selectedLoan.remainingTenor} {language === 'en' ? 'months' : 'miezi'}
                  </div>
                </div>
                
                <div className="bg-red-50 rounded-lg p-4">
                  <div className="text-sm text-red-600 mb-1">
                    {language === 'en' ? 'Current EMI' : 'EMI ya Sasa'}
                  </div>
                  <div className="text-2xl font-bold text-red-700">
                    {formatCurrency(selectedLoan.monthlyPayment)}
                  </div>
                </div>
                
                <div className="bg-indigo-50 rounded-lg p-4">
                  <div className="text-sm text-indigo-600 mb-1">
                    {language === 'en' ? 'Payment Performance' : 'Utendaji wa Malipo'}
                  </div>
                  <div className="text-2xl font-bold text-indigo-700">
                    {selectedLoan.paymentPerformance || 0}%
                  </div>
                </div>
                
                <div className="bg-pink-50 rounded-lg p-4">
                  <div className="text-sm text-pink-600 mb-1">
                    {language === 'en' ? 'Risk Level' : 'Kiwango cha Hatari'}
                  </div>
                  <div className={`text-lg font-bold px-2 py-1 rounded ${getRiskLevelColor(selectedLoan.riskLevel)}`}>
                    {selectedLoan.riskLevel.toUpperCase()}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Content Block 1C: Payment History Widget */}
          {selectedLoan && paymentHistory.length > 0 && (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Activity className="w-5 h-5 mr-2 text-purple-600" />
                {language === 'en' ? 'Payment History Widget' : 'Kipengele cha Historia ya Malipo'}
              </h3>
              
              <div className="grid grid-cols-12 gap-2 mb-4">
                {paymentHistory.slice(0, 12).map((payment, index) => (
                  <div key={index} className="text-center">
                    <div className={`w-8 h-8 rounded-full mx-auto mb-1 flex items-center justify-center text-xs font-medium ${
                      payment.status === 'on_time' ? 'bg-green-100 text-green-800' :
                      payment.status === 'late' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {payment.status === 'on_time' ? '✓' : payment.status === 'late' ? '!' : '✗'}
                    </div>
                    <div className="text-xs text-gray-600">{payment.month}</div>
                  </div>
                ))}
              </div>
              
              <div className="flex justify-between items-center text-sm">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-100 rounded-full mr-2"></div>
                    <span className="text-gray-600">{language === 'en' ? 'On-time' : 'Wakati'}</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-yellow-100 rounded-full mr-2"></div>
                    <span className="text-gray-600">{language === 'en' ? 'Late' : 'Chelewa'}</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-red-100 rounded-full mr-2"></div>
                    <span className="text-gray-600">{language === 'en' ? 'Missed' : 'Imekosa'}</span>
                  </div>
                </div>
                <button className="text-blue-600 hover:text-blue-800 text-sm">
                  {language === 'en' ? 'View Full History' : 'Ona Historia Kamili'}
                </button>
              </div>
            </div>
          )}

          {/* Detailed Repayment History Table */}
          {selectedLoan && (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-blue-600" />
                  {language === 'en' ? 'Detailed Repayment History' : 'Historia ya Malipo ya Kina'}
                </h3>
                <div className="text-sm text-gray-500">
                  📊 {language === 'en' ? 'Data from loan_repayments table' : 'Data kutoka jedwali la malipo'}
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {language === 'en' ? 'Payment Date' : 'Tarehe ya Malipo'}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {language === 'en' ? 'Amount' : 'Kiasi'}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {language === 'en' ? 'Method' : 'Njia'}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {language === 'en' ? 'Reference' : 'Kumbuka'}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {language === 'en' ? 'Status' : 'Hali'}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {language === 'en' ? 'Notes' : 'Maelezo'}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paymentHistory.length > 0 ? (
                      paymentHistory.map((payment, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {payment.paidDate ? new Date(payment.paidDate).toLocaleDateString() : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {new Intl.NumberFormat('en-TZ', {
                              style: 'currency',
                              currency: 'TZS',
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 0,
                            }).format(payment.amount)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {payment.status === 'on_time' ? 'On Time' : 
                               payment.status === 'late' ? 'Late' : 'Missed'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {payment.dueDate ? new Date(payment.dueDate).toLocaleDateString() : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              payment.status === 'on_time' ? 'bg-green-100 text-green-800' :
                              payment.status === 'late' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {payment.status === 'on_time' ? '✓ On Time' : 
                               payment.status === 'late' ? '⚠ Late' : '✗ Missed'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {payment.month}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                          {language === 'en' ? 'No repayment history found' : 'Hakuna historia ya malipo'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              
              {paymentHistory.length > 0 && (
                <div className="mt-4 text-sm text-gray-600">
                  <p>
                    {language === 'en' 
                      ? `Showing ${paymentHistory.length} repayment records from database` 
                      : `Inaonyesha rekodi ${paymentHistory.length} za malipo kutoka kwenye hifadhidata`}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* SECTION 2: RESTRUCTURING OPTIONS MODULE */}
        {selectedLoan && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
              <RefreshCw className="w-5 h-5 mr-2 text-orange-600" />
              {language === 'en' ? 'Restructuring Options Module' : 'Moduli ya Chaguzi za Marekebisho'}
            </h3>
            
            {/* Content Block 2A: Select Restructuring Type */}
            <div className="mb-6">
              <h4 className="text-md font-medium text-gray-900 mb-4">
                {language === 'en' ? 'Select Restructuring Type' : 'Chagua Aina ya Marekebisho'}
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {restructuringTypes.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => handleTabChange(type.id)}
                    className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                      activeRestructuringTab === type.id
                        ? 'border-orange-500 bg-orange-50 text-orange-700'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                    } ${!type.isAvailable ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={!type.isAvailable}
                  >
                    <div className="flex flex-col items-center text-center">
                      <div className="mb-2">{type.icon}</div>
                      <div className="font-medium text-sm mb-1">{type.name}</div>
                      <div className="text-xs text-gray-500">{type.description}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            <div className="mt-6">
              {/* TAB 1: EARLY SETTLEMENT PROCESSING */}
              {activeRestructuringTab === 'early_settlement' && (
                <div className="space-y-6">
                  {/* Content Block 2B: Settlement Calculation Engine */}
                  <div className="bg-blue-50 rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <Calculator className="w-5 h-5 mr-2 text-blue-600" />
                      {language === 'en' ? 'Settlement Calculation Engine' : 'Kikokotoo cha Malipo ya Mapema'}
                    </h4>
                    
                    {settlementCalculation && (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-white rounded-lg p-4">
                          <div className="text-sm text-gray-600 mb-1">
                            {language === 'en' ? 'Outstanding Principal' : 'Mkuu wa Baki'}
                          </div>
                          <div className="text-xl font-bold text-gray-900">
                            {formatCurrency(settlementCalculation.outstandingPrincipal)}
                          </div>
                        </div>
                        
                        <div className="bg-white rounded-lg p-4">
                          <div className="text-sm text-gray-600 mb-1">
                            {language === 'en' ? 'Accrued Interest' : 'Riba Iliyokuzwa'}
                          </div>
                          <div className="text-xl font-bold text-gray-900">
                            {formatCurrency(settlementCalculation.accruedInterest)}
                          </div>
                        </div>
                        
                        <div className="bg-white rounded-lg p-4">
                          <div className="text-sm text-gray-600 mb-1">
                            {language === 'en' ? 'Prepayment Penalty' : 'Faini ya Malipo ya Mapema'}
                          </div>
                          <div className="text-xl font-bold text-gray-900">
                            {formatCurrency(settlementCalculation.prepaymentPenalty)}
                          </div>
                        </div>
                        
                        <div className="bg-white rounded-lg p-4 border-2 border-blue-500">
                          <div className="text-sm text-blue-600 mb-1">
                            {language === 'en' ? 'Total Settlement Amount' : 'Jumla ya Malipo ya Mapema'}
                          </div>
                          <div className="text-2xl font-bold text-blue-700">
                            {formatCurrency(settlementCalculation.totalSettlementAmount)}
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Settlement Date Options */}
                    <div className="mt-6">
                      <h5 className="font-medium text-gray-900 mb-3">
                        {language === 'en' ? 'Settlement Date Options' : 'Chaguzi za Tarehe ya Malipo'}
                      </h5>
                      <div className="flex space-x-4">
                        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                          {language === 'en' ? "Today's Date" : 'Tarehe ya Leo'}
                        </button>
                        <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">
                          {language === 'en' ? 'Custom Date' : 'Tarehe ya Kibinafsi'}
                        </button>
                        <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">
                          {language === 'en' ? 'Next EMI Due Date' : 'Tarehe ya EMI ya Pili'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Content Block 2C: Penalty Structure Information */}
                  <div className="bg-yellow-50 rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <Info className="w-5 h-5 mr-2 text-yellow-600" />
                      {language === 'en' ? 'Penalty Structure Information' : 'Maelezo ya Muundo wa Faini'}
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h5 className="font-medium text-gray-900 mb-3">
                          {language === 'en' ? 'Product-Specific Rules' : 'Sheria za Bidhaa'}
                        </h5>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>{language === 'en' ? 'Individual Loans' : 'Mikopo ya Binafsi'}:</span>
                            <span className="font-medium">2%</span>
                      </div>
                          <div className="flex justify-between">
                            <span>{language === 'en' ? 'Group Loans' : 'Mikopo ya Kikundi'}:</span>
                            <span className="font-medium">1%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>{language === 'en' ? 'SME Loans' : 'Mikopo ya Biashara Ndogo'}:</span>
                            <span className="font-medium">3%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>{language === 'en' ? 'Agricultural Loans' : 'Mikopo ya Kilimo'}:</span>
                            <span className="font-medium">1.5%</span>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h5 className="font-medium text-gray-900 mb-3">
                          {language === 'en' ? 'Waiver Conditions' : 'Masharti ya Kukataa Faini'}
                        </h5>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center">
                            <CheckCircle className={`w-4 h-4 mr-2 ${settlementCalculation?.waiverConditions.noMissedPayments24Months ? 'text-green-600' : 'text-gray-400'}`} />
                            <span className={settlementCalculation?.waiverConditions.noMissedPayments24Months ? 'text-green-600' : 'text-gray-600'}>
                              {language === 'en' ? 'No missed payments in last 24 months: 50% penalty reduction' : 'Hakuna malipo yaliyokosa katika miezi 24: Kupunguzwa kwa faini 50%'}
                            </span>
                        </div>
                          <div className="flex items-center">
                            <CheckCircle className={`w-4 h-4 mr-2 ${settlementCalculation?.waiverConditions.loyalClient3Years ? 'text-green-600' : 'text-gray-400'}`} />
                            <span className={settlementCalculation?.waiverConditions.loyalClient3Years ? 'text-green-600' : 'text-gray-600'}>
                              {language === 'en' ? 'Loyal client (3+ years): Additional 25% reduction' : 'Mteja wa kudumu (miaka 3+): Kupunguzwa wa ziada 25%'}
                            </span>
                        </div>
                          <div className="flex items-center">
                            <CheckCircle className={`w-4 h-4 mr-2 ${settlementCalculation?.waiverConditions.financialHardship ? 'text-green-600' : 'text-gray-400'}`} />
                            <span className={settlementCalculation?.waiverConditions.financialHardship ? 'text-green-600' : 'text-gray-600'}>
                              {language === 'en' ? 'Financial hardship cases: Full waiver (requires approval)' : 'Kesi za uhitaji wa fedha: Kukataa kamili (inahitaji idhini)'}
                            </span>
                        </div>
                        </div>
                      </div>
                    </div>
                  </div>
                          </div>
                        )}

              {/* TAB 2: LOAN TOP-UP PROCESSING */}
              {activeRestructuringTab === 'loan_topup' && (
                <div className="space-y-6">
                  {/* Content Block 2D: Top-Up Eligibility Assessment */}
                  <div className="bg-green-50 rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <Shield className="w-5 h-5 mr-2 text-green-600" />
                      {language === 'en' ? 'Top-Up Eligibility Assessment' : 'Tathmini ya Ustahili wa Kuongeza'}
                    </h4>
                    
                    {topUpEligibility && (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-white rounded-lg p-4">
                          <div className="text-sm text-gray-600 mb-1">
                            {language === 'en' ? 'Payment History Score' : 'Alama ya Historia ya Malipo'}
                      </div>
                          <div className="text-xl font-bold text-gray-900">
                            {topUpEligibility.paymentHistoryScore}%
                          </div>
                        </div>
                        
                        <div className="bg-white rounded-lg p-4">
                          <div className="text-sm text-gray-600 mb-1">
                            {language === 'en' ? 'Debt-to-Income Ratio' : 'Uwiano wa Deni kwa Mapato'}
                          </div>
                          <div className="text-xl font-bold text-gray-900">
                            {(topUpEligibility.currentDebtToIncomeRatio * 100).toFixed(1)}%
                          </div>
                        </div>
                        
                        <div className="bg-white rounded-lg p-4">
                          <div className="text-sm text-gray-600 mb-1">
                            {language === 'en' ? 'Credit Bureau Check' : 'Ukaguzi wa Kumbi ya Mkopo'}
                          </div>
                          <div className={`text-lg font-bold ${
                            topUpEligibility.creditBureauCheck === 'passed' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {topUpEligibility.creditBureauCheck.toUpperCase()}
                          </div>
                        </div>
                        
                        <div className="bg-white rounded-lg p-4 border-2 border-green-500">
                          <div className="text-sm text-green-600 mb-1">
                            {language === 'en' ? 'Maximum Top-Up Amount' : 'Kiasi cha Juu cha Kuongeza'}
                          </div>
                          <div className="text-2xl font-bold text-green-700">
                            {formatCurrency(topUpEligibility.maximumTopUpAmount)}
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Eligibility Criteria */}
                    <div className="mt-6">
                      <h5 className="font-medium text-gray-900 mb-3">
                        {language === 'en' ? 'Eligibility Criteria' : 'Vigezo vya Ustahili'}
                      </h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center">
                            <CheckCircle className={`w-4 h-4 mr-2 ${topUpEligibility?.eligibilityCriteria.min12MonthsHistory ? 'text-green-600' : 'text-red-600'}`} />
                            <span className={topUpEligibility?.eligibilityCriteria.min12MonthsHistory ? 'text-green-600' : 'text-red-600'}>
                              {language === 'en' ? 'Minimum 12 months of payment history' : 'Historia ya malipo ya angalau miezi 12'}
                      </span>
                      </div>
                          <div className="flex items-center">
                            <CheckCircle className={`w-4 h-4 mr-2 ${topUpEligibility?.eligibilityCriteria.noOverdue30Days ? 'text-green-600' : 'text-red-600'}`} />
                            <span className={topUpEligibility?.eligibilityCriteria.noOverdue30Days ? 'text-green-600' : 'text-red-600'}>
                              {language === 'en' ? 'No payments overdue by more than 30 days' : 'Hakuna malipo yaliyochelewa zaidi ya siku 30'}
                      </span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center">
                            <CheckCircle className={`w-4 h-4 mr-2 ${topUpEligibility?.eligibilityCriteria.incomeVerificationUpToDate ? 'text-green-600' : 'text-red-600'}`} />
                            <span className={topUpEligibility?.eligibilityCriteria.incomeVerificationUpToDate ? 'text-green-600' : 'text-red-600'}>
                              {language === 'en' ? 'Client income verification up-to-date' : 'Uthibitisho wa mapato ya mteja ni wa hivi karibuni'}
                            </span>
                          </div>
                          <div className="flex items-center">
                            <span className="text-sm text-gray-600">
                              {language === 'en' ? 'Loan performance rating' : 'Kiwango cha utendaji wa mkopo'}: 
                              <span className="ml-2 font-medium">{topUpEligibility?.eligibilityCriteria.loanPerformanceRating}</span>
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Content Block 2E: Top-Up Amount Calculator */}
                  <div className="bg-blue-50 rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <Calculator className="w-5 h-5 mr-2 text-blue-600" />
                      {language === 'en' ? 'Top-Up Amount Calculator' : 'Kikokotoo cha Kiasi cha Kuongeza'}
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {language === 'en' ? 'Requested Top-Up Amount' : 'Kiasi cha Kuongeza cha Kihitaji'}
                        </label>
                        <input
                          type="number"
                          placeholder="Enter amount..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {language === 'en' ? 'New EMI Options' : 'Chaguzi za EMI Mpya'}
                        </label>
                        <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                          <option>{language === 'en' ? 'Select EMI option...' : 'Chagua chaguo la EMI...'}</option>
                          <option>{language === 'en' ? 'Blended Rate' : 'Kiwango cha Mchanganyiko'}</option>
                          <option>{language === 'en' ? 'Separate Facility' : 'Kituo cha Kujitegemea'}</option>
                          <option>{language === 'en' ? 'Fresh Loan' : 'Mkopo Mpya'}</option>
                        </select>
                      </div>
                    </div>
                    
                    {topUpCalculation && (
                      <div className="mt-6">
                        <h5 className="font-medium text-gray-900 mb-4">
                          {language === 'en' ? 'Pricing Options for Top-Up' : 'Chaguzi za Bei za Kuongeza'}
                        </h5>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="bg-white rounded-lg p-4 border border-gray-200">
                            <h6 className="font-medium text-gray-900 mb-3">
                              {language === 'en' ? 'Blended Rate Option' : 'Chaguo la Kiwango cha Mchanganyiko'}
                            </h6>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span>{language === 'en' ? 'Existing Balance' : 'Salio la Kuwepo'}:</span>
                                <span>{formatCurrency(topUpCalculation.pricingOptions.blendedRate.existingBalance)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>{language === 'en' ? 'Top-Up Amount' : 'Kiasi cha Kuongeza'}:</span>
                                <span>{formatCurrency(topUpCalculation.pricingOptions.blendedRate.topUpAmount)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>{language === 'en' ? 'New Blended Rate' : 'Kiwango Mpya cha Mchanganyiko'}:</span>
                                <span>{topUpCalculation.pricingOptions.blendedRate.newBlendedRate.toFixed(2)}%</span>
                              </div>
                              <div className="flex justify-between font-medium">
                                <span>{language === 'en' ? 'New EMI' : 'EMI Mpya'}:</span>
                                <span>{formatCurrency(topUpCalculation.pricingOptions.blendedRate.newEMI)}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="bg-white rounded-lg p-4 border border-gray-200">
                            <h6 className="font-medium text-gray-900 mb-3">
                              {language === 'en' ? 'Separate Facility Option' : 'Chaguo la Kituo cha Kujitegemea'}
                            </h6>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span>{language === 'en' ? 'Keep existing loan' : 'Hifadhi mkopo wa kuwepo'}:</span>
                                <span>{formatCurrency(topUpCalculation.pricingOptions.separateFacility.existingLoanEMI)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>{language === 'en' ? 'New top-up facility' : 'Kituo mpya cha kuongeza'}:</span>
                                <span>{formatCurrency(topUpCalculation.pricingOptions.separateFacility.newTopUpEMI)}</span>
                              </div>
                              <div className="flex justify-between font-medium">
                                <span>{language === 'en' ? 'Total Monthly Payment' : 'Jumla ya Malipo ya Mwezi'}:</span>
                                <span>{formatCurrency(topUpCalculation.pricingOptions.separateFacility.totalMonthlyPayment)}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="bg-white rounded-lg p-4 border border-gray-200">
                            <h6 className="font-medium text-gray-900 mb-3">
                              {language === 'en' ? 'Fresh Loan Option' : 'Chaguo la Mkopo Mpya'}
                            </h6>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span>{language === 'en' ? 'Close existing loan' : 'Funga mkopo wa kuwepo'}:</span>
                                <span>{formatCurrency(topUpCalculation.pricingOptions.freshLoan.settlementAmount)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>{language === 'en' ? 'New loan amount' : 'Kiasi cha mkopo mpya'}:</span>
                                <span>{formatCurrency(topUpCalculation.pricingOptions.freshLoan.newLoanAmount)}</span>
                              </div>
                              <div className="flex justify-between font-medium">
                                <span>{language === 'en' ? 'New EMI @ current rates' : 'EMI Mpya @ viwango vya sasa'}:</span>
                                <span>{formatCurrency(topUpCalculation.pricingOptions.freshLoan.newEMI)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: TERM MODIFICATION PROCESSING */}
              {activeRestructuringTab === 'term_extension' && (
                <div className="space-y-6">
                  {/* Content Block 2F: Term Extension Options */}
                  <div className="bg-purple-50 rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <Clock className="w-5 h-5 mr-2 text-purple-600" />
                      {language === 'en' ? 'Term Extension Options' : 'Chaguzi za Kuongeza Muda'}
                    </h4>
                    
                    {termModification && (
                      <div className="space-y-4">
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  {language === 'en' ? 'Parameter' : 'Kigezo'}
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  {language === 'en' ? 'Current' : 'Sasa'}
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  {language === 'en' ? 'Option 1' : 'Chaguo 1'}
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  {language === 'en' ? 'Option 2' : 'Chaguo 2'}
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  {language === 'en' ? 'Option 3' : 'Chaguo 3'}
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              <tr>
                                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                  {language === 'en' ? 'Remaining Tenure' : 'Muda Ulioobaki'}
                    </td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {termModification.current.remainingTenure} {language === 'en' ? 'months' : 'miezi'}
                                </td>
                                {termModification.options.map((option, index) => (
                                  <td key={index} className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {option.tenure} {language === 'en' ? 'months' : 'miezi'}
                                  </td>
                                ))}
                              </tr>
                              <tr>
                                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                  {language === 'en' ? 'Monthly EMI' : 'EMI ya Mwezi'}
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {formatCurrency(termModification.current.monthlyEMI)}
                                </td>
                                {termModification.options.map((option, index) => (
                                  <td key={index} className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {formatCurrency(option.monthlyEMI)}
                                  </td>
                                ))}
                              </tr>
                              <tr>
                                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                  {language === 'en' ? 'Total Interest' : 'Riba ya Jumla'}
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {formatCurrency(termModification.current.totalInterest)}
                                </td>
                                {termModification.options.map((option, index) => (
                                  <td key={index} className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {formatCurrency(option.totalInterest)}
                                  </td>
                                ))}
                              </tr>
                              <tr>
                                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                  {language === 'en' ? 'Additional Cost' : 'Gharama ya Ziada'}
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                  -
                                </td>
                                {termModification.options.map((option, index) => (
                                  <td key={index} className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {formatCurrency(option.additionalCost)}
                                  </td>
                                ))}
                              </tr>
                            </tbody>
                          </table>
                        </div>
                        
                        {/* Extension Justification */}
                        <div className="mt-6">
                          <h5 className="font-medium text-gray-900 mb-3">
                            {language === 'en' ? 'Extension Justification (Required Field)' : 'Uthibitisho wa Kuongeza (Sehemu ya Lazima)'}
                          </h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                {language === 'en' ? 'Reason' : 'Sababu'}
                              </label>
                              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500">
                                <option>{language === 'en' ? 'Select reason...' : 'Chagua sababu...'}</option>
                                <option>{language === 'en' ? 'Income Reduction' : 'Kupungua kwa Mapato'}</option>
                                <option>{language === 'en' ? 'Medical Emergency' : 'Dharura ya Matibabu'}</option>
                                <option>{language === 'en' ? 'Business Loss' : 'Hasara ya Biashara'}</option>
                                <option>{language === 'en' ? 'Family Emergency' : 'Dharura ya Familia'}</option>
                                <option>{language === 'en' ? 'Other' : 'Mengineyo'}</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                {language === 'en' ? 'Comments' : 'Maoni'}
                              </label>
                              <textarea
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                placeholder={language === 'en' ? 'Provide detailed explanation...' : 'Toa maelezo ya kina...'}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: TERM REDUCTION PROCESSING */}
              {activeRestructuringTab === 'term_reduction' && (
                <div className="space-y-6">
                  {/* Content Block 2G: Term Reduction Options */}
                  <div className="bg-red-50 rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <TrendingDown className="w-5 h-5 mr-2 text-red-600" />
                      {language === 'en' ? 'Term Reduction Options' : 'Chaguzi za Kupunguza Muda'}
                    </h4>
                    
                    {termModification && (
                      <div className="space-y-4">
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  {language === 'en' ? 'Payment Increase' : 'Kuongeza Malipo'}
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  {language === 'en' ? 'New EMI' : 'EMI Mpya'}
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  {language === 'en' ? 'New Tenure' : 'Muda Mpya'}
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  {language === 'en' ? 'Interest Saved' : 'Riba Iliyookolewa'}
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  {language === 'en' ? 'Action' : 'Kitendo'}
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {termModification.reductionOptions.map((option, index) => (
                                <tr key={index}>
                                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                    +{option.paymentIncrease}%
                                  </td>
                                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {formatCurrency(option.newEMI)}
                                  </td>
                                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {option.newTenure} {language === 'en' ? 'months' : 'miezi'}
                                  </td>
                                  <td className="px-4 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                                    {formatCurrency(option.interestSaved)}
                                  </td>
                                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                                    <button className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 text-xs">
                                      {language === 'en' ? 'Select' : 'Chagua'}
                        </button>
                                  </td>
                                </tr>
                              ))}
                              <tr>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                  <input
                                    type="number"
                                    placeholder="Custom %"
                                    className="w-20 px-2 py-1 border border-gray-300 rounded text-xs"
                                  />
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {formatCurrency(0)}
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {0} {language === 'en' ? 'months' : 'miezi'}
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                                  {formatCurrency(0)}
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                                  <button className="px-3 py-1 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-xs">
                                    {language === 'en' ? 'Calculate' : 'Hesabu'}
                                  </button>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="mt-8 flex justify-end space-x-4">
                        <button
                  onClick={handleSaveDraft}
                  className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center"
                        >
                  <Save className="w-4 h-4 mr-2" />
                  {language === 'en' ? 'Save Draft' : 'Hifadhi Rasimu'}
                        </button>
                        <button 
                  onClick={handleSubmitProposal}
                  className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center"
                        >
                  <Send className="w-4 h-4 mr-2" />
                  {language === 'en' ? 'Submit for Approval' : 'Wasilisha kwa Idhini'}
                        </button>
                      </div>
          </div>
        </div>
        )}

        {/* Restructuring Modal */}
        {showRestructuringModal && selectedLoan && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900">
                  {language === 'en' ? 'Restructuring Proposal' : 'Pendekezo la Marekebisho'} - {selectedLoan.clientName}
                </h3>
                <button
                  onClick={() => setShowRestructuringModal(false)}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-6">
                {/* Current Loan Summary */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">
                    {language === 'en' ? 'Current Loan Summary' : 'Muhtasari wa Mkopo wa Sasa'}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p><strong>{language === 'en' ? 'Current Balance' : 'Salio la Sasa'}:</strong> {formatCurrency(selectedLoan.currentBalance)}</p>
                      <p><strong>{language === 'en' ? 'Monthly Payment' : 'Malipo ya Mwezi'}:</strong> {formatCurrency(selectedLoan.monthlyPayment)}</p>
                      <p><strong>{language === 'en' ? 'Interest Rate' : 'Kiwango cha Riba'}:</strong> {selectedLoan.interestRate}%</p>
                    </div>
                    <div>
                      <p><strong>{language === 'en' ? 'Remaining Tenor' : 'Muda Ulioobaki'}:</strong> {selectedLoan.remainingTenor} {language === 'en' ? 'months' : 'miezi'}</p>
                      <p><strong>{language === 'en' ? 'Days Past Due' : 'Siku Zilizochelewa'}:</strong> {selectedLoan.daysPastDue}</p>
                      <p><strong>{language === 'en' ? 'Risk Level' : 'Kiwango cha Hatari'}:</strong> {selectedLoan.riskLevel.toUpperCase()}</p>
                    </div>
                  </div>
                </div>

                {/* Restructuring Parameters */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {language === 'en' ? 'New Tenor (months)' : 'Muda Mpya (miezi)'}
                    </label>
                    <input
                      type="number"
                      value={proposal.newTenor}
                      onChange={(e) => setProposal(prev => ({ ...prev, newTenor: parseInt(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      min="1"
                      max="60"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {language === 'en' ? 'New Interest Rate (%)' : 'Kiwango Mpya cha Riba (%)'}
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={proposal.newInterestRate}
                      onChange={(e) => setProposal(prev => ({ ...prev, newInterestRate: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      min="0"
                      max="30"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {language === 'en' ? 'Grace Period (months)' : 'Muda wa Huru (miezi)'}
                    </label>
                    <input
                      type="number"
                      value={proposal.gracePeriod}
                      onChange={(e) => setProposal(prev => ({ ...prev, gracePeriod: parseInt(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      min="0"
                      max="6"
                    />
                  </div>

                  <div className="flex items-end">
                    <button
                      onClick={handleCalculateImpact}
                      disabled={isCalculating || !proposal.newTenor || !proposal.newInterestRate}
                      className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-sm transition-all duration-200 transform hover:scale-105 font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center"
                    >
                      {isCalculating ? (
                        <>
                          <Clock className="w-4 h-4 mr-2 animate-spin" />
                          {language === 'en' ? 'Calculating...' : 'Inahesabu...'}
                        </>
                      ) : (
                        <>
                          <Calculator className="w-4 h-4 mr-2" />
                          {language === 'en' ? 'Calculate Impact' : 'Hesabu Athari'}
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Impact Analysis */}
                {impact && (
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <h4 className="font-medium text-gray-900 mb-3">
                      {language === 'en' ? 'Impact Analysis' : 'Uchambuzi wa Athari'}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p><strong>{language === 'en' ? 'New Monthly Payment' : 'Malipo Mpya ya Mwezi'}:</strong> {formatCurrency(proposal.newMonthlyPayment)}</p>
                        <p><strong>{language === 'en' ? 'Monthly Payment Change' : 'Mabadiliko ya Malipo ya Mwezi'}:</strong> 
                          <span className={impact.impactAnalysis.monthlyPaymentChange < 0 ? 'text-green-600' : 'text-red-600'}>
                            {formatCurrency(impact.impactAnalysis.monthlyPaymentChange)}
                          </span>
                        </p>
                      </div>
                      <div>
                        <p><strong>{language === 'en' ? 'Total Interest Change' : 'Mabadiliko ya Riba ya Jumla'}:</strong> 
                          <span className={impact.impactAnalysis.totalInterestChange < 0 ? 'text-green-600' : 'text-red-600'}>
                            {formatCurrency(impact.impactAnalysis.totalInterestChange)}
                          </span>
                        </p>
                        <p><strong>{language === 'en' ? 'Risk Reduction' : 'Kupunguza Hatari'}:</strong> {impact.impactAnalysis.riskReduction}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Reason and Justification */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {language === 'en' ? 'Reason for Restructuring' : 'Sababu ya Marekebisho'} *
                    </label>
                    <select
                      value={proposal.reason}
                      onChange={(e) => setProposal(prev => ({ ...prev, reason: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">{language === 'en' ? 'Select reason...' : 'Chagua sababu...'}</option>
                      <option value="financial_hardship">{language === 'en' ? 'Financial Hardship' : 'Uhitaji wa Fedha'}</option>
                      <option value="business_downturn">{language === 'en' ? 'Business Downturn' : 'Kushuka kwa Biashara'}</option>
                      <option value="seasonal_fluctuation">{language === 'en' ? 'Seasonal Fluctuation' : 'Mabadiliko ya Msimu'}</option>
                      <option value="unexpected_expenses">{language === 'en' ? 'Unexpected Expenses' : 'Matumizi ya Ghafla'}</option>
                      <option value="other">{language === 'en' ? 'Other' : 'Mengineyo'}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {language === 'en' ? 'Justification' : 'Uthibitisho'} *
                    </label>
                    <textarea
                      value={proposal.justification}
                      onChange={(e) => setProposal(prev => ({ ...prev, justification: e.target.value }))}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder={language === 'en' 
                        ? 'Provide detailed justification for the restructuring...'
                        : 'Toa uthibitisho wa kina wa marekebisho...'
                      }
                    />
                  </div>
                </div>

                {/* Approval Workflow */}
                <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                  <h5 className="font-medium text-gray-900 mb-2">
                    {language === 'en' ? 'Approval Workflow' : 'Mfumo wa Idhini'}
                  </h5>
                  <div className="text-sm text-yellow-800 space-y-1">
                    <p>• {language === 'en' ? 'Proposal will be submitted to manager for review' : 'Pendekezo litapelekwa kwa meneja kwa ajili ya ukaguzi'}</p>
                    <p>• {language === 'en' ? 'Manager must approve or reject within 48 hours' : 'Meneja lazima aidhinisha au ikatae ndani ya masaa 48'}</p>
                    <p>• {language === 'en' ? 'Client will be notified of decision via SMS and email' : 'Mteja ataonyeshwa maamuzi kupitia SMS na barua pepe'}</p>
                    <p>• {language === 'en' ? 'Restructuring count will be incremented' : 'Hesabu ya marekebisho itaongezwa'}</p>
                  </div>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowRestructuringModal(false)}
                    className="px-6 py-3 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 shadow-sm transition-all duration-200 transform hover:scale-105 font-medium"
                  >
                    {language === 'en' ? 'Cancel' : 'Ghairi'}
                  </button>
                  <button
                    onClick={handleSubmitProposal}
                    disabled={!proposal.reason || !proposal.justification || isSubmitting}
                    className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 shadow-sm transition-all duration-200 transform hover:scale-105 font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center"
                  >
                    {isSubmitting ? (
                      <>
                        <Clock className="w-4 h-4 mr-2 animate-spin" />
                        {language === 'en' ? 'Submitting...' : 'Inawasilisha...'}
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        {language === 'en' ? 'Submit Proposal' : 'Wasilisha Pendekezo'}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Impact View Modal */}
        {showImpactModal && selectedLoan && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-6xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900">
                  {language === 'en' ? 'Restructuring Impact Analysis' : 'Uchambuzi wa Athari ya Marekebisho'} - {selectedLoan.clientName}
                </h3>
                <button
                  onClick={() => setShowImpactModal(false)}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-6">
                {/* Impact Summary */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">
                    {language === 'en' ? 'Impact Summary' : 'Muhtasari wa Athari'}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <p className="text-lg font-bold text-blue-700">
                        {formatCurrency(proposal.newMonthlyPayment || 0)}
                      </p>
                      <p className="text-blue-600">
                        {language === 'en' ? 'New Monthly Payment' : 'Malipo Mpya ya Mwezi'}
                      </p>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <p className="text-lg font-bold text-green-700">
                        {formatCurrency(proposal.totalPaymentReduction || 0)}
                      </p>
                      <p className="text-green-600">
                        {language === 'en' ? 'Monthly Reduction' : 'Kupunguzwa kwa Mwezi'}
                      </p>
                    </div>
                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                      <p className="text-lg font-bold text-purple-700">
                        {formatCurrency(proposal.totalInterestSavings || 0)}
                      </p>
                      <p className="text-purple-600">
                        {language === 'en' ? 'Total Savings' : 'Jumla ya Akiba'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Comparison Charts */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h5 className="font-medium text-gray-900 mb-3">
                      {language === 'en' ? 'Original vs New Terms' : 'Masharti ya Asili vs Mpya'}
                    </h5>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">{language === 'en' ? 'Tenor' : 'Muda'}:</span>
                        <span>{selectedLoan.remainingTenor} → {proposal.newTenor} {language === 'en' ? 'months' : 'miezi'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">{language === 'en' ? 'Interest Rate' : 'Kiwango cha Riba'}:</span>
                        <span>{selectedLoan.interestRate}% → {proposal.newInterestRate}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">{language === 'en' ? 'Monthly Payment' : 'Malipo ya Mwezi'}:</span>
                        <span>{formatCurrency(selectedLoan.monthlyPayment)} → {formatCurrency(proposal.newMonthlyPayment || 0)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h5 className="font-medium text-gray-900 mb-3">
                      {language === 'en' ? 'Risk Assessment' : 'Tathmini ya Hatari'}
                    </h5>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">{language === 'en' ? 'Current Risk' : 'Hatari ya Sasa'}:</span>
                        <span className={`px-2 py-1 rounded text-xs ${getRiskLevelColor(selectedLoan.riskLevel)}`}>
                          {selectedLoan.riskLevel.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">{language === 'en' ? 'Projected Risk' : 'Hatari ya Kutarajiwa'}:</span>
                        <span className="px-2 py-1 rounded text-xs bg-green-100 text-green-800">
                          {impact?.impactAnalysis.riskReduction || 'LOW'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">{language === 'en' ? 'Restructuring Count' : 'Hesabu ya Marekebisho'}:</span>
                        <span>{selectedLoan.restructuringCount + 1}/{selectedLoan.maxRestructuringAllowed}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowImpactModal(false)}
                    className="px-6 py-3 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 shadow-sm transition-all duration-200 transform hover:scale-105 font-medium"
                  >
                    {language === 'en' ? 'Close' : 'Funga'}
                  </button>
                  <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-sm transition-all duration-200 transform hover:scale-105 font-medium flex items-center">
                    <Download className="w-4 h-4 mr-2" />
                    {language === 'en' ? 'Export Report' : 'Hamisha Ripoti'}
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

export default LoanRestructuring;

