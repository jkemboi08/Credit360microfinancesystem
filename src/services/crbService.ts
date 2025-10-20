import { supabase, handleSupabaseError } from '../lib/supabaseClient';

export interface CRBReportData {
  client_id: string;
  loan_application_id?: string;
  credit_score: number;
  risk_grade: string;
  payment_history_score: number;
  active_loans_count: number;
  total_exposure: number;
  defaults_count: number;
  consent_timestamp: string;
  accessed_by_user_id: string;
  access_purpose: string;
}

export class CRBService {
  // Pull CRB report for client
  static async pullCRBReport(
    clientId: string, 
    loanApplicationId: string | null, 
    accessedBy: string,
    purpose: string = 'loan_assessment'
  ) {
    try {
      // Mock CRB API call - in real implementation, call actual CRB API
      const mockCRBData = {
        credit_score: Math.floor(Math.random() * 200) + 600, // 600-800 range
        risk_grade: ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C'][Math.floor(Math.random() * 8)],
        payment_history_score: Math.floor(Math.random() * 30) + 70, // 70-100 range
        active_loans_count: Math.floor(Math.random() * 3) + 1, // 1-3 loans
        total_exposure: Math.floor(Math.random() * 5000000) + 1000000, // 1M-6M TZS
        defaults_count: Math.random() > 0.8 ? 1 : 0, // 20% chance of having defaults
        detailed_history: {
          accounts: [
            {
              institution: 'ABC Microfinance',
              account_type: 'Micro Loan',
              opening_date: '2023-06-15',
              status: 'Closed',
              payment_behavior: 'Excellent'
            },
            {
              institution: 'XYZ Bank',
              account_type: 'Personal Loan',
              opening_date: '2024-01-10',
              status: 'Active',
              payment_behavior: 'Good'
            }
          ],
          inquiries: [
            {
              date: '2024-12-15',
              institution: 'DEF Microfinance',
              purpose: 'Loan Application'
            }
          ]
        },
        api_metadata: {
          report_date: new Date().toISOString(),
          bureau_reference: `CRB_${Date.now()}`,
          api_version: '2.1'
        }
      };

      // Store CRB report
      const reportData: CRBReportData = {
        client_id: clientId,
        loan_application_id: loanApplicationId,
        credit_score: mockCRBData.credit_score,
        risk_grade: mockCRBData.risk_grade,
        payment_history_score: mockCRBData.payment_history_score,
        active_loans_count: mockCRBData.active_loans_count,
        total_exposure: mockCRBData.total_exposure,
        defaults_count: mockCRBData.defaults_count,
        consent_timestamp: new Date().toISOString(),
        accessed_by_user_id: accessedBy,
        access_purpose: purpose
      };

      const { data, error } = await supabase
        .from('crb_reports')
        .insert({
          ...reportData,
          report_data: mockCRBData, // Store full report as JSONB
          is_encrypted: true
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Update client's last CRB check date
      await supabase
        .from('clients')
        .update({ 
          last_crb_check_date: new Date().toISOString().split('T')[0],
          credit_score: mockCRBData.risk_grade
        })
        .eq('id', clientId);

      return { data: { ...data, report_details: mockCRBData }, error: null };
    } catch (error) {
      return { data: null, error: handleSupabaseError(error) };
    }
  }

  // Get CRB report for client
  static async getCRBReport(clientId: string, applicationId?: string) {
    try {
      let query = supabase
        .from('crb_reports')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (applicationId) {
        query = query.eq('loan_application_id', applicationId);
      }

      const { data, error } = await supabase
        .from('crb_reports')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') { // Not found error
        throw error;
      }

      return { data, error: null };
    } catch (error) {
      return { data: null, error: handleSupabaseError(error) };
    }
  }

  // Check if client needs fresh CRB report
  static async needsFreshCRBReport(clientId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('crb_reports')
        .select('created_at')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !data) {
        return true; // No report exists, need fresh one
      }

      // Check if report is older than 30 days
      const reportDate = new Date(data.created_at);
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      
      return reportDate < thirtyDaysAgo;
    } catch (error) {
      console.error('Error checking CRB report freshness:', error);
      return true; // Default to requiring fresh report
    }
  }

  // Log CRB access for audit trail
  static async logCRBAccess(clientId: string, accessedBy: string, purpose: string) {
    try {
      const { error } = await supabase
        .from('audit_logs')
        .insert({
          user_id: accessedBy,
          action: 'CRB Report Access',
          details: `Accessed CRB report for client ${clientId}`,
          category: 'crb_access',
          entity_type: 'client',
          entity_id: clientId,
          data_points_accessed: ['credit_score', 'payment_history', 'outstanding_loans'],
          is_encrypted: true
        });

      if (error) {
        console.error('Error logging CRB access:', error);
      }
    } catch (error) {
      console.error('Error logging CRB access:', error);
    }
  }
}