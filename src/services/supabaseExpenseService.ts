// Supabase Expense Management Service
// Real-time expense data integration with Supabase

import { supabase } from '../lib/supabaseClient';
import { 
  ExpenseFormData, 
  PendingExpense
} from '../types/expense';
import {
  BudgetItem, 
  BudgetPeriod, 
  BudgetVariance
} from '../types/budget';

export interface SupabaseExpenseCategory {
  id: string;
  category_code: string;
  category_name: string;
  description: string;
  msp202_line_item: string;
  is_budgetable: boolean;
  budget_type: 'operating' | 'interest' | 'tax';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SupabaseBudgetItem {
  id: string;
  category_id: string;
  budget_period_id: string;
  budgeted_amount: number;
  actual_amount: number;
  committed_amount: number;
  available_amount: number;
  variance_amount: number;
  variance_percentage: number;
  is_over_budget: boolean;
  last_updated: string;
  updated_by: string;
  created_at: string;
}

export interface SupabaseExpense {
  id: string;
  category_id: string;
  amount: number;
  currency: string;
  expense_date: string;
  description: string;
  vendor_name: string;
  vendor_id?: string;
  supporting_documents: any[];
  approval_status: 'draft' | 'pending' | 'approved' | 'rejected';
  submitted_by: string;
  submitted_at: string;
  approved_by?: string;
  approved_at?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
}

export class SupabaseExpenseService {
  // Get all expense categories
  static async getExpenseCategories(): Promise<SupabaseExpenseCategory[]> {
    try {
      const { data, error } = await supabase
        .from('expense_categories')
        .select('*')
        .eq('is_active', true)
        .order('category_code');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching expense categories:', error);
      return [];
    }
  }

  // Get budgetable categories only
  static async getBudgetableCategories(): Promise<SupabaseExpenseCategory[]> {
    try {
      const { data, error } = await supabase
        .from('expense_categories')
        .select('*')
        .eq('is_active', true)
        .eq('is_budgetable', true)
        .eq('budget_type', 'operating')
        .order('category_code');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching budgetable categories:', error);
      return [];
    }
  }

  // Get budget categories (from expense categories that are budgetable)
  static async getBudgetCategories(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('expense_categories')
        .select('*')
        .eq('is_active', true)
        .eq('is_budgetable', true)
        .eq('category_type', 'operating')
        .order('category_code');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching budget categories:', error);
      return [];
    }
  }

  // Get current budget period
  static async getCurrentBudgetPeriod(): Promise<BudgetPeriod | null> {
    try {
      const { data, error } = await supabase
        .from('budget_periods')
        .select('*')
        .eq('is_active', true)
        .single();

      if (error) throw error;
      return data ? {
        id: data.id,
        name: data.name,
        startDate: new Date(data.start_date),
        endDate: new Date(data.end_date),
        isActive: data.is_active,
        isLocked: data.is_locked,
        createdBy: data.created_by,
        createdAt: new Date(data.created_at)
      } : null;
    } catch (error) {
      console.error('Error fetching current budget period:', error);
      return null;
    }
  }

  // Get budget items for current period
  static async getBudgetItems(): Promise<BudgetItem[]> {
    try {
      const { data, error } = await supabase
        .from('budget_items')
        .select(`
          *,
          expense_categories(category_name, category_code)
        `)
        .order('created_at');

      if (error) throw error;
      return data?.map(item => ({
        id: item.id,
        categoryId: item.category_id,
        categoryName: item.expense_categories.category_name,
        budgetPeriodId: item.budget_period_id,
        budgetedAmount: item.budgeted_amount,
        actualAmount: item.actual_amount,
        committedAmount: item.committed_amount,
        availableAmount: item.available_amount,
        varianceAmount: item.variance_amount,
        variancePercentage: item.variance_percentage,
        isOverBudget: item.is_over_budget,
        lastUpdated: new Date(item.last_updated),
        updatedBy: item.updated_by
      })) || [];
    } catch (error) {
      console.error('Error fetching budget items:', error);
      return [];
    }
  }

  // Get expenses with filters - TENANT FILTERED
  static async getExpenses(filters: {
    categoryId?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
  } = {}): Promise<SupabaseExpense[]> {
    try {
      // Get current tenant context
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Get user's tenant IDs
      const { data: tenantUsers, error: tenantError } = await supabase
        .from('tenant_users')
        .select('tenant_id')
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (tenantError || !tenantUsers || tenantUsers.length === 0) {
        throw new Error('User not associated with any tenant');
      }

      const tenantIds = tenantUsers.map(tu => tu.tenant_id);

      let query = supabase
        .from('expenses')
        .select('*')
        .in('tenant_id', tenantIds)
        .order('id', { ascending: false });

      if (filters.categoryId) {
        query = query.eq('category_id', filters.categoryId);
      }
      if (filters.status) {
        query = query.eq('approval_status', filters.status);
      }
      if (filters.startDate) {
        query = query.gte('created_at', filters.startDate);
      }
      if (filters.endDate) {
        query = query.lte('created_at', filters.endDate);
      }
      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching expenses:', error);
      return [];
    }
  }

  // Get pending expenses for approval
  static async getPendingExpenses(): Promise<PendingExpense[]> {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select(`
          *,
          expense_categories(category_name, category_code)
        `)
        .eq('approval_status', 'pending')
        .order('id', { ascending: false });

      if (error) throw error;
      return data?.map(expense => ({
        id: expense.id,
        submittedBy: expense.submitted_by || 'Unknown',
        category: expense.expense_categories?.category_name || 'Unknown',
        amount: expense.amount,
        submissionDate: new Date(expense.submitted_at),
        urgency: this.calculateUrgency(expense.amount),
        description: expense.description,
        vendorName: expense.vendor_name,
        documents: expense.supporting_documents || [],
        botImpact: {
          msp202Impact: [],
          otherReportsImpact: []
        },
        budgetImpact: {
          budgetCategory: expense.expense_categories?.category_name || 'Unknown',
          allocatedAmount: 0,
          spentAmount: expense.amount,
          remainingAmount: 0,
          variance: 0,
          variancePercentage: 0
        }
      })) || [];
    } catch (error) {
      console.error('Error fetching pending expenses:', error);
      return [];
    }
  }

  // Get enhanced pending expenses with all related data
  static async getEnhancedPendingExpenses(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select(`
          *,
          expense_categories(
            id,
            category_name,
            category_code,
            description,
            category_type,
            msp202_line_item,
            is_budgetable,
            approval_required,
            approval_limit
          ),
          vendors(
            id,
            vendor_name,
            contact_person,
            email,
            phone,
            address,
            tax_id,
            vendor_type
          )
        `)
        .eq('approval_status', 'pending')
        .order('id', { ascending: false });

      if (error) {
        console.error('Error fetching enhanced pending expenses:', error);
        return [];
      }

      // Transform the data to include enhanced fields
      return data?.map(expense => ({
        // Core expense data
        id: expense.id,
        category_id: expense.category_id,
        amount: expense.amount,
        currency: expense.currency,
        expense_date: expense.created_at,
        description: expense.description,
        vendor_name: expense.vendor_name,
        vendor_id: expense.vendor_id,
        supporting_documents: expense.supporting_documents || [],
        approval_status: expense.status,
        submitted_by: expense.submitted_by,
        submitted_at: expense.submitted_at,
        approved_by: expense.approved_by,
        approved_at: expense.approved_at,
        rejection_reason: expense.rejection_reason,
        created_at: expense.created_at,
        updated_at: expense.updated_at,

        // Related data
        category: expense.expense_categories,
        vendor: expense.vendors,
        audit_trail: [],

        // Enhanced UI fields
        urgency: this.calculateUrgency(expense.amount),
        priority: this.calculatePriority(expense.amount, expense.submitted_at),
        risk_level: this.calculateRiskLevel(expense.amount, expense.vendor_name),
        tags: this.generateTags(expense.description, expense.expense_categories.category_name),
        payment_method: this.determinePaymentMethod(expense.amount),
        expense_type: this.determineExpenseType(expense.description),
        tax_amount: this.calculateTaxAmount(expense.amount),
        tax_rate: 18, // Default VAT rate
        tax_type: 'vat',
        tax_reclaimable: true,
        is_recurring: this.isRecurringExpense(expense.description),
        account_number: this.getAccountNumber(expense.expense_categories.category_code),
        account_id: `acc-${expense.expense_categories.category_code}`,
        employee_id: expense.submitted_by,
        policy_violations: this.checkPolicyViolations(expense),
        compliance_flags: this.checkComplianceFlags(expense),
        ledger_entries: this.generateLedgerEntries(expense),
        budget_impact: this.calculateBudgetImpact(expense),
        bot_impact: this.calculateBOTImpact(expense),
        estimated_approval_time: this.estimateApprovalTime(expense),
        last_modified: expense.updated_at,
        modified_by: expense.submitted_by
      })) || [];
    } catch (error) {
      console.error('Error fetching enhanced pending expenses:', error);
      return [];
    }
  }

  // Calculate urgency based on amount
  private static calculateUrgency(amount: number): 'low' | 'medium' | 'high' | 'critical' {
    if (amount >= 1000000) return 'critical';
    if (amount >= 500000) return 'high';
    if (amount >= 100000) return 'medium';
    return 'low';
  }

  // Create new expense
  static async createExpense(expenseData: ExpenseFormData): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      // Handle category - if it's a name, look up the ID
      let categoryId = expenseData.category;
      
      console.log('Creating expense with category:', expenseData.category);
      
      // Check if category is a name (string) rather than UUID
      if (expenseData.category && !expenseData.category.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        console.log('Category appears to be a name, looking up ID for:', expenseData.category);
        
        // It's a category name, need to find the ID
        const { data: categoryData, error: categoryError } = await supabase
          .from('expense_categories')
          .select('id')
          .eq('category_name', expenseData.category)
          .eq('is_active', true)
          .single();
        
        if (categoryError || !categoryData) {
          console.error('Category lookup error:', categoryError);
          throw new Error(`Category "${expenseData.category}" not found`);
        }
        
        categoryId = categoryData.id;
        console.log('Found category ID:', categoryId);
      } else {
        console.log('Category appears to be a UUID:', categoryId);
      }

      const { data, error } = await supabase
        .from('expenses')
        .insert({
          category_id: categoryId,
          amount: expenseData.amount,
          currency: 'TZS',
          expense_date: expenseData.expenseDate.toISOString().split('T')[0],
          description: expenseData.description,
          vendor_name: expenseData.vendorName,
          supporting_documents: expenseData.supportingDocuments || [],
          approval_status: 'pending',
          submitted_by: (await supabase.auth.getUser()).data.user?.id || 'system'
        })
        .select('id')
        .single();

      if (error) throw error;

      // Log the expense creation
      await this.logExpenseAction(data.id, 'created', 'Expense created', 'info');

      return { success: true, id: data.id };
    } catch (error) {
      console.error('Error creating expense:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error occurred' };
    }
  }

  // Update expense
  static async updateExpense(id: string, updates: Partial<ExpenseFormData>): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('expenses')
        .update({
          amount: updates.amount,
          expense_date: updates.expenseDate?.toISOString().split('T')[0],
          description: updates.description,
          vendor_name: updates.vendorName,
          approval_status: updates.approvalStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      // Log the expense update
      await this.logExpenseAction(id, 'updated', 'Expense updated', 'info');

      return { success: true };
    } catch (error) {
      console.error('Error updating expense:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error occurred' };
    }
  }

  // Approve expense
  static async approveExpense(id: string, approvedBy: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('expenses')
        .update({
          approval_status: 'approved',
          approved_by: approvedBy,
          approved_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      // Log the approval
      await this.logExpenseAction(id, 'approved', 'Expense approved', 'success');

      return { success: true };
    } catch (error) {
      console.error('Error approving expense:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error occurred' };
    }
  }

  // Reject expense
  static async rejectExpense(id: string, rejectedBy: string, reason: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('expenses')
        .update({
          approval_status: 'rejected',
          approved_by: rejectedBy,
          approved_at: new Date().toISOString(),
          rejection_reason: reason
        })
        .eq('id', id);

      if (error) throw error;

      // Log the rejection
      await this.logExpenseAction(id, 'rejected', `Expense rejected: ${reason}`, 'warning');

      return { success: true };
    } catch (error) {
      console.error('Error rejecting expense:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error occurred' };
    }
  }

  // Update budget item
  static async createBudgetItem(data: {
    categoryId: string;
    budgetedAmount: number;
    actualAmount?: number;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('Creating budget item with data:', data);
      
      // Check if categoryId is a fallback ID and create the category if needed
      if (data.categoryId.startsWith('fallback-')) {
        console.log('Fallback category ID detected, checking if category exists...');
        
        // Map fallback IDs to category names
        const fallbackMap: { [key: string]: string } = {
          'fallback-1': 'Salaries and Benefits',
          'fallback-2': 'Rent and Utilities',
          'fallback-3': 'Transport and Communication',
          'fallback-4': 'Office Supplies',
          'fallback-5': 'Training and Development'
        };
        
        const categoryName = fallbackMap[data.categoryId];
        if (!categoryName) {
          return { success: false, error: 'Invalid fallback category ID' };
        }
        
        // First, check if a category with this name already exists
        const { data: existingCategory, error: checkError } = await supabase
          .from('expense_categories')
          .select('id, category_name, category_code')
          .eq('category_name', categoryName)
          .single();
          
        if (checkError && checkError.code !== 'PGRST116') {
          console.error('Error checking existing category:', checkError);
          return { success: false, error: `Error checking category: ${checkError.message}` };
        }
        
        if (existingCategory) {
          console.log('Category already exists:', existingCategory);
          data.categoryId = existingCategory.id; // Use existing category ID
        } else {
          console.log('Category does not exist, creating new one...');
          // Create the category in the database
          const { data: newCategory, error: categoryError } = await supabase
            .from('expense_categories')
            .insert({
              category_name: categoryName,
              category_code: `OP${data.categoryId.split('-')[1].padStart(3, '0')}`,
              category_type: 'operating',
              is_budgetable: true,
              is_active: true,
              description: `${categoryName} expense category`
            })
            .select()
            .single();
            
          if (categoryError) {
            console.error('Error creating category:', categoryError);
            return { success: false, error: `Error creating category: ${categoryError.message}` };
          }
          
          console.log('Created category:', newCategory);
          data.categoryId = newCategory.id; // Update the categoryId to the real database ID
        }
      }

      // Get current budget period or create one
      let budgetPeriod = await this.getCurrentBudgetPeriod();
      
      if (!budgetPeriod) {
        console.log('No active budget period found, attempting to create one...');
        try {
          // Create a budget period for the current year
          const currentYear = new Date().getFullYear();
          const startDate = new Date(currentYear, 0, 1); // January 1st
          const endDate = new Date(currentYear, 11, 31); // December 31st
          
          const { data: newPeriod, error: periodError } = await supabase
            .from('budget_periods')
            .insert({
              name: `${currentYear} Budget Period`,
              start_date: startDate.toISOString().split('T')[0],
              end_date: endDate.toISOString().split('T')[0],
              is_active: true,
              is_locked: false,
              created_by: (await supabase.auth.getUser()).data.user?.id
            })
            .select()
            .single();

          if (periodError) {
            console.error('Error creating budget period:', periodError);
            // If budget_periods table doesn't exist, continue without it
            if (periodError.code === 'PGRST301' || periodError.message.includes('404')) {
              console.log('Budget periods table not available, creating budget item without period');
              budgetPeriod = null; // Set to null to skip period requirement
            } else {
              throw periodError;
            }
          } else {
            budgetPeriod = {
              id: newPeriod.id,
              name: newPeriod.name,
              startDate: new Date(newPeriod.start_date),
              endDate: new Date(newPeriod.end_date),
              isActive: newPeriod.is_active,
              isLocked: newPeriod.is_locked,
              createdBy: newPeriod.created_by,
              createdAt: new Date(newPeriod.created_at)
            };
            console.log('Created budget period:', budgetPeriod);
          }
        } catch (error) {
          console.error('Error in budget period creation:', error);
          // If there's any error with budget periods, continue without it
          console.log('Continuing without budget period');
          budgetPeriod = null;
        }
      }

      console.log('Using budget period:', budgetPeriod);
      console.log('Inserting budget item with category_id:', data.categoryId);

      // Get current user for created_by field
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.error('User not authenticated:', userError);
        return { success: false, error: 'User not authenticated' };
      }

      // Create budget item with required fields
      const currentYear = new Date().getFullYear();
      const insertData: any = {
        category_id: data.categoryId,
        budgeted_amount: data.budgetedAmount,
        actual_amount: data.actualAmount || 0,
        fiscal_year: currentYear,
        created_by: user.id,
        budget_category_id: data.categoryId // Use category_id as budget_category_id for now
      };

      // Only add budget_period_id if we have a budget period
      if (budgetPeriod) {
        insertData.budget_period_id = budgetPeriod.id;
      }

      const { data: insertedData, error } = await supabase
        .from('budget_items')
        .insert(insertData)
        .select();

      if (error) {
        console.error('Database error:', error);
        throw error;
      }

      console.log('Successfully created budget item:', insertedData);
      return { success: true };
    } catch (error) {
      console.error('Error creating budget item:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error occurred' };
    }
  }

  static async updateBudgetItem(id: string, budgetedAmount: number): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('budget_items')
        .update({
          budgeted_amount: budgetedAmount,
          last_updated: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error updating budget item:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error occurred' };
    }
  }

  // Get expense statistics
  static async getExpenseStatistics(): Promise<{
    totalExpenses: number;
    totalBudget: number;
    varianceAmount: number;
    variancePercentage: number;
    pendingCount: number;
    approvedCount: number;
  }> {
    try {
      // Get total expenses
      const { data: expenses, error: expensesError } = await supabase
        .from('expenses')
        .select('amount, approval_status')
        .eq('approval_status', 'approved');

      if (expensesError) {
        console.error('Error fetching expenses:', expensesError);
        // Return default values if there's an error
        return {
          totalExpenses: 0,
          totalBudget: 0,
          varianceAmount: 0,
          variancePercentage: 0,
          pendingCount: 0,
          approvedCount: 0
        };
      }

      // Get total budget
      const { data: budget, error: budgetError } = await supabase
        .from('budget_items')
        .select('budgeted_amount, actual_amount');

      if (budgetError) {
        console.error('Error fetching budget:', budgetError);
        // Continue with default budget values
      }

      // Get pending count
      const { count: pendingCount, error: pendingError } = await supabase
        .from('expenses')
        .select('*', { count: 'exact', head: true })
        .eq('approval_status', 'pending');

      if (pendingError) {
        console.error('Error fetching pending count:', pendingError);
        // Continue with default pending count
      }

      const totalExpenses = expenses?.reduce((sum, expense) => sum + expense.amount, 0) || 0;
      const totalBudget = budget?.reduce((sum, item) => sum + item.budgeted_amount, 0) || 0;
      const totalActual = budget?.reduce((sum, item) => sum + item.actual_amount, 0) || 0;
      const varianceAmount = totalActual - totalBudget;
      const variancePercentage = totalBudget > 0 ? (varianceAmount / totalBudget) * 100 : 0;

      return {
        totalExpenses,
        totalBudget,
        varianceAmount,
        variancePercentage,
        pendingCount: pendingCount || 0,
        approvedCount: expenses?.length || 0
      };
    } catch (error) {
      console.error('Error fetching expense statistics:', error);
      return {
        totalExpenses: 0,
        totalBudget: 0,
        varianceAmount: 0,
        variancePercentage: 0,
        pendingCount: 0,
        approvedCount: 0
      };
    }
  }

  // Get budget variance analysis
  static async getBudgetVarianceAnalysis(): Promise<BudgetVariance[]> {
    try {
      const { data, error } = await supabase
        .from('budget_items')
        .select(`
          *,
          expense_categories(category_name, category_code)
        `)
        .eq('expense_categories.is_budgetable', true);

      if (error) throw error;

      return data?.map(item => {
        const trend = item.variance_amount < 0 ? 'favorable' : item.variance_amount > 0 ? 'unfavorable' : 'neutral';
        const severity = Math.abs(item.variance_percentage) < 5 ? 'low' : 
                        Math.abs(item.variance_percentage) < 15 ? 'medium' : 
                        Math.abs(item.variance_percentage) < 25 ? 'high' : 'critical';

        return {
          categoryId: item.category_id,
          categoryName: item.expense_categories.category_name,
          budgetedAmount: item.budgeted_amount,
          actualAmount: item.actual_amount,
          varianceAmount: item.variance_amount,
          variancePercentage: item.variance_percentage,
          trend,
          severity
        };
      }) || [];
    } catch (error) {
      console.error('Error fetching budget variance analysis:', error);
      return [];
    }
  }

  // Log expense action (placeholder - audit logs table doesn't exist)
  static async logExpenseAction(expenseId: string, action: string, details: string, logType: 'info' | 'warning' | 'error' | 'success'): Promise<void> {
    console.log(`[${logType.toUpperCase()}] Expense action logged: ${action} for expense ${expenseId} - ${details}`);
  }

  // Get audit logs for an expense (placeholder - audit logs table doesn't exist)
  static async getExpenseAuditLogs(expenseId: string): Promise<any[]> {
    console.log(`Getting audit logs for expense: ${expenseId}`);
    return [];
  }

  // Subscribe to real-time updates
  static subscribeToExpenses(callback: (payload: any) => void) {
    return supabase
      .channel('expenses')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'expenses' }, 
        callback
      )
      .subscribe();
  }

  static subscribeToBudgetItems(callback: (payload: any) => void) {
    return supabase
      .channel('budget_items')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'budget_items' }, 
        callback
      )
      .subscribe();
  }


  // Get recurring expenses
  static async getRecurringExpenses(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('recurring_expenses')
        .select('*')
        .eq('is_active', true)
        .order('id', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching recurring expenses:', error);
      return [];
    }
  }

  // Get pending approvals
  static async getPendingApprovals(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('approval_status', 'pending')
        .order('id', { ascending: false });

      if (error) {
        console.error('Error fetching pending approvals:', error);
        return [];
      }
      return data || [];
    } catch (error) {
      console.error('Error fetching pending approvals:', error);
      return [];
    }
  }

  // Get vendor performance data
  static async getVendorPerformance(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('vendor_name, amount, expense_date')
        .eq('approval_status', 'approved')
        .order('amount', { ascending: false });

      if (error) {
        console.error('Error fetching vendor performance:', error);
        return [];
      }
      
      // Group by vendor and calculate totals
      const vendorMap = new Map();
      data?.forEach(expense => {
        const vendor = expense.vendor_name || 'Unknown';
        if (vendorMap.has(vendor)) {
          const existing = vendorMap.get(vendor);
          existing.totalAmount += expense.amount;
          existing.count += 1;
        } else {
          vendorMap.set(vendor, {
            vendorName: vendor,
            totalAmount: expense.amount,
            count: 1
          });
        }
      });

      return Array.from(vendorMap.values()).sort((a, b) => b.totalAmount - a.totalAmount);
    } catch (error) {
      console.error('Error fetching vendor performance:', error);
      return [];
    }
  }

  // Get ledger entries
  static async getLedgerEntries(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('id, amount, created_at, description, approval_status, created_at')
        .eq('approval_status', 'approved')
        .order('id', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Error fetching ledger entries:', error);
        return [];
      }
      return data || [];
    } catch (error) {
      console.error('Error fetching ledger entries:', error);
      return [];
    }
  }

  // Get reimbursement data
  static async getReimbursementData(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('id, amount, description, approval_status, submitted_by, created_at')
        .in('approval_status', ['pending', 'approved'])
        .order('id', { ascending: false });

      if (error) {
        console.error('Error fetching reimbursement data:', error);
        return [];
      }
      return data || [];
    } catch (error) {
      console.error('Error fetching reimbursement data:', error);
      return [];
    }
  }

  // Get forecast data
  static async getForecastData(): Promise<any> {
    try {
      // Mock forecast data based on historical trends
      const { data, error } = await supabase
        .from('expenses')
        .select('amount, expense_date')
        .eq('approval_status', 'approved')
        .gte('expense_date', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .order('id', { ascending: false });

      if (error) {
        console.error('Error fetching forecast data:', error);
        // Return mock data if there's an error
        return {
          currentMonth: 0,
          nextMonth: 0,
          nextQuarter: 0,
          growthRate: 0
        };
      }

      // Calculate forecast based on last 3 months
      const monthlyTotals: { [key: string]: number } = {};
      data?.forEach(expense => {
        const month = new Date(expense.expense_date).toISOString().substring(0, 7);
        monthlyTotals[month] = (monthlyTotals[month] || 0) + expense.amount;
      });

      const months = Object.keys(monthlyTotals).sort();
      const lastMonth = months[months.length - 1];
      const secondLastMonth = months[months.length - 2];
      
      const growthRate = secondLastMonth ? 
        (monthlyTotals[lastMonth] - monthlyTotals[secondLastMonth]) / monthlyTotals[secondLastMonth] : 0;

      return {
        currentMonth: monthlyTotals[lastMonth] || 0,
        nextMonth: monthlyTotals[lastMonth] ? monthlyTotals[lastMonth] * (1 + growthRate) : 0,
        nextQuarter: monthlyTotals[lastMonth] ? monthlyTotals[lastMonth] * 3 * (1 + growthRate) : 0,
        growthRate: growthRate * 100
      };
    } catch (error) {
      console.error('Error fetching forecast data:', error);
      return {
        currentMonth: 0,
        nextMonth: 0,
        nextQuarter: 0,
        growthRate: 0
      };
    }
  }

  // Create recurring expense
  static async createRecurringExpense(data: any): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('recurring_expenses')
        .insert({
          name: data.name,
          amount: data.amount,
          category_id: data.category,
          frequency: data.frequency,
          start_date: data.startDate,
          end_date: data.endDate,
          description: data.description,
          is_active: true,
          auto_approve: data.autoApprove || false
        })
        .select('id')
        .single();

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error creating recurring expense:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error occurred' };
    }
  }

  // Bulk approve/reject expenses
  static async bulkApproveExpenses(expenseIds: string[], action: 'approve' | 'reject', userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const promises = expenseIds.map(id => {
        if (action === 'approve') {
          return this.approveExpense(id, userId);
        } else {
          return this.rejectExpense(id, userId, 'Bulk rejection');
        }
      });

      const results = await Promise.all(promises);
      const failed = results.filter(r => !r.success);
      
      if (failed.length > 0) {
        return { success: false, error: `${failed.length} operations failed` };
      }

      return { success: true };
    } catch (error) {
      console.error('Error bulk processing expenses:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error occurred' };
    }
  }


  // Helper methods for enhanced expense data
  private static calculatePriority(amount: number, submittedAt: string): number {
    const daysSinceSubmission = Math.floor((Date.now() - new Date(submittedAt).getTime()) / (1000 * 60 * 60 * 24));
    if (amount >= 1000000) return 1; // High priority for large amounts
    if (daysSinceSubmission >= 3) return 2; // High priority for old submissions
    if (amount >= 500000) return 3; // Medium priority for medium amounts
    return 4; // Low priority
  }

  private static calculateRiskLevel(amount: number, vendorName: string | null): 'low' | 'medium' | 'high' | 'critical' {
    // Consider vendor reputation in risk assessment (placeholder for future implementation)
    const vendorRiskMultiplier = vendorName ? 1 : 1.2; // Unknown vendors have higher risk
    
    if (amount * vendorRiskMultiplier >= 2000000) return 'critical';
    if (amount * vendorRiskMultiplier >= 1000000) return 'high';
    if (amount * vendorRiskMultiplier >= 500000) return 'medium';
    return 'low';
  }

  private static generateTags(description: string | null, categoryName: string): string[] {
    const tags: string[] = [];
    if (description) {
      if (description.toLowerCase().includes('office')) tags.push('office');
      if (description.toLowerCase().includes('travel')) tags.push('travel');
      if (description.toLowerCase().includes('training')) tags.push('training');
      if (description.toLowerCase().includes('equipment')) tags.push('equipment');
    }
    tags.push(categoryName.toLowerCase().replace(/\s+/g, '_'));
    return tags;
  }

  private static determinePaymentMethod(amount: number): 'cash' | 'bank' | 'credit_card' | 'mobile' | 'check' {
    if (amount >= 1000000) return 'bank';
    if (amount >= 100000) return 'credit_card';
    if (amount >= 50000) return 'mobile';
    return 'cash';
  }

  private static determineExpenseType(description: string | null): 'bill' | 'reimbursement' | 'advance' | 'other' {
    if (!description) return 'other';
    const desc = description.toLowerCase();
    if (desc.includes('reimbursement')) return 'reimbursement';
    if (desc.includes('advance')) return 'advance';
    if (desc.includes('bill') || desc.includes('invoice')) return 'bill';
    return 'other';
  }

  private static calculateTaxAmount(amount: number): number {
    return Math.round(amount * 0.18); // 18% VAT
  }

  private static isRecurringExpense(description: string | null): boolean {
    if (!description) return false;
    const desc = description.toLowerCase();
    return desc.includes('monthly') || desc.includes('recurring') || desc.includes('subscription');
  }

  private static getAccountNumber(categoryCode: string): string {
    const accountMap: { [key: string]: string } = {
      'MOCK001': '5001', // Office Supplies
      'MOCK002': '5002', // Transportation
      'MOCK003': '5003', // Utilities
      'MOCK004': '5004', // Training
      'MOCK005': '5005'  // Equipment
    };
    return accountMap[categoryCode] || '5000';
  }

  private static checkPolicyViolations(expense: any): any[] {
    const violations: any[] = [];
    if (expense.amount > 1000000 && !expense.supporting_documents?.length) {
      violations.push({
        type: 'missing_documentation',
        severity: 'high',
        message: 'Large expense requires supporting documentation',
        actionRequired: 'Provide receipts and invoices'
      });
    }
    return violations;
  }

  private static checkComplianceFlags(expense: any): any[] {
    const flags: any[] = [];
    if (expense.amount > 500000 && !expense.vendor_id) {
      flags.push({
        type: 'vendor_verification',
        severity: 'medium',
        message: 'Large expense requires vendor verification',
        actionRequired: 'Verify vendor details'
      });
    }
    return flags;
  }

  private static generateLedgerEntries(expense: any): any[] {
    return [
      {
        accountNumber: this.getAccountNumber(expense.expense_categories.category_code),
        accountName: expense.expense_categories.category_name,
        debitCredit: 'debit',
        amount: expense.amount,
        description: expense.description,
        lineType: 'expense'
      },
      {
        accountNumber: '1200',
        accountName: 'Tax Recoverable',
        debitCredit: 'debit',
        amount: this.calculateTaxAmount(expense.amount),
        description: 'VAT Tax',
        lineType: 'tax'
      },
      {
        accountNumber: '2000',
        accountName: 'Accounts Payable',
        debitCredit: 'credit',
        amount: expense.amount + this.calculateTaxAmount(expense.amount),
        description: `Payable to ${expense.vendor_name}`,
        lineType: 'other'
      }
    ];
  }

  private static calculateBudgetImpact(expense: any): any {
    return {
      category: expense.expense_categories.category_name,
      allocated: 1000000, // Mock allocated amount
      spent: expense.amount,
      remaining: 1000000 - expense.amount,
      variance: expense.amount - 1000000,
      variancePercentage: ((expense.amount - 1000000) / 1000000) * 100,
      overBudget: expense.amount > 1000000
    };
  }

  private static calculateBOTImpact(expense: any): any {
    return {
      msp202Impact: [{
        lineItem: expense.expense_categories.msp202_line_item || 'D99',
        amount: expense.amount,
        description: expense.description
      }],
      otherReportsImpact: []
    };
  }

  private static estimateApprovalTime(expense: any): number {
    if (expense.amount >= 1000000) return 48; // 2 days for large amounts
    if (expense.amount >= 500000) return 24; // 1 day for medium amounts
    return 4; // 4 hours for small amounts
  }

  // Get expense summary data
  static async getExpenseSummary(): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('id, amount, created_at, approval_status');

      if (error) {
        console.error('Error fetching expense summary:', error);
        // Return fallback data instead of null
        return {
          totalAmount: 0,
          approvedAmount: 0,
          pendingAmount: 0,
          totalCount: 0,
          approvedCount: 0,
          pendingCount: 0
        };
      }

      const expenses = data || [];
      const totalAmount = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
      const approvedAmount = expenses
        .filter(exp => exp.approval_status === 'approved')
        .reduce((sum, exp) => sum + (exp.amount || 0), 0);
      const pendingAmount = expenses
        .filter(exp => exp.approval_status === 'pending')
        .reduce((sum, exp) => sum + (exp.amount || 0), 0);

      return {
        totalAmount,
        approvedAmount,
        pendingAmount,
        totalCount: expenses.length,
        approvedCount: expenses.filter(exp => exp.approval_status === 'approved').length,
        pendingCount: expenses.filter(exp => exp.approval_status === 'pending').length
      };
    } catch (error) {
      console.error('Error fetching expense summary:', error);
      // Return fallback data instead of null
      return {
        totalAmount: 0,
        approvedAmount: 0,
        pendingAmount: 0,
        totalCount: 0,
        approvedCount: 0,
        pendingCount: 0
      };
    }
  }

}
