// auth.ts
import { supabase } from './client';
import { handleSupabaseError, logErrorToMonitoring } from './errorHandling';

// Enhanced User Authentication Management
export class AuthManager {
  // Get current authenticated user with detailed error handling
  static async getCurrentUser() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        const formattedError = handleSupabaseError(error, 'Failed to retrieve current user');
        logErrorToMonitoring(formattedError);
        return null;
      }

      return user;
    } catch (error) {
      const formattedError = handleSupabaseError(error, 'Unexpected authentication error');
      logErrorToMonitoring(formattedError);
      return null;
    }
  }

  // Centralized sign-in method with comprehensive logging
  static async signIn(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        const formattedError = handleSupabaseError(error, 'Sign-in failed');
        logErrorToMonitoring(formattedError);
        return { success: false, error: formattedError };
      }

      console.log('User signed in successfully:', data.user?.email);
      return { success: true, user: data.user };
    } catch (error) {
      const formattedError = handleSupabaseError(error, 'Unexpected sign-in error');
      logErrorToMonitoring(formattedError);
      return { success: false, error: formattedError };
    }
  }

  // Session Management
  static initializeAuthListener() {
    return supabase.auth.onAuthStateChange((event, session) => {
      switch (event) {
        case 'SIGNED_IN':
          console.log('User signed in:', session?.user?.email);
          // Trigger user profile fetch, update app state
          this.handleSignedIn(session);
          break;
        
        case 'SIGNED_OUT':
          console.log('User signed out');
          this.handleSignedOut();
          break;
        
        case 'TOKEN_REFRESHED':
          console.log('Session token refreshed');
          break;
        
        case 'PASSWORD_RECOVERY':
          console.log('Password recovery initiated');
          break;
      }
    });
  }

  private static async handleSignedIn(session: any) {
    try {
      // Example: Fetch user profile after sign-in
      const userProfile = await this.getUserProfile(session.user.id);
      
      // Update global state or local storage
      // Example with localStorage (replace with your state management)
      localStorage.setItem('userProfile', JSON.stringify(userProfile));
    } catch (error) {
      const formattedError = handleSupabaseError(error, 'Failed to fetch user profile');
      logErrorToMonitoring(formattedError);
    }
  }

  private static handleSignedOut() {
    // Clear user-related data
    localStorage.removeItem('userProfile');
    // Redirect to login page or reset app state
  }
}// auth.ts
import { supabase } from './client';
import { handleSupabaseError, logErrorToMonitoring } from './errorHandling';

// Enhanced User Authentication Management
export class AuthManager {
  // Get current authenticated user with detailed error handling
  static async getCurrentUser() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        const formattedError = handleSupabaseError(error, 'Failed to retrieve current user');
        logErrorToMonitoring(formattedError);
        return null;
      }

      return user;
    } catch (error) {
      const formattedError = handleSupabaseError(error, 'Unexpected authentication error');
      logErrorToMonitoring(formattedError);
      return null;
    }
  }

  // Centralized sign-in method with comprehensive logging
  static async signIn(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        const formattedError = handleSupabaseError(error, 'Sign-in failed');
        logErrorToMonitoring(formattedError);
        return { success: false, error: formattedError };
      }

      console.log('User signed in successfully:', data.user?.email);
      return { success: true, user: data.user };
    } catch (error) {
      const formattedError = handleSupabaseError(error, 'Unexpected sign-in error');
      logErrorToMonitoring(formattedError);
      return { success: false, error: formattedError };
    }
  }

  // Session Management
  static initializeAuthListener() {
    return supabase.auth.onAuthStateChange((event, session) => {
      switch (event) {
        case 'SIGNED_IN':
          console.log('User signed in:', session?.user?.email);
          // Trigger user profile fetch, update app state
          this.handleSignedIn(session);
          break;
        
        case 'SIGNED_OUT':
          console.log('User signed out');
          this.handleSignedOut();
          break;
        
        case 'TOKEN_REFRESHED':
          console.log('Session token refreshed');
          break;
        
        case 'PASSWORD_RECOVERY':
          console.log('Password recovery initiated');
          break;
      }
    });
  }

  private static async handleSignedIn(session: any) {
    try {
      // Example: Fetch user profile after sign-in
      const userProfile = await this.getUserProfile(session.user.id);
      
      // Update global state or local storage
      // Example with localStorage (replace with your state management)
      localStorage.setItem('userProfile', JSON.stringify(userProfile));
    } catch (error) {
      const formattedError = handleSupabaseError(error, 'Failed to fetch user profile');
      logErrorToMonitoring(formattedError);
    }
  }

  private static handleSignedOut() {
    // Clear user-related data
    localStorage.removeItem('userProfile');
    // Redirect to login page or reset app state
  }
}