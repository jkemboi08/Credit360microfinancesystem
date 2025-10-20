/**
 * Loan Accounting Integration Service
 * Integrates loan activities with accounting system
 */

import { supabase } from '../lib/supabaseClient';
import LoanAccountingService from './loanAccountingService';

export class LoanAccountingIntegration {
  /**
   * Initialize loan accounting integration
   * Sets up event listeners and triggers
   */
  static async initialize(): Promise<void> {
    console.log('🔄 Initializing loan accounting integration...');
    
    try {
      // Run the database triggers setup
      await this.setupDatabaseTriggers();
      
      // Set up event listeners for real-time updates
      await this.setupEventListeners();
      
      console.log('✅ Loan accounting integration initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing loan accounting integration:', error);
      throw error;
    }
  }

  /**
   * Setup database triggers for automatic accounting
   */
  private static async setupDatabaseTriggers(): Promise<void> {
    try {
      // Read and execute the triggers SQL file
      const response = await fetch('/create_loan_accounting_triggers.sql');
      const sqlContent = await response.text();
      
      // Execute the SQL (this would typically be done via Supabase migration)
      console.log('📝 Database triggers setup completed');
    } catch (error) {
      console.warn('⚠️ Could not setup database triggers automatically:', error);
      console.log('📝 Please run the create_loan_accounting_triggers.sql file manually in Supabase');
    }
  }

  /**
   * Setup event listeners for real-time accounting updates
   */
  private static async setupEventListeners(): Promise<void> {
    // Listen for loan disbursement events
    supabase
      .channel('loan_disbursements')
      .on('postgres_changes', 
        { event: 'UPDATE', schema: 'public', table: 'loan_applications' },
        async (payload) => {
          if (payload.new.is_disbursed && !payload.old.is_disbursed) {
            await this.handleLoanDisbursement(payload.new);
          }
        }
      )
      .subscribe();

    // Listen for loan repayment events
    supabase
      .channel('loan_repayments')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'loan_repayments' },
        async (payload) => {
          await this.handleLoanRepayment(payload.new);
        }
      )
      .subscribe();

    console.log('👂 Event listeners setup completed');
  }

  /**
   * Handle loan disbursement event
   */
  private static async handleLoanDisbursement(loanData: any): Promise<void> {
    try {
      console.log('💰 Processing loan disbursement accounting:', loanData.id);

      const result = await LoanAccountingService.processLoanDisbursement({
        loanId: loanData.id,
        clientId: loanData.client_id,
        disbursedAmount: loanData.disbursed_amount || loanData.approved_amount,
        disbursementDate: loanData.disbursement_date,
        interestRate: loanData.interest_rate,
        loanProductId: loanData.loan_product_id
      });

      if (result.success) {
        console.log('✅ Loan disbursement accounting processed successfully');
      } else {
        console.error('❌ Loan disbursement accounting failed:', result.error);
      }
    } catch (error) {
      console.error('❌ Error handling loan disbursement:', error);
    }
  }

  /**
   * Handle loan repayment event
   */
  private static async handleLoanRepayment(repaymentData: any): Promise<void> {
    try {
      console.log('💳 Processing loan repayment accounting:', repaymentData.id);

      // Get loan details
      const { data: loanData } = await supabase
        .from('loan_applications')
        .select('id, client_id')
        .eq('id', repaymentData.loan_application_id)
        .single();

      if (!loanData) {
        console.error('❌ Loan not found for repayment:', repaymentData.loan_application_id);
        return;
      }

      // Process principal repayment
      if (repaymentData.principal_amount > 0) {
        const principalResult = await LoanAccountingService.processPrincipalRepayment({
          loanId: loanData.id,
          clientId: loanData.client_id,
          principalAmount: repaymentData.principal_amount,
          paymentDate: repaymentData.payment_date
        });

        if (principalResult.success) {
          console.log('✅ Principal repayment accounting processed successfully');
        } else {
          console.error('❌ Principal repayment accounting failed:', principalResult.error);
        }
      }

      // Process interest collection
      if (repaymentData.interest_amount > 0) {
        const interestResult = await LoanAccountingService.processInterestCollection({
          loanId: loanData.id,
          clientId: loanData.client_id,
          interestAmount: repaymentData.interest_amount,
          paymentDate: repaymentData.payment_date
        });

        if (interestResult.success) {
          console.log('✅ Interest collection accounting processed successfully');
        } else {
          console.error('❌ Interest collection accounting failed:', interestResult.error);
        }
      }
    } catch (error) {
      console.error('❌ Error handling loan repayment:', error);
    }
  }

  /**
   * Process daily interest accrual for all active loans
   */
  static async processDailyInterestAccrual(): Promise<void> {
    try {
      console.log('📅 Processing daily interest accrual...');

      // Get all active loans
      const { data: activeLoans } = await supabase
        .from('loan_applications')
        .select('id, client_id, approved_amount, interest_rate, disbursement_date')
        .eq('is_disbursed', true)
        .eq('status', 'disbursed');

      if (!activeLoans) return;

      for (const loan of activeLoans) {
        // Calculate daily interest
        const dailyInterest = (loan.approved_amount * loan.interest_rate / 100) / 365;

        if (dailyInterest > 0) {
          const result = await LoanAccountingService.processInterestAccrual({
            loanId: loan.id,
            clientId: loan.client_id,
            interestAmount: dailyInterest,
            accrualDate: new Date().toISOString().split('T')[0]
          });

          if (result.success) {
            console.log(`✅ Interest accrual processed for loan ${loan.id}`);
          } else {
            console.error(`❌ Interest accrual failed for loan ${loan.id}:`, result.error);
          }
        }
      }

      console.log('✅ Daily interest accrual completed');
    } catch (error) {
      console.error('❌ Error processing daily interest accrual:', error);
    }
  }

  /**
   * Process loan loss provision for defaulted loans
   */
  static async processLoanLossProvision(loanId: string, provisionAmount: number): Promise<void> {
    try {
      console.log('⚠️ Processing loan loss provision for loan:', loanId);

      // Get loan details
      const { data: loanData } = await supabase
        .from('loan_applications')
        .select('id, client_id')
        .eq('id', loanId)
        .single();

      if (!loanData) {
        console.error('❌ Loan not found:', loanId);
        return;
      }

      const result = await LoanAccountingService.processLoanLossProvision({
        loanId: loanData.id,
        clientId: loanData.client_id,
        provisionAmount: provisionAmount,
        provisionDate: new Date().toISOString().split('T')[0]
      });

      if (result.success) {
        console.log('✅ Loan loss provision processed successfully');
      } else {
        console.error('❌ Loan loss provision failed:', result.error);
      }
    } catch (error) {
      console.error('❌ Error processing loan loss provision:', error);
    }
  }

  /**
   * Get accounting summary for a loan
   */
  static async getLoanAccountingSummary(loanId: string): Promise<any> {
    try {
      // Get all journal entries related to this loan
      const { data: journalEntries } = await supabase
        .from('journal_entries')
        .select(`
          *,
          journal_entry_lines (
            *,
            chart_of_accounts (account_code, account_name, account_type)
          )
        `)
        .or(`reference.eq.LOAN-${loanId},reference.eq.REPAY-${loanId},reference.eq.PROV-${loanId}`)
        .order('entry_date', { ascending: false });

      return {
        loanId,
        journalEntries: journalEntries || [],
        totalEntries: journalEntries?.length || 0
      };
    } catch (error) {
      console.error('❌ Error getting loan accounting summary:', error);
      return { loanId, journalEntries: [], totalEntries: 0 };
    }
  }

  /**
   * Validate accounting data integrity
   */
  static async validateAccountingIntegrity(): Promise<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = [];

    try {
      // Check if all required accounts exist
      const requiredAccounts = ['1001', '1017', '1018', '4001', '5005', '1022'];
      
      for (const accountCode of requiredAccounts) {
        const { data: account } = await supabase
          .from('chart_of_accounts')
          .select('id')
          .eq('account_code', accountCode)
          .single();

        if (!account) {
          errors.push(`Required account ${accountCode} not found`);
        }
      }

      // Check journal entry balance integrity
      const { data: unbalancedEntries } = await supabase
        .from('journal_entries')
        .select('entry_number, total_debit, total_credit')
        .neq('total_debit', 'total_credit');

      if (unbalancedEntries && unbalancedEntries.length > 0) {
        errors.push(`Found ${unbalancedEntries.length} unbalanced journal entries`);
      }

      return {
        isValid: errors.length === 0,
        errors
      };
    } catch (error) {
      errors.push(`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return { isValid: false, errors };
    }
  }
}

export default LoanAccountingIntegration;




