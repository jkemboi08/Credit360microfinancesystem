import { supabase } from '../lib/supabaseClient';

export interface CreditAssessmentData {
  // Basic Assessment Data
  creditScore: number;
  riskGrade: string;
  assessmentScore: number;
  
  // Detailed Assessment Metrics
  paymentHistory: number;
  creditUtilization: number;
  incomeStability: number;
  debtToIncomeRatio: number;
  employmentHistory: number;
  collateralValue: number;
  
  // Loan Parameters
  interestRate: number;
  managementFeeRate: number;
  calculationMethod: string;
  approvedAmount: number;
  approvedTenor: number;
  disbursementDate: string;
  
  // Assessment Decision
  decision: 'approve' | 'approve_modified' | 'refer_committee' | 'reject';
  comments?: string;
  committeeReferralReason?: string;
}

export class CreditAssessmentService {
  /**
   * Get or create a credit assessment for a loan application
   */
  static async getOrCreateAssessment(loanApplicationId: string, assessedBy: string): Promise<string> {
    try {
      const { data, error } = await supabase.rpc('get_or_create_credit_assessment', {
        p_loan_application_id: loanApplicationId,
        p_assessed_by: assessedBy
      });

      if (error) {
        console.error('Error getting/creating assessment:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Failed to get/create assessment:', error);
      throw error;
    }
  }

  /**
   * Save complete assessment data
   */
  static async saveAssessment(
    loanApplicationId: string, 
    assessmentData: CreditAssessmentData, 
    assessedBy: string
  ): Promise<void> {
    try {
      // Get or create assessment record
      const assessmentId = await this.getOrCreateAssessment(loanApplicationId, assessedBy);

      // Update the assessment with all data
      const { error } = await supabase
        .from('credit_assessments')
        .update({
          credit_score: assessmentData.creditScore,
          risk_grade: assessmentData.riskGrade,
          assessment_score: assessmentData.assessmentScore,
          payment_history: assessmentData.paymentHistory,
          credit_utilization: assessmentData.creditUtilization,
          income_stability: assessmentData.incomeStability,
          debt_to_income_ratio: assessmentData.debtToIncomeRatio,
          employment_history: assessmentData.employmentHistory,
          collateral_value: assessmentData.collateralValue,
          interest_rate: assessmentData.interestRate,
          management_fee_rate: assessmentData.managementFeeRate,
          calculation_method: assessmentData.calculationMethod,
          approved_amount: assessmentData.approvedAmount,
          approved_tenor: assessmentData.approvedTenor,
          disbursement_date: assessmentData.disbursementDate,
          decision: assessmentData.decision,
          comments: assessmentData.comments,
          committee_referral_reason: assessmentData.committeeReferralReason,
          assessed_by: assessedBy,
          assessed_at: new Date().toISOString()
        })
        .eq('id', assessmentId);

      if (error) {
        console.error('Error saving assessment:', error);
        throw error;
      }

      console.log('✅ Assessment saved successfully');
    } catch (error) {
      console.error('Failed to save assessment:', error);
      throw error;
    }
  }

  /**
   * Get existing assessment for a loan application
   */
  static async getAssessment(loanApplicationId: string): Promise<CreditAssessmentData | null> {
    try {
      const { data, error } = await supabase
        .from('credit_assessments')
        .select('*')
        .eq('loan_application_id', loanApplicationId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No assessment found
          return null;
        }
        console.error('Error getting assessment:', error);
        throw error;
      }

      // Transform database data to interface format
      return {
        creditScore: data.credit_score || 0,
        riskGrade: data.risk_grade || '',
        assessmentScore: data.assessment_score || 0,
        paymentHistory: data.payment_history || 0,
        creditUtilization: data.credit_utilization || 0,
        incomeStability: data.income_stability || 0,
        debtToIncomeRatio: data.debt_to_income_ratio || 0,
        employmentHistory: data.employment_history || 0,
        collateralValue: data.collateral_value || 0,
        interestRate: data.interest_rate || 0,
        managementFeeRate: data.management_fee_rate || 0,
        calculationMethod: data.calculation_method || '',
        approvedAmount: data.approved_amount || 0,
        approvedTenor: data.approved_tenor || 0,
        disbursementDate: data.disbursement_date || '',
        decision: data.decision || 'approve',
        comments: data.comments || '',
        committeeReferralReason: data.committee_referral_reason || ''
      };
    } catch (error) {
      console.error('Failed to get assessment:', error);
      throw error;
    }
  }

  /**
   * Update only the decision and related fields
   */
  static async updateDecision(
    loanApplicationId: string,
    decision: 'approve' | 'approve_modified' | 'refer_committee' | 'reject',
    comments?: string,
    committeeReferralReason?: string,
    assessedBy?: string
  ): Promise<void> {
    try {
      const updateData: any = {
        decision,
        comments,
        committee_referral_reason: committeeReferralReason,
        assessed_at: new Date().toISOString()
      };

      if (assessedBy) {
        updateData.assessed_by = assessedBy;
      }

      const { error } = await supabase
        .from('credit_assessments')
        .update(updateData)
        .eq('loan_application_id', loanApplicationId);

      if (error) {
        console.error('Error updating decision:', error);
        throw error;
      }

      console.log('✅ Decision updated successfully');
    } catch (error) {
      console.error('Failed to update decision:', error);
      throw error;
    }
  }

  /**
   * Get assessment history for a loan application
   */
  static async getAssessmentHistory(loanApplicationId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('credit_assessments')
        .select(`
          *,
          users:assessed_by (
            first_name,
            last_name,
            email
          )
        `)
        .eq('loan_application_id', loanApplicationId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error getting assessment history:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Failed to get assessment history:', error);
      throw error;
    }
  }
}