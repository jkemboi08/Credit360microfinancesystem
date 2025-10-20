import { supabase } from '../lib/supabase';

export interface SavingsProduct {
  id: string;
  product_name: string;
  product_type: 'voluntary_savings' | 'compulsory_savings' | 'term_deposits' | 'special_purpose_savings';
  product_code: string;
  description?: string;
  minimum_balance: number;
  maximum_balance?: number;
  minimum_balance_for_interest: number;
  annual_interest_rate: number;
  interest_rate_type: 'flat' | 'tiered';
  interest_calculation_method: 'daily_average' | 'lowest_monthly' | 'simple_interest';
  interest_posting_frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annually';
  monthly_maintenance_fee: number;
  withdrawal_fee: number;
  dormant_account_fee: number;
  early_withdrawal_penalty_rate: number;
  max_daily_withdrawal?: number;
  max_monthly_withdrawals?: number;
  free_withdrawals_per_month: number;
  maturity_period_months?: number;
  maturity_action: 'close' | 'rollover_principal_interest' | 'rollover_principal_only';
  auto_renewal: boolean;
  eligible_client_types: string[];
  minimum_age?: number;
  maximum_age?: number;
  minimum_income?: number;
  group_membership_required: boolean;
  required_group_types?: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SavingsProductTier {
  id: string;
  product_id: string;
  min_balance: number;
  max_balance?: number;
  interest_rate: number;
}

export interface SavingsAccount {
  id: string;
  account_number: string;
  client_id: string;
  product_id: string;
  account_name: string;
  account_status: 'active' | 'dormant' | 'closed' | 'frozen' | 'suspended';
  current_balance: number;
  available_balance: number;
  pending_balance: number;
  interest_earned_not_posted: number;
  principal_amount?: number;
  maturity_date?: string;
  interest_rate_at_opening?: number;
  opened_date: string;
  last_transaction_date?: string;
  last_interest_posting_date?: string;
  dormant_since?: string;
  created_at: string;
  updated_at: string;
  // Joined data
  product?: SavingsProduct;
  client?: {
    id: string;
    first_name: string;
    last_name: string;
    email?: string;
    phone?: string;
  };
}

export interface SavingsTransaction {
  id: string;
  account_id: string;
  transaction_type: 'deposit' | 'withdrawal' | 'interest_posting' | 'fee_charge' | 'transfer_in' | 'transfer_out';
  amount: number;
  balance_after: number;
  transaction_date: string;
  value_date: string;
  transaction_method: 'cash' | 'mobile_money' | 'bank_transfer' | 'cheque' | 'internal_transfer';
  reference_number?: string;
  description?: string;
  fees_charged: number;
  requires_approval: boolean;
  approved_by?: string;
  approved_at?: string;
  created_at: string;
  created_by: string;
}

export interface InterestCalculation {
  id: string;
  account_id: string;
  calculation_date: string;
  period_start: string;
  period_end: string;
  average_balance: number;
  interest_rate: number;
  calculated_interest: number;
  days_in_period: number;
  is_posted: boolean;
  posted_at?: string;
  posted_by?: string;
  posting_batch_id?: string;
  created_at: string;
  created_by: string;
}

export interface InterestPostingBatch {
  id: string;
  batch_name: string;
  posting_date: string;
  period_start: string;
  period_end: string;
  status: 'pending' | 'approved' | 'posted' | 'failed';
  total_interest: number;
  accounts_processed: number;
  accounts_failed: number;
  requires_approval: boolean;
  approved_by?: string;
  approved_at?: string;
  posted_by?: string;
  posted_at?: string;
  created_at: string;
  created_by: string;
}

export class SavingsService {
  // Savings Products
  static async getSavingsProducts(): Promise<SavingsProduct[]> {
    const { data, error } = await supabase
      .from('savings_products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async getSavingsProduct(id: string): Promise<SavingsProduct> {
    const { data, error } = await supabase
      .from('savings_products')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  static async createSavingsProduct(product: Omit<SavingsProduct, 'id' | 'created_at' | 'updated_at'>): Promise<SavingsProduct> {
    const { data, error } = await supabase
      .from('savings_products')
      .insert([product])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async updateSavingsProduct(id: string, updates: Partial<SavingsProduct>): Promise<SavingsProduct> {
    const { data, error } = await supabase
      .from('savings_products')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async deleteSavingsProduct(id: string): Promise<void> {
    const { error } = await supabase
      .from('savings_products')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // Savings Product Tiers
  static async getSavingsProductTiers(productId: string): Promise<SavingsProductTier[]> {
    const { data, error } = await supabase
      .from('savings_product_tiers')
      .select('*')
      .eq('product_id', productId)
      .order('min_balance', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  static async createSavingsProductTier(tier: Omit<SavingsProductTier, 'id' | 'created_at'>): Promise<SavingsProductTier> {
    const { data, error } = await supabase
      .from('savings_product_tiers')
      .insert([tier])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async updateSavingsProductTier(id: string, updates: Partial<SavingsProductTier>): Promise<SavingsProductTier> {
    const { data, error } = await supabase
      .from('savings_product_tiers')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async deleteSavingsProductTier(id: string): Promise<void> {
    const { error } = await supabase
      .from('savings_product_tiers')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // Savings Accounts
  static async getSavingsAccounts(): Promise<SavingsAccount[]> {
    const { data, error } = await supabase
      .from('savings_accounts')
      .select(`
        *,
        product: savings_products(*),
        client: clients(id, first_name, last_name, email, phone)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async getSavingsAccount(id: string): Promise<SavingsAccount> {
    const { data, error } = await supabase
      .from('savings_accounts')
      .select(`
        *,
        product: savings_products(*),
        client: clients(id, first_name, last_name, email, phone)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  static async getClientSavingsAccounts(clientId: string): Promise<SavingsAccount[]> {
    const { data, error } = await supabase
      .from('savings_accounts')
      .select(`
        *,
        product: savings_products(*)
      `)
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async createSavingsAccount(account: Omit<SavingsAccount, 'id' | 'account_number' | 'created_at' | 'updated_at'>): Promise<SavingsAccount> {
    // Generate account number
    const { data: accountNumber, error: accountError } = await supabase
      .rpc('generate_savings_account_number');

    if (accountError) throw accountError;

    const { data, error } = await supabase
      .from('savings_accounts')
      .insert([{
        ...account,
        account_number: accountNumber
      }])
      .select(`
        *,
        product: savings_products(*),
        client: clients(id, first_name, last_name, email, phone)
      `)
      .single();

    if (error) throw error;
    return data;
  }

  static async updateSavingsAccount(id: string, updates: Partial<SavingsAccount>): Promise<SavingsAccount> {
    const { data, error } = await supabase
      .from('savings_accounts')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        product: savings_products(*),
        client: clients(id, first_name, last_name, email, phone)
      `)
      .single();

    if (error) throw error;
    return data;
  }

  // Savings Transactions
  static async getSavingsTransactions(accountId: string): Promise<SavingsTransaction[]> {
    const { data, error } = await supabase
      .from('savings_transactions')
      .select('*')
      .eq('account_id', accountId)
      .order('transaction_date', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async createSavingsTransaction(transaction: Omit<SavingsTransaction, 'id' | 'created_at'>): Promise<SavingsTransaction> {
    const { data, error } = await supabase
      .from('savings_transactions')
      .insert([transaction])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async processDeposit(accountId: string, amount: number, method: string, reference?: string, description?: string): Promise<SavingsTransaction> {
    // Get current account balance
    const { data: account, error: accountError } = await supabase
      .from('savings_accounts')
      .select('current_balance')
      .eq('id', accountId)
      .single();

    if (accountError) throw accountError;

    const newBalance = account.current_balance + amount;

    // Create transaction
    const transaction = await this.createSavingsTransaction({
      account_id: accountId,
      transaction_type: 'deposit',
      amount,
      balance_after: newBalance,
      transaction_method: method as any,
      reference_number: reference,
      description,
      fees_charged: 0,
      requires_approval: false,
      created_by: (await supabase.auth.getUser()).data.user?.id || ''
    });

    // Update account balance
    await supabase
      .from('savings_accounts')
      .update({
        current_balance: newBalance,
        available_balance: newBalance,
        last_transaction_date: new Date().toISOString().split('T')[0]
      })
      .eq('id', accountId);

    return transaction;
  }

  static async processWithdrawal(accountId: string, amount: number, method: string, reference?: string, description?: string): Promise<SavingsTransaction> {
    // Get current account balance and product details
    const { data: accountData, error: accountError } = await supabase
      .from('savings_accounts')
      .select(`
        current_balance,
        available_balance,
        product: savings_products(*)
      `)
      .eq('id', accountId)
      .single();

    if (accountError) throw accountError;

    const { current_balance, available_balance, product } = accountData;

    // Check withdrawal limits
    if (amount > available_balance) {
      throw new Error('Insufficient funds');
    }

    if (product.max_daily_withdrawal && amount > product.max_daily_withdrawal) {
      throw new Error('Withdrawal amount exceeds daily limit');
    }

    const newBalance = current_balance - amount;
    const withdrawalFee = product.withdrawal_fee || 0;
    const totalAmount = amount + withdrawalFee;

    // Create transaction
    const transaction = await this.createSavingsTransaction({
      account_id: accountId,
      transaction_type: 'withdrawal',
      amount: -totalAmount,
      balance_after: newBalance,
      transaction_method: method as any,
      reference_number: reference,
      description,
      fees_charged: withdrawalFee,
      requires_approval: false,
      created_by: (await supabase.auth.getUser()).data.user?.id || ''
    });

    // Update account balance
    await supabase
      .from('savings_accounts')
      .update({
        current_balance: newBalance,
        available_balance: newBalance,
        last_transaction_date: new Date().toISOString().split('T')[0]
      })
      .eq('id', accountId);

    return transaction;
  }

  // Interest Calculations
  static async calculateInterest(accountId: string, periodStart: string, periodEnd: string): Promise<number> {
    const { data, error } = await supabase
      .rpc('calculate_savings_interest', {
        p_account_id: accountId,
        p_period_start: periodStart,
        p_period_end: periodEnd
      });

    if (error) throw error;
    return data || 0;
  }

  static async getInterestCalculations(accountId: string): Promise<InterestCalculation[]> {
    const { data, error } = await supabase
      .from('interest_calculations')
      .select('*')
      .eq('account_id', accountId)
      .order('calculation_date', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async createInterestCalculation(calculation: Omit<InterestCalculation, 'id' | 'created_at'>): Promise<InterestCalculation> {
    const { data, error } = await supabase
      .from('interest_calculations')
      .insert([calculation])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Interest Posting Batches
  static async getInterestPostingBatches(): Promise<InterestPostingBatch[]> {
    const { data, error } = await supabase
      .from('interest_posting_batches')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async createInterestPostingBatch(batch: Omit<InterestPostingBatch, 'id' | 'created_at'>): Promise<InterestPostingBatch> {
    const { data, error } = await supabase
      .from('interest_posting_batches')
      .insert([batch])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async approveInterestPostingBatch(batchId: string): Promise<InterestPostingBatch> {
    const { data, error } = await supabase
      .from('interest_posting_batches')
      .update({
        status: 'approved',
        approved_at: new Date().toISOString(),
        approved_by: (await supabase.auth.getUser()).data.user?.id
      })
      .eq('id', batchId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async postInterestBatch(batchId: string): Promise<void> {
    // This would typically involve a complex stored procedure
    // For now, we'll mark it as posted
    const { error } = await supabase
      .from('interest_posting_batches')
      .update({
        status: 'posted',
        posted_at: new Date().toISOString(),
        posted_by: (await supabase.auth.getUser()).data.user?.id
      })
      .eq('id', batchId);

    if (error) throw error;
  }

  // Enhanced Account Management Methods
  static async getAccountStatement(accountId: string, startDate: string, endDate: string): Promise<SavingsTransaction[]> {
    const { data, error } = await supabase
      .from('savings_transactions')
      .select('*')
      .eq('account_id', accountId)
      .gte('transaction_date', startDate)
      .lte('transaction_date', endDate)
      .order('transaction_date', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async generateAccountStatement(accountId: string, startDate: string, endDate: string, format: 'pdf' | 'excel' = 'pdf'): Promise<Blob> {
    // This would typically generate a PDF or Excel file
    // For now, we'll return a mock blob
    const statementData = await this.getAccountStatement(accountId, startDate, endDate);
    const blob = new Blob([JSON.stringify(statementData)], { type: 'application/json' });
    return blob;
  }

  static async getAccountBalanceTrend(accountId: string, period: string): Promise<any[]> {
    // This would typically calculate balance trends over time
    // For now, we'll return mock data
    return [];
  }

  static async calculateAccountInterest(accountId: string, periodStart: string, periodEnd: string): Promise<number> {
    const { data, error } = await supabase
      .rpc('calculate_savings_interest', {
        p_account_id: accountId,
        p_period_start: periodStart,
        p_period_end: periodEnd
      });

    if (error) throw error;
    return data || 0;
  }

  // Enhanced Product Management Methods
  static async validateProductConfiguration(product: Partial<SavingsProduct>): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];
    
    if (!product.product_name) errors.push('Product name is required');
    if (!product.product_code) errors.push('Product code is required');
    if (!product.product_type) errors.push('Product type is required');
    if (product.minimum_balance < 0) errors.push('Minimum balance cannot be negative');
    if (product.annual_interest_rate < 0) errors.push('Interest rate cannot be negative');
    if (product.annual_interest_rate > 100) errors.push('Interest rate cannot exceed 100%');
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  static async getProductPerformanceMetrics(productId: string): Promise<any> {
    // This would typically calculate various performance metrics
    // For now, we'll return mock data
    return {
      totalAccounts: 0,
      totalDeposits: 0,
      totalWithdrawals: 0,
      averageBalance: 0,
      interestPaid: 0,
      feesCollected: 0
    };
  }

  // Enhanced Transaction Processing Methods
  static async processTransfer(fromAccountId: string, toAccountId: string, amount: number, description?: string): Promise<{ fromTransaction: SavingsTransaction; toTransaction: SavingsTransaction }> {
    // Get account details
    const fromAccount = await this.getSavingsAccount(fromAccountId);
    const toAccount = await this.getSavingsAccount(toAccountId);

    // Validate transfer
    if (fromAccount.current_balance < amount) {
      throw new Error('Insufficient funds for transfer');
    }

    // Process withdrawal from source account
    const fromTransaction = await this.processWithdrawal(fromAccountId, amount, 'internal_transfer', undefined, description);
    
    // Process deposit to destination account
    const toTransaction = await this.processDeposit(toAccountId, amount, 'internal_transfer', undefined, description);

    return { fromTransaction, toTransaction };
  }

  static async reverseTransaction(transactionId: string, reason: string): Promise<SavingsTransaction> {
    // Get original transaction
    const { data: originalTransaction, error: fetchError } = await supabase
      .from('savings_transactions')
      .select('*')
      .eq('id', transactionId)
      .single();

    if (fetchError) throw fetchError;

    // Create reversal transaction
    const reversalTransaction = await this.createSavingsTransaction({
      account_id: originalTransaction.account_id,
      transaction_type: originalTransaction.transaction_type === 'deposit' ? 'withdrawal' : 'deposit',
      amount: -originalTransaction.amount,
      balance_after: originalTransaction.balance_after - originalTransaction.amount,
      transaction_method: originalTransaction.transaction_method,
      reference_number: `REV-${originalTransaction.reference_number || transactionId}`,
      description: `Reversal: ${originalTransaction.description || ''} - Reason: ${reason}`,
      fees_charged: 0,
      requires_approval: true,
      created_by: (await supabase.auth.getUser()).data.user?.id || ''
    });

    // Update account balance
    await supabase
      .from('savings_accounts')
      .update({
        current_balance: originalTransaction.balance_after - originalTransaction.amount,
        available_balance: originalTransaction.balance_after - originalTransaction.amount,
        last_transaction_date: new Date().toISOString().split('T')[0]
      })
      .eq('id', originalTransaction.account_id);

    return reversalTransaction;
  }

  // Enhanced Reporting Methods
  static async getInterestPostingReport(batchId: string): Promise<any> {
    const { data, error } = await supabase
      .from('interest_posting_batches')
      .select(`
        *,
        calculations: interest_calculations(*)
      `)
      .eq('id', batchId)
      .single();

    if (error) throw error;
    return data;
  }

  static async getSavingsPortfolioSummary(): Promise<any> {
    // This would typically calculate portfolio-wide metrics
    // For now, we'll return mock data
    return {
      totalAccounts: 0,
      totalBalance: 0,
      totalInterestPaid: 0,
      totalFeesCollected: 0,
      averageAccountBalance: 0,
      activeAccounts: 0,
      dormantAccounts: 0
    };
  }

  // Enhanced Compliance Methods
  static async getRegulatoryReport(reportType: string, period: string): Promise<any> {
    // This would typically generate regulatory reports
    // For now, we'll return mock data
    return {
      reportType,
      period,
      data: []
    };
  }

  static async auditAccountActivity(accountId: string, startDate: string, endDate: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('savings_transactions')
      .select('*')
      .eq('account_id', accountId)
      .gte('transaction_date', startDate)
      .lte('transaction_date', endDate)
      .order('transaction_date', { ascending: false });

    if (error) throw error;
    return data || [];
  }
}
















