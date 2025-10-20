// Top-up related type definitions

export interface TopUpEligibility {
  isEligible: boolean;
  reason: string;
  maxTopUpAmount: number;
  recommendedStrategy?: string;
  eligibilityCriteria: {
    paymentHistory: { passed: boolean; percentage: number };
    daysOverdue: { passed: boolean; days: number };
    exposureLimit: { passed: boolean; currentExposure: number; maxExposure: number };
    dtiRatio: { passed: boolean; ratio: number };
  };
}

export interface TopUpStrategy {
  id: string;
  name: string;
  description: string;
  isRecommended: boolean;
  isAvailable: boolean;
  unavailableReason?: string;
  
  calculations: {
    newLoanAmount?: number;
    settlementAmount?: number;
    loanReductionAmount?: number;
    netCashToClient: number;
    newMonthlyPayment: number;
    tenure: number;
    totalDebt: number;
    dtiRatio: number;
    interestSavings?: number;
  };
  
  benefits: string[];
  warnings: string[];
}

export interface TopUpRequest {
  id: string;
  requestNumber: string;
  clientId: string;
  existingLoanId: string;
  requestedAmount: number;
  requestedTenure: number; // New field for loan tenure
  selectedStrategy: 'consolidation' | 'settlement_plus_new' | 'net_topup' | 'stacking';
  strategyDetails: {
    settlementAmount?: number;
    newLoanAmount?: number;
    netCashAmount?: number;
    loanReductionAmount?: number;
  };
  disbursementMethod: 'mpesa' | 'bank' | 'cash';
  disbursementDetails: any;
  fees: {
    processingFee: number;
    insuranceFee: number;
    netDisbursement: number;
  };
  requirementsChecklist: {
    clientInformed: boolean;
    consentObtained: boolean;
    collateralVerified: boolean;
    guarantorNotified: boolean;
  };
  dtiOverride?: {
    approved: boolean;
    approvedBy: string;
    reason: string;
  };
  staffNotes?: string;
  status: 'pending_credit_review' | 'pending_supervisor' | 'pending_committee' | 'approved' | 'rejected' | 'disbursed';
  createdAt: string;
  approvedAt?: string;
  disbursedAt?: string;
}

export interface WorkflowStep {
  stepName: string;
  stepOrder: number;
  status: 'pending' | 'approved' | 'rejected' | 'skipped';
  assignedTo: string;
  reviewedBy?: string;
  reviewedAt?: string;
  comments?: string;
}

export interface ComparisonMetrics {
  current: {
    monthlyPayment: number;
    totalDebt: number;
    tenure: number;
    dtiRatio: number;
    loanStatus: string;
  };
  strategies: {
    [key: string]: {
      monthlyPayment: number;
      totalDebt: number;
      tenure: number;
      dtiRatio: number;
      loanStatus: string;
      netCashToClient: number;
    };
  };
}

export interface LoanData {
  id: string;
  applicationId: string;
  clientId: string;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  clientType: string;
  clientAddress: string;
  loanPurpose: string;
  monthlyIncome: number;
  originalAmount: number;
  loanAmount: number;
  disbursedAmount: number;
  outstandingBalance: number;
  outstandingBalanceField: number;
  interestRate: number;
  effectiveAnnualRate: number;
  tenorMonths: number;
  termMonths: number;
  repaymentFrequency: string;
  monthlyPayment: number;
  totalRepaymentAmount: number;
  principalPaid: number;
  interestPaid: number;
  managementFeePaid: number;
  totalPaid: number;
  managementFeeRate: number;
  managementFeeAmount: number;
  upfrontFeesDeducted: boolean;
  upfrontFeesAmount: number;
  disbursementDate: string;
  maturityDate: string;
  firstPaymentDue: string;
  lastPaymentDate: string;
  nextPaymentDue: string;
  status: string;
  daysPastDue: number;
  paymentHistoryPercentage: number;
  dtiRatio: number;
  remainingMonths: number;
  riskRating: string;
  disbursementMethod: string;
  disbursementReference: string;
  disbursementChannel: string;
  paymentHistory: any[];
  latePaymentsCount: number;
  onTimePaymentsCount: number;
  consecutiveLatePayments: number;
  createdAt: string;
  updatedAt: string;
  topUpEligibility?: TopUpEligibility;
  // Legacy fields for compatibility
  collateralValue?: number;
  guarantorName?: string;
  guarantorPhone?: string;
  // Raw loan data for detailed view
  rawLoanData?: any;
}

export interface NetTopUpAllocation {
  appliedToLoan: number;
  cashToClient: number;
}






