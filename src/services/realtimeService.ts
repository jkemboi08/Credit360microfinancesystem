import { supabase } from '../lib/supabaseClient';
import { RealtimeChannel } from '@supabase/supabase-js';

// Check if Supabase is properly configured
const isSupabaseConfigured = () => {
  return supabase.supabaseUrl !== 'https://placeholder.supabase.co';
};

export interface RealtimeUpdate {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  record: any;
  old_record?: any;
}

class RealtimeService {
  private channels: Map<string, RealtimeChannel> = new Map();

  // Subscribe to loan applications updates
  subscribeToLoanApplications(
    onUpdate: (update: RealtimeUpdate) => void,
    filters?: {
      status?: string;
      assigned_to?: string;
    }
  ) {
    const channelName = 'loan-applications-updates';
    
    // Return mock channel if Supabase is not configured
    if (!isSupabaseConfigured()) {
      console.log('Using mock realtime service - Supabase not configured');
      return {
        unsubscribe: () => {},
        on: () => this,
        subscribe: () => this
      } as any;
    }
    
    // Unsubscribe from existing channel if it exists
    if (this.channels.has(channelName)) {
      this.unsubscribe(channelName);
    }

    let query = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'loan_applications',
          filter: filters?.status ? `status=eq.${filters.status}` : undefined
        },
        (payload) => {
          onUpdate({
            type: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
            table: 'loan_applications',
            record: payload.new,
            old_record: payload.old
          });
        }
      );

    if (filters?.assigned_to) {
      query = query.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'loan_applications',
          filter: `assigned_to=eq.${filters.assigned_to}`
        },
        (payload) => {
          onUpdate({
            type: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
            table: 'loan_applications',
            record: payload.new,
            old_record: payload.old
          });
        }
      );
    }

    const channel = query.subscribe();
    this.channels.set(channelName, channel);

    return channel;
  }

  // Subscribe to processing audit log updates
  subscribeToAuditLog(
    applicationId: string,
    onUpdate: (update: RealtimeUpdate) => void
  ) {
    const channelName = `audit-log-${applicationId}`;
    
    // Unsubscribe from existing channel if it exists
    if (this.channels.has(channelName)) {
      this.unsubscribe(channelName);
    }

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'processing_audit_log',
          filter: `application_id=eq.${applicationId}`
        },
        (payload) => {
          onUpdate({
            type: 'INSERT',
            table: 'processing_audit_log',
            record: payload.new
          });
        }
      )
      .subscribe();

    this.channels.set(channelName, channel);
    return channel;
  }

  // Subscribe to processing metrics updates
  subscribeToMetrics(onUpdate: (metrics: any) => void) {
    const channelName = 'processing-metrics';
    
    // Unsubscribe from existing channel if it exists
    if (this.channels.has(channelName)) {
      this.unsubscribe(channelName);
    }

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'loan_applications'
        },
        async () => {
          // Fetch updated metrics when applications change
          try {
            const { loanProcessingService } = await import('./loanProcessingService');
            const metrics = await loanProcessingService.getProcessingMetrics();
            onUpdate(metrics);
          } catch (error) {
            console.error('Error fetching updated metrics:', error);
          }
        }
      )
      .subscribe();

    this.channels.set(channelName, channel);
    return channel;
  }

  // Subscribe to specific application updates
  subscribeToApplication(
    applicationId: string,
    onUpdate: (update: RealtimeUpdate) => void
  ) {
    const channelName = `application-${applicationId}`;
    
    // Unsubscribe from existing channel if it exists
    if (this.channels.has(channelName)) {
      this.unsubscribe(channelName);
    }

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'loan_applications',
          filter: `id=eq.${applicationId}`
        },
        (payload) => {
          onUpdate({
            type: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
            table: 'loan_applications',
            record: payload.new,
            old_record: payload.old
          });
        }
      )
      .subscribe();

    this.channels.set(channelName, channel);
    return channel;
  }

  // Unsubscribe from a specific channel
  unsubscribe(channelName: string) {
    const channel = this.channels.get(channelName);
    if (channel) {
      supabase.removeChannel(channel);
      this.channels.delete(channelName);
    }
  }

  // Unsubscribe from all channels
  unsubscribeAll() {
    this.channels.forEach((channel, channelName) => {
      supabase.removeChannel(channel);
    });
    this.channels.clear();
  }

  // Get active channels
  getActiveChannels() {
    return Array.from(this.channels.keys());
  }
}

export const realtimeService = new RealtimeService();
