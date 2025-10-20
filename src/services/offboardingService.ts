import { supabase } from '../lib/supabaseClient';

export interface OffboardingChecklistItem {
  id: string;
  employee_id: string;
  checklist_item: string;
  category: 'documentation' | 'compliance' | 'system_cleanup' | 'final_settlement' | 'handover';
  is_completed: boolean;
  completed_by?: string;
  completed_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface OffboardingTemplate {
  item: string;
  category: 'documentation' | 'compliance' | 'system_cleanup' | 'final_settlement' | 'handover';
  description: string;
  required: boolean;
  order: number;
}

export class OffboardingService {
  // Default offboarding checklist template
  static readonly OFFBOARDING_TEMPLATE: OffboardingTemplate[] = [
    // Documentation
    {
      item: 'Return Company Property',
      category: 'documentation',
      description: 'Return all company property (laptop, phone, keys, etc.)',
      required: true,
      order: 1
    },
    {
      item: 'Return Security Badge',
      category: 'documentation',
      description: 'Return security badge and access cards',
      required: true,
      order: 2
    },
    {
      item: 'Return Company Documents',
      category: 'documentation',
      description: 'Return all company documents and files',
      required: true,
      order: 3
    },
    {
      item: 'Complete Exit Interview',
      category: 'documentation',
      description: 'Complete exit interview with HR',
      required: true,
      order: 4
    },
    {
      item: 'Submit Final Report',
      category: 'documentation',
      description: 'Submit final work report and handover notes',
      required: true,
      order: 5
    },

    // Compliance
    {
      item: 'Confidentiality Agreement Review',
      category: 'compliance',
      description: 'Review and acknowledge ongoing confidentiality obligations',
      required: true,
      order: 6
    },
    {
      item: 'Non-Compete Agreement',
      category: 'compliance',
      description: 'Review non-compete agreement terms',
      required: true,
      order: 7
    },
    {
      item: 'Data Security Clearance',
      category: 'compliance',
      description: 'Ensure all sensitive data has been properly handled',
      required: true,
      order: 8
    },
    {
      item: 'Client Information Protection',
      category: 'compliance',
      description: 'Confirm client information protection protocols',
      required: true,
      order: 9
    },

    // System Cleanup
    {
      item: 'Email Account Deactivation',
      category: 'system_cleanup',
      description: 'Deactivate company email account',
      required: true,
      order: 10
    },
    {
      item: 'System Access Revocation',
      category: 'system_cleanup',
      description: 'Revoke all system access and permissions',
      required: true,
      order: 11
    },
    {
      item: 'Password Reset',
      category: 'system_cleanup',
      description: 'Reset all system passwords',
      required: true,
      order: 12
    },
    {
      item: 'Software License Recovery',
      category: 'system_cleanup',
      description: 'Recover software licenses and subscriptions',
      required: true,
      order: 13
    },
    {
      item: 'Data Backup and Transfer',
      category: 'system_cleanup',
      description: 'Backup and transfer necessary data',
      required: true,
      order: 14
    },

    // Final Settlement
    {
      item: 'Final Salary Calculation',
      category: 'final_settlement',
      description: 'Calculate and process final salary payment',
      required: true,
      order: 15
    },
    {
      item: 'Outstanding Allowances',
      category: 'final_settlement',
      description: 'Process outstanding allowances and benefits',
      required: true,
      order: 16
    },
    {
      item: 'Leave Balance Settlement',
      category: 'final_settlement',
      description: 'Calculate and pay unused leave balance',
      required: true,
      order: 17
    },
    {
      item: 'NSSF Final Contribution',
      category: 'final_settlement',
      description: 'Process final NSSF contribution',
      required: true,
      order: 18
    },
    {
      item: 'Tax Clearance',
      category: 'final_settlement',
      description: 'Process final tax clearance',
      required: true,
      order: 19
    },
    {
      item: 'Pension Fund Settlement',
      category: 'final_settlement',
      description: 'Process pension fund settlement if applicable',
      required: true,
      order: 20
    },

    // Handover
    {
      item: 'Client Handover',
      category: 'handover',
      description: 'Hand over all client accounts and relationships',
      required: true,
      order: 21
    },
    {
      item: 'Project Handover',
      category: 'handover',
      description: 'Hand over all ongoing projects and tasks',
      required: true,
      order: 22
    },
    {
      item: 'Knowledge Transfer',
      category: 'handover',
      description: 'Complete knowledge transfer sessions',
      required: true,
      order: 23
    },
    {
      item: 'Team Notification',
      category: 'handover',
      description: 'Notify team members of departure and handover',
      required: true,
      order: 24
    },
    {
      item: 'External Stakeholder Notification',
      category: 'handover',
      description: 'Notify external stakeholders of departure',
      required: true,
      order: 25
    }
  ];

  // Create offboarding checklist for departing employee
  static async createOffboardingChecklist(employeeId: string): Promise<{ success: boolean; error: string | null }> {
    try {
      const checklistItems = this.OFFBOARDING_TEMPLATE.map(template => ({
        employee_id: employeeId,
        checklist_item: template.item,
        category: template.category,
        is_completed: false
      }));

      const { error } = await supabase
        .from('offboarding_checklist')
        .insert(checklistItems);

      if (error) {
        console.error('Error creating offboarding checklist:', error);
        return { success: false, error: error.message };
      }

      return { success: true, error: null };
    } catch (error) {
      console.error('Error in createOffboardingChecklist:', error);
      return { success: false, error: 'Failed to create offboarding checklist' };
    }
  }

  // Get offboarding checklist for employee
  static async getOffboardingChecklist(employeeId: string): Promise<{ data: OffboardingChecklistItem[]; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('offboarding_checklist')
        .select('*')
        .eq('employee_id', employeeId)
        .order('created_at');

      if (error) {
        console.error('Error fetching offboarding checklist:', error);
        return { data: [], error: error.message };
      }

      return { data: data || [], error: null };
    } catch (error) {
      console.error('Error in getOffboardingChecklist:', error);
      return { data: [], error: 'Failed to fetch offboarding checklist' };
    }
  }

  // Update checklist item
  static async updateChecklistItem(
    itemId: string,
    isCompleted: boolean,
    completedBy: string,
    notes?: string
  ): Promise<{ success: boolean; error: string | null }> {
    try {
      const updateData: any = {
        is_completed: isCompleted,
        updated_at: new Date().toISOString()
      };

      if (isCompleted) {
        updateData.completed_by = completedBy;
        updateData.completed_at = new Date().toISOString();
      } else {
        updateData.completed_by = null;
        updateData.completed_at = null;
      }

      if (notes) {
        updateData.notes = notes;
      }

      const { error } = await supabase
        .from('offboarding_checklist')
        .update(updateData)
        .eq('id', itemId);

      if (error) {
        console.error('Error updating checklist item:', error);
        return { success: false, error: error.message };
      }

      return { success: true, error: null };
    } catch (error) {
      console.error('Error in updateChecklistItem:', error);
      return { success: false, error: 'Failed to update checklist item' };
    }
  }

  // Get offboarding progress
  static async getOffboardingProgress(employeeId: string): Promise<{ 
    data: any; 
    error: string | null 
  }> {
    try {
      const { data: checklist, error } = await this.getOffboardingChecklist(employeeId);
      
      if (error) {
        return { data: null, error };
      }

      const totalItems = checklist.length;
      const completedItems = checklist.filter(item => item.is_completed).length;
      const progressPercentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

      const progressByCategory = checklist.reduce((acc: any, item) => {
        if (!acc[item.category]) {
          acc[item.category] = { total: 0, completed: 0 };
        }
        acc[item.category].total++;
        if (item.is_completed) {
          acc[item.category].completed++;
        }
        return acc;
      }, {});

      // Calculate percentage for each category
      Object.keys(progressByCategory).forEach(category => {
        const categoryData = progressByCategory[category];
        categoryData.percentage = categoryData.total > 0 
          ? Math.round((categoryData.completed / categoryData.total) * 100) 
          : 0;
      });

      return {
        data: {
          totalItems,
          completedItems,
          progressPercentage,
          progressByCategory,
          isComplete: completedItems === totalItems
        },
        error: null
      };
    } catch (error) {
      console.error('Error in getOffboardingProgress:', error);
      return { data: null, error: 'Failed to get offboarding progress' };
    }
  }

  // Get all employees with offboarding status
  static async getEmployeesOffboardingStatus(): Promise<{ data: any[]; error: string | null }> {
    try {
      const { data: employees, error: employeesError } = await supabase
        .from('employees')
        .select('id, employee_id, first_name, last_name, position, department, termination_date, resignation_date')
        .in('employment_status', ['terminated', 'resigned'])
        .order('termination_date', { ascending: false });

      if (employeesError) {
        console.error('Error fetching employees:', employeesError);
        return { data: [], error: employeesError.message };
      }

      const employeesWithProgress = await Promise.all(
        employees.map(async (employee) => {
          const { data: progress } = await this.getOffboardingProgress(employee.id);
          return {
            ...employee,
            offboardingProgress: progress
          };
        })
      );

      return { data: employeesWithProgress, error: null };
    } catch (error) {
      console.error('Error in getEmployeesOffboardingStatus:', error);
      return { data: [], error: 'Failed to get employees offboarding status' };
    }
  }

  // Get offboarding statistics
  static async getOffboardingStatistics(): Promise<{ data: any; error: string | null }> {
    try {
      const { data: employees, error } = await this.getEmployeesOffboardingStatus();
      
      if (error) {
        return { data: null, error };
      }

      const stats = {
        totalDepartures: employees.length,
        completedOffboarding: employees.filter(emp => emp.offboardingProgress?.isComplete).length,
        inProgress: employees.filter(emp => 
          !emp.offboardingProgress?.isComplete && 
          emp.offboardingProgress?.completedItems > 0
        ).length,
        notStarted: employees.filter(emp => emp.offboardingProgress?.completedItems === 0).length,
        averageProgress: employees.length > 0 
          ? Math.round(employees.reduce((sum, emp) => sum + (emp.offboardingProgress?.progressPercentage || 0), 0) / employees.length)
          : 0
      };

      return { data: stats, error: null };
    } catch (error) {
      console.error('Error in getOffboardingStatistics:', error);
      return { data: null, error: 'Failed to get offboarding statistics' };
    }
  }
}























