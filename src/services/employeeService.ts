/**
 * Employee Service
 * Handles employee creation and management
 */

import { supabase } from '../lib/supabase';

export interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  employee_id: string;
  email: string;
  phone?: string;
  department?: string;
  position?: string;
  basic_salary: number;
  hire_date: string;
  status: 'active' | 'inactive' | 'terminated';
  created_at?: string;
  updated_at?: string;
}

export interface CreateEmployeeData {
  first_name: string;
  last_name: string;
  employee_id: string;
  email: string;
  phone?: string;
  department?: string;
  position?: string;
  basic_salary: number;
  hire_date?: string;
  status?: 'active' | 'inactive' | 'terminated';
}

export class EmployeeService {
  /**
   * Create a new employee
   */
  static async createEmployee(data: CreateEmployeeData): Promise<{
    success: boolean;
    data?: Employee;
    error?: string;
  }> {
    try {
      console.log('👤 Creating employee:', data);

      const { data: employee, error } = await supabase
        .from('employees')
        .insert([{
          first_name: data.first_name,
          last_name: data.last_name,
          employee_id: data.employee_id,
          email: data.email,
          phone: data.phone || '+255000000000',
          department: data.department || 'General',
          position: data.position || 'Employee',
          basic_salary: data.basic_salary,
          hire_date: data.hire_date || new Date().toISOString().split('T')[0],
          status: data.status || 'active'
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

      console.log('✅ Employee created successfully:', employee);
      return {
        success: true,
        data: employee
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
   * Create employees from payroll data
   */
  static async createEmployeesFromPayroll(payrollEmployees: any[]): Promise<{
    success: boolean;
    data?: { created: number; skipped: number; errors: string[] };
    error?: string;
  }> {
    try {
      console.log('👥 Creating employees from payroll data:', payrollEmployees.length);

      const results = {
        created: 0,
        skipped: 0,
        errors: [] as string[]
      };

      for (const emp of payrollEmployees) {
        try {
          // Check if employee already exists
          const { data: existingEmployee } = await supabase
            .from('employees')
            .select('id')
            .eq('id', emp.id)
            .single();

          if (existingEmployee) {
            console.log('⏭️ Employee already exists, skipping:', emp.name);
            results.skipped++;
            continue;
          }

          // Parse name into first and last name
          const nameParts = emp.name.split(' ');
          const firstName = nameParts[0] || 'Unknown';
          const lastName = nameParts.slice(1).join(' ') || '';

          // Generate email
          const email = `${firstName.toLowerCase()}.${lastName.toLowerCase().replace(/\s+/g, '')}@company.com`;

          // Create employee
          const result = await this.createEmployee({
            first_name: firstName,
            last_name: lastName,
            employee_id: emp.id,
            email: email,
            phone: '+255000000000',
            department: 'General',
            position: 'Employee',
            basic_salary: emp.basicSalary,
            hire_date: new Date().toISOString().split('T')[0],
            status: 'active'
          });

          if (result.success) {
            results.created++;
            console.log('✅ Created employee:', emp.name);
          } else {
            results.errors.push(`${emp.name}: ${result.error}`);
          }

        } catch (error) {
          const errorMsg = `${emp.name}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          results.errors.push(errorMsg);
          console.error('❌ Error creating employee:', errorMsg);
        }
      }

      console.log('📊 Employee creation summary:', results);
      return {
        success: true,
        data: results
      };

    } catch (error) {
      console.error('❌ Exception creating employees from payroll:', error);
      return {
        success: false,
        error: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Get all employees
   */
  static async getEmployees(): Promise<{
    success: boolean;
    data?: Employee[];
    error?: string;
  }> {
    try {
      console.log('👥 Fetching all employees');

      const { data: employees, error } = await supabase
        .from('employees')
        .select('*')
        .order('first_name', { ascending: true });

      if (error) {
        console.error('❌ Error fetching employees:', error);
        return {
          success: false,
          error: `Failed to fetch employees: ${error.message}`
        };
      }

      console.log(`✅ Fetched ${employees?.length || 0} employees`);
      return {
        success: true,
        data: employees || []
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
   * Update employee
   */
  static async updateEmployee(employeeId: string, data: Partial<CreateEmployeeData>): Promise<{
    success: boolean;
    data?: Employee;
    error?: string;
  }> {
    try {
      console.log('✏️ Updating employee:', employeeId);

      const { data: employee, error } = await supabase
        .from('employees')
        .update({
          ...data,
          updated_at: new Date().toISOString()
        })
        .eq('id', employeeId)
        .select()
        .single();

      if (error) {
        console.error('❌ Error updating employee:', error);
        return {
          success: false,
          error: `Failed to update employee: ${error.message}`
        };
      }

      console.log('✅ Employee updated successfully:', employee);
      return {
        success: true,
        data: employee
      };

    } catch (error) {
      console.error('❌ Exception updating employee:', error);
      return {
        success: false,
        error: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Delete employee
   */
  static async deleteEmployee(employeeId: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      console.log('🗑️ Deleting employee:', employeeId);

      const { error } = await supabase
        .from('employees')
        .delete()
        .eq('id', employeeId);

      if (error) {
        console.error('❌ Error deleting employee:', error);
        return {
          success: false,
          error: `Failed to delete employee: ${error.message}`
        };
      }

      console.log('✅ Employee deleted successfully');
      return {
        success: true
      };

    } catch (error) {
      console.error('❌ Exception deleting employee:', error);
      return {
        success: false,
        error: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
}
