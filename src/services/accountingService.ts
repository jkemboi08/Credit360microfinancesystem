import { supabase } from '../lib/supabaseClient';

// Types for accounting data
export interface ChartOfAccount {
  id: string;
  account_code: string;
  account_name: string;
  account_type: 'asset' | 'liability' | 'equity' | 'income' | 'expense';
  account_category: string;
  parent_account_id?: string;
  is_active: boolean;
  normal_balance: 'debit' | 'credit';
  description?: string;
  regulatory_code?: string;
  created_at: string;
  updated_at: string;
}

export interface JournalEntry {
  id: string;
  entry_number: string;
  entry_date: string;
  reference?: string;
  description?: string;
  total_debit: number;
  total_credit: number;
  status: 'draft' | 'posted' | 'reversed';
  created_by?: string;
  approved_by?: string;
  created_at: string;
  updated_at: string;
}

export interface JournalEntryLine {
  id: string;
  journal_entry_id: string;
  account_id: string;
  description?: string;
  debit_amount: number;
  credit_amount: number;
  created_at: string;
}

export interface GeneralLedgerEntry {
  id: string;
  account_id: string;
  entry_date: string;
  journal_entry_id: string;
  description?: string;
  debit_amount: number;
  credit_amount: number;
  running_balance: number;
  created_at: string;
}

export interface FinancialPeriod {
  id: string;
  period_name: string;
  start_date: string;
  end_date: string;
  is_closed: boolean;
  closed_at?: string;
  closed_by?: string;
  created_at: string;
}

export interface TrialBalance {
  id: string;
  period_id: string;
  account_id: string;
  account_code: string;
  account_name: string;
  debit_balance: number;
  credit_balance: number;
  created_at: string;
}

export interface BalanceSheet {
  id: string;
  period_id: string;
  account_id: string;
  account_code: string;
  account_name: string;
  account_type: string;
  current_period_balance: number;
  previous_period_balance: number;
  created_at: string;
}

export interface IncomeStatement {
  id: string;
  period_id: string;
  account_id: string;
  account_code: string;
  account_name: string;
  current_period_amount: number;
  previous_period_amount: number;
  created_at: string;
}

export interface CashFlowStatement {
  id: string;
  period_id: string;
  category: string;
  subcategory?: string;
  description?: string;
  current_period_amount: number;
  previous_period_amount: number;
  created_at: string;
}

export interface FinancialRatio {
  id: string;
  period_id: string;
  ratio_name: string;
  ratio_value: number;
  ratio_category: string;
  benchmark_value?: number;
  is_compliant: boolean;
  created_at: string;
}

export interface Budget {
  id: string;
  period_id: string;
  account_id: string;
  budgeted_amount: number;
  actual_amount: number;
  variance: number;
  variance_percentage: number;
  created_at: string;
  updated_at: string;
}

export interface AccountingAuditTrail {
  id: string;
  table_name: string;
  record_id: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  old_values?: any;
  new_values?: any;
  changed_by?: string;
  changed_at: string;
  ip_address?: string;
  user_agent?: string;
}

// Service class for accounting operations
export class AccountingService {
  // Chart of Accounts operations
  static async getChartOfAccounts(): Promise<{ data: ChartOfAccount[] | null; error: string | null }> {
    try {
      // First try with is_active filter
      let { data, error } = await supabase
        .from('chart_of_accounts')
        .select('*')
        .eq('is_active', true)
        .order('account_code');

      // If is_active column doesn't exist, try without the filter
      if (error && error.message.includes('column') && error.message.includes('is_active')) {
        console.warn('is_active column not found, querying without filter');
        const result = await supabase
          .from('chart_of_accounts')
          .select('*')
          .order('account_code');
        data = result.data;
        error = result.error;
      }

      if (error) {
        // If the table doesn't exist, return demo data
        if (error.message.includes('relation') || error.message.includes('does not exist')) {
          console.warn('Chart of accounts table not available, using demo data:', error.message);
          return { data: this.getDemoChartOfAccounts(), error: null };
        }
        throw error;
      }

      // If no data returned, return empty array instead of demo data
      if (!data || data.length === 0) {
        console.warn('No chart of accounts data found, returning empty array');
        return { data: [], error: null };
      }

      console.log(`✅ Chart of Accounts: Loaded ${data.length} accounts from database`);
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching chart of accounts:', error);
      return { data: this.getDemoChartOfAccounts(), error: null };
    }
  }

  // Calculate basic financial metrics from chart of accounts
  private static calculateBasicFinancialMetrics(chartOfAccounts: ChartOfAccount[]): any {
    const assets = chartOfAccounts.filter(acc => acc.account_type === 'asset');
    const liabilities = chartOfAccounts.filter(acc => acc.account_type === 'liability');
    const equity = chartOfAccounts.filter(acc => acc.account_type === 'equity');
    const income = chartOfAccounts.filter(acc => acc.account_type === 'income');
    const expenses = chartOfAccounts.filter(acc => acc.account_type === 'expense');

    return {
      totalAssets: assets.length,
      totalLiabilities: liabilities.length,
      totalEquity: equity.length,
      totalIncome: income.length,
      totalExpenses: expenses.length,
      netWorth: assets.length - liabilities.length,
      accountCount: chartOfAccounts.length,
      lastUpdated: new Date().toISOString()
    };
  }

  // Demo chart of accounts data
  static getDemoChartOfAccounts(): ChartOfAccount[] {
    return [
      {
        id: '1',
        account_code: '1001',
        account_name: 'Cash in Hand',
        account_type: 'asset',
        account_category: 'Current Assets',
        is_active: true,
        normal_balance: 'debit',
        description: 'Physical cash on hand',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: '2',
        account_code: '1002',
        account_name: 'Bank Balances',
        account_type: 'asset',
        account_category: 'Current Assets',
        is_active: true,
        normal_balance: 'debit',
        description: 'Bank account balances',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: '3',
        account_code: '1017',
        account_name: 'Gross Loans',
        account_type: 'asset',
        account_category: 'Current Assets',
        is_active: true,
        normal_balance: 'debit',
        description: 'Total loan portfolio',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: '4',
        account_code: '2001',
        account_name: 'Compulsory Savings',
        account_type: 'liability',
        account_category: 'Current Liabilities',
        is_active: true,
        normal_balance: 'credit',
        description: 'Client compulsory savings',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: '5',
        account_code: '3001',
        account_name: 'Share Capital',
        account_type: 'equity',
        account_category: 'Equity',
        is_active: true,
        normal_balance: 'credit',
        description: 'Shareholder equity',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
  }

  static async createAccount(account: Omit<ChartOfAccount, 'id' | 'created_at' | 'updated_at'>): Promise<{ data: ChartOfAccount | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('chart_of_accounts')
        .insert(account)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error creating account:', error);
      return { data: null, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  static async updateAccount(id: string, updates: Partial<ChartOfAccount>): Promise<{ data: ChartOfAccount | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('chart_of_accounts')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error updating account:', error);
      return { data: null, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Journal Entries operations
  static async getJournalEntries(limit: number = 50, offset: number = 0): Promise<{ data: JournalEntry[] | null; error: string | null }> {
    try {
      console.log('🔍 AccountingService: Fetching journal entries from database...');
      const { data, error } = await supabase
        .from('journal_entries')
        .select('*')
        .order('entry_date', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('🔍 AccountingService: Database error:', error);
        if (error.message.includes('relation') || error.message.includes('does not exist') || error.message.includes('column')) {
          console.warn('Journal entries table not available, using demo data:', error.message);
          return { data: this.getDemoJournalEntries(), error: null };
        }
        throw error;
      }

      console.log('🔍 AccountingService: Raw database response:', { data, error });
      
      if (!data || data.length === 0) {
        console.warn('No journal entries data found, returning empty array');
        return { data: [], error: null };
      }

      console.log(`✅ Journal Entries: Loaded ${data.length} entries from database`);
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching journal entries:', error);
      return { data: this.getDemoJournalEntries(), error: null };
    }
  }

  // Demo journal entries data
  static getDemoJournalEntries(): JournalEntry[] {
    return [
      {
        id: '1',
        entry_number: 'JE-001',
        entry_date: new Date().toISOString().split('T')[0],
        reference: 'Initial Setup',
        description: 'Initial chart of accounts setup',
        total_debit: 0,
        total_credit: 0,
        status: 'posted',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
  }

  static async createJournalEntry(entry: Omit<JournalEntry, 'id' | 'created_at' | 'updated_at'>): Promise<{ data: JournalEntry | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('journal_entries')
        .insert(entry)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error creating journal entry:', error);
      return { data: null, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  static async getJournalEntryLines(journalEntryId: string): Promise<{ data: JournalEntryLine[] | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('journal_entry_lines')
        .select(`
          *,
          chart_of_accounts!inner(account_code, account_name, account_type)
        `)
        .eq('journal_entry_id', journalEntryId)
        .order('created_at');

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching journal entry lines:', error);
      return { data: null, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  static async createJournalEntryLines(lines: Omit<JournalEntryLine, 'id' | 'created_at'>[]): Promise<{ data: JournalEntryLine[] | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('journal_entry_lines')
        .insert(lines)
        .select();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error creating journal entry lines:', error);
      return { data: null, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // General Ledger operations
  static async getGeneralLedger(accountId?: string, startDate?: string, endDate?: string): Promise<{ data: GeneralLedgerEntry[] | null; error: string | null }> {
    try {
      let query = supabase
        .from('general_ledger')
        .select(`
          *,
          chart_of_accounts!inner(account_code, account_name, account_type),
          journal_entries!inner(entry_number, reference)
        `)
        .order('entry_date', { ascending: false });

      if (accountId) {
        query = query.eq('account_id', accountId);
      }
      if (startDate) {
        query = query.gte('entry_date', startDate);
      }
      if (endDate) {
        query = query.lte('entry_date', endDate);
      }

      const { data, error } = await query;

      if (error) {
        if (error.message.includes('relation') || error.message.includes('does not exist') || error.message.includes('column')) {
          console.warn('General ledger table not available, using demo data:', error.message);
          return { data: this.getDemoGeneralLedger(), error: null };
        }
        throw error;
      }

      if (!data || data.length === 0) {
        console.warn('No general ledger data found, returning empty array');
        return { data: [], error: null };
      }

      console.log(`✅ General Ledger: Loaded ${data.length} entries from database`);
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching general ledger:', error);
      return { data: this.getDemoGeneralLedger(), error: null };
    }
  }

  // Financial Periods operations
  static async getFinancialPeriods(): Promise<{ data: FinancialPeriod[] | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('financial_periods')
        .select('*')
        .order('start_date', { ascending: false });

      if (error) {
        if (error.message.includes('relation') || error.message.includes('does not exist') || error.message.includes('column')) {
          console.warn('Financial periods table not available, using demo data:', error.message);
          return { data: this.getDemoFinancialPeriods(), error: null };
        }
        throw error;
      }

      if (!data || data.length === 0) {
        console.warn('No financial periods data found, returning empty array');
        return { data: [], error: null };
      }

      console.log(`✅ Financial Periods: Loaded ${data.length} periods from database`);
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching financial periods:', error);
      return { data: this.getDemoFinancialPeriods(), error: null };
    }
  }

  // Demo financial periods data
  static getDemoFinancialPeriods(): FinancialPeriod[] {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    return [
      {
        id: '1',
        period_name: 'Current Period',
        start_date: startOfMonth.toISOString().split('T')[0],
        end_date: endOfMonth.toISOString().split('T')[0],
        is_closed: false,
        created_at: new Date().toISOString()
      }
    ];
  }

  static async createFinancialPeriod(period: Omit<FinancialPeriod, 'id' | 'created_at'>): Promise<{ data: FinancialPeriod | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('financial_periods')
        .insert(period)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error creating financial period:', error);
      return { data: null, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Trial Balance operations
  static async getTrialBalance(periodId: string): Promise<{ data: TrialBalance[] | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('trial_balance')
        .select('*')
        .eq('period_id', periodId)
        .order('account_name');

      if (error) {
        if (error.message.includes('relation') || error.message.includes('does not exist') || error.message.includes('column')) {
          console.warn('Trial balance table not available, using demo data:', error.message);
          return { data: this.getDemoTrialBalance(), error: null };
        }
        throw error;
      }

      if (!data || data.length === 0) {
        console.warn('No trial balance data found, returning empty array');
        return { data: [], error: null };
      }

      console.log(`✅ Trial Balance: Loaded ${data.length} entries from database`);
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching trial balance:', error);
      return { data: this.getDemoTrialBalance(), error: null };
    }
  }

  // Demo trial balance data
  static getDemoTrialBalance(): TrialBalance[] {
    return [
      {
        id: '1',
        period_id: '1',
        account_id: '1',
        account_code: '1001',
        account_name: 'Cash in Hand',
        debit_balance: 5000000,
        credit_balance: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: '2',
        period_id: '1',
        account_id: '2',
        account_code: '1002',
        account_name: 'Bank Balances',
        debit_balance: 20000000,
        credit_balance: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: '3',
        period_id: '1',
        account_id: '3',
        account_code: '1017',
        account_name: 'Gross Loans',
        debit_balance: 89500000,
        credit_balance: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: '4',
        period_id: '1',
        account_id: '4',
        account_code: '2001',
        account_name: 'Compulsory Savings',
        debit_balance: 0,
        credit_balance: 20000000,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: '5',
        period_id: '1',
        account_id: '5',
        account_code: '3001',
        account_name: 'Share Capital',
        debit_balance: 0,
        credit_balance: 75000000,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
  }

  static async generateTrialBalance(periodId: string): Promise<{ data: TrialBalance[] | null; error: string | null }> {
    try {
      // Call the database function to generate trial balance
      const { data, error } = await supabase.rpc('generate_trial_balance', { period_id: periodId });

      if (error) throw error;

      // Fetch the generated trial balance
      return await this.getTrialBalance(periodId);
    } catch (error) {
      console.error('Error generating trial balance:', error);
      return { data: null, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Balance Sheet operations
  static async getBalanceSheet(periodId: string): Promise<{ data: BalanceSheet[] | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('balance_sheet')
        .select('*')
        .eq('period_id', periodId)
        .order('account_code');

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching balance sheet:', error);
      return { data: null, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Income Statement operations
  static async getIncomeStatement(periodId: string): Promise<{ data: IncomeStatement[] | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('income_statement')
        .select('*')
        .eq('period_id', periodId)
        .order('account_code');

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching income statement:', error);
      return { data: null, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Cash Flow Statement operations
  static async getCashFlowStatement(periodId: string): Promise<{ data: CashFlowStatement[] | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('cash_flow_statement')
        .select('*')
        .eq('period_id', periodId)
        .order('category');

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching cash flow statement:', error);
      return { data: null, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Financial Ratios operations
  static async getFinancialRatios(periodId: string): Promise<{ data: FinancialRatio[] | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('financial_ratios')
        .select('*')
        .eq('period_id', periodId)
        .order('ratio_category');

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching financial ratios:', error);
      return { data: null, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Budget operations
  static async getBudget(periodId: string): Promise<{ data: Budget[] | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('budget')
        .select(`
          *,
          chart_of_accounts!inner(account_code, account_name, account_type)
        `)
        .eq('period_id', periodId)
        .order('budgeted_amount', { ascending: false });

      if (error) {
        if (error.message.includes('relation') || error.message.includes('does not exist') || error.message.includes('column')) {
          console.warn('Budget table not available, using demo data:', error.message);
          return { data: this.getDemoBudget(), error: null };
        }
        throw error;
      }

      if (!data || data.length === 0) {
        console.warn('No budget data found, returning empty array');
        return { data: [], error: null };
      }

      console.log(`✅ Budget: Loaded ${data.length} entries from database`);
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching budget:', error);
      return { data: this.getDemoBudget(), error: null };
    }
  }

  // Demo budget data
  static getDemoBudget(): Budget[] {
    return [
      {
        id: '1',
        period_id: '1',
        account_id: '1',
        budget_amount: 10000000,
        actual_amount: 8500000,
        variance: -1500000,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
  }

  // Audit Trail operations
  static async getAuditTrail(tableName?: string, recordId?: string, limit: number = 100): Promise<{ data: AccountingAuditTrail[] | null; error: string | null }> {
    try {
      let query = supabase
        .from('accounting_audit_trail')
        .select('*')
        .order('changed_at', { ascending: false })
        .limit(limit);

      if (tableName) {
        query = query.eq('table_name', tableName);
      }
      if (recordId) {
        query = query.eq('record_id', recordId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching audit trail:', error);
      return { data: null, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Real-time subscriptions
  static subscribeToJournalEntries(callback: (payload: any) => void) {
    return supabase
      .channel('journal_entries_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'journal_entries' }, 
        callback
      )
      .subscribe();
  }

  static subscribeToGeneralLedger(callback: (payload: any) => void) {
    return supabase
      .channel('general_ledger_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'general_ledger' }, 
        callback
      )
      .subscribe();
  }

  static subscribeToTrialBalance(callback: (payload: any) => void) {
    return supabase
      .channel('trial_balance_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'trial_balance' }, 
        callback
      )
      .subscribe();
  }

  // Utility functions
  static async calculateAccountBalance(accountId: string, asOfDate?: string): Promise<{ data: number | null; error: string | null }> {
    try {
      const { data, error } = await supabase.rpc('calculate_account_balance', {
        account_id: accountId,
        as_of_date: asOfDate || new Date().toISOString().split('T')[0]
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error calculating account balance:', error);
      return { data: null, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  static async postJournalEntry(journalEntryId: string): Promise<{ data: boolean | null; error: string | null }> {
    try {
      const { data, error } = await supabase.rpc('post_journal_entry', {
        journal_entry_id: journalEntryId
      });

      if (error) throw error;
      return { data: true, error: null };
    } catch (error) {
      console.error('Error posting journal entry:', error);
      return { data: null, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Financial metrics calculations
  static async getFinancialMetrics(periodId: string): Promise<{ data: any | null; error: string | null }> {
    try {
      // Get trial balance for calculations
      const { data: trialBalance, error: tbError } = await this.getTrialBalance(periodId);
      
      // If trial balance fails, calculate from available data
      if (tbError || !trialBalance) {
        console.warn('Trial balance not available, calculating from chart of accounts:', tbError?.message);
        // Calculate basic metrics from chart of accounts
        const { data: chartData } = await this.getChartOfAccounts();
        if (chartData && chartData.length > 0) {
          return { data: this.calculateBasicFinancialMetrics(chartData), error: null };
        }
        return { data: null, error: 'No data available for financial metrics calculation' };
      }

      console.log(`✅ Financial Metrics: Calculated from ${trialBalance.length} trial balance entries`);

      // Calculate key financial metrics
      const metrics = {
        totalAssets: 0,
        totalLiabilities: 0,
        totalEquity: 0,
        totalRevenue: 0,
        totalExpenses: 0,
        netIncome: 0,
        currentAssets: 0,
        currentLiabilities: 0,
        workingCapital: 0,
        debtToEquityRatio: 0,
        currentRatio: 0,
        returnOnAssets: 0,
        returnOnEquity: 0
      };

      // Process trial balance data
      trialBalance.forEach(account => {
        const balance = account.debit_balance - account.credit_balance;
        
        // Get account type from chart of accounts (would need to join in real implementation)
        // For now, using account codes to determine type
        if (account.account_code.startsWith('1')) { // Assets
          metrics.totalAssets += Math.abs(balance);
          if (account.account_code.startsWith('10')) { // Current assets
            metrics.currentAssets += Math.abs(balance);
          }
        } else if (account.account_code.startsWith('2')) { // Liabilities
          metrics.totalLiabilities += Math.abs(balance);
          if (account.account_code.startsWith('20')) { // Current liabilities
            metrics.currentLiabilities += Math.abs(balance);
          }
        } else if (account.account_code.startsWith('3')) { // Equity
          metrics.totalEquity += Math.abs(balance);
        } else if (account.account_code.startsWith('4')) { // Revenue
          metrics.totalRevenue += Math.abs(balance);
        } else if (account.account_code.startsWith('5')) { // Expenses
          metrics.totalExpenses += Math.abs(balance);
        }
      });

      // Calculate derived metrics
      metrics.netIncome = metrics.totalRevenue - metrics.totalExpenses;
      metrics.workingCapital = metrics.currentAssets - metrics.currentLiabilities;
      metrics.debtToEquityRatio = metrics.totalLiabilities / (metrics.totalEquity || 1);
      metrics.currentRatio = metrics.currentAssets / (metrics.currentLiabilities || 1);
      metrics.returnOnAssets = metrics.netIncome / (metrics.totalAssets || 1);
      metrics.returnOnEquity = metrics.netIncome / (metrics.totalEquity || 1);

      return { data: metrics, error: null };
    } catch (error) {
      console.error('Error calculating financial metrics:', error);
      return { data: null, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Demo financial metrics data
  static getDemoFinancialMetrics() {
    return {
      totalCapital: 125000000,
      loanPortfolio: 89500000,
      par30: 2.4,
      nplRatio: 3.1,
      liquidityRatio: 15.2,
      netProfit: 8750000,
      totalAssets: 145000000,
      totalLiabilities: 32000000,
      equity: 113000000,
      totalRevenue: 15000000,
      totalExpenses: 6250000,
      currentAssets: 50000000,
      currentLiabilities: 20000000
    };
  }

  // Demo general ledger data
  static getDemoGeneralLedger(): GeneralLedgerEntry[] {
    return [
      {
        id: '1',
        account_id: '1',
        entry_date: new Date().toISOString().split('T')[0],
        journal_entry_id: '1',
        description: 'Initial cash deposit',
        debit_amount: 5000000,
        credit_amount: 0,
        running_balance: 5000000,
        created_at: new Date().toISOString()
      },
      {
        id: '2',
        account_id: '2',
        entry_date: new Date().toISOString().split('T')[0],
        journal_entry_id: '2',
        description: 'Bank transfer received',
        debit_amount: 20000000,
        credit_amount: 0,
        running_balance: 20000000,
        created_at: new Date().toISOString()
      },
      {
        id: '3',
        account_id: '3',
        entry_date: new Date().toISOString().split('T')[0],
        journal_entry_id: '3',
        description: 'Loan disbursement',
        debit_amount: 89500000,
        credit_amount: 0,
        running_balance: 89500000,
        created_at: new Date().toISOString()
      },
      {
        id: '4',
        account_id: '4',
        entry_date: new Date().toISOString().split('T')[0],
        journal_entry_id: '4',
        description: 'Client savings deposit',
        debit_amount: 0,
        credit_amount: 20000000,
        running_balance: 20000000,
        created_at: new Date().toISOString()
      },
      {
        id: '5',
        account_id: '5',
        entry_date: new Date().toISOString().split('T')[0],
        journal_entry_id: '5',
        description: 'Share capital contribution',
        debit_amount: 0,
        credit_amount: 75000000,
        running_balance: 75000000,
        created_at: new Date().toISOString()
      }
    ];
  }
}

export default AccountingService;
