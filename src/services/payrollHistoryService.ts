/**
 * Comprehensive Payroll History Service
 * Handles all payroll history operations including search, creation, and management
 */

import { supabase } from '../lib/supabase';
import { 
  PayrollRun, 
  PayrollEmployeeRecord, 
  PayrollRunSummary, 
  PayrollRunDetails,
  PayrollSearchFilters,
  PayrollSearchResult,
  CreatePayrollRunData,
  UpdatePayrollRunStatusData,
  PayrollEmployee,
  PayrollSummary
} from '../types/payrollHistory';
import { calculatePAYE, calculateNSSFEmployee, calculateNSSFEmployer, calculateTaxableAmount } from '../utils/payeCalculator';
import { PayrollHistoryServiceFallback } from './payrollHistoryServiceFallback';

export class PayrollHistoryService {
  /**
   * Create a new payroll run
   */
  static async createPayrollRun(data: CreatePayrollRunData): Promise<{
    success: boolean;
    data?: PayrollRun;
    error?: string;
  }> {
    try {
      console.log('🏗️ Creating new payroll run:', data.run_name);

      const { data: result, error } = await supabase.rpc('create_payroll_run', {
        p_run_name: data.run_name,
        p_pay_period_start: data.pay_period_start,
        p_pay_period_end: data.pay_period_end,
        p_notes: data.notes || null
      });

      if (error) {
        console.error('❌ Error creating payroll run:', error);
        return {
          success: false,
          error: `Failed to create payroll run: ${error.message}`
        };
      }

      // Fetch the created payroll run
      const { data: payrollRun, error: fetchError } = await supabase
        .from('payroll_runs')
        .select('*')
        .eq('id', result)
        .single();

      if (fetchError) {
        console.error('❌ Error fetching created payroll run:', fetchError);
        return {
          success: false,
          error: `Failed to fetch created payroll run: ${fetchError.message}`
        };
      }

      console.log('✅ Payroll run created successfully:', payrollRun.id);
      return {
        success: true,
        data: payrollRun
      };

    } catch (error) {
      console.error('❌ Exception creating payroll run:', error);
      return {
        success: false,
        error: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Search payroll runs with filters
   */
  static async searchPayrollRuns(filters: PayrollSearchFilters = {}): Promise<{
    success: boolean;
    data?: PayrollSearchResult;
    error?: string;
  }> {
    try {
      console.log('🔍 Searching payroll runs with filters:', filters);

      // Try using the database function first
      try {
        const { data, error } = await supabase.rpc('search_payroll_runs', {
          p_search_term: filters.search_term || null,
          p_month: filters.month || null,
          p_year: filters.year || null,
          p_status: filters.status || null,
          p_limit: filters.limit || 50,
          p_offset: filters.offset || 0
        });

        if (error) {
          console.warn('⚠️ Database function not available, using fallback method:', error.message);
          // Use fallback method
          return await PayrollHistoryServiceFallback.searchPayrollRuns(filters);
        }

        // Get total count for pagination
        const { count, error: countError } = await supabase
          .from('payroll_runs')
          .select('*', { count: 'exact', head: true })
          .or(
            filters.search_term ? 
              `run_name.ilike.%${filters.search_term}%,notes.ilike.%${filters.search_term}%` : 
              'id.gt.00000000-0000-0000-0000-000000000000'
          )
          .eq(filters.month ? 'pay_month' : 'id', filters.month || 'id')
          .eq(filters.year ? 'pay_year' : 'id', filters.year || 'id')
          .eq(filters.status ? 'status' : 'id', filters.status || 'id');

        if (countError) {
          console.error('❌ Error getting count:', countError);
        }

        const totalCount = count || 0;
        const hasMore = (filters.offset || 0) + (filters.limit || 50) < totalCount;

        console.log(`✅ Found ${data?.length || 0} payroll runs using database function`);
        return {
          success: true,
          data: {
            payroll_runs: data || [],
            total_count: totalCount,
            has_more: hasMore
          }
        };

      } catch (rpcError) {
        console.warn('⚠️ RPC call failed, using fallback method:', rpcError);
        // Use fallback method
        return await PayrollHistoryServiceFallback.searchPayrollRuns(filters);
      }

    } catch (error) {
      console.error('❌ Exception searching payroll runs:', error);
      return {
        success: false,
        error: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Get detailed payroll run with all employee records
   */
  static async getPayrollRunDetails(payrollRunId: string): Promise<{
    success: boolean;
    data?: PayrollRunDetails[];
    error?: string;
  }> {
    try {
      console.log('📊 Getting payroll run details:', payrollRunId);

      // Try using the database function first
      try {
        const { data, error } = await supabase.rpc('get_payroll_run_details', {
          p_payroll_run_id: payrollRunId
        });

        if (error) {
          console.warn('⚠️ Database function not available, using fallback method:', error.message);
          // Use fallback method
          return await PayrollHistoryServiceFallback.getPayrollRunDetails(payrollRunId);
        }

        console.log(`✅ Retrieved details for payroll run with ${data?.length || 0} employee records using database function`);
        return {
          success: true,
          data: data || []
        };

      } catch (rpcError) {
        console.warn('⚠️ RPC call failed, using fallback method:', rpcError);
        // Use fallback method
        return await PayrollHistoryServiceFallback.getPayrollRunDetails(payrollRunId);
      }

    } catch (error) {
      console.error('❌ Exception getting payroll run details:', error);
      return {
        success: false,
        error: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Update payroll run status
   */
  static async updatePayrollRunStatus(
    payrollRunId: string, 
    statusData: UpdatePayrollRunStatusData
  ): Promise<{
    success: boolean;
    data?: boolean;
    error?: string;
  }> {
    try {
      console.log('🔄 Updating payroll run status:', payrollRunId, statusData.status);

      const { data, error } = await supabase.rpc('update_payroll_run_status', {
        p_payroll_run_id: payrollRunId,
        p_status: statusData.status,
        p_notes: statusData.notes || null
      });

      if (error) {
        console.error('❌ Error updating payroll run status:', error);
        return {
          success: false,
          error: `Failed to update payroll run status: ${error.message}`
        };
      }

      console.log('✅ Payroll run status updated successfully');
      return {
        success: true,
        data: data
      };

    } catch (error) {
      console.error('❌ Exception updating payroll run status:', error);
      return {
        success: false,
        error: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Save calculated payroll to database
   */
  static async saveCalculatedPayroll(
    payrollRunId: string,
    employees: PayrollEmployee[]
  ): Promise<{
    success: boolean;
    data?: PayrollRun;
    error?: string;
  }> {
    try {
      console.log('💾 Saving calculated payroll to database:', payrollRunId);

      // Convert employees to the format expected by the database function
      const employeeRecords = employees.map(emp => ({
        id: emp.id,
        name: emp.name,
        basicSalary: emp.basicSalary,
        housing: emp.housing,
        transport: emp.transport,
        arrears: emp.arrears,
        otherAllowance: emp.otherAllowance,
        grossPay: emp.grossPay,
        taxableAmount: emp.taxableAmount,
        paye: emp.paye,
        nssfEE: emp.nssfEE,
        hesbl: emp.hesbl,
        loan: emp.loan,
        salaryAdvance: emp.salaryAdvance,
        otherDeduction: emp.otherDeduction,
        totalDeductions: emp.paye + emp.nssfEE + emp.hesbl + emp.loan + emp.salaryAdvance + emp.otherDeduction,
        netSalary: emp.netSalary,
        nssfER: emp.nssfER,
        wcfER: emp.wcfER,
        sdlER: emp.sdlER,
        status: 'pending',
        notes: null
      }));

      // Use the database function to insert employee records
      const { data, error } = await supabase.rpc('save_calculated_payroll', {
        p_payroll_run_id: payrollRunId,
        p_employee_records: employeeRecords
      });

      if (error) {
        console.error('❌ Error saving calculated payroll:', error);
        return {
          success: false,
          error: `Failed to save calculated payroll: ${error.message}`
        };
      }

      if (data && data.length > 0) {
        const result = data[0];
        if (!result.success) {
          console.error('❌ Database function returned error:', result.message);
          return {
            success: false,
            error: `Database error: ${result.message}`
          };
        }
      }

      // Fetch updated payroll run
      const { data: payrollRun, error: fetchError } = await supabase
        .from('payroll_runs')
        .select('*')
        .eq('id', payrollRunId)
        .single();

      if (fetchError) {
        console.error('❌ Error fetching updated payroll run:', fetchError);
        return {
          success: false,
          error: `Failed to fetch updated payroll run: ${fetchError.message}`
        };
      }

      console.log('✅ Payroll data saved successfully to database');
      return {
        success: true,
        data: payrollRun
      };

    } catch (error) {
      console.error('❌ Exception saving calculated payroll:', error);
      return {
        success: false,
        error: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Get payroll runs by month
   */
  static async getPayrollRunsByMonth(month: string): Promise<{
    success: boolean;
    data?: PayrollRunSummary[];
    error?: string;
  }> {
    return this.searchPayrollRuns({ month, limit: 100 });
  }

  /**
   * Get payroll runs by year
   */
  static async getPayrollRunsByYear(year: number): Promise<{
    success: boolean;
    data?: PayrollRunSummary[];
    error?: string;
  }> {
    return this.searchPayrollRuns({ year, limit: 100 });
  }

  /**
   * Get recent payroll runs
   */
  static async getRecentPayrollRuns(limit: number = 10): Promise<{
    success: boolean;
    data?: PayrollRunSummary[];
    error?: string;
  }> {
    return this.searchPayrollRuns({ limit });
  }

  /**
   * Delete payroll run (soft delete by setting status to cancelled)
   */
  static async deletePayrollRun(payrollRunId: string): Promise<{
    success: boolean;
    data?: boolean;
    error?: string;
  }> {
    return this.updatePayrollRunStatus(payrollRunId, { 
      status: 'cancelled',
      notes: 'Payroll run cancelled'
    });
  }

  /**
   * Get payroll audit logs
   */
  static async getPayrollAuditLogs(payrollRunId?: string): Promise<{
    success: boolean;
    data?: any[];
    error?: string;
  }> {
    try {
      console.log('📋 Getting payroll audit logs for:', payrollRunId || 'all');

      let query = supabase
        .from('payroll_audit_logs')
        .select(`
          *,
          performed_by_employee:employees!payroll_audit_logs_performed_by_fkey(
            first_name,
            last_name
          )
        `)
        .order('performed_at', { ascending: false });

      if (payrollRunId) {
        query = query.eq('payroll_run_id', payrollRunId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ Error getting audit logs:', error);
        return {
          success: false,
          error: `Failed to get audit logs: ${error.message}`
        };
      }

      console.log(`✅ Retrieved ${data?.length || 0} audit log entries`);
      return {
        success: true,
        data: data || []
      };

    } catch (error) {
      console.error('❌ Exception getting audit logs:', error);
      return {
        success: false,
        error: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
}
