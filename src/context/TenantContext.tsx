import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useSupabaseAuth } from './SupabaseAuthContext';

export interface Tenant {
  id: string;
  name: string;
  domain: string;
  logo?: string;
  primary_color?: string;
  secondary_color?: string;
  created_at: string;
  updated_at: string;
  status: 'active' | 'inactive' | 'suspended';
  settings: {
    timezone: string;
    currency: string;
    language: string;
    features: string[];
  };
}

interface TenantContextType {
  currentTenant: Tenant | null;
  tenants: Tenant[];
  loading: boolean;
  error: string | null;
  switchTenant: (tenantId: string) => Promise<void>;
  refreshTenants: () => Promise<void>;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export const useTenant = () => {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
};

interface TenantProviderProps {
  children: ReactNode;
}

export const TenantProvider: React.FC<TenantProviderProps> = ({ children }) => {
  const [currentTenant, setCurrentTenant] = useState<Tenant | null>(null);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useSupabaseAuth();

  const loadTenants = async () => {
    if (!user) {
      setTenants([]);
      setCurrentTenant(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // For now, return mock data
      // In a real implementation, this would fetch from Supabase
      const mockTenants: Tenant[] = [
        {
          id: '1',
          name: 'Demo Microfinance',
          domain: 'demo.microfinance.com',
          logo: '/logo.png',
          primary_color: '#3B82F6',
          secondary_color: '#1E40AF',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          status: 'active',
          settings: {
            timezone: 'Africa/Dar_es_Salaam',
            currency: 'TZS',
            language: 'en',
            features: ['loans', 'savings', 'staff_management', 'reporting']
          }
        }
      ];

      setTenants(mockTenants);
      
      // Set first tenant as current if none selected
      if (!currentTenant && mockTenants.length > 0) {
        setCurrentTenant(mockTenants[0]);
      }
    } catch (err) {
      console.error('Error loading tenants:', err);
      setError('Failed to load tenants');
    } finally {
      setLoading(false);
    }
  };

  const switchTenant = async (tenantId: string) => {
    const tenant = tenants.find(t => t.id === tenantId);
    if (tenant) {
      setCurrentTenant(tenant);
      // Store in localStorage for persistence
      localStorage.setItem('currentTenantId', tenantId);
    }
  };

  const refreshTenants = async () => {
    await loadTenants();
  };

  useEffect(() => {
    loadTenants();
  }, [user]);

  // Load tenant from localStorage on mount
  useEffect(() => {
    const savedTenantId = localStorage.getItem('currentTenantId');
    if (savedTenantId && tenants.length > 0) {
      const tenant = tenants.find(t => t.id === savedTenantId);
      if (tenant) {
        setCurrentTenant(tenant);
      }
    }
  }, [tenants]);

  const value: TenantContextType = {
    currentTenant,
    tenants,
    loading,
    error,
    switchTenant,
    refreshTenants
  };

  return (
    <TenantContext.Provider value={value}>
      {children}
    </TenantContext.Provider>
  );
};




