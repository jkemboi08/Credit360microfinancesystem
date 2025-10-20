// Tenant Management Service
// Handles tenant creation, user association, and tenant operations

import { supabase } from '../lib/supabaseClient';

export interface Tenant {
  id: string;
  name: string;
  subdomain: string;
  database_name: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  plan: 'BASIC' | 'PROFESSIONAL' | 'ENTERPRISE' | 'CUSTOM';
  max_clients: number;
  max_users: number;
  storage_limit_gb: number;
  api_calls_limit: number;
  settings: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface TenantUser {
  id: string;
  tenant_id: string;
  user_id: string;
  role: 'admin' | 'manager' | 'staff' | 'client';
  permissions: string[];
  is_active: boolean;
  joined_at: string;
  created_at: string;
  updated_at: string;
}

export class TenantManagementService {
  /**
   * Create a new tenant
   */
  static async createTenant(tenantData: {
    name: string;
    subdomain: string;
    plan?: 'BASIC' | 'PROFESSIONAL' | 'ENTERPRISE' | 'CUSTOM';
    max_clients?: number;
    max_users?: number;
    storage_limit_gb?: number;
    api_calls_limit?: number;
    settings?: Record<string, any>;
  }): Promise<{
    success: boolean;
    data?: Tenant;
    error?: string;
  }> {
    try {
      console.log('Creating new tenant:', tenantData.name);

      const { data, error } = await supabase
        .from('tenants')
        .insert({
          name: tenantData.name,
          subdomain: tenantData.subdomain,
          database_name: `credit_management_${tenantData.subdomain}`,
          plan: tenantData.plan || 'BASIC',
          max_clients: tenantData.max_clients || 1000,
          max_users: tenantData.max_users || 50,
          storage_limit_gb: tenantData.storage_limit_gb || 10,
          api_calls_limit: tenantData.api_calls_limit || 10000,
          settings: tenantData.settings || {},
          status: 'ACTIVE'
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating tenant:', error);
        return {
          success: false,
          error: `Failed to create tenant: ${error.message}`
        };
      }

      console.log('✅ Tenant created successfully:', data.id);
      return {
        success: true,
        data
      };

    } catch (error) {
      console.error('Exception creating tenant:', error);
      return {
        success: false,
        error: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Get all tenants (admin only)
   */
  static async getAllTenants(): Promise<{
    success: boolean;
    data?: Tenant[];
    error?: string;
  }> {
    try {
      console.log('Getting all tenants');

      const { data, error } = await supabase
        .from('tenants')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching tenants:', error);
        return {
          success: false,
          error: `Failed to fetch tenants: ${error.message}`
        };
      }

      console.log(`✅ Retrieved ${data?.length || 0} tenants`);
      return {
        success: true,
        data: data || []
      };

    } catch (error) {
      console.error('Exception fetching tenants:', error);
      return {
        success: false,
        error: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Get tenant by ID
   */
  static async getTenantById(tenantId: string): Promise<{
    success: boolean;
    data?: Tenant;
    error?: string;
  }> {
    try {
      console.log('Getting tenant by ID:', tenantId);

      const { data, error } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', tenantId)
        .single();

      if (error) {
        console.error('Error fetching tenant:', error);
        return {
          success: false,
          error: `Failed to fetch tenant: ${error.message}`
        };
      }

      console.log('✅ Tenant retrieved successfully');
      return {
        success: true,
        data
      };

    } catch (error) {
      console.error('Exception fetching tenant:', error);
      return {
        success: false,
        error: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Update tenant
   */
  static async updateTenant(tenantId: string, updateData: Partial<Tenant>): Promise<{
    success: boolean;
    data?: Tenant;
    error?: string;
  }> {
    try {
      console.log('Updating tenant:', tenantId);

      const { data, error } = await supabase
        .from('tenants')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('id', tenantId)
        .select()
        .single();

      if (error) {
        console.error('Error updating tenant:', error);
        return {
          success: false,
          error: `Failed to update tenant: ${error.message}`
        };
      }

      console.log('✅ Tenant updated successfully');
      return {
        success: true,
        data
      };

    } catch (error) {
      console.error('Exception updating tenant:', error);
      return {
        success: false,
        error: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Add user to tenant
   */
  static async addUserToTenant(
    tenantId: string, 
    userId: string, 
    role: 'admin' | 'manager' | 'staff' | 'client' = 'staff',
    permissions: string[] = []
  ): Promise<{
    success: boolean;
    data?: TenantUser;
    error?: string;
  }> {
    try {
      console.log('Adding user to tenant:', { tenantId, userId, role });

      const { data, error } = await supabase
        .from('tenant_users')
        .insert({
          tenant_id: tenantId,
          user_id: userId,
          role,
          permissions,
          is_active: true
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding user to tenant:', error);
        return {
          success: false,
          error: `Failed to add user to tenant: ${error.message}`
        };
      }

      console.log('✅ User added to tenant successfully');
      return {
        success: true,
        data
      };

    } catch (error) {
      console.error('Exception adding user to tenant:', error);
      return {
        success: false,
        error: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Remove user from tenant
   */
  static async removeUserFromTenant(tenantId: string, userId: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      console.log('Removing user from tenant:', { tenantId, userId });

      const { error } = await supabase
        .from('tenant_users')
        .update({ is_active: false })
        .eq('tenant_id', tenantId)
        .eq('user_id', userId);

      if (error) {
        console.error('Error removing user from tenant:', error);
        return {
          success: false,
          error: `Failed to remove user from tenant: ${error.message}`
        };
      }

      console.log('✅ User removed from tenant successfully');
      return { success: true };

    } catch (error) {
      console.error('Exception removing user from tenant:', error);
      return {
        success: false,
        error: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Get tenant users
   */
  static async getTenantUsers(tenantId: string): Promise<{
    success: boolean;
    data?: TenantUser[];
    error?: string;
  }> {
    try {
      console.log('Getting tenant users for:', tenantId);

      const { data, error } = await supabase
        .from('tenant_users')
        .select(`
          *,
          users!inner(
            id,
            email,
            first_name,
            last_name,
            phone_number
          )
        `)
        .eq('tenant_id', tenantId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching tenant users:', error);
        return {
          success: false,
          error: `Failed to fetch tenant users: ${error.message}`
        };
      }

      console.log(`✅ Retrieved ${data?.length || 0} tenant users`);
      return {
        success: true,
        data: data || []
      };

    } catch (error) {
      console.error('Exception fetching tenant users:', error);
      return {
        success: false,
        error: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Update user role in tenant
   */
  static async updateUserRole(
    tenantId: string, 
    userId: string, 
    role: 'admin' | 'manager' | 'staff' | 'client',
    permissions: string[] = []
  ): Promise<{
    success: boolean;
    data?: TenantUser;
    error?: string;
  }> {
    try {
      console.log('Updating user role in tenant:', { tenantId, userId, role });

      const { data, error } = await supabase
        .from('tenant_users')
        .update({
          role,
          permissions,
          updated_at: new Date().toISOString()
        })
        .eq('tenant_id', tenantId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('Error updating user role:', error);
        return {
          success: false,
          error: `Failed to update user role: ${error.message}`
        };
      }

      console.log('✅ User role updated successfully');
      return {
        success: true,
        data
      };

    } catch (error) {
      console.error('Exception updating user role:', error);
      return {
        success: false,
        error: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Get tenant statistics
   */
  static async getTenantStats(tenantId: string): Promise<{
    success: boolean;
    data?: {
      totalUsers: number;
      totalClients: number;
      totalLoans: number;
      totalExpenses: number;
      activeUsers: number;
    };
    error?: string;
  }> {
    try {
      console.log('Getting tenant statistics for:', tenantId);

      // Get counts for various entities
      const [usersResult, clientsResult, loansResult, expensesResult] = await Promise.all([
        supabase
          .from('tenant_users')
          .select('id', { count: 'exact' })
          .eq('tenant_id', tenantId)
          .eq('is_active', true),
        supabase
          .from('clients')
          .select('id', { count: 'exact' })
          .eq('tenant_id', tenantId),
        supabase
          .from('loans')
          .select('id', { count: 'exact' })
          .eq('tenant_id', tenantId),
        supabase
          .from('expenses')
          .select('id', { count: 'exact' })
          .eq('tenant_id', tenantId)
      ]);

      const stats = {
        totalUsers: usersResult.count || 0,
        totalClients: clientsResult.count || 0,
        totalLoans: loansResult.count || 0,
        totalExpenses: expensesResult.count || 0,
        activeUsers: usersResult.count || 0
      };

      console.log('✅ Tenant statistics retrieved successfully');
      return {
        success: true,
        data: stats
      };

    } catch (error) {
      console.error('Exception getting tenant statistics:', error);
      return {
        success: false,
        error: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
}





























