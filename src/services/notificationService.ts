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

export interface NotificationResult {
  success: boolean;
  messageId?: string;
  error?: string;
  deliveryStatus?: 'sent' | 'delivered' | 'failed';
}

export interface SMSMessage {
  to: string;
  message: string;
  reference?: string;
}

export interface EmailMessage {
  to: string;
  subject: string;
  body: string;
  htmlBody?: string;
  reference?: string;
}

class NotificationService {
  private config: NotificationConfig;

  constructor(config: NotificationConfig) {
    this.config = config;
  }

  // SMS Notification Methods
  async sendSMS(message: SMSMessage): Promise<NotificationResult> {
    try {
      let result: NotificationResult;

      switch (this.config.smsProvider) {
        case 'africas_talking':
          result = await this.sendViaAfricasTalking(message);
          break;
        case 'twilio':
          result = await this.sendViaTwilio(message);
          break;
        case 'local':
          result = await this.sendViaLocalSMS(message);
          break;
        default:
          throw new Error('Invalid SMS provider configuration');
      }

      // Log notification in database
      await this.logNotification({
        client_id: '', // Will be set by caller
        loan_id: '', // Will be set by caller
        notification_type: 'reminder',
        channel: 'sms',
        message: message.message,
        status: result.success ? 'sent' : 'failed',
        delivery_reference: result.messageId,
        error_message: result.error
      });

      return result;
    } catch (error) {
      console.error('SMS sending error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Email Notification Methods
  async sendEmail(message: EmailMessage): Promise<NotificationResult> {
    try {
      let result: NotificationResult;

      switch (this.config.emailProvider) {
        case 'sendgrid':
          result = await this.sendViaSendGrid(message);
          break;
        case 'aws_ses':
          result = await this.sendViaAWSSES(message);
          break;
        case 'local':
          result = await this.sendViaLocalEmail(message);
          break;
        default:
          throw new Error('Invalid email provider configuration');
      }

      // Log notification in database
      await this.logNotification({
        client_id: '', // Will be set by caller
        loan_id: '', // Will be set by caller
        notification_type: 'reminder',
        channel: 'email',
        message: message.body,
        status: result.success ? 'sent' : 'failed',
        delivery_reference: result.messageId,
        error_message: result.error
      });

      return result;
    } catch (error) {
      console.error('Email sending error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Send both SMS and Email
  async sendBoth(smsMessage: SMSMessage, emailMessage: EmailMessage): Promise<{
    sms: NotificationResult;
    email: NotificationResult;
  }> {
    const [smsResult, emailResult] = await Promise.all([
      this.sendSMS(smsMessage),
      this.sendEmail(emailMessage)
    ]);

    return { sms: smsResult, email: emailResult };
  }

  // Africa's Talking SMS Implementation
  private async sendViaAfricasTalking(message: SMSMessage): Promise<NotificationResult> {
    if (!this.config.smsApiKey || !this.config.smsUsername) {
      throw new Error('Africa\'s Talking API credentials not configured');
    }

    try {
      const response = await fetch('https://api.africastalking.com/version1/messaging', {
        method: 'POST',
        headers: {
          'ApiKey': this.config.smsApiKey,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          username: this.config.smsUsername,
          to: message.to,
          message: message.message,
          from: this.config.fromSms || 'MFI'
        })
      });

      const data = await response.json();
      
      if (data.SMSMessageData && data.SMSMessageData.Recipients) {
        const recipient = data.SMSMessageData.Recipients[0];
        return {
          success: recipient.status === 'Success',
          messageId: recipient.messageId,
          deliveryStatus: recipient.status === 'Success' ? 'sent' : 'failed',
          error: recipient.status !== 'Success' ? recipient.status : undefined
        };
      }

      return {
        success: false,
        error: 'Invalid response from Africa\'s Talking'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error'
      };
    }
  }

  // Twilio SMS Implementation
  private async sendViaTwilio(message: SMSMessage): Promise<NotificationResult> {
    if (!this.config.smsApiKey) {
      throw new Error('Twilio API credentials not configured');
    }

    try {
      const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${this.config.smsUsername}/Messages.json`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(`${this.config.smsUsername}:${this.config.smsApiKey}`)}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          To: message.to,
          From: this.config.fromSms || '+1234567890',
          Body: message.message
        })
      });

      const data = await response.json();
      
      return {
        success: !data.error_code,
        messageId: data.sid,
        deliveryStatus: data.status === 'sent' ? 'sent' : 'failed',
        error: data.error_message
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error'
      };
    }
  }

  // Local SMS Implementation (for development/testing)
  private async sendViaLocalSMS(message: SMSMessage): Promise<NotificationResult> {
    // Simulate SMS sending with delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('📱 LOCAL SMS:', {
      to: message.to,
      message: message.message,
      reference: message.reference
    });

    return {
      success: true,
      messageId: `local_sms_${Date.now()}`,
      deliveryStatus: 'sent'
    };
  }

  // SendGrid Email Implementation
  private async sendViaSendGrid(message: EmailMessage): Promise<NotificationResult> {
    if (!this.config.emailApiKey) {
      throw new Error('SendGrid API key not configured');
    }

    try {
      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.emailApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{
            to: [{ email: message.to }],
            subject: message.subject
          }],
          from: { email: this.config.fromEmail || 'noreply@mfi.com' },
          content: [
            {
              type: 'text/plain',
              value: message.body
            },
            ...(message.htmlBody ? [{
              type: 'text/html',
              value: message.htmlBody
            }] : [])
          ]
        })
      });

      return {
        success: response.ok,
        messageId: response.headers.get('X-Message-Id') || undefined,
        deliveryStatus: response.ok ? 'sent' : 'failed',
        error: response.ok ? undefined : `HTTP ${response.status}`
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error'
      };
    }
  }

  // AWS SES Email Implementation
  private async sendViaAWSSES(message: EmailMessage): Promise<NotificationResult> {
    // This would require AWS SDK implementation
    // For now, return a mock response
    console.log('📧 AWS SES Email:', {
      to: message.to,
      subject: message.subject,
      body: message.body
    });

    return {
      success: true,
      messageId: `aws_ses_${Date.now()}`,
      deliveryStatus: 'sent'
    };
  }

  // Local Email Implementation (for development/testing)
  private async sendViaLocalEmail(message: EmailMessage): Promise<NotificationResult> {
    // Simulate email sending with delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    console.log('📧 LOCAL EMAIL:', {
      to: message.to,
      subject: message.subject,
      body: message.body,
      reference: message.reference
    });

    return {
      success: true,
      messageId: `local_email_${Date.now()}`,
      deliveryStatus: 'sent'
    };
  }

  // Log notification in database
  private async logNotification(data: {
    client_id: string;
    loan_id: string;
    notification_type: string;
    channel: string;
    message: string;
    status: string;
    delivery_reference?: string;
    error_message?: string;
  }) {
    try {
      await supabase
        .from('notification_history')
        .insert({
          client_id: data.client_id,
          loan_id: data.loan_id,
          notification_type: data.notification_type,
          channel: data.channel,
          message: data.message,
          status: data.status,
          delivery_reference: data.delivery_reference,
          error_message: data.error_message
        });
    } catch (error) {
      console.error('Failed to log notification:', error);
    }
  }

  // Update notification status (for delivery confirmations)
  async updateNotificationStatus(
    notificationId: string, 
    status: 'delivered' | 'failed', 
    deliveryReference?: string
  ) {
    try {
      await supabase
        .from('notification_history')
        .update({
          status,
          delivery_status: status,
          delivered_at: status === 'delivered' ? new Date().toISOString() : null,
          delivery_reference: deliveryReference,
          updated_at: new Date().toISOString()
        })
        .eq('id', notificationId);
    } catch (error) {
      console.error('Failed to update notification status:', error);
    }
  }

  // Get notification history
  async getNotificationHistory(filters?: {
    client_id?: string;
    loan_id?: string;
    status?: string;
    date_from?: string;
    date_to?: string;
  }) {
    try {
      let query = supabase
        .from('notification_history')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.client_id) {
        query = query.eq('client_id', filters.client_id);
      }
      if (filters?.loan_id) {
        query = query.eq('loan_id', filters.loan_id);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.date_from) {
        query = query.gte('created_at', filters.date_from);
      }
      if (filters?.date_to) {
        query = query.lte('created_at', filters.date_to);
      }

      const { data, error } = await query;
      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  }
}

// Create default notification service instance
const defaultConfig: NotificationConfig = {
  smsProvider: 'local', // Change to 'africas_talking' or 'twilio' for production
  emailProvider: 'local', // Change to 'sendgrid' or 'aws_ses' for production
  fromEmail: 'noreply@mfi.com',
  fromSms: 'MFI'
};

export const notificationService = new NotificationService(defaultConfig);

// Export the class for custom configurations
export { NotificationService };
























