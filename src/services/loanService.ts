import { supabase, handleSupabaseError } from '../lib/supabaseClient';
import { sanitizeUuidFields } from '../utils/uuidSanitizer';
import type { Database } from '../lib/supabaseClient';

type LoanProduct = Database['public']['Tables']['loan_products']['Row'];
type LoanApplication = Database['public']['Tables']['loan_applications']['Row'];
type Loan = Database['public']['Tables']['loans']['Row'];

export class LoanService {
  // Get all loan products
  static async getLoanProducts() {
    try {
      const { data, error } = await supabase
        .from('loan_products')
        .select('*')
        .eq('status', 'active')
        .order('name');

      if (error) {
        throw error;
      }

      return { data, error: null };
    } catch (error) {
      return { data: null, error: handleSupabaseError(error) };
    }
  }

  // Create loan application
  static async createLoanApplication(applicationData: {
    client_id?: string;
    loan_product_id: number;
    amount: number;
    notes?: string;
  }) {
    try {
      const { data, error } = await supabase
        .from('loan_applications')
        .insert({
          ...applicationData,
          client_id: applicationData.client_id,
          status: 'submitted',
          application_date: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return { data, error: null };
    } catch (error) {
      return { data: null, error: handleSupabaseError(error) };
    }
  }

  // Get loan applications for current user
  static async getUserLoanApplications() {
    try {
      const { data, error } = await supabase
        .from('loan_applications')
        .select(`
          *,
          loan_products (
            name,
            interest_rate,
            repayment_frequency
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return { data, error: null };
    } catch (error) {
      return { data: null, error: handleSupabaseError(error) };
    }
  }

  // Get all loan applications (staff only) - TENANT FILTERED
  static async getAllLoanApplications() {
    try {
      // Get current tenant context
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Get user's tenant IDs
      const { data: tenantUsers, error: tenantError } = await supabase
        .from('tenant_users')
        .select('tenant_id')
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (tenantError || !tenantUsers || tenantUsers.length === 0) {
        throw new Error('User not associated with any tenant');
      }

      const tenantIds = tenantUsers.map(tu => tu.tenant_id);

      const { data, error } = await supabase
        .from('loan_applications')
        .select(`
          *,
          users!loan_applications_user_id_fkey (
            first_name,
            last_name,
            email,
            phone_number
          ),
          loan_products (
            name,
            interest_rate,
            repayment_frequency
          )
        `)
        .in('tenant_id', tenantIds)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return { data, error: null };
    } catch (error) {
      return { data: null, error: handleSupabaseError(error) };
    }
  }

  // Update loan application status
  static async updateLoanApplicationStatus(
    applicationId: number,
    status: string,
    notes?: string,
    approvedBy?: number
  ) {
    try {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString()
      };

      if (notes) {
        updateData.notes = notes;
      }

      if (status === 'approved' && approvedBy) {
        updateData.approved_by = approvedBy;
        updateData.approved_date = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('loan_applications')
        .update(updateData)
        .eq('id', applicationId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return { data, error: null };
    } catch (error) {
      return { data: null, error: handleSupabaseError(error) };
    }
  }

  // Get user loans
  static async getUserLoans() {
    try {
      const { data, error } = await supabase
        .from('loans')
        .select(`
          *,
          loan_products (
            name,
            interest_rate,
            repayment_frequency
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return { data, error: null };
    } catch (error) {
      return { data: null, error: handleSupabaseError(error) };
    }
  }

  // Get all loans (staff only) - TENANT FILTERED
  static async getAllLoans() {
    try {
      // Get current tenant context
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Get user's tenant IDs
      const { data: tenantUsers, error: tenantError } = await supabase
        .from('tenant_users')
        .select('tenant_id')
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (tenantError || !tenantUsers || tenantUsers.length === 0) {
        throw new Error('User not associated with any tenant');
      }

      const tenantIds = tenantUsers.map(tu => tu.tenant_id);

      const { data, error } = await supabase
        .from('loans')
        .select(`
          *,
          users!loans_user_id_fkey (
            first_name,
            last_name,
            email,
            phone_number
          ),
          loan_products (
            name,
            interest_rate,
            repayment_frequency
          )
        `)
        .in('tenant_id', tenantIds)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return { data, error: null };
    } catch (error) {
      return { data: null, error: handleSupabaseError(error) };
    }
  }

  // Create loan from approved application
  static async createLoanFromApplication(applicationId: number) {
    try {
      // First get the application details
      const { data: application, error: appError } = await supabase
        .from('loan_applications')
        .select(`
          *,
          loan_products (
            interest_rate,
            loan_term_days
          )
        `)
        .eq('id', applicationId)
        .single();

      if (appError || !application) {
        throw appError || new Error('Application not found');
      }

      // Calculate loan details
      const principal = application.amount;
      const interestRate = application.loan_products?.interest_rate || 0;
      const interestAmount = principal * (interestRate / 100);
      const totalAmount = principal + interestAmount;

      // Create the loan
      const { data, error } = await supabase
        .from('loans')
        .insert({
          loan_application_id: applicationId,
          user_id: application.user_id,
          loan_product_id: application.loan_product_id,
          principal_amount: principal,
          interest_amount: interestAmount,
          total_amount: totalAmount,
          status: 'active',
          disbursement_date: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Update application status to disbursed
      await this.updateLoanApplicationStatus(applicationId, 'disbursed');

      return { data, error: null };
    } catch (error) {
      return { data: null, error: handleSupabaseError(error) };
    }
  }

  // Update loan product
  static async updateLoanProduct(productId: string | number, productData: {
    name?: string;
    description?: string;
    min_amount?: number;
    max_amount?: number;
    interest_rate?: number;
    tenor_min_months?: number;
    tenor_max_months?: number;
    status?: 'active' | 'draft' | 'inactive';
    version?: string;
    product_type?: string;
    processing_fee_rate?: number;
    late_payment_penalty_rate?: number;
    repayment_frequency?: 'daily' | 'weekly' | 'monthly';
    requires_guarantor?: boolean;
    requires_collateral?: boolean;
  }) {
    try {
      const { data, error } = await supabase
        .from('loan_products')
        .update({
          ...productData,
          updated_at: new Date().toISOString()
        })
        .eq('id', productId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return { data, error: null };
    } catch (error) {
      return { data: null, error: handleSupabaseError(error) };
    }
  }

  // Create loan product
  static async createLoanProduct(productData: {
    name: string;
    description?: string;
    min_amount: number;
    max_amount: number;
    interest_rate: number;
    tenor_min_months?: number;
    tenor_max_months?: number;
    status?: 'active' | 'draft' | 'inactive';
    version?: string;
    product_type?: string;
    processing_fee_rate?: number;
    late_payment_penalty_rate?: number;
    repayment_frequency?: 'daily' | 'weekly' | 'monthly';
    requires_guarantor?: boolean;
    requires_collateral?: boolean;
  }) {
    try {
      const { data, error } = await supabase
        .from('loan_products')
        .insert({
          ...productData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return { data, error: null };
    } catch (error) {
      return { data: null, error: handleSupabaseError(error) };
    }
  }
}