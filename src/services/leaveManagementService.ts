import { supabase } from '../lib/supabaseClient';

export interface LeaveRequest {
  id: string;
  employee_id: string;
  leave_type: 'annual' | 'sick' | 'maternity' | 'paternity' | 'compassionate' | 'study' | 'unpaid';
  start_date: string;
  end_date: string;
  days_requested: number;
  reason: string;
  supporting_documents: string[];
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  requested_at: string;
  approved_by?: string;
  approved_at?: string;
  rejection_reason?: string;
  remaining_balance?: number;
  created_at: string;
  updated_at: string;
}

export interface LeaveBalance {
  id: string;
  employee_id: string;
  leave_type: string;
  year: number;
  total_entitlement: number;
  used_days: number;
  remaining_days: number;
  created_at: string;
  updated_at: string;
}

export interface Employee {
  id: string;
  employee_id: string;
  first_name: string;
  last_name: string;
  email: string;
  position: string;
  department: string;
  employment_status: string;
}

export class LeaveManagementService {
  // Get all leave requests with employee details
  static async getLeaveRequests(): Promise<{ data: LeaveRequest[]; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('leave_requests')
        .select(`
          *,
          employees:employee_id (
            id,
            employee_id,
            first_name,
            last_name,
            email,
            position,
            department
          )
        `)
        .order('requested_at', { ascending: false });

      if (error) {
        console.error('Error fetching leave requests:', error);
        return { data: [], error: error.message };
      }

      return { data: data || [], error: null };
    } catch (error) {
      console.error('Error in getLeaveRequests:', error);
      return { data: [], error: 'Failed to fetch leave requests' };
    }
  }

  // Get leave requests by employee
  static async getLeaveRequestsByEmployee(employeeId: string): Promise<{ data: LeaveRequest[]; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('leave_requests')
        .select('*')
        .eq('employee_id', employeeId)
        .order('requested_at', { ascending: false });

      if (error) {
        console.error('Error fetching employee leave requests:', error);
        return { data: [], error: error.message };
      }

      return { data: data || [], error: null };
    } catch (error) {
      console.error('Error in getLeaveRequestsByEmployee:', error);
      return { data: [], error: 'Failed to fetch employee leave requests' };
    }
  }

  // Create new leave request
  static async createLeaveRequest(leaveData: Partial<LeaveRequest>): Promise<{ data: LeaveRequest | null; error: string | null }> {
    try {
      // Calculate days requested
      const startDate = new Date(leaveData.start_date!);
      const endDate = new Date(leaveData.end_date!);
      const timeDiff = endDate.getTime() - startDate.getTime();
      const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1; // +1 to include both start and end dates

      const { data, error } = await supabase
        .from('leave_requests')
        .insert([{
          employee_id: leaveData.employee_id,
          leave_type: leaveData.leave_type,
          start_date: leaveData.start_date,
          end_date: leaveData.end_date,
          days_requested: daysDiff,
          reason: leaveData.reason,
          supporting_documents: leaveData.supporting_documents || [],
          status: 'pending'
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating leave request:', error);
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error in createLeaveRequest:', error);
      return { data: null, error: 'Failed to create leave request' };
    }
  }

  // Update leave request
  static async updateLeaveRequest(id: string, updates: Partial<LeaveRequest>): Promise<{ data: LeaveRequest | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('leave_requests')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating leave request:', error);
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error in updateLeaveRequest:', error);
      return { data: null, error: 'Failed to update leave request' };
    }
  }

  // Approve leave request
  static async approveLeaveRequest(id: string, approvedBy: string): Promise<{ data: LeaveRequest | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('leave_requests')
        .update({
          status: 'approved',
          approved_by: approvedBy,
          approved_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error approving leave request:', error);
        return { data: null, error: error.message };
      }

      // Update leave balance
      if (data) {
        await this.updateLeaveBalance(data.employee_id, data.leave_type, data.days_requested);
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error in approveLeaveRequest:', error);
      return { data: null, error: 'Failed to approve leave request' };
    }
  }

  // Reject leave request
  static async rejectLeaveRequest(id: string, rejectedBy: string, rejectionReason: string): Promise<{ data: LeaveRequest | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('leave_requests')
        .update({
          status: 'rejected',
          approved_by: rejectedBy,
          approved_at: new Date().toISOString(),
          rejection_reason: rejectionReason,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error rejecting leave request:', error);
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error in rejectLeaveRequest:', error);
      return { data: null, error: 'Failed to reject leave request' };
    }
  }

  // Cancel leave request
  static async cancelLeaveRequest(id: string): Promise<{ data: LeaveRequest | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('leave_requests')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error cancelling leave request:', error);
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error in cancelLeaveRequest:', error);
      return { data: null, error: 'Failed to cancel leave request' };
    }
  }

  // Get leave balances for employee
  static async getLeaveBalances(employeeId: string): Promise<{ data: LeaveBalance[]; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('leave_balances')
        .select('*')
        .eq('employee_id', employeeId)
        .eq('year', new Date().getFullYear())
        .order('leave_type');

      if (error) {
        console.error('Error fetching leave balances:', error);
        return { data: [], error: error.message };
      }

      return { data: data || [], error: null };
    } catch (error) {
      console.error('Error in getLeaveBalances:', error);
      return { data: [], error: 'Failed to fetch leave balances' };
    }
  }

  // Update leave balance after approval
  static async updateLeaveBalance(employeeId: string, leaveType: string, daysUsed: number): Promise<{ success: boolean; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('leave_balances')
        .select('*')
        .eq('employee_id', employeeId)
        .eq('leave_type', leaveType)
        .eq('year', new Date().getFullYear())
        .single();

      if (error) {
        console.error('Error fetching leave balance:', error);
        return { success: false, error: error.message };
      }

      const newUsedDays = (data.used_days || 0) + daysUsed;

      const { error: updateError } = await supabase
        .from('leave_balances')
        .update({
          used_days: newUsedDays,
          updated_at: new Date().toISOString()
        })
        .eq('id', data.id);

      if (updateError) {
        console.error('Error updating leave balance:', updateError);
        return { success: false, error: updateError.message };
      }

      return { success: true, error: null };
    } catch (error) {
      console.error('Error in updateLeaveBalance:', error);
      return { success: false, error: 'Failed to update leave balance' };
    }
  }

  // Get all employees
  static async getEmployees(): Promise<{ data: Employee[]; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('id, employee_id, first_name, last_name, email, position, department, employment_status')
        .eq('employment_status', 'active')
        .order('first_name');

      if (error) {
        console.error('Error fetching employees:', error);
        return { data: [], error: error.message };
      }

      return { data: data || [], error: null };
    } catch (error) {
      console.error('Error in getEmployees:', error);
      return { data: [], error: 'Failed to fetch employees' };
    }
  }

  // Get leave statistics
  static async getLeaveStatistics(): Promise<{ data: any; error: string | null }> {
    try {
      const { data: requests, error: requestsError } = await supabase
        .from('leave_requests')
        .select('status, leave_type, days_requested');

      if (requestsError) {
        console.error('Error fetching leave statistics:', requestsError);
        return { data: null, error: requestsError.message };
      }

      const stats = {
        total: requests?.length || 0,
        pending: requests?.filter(r => r.status === 'pending').length || 0,
        approved: requests?.filter(r => r.status === 'approved').length || 0,
        rejected: requests?.filter(r => r.status === 'rejected').length || 0,
        byType: requests?.reduce((acc: any, req) => {
          acc[req.leave_type] = (acc[req.leave_type] || 0) + 1;
          return acc;
        }, {}) || {}
      };

      return { data: stats, error: null };
    } catch (error) {
      console.error('Error in getLeaveStatistics:', error);
      return { data: null, error: 'Failed to fetch leave statistics' };
    }
  }
}


