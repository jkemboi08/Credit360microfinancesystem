// Budget Management Types
// Comprehensive budget system for expense management

export interface BudgetCategory {
  id: string;
  name: string;
  description: string;
  categoryCode: string;
  isBudgetable: boolean;
  budgetType: 'operating' | 'interest' | 'tax';
  parentCategory?: string;
}

export interface BudgetPeriod {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  isLocked: boolean;
  createdBy: string;
  createdAt: Date;
}

export interface BudgetItem {
  id: string;
  categoryId: string;
  categoryName: string;
  budgetPeriodId: string;
  budgetedAmount: number;
  actualAmount: number;
  committedAmount: number;
  availableAmount: number;
  varianceAmount: number;
  variancePercentage: number;
  isOverBudget: boolean;
  lastUpdated: Date;
  updatedBy: string;
}

export interface BudgetAllocation {
  id: string;
  budgetItemId: string;
  department: string;
  allocatedAmount: number;
  usedAmount: number;
  remainingAmount: number;
  percentage: number;
}

export interface BudgetApproval {
  id: string;
  budgetItemId: string;
  requestedAmount: number;
  approvedAmount: number;
  status: 'pending' | 'approved' | 'rejected' | 'partially_approved';
  requestedBy: string;
  approvedBy?: string;
  requestedDate: Date;
  approvedDate?: Date;
  comments?: string;
}

export interface BudgetVariance {
  categoryId: string;
  categoryName: string;
  budgetedAmount: number;
  actualAmount: number;
  varianceAmount: number;
  variancePercentage: number;
  trend: 'favorable' | 'unfavorable' | 'neutral';
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface BudgetForecast {
  categoryId: string;
  categoryName: string;
  currentSpend: number;
  projectedSpend: number;
  budgetRemaining: number;
  daysRemaining: number;
  burnRate: number;
  projectedOverspend: boolean;
}

export interface BudgetReport {
  period: BudgetPeriod;
  totalBudget: number;
  totalActual: number;
  totalVariance: number;
  variancePercentage: number;
  categories: BudgetVariance[];
  forecasts: BudgetForecast[];
  overBudgetCategories: BudgetVariance[];
  underBudgetCategories: BudgetVariance[];
}

export interface BudgetSettings {
  allowOverBudget: boolean;
  overBudgetThreshold: number;
  requireApprovalForOverBudget: boolean;
  autoLockPeriod: number; // days
  notificationThreshold: number; // percentage
  escalationRules: BudgetEscalationRule[];
}

export interface BudgetEscalationRule {
  id: string;
  condition: string;
  threshold: number;
  escalationLevel: number;
  approvers: string[];
  notificationRequired: boolean;
}

export interface BudgetTemplate {
  id: string;
  name: string;
  description: string;
  categories: BudgetTemplateItem[];
  isDefault: boolean;
  createdBy: string;
  createdAt: Date;
}

export interface BudgetTemplateItem {
  categoryId: string;
  categoryName: string;
  defaultAmount: number;
  percentage: number;
  isRequired: boolean;
}

// Budget Management Interface
export interface BudgetManagement {
  currentPeriod: BudgetPeriod | null;
  budgetItems: BudgetItem[];
  allocations: BudgetAllocation[];
  approvals: BudgetApproval[];
  settings: BudgetSettings;
  templates: BudgetTemplate[];
}

// Budget Analysis Interface
export interface BudgetAnalysis {
  period: BudgetPeriod;
  totalBudget: number;
  totalActual: number;
  totalCommitted: number;
  totalAvailable: number;
  utilizationRate: number;
  varianceAnalysis: BudgetVariance[];
  forecastAnalysis: BudgetForecast[];
  recommendations: string[];
}




























