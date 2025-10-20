import { supabase } from '../lib/supabaseClient';

export interface GuaranteeRecovery {
  id: string;
  group_id: string;
  member_id: string;
  member_name: string;
  recovery_amount: number;
  recovery_type: 'automatic' | 'manual' | 'group_decision';
  recovery_status: 'initiated' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
  initiated_date: string;
  completed_date?: string;
  recovery_method?: string;
  recovery_percentage: number;
  remaining_balance: number;
  group_impact: 'low' | 'medium' | 'high' | 'critical';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  recovery_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface RecoveryRule {
  id: string;
  group_id: string;
  rule_name: string;
  description: string;
  trigger_conditions: string[];
  recovery_actions: string[];
  priority: 'low' | 'medium' | 'high' | 'urgent';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export class GroupRecoveryService {
  // Get guarantee recoveries for a group
  static async getGuaranteeRecoveries(groupId: string): Promise<{ success: boolean; data?: GuaranteeRecovery[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('group_guarantee_recoveries')
        .select(`
          *,
          clients (
            first_name,
            last_name
          )
        `)
        .eq('group_id', groupId)
        .order('initiated_date', { ascending: false });

      if (error) {
        console.error('Error fetching guarantee recoveries:', error);
        return { success: false, error: error.message };
      }

      // Transform the data to match the interface
      const transformedData = data?.map(item => ({
        id: item.id,
        group_id: item.group_id,
        member_id: item.member_id,
        member_name: `${item.clients?.first_name || ''} ${item.clients?.last_name || ''}`.trim(),
        recovery_amount: item.recovery_amount,
        recovery_type: item.recovery_type,
        recovery_status: item.recovery_status,
        initiated_date: item.initiated_date,
        completed_date: item.completed_date,
        recovery_method: item.recovery_method,
        recovery_percentage: item.recovery_percentage,
        remaining_balance: item.remaining_balance,
        group_impact: item.group_impact,
        priority: item.priority,
        recovery_notes: item.recovery_notes,
        created_at: item.created_at,
        updated_at: item.updated_at
      })) || [];

      return { success: true, data: transformedData };
    } catch (error) {
      console.error('Error fetching guarantee recoveries:', error);
      return { success: false, error: 'Failed to fetch guarantee recoveries' };
    }
  }

  // Create a new guarantee recovery
  static async createGuaranteeRecovery(recovery: Partial<GuaranteeRecovery>): Promise<{ success: boolean; data?: GuaranteeRecovery; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('group_guarantee_recoveries')
        .insert([recovery])
        .select()
        .single();

      if (error) {
        console.error('Error creating guarantee recovery:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error creating guarantee recovery:', error);
      return { success: false, error: 'Failed to create guarantee recovery' };
    }
  }

  // Update a guarantee recovery
  static async updateGuaranteeRecovery(recoveryId: string, updates: Partial<GuaranteeRecovery>): Promise<{ success: boolean; data?: GuaranteeRecovery; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('group_guarantee_recoveries')
        .update(updates)
        .eq('id', recoveryId)
        .select()
        .single();

      if (error) {
        console.error('Error updating guarantee recovery:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error updating guarantee recovery:', error);
      return { success: false, error: 'Failed to update guarantee recovery' };
    }
  }

  // Get recovery rules for a group
  static async getRecoveryRules(groupId: string): Promise<{ success: boolean; data?: RecoveryRule[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('recovery_rules')
        .select('*')
        .eq('group_id', groupId)
        .eq('is_active', true)
        .order('priority', { ascending: false });

      if (error) {
        console.error('Error fetching recovery rules:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error fetching recovery rules:', error);
      return { success: false, error: 'Failed to fetch recovery rules' };
    }
  }

  // Create a recovery rule
  static async createRecoveryRule(rule: Partial<RecoveryRule>): Promise<{ success: boolean; data?: RecoveryRule; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('recovery_rules')
        .insert([rule])
        .select()
        .single();

      if (error) {
        console.error('Error creating recovery rule:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error creating recovery rule:', error);
      return { success: false, error: 'Failed to create recovery rule' };
    }
  }

  // Update a recovery rule
  static async updateRecoveryRule(ruleId: string, updates: Partial<RecoveryRule>): Promise<{ success: boolean; data?: RecoveryRule; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('recovery_rules')
        .update(updates)
        .eq('id', ruleId)
        .select()
        .single();

      if (error) {
        console.error('Error updating recovery rule:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error updating recovery rule:', error);
      return { success: false, error: 'Failed to update recovery rule' };
    }
  }

  // Get recovery statistics for a group
  static async getRecoveryStatistics(groupId: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const { data: recoveries, error } = await supabase
        .from('group_guarantee_recoveries')
        .select('recovery_amount, recovery_status, recovery_type, initiated_date, completed_date')
        .eq('group_id', groupId);

      if (error) {
        console.error('Error fetching recovery statistics:', error);
        return { success: false, error: error.message };
      }

      const stats = {
        total_recoveries: recoveries?.length || 0,
        total_amount: recoveries?.reduce((sum, r) => sum + r.recovery_amount, 0) || 0,
        completed_recoveries: recoveries?.filter(r => r.recovery_status === 'completed').length || 0,
        pending_recoveries: recoveries?.filter(r => ['initiated', 'in_progress'].includes(r.recovery_status)).length || 0,
        success_rate: 0,
        average_recovery_time: 0
      };

      if (stats.total_recoveries > 0) {
        stats.success_rate = (stats.completed_recoveries / stats.total_recoveries) * 100;
        
        // Calculate average recovery time
        const completedRecoveries = recoveries?.filter(r => r.recovery_status === 'completed' && r.completed_date);
        if (completedRecoveries && completedRecoveries.length > 0) {
          const totalDays = completedRecoveries.reduce((sum, r) => {
            const initiated = new Date(r.initiated_date);
            const completed = new Date(r.completed_date!);
            return sum + Math.ceil((completed.getTime() - initiated.getTime()) / (1000 * 60 * 60 * 24));
          }, 0);
          stats.average_recovery_time = totalDays / completedRecoveries.length;
        }
      }

      return { success: true, data: stats };
    } catch (error) {
      console.error('Error fetching recovery statistics:', error);
      return { success: false, error: 'Failed to fetch recovery statistics' };
    }
  }
}



