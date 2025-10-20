// Budget Management Service
// Comprehensive budget management for expense categories

import { 
  BudgetCategory, 
  BudgetPeriod, 
  BudgetItem, 
  BudgetAllocation,
  BudgetApproval,
  BudgetVariance,
  BudgetForecast,
  BudgetReport,
  BudgetSettings,
  BudgetTemplate,
  BudgetManagement,
  BudgetAnalysis
} from '../types/budget';
import { ExpenseCategory } from '../types/expense';

export class BudgetService {
  private static instance: BudgetService;
  private budgetData: BudgetManagement | null = null;

  private constructor() {
    this.initializeBudgetData();
  }

  public static getInstance(): BudgetService {
    if (!BudgetService.instance) {
      BudgetService.instance = new BudgetService();
    }
    return BudgetService.instance;
  }

  // Initialize budget data
  private initializeBudgetData(): void {
    this.budgetData = {
      currentPeriod: this.createCurrentPeriod(),
      budgetItems: this.createBudgetItems(),
      allocations: this.createBudgetAllocations(),
      approvals: [],
      settings: this.createBudgetSettings(),
      templates: this.createBudgetTemplates()
    };
  }

  // Create current budget period
  private createCurrentPeriod(): BudgetPeriod {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const endOfYear = new Date(now.getFullYear(), 11, 31);

    return {
      id: 'current-year',
      name: `${now.getFullYear()} Annual Budget`,
      startDate: startOfYear,
      endDate: endOfYear,
      isActive: true,
      isLocked: false,
      createdBy: 'system',
      createdAt: new Date()
    };
  }

  // Create budget items for operating expenses only
  private createBudgetItems(): BudgetItem[] {
    const operatingExpenseCategories = [
      { id: 'OP001', name: 'Salaries and Benefits', budgetedAmount: 850000 },
      { id: 'OP002', name: 'Rent and Utilities', budgetedAmount: 220000 },
      { id: 'OP003', name: 'Transport and Communication', budgetedAmount: 140000 },
      { id: 'OP004', name: 'Office Supplies', budgetedAmount: 90000 },
      { id: 'OP005', name: 'Training and Development', budgetedAmount: 100000 },
      { id: 'OP006', name: 'Loan Loss Provision', budgetedAmount: 180000 },
      { id: 'OP007', name: 'Depreciation', budgetedAmount: 100000 },
      { id: 'OP008', name: 'Audit and Legal', budgetedAmount: 160000 },
      { id: 'OP009', name: 'Advertising and Marketing', budgetedAmount: 75000 },
      { id: 'OP010', name: 'Insurance Premiums', budgetedAmount: 100000 },
      { id: 'OP011', name: 'Bank Charges and Fees', budgetedAmount: 5000 },
      { id: 'OP012', name: 'Board and Committee Expenses', budgetedAmount: 60000 },
      { id: 'OP013', name: 'Security Services', budgetedAmount: 40000 },
      { id: 'OP014', name: 'Repairs and Maintenance', budgetedAmount: 30000 },
      { id: 'OP015', name: 'Other Operating Expenses', budgetedAmount: 250000 }
    ];

    return operatingExpenseCategories.map(category => {
      const actualAmount = Math.floor(category.budgetedAmount * (0.8 + Math.random() * 0.4)); // 80-120% of budget
      const committedAmount = Math.floor(actualAmount * 0.1); // 10% committed
      const availableAmount = category.budgetedAmount - actualAmount - committedAmount;
      const varianceAmount = actualAmount - category.budgetedAmount;
      const variancePercentage = (varianceAmount / category.budgetedAmount) * 100;

      return {
        id: `budget-${category.id}`,
        categoryId: category.id,
        categoryName: category.name,
        budgetPeriodId: 'current-year',
        budgetedAmount: category.budgetedAmount,
        actualAmount: actualAmount,
        committedAmount: committedAmount,
        availableAmount: availableAmount,
        varianceAmount: varianceAmount,
        variancePercentage: variancePercentage,
        isOverBudget: actualAmount > category.budgetedAmount,
        lastUpdated: new Date(),
        updatedBy: 'system'
      };
    });
  }

  // Create budget allocations
  private createBudgetAllocations(): BudgetAllocation[] {
    const departments = ['Operations', 'Finance', 'HR', 'IT', 'Marketing', 'Legal'];
    const budgetItems = this.budgetData?.budgetItems || [];

    return budgetItems.flatMap(budgetItem => 
      departments.map((dept, index) => ({
        id: `allocation-${budgetItem.id}-${dept}`,
        budgetItemId: budgetItem.id,
        department: dept,
        allocatedAmount: Math.floor(budgetItem.budgetedAmount * (0.1 + Math.random() * 0.2)), // 10-30% per dept
        usedAmount: Math.floor(budgetItem.actualAmount * (0.1 + Math.random() * 0.2)),
        remainingAmount: 0, // Will be calculated
        percentage: 0 // Will be calculated
      }))
    );
  }

  // Create budget settings
  private createBudgetSettings(): BudgetSettings {
    return {
      allowOverBudget: false,
      overBudgetThreshold: 10, // 10% over budget threshold
      requireApprovalForOverBudget: true,
      autoLockPeriod: 30, // 30 days
      notificationThreshold: 80, // 80% utilization
      escalationRules: [
        {
          id: 'rule-1',
          condition: 'over_budget',
          threshold: 10,
          escalationLevel: 1,
          approvers: ['Finance Manager'],
          notificationRequired: true
        },
        {
          id: 'rule-2',
          condition: 'over_budget',
          threshold: 20,
          escalationLevel: 2,
          approvers: ['CFO'],
          notificationRequired: true
        }
      ]
    };
  }

  // Create budget templates
  private createBudgetTemplates(): BudgetTemplate[] {
    return [
      {
        id: 'template-1',
        name: 'Standard Operating Budget',
        description: 'Standard budget template for operating expenses',
        isDefault: true,
        createdBy: 'system',
        createdAt: new Date(),
        categories: [
          { categoryId: 'OP001', categoryName: 'Salaries and Benefits', defaultAmount: 850000, percentage: 40, isRequired: true },
          { categoryId: 'OP002', categoryName: 'Rent and Utilities', defaultAmount: 220000, percentage: 10, isRequired: true },
          { categoryId: 'OP003', categoryName: 'Transport and Communication', defaultAmount: 140000, percentage: 7, isRequired: false },
          { categoryId: 'OP004', categoryName: 'Office Supplies', defaultAmount: 90000, percentage: 4, isRequired: false }
        ]
      }
    ];
  }

  // Get budget management data
  public getBudgetManagement(): BudgetManagement | null {
    return this.budgetData;
  }

  // Get budget items for a specific period
  public getBudgetItems(periodId?: string): BudgetItem[] {
    if (!this.budgetData) return [];
    
    if (periodId) {
      return this.budgetData.budgetItems.filter(item => item.budgetPeriodId === periodId);
    }
    
    return this.budgetData.budgetItems;
  }

  // Get budget categories (only operating expenses)
  public getBudgetCategories(): BudgetCategory[] {
    return [
      { id: 'OP001', name: 'Salaries and Benefits', description: 'Employee compensation and benefits', categoryCode: 'OP001', isBudgetable: true, budgetType: 'operating' },
      { id: 'OP002', name: 'Rent and Utilities', description: 'Office rent and utility expenses', categoryCode: 'OP002', isBudgetable: true, budgetType: 'operating' },
      { id: 'OP003', name: 'Transport and Communication', description: 'Transportation and communication costs', categoryCode: 'OP003', isBudgetable: true, budgetType: 'operating' },
      { id: 'OP004', name: 'Office Supplies', description: 'Office materials and supplies', categoryCode: 'OP004', isBudgetable: true, budgetType: 'operating' },
      { id: 'OP005', name: 'Training and Development', description: 'Employee training and development', categoryCode: 'OP005', isBudgetable: true, budgetType: 'operating' },
      { id: 'OP006', name: 'Loan Loss Provision', description: 'Provisions for loan losses', categoryCode: 'OP006', isBudgetable: true, budgetType: 'operating' },
      { id: 'OP007', name: 'Depreciation', description: 'Depreciation of fixed assets', categoryCode: 'OP007', isBudgetable: true, budgetType: 'operating' },
      { id: 'OP008', name: 'Audit and Legal', description: 'Audit and legal services', categoryCode: 'OP008', isBudgetable: true, budgetType: 'operating' },
      { id: 'OP009', name: 'Advertising and Marketing', description: 'Marketing and advertising expenses', categoryCode: 'OP009', isBudgetable: true, budgetType: 'operating' },
      { id: 'OP010', name: 'Insurance Premiums', description: 'Insurance premiums and coverage', categoryCode: 'OP010', isBudgetable: true, budgetType: 'operating' },
      { id: 'OP011', name: 'Bank Charges and Fees', description: 'Banking fees and charges', categoryCode: 'OP011', isBudgetable: true, budgetType: 'operating' },
      { id: 'OP012', name: 'Board and Committee Expenses', description: 'Board and committee related expenses', categoryCode: 'OP012', isBudgetable: true, budgetType: 'operating' },
      { id: 'OP013', name: 'Security Services', description: 'Security and safety services', categoryCode: 'OP013', isBudgetable: true, budgetType: 'operating' },
      { id: 'OP014', name: 'Repairs and Maintenance', description: 'Repairs and maintenance expenses', categoryCode: 'OP014', isBudgetable: true, budgetType: 'operating' },
      { id: 'OP015', name: 'Other Operating Expenses', description: 'Other miscellaneous operating expenses', categoryCode: 'OP015', isBudgetable: true, budgetType: 'operating' }
    ];
  }

  // Get budget variance analysis
  public getBudgetVarianceAnalysis(): BudgetVariance[] {
    if (!this.budgetData) return [];

    return this.budgetData.budgetItems.map(item => {
      const trend = item.varianceAmount < 0 ? 'favorable' : item.varianceAmount > 0 ? 'unfavorable' : 'neutral';
      const severity = Math.abs(item.variancePercentage) < 5 ? 'low' : 
                      Math.abs(item.variancePercentage) < 15 ? 'medium' : 
                      Math.abs(item.variancePercentage) < 25 ? 'high' : 'critical';

      return {
        categoryId: item.categoryId,
        categoryName: item.categoryName,
        budgetedAmount: item.budgetedAmount,
        actualAmount: item.actualAmount,
        varianceAmount: item.varianceAmount,
        variancePercentage: item.variancePercentage,
        trend,
        severity
      };
    });
  }

  // Get budget forecast analysis
  public getBudgetForecastAnalysis(): BudgetForecast[] {
    if (!this.budgetData) return [];

    const now = new Date();
    const endOfYear = new Date(now.getFullYear(), 11, 31);
    const daysRemaining = Math.ceil((endOfYear.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    return this.budgetData.budgetItems.map(item => {
      const burnRate = item.actualAmount / (365 - daysRemaining); // Daily burn rate
      const projectedSpend = item.actualAmount + (burnRate * daysRemaining);
      const budgetRemaining = item.budgetedAmount - item.actualAmount;
      const projectedOverspend = projectedSpend > item.budgetedAmount;

      return {
        categoryId: item.categoryId,
        categoryName: item.categoryName,
        currentSpend: item.actualAmount,
        projectedSpend: projectedSpend,
        budgetRemaining: budgetRemaining,
        daysRemaining: daysRemaining,
        burnRate: burnRate,
        projectedOverspend: projectedOverspend
      };
    });
  }

  // Create budget report
  public createBudgetReport(): BudgetReport {
    if (!this.budgetData) {
      throw new Error('Budget data not initialized');
    }

    const totalBudget = this.budgetData.budgetItems.reduce((sum, item) => sum + item.budgetedAmount, 0);
    const totalActual = this.budgetData.budgetItems.reduce((sum, item) => sum + item.actualAmount, 0);
    const totalVariance = totalActual - totalBudget;
    const variancePercentage = (totalVariance / totalBudget) * 100;

    const varianceAnalysis = this.getBudgetVarianceAnalysis();
    const forecastAnalysis = this.getBudgetForecastAnalysis();

    const overBudgetCategories = varianceAnalysis.filter(v => v.varianceAmount > 0);
    const underBudgetCategories = varianceAnalysis.filter(v => v.varianceAmount < 0);

    return {
      period: this.budgetData.currentPeriod!,
      totalBudget,
      totalActual,
      totalVariance,
      variancePercentage,
      categories: varianceAnalysis,
      forecasts: forecastAnalysis,
      overBudgetCategories,
      underBudgetCategories
    };
  }

  // Update budget item
  public updateBudgetItem(itemId: string, updates: Partial<BudgetItem>): boolean {
    if (!this.budgetData) return false;

    const itemIndex = this.budgetData.budgetItems.findIndex(item => item.id === itemId);
    if (itemIndex === -1) return false;

    this.budgetData.budgetItems[itemIndex] = {
      ...this.budgetData.budgetItems[itemIndex],
      ...updates,
      lastUpdated: new Date()
    };

    return true;
  }

  // Create new budget period
  public createBudgetPeriod(period: Omit<BudgetPeriod, 'id' | 'createdAt'>): BudgetPeriod {
    const newPeriod: BudgetPeriod = {
      ...period,
      id: `period-${Date.now()}`,
      createdAt: new Date()
    };

    if (this.budgetData) {
      this.budgetData.currentPeriod = newPeriod;
    }

    return newPeriod;
  }

  // Get budget analysis
  public getBudgetAnalysis(): BudgetAnalysis {
    if (!this.budgetData) {
      throw new Error('Budget data not initialized');
    }

    const totalBudget = this.budgetData.budgetItems.reduce((sum, item) => sum + item.budgetedAmount, 0);
    const totalActual = this.budgetData.budgetItems.reduce((sum, item) => sum + item.actualAmount, 0);
    const totalCommitted = this.budgetData.budgetItems.reduce((sum, item) => sum + item.committedAmount, 0);
    const totalAvailable = this.budgetData.budgetItems.reduce((sum, item) => sum + item.availableAmount, 0);
    const utilizationRate = (totalActual / totalBudget) * 100;

    const varianceAnalysis = this.getBudgetVarianceAnalysis();
    const forecastAnalysis = this.getBudgetForecastAnalysis();

    const recommendations = this.generateRecommendations(varianceAnalysis, forecastAnalysis);

    return {
      period: this.budgetData.currentPeriod!,
      totalBudget,
      totalActual,
      totalCommitted,
      totalAvailable,
      utilizationRate,
      varianceAnalysis,
      forecastAnalysis,
      recommendations
    };
  }

  // Generate budget recommendations
  private generateRecommendations(varianceAnalysis: BudgetVariance[], forecastAnalysis: BudgetForecast[]): string[] {
    const recommendations: string[] = [];

    // Check for over-budget categories
    const overBudgetCategories = varianceAnalysis.filter(v => v.varianceAmount > 0);
    if (overBudgetCategories.length > 0) {
      recommendations.push(`Review ${overBudgetCategories.length} categories that are over budget`);
    }

    // Check for projected overspend
    const projectedOverspend = forecastAnalysis.filter(f => f.projectedOverspend);
    if (projectedOverspend.length > 0) {
      recommendations.push(`Take action on ${projectedOverspend.length} categories projected to overspend`);
    }

    // Check for high variance
    const highVariance = varianceAnalysis.filter(v => Math.abs(v.variancePercentage) > 20);
    if (highVariance.length > 0) {
      recommendations.push(`Investigate ${highVariance.length} categories with high variance (>20%)`);
    }

    return recommendations;
  }
}

// Export singleton instance
export const budgetService = BudgetService.getInstance();




























