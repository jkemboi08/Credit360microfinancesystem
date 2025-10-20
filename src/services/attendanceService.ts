import { supabase } from '../lib/supabaseClient';

export interface AttendanceRecord {
  id: string;
  employee_id: string;
  date: string;
  check_in?: string;
  check_out?: string;
  break_start?: string;
  break_end?: string;
  hours_worked: number;
  overtime_hours: number;
  status: 'present' | 'absent' | 'late' | 'half_day' | 'sick' | 'leave';
  notes?: string;
  check_in_location?: { lat: number; lng: number };
  check_out_location?: { lat: number; lng: number };
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface ClockInOutData {
  employee_id: string;
  date: string;
  time: string;
  location?: { lat: number; lng: number };
  notes?: string;
}

export class AttendanceService {
  // Test database connection and table access
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

  // Create a test attendance record
  static async createTestRecord(userId: string): Promise<{ success: boolean; data?: AttendanceRecord; error?: string }> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const now = new Date().toTimeString().split(' ')[0];
      
      console.log('Creating test attendance record for user:', userId);
      
      // First, check if the employee exists in the employees table
      let { data: employee, error: employeeError } = await supabase
        .from('employees')
        .select('id')
        .eq('id', userId)
        .single();

      // If employee doesn't exist, create employee record using auth user data
      if (employeeError || !employee) {
        console.log('Employee not found, creating employee record...');
        
        // Get current user from auth to get email
        const { data: { user: authUser } } = await supabase.auth.getUser();
        
        if (!authUser) {
          return { 
            success: false, 
            error: 'User not authenticated. Please log in again.' 
          };
        }

        // Create employee record using auth user data
        const { data: newEmployee, error: createError } = await supabase
          .from('employees')
          .insert({
            id: userId,
            employee_id: `EMP-${Date.now()}`,
            first_name: 'Test',
            last_name: 'User',
            email: authUser.email || 'test@example.com',
            phone: '+255000000000',
            national_id: `TEST${Date.now()}${Math.random().toString(36).substr(2, 9)}`,
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
          .select('id, employee_id, first_name, last_name, email, national_id')
          .single();

        if (createError) {
          console.error('Error creating employee record:', createError);
          return { 
            success: false, 
            error: `Failed to create employee record: ${createError.message}` 
          };
        }
        
        console.log('Employee record created:', newEmployee);
        console.log('New employee ID:', newEmployee.id);
        employee = newEmployee;
        console.log('Employee record created successfully:', employee);
      }
      
      // Now create the attendance record using the employee ID
      const { data, error } = await supabase
        .from('attendance_records')
        .insert({
          employee_id: employee.id,
          date: today,
          check_in: now,
          status: 'present',
          hours_worked: 0,
          overtime_hours: 0,
          created_by: employee.id
        })
        .select()
        .single();
      
      console.log('Test record creation result:', { data, error });
      
      if (error) {
        return { success: false, error: error.message };
      }
      
      return { success: true, data };
    } catch (error) {
      return { success: false, error: 'Test record creation failed' };
    }
  }

  // Clock in an employee
  static async clockIn(data: ClockInOutData): Promise<{ success: boolean; data?: AttendanceRecord; error?: string }> {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // First, check if the employee exists in the employees table by user_id
      let { data: employee, error: employeeError } = await supabase
        .from('employees')
        .select('id, user_id, first_name, last_name, employment_status')
        .eq('user_id', data.employee_id)
        .single();

      // If employee doesn't exist by user_id, try by id field as fallback
      if (employeeError || !employee) {
        console.log('Employee not found by user_id, trying by id...');
        const { data: employeeById, error: employeeByIdError } = await supabase
          .from('employees')
          .select('id, user_id, first_name, last_name, employment_status')
          .eq('id', data.employee_id)
          .single();
        
        if (employeeById && !employeeByIdError) {
          employee = employeeById;
          employeeError = null;
        }
      }

      // If still not found, check if user exists in users table and create employee record
      if (employeeError || !employee) {
        console.log('Employee not found, checking users table...');
        
        // First try to get user by ID
        let { data: userData, error: userError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.employee_id)
          .single();

        // If not found by ID, try to get by user_id field
        if (userError || !userData) {
          console.log('User not found by ID, trying user_id field...');
          const { data: userDataByUserId, error: userErrorByUserId } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', data.employee_id)
            .single();
          
          if (userDataByUserId && !userErrorByUserId) {
            userData = userDataByUserId;
            userError = null;
          }
        }

        // If still not found, try to get by email (as a last resort)
        if (userError || !userData) {
          console.log('User not found by ID or user_id, trying by email...');
          // Get current user from auth to get email
          const { data: { user: authUser } } = await supabase.auth.getUser();
          if (authUser?.email) {
            const { data: userDataByEmail, error: userErrorByEmail } = await supabase
              .from('users')
              .select('*')
              .eq('email', authUser.email)
              .single();
            
            if (userDataByEmail && !userErrorByEmail) {
              userData = userDataByEmail;
              userError = null;
            }
          }
        }

        if (userError || !userData) {
          console.error('User not found in database:', { 
            employeeId: data.employee_id, 
            error: userError?.message 
          });
          return { 
            success: false, 
            error: 'User profile not found. Please contact administrator to set up your employee record.' 
          };
        }

        // Create employee record using user data
        const { data: newEmployee, error: createError } = await supabase
          .from('employees')
          .insert({
            id: data.employee_id, // Use auth user ID as primary key temporarily
            employee_id: userData.user_id || `EMP-${Date.now()}`,
            first_name: userData.first_name || 'Unknown',
            last_name: userData.last_name || 'User',
            email: userData.email,
            phone: userData.phone_number || '+255000000000',
            national_id: userData.national_id || `AUTH${Date.now()}${Math.random().toString(36).substr(2, 9)}`,
            date_of_birth: userData.date_of_birth || '1990-01-01',
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
          .select('id, employee_id, first_name, last_name, email, national_id')
          .single();

        if (createError) {
          return { 
            success: false, 
            error: `Failed to create employee record: ${createError.message}` 
          };
        }
        
        console.log('Employee record created:', newEmployee);
        console.log('New employee ID:', newEmployee.id);
        employee = newEmployee;
      }
      
      // Check if employee already clocked in today
      const { data: existingRecord, error: checkError } = await supabase
        .from('attendance_records')
        .select('*')
        .eq('employee_id', data.employee_id) // Use auth user ID directly
        .eq('date', today)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        return { success: false, error: checkError.message };
      }

      if (existingRecord && existingRecord.check_in) {
        return { success: false, error: 'Employee has already clocked in today' };
      }

      // Determine if employee is late (assuming 8:00 AM as standard start time)
      const currentTime = new Date();
      const standardStartTime = new Date();
      standardStartTime.setHours(8, 0, 0, 0);
      const isLate = currentTime > standardStartTime;

      const attendanceData = {
        employee_id: data.employee_id, // Use auth user ID directly for consistency
        date: today,
        check_in: data.time,
        status: isLate ? 'late' : 'present',
        check_in_location: data.location ? `POINT(${data.location.lng} ${data.location.lat})` : null,
        notes: data.notes,
        created_by: data.employee_id, // Use auth user ID directly
        hours_worked: 0,
        overtime_hours: 0
      };
      
      console.log('Creating attendance record with employee_id:', data.employee_id, 'data:', attendanceData);

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

        console.log('Updated existing attendance record:', updatedRecord);
        return { success: true, data: updatedRecord };
      } else {
        // Create new record
        console.log('Creating new attendance record with data:', attendanceData);
        const { data: newRecord, error: insertError } = await supabase
          .from('attendance_records')
          .insert(attendanceData)
          .select()
          .single();

        if (insertError) {
          console.error('Error creating attendance record:', insertError);
          return { success: false, error: insertError.message };
        }

        console.log('Created new attendance record:', newRecord);
        return { success: true, data: newRecord };
      }
    } catch (error) {
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  // Clock out an employee
  static async clockOut(data: ClockInOutData): Promise<{ success: boolean; data?: AttendanceRecord; error?: string }> {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // First, check if the employee exists in the employees table
      let { data: employee, error: employeeError } = await supabase
        .from('employees')
        .select('id')
        .eq('id', data.employee_id)
        .single();

      // If employee doesn't exist, check if user exists in users table and create employee record
      if (employeeError || !employee) {
        console.log('Employee not found, checking users table...');
        
        // Get user data from users table
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.employee_id)
          .single();

        if (userError || !userData) {
          return { 
            success: false, 
            error: 'User not found. Please contact administrator.' 
          };
        }

        // Create employee record using user data
        const { data: newEmployee, error: createError } = await supabase
          .from('employees')
          .insert({
            id: data.employee_id, // Use auth user ID as primary key temporarily
            employee_id: userData.user_id || `EMP-${Date.now()}`,
            first_name: userData.first_name || 'Unknown',
            last_name: userData.last_name || 'User',
            email: userData.email,
            phone: userData.phone_number || '+255000000000',
            national_id: userData.national_id || `AUTH${Date.now()}${Math.random().toString(36).substr(2, 9)}`,
            date_of_birth: userData.date_of_birth || '1990-01-01',
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
          .select('id, employee_id, first_name, last_name, email, national_id')
          .single();

        if (createError) {
          return { 
            success: false, 
            error: `Failed to create employee record: ${createError.message}` 
          };
        }
        
        console.log('Employee record created:', newEmployee);
        console.log('New employee ID:', newEmployee.id);
        employee = newEmployee;
      }
      
      // Find today's attendance record using the auth user ID directly
      console.log('Looking for attendance record with employee_id:', data.employee_id, 'date:', today);
      
      const { data: existingRecord, error: findError } = await supabase
        .from('attendance_records')
        .select('id, employee_id, date, check_in, check_out, hours_worked, overtime_hours, status, notes, created_at, updated_at')
        .eq('employee_id', data.employee_id) // Use auth user ID directly
        .eq('date', today)
        .single();

      console.log('Attendance record search result:', { existingRecord, findError });

      if (findError) {
        // Let's also try to find any attendance records for this employee today
        const { data: allRecords, error: allRecordsError } = await supabase
          .from('attendance_records')
          .select('id, employee_id, date, check_in, check_out, hours_worked, overtime_hours, status, notes, created_at, updated_at')
          .eq('employee_id', data.employee_id) // Use auth user ID directly
          .eq('date', today);
        
        console.log('All attendance records for this employee today:', { allRecords, allRecordsError });
        
        // Let's also try to find records using the original user ID
        const { data: userRecords, error: userRecordsError } = await supabase
          .from('attendance_records')
          .select('id, employee_id, date, check_in, check_out, hours_worked, overtime_hours, status, notes, created_at, updated_at')
          .eq('employee_id', data.employee_id)
          .eq('date', today);
        
        console.log('All attendance records for original user ID today:', { userRecords, userRecordsError });
        
        // Let's also try to find any records for today regardless of employee
        const { data: anyRecords, error: anyRecordsError } = await supabase
          .from('attendance_records')
          .select('id, employee_id, date, check_in, check_out, hours_worked, overtime_hours, status, notes, created_at, updated_at')
          .eq('date', today);
        
        console.log('Any attendance records for today:', { anyRecords, anyRecordsError });
        
        return { success: false, error: `No clock-in record found for today. Employee ID: ${employee.id}, Original User ID: ${data.employee_id}, Date: ${today}` };
      }

      if (existingRecord.check_out) {
        return { success: false, error: 'Employee has already clocked out today' };
      }

      // Calculate hours worked
      const checkInTime = new Date(`${today}T${existingRecord.check_in}`);
      const checkOutTime = new Date(`${today}T${data.time}`);
      const hoursWorked = (checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60 * 60);
      
      // Calculate overtime (assuming 8 hours is standard)
      const standardHours = 8;
      const overtimeHours = Math.max(0, hoursWorked - standardHours);

      const updateData = {
        check_out: data.time,
        check_out_location: data.location ? `POINT(${data.location.lng} ${data.location.lat})` : null,
        hours_worked: Math.round(hoursWorked * 100) / 100,
        overtime_hours: Math.round(overtimeHours * 100) / 100,
        notes: data.notes || existingRecord.notes,
        updated_at: new Date().toISOString()
      };

      const { data: updatedRecord, error: updateError } = await supabase
        .from('attendance_records')
        .update(updateData)
        .eq('id', existingRecord.id)
        .select()
        .single();

      if (updateError) {
        return { success: false, error: updateError.message };
      }

      return { success: true, data: updatedRecord };
    } catch (error) {
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  // Get today's attendance status for an employee
  static async getTodayAttendance(employeeId: string): Promise<{ 
    success: boolean; 
    data?: AttendanceRecord; 
    error?: string 
  }> {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('attendance_records')
        .select('*')
        .eq('employee_id', employeeId)
        .eq('date', today)
        .single();

      if (error && error.code !== 'PGRST116') {
        return { success: false, error: error.message };
      }

      return { success: true, data: data || null };
    } catch (error) {
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  // Get attendance records for a date range
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
        console.error('Database error loading attendance records:', error);
        return { success: false, error: error.message };
      }

      console.log('Successfully loaded attendance records:', data?.length || 0);
      return { success: true, data: data || [] };
    } catch (error) {
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  // Get attendance summary for today
  static async getTodaySummary(): Promise<{ 
    success: boolean; 
    data?: { 
      present: number; 
      absent: number; 
      late: number; 
      total: number 
    }; 
    error?: string 
  }> {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('attendance_records')
        .select('status')
        .eq('date', today);

      if (error) {
        return { success: false, error: error.message };
      }

      const summary = {
        present: data?.filter(record => record.status === 'present').length || 0,
        absent: data?.filter(record => record.status === 'absent').length || 0,
        late: data?.filter(record => record.status === 'late').length || 0,
        total: data?.length || 0
      };

      return { success: true, data: summary };
    } catch (error) {
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  // Update attendance record
  static async updateAttendanceRecord(
    recordId: string, 
    updates: Partial<AttendanceRecord>
  ): Promise<{ success: boolean; data?: AttendanceRecord; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('attendance_records')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', recordId)
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  // Delete attendance record
  static async deleteAttendanceRecord(recordId: string): Promise<{ 
    success: boolean; 
    error?: string 
  }> {
    try {
      const { error } = await supabase
        .from('attendance_records')
        .delete()
        .eq('id', recordId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  static async getCurrentUserInfo(): Promise<{ success: boolean; data?: { name: string; email: string }; error?: string }> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        return { success: false, error: 'User not authenticated' };
      }

      // Try to get user info from the users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('first_name, last_name, email')
        .eq('id', user.id)
        .single();

      if (userData) {
        return {
          success: true,
          data: {
            name: `${userData.first_name || ''} ${userData.last_name || ''}`.trim() || 'Unknown User',
            email: userData.email || user.email || 'unknown@example.com'
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
}


