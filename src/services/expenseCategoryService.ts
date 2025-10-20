import { supabase } from '../lib/supabaseClient';

export interface ExpenseCategory {
  id: string;
  category_code: string;
  category_name: string;
  description: string | null;
  category_type: 'interest' | 'operating' | 'tax';
  msp202_line_item: string | null;
  is_budgetable: boolean;
  is_active: boolean;
  approval_required: boolean;
  approval_limit: number;
  created_at: string | null;
  updated_at: string | null;
}

export class ExpenseCategoryService {
  // Get all active expense categories
  static async getCategories(): Promise<ExpenseCategory[]> {
    try {
      const { data, error } = await supabase
        .from('expense_categories')
        .select('*')
        .eq('is_active', true)
        .order('category_name', { ascending: true });

      if (error) {
        console.error('Error fetching expense categories:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching expense categories:', error);
      return [];
    }
  }

  // Get category by ID
  static async getCategoryById(id: string): Promise<ExpenseCategory | null> {
    try {
      const { data, error } = await supabase
        .from('expense_categories')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching expense category:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error fetching expense category:', error);
      return null;
    }
  }

  // Get category by name
  static async getCategoryByName(name: string): Promise<ExpenseCategory | null> {
    try {
      const { data, error } = await supabase
        .from('expense_categories')
        .select('*')
        .eq('category_name', name)
        .eq('is_active', true)
        .single();

      if (error) {
        console.error('Error fetching expense category by name:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error fetching expense category by name:', error);
      return null;
    }
  }

  // Create new category
  static async createCategory(categoryData: Partial<ExpenseCategory>): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('expense_categories')
        .insert({
          category_code: categoryData.category_code,
          category_name: categoryData.category_name,
          description: categoryData.description,
          category_type: categoryData.category_type || 'operating',
          msp202_line_item: categoryData.msp202_line_item || 'D99',
          is_budgetable: categoryData.is_budgetable ?? true,
          is_active: categoryData.is_active ?? true,
          approval_required: categoryData.approval_required ?? true,
          approval_limit: categoryData.approval_limit ?? 10000
        })
        .select('id')
        .single();

      if (error) throw error;

      return { success: true, id: data.id };
    } catch (error) {
      console.error('Error creating expense category:', error);
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }

  // Update category
  static async updateCategory(id: string, categoryData: Partial<ExpenseCategory>): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('expense_categories')
        .update({
          category_code: categoryData.category_code,
          category_name: categoryData.category_name,
          description: categoryData.description,
          category_type: categoryData.category_type,
          msp202_line_item: categoryData.msp202_line_item,
          is_budgetable: categoryData.is_budgetable,
          is_active: categoryData.is_active,
          approval_required: categoryData.approval_required,
          approval_limit: categoryData.approval_limit
        })
        .eq('id', id);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error updating expense category:', error);
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }

  // Delete category (soft delete)
  static async deleteCategory(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('expense_categories')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error deleting expense category:', error);
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }

  // Get interest expense categories
  static getInterestExpenseCategories(): any[] {
    return [
      {
        categoryCode: 'INT001',
        categoryName: 'Interest on Loans',
        description: 'Interest payments on outstanding loans',
        msp202LineItem: 'I01',
        isBudgetable: true,
        budgetType: 'interest'
      },
      {
        categoryCode: 'INT002',
        categoryName: 'Interest on Deposits',
        description: 'Interest paid on customer deposits',
        msp202LineItem: 'I02',
        isBudgetable: true,
        budgetType: 'interest'
      },
      {
        categoryCode: 'INT003',
        categoryName: 'Interest on Borrowings',
        description: 'Interest on external borrowings',
        msp202LineItem: 'I03',
        isBudgetable: true,
        budgetType: 'interest'
      }
    ];
  }

  // Get operating expense categories
  static getOperatingExpenseCategories(): any[] {
    return [
      {
        categoryCode: 'OPR001',
        categoryName: 'Office Rent',
        description: 'Monthly office rent payments',
        msp202LineItem: 'D01',
        isBudgetable: true,
        budgetType: 'operating'
      },
      {
        categoryCode: 'OPR002',
        categoryName: 'Utilities',
        description: 'Electricity, water, internet bills',
        msp202LineItem: 'D02',
        isBudgetable: true,
        budgetType: 'operating'
      },
      {
        categoryCode: 'OPR003',
        categoryName: 'Office Supplies',
        description: 'Stationery and office materials',
        msp202LineItem: 'D03',
        isBudgetable: true,
        budgetType: 'operating'
      }
    ];
  }

  // Get tax expense categories
  static getTaxExpenseCategories(): any[] {
    return [
      {
        categoryCode: 'TAX001',
        categoryName: 'Income Tax',
        description: 'Corporate income tax payments',
        msp202LineItem: 'T01',
        isBudgetable: true,
        budgetType: 'tax'
      },
      {
        categoryCode: 'TAX002',
        categoryName: 'VAT',
        description: 'Value Added Tax payments',
        msp202LineItem: 'T02',
        isBudgetable: true,
        budgetType: 'tax'
      }
    ];
  }
}