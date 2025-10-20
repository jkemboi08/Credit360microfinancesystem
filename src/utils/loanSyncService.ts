/**
 * Loan Sync Service
 * Handles synchronization between loan_applications and loans tables
 */

import { supabase } from '../lib/supabaseClient';
import { LoanStatusMappingService } from '../services/loanStatusMappingService';

export interface LoanSyncData {
  id: string;
  application_id: string;
  client_id: string;
  requested_amount: number;
  interest_rate: number;
  repayment_period_months: number;
  disbursement_date: string;
  clients?: {
    first_name: string;
    last_name: string;
    full_name: string;
  };
}

export class LoanSyncService {
  /**
   * Convert UUID to a numeric ID for the loans table
   * This is a workaround for the schema mismatch between UUID and numeric IDs
   */
  private static uuidToNumericId(uuid: string): number {
    // Convert UUID to a consistent numeric ID by taking the first 8 characters
    // and converting from hex to decimal
    const hexString = uuid.replace(/-/g, '').substring(0, 8);
    return parseInt(hexString, 16);
  }

  /**
   * Sync all disbursed loans from loan_applications to loans table
   */
  static async syncDisbursedLoansToMonitoring(): Promise<{
    success: boolean;
    synced: number;
    errors: string[];
  }> {
    try {
      console.log('🔄 Starting loan sync process...');
      
      // Get all disbursed loans from loan_applications
      const { data: disbursedLoans, error: fetchError } = await supabase
        .from('loan_applications')
        .select(`
          id,
          application_id,
          client_id,
          requested_amount,
          interest_rate,
          repayment_period_months,
          disbursement_date,
          clients (
            first_name,
            last_name,
            full_name
          )
        `)
        .eq('status', 'disbursed')
        .eq('is_disbursed', true);

      if (fetchError) {
        console.error('❌ Error fetching disbursed loans:', fetchError);
        return { success: false, synced: 0, errors: [fetchError.message] };
      }

      if (!disbursedLoans || disbursedLoans.length === 0) {
        console.log('ℹ️ No disbursed loans found to sync');
        return { success: true, synced: 0, errors: [] };
      }

      console.log(`📋 Found ${disbursedLoans.length} disbursed loans to sync`);

      // Check which loans already exist in the loans table
      const numericIds = disbursedLoans.map(loan => this.uuidToNumericId(loan.id));
      const { data: existingLoans, error: existingError } = await supabase
        .from('loans')
        .select('id, loan_application_id')
        .in('loan_application_id', numericIds);

      if (existingError) {
        console.warn('⚠️ Could not check existing loans:', existingError);
      }

      const existingLoanIds = new Set(existingLoans?.map(loan => loan.loan_application_id) || []);
      const loansToSync = disbursedLoans.filter(loan => !existingLoanIds.has(this.uuidToNumericId(loan.id)));

      console.log(`🎯 ${loansToSync.length} loans need to be synced`);

      if (loansToSync.length === 0) {
        console.log('✅ All disbursed loans are already synced');
        return { success: true, synced: 0, errors: [] };
      }

      // Create loan records for monitoring
      const loanRecords = loansToSync.map(loan => {
        const disbursedAmount = loan.requested_amount || 0;
        const interestRate = loan.interest_rate || 15;
        const principalAmount = disbursedAmount;
        const interestAmount = (disbursedAmount * interestRate) / 100;
        const totalAmount = principalAmount + interestAmount;
        
        const disbursementDate = new Date(loan.disbursement_date || new Date());
        const firstRepaymentDate = new Date(disbursementDate);
        firstRepaymentDate.setMonth(firstRepaymentDate.getMonth() + 1);

        return {
          loan_application_id: this.uuidToNumericId(loan.id),
          user_id: 1, // Default user ID
          principal_amount: principalAmount,
          interest_amount: interestAmount,
          total_amount: totalAmount,
          status: 'active' as const, // Use correct status value
          disbursement_date: loan.disbursement_date || new Date().toISOString().split('T')[0],
          first_repayment_date: firstRepaymentDate.toISOString().split('T')[0],
          next_repayment_date: firstRepaymentDate.toISOString().split('T')[0],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
      });

      console.log('📝 Creating loan records for monitoring...');

      // Insert loan records
      const { data: insertedLoans, error: insertError } = await supabase
        .from('loans')
        .insert(loanRecords)
        .select();

      if (insertError) {
        console.error('❌ Error inserting loan records:', insertError);
        return { success: false, synced: 0, errors: [insertError.message] };
      }

      console.log(`✅ Successfully synced ${insertedLoans?.length || 0} loans to monitoring table`);
      
      return {
        success: true,
        synced: insertedLoans?.length || 0,
        errors: []
      };

    } catch (error) {
      console.error('❌ Error in loan sync process:', error);
      return {
        success: false,
        synced: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  /**
   * Sync a single disbursed loan to the loans table
   */
  static async syncSingleLoan(loanData: LoanSyncData): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      console.log('🔄 Syncing single loan:', loanData.application_id);
      
      // Check if loan already exists
      const numericId = this.uuidToNumericId(loanData.id);
      const { data: existingLoan, error: checkError } = await supabase
        .from('loans')
        .select('id')
        .eq('loan_application_id', numericId)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('❌ Error checking existing loan:', checkError);
        return { success: false, error: checkError.message };
      }

      if (existingLoan) {
        console.log('ℹ️ Loan already exists in monitoring table');
        return { success: true };
      }

      // Create loan record
      const disbursedAmount = loanData.requested_amount || 0;
      const interestRate = loanData.interest_rate || 15;
      const principalAmount = disbursedAmount;
      const interestAmount = (disbursedAmount * interestRate) / 100;
      const totalAmount = principalAmount + interestAmount;
      
      const disbursementDate = new Date(loanData.disbursement_date || new Date());
      const firstRepaymentDate = new Date(disbursementDate);
      firstRepaymentDate.setMonth(firstRepaymentDate.getMonth() + 1);

      const loanRecord = {
        loan_application_id: numericId,
        user_id: 1, // Default user ID
        principal_amount: principalAmount,
        interest_amount: interestAmount,
        total_amount: totalAmount,
        status: 'active' as const, // Use correct status value
        disbursement_date: loanData.disbursement_date || new Date().toISOString().split('T')[0],
        first_repayment_date: firstRepaymentDate.toISOString().split('T')[0],
        next_repayment_date: firstRepaymentDate.toISOString().split('T')[0],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { error: insertError } = await supabase
        .from('loans')
        .insert([loanRecord]);

      if (insertError) {
        console.error('❌ Error inserting loan record:', insertError);
        return { success: false, error: insertError.message };
      }

      console.log('✅ Loan synced successfully to monitoring table');
      return { success: true };

    } catch (error) {
      console.error('❌ Error syncing single loan:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get all active loans from the correct data source (loans table)
   * This ensures we're reading from the right place for monitoring
   */
  static async getActiveLoansFromMonitoring(): Promise<{
    success: boolean;
    data: any[] | null;
    error?: string;
  }> {
    try {
      console.log('🔍 Fetching active loans from monitoring table...');
      
      const activeStatuses = LoanStatusMappingService.getActiveLoanStatuses();
      const { data: loans, error } = await supabase
        .from('loans')
        .select('*')
        .in('status', activeStatuses.loans)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching active loans:', error);
        return { success: false, data: null, error: error.message };
      }

      console.log(`✅ Found ${loans?.length || 0} active loans in monitoring table`);
      return { success: true, data: loans || [] };

    } catch (error) {
      console.error('❌ Error fetching active loans:', error);
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Sync all disbursed loans and ensure data consistency
   * This is the main method that should be called to sync data
   */
  static async syncAllDisbursedLoans(): Promise<{
    success: boolean;
    synced: number;
    errors: string[];
  }> {
    try {
      console.log('🚀 Starting comprehensive loan sync process...');
      
      // First, sync disbursed loans to monitoring table
      const syncResult = await this.syncDisbursedLoansToMonitoring();
      
      if (!syncResult.success) {
        return syncResult;
      }

      // Then verify the sync by checking active loans
      const activeLoansResult = await this.getActiveLoansFromMonitoring();
      
      if (!activeLoansResult.success) {
        console.warn('⚠️ Could not verify sync, but sync process completed');
      } else {
        console.log(`✅ Sync verification: ${activeLoansResult.data?.length || 0} active loans found`);
      }

      return {
        success: true,
        synced: syncResult.synced,
        errors: syncResult.errors
      };

    } catch (error) {
      console.error('❌ Error in comprehensive sync process:', error);
      return {
        success: false,
        synced: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }
}
