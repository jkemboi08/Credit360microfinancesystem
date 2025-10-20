// Tenant Settings Page
// For configuring individual tenant settings

import React, { useState, useEffect } from 'react';
import { tenantManager } from '../../lib/tenantManager';

interface TenantSettings {
  id: string;
  tenant_id: string;
  setting_key: string;
  setting_value: string;
  setting_type: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'JSON';
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

interface TenantBranding {
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

interface Tenant {
  id: string;
  name: string;
  subdomain: string;
  database_name: string;
  status: string;
  plan: string;
  max_clients: number;
  max_users: number;
  storage_limit_gb: number;
  api_calls_limit: number;
}

const TenantSettingsPage: React.FC<{ tenantId: string }> = ({ tenantId }) => {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [settings, setSettings] = useState<TenantSettings[]>([]);
  const [branding, setBranding] = useState<TenantBranding | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');

  useEffect(() => {
    loadTenantData();
  }, [tenantId]);

  const loadTenantData = async () => {
    setIsLoading(true);
    try {
      // Load tenant details
      const { data: tenantData, error: tenantError } = await tenantManager.masterClient
        .from('tenants')
        .select('*')
        .eq('id', tenantId)
        .single();

      if (tenantError) throw tenantError;

      // Load tenant settings
      const { data: settingsData, error: settingsError } = await tenantManager.masterClient
        .from('tenant_settings')
        .select('*')
        .eq('tenant_id', tenantId);

      if (settingsError) throw settingsError;

      // Load tenant branding
      const { data: brandingData, error: brandingError } = await tenantManager.masterClient
        .from('tenant_branding')
        .select('*')
        .eq('tenant_id', tenantId)
        .single();

      if (brandingError && brandingError.code !== 'PGRST116') throw brandingError;

      setTenant(tenantData);
      setSettings(settingsData || []);
      setBranding(brandingData);

    } catch (error) {
      console.error('Error loading tenant data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateSetting = async (key: string, value: string, type: string = 'STRING') => {
    setIsSaving(true);
    try {
      const { error } = await tenantManager.masterClient
        .from('tenant_settings')
        .upsert({
          tenant_id: tenantId,
          setting_key: key,
          setting_value: value,
          setting_type: type
        });

      if (error) throw error;

      await loadTenantData();
      alert('Setting updated successfully!');
    } catch (error) {
      console.error('Error updating setting:', error);
      alert('Error updating setting');
    } finally {
      setIsSaving(false);
    }
  };

  const updateBranding = async (brandingData: Partial<TenantBranding>) => {
    setIsSaving(true);
    try {
      const { error } = await tenantManager.masterClient
        .from('tenant_branding')
        .upsert({
          tenant_id: tenantId,
          ...brandingData
        });

      if (error) throw error;

      await loadTenantData();
      alert('Branding updated successfully!');
    } catch (error) {
      console.error('Error updating branding:', error);
      alert('Error updating branding');
    } finally {
      setIsSaving(false);
    }
  };

  const updateTenantLimits = async (limits: { max_clients?: number; max_users?: number; storage_limit_gb?: number; api_calls_limit?: number }) => {
    setIsSaving(true);
    try {
      const { error } = await tenantManager.masterClient
        .from('tenants')
        .update(limits)
        .eq('id', tenantId);

      if (error) throw error;

      await loadTenantData();
      alert('Tenant limits updated successfully!');
    } catch (error) {
      console.error('Error updating tenant limits:', error);
      alert('Error updating tenant limits');
    } finally {
      setIsSaving(false);
    }
  };

  const getSettingValue = (key: string, defaultValue: string = '') => {
    const setting = settings.find(s => s.setting_key === key);
    return setting ? setting.setting_value : defaultValue;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading tenant settings...</p>
        </div>
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Tenant Not Found</h2>
          <p className="mt-2 text-gray-600">The requested tenant could not be found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{tenant.name} Settings</h1>
                <p className="mt-1 text-gray-600">
                  Configure settings and preferences for {tenant.name}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  tenant.status === 'ACTIVE' 
                    ? 'bg-green-100 text-green-800' 
                    : tenant.status === 'SUSPENDED'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {tenant.status}
                </span>
                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                  {tenant.plan}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {[
                { id: 'general', name: 'General Settings', icon: '⚙️' },
                { id: 'branding', name: 'Branding', icon: '🎨' },
                { id: 'limits', name: 'Limits & Quotas', icon: '📊' },
                { id: 'users', name: 'User Management', icon: '👥' },
                { id: 'billing', name: 'Billing & Subscription', icon: '💳' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            {activeTab === 'general' && (
              <GeneralSettingsTab
                settings={settings}
                onUpdateSetting={updateSetting}
                isSaving={isSaving}
              />
            )}

            {activeTab === 'branding' && (
              <BrandingTab
                branding={branding}
                onUpdateBranding={updateBranding}
                isSaving={isSaving}
              />
            )}

            {activeTab === 'limits' && (
              <LimitsTab
                tenant={tenant}
                onUpdateLimits={updateTenantLimits}
                isSaving={isSaving}
              />
            )}

            {activeTab === 'users' && (
              <UsersTab tenantId={tenantId} />
            )}

            {activeTab === 'billing' && (
              <BillingTab tenantId={tenantId} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// General Settings Tab
const GeneralSettingsTab: React.FC<{
  settings: TenantSettings[];
  onUpdateSetting: (key: string, value: string, type?: string) => void;
  isSaving: boolean;
}> = ({ settings, onUpdateSetting, isSaving }) => {
  const [formData, setFormData] = useState({
    timezone: '',
    currency: '',
    language: '',
    date_format: '',
    time_format: '',
    number_format: '',
    business_type: '',
    registration_number: '',
    license_number: '',
    address: '',
    city: '',
    country: '',
    phone: '',
    email: '',
    website: ''
  });

  useEffect(() => {
    setFormData({
      timezone: settings.find(s => s.setting_key === 'timezone')?.setting_value || 'Africa/Dar_es_Salaam',
      currency: settings.find(s => s.setting_key === 'currency')?.setting_value || 'TZS',
      language: settings.find(s => s.setting_key === 'language')?.setting_value || 'en',
      date_format: settings.find(s => s.setting_key === 'date_format')?.setting_value || 'DD/MM/YYYY',
      time_format: settings.find(s => s.setting_key === 'time_format')?.setting_value || '24',
      number_format: settings.find(s => s.setting_key === 'number_format')?.setting_value || 'US',
      business_type: settings.find(s => s.setting_key === 'business_type')?.setting_value || 'MFI',
      registration_number: settings.find(s => s.setting_key === 'registration_number')?.setting_value || '',
      license_number: settings.find(s => s.setting_key === 'license_number')?.setting_value || '',
      address: settings.find(s => s.setting_key === 'address')?.setting_value || '',
      city: settings.find(s => s.setting_key === 'city')?.setting_value || '',
      country: settings.find(s => s.setting_key === 'country')?.setting_value || '',
      phone: settings.find(s => s.setting_key === 'phone')?.setting_value || '',
      email: settings.find(s => s.setting_key === 'email')?.setting_value || '',
      website: settings.find(s => s.setting_key === 'website')?.setting_value || ''
    });
  }, [settings]);

  const handleSave = async () => {
    for (const [key, value] of Object.entries(formData)) {
      if (value) {
        await onUpdateSetting(key, value);
      }
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">General Settings</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">Timezone</label>
          <select
            value={formData.timezone}
            onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="Africa/Dar_es_Salaam">Africa/Dar_es_Salaam</option>
            <option value="Africa/Nairobi">Africa/Nairobi</option>
            <option value="Africa/Kampala">Africa/Kampala</option>
            <option value="UTC">UTC</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Currency</label>
          <select
            value={formData.currency}
            onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="TZS">Tanzanian Shilling (TZS)</option>
            <option value="USD">US Dollar (USD)</option>
            <option value="EUR">Euro (EUR)</option>
            <option value="KES">Kenyan Shilling (KES)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Language</label>
          <select
            value={formData.language}
            onChange={(e) => setFormData({ ...formData, language: e.target.value })}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="en">English</option>
            <option value="sw">Swahili</option>
            <option value="fr">French</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Date Format</label>
          <select
            value={formData.date_format}
            onChange={(e) => setFormData({ ...formData, date_format: e.target.value })}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="DD/MM/YYYY">DD/MM/YYYY</option>
            <option value="MM/DD/YYYY">MM/DD/YYYY</option>
            <option value="YYYY-MM-DD">YYYY-MM-DD</option>
          </select>
        </div>
      </div>

      <div className="pt-4 border-t">
        <h4 className="text-md font-medium text-gray-900 mb-4">Business Information</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Business Type</label>
            <select
              value={formData.business_type}
              onChange={(e) => setFormData({ ...formData, business_type: e.target.value })}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="MFI">Microfinance Institution</option>
              <option value="SACCO">SACCO</option>
              <option value="BANK">Bank</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Registration Number</label>
            <input
              type="text"
              value={formData.registration_number}
              onChange={(e) => setFormData({ ...formData, registration_number: e.target.value })}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">License Number</label>
            <input
              type="text"
              value={formData.license_number}
              onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Phone</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Website</label>
            <input
              type="url"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700">Address</label>
          <textarea
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            rows={3}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">City</label>
            <input
              type="text"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Country</label>
            <input
              type="text"
              value={formData.country}
              onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-6 border-t">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {isSaving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
};

// Branding Tab
const BrandingTab: React.FC<{
  branding: TenantBranding | null;
  onUpdateBranding: (data: Partial<TenantBranding>) => void;
  isSaving: boolean;
}> = ({ branding, onUpdateBranding, isSaving }) => {
  const [formData, setFormData] = useState({
    logo_url: '',
    primary_color: '#3B82F6',
    secondary_color: '#1E40AF',
    accent_color: '#F59E0B',
    font_family: 'Inter',
    custom_css: '',
    favicon_url: ''
  });

  useEffect(() => {
    if (branding) {
      setFormData({
        logo_url: branding.logo_url || '',
        primary_color: branding.primary_color || '#3B82F6',
        secondary_color: branding.secondary_color || '#1E40AF',
        accent_color: branding.accent_color || '#F59E0B',
        font_family: branding.font_family || 'Inter',
        custom_css: branding.custom_css || '',
        favicon_url: branding.favicon_url || ''
      });
    }
  }, [branding]);

  const handleSave = async () => {
    await onUpdateBranding(formData);
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">Branding Settings</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">Logo URL</label>
          <input
            type="url"
            value={formData.logo_url}
            onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            placeholder="https://example.com/logo.png"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Favicon URL</label>
          <input
            type="url"
            value={formData.favicon_url}
            onChange={(e) => setFormData({ ...formData, favicon_url: e.target.value })}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            placeholder="https://example.com/favicon.ico"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">Primary Color</label>
          <div className="flex">
            <input
              type="color"
              value={formData.primary_color}
              onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
              className="w-12 h-10 border border-gray-300 rounded-l-md cursor-pointer"
            />
            <input
              type="text"
              value={formData.primary_color}
              onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
              className="flex-1 border border-l-0 border-gray-300 rounded-r-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Secondary Color</label>
          <div className="flex">
            <input
              type="color"
              value={formData.secondary_color}
              onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
              className="w-12 h-10 border border-gray-300 rounded-l-md cursor-pointer"
            />
            <input
              type="text"
              value={formData.secondary_color}
              onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
              className="flex-1 border border-l-0 border-gray-300 rounded-r-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Accent Color</label>
          <div className="flex">
            <input
              type="color"
              value={formData.accent_color}
              onChange={(e) => setFormData({ ...formData, accent_color: e.target.value })}
              className="w-12 h-10 border border-gray-300 rounded-l-md cursor-pointer"
            />
            <input
              type="text"
              value={formData.accent_color}
              onChange={(e) => setFormData({ ...formData, accent_color: e.target.value })}
              className="flex-1 border border-l-0 border-gray-300 rounded-r-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Font Family</label>
        <select
          value={formData.font_family}
          onChange={(e) => setFormData({ ...formData, font_family: e.target.value })}
          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="Inter">Inter</option>
          <option value="Roboto">Roboto</option>
          <option value="Open Sans">Open Sans</option>
          <option value="Lato">Lato</option>
          <option value="Poppins">Poppins</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Custom CSS</label>
        <textarea
          value={formData.custom_css}
          onChange={(e) => setFormData({ ...formData, custom_css: e.target.value })}
          rows={6}
          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          placeholder="/* Custom CSS styles */"
        />
      </div>

      <div className="flex justify-end pt-6 border-t">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {isSaving ? 'Saving...' : 'Save Branding'}
        </button>
      </div>
    </div>
  );
};

// Limits Tab
const LimitsTab: React.FC<{
  tenant: Tenant;
  onUpdateLimits: (limits: any) => void;
  isSaving: boolean;
}> = ({ tenant, onUpdateLimits, isSaving }) => {
  const [formData, setFormData] = useState({
    max_clients: tenant.max_clients,
    max_users: tenant.max_users,
    storage_limit_gb: tenant.storage_limit_gb,
    api_calls_limit: tenant.api_calls_limit
  });

  const handleSave = async () => {
    await onUpdateLimits(formData);
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">Limits & Quotas</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">Max Clients</label>
          <input
            type="number"
            value={formData.max_clients}
            onChange={(e) => setFormData({ ...formData, max_clients: parseInt(e.target.value) })}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
          <p className="mt-1 text-sm text-gray-500">Maximum number of clients this tenant can have</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Max Users</label>
          <input
            type="number"
            value={formData.max_users}
            onChange={(e) => setFormData({ ...formData, max_users: parseInt(e.target.value) })}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
          <p className="mt-1 text-sm text-gray-500">Maximum number of users this tenant can have</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Storage Limit (GB)</label>
          <input
            type="number"
            value={formData.storage_limit_gb}
            onChange={(e) => setFormData({ ...formData, storage_limit_gb: parseInt(e.target.value) })}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
          <p className="mt-1 text-sm text-gray-500">Maximum storage this tenant can use</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">API Calls Limit</label>
          <input
            type="number"
            value={formData.api_calls_limit}
            onChange={(e) => setFormData({ ...formData, api_calls_limit: parseInt(e.target.value) })}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
          <p className="mt-1 text-sm text-gray-500">Maximum API calls per month</p>
        </div>
      </div>

      <div className="flex justify-end pt-6 border-t">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {isSaving ? 'Saving...' : 'Save Limits'}
        </button>
      </div>
    </div>
  );
};

// Users Tab
const UsersTab: React.FC<{ tenantId: string }> = ({ tenantId }) => {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, [tenantId]);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await tenantManager.masterClient
        .from('platform_users')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div>Loading users...</div>;
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">User Management</h3>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Last Login</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user: any) => (
              <tr key={user.id}>
                <td className="px-4 py-2 text-sm text-gray-900">
                  {user.first_name} {user.last_name}
                </td>
                <td className="px-4 py-2 text-sm text-gray-900">{user.email}</td>
                <td className="px-4 py-2 text-sm text-gray-900">{user.role}</td>
                <td className="px-4 py-2 text-sm text-gray-900">{user.status}</td>
                <td className="px-4 py-2 text-sm text-gray-500">
                  {user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}
                </td>
                <td className="px-4 py-2 text-sm font-medium">
                  <button className="text-blue-600 hover:text-blue-900">Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Billing Tab
const BillingTab: React.FC<{ tenantId: string }> = ({ tenantId }) => {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">Billing & Subscription</h3>
      <p className="text-gray-600">Billing management features will be implemented here.</p>
    </div>
  );
};

export default TenantSettingsPage;







