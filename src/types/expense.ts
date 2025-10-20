// Expense Management TypeScript Interfaces

export interface ComprehensiveExpenseData {
  totalExpenses: number;
  totalBudget: number;
  totalVariance: number;
  operatingExpenses: number;
  operatingPercentage: number;
  interestExpenses: number;
  interestPercentage: number;
  pendingApprovals: number;
  msp202Integration: MSP202Integration;
  categoryBreakdown: ExpenseCategoryBreakdown[];
}

export interface MSP202Integration {
  interestExpenses: {
    d15_interestOnBankBorrowings: number;
    d16_interestOnMFSPBorrowings: number;
    d17_interestOnSavings: number;
    d18_interestOnFixedDeposits: number;
    d19_interestOnOtherBorrowings: number;
    d20_totalInterestExpense: number;
  };
  operatingExpenses: {
    d25_salariesAndBenefits: number;
    d26_rentAndUtilities: number;
    d27_transportAndCommunication: number;
    d28_officeSupplies: number;
    d29_trainingAndDevelopment: number;
    d30_loanLossProvision: number;
    d31_depreciation: number;
    d32_auditAndLegal: number;
    d33_advertisingAndMarketing: number;
    d34_insurancePremiums: number;
    d35_bankChargesAndFees: number;
    d36_boardAndCommitteeExpenses: number;
    d37_securityServices: number;
    d38_repairsAndMaintenance: number;
    d39_otherOperatingExpenses: number;
    d40_totalOperatingExpenses: number;
  };
  taxExpenses: {
    d41_taxExpense: number;
  };
}

export interface ExpenseCategoryBreakdown {
  category: string;
  amount: number;
  budget: number;
  variance: number;
  percentage: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  botMapping: string;
}

export interface ExpenseFormData {
  id?: string;
  category: string;
  amount: number;
  expenseDate: Date;
  vendorId: string;
  vendorName: string;
  description: string;
  supportingDocuments: File[];
  approvalStatus: 'draft' | 'pending' | 'approved' | 'rejected';
  submittedBy: string;
  submittedDate: Date;
  approvedBy?: string;
  approvedDate?: Date;
  rejectionReason?: string;
  botImpact: BOTReportImpact;
  budgetImpact: BudgetImpact;
}

export interface BOTReportImpact {
  msp202Impact: {
    lineItem: string;
    amount: number;
    description: string;
  }[];
  otherReportsImpact: {
    reportName: string;
    lineItem: string;
    amount: number;
  }[];
}

export interface BudgetImpact {
  budgetCategory: string;
  allocatedAmount: number;
  spentAmount: number;
  remainingAmount: number;
  variance: number;
  variancePercentage: number;
}

export interface PendingExpense {
  id: string;
  submittedBy: string;
  category: string;
  amount: number;
  submissionDate: Date;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  documents: File[];
  botImpact: BOTReportImpact;
  budgetImpact: BudgetImpact;
  description: string;
  vendorName: string;
}

// Comprehensive Expense System Interface
export interface ComprehensiveExpenseSystem {
  // INTEREST EXPENSES
  interestExpenses: {
    interestOnBankBorrowings: ExpenseCategory,      
    interestOnMFSPBorrowings: ExpenseCategory,      
    interestOnSavings: ExpenseCategory,             
    interestOnFixedDeposits: ExpenseCategory,       
    interestOnOtherBorrowings: ExpenseCategory,     
    totalInterestExpense: ExpenseCategory           // Calculated
  },
  
  // OPERATING EXPENSES 
  operatingExpenses: {
    salariesAndBenefits: ExpenseCategory,           
    rentAndUtilities: ExpenseCategory,              
    transportAndCommunication: ExpenseCategory,     
    officeSupplies: ExpenseCategory,                
    trainingAndDevelopment: ExpenseCategory,        
    loanLossProvision: ExpenseCategory,             
    depreciation: ExpenseCategory,                  
    auditAndLegal: ExpenseCategory,                 
    advertisingAndMarketing: ExpenseCategory,       
    insurancePremiums: ExpenseCategory,             
    bankChargesAndFees: ExpenseCategory,            
    boardAndCommitteeExpenses: ExpenseCategory,     
    securityServices: ExpenseCategory,              
    repairsAndMaintenance: ExpenseCategory,         
    otherOperatingExpenses: ExpenseCategory,        
    totalOperatingExpenses: ExpenseCategory          // Calculated
  },
  
  // TAX EXPENSES 
  taxExpenses: {
    corporateIncomeTax: ExpenseCategory,
    skillsDevelopmentLevy: ExpenseCategory,
    payeAndOtherTaxes: ExpenseCategory,
    totalTaxExpense: ExpenseCategory                
  }
}

// Detailed Expense Category Structure
export interface ExpenseCategory {
  categoryCode: string,                             
  categoryName: string,
  description: string,
  
  // Financial Data
  budgetedAmount: number,
  actualAmount: number,
  varianceAmount: number,
  variancePercentage: number,
  
  // Subcategories
  subcategories: ExpenseSubcategory[],
  
  // Tracking Information
  trackingInfo: {
    lastExpenseDate: Date,
    expenseCount: number,
    averageExpenseAmount: number,
    largestExpense: number
  },
  
  // BOT Integration
  botIntegration: {
    msp202LineItem: string,
    autoCalculated: boolean,
    validationRules: string[],
    crossReferences: string[]
  },
  
  // Approval Workflow
  approvalWorkflow: {
    requiresApproval: boolean,
    approvalLimits: ApprovalLimit[],
    currentApprovers: string[],
    escalationRules: EscalationRule[]
  }
}

// Expense Subcategory Structure
export interface ExpenseSubcategory {
  subcategoryCode: string,
  subcategoryName: string,
  description: string,
  budgetedAmount: number,
  actualAmount: number,
  varianceAmount: number,
  variancePercentage: number
}

// Approval Limit Structure
export interface ApprovalLimit {
  level: number,
  maxAmount: number,
  approvers: string[],
  role: string
}

// Escalation Rule Structure
export interface EscalationRule {
  condition: string,
  escalationTime: number, // in hours
  escalatedTo: string[],
  notificationRequired: boolean
}

// Legacy ExpenseCategory interface for backward compatibility
export interface LegacyExpenseCategory {
  id: string;
  name: string;
  description: string;
  botMapping: string;
  approvalRequired: boolean;
  approvalLimit: number;
  budgetCategory: string;
  isActive: boolean;
}

export interface Vendor {
  id: string;
  name: string;
  type: 'supplier' | 'service_provider' | 'contractor';
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  isApproved: boolean;
  taxId?: string;
}

export interface ApprovalWorkflow {
  requiredApprovers: string[];
  approvalLimits: {
    level: number;
    maxAmount: number;
    approvers: string[];
  }[];
  estimatedApprovalTime: number; // in hours
}

export interface ApprovalMetrics {
  averageTime: number;
  approvalRate: number;
  pendingCount: number;
  overdueCount: number;
}

export interface ExpenseSummaryCardProps {
  title: string;
  value: number;
  budget?: number;
  variance?: number;
  percentage?: number;
  trend?: 'increasing' | 'decreasing' | 'stable';
  urgency?: 'low' | 'medium' | 'high' | 'critical';
  format: 'currency' | 'number' | 'percentage';
}

export interface SystemIntegrationPoints {
  staffManagement: {
    salaryProcessing: string;
    allowanceManagement: string;
    benefitsManagement: string;
    trainingExpenses: string;
  };
  loanManagement: {
    provisionCalculation: string;
    collectionCosts: string;
    legalExpenses: string;
  };
  branchManagement: {
    operationalExpenses: string;
    rentAndUtilities: string;
    regionalExpenseAllocation: string;
  };
  treasuryManagement: {
    interestExpenses: string;
    bankCharges: string;
    investmentExpenses: string;
  };
  generalLedger: {
    automaticJournalEntries: string;
    accountCodeMapping: string;
    botReportFeeding: string;
  };
}
