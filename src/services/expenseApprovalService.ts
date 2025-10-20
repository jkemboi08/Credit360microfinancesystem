/**
 * Expense Approval Workflow Service
 * Handles expense approval processes and workflows
 */

import { supabase } from '../lib/supabaseClient';

export interface ExpenseApproval {
  id: string;
  expense_id: string;
  approver_id: string;
  approval_level: number;
  status: 'pending' | 'approved' | 'rejected';
  comments: string;
  approved_at: string;
  created_at: string;
  updated_at: string;
}

export interface ExpenseWorkflow {
  id: string;
  expense_id: string;
  current_level: number;
  max_level: number;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  created_at: string;
  updated_at: string;
}

export interface Expense {
  id: string;
  category_id: string;
  amount: number;
  currency: string;
  expense_date: string;
  description: string;
  vendor_name: string;
  approval_status: 'pending' | 'approved' | 'rejected';
  submitted_by: string;
  created_at: string;
  updated_at: string;
}

export class ExpenseApprovalService {
  /**
   * Get pending expenses for approval
   */
  static async getPendingExpenses(approverId?: string): Promise<{
    success: boolean;
    data?: Expense[];
    error?: string;
  }> {
    try {
      console.log('📋 Getting pending expenses for approval');

      let query = supabase
        .from('expenses')
        .select(`
          id,
          category_id,
          amount,
          currency,
          expense_date,
          description,
          vendor_name,
          approval_status,
          submitted_by,
          created_at,
          updated_at,
          expense_categories!inner(category_name, category_code)
        `)
        .eq('approval_status', 'pending')
        .order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) {
        console.error('❌ Error fetching pending expenses:', error);
        return {
          success: false,
          error: `Failed to fetch pending expenses: ${error.message}`
        };
      }

      console.log(`✅ Retrieved ${data?.length || 0} pending expenses`);
      return {
        success: true,
        data: data || []
      };

    } catch (error) {
      console.error('❌ Exception fetching pending expenses:', error);
      return {
        success: false,
        error: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Create approval workflow for an expense
   */
  static async createApprovalWorkflow(expenseId: string, maxLevel: number = 2): Promise<{
    success: boolean;
    data?: ExpenseWorkflow;
    error?: string;
  }> {
    try {
      console.log('🔄 Creating approval workflow for expense:', expenseId);

      const { data, error } = await supabase
        .from('expense_workflows')
        .insert([{
          expense_id: expenseId,
          current_level: 1,
          max_level: maxLevel,
          status: 'pending'
        }])
        .select()
        .single();

      if (error) {
        console.error('❌ Error creating approval workflow:', error);
        return {
          success: false,
          error: `Failed to create workflow: ${error.message}`
        };
      }

      console.log('✅ Approval workflow created successfully');
      return {
        success: true,
        data
      };

    } catch (error) {
      console.error('❌ Exception creating approval workflow:', error);
      return {
        success: false,
        error: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Approve an expense
   */
  static async approveExpense(
    expenseId: string, 
    approverId: string, 
    approvalLevel: number,
    comments?: string
  ): Promise<{
    success: boolean;
    data?: ExpenseApproval;
    error?: string;
  }> {
    try {
      console.log('✅ Approving expense:', expenseId, 'by approver:', approverId);

      // Create approval record
      const { data: approval, error: approvalError } = await supabase
        .from('expense_approvals')
        .insert([{
          expense_id: expenseId,
          approver_id: approverId,
          approval_level: approvalLevel,
          status: 'approved',
          comments: comments || '',
          approved_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (approvalError) {
        console.error('❌ Error creating approval record:', approvalError);
        return {
          success: false,
          error: `Failed to create approval record: ${approvalError.message}`
        };
      }

      // Update workflow status
      const { error: workflowError } = await supabase
        .from('expense_workflows')
        .update({ 
          current_level: approvalLevel + 1,
          status: approvalLevel >= 2 ? 'approved' : 'pending'
        })
        .eq('expense_id', expenseId);

      if (workflowError) {
        console.error('❌ Error updating workflow:', workflowError);
        // Don't fail the approval if workflow update fails
      }

      // If this is the final approval, update expense status
      if (approvalLevel >= 2) {
        const { error: expenseError } = await supabase
          .from('expenses')
          .update({ approval_status: 'approved' })
          .eq('id', expenseId);

        if (expenseError) {
          console.error('❌ Error updating expense status:', expenseError);
          // Don't fail the approval if expense update fails
        }
      }

      console.log('✅ Expense approved successfully');
      return {
        success: true,
        data: approval
      };

    } catch (error) {
      console.error('❌ Exception approving expense:', error);
      return {
        success: false,
        error: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Reject an expense
   */
  static async rejectExpense(
    expenseId: string, 
    approverId: string, 
    approvalLevel: number,
    comments: string
  ): Promise<{
    success: boolean;
    data?: ExpenseApproval;
    error?: string;
  }> {
    try {
      console.log('❌ Rejecting expense:', expenseId, 'by approver:', approverId);

      // Create rejection record
      const { data: approval, error: approvalError } = await supabase
        .from('expense_approvals')
        .insert([{
          expense_id: expenseId,
          approver_id: approverId,
          approval_level: approvalLevel,
          status: 'rejected',
          comments: comments,
          approved_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (approvalError) {
        console.error('❌ Error creating rejection record:', approvalError);
        return {
          success: false,
          error: `Failed to create rejection record: ${approvalError.message}`
        };
      }

      // Update workflow status
      const { error: workflowError } = await supabase
        .from('expense_workflows')
        .update({ 
          status: 'rejected'
        })
        .eq('expense_id', expenseId);

      if (workflowError) {
        console.error('❌ Error updating workflow:', workflowError);
        // Don't fail the rejection if workflow update fails
      }

      // Update expense status
      const { error: expenseError } = await supabase
        .from('expenses')
        .update({ approval_status: 'rejected' })
        .eq('id', expenseId);

      if (expenseError) {
        console.error('❌ Error updating expense status:', expenseError);
        // Don't fail the rejection if expense update fails
      }

      console.log('✅ Expense rejected successfully');
      return {
        success: true,
        data: approval
      };

    } catch (error) {
      console.error('❌ Exception rejecting expense:', error);
      return {
        success: false,
        error: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Get approval history for an expense
   */
  static async getExpenseApprovalHistory(expenseId: string): Promise<{
    success: boolean;
    data?: ExpenseApproval[];
    error?: string;
  }> {
    try {
      console.log('📜 Getting approval history for expense:', expenseId);

      const { data, error } = await supabase
        .from('expense_approvals')
        .select(`
          id,
          expense_id,
          approver_id,
          approval_level,
          status,
          comments,
          approved_at,
          created_at,
          updated_at
        `)
        .eq('expense_id', expenseId)
        .order('approval_level', { ascending: true });

      if (error) {
        console.error('❌ Error fetching approval history:', error);
        return {
          success: false,
          error: `Failed to fetch approval history: ${error.message}`
        };
      }

      console.log(`✅ Retrieved ${data?.length || 0} approval records`);
      return {
        success: true,
        data: data || []
      };

    } catch (error) {
      console.error('❌ Exception fetching approval history:', error);
      return {
        success: false,
        error: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Get expenses by status
   */
  static async getExpensesByStatus(status: 'pending' | 'approved' | 'rejected'): Promise<{
    success: boolean;
    data?: Expense[];
    error?: string;
  }> {
    try {
      console.log('📊 Getting expenses by status:', status);

      const { data, error } = await supabase
        .from('expenses')
        .select(`
          id,
          category_id,
          amount,
          currency,
          expense_date,
          description,
          vendor_name,
          approval_status,
          submitted_by,
          created_at,
          updated_at,
          expense_categories!inner(category_name, category_code)
        `)
        .eq('approval_status', status)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching expenses by status:', error);
        return {
          success: false,
          error: `Failed to fetch expenses: ${error.message}`
        };
      }

      console.log(`✅ Retrieved ${data?.length || 0} ${status} expenses`);
      return {
        success: true,
        data: data || []
      };

    } catch (error) {
      console.error('❌ Exception fetching expenses by status:', error);
      return {
        success: false,
        error: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Get approval statistics
   */
  static async getApprovalStatistics(): Promise<{
    success: boolean;
    data?: {
      totalExpenses: number;
      pendingExpenses: number;
      approvedExpenses: number;
      rejectedExpenses: number;
      averageApprovalTime: number;
    };
    error?: string;
  }> {
    try {
      console.log('📈 Getting approval statistics');

      // Get all expenses
      const { data: allExpenses, error: allError } = await supabase
        .from('expenses')
        .select('id, approval_status, created_at');

      if (allError) {
        return {
          success: false,
          error: `Failed to fetch expenses: ${allError.message}`
        };
      }

      const totalExpenses = allExpenses?.length || 0;
      const pendingExpenses = allExpenses?.filter(exp => exp.approval_status === 'pending').length || 0;
      const approvedExpenses = allExpenses?.filter(exp => exp.approval_status === 'approved').length || 0;
      const rejectedExpenses = allExpenses?.filter(exp => exp.approval_status === 'rejected').length || 0;

      // Calculate average approval time (simplified)
      const averageApprovalTime = 2.5; // days (placeholder calculation)

      const stats = {
        totalExpenses,
        pendingExpenses,
        approvedExpenses,
        rejectedExpenses,
        averageApprovalTime
      };

      console.log('✅ Approval statistics calculated');
      return {
        success: true,
        data: stats
      };

    } catch (error) {
      console.error('❌ Exception calculating approval statistics:', error);
      return {
        success: false,
        error: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
}



































