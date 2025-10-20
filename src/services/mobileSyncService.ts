// Mobile App Data Synchronization Service
// Ensures mobile app stays in sync with web application data

import { supabase } from '../lib/supabaseClient';
import RepaymentRestructuringService from './repaymentRestructuringService';

// =============================================
// INTERFACES
// =============================================

export interface MobileSyncData {
  repayments: any[];
  restructuringRequests: any[];
  loans: any[];
  clients: any[];
  lastSyncTime: string;
  syncId: string;
}

export interface SyncStatus {
  isOnline: boolean;
  lastSyncTime: string | null;
  pendingChanges: number;
  syncInProgress: boolean;
  error: string | null;
}

// =============================================
// MOBILE SYNC SERVICE
// =============================================

export class MobileSyncService {
  private static instance: MobileSyncService;
  private syncStatus: SyncStatus = {
    isOnline: false,
    lastSyncTime: null,
    pendingChanges: 0,
    syncInProgress: false,
    error: null
  };
  private listeners: ((status: SyncStatus) => void)[] = [];

  // Singleton pattern
  static getInstance(): MobileSyncService {
    if (!MobileSyncService.instance) {
      MobileSyncService.instance = new MobileSyncService();
    }
    return MobileSyncService.instance;
  }

  // =============================================
  // SYNC STATUS MANAGEMENT
  // =============================================

  // Get current sync status
  getSyncStatus(): SyncStatus {
    return { ...this.syncStatus };
  }

  // Subscribe to sync status changes
  subscribeToSyncStatus(callback: (status: SyncStatus) => void): () => void {
    this.listeners.push(callback);
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  // Update sync status and notify listeners
  private updateSyncStatus(updates: Partial<SyncStatus>) {
    this.syncStatus = { ...this.syncStatus, ...updates };
    this.listeners.forEach(listener => listener(this.syncStatus));
  }

  // =============================================
  // DATA SYNCHRONIZATION
  // =============================================

  // Full data synchronization
  async syncAllData(userId: string): Promise<{ success: boolean; data?: MobileSyncData; error?: string }> {
    try {
      this.updateSyncStatus({ syncInProgress: true, error: null });

      // Check online status
      const isOnline = await this.checkOnlineStatus();
      if (!isOnline) {
        this.updateSyncStatus({ 
          isOnline: false, 
          syncInProgress: false, 
          error: 'No internet connection' 
        });
        return { success: false, error: 'No internet connection' };
      }

      this.updateSyncStatus({ isOnline: true });

      // Sync all data in parallel
      const [repaymentsResult, restructuringResult, loansResult, clientsResult] = await Promise.all([
        this.syncRepayments(userId),
        this.syncRestructuringRequests(userId),
        this.syncLoans(userId),
        this.syncClients(userId)
      ]);

      // Check for errors
      const errors = [
        repaymentsResult.error,
        restructuringResult.error,
        loansResult.error,
        clientsResult.error
      ].filter(Boolean);

      if (errors.length > 0) {
        this.updateSyncStatus({ 
          syncInProgress: false, 
          error: errors.join('; ') 
        });
        return { success: false, error: errors.join('; ') };
      }

      // Create sync data package
      const syncData: MobileSyncData = {
        repayments: repaymentsResult.data || [],
        restructuringRequests: restructuringResult.data || [],
        loans: loansResult.data || [],
        clients: clientsResult.data || [],
        lastSyncTime: new Date().toISOString(),
        syncId: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };

      // Store sync data locally (for offline access)
      await this.storeLocalSyncData(syncData);

      this.updateSyncStatus({ 
        syncInProgress: false, 
        lastSyncTime: syncData.lastSyncTime,
        pendingChanges: 0,
        error: null
      });

      return { success: true, data: syncData };

    } catch (error) {
      console.error('Error during full sync:', error);
      this.updateSyncStatus({ 
        syncInProgress: false, 
        error: error.message 
      });
      return { success: false, error: error.message };
    }
  }

  // Sync repayments data
  private async syncRepayments(userId: string): Promise<{ data?: any[]; error?: string }> {
    try {
      const { data, error } = await RepaymentRestructuringService.getUserRepayments(parseInt(userId));
      if (error) throw new Error(error);
      return { data };
    } catch (error) {
      console.error('Error syncing repayments:', error);
      return { error: error.message };
    }
  }

  // Sync restructuring requests
  private async syncRestructuringRequests(userId: string): Promise<{ data?: any[]; error?: string }> {
    try {
      const { data, error } = await RepaymentRestructuringService.getRestructuringRequests({
        client_id: parseInt(userId)
      });
      if (error) throw new Error(error);
      return { data };
    } catch (error) {
      console.error('Error syncing restructuring requests:', error);
      return { error: error.message };
    }
  }

  // Sync loans data
  private async syncLoans(userId: string): Promise<{ data?: any[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('loans')
        .select(`
          id,
          principal_amount,
          interest_amount,
          total_amount,
          status,
          disbursement_date,
          first_repayment_date,
          last_repayment_date,
          next_repayment_date,
          clients!inner(
            id,
            full_name,
            phone_number,
            email_address
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw new Error(error.message);
      return { data: data || [] };
    } catch (error) {
      console.error('Error syncing loans:', error);
      return { error: error.message };
    }
  }

  // Sync clients data
  private async syncClients(userId: string): Promise<{ data?: any[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw new Error(error.message);
      return { data: data || [] };
    } catch (error) {
      console.error('Error syncing clients:', error);
      return { error: error.message };
    }
  }

  // =============================================
  // OFFLINE SUPPORT
  // =============================================

  // Store sync data locally for offline access
  private async storeLocalSyncData(syncData: MobileSyncData): Promise<void> {
    try {
      if (typeof window !== 'undefined' && 'localStorage' in window) {
        localStorage.setItem('mobile_sync_data', JSON.stringify(syncData));
        localStorage.setItem('mobile_sync_timestamp', syncData.lastSyncTime);
      }
    } catch (error) {
      console.error('Error storing local sync data:', error);
    }
  }

  // Get locally stored sync data
  async getLocalSyncData(): Promise<MobileSyncData | null> {
    try {
      if (typeof window !== 'undefined' && 'localStorage' in window) {
        const stored = localStorage.getItem('mobile_sync_data');
        if (stored) {
          return JSON.parse(stored);
        }
      }
      return null;
    } catch (error) {
      console.error('Error getting local sync data:', error);
      return null;
    }
  }

  // =============================================
  // CONNECTION MANAGEMENT
  // =============================================

  // Check online status
  private async checkOnlineStatus(): Promise<boolean> {
    try {
      // Simple ping to Supabase
      const { error } = await supabase
        .from('clients')
        .select('id')
        .limit(1);

      return !error;
    } catch (error) {
      return false;
    }
  }

  // =============================================
  // REAL-TIME UPDATES
  // =============================================

  // Set up real-time subscriptions for mobile sync
  setupRealtimeSync(userId: string): () => void {
    const channels = [
      // Repayments channel
      supabase
        .channel('mobile_repayments_sync')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'loan_repayments', filter: `user_id=eq.${userId}` },
          (payload) => {
            console.log('Mobile sync - Repayment update:', payload);
            this.handleRealtimeUpdate('repayment', payload);
          }
        )
        .subscribe(),

      // Restructuring channel
      supabase
        .channel('mobile_restructuring_sync')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'loan_restructuring' },
          (payload) => {
            console.log('Mobile sync - Restructuring update:', payload);
            this.handleRealtimeUpdate('restructuring', payload);
          }
        )
        .subscribe(),

      // Loans channel
      supabase
        .channel('mobile_loans_sync')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'loans', filter: `user_id=eq.${userId}` },
          (payload) => {
            console.log('Mobile sync - Loan update:', payload);
            this.handleRealtimeUpdate('loan', payload);
          }
        )
        .subscribe()
    ];

    // Return cleanup function
    return () => {
      channels.forEach(channel => {
        supabase.removeChannel(channel);
      });
    };
  }

  // Handle real-time updates
  private handleRealtimeUpdate(type: string, payload: any) {
    // Increment pending changes
    this.updateSyncStatus({ 
      pendingChanges: this.syncStatus.pendingChanges + 1 
    });

    // Notify mobile app of pending changes
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('mobileSyncUpdate', {
        detail: { type, payload, timestamp: new Date().toISOString() }
      }));
    }
  }

  // =============================================
  // PUSH NOTIFICATIONS
  // =============================================

  // Send push notification for important updates
  async sendPushNotification(title: string, body: string, data?: any): Promise<{ success: boolean; error?: string }> {
    try {
      // This would integrate with a push notification service
      // For now, we'll use the browser's notification API
      if (typeof window !== 'undefined' && 'Notification' in window) {
        if (Notification.permission === 'granted') {
          new Notification(title, {
            body,
            data,
            icon: '/favicon.ico'
          });
        } else if (Notification.permission !== 'denied') {
          const permission = await Notification.requestPermission();
          if (permission === 'granted') {
            new Notification(title, {
              body,
              data,
              icon: '/favicon.ico'
            });
          }
        }
      }

      return { success: true };
    } catch (error) {
      console.error('Error sending push notification:', error);
      return { success: false, error: error.message };
    }
  }

  // =============================================
  // CONFLICT RESOLUTION
  // =============================================

  // Resolve conflicts between local and remote data
  async resolveConflicts(localData: any, remoteData: any, conflictType: string): Promise<any> {
    try {
      // Simple conflict resolution strategy: remote wins
      // In a production app, you'd implement more sophisticated conflict resolution
      console.log(`Resolving ${conflictType} conflicts: remote data takes precedence`);
      return remoteData;
    } catch (error) {
      console.error('Error resolving conflicts:', error);
      return localData; // Fallback to local data
    }
  }

  // =============================================
  // SYNC STATISTICS
  // =============================================

  // Get sync statistics
  async getSyncStatistics(): Promise<{
    totalSyncs: number;
    lastSyncDuration: number;
    averageSyncDuration: number;
    syncSuccessRate: number;
    dataSize: number;
  }> {
    try {
      // This would typically come from a statistics table
      // For now, return mock data
      return {
        totalSyncs: 0,
        lastSyncDuration: 0,
        averageSyncDuration: 0,
        syncSuccessRate: 100,
        dataSize: 0
      };
    } catch (error) {
      console.error('Error getting sync statistics:', error);
      return {
        totalSyncs: 0,
        lastSyncDuration: 0,
        averageSyncDuration: 0,
        syncSuccessRate: 0,
        dataSize: 0
      };
    }
  }
}

// Export singleton instance
export const mobileSyncService = MobileSyncService.getInstance();
export default mobileSyncService;


























