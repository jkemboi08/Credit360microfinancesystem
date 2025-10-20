/**
 * Fallback Payroll History Service
 * Handles cases where database functions are not available yet
 */

import { supabase } from '../lib/supabase';
import { 
  PayrollRunSummary, 
  PayrollSearchFilters,
  PayrollSearchResult 
} from '../types/payrollHistory';

export class PayrollHistoryServiceFallback {
  /**
   * Search payroll runs using direct table queries (fallback method)
   */
  static async searchPayrollRuns(filters: PayrollSearchFilters = {}): Promise<{
    success: boolean;
    data?: PayrollSearchResult;
    error?: string;
  }> {
    try {
      console.log('🔍 Searching payroll runs with fallback method:', filters);

      // Build query
      let query = supabase
        .from('payroll_runs')
        .select(`
          id,
          run_name,
          pay_period_start,
          pay_period_end,
          pay_month,
          pay_year,
          status,
          total_employees,
          total_gross_pay,
          total_net_salary,
          processed_at,
          approved_at,
          processed_by,
          employees!payroll_runs_processed_by_fkey(
            first_name,
            last_name
          )
        `)
        .order('pay_period_start', { ascending: false });

      // Apply filters
      if (filters.search_term) {
        query = query.or(`run_name.ilike.%${filters.search_term}%,notes.ilike.%${filters.search_term}%`);
      }
      
      if (filters.month) {
        query = query.eq('pay_month', filters.month);
      }
      
      if (filters.year) {
        query = query.eq('pay_year', filters.year);
      }
      
      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      // Apply pagination
      const limit = filters.limit || 50;
      const offset = filters.offset || 0;
      query = query.range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) {
        console.error('❌ Error searching payroll runs:', error);
        return {
          success: false,
          error: `Failed to search payroll runs: ${error.message}`
        };
      }

      // Transform data to match expected format
      const payrollRuns: PayrollRunSummary[] = (data || []).map(record => ({
        id: record.id,
        run_name: record.run_name,
        pay_period_start: record.pay_period_start,
        pay_period_end: record.pay_period_end,
        pay_month: record.pay_month,
        pay_year: record.pay_year,
        status: record.status,
        total_employees: record.total_employees,
        total_gross_pay: record.total_gross_pay,
        total_net_salary: record.total_net_salary,
        processed_by_name: record.employees ? 
          `${record.employees.first_name} ${record.employees.last_name}` : 
          'System',
        processed_at: record.processed_at,
        approved_at: record.approved_at
      }));

      const totalCount = count || 0;
      const hasMore = offset + limit < totalCount;

      console.log(`✅ Found ${payrollRuns.length} payroll runs using fallback method`);
      return {
        success: true,
        data: {
          payroll_runs: payrollRuns,
          total_count: totalCount,
          has_more: hasMore
        }
      };

    } catch (error) {
      console.error('❌ Exception searching payroll runs:', error);
      return {
        success: false,
        error: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Get payroll run details using direct table queries
   */
  static async getPayrollRunDetails(payrollRunId: string): Promise<{
    success: boolean;
    data?: any[];
    error?: string;
  }> {
    try {
      console.log('📊 Getting payroll run details with fallback method:', payrollRunId);

      // Get payroll run details
      const { data: payrollRun, error: runError } = await supabase
        .from('payroll_runs')
        .select(`
          *,
          processed_by_employee:employees!payroll_runs_processed_by_fkey(
            first_name,
            last_name
          ),
          approved_by_employee:employees!payroll_runs_approved_by_fkey(
            first_name,
            last_name
          )
        `)
        .eq('id', payrollRunId)
        .single();

      if (runError) {
        console.error('❌ Error getting payroll run:', runError);
        return {
          success: false,
          error: `Failed to get payroll run: ${runError.message}`
        };
      }

      // Get employee records
      const { data: employeeRecords, error: empError } = await supabase
        .from('payroll_employee_records')
        .select(`
          *,
          employee:employees(
            first_name,
            last_name,
            employee_id
          )
        `)
        .eq('payroll_run_id', payrollRunId)
        .order('employee_id');

      if (empError) {
        console.error('❌ Error getting employee records:', empError);
        return {
          success: false,
          error: `Failed to get employee records: ${empError.message}`
        };
      }

      // Combine data into the expected format
      const details = [
        {
          // Payroll run details
          run_id: payrollRun.id,
          run_name: payrollRun.run_name,
          pay_period_start: payrollRun.pay_period_start,
          pay_period_end: payrollRun.pay_period_end,
          pay_month: payrollRun.pay_month,
          pay_year: payrollRun.pay_year,
          status: payrollRun.status,
          total_employees: payrollRun.total_employees,
          total_gross_pay: payrollRun.total_gross_pay,
          total_taxable_amount: payrollRun.total_taxable_amount,
          total_paye: payrollRun.total_paye,
          total_nssf_ee: payrollRun.total_nssf_ee,
          total_nssf_er: payrollRun.total_nssf_er,
          total_wcf_er: payrollRun.total_wcf_er,
          total_sdl_er: payrollRun.total_sdl_er,
          total_heslb: payrollRun.total_heslb,
          total_loans: payrollRun.total_loans,
          total_salary_advance: payrollRun.total_salary_advance,
          total_other_deductions: payrollRun.total_other_deductions,
          total_net_salary: payrollRun.total_net_salary,
          total_allowances: payrollRun.total_allowances,
          notes: payrollRun.notes,
          processed_by_name: payrollRun.processed_by_employee ? 
            `${payrollRun.processed_by_employee.first_name} ${payrollRun.processed_by_employee.last_name}` : 
            'System',
          approved_by_name: payrollRun.approved_by_employee ? 
            `${payrollRun.approved_by_employee.first_name} ${payrollRun.approved_by_employee.last_name}` : 
            null,
          processed_at: payrollRun.processed_at,
          approved_at: payrollRun.approved_at,
          // Employee record details (will be repeated for each employee)
          employee_id: null,
          employee_name: null,
          employee_number: null,
          basic_salary: null,
          housing_allowance: null,
          transport_allowance: null,
          arrears: null,
          other_allowance: null,
          gross_pay: null,
          taxable_amount: null,
          paye: null,
          nssf_ee: null,
          hesbl: null,
          loan_deduction: null,
          salary_advance: null,
          other_deduction: null,
          total_deductions: null,
          net_salary: null,
          nssf_er: null,
          wcf_er: null,
          sdl_er: null,
          employee_status: null,
          employee_notes: null
        },
        // Add employee records
        ...(employeeRecords || []).map(record => ({
          // Payroll run details (repeated)
          run_id: payrollRun.id,
          run_name: payrollRun.run_name,
          pay_period_start: payrollRun.pay_period_start,
          pay_period_end: payrollRun.pay_period_end,
          pay_month: payrollRun.pay_month,
          pay_year: payrollRun.pay_year,
          status: payrollRun.status,
          total_employees: payrollRun.total_employees,
          total_gross_pay: payrollRun.total_gross_pay,
          total_taxable_amount: payrollRun.total_taxable_amount,
          total_paye: payrollRun.total_paye,
          total_nssf_ee: payrollRun.total_nssf_ee,
          total_nssf_er: payrollRun.total_nssf_er,
          total_wcf_er: payrollRun.total_wcf_er,
          total_sdl_er: payrollRun.total_sdl_er,
          total_heslb: payrollRun.total_heslb,
          total_loans: payrollRun.total_loans,
          total_salary_advance: payrollRun.total_salary_advance,
          total_other_deductions: payrollRun.total_other_deductions,
          total_net_salary: payrollRun.total_net_salary,
          total_allowances: payrollRun.total_allowances,
          notes: payrollRun.notes,
          processed_by_name: payrollRun.processed_by_employee ? 
            `${payrollRun.processed_by_employee.first_name} ${payrollRun.processed_by_employee.last_name}` : 
            'System',
          approved_by_name: payrollRun.approved_by_employee ? 
            `${payrollRun.approved_by_employee.first_name} ${payrollRun.approved_by_employee.last_name}` : 
            null,
          processed_at: payrollRun.processed_at,
          approved_at: payrollRun.approved_at,
          // Employee record details
          employee_id: record.employee_id,
          employee_name: record.employee ? 
            `${record.employee.first_name} ${record.employee.last_name}` : 
            'Unknown Employee',
          employee_number: record.employee?.employee_id || record.employee_id,
          basic_salary: record.basic_salary,
          housing_allowance: record.housing_allowance,
          transport_allowance: record.transport_allowance,
          arrears: record.arrears,
          other_allowance: record.other_allowance,
          gross_pay: record.gross_pay,
          taxable_amount: record.taxable_amount,
          paye: record.paye,
          nssf_ee: record.nssf_ee,
          hesbl: record.hesbl,
          loan_deduction: record.loan_deduction,
          salary_advance: record.salary_advance,
          other_deduction: record.other_deduction,
          total_deductions: record.total_deductions,
          net_salary: record.net_salary,
          nssf_er: record.nssf_er,
          wcf_er: record.wcf_er,
          sdl_er: record.sdl_er,
          employee_status: record.status,
          employee_notes: record.notes
        }))
      ];

      console.log(`✅ Retrieved details for payroll run with ${employeeRecords?.length || 0} employee records using fallback method`);
      return {
        success: true,
        data: details
      };

    } catch (error) {
      console.error('❌ Exception getting payroll run details:', error);
      return {
        success: false,
        error: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
}
