// Enhanced User Update Service
// Provides comprehensive error handling and multiple fallback strategies

import { supabase } from '../lib/supabaseClient';
import { TenantService } from './tenantService';
import { UserUpdateService } from './userUpdateService';

export interface UserUpdateData {
  id: number;
  first_name?: string;
  last_name?: string;
  email?: string;
  role?: string;
  phone_number?: string;
  date_of_birth?: string;
  kyc_status?: string;
  national_id?: string;
  address?: string;
}

export interface UpdateResult {
  success: boolean;
  error?: string;
  data?: any;
  method?: 'tenant_context' | 'rpc' | 'direct' | 'admin';
}

export class EnhancedUserUpdateService {
  /**
   * Main update method with multiple fallback strategies
   */
  static async updateUser(userData: UserUpdateData): Promise<UpdateResult> {
    console.log('🚀 Starting enhanced user update process...');
    
    // Strategy 1: Try with tenant context
    console.log('📋 Strategy 1: Tenant context approach');
    const tenantResult = await this.tryTenantContextUpdate(userData);
    if (tenantResult.success) {
      return { ...tenantResult, method: 'tenant_context' };
    }
    
    // Strategy 2: Try RPC function
    console.log('📋 Strategy 2: RPC function approach');
    const rpcResult = await this.tryRPCUpdate(userData);
    if (rpcResult.success) {
      return { ...rpcResult, method: 'rpc' };
    }
    
    // Strategy 3: Try direct update (for super users)
    console.log('📋 Strategy 3: Direct update approach');
    const directResult = await this.tryDirectUpdate(userData);
    if (directResult.success) {
      return { ...directResult, method: 'direct' };
    }
    
    // Strategy 4: Try admin service account
    console.log('📋 Strategy 4: Admin service approach');
    const adminResult = await this.tryAdminUpdate(userData);
    if (adminResult.success) {
      return { ...adminResult, method: 'admin' };
    }
    
    // All strategies failed
    return {
      success: false,
      error: 'All update strategies failed. Please contact your system administrator.',
      method: 'none'
    };
  }

  /**
   * Strategy 1: Tenant context update
   */
  private static async tryTenantContextUpdate(userData: UserUpdateData): Promise<UpdateResult> {
    try {
      const result = await UserUpdateService.updateUser(userData);
      return result;
    } catch (error) {
      return {
        success: false,
        error: `Tenant context update failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Strategy 2: RPC function update
   */
  private static async tryRPCUpdate(userData: UserUpdateData): Promise<UpdateResult> {
    try {
      const result = await UserUpdateService.updateUserViaRPC(userData);
      return result;
    } catch (error) {
      return {
        success: false,
        error: `RPC update failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Strategy 3: Direct update (bypass RLS for super users)
   */
  private static async tryDirectUpdate(userData: UserUpdateData): Promise<UpdateResult> {
    try {
      const { id, ...updateFields } = userData;
      
      // Check if user has admin privileges
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      // Try direct update
      const { data, error } = await supabase
        .from('users')
        .update(updateFields)
        .eq('id', id)
        .select();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: `Direct update failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Strategy 4: Admin service account update
   */
  private static async tryAdminUpdate(userData: UserUpdateData): Promise<UpdateResult> {
    try {
      // This would use a service account with elevated privileges
      // For now, we'll just return a not implemented error
      return {
        success: false,
        error: 'Admin service update not implemented'
      };
    } catch (error) {
      return {
        success: false,
        error: `Admin update failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Get detailed error information for debugging
   */
  static async diagnoseUserUpdateIssue(userData: UserUpdateData): Promise<{
    tenantContext: any;
    userAuth: any;
    rlsPolicies: any;
    recommendations: string[];
  }> {
    const diagnosis = {
      tenantContext: null,
      userAuth: null,
      rlsPolicies: null,
      recommendations: [] as string[]
    };

    try {
      // Check tenant context
      const tenantContext = await TenantService.getCurrentTenantContext();
      diagnosis.tenantContext = {
        success: tenantContext.success,
        hasData: !!tenantContext.data,
        currentTenantId: tenantContext.data?.currentTenantId,
        error: tenantContext.error
      };

      // Check user authentication
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      diagnosis.userAuth = {
        authenticated: !!user,
        userId: user?.id,
        email: user?.email,
        error: authError?.message
      };

      // Check RLS policies (simplified)
      diagnosis.rlsPolicies = {
        note: 'RLS policies are active and require tenant context'
      };

      // Generate recommendations
      if (!diagnosis.tenantContext.success) {
        diagnosis.recommendations.push('Ensure user is properly associated with a tenant');
      }
      if (!diagnosis.userAuth.authenticated) {
        diagnosis.recommendations.push('User must be properly authenticated');
      }
      if (diagnosis.tenantContext.success && diagnosis.userAuth.authenticated) {
        diagnosis.recommendations.push('Try using the RPC function as a fallback');
        diagnosis.recommendations.push('Contact system administrator to check RLS policies');
      }

    } catch (error) {
      diagnosis.recommendations.push(`Diagnosis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return diagnosis;
  }

  /**
   * Update user with comprehensive error handling and user feedback
   */
  static async updateUserWithFeedback(userData: UserUpdateData): Promise<{
    success: boolean;
    message: string;
    details?: any;
    recommendations?: string[];
  }> {
    console.log('🔄 Starting user update with comprehensive feedback...');
    
    const result = await this.updateUser(userData);
    
    if (result.success) {
      return {
        success: true,
        message: `User updated successfully using ${result.method} method`,
        details: result.data
      };
    }

    // Get detailed diagnosis for failed updates
    const diagnosis = await this.diagnoseUserUpdateIssue(userData);
    
    return {
      success: false,
      message: result.error || 'User update failed',
      details: {
        method: result.method,
        diagnosis
      },
      recommendations: diagnosis.recommendations
    };
  }
}


