/**
 * Savings Management Service
 * Handles all savings-related operations with proper error handling
 */

import { supabase } from '../lib/supabaseClient';

export interface SavingsAccount {
  id: string;
  client_id: string;
  product_id: number;
  account_number: string;
  balance: number;
  status: 'active' | 'inactive' | 'suspended';
  opened_date: string;
  created_at: string;
  updated_at: string;
}

export interface SavingsTransaction {
  id: string;
  account_id: string;
  transaction_type: 'deposit' | 'withdrawal' | 'interest' | 'fee';
  amount: number;
  description: string;
  transaction_date: string;
  created_at: string;
}

export interface SavingsProduct {
  id: number;
  name: string;
  product_type: string;
  minimum_balance: number;
  maximum_balance: number;
  minimum_deposit: number;
  withdrawal_fee: number;
  monthly_fee: number;
  status: 'active' | 'inactive';
}

export class SavingsManagementService {
  /**
   * Get all savings accounts for a client
   */
  static async getClientSavingsAccounts(clientId: string): Promise<{
    success: boolean;
    data?: SavingsAccount[];
    error?: string;
  }> {
    try {
      console.log('🔍 Getting savings accounts for client:', clientId);

      const { data, error } = await supabase
        .from('savings_accounts')
        .select(`
          id,
          client_id,
          product_id,
          account_number,
          balance,
          status,
          opened_date,
          created_at,
          updated_at
        `)
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching savings accounts:', error);
        return {
          success: false,
          error: `Failed to fetch savings accounts: ${error.message}`
        };
      }

      console.log(`✅ Found ${data?.length || 0} savings accounts`);
      return {
        success: true,
        data: data || []
      };

    } catch (error) {
      console.error('❌ Exception fetching savings accounts:', error);
      return {
        success: false,
        error: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Create a new savings account
   */
  static async createSavingsAccount(accountData: {
    client_id: string;
    product_id: number;
    account_number: string;
    initial_deposit?: number;
  }): Promise<{
    success: boolean;
    data?: SavingsAccount;
    error?: string;
  }> {
    try {
      console.log('➕ Creating new savings account:', accountData);

      const { data, error } = await supabase
        .from('savings_accounts')
        .insert([{
          client_id: accountData.client_id,
          product_id: accountData.product_id,
          account_number: accountData.account_number,
          balance: accountData.initial_deposit || 0,
          status: 'active',
          opened_date: new Date().toISOString().split('T')[0]
        }])
        .select()
        .single();

      if (error) {
        console.error('❌ Error creating savings account:', error);
        return {
          success: false,
          error: `Failed to create savings account: ${error.message}`
        };
      }

      console.log('✅ Savings account created successfully');
      return {
        success: true,
        data
      };

    } catch (error) {
      console.error('❌ Exception creating savings account:', error);
      return {
        success: false,
        error: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Process a deposit
   */
  static async processDeposit(accountId: string, amount: number, description?: string): Promise<{
    success: boolean;
    data?: SavingsTransaction;
    error?: string;
  }> {
    try {
      console.log('💰 Processing deposit:', { accountId, amount });

      // Get current account balance
      const { data: account, error: accountError } = await supabase
        .from('savings_accounts')
        .select('balance')
        .eq('id', accountId)
        .single();

      if (accountError) {
        return {
          success: false,
          error: `Account not found: ${accountError.message}`
        };
      }

      const newBalance = (account.balance || 0) + amount;

      // Update account balance
      const { error: updateError } = await supabase
        .from('savings_accounts')
        .update({ balance: newBalance })
        .eq('id', accountId);

      if (updateError) {
        return {
          success: false,
          error: `Failed to update balance: ${updateError.message}`
        };
      }

      // Create transaction record
      const { data: transaction, error: transactionError } = await supabase
        .from('savings_transactions')
        .insert([{
          account_id: accountId,
          transaction_type: 'deposit',
          amount: amount,
          description: description || 'Deposit',
          transaction_date: new Date().toISOString()
        }])
        .select()
        .single();

      if (transactionError) {
        console.error('❌ Error creating transaction record:', transactionError);
        // Don't fail the deposit if transaction record fails
      }

      console.log('✅ Deposit processed successfully');
      return {
        success: true,
        data: transaction
      };

    } catch (error) {
      console.error('❌ Exception processing deposit:', error);
      return {
        success: false,
        error: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Process a withdrawal
   */
  static async processWithdrawal(accountId: string, amount: number, description?: string): Promise<{
    success: boolean;
    data?: SavingsTransaction;
    error?: string;
  }> {
    try {
      console.log('💸 Processing withdrawal:', { accountId, amount });

      // Get current account balance
      const { data: account, error: accountError } = await supabase
        .from('savings_accounts')
        .select('balance')
        .eq('id', accountId)
        .single();

      if (accountError) {
        return {
          success: false,
          error: `Account not found: ${accountError.message}`
        };
      }

      const currentBalance = account.balance || 0;
      
      if (currentBalance < amount) {
        return {
          success: false,
          error: 'Insufficient funds for withdrawal'
        };
      }

      const newBalance = currentBalance - amount;

      // Update account balance
      const { error: updateError } = await supabase
        .from('savings_accounts')
        .update({ balance: newBalance })
        .eq('id', accountId);

      if (updateError) {
        return {
          success: false,
          error: `Failed to update balance: ${updateError.message}`
        };
      }

      // Create transaction record
      const { data: transaction, error: transactionError } = await supabase
        .from('savings_transactions')
        .insert([{
          account_id: accountId,
          transaction_type: 'withdrawal',
          amount: amount,
          description: description || 'Withdrawal',
          transaction_date: new Date().toISOString()
        }])
        .select()
        .single();

      if (transactionError) {
        console.error('❌ Error creating transaction record:', transactionError);
        // Don't fail the withdrawal if transaction record fails
      }

      console.log('✅ Withdrawal processed successfully');
      return {
        success: true,
        data: transaction
      };

    } catch (error) {
      console.error('❌ Exception processing withdrawal:', error);
      return {
        success: false,
        error: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Calculate interest for an account
   */
  static async calculateInterest(accountId: string): Promise<{
    success: boolean;
    data?: {
      interestAmount: number;
      transaction?: SavingsTransaction;
    };
    error?: string;
  }> {
    try {
      console.log('🧮 Calculating interest for account:', accountId);

      // Get account details and product information
      const { data: account, error: accountError } = await supabase
        .from('savings_accounts')
        .select(`
          id,
          balance,
          product_id,
          savings_products!inner(interest_rate, product_type)
        `)
        .eq('id', accountId)
        .single();

      if (accountError) {
        return {
          success: false,
          error: `Account not found: ${accountError.message}`
        };
      }

      const balance = account.balance || 0;
      const interestRate = account.savings_products?.interest_rate || 0;
      
      // Calculate monthly interest (assuming monthly calculation)
      const interestAmount = (balance * interestRate) / 100 / 12;

      if (interestAmount <= 0) {
        return {
          success: true,
          data: { interestAmount: 0 }
        };
      }

      // Add interest to account
      const newBalance = balance + interestAmount;
      
      const { error: updateError } = await supabase
        .from('savings_accounts')
        .update({ balance: newBalance })
        .eq('id', accountId);

      if (updateError) {
        return {
          success: false,
          error: `Failed to update balance: ${updateError.message}`
        };
      }

      // Create interest transaction record
      const { data: transaction, error: transactionError } = await supabase
        .from('savings_transactions')
        .insert([{
          account_id: accountId,
          transaction_type: 'interest',
          amount: interestAmount,
          description: `Interest payment (${interestRate}% p.a.)`,
          transaction_date: new Date().toISOString()
        }])
        .select()
        .single();

      if (transactionError) {
        console.error('❌ Error creating interest transaction:', transactionError);
      }

      console.log('✅ Interest calculated and applied successfully');
      return {
        success: true,
        data: {
          interestAmount,
          transaction
        }
      };

    } catch (error) {
      console.error('❌ Exception calculating interest:', error);
      return {
        success: false,
        error: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Get account statement
   */
  static async getAccountStatement(accountId: string, startDate?: string, endDate?: string): Promise<{
    success: boolean;
    data?: SavingsTransaction[];
    error?: string;
  }> {
    try {
      console.log('📊 Getting account statement for:', accountId);

      let query = supabase
        .from('savings_transactions')
        .select(`
          id,
          transaction_type,
          amount,
          description,
          transaction_date,
          created_at
        `)
        .eq('account_id', accountId)
        .order('transaction_date', { ascending: false });

      if (startDate) {
        query = query.gte('transaction_date', startDate);
      }
      
      if (endDate) {
        query = query.lte('transaction_date', endDate);
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ Error fetching account statement:', error);
        return {
          success: false,
          error: `Failed to fetch statement: ${error.message}`
        };
      }

      console.log(`✅ Retrieved ${data?.length || 0} transactions`);
      return {
        success: true,
        data: data || []
      };

    } catch (error) {
      console.error('❌ Exception fetching account statement:', error);
      return {
        success: false,
        error: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Get all savings products
   */
  static async getSavingsProducts(): Promise<{
    success: boolean;
    data?: SavingsProduct[];
    error?: string;
  }> {
    try {
      console.log('🏦 Getting savings products');

      const { data, error } = await supabase
        .from('savings_products')
        .select(`
          id,
          name,
          product_type,
          minimum_balance,
          maximum_balance,
          minimum_deposit,
          withdrawal_fee,
          monthly_fee,
          status
        `)
        .eq('status', 'active')
        .order('name');

      if (error) {
        console.error('❌ Error fetching savings products:', error);
        return {
          success: false,
          error: `Failed to fetch products: ${error.message}`
        };
      }

      console.log(`✅ Retrieved ${data?.length || 0} savings products`);
      return {
        success: true,
        data: data || []
      };

    } catch (error) {
      console.error('❌ Exception fetching savings products:', error);
      return {
        success: false,
        error: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
}



































