// Admin Settings Page
// Platform-wide settings for system administrators

import React, { useState, useEffect } from 'react';
import { tenantManager } from '../../lib/tenantManager';

interface PlatformSettings {
  id: string;
  setting_key: string;
  setting_value: string;
  setting_type: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'JSON';
  description: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

const AdminSettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<PlatformSettings[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      // Load platform settings from a dedicated table
      const { data, error } = await tenantManager.masterClient
        .from('platform_settings')
        .select('*')
        .order('setting_key');

      if (error && error.code !== 'PGRST116') throw error;

      setSettings(data || []);
    } catch (error) {
      console.error('Error loading platform settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateSetting = async (key: string, value: string, type: string = 'STRING') => {
    setIsSaving(true);
    try {
      const { error } = await tenantManager.masterClient
        .from('platform_settings')
        .upsert({
          setting_key: key,
          setting_value: value,
          setting_type: type,
          description: getSettingDescription(key),
          is_public: false
        });

      if (error) throw error;

      await loadSettings();
      alert('Setting updated successfully!');
    } catch (error) {
      console.error('Error updating setting:', error);
      alert('Error updating setting');
    } finally {
      setIsSaving(false);
    }
  };

  const getSettingDescription = (key: string): string => {
    const descriptions: { [key: string]: string } = {
      'platform_name': 'Name of the platform',
      'platform_url': 'Main platform URL',
      'support_email': 'Support email address',
      'admin_email': 'Admin email address',
      'default_currency': 'Default currency for new tenants',
      'default_timezone': 'Default timezone for new tenants',
      'max_tenants': 'Maximum number of tenants allowed',
      'trial_period_days': 'Trial period in days for new tenants',
      'maintenance_mode': 'Enable maintenance mode',
      'registration_enabled': 'Allow new tenant registration',
      'email_notifications': 'Enable email notifications',
      'sms_notifications': 'Enable SMS notifications',
      'backup_frequency': 'Backup frequency in hours',
      'session_timeout': 'Session timeout in minutes',
      'password_policy': 'Password policy requirements'
    };
    return descriptions[key] || 'Platform setting';
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
          <p className="mt-4 text-gray-600">Loading platform settings...</p>
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
            <h1 className="text-2xl font-bold text-gray-900">Platform Settings</h1>
            <p className="mt-1 text-gray-600">
              Configure platform-wide settings and preferences
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {[
                { id: 'general', name: 'General', icon: '⚙️' },
                { id: 'security', name: 'Security', icon: '🔒' },
                { id: 'notifications', name: 'Notifications', icon: '🔔' },
                { id: 'billing', name: 'Billing', icon: '💳' },
                { id: 'maintenance', name: 'Maintenance', icon: '🔧' }
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

            {activeTab === 'security' && (
              <SecuritySettingsTab
                settings={settings}
                onUpdateSetting={updateSetting}
                isSaving={isSaving}
              />
            )}

            {activeTab === 'notifications' && (
              <NotificationSettingsTab
                settings={settings}
                onUpdateSetting={updateSetting}
                isSaving={isSaving}
              />
            )}

            {activeTab === 'billing' && (
              <BillingSettingsTab
                settings={settings}
                onUpdateSetting={updateSetting}
                isSaving={isSaving}
              />
            )}

            {activeTab === 'maintenance' && (
              <MaintenanceSettingsTab
                settings={settings}
                onUpdateSetting={updateSetting}
                isSaving={isSaving}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// General Settings Tab
const GeneralSettingsTab: React.FC<{
  settings: PlatformSettings[];
  onUpdateSetting: (key: string, value: string, type?: string) => void;
  isSaving: boolean;
}> = ({ settings, onUpdateSetting, isSaving }) => {
  const [formData, setFormData] = useState({
    platform_name: '',
    platform_url: '',
    support_email: '',
    admin_email: '',
    default_currency: '',
    default_timezone: '',
    max_tenants: '',
    trial_period_days: '',
    registration_enabled: false
  });

  useEffect(() => {
    setFormData({
      platform_name: settings.find(s => s.setting_key === 'platform_name')?.setting_value || 'Credit Management System',
      platform_url: settings.find(s => s.setting_key === 'platform_url')?.setting_value || 'https://creditmanagement.com',
      support_email: settings.find(s => s.setting_key === 'support_email')?.setting_value || 'support@creditmanagement.com',
      admin_email: settings.find(s => s.setting_key === 'admin_email')?.setting_value || 'admin@creditmanagement.com',
      default_currency: settings.find(s => s.setting_key === 'default_currency')?.setting_value || 'TZS',
      default_timezone: settings.find(s => s.setting_key === 'default_timezone')?.setting_value || 'Africa/Dar_es_Salaam',
      max_tenants: settings.find(s => s.setting_key === 'max_tenants')?.setting_value || '1000',
      trial_period_days: settings.find(s => s.setting_key === 'trial_period_days')?.setting_value || '30',
      registration_enabled: settings.find(s => s.setting_key === 'registration_enabled')?.setting_value === 'true'
    });
  }, [settings]);

  const handleSave = async () => {
    for (const [key, value] of Object.entries(formData)) {
      await onUpdateSetting(key, value.toString(), typeof value === 'boolean' ? 'BOOLEAN' : 'STRING');
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">General Platform Settings</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">Platform Name</label>
          <input
            type="text"
            value={formData.platform_name}
            onChange={(e) => setFormData({ ...formData, platform_name: e.target.value })}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Platform URL</label>
          <input
            type="url"
            value={formData.platform_url}
            onChange={(e) => setFormData({ ...formData, platform_url: e.target.value })}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Support Email</label>
          <input
            type="email"
            value={formData.support_email}
            onChange={(e) => setFormData({ ...formData, support_email: e.target.value })}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Admin Email</label>
          <input
            type="email"
            value={formData.admin_email}
            onChange={(e) => setFormData({ ...formData, admin_email: e.target.value })}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Default Currency</label>
          <select
            value={formData.default_currency}
            onChange={(e) => setFormData({ ...formData, default_currency: e.target.value })}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="TZS">Tanzanian Shilling (TZS)</option>
            <option value="USD">US Dollar (USD)</option>
            <option value="EUR">Euro (EUR)</option>
            <option value="KES">Kenyan Shilling (KES)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Default Timezone</label>
          <select
            value={formData.default_timezone}
            onChange={(e) => setFormData({ ...formData, default_timezone: e.target.value })}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="Africa/Dar_es_Salaam">Africa/Dar_es_Salaam</option>
            <option value="Africa/Nairobi">Africa/Nairobi</option>
            <option value="Africa/Kampala">Africa/Kampala</option>
            <option value="UTC">UTC</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Max Tenants</label>
          <input
            type="number"
            value={formData.max_tenants}
            onChange={(e) => setFormData({ ...formData, max_tenants: e.target.value })}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Trial Period (Days)</label>
          <input
            type="number"
            value={formData.trial_period_days}
            onChange={(e) => setFormData({ ...formData, trial_period_days: e.target.value })}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          id="registration_enabled"
          checked={formData.registration_enabled}
          onChange={(e) => setFormData({ ...formData, registration_enabled: e.target.checked })}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        <label htmlFor="registration_enabled" className="ml-2 block text-sm text-gray-900">
          Allow new tenant registration
        </label>
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

// Security Settings Tab
const SecuritySettingsTab: React.FC<{
  settings: PlatformSettings[];
  onUpdateSetting: (key: string, value: string, type?: string) => void;
  isSaving: boolean;
}> = ({ settings, onUpdateSetting, isSaving }) => {
  const [formData, setFormData] = useState({
    session_timeout: '',
    password_policy: '',
    two_factor_auth: false,
    ip_whitelist: '',
    ssl_enforced: false,
    audit_logging: true
  });

  useEffect(() => {
    setFormData({
      session_timeout: settings.find(s => s.setting_key === 'session_timeout')?.setting_value || '60',
      password_policy: settings.find(s => s.setting_key === 'password_policy')?.setting_value || 'medium',
      two_factor_auth: settings.find(s => s.setting_key === 'two_factor_auth')?.setting_value === 'true',
      ip_whitelist: settings.find(s => s.setting_key === 'ip_whitelist')?.setting_value || '',
      ssl_enforced: settings.find(s => s.setting_key === 'ssl_enforced')?.setting_value === 'true',
      audit_logging: settings.find(s => s.setting_key === 'audit_logging')?.setting_value !== 'false'
    });
  }, [settings]);

  const handleSave = async () => {
    for (const [key, value] of Object.entries(formData)) {
      await onUpdateSetting(key, value.toString(), typeof value === 'boolean' ? 'BOOLEAN' : 'STRING');
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">Security Settings</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">Session Timeout (Minutes)</label>
          <input
            type="number"
            value={formData.session_timeout}
            onChange={(e) => setFormData({ ...formData, session_timeout: e.target.value })}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Password Policy</label>
          <select
            value={formData.password_policy}
            onChange={(e) => setFormData({ ...formData, password_policy: e.target.value })}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="weak">Weak (6+ characters)</option>
            <option value="medium">Medium (8+ characters, mixed case)</option>
            <option value="strong">Strong (12+ characters, special chars)</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">IP Whitelist</label>
        <textarea
          value={formData.ip_whitelist}
          onChange={(e) => setFormData({ ...formData, ip_whitelist: e.target.value })}
          rows={3}
          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          placeholder="Enter IP addresses, one per line"
        />
        <p className="mt-1 text-sm text-gray-500">Leave empty to allow all IPs</p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center">
          <input
            type="checkbox"
            id="two_factor_auth"
            checked={formData.two_factor_auth}
            onChange={(e) => setFormData({ ...formData, two_factor_auth: e.target.checked })}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="two_factor_auth" className="ml-2 block text-sm text-gray-900">
            Require two-factor authentication
          </label>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="ssl_enforced"
            checked={formData.ssl_enforced}
            onChange={(e) => setFormData({ ...formData, ssl_enforced: e.target.checked })}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="ssl_enforced" className="ml-2 block text-sm text-gray-900">
            Enforce SSL/TLS connections
          </label>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="audit_logging"
            checked={formData.audit_logging}
            onChange={(e) => setFormData({ ...formData, audit_logging: e.target.checked })}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="audit_logging" className="ml-2 block text-sm text-gray-900">
            Enable audit logging
          </label>
        </div>
      </div>

      <div className="flex justify-end pt-6 border-t">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {isSaving ? 'Saving...' : 'Save Security Settings'}
        </button>
      </div>
    </div>
  );
};

// Notification Settings Tab
const NotificationSettingsTab: React.FC<{
  settings: PlatformSettings[];
  onUpdateSetting: (key: string, value: string, type?: string) => void;
  isSaving: boolean;
}> = ({ settings, onUpdateSetting, isSaving }) => {
  const [formData, setFormData] = useState({
    email_notifications: true,
    sms_notifications: false,
    push_notifications: true,
    notification_frequency: 'immediate',
    email_smtp_host: '',
    email_smtp_port: '',
    email_smtp_user: '',
    email_smtp_pass: '',
    sms_provider: '',
    sms_api_key: ''
  });

  useEffect(() => {
    setFormData({
      email_notifications: settings.find(s => s.setting_key === 'email_notifications')?.setting_value !== 'false',
      sms_notifications: settings.find(s => s.setting_key === 'sms_notifications')?.setting_value === 'true',
      push_notifications: settings.find(s => s.setting_key === 'push_notifications')?.setting_value !== 'false',
      notification_frequency: settings.find(s => s.setting_key === 'notification_frequency')?.setting_value || 'immediate',
      email_smtp_host: settings.find(s => s.setting_key === 'email_smtp_host')?.setting_value || '',
      email_smtp_port: settings.find(s => s.setting_key === 'email_smtp_port')?.setting_value || '587',
      email_smtp_user: settings.find(s => s.setting_key === 'email_smtp_user')?.setting_value || '',
      email_smtp_pass: settings.find(s => s.setting_key === 'email_smtp_pass')?.setting_value || '',
      sms_provider: settings.find(s => s.setting_key === 'sms_provider')?.setting_value || '',
      sms_api_key: settings.find(s => s.setting_key === 'sms_api_key')?.setting_value || ''
    });
  }, [settings]);

  const handleSave = async () => {
    for (const [key, value] of Object.entries(formData)) {
      await onUpdateSetting(key, value.toString(), typeof value === 'boolean' ? 'BOOLEAN' : 'STRING');
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">Notification Settings</h3>
      
      <div className="space-y-4">
        <div className="flex items-center">
          <input
            type="checkbox"
            id="email_notifications"
            checked={formData.email_notifications}
            onChange={(e) => setFormData({ ...formData, email_notifications: e.target.checked })}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="email_notifications" className="ml-2 block text-sm text-gray-900">
            Enable email notifications
          </label>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="sms_notifications"
            checked={formData.sms_notifications}
            onChange={(e) => setFormData({ ...formData, sms_notifications: e.target.checked })}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="sms_notifications" className="ml-2 block text-sm text-gray-900">
            Enable SMS notifications
          </label>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="push_notifications"
            checked={formData.push_notifications}
            onChange={(e) => setFormData({ ...formData, push_notifications: e.target.checked })}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="push_notifications" className="ml-2 block text-sm text-gray-900">
            Enable push notifications
          </label>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Notification Frequency</label>
        <select
          value={formData.notification_frequency}
          onChange={(e) => setFormData({ ...formData, notification_frequency: e.target.value })}
          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="immediate">Immediate</option>
          <option value="hourly">Hourly</option>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
        </select>
      </div>

      <div className="pt-6 border-t">
        <h4 className="text-md font-medium text-gray-900 mb-4">Email Configuration</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">SMTP Host</label>
            <input
              type="text"
              value={formData.email_smtp_host}
              onChange={(e) => setFormData({ ...formData, email_smtp_host: e.target.value })}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              placeholder="smtp.gmail.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">SMTP Port</label>
            <input
              type="number"
              value={formData.email_smtp_port}
              onChange={(e) => setFormData({ ...formData, email_smtp_port: e.target.value })}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">SMTP Username</label>
            <input
              type="text"
              value={formData.email_smtp_user}
              onChange={(e) => setFormData({ ...formData, email_smtp_user: e.target.value })}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">SMTP Password</label>
            <input
              type="password"
              value={formData.email_smtp_pass}
              onChange={(e) => setFormData({ ...formData, email_smtp_pass: e.target.value })}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      <div className="pt-6 border-t">
        <h4 className="text-md font-medium text-gray-900 mb-4">SMS Configuration</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">SMS Provider</label>
            <select
              value={formData.sms_provider}
              onChange={(e) => setFormData({ ...formData, sms_provider: e.target.value })}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select Provider</option>
              <option value="twilio">Twilio</option>
              <option value="africas_talking">Africa's Talking</option>
              <option value="vonage">Vonage</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">SMS API Key</label>
            <input
              type="password"
              value={formData.sms_api_key}
              onChange={(e) => setFormData({ ...formData, sms_api_key: e.target.value })}
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
          {isSaving ? 'Saving...' : 'Save Notification Settings'}
        </button>
      </div>
    </div>
  );
};

// Billing Settings Tab
const BillingSettingsTab: React.FC<{
  settings: PlatformSettings[];
  onUpdateSetting: (key: string, value: string, type?: string) => void;
  isSaving: boolean;
}> = ({ settings, onUpdateSetting, isSaving }) => {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">Billing Settings</h3>
      <p className="text-gray-600">Billing configuration features will be implemented here.</p>
    </div>
  );
};

// Maintenance Settings Tab
const MaintenanceSettingsTab: React.FC<{
  settings: PlatformSettings[];
  onUpdateSetting: (key: string, value: string, type?: string) => void;
  isSaving: boolean;
}> = ({ settings, onUpdateSetting, isSaving }) => {
  const [formData, setFormData] = useState({
    maintenance_mode: false,
    maintenance_message: '',
    backup_frequency: '24',
    log_retention_days: '90'
  });

  useEffect(() => {
    setFormData({
      maintenance_mode: settings.find(s => s.setting_key === 'maintenance_mode')?.setting_value === 'true',
      maintenance_message: settings.find(s => s.setting_key === 'maintenance_message')?.setting_value || 'System is under maintenance. Please try again later.',
      backup_frequency: settings.find(s => s.setting_key === 'backup_frequency')?.setting_value || '24',
      log_retention_days: settings.find(s => s.setting_key === 'log_retention_days')?.setting_value || '90'
    });
  }, [settings]);

  const handleSave = async () => {
    for (const [key, value] of Object.entries(formData)) {
      await onUpdateSetting(key, value.toString(), typeof value === 'boolean' ? 'BOOLEAN' : 'STRING');
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">Maintenance Settings</h3>
      
      <div className="space-y-4">
        <div className="flex items-center">
          <input
            type="checkbox"
            id="maintenance_mode"
            checked={formData.maintenance_mode}
            onChange={(e) => setFormData({ ...formData, maintenance_mode: e.target.checked })}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="maintenance_mode" className="ml-2 block text-sm text-gray-900">
            Enable maintenance mode
          </label>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Maintenance Message</label>
        <textarea
          value={formData.maintenance_message}
          onChange={(e) => setFormData({ ...formData, maintenance_message: e.target.value })}
          rows={3}
          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">Backup Frequency (Hours)</label>
          <input
            type="number"
            value={formData.backup_frequency}
            onChange={(e) => setFormData({ ...formData, backup_frequency: e.target.value })}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Log Retention (Days)</label>
          <input
            type="number"
            value={formData.log_retention_days}
            onChange={(e) => setFormData({ ...formData, log_retention_days: e.target.value })}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      <div className="flex justify-end pt-6 border-t">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {isSaving ? 'Saving...' : 'Save Maintenance Settings'}
        </button>
      </div>
    </div>
  );
};

export default AdminSettingsPage;





























