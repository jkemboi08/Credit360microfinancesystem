// Production configuration template for AI Notification System
// Copy this file and update with your actual production values

export const productionConfig = {
  // Supabase Configuration
  supabase: {
    url: process.env.REACT_APP_SUPABASE_URL || 'YOUR_SUPABASE_URL',
    anonKey: process.env.REACT_APP_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY'
  },

  // Notification Providers
  notifications: {
    // SMS Configuration
    sms: {
      provider: 'africas_talking', // 'africas_talking' | 'twilio' | 'local'
      africasTalking: {
        apiKey: process.env.REACT_APP_AFRICA_TALKING_API_KEY || 'YOUR_API_KEY',
        username: process.env.REACT_APP_AFRICA_TALKING_USERNAME || 'YOUR_USERNAME',
        from: process.env.REACT_APP_SMS_FROM || 'YOURMFI'
      },
      twilio: {
        accountSid: process.env.REACT_APP_TWILIO_ACCOUNT_SID || 'YOUR_ACCOUNT_SID',
        authToken: process.env.REACT_APP_TWILIO_AUTH_TOKEN || 'YOUR_AUTH_TOKEN',
        from: process.env.REACT_APP_TWILIO_FROM || '+1234567890'
      }
    },

    // Email Configuration
    email: {
      provider: 'sendgrid', // 'sendgrid' | 'aws_ses' | 'local'
      sendgrid: {
        apiKey: process.env.REACT_APP_SENDGRID_API_KEY || 'YOUR_SENDGRID_API_KEY',
        from: process.env.REACT_APP_EMAIL_FROM || 'noreply@yourmfi.com'
      },
      awsSes: {
        region: process.env.REACT_APP_AWS_REGION || 'us-east-1',
        accessKeyId: process.env.REACT_APP_AWS_ACCESS_KEY_ID || 'YOUR_ACCESS_KEY',
        secretAccessKey: process.env.REACT_APP_AWS_SECRET_ACCESS_KEY || 'YOUR_SECRET_KEY',
        from: process.env.REACT_APP_EMAIL_FROM || 'noreply@yourmfi.com'
      }
    }
  },

  // AI Notification Settings
  aiNotifications: {
    enabled: true,
    smsEnabled: true,
    emailEnabled: true,
    reminderDays: [7, 3, 1, 0], // Days before due date
    escalationDays: 3, // Days after due date before escalation
    personalizedMessages: true,
    autoEscalation: true,
    maxRetries: 3,
    retryDelay: 30 // minutes
  },

  // Scheduler Configuration
  scheduler: {
    enabled: true,
    reminderCheckInterval: 60, // minutes
    escalationCheckInterval: 120, // minutes
    maxRetries: 3,
    retryDelay: 30 // minutes
  },

  // Delivery Tracking
  deliveryTracking: {
    enabled: true,
    cleanupDays: 90, // Keep delivery records for 90 days
    retryFailedAfter: 24 // hours
  },

  // Rate Limiting
  rateLimiting: {
    enabled: true,
    maxNotificationsPerHour: 1000,
    maxNotificationsPerDay: 10000
  },

  // Monitoring & Alerts
  monitoring: {
    enabled: true,
    alertOnFailureRate: 10, // Alert if failure rate > 10%
    alertOnHighVolume: 1000, // Alert if > 1000 notifications in an hour
    webhookUrl: process.env.REACT_APP_MONITORING_WEBHOOK_URL || ''
  }
};

// Environment-specific configurations
export const getConfig = () => {
  const env = process.env.NODE_ENV || 'development';
  
  switch (env) {
    case 'production':
      return productionConfig;
    case 'staging':
      return {
        ...productionConfig,
        aiNotifications: {
          ...productionConfig.aiNotifications,
          reminderDays: [3, 1, 0], // Fewer reminders in staging
          escalationDays: 1
        }
      };
    case 'development':
    default:
      return {
        ...productionConfig,
        notifications: {
          sms: { provider: 'local' },
          email: { provider: 'local' }
        },
        aiNotifications: {
          ...productionConfig.aiNotifications,
          enabled: true // Keep enabled for testing
        }
      };
  }
};

export default getConfig();























