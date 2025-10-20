// Simple webhook handler for ClickPesa
// This can be used to test webhook functionality

export interface WebhookEvent {
  event_type: string;
  transaction_id: string;
  status: string;
  amount: number;
  currency: string;
  reference: string;
  timestamp: string;
  data: any;
}

export class WebhookHandler {
  /**
   * Process ClickPesa webhook event
   */
  static async processWebhookEvent(event: WebhookEvent): Promise<{ success: boolean; message: string }> {
    try {
      console.log('Processing ClickPesa webhook event:', event);

      // Basic validation
      if (!event.event_type || !event.transaction_id) {
        throw new Error('Invalid webhook event: missing required fields');
      }

      // Process based on event type
      switch (event.event_type) {
        case 'payout.completed':
          await this.handlePayoutCompleted(event);
          break;
        case 'payout.failed':
          await this.handlePayoutFailed(event);
          break;
        case 'payment.completed':
          await this.handlePaymentCompleted(event);
          break;
        case 'payment.failed':
          await this.handlePaymentFailed(event);
          break;
        default:
          console.log(`Unhandled webhook event: ${event.event_type}`);
      }

      return {
        success: true,
        message: `Webhook event ${event.event_type} processed successfully`
      };

    } catch (error) {
      console.error('Error processing webhook event:', error);
      return {
        success: false,
        message: `Error processing webhook: ${error.message}`
      };
    }
  }

  /**
   * Handle payout completed event
   */
  private static async handlePayoutCompleted(event: WebhookEvent): Promise<void> {
    console.log('Payout completed:', event);
    // Update loan status to disbursed
    // Send notification to client
    // Update accounting records
  }

  /**
   * Handle payout failed event
   */
  private static async handlePayoutFailed(event: WebhookEvent): Promise<void> {
    console.log('Payout failed:', event);
    // Update loan status
    // Send failure notification
    // Log error for retry
  }

  /**
   * Handle payment completed event
   */
  private static async handlePaymentCompleted(event: WebhookEvent): Promise<void> {
    console.log('Payment completed:', event);
    // Update repayment status
    // Send receipt
    // Update accounting records
  }

  /**
   * Handle payment failed event
   */
  private static async handlePaymentFailed(event: WebhookEvent): Promise<void> {
    console.log('Payment failed:', event);
    // Update payment status
    // Send failure notification
    // Log for retry
  }

  /**
   * Test webhook endpoint
   */
  static async testWebhook(): Promise<{ success: boolean; message: string }> {
    const testEvent: WebhookEvent = {
      event_type: 'payout.completed',
      transaction_id: 'test-transaction-123',
      status: 'completed',
      amount: 100000,
      currency: 'TZS',
      reference: 'TEST-REF-001',
      timestamp: new Date().toISOString(),
      data: { test: true }
    };

    return await this.processWebhookEvent(testEvent);
  }
}
