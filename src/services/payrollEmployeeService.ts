/**
 * Service for managing payroll employee records
 * Handles automatic addition of new employees to payroll system
 */

import { supabase } from '../lib/supabaseClient';
import { PayrollEmployee } from '../types/payrollHistory';

export interface PayrollEmployeeData {
  id: string;
  employee_id: string;
  first_name: string;
  last_name: string;
  basic_salary: number;
  housing_allowance?: number;
  transport_allowance?: number;
  other_allowance?: number;
  currency?: string;
  tenant_id: string;
}

export class PayrollEmployeeService {
  /**
   * Add a new employee to the payroll system
   * This is called automatically when a new employee is created in StaffManagement
   */
  static async addEmployeeToPayroll(employeeData: PayrollEmployeeData): Promise<{
    success: boolean;
    data?: PayrollEmployee;
    error?: string;
  }> {
    try {
      console.log('👤 Adding employee to payroll system:', employeeData.employee_id);

      // Convert employee data to payroll format
      const payrollEmployee: PayrollEmployee = {
        id: employeeData.id,
        name: `${employeeData.first_name} ${employeeData.last_name}`,
        employee_id: employeeData.employee_id,
        basicSalary: employeeData.basic_salary,
        housing: employeeData.housing_allowance || 0,
        transport: employeeData.transport_allowance || 0,
        arrears: 0,
        otherAllowance: employeeData.other_allowance || 0,
        grossPay: 0, // Will be calculated
        taxableAmount: 0, // Will be calculated
        paye: 0, // Will be calculated
        nssfEE: 0, // Will be calculated
        hesbl: 0,
        loan: 0,
        salaryAdvance: 0,
        otherDeduction: 0,
        netSalary: 0, // Will be calculated
        nssfER: 0, // Will be calculated
        wcfER: 0, // Will be calculated
        sdlER: 0 // Will be calculated
      };

      // Calculate initial payroll values
      const calculatedEmployee = this.calculatePayrollValues(payrollEmployee);

      // Store in the employee payroll master table
      const { data, error } = await supabase
        .rpc('get_or_create_employee_payroll_master', {
          p_employee_id: employeeData.id,
          p_basic_salary: employeeData.basic_salary,
          p_housing_allowance: employeeData.housing_allowance || 0,
          p_transport_allowance: employeeData.transport_allowance || 0,
          p_other_allowance: employeeData.other_allowance || 0,
          p_currency: employeeData.currency || 'TZS'
        });

      if (error) {
        console.error('❌ Error adding employee to payroll:', error);
        return {
          success: false,
          error: `Failed to add employee to payroll: ${error.message}`
        };
      }

      console.log('✅ Employee added to payroll system successfully');
      return {
        success: true,
        data: calculatedEmployee
      };

    } catch (error) {
      console.error('❌ Exception adding employee to payroll:', error);
      return {
        success: false,
        error: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Get all active payroll employees from the employee_payroll_master table
   */
  static async getPayrollEmployees(tenantId?: string): Promise<{
    success: boolean;
    data?: PayrollEmployee[];
    error?: string;
  }> {
    try {
      console.log('📋 Fetching employees for payroll...');

      // Get all active employees with their payroll data from the master table
      let query = supabase
        .from('employee_payroll_master')
        .select(`
          id,
          employee_id,
          basic_salary,
          housing_allowance,
          transport_allowance,
          other_allowance,
          currency,
          is_active,
          employees!inner(
            id,
            employee_id,
            first_name,
            last_name,
            employment_status
          )
        `)
        .eq('is_active', true)
        .eq('employees.employment_status', 'active')
        .order('employees.first_name');

      if (tenantId) {
        query = query.eq('employees.tenant_id', tenantId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ Error fetching payroll employees:', error);
        return {
          success: false,
          error: `Failed to fetch payroll employees: ${error.message}`
        };
      }

      if (!data || data.length === 0) {
        console.log('ℹ️ No active payroll employees found');
        return {
          success: true,
          data: []
        };
      }

      // Convert to PayrollEmployee format
      const payrollEmployees: PayrollEmployee[] = data.map(payroll => {
        const emp = payroll.employees;
        const payrollEmployee: PayrollEmployee = {
          id: emp.id,
          name: `${emp.first_name} ${emp.last_name}`,
          employee_id: emp.employee_id,
          basicSalary: payroll.basic_salary || 0,
          housing: payroll.housing_allowance || 0,
          transport: payroll.transport_allowance || 0,
          arrears: 0,
          otherAllowance: payroll.other_allowance || 0,
          grossPay: 0,
          taxableAmount: 0,
          paye: 0,
          nssfEE: 0,
          hesbl: 0,
          loan: 0,
          salaryAdvance: 0,
          otherDeduction: 0,
          netSalary: 0,
          nssfER: 0,
          wcfER: 0,
          sdlER: 0
        };

        // Calculate payroll values
        return this.calculatePayrollValues(payrollEmployee);
      });

      console.log(`✅ Fetched ${payrollEmployees.length} employees for payroll`);
      return {
        success: true,
        data: payrollEmployees
      };

    } catch (error) {
      console.error('❌ Exception fetching payroll employees:', error);
      return {
        success: false,
        error: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Update employee payroll data
   */
  static async updatePayrollEmployee(employeeId: string, updates: Partial<PayrollEmployeeData>): Promise<{
    success: boolean;
    data?: PayrollEmployee;
    error?: string;
  }> {
    try {
      console.log('📝 Updating payroll employee:', employeeId);

      const { data, error } = await supabase
        .from('payroll_employees')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('employee_id', employeeId)
        .select()
        .single();

      if (error) {
        console.error('❌ Error updating payroll employee:', error);
        return {
          success: false,
          error: `Failed to update payroll employee: ${error.message}`
        };
      }

      // Convert to PayrollEmployee format
      const payrollEmployee: PayrollEmployee = {
        id: data.id,
        name: `${data.first_name} ${data.last_name}`,
        employee_id: data.employee_id,
        basicSalary: data.basic_salary,
        housing: data.housing_allowance || 0,
        transport: data.transport_allowance || 0,
        arrears: 0,
        otherAllowance: data.other_allowance || 0,
        grossPay: 0,
        taxableAmount: 0,
        paye: 0,
        nssfEE: 0,
        hesbl: 0,
        loan: 0,
        salaryAdvance: 0,
        otherDeduction: 0,
        netSalary: 0,
        nssfER: 0,
        wcfER: 0,
        sdlER: 0
      };

      console.log('✅ Payroll employee updated successfully');
      return {
        success: true,
        data: payrollEmployee
      };

    } catch (error) {
      console.error('❌ Exception updating payroll employee:', error);
      return {
        success: false,
        error: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Remove employee from payroll system
   */
  static async removePayrollEmployee(employeeId: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      console.log('🗑️ Removing employee from payroll system:', employeeId);

      const { error } = await supabase
        .from('payroll_employees')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('employee_id', employeeId);

      if (error) {
        console.error('❌ Error removing payroll employee:', error);
        return {
          success: false,
          error: `Failed to remove payroll employee: ${error.message}`
        };
      }

      console.log('✅ Employee removed from payroll system successfully');
      return { success: true };

    } catch (error) {
      console.error('❌ Exception removing payroll employee:', error);
      return {
        success: false,
        error: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Calculate payroll values for an employee
   */
  private static calculatePayrollValues(employee: PayrollEmployee): PayrollEmployee {
    const grossPay = employee.basicSalary + employee.housing + employee.transport + 
                    employee.arrears + employee.otherAllowance;
    
    // Calculate NSSF Employee contribution (10% of gross pay)
    const nssfEE = grossPay * 0.10;
    
    // Calculate taxable amount (gross pay minus NSSF employee contribution)
    const taxableAmount = grossPay - nssfEE;
    
    // Simple PAYE calculation (this should use the proper tax brackets)
    let paye = 0;
    if (taxableAmount > 100000) {
      paye = (taxableAmount - 100000) * 0.20; // 20% on amount above 100,000
    }
    
    // Calculate total deductions
    const totalDeductions = paye + nssfEE + employee.hesbl + employee.loan + 
                           employee.salaryAdvance + employee.otherDeduction;
    
    const netSalary = grossPay - totalDeductions;
    
    // Calculate employer contributions
    const nssfER = grossPay * 0.10; // 10% of gross pay
    const wcfER = grossPay * 0.01; // 1% of gross pay
    const sdlER = grossPay * 0.01; // 1% of gross pay

    return {
      ...employee,
      grossPay,
      taxableAmount,
      paye,
      nssfEE,
      netSalary,
      nssfER,
      wcfER,
      sdlER
    };
  }
}
