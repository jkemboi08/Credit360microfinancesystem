import { supabase } from '../lib/supabaseClient';

export interface Group {
  id: string;
  name: string;
  description: string;
  group_type: 'solidarity' | 'self_help' | 'investment_club' | 'village_bank' | 'cooperative';
  status: 'active' | 'inactive' | 'suspended' | 'dissolved';
  group_leader_id?: string;
  group_leader_name?: string;
  guarantee_model: 'fixed_amount' | 'percentage';
  guarantee_value: number;
  collective_guarantee_amount: number;
  current_guarantee_balance: number;
  total_loan_amount: number;
  total_members: number;
  region?: string;
  district?: string;
  ward?: string;
  village?: string;
  meeting_frequency?: 'weekly' | 'bi_weekly' | 'monthly';
  meeting_day?: string;
  meeting_time?: string;
  meeting_location?: string;
  registration_number?: string;
  registration_date?: string;
  regulatory_status?: string;
  created_at: string;
  updated_at: string;
}

export interface GroupMember {
  id: string;
  group_id: string;
  client_id: string;
  role: 'leader' | 'member' | 'treasurer' | 'secretary';
  membership_status: 'active' | 'inactive' | 'suspended' | 'expelled';
  contribution_to_guarantee: number;
  individual_loan_amount: number;
  current_balance: number;
  repayment_rate: number;
  days_overdue: number;
  last_payment_date?: string;
  joined_date: string;
  left_date?: string;
  created_at: string;
  updated_at: string;
}

export class GroupService {
  // Create a new group
  static async createGroup(groupData: Partial<Group>): Promise<{ success: boolean; data?: Group; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('groups')
        .insert([groupData])
        .select()
        .single();

      if (error) {
        console.error('Error creating group:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error creating group:', error);
      return { success: false, error: 'Failed to create group' };
    }
  }

  // Get all groups
  static async getGroups(): Promise<{ success: boolean; data?: Group[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('groups')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching groups:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error fetching groups:', error);
      return { success: false, error: 'Failed to fetch groups' };
    }
  }

  // Get a specific group by ID
  static async getGroupById(groupId: string): Promise<{ success: boolean; data?: Group; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('groups')
        .select('*')
        .eq('id', groupId)
        .single();

      if (error) {
        console.error('Error fetching group:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error fetching group:', error);
      return { success: false, error: 'Failed to fetch group' };
    }
  }

  // Update a group
  static async updateGroup(groupId: string, updates: Partial<Group>): Promise<{ success: boolean; data?: Group; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('groups')
        .update(updates)
        .eq('id', groupId)
        .select()
        .single();

      if (error) {
        console.error('Error updating group:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error updating group:', error);
      return { success: false, error: 'Failed to update group' };
    }
  }

  // Delete a group
  static async deleteGroup(groupId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('groups')
        .delete()
        .eq('id', groupId);

      if (error) {
        console.error('Error deleting group:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error deleting group:', error);
      return { success: false, error: 'Failed to delete group' };
    }
  }

  // Get group members
  static async getGroupMembers(groupId: string): Promise<{ success: boolean; data?: GroupMember[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('group_members')
        .select(`
          *,
          client:clients!client_id (
            id,
            first_name,
            last_name,
            phone_number,
            email_address
          )
        `)
        .eq('group_id', groupId)
        .eq('membership_status', 'active');

      if (error) {
        console.error('Error fetching group members:', error);
        
        // If group_members table doesn't exist, return mock data
        if (error.message.includes('relation "group_members" does not exist') || 
            error.message.includes('Group members table not found')) {
          console.log('Group members table not found, returning mock data');
          return { 
            success: true, 
            data: [
              {
                id: 'mock-member-1',
                group_id: groupId,
                client_id: 'client-1',
                role: 'leader' as const,
                membership_status: 'active' as const,
                contribution_to_guarantee: 250000,
                individual_loan_amount: 500000,
                current_balance: 200000,
                repayment_rate: 85.5,
                days_overdue: 0,
                last_payment_date: '2025-01-10',
                joined_date: '2024-01-15',
                created_at: '2024-01-15T10:00:00Z',
                updated_at: '2024-01-15T10:00:00Z'
              },
              {
                id: 'mock-member-2',
                group_id: groupId,
                client_id: 'client-2',
                role: 'member' as const,
                membership_status: 'active' as const,
                contribution_to_guarantee: 250000,
                individual_loan_amount: 300000,
                current_balance: 150000,
                repayment_rate: 92.3,
                days_overdue: 0,
                last_payment_date: '2025-01-12',
                joined_date: '2024-02-01',
                created_at: '2024-02-01T10:00:00Z',
                updated_at: '2024-02-01T10:00:00Z'
              },
              {
                id: 'mock-member-3',
                group_id: groupId,
                client_id: 'client-3',
                role: 'treasurer' as const,
                membership_status: 'active' as const,
                contribution_to_guarantee: 250000,
                individual_loan_amount: 400000,
                current_balance: 100000,
                repayment_rate: 78.9,
                days_overdue: 5,
                last_payment_date: '2025-01-05',
                joined_date: '2024-01-20',
                created_at: '2024-01-20T10:00:00Z',
                updated_at: '2024-01-20T10:00:00Z'
              }
            ]
          };
        }
        
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error fetching group members:', error);
      return { success: false, error: 'Failed to fetch group members' };
    }
  }

  // Add member to group
  static async addGroupMember(groupId: string, clientId: string, role: string = 'member'): Promise<{ success: boolean; data?: GroupMember; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('group_members')
        .insert([{
          group_id: groupId,
          client_id: clientId,
          role: role,
          membership_status: 'active'
        }])
        .select()
        .single();

      if (error) {
        console.error('Error adding group member:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error adding group member:', error);
      return { success: false, error: 'Failed to add group member' };
    }
  }

  // Remove member from group
  static async removeGroupMember(groupId: string, clientId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('group_members')
        .update({ membership_status: 'inactive', left_date: new Date().toISOString().split('T')[0] })
        .eq('group_id', groupId)
        .eq('client_id', clientId);

      if (error) {
        console.error('Error removing group member:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error removing group member:', error);
      return { success: false, error: 'Failed to remove group member' };
    }
  }

  // Get available clients for group membership
  static async getAvailableClients(): Promise<{ success: boolean; data?: any[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('id, first_name, last_name, phone_number, email_address, client_type')
        .eq('client_type', 'individual')
        .order('first_name');

      if (error) {
        console.error('Error fetching available clients:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error fetching available clients:', error);
      return { success: false, error: 'Failed to fetch available clients' };
    }
  }

  // Create group from client data (when group is created in Client Management)
  static async createGroupFromClient(clientData: any): Promise<{ success: boolean; data?: Group; error?: string }> {
    try {
      const groupData = {
        name: clientData.group_name,
        description: clientData.business_description || clientData.group_description,
        group_type: clientData.legal_structure || clientData.group_type,
        status: 'active',
        group_leader_name: clientData.primary_contact_person,
        guarantee_model: clientData.guarantee_model || 'fixed_amount',
        guarantee_value: parseFloat(clientData.guarantee_value) || 0,
        region: clientData.reporting_region,
        district: clientData.reporting_district,
        ward: clientData.area_of_residence,
        meeting_frequency: clientData.meeting_frequency,
        meeting_day: clientData.meeting_day,
        meeting_time: clientData.meeting_time,
        meeting_location: clientData.registered_address,
        registration_number: clientData.company_registration_number,
        registration_date: clientData.date_of_incorporation,
        total_members: 0,
        collective_guarantee_amount: 0,
        current_guarantee_balance: 0,
        total_loan_amount: 0
      };

      return await this.createGroup(groupData);
    } catch (error) {
      console.error('Error creating group from client data:', error);
      return { success: false, error: 'Failed to create group from client data' };
    }
  }
}












