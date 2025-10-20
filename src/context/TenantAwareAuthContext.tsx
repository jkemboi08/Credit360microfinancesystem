// Tenant-Aware Authentication Context
// Enhanced authentication with multi-tenant support

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';

interface TenantInfo {
  id: string;
  name: string;
  subdomain: string;
  status: string;
  plan: string;
}

interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'staff' | 'client' | 'manager' | 'admin';
  permissions: string[];
  tenants: TenantInfo[];
  currentTenant: TenantInfo | null;
  profile?: {
    first_name?: string;
    last_name?: string;
    phone?: string;
    avatar_url?: string;
  };
}

interface AuthContextType {
  user: AuthUser | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string, userData: any) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  switchTenant: (tenantId: string) => Promise<{ success: boolean; error?: string }>;
  isAuthenticated: boolean;
  currentTenant: TenantInfo | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useTenantAwareAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useTenantAwareAuth must be used within a TenantAwareAuthProvider');
  }
  return context;
};

export const TenantAwareAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Get permissions for role function
  const getPermissionsForRole = (role: string): string[] => {
    switch (role) {
      case 'admin':
        return ['admin', 'manage_tenants', 'manage_users', 'view_all_data'];
      case 'manager':
        return ['manager', 'manage_staff', 'view_reports', 'approve_loans'];
      case 'staff':
        return ['staff', 'view_clients', 'create_loans', 'manage_clients'];
      case 'client':
        return ['client', 'view_own_data', 'apply_loans'];
      default:
        return [];
    }
  };

  // Load user profile with tenant context
  const loadUserProfile = useCallback(async (supabaseUser: User) => {
    try {
      console.log('Loading user profile with tenant context for:', supabaseUser.email);
      
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
            status,
            plan
          )
        `)
        .eq('user_id', supabaseUser.id)
        .eq('is_active', true);

      if (tenantError) {
        console.error('Error loading tenant associations:', tenantError);
        throw new Error('Failed to load tenant associations');
      }

      if (!tenantUsers || tenantUsers.length === 0) {
        throw new Error('User not associated with any tenant');
      }

      // Get user profile data
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('email', supabaseUser.email)
        .single();

      // Prepare tenant information
      const tenants: TenantInfo[] = tenantUsers.map(tu => ({
        id: tu.tenant_id,
        name: tu.tenants.name,
        subdomain: tu.tenants.subdomain,
        status: tu.tenants.status,
        plan: tu.tenants.plan
      }));

      // Use the first active tenant as current tenant
      const currentTenant = tenants.find(t => t.status === 'ACTIVE') || tenants[0];

      // Determine user role from tenant associations
      const primaryRole = tenantUsers[0].role as 'staff' | 'client' | 'manager' | 'admin';

      const authUser: AuthUser = {
        id: userData?.user_id || supabaseUser.id,
        email: userData?.email || supabaseUser.email || '',
        name: userData ? 
          `${userData.first_name || ''} ${userData.last_name || ''}`.trim() || userData.email :
          supabaseUser.user_metadata?.full_name || supabaseUser.email || 'User',
        role: primaryRole,
        permissions: getPermissionsForRole(primaryRole),
        tenants,
        currentTenant,
        profile: {
          first_name: userData?.first_name || supabaseUser.user_metadata?.first_name || '',
          last_name: userData?.last_name || supabaseUser.user_metadata?.last_name || '',
          phone: userData?.phone_number || supabaseUser.user_metadata?.phone || ''
        }
      };

      console.log('User profile with tenant context loaded successfully:', authUser);
      setUser(authUser);

      // Set tenant context in database
      if (currentTenant) {
        await supabase.rpc('set_config', {
          setting_name: 'app.current_tenant_id',
          setting_value: currentTenant.id,
          is_local: true
        });
      }

    } catch (error) {
      console.error('Error loading user profile with tenant context:', error);
      
      // Create a minimal user profile for fallback
      const fallbackUser: AuthUser = {
        id: supabaseUser.id,
        email: supabaseUser.email || '',
        name: supabaseUser.user_metadata?.full_name || supabaseUser.email || 'User',
        role: 'staff',
        permissions: getPermissionsForRole('staff'),
        tenants: [],
        currentTenant: null,
        profile: {
          first_name: supabaseUser.user_metadata?.first_name || '',
          last_name: supabaseUser.user_metadata?.last_name || '',
          phone: supabaseUser.user_metadata?.phone || ''
        }
      };

      setUser(fallbackUser);
    }
  }, []);

  // Initialize auth state
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        setLoading(true);

        // Get initial session
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        
        if (mounted) {
          setSession(initialSession);
          
          if (initialSession?.user) {
            await loadUserProfile(initialSession.user);
          }
        }

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            if (mounted) {
              setSession(session);
              
              if (session?.user) {
                await loadUserProfile(session.user);
              } else {
                setUser(null);
              }
            }
          }
        );

        return () => subscription.unsubscribe();
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    const cleanup = initializeAuth();
    
    return () => {
      mounted = false;
      cleanup.then(cleanupFn => cleanupFn?.());
    };
  }, [loadUserProfile]);

  // Sign in function
  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        await loadUserProfile(data.user);
      }

      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Sign in failed' 
      };
    }
  };

  // Sign up function
  const signUp = async (email: string, password: string, userData: any) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData
        }
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Sign up failed' 
      };
    }
  };

  // Sign out function
  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Switch tenant function
  const switchTenant = async (tenantId: string) => {
    try {
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      // Find the tenant in user's tenant list
      const tenant = user.tenants.find(t => t.id === tenantId);
      if (!tenant) {
        return { success: false, error: 'Tenant not found or access denied' };
      }

      // Update current tenant
      const updatedUser = {
        ...user,
        currentTenant: tenant
      };
      setUser(updatedUser);

      // Set tenant context in database
      await supabase.rpc('set_config', {
        setting_name: 'app.current_tenant_id',
        setting_value: tenantId,
        is_local: true
      });

      // Store in localStorage for persistence
      localStorage.setItem('currentTenantId', tenantId);

      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to switch tenant' 
      };
    }
  };

  const value: AuthContextType = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    switchTenant,
    isAuthenticated: !!user,
    currentTenant: user?.currentTenant || null
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};





























