// Supabase Authentication Context
// Proper integration with Supabase Auth for production use

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';
import { demoSignIn, demoSignOut, type DemoUser } from '../utils/demoAuth';

interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'staff' | 'client' | 'manager' | 'admin';
  permissions: string[];
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
  isAuthenticated: boolean;
  isPlatformAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useSupabaseAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useSupabaseAuth must be used within a SupabaseAuthProvider');
  }
  return context;
};

export const SupabaseAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Get permissions for role function
  const getPermissionsForRole = (role: string): string[] => {
    switch (role) {
      case 'admin':
        return ['admin'];
      case 'manager':
        return ['manager'];
      case 'staff':
        return ['staff'];
      case 'client':
        return ['client'];
      default:
        return [];
    }
  };

  // Load user profile function
  const loadUserProfile = useCallback(async (supabaseUser: User) => {
    try {
      console.log('Loading user profile for:', supabaseUser.email);
      
      // Add timeout for database query
      const profilePromise = supabase
        .from('users')
        .select('*')
        .eq('email', supabaseUser.email)
        .single();
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database query timeout')), 5000)
      );
      
      const { data: userData, error: userError } = await Promise.race([
        profilePromise,
        timeoutPromise
      ]) as any;

      if (userData && !userError) {
        console.log('User data found in database:', userData);
        // Map user role to authentication role
        const authRole = userData.role as 'staff' | 'client' | 'manager' | 'admin';

        const authUser: AuthUser = {
          id: userData.user_id || userData.id.toString(),
          email: userData.email,
          name: `${userData.first_name || ''} ${userData.last_name || ''}`.trim() || userData.email,
          role: authRole,
          permissions: getPermissionsForRole(authRole),
          profile: {
            first_name: userData.first_name,
            last_name: userData.last_name,
            phone: userData.phone_number
          }
        };

        console.log('User profile loaded successfully:', authUser);
        setUser(authUser);
        return;
      }

      // If no user found in database, create a default user profile
      console.log('No user found in database, creating default profile...');
      const defaultUser: AuthUser = {
        id: supabaseUser.id,
        email: supabaseUser.email || '',
        name: supabaseUser.user_metadata?.full_name || supabaseUser.email || 'User',
        role: 'staff',
        permissions: getPermissionsForRole('staff'),
        profile: {
          first_name: supabaseUser.user_metadata?.first_name || '',
          last_name: supabaseUser.user_metadata?.last_name || '',
          phone: supabaseUser.user_metadata?.phone || ''
        }
      };

      console.log('Default user profile created successfully:', defaultUser);
      setUser(defaultUser);
      return;

    } catch (error) {
      console.error('Error loading user profile:', error);
      
      // Fallback user
      const authUser: AuthUser = {
        id: supabaseUser.id,
        email: supabaseUser.email || '',
        name: supabaseUser.user_metadata?.full_name || supabaseUser.email || 'User',
        role: 'CLIENT',
        permissions: ['read_own_data'],
        profile: {
          first_name: supabaseUser.user_metadata?.first_name,
          last_name: supabaseUser.user_metadata?.last_name,
          phone: supabaseUser.user_metadata?.phone_number
        }
      };
      
      console.log('Fallback user created:', authUser);
      setUser(authUser);
    }
  }, []);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        console.log('Getting initial session...');
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Error getting session:', error);
          setLoading(false);
          return;
        }
        
        if (session) {
          console.log('Initial session found:', session.user?.email);
          setSession(session);
          await loadUserProfile(session.user);
        } else {
          console.log('No initial session found');
        }
      } catch (error) {
        console.error('Error in getInitialSession:', error);
      } finally {
        setLoading(false);
      }
    };

    // Add timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      console.log('Auth loading timeout reached, setting loading to false');
      setLoading(false);
    }, 10000); // 10 second timeout

    getInitialSession();

    return () => clearTimeout(timeoutId);

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        
        if (event === 'SIGNED_IN' && session) {
          setSession(session);
          await loadUserProfile(session.user);
        } else if (event === 'SIGNED_OUT') {
          setSession(null);
          setUser(null);
        }
        
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [loadUserProfile]);

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      
      console.log('🔐 Attempting Supabase authentication...');
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('❌ Supabase authentication error:', error);
        setLoading(false);
        return { success: false, error: error.message };
      }

      console.log('✅ Supabase authentication successful');
      // Wait for the auth state change to complete
      if (data.session) {
        setSession(data.session);
        await loadUserProfile(data.session.user);
      }

      setLoading(false);
      return { success: true };
    } catch (error) {
      console.error('❌ Authentication error:', error);
      setLoading(false);
      return { success: false, error: 'An unexpected error occurred' };
    }
  };

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
      return { success: false, error: 'An unexpected error occurred' };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const isAuthenticated = !!user && !!session;
  const isPlatformAdmin = user?.role === 'admin';

  // Debug logging
  console.log('SupabaseAuthContext state:', { 
    user: user ? { id: user.id, email: user.email, role: user.role } : null, 
    session: session ? { user: session.user?.email } : null, 
    loading, 
    isAuthenticated 
  });

  const value: AuthContextType = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    isAuthenticated,
    isPlatformAdmin,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};