// Tenant Service Utility
// Provides common tenant-aware functionality for all services

import { supabase } from '../lib/supabaseClient';

export interface TenantContext {
  tenantIds: string[];
  currentTenantId: string | null;
  userTenants: Array<{
    tenant_id: string;
    role: string;
    permissions: string[];
  }>;
}

export class TenantService {
  /**
   * Get current user's tenant context
   */
  static async getCurrentTenantContext(): Promise<{
    success: boolean;
    data?: TenantContext;
    error?: string;
  }> {
    try {
      // Get current authenticated user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        return {
          success: false,
          error: 'User not authenticated'
        };
      }

      // Get user's tenant associations
      const { data: tenantUsers, error: tenantError } = await supabase
        .from('tenant_users')
        .select(`
          tenant_id,
          role,
          permissions,
          tenants!inner(
            id,
            name,
            subdomain,
            status
          )
        `)
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (tenantError) {
        return {
          success: false,
          error: `Failed to fetch tenant context: ${tenantError.message}`
        };
      }

      if (!tenantUsers || tenantUsers.length === 0) {
        return {
          success: false,
          error: 'User not associated with any tenant'
        };
      }

      const tenantIds = tenantUsers.map(tu => tu.tenant_id);
      const currentTenantId = tenantIds[0]; // Use first tenant as current
      const userTenants = tenantUsers.map(tu => ({
        tenant_id: tu.tenant_id,
        role: tu.role,
        permissions: tu.permissions || []
      }));

      return {
        success: true,
        data: {
          tenantIds,
          currentTenantId,
          userTenants
        }
      };

    } catch (error) {
      return {
        success: false,
        error: `Error getting tenant context: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Get tenant-filtered query builder
   */
  static async getTenantFilteredQuery(tableName: string) {
    const tenantContext = await this.getCurrentTenantContext();
    
    if (!tenantContext.success || !tenantContext.data) {
      throw new Error(tenantContext.error || 'Failed to get tenant context');
    }

    return supabase
      .from(tableName)
      .in('tenant_id', tenantContext.data.tenantIds);
  }

  /**
   * Validate user belongs to tenant
   */
  static async validateUserTenantAccess(tenantId: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    const tenantContext = await this.getCurrentTenantContext();
    
    if (!tenantContext.success || !tenantContext.data) {
      return {
        success: false,
        error: tenantContext.error || 'Failed to get tenant context'
      };
    }

    if (!tenantContext.data.tenantIds.includes(tenantId)) {
      return {
        success: false,
        error: 'User does not have access to this tenant'
      };
    }

    return { success: true };
  }

  /**
   * Set tenant context for database operations
   */
  static async setTenantContext(tenantId: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      // Validate user has access to this tenant
      const validation = await this.validateUserTenantAccess(tenantId);
      if (!validation.success) {
        return validation;
      }

      // Set tenant context in database session
      const { error } = await supabase.rpc('set_config', {
        setting_name: 'app.current_tenant_id',
        setting_value: tenantId,
        is_local: true
      });

      if (error) {
        return {
          success: false,
          error: `Failed to set tenant context: ${error.message}`
        };
      }

      return { success: true };

    } catch (error) {
      return {
        success: false,
        error: `Error setting tenant context: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Create tenant-aware insert data
   */
  static async createTenantAwareInsertData(data: any, tenantId?: string): Promise<any> {
    const tenantContext = await this.getCurrentTenantContext();
    
    if (!tenantContext.success || !tenantContext.data) {
      throw new Error(tenantContext.error || 'Failed to get tenant context');
    }

    const targetTenantId = tenantId || tenantContext.data.currentTenantId;
    
    if (!targetTenantId) {
      throw new Error('No tenant context available');
    }

    return {
      ...data,
      tenant_id: targetTenantId
    };
  }

  /**
   * Get tenant-specific configuration
   */
  static async getTenantConfig(tenantId: string): Promise<{
    success: boolean;
    data?: any;
    error?: string;
  }> {
    try {
      const { data, error } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', tenantId)
        .single();

      if (error) {
        return {
          success: false,
          error: `Failed to fetch tenant config: ${error.message}`
        };
      }

      return {
        success: true,
        data
      };

    } catch (error) {
      return {
        success: false,
        error: `Error fetching tenant config: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Check if user has permission for action
   */
  static async checkUserPermission(
    action: string, 
    tenantId?: string
  ): Promise<{
    success: boolean;
    error?: string;
  }> {
    const tenantContext = await this.getCurrentTenantContext();
    
    if (!tenantContext.success || !tenantContext.data) {
      return {
        success: false,
        error: tenantContext.error || 'Failed to get tenant context'
      };
    }

    const targetTenantId = tenantId || tenantContext.data.currentTenantId;
    
    if (!targetTenantId) {
      return {
        success: false,
        error: 'No tenant context available'
      };
    }

    const userTenant = tenantContext.data.userTenants.find(
      ut => ut.tenant_id === targetTenantId
    );

    if (!userTenant) {
      return {
        success: false,
        error: 'User not associated with this tenant'
      };
    }

    // Check role-based permissions
    const rolePermissions: { [key: string]: string[] } = {
      admin: ['*'], // Admin can do everything
      manager: ['read', 'write', 'update', 'delete'],
      staff: ['read', 'write', 'update'],
      client: ['read']
    };

    const userPermissions = rolePermissions[userTenant.role] || [];
    
    if (userPermissions.includes('*') || userPermissions.includes(action)) {
      return { success: true };
    }

    return {
      success: false,
      error: `Insufficient permissions for action: ${action}`
    };
  }
}





























