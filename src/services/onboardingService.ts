import { supabase } from '../lib/supabaseClient';

export interface OnboardingChecklistItem {
  id: string;
  employee_id: string;
  checklist_item: string;
  category: 'documentation' | 'compliance' | 'system_access' | 'orientation' | 'training';
  is_completed: boolean;
  completed_by?: string;
  completed_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface OnboardingTemplate {
  item: string;
  category: 'documentation' | 'compliance' | 'system_access' | 'orientation' | 'training';
  description: string;
  required: boolean;
  order: number;
}

export class OnboardingService {
  // Default onboarding checklist template
  static readonly ONBOARDING_TEMPLATE: OnboardingTemplate[] = [
    // Documentation
    {
      item: 'National ID Copy',
      category: 'documentation',
      description: 'Submit copy of National ID',
      required: true,
      order: 1
    },
    {
      item: 'Birth Certificate',
      category: 'documentation',
      description: 'Submit copy of birth certificate',
      required: true,
      order: 2
    },
    {
      item: 'Educational Certificates',
      category: 'documentation',
      description: 'Submit copies of educational certificates',
      required: true,
      order: 3
    },
    {
      item: 'NSSF Card',
      category: 'documentation',
      description: 'Submit NSSF membership card',
      required: true,
      order: 4
    },
    {
      item: 'Bank Account Details',
      category: 'documentation',
      description: 'Submit bank account details for salary',
      required: true,
      order: 5
    },
    {
      item: 'Emergency Contact Form',
      category: 'documentation',
      description: 'Complete emergency contact information',
      required: true,
      order: 6
    },
    {
      item: 'Medical Certificate',
      category: 'documentation',
      description: 'Submit medical fitness certificate',
      required: true,
      order: 7
    },

    // Compliance
    {
      item: 'Code of Conduct Acknowledgment',
      category: 'compliance',
      description: 'Read and acknowledge company code of conduct',
      required: true,
      order: 8
    },
    {
      item: 'Confidentiality Agreement',
      category: 'compliance',
      description: 'Sign confidentiality agreement',
      required: true,
      order: 9
    },
    {
      item: 'Anti-Corruption Policy',
      category: 'compliance',
      description: 'Complete anti-corruption policy training',
      required: true,
      order: 10
    },
    {
      item: 'Data Protection Policy',
      category: 'compliance',
      description: 'Complete data protection policy training',
      required: true,
      order: 11
    },

    // System Access
    {
      item: 'Email Account Setup',
      category: 'system_access',
      description: 'Set up company email account',
      required: true,
      order: 12
    },
    {
      item: 'Computer/Laptop Assignment',
      category: 'system_access',
      description: 'Assign and configure work computer/laptop',
      required: true,
      order: 13
    },
    {
      item: 'Network Access',
      category: 'system_access',
      description: 'Configure network and internet access',
      required: true,
      order: 14
    },
    {
      item: 'Software Installation',
      category: 'system_access',
      description: 'Install required software and applications',
      required: true,
      order: 15
    },
    {
      item: 'Security Badge',
      category: 'system_access',
      description: 'Issue security badge and access card',
      required: true,
      order: 16
    },

    // Orientation
    {
      item: 'Company Introduction',
      category: 'orientation',
      description: 'Attend company introduction session',
      required: true,
      order: 17
    },
    {
      item: 'Department Orientation',
      category: 'orientation',
      description: 'Meet with department head and team',
      required: true,
      order: 18
    },
    {
      item: 'Office Tour',
      category: 'orientation',
      description: 'Complete office tour and facilities overview',
      required: true,
      order: 19
    },
    {
      item: 'HR Policies Briefing',
      category: 'orientation',
      description: 'Attend HR policies and procedures briefing',
      required: true,
      order: 20
    },
    {
      item: 'Workplace Safety Training',
      category: 'orientation',
      description: 'Complete workplace safety training',
      required: true,
      order: 21
    },

    // Training
    {
      item: 'Job-Specific Training',
      category: 'training',
      description: 'Complete job-specific training program',
      required: true,
      order: 22
    },
    {
      item: 'System Training',
      category: 'training',
      description: 'Complete core system training',
      required: true,
      order: 23
    },
    {
      item: 'Customer Service Training',
      category: 'training',
      description: 'Complete customer service training',
      required: true,
      order: 24
    },
    {
      item: 'Financial Products Training',
      category: 'training',
      description: 'Complete financial products knowledge training',
      required: true,
      order: 25
    }
  ];

  // Create onboarding checklist for new employee
  static async createOnboardingChecklist(employeeId: string): Promise<{ success: boolean; error: string | null }> {
    try {
      const checklistItems = this.ONBOARDING_TEMPLATE.map(template => ({
        employee_id: employeeId,
        checklist_item: template.item,
        category: template.category,
        is_completed: false
      }));

      const { error } = await supabase
        .from('onboarding_checklist')
        .insert(checklistItems);

      if (error) {
        console.error('Error creating onboarding checklist:', error);
        return { success: false, error: error.message };
      }

      return { success: true, error: null };
    } catch (error) {
      console.error('Error in createOnboardingChecklist:', error);
      return { success: false, error: 'Failed to create onboarding checklist' };
    }
  }

  // Get onboarding checklist for employee
  static async getOnboardingChecklist(employeeId: string): Promise<{ data: OnboardingChecklistItem[]; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('onboarding_checklist')
        .select('*')
        .eq('employee_id', employeeId)
        .order('created_at');

      if (error) {
        console.error('Error fetching onboarding checklist:', error);
        return { data: [], error: error.message };
      }

      return { data: data || [], error: null };
    } catch (error) {
      console.error('Error in getOnboardingChecklist:', error);
      return { data: [], error: 'Failed to fetch onboarding checklist' };
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
        .from('onboarding_checklist')
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

  // Get onboarding progress
  static async getOnboardingProgress(employeeId: string): Promise<{ 
    data: any; 
    error: string | null 
  }> {
    try {
      const { data: checklist, error } = await this.getOnboardingChecklist(employeeId);
      
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
      console.error('Error in getOnboardingProgress:', error);
      return { data: null, error: 'Failed to get onboarding progress' };
    }
  }

  // Get all employees with onboarding status
  static async getEmployeesOnboardingStatus(): Promise<{ data: any[]; error: string | null }> {
    try {
      const { data: employees, error: employeesError } = await supabase
        .from('employees')
        .select('id, employee_id, first_name, last_name, position, department, hire_date')
        .eq('employment_status', 'active')
        .order('hire_date', { ascending: false });

      if (employeesError) {
        console.error('Error fetching employees:', employeesError);
        return { data: [], error: employeesError.message };
      }

      const employeesWithProgress = await Promise.all(
        employees.map(async (employee) => {
          const { data: progress } = await this.getOnboardingProgress(employee.id);
          return {
            ...employee,
            onboardingProgress: progress
          };
        })
      );

      return { data: employeesWithProgress, error: null };
    } catch (error) {
      console.error('Error in getEmployeesOnboardingStatus:', error);
      return { data: [], error: 'Failed to get employees onboarding status' };
    }
  }

  // Get onboarding statistics
  static async getOnboardingStatistics(): Promise<{ data: any; error: string | null }> {
    try {
      const { data: employees, error } = await this.getEmployeesOnboardingStatus();
      
      if (error) {
        return { data: null, error };
      }

      const stats = {
        totalEmployees: employees.length,
        completedOnboarding: employees.filter(emp => emp.onboardingProgress?.isComplete).length,
        inProgress: employees.filter(emp => 
          !emp.onboardingProgress?.isComplete && 
          emp.onboardingProgress?.completedItems > 0
        ).length,
        notStarted: employees.filter(emp => emp.onboardingProgress?.completedItems === 0).length,
        averageProgress: employees.length > 0 
          ? Math.round(employees.reduce((sum, emp) => sum + (emp.onboardingProgress?.progressPercentage || 0), 0) / employees.length)
          : 0
      };

      return { data: stats, error: null };
    } catch (error) {
      console.error('Error in getOnboardingStatistics:', error);
      return { data: null, error: 'Failed to get onboarding statistics' };
    }
  }
}























