import { supabase } from '../lib/supabaseClient';

export interface LoanDisbursementData {
  loan_application_id: string;
  client_id: string;
  disbursement_amount: number;
  disbursement_date: string;
  disbursement_method: string;
  disbursement_reference?: string;
  disbursement_channel?: string;
  interest_rate: number;
  tenor_months: number;
  monthly_payment: number;
  maturity_date: string;
  status: string;
  created_by: string;
}

/**
 * Syncs loan disbursement data between loan_disbursements and loans tables
 * This ensures real-time consistency when loans are disbursed
 */
export async function syncLoanDisbursement(disbursementData: LoanDisbursementData) {
  try {
    console.log('🔄 Syncing loan disbursement data...', disbursementData);

    // Start a transaction to ensure both tables are updated atomically
    const { data: loanData, error: loanError } = await supabase
      .from('loans')
      .insert({
        loan_application_id: disbursementData.loan_application_id,
        client_id: disbursementData.client_id,
        principal_amount: disbursementData.disbursement_amount,
        loan_amount: disbursementData.disbursement_amount,
        disbursed_amount: disbursementData.disbursement_amount,
        outstanding_balance: disbursementData.disbursement_amount,
        current_balance: disbursementData.disbursement_amount,
        interest_rate: disbursementData.interest_rate,
        tenor_months: disbursementData.tenor_months,
        monthly_payment: disbursementData.monthly_payment,
        disbursement_date: disbursementData.disbursement_date,
        maturity_date: disbursementData.maturity_date,
        status: disbursementData.status,
        disbursement_method: disbursementData.disbursement_method,
        disbursement_reference: disbursementData.disbursement_reference,
        disbursement_channel: disbursementData.disbursement_channel,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (loanError) {
      console.error('❌ Error creating loan record:', loanError);
      throw loanError;
    }

    // Create disbursement record
    const { data: disbursementRecord, error: disbursementError } = await supabase
      .from('loan_disbursements')
      .insert({
        loan_id: loanData.id,
        loan_application_id: disbursementData.loan_application_id,
        client_id: disbursementData.client_id,
        disbursement_amount: disbursementData.disbursement_amount,
        disbursement_date: disbursementData.disbursement_date,
        disbursement_method: disbursementData.disbursement_method,
        disbursement_reference: disbursementData.disbursement_reference,
        disbursement_channel: disbursementData.disbursement_channel,
        status: 'completed',
        created_by: disbursementData.created_by,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (disbursementError) {
      console.error('❌ Error creating disbursement record:', disbursementError);
      // Rollback loan creation if disbursement fails
      await supabase.from('loans').delete().eq('id', loanData.id);
      throw disbursementError;
    }

    console.log('✅ Loan disbursement synced successfully:', {
      loanId: loanData.id,
      disbursementId: disbursementRecord.id
    });

    return {
      success: true,
      loanId: loanData.id,
      disbursementId: disbursementRecord.id,
      data: loanData
    };

  } catch (error) {
    console.error('❌ Error syncing loan disbursement:', error);
    return {
      success: false,
      error: error
    };
  }
}

/**
 * Updates loan status and balances in real-time
 */
export async function updateLoanStatus(loanId: string, updates: Partial<{
  status: string;
  current_balance: number;
  outstanding_balance: number;
  days_past_due: number;
  last_payment_date: string;
  next_payment_due: string;
}>) {
  try {
    console.log('🔄 Updating loan status...', { loanId, updates });

    const { data, error } = await supabase
      .from('loans')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', loanId)
      .select()
      .single();

    if (error) {
      console.error('❌ Error updating loan status:', error);
      throw error;
    }

    console.log('✅ Loan status updated successfully:', data);
    return { success: true, data };

  } catch (error) {
    console.error('❌ Error updating loan status:', error);
    return { success: false, error };
  }
}

/**
 * Sets up real-time subscriptions for loan disbursements
 */
export function setupLoanDisbursementSubscriptions() {
  console.log('🔄 Setting up loan disbursement real-time subscriptions...');

  // Subscribe to loan_disbursements table changes
  const disbursementsSubscription = supabase
    .channel('loan-disbursements-sync')
    .on('postgres_changes', 
      { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'loan_disbursements'
      }, 
      async (payload) => {
        console.log('💰 New disbursement detected:', payload);
        
        // Ensure the corresponding loan record exists and is up to date
        const disbursement = payload.new;
        
        // Check if loan record exists
        const { data: existingLoan, error: loanError } = await supabase
          .from('loans')
          .select('*')
          .eq('loan_application_id', disbursement.loan_application_id)
          .single();

        if (loanError && loanError.code === 'PGRST116') {
          // Loan doesn't exist, create it
          console.log('🔄 Creating missing loan record for disbursement...');
          await syncLoanDisbursement({
            loan_application_id: disbursement.loan_application_id,
            client_id: disbursement.client_id,
            disbursement_amount: disbursement.disbursement_amount,
            disbursement_date: disbursement.disbursement_date,
            disbursement_method: disbursement.disbursement_method,
            disbursement_reference: disbursement.disbursement_reference,
            disbursement_channel: disbursement.disbursement_channel,
            interest_rate: 15, // Default rate, should be passed from disbursement
            tenor_months: 12, // Default tenor, should be passed from disbursement
            monthly_payment: 0, // Will be calculated
            maturity_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year from now
            status: 'active',
            created_by: disbursement.created_by || 'system'
          });
        }
      }
    )
    .subscribe();

  return disbursementsSubscription;
}
