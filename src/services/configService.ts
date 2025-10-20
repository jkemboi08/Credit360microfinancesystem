import { supabase } from '../lib/supabaseClient';

export interface NotificationConfig {
  smsProvider: 'africas_talking' | 'twilio' | 'local';
  emailProvider: 'sendgrid' | 'aws_ses' | 'local';
  smsApiKey?: string;
  smsUsername?: string;
  emailApiKey?: string;
  fromEmail?: string;
  fromSms?: string;
}

export interface AINotificationConfig {
  enabled: boolean;
  smsEnabled: boolean;
  emailEnabled: boolean;
  reminderDays: number[];
  escalationDays: number;
  personalizedMessages: boolean;
  autoEscalation: boolean;
}

export interface SchedulerConfig {
  enabled: boolean;
  reminderCheckInterval: number;
  escalationCheckInterval: number;
  maxRetries: number;
  retryDelay: number;
}

class ConfigService {
  private static instance: ConfigService;
  private configCache: Map<string, any> = new Map();

  private constructor() {}

  static getInstance(): ConfigService {
    if (!ConfigService.instance) {
      ConfigService.instance = new ConfigService();
    }
    return ConfigService.instance;
  }

  // Get notification configuration
  async getNotificationConfig(): Promise<NotificationConfig> {
    const cacheKey = 'notification_config';
    
    if (this.configCache.has(cacheKey)) {
      return this.configCache.get(cacheKey);
    }

    try {
      const { data, error } = await supabase
        .from('system_config')
        .select('config_value')
        .eq('config_key', 'notification_config')
        .single();

      if (error && error.code !== 'PGRST116') { // Not found error
        console.error('Error fetching notification config:', error);
      }

      const config: NotificationConfig = data?.config_value || {
        smsProvider: 'local',
        emailProvider: 'local',
        fromEmail: 'noreply@mfi.com',
        fromSms: 'MFI'
      };

      this.configCache.set(cacheKey, config);
      return config;
    } catch (error) {
      console.error('Error fetching notification config:', error);
      return {
        smsProvider: 'local',
        emailProvider: 'local',
        fromEmail: 'noreply@mfi.com',
        fromSms: 'MFI'
      };
    }
  }

  // Save notification configuration
  async saveNotificationConfig(config: NotificationConfig): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('system_config')
        .upsert({
          config_key: 'notification_config',
          config_value: config,
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error saving notification config:', error);
        return false;
      }

      this.configCache.set('notification_config', config);
      return true;
    } catch (error) {
      console.error('Error saving notification config:', error);
      return false;
    }
  }

  // Get AI notification configuration
  async getAINotificationConfig(): Promise<AINotificationConfig> {
    const cacheKey = 'ai_notification_config';
    
    if (this.configCache.has(cacheKey)) {
      return this.configCache.get(cacheKey);
    }

    try {
      const { data, error } = await supabase
        .from('system_config')
        .select('config_value')
        .eq('config_key', 'ai_notification_config')
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching AI notification config:', error);
      }

      const config: AINotificationConfig = data?.config_value || {
        enabled: true,
        smsEnabled: true,
        emailEnabled: true,
        reminderDays: [7, 3, 1, 0],
        escalationDays: 3,
        personalizedMessages: true,
        autoEscalation: true
      };

      this.configCache.set(cacheKey, config);
      return config;
    } catch (error) {
      console.error('Error fetching AI notification config:', error);
      return {
        enabled: true,
        smsEnabled: true,
        emailEnabled: true,
        reminderDays: [7, 3, 1, 0],
        escalationDays: 3,
        personalizedMessages: true,
        autoEscalation: true
      };
    }
  }

  // Save AI notification configuration
  async saveAINotificationConfig(config: AINotificationConfig): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('system_config')
        .upsert({
          config_key: 'ai_notification_config',
          config_value: config,
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error saving AI notification config:', error);
        return false;
      }

      this.configCache.set('ai_notification_config', config);
      return true;
    } catch (error) {
      console.error('Error saving AI notification config:', error);
      return false;
    }
  }

  // Get scheduler configuration
  async getSchedulerConfig(): Promise<SchedulerConfig> {
    const cacheKey = 'scheduler_config';
    
    if (this.configCache.has(cacheKey)) {
      return this.configCache.get(cacheKey);
    }

    try {
      const { data, error } = await supabase
        .from('system_config')
        .select('config_value')
        .eq('config_key', 'scheduler_config')
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching scheduler config:', error);
      }

      const config: SchedulerConfig = data?.config_value || {
        enabled: true,
        reminderCheckInterval: 60,
        escalationCheckInterval: 120,
        maxRetries: 3,
        retryDelay: 30
      };

      this.configCache.set(cacheKey, config);
      return config;
    } catch (error) {
      console.error('Error fetching scheduler config:', error);
      return {
        enabled: true,
        reminderCheckInterval: 60,
        escalationCheckInterval: 120,
        maxRetries: 3,
        retryDelay: 30
      };
    }
  }

  // Save scheduler configuration
  async saveSchedulerConfig(config: SchedulerConfig): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('system_config')
        .upsert({
          config_key: 'scheduler_config',
          config_value: config,
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error saving scheduler config:', error);
        return false;
      }

      this.configCache.set('scheduler_config', config);
      return true;
    } catch (error) {
      console.error('Error saving scheduler config:', error);
      return false;
    }
  }

  // Clear cache
  clearCache() {
    this.configCache.clear();
  }

  // Clear specific cache entry
  clearCacheEntry(key: string) {
    this.configCache.delete(key);
  }
}

export const configService = ConfigService.getInstance();























