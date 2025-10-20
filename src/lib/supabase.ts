// Supabase Client Configuration
// Centralized Supabase client for the application

// Re-export from the main supabaseClient to avoid multiple instances
export { supabase, handleSupabaseError, getCurrentUser, getUserProfile } from './supabaseClient';

// Additional helper functions
export const isAuthenticated = async (): Promise<boolean> => {
  const { data: { session } } = await supabase.auth.getSession();
  return !!session;
};

// Helper function to get current session
export const getCurrentSession = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
};







