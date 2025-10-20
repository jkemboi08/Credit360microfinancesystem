import { supabase } from '../lib/supabaseClient';

export interface ApprovalLevel {
  id?: string;
  level_name: string;
  min_amount: number;
  max_amount: number;
  requires_committee_approval: boolean;
  committee_threshold?: number;
  approval_authority: 'loan_officer' | 'senior_officer' | 'manager' | 'committee';
  created_at?: string;
  created_by_user_id: string;
  updated_at?: string;
  updated_by_user_id: string;
}

export interface ApprovalLevelAssignment {
  id?: string;
  loan_application_id: string;
  approval_level_id: string;
  assigned_to_user_id?: string;
  status: 'pending' | 'approved' | 'rejected';
  comments?: string;
  approved_at?: string;
  created_at?: string;
  created_by_user_id: string;
}

export class ApprovalLevelsService {
  static TABLE_NAME = 'approval_levels';
  static ASSIGNMENTS_TABLE_NAME = 'approval_level_assignments';

  // Get all approval levels
  static async getAllApprovalLevels(): Promise<ApprovalLevel[]> {
    try {
      const { data, error } = await supabase
        .from(this.TABLE_NAME)
        .select('*')
        .order('min_amount', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching approval levels:', error);
      throw error;
    }
  }

  // Create new approval level
  static async createApprovalLevel(level: Omit<ApprovalLevel, 'id' | 'created_at' | 'updated_at'>): Promise<ApprovalLevel> {
    try {
      const { data, error } = await supabase
        .from(this.TABLE_NAME)
        .insert([level])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating approval level:', error);
      throw error;
    }
  }

  // Update approval level
  static async updateApprovalLevel(id: string, updates: Partial<ApprovalLevel>): Promise<ApprovalLevel> {
    try {
      const { data, error } = await supabase
        .from(this.TABLE_NAME)
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating approval level:', error);
      throw error;
    }
  }

  // Delete approval level
  static async deleteApprovalLevel(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from(this.TABLE_NAME)
        .update({ updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting approval level:', error);
      throw error;
    }
  }

  // Get approval level for loan amount
  static async getApprovalLevelForAmount(amount: number): Promise<ApprovalLevel | null> {
    try {
      const { data, error } = await supabase
        .from(this.TABLE_NAME)
        .select('*')
        .not('id', 'is', null)
        .gte('max_amount', amount)
        .lte('min_amount', amount)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data || null;
    } catch (error) {
      console.error('Error getting approval level for amount:', error);
      throw error;
    }
  }

  // Check if committee approval is required
  static async isCommitteeApprovalRequired(amount: number): Promise<boolean> {
    try {
      const approvalLevel = await this.getApprovalLevelForAmount(amount);
      return approvalLevel?.requires_committee_approval || false;
    } catch (error) {
      console.error('Error checking committee approval requirement:', error);
      return false;
    }
  }

  // Get committee threshold
  static async getCommitteeThreshold(amount: number): Promise<number | null> {
    try {
      const approvalLevel = await this.getApprovalLevelForAmount(amount);
      return approvalLevel?.committee_threshold || null;
    } catch (error) {
      console.error('Error getting committee threshold:', error);
      return null;
    }
  }

  // Create approval assignment
  static async createApprovalAssignment(assignment: Omit<ApprovalLevelAssignment, 'id' | 'created_at'>): Promise<ApprovalLevelAssignment> {
    try {
      const { data, error } = await supabase
        .from(this.ASSIGNMENTS_TABLE_NAME)
        .insert([assignment])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating approval assignment:', error);
      throw error;
    }
  }

  // Get approval assignments for loan
  static async getApprovalAssignments(loanApplicationId: string): Promise<ApprovalLevelAssignment[]> {
    try {
      const { data, error } = await supabase
        .from(this.ASSIGNMENTS_TABLE_NAME)
        .select('*')
        .eq('loan_application_id', loanApplicationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching approval assignments:', error);
      throw error;
    }
  }

  // Update approval assignment status
  static async updateApprovalAssignmentStatus(
    id: string, 
    status: 'approved' | 'rejected', 
    comments?: string
  ): Promise<ApprovalLevelAssignment> {
    try {
      const { data, error } = await supabase
        .from(this.ASSIGNMENTS_TABLE_NAME)
        .update({
          status,
          comments,
          approved_at: status === 'approved' ? new Date().toISOString() : null
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating approval assignment status:', error);
      throw error;
    }
  }
}






