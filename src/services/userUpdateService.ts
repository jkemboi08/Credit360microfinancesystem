// User Update Service
// Handles user updates with proper tenant context

import { supabase } from '../lib/supabaseClient';
import { TenantService } from './tenantService';

export interface UserUpdateData {
  id: number;
  first_name?: string;
  last_name?: string;
  email?: string;
  role?: string;
  phone_number?: string;
  date_of_birth?: string;
  national_id?: string;
  kyc_status?: string;
}

export class UserUpdateService {
  /**
   * Update user by updating individual fields to bypass RLS issues
   */
  static async updateUser(userData: UserUpdateData): Promise<{
    success: boolean;
    error?: string;
    data?: any;
  }> {
    try {
      console.log('🔄 Updating user with tenant context...');
      
      // Get current tenant context
      const tenantContext = await TenantService.getCurrentTenantContext();
      if (!tenantContext.success || !tenantContext.data) {
        return {
          success: false,
          error: 'Unable to determine tenant context. Please ensure you are properly logged in and associated with a tenant.'
        };
      }

      // Set tenant context for the database session
      const setContextResult = await TenantService.setTenantContext(tenantContext.data.currentTenantId);
      if (!setContextResult.success) {
        return {
          success: false,
          error: `Failed to set tenant context: ${setContextResult.error}`
        };
      }

      console.log(`✅ Tenant context set to: ${tenantContext.data.currentTenantId}`);
      
      const { id, ...updateFields } = userData;
      const results: any = {};
      const errors: string[] = [];

      // Update each field individually
      for (const [field, value] of Object.entries(updateFields)) {
        if (value !== undefined && value !== null) {
          try {
            console.log(`  Updating ${field}...`);
            
            const { error } = await supabase
              .from('users')
              .update({ [field]: value })
              .eq('id', id);

            if (error) {
              console.warn(`  ❌ Failed to update ${field}:`, error.message);
              errors.push(`${field}: ${error.message}`);
            } else {
              console.log(`  ✅ Successfully updated ${field}`);
              results[field] = value;
            }
          } catch (fieldError) {
            console.warn(`  ❌ Exception updating ${field}:`, fieldError);
            errors.push(`${field}: ${fieldError}`);
          }
        }
      }

      if (errors.length > 0) {
        console.warn('⚠️ Some fields failed to update:', errors);
        
        // Check if all errors are related to the configuration parameter
        const allConfigErrors = errors.every(error => 
          error.includes('app.current_tenant_id') || 
          error.includes('configuration parameter')
        );

        if (allConfigErrors) {
          console.log('🔄 Trying fallback RPC method...');
          // Try the RPC fallback method
          const rpcResult = await this.updateUserViaRPC(userData);
          if (rpcResult.success) {
            return rpcResult;
          }
          
          return {
            success: false,
            error: `User updates are currently blocked by database security policies. The system requires tenant context configuration that is not available. Please contact your system administrator to resolve this issue.`
          };
        }

        return {
          success: false,
          error: `Some fields failed to update: ${errors.join(', ')}`
        };
      }

      console.log('✅ User update completed successfully');
      return {
        success: true,
        data: results
      };

    } catch (error) {
      console.error('❌ Error in updateUser:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Update user role specifically
   */
  static async updateUserRole(userId: number, role: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      console.log(`🔄 Updating user role to ${role}...`);
      
      // Get current tenant context
      const tenantContext = await TenantService.getCurrentTenantContext();
      if (!tenantContext.success || !tenantContext.data) {
        return {
          success: false,
          error: 'Unable to determine tenant context. Please ensure you are properly logged in and associated with a tenant.'
        };
      }

      // Set tenant context for the database session
      const setContextResult = await TenantService.setTenantContext(tenantContext.data.currentTenantId);
      if (!setContextResult.success) {
        return {
          success: false,
          error: `Failed to set tenant context: ${setContextResult.error}`
        };
      }

      console.log(`✅ Tenant context set to: ${tenantContext.data.currentTenantId}`);
      
      const { error } = await supabase
        .from('users')
        .update({ role })
        .eq('id', userId);

      if (error) {
        console.error('❌ Error updating user role:', error.message);
        
        // Check if the error is related to the configuration parameter
        if (error.message.includes('app.current_tenant_id') || 
            error.message.includes('configuration parameter')) {
          return {
            success: false,
            error: `User role updates are currently blocked by database security policies. The system requires tenant context configuration that is not available. Please contact your system administrator to resolve this issue.`
          };
        }

        return {
          success: false,
          error: error.message
        };
      }

      console.log('✅ User role updated successfully');
      return { success: true };

    } catch (error) {
      console.error('❌ Error in updateUserRole:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Alternative update method using RPC function (fallback)
   */
  static async updateUserViaRPC(userData: UserUpdateData): Promise<{
    success: boolean;
    error?: string;
    data?: any;
  }> {
    try {
      console.log('🔄 Updating user via RPC function...');
      
      const { id, ...updateFields } = userData;
      
      // Call RPC function to update user
      const { data, error } = await supabase.rpc('update_user_profile', {
        user_id: id,
        update_data: updateFields
      });

      if (error) {
        console.error('❌ Error updating user via RPC:', error.message);
        return {
          success: false,
          error: error.message
        };
      }

      console.log('✅ User updated successfully via RPC');
      return {
        success: true,
        data: data
      };

    } catch (error) {
      console.error('❌ Error in updateUserViaRPC:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get user by ID
   */
  static async getUserById(userId: number): Promise<{
    success: boolean;
    data?: any;
    error?: string;
  }> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: true,
        data
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * List all users
   */
  static async getAllUsers(): Promise<{
    success: boolean;
    data?: any[];
    error?: string;
  }> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: true,
        data: data || []
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}
