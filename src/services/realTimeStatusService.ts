import { supabase } from '../lib/supabaseClient';
import { LoanStatusFlowService } from './loanStatusFlowService';

export interface StatusUpdateEvent {
  type: 'status_change' | 'new_loan' | 'loan_removed';
  loanId: string;
  oldStatus?: string;
  newStatus: string;
  timestamp: string;
  pageAffected: string[];
}

export interface StatusUpdateCallback {
  (event: StatusUpdateEvent): void;
}

export class RealTimeStatusService {
  private static instance: RealTimeStatusService;
  private callbacks: StatusUpdateCallback[] = [];
  private subscription: any = null;

  private constructor() {}

  static getInstance(): RealTimeStatusService {
    if (!RealTimeStatusService.instance) {
      RealTimeStatusService.instance = new RealTimeStatusService();
    }
    return RealTimeStatusService.instance;
  }

  /**
   * Subscribe to real-time status updates
   */
  subscribe(callback: StatusUpdateCallback): () => void {
    this.callbacks.push(callback);

    // Set up real-time subscription if not already active
    if (!this.subscription) {
      this.setupRealtimeSubscription();
    }

    // Return unsubscribe function
    return () => {
      this.callbacks = this.callbacks.filter(cb => cb !== callback);
      if (this.callbacks.length === 0) {
        this.cleanup();
      }
    };
  }

  /**
   * Set up real-time subscription to loan_applications table
   */
  private setupRealtimeSubscription() {
    this.subscription = supabase
      .channel('loan_status_updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'loan_applications'
        },
        async (payload) => {
          await this.handleStatusChange(payload);
        }
      )
      .subscribe();
  }

  /**
   * Handle status changes from real-time updates
   */
  private async handleStatusChange(payload: any) {
    try {
      const { eventType, new: newRecord, old: oldRecord } = payload;
      
      let event: StatusUpdateEvent;

      switch (eventType) {
        case 'INSERT':
          event = {
            type: 'new_loan',
            loanId: newRecord.id,
            newStatus: newRecord.status,
            timestamp: new Date().toISOString(),
            pageAffected: this.getAffectedPages(newRecord.status)
          };
          break;

        case 'UPDATE':
          event = {
            type: 'status_change',
            loanId: newRecord.id,
            oldStatus: oldRecord?.status,
            newStatus: newRecord.status,
            timestamp: new Date().toISOString(),
            pageAffected: this.getAffectedPages(newRecord.status, oldRecord?.status)
          };
          break;

        case 'DELETE':
          event = {
            type: 'loan_removed',
            loanId: oldRecord.id,
            newStatus: 'deleted',
            timestamp: new Date().toISOString(),
            pageAffected: this.getAllPages()
          };
          break;

        default:
          return;
      }

      // Notify all callbacks
      this.callbacks.forEach(callback => {
        try {
          callback(event);
        } catch (error) {
          console.error('Error in status update callback:', error);
        }
      });

    } catch (error) {
      console.error('Error handling status change:', error);
    }
  }

  /**
   * Determine which pages are affected by a status change
   */
  private getAffectedPages(newStatus: string, oldStatus?: string): string[] {
    const affectedPages: string[] = [];

    // Check each page mapping to see if the status affects it
    Object.entries(LoanStatusFlowService.PAGE_STATUS_MAPPING).forEach(([pageName, mapping]) => {
      const wasInPage = oldStatus && mapping.statuses.includes(oldStatus);
      const isInPage = mapping.statuses.includes(newStatus);

      if (wasInPage || isInPage) {
        affectedPages.push(pageName);
      }
    });

    return affectedPages;
  }

  /**
   * Get all pages (for delete events)
   */
  private getAllPages(): string[] {
    return Object.keys(LoanStatusFlowService.PAGE_STATUS_MAPPING);
  }

  /**
   * Clean up subscription
   */
  private cleanup() {
    if (this.subscription) {
      supabase.removeChannel(this.subscription);
      this.subscription = null;
    }
  }

  /**
   * Manually trigger a status update (for testing or manual updates)
   */
  async triggerStatusUpdate(loanId: string, newStatus: string, oldStatus?: string) {
    const event: StatusUpdateEvent = {
      type: 'status_change',
      loanId,
      oldStatus,
      newStatus,
      timestamp: new Date().toISOString(),
      pageAffected: this.getAffectedPages(newStatus, oldStatus)
    };

    this.callbacks.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error('Error in manual status update callback:', error);
      }
    });
  }

  /**
   * Get current status for a loan
   */
  async getLoanStatus(loanId: string): Promise<{
    currentStage: string;
    currentStatus: string;
    canProceed: boolean;
    nextStage?: string;
    requiredActions: string[];
  } | null> {
    return await LoanStatusFlowService.getLoanStageStatus(loanId);
  }

  /**
   * Move loan to next stage
   */
  async moveToNextStage(
    loanId: string,
    userId: string,
    comments?: string
  ): Promise<{ success: boolean; message: string }> {
    const result = await LoanStatusFlowService.moveToNextStage(loanId, userId, comments);
    
    if (result.success) {
      // Trigger real-time update
      const currentStatus = await this.getLoanStatus(loanId);
      if (currentStatus) {
        await this.triggerStatusUpdate(loanId, currentStatus.currentStatus);
      }
    }

    return result;
  }
}

// Export singleton instance
export const realTimeStatusService = RealTimeStatusService.getInstance();








