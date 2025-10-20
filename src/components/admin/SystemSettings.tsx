// System Settings Component
// Platform-wide settings and configuration management
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { 
  Settings, 
  Save, 
  RefreshCw, 
  Shield, 
  Database, 
  Mail, 
  Bell, 
  Globe, 
  Key, 
  Server, 
  HardDrive, 
  Cpu, 
  Wifi, 
  AlertCircle,
  CheckCircle,
  XCircle,
  Info,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Upload,
  Download,
  Trash2,
  Plus,
  Edit,
  Search,
  Filter
} from 'lucide-react';

interface SystemConfig {
  platform_name: string;
  platform_url: string;
  default_currency: string;
  default_language: string;
  default_timezone: string;
  maintenance_mode: boolean;
  registration_enabled: boolean;
  email_verification_required: boolean;
  two_factor_required: boolean;
  password_min_length: number;
  password_require_uppercase: boolean;
  password_require_lowercase: boolean;
  password_require_numbers: boolean;
  password_require_symbols: boolean;
  session_timeout_minutes: number;
  max_login_attempts: number;
  lockout_duration_minutes: number;
  api_rate_limit: number;
  file_upload_limit_mb: number;
  backup_frequency: string;
  backup_retention_days: number;
  log_level: string;
  analytics_enabled: boolean;
  error_reporting_enabled: boolean;
  performance_monitoring: boolean;
  security_scanning: boolean;
  auto_updates: boolean;
  beta_features: boolean;
  debug_mode: boolean;
}

interface EmailConfig {
  smtp_host: string;
  smtp_port: number;
  smtp_username: string;
  smtp_password: string;
  smtp_encryption: 'none' | 'ssl' | 'tls';
  from_email: string;
  from_name: string;
  reply_to_email: string;
  test_email: string;
}

interface DatabaseConfig {
  connection_pool_size: number;
  query_timeout_seconds: number;
  backup_enabled: boolean;
  backup_schedule: string;
  replication_enabled: boolean;
  read_replicas: number;
  cache_enabled: boolean;
  cache_ttl_seconds: number;
}

interface SecurityConfig {
  jwt_secret: string;
  jwt_expiry_hours: number;
  refresh_token_expiry_days: number;
  encryption_key: string;
  ssl_required: boolean;
  cors_origins: string[];
  rate_limiting_enabled: boolean;
  ip_whitelist: string[];
  ip_blacklist: string[];
  content_security_policy: string;
  xss_protection: boolean;
  csrf_protection: boolean;
}

interface SystemLog {
  id: string;
  level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL';
  message: string;
  timestamp: string;
  source: string;
  user_id?: string;
  ip_address?: string;
  user_agent?: string;
  stack_trace?: string;
}

const SystemSettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'general' | 'security' | 'email' | 'database' | 'logs' | 'backup'>('general');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [logLevel, setLogLevel] = useState<string>('all');
  const [logSearch, setLogSearch] = useState('');

  const [systemConfig, setSystemConfig] = useState<SystemConfig>({
    platform_name: 'Credit Management Platform',
    platform_url: 'https://creditmanagement.com',
    default_currency: 'USD',
    default_language: 'en',
    default_timezone: 'UTC',
    maintenance_mode: false,
    registration_enabled: true,
    email_verification_required: true,
    two_factor_required: false,
    password_min_length: 8,
    password_require_uppercase: true,
    password_require_lowercase: true,
    password_require_numbers: true,
    password_require_symbols: true,
    session_timeout_minutes: 60,
    max_login_attempts: 5,
    lockout_duration_minutes: 15,
    api_rate_limit: 1000,
    file_upload_limit_mb: 10,
    backup_frequency: 'daily',
    backup_retention_days: 30,
    log_level: 'INFO',
    analytics_enabled: true,
    error_reporting_enabled: true,
    performance_monitoring: true,
    security_scanning: true,
    auto_updates: true,
    beta_features: false,
    debug_mode: false
  });

  const [emailConfig, setEmailConfig] = useState<EmailConfig>({
    smtp_host: '',
    smtp_port: 587,
    smtp_username: '',
    smtp_password: '',
    smtp_encryption: 'tls',
    from_email: 'noreply@creditmanagement.com',
    from_name: 'Credit Management Platform',
    reply_to_email: 'support@creditmanagement.com',
    test_email: ''
  });

  const [databaseConfig, setDatabaseConfig] = useState<DatabaseConfig>({
    connection_pool_size: 10,
    query_timeout_seconds: 30,
    backup_enabled: true,
    backup_schedule: '0 2 * * *',
    replication_enabled: false,
    read_replicas: 0,
    cache_enabled: true,
    cache_ttl_seconds: 3600
  });

  const [securityConfig, setSecurityConfig] = useState<SecurityConfig>({
    jwt_secret: '',
    jwt_expiry_hours: 24,
    refresh_token_expiry_days: 7,
    encryption_key: '',
    ssl_required: true,
    cors_origins: ['https://creditmanagement.com'],
    rate_limiting_enabled: true,
    ip_whitelist: [],
    ip_blacklist: [],
    content_security_policy: "default-src 'self'",
    xss_protection: true,
    csrf_protection: true
  });

  useEffect(() => {
    loadSettings();
    if (activeTab === 'logs') {
      loadLogs();
    }
  }, [activeTab]);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      // Load system configuration from database
      const { data: configData, error: configError } = await supabase
        .from('system_settings')
        .select('*')
        .single();

      if (!configError && configData) {
        setSystemConfig(configData);
      }

      // Load email configuration
      const { data: emailData, error: emailError } = await supabase
        .from('email_settings')
        .select('*')
        .single();

      if (!emailError && emailData) {
        setEmailConfig(emailData);
      }

      // Load database configuration
      const { data: dbData, error: dbError } = await supabase
        .from('database_settings')
        .select('*')
        .single();

      if (!dbError && dbData) {
        setDatabaseConfig(dbData);
      }

      // Load security configuration
      const { data: securityData, error: securityError } = await supabase
        .from('security_settings')
        .select('*')
        .single();

      if (!securityError && securityData) {
        setSecurityConfig(securityData);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadLogs = async () => {
    try {
      const { data: logData, error: logError } = await supabase
        .from('system_logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(100);

      if (!logError && logData) {
        setLogs(logData);
      }
    } catch (error) {
      console.error('Error loading logs:', error);
    }
  };

  const saveSettings = async (configType: string, config: any) => {
    try {
      setIsSaving(true);
      const { error } = await supabase
        .from(`${configType}_settings`)
        .upsert(config, { onConflict: 'id' });

      if (error) {
        console.error(`Error saving ${configType} settings:`, error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error(`Error saving ${configType} settings:`, error);
      return { success: false, error: 'Failed to save settings' };
    } finally {
      setIsSaving(false);
    }
  };

  const testEmailConnection = async () => {
    try {
      const { data, error } = await supabase
        .rpc('test_email_connection', {
          smtp_host: emailConfig.smtp_host,
          smtp_port: emailConfig.smtp_port,
          smtp_username: emailConfig.smtp_username,
          smtp_password: emailConfig.smtp_password,
          smtp_encryption: emailConfig.smtp_encryption,
          test_email: emailConfig.test_email
        });

      if (error) {
        console.error('Email test failed:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Email test failed:', error);
      return { success: false, error: 'Failed to test email connection' };
    }
  };

  const generateNewSecret = (type: 'jwt' | 'encryption') => {
    const secret = Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    if (type === 'jwt') {
      setSecurityConfig({...securityConfig, jwt_secret: secret});
    } else {
      setSecurityConfig({...securityConfig, encryption_key: secret});
    }
  };

  const getLogLevelColor = (level: string) => {
    switch (level) {
      case 'ERROR':
      case 'FATAL':
        return 'text-red-600 bg-red-100';
      case 'WARN':
        return 'text-yellow-600 bg-yellow-100';
      case 'INFO':
        return 'text-blue-600 bg-blue-100';
      case 'DEBUG':
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesLevel = logLevel === 'all' || log.level === logLevel;
    const matchesSearch = log.message.toLowerCase().includes(logSearch.toLowerCase()) ||
                         log.source.toLowerCase().includes(logSearch.toLowerCase());
    return matchesLevel && matchesSearch;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">System Settings</h2>
          <p className="text-gray-600">Configure platform-wide settings and preferences</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => loadSettings()}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'general', label: 'General', icon: Settings },
              { id: 'security', label: 'Security', icon: Shield },
              { id: 'email', label: 'Email', icon: Mail },
              { id: 'database', label: 'Database', icon: Database },
              { id: 'logs', label: 'Logs', icon: AlertCircle },
              { id: 'backup', label: 'Backup', icon: HardDrive }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-3 py-4 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* General Settings */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">General Configuration</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Platform Name</label>
                    <input
                      type="text"
                      value={systemConfig.platform_name}
                      onChange={(e) => setSystemConfig({...systemConfig, platform_name: e.target.value})}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Platform URL</label>
                    <input
                      type="url"
                      value={systemConfig.platform_url}
                      onChange={(e) => setSystemConfig({...systemConfig, platform_url: e.target.value})}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Default Currency</label>
                    <select
                      value={systemConfig.default_currency}
                      onChange={(e) => setSystemConfig({...systemConfig, default_currency: e.target.value})}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="USD">USD</option>
                      <option value="TZS">TZS</option>
                      <option value="EUR">EUR</option>
                      <option value="GBP">GBP</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Default Language</label>
                    <select
                      value={systemConfig.default_language}
                      onChange={(e) => setSystemConfig({...systemConfig, default_language: e.target.value})}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="en">English</option>
                      <option value="sw">Swahili</option>
                      <option value="fr">French</option>
                      <option value="es">Spanish</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Default Timezone</label>
                    <select
                      value={systemConfig.default_timezone}
                      onChange={(e) => setSystemConfig({...systemConfig, default_timezone: e.target.value})}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="UTC">UTC</option>
                      <option value="America/New_York">Eastern Time</option>
                      <option value="America/Chicago">Central Time</option>
                      <option value="America/Denver">Mountain Time</option>
                      <option value="America/Los_Angeles">Pacific Time</option>
                      <option value="Europe/London">London</option>
                      <option value="Africa/Nairobi">Nairobi</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">API Rate Limit (per hour)</label>
                    <input
                      type="number"
                      value={systemConfig.api_rate_limit}
                      onChange={(e) => setSystemConfig({...systemConfig, api_rate_limit: parseInt(e.target.value)})}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Feature Flags</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-900">Maintenance Mode</label>
                      <p className="text-sm text-gray-500">Disable access for all users except admins</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={systemConfig.maintenance_mode}
                      onChange={(e) => setSystemConfig({...systemConfig, maintenance_mode: e.target.checked})}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-900">Registration Enabled</label>
                      <p className="text-sm text-gray-500">Allow new user registrations</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={systemConfig.registration_enabled}
                      onChange={(e) => setSystemConfig({...systemConfig, registration_enabled: e.target.checked})}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-900">Analytics Enabled</label>
                      <p className="text-sm text-gray-500">Collect usage analytics and metrics</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={systemConfig.analytics_enabled}
                      onChange={(e) => setSystemConfig({...systemConfig, analytics_enabled: e.target.checked})}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-900">Debug Mode</label>
                      <p className="text-sm text-gray-500">Enable detailed error reporting and logging</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={systemConfig.debug_mode}
                      onChange={(e) => setSystemConfig({...systemConfig, debug_mode: e.target.checked})}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => saveSettings('system', systemConfig)}
                  disabled={isSaving}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save General Settings
                </button>
              </div>
            </div>
          )}

          {/* Security Settings */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Authentication & Authorization</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email Verification Required</label>
                    <input
                      type="checkbox"
                      checked={systemConfig.email_verification_required}
                      onChange={(e) => setSystemConfig({...systemConfig, email_verification_required: e.target.checked})}
                      className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Two-Factor Required</label>
                    <input
                      type="checkbox"
                      checked={systemConfig.two_factor_required}
                      onChange={(e) => setSystemConfig({...systemConfig, two_factor_required: e.target.checked})}
                      className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Session Timeout (minutes)</label>
                    <input
                      type="number"
                      value={systemConfig.session_timeout_minutes}
                      onChange={(e) => setSystemConfig({...systemConfig, session_timeout_minutes: parseInt(e.target.value)})}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Max Login Attempts</label>
                    <input
                      type="number"
                      value={systemConfig.max_login_attempts}
                      onChange={(e) => setSystemConfig({...systemConfig, max_login_attempts: parseInt(e.target.value)})}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Password Policy</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Minimum Length</label>
                    <input
                      type="number"
                      value={systemConfig.password_min_length}
                      onChange={(e) => setSystemConfig({...systemConfig, password_min_length: parseInt(e.target.value)})}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Lockout Duration (minutes)</label>
                    <input
                      type="number"
                      value={systemConfig.lockout_duration_minutes}
                      onChange={(e) => setSystemConfig({...systemConfig, lockout_duration_minutes: parseInt(e.target.value)})}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                <div className="mt-4 space-y-3">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={systemConfig.password_require_uppercase}
                      onChange={(e) => setSystemConfig({...systemConfig, password_require_uppercase: e.target.checked})}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 text-sm text-gray-900">Require uppercase letters</label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={systemConfig.password_require_lowercase}
                      onChange={(e) => setSystemConfig({...systemConfig, password_require_lowercase: e.target.checked})}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 text-sm text-gray-900">Require lowercase letters</label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={systemConfig.password_require_numbers}
                      onChange={(e) => setSystemConfig({...systemConfig, password_require_numbers: e.target.checked})}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 text-sm text-gray-900">Require numbers</label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={systemConfig.password_require_symbols}
                      onChange={(e) => setSystemConfig({...systemConfig, password_require_symbols: e.target.checked})}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 text-sm text-gray-900">Require symbols</label>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Security Keys</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">JWT Secret</label>
                    <div className="flex">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={securityConfig.jwt_secret}
                        onChange={(e) => setSecurityConfig({...securityConfig, jwt_secret: e.target.value})}
                        className="mt-1 block w-full border-gray-300 rounded-l-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      />
                      <button
                        onClick={() => generateNewSecret('jwt')}
                        className="px-3 py-2 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 hover:bg-gray-100"
                      >
                        Generate
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Encryption Key</label>
                    <div className="flex">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={securityConfig.encryption_key}
                        onChange={(e) => setSecurityConfig({...securityConfig, encryption_key: e.target.value})}
                        className="mt-1 block w-full border-gray-300 rounded-l-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      />
                      <button
                        onClick={() => generateNewSecret('encryption')}
                        className="px-3 py-2 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 hover:bg-gray-100"
                      >
                        Generate
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => saveSettings('security', securityConfig)}
                  disabled={isSaving}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Security Settings
                </button>
              </div>
            </div>
          )}

          {/* Email Settings */}
          {activeTab === 'email' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">SMTP Configuration</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">SMTP Host</label>
                    <input
                      type="text"
                      value={emailConfig.smtp_host}
                      onChange={(e) => setEmailConfig({...emailConfig, smtp_host: e.target.value})}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">SMTP Port</label>
                    <input
                      type="number"
                      value={emailConfig.smtp_port}
                      onChange={(e) => setEmailConfig({...emailConfig, smtp_port: parseInt(e.target.value)})}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">SMTP Username</label>
                    <input
                      type="text"
                      value={emailConfig.smtp_username}
                      onChange={(e) => setEmailConfig({...emailConfig, smtp_username: e.target.value})}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">SMTP Password</label>
                    <input
                      type="password"
                      value={emailConfig.smtp_password}
                      onChange={(e) => setEmailConfig({...emailConfig, smtp_password: e.target.value})}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Encryption</label>
                    <select
                      value={emailConfig.smtp_encryption}
                      onChange={(e) => setEmailConfig({...emailConfig, smtp_encryption: e.target.value as any})}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="none">None</option>
                      <option value="ssl">SSL</option>
                      <option value="tls">TLS</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">From Email</label>
                    <input
                      type="email"
                      value={emailConfig.from_email}
                      onChange={(e) => setEmailConfig({...emailConfig, from_email: e.target.value})}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">From Name</label>
                    <input
                      type="text"
                      value={emailConfig.from_name}
                      onChange={(e) => setEmailConfig({...emailConfig, from_name: e.target.value})}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Reply-To Email</label>
                    <input
                      type="email"
                      value={emailConfig.reply_to_email}
                      onChange={(e) => setEmailConfig({...emailConfig, reply_to_email: e.target.value})}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Test Email Configuration</h3>
                <div className="flex space-x-4">
                  <input
                    type="email"
                    placeholder="Test email address"
                    value={emailConfig.test_email}
                    onChange={(e) => setEmailConfig({...emailConfig, test_email: e.target.value})}
                    className="flex-1 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                  <button
                    onClick={testEmailConnection}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
                  >
                    <Mail className="w-4 h-4" />
                    Test Connection
                  </button>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => saveSettings('email', emailConfig)}
                  disabled={isSaving}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Email Settings
                </button>
              </div>
            </div>
          )}

          {/* Database Settings */}
          {activeTab === 'database' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Connection Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Connection Pool Size</label>
                    <input
                      type="number"
                      value={databaseConfig.connection_pool_size}
                      onChange={(e) => setDatabaseConfig({...databaseConfig, connection_pool_size: parseInt(e.target.value)})}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Query Timeout (seconds)</label>
                    <input
                      type="number"
                      value={databaseConfig.query_timeout_seconds}
                      onChange={(e) => setDatabaseConfig({...databaseConfig, query_timeout_seconds: parseInt(e.target.value)})}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Cache TTL (seconds)</label>
                    <input
                      type="number"
                      value={databaseConfig.cache_ttl_seconds}
                      onChange={(e) => setDatabaseConfig({...databaseConfig, cache_ttl_seconds: parseInt(e.target.value)})}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Read Replicas</label>
                    <input
                      type="number"
                      value={databaseConfig.read_replicas}
                      onChange={(e) => setDatabaseConfig({...databaseConfig, read_replicas: parseInt(e.target.value)})}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Backup Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Backup Schedule (Cron)</label>
                    <input
                      type="text"
                      value={databaseConfig.backup_schedule}
                      onChange={(e) => setDatabaseConfig({...databaseConfig, backup_schedule: e.target.value})}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Retention Days</label>
                    <input
                      type="number"
                      value={databaseConfig.backup_retention_days}
                      onChange={(e) => setDatabaseConfig({...databaseConfig, backup_retention_days: parseInt(e.target.value)})}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                <div className="mt-4 space-y-3">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={databaseConfig.backup_enabled}
                      onChange={(e) => setDatabaseConfig({...databaseConfig, backup_enabled: e.target.checked})}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 text-sm text-gray-900">Enable automatic backups</label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={databaseConfig.replication_enabled}
                      onChange={(e) => setDatabaseConfig({...databaseConfig, replication_enabled: e.target.checked})}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 text-sm text-gray-900">Enable replication</label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={databaseConfig.cache_enabled}
                      onChange={(e) => setDatabaseConfig({...databaseConfig, cache_enabled: e.target.checked})}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 text-sm text-gray-900">Enable query caching</label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => saveSettings('database', databaseConfig)}
                  disabled={isSaving}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Database Settings
                </button>
              </div>
            </div>
          )}

          {/* System Logs */}
          {activeTab === 'logs' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">System Logs</h3>
                <div className="flex space-x-2">
                  <select
                    value={logLevel}
                    onChange={(e) => setLogLevel(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Levels</option>
                    <option value="DEBUG">Debug</option>
                    <option value="INFO">Info</option>
                    <option value="WARN">Warning</option>
                    <option value="ERROR">Error</option>
                    <option value="FATAL">Fatal</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Search logs..."
                    value={logSearch}
                    onChange={(e) => setLogSearch(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <button
                    onClick={loadLogs}
                    className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Refresh
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Level
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Message
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Source
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Timestamp
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          User
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getLogLevelColor(log.level)}`}>
                              {log.level}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900 max-w-md truncate">
                            {log.message}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {log.source}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(log.timestamp).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {log.user_id || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Backup Settings */}
          {activeTab === 'backup' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Backup Management</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Backup Frequency</label>
                    <select
                      value={systemConfig.backup_frequency}
                      onChange={(e) => setSystemConfig({...systemConfig, backup_frequency: e.target.value})}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="hourly">Hourly</option>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Retention Days</label>
                    <input
                      type="number"
                      value={systemConfig.backup_retention_days}
                      onChange={(e) => setSystemConfig({...systemConfig, backup_retention_days: parseInt(e.target.value)})}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Backup Actions</h3>
                <div className="flex space-x-4">
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2">
                    <Download className="w-4 h-4" />
                    Create Backup
                  </button>
                  <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    Restore Backup
                  </button>
                  <button className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 flex items-center gap-2">
                    <HardDrive className="w-4 h-4" />
                    View Backups
                  </button>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => saveSettings('system', systemConfig)}
                  disabled={isSaving}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Backup Settings
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SystemSettings;
