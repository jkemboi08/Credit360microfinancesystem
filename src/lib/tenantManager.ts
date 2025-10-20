// Tenant Management System
// Handles multi-tenant operations for the Credit Management System

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Master database configuration (for tenant management)
const MASTER_SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://klmfbakjbihbgbvbvidw.supabase.co';
const MASTER_SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtsbWZiYWtqYmloYmdidmJ2aWR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIyODczNjEsImV4cCI6MjA2Nzg2MzM2MX0.a6HqB6Az-rbcLx7nq6nc036EBNWegPFTwkMn6wh2dYE';

// Tenant interface
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
  created_at: string;
  updated_at: string;
}

// Platform user interface
export interface PlatformUser {
  id: string;
  email: string;
  tenant_id: string;
  role: 'TENANT_ADMIN' | 'TENANT_USER' | 'PLATFORM_ADMIN';
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  first_name?: string;
  last_name?: string;
  phone?: string;
  last_login?: string;
  created_at: string;
  updated_at: string;
}

// Tenant settings interface
export interface TenantSettings {
  id: string;
  tenant_id: string;
  setting_key: string;
  setting_value: string;
  setting_type: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'JSON';
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

// Tenant branding interface
export interface TenantBranding {
  id: string;
  tenant_id: string;
  logo_url?: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  font_family: string;
  custom_css?: string;
  favicon_url?: string;
  created_at: string;
  updated_at: string;
}

class TenantManager {
  private masterClient: SupabaseClient;
  private currentTenant: Tenant | null = null;
  private tenantClient: SupabaseClient | null = null;

  constructor() {
    this.masterClient = createClient(MASTER_SUPABASE_URL, MASTER_SUPABASE_KEY);
  }

  // Get tenant by subdomain
  async getTenantBySubdomain(subdomain: string): Promise<Tenant | null> {
    try {
      const { data, error } = await this.masterClient
        .from('tenants')
        .select('*')
        .eq('subdomain', subdomain)
        .eq('status', 'ACTIVE')
        .single();

      if (error) {
        console.error('Error fetching tenant:', error);
        return null;
      }

      this.currentTenant = data;
      return data;
    } catch (error) {
      console.error('Error in getTenantBySubdomain:', error);
      return null;
    }
  }

  // Get tenant by ID
  async getTenantById(tenantId: string): Promise<Tenant | null> {
    try {
      const { data, error } = await this.masterClient
        .from('tenants')
        .select('*')
        .eq('id', tenantId)
        .eq('status', 'ACTIVE')
        .single();

      if (error) {
        console.error('Error fetching tenant:', error);
        return null;
      }

      this.currentTenant = data;
      return data;
    } catch (error) {
      console.error('Error in getTenantById:', error);
      return null;
    }
  }

  // Get current tenant
  getCurrentTenant(): Tenant | null {
    return this.currentTenant;
  }

  // Get tenant-specific Supabase client
  getTenantClient(): SupabaseClient {
    if (!this.currentTenant) {
      throw new Error('No active tenant. Please authenticate first.');
    }

    if (!this.tenantClient) {
      // For now, we'll use the same client but with tenant context
      // In production, you might want to use different database connections
      this.tenantClient = createClient(MASTER_SUPABASE_URL, MASTER_SUPABASE_KEY, {
        db: { schema: 'public' },
        auth: { persistSession: false }
      });
    }

    return this.tenantClient;
  }

  // Create new tenant
  async createTenant(
    name: string,
    subdomain: string,
    adminEmail: string,
    adminFirstName: string,
    adminLastName: string
  ): Promise<{ success: boolean; tenantId?: string; error?: string }> {
    try {
      const { data, error } = await this.masterClient.rpc('create_tenant', {
        tenant_name: name,
        tenant_subdomain: subdomain,
        admin_email: adminEmail,
        admin_first_name: adminFirstName,
        admin_last_name: adminLastName
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, tenantId: data };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Get tenant settings
  async getTenantSettings(): Promise<TenantSettings[]> {
    if (!this.currentTenant) {
      throw new Error('No active tenant');
    }

    try {
      const { data, error } = await this.masterClient
        .from('tenant_settings')
        .select('*')
        .eq('tenant_id', this.currentTenant.id);

      if (error) {
        console.error('Error fetching tenant settings:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getTenantSettings:', error);
      return [];
    }
  }

  // Update tenant setting
  async updateTenantSetting(
    settingKey: string,
    settingValue: string,
    settingType: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'JSON' = 'STRING'
  ): Promise<boolean> {
    if (!this.currentTenant) {
      throw new Error('No active tenant');
    }

    try {
      const { error } = await this.masterClient
        .from('tenant_settings')
        .upsert({
          tenant_id: this.currentTenant.id,
          setting_key: settingKey,
          setting_value: settingValue,
          setting_type: settingType
        });

      if (error) {
        console.error('Error updating tenant setting:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in updateTenantSetting:', error);
      return false;
    }
  }

  // Get tenant branding
  async getTenantBranding(): Promise<TenantBranding | null> {
    if (!this.currentTenant) {
      throw new Error('No active tenant');
    }

    try {
      const { data, error } = await this.masterClient
        .from('tenant_branding')
        .select('*')
        .eq('tenant_id', this.currentTenant.id)
        .single();

      if (error) {
        console.error('Error fetching tenant branding:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getTenantBranding:', error);
      return null;
    }
  }

  // Update tenant branding
  async updateTenantBranding(branding: Partial<TenantBranding>): Promise<boolean> {
    if (!this.currentTenant) {
      throw new Error('No active tenant');
    }

    try {
      const { error } = await this.masterClient
        .from('tenant_branding')
        .upsert({
          tenant_id: this.currentTenant.id,
          ...branding
        });

      if (error) {
        console.error('Error updating tenant branding:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in updateTenantBranding:', error);
      return false;
    }
  }

  // Track tenant usage
  async trackUsage(metricName: string, metricValue: number): Promise<boolean> {
    if (!this.currentTenant) {
      throw new Error('No active tenant');
    }

    try {
      const { error } = await this.masterClient.rpc('track_tenant_usage', {
        tenant_id_param: this.currentTenant.id,
        metric_name_param: metricName,
        metric_value_param: metricValue
      });

      if (error) {
        console.error('Error tracking usage:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in trackUsage:', error);
      return false;
    }
  }

  // Get tenant users
  async getTenantUsers(): Promise<PlatformUser[]> {
    if (!this.currentTenant) {
      throw new Error('No active tenant');
    }

    try {
      const { data, error } = await this.masterClient
        .from('platform_users')
        .select('*')
        .eq('tenant_id', this.currentTenant.id)
        .eq('status', 'ACTIVE');

      if (error) {
        console.error('Error fetching tenant users:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getTenantUsers:', error);
      return [];
    }
  }

  // Add user to tenant
  async addUserToTenant(
    email: string,
    role: 'TENANT_ADMIN' | 'TENANT_USER',
    firstName?: string,
    lastName?: string,
    phone?: string
  ): Promise<boolean> {
    if (!this.currentTenant) {
      throw new Error('No active tenant');
    }

    try {
      const { error } = await this.masterClient
        .from('platform_users')
        .insert({
          email,
          tenant_id: this.currentTenant.id,
          role,
          first_name: firstName,
          last_name: lastName,
          phone
        });

      if (error) {
        console.error('Error adding user to tenant:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in addUserToTenant:', error);
      return false;
    }
  }

  // Check if user has access to tenant
  async checkUserAccess(userEmail: string): Promise<boolean> {
    if (!this.currentTenant) {
      return false;
    }

    try {
      const { data, error } = await this.masterClient
        .from('platform_users')
        .select('id')
        .eq('email', userEmail)
        .eq('tenant_id', this.currentTenant.id)
        .eq('status', 'ACTIVE')
        .single();

      if (error) {
        return false;
      }

      return !!data;
    } catch (error) {
      console.error('Error in checkUserAccess:', error);
      return false;
    }
  }

  // Get tenant usage statistics
  async getTenantUsage(): Promise<{ [key: string]: number }> {
    if (!this.currentTenant) {
      throw new Error('No active tenant');
    }

    try {
      const { data, error } = await this.masterClient
        .from('tenant_usage')
        .select('metric_name, metric_value')
        .eq('tenant_id', this.currentTenant.id)
        .gte('recorded_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()); // Last 30 days

      if (error) {
        console.error('Error fetching tenant usage:', error);
        return {};
      }

      const usage: { [key: string]: number } = {};
      data?.forEach(record => {
        usage[record.metric_name] = (usage[record.metric_name] || 0) + record.metric_value;
      });

      return usage;
    } catch (error) {
      console.error('Error in getTenantUsage:', error);
      return {};
    }
  }

  // Clear tenant context
  clearTenantContext(): void {
    this.currentTenant = null;
    this.tenantClient = null;
  }
}

// Export singleton instance
export const tenantManager = new TenantManager();

// Export types
export type { Tenant, PlatformUser, TenantSettings, TenantBranding };







