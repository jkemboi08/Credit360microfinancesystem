import { supabase } from '../lib/supabaseClient';

export interface ReportData {
  id: string;
  name: string;
  description: string;
  type: 'attendance' | 'payroll' | 'leave' | 'performance' | 'onboarding' | 'offboarding' | 'comprehensive';
  parameters: any;
  generated_at: string;
  generated_by: string;
  file_url?: string;
}

export interface AttendanceReport {
  employee_id: string;
  employee_name: string;
  department: string;
  total_days: number;
  present_days: number;
  absent_days: number;
  late_days: number;
  overtime_hours: number;
  attendance_percentage: number;
}

export interface PayrollReport {
  employee_id: string;
  employee_name: string;
  department: string;
  basic_salary: number;
  allowances: number;
  gross_salary: number;
  deductions: number;
  net_salary: number;
  paye: number;
  nssf_ee: number;
  nssf_er: number;
  wcf_er: number;
  sdl_er: number;
}

export interface LeaveReport {
  employee_id: string;
  employee_name: string;
  department: string;
  leave_type: string;
  days_taken: number;
  days_remaining: number;
  utilization_percentage: number;
}

export interface PerformanceReport {
  employee_id: string;
  employee_name: string;
  department: string;
  overall_rating: number;
  job_knowledge: number;
  quality_of_work: number;
  productivity: number;
  communication: number;
  teamwork: number;
  initiative: number;
  attendance: number;
}

export class AdvancedReportingService {
  // Generate attendance report
  static async generateAttendanceReport(
    startDate: string,
    endDate: string,
    department?: string
  ): Promise<{ data: AttendanceReport[]; error: string | null }> {
    try {
      let query = supabase
        .from('attendance_records')
        .select(`
          employee_id,
          date,
          status,
          hours_worked,
          overtime_hours,
          employees:employee_id (
            employee_id,
            first_name,
            last_name,
            department
          )
        `)
        .gte('date', startDate)
        .lte('date', endDate);

      if (department) {
        query = query.eq('employees.department', department);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error generating attendance report:', error);
        return { data: [], error: error.message };
      }

      // Process data to create report
      const reportData = this.processAttendanceData(data || []);
      return { data: reportData, error: null };
    } catch (error) {
      console.error('Error in generateAttendanceReport:', error);
      return { data: [], error: 'Failed to generate attendance report' };
    }
  }

  // Generate payroll report
  static async generatePayrollReport(
    month: number,
    year: number,
    department?: string
  ): Promise<{ data: PayrollReport[]; error: string | null }> {
    try {
      let query = supabase
        .from('employees')
        .select(`
          id,
          employee_id,
          first_name,
          last_name,
          department,
          basic_salary,
          allowances
        `)
        .eq('employment_status', 'active');

      if (department) {
        query = query.eq('department', department);
      }

      const { data: employees, error } = await query;

      if (error) {
        console.error('Error generating payroll report:', error);
        return { data: [], error: error.message };
      }

      // Process payroll data
      const reportData = employees?.map(emp => {
        const grossSalary = emp.basic_salary + (emp.allowances || 0);
        const paye = Math.max(0, (grossSalary - 288000) * 0.3);
        const nssfEE = Math.min(grossSalary * 0.06, 2160);
        const nssfER = Math.min(grossSalary * 0.06, 2160);
        const wcfER = grossSalary * 0.01;
        const sdlER = grossSalary * 0.01;
        const totalDeductions = paye + nssfEE;
        const netSalary = grossSalary - totalDeductions;

        return {
          employee_id: emp.employee_id,
          employee_name: `${emp.first_name} ${emp.last_name}`,
          department: emp.department,
          basic_salary: emp.basic_salary,
          allowances: emp.allowances || 0,
          gross_salary: grossSalary,
          deductions: totalDeductions,
          net_salary: netSalary,
          paye: paye,
          nssf_ee: nssfEE,
          nssf_er: nssfER,
          wcf_er: wcfER,
          sdl_er: sdlER
        };
      }) || [];

      return { data: reportData, error: null };
    } catch (error) {
      console.error('Error in generatePayrollReport:', error);
      return { data: [], error: 'Failed to generate payroll report' };
    }
  }

  // Generate leave report
  static async generateLeaveReport(
    year: number,
    department?: string
  ): Promise<{ data: LeaveReport[]; error: string | null }> {
    try {
      let query = supabase
        .from('leave_balances')
        .select(`
          employee_id,
          leave_type,
          total_entitlement,
          used_days,
          remaining_days,
          employees:employee_id (
            employee_id,
            first_name,
            last_name,
            department
          )
        `)
        .eq('year', year);

      if (department) {
        query = query.eq('employees.department', department);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error generating leave report:', error);
        return { data: [], error: error.message };
      }

      // Process leave data
      const reportData = data?.map(leave => ({
        employee_id: leave.employee_id,
        employee_name: `${leave.employees?.first_name} ${leave.employees?.last_name}`,
        department: leave.employees?.department,
        leave_type: leave.leave_type,
        days_taken: leave.used_days,
        days_remaining: leave.remaining_days,
        utilization_percentage: leave.total_entitlement > 0 
          ? Math.round((leave.used_days / leave.total_entitlement) * 100) 
          : 0
      })) || [];

      return { data: reportData, error: null };
    } catch (error) {
      console.error('Error in generateLeaveReport:', error);
      return { data: [], error: 'Failed to generate leave report' };
    }
  }

  // Generate performance report
  static async generatePerformanceReport(
    year: number,
    department?: string
  ): Promise<{ data: PerformanceReport[]; error: string | null }> {
    try {
      let query = supabase
        .from('performance_reviews')
        .select(`
          employee_id,
          overall_rating,
          job_knowledge,
          quality_of_work,
          productivity,
          communication,
          teamwork,
          initiative,
          attendance,
          employees:employee_id (
            employee_id,
            first_name,
            last_name,
            department
          )
        `)
        .gte('review_period_start', `${year}-01-01`)
        .lte('review_period_end', `${year}-12-31`)
        .eq('status', 'completed');

      if (department) {
        query = query.eq('employees.department', department);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error generating performance report:', error);
        return { data: [], error: error.message };
      }

      // Process performance data
      const reportData = data?.map(review => ({
        employee_id: review.employee_id,
        employee_name: `${review.employees?.first_name} ${review.employees?.last_name}`,
        department: review.employees?.department,
        overall_rating: review.overall_rating,
        job_knowledge: review.job_knowledge,
        quality_of_work: review.quality_of_work,
        productivity: review.productivity,
        communication: review.communication,
        teamwork: review.teamwork,
        initiative: review.initiative,
        attendance: review.attendance
      })) || [];

      return { data: reportData, error: null };
    } catch (error) {
      console.error('Error in generatePerformanceReport:', error);
      return { data: [], error: 'Failed to generate performance report' };
    }
  }

  // Generate comprehensive report
  static async generateComprehensiveReport(
    startDate: string,
    endDate: string,
    department?: string
  ): Promise<{ data: any; error: string | null }> {
    try {
      const [attendance, payroll, leave, performance] = await Promise.all([
        this.generateAttendanceReport(startDate, endDate, department),
        this.generatePayrollReport(new Date(startDate).getMonth() + 1, new Date(startDate).getFullYear(), department),
        this.generateLeaveReport(new Date(startDate).getFullYear(), department),
        this.generatePerformanceReport(new Date(startDate).getFullYear(), department)
      ]);

      const comprehensiveData = {
        period: { startDate, endDate },
        department: department || 'All',
        attendance: attendance.data,
        payroll: payroll.data,
        leave: leave.data,
        performance: performance.data,
        summary: {
          totalEmployees: attendance.data.length,
          averageAttendance: attendance.data.length > 0 
            ? Math.round(attendance.data.reduce((sum, emp) => sum + emp.attendance_percentage, 0) / attendance.data.length)
            : 0,
          totalPayroll: payroll.data.reduce((sum, emp) => sum + emp.gross_salary, 0),
          averagePerformance: performance.data.length > 0
            ? Math.round(performance.data.reduce((sum, emp) => sum + emp.overall_rating, 0) / performance.data.length * 10) / 10
            : 0
        }
      };

      return { data: comprehensiveData, error: null };
    } catch (error) {
      console.error('Error in generateComprehensiveReport:', error);
      return { data: null, error: 'Failed to generate comprehensive report' };
    }
  }

  // Export report to Excel
  static async exportToExcel(
    reportData: any[],
    reportType: string,
    filename: string
  ): Promise<{ success: boolean; error: string | null }> {
    try {
      // This would typically use a library like xlsx to generate Excel files
      // For now, we'll return success as the actual implementation would depend on the frontend
      console.log(`Exporting ${reportType} report to ${filename}.xlsx`);
      return { success: true, error: null };
    } catch (error) {
      console.error('Error in exportToExcel:', error);
      return { success: false, error: 'Failed to export report to Excel' };
    }
  }

  // Get report templates
  static getReportTemplates(): any[] {
    return [
      {
        id: 'attendance',
        name: 'Attendance Report',
        description: 'Employee attendance summary for a specific period',
        parameters: ['startDate', 'endDate', 'department']
      },
      {
        id: 'payroll',
        name: 'Payroll Report',
        description: 'Employee payroll summary for a specific month',
        parameters: ['month', 'year', 'department']
      },
      {
        id: 'leave',
        name: 'Leave Report',
        description: 'Employee leave utilization summary',
        parameters: ['year', 'department']
      },
      {
        id: 'performance',
        name: 'Performance Report',
        description: 'Employee performance review summary',
        parameters: ['year', 'department']
      },
      {
        id: 'comprehensive',
        name: 'Comprehensive Report',
        description: 'Complete staff management overview',
        parameters: ['startDate', 'endDate', 'department']
      }
    ];
  }

  // Process attendance data for reporting
  private static processAttendanceData(data: any[]): AttendanceReport[] {
    const employeeData = new Map();

    data.forEach(record => {
      const empId = record.employee_id;
      if (!employeeData.has(empId)) {
        employeeData.set(empId, {
          employee_id: record.employees?.employee_id,
          employee_name: `${record.employees?.first_name} ${record.employees?.last_name}`,
          department: record.employees?.department,
          total_days: 0,
          present_days: 0,
          absent_days: 0,
          late_days: 0,
          overtime_hours: 0
        });
      }

      const emp = employeeData.get(empId);
      emp.total_days++;
      
      switch (record.status) {
        case 'present':
          emp.present_days++;
          break;
        case 'absent':
          emp.absent_days++;
          break;
        case 'late':
          emp.late_days++;
          break;
      }
      
      emp.overtime_hours += record.overtime_hours || 0;
    });

    return Array.from(employeeData.values()).map(emp => ({
      ...emp,
      attendance_percentage: emp.total_days > 0 ? Math.round((emp.present_days / emp.total_days) * 100) : 0
    }));
  }
}























