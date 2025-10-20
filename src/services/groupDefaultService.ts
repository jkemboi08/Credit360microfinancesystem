import { supabase } from '../lib/supabaseClient';

export interface DefaultedMember {
  id: string;
  member_id: string;
  member_name: string;
  phone?: string;
  email?: string;
  loan_amount: number;
  overdue_amount: number;
  days_overdue: number;
  last_payment_date?: string;
  default_date: string;
  group_guarantee_used: number;
  group_impact: 'low' | 'medium' | 'high' | 'critical';
  status: 'active_default' | 'recovering' | 'resolved' | 'written_off';
  recovery_actions?: string[];
  next_action_date?: string;
  recovery_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface GroupDefaultSummary {
  group_id: string;
  group_name: string;
  total_members: number;
  defaulted_members: number;
  total_defaulted_amount: number;
  group_guarantee_balance: number;
  group_guarantee_used: number;
  group_health_score: number;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
}

export interface RecoveryAction {
  id: string;
  member_id: string;
  action_type: string;
  description: string;
  scheduled_date: string;
  status: 'pending' | 'completed' | 'cancelled';
  assigned_to?: string;
  notes?: string;
  created_at: string;
}

export class GroupDefaultService {
  // Get defaulted members for a group
  static async getDefaultedMembers(groupId: string): Promise<{ success: boolean; data?: DefaultedMember[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('group_defaults')
        .select(`
          *,
          clients (
            first_name,
            last_name,
            phone_number,
            email_address
          )
        `)
        .eq('group_id', groupId)
        .order('default_date', { ascending: false });

      if (error) {
        console.error('Error fetching defaulted members:', error);
        return { success: false, error: error.message };
      }

      // Transform the data to match the interface
      const transformedData = data?.map(item => ({
        id: item.id,
        member_id: item.member_id,
        member_name: `${item.clients?.first_name || ''} ${item.clients?.last_name || ''}`.trim(),
        phone: item.clients?.phone_number,
        email: item.clients?.email_address,
        loan_amount: item.loan_amount,
        overdue_amount: item.overdue_amount,
        days_overdue: item.days_overdue,
        last_payment_date: item.last_payment_date,
        default_date: item.default_date,
        group_guarantee_used: item.group_guarantee_used,
        group_impact: item.group_impact,
        status: item.status,
        recovery_actions: item.recovery_actions || [],
        next_action_date: item.next_action_date,
        recovery_notes: item.recovery_notes,
        created_at: item.created_at,
        updated_at: item.updated_at
      })) || [];

      return { success: true, data: transformedData };
    } catch (error) {
      console.error('Error fetching defaulted members:', error);
      return { success: false, error: 'Failed to fetch defaulted members' };
    }
  }

  // Get group default summary
  static async getGroupDefaultSummary(groupId: string): Promise<{ success: boolean; data?: GroupDefaultSummary; error?: string }> {
    try {
      // Get group info
      const { data: group, error: groupError } = await supabase
        .from('groups')
        .select('name, total_members, collective_guarantee_amount, current_guarantee_balance')
        .eq('id', groupId)
        .single();

      if (groupError) {
        console.error('Error fetching group:', groupError);
        return { success: false, error: groupError.message };
      }

      // Get default statistics
      const { data: defaults, error: defaultsError } = await supabase
        .from('group_defaults')
        .select('overdue_amount, group_guarantee_used, group_impact, status')
        .eq('group_id', groupId);

      if (defaultsError) {
        console.error('Error fetching defaults:', defaultsError);
        return { success: false, error: defaultsError.message };
      }

      const totalDefaultedAmount = defaults?.reduce((sum, d) => sum + d.overdue_amount, 0) || 0;
      const totalGuaranteeUsed = defaults?.reduce((sum, d) => sum + d.group_guarantee_used, 0) || 0;
      const defaultedMembers = defaults?.length || 0;
      
      // Calculate health score based on defaults
      const defaultRate = group.total_members > 0 ? (defaultedMembers / group.total_members) * 100 : 0;
      const healthScore = Math.max(0, 100 - (defaultRate * 2) - (totalDefaultedAmount / group.collective_guarantee_amount) * 50);
      
      // Determine risk level
      let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
      if (healthScore < 30) riskLevel = 'critical';
      else if (healthScore < 50) riskLevel = 'high';
      else if (healthScore < 70) riskLevel = 'medium';

      const summary: GroupDefaultSummary = {
        group_id: groupId,
        group_name: group.name,
        total_members: group.total_members,
        defaulted_members: defaultedMembers,
        total_defaulted_amount: totalDefaultedAmount,
        group_guarantee_balance: group.current_guarantee_balance,
        group_guarantee_used: totalGuaranteeUsed,
        group_health_score: Math.round(healthScore),
        risk_level: riskLevel
      };

      return { success: true, data: summary };
    } catch (error) {
      console.error('Error fetching group default summary:', error);
      return { success: false, error: 'Failed to fetch group default summary' };
    }
  }

  // Create a new default record
  static async createDefault(defaultData: Partial<DefaultedMember>): Promise<{ success: boolean; data?: DefaultedMember; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('group_defaults')
        .insert([defaultData])
        .select()
        .single();

      if (error) {
        console.error('Error creating default record:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error creating default record:', error);
      return { success: false, error: 'Failed to create default record' };
    }
  }

  // Update a default record
  static async updateDefault(defaultId: string, updates: Partial<DefaultedMember>): Promise<{ success: boolean; data?: DefaultedMember; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('group_defaults')
        .update(updates)
        .eq('id', defaultId)
        .select()
        .single();

      if (error) {
        console.error('Error updating default record:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error updating default record:', error);
      return { success: false, error: 'Failed to update default record' };
    }
  }

  // Get recovery actions
  static async getRecoveryActions(groupId: string): Promise<{ success: boolean; data?: RecoveryAction[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('recovery_actions')
        .select(`
          *,
          group_defaults!inner(group_id)
        `)
        .eq('group_defaults.group_id', groupId)
        .order('scheduled_date', { ascending: true });

      if (error) {
        console.error('Error fetching recovery actions:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error fetching recovery actions:', error);
      return { success: false, error: 'Failed to fetch recovery actions' };
    }
  }

  // Create a recovery action
  static async createRecoveryAction(action: Partial<RecoveryAction>): Promise<{ success: boolean; data?: RecoveryAction; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('recovery_actions')
        .insert([action])
        .select()
        .single();

      if (error) {
        console.error('Error creating recovery action:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error creating recovery action:', error);
      return { success: false, error: 'Failed to create recovery action' };
    }
  }
}



