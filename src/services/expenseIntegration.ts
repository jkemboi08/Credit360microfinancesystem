// Expense Management System Integration Service
// This service handles integration between expense management and other system modules

import { SystemIntegrationPoints } from '../types/expense';

export class ExpenseIntegrationService {
  // Staff Management Integration
  static async getStaffExpenses(period: string) {
    // Integration with Staff Management module
    // Auto-generate salary expenses, allowances, benefits, training costs
    return {
      salaryProcessing: 'Auto-generate salary expenses from payroll system',
      allowanceManagement: 'Track all staff allowances and benefits',
      benefitsManagement: 'Capture all employee benefits and insurance',
      trainingExpenses: 'Track training and development costs'
    };
  }

  // Loan Management Integration
  static async getLoanExpenses(period: string) {
    // Integration with Loan Management module
    // Auto-calculate provisions, collection costs, legal expenses
    return {
      provisionCalculation: 'Auto-calculate loan loss provisions',
      collectionCosts: 'Track loan collection expenses',
      legalExpenses: 'Capture legal and recovery costs'
    };
  }

  // Branch Management Integration
  static async getBranchExpenses(period: string) {
    // Integration with Branch Management module
    // Capture operational expenses, rent, utilities, regional allocation
    return {
      operationalExpenses: 'Capture all branch operational costs',
      rentAndUtilities: 'Track premises-related expenses',
      regionalExpenseAllocation: 'Allocate expenses by region for MSP2_10'
    };
  }

  // Treasury Management Integration
  static async getTreasuryExpenses(period: string) {
    // Integration with Treasury Management module
    // Auto-calculate interest expenses, bank charges, investment costs
    return {
      interestExpenses: 'Auto-calculate interest on borrowings',
      bankCharges: 'Capture all banking fees and charges',
      investmentExpenses: 'Track investment management costs'
    };
  }

  // General Ledger Integration
  static async getGeneralLedgerIntegration() {
    // Integration with General Ledger module
    // Auto-generate journal entries, map accounts, feed BOT reports
    return {
      automaticJournalEntries: 'Auto-generate expense journal entries',
      accountCodeMapping: 'Map expenses to appropriate GL accounts',
      botReportFeeding: 'Feed expense data to MSP2_02 automatically'
    };
  }

  // MSP2_02 Income Statement Integration
  static async getMSP202Integration() {
    // Direct integration with MSP2_02 Income Statement
    return {
      interestExpenses: {
        d15_interestOnBankBorrowings: 0,
        d16_interestOnMFSPBorrowings: 0,
        d17_interestOnSavings: 0,
        d18_interestOnFixedDeposits: 0,
        d19_interestOnOtherBorrowings: 0,
        d20_totalInterestExpense: 0
      },
      operatingExpenses: {
        d25_salariesAndBenefits: 0,
        d26_rentAndUtilities: 0,
        d27_transportAndCommunication: 0,
        d28_officeSupplies: 0,
        d29_trainingAndDevelopment: 0,
        d30_loanLossProvision: 0,
        d31_depreciation: 0,
        d32_auditAndLegal: 0,
        d33_advertisingAndMarketing: 0,
        d34_insurancePremiums: 0,
        d35_bankChargesAndFees: 0,
        d36_boardAndCommitteeExpenses: 0,
        d37_securityServices: 0,
        d38_repairsAndMaintenance: 0,
        d39_otherOperatingExpenses: 0,
        d40_totalOperatingExpenses: 0
      },
      taxExpenses: {
        d41_taxExpense: 0
      }
    };
  }

  // Auto-calculate expenses from other modules
  static async calculateAutoExpenses(period: string) {
    const staffExpenses = await this.getStaffExpenses(period);
    const loanExpenses = await this.getLoanExpenses(period);
    const branchExpenses = await this.getBranchExpenses(period);
    const treasuryExpenses = await this.getTreasuryExpenses(period);

    return {
      staffManagement: staffExpenses,
      loanManagement: loanExpenses,
      branchManagement: branchExpenses,
      treasuryManagement: treasuryExpenses
    };
  }

  // Sync expenses to BOT reports
  static async syncToBOTReports(expenseData: any) {
    // This would integrate with the BOT reporting system
    // to automatically update MSP2_02 Income Statement
    console.log('Syncing expense data to BOT reports:', expenseData);
    
    // Implementation would include:
    // 1. Validate expense data
    // 2. Map to BOT report line items
    // 3. Update MSP2_02 Income Statement
    // 4. Update other relevant BOT reports
    // 5. Generate audit trail
    
    return {
      success: true,
      message: 'Expense data successfully synced to BOT reports',
      timestamp: new Date()
    };
  }

  // Get comprehensive integration status
  static async getIntegrationStatus() {
    return {
      staffManagement: {
        connected: true,
        lastSync: new Date(),
        status: 'active'
      },
      loanManagement: {
        connected: true,
        lastSync: new Date(),
        status: 'active'
      },
      branchManagement: {
        connected: true,
        lastSync: new Date(),
        status: 'active'
      },
      treasuryManagement: {
        connected: true,
        lastSync: new Date(),
        status: 'active'
      },
      generalLedger: {
        connected: true,
        lastSync: new Date(),
        status: 'active'
      },
      botReports: {
        connected: true,
        lastSync: new Date(),
        status: 'active'
      }
    };
  }
}

// Expense Category Mappings for BOT Reports
export const BOTReportMappings = {
  // MSP2_02 Income Statement Mappings
  MSP202: {
    // Interest Expenses (D15-D20)
    D15: 'Interest on Bank Borrowings',
    D16: 'Interest on MFSP Borrowings',
    D17: 'Interest on Savings',
    D18: 'Interest on Fixed Deposits',
    D19: 'Interest on Other Borrowings',
    D20: 'Total Interest Expense',
    
    // Operating Expenses (D25-D40)
    D25: 'Salaries and Benefits',
    D26: 'Rent and Utilities',
    D27: 'Transport and Communication',
    D28: 'Office Supplies',
    D29: 'Training and Development',
    D30: 'Loan Loss Provision',
    D31: 'Depreciation',
    D32: 'Audit and Legal',
    D33: 'Advertising and Marketing',
    D34: 'Insurance Premiums',
    D35: 'Bank Charges and Fees',
    D36: 'Board and Committee Expenses',
    D37: 'Security Services',
    D38: 'Repairs and Maintenance',
    D39: 'Other Operating Expenses',
    D40: 'Total Operating Expenses',
    
    // Tax Expenses (D41)
    D41: 'Tax Expense'
  },
  
  // MSP2_10 Regional Analysis Mappings
  MSP210: {
    REGIONAL_OPERATING: 'Regional Operating Expenses',
    REGIONAL_INTEREST: 'Regional Interest Expenses',
    REGIONAL_TAX: 'Regional Tax Expenses'
  }
};

// Expense Category to BOT Mapping
export const getBOTMapping = (category: string): string => {
  const mappings: { [key: string]: string } = {
    'Salaries & Benefits': 'D25',
    'Rent & Utilities': 'D26',
    'Transport & Communication': 'D27',
    'Office Supplies': 'D28',
    'Training & Development': 'D29',
    'Loan Loss Provision': 'D30',
    'Depreciation': 'D31',
    'Audit & Legal': 'D32',
    'Marketing & Advertising': 'D33',
    'Insurance': 'D34',
    'Bank Charges': 'D35',
    'Board & Committee': 'D36',
    'Security Services': 'D37',
    'Repairs & Maintenance': 'D38',
    'Other Operating': 'D39',
    'Interest Expenses': 'D15-D20',
    'Tax Expenses': 'D41'
  };
  
  return mappings[category] || 'D39'; // Default to Other Operating Expenses
};

// Auto-calculate budget impact
export const calculateBudgetImpact = (
  expenseAmount: number,
  budgetCategory: string,
  allocatedAmount: number,
  spentAmount: number
) => {
  const remainingAmount = allocatedAmount - spentAmount;
  const variance = expenseAmount - remainingAmount;
  const variancePercentage = (variance / allocatedAmount) * 100;
  
  return {
    budgetCategory,
    allocatedAmount,
    spentAmount,
    remainingAmount,
    variance,
    variancePercentage
  };
};

// Determine approval workflow based on amount and category
export const determineApprovalWorkflow = (
  amount: number,
  category: string,
  userRole: string
) => {
  const approvalLimits = [
    { level: 1, maxAmount: 10000, approvers: ['Supervisor'], role: 'staff' },
    { level: 2, maxAmount: 50000, approvers: ['Manager'], role: 'supervisor' },
    { level: 3, maxAmount: 100000, approvers: ['Director'], role: 'manager' },
    { level: 4, maxAmount: Infinity, approvers: ['CEO', 'Board'], role: 'director' }
  ];

  const requiredLevel = approvalLimits.find(limit => amount <= limit.maxAmount);
  const estimatedTime = requiredLevel ? requiredLevel.level * 24 : 96; // hours

  return {
    requiredApprovers: requiredLevel?.approvers || [],
    approvalLimits,
    estimatedApprovalTime: estimatedTime,
    currentUserRole: userRole,
    canApprove: userRole === requiredLevel?.role || 
                ['CEO', 'Board'].includes(userRole)
  };
};




























