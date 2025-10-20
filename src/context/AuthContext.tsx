import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'staff' | 'client' | 'manager' | 'admin';
  permissions: string[];
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  loginLoading: boolean;
  login: (email: string, password: string, role: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true); // Start as true to check for existing session
  const [loginLoading, setLoginLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check for existing session in localStorage
    const checkExistingSession = () => {
      try {
        const savedUser = localStorage.getItem('demo_user');
        const savedAuth = localStorage.getItem('demo_authenticated');
        
        if (savedUser && savedAuth === 'true') {
          const userData = JSON.parse(savedUser);
          setUser(userData);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Error loading saved session:', error);
        // Clear invalid session data
        localStorage.removeItem('demo_user');
        localStorage.removeItem('demo_authenticated');
      } finally {
        setLoading(false);
      }
    };

    checkExistingSession();
  }, []);

  const login = async (email: string, password: string, requestedRole: string): Promise<boolean> => {
    if (loginLoading) {
      return false;
    }

    try {
      setLoginLoading(true);
      
      // Demo authentication - accept any email/password combination
      if (email && password) {
        // Create demo user immediately
        const demoUser = {
          id: `demo-${Date.now()}`,
          name: email.split('@')[0] || 'Demo User',
          email: email,
          role: (requestedRole as 'staff' | 'client' | 'manager' | 'admin') || 'staff',
          permissions: ['read', 'write']
        };
        
        // Save to localStorage for persistence
        localStorage.setItem('demo_user', JSON.stringify(demoUser));
        localStorage.setItem('demo_authenticated', 'true');
        
        setUser(demoUser);
        setIsAuthenticated(true);
        return true;
      }

      return false;
    } catch (error) {
      return false;
    } finally {
      setLoginLoading(false);
    }
  };

  const logout = async () => {
    try {
      // Demo logout - clear the user state and localStorage
      localStorage.removeItem('demo_user');
      localStorage.removeItem('demo_authenticated');
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      // Silent error handling for demo mode
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      loginLoading,
      login, 
      logout, 
      isAuthenticated 
    }}>
      {children}
    </AuthContext.Provider>
  );
};