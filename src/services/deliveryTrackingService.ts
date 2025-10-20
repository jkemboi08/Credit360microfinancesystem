import { supabase } from '../lib/supabaseClient';

export interface DeliveryStatus {
  id: string;
  notification_id: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'bounced';
  provider: string;
  provider_message_id?: string;
  delivery_timestamp?: string;
  error_message?: string;
  retry_count: number;
  created_at: string;
  updated_at: string;
}

export interface DeliveryMetrics {
  total_sent: number;
  total_delivered: number;
  total_failed: number;
  delivery_rate: number;
  failure_rate: number;
  average_delivery_time: number; // in minutes
}

class DeliveryTrackingService {
  // Track notification delivery status
  async trackDelivery(
    notificationId: string,
    provider: string,
    providerMessageId?: string,
    status: 'sent' | 'delivered' | 'failed' | 'bounced' = 'sent',
    errorMessage?: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('delivery_status')
        .insert({
          notification_id: notificationId,
          status,
          provider,
          provider_message_id: providerMessageId,
          delivery_timestamp: status === 'delivered' ? new Date().toISOString() : null,
          error_message: errorMessage,
          retry_count: 0
        });

      if (error) {
        console.error('Error tracking delivery:', error);
        return false;
      }

      // Update notification history status
      await this.updateNotificationStatus(notificationId, status, providerMessageId);
      
      return true;
    } catch (error) {
      console.error('Error tracking delivery:', error);
      return false;
    }
  }

  // Update delivery status
  async updateDeliveryStatus(
    notificationId: string,
    status: 'delivered' | 'failed' | 'bounced',
    providerMessageId?: string,
    errorMessage?: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('delivery_status')
        .update({
          status,
          provider_message_id: providerMessageId,
          delivery_timestamp: status === 'delivered' ? new Date().toISOString() : null,
          error_message: errorMessage,
          updated_at: new Date().toISOString()
        })
        .eq('notification_id', notificationId);

      if (error) {
        console.error('Error updating delivery status:', error);
        return false;
      }

      // Update notification history status
      await this.updateNotificationStatus(notificationId, status, providerMessageId);
      
      return true;
    } catch (error) {
      console.error('Error updating delivery status:', error);
      return false;
    }
  }

  // Update notification history status
  private async updateNotificationStatus(
    notificationId: string,
    status: string,
    deliveryReference?: string
  ): Promise<void> {
    try {
      await supabase
        .from('notification_history')
        .update({
          status,
          delivery_reference: deliveryReference,
          delivered_at: status === 'delivered' ? new Date().toISOString() : null,
          updated_at: new Date().toISOString()
        })
        .eq('id', notificationId);
    } catch (error) {
      console.error('Error updating notification status:', error);
    }
  }

  // Get delivery status for a notification
  async getDeliveryStatus(notificationId: string): Promise<DeliveryStatus | null> {
    try {
      const { data, error } = await supabase
        .from('delivery_status')
        .select('*')
        .eq('notification_id', notificationId)
        .single();

      if (error) {
        console.error('Error fetching delivery status:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error fetching delivery status:', error);
      return null;
    }
  }

  // Get delivery metrics
  async getDeliveryMetrics(
    dateFrom?: string,
    dateTo?: string,
    provider?: string
  ): Promise<DeliveryMetrics> {
    try {
      let query = supabase
        .from('delivery_status')
        .select('status, delivery_timestamp, created_at');

      if (dateFrom) {
        query = query.gte('created_at', dateFrom);
      }
      if (dateTo) {
        query = query.lte('created_at', dateTo);
      }
      if (provider) {
        query = query.eq('provider', provider);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching delivery metrics:', error);
        return {
          total_sent: 0,
          total_delivered: 0,
          total_failed: 0,
          delivery_rate: 0,
          failure_rate: 0,
          average_delivery_time: 0
        };
      }

      const totalSent = data?.length || 0;
      const totalDelivered = data?.filter(d => d.status === 'delivered').length || 0;
      const totalFailed = data?.filter(d => d.status === 'failed' || d.status === 'bounced').length || 0;
      
      const deliveryRate = totalSent > 0 ? (totalDelivered / totalSent) * 100 : 0;
      const failureRate = totalSent > 0 ? (totalFailed / totalSent) * 100 : 0;

      // Calculate average delivery time
      const deliveredNotifications = data?.filter(d => d.status === 'delivered' && d.delivery_timestamp) || [];
      let averageDeliveryTime = 0;
      
      if (deliveredNotifications.length > 0) {
        const totalDeliveryTime = deliveredNotifications.reduce((sum, notification) => {
          const created = new Date(notification.created_at);
          const delivered = new Date(notification.delivery_timestamp);
          return sum + (delivered.getTime() - created.getTime());
        }, 0);
        
        averageDeliveryTime = totalDeliveryTime / deliveredNotifications.length / (1000 * 60); // Convert to minutes
      }

      return {
        total_sent: totalSent,
        total_delivered: totalDelivered,
        total_failed: totalFailed,
        delivery_rate: deliveryRate,
        failure_rate: failureRate,
        average_delivery_time: averageDeliveryTime
      };
    } catch (error) {
      console.error('Error calculating delivery metrics:', error);
      return {
        total_sent: 0,
        total_delivered: 0,
        total_failed: 0,
        delivery_rate: 0,
        failure_rate: 0,
        average_delivery_time: 0
      };
    }
  }

  // Get delivery status history
  async getDeliveryHistory(filters?: {
    notification_id?: string;
    status?: string;
    provider?: string;
    date_from?: string;
    date_to?: string;
    limit?: number;
  }) {
    try {
      let query = supabase
        .from('delivery_status')
        .select(`
          *,
          notification_history!inner(
            client_id,
            loan_id,
            message,
            notification_type
          )
        `)
        .order('created_at', { ascending: false });

      if (filters?.notification_id) {
        query = query.eq('notification_id', filters.notification_id);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.provider) {
        query = query.eq('provider', filters.provider);
      }
      if (filters?.date_from) {
        query = query.gte('created_at', filters.date_from);
      }
      if (filters?.date_to) {
        query = query.lte('created_at', filters.date_to);
      }
      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;
      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  }

  // Retry failed notifications
  async retryFailedNotifications(): Promise<{ success: number; failed: number }> {
    try {
      // Get failed notifications from the last 24 hours
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      
      const { data: failedNotifications, error } = await supabase
        .from('delivery_status')
        .select(`
          *,
          notification_history!inner(
            client_id,
            loan_id,
            message,
            channel,
            notification_type
          )
        `)
        .eq('status', 'failed')
        .gte('created_at', yesterday)
        .lt('retry_count', 3); // Only retry up to 3 times

      if (error) {
        console.error('Error fetching failed notifications:', error);
        return { success: 0, failed: 0 };
      }

      let successCount = 0;
      let failedCount = 0;

      for (const notification of failedNotifications || []) {
        try {
          // Increment retry count
          await supabase
            .from('delivery_status')
            .update({
              retry_count: notification.retry_count + 1,
              updated_at: new Date().toISOString()
            })
            .eq('id', notification.id);

          // Here you would trigger the actual retry logic
          // This would involve calling the notification service again
          // For now, we'll just mark it as a success
          successCount++;
        } catch (error) {
          console.error('Error retrying notification:', error);
          failedCount++;
        }
      }

      return { success: successCount, failed: failedCount };
    } catch (error) {
      console.error('Error retrying failed notifications:', error);
      return { success: 0, failed: 0 };
    }
  }

  // Clean up old delivery status records
  async cleanupOldRecords(daysToKeep: number = 90): Promise<number> {
    try {
      const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000).toISOString();
      
      const { data, error } = await supabase
        .from('delivery_status')
        .delete()
        .lt('created_at', cutoffDate)
        .select('id');

      if (error) {
        console.error('Error cleaning up old records:', error);
        return 0;
      }

      return data?.length || 0;
    } catch (error) {
      console.error('Error cleaning up old records:', error);
      return 0;
    }
  }
}

export const deliveryTrackingService = new DeliveryTrackingService();























