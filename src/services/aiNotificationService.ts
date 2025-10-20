import { supabase } from '../lib/supabaseClient';
import { notificationService } from './notificationService';

export interface RepaymentSchedule {
  id: string;
  loan_id: string;
  payment_number: number;
  due_date: string;
  total_payment: number;
  remaining_balance: number;
  is_paid: boolean;
  principal_portion: number;
  interest_portion: number;
}

export interface ClientInfo {
  id: string;
  full_name: string;
  phone_number: string;
  email_address?: string;
  payment_patterns?: {
    on_time_rate: number;
    preferred_contact_time: string;
    communication_style: string;
    risk_level: string;
  };
}

export interface LoanInfo {
  id: string;
  client_id: string;
  principal_amount: number;
  interest_rate: number;
  tenor_months: number;
  status: string;
}

export interface AINotificationSettings {
  enabled: boolean;
  smsEnabled: boolean;
  emailEnabled: boolean;
  reminderDays: number[];
  escalationDays: number;
  personalizedMessages: boolean;
  autoEscalation: boolean;
}

export interface NotificationResult {
  success: boolean;
  notificationsSent: number;
  errors: string[];
  escalated: number;
}

class AINotificationService {
  private settings: AINotificationSettings;

  constructor(settings: AINotificationSettings) {
    this.settings = settings;
  }

  // Main method to run AI notification system
  async runNotificationSystem(): Promise<NotificationResult> {
    if (!this.settings.enabled) {
      return { success: false, notificationsSent: 0, errors: ['AI notifications disabled'], escalated: 0 };
    }

    try {
      // Get all upcoming and overdue payments
      const upcomingPayments = await this.getUpcomingPayments();
      const overduePayments = await this.getOverduePayments();

      let notificationsSent = 0;
      let errors: string[] = [];
      let escalated = 0;

      // Process upcoming payments for reminders
      for (const payment of upcomingPayments) {
        try {
          const clientInfo = await this.getClientInfo(payment.loan_id);
          if (!clientInfo) continue;

          const daysUntilDue = this.calculateDaysUntilDue(payment.due_date);
          
          // Check if we should send a reminder for this payment
          if (this.settings.reminderDays.includes(daysUntilDue)) {
            const notification = await this.generatePersonalizedNotification(
              payment,
              clientInfo,
              daysUntilDue,
              'reminder'
            );

            if (notification) {
              await this.sendNotification(notification);
              notificationsSent++;
            }
          }
        } catch (error) {
          errors.push(`Error processing payment ${payment.id}: ${error}`);
        }
      }

      // Process overdue payments for escalation
      for (const payment of overduePayments) {
        try {
          const clientInfo = await this.getClientInfo(payment.loan_id);
          if (!clientInfo) continue;

          const daysOverdue = this.calculateDaysOverdue(payment.due_date);
          
          // Check if we should escalate this payment
          if (daysOverdue >= this.settings.escalationDays) {
            const notification = await this.generatePersonalizedNotification(
              payment,
              clientInfo,
              -daysOverdue,
              'escalation'
            );

            if (notification) {
              await this.sendNotification(notification);
              notificationsSent++;
              escalated++;
            }
          }
        } catch (error) {
          errors.push(`Error processing overdue payment ${payment.id}: ${error}`);
        }
      }

      return {
        success: true,
        notificationsSent,
        errors,
        escalated
      };
    } catch (error) {
      return {
        success: false,
        notificationsSent: 0,
        errors: [`System error: ${error}`],
        escalated: 0
      };
    }
  }

  // Get upcoming payments that need reminders
  private async getUpcomingPayments(): Promise<RepaymentSchedule[]> {
    const today = new Date();
    const maxDays = Math.max(...this.settings.reminderDays);
    const futureDate = new Date(today.getTime() + (maxDays + 1) * 24 * 60 * 60 * 1000);

    const { data, error } = await supabase
      .from('repayment_schedules')
      .select(`
        *,
        loans!inner(
          id,
          client_id,
          status
        )
      `)
      .eq('is_paid', false)
      .gte('due_date', today.toISOString().split('T')[0])
      .lte('due_date', futureDate.toISOString().split('T')[0])
      .eq('loans.status', 'active');

    if (error) {
      console.error('Error fetching upcoming payments:', error);
      return [];
    }

    return data || [];
  }

  // Get overdue payments that need escalation
  private async getOverduePayments(): Promise<RepaymentSchedule[]> {
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('repayment_schedules')
      .select(`
        *,
        loans!inner(
          id,
          client_id,
          status
        )
      `)
      .eq('is_paid', false)
      .lt('due_date', today)
      .eq('loans.status', 'active');

    if (error) {
      console.error('Error fetching overdue payments:', error);
      return [];
    }

    return data || [];
  }

  // Get client information including payment patterns
  private async getClientInfo(loanId: string): Promise<ClientInfo | null> {
    try {
      const { data, error } = await supabase
        .from('loans')
        .select(`
          id,
          client_id,
          clients!inner(
            id,
            full_name,
            phone_number,
            email_address
          )
        `)
        .eq('id', loanId)
        .single();

      if (error || !data) {
        console.error('Error fetching client info:', error);
        return null;
      }

      // Get payment patterns
      const { data: patterns } = await supabase
        .from('client_payment_patterns')
        .select('*')
        .eq('client_id', data.client_id)
        .eq('loan_id', loanId)
        .single();

      return {
        id: data.clients.id,
        full_name: data.clients.full_name,
        phone_number: data.clients.phone_number,
        email_address: data.clients.email_address,
        payment_patterns: patterns ? {
          on_time_rate: patterns.on_time_rate,
          preferred_contact_time: patterns.preferred_contact_time,
          communication_style: patterns.communication_style,
          risk_level: patterns.risk_level
        } : undefined
      };
    } catch (error) {
      console.error('Error fetching client info:', error);
      return null;
    }
  }

  // Calculate days until due date
  private calculateDaysUntilDue(dueDate: string): number {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  // Calculate days overdue
  private calculateDaysOverdue(dueDate: string): number {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = today.getTime() - due.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  // Generate personalized notification
  private async generatePersonalizedNotification(
    payment: RepaymentSchedule,
    clientInfo: ClientInfo,
    daysUntilDue: number,
    type: 'reminder' | 'escalation'
  ) {
    const patterns = clientInfo.payment_patterns;
    const clientName = clientInfo.full_name.split(' ')[0];
    const amount = this.formatCurrency(payment.total_payment);
    const dueDate = new Date(payment.due_date).toLocaleDateString();

    let message = '';
    let channel = 'sms';
    let riskLevel = 'low';

    if (patterns) {
      riskLevel = patterns.risk_level;
      channel = patterns.preferred_contact_time === 'morning' ? 'sms' : 'email';
    }

    if (type === 'reminder') {
      message = this.generateReminderMessage(
        clientName,
        amount,
        dueDate,
        daysUntilDue,
        patterns
      );
    } else {
      message = this.generateEscalationMessage(
        clientName,
        amount,
        dueDate,
        Math.abs(daysUntilDue),
        patterns
      );
    }

    return {
      client_id: clientInfo.id,
      loan_id: payment.loan_id,
      payment_schedule_id: payment.id,
      notification_type: type,
      channel: this.settings.smsEnabled && this.settings.emailEnabled ? 'both' : channel,
      message,
      risk_level: riskLevel,
      communication_style: patterns?.communication_style || 'formal',
      scheduled_for: new Date().toISOString()
    };
  }

  // Generate reminder message based on AI analysis
  private generateReminderMessage(
    clientName: string,
    amount: string,
    dueDate: string,
    daysUntilDue: number,
    patterns?: any
  ): string {
    let tone = 'friendly';
    let urgency = 'low';

    if (patterns) {
      if (patterns.on_time_rate >= 80) {
        tone = 'friendly';
      } else if (patterns.on_time_rate >= 50) {
        tone = 'encouraging';
      } else {
        tone = 'firm';
      }
    }

    if (daysUntilDue > 3) {
      urgency = 'low';
    } else if (daysUntilDue > 0) {
      urgency = 'medium';
    } else {
      urgency = 'high';
    }

    const messageTemplates = {
      friendly: {
        low: `Hi ${clientName}! Just a friendly reminder that your payment of ${amount} is due on ${dueDate}. Thank you for your consistent payments!`,
        medium: `Hello ${clientName}, your payment of ${amount} is due in ${daysUntilDue} days (${dueDate}). We appreciate your timely payments!`,
        high: `Hi ${clientName}, your payment of ${amount} is due tomorrow (${dueDate}). Please ensure payment to maintain your excellent record.`
      },
      encouraging: {
        low: `Hi ${clientName}! Your payment of ${amount} is due on ${dueDate}. We're here to help if you need any assistance.`,
        medium: `Hello ${clientName}, payment of ${amount} due in ${daysUntilDue} days (${dueDate}). Contact us if you need support.`,
        high: `Hi ${clientName}, payment of ${amount} due tomorrow (${dueDate}). Please reach out if you need help making this payment.`
      },
      firm: {
        low: `Hi ${clientName}, your payment of ${amount} is due on ${dueDate}. Please ensure timely payment to avoid any issues.`,
        medium: `Hello ${clientName}, payment of ${amount} due in ${daysUntilDue} days (${dueDate}). Please contact us immediately if you have concerns.`,
        high: `Hi ${clientName}, URGENT: Payment of ${amount} due tomorrow (${dueDate}). Please contact us now to discuss your payment.`
      }
    };

    return messageTemplates[tone]?.[urgency] || 
           `Hi ${clientName}, your payment of ${amount} is due on ${dueDate}.`;
  }

  // Generate escalation message
  private generateEscalationMessage(
    clientName: string,
    amount: string,
    dueDate: string,
    daysOverdue: number,
    patterns?: any
  ): string {
    return `URGENT: ${clientName}, your payment of ${amount} is ${daysOverdue} days overdue (was due ${dueDate}). Please contact us immediately to discuss your payment plan or this will be escalated to our collection team.`;
  }

  // Send notification via appropriate channels
  private async sendNotification(notification: any) {
    try {
      // Log notification in database
      const { data: notificationRecord, error: logError } = await supabase
        .from('notification_history')
        .insert({
          client_id: notification.client_id,
          loan_id: notification.loan_id,
          payment_schedule_id: notification.payment_schedule_id,
          notification_type: notification.notification_type,
          channel: notification.channel,
          message: notification.message,
          status: 'pending',
          scheduled_for: notification.scheduled_for,
          risk_level: notification.risk_level,
          communication_style: notification.communication_style
        })
        .select()
        .single();

      if (logError) {
        console.error('Error logging notification:', logError);
        return;
      }

      // Get client contact info
      const clientInfo = await this.getClientInfo(notification.loan_id);
      if (!clientInfo) return;

      // Send via appropriate channels
      if (notification.channel === 'sms' || notification.channel === 'both') {
        if (this.settings.smsEnabled && clientInfo.phone_number) {
          const smsResult = await notificationService.sendSMS({
            to: clientInfo.phone_number,
            message: notification.message,
            reference: notificationRecord.id
          });

          // Update notification status
          await supabase
            .from('notification_history')
            .update({
              status: smsResult.success ? 'sent' : 'failed',
              sent_at: smsResult.success ? new Date().toISOString() : null,
              delivery_reference: smsResult.messageId,
              error_message: smsResult.error
            })
            .eq('id', notificationRecord.id);
        }
      }

      if (notification.channel === 'email' || notification.channel === 'both') {
        if (this.settings.emailEnabled && clientInfo.email_address) {
          const emailResult = await notificationService.sendEmail({
            to: clientInfo.email_address,
            subject: `Payment ${notification.notification_type === 'escalation' ? 'Overdue' : 'Reminder'} - ${clientInfo.full_name}`,
            body: notification.message,
            reference: notificationRecord.id
          });

          // Update notification status if not already updated by SMS
          if (notification.channel === 'email') {
            await supabase
              .from('notification_history')
              .update({
                status: emailResult.success ? 'sent' : 'failed',
                sent_at: emailResult.success ? new Date().toISOString() : null,
                delivery_reference: emailResult.messageId,
                error_message: emailResult.error
              })
              .eq('id', notificationRecord.id);
          }
        }
      }
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }

  // Format currency
  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0
    }).format(amount);
  }

  // Update settings
  updateSettings(newSettings: Partial<AINotificationSettings>) {
    this.settings = { ...this.settings, ...newSettings };
  }

  // Get current settings
  getSettings(): AINotificationSettings {
    return { ...this.settings };
  }
}

// Export default instance
export const aiNotificationService = new AINotificationService({
  enabled: true,
  smsEnabled: true,
  emailEnabled: true,
  reminderDays: [7, 3, 1, 0],
  escalationDays: 3,
  personalizedMessages: true,
  autoEscalation: true
});

export { AINotificationService };























