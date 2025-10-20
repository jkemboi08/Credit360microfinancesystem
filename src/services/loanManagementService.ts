/**
 * Loan Management Service
 * Comprehensive service for all loan-related operations
 */

import { supabase } from '../lib/supabaseClient';

export interface LoanProduct {
  id: number;
  name: string;
  min_amount: number;
  max_amount: number;
  interest_rate: number;
  tenor_min_months: number;
  tenor_max_months: number;
  status: 'active' | 'inactive' | 'draft';
  product_type: string;
  processing_fee_rate: number;
  late_payment_penalty_rate: number;
  repayment_frequency: 'daily' | 'weekly' | 'monthly';
  requires_guarantor: boolean;
  requires_collateral: boolean;
  created_at: string;
  updated_at: string;
}

export interface LoanApplication {
  id: string;
  client_id: string;
  loan_product_id: number;
  requested_amount: number;
  repayment_period_months: number;
  loan_purpose: string;
  affordable_repayment_amount: number;
  source_of_income: string;
  status: 'pending' | 'approved' | 'rejected' | 'disbursed';
  kyc_status: 'pending' | 'verified' | 'rejected';
  approved_at?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface LoanApplicationWithDetails extends LoanApplication {
  client_name?: string;
  product_name?: string;
}

export class LoanManagementService {
  /**
   * Get all active loan products
   */
  static async getLoanProducts(): Promise<{
    success: boolean;
    data?: LoanProduct[];
    error?: string;
  }> {
    try {
      console.log('💰 Getting loan products...');

      const { data, error } = await supabase
        .from('loan_products')
        .select('*')
        .eq('status', 'active')
        .order('name');

      if (error) {
        console.error('❌ Error fetching loan products:', error);
        return {
          success: false,
          error: `Failed to fetch loan products: ${error.message}`
        };
      }

      console.log(`✅ Retrieved ${data?.length || 0} loan products`);
      return {
        success: true,
        data: data || []
      };

    } catch (error) {
      console.error('❌ Exception fetching loan products:', error);
      return {
        success: false,
        error: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Get loan product by ID
   */
  static async getLoanProductById(id: number): Promise<{
    success: boolean;
    data?: LoanProduct;
    error?: string;
  }> {
    try {
      console.log('💰 Getting loan product by ID:', id);

      const { data, error } = await supabase
        .from('loan_products')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('❌ Error fetching loan product:', error);
        return {
          success: false,
          error: `Failed to fetch loan product: ${error.message}`
        };
      }

      return {
        success: true,
        data
      };

    } catch (error) {
      console.error('❌ Exception fetching loan product:', error);
      return {
        success: false,
        error: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Create a new loan application
   */
  static async createLoanApplication(applicationData: {
    client_id: string;
    loan_product_id: number;
    requested_amount: number;
    repayment_period_months: number;
    loan_purpose: string;
    affordable_repayment_amount: number;
    source_of_income: string;
  }): Promise<{
    success: boolean;
    data?: LoanApplication;
    error?: string;
  }> {
    try {
      console.log('📝 Creating loan application...');

      const { data, error } = await supabase
        .from('loan_applications')
        .insert([{
          ...applicationData,
          status: 'pending',
          kyc_status: 'pending'
        }])
        .select()
        .single();

      if (error) {
        console.error('❌ Error creating loan application:', error);
        return {
          success: false,
          error: `Failed to create loan application: ${error.message}`
        };
      }

      console.log('✅ Loan application created successfully');
      return {
        success: true,
        data
      };

    } catch (error) {
      console.error('❌ Exception creating loan application:', error);
      return {
        success: false,
        error: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Get all loan applications
   */
  static async getLoanApplications(): Promise<{
    success: boolean;
    data?: LoanApplicationWithDetails[];
    error?: string;
  }> {
    try {
      console.log('📋 Getting loan applications...');

      const { data, error } = await supabase
        .from('loan_applications')
        .select(`
          id,
          client_id,
          loan_product_id,
          requested_amount,
          repayment_period_months,
          loan_purpose,
          affordable_repayment_amount,
          source_of_income,
          status,
          kyc_status,
          approved_at,
          rejection_reason,
          created_at,
          updated_at
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching loan applications:', error);
        return {
          success: false,
          error: `Failed to fetch loan applications: ${error.message}`
        };
      }

      console.log(`✅ Retrieved ${data?.length || 0} loan applications`);
      return {
        success: true,
        data: data || []
      };

    } catch (error) {
      console.error('❌ Exception fetching loan applications:', error);
      return {
        success: false,
        error: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Get loan applications by status
   */
  static async getLoanApplicationsByStatus(status: 'pending' | 'approved' | 'rejected' | 'disbursed'): Promise<{
    success: boolean;
    data?: LoanApplicationWithDetails[];
    error?: string;
  }> {
    try {
      console.log(`📋 Getting ${status} loan applications...`);

      const { data, error } = await supabase
        .from('loan_applications')
        .select(`
          id,
          client_id,
          loan_product_id,
          requested_amount,
          repayment_period_months,
          loan_purpose,
          affordable_repayment_amount,
          source_of_income,
          status,
          kyc_status,
          approved_at,
          rejection_reason,
          created_at,
          updated_at
        `)
        .eq('status', status)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching loan applications by status:', error);
        return {
          success: false,
          error: `Failed to fetch ${status} loan applications: ${error.message}`
        };
      }

      console.log(`✅ Retrieved ${data?.length || 0} ${status} loan applications`);
      return {
        success: true,
        data: data || []
      };

    } catch (error) {
      console.error('❌ Exception fetching loan applications by status:', error);
      return {
        success: false,
        error: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Update loan application status
   */
  static async updateLoanApplicationStatus(
    applicationId: string,
    status: 'pending' | 'approved' | 'rejected' | 'disbursed',
    additionalData?: {
      approved_at?: string;
      rejection_reason?: string;
    }
  ): Promise<{
    success: boolean;
    data?: LoanApplication;
    error?: string;
  }> {
    try {
      console.log(`🔄 Updating loan application ${applicationId} status to ${status}...`);

      const updateData: any = { status };
      
      if (additionalData?.approved_at) {
        updateData.approved_at = additionalData.approved_at;
      }
      
      if (additionalData?.rejection_reason) {
        updateData.rejection_reason = additionalData.rejection_reason;
      }

      const { data, error } = await supabase
        .from('loan_applications')
        .update(updateData)
        .eq('id', applicationId)
        .select()
        .single();

      if (error) {
        console.error('❌ Error updating loan application status:', error);
        return {
          success: false,
          error: `Failed to update loan application: ${error.message}`
        };
      }

      console.log('✅ Loan application status updated successfully');
      return {
        success: true,
        data
      };

    } catch (error) {
      console.error('❌ Exception updating loan application status:', error);
      return {
        success: false,
        error: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Approve a loan application
   */
  static async approveLoanApplication(applicationId: string): Promise<{
    success: boolean;
    data?: LoanApplication;
    error?: string;
  }> {
    try {
      console.log(`✅ Approving loan application ${applicationId}...`);

      const { data, error } = await supabase
        .from('loan_applications')
        .update({
          status: 'approved',
          approved_at: new Date().toISOString()
        })
        .eq('id', applicationId)
        .select()
        .single();

      if (error) {
        console.error('❌ Error approving loan application:', error);
        return {
          success: false,
          error: `Failed to approve loan application: ${error.message}`
        };
      }

      console.log('✅ Loan application approved successfully');
      return {
        success: true,
        data
      };

    } catch (error) {
      console.error('❌ Exception approving loan application:', error);
      return {
        success: false,
        error: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Reject a loan application
   */
  static async rejectLoanApplication(
    applicationId: string,
    rejectionReason: string
  ): Promise<{
    success: boolean;
    data?: LoanApplication;
    error?: string;
  }> {
    try {
      console.log(`❌ Rejecting loan application ${applicationId}...`);

      const { data, error } = await supabase
        .from('loan_applications')
        .update({
          status: 'rejected',
          rejection_reason: rejectionReason
        })
        .eq('id', applicationId)
        .select()
        .single();

      if (error) {
        console.error('❌ Error rejecting loan application:', error);
        return {
          success: false,
          error: `Failed to reject loan application: ${error.message}`
        };
      }

      console.log('✅ Loan application rejected successfully');
      return {
        success: true,
        data
      };

    } catch (error) {
      console.error('❌ Exception rejecting loan application:', error);
      return {
        success: false,
        error: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Get loan application by ID
   */
  static async getLoanApplicationById(applicationId: string): Promise<{
    success: boolean;
    data?: LoanApplicationWithDetails;
    error?: string;
  }> {
    try {
      console.log('📋 Getting loan application by ID:', applicationId);

      const { data, error } = await supabase
        .from('loan_applications')
        .select(`
          id,
          client_id,
          loan_product_id,
          requested_amount,
          repayment_period_months,
          loan_purpose,
          affordable_repayment_amount,
          source_of_income,
          status,
          kyc_status,
          approved_at,
          rejection_reason,
          created_at,
          updated_at
        `)
        .eq('id', applicationId)
        .single();

      if (error) {
        console.error('❌ Error fetching loan application:', error);
        return {
          success: false,
          error: `Failed to fetch loan application: ${error.message}`
        };
      }

      return {
        success: true,
        data
      };

    } catch (error) {
      console.error('❌ Exception fetching loan application:', error);
      return {
        success: false,
        error: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Get loan statistics
   */
  static async getLoanStatistics(): Promise<{
    success: boolean;
    data?: {
      totalApplications: number;
      pendingApplications: number;
      approvedApplications: number;
      rejectedApplications: number;
      totalRequestedAmount: number;
      totalApprovedAmount: number;
    };
    error?: string;
  }> {
    try {
      console.log('📊 Getting loan statistics...');

      const { data: allApplications, error: allError } = await supabase
        .from('loan_applications')
        .select('status, requested_amount');

      if (allError) {
        return {
          success: false,
          error: `Failed to fetch loan statistics: ${allError.message}`
        };
      }

      const totalApplications = allApplications?.length || 0;
      const pendingApplications = allApplications?.filter(app => app.status === 'pending').length || 0;
      const approvedApplications = allApplications?.filter(app => app.status === 'approved').length || 0;
      const rejectedApplications = allApplications?.filter(app => app.status === 'rejected').length || 0;
      
      const totalRequestedAmount = allApplications?.reduce((sum, app) => sum + (app.requested_amount || 0), 0) || 0;
      const totalApprovedAmount = allApplications
        ?.filter(app => app.status === 'approved')
        .reduce((sum, app) => sum + (app.requested_amount || 0), 0) || 0;

      const stats = {
        totalApplications,
        pendingApplications,
        approvedApplications,
        rejectedApplications,
        totalRequestedAmount,
        totalApprovedAmount
      };

      console.log('✅ Loan statistics calculated');
      return {
        success: true,
        data: stats
      };

    } catch (error) {
      console.error('❌ Exception calculating loan statistics:', error);
      return {
        success: false,
        error: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
}



































