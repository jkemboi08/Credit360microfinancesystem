/**
 * Loan Closure Data Service
 * Provides robust data fetching and transformation for loan closure management
 * Handles all database queries, error handling, and data transformation
 */

import { supabase } from '../lib/supabaseClient';

export interface LoanClosureData {
  id: string;
  clientName: string;
  clientId: string;
  phone: string;
  originalAmount: number;
  currentBalance: number;
  interestRate: number;
  tenor: number;
  monthlyPayment: number;
  lastPaymentDate: string;
  nextPaymentDate: string;
  totalPaid: number;
  totalInterest: number;
  status: 'active' | 'ready_for_closure' | 'closed' | 'default';
  closureReason: string;
  closureDate?: string;
  finalStatement?: {
    principalAmount: number;
    totalInterest: number;
    totalPaid: number;
    outstandingBalance: number;
    closureFee: number;
    finalAmount: number;
  };
}

export interface LoanClosureMetrics {
  activeLoans: number;
  readyForClosure: number;
  closedThisMonth: number;
  totalRecovered: number;
}

export interface LoanClosureServiceResult {
  loans: LoanClosureData[];
  metrics: LoanClosureMetrics;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

class LoanClosureDataService {
  private static instance: LoanClosureDataService;
  private cache: LoanClosureData[] = [];
  private lastFetch: number = 0;
  private readonly CACHE_DURATION = 30000; // 30 seconds

  static getInstance(): LoanClosureDataService {
    if (!LoanClosureDataService.instance) {
      LoanClosureDataService.instance = new LoanClosureDataService();
    }
    return LoanClosureDataService.instance;
  }

  /**
   * Get all loans for closure management with robust error handling
   */
  async getLoansForClosure(): Promise<{ success: boolean; data?: LoanClosureData[]; error?: string }> {
    try {
      console.log('🔍 LoanClosureDataService - Fetching loans for closure...');

      // Check cache first
      if (this.cache.length > 0 && (Date.now() - this.lastFetch) < this.CACHE_DURATION) {
        console.log('📋 Using cached loan closure data');
        return { success: true, data: this.cache };
      }

      // Step 1: Fetch loans with proper field names and error handling
      const { data: loansData, error: loansError } = await supabase
        .from('loans')
        .select(`
          id,
          loan_application_id,
          principal_amount,
          interest_amount,
          total_amount,
          status,
          disbursement_date,
          first_payment_due,
          last_payment_date,
          next_payment_due,
          created_at,
          updated_at,
          loan_applications!loans_loan_application_id_fkey (
            id,
            application_id,
            client_id,
            repayment_period_months,
            interest_rate,
            clients (
              id,
              first_name,
              last_name,
              full_name,
              phone_number
            )
          )
        `)
        .in('status', ['active', 'closed'])
        .order('created_at', { ascending: false });

      if (loansError) {
        console.error('❌ Error fetching loans:', loansError);
        return { success: false, error: `Failed to fetch loans: ${loansError.message}` };
      }

      if (!loansData || loansData.length === 0) {
        console.log('ℹ️ No loans found for closure management');
        this.cache = [];
        this.lastFetch = Date.now();
        return { success: true, data: [] };
      }

      // Step 2: Fetch repayment data with error handling
      const { data: repaymentsData, error: repaymentsError } = await supabase
        .from('loan_repayments')
        .select(`
          loan_id,
          amount_paid,
          principal_amount,
          interest_amount,
          payment_date
        `)
        .order('payment_date', { ascending: false });

      if (repaymentsError) {
        console.warn('⚠️ Error fetching repayments, continuing without repayment data:', repaymentsError);
      }

      // Step 3: Transform data with robust error handling
      const transformedLoans: LoanClosureData[] = loansData.map(loan => {
        try {
          const application = loan.loan_applications;
          const client = application?.clients;
          
          // Calculate totals from repayments with safe fallbacks
          const loanRepayments = repaymentsData?.filter(r => r.loan_id === loan.id) || [];
          const totalPaid = loanRepayments.reduce((sum, r) => sum + (r.amount_paid || 0), 0);
          const totalInterest = loanRepayments.reduce((sum, r) => sum + (r.interest_amount || 0), 0);
          
          // Calculate current balance with safe fallbacks
          const currentBalance = Math.max(0, (loan.total_amount || 0) - totalPaid);
          
          // Determine status with robust logic
          let status: 'active' | 'ready_for_closure' | 'closed' | 'default' = 'active';
          if (loan.status === 'closed') {
            status = 'closed';
          } else if (loan.status === 'active') {
            // Check if ready for closure (90% paid)
            const principalAmount = loan.principal_amount || 0;
            if (principalAmount > 0 && currentBalance <= principalAmount * 0.1) {
              status = 'ready_for_closure';
            } else {
              status = 'active';
            }
          }
          
          // Build client name safely
          const clientName = client?.full_name || 
                           (client?.first_name && client?.last_name ? 
                            `${client.first_name} ${client.last_name}` : 
                            `Client ${loan.id.substring(0, 8)}`);
          
          // Calculate monthly payment safely
          const tenor = application?.repayment_period_months || 12;
          const monthlyPayment = tenor > 0 ? Math.round((loan.total_amount || 0) / tenor) : 0;
          
          return {
            id: `LN${loan.id}`,
            clientName,
            clientId: application?.client_id || 'unknown',
            phone: client?.phone_number || 'N/A',
            originalAmount: loan.principal_amount || 0,
            currentBalance,
            interestRate: application?.interest_rate || 0,
            tenor,
            monthlyPayment,
            lastPaymentDate: loan.last_payment_date || '',
            nextPaymentDate: loan.next_payment_due || '',
            totalPaid,
            totalInterest,
            status,
            closureReason: status === 'closed' ? 'Normal completion' : 
                          status === 'ready_for_closure' ? 'Early settlement' : '',
            closureDate: status === 'closed' ? loan.updated_at : undefined,
            finalStatement: status === 'closed' ? {
              principalAmount: loan.principal_amount || 0,
              totalInterest: totalInterest,
              totalPaid: totalPaid,
              outstandingBalance: currentBalance,
              closureFee: 0, // Could be calculated based on business rules
              finalAmount: currentBalance
            } : undefined
          };
        } catch (error) {
          console.error(`❌ Error transforming loan ${loan.id}:`, error);
          // Return a safe fallback for this loan
          return {
            id: `LN${loan.id}`,
            clientName: `Client ${loan.id.substring(0, 8)}`,
            clientId: 'unknown',
            phone: 'N/A',
            originalAmount: loan.principal_amount || 0,
            currentBalance: loan.total_amount || 0,
            interestRate: 0,
            tenor: 0,
            monthlyPayment: 0,
            lastPaymentDate: '',
            nextPaymentDate: '',
            totalPaid: 0,
            totalInterest: 0,
            status: 'active' as const,
            closureReason: '',
          };
        }
      });

      // Update cache
      this.cache = transformedLoans;
      this.lastFetch = Date.now();

      console.log('✅ Successfully loaded loan closure data:', transformedLoans.length, 'loans');
      return { success: true, data: transformedLoans };

    } catch (error) {
      console.error('❌ Unexpected error in getLoansForClosure:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Calculate metrics for loan closure dashboard
   */
  async getLoanClosureMetrics(): Promise<{ success: boolean; data?: LoanClosureMetrics; error?: string }> {
    try {
      const loansResult = await this.getLoansForClosure();
      if (!loansResult.success || !loansResult.data) {
        return { success: false, error: loansResult.error || 'Failed to fetch loans' };
      }

      const loans = loansResult.data;
      const now = new Date();
      const thisMonth = now.getMonth();
      const thisYear = now.getFullYear();

      const metrics: LoanClosureMetrics = {
        activeLoans: loans.filter(l => l.status === 'active').length,
        readyForClosure: loans.filter(l => l.status === 'ready_for_closure').length,
        closedThisMonth: loans.filter(l => {
          if (l.status !== 'closed' || !l.closureDate) return false;
          const closureDate = new Date(l.closureDate);
          return closureDate.getMonth() === thisMonth && closureDate.getFullYear() === thisYear;
        }).length,
        totalRecovered: loans
          .filter(l => l.status === 'closed')
          .reduce((sum, l) => sum + l.totalPaid, 0)
      };

      return { success: true, data: metrics };
    } catch (error) {
      console.error('❌ Error calculating loan closure metrics:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Clear cache to force fresh data fetch
   */
  clearCache(): void {
    this.cache = [];
    this.lastFetch = 0;
    console.log('🗑️ Loan closure data cache cleared');
  }

  /**
   * Get cached data if available
   */
  getCachedData(): LoanClosureData[] {
    return this.cache;
  }
}

export default LoanClosureDataService;




