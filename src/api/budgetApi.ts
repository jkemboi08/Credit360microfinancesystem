// Budget Management API
// RESTful API endpoints for budget management system

import { supabase } from '../lib/supabase';

export interface Budget {
  id: string;
  title: string;
  description: string;
  fiscal_year: number;
  total_budget: number;
  status: 'draft' | 'active' | 'archived' | 'approved';
  created_by: string;
  created_at: string;
  updated_at: string;
  approved_by?: string;
  approved_at?: string;
  department_id?: string;
  branch_id?: string;
}

export interface BudgetCategory {
  id: string;
  budget_id: string;
  category_name: string;
  category_type: 'operating' | 'capital' | 'financial';
  parent_category_id?: string;
  budgeted_amount: number;
  actual_spend: number;
  variance: number;
  variance_percentage: number;
}

export interface Expenditure {
  id: string;
  budget_id: string;
  category_id: string;
  description: string;
  amount: number;
  expenditure_date: string;
  status: 'pending' | 'approved' | 'rejected' | 'paid';
  vendor_name?: string;
  invoice_number?: string;
  notes?: string;
}

export interface BudgetSummary {
  total_budgeted: number;
  total_actual: number;
  total_variance: number;
  variance_percentage: number;
}

export interface MonthlyData {
  month_name: string;
  month_number: number;
  budgeted_amount: number;
  actual_amount: number;
  variance: number;
}

export interface OverBudgetCategory {
  category_name: string;
  budgeted_amount: number;
  actual_spend: number;
  variance: number;
  variance_percentage: number;
}

export interface BudgetAdjustment {
  id: string;
  budget_id: string;
  category_id: string;
  adjustment_type: 'increase' | 'decrease' | 'transfer';
  previous_amount: number;
  new_amount: number;
  adjustment_amount: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

// Budget CRUD Operations
export const budgetApi = {
  // Get all budgets for the current user
  async getBudgets(): Promise<Budget[]> {
    const { data, error } = await supabase
      .from('budgets')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Get a specific budget by ID
  async getBudget(id: string): Promise<Budget | null> {
    const { data, error } = await supabase
      .from('budgets')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  // Create a new budget
  async createBudget(budget: Omit<Budget, 'id' | 'created_at' | 'updated_at'>): Promise<Budget> {
    const { data, error } = await supabase
      .from('budgets')
      .insert([budget])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update a budget
  async updateBudget(id: string, updates: Partial<Budget>): Promise<Budget> {
    const { data, error } = await supabase
      .from('budgets')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete a budget
  async deleteBudget(id: string): Promise<void> {
    const { error } = await supabase
      .from('budgets')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Get budget summary
  async getBudgetSummary(budgetId: string): Promise<BudgetSummary> {
    const { data, error } = await supabase
      .rpc('calculate_budget_totals', { budget_uuid: budgetId });

    if (error) throw error;
    return data[0] || {
      total_budgeted: 0,
      total_actual: 0,
      total_variance: 0,
      variance_percentage: 0
    };
  },

  // Get monthly budget data
  async getMonthlyData(budgetId: string, year: number): Promise<MonthlyData[]> {
    const { data, error } = await supabase
      .rpc('get_budget_summary_by_month', { 
        budget_uuid: budgetId, 
        year_param: year 
      });

    if (error) throw error;
    return data || [];
  },

  // Get top over-budget categories
  async getOverBudgetCategories(budgetId: string, limit: number = 3): Promise<OverBudgetCategory[]> {
    const { data, error } = await supabase
      .rpc('get_top_over_budget_categories', { 
        budget_uuid: budgetId, 
        limit_count: limit 
      });

    if (error) throw error;
    return data || [];
  }
};

// Budget Category Operations
export const categoryApi = {
  // Get categories for a budget
  async getCategories(budgetId: string): Promise<BudgetCategory[]> {
    const { data, error } = await supabase
      .from('budget_categories')
      .select('*')
      .eq('budget_id', budgetId)
      .order('category_name');

    if (error) throw error;
    return data || [];
  },

  // Create a new category
  async createCategory(category: Omit<BudgetCategory, 'id' | 'variance' | 'variance_percentage'>): Promise<BudgetCategory> {
    const { data, error } = await supabase
      .from('budget_categories')
      .insert([category])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update a category
  async updateCategory(id: string, updates: Partial<BudgetCategory>): Promise<BudgetCategory> {
    const { data, error } = await supabase
      .from('budget_categories')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete a category
  async deleteCategory(id: string): Promise<void> {
    const { error } = await supabase
      .from('budget_categories')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};

// Expenditure Operations
export const expenditureApi = {
  // Get expenditures for a budget
  async getExpenditures(budgetId: string, categoryId?: string): Promise<Expenditure[]> {
    let query = supabase
      .from('expenditures')
      .select('*')
      .eq('budget_id', budgetId)
      .order('expenditure_date', { ascending: false });

    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  },

  // Create a new expenditure
  async createExpenditure(expenditure: Omit<Expenditure, 'id' | 'created_at' | 'updated_at'>): Promise<Expenditure> {
    const { data, error } = await supabase
      .from('expenditures')
      .insert([expenditure])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update an expenditure
  async updateExpenditure(id: string, updates: Partial<Expenditure>): Promise<Expenditure> {
    const { data, error } = await supabase
      .from('expenditures')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete an expenditure
  async deleteExpenditure(id: string): Promise<void> {
    const { error } = await supabase
      .from('expenditures')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Approve an expenditure
  async approveExpenditure(id: string, approvedBy: string): Promise<Expenditure> {
    const { data, error } = await supabase
      .from('expenditures')
      .update({ 
        status: 'approved',
        approved_by: approvedBy,
        approved_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};

// Budget Adjustment Operations
export const adjustmentApi = {
  // Get budget adjustments
  async getAdjustments(budgetId: string): Promise<BudgetAdjustment[]> {
    const { data, error } = await supabase
      .from('budget_adjustments')
      .select('*')
      .eq('budget_id', budgetId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Create a budget adjustment
  async createAdjustment(adjustment: Omit<BudgetAdjustment, 'id' | 'created_at'>): Promise<BudgetAdjustment> {
    const { data, error } = await supabase
      .from('budget_adjustments')
      .insert([adjustment])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Approve a budget adjustment
  async approveAdjustment(id: string, approvedBy: string): Promise<BudgetAdjustment> {
    const { data, error } = await supabase
      .from('budget_adjustments')
      .update({ 
        status: 'approved',
        approved_by: approvedBy,
        approved_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Reject a budget adjustment
  async rejectAdjustment(id: string): Promise<BudgetAdjustment> {
    const { data, error } = await supabase
      .from('budget_adjustments')
      .update({ status: 'rejected' })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};

// Permission and Role Management
export const permissionApi = {
  // Get user role
  async getUserRole(userId: string): Promise<string | null> {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    return data?.role || null;
  },

  // Check if user can access budget
  async canAccessBudget(userId: string, budgetId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('budgets')
      .select('user_id, department_id, branch_id')
      .eq('id', budgetId)
      .single();

    if (error) return false;

    // Check if user owns the budget
    if (data.user_id === userId) return true;

    // Check department/branch permissions
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role, department_id, branch_id')
      .eq('user_id', userId)
      .single();

    if (!roleData) return false;

    // Business owners can access all budgets
    if (roleData.role === 'business_owner') return true;

    // Managers can access budgets in their department/branch
    if (roleData.role === 'manager') {
      return (data.department_id && roleData.department_id === data.department_id) ||
             (data.branch_id && roleData.branch_id === data.branch_id);
    }

    return false;
  },

  // Check if user can edit budget
  async canEditBudget(userId: string, budgetId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('budgets')
      .select('user_id, status')
      .eq('id', budgetId)
      .single();

    if (error) return false;

    // Only draft budgets can be edited
    if (data.status !== 'draft') return false;

    // Check ownership
    if (data.user_id === userId) return true;

    // Check role permissions
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .single();

    return roleData?.role === 'business_owner';
  }
};

// Analytics and Reporting
export const analyticsApi = {
  // Get budget performance metrics
  async getPerformanceMetrics(budgetId: string): Promise<{
    totalBudget: number;
    totalSpent: number;
    remainingBudget: number;
    variancePercentage: number;
    onTrackCategories: number;
    overBudgetCategories: number;
    underBudgetCategories: number;
  }> {
    const summary = await budgetApi.getBudgetSummary(budgetId);
    const categories = await categoryApi.getCategories(budgetId);

    const onTrack = categories.filter(cat => Math.abs(cat.variance_percentage) <= 5).length;
    const overBudget = categories.filter(cat => cat.variance_percentage < -5).length;
    const underBudget = categories.filter(cat => cat.variance_percentage > 5).length;

    return {
      totalBudget: summary.total_budgeted,
      totalSpent: summary.total_actual,
      remainingBudget: summary.total_variance,
      variancePercentage: summary.variance_percentage,
      onTrackCategories: onTrack,
      overBudgetCategories: overBudget,
      underBudgetCategories: underBudget
    };
  },

  // Get spending trends
  async getSpendingTrends(budgetId: string, months: number = 12): Promise<{
    month: string;
    budgeted: number;
    actual: number;
    variance: number;
  }[]> {
    const { data, error } = await supabase
      .from('expenditures')
      .select('amount, expenditure_date')
      .eq('budget_id', budgetId)
      .eq('status', 'approved')
      .gte('expenditure_date', new Date(Date.now() - months * 30 * 24 * 60 * 60 * 1000).toISOString())
      .order('expenditure_date');

    if (error) throw error;

    // Group by month and calculate totals
    const monthlyData: { [key: string]: { budgeted: number; actual: number } } = {};
    
    data?.forEach(expenditure => {
      const month = new Date(expenditure.expenditure_date).toISOString().slice(0, 7);
      if (!monthlyData[month]) {
        monthlyData[month] = { budgeted: 0, actual: 0 };
      }
      monthlyData[month].actual += expenditure.amount;
    });

    return Object.entries(monthlyData).map(([month, data]) => ({
      month,
      budgeted: data.budgeted,
      actual: data.actual,
      variance: data.budgeted - data.actual
    }));
  }
};

