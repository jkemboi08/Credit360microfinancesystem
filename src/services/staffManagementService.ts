/**
 * Staff Management Service
 * Handles all staff-related operations including payroll processing
 */

import { supabase } from '../lib/supabaseClient';

export interface Employee {
  id: string;
  employee_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  position: string;
  department: string;
  salary: number;
  employment_status: 'active' | 'inactive' | 'terminated';
  hire_date: string;
  created_at: string;
  updated_at: string;
}

export interface PayrollRecord {
  id: string;
  employee_id: string;
  pay_period_start: string;
  pay_period_end: string;
  basic_salary: number;
  allowances: number;
  deductions: number;
  net_salary: number;
  status: 'pending' | 'approved' | 'paid';
  created_at: string;
  updated_at: string;
}

export interface LeaveRequest {
  id: string;
  employee_id: string;
  leave_type: 'annual' | 'sick' | 'maternity' | 'paternity' | 'emergency';
  start_date: string;
  end_date: string;
  days_requested: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
}

export class StaffManagementService {
  /**
   * Get all employees - TENANT FILTERED
   */
  static async getEmployees(): Promise<{
    success: boolean;
    data?: Employee[];
    error?: string;
  }> {
    try {
      console.log('👥 Getting all employees for current tenant');

      // Get current tenant context
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return {
          success: false,
          error: 'User not authenticated'
        };
      }

      // Get user's tenant IDs
      const { data: tenantUsers, error: tenantError } = await supabase
        .from('tenant_users')
        .select('tenant_id')
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (tenantError || !tenantUsers || tenantUsers.length === 0) {
        return {
          success: false,
          error: 'User not associated with any tenant'
        };
      }

      const tenantIds = tenantUsers.map(tu => tu.tenant_id);

      const { data, error } = await supabase
        .from('employees')
        .select(`
          id,
          employee_id,
          first_name,
          last_name,
          email,
          phone_number,
          position,
          department,
          salary,
          employment_status,
          hire_date,
          created_at,
          updated_at
        `)
        .in('tenant_id', tenantIds)
        .eq('employment_status', 'active')
        .order('first_name');

      if (error) {
        console.error('❌ Error fetching employees:', error);
        return {
          success: false,
          error: `Failed to fetch employees: ${error.message}`
        };
      }

      console.log(`✅ Retrieved ${data?.length || 0} employees for tenant(s): ${tenantIds.join(', ')}`);
      return {
        success: true,
        data: data || []
      };

    } catch (error) {
      console.error('❌ Exception fetching employees:', error);
      return {
        success: false,
        error: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Create a new employee
   */
  static async createEmployee(employeeData: {
    employee_id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone_number: string;
    position: string;
    department: string;
    salary: number;
    hire_date: string;
  }): Promise<{
    success: boolean;
    data?: Employee;
    error?: string;
  }> {
    try {
      console.log('➕ Creating new employee:', employeeData.employee_id);

      const { data, error } = await supabase
        .from('employees')
        .insert([{
          ...employeeData,
          employment_status: 'active'
        }])
        .select()
        .single();

      if (error) {
        console.error('❌ Error creating employee:', error);
        return {
          success: false,
          error: `Failed to create employee: ${error.message}`
        };
      }

      console.log('✅ Employee created successfully');
      return {
        success: true,
        data
      };

    } catch (error) {
      console.error('❌ Exception creating employee:', error);
      return {
        success: false,
        error: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Process payroll for all employees
   */
  static async processPayroll(payPeriodStart: string, payPeriodEnd: string): Promise<{
    success: boolean;
    data?: PayrollRecord[];
    error?: string;
  }> {
    try {
      console.log('💰 Processing payroll for period:', payPeriodStart, 'to', payPeriodEnd);

      // Get all active employees
      const employeesResult = await this.getEmployees();
      if (!employeesResult.success || !employeesResult.data) {
        return {
          success: false,
          error: 'Failed to fetch employees for payroll processing'
        };
      }

      const employees = employeesResult.data;
      const payrollRecords = [];

      for (const employee of employees) {
        // Calculate basic salary (assuming monthly)
        const basicSalary = employee.salary || 0;
        
        // Calculate allowances (example: 10% of basic salary)
        const allowances = basicSalary * 0.1;
        
        // Calculate deductions (example: 5% for taxes, 2% for social security)
        const taxDeduction = basicSalary * 0.05;
        const socialSecurityDeduction = basicSalary * 0.02;
        const totalDeductions = taxDeduction + socialSecurityDeduction;
        
        // Calculate net salary
        const netSalary = basicSalary + allowances - totalDeductions;

        // Create payroll record
        const { data: payrollRecord, error: payrollError } = await supabase
          .from('payroll_records')
          .insert([{
            employee_id: employee.id,
            pay_period_start: payPeriodStart,
            pay_period_end: payPeriodEnd,
            basic_salary: basicSalary,
            allowances: allowances,
            deductions: totalDeductions,
            net_salary: netSalary,
            status: 'pending'
          }])
          .select()
          .single();

        if (payrollError) {
          console.error(`❌ Error creating payroll record for ${employee.employee_id}:`, payrollError);
          continue; // Continue with other employees
        }

        payrollRecords.push(payrollRecord);
      }

      console.log(`✅ Payroll processed for ${payrollRecords.length} employees`);
      return {
        success: true,
        data: payrollRecords
      };

    } catch (error) {
      console.error('❌ Exception processing payroll:', error);
      return {
        success: false,
        error: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Get payroll records for an employee
   */
  static async getEmployeePayroll(employeeId: string, limit: number = 12): Promise<{
    success: boolean;
    data?: PayrollRecord[];
    error?: string;
  }> {
    try {
      console.log('📊 Getting payroll records for employee:', employeeId);

      const { data, error } = await supabase
        .from('payroll_records')
        .select(`
          id,
          employee_id,
          pay_period_start,
          pay_period_end,
          basic_salary,
          allowances,
          deductions,
          net_salary,
          status,
          created_at,
          updated_at
        `)
        .eq('employee_id', employeeId)
        .order('pay_period_start', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('❌ Error fetching payroll records:', error);
        return {
          success: false,
          error: `Failed to fetch payroll records: ${error.message}`
        };
      }

      console.log(`✅ Retrieved ${data?.length || 0} payroll records`);
      return {
        success: true,
        data: data || []
      };

    } catch (error) {
      console.error('❌ Exception fetching payroll records:', error);
      return {
        success: false,
        error: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Create a leave request
   */
  static async createLeaveRequest(leaveData: {
    employee_id: string;
    leave_type: 'annual' | 'sick' | 'maternity' | 'paternity' | 'emergency';
    start_date: string;
    end_date: string;
    reason: string;
  }): Promise<{
    success: boolean;
    data?: LeaveRequest;
    error?: string;
  }> {
    try {
      console.log('📝 Creating leave request for employee:', leaveData.employee_id);

      // Calculate days requested
      const startDate = new Date(leaveData.start_date);
      const endDate = new Date(leaveData.end_date);
      const daysRequested = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

      const { data, error } = await supabase
        .from('leave_requests')
        .insert([{
          ...leaveData,
          days_requested: daysRequested,
          status: 'pending'
        }])
        .select()
        .single();

      if (error) {
        console.error('❌ Error creating leave request:', error);
        return {
          success: false,
          error: `Failed to create leave request: ${error.message}`
        };
      }

      console.log('✅ Leave request created successfully');
      return {
        success: true,
        data
      };

    } catch (error) {
      console.error('❌ Exception creating leave request:', error);
      return {
        success: false,
        error: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Get leave requests for an employee
   */
  static async getEmployeeLeaveRequests(employeeId: string): Promise<{
    success: boolean;
    data?: LeaveRequest[];
    error?: string;
  }> {
    try {
      console.log('📋 Getting leave requests for employee:', employeeId);

      const { data, error } = await supabase
        .from('leave_requests')
        .select(`
          id,
          employee_id,
          leave_type,
          start_date,
          end_date,
          days_requested,
          reason,
          status,
          created_at,
          updated_at
        `)
        .eq('employee_id', employeeId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching leave requests:', error);
        return {
          success: false,
          error: `Failed to fetch leave requests: ${error.message}`
        };
      }

      console.log(`✅ Retrieved ${data?.length || 0} leave requests`);
      return {
        success: true,
        data: data || []
      };

    } catch (error) {
      console.error('❌ Exception fetching leave requests:', error);
      return {
        success: false,
        error: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Update leave request status
   */
  static async updateLeaveRequestStatus(
    leaveRequestId: string, 
    status: 'approved' | 'rejected'
  ): Promise<{
    success: boolean;
    data?: LeaveRequest;
    error?: string;
  }> {
    try {
      console.log('🔄 Updating leave request status:', leaveRequestId, 'to', status);

      const { data, error } = await supabase
        .from('leave_requests')
        .update({ status })
        .eq('id', leaveRequestId)
        .select()
        .single();

      if (error) {
        console.error('❌ Error updating leave request status:', error);
        return {
          success: false,
          error: `Failed to update leave request: ${error.message}`
        };
      }

      console.log('✅ Leave request status updated successfully');
      return {
        success: true,
        data
      };

    } catch (error) {
      console.error('❌ Exception updating leave request status:', error);
      return {
        success: false,
        error: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Get staff statistics
   */
  static async getStaffStatistics(): Promise<{
    success: boolean;
    data?: {
      totalEmployees: number;
      activeEmployees: number;
      totalPayrollAmount: number;
      pendingLeaveRequests: number;
    };
    error?: string;
  }> {
    try {
      console.log('📊 Getting staff statistics');

      // Get employee count
      const { data: employees, error: employeesError } = await supabase
        .from('employees')
        .select('id, employment_status, salary');

      if (employeesError) {
        return {
          success: false,
          error: `Failed to fetch employee data: ${employeesError.message}`
        };
      }

      const activeEmployees = employees?.filter(emp => emp.employment_status === 'active') || [];
      const totalPayrollAmount = activeEmployees.reduce((sum, emp) => sum + (emp.salary || 0), 0);

      // Get pending leave requests count
      const { data: leaveRequests, error: leaveError } = await supabase
        .from('leave_requests')
        .select('id')
        .eq('status', 'pending');

      if (leaveError) {
        console.error('⚠️  Could not fetch leave requests count:', leaveError.message);
      }

      const stats = {
        totalEmployees: employees?.length || 0,
        activeEmployees: activeEmployees.length,
        totalPayrollAmount,
        pendingLeaveRequests: leaveRequests?.length || 0
      };

      console.log('✅ Staff statistics calculated');
      return {
        success: true,
        data: stats
      };

    } catch (error) {
      console.error('❌ Exception calculating staff statistics:', error);
      return {
        success: false,
        error: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
}






