/**
 * Loan Accounting Service
 * Handles automatic accounting entries for loan-related activities
 */

import { supabase } from '../lib/supabaseClient';

export interface LoanAccountingEntry {
  journalEntryId: string;
  entryNumber: string;
  entryDate: string;
  description: string;
  totalDebit: number;
  totalCredit: number;
  lines: {
    accountCode: string;
    accountName: string;
    debitAmount: number;
    creditAmount: number;
    description: string;
  }[];
}

export class LoanAccountingService {
  /**
   * Process loan disbursement accounting entry
   */
  static async processLoanDisbursement(loanData: {
    loanId: string;
    clientId: string;
    disbursedAmount: number;
    disbursementDate: string;
    interestRate: number;
    loanProductId: string;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🔄 Processing loan disbursement accounting entry:', loanData);

      // Get account IDs for loan disbursement
      const { data: grossLoansAccount } = await supabase
        .from('chart_of_accounts')
        .select('id, account_code, account_name')
        .eq('account_code', '1017')
        .single();

      const { data: cashAccount } = await supabase
        .from('chart_of_accounts')
        .select('id, account_code, account_name')
        .eq('account_code', '1001')
        .single();

      if (!grossLoansAccount || !cashAccount) {
        throw new Error('Required chart of accounts not found');
      }

      // Generate journal entry number
      const entryNumber = await this.generateJournalEntryNumber('LD');

      // Create journal entry
      const { data: journalEntry, error: journalError } = await supabase
        .from('journal_entries')
        .insert({
          entry_number: entryNumber,
          entry_date: loanData.disbursementDate,
          reference: `LOAN-${loanData.loanId}`,
          description: `Loan disbursement to client ${loanData.clientId}`,
          total_debit: loanData.disbursedAmount,
          total_credit: loanData.disbursedAmount,
          status: 'posted'
        })
        .select()
        .single();

      if (journalError) throw journalError;

      // Create journal entry lines
      const lines = [
        {
          journal_entry_id: journalEntry.id,
          account_id: grossLoansAccount.id,
          description: `Loan disbursement - Client ${loanData.clientId}`,
          debit_amount: loanData.disbursedAmount,
          credit_amount: 0
        },
        {
          journal_entry_id: journalEntry.id,
          account_id: cashAccount.id,
          description: `Loan disbursement - Client ${loanData.clientId}`,
          debit_amount: 0,
          credit_amount: loanData.disbursedAmount
        }
      ];

      const { error: linesError } = await supabase
        .from('journal_entry_lines')
        .insert(lines);

      if (linesError) throw linesError;

      // Post to general ledger
      await this.postToGeneralLedger(journalEntry.id);

      console.log('✅ Loan disbursement accounting entry created successfully');
      return { success: true };

    } catch (error) {
      console.error('❌ Error processing loan disbursement accounting:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Process interest accrual accounting entry
   */
  static async processInterestAccrual(loanData: {
    loanId: string;
    clientId: string;
    interestAmount: number;
    accrualDate: string;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🔄 Processing interest accrual accounting entry:', loanData);

      // Get account IDs
      const { data: accruedInterestAccount } = await supabase
        .from('chart_of_accounts')
        .select('id, account_code, account_name')
        .eq('account_code', '1018')
        .single();

      const { data: interestIncomeAccount } = await supabase
        .from('chart_of_accounts')
        .select('id, account_code, account_name')
        .eq('account_code', '4001')
        .single();

      if (!accruedInterestAccount || !interestIncomeAccount) {
        throw new Error('Required chart of accounts not found');
      }

      // Generate journal entry number
      const entryNumber = await this.generateJournalEntryNumber('IA');

      // Create journal entry
      const { data: journalEntry, error: journalError } = await supabase
        .from('journal_entries')
        .insert({
          entry_number: entryNumber,
          entry_date: loanData.accrualDate,
          reference: `LOAN-${loanData.loanId}`,
          description: `Interest accrual for loan ${loanData.loanId}`,
          total_debit: loanData.interestAmount,
          total_credit: loanData.interestAmount,
          status: 'posted'
        })
        .select()
        .single();

      if (journalError) throw journalError;

      // Create journal entry lines
      const lines = [
        {
          journal_entry_id: journalEntry.id,
          account_id: accruedInterestAccount.id,
          description: `Interest accrual - Loan ${loanData.loanId}`,
          debit_amount: loanData.interestAmount,
          credit_amount: 0
        },
        {
          journal_entry_id: journalEntry.id,
          account_id: interestIncomeAccount.id,
          description: `Interest accrual - Loan ${loanData.loanId}`,
          debit_amount: 0,
          credit_amount: loanData.interestAmount
        }
      ];

      const { error: linesError } = await supabase
        .from('journal_entry_lines')
        .insert(lines);

      if (linesError) throw linesError;

      // Post to general ledger
      await this.postToGeneralLedger(journalEntry.id);

      console.log('✅ Interest accrual accounting entry created successfully');
      return { success: true };

    } catch (error) {
      console.error('❌ Error processing interest accrual accounting:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Process interest collection accounting entry
   */
  static async processInterestCollection(repaymentData: {
    loanId: string;
    clientId: string;
    interestAmount: number;
    paymentDate: string;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🔄 Processing interest collection accounting entry:', repaymentData);

      // Get account IDs
      const { data: cashAccount } = await supabase
        .from('chart_of_accounts')
        .select('id, account_code, account_name')
        .eq('account_code', '1001')
        .single();

      const { data: accruedInterestAccount } = await supabase
        .from('chart_of_accounts')
        .select('id, account_code, account_name')
        .eq('account_code', '1018')
        .single();

      if (!cashAccount || !accruedInterestAccount) {
        throw new Error('Required chart of accounts not found');
      }

      // Generate journal entry number
      const entryNumber = await this.generateJournalEntryNumber('IC');

      // Create journal entry
      const { data: journalEntry, error: journalError } = await supabase
        .from('journal_entries')
        .insert({
          entry_number: entryNumber,
          entry_date: repaymentData.paymentDate,
          reference: `REPAY-${repaymentData.loanId}`,
          description: `Interest collection for loan ${repaymentData.loanId}`,
          total_debit: repaymentData.interestAmount,
          total_credit: repaymentData.interestAmount,
          status: 'posted'
        })
        .select()
        .single();

      if (journalError) throw journalError;

      // Create journal entry lines
      const lines = [
        {
          journal_entry_id: journalEntry.id,
          account_id: cashAccount.id,
          description: `Interest collection - Loan ${repaymentData.loanId}`,
          debit_amount: repaymentData.interestAmount,
          credit_amount: 0
        },
        {
          journal_entry_id: journalEntry.id,
          account_id: accruedInterestAccount.id,
          description: `Interest collection - Loan ${repaymentData.loanId}`,
          debit_amount: 0,
          credit_amount: repaymentData.interestAmount
        }
      ];

      const { error: linesError } = await supabase
        .from('journal_entry_lines')
        .insert(lines);

      if (linesError) throw linesError;

      // Post to general ledger
      await this.postToGeneralLedger(journalEntry.id);

      console.log('✅ Interest collection accounting entry created successfully');
      return { success: true };

    } catch (error) {
      console.error('❌ Error processing interest collection accounting:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Process principal repayment accounting entry
   */
  static async processPrincipalRepayment(repaymentData: {
    loanId: string;
    clientId: string;
    principalAmount: number;
    paymentDate: string;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🔄 Processing principal repayment accounting entry:', repaymentData);

      // Get account IDs
      const { data: cashAccount } = await supabase
        .from('chart_of_accounts')
        .select('id, account_code, account_name')
        .eq('account_code', '1001')
        .single();

      const { data: grossLoansAccount } = await supabase
        .from('chart_of_accounts')
        .select('id, account_code, account_name')
        .eq('account_code', '1017')
        .single();

      if (!cashAccount || !grossLoansAccount) {
        throw new Error('Required chart of accounts not found');
      }

      // Generate journal entry number
      const entryNumber = await this.generateJournalEntryNumber('PR');

      // Create journal entry
      const { data: journalEntry, error: journalError } = await supabase
        .from('journal_entries')
        .insert({
          entry_number: entryNumber,
          entry_date: repaymentData.paymentDate,
          reference: `REPAY-${repaymentData.loanId}`,
          description: `Principal repayment for loan ${repaymentData.loanId}`,
          total_debit: repaymentData.principalAmount,
          total_credit: repaymentData.principalAmount,
          status: 'posted'
        })
        .select()
        .single();

      if (journalError) throw journalError;

      // Create journal entry lines
      const lines = [
        {
          journal_entry_id: journalEntry.id,
          account_id: cashAccount.id,
          description: `Principal repayment - Loan ${repaymentData.loanId}`,
          debit_amount: repaymentData.principalAmount,
          credit_amount: 0
        },
        {
          journal_entry_id: journalEntry.id,
          account_id: grossLoansAccount.id,
          description: `Principal repayment - Loan ${repaymentData.loanId}`,
          debit_amount: 0,
          credit_amount: repaymentData.principalAmount
        }
      ];

      const { error: linesError } = await supabase
        .from('journal_entry_lines')
        .insert(lines);

      if (linesError) throw linesError;

      // Post to general ledger
      await this.postToGeneralLedger(journalEntry.id);

      console.log('✅ Principal repayment accounting entry created successfully');
      return { success: true };

    } catch (error) {
      console.error('❌ Error processing principal repayment accounting:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Process loan loss provision accounting entry
   */
  static async processLoanLossProvision(provisionData: {
    loanId: string;
    clientId: string;
    provisionAmount: number;
    provisionDate: string;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🔄 Processing loan loss provision accounting entry:', provisionData);

      // Get account IDs
      const { data: provisionExpenseAccount } = await supabase
        .from('chart_of_accounts')
        .select('id, account_code, account_name')
        .eq('account_code', '5005')
        .single();

      const { data: provisionAccount } = await supabase
        .from('chart_of_accounts')
        .select('id, account_code, account_name')
        .eq('account_code', '1022')
        .single();

      if (!provisionExpenseAccount || !provisionAccount) {
        throw new Error('Required chart of accounts not found');
      }

      // Generate journal entry number
      const entryNumber = await this.generateJournalEntryNumber('LP');

      // Create journal entry
      const { data: journalEntry, error: journalError } = await supabase
        .from('journal_entries')
        .insert({
          entry_number: entryNumber,
          entry_date: provisionData.provisionDate,
          reference: `PROV-${provisionData.loanId}`,
          description: `Loan loss provision for loan ${provisionData.loanId}`,
          total_debit: provisionData.provisionAmount,
          total_credit: provisionData.provisionAmount,
          status: 'posted'
        })
        .select()
        .single();

      if (journalError) throw journalError;

      // Create journal entry lines
      const lines = [
        {
          journal_entry_id: journalEntry.id,
          account_id: provisionExpenseAccount.id,
          description: `Loan loss provision - Loan ${provisionData.loanId}`,
          debit_amount: provisionData.provisionAmount,
          credit_amount: 0
        },
        {
          journal_entry_id: journalEntry.id,
          account_id: provisionAccount.id,
          description: `Loan loss provision - Loan ${provisionData.loanId}`,
          debit_amount: 0,
          credit_amount: provisionData.provisionAmount
        }
      ];

      const { error: linesError } = await supabase
        .from('journal_entry_lines')
        .insert(lines);

      if (linesError) throw linesError;

      // Post to general ledger
      await this.postToGeneralLedger(journalEntry.id);

      console.log('✅ Loan loss provision accounting entry created successfully');
      return { success: true };

    } catch (error) {
      console.error('❌ Error processing loan loss provision accounting:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Generate unique journal entry number
   */
  private static async generateJournalEntryNumber(prefix: string): Promise<string> {
    const { data: lastEntry } = await supabase
      .from('journal_entries')
      .select('entry_number')
      .like('entry_number', `${prefix}-%`)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!lastEntry) {
      return `${prefix}-001`;
    }

    const lastNumber = parseInt(lastEntry.entry_number.split('-')[1]);
    const nextNumber = (lastNumber + 1).toString().padStart(3, '0');
    return `${prefix}-${nextNumber}`;
  }

  /**
   * Post journal entry to general ledger
   */
  private static async postToGeneralLedger(journalEntryId: string): Promise<void> {
    // Get journal entry details
    const { data: journalEntry } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('id', journalEntryId)
      .single();

    if (!journalEntry) return;

    // Get journal entry lines
    const { data: lines } = await supabase
      .from('journal_entry_lines')
      .select('*')
      .eq('journal_entry_id', journalEntryId);

    if (!lines) return;

    // Process each line
    for (const line of lines) {
      // Calculate running balance for the account
      const { data: lastEntry } = await supabase
        .from('general_ledger')
        .select('running_balance')
        .eq('account_id', line.account_id)
        .order('entry_date', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      const previousBalance = lastEntry?.running_balance || 0;
      const runningBalance = previousBalance + line.debit_amount - line.credit_amount;

      // Insert into general ledger
      await supabase
        .from('general_ledger')
        .insert({
          account_id: line.account_id,
          entry_date: journalEntry.entry_date,
          journal_entry_id: journalEntryId,
          description: line.description,
          debit_amount: line.debit_amount,
          credit_amount: line.credit_amount,
          running_balance: runningBalance
        });
    }
  }
}

export default LoanAccountingService;




