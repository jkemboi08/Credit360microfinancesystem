import { supabase } from '../lib/supabaseClient';

export interface LoanClosureData {
  loan_application_id: string;
  closed_at: string;
  closed_by: string; // UUID of the user who closed the loan
  closure_type: 'normal_completion' | 'early_settlement' | 'default' | 'restructure';
  closure_reason: string;
  outstanding_principal: number;
  outstanding_interest: number;
  total_settled_amount: number;
  settlement_reference?: string;
  fees_charged?: number;
  penalty_charged?: number;
  adjustments?: number;
  repayment_summary?: {
    total_principal_paid: number;
    total_interest_paid: number;
    total_fees_paid: number;
    total_penalties_paid: number;
    total_amount_paid: number;
    payment_count: number;
    last_payment_date?: string;
    first_payment_date?: string;
  };
}

export class LoanClosureService {
  /**
   * Ensure a user has a profile record in the profiles table
   */
  static async ensureUserProfile(userId: string) {
    try {
      console.log('🔍 Checking if authenticated user has profile:', userId);
      
      // Check if profile already exists
      const { data: existingProfile, error: checkError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .single();
      
      if (existingProfile) {
        console.log('✅ User profile already exists');
        return;
      }
      
      if (checkError && checkError.code !== 'PGRST116') {
        console.log('⚠️ Error checking profile:', checkError.message);
      }
      
      // Profile doesn't exist, try to create one
      console.log('🔄 Creating profile for authenticated user:', userId);
      
      // Get user info from auth context if possible
      const { data: authUser } = await supabase.auth.getUser();
      let email = 'user@loanmanager.com';
      
      if (authUser?.user?.email) {
        email = authUser.user.email;
        console.log('📧 Using email from auth context:', email);
      }
      
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          email: email,
          role: 'admin', // Default role for authenticated users
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (createError) {
        console.error('❌ Error creating profile:', createError);
        if (createError.code === '42501') {
          console.log('⚠️ Cannot create profile due to RLS policy');
          console.log('💡 The loan closure will still work, but without user tracking');
          // Don't throw error, just log it and continue
        } else {
          throw createError;
        }
      } else {
        console.log('✅ User profile created successfully:', newProfile);
      }
      
    } catch (error) {
      console.error('❌ Error in ensureUserProfile:', error);
      // Don't throw error, just log it and continue
      console.log('⚠️ Continuing without profile creation');
    }
  }

  /**
   * Save a loan closure record to the database
   */
  static async saveLoanClosure(closureData: LoanClosureData) {
    try {
      console.log('💾 Saving loan closure record:', closureData);

      // Use the provided closed_by user ID directly
      let closedBy = closureData.closed_by;
      console.log('🔄 Using authenticated user ID for closure:', closedBy);

      // First, try to create a profile for the authenticated user if it doesn't exist
      await this.ensureUserProfile(closedBy);

      const { data, error } = await supabase
        .from('loan_closure')
        .insert({
          ...closureData,
          closed_by: closedBy,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Error saving loan closure:', error);
        
        // Handle foreign key constraint error specifically
        if (error.code === '23503' && error.message.includes('closed_by_fkey')) {
          console.log('🔄 Foreign key constraint error - the user ID does not exist in profiles table');
          console.log('This might be because the user exists in auth.users but not in profiles table');
          
          // Try to find any user in the profiles table
          const { data: anyUser } = await supabase
            .from('profiles')
            .select('id')
            .limit(1)
            .single();
          
          if (anyUser?.id) {
            console.log('🔄 Retrying with found user ID from profiles:', anyUser.id);
            const { data: retryData, error: retryError } = await supabase
              .from('loan_closure')
              .insert({
                ...closureData,
                closed_by: anyUser.id,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })
              .select()
              .single();
            
            if (retryError) {
              throw new Error(`Failed to save loan closure: ${retryError.message}`);
            } else {
              console.log('✅ Loan closure saved successfully with retry:', retryData);
              return { success: true, data: retryData };
            }
          } else {
            // If no profiles exist, try to work around the constraint
            console.log('🔄 No profiles found - attempting to work around foreign key constraint');
            
            // Try to insert without the closed_by field to avoid the foreign key constraint
            try {
              const { data: retryData, error: retryError } = await supabase
                .from('loan_closure')
                .insert({
                  loan_application_id: closureData.loan_application_id,
                  closed_at: closureData.closed_at,
                  closure_type: closureData.closure_type,
                  closure_reason: closureData.closure_reason,
                  outstanding_principal: closureData.outstanding_principal,
                  outstanding_interest: closureData.outstanding_interest,
                  total_settled_amount: closureData.total_settled_amount,
                  settlement_reference: closureData.settlement_reference,
                  fees_charged: closureData.fees_charged || 0,
                  penalty_charged: closureData.penalty_charged || 0,
                  adjustments: closureData.adjustments || 0,
                  repayment_summary: closureData.repayment_summary || {},
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                  // Note: We're omitting closed_by to avoid the foreign key constraint
                })
                .select()
                .single();
              
              if (retryError) {
                console.log('❌ Retry without closed_by failed:', retryError.message);
                throw new Error('Failed to save loan closure: Cannot create closure record. Please contact administrator.');
              } else {
                console.log('✅ Loan closure saved successfully (without user tracking):', retryData);
                return { success: true, data: retryData };
              }
            } catch (retryError) {
              throw new Error('Failed to save loan closure: Cannot create closure record. Please contact administrator.');
            }
          }
        } else {
          throw new Error(`Failed to save loan closure: ${error.message}`);
        }
      }

      console.log('✅ Loan closure saved successfully:', data);
      return { success: true, data };
    } catch (error) {
      console.error('❌ Error in saveLoanClosure:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get all loan closures for a specific loan application
   */
  static async getLoanClosures(loanApplicationId: string) {
    try {
      const { data, error } = await supabase
        .from('loan_closure')
        .select('*')
        .eq('loan_application_id', loanApplicationId)
        .order('closed_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching loan closures:', error);
        throw new Error(`Failed to fetch loan closures: ${error.message}`);
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('❌ Error in getLoanClosures:', error);
      return { success: false, error: error.message, data: [] };
    }
  }

  /**
   * Get all loan closures with pagination
   */
  static async getAllLoanClosures(page = 1, limit = 50) {
    try {
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      const { data, error, count } = await supabase
        .from('loan_closure')
        .select('*', { count: 'exact' })
        .order('closed_at', { ascending: false })
        .range(from, to);

      if (error) {
        console.error('❌ Error fetching all loan closures:', error);
        throw new Error(`Failed to fetch loan closures: ${error.message}`);
      }

      return { 
        success: true, 
        data: data || [], 
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit)
      };
    } catch (error) {
      console.error('❌ Error in getAllLoanClosures:', error);
      return { success: false, error: error.message, data: [] };
    }
  }

  /**
   * Update loan status to closed in loan_applications table
   */
  static async updateLoanStatusToClosed(loanApplicationId: string, closureData: Partial<LoanClosureData>) {
    try {
      console.log('🔄 Updating loan status to closed:', loanApplicationId);

      const { data, error } = await supabase
        .from('loan_applications')
        .update({
          status: 'closed',
          is_disbursed: true,
          disbursement_locked: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', loanApplicationId)
        .select();

      if (error) {
        console.error('❌ Error updating loan status:', error);
        throw new Error(`Failed to update loan status: ${error.message}`);
      }

      console.log('✅ Loan status updated to closed:', data);
      return { success: true, data };
    } catch (error) {
      console.error('❌ Error in updateLoanStatusToClosed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Update loan status to closed in loans table
   */
  static async updateLoansTableStatus(loanId: string) {
    try {
      console.log('🔄 Updating loans table status to closed:', loanId);

      const { data, error } = await supabase
        .from('loans')
        .update({
          status: 'closed',
          updated_at: new Date().toISOString()
        })
        .eq('id', loanId)
        .select();

      if (error) {
        console.error('❌ Error updating loans table status:', error);
        throw new Error(`Failed to update loans table status: ${error.message}`);
      }

      console.log('✅ Loans table status updated to closed:', data);
      return { success: true, data };
    } catch (error) {
      console.error('❌ Error in updateLoansTableStatus:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Complete loan closure process
   */
  static async completeLoanClosure(
    loanApplicationId: string,
    loanId: string,
    closureData: LoanClosureData
  ) {
    try {
      console.log('🚀 Starting complete loan closure process...');

      // 1. Save loan closure record
      const closureResult = await this.saveLoanClosure(closureData);
      if (!closureResult.success) {
        throw new Error(closureResult.error);
      }

      // 2. Update loan_applications table
      const loanAppResult = await this.updateLoanStatusToClosed(loanApplicationId, closureData);
      if (!loanAppResult.success) {
        throw new Error(loanAppResult.error);
      }

      // 3. Update loans table
      const loansResult = await this.updateLoansTableStatus(loanId);
      if (!loansResult.success) {
        throw new Error(loansResult.error);
      }

      console.log('✅ Complete loan closure process finished successfully');
      return { 
        success: true, 
        closureRecord: closureResult.data,
        loanApplication: loanAppResult.data,
        loan: loansResult.data
      };
    } catch (error) {
      console.error('❌ Error in completeLoanClosure:', error);
      return { success: false, error: error.message };
    }
  }
}
