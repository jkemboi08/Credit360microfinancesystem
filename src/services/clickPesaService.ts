import { supabase } from '../lib/supabaseClient';

export interface ClickPesaConfig {
  clientId: string;
  apiKey: string;
  baseUrl: string;
  webhookUrl?: string;
  environment: 'sandbox' | 'production';
}

export interface ClickPesaAuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
}

export interface ClickPesaPayoutRequest {
  amount: number;
  currency: string;
  recipient_phone: string;
  recipient_name: string;
  reference: string;
  description?: string;
}

export interface ClickPesaPayoutResponse {
  transaction_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  reference: string;
  amount: number;
  currency: string;
  recipient_phone: string;
  created_at: string;
  updated_at: string;
}

export interface ClickPesaPaymentRequest {
  amount: number;
  currency: string;
  customer_phone: string;
  customer_name: string;
  reference: string;
  description?: string;
  callback_url?: string;
}

export interface ClickPesaPaymentResponse {
  payment_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  reference: string;
  amount: number;
  currency: string;
  customer_phone: string;
  payment_url?: string;
  created_at: string;
  updated_at: string;
}

export interface ClickPesaWebhookEvent {
  event_type: string;
  transaction_id: string;
  status: string;
  amount: number;
  currency: string;
  reference: string;
  timestamp: string;
  data: any;
}

class ClickPesaService {
  private config: ClickPesaConfig | null = null;
  private jwtToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor() {
    this.loadConfig();
  }

  /**
   * Load ClickPesa configuration from database
   */
  private async loadConfig(): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('integration_configs')
        .select('*')
        .eq('integration_name', 'clickpesa')
        .eq('is_active', true)
        .single();

      if (error || !data) {
        console.warn('ClickPesa configuration not found');
        return;
      }

      this.config = {
        clientId: data.client_id,
        apiKey: data.api_key,
        baseUrl: data.base_url || 'https://api.clickpesa.com',
        webhookUrl: data.webhook_url,
        environment: data.environment || 'sandbox'
      };
    } catch (error) {
      console.error('Error loading ClickPesa configuration:', error);
    }
  }

  /**
   * Get or refresh JWT token
   */
  private async getJWTToken(): Promise<string> {
    if (!this.config) {
      throw new Error('ClickPesa configuration not found');
    }

    // Check if current token is still valid
    if (this.jwtToken && Date.now() < this.tokenExpiry) {
      return this.jwtToken;
    }

    try {
      const response = await fetch(`${this.config.baseUrl}/oauth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: this.config.clientId,
          client_secret: this.config.apiKey
        })
      });

      if (!response.ok) {
        throw new Error(`Authentication failed: ${response.statusText}`);
      }

      const authData: ClickPesaAuthResponse = await response.json();
      
      this.jwtToken = authData.access_token;
      this.tokenExpiry = Date.now() + (authData.expires_in * 1000) - 60000; // 1 minute buffer

      return this.jwtToken;
    } catch (error) {
      console.error('Error getting JWT token:', error);
      throw new Error('Failed to authenticate with ClickPesa');
    }
  }

  /**
   * Make authenticated API request
   */
  private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    if (!this.config) {
      throw new Error('ClickPesa configuration not found');
    }

    const token = await this.getJWTToken();
    const url = `${this.config.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`ClickPesa API error: ${response.status} - ${errorText}`);
    }

    return response.json();
  }

  /**
   * Create a payout (disbursement)
   */
  async createPayout(payoutData: ClickPesaPayoutRequest): Promise<ClickPesaPayoutResponse> {
    try {
      const response = await this.makeRequest('/api/v1/payouts', {
        method: 'POST',
        body: JSON.stringify(payoutData)
      });

      // Log transaction to database
      await this.logTransaction('payout', payoutData.reference, response);

      return response;
    } catch (error) {
      console.error('Error creating payout:', error);
      throw error;
    }
  }

  /**
   * Create bulk payouts
   */
  async createBulkPayouts(payouts: ClickPesaPayoutRequest[]): Promise<ClickPesaPayoutResponse[]> {
    try {
      const response = await this.makeRequest('/api/v1/payouts/bulk', {
        method: 'POST',
        body: JSON.stringify({ payouts })
      });

      // Log each transaction
      for (const payout of payouts) {
        await this.logTransaction('payout', payout.reference, response);
      }

      return response.payouts || [];
    } catch (error) {
      console.error('Error creating bulk payouts:', error);
      throw error;
    }
  }

  /**
   * Create a payment collection request
   */
  async createPayment(paymentData: ClickPesaPaymentRequest): Promise<ClickPesaPaymentResponse> {
    try {
      const response = await this.makeRequest('/api/v1/payments', {
        method: 'POST',
        body: JSON.stringify(paymentData)
      });

      // Log transaction to database
      await this.logTransaction('payment', paymentData.reference, response);

      return response;
    } catch (error) {
      console.error('Error creating payment:', error);
      throw error;
    }
  }

  /**
   * Get transaction status
   */
  async getTransactionStatus(transactionId: string): Promise<any> {
    try {
      return await this.makeRequest(`/api/v1/transactions/${transactionId}`);
    } catch (error) {
      console.error('Error getting transaction status:', error);
      throw error;
    }
  }

  /**
   * Get transaction history
   */
  async getTransactionHistory(params: {
    start_date?: string;
    end_date?: string;
    status?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<any> {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });

      return await this.makeRequest(`/api/v1/transactions?${queryParams.toString()}`);
    } catch (error) {
      console.error('Error getting transaction history:', error);
      throw error;
    }
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(payload: string, signature: string): boolean {
    // Implementation depends on ClickPesa's webhook signature method
    // This is a placeholder - actual implementation needed
    return true;
  }

  /**
   * Process webhook event
   */
  async processWebhookEvent(event: ClickPesaWebhookEvent): Promise<void> {
    try {
      // Update transaction status in database
      await supabase
        .from('clickpesa_transactions')
        .update({
          status: event.status,
          updated_at: new Date().toISOString(),
          webhook_data: event.data
        })
        .eq('transaction_id', event.transaction_id);

      // Trigger any necessary business logic based on event type
      await this.handleWebhookEvent(event);
    } catch (error) {
      console.error('Error processing webhook event:', error);
      throw error;
    }
  }

  /**
   * Handle specific webhook events
   */
  private async handleWebhookEvent(event: ClickPesaWebhookEvent): Promise<void> {
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
  }

  /**
   * Handle payout completed event
   */
  private async handlePayoutCompleted(event: ClickPesaWebhookEvent): Promise<void> {
    // Update loan status to disbursed
    // Send notification to client
    // Update accounting records
    console.log('Payout completed:', event);
  }

  /**
   * Handle payout failed event
   */
  private async handlePayoutFailed(event: ClickPesaWebhookEvent): Promise<void> {
    // Update loan status
    // Send failure notification
    // Log error for retry
    console.log('Payout failed:', event);
  }

  /**
   * Handle payment completed event
   */
  private async handlePaymentCompleted(event: ClickPesaWebhookEvent): Promise<void> {
    // Update repayment status
    // Send receipt
    // Update accounting records
    console.log('Payment completed:', event);
  }

  /**
   * Handle payment failed event
   */
  private async handlePaymentFailed(event: ClickPesaWebhookEvent): Promise<void> {
    // Update payment status
    // Send failure notification
    // Log for retry
    console.log('Payment failed:', event);
  }

  /**
   * Log transaction to database
   */
  private async logTransaction(type: 'payout' | 'payment', reference: string, response: any): Promise<void> {
    try {
      await supabase
        .from('clickpesa_transactions')
        .insert({
          transaction_id: response.transaction_id || response.payment_id,
          type,
          reference,
          status: response.status,
          amount: response.amount,
          currency: response.currency,
          recipient_phone: response.recipient_phone || response.customer_phone,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          response_data: response
        });
    } catch (error) {
      console.error('Error logging transaction:', error);
    }
  }

  /**
   * Test connection to ClickPesa
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.getJWTToken();
      return true;
    } catch (error) {
      console.error('ClickPesa connection test failed:', error);
      return false;
    }
  }

  /**
   * Get account balance
   */
  async getAccountBalance(): Promise<any> {
    try {
      return await this.makeRequest('/api/v1/account/balance');
    } catch (error) {
      console.error('Error getting account balance:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const clickPesaService = new ClickPesaService();
export default clickPesaService;
