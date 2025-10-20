import { createClient } from '@supabase/supabase-js';

// Real Supabase Configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://klmfbakjbihbgbvbvidw.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtsbWZiYWtqYmloYmdidmJ2aWR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIyODczNjEsImV4cCI6MjA2Nzg2MzM2MX0.a6HqB6Az-rbcLx7nq6nc036EBNWegPFTwkMn6wh2dYE';

const finalSupabaseUrl = supabaseUrl;
const finalSupabaseAnonKey = supabaseAnonKey;

// Log successful configuration
console.log('✅ Supabase connection configured successfully!');
console.log('🔗 Connected to:', finalSupabaseUrl);

export const supabase = createClient(finalSupabaseUrl, finalSupabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  },
  global: {
    headers: {
      'X-Client-Info': 'microfinance-app'
    }
  }
});

// Test network connectivity to Supabase
export const testNetworkConnectivity = async () => {
  try {
    console.log('🔍 Testing network connectivity to Supabase...');
    
    // Test basic connectivity to Supabase domain
    const response = await fetch(supabaseUrl, { 
      method: 'HEAD',
      mode: 'no-cors'
    });
    
    console.log('✅ Network connectivity test passed');
    return true;
  } catch (err) {
    console.error('❌ Network connectivity test failed:', err);
    return false;
  }
};

// Test connection function
export const testSupabaseConnection = async () => {
  try {
    console.log('🔍 Testing Supabase connection...');
    
    // First test network connectivity
    const networkOk = await testNetworkConnectivity();
    if (!networkOk) {
      return false;
    }
    
    const { data, error } = await supabase
      .from('loan_applications')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error('❌ Supabase connection failed:', error);
      return false;
    }
    
    console.log('✅ Supabase connection successful!');
    return true;
  } catch (err) {
    console.error('❌ Supabase connection error:', err);
    return false;
  }
};

// Enhanced Database types based on your schema
// Updated to include clients table
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: number;
          user_id: string | null;
          first_name: string | null;
          last_name: string | null;
          email: string;
          phone_number: string | null;
          role: 'staff' | 'client' | 'manager' | 'admin';
          kyc_status: 'pending' | 'verified' | 'rejected' | null;
          date_of_birth: string | null;
          national_id: string | null;
          created_at: string | null;
          updated_at: string | null;
          last_login_at: string | null;
        };
        Insert: {
          id?: number;
          user_id?: string | null;
          first_name?: string | null;
          last_name?: string | null;
          email: string;
          phone_number?: string | null;
          role?: 'staff' | 'client' | 'manager' | 'admin';
          kyc_status?: 'pending' | 'verified' | 'rejected' | null;
          date_of_birth?: string | null;
          national_id?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
          last_login_at?: string | null;
        };
        Update: {
          id?: number;
          user_id?: string | null;
          first_name?: string | null;
          last_name?: string | null;
          email?: string;
          phone_number?: string | null;
          role?: 'staff' | 'client' | 'manager' | 'admin';
          kyc_status?: 'pending' | 'verified' | 'rejected' | null;
          date_of_birth?: string | null;
          national_id?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
          last_login_at?: string | null;
        };
      };
      clients: {
        Row: {
          id: string;
          first_name: string | null;
          middle_name: string | null;
          last_name: string | null;
          common_name: string | null;
          gender: 'male' | 'female' | 'other' | null;
          date_of_birth: string | null;
          national_id_number: string | null;
          id_type: string | null;
          phone_number: string | null;
          email_address: string | null;
          street_name: string | null;
          house_number: string | null;
          area_of_residence: string | null;
          housing_type: string | null;
          marital_status: string | null;
          spouse_name: string | null;
          spouse_common_name: string | null;
          company_name: string | null;
          office_location: string | null;
          position: string | null;
          years_of_employment: number | null;
          net_monthly_salary: number | null;
          salary_slip_uploaded: boolean | null;
          business_name: string | null;
          business_location: string | null;
          average_monthly_income: number | null;
          type_of_business: string | null;
          since_when_business: string | null;
          group_name: string | null;
          kyc_status: 'pending' | 'verified' | 'rejected' | null;
          id_document_uploaded: boolean | null;
          passport_photo_uploaded: boolean | null;
          fingerprint_uploaded: boolean | null;
          id_document_url: string | null;
          passport_photo_url: string | null;
          fingerprint_url: string | null;
          salary_slip_url: string | null;
          // Repeat Customer Fields
          client_type: 'individual' | 'corporate' | 'group' | null;
          client_category: 'new' | 'existing' | null;
          customer_since: string | null;
          credit_limit: number | null;
          pre_approved_amount: number | null;
          risk_score: number | null;
          average_loan_amount: number | null;
          consecutive_on_time_payments: number | null;
          total_overdue_days: number | null;
          preferred_loan_amount: number | null;
          preferred_loan_term: number | null;
          last_contact_date: string | null;
          customer_notes: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          first_name?: string | null;
          middle_name?: string | null;
          last_name?: string | null;
          common_name?: string | null;
          gender?: 'male' | 'female' | 'other' | null;
          date_of_birth?: string | null;
          national_id_number?: string | null;
          id_type?: string | null;
          phone_number?: string | null;
          email_address?: string | null;
          street_name?: string | null;
          house_number?: string | null;
          area_of_residence?: string | null;
          housing_type?: string | null;
          marital_status?: string | null;
          spouse_name?: string | null;
          spouse_common_name?: string | null;
          company_name?: string | null;
          office_location?: string | null;
          position?: string | null;
          years_of_employment?: number | null;
          net_monthly_salary?: number | null;
          salary_slip_uploaded?: boolean | null;
          business_name?: string | null;
          business_location?: string | null;
          average_monthly_income?: number | null;
          type_of_business?: string | null;
          since_when_business?: string | null;
          group_name?: string | null;
          kyc_status?: 'pending' | 'verified' | 'rejected' | null;
          id_document_uploaded?: boolean | null;
          passport_photo_uploaded?: boolean | null;
          fingerprint_uploaded?: boolean | null;
          id_document_url?: string | null;
          passport_photo_url?: string | null;
          fingerprint_url?: string | null;
          salary_slip_url?: string | null;
          // Repeat Customer Fields
          client_type?: 'individual' | 'corporate' | 'group' | null;
          client_category?: 'new' | 'existing' | null;
          customer_since?: string | null;
          credit_limit?: number | null;
          pre_approved_amount?: number | null;
          risk_score?: number | null;
          average_loan_amount?: number | null;
          consecutive_on_time_payments?: number | null;
          total_overdue_days?: number | null;
          preferred_loan_amount?: number | null;
          preferred_loan_term?: number | null;
          last_contact_date?: string | null;
          customer_notes?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          first_name?: string | null;
          middle_name?: string | null;
          last_name?: string | null;
          common_name?: string | null;
          gender?: 'male' | 'female' | 'other' | null;
          date_of_birth?: string | null;
          national_id_number?: string | null;
          id_type?: string | null;
          phone_number?: string | null;
          email_address?: string | null;
          street_name?: string | null;
          house_number?: string | null;
          area_of_residence?: string | null;
          housing_type?: string | null;
          marital_status?: string | null;
          spouse_name?: string | null;
          spouse_common_name?: string | null;
          company_name?: string | null;
          office_location?: string | null;
          position?: string | null;
          years_of_employment?: number | null;
          net_monthly_salary?: number | null;
          salary_slip_uploaded?: boolean | null;
          business_name?: string | null;
          business_location?: string | null;
          average_monthly_income?: number | null;
          type_of_business?: string | null;
          since_when_business?: string | null;
          group_name?: string | null;
          kyc_status?: 'pending' | 'verified' | 'rejected' | null;
          id_document_uploaded?: boolean | null;
          passport_photo_uploaded?: boolean | null;
          fingerprint_uploaded?: boolean | null;
          id_document_url?: string | null;
          passport_photo_url?: string | null;
          fingerprint_url?: string | null;
          salary_slip_url?: string | null;
          // Repeat Customer Fields
          client_type?: 'individual' | 'corporate' | 'group' | null;
          client_category?: 'new' | 'existing' | null;
          customer_since?: string | null;
          credit_limit?: number | null;
          pre_approved_amount?: number | null;
          risk_score?: number | null;
          average_loan_amount?: number | null;
          consecutive_on_time_payments?: number | null;
          total_overdue_days?: number | null;
          preferred_loan_amount?: number | null;
          preferred_loan_term?: number | null;
          last_contact_date?: string | null;
          customer_notes?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      loan_products: {
        Row: {
          id: number;
          name: string;
          description: string | null;
          min_amount: number;
          max_amount: number;
          interest_rate: number;
          tenor_min_months: number | null;
          tenor_max_months: number | null;
          status: 'active' | 'draft' | 'inactive' | null;
          version: string | null;
          product_type: string | null;
          processing_fee_rate: number | null;
          late_payment_penalty_rate: number | null;
          repayment_frequency: 'daily' | 'weekly' | 'monthly' | null;
          requires_guarantor: boolean | null;
          requires_collateral: boolean | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: number;
          name: string;
          description?: string | null;
          min_amount: number;
          max_amount: number;
          interest_rate: number;
          tenor_min_months?: number | null;
          tenor_max_months?: number | null;
          status?: 'active' | 'draft' | 'inactive' | null;
          version?: string | null;
          product_type?: string | null;
          processing_fee_rate?: number | null;
          late_payment_penalty_rate?: number | null;
          repayment_frequency?: 'daily' | 'weekly' | 'monthly' | null;
          requires_guarantor?: boolean | null;
          requires_collateral?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: number;
          name?: string;
          description?: string | null;
          min_amount?: number;
          max_amount?: number;
          interest_rate?: number;
          tenor_min_months?: number | null;
          tenor_max_months?: number | null;
          status?: 'active' | 'draft' | 'inactive' | null;
          version?: string | null;
          product_type?: string | null;
          processing_fee_rate?: number | null;
          late_payment_penalty_rate?: number | null;
          repayment_frequency?: 'daily' | 'weekly' | 'monthly' | null;
          requires_guarantor?: boolean | null;
          requires_collateral?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      fees_configuration: {
        Row: {
          id: string;
          application_fee_percentage: number;
          legal_fee_amount: number;
          is_active: boolean;
          created_by_user_id: string | null;
          updated_by_user_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          application_fee_percentage?: number;
          legal_fee_amount?: number;
          is_active?: boolean;
          created_by_user_id?: string | null;
          updated_by_user_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          application_fee_percentage?: number;
          legal_fee_amount?: number;
          is_active?: boolean;
          created_by_user_id?: string | null;
          updated_by_user_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      credit_assessments: {
        Row: {
          id: string;
          loan_application_id: string;
          credit_score: number | null;
          risk_grade: string | null;
          assessment_score: number | null;
          payment_history: number | null;
          credit_utilization: number | null;
          income_stability: number | null;
          debt_to_income_ratio: number | null;
          employment_history: number | null;
          collateral_value: number | null;
          interest_rate: number | null;
          management_fee_rate: number | null;
          calculation_method: string | null;
          approved_amount: number | null;
          approved_tenor: number | null;
          disbursement_date: string | null;
          decision: 'approve' | 'approve_modified' | 'refer_committee' | 'reject' | null;
          comments: string | null;
          committee_referral_reason: string | null;
          assessed_by: string | null;
          assessed_at: string | null;
          assessment_version: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          loan_application_id: string;
          credit_score?: number | null;
          risk_grade?: string | null;
          assessment_score?: number | null;
          payment_history?: number | null;
          credit_utilization?: number | null;
          income_stability?: number | null;
          debt_to_income_ratio?: number | null;
          employment_history?: number | null;
          collateral_value?: number | null;
          interest_rate?: number | null;
          management_fee_rate?: number | null;
          calculation_method?: string | null;
          approved_amount?: number | null;
          approved_tenor?: number | null;
          disbursement_date?: string | null;
          decision?: 'approve' | 'approve_modified' | 'refer_committee' | 'reject' | null;
          comments?: string | null;
          committee_referral_reason?: string | null;
          assessed_by?: string | null;
          assessed_at?: string | null;
          assessment_version?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          loan_application_id?: string;
          credit_score?: number | null;
          risk_grade?: string | null;
          assessment_score?: number | null;
          payment_history?: number | null;
          credit_utilization?: number | null;
          income_stability?: number | null;
          debt_to_income_ratio?: number | null;
          employment_history?: number | null;
          collateral_value?: number | null;
          interest_rate?: number | null;
          management_fee_rate?: number | null;
          calculation_method?: string | null;
          approved_amount?: number | null;
          approved_tenor?: number | null;
          disbursement_date?: string | null;
          decision?: 'approve' | 'approve_modified' | 'refer_committee' | 'reject' | null;
          comments?: string | null;
          committee_referral_reason?: string | null;
          assessed_by?: string | null;
          assessed_at?: string | null;
          assessment_version?: number | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      loan_applications: {
        Row: {
          id: string;
          application_id: string | null;
          client_id: string | null;
          loan_product_id: number | null;
          requested_amount: number | null;
          repayment_period_months: number | null;
          loan_purpose: string | null;
          affordable_repayment_amount: number | null;
          source_of_income: string | null;
          employment_company_name: string | null;
          employment_office_location: string | null;
          employment_position: string | null;
          employment_start_date: string | null;
          net_monthly_salary: number | null;
          salary_slip_url: string | null;
          business_name: string | null;
          business_location: string | null;
          average_monthly_income: number | null;
          business_type: string | null;
          business_start_date: string | null;
          previous_loan_taken: boolean | null;
          previous_institution_name: string | null;
          previous_loan_date: string | null;
          previous_loan_amount: number | null;
          previous_repayment_amount: number | null;
          previous_repayment_date: string | null;
          crb_consent_given: boolean | null;
          crb_consent_timestamp: string | null;
          crb_status: string | null;
          assessment_score: number | null;
          risk_grade: string | null;
          status: 'pending' | 'under_review' | 'pending_committee_review' | 'approved' | 'rejected' | 'disbursed' | 'closed' | 'cancelled' | null;
          kyc_status: 'pending' | 'verified' | 'rejected' | null;
          created_at: string | null;
          updated_at: string | null;
          submitted_at: string | null;
          submitted_by: string | null;
          // Additional fields for loan contract generation
          interest_rate: number | null;
          management_fee_rate: number | null;
          disbursement_date: string | null;
          maturity_date: string | null;
          total_repayment_amount: number | null;
          monthly_payment: number | null;
          calculation_method: string | null;
          guarantor_name: string | null;
          guarantor_phone: string | null;
          guarantor_address: string | null;
          guarantor_occupation: string | null;
        };
        Insert: {
          id?: string;
          application_id?: string | null;
          client_id?: string | null;
          loan_product_id?: number | null;
          requested_amount?: number | null;
          repayment_period_months?: number | null;
          loan_purpose?: string | null;
          affordable_repayment_amount?: number | null;
          source_of_income?: string | null;
          employment_company_name?: string | null;
          employment_office_location?: string | null;
          employment_position?: string | null;
          employment_start_date?: string | null;
          net_monthly_salary?: number | null;
          salary_slip_url?: string | null;
          business_name?: string | null;
          business_location?: string | null;
          average_monthly_income?: number | null;
          business_type?: string | null;
          business_start_date?: string | null;
          previous_loan_taken?: boolean | null;
          previous_institution_name?: string | null;
          previous_loan_date?: string | null;
          previous_loan_amount?: number | null;
          previous_repayment_amount?: number | null;
          previous_repayment_date?: string | null;
          crb_consent_given?: boolean | null;
          crb_consent_timestamp?: string | null;
          crb_status?: string | null;
          assessment_score?: number | null;
          risk_grade?: string | null;
          status?: 'pending' | 'under_review' | 'pending_committee_review' | 'approved' | 'rejected' | 'disbursed' | 'closed' | 'cancelled' | null;
          kyc_status?: 'pending' | 'verified' | 'rejected' | null;
          created_at?: string | null;
          updated_at?: string | null;
          submitted_at?: string | null;
          submitted_by?: string | null;
          // Additional fields for loan contract generation
          interest_rate?: number | null;
          management_fee_rate?: number | null;
          disbursement_date?: string | null;
          maturity_date?: string | null;
          total_repayment_amount?: number | null;
          monthly_payment?: number | null;
          calculation_method?: string | null;
          guarantor_name?: string | null;
          guarantor_phone?: string | null;
          guarantor_address?: string | null;
          guarantor_occupation?: string | null;
        };
        Update: {
          id?: string;
          application_id?: string | null;
          client_id?: string | null;
          loan_product_id?: number | null;
          requested_amount?: number | null;
          repayment_period_months?: number | null;
          loan_purpose?: string | null;
          affordable_repayment_amount?: number | null;
          source_of_income?: string | null;
          employment_company_name?: string | null;
          employment_office_location?: string | null;
          employment_position?: string | null;
          employment_start_date?: string | null;
          net_monthly_salary?: number | null;
          salary_slip_url?: string | null;
          business_name?: string | null;
          business_location?: string | null;
          average_monthly_income?: number | null;
          business_type?: string | null;
          business_start_date?: string | null;
          previous_loan_taken?: boolean | null;
          previous_institution_name?: string | null;
          previous_loan_date?: string | null;
          previous_loan_amount?: number | null;
          previous_repayment_amount?: number | null;
          previous_repayment_date?: string | null;
          crb_consent_given?: boolean | null;
          crb_consent_timestamp?: string | null;
          crb_status?: string | null;
          assessment_score?: number | null;
          risk_grade?: string | null;
          status?: 'pending' | 'under_review' | 'pending_committee_review' | 'approved' | 'rejected' | 'disbursed' | 'closed' | 'cancelled' | null;
          kyc_status?: 'pending' | 'verified' | 'rejected' | null;
          created_at?: string | null;
          updated_at?: string | null;
          submitted_at?: string | null;
          submitted_by?: string | null;
          // Additional fields for loan contract generation
          interest_rate?: number | null;
          management_fee_rate?: number | null;
          disbursement_date?: string | null;
          maturity_date?: string | null;
          total_repayment_amount?: number | null;
          monthly_payment?: number | null;
          calculation_method?: string | null;
          guarantor_name?: string | null;
          guarantor_phone?: string | null;
          guarantor_address?: string | null;
          guarantor_occupation?: string | null;
        };
      };
      loans: {
        Row: {
          id: number;
          loan_application_id: number | null;
          user_id: number | null;
          loan_product_id: number | null;
          principal_amount: number;
          interest_amount: number;
          total_amount: number;
          status: 'active' | 'overdue' | 'repaid' | 'written_off' | 'none' | null;
          disbursement_date: string | null;
          first_repayment_date: string | null;
          last_repayment_date: string | null;
          next_repayment_date: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: number;
          loan_application_id?: number | null;
          user_id?: number | null;
          loan_product_id?: number | null;
          principal_amount: number;
          interest_amount: number;
          total_amount: number;
          status?: 'active' | 'overdue' | 'repaid' | 'written_off' | 'none' | null;
          disbursement_date?: string | null;
          first_repayment_date?: string | null;
          last_repayment_date?: string | null;
          next_repayment_date?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: number;
          loan_application_id?: number | null;
          user_id?: number | null;
          loan_product_id?: number | null;
          principal_amount?: number;
          interest_amount?: number;
          total_amount?: number;
          status?: 'active' | 'overdue' | 'repaid' | 'written_off' | 'none' | null;
          disbursement_date?: string | null;
          first_repayment_date?: string | null;
          last_repayment_date?: string | null;
          next_repayment_date?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      loan_repayments: {
        Row: {
          id: number;
          loan_id: number | null;
          user_id: number | null;
          amount: number;
          payment_method: 'm_pesa' | 'tigo_pesa' | 'airtel_money' | 'bank_transfer' | 'cash';
          payment_date: string | null;
          reference_number: string | null;
          notes: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: number;
          loan_id?: number | null;
          user_id?: number | null;
          amount: number;
          payment_method: 'm_pesa' | 'tigo_pesa' | 'airtel_money' | 'bank_transfer' | 'cash';
          payment_date?: string | null;
          reference_number?: string | null;
          notes?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: number;
          loan_id?: number | null;
          user_id?: number | null;
          amount?: number;
          payment_method?: 'm_pesa' | 'tigo_pesa' | 'airtel_money' | 'bank_transfer' | 'cash';
          payment_date?: string | null;
          reference_number?: string | null;
          notes?: string | null;
          created_at?: string | null;
        };
      };
      complaints: {
        Row: {
          id: number;
          user_id: number | null;
          loan_id: number | null;
          title: string;
          description: string;
          status: 'open' | 'in_progress' | 'resolved' | 'closed' | null;
          priority: 'low' | 'medium' | 'high' | null;
          assigned_to: number | null;
          resolution_notes: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: number;
          user_id?: number | null;
          loan_id?: number | null;
          title: string;
          description: string;
          status?: 'open' | 'in_progress' | 'resolved' | 'closed' | null;
          priority?: 'low' | 'medium' | 'high' | null;
          assigned_to?: number | null;
          resolution_notes?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: number;
          user_id?: number | null;
          loan_id?: number | null;
          title?: string;
          description?: string;
          status?: 'open' | 'in_progress' | 'resolved' | 'closed' | null;
          priority?: 'low' | 'medium' | 'high' | null;
          assigned_to?: number | null;
          resolution_notes?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      loan_guarantors: {
        Row: {
          id: string;
          loan_application_id: string;
          full_name: string;
          residence: string;
          occupation: string;
          company_business_name: string;
          office_location: string;
          relationship: string;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          loan_application_id: string;
          full_name: string;
          residence: string;
          occupation: string;
          company_business_name: string;
          office_location: string;
          relationship: string;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          loan_application_id?: string;
          full_name?: string;
          residence?: string;
          occupation?: string;
          company_business_name?: string;
          office_location?: string;
          relationship?: string;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      loan_references: {
        Row: {
          id: string;
          loan_application_id: string;
          name: string;
          phone_number: string;
          occupation: string;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          loan_application_id: string;
          name: string;
          phone_number: string;
          occupation: string;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          loan_application_id?: string;
          name?: string;
          phone_number?: string;
          occupation?: string;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      loan_collateral_assets: {
        Row: {
          id: string;
          loan_application_id: string;
          asset_type: string;
          value: number;
          description: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          loan_application_id: string;
          asset_type: string;
          value: number;
          description?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          loan_application_id?: string;
          asset_type?: string;
          value?: number;
          description?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      // Staff Management Tables
      employees: {
        Row: {
          id: string;
          employee_id: string;
          first_name: string;
          last_name: string;
          middle_name: string | null;
          email: string;
          phone: string | null;
          alternative_phone: string | null;
          national_id: string;
          date_of_birth: string;
          gender: 'male' | 'female' | 'other' | null;
          marital_status: 'single' | 'married' | 'divorced' | 'widowed' | null;
          nationality: string | null;
          residential_address: string | null;
          postal_address: string | null;
          region: string | null;
          district: string | null;
          ward: string | null;
          emergency_contact_name: string | null;
          emergency_contact_phone: string | null;
          emergency_contact_relationship: string | null;
          emergency_contact_address: string | null;
          position: string;
          department: string;
          employment_type: 'permanent' | 'contract' | 'temporary' | 'intern';
          employment_status: 'active' | 'inactive' | 'terminated' | 'resigned';
          hire_date: string;
          probation_end_date: string | null;
          contract_start_date: string | null;
          contract_end_date: string | null;
          termination_date: string | null;
          resignation_date: string | null;
          basic_salary: number;
          allowances: number | null;
          gross_salary: number;
          currency: string | null;
          bank_name: string | null;
          bank_account: string | null;
          bank_branch: string | null;
          nssf_number: string | null;
          paye_number: string | null;
          tin_number: string | null;
          highest_qualification: string | null;
          institution: string | null;
          graduation_year: number | null;
          field_of_study: string | null;
          previous_employer: string | null;
          previous_position: string | null;
          user_id: string | null;
          previous_salary: number | null;
          years_of_experience: number | null;
          created_at: string | null;
          updated_at: string | null;
          created_by: string | null;
          updated_by: string | null;
          user_id: string | null;
        };
        Insert: {
          id?: string;
          employee_id: string;
          first_name: string;
          last_name: string;
          middle_name?: string | null;
          email: string;
          phone?: string | null;
          alternative_phone?: string | null;
          national_id: string;
          date_of_birth: string;
          gender?: 'male' | 'female' | 'other' | null;
          marital_status?: 'single' | 'married' | 'divorced' | 'widowed' | null;
          nationality?: string | null;
          residential_address?: string | null;
          postal_address?: string | null;
          region?: string | null;
          district?: string | null;
          ward?: string | null;
          emergency_contact_name?: string | null;
          emergency_contact_phone?: string | null;
          emergency_contact_relationship?: string | null;
          emergency_contact_address?: string | null;
          position: string;
          department: string;
          employment_type: 'permanent' | 'contract' | 'temporary' | 'intern';
          employment_status?: 'active' | 'inactive' | 'terminated' | 'resigned';
          hire_date: string;
          probation_end_date?: string | null;
          contract_start_date?: string | null;
          contract_end_date?: string | null;
          termination_date?: string | null;
          resignation_date?: string | null;
          basic_salary: number;
          allowances?: number | null;
          currency?: string | null;
          bank_name?: string | null;
          bank_account?: string | null;
          bank_branch?: string | null;
          nssf_number?: string | null;
          paye_number?: string | null;
          tin_number?: string | null;
          highest_qualification?: string | null;
          institution?: string | null;
          graduation_year?: number | null;
          field_of_study?: string | null;
          previous_employer?: string | null;
          previous_position?: string | null;
          previous_salary?: number | null;
          years_of_experience?: number | null;
          created_at?: string | null;
          updated_at?: string | null;
          created_by?: string | null;
          updated_by?: string | null;
          user_id?: string | null;
        };
        Update: {
          id?: string;
          employee_id?: string;
          first_name?: string;
          last_name?: string;
          middle_name?: string | null;
          email?: string;
          phone?: string | null;
          alternative_phone?: string | null;
          national_id?: string;
          date_of_birth?: string;
          gender?: 'male' | 'female' | 'other' | null;
          marital_status?: 'single' | 'married' | 'divorced' | 'widowed' | null;
          nationality?: string | null;
          residential_address?: string | null;
          postal_address?: string | null;
          region?: string | null;
          district?: string | null;
          ward?: string | null;
          emergency_contact_name?: string | null;
          emergency_contact_phone?: string | null;
          emergency_contact_relationship?: string | null;
          emergency_contact_address?: string | null;
          position?: string;
          department?: string;
          employment_type?: 'permanent' | 'contract' | 'temporary' | 'intern';
          employment_status?: 'active' | 'inactive' | 'terminated' | 'resigned';
          hire_date?: string;
          probation_end_date?: string | null;
          contract_start_date?: string | null;
          contract_end_date?: string | null;
          termination_date?: string | null;
          resignation_date?: string | null;
          basic_salary?: number;
          allowances?: number | null;
          currency?: string | null;
          bank_name?: string | null;
          bank_account?: string | null;
          bank_branch?: string | null;
          nssf_number?: string | null;
          paye_number?: string | null;
          tin_number?: string | null;
          highest_qualification?: string | null;
          institution?: string | null;
          graduation_year?: number | null;
          field_of_study?: string | null;
          previous_employer?: string | null;
          previous_position?: string | null;
          previous_salary?: number | null;
          years_of_experience?: number | null;
          created_at?: string | null;
          updated_at?: string | null;
          created_by?: string | null;
          updated_by?: string | null;
          user_id?: string | null;
        };
      };

      leave_requests: {
        Row: {
          id: string;
          employee_id: string;
          leave_type: 'annual' | 'sick' | 'maternity' | 'paternity' | 'compassionate' | 'study' | 'unpaid';
          start_date: string;
          end_date: string;
          days_requested: number;
          reason: string | null;
          supporting_documents: string[] | null;
          status: 'pending' | 'approved' | 'rejected' | 'cancelled';
          requested_at: string | null;
          approved_by: string | null;
          approved_at: string | null;
          rejection_reason: string | null;
          remaining_balance: number | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          employee_id: string;
          leave_type: 'annual' | 'sick' | 'maternity' | 'paternity' | 'compassionate' | 'study' | 'unpaid';
          start_date: string;
          end_date: string;
          days_requested: number;
          reason?: string | null;
          supporting_documents?: string[] | null;
          status?: 'pending' | 'approved' | 'rejected' | 'cancelled';
          requested_at?: string | null;
          approved_by?: string | null;
          approved_at?: string | null;
          rejection_reason?: string | null;
          remaining_balance?: number | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          employee_id?: string;
          leave_type?: 'annual' | 'sick' | 'maternity' | 'paternity' | 'compassionate' | 'study' | 'unpaid';
          start_date?: string;
          end_date?: string;
          days_requested?: number;
          reason?: string | null;
          supporting_documents?: string[] | null;
          status?: 'pending' | 'approved' | 'rejected' | 'cancelled';
          requested_at?: string | null;
          approved_by?: string | null;
          approved_at?: string | null;
          rejection_reason?: string | null;
          remaining_balance?: number | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };

      attendance_records: {
        Row: {
          id: string;
          employee_id: string;
          date: string;
          check_in: string | null;
          check_out: string | null;
          break_start: string | null;
          break_end: string | null;
          hours_worked: number | null;
          overtime_hours: number | null;
          status: 'present' | 'absent' | 'late' | 'half_day' | 'sick' | 'leave';
          notes: string | null;
          check_in_location: string | null;
          check_out_location: string | null;
          created_at: string | null;
          updated_at: string | null;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          employee_id: string;
          date: string;
          check_in?: string | null;
          check_out?: string | null;
          break_start?: string | null;
          break_end?: string | null;
          hours_worked?: number | null;
          overtime_hours?: number | null;
          status?: 'present' | 'absent' | 'late' | 'half_day' | 'sick' | 'leave';
          notes?: string | null;
          check_in_location?: string | null;
          check_out_location?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
          created_by?: string | null;
        };
        Update: {
          id?: string;
          employee_id?: string;
          date?: string;
          check_in?: string | null;
          check_out?: string | null;
          break_start?: string | null;
          break_end?: string | null;
          hours_worked?: number | null;
          overtime_hours?: number | null;
          status?: 'present' | 'absent' | 'late' | 'half_day' | 'sick' | 'leave';
          notes?: string | null;
          check_in_location?: string | null;
          check_out_location?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
          created_by?: string | null;
        };
      };

      // Savings and Deposits Tables
      savings_products: {
        Row: {
          id: string;
          product_name: string;
          product_type: 'voluntary_savings' | 'compulsory_savings' | 'term_deposits' | 'special_purpose_savings';
          product_code: string;
          description: string | null;
          minimum_balance: number;
          maximum_balance: number | null;
          minimum_balance_for_interest: number;
          annual_interest_rate: number;
          interest_calculation_method: 'daily' | 'monthly' | 'quarterly' | 'annually';
          interest_posting_frequency: 'daily' | 'monthly' | 'quarterly' | 'annually';
          is_active: boolean;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          product_name: string;
          product_type: 'voluntary_savings' | 'compulsory_savings' | 'term_deposits' | 'special_purpose_savings';
          product_code: string;
          description?: string | null;
          minimum_balance?: number;
          maximum_balance?: number | null;
          minimum_balance_for_interest?: number;
          annual_interest_rate?: number;
          interest_calculation_method?: 'daily' | 'monthly' | 'quarterly' | 'annually';
          interest_posting_frequency?: 'daily' | 'monthly' | 'quarterly' | 'annually';
          is_active?: boolean;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          product_name?: string;
          product_type?: 'voluntary_savings' | 'compulsory_savings' | 'term_deposits' | 'special_purpose_savings';
          product_code?: string;
          description?: string | null;
          minimum_balance?: number;
          maximum_balance?: number | null;
          minimum_balance_for_interest?: number;
          annual_interest_rate?: number;
          interest_calculation_method?: 'daily' | 'monthly' | 'quarterly' | 'annually';
          interest_posting_frequency?: 'daily' | 'monthly' | 'quarterly' | 'annually';
          is_active?: boolean;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      savings_accounts: {
        Row: {
          id: string;
          account_number: string;
          client_id: string;
          product_id: string;
          account_name: string;
          account_status: 'active' | 'dormant' | 'closed' | 'frozen' | 'suspended';
          current_balance: number;
          available_balance: number;
          pending_balance: number | null;
          interest_earned_not_posted: number | null;
          principal_amount: number | null;
          maturity_date: string | null;
          interest_rate_at_opening: number | null;
          opened_date: string;
          last_transaction_date: string | null;
          last_interest_posting_date: string | null;
          dormant_since: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          account_number: string;
          client_id: string;
          product_id: string;
          account_name: string;
          account_status?: 'active' | 'dormant' | 'closed' | 'frozen' | 'suspended';
          current_balance?: number;
          available_balance?: number;
          pending_balance?: number | null;
          interest_earned_not_posted?: number | null;
          principal_amount?: number | null;
          maturity_date?: string | null;
          interest_rate_at_opening?: number | null;
          opened_date?: string;
          last_transaction_date?: string | null;
          last_interest_posting_date?: string | null;
          dormant_since?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          account_number?: string;
          client_id?: string;
          product_id?: string;
          account_name?: string;
          account_status?: 'active' | 'dormant' | 'closed' | 'frozen' | 'suspended';
          current_balance?: number;
          available_balance?: number;
          pending_balance?: number | null;
          interest_earned_not_posted?: number | null;
          principal_amount?: number | null;
          maturity_date?: string | null;
          interest_rate_at_opening?: number | null;
          opened_date?: string;
          last_transaction_date?: string | null;
          last_interest_posting_date?: string | null;
          dormant_since?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      savings_transactions: {
        Row: {
          id: string;
          account_id: string;
          transaction_type: 'deposit' | 'withdrawal' | 'interest_posting' | 'fee' | 'transfer_in' | 'transfer_out';
          amount: number;
          balance_after: number;
          transaction_date: string;
          reference_number: string | null;
          description: string | null;
          created_by: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          account_id: string;
          transaction_type: 'deposit' | 'withdrawal' | 'interest_posting' | 'fee' | 'transfer_in' | 'transfer_out';
          amount: number;
          balance_after: number;
          transaction_date?: string;
          reference_number?: string | null;
          description?: string | null;
          created_by?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          account_id?: string;
          transaction_type?: 'deposit' | 'withdrawal' | 'interest_posting' | 'fee' | 'transfer_in' | 'transfer_out';
          amount?: number;
          balance_after?: number;
          transaction_date?: string;
          reference_number?: string | null;
          description?: string | null;
          created_by?: string | null;
          created_at?: string | null;
        };
      };
      interest_posting_batches: {
        Row: {
          id: string;
          batch_name: string;
          period_start: string;
          period_end: string;
          total_accounts: number | null;
          total_interest: number | null;
          status: 'pending' | 'processing' | 'completed' | 'failed';
          posted_by: string | null;
          posted_at: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          batch_name: string;
          period_start: string;
          period_end: string;
          total_accounts?: number | null;
          total_interest?: number | null;
          status?: 'pending' | 'processing' | 'completed' | 'failed';
          posted_by?: string | null;
          posted_at?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          batch_name?: string;
          period_start?: string;
          period_end?: string;
          total_accounts?: number | null;
          total_interest?: number | null;
          status?: 'pending' | 'processing' | 'completed' | 'failed';
          posted_by?: string | null;
          posted_at?: string | null;
          created_at?: string | null;
        };
      };
      interest_posting_details: {
        Row: {
          id: string;
          batch_id: string;
          account_id: string;
          interest_amount: number;
          balance_before: number;
          balance_after: number;
          interest_rate: number;
          days_calculated: number;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          batch_id: string;
          account_id: string;
          interest_amount: number;
          balance_before: number;
          balance_after: number;
          interest_rate: number;
          days_calculated: number;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          batch_id?: string;
          account_id?: string;
          interest_amount?: number;
          balance_before?: number;
          balance_after?: number;
          interest_rate?: number;
          days_calculated?: number;
          created_at?: string | null;
        };
      };
      
      // Expense Management Tables
      expense_categories: {
        Row: {
          id: string;
          category_code: string;
          category_name: string;
          description: string | null;
          category_type: 'interest' | 'operating' | 'tax';
          msp202_line_item: string | null;
          is_budgetable: boolean;
          is_active: boolean;
          approval_required: boolean;
          approval_limit: number;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          category_code: string;
          category_name: string;
          description?: string | null;
          category_type: 'interest' | 'operating' | 'tax';
          msp202_line_item?: string | null;
          is_budgetable?: boolean;
          is_active?: boolean;
          approval_required?: boolean;
          approval_limit?: number;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          category_code?: string;
          category_name?: string;
          description?: string | null;
          category_type?: 'interest' | 'operating' | 'tax';
          msp202_line_item?: string | null;
          is_budgetable?: boolean;
          is_active?: boolean;
          approval_required?: boolean;
          approval_limit?: number;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      
      vendors: {
        Row: {
          id: string;
          vendor_name: string;
          vendor_type: 'supplier' | 'service_provider' | 'contractor' | 'consultant';
          contact_person: string | null;
          email: string | null;
          phone: string | null;
          address: string | null;
          tax_id: string | null;
          is_approved: boolean;
          is_active: boolean;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          vendor_name: string;
          vendor_type: 'supplier' | 'service_provider' | 'contractor' | 'consultant';
          contact_person?: string | null;
          email?: string | null;
          phone?: string | null;
          address?: string | null;
          tax_id?: string | null;
          is_approved?: boolean;
          is_active?: boolean;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          vendor_name?: string;
          vendor_type?: 'supplier' | 'service_provider' | 'contractor' | 'consultant';
          contact_person?: string | null;
          email?: string | null;
          phone?: string | null;
          address?: string | null;
          tax_id?: string | null;
          is_approved?: boolean;
          is_active?: boolean;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      
      expenses: {
        Row: {
          id: string;
          category_id: string | null;
          subcategory_id: string | null;
          vendor_id: string | null;
          amount: number;
          currency: string;
          expense_date: string;
          description: string | null;
          vendor_name: string | null;
          supporting_documents: any | null;
          approval_status: 'draft' | 'pending' | 'approved' | 'rejected';
          submitted_by: string;
          submitted_at: string | null;
          approved_by: string | null;
          approved_at: string | null;
          rejection_reason: string | null;
          bot_impact: any | null;
          budget_impact: any | null;
          created_at: string | null;
          updated_at: string | null;
          tenant_id: string | null;
        };
        Insert: {
          id?: string;
          category_id?: string | null;
          subcategory_id?: string | null;
          vendor_id?: string | null;
          amount: number;
          currency?: string;
          expense_date: string;
          description?: string | null;
          vendor_name?: string | null;
          supporting_documents?: any | null;
          approval_status?: 'draft' | 'pending' | 'approved' | 'rejected';
          submitted_by: string;
          submitted_at?: string | null;
          submitted_by?: string | null;
          approved_by?: string | null;
          approved_at?: string | null;
          rejection_reason?: string | null;
          bot_impact?: any | null;
          budget_impact?: any | null;
          created_at?: string | null;
          updated_at?: string | null;
          tenant_id?: string | null;
        };
        Update: {
          id?: string;
          category_id?: string | null;
          subcategory_id?: string | null;
          vendor_id?: string | null;
          amount?: number;
          currency?: string;
          expense_date?: string;
          description?: string | null;
          vendor_name?: string | null;
          supporting_documents?: any | null;
          approval_status?: 'draft' | 'pending' | 'approved' | 'rejected';
          submitted_by?: string;
          submitted_at?: string | null;
          submitted_by?: string | null;
          approved_by?: string | null;
          approved_at?: string | null;
          rejection_reason?: string | null;
          bot_impact?: any | null;
          budget_impact?: any | null;
          created_at?: string | null;
          updated_at?: string | null;
          tenant_id?: string | null;
        };
      };
      
      expense_subcategories: {
        Row: {
          id: string;
          category_id: string;
          subcategory_code: string;
          subcategory_name: string;
          description: string | null;
          is_active: boolean;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          category_id: string;
          subcategory_code: string;
          subcategory_name: string;
          description?: string | null;
          is_active?: boolean;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          category_id?: string;
          subcategory_code?: string;
          subcategory_name?: string;
          description?: string | null;
          is_active?: boolean;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      
      budget_periods: {
        Row: {
          id: string;
          period_name: string;
          start_date: string;
          end_date: string;
          is_active: boolean;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          period_name: string;
          start_date: string;
          end_date: string;
          is_active?: boolean;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          period_name?: string;
          start_date?: string;
          end_date?: string;
          is_active?: boolean;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      
      budget_items: {
        Row: {
          id: string;
          category_id: string | null;
          budget_period_id: string | null;
          budgeted_amount: number;
          actual_amount: number;
          committed_amount: number;
          available_amount: number;
          variance_amount: number;
          variance_percentage: number;
          is_over_budget: boolean;
          last_updated: string | null;
          updated_by: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          category_id?: string | null;
          budget_period_id?: string | null;
          budgeted_amount: number;
          actual_amount?: number;
          committed_amount?: number;
          updated_by?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          category_id?: string | null;
          budget_period_id?: string | null;
          budgeted_amount?: number;
          actual_amount?: number;
          committed_amount?: number;
          updated_by?: string | null;
          created_at?: string | null;
        };
      };
      
      expense_audit_logs: {
        Row: {
          id: string;
          expense_id: string | null;
          action: string;
          details: string | null;
          user_id: string | null;
          log_type: 'info' | 'warning' | 'error' | 'success';
          timestamp: string | null;
        };
        Insert: {
          id?: string;
          expense_id?: string | null;
          action: string;
          details?: string | null;
          user_id?: string | null;
          log_type?: 'info' | 'warning' | 'error' | 'success';
          timestamp?: string | null;
        };
        Update: {
          id?: string;
          expense_id?: string | null;
          action?: string;
          details?: string | null;
          user_id?: string | null;
          log_type?: 'info' | 'warning' | 'error' | 'success';
          timestamp?: string | null;
        };
      };
      // Add more table types as needed
    };
  };
};

// Helper function to handle Supabase errors
export const handleSupabaseError = (error: any) => {
  console.error('Supabase error:', error);
  if (error?.message) {
    return error.message;
  }
  return 'An unexpected error occurred';
};

// Helper function to check if user is authenticated
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) {
    console.error('Error getting current user:', error);
    return null;
  }
  return user;
};

// Helper function to get user profile
export const getUserProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('user_id', userId)
    .single();
  
  if (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
  return data;
};