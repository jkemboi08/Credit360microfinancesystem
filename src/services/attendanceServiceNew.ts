import { supabase } from '../lib/supabaseClient';

export interface ClockInData {
  employee_id: string;
  time: string;
  location?: {
    lat: number;
    lng: number;
  };
  notes?: string;
}

export interface ClockOutData {
  employee_id: string;
  time: string;
  location?: {
    lat: number;
    lng: number;
  };
  notes?: string;
}

export interface AttendanceRecord {
  id: string;
  employee_id: string;
  date: string;
  check_in?: string;
  check_out?: string;
  hours_worked: number;
  overtime_hours: number;
  status: string;
  notes?: string;
  check_in_location?: string;
  check_out_location?: string;
  created_at: string;
  updated_at: string;
  employee?: {
    first_name: string;
    last_name: string;
    employee_id: string;
    position: string;
    department: string;
  };
}

export class AttendanceService {
  /**
   * Clock In - Proper Employee Verification System
   * Following the correct system logic:
   * 1. Employee logs into system (authentication)
   * 2. System verifies employee identity using employee ID
   * 3. System captures timestamp
   * 4. System stores data in database
   */
  static async clockIn(data: ClockInData): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      console.log('Clock in attempt:', data);
      
      const today = new Date().toISOString().split('T')[0];
      
      // Step 1: Employee Identification & Verification
      // Get the current authenticated user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        return { 
          success: false, 
          error: 'User authentication failed. Please log in again.' 
        };
      }

      console.log('Authenticated user details:', {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.full_name || user.email
      });

      // Step 2: Look up employee record by user ID
      // Check if employee record exists for this user
      console.log('Looking for employee with user_id:', user.id);
      let { data: employee, error: employeeError } = await supabase
        .from('employees')
        .select('id, employee_id, first_name, last_name, email, position, department, employment_status, user_id')
        .eq('user_id', user.id) // Try user_id field first
        .single();

      // If not found by user_id, try by id (temporary fallback)
      if (employeeError || !employee) {
        console.log('Employee not found by user_id, trying by id...');
        const { data: employeeById, error: employeeByIdError } = await supabase
          .from('employees')
          .select('id, employee_id, first_name, last_name, email, position, department, employment_status, user_id')
          .eq('id', user.id) // Try id field as fallback
          .single();
        
        if (employeeById && !employeeByIdError) {
          employee = employeeById;
          employeeError = null;
          
          // Update the employee record to include user_id for future use
          console.log('Updating employee record with user_id...');
          const { error: updateError } = await supabase
            .from('employees')
            .update({ user_id: user.id })
            .eq('id', user.id);
          
          if (updateError) {
            console.warn('Failed to update employee with user_id:', updateError);
          } else {
            console.log('Successfully updated employee with user_id');
            // Update the local employee object
            employee.user_id = user.id;
          }
        } else {
          // If still not found by id, try by email as last resort
          console.log('Employee not found by id, trying by email...');
          const { data: employeeByEmail, error: emailError } = await supabase
            .from('employees')
            .select('id, employee_id, first_name, last_name, email, position, department, employment_status, user_id')
            .eq('email', user.email)
            .single();
          
          if (employeeByEmail && !emailError) {
            employee = employeeByEmail;
            employeeError = null;
            
            // Update the employee record to include user_id for future use
            console.log('Updating employee record with user_id from email match...');
            const { error: updateError } = await supabase
              .from('employees')
              .update({ user_id: user.id })
              .eq('id', employeeByEmail.id);
            
            if (updateError) {
              console.warn('Failed to update employee with user_id:', updateError);
            } else {
              console.log('Successfully updated employee with user_id from email match');
              // Update the local employee object
              employee.user_id = user.id;
            }
          }
        }
      }

      console.log('Employee lookup result:', { employee, employeeError });

      if (employeeError || !employee) {
        // If no employee record found, try to create one from user data
        console.log('No employee record found, attempting to create one from user data...');
        
        // Get user profile data
        const { data: userProfile, error: profileError } = await supabase
          .from('users')
          .select('first_name, last_name, email, phone_number')
          .eq('user_id', user.id)
          .single();

        if (profileError || !userProfile) {
          console.log('No user profile found, creating basic employee record...');
          
          // Create a basic employee record
          const { data: newEmployee, error: createError } = await supabase
            .from('employees')
            .insert({
              id: user.id,
              user_id: user.id,
              employee_id: `EMP-${Date.now()}`,
              first_name: user.user_metadata?.first_name || 'Employee',
              last_name: user.user_metadata?.last_name || 'User',
              email: user.email || '',
              phone: user.user_metadata?.phone || '+255000000000',
              national_id: `AUTH${Date.now()}`,
              date_of_birth: '1990-01-01',
              gender: 'other',
              marital_status: 'single',
              position: 'Staff',
              department: 'General',
              employment_type: 'permanent',
              employment_status: 'active',
              hire_date: new Date().toISOString().split('T')[0],
              basic_salary: 0,
              allowances: 0
            })
            .select('id, employee_id, first_name, last_name, email, position, department, employment_status, user_id')
            .single();

          if (createError) {
            console.error('Failed to create employee record:', createError);
            return { 
              success: false, 
              error: 'Employee record not found and could not be created. Please contact HR to set up your employee profile before clocking in.' 
            };
          }

          employee = newEmployee;
          console.log('Created new employee record:', employee);
        } else {
          // Create employee record from user profile
          const { data: newEmployee, error: createError } = await supabase
            .from('employees')
            .insert({
              id: user.id,
              user_id: user.id,
              employee_id: `EMP-${Date.now()}`,
              first_name: userProfile.first_name || 'Employee',
              last_name: userProfile.last_name || 'User',
              email: userProfile.email || user.email || '',
              phone: userProfile.phone_number || '+255000000000',
              national_id: `AUTH${Date.now()}`,
              date_of_birth: '1990-01-01',
              gender: 'other',
              marital_status: 'single',
              position: 'Staff',
              department: 'General',
              employment_type: 'permanent',
              employment_status: 'active',
              hire_date: new Date().toISOString().split('T')[0],
              basic_salary: 0,
              allowances: 0
            })
            .select('id, employee_id, first_name, last_name, email, position, department, employment_status, user_id')
            .single();

          if (createError) {
            console.error('Failed to create employee record from profile:', createError);
            return { 
              success: false, 
              error: 'Employee record not found and could not be created. Please contact HR to set up your employee profile before clocking in.' 
            };
          }

          employee = newEmployee;
          console.log('Created new employee record from profile:', employee);
        }
      }

      // Step 3: Verify employee is active
      if (employee.employment_status !== 'active') {
        return { 
          success: false, 
          error: 'Your employee account is not active. Please contact HR for assistance.' 
        };
      }

      // Step 4: Check if employee already clocked in today
      const { data: existingRecord, error: checkError } = await supabase
        .from('attendance_records')
        .select('*')
        .eq('employee_id', employee.id) // Use employee.id from employees table
        .eq('date', today)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        return { success: false, error: checkError.message };
      }

      if (existingRecord && existingRecord.check_in) {
        return { success: false, error: 'You have already clocked in today' };
      }

      // Step 5: Timestamping - Capture exact date and time
      const currentTime = new Date();
      const standardStartTime = new Date();
      standardStartTime.setHours(8, 0, 0, 0);
      const isLate = currentTime > standardStartTime;

      // Step 6: Data Storage - Store event data in database
      const attendanceData = {
        employee_id: employee.id, // Use employee.id from employees table
        date: today,
        check_in: data.time,
        status: isLate ? 'late' : 'present',
        check_in_location: data.location ? `POINT(${data.location.lng} ${data.location.lat})` : null,
        notes: data.notes,
        created_by: employee.id, // Use employee.id
        hours_worked: 0,
        overtime_hours: 0
      };
      
      console.log('Creating attendance record with employee_id:', employee.id, 'data:', attendanceData);
      console.log('Employee details:', {
        employeeId: employee.id,
        employeeNumber: employee.employee_id,
        employeeName: `${employee.first_name} ${employee.last_name}`,
        authUserId: data.employee_id
      });

      if (existingRecord) {
        // Update existing record
        const { data: updatedRecord, error: updateError } = await supabase
          .from('attendance_records')
          .update(attendanceData)
          .eq('id', existingRecord.id)
          .select()
          .single();

        if (updateError) {
          return { success: false, error: updateError.message };
        }

        return { 
          success: true, 
          data: updatedRecord,
          error: `Clock in successful at ${data.time}${isLate ? ' (Late)' : ''}` 
        };
      } else {
        // Create new record
        const { data: newRecord, error: createError } = await supabase
          .from('attendance_records')
          .insert(attendanceData)
          .select()
          .single();

        if (createError) {
          return { success: false, error: createError.message };
        }

        return { 
          success: true, 
          data: newRecord,
          error: `Clock in successful at ${data.time}${isLate ? ' (Late)' : ''}` 
        };
      }
    } catch (error) {
      console.error('Clock in error:', error);
      return { success: false, error: 'An unexpected error occurred during clock in' };
    }
  }

  /**
   * Clock Out - Proper Employee Verification System
   * Following the correct system logic:
   * 1. Employee logs into system (authentication)
   * 2. System verifies employee identity using employee ID
   * 3. System finds existing clock-in record
   * 4. System captures timestamp and calculates hours worked
   * 5. System stores updated data in database
   */
  static async clockOut(data: ClockOutData): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      console.log('Clock out attempt:', data);
      
      const today = new Date().toISOString().split('T')[0];
      
      // Step 1: Employee Identification & Verification
      // Get the current authenticated user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        return { 
          success: false, 
          error: 'User authentication failed. Please log in again.' 
        };
      }

      // Step 2: Look up employee record by user ID
      let { data: employee, error: employeeError } = await supabase
        .from('employees')
        .select('id, employee_id, first_name, last_name, email, position, department, employment_status, user_id')
        .eq('user_id', user.id) // Try user_id field first
        .single();

      // If not found by user_id, try by id (temporary fallback)
      if (employeeError || !employee) {
        console.log('Employee not found by user_id, trying by id...');
        const { data: employeeById, error: employeeByIdError } = await supabase
          .from('employees')
          .select('id, employee_id, first_name, last_name, email, position, department, employment_status, user_id')
          .eq('id', user.id) // Try id field as fallback
          .single();
        
        if (employeeById && !employeeByIdError) {
          employee = employeeById;
          employeeError = null;
        }
      }

      console.log('Employee lookup result:', { employee, employeeError });

      if (employeeError || !employee) {
        return { 
          success: false, 
          error: 'Employee record not found. Please contact HR to set up your employee profile.' 
        };
      }

      // Step 3: Verify employee is active
      if (employee.employment_status !== 'active') {
        return { 
          success: false, 
          error: 'Your employee account is not active. Please contact HR for assistance.' 
        };
      }

      // Step 4: Find existing clock-in record for today
      console.log('Looking for attendance record with:', {
        employeeId: employee.id,
        today: today,
        userId: user.id
      });

      // First get all records for this employee today
      const { data: allRecords, error: allRecordsError } = await supabase
        .from('attendance_records')
        .select('id, employee_id, date, check_in, check_out, hours_worked, overtime_hours, status, notes, created_at, updated_at')
        .eq('employee_id', employee.id) // Use employee.id from employees table
        .eq('date', today)
        .order('created_at', { ascending: false }); // Get most recent first

      console.log('All attendance records for this employee today:', { allRecords, allRecordsError });

      // Find the most recent record that has a check_in but no check_out
      const existingRecord = allRecords?.find(record => 
        record.check_in && !record.check_out
      );

      const findError = allRecordsError;

      console.log('Attendance record search result:', { existingRecord, findError });

      if (findError || !existingRecord) {
        console.log('Clock out failed - no record found. Debug info:', {
          findError: findError?.message,
          allRecordsFound: allRecords?.length || 0,
          allRecords: allRecords,
          employeeId: employee.id,
          today: today,
          userId: user.id,
          recordsWithCheckIn: allRecords?.filter(r => r.check_in).length || 0,
          recordsWithCheckOut: allRecords?.filter(r => r.check_out).length || 0
        });
        
        return { 
          success: false, 
          error: `No clock-in record found for today. Please clock in first.` 
        };
      }

      if (existingRecord.check_out) {
        return { success: false, error: 'You have already clocked out today' };
      }

      // Step 5: Calculate hours worked
      const checkInTime = new Date(`${today}T${existingRecord.check_in}`);
      const checkOutTime = new Date(`${today}T${data.time}`);
      const hoursWorked = (checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60 * 60);
      
      // Calculate overtime (assuming 8 hours is standard)
      const standardHours = 8;
      const overtimeHours = Math.max(0, hoursWorked - standardHours);

      // Step 6: Data Storage - Update record with clock out data
      const { data: updatedRecord, error: updateError } = await supabase
        .from('attendance_records')
        .update({
          check_out: data.time,
          check_out_location: data.location ? `POINT(${data.location.lng} ${data.location.lat})` : null,
          hours_worked: Math.round(hoursWorked * 100) / 100, // Round to 2 decimal places
          overtime_hours: Math.round(overtimeHours * 100) / 100,
          notes: data.notes || existingRecord.notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingRecord.id)
        .select()
        .single();

      if (updateError) {
        return { success: false, error: updateError.message };
      }

      return { 
        success: true, 
        data: updatedRecord,
        error: `Clock out successful at ${data.time}. Hours worked: ${Math.round(hoursWorked * 100) / 100}h${overtimeHours > 0 ? ` (Overtime: ${Math.round(overtimeHours * 100) / 100}h)` : ''}` 
      };
    } catch (error) {
      console.error('Clock out error:', error);
      return { success: false, error: 'An unexpected error occurred during clock out' };
    }
  }

  /**
   * Get Today's Attendance for current user
   */
  static async getTodayAttendance(userId?: string): Promise<{ success: boolean; data?: AttendanceRecord; error?: string }> {
    try {
      // Get current authenticated user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        return { success: false, error: 'User not authenticated' };
      }

      const targetUserId = userId || user.id;

      // Get employee record
      let { data: employee, error: employeeError } = await supabase
        .from('employees')
        .select('id, employee_id, first_name, last_name, email, position, department, employment_status, user_id')
        .eq('user_id', targetUserId)
        .single();

      // If not found by user_id, try by id (temporary fallback)
      if (employeeError || !employee) {
        const { data: employeeById, error: employeeByIdError } = await supabase
          .from('employees')
          .select('id, employee_id, first_name, last_name, email, position, department, employment_status, user_id')
          .eq('id', targetUserId)
          .single();
        
        if (employeeById && !employeeByIdError) {
          employee = employeeById;
          employeeError = null;
        }
      }

      if (employeeError || !employee) {
        return { success: false, error: 'Employee record not found' };
      }

      const today = new Date().toISOString().split('T')[0];

      // Get today's attendance record
      const { data: attendanceRecord, error: attendanceError } = await supabase
        .from('attendance_records')
        .select(`
          *,
          employees!attendance_records_employee_id_fkey(first_name, last_name, employee_id, position, department)
        `)
        .eq('employee_id', employee.id)
        .eq('date', today)
        .single();

      if (attendanceError && attendanceError.code !== 'PGRST116') {
        return { success: false, error: attendanceError.message };
      }

      return { success: true, data: attendanceRecord || null };
    } catch (error) {
      console.error('Get today attendance error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  /**
   * Get Attendance Records with proper employee information
   */
  static async getAttendanceRecords(
    employeeId?: string, 
    startDate?: string, 
    endDate?: string
  ): Promise<{ success: boolean; data?: AttendanceRecord[]; error?: string }> {
    try {
      let query = supabase
        .from('attendance_records')
        .select(`
          *,
          employees!attendance_records_employee_id_fkey(first_name, last_name, employee_id, position, department)
        `)
        .order('date', { ascending: false });

      if (employeeId) {
        query = query.eq('employee_id', employeeId);
      }

      if (startDate) {
        query = query.gte('date', startDate);
      }

      if (endDate) {
        query = query.lte('date', endDate);
      }

      const { data, error } = await query;

      console.log('Attendance records query result:', { data, error });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Get attendance records error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  /**
   * Get Current User Info for display
   */
  static async getCurrentUserInfo(): Promise<{ success: boolean; data?: { name: string; email: string }; error?: string }> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        return { success: false, error: 'User not authenticated' };
      }

      // Try to get employee info
      const { data: employee } = await supabase
        .from('employees')
        .select('first_name, last_name, email')
        .eq('user_id', user.id)
        .single();

      if (employee) {
        return {
          success: true,
          data: {
            name: `${employee.first_name || ''} ${employee.last_name || ''}`.trim() || 'Unknown Employee',
            email: employee.email || user.email || 'unknown@example.com'
          }
        };
      }

      // Fallback to auth user data
      return {
        success: true,
        data: {
          name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Unknown User',
          email: user.email || 'unknown@example.com'
        }
      };
    } catch (error) {
      return { success: false, error: 'Failed to get user info' };
    }
  }

  /**
   * Create Test Record for testing purposes
   */
  static async createTestRecord(): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        return { success: false, error: 'User not authenticated' };
      }

      // Check if employee record exists
      const { data: employee, error: employeeError } = await supabase
        .from('employees')
        .select('id, employee_id, first_name, last_name')
        .eq('user_id', user.id)
        .single();

      if (employeeError || !employee) {
        return { 
          success: false, 
          error: 'Employee record not found. Please contact HR to set up your employee profile.' 
        };
      }

      const today = new Date().toISOString().split('T')[0];
      const currentTime = new Date().toTimeString().split(' ')[0];

      const { data: testRecord, error: createError } = await supabase
        .from('attendance_records')
        .insert({
          employee_id: employee.id, // Use employee.id from employees table
          date: today,
          check_in: currentTime,
          status: 'present',
          notes: 'Test record created',
          created_by: employee.id,
          hours_worked: 0,
          overtime_hours: 0
        })
        .select()
        .single();

      if (createError) {
        return { success: false, error: createError.message };
      }

      return { 
        success: true, 
        data: testRecord,
        error: `Test record created for ${employee.first_name} ${employee.last_name}` 
      };
    } catch (error) {
      console.error('Create test record error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  /**
   * Test database connection
   */
  static async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('Testing attendance_records table access...');
      const { data, error } = await supabase
        .from('attendance_records')
        .select('count')
        .limit(1);
      
      console.log('Test query result:', { data, error });
      
      if (error) {
        return { success: false, error: error.message };
      }
      
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Connection test failed' };
    }
  }
}
