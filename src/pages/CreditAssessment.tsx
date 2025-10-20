import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  BarChart3, 
  CheckCircle, 
  AlertCircle, 
  User, 
  DollarSign,
  Calendar,
  FileText,
  CreditCard,
  TrendingUp,
  Shield,
  Clock,
  Users,
  AlertTriangle
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useSupabaseAuth } from '../context/SupabaseAuthContext';
import { UnifiedApprovalService, ApprovalLevel } from '../services/unifiedApprovalService';

interface CreditAssessmentData {
  loanApplication: any;
  client: any;
  assessmentScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  recommendations: string[];
  canApprove: boolean;
  requiresCommittee: boolean;
  approvalLevel: ApprovalLevel | null;
  committeeThreshold: number | null;
  assessmentDecision: 'approve' | 'refer_to_committee' | 'reject' | '';
  committeeReferralReason: string;
}

const CreditAssessment: React.FC = () => {
  const { loanId } = useParams<{ loanId: string }>();
  const navigate = useNavigate();
  const { user } = useSupabaseAuth();
  const [assessmentData, setAssessmentData] = useState<CreditAssessmentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [assessmentDecision, setAssessmentDecision] = useState<'approve' | 'refer_to_committee' | 'reject' | ''>('');
  const [committeeReferralReason, setCommitteeReferralReason] = useState('');

  useEffect(() => {
    if (loanId) {
      loadAssessmentData();
    }
  }, [loanId]);

  const loadAssessmentData = async () => {
    try {
      setLoading(true);
      setError(null);

      // First, fetch the loan application
      const { data: loanApplication, error: loanError } = await supabase
        .from('loan_applications')
        .select('*')
        .eq('id', loanId)
        .single();

      if (loanError) {
        throw new Error(`Failed to load loan application: ${loanError.message}`);
      }

      if (!loanApplication) {
        throw new Error('Loan application not found');
      }

      // Then fetch the client data separately
      const { data: client, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .eq('id', loanApplication.client_id)
        .single();

      if (clientError) {
        console.warn('Failed to load client data:', clientError.message);
        // Continue with minimal client data
      }

      // Combine the data
      const combinedData = {
        ...loanApplication,
        clients: client || {
          id: loanApplication.client_id,
          full_name: 'Unknown Client',
          phone_number: 'Not provided',
          address: 'Not provided',
          business_type: 'Not specified',
          monthly_income: null,
          credit_score: null
        }
      };

      // Calculate assessment score and risk level
      const assessmentScore = calculateAssessmentScore(combinedData);
      const riskLevel = determineRiskLevel(assessmentScore);
      
      // Determine approval level based on loan amount and client type
      const approvalLevel = await UnifiedApprovalService.determineApprovalLevel(
        combinedData.requested_amount, 
        combinedData.client_type || 'individual'
      );
      
      const recommendations = generateRecommendations(combinedData, assessmentScore, approvalLevel);
      
      // Check if committee review is required based on approval levels
      const requiresCommittee = approvalLevel?.requires_committee_approval && 
        combinedData.requested_amount >= (approvalLevel.committee_threshold || 0);
      
      const committeeThreshold = approvalLevel?.committee_threshold || null;
      
      // Determine if loan officer can approve (based on approval level authority)
      const canApprove = approvalLevel?.approval_authority === 'loan_officer' && 
        assessmentScore >= 60 && !requiresCommittee;

      setAssessmentData({
        loanApplication: combinedData,
        client: combinedData.clients,
        assessmentScore,
        riskLevel,
        recommendations,
        canApprove,
        requiresCommittee,
        approvalLevel,
        committeeThreshold,
        assessmentDecision: '',
        committeeReferralReason: ''
      });

    } catch (err) {
      console.error('Error loading assessment data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load assessment data');
    } finally {
      setLoading(false);
    }
  };

  const calculateAssessmentScore = (loanApplication: any): number => {
    let score = 0;
    const client = loanApplication.clients;

    // Credit score (40% weight)
    if (client.credit_score) {
      score += (client.credit_score / 850) * 40;
    } else {
      score += 20; // Default if no credit score
    }

    // Monthly income vs loan amount (30% weight)
    if (client.monthly_income && loanApplication.requested_amount) {
      const debtToIncomeRatio = loanApplication.requested_amount / (client.monthly_income * 12);
      if (debtToIncomeRatio <= 0.3) {
        score += 30;
      } else if (debtToIncomeRatio <= 0.5) {
        score += 20;
      } else if (debtToIncomeRatio <= 0.7) {
        score += 10;
      }
    }

    // Business type stability (20% weight)
    const stableBusinesses = ['retail', 'wholesale', 'manufacturing', 'services'];
    if (stableBusinesses.includes(client.business_type?.toLowerCase())) {
      score += 20;
    } else {
      score += 10;
    }

    // Loan amount reasonableness (10% weight)
    if (loanApplication.requested_amount <= 1000000) {
      score += 10;
    } else if (loanApplication.requested_amount <= 5000000) {
      score += 8;
    } else if (loanApplication.requested_amount <= 10000000) {
      score += 5;
    }

    return Math.round(score);
  };

  const determineRiskLevel = (score: number): 'low' | 'medium' | 'high' => {
    if (score >= 75) return 'low';
    if (score >= 50) return 'medium';
    return 'high';
  };

  const generateRecommendations = (loanApplication: any, score: number, approvalLevel?: ApprovalLevel | null): string[] => {
    const recommendations: string[] = [];
    const client = loanApplication.clients;

    if (score < 50) {
      recommendations.push('High risk application - consider rejection or require additional collateral');
    } else if (score < 70) {
      recommendations.push('Medium risk - consider reducing loan amount or requiring co-signer');
    } else {
      recommendations.push('Low risk - application appears suitable for approval');
    }

    if (client.credit_score && client.credit_score < 600) {
      recommendations.push('Low credit score - consider higher interest rate');
    }

    // Add approval level specific recommendations
    if (approvalLevel) {
      if (approvalLevel.requires_committee_approval && 
          loanApplication.requested_amount >= (approvalLevel.committee_threshold || 0)) {
        recommendations.push(`Loan amount (TSh ${loanApplication.requested_amount.toLocaleString()}) exceeds committee threshold (TSh ${(approvalLevel.committee_threshold || 0).toLocaleString()}) - requires committee review`);
      }
      
      if (approvalLevel.approval_authority === 'committee') {
        recommendations.push('This loan requires committee approval based on amount and risk level');
      } else if (approvalLevel.approval_authority === 'manager') {
        recommendations.push('This loan requires manager approval');
      } else if (approvalLevel.approval_authority === 'senior_officer') {
        recommendations.push('This loan requires senior officer approval');
      }
    }

    return recommendations;
  };

  const handleApprove = async () => {
    if (!assessmentData || !user) return;

    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from('loan_applications')
        .update({
          status: 'approved',
          approval_status: 'approved',
          assessment_score: assessmentData.assessmentScore,
          approved_at: new Date().toISOString(),
          approved_by: user.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', loanId);

      if (error) {
        throw new Error(`Failed to approve loan: ${error.message}`);
      }

      alert('Loan approved successfully!');
      navigate('/staff/loan-processing');
    } catch (err) {
      console.error('Error approving loan:', err);
      alert(err instanceof Error ? err.message : 'Failed to approve loan');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleForwardToCommittee = async () => {
    if (!assessmentData || !user) return;

    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from('loan_applications')
        .update({
          status: 'pending_committee_review',
          approval_status: 'pending_committee_review',
          assessment_score: assessmentData.assessmentScore,
          committee_review_reason: committeeReferralReason || 'High amount or risk assessment requires committee review',
          updated_at: new Date().toISOString()
        })
        .eq('id', loanId);

      if (error) {
        throw new Error(`Failed to forward to committee: ${error.message}`);
      }

      alert('Loan forwarded to committee for review!');
      navigate('/staff/loan-committee-approval');
    } catch (err) {
      console.error('Error forwarding to committee:', err);
      alert(err instanceof Error ? err.message : 'Failed to forward to committee');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReferToCommittee = async () => {
    if (!assessmentData || !user || !committeeReferralReason.trim()) {
      alert('Please provide a reason for committee referral');
      return;
    }

    setIsProcessing(true);
    try {
      // Use the unified approval service to process the committee referral
      const result = await UnifiedApprovalService.processApprovalAction(
        loanId!,
        'refer_to_committee',
        user.id,
        committeeReferralReason
      );

      if (result.success) {
        alert('Loan referred to committee for review!');
        navigate('/staff/loan-committee-approval');
      } else {
        throw new Error(result.message);
      }
    } catch (err) {
      console.error('Error referring to committee:', err);
      alert(err instanceof Error ? err.message : 'Failed to refer to committee');
    } finally {
      setIsProcessing(false);
    }
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'high': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading assessment data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Assessment</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/staff/loan-processing')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Loan Processing
          </button>
        </div>
      </div>
    );
  }

  if (!assessmentData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Assessment Data</h2>
          <p className="text-gray-600 mb-4">Unable to load assessment data for this loan.</p>
          <button
            onClick={() => navigate('/staff/loan-processing')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Loan Processing
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/staff/loan-processing')}
                className="flex items-center text-gray-600 hover:text-gray-900 mr-4"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Loan Processing
              </button>
              <div className="flex items-center">
                <BarChart3 className="w-8 h-8 text-blue-600 mr-3" />
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">Credit Assessment</h1>
                  <p className="text-sm text-gray-600">Loan ID: {loanId}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Client Information */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <User className="w-5 h-5 mr-2 text-blue-600" />
                Client Information
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Name</label>
                  <p className="text-gray-900">{assessmentData.client.full_name}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700">Phone</label>
                  <p className="text-gray-900">{assessmentData.client.phone_number}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700">Email</label>
                  <p className="text-gray-900">{assessmentData.client.email || 'Not provided'}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700">Business Type</label>
                  <p className="text-gray-900">{assessmentData.client.business_type || 'Not specified'}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700">Monthly Income</label>
                  <p className="text-gray-900">
                    {assessmentData.client.monthly_income 
                      ? `TSh ${assessmentData.client.monthly_income.toLocaleString()}`
                      : 'Not provided'
                    }
                  </p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700">Credit Score</label>
                  <p className="text-gray-900">
                    {assessmentData.client.credit_score || 'Not available'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Assessment Details */}
          <div className="lg:col-span-2">
            <div className="space-y-6">
              {/* Assessment Score */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
                  Assessment Score
                </h3>
                
                <div className="flex items-center justify-between mb-4">
                  <div className="text-4xl font-bold text-gray-900">
                    {assessmentData.assessmentScore}/100
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${getRiskColor(assessmentData.riskLevel)}`}>
                    {assessmentData.riskLevel.toUpperCase()} RISK
                  </div>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all duration-300 ${
                      assessmentData.riskLevel === 'low' ? 'bg-green-500' :
                      assessmentData.riskLevel === 'medium' ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${assessmentData.assessmentScore}%` }}
                  ></div>
                </div>
              </div>

              {/* Loan Details */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <DollarSign className="w-5 h-5 mr-2 text-purple-600" />
                  Loan Details
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Requested Amount</label>
                    <p className="text-xl font-semibold text-gray-900">
                      TSh {assessmentData.loanApplication.requested_amount?.toLocaleString()}
                    </p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700">Repayment Period</label>
                    <p className="text-xl font-semibold text-gray-900">
                      {assessmentData.loanApplication.repayment_period_months} months
                    </p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700">Loan Purpose</label>
                    <p className="text-gray-900">{assessmentData.loanApplication.loan_purpose}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700">Application Date</label>
                    <p className="text-gray-900">
                      {new Date(assessmentData.loanApplication.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Recommendations */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Shield className="w-5 h-5 mr-2 text-orange-600" />
                  Recommendations
                </h3>
                
                <ul className="space-y-2">
                  {assessmentData.recommendations.map((recommendation, index) => (
                    <li key={index} className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{recommendation}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Assessment Decision */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Clock className="w-5 h-5 mr-2 text-blue-600" />
                  Assessment Decision
                </h3>
                
                {/* Approval Level Information */}
                {assessmentData.approvalLevel && (
                  <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="font-medium text-blue-900 mb-2">Approval Level Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-blue-700">Approval Level:</span>
                        <span className="ml-2 text-blue-900">{assessmentData.approvalLevel.level_name}</span>
                      </div>
                      <div>
                        <span className="font-medium text-blue-700">Authority:</span>
                        <span className="ml-2 text-blue-900 capitalize">{assessmentData.approvalLevel.approval_authority.replace('_', ' ')}</span>
                      </div>
                      <div>
                        <span className="font-medium text-blue-700">Amount Range:</span>
                        <span className="ml-2 text-blue-900">
                          TSh {assessmentData.approvalLevel.min_amount.toLocaleString()} - {assessmentData.approvalLevel.max_amount.toLocaleString()}
                        </span>
                      </div>
                      {assessmentData.committeeThreshold && (
                        <div>
                          <span className="font-medium text-blue-700">Committee Threshold:</span>
                          <span className="ml-2 text-blue-900">TSh {assessmentData.committeeThreshold.toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Committee Review Warning */}
                {assessmentData.requiresCommittee && (
                  <div className="mb-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div className="flex items-start">
                      <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-medium text-yellow-900 mb-1">Committee Review Required</h4>
                        <p className="text-sm text-yellow-800">
                          This loan amount (TSh {assessmentData.loanApplication.requested_amount?.toLocaleString()}) 
                          {assessmentData.committeeThreshold && ` exceeds the committee threshold (TSh ${assessmentData.committeeThreshold.toLocaleString()})`} 
                          and requires committee approval.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Decision Options */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Assessment Decision
                    </label>
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="assessmentDecision"
                          value="approve"
                          checked={assessmentDecision === 'approve'}
                          onChange={(e) => setAssessmentDecision(e.target.value as any)}
                          disabled={!assessmentData.canApprove}
                          className="mr-3"
                        />
                        <span className={`${!assessmentData.canApprove ? 'text-gray-400' : 'text-gray-700'}`}>
                          Approve Loan {!assessmentData.canApprove && '(Not Available - Requires Higher Authority)'}
                        </span>
                      </label>
                      
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="assessmentDecision"
                          value="refer_to_committee"
                          checked={assessmentDecision === 'refer_to_committee'}
                          onChange={(e) => setAssessmentDecision(e.target.value as any)}
                          className="mr-3"
                        />
                        <span className="text-gray-700">Refer to Credit Committee</span>
                      </label>
                      
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="assessmentDecision"
                          value="reject"
                          checked={assessmentDecision === 'reject'}
                          onChange={(e) => setAssessmentDecision(e.target.value as any)}
                          className="mr-3"
                        />
                        <span className="text-gray-700">Reject Application</span>
                      </label>
                    </div>
                  </div>

                  {/* Committee Referral Reason */}
                  {assessmentDecision === 'refer_to_committee' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Reason for Committee Referral
                      </label>
                      <textarea
                        value={committeeReferralReason}
                        onChange={(e) => setCommitteeReferralReason(e.target.value)}
                        placeholder="Please provide a detailed reason for referring this loan to the credit committee..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        rows={3}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Clock className="w-5 h-5 mr-2 text-blue-600" />
                  Actions
                </h3>
                
                <div className="flex flex-col sm:flex-row gap-4">
                  {assessmentDecision === 'approve' && assessmentData.canApprove && (
                    <button
                      onClick={handleApprove}
                      disabled={isProcessing}
                      className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 flex items-center justify-center"
                    >
                      <CheckCircle className="w-5 h-5 mr-2" />
                      {isProcessing ? 'Processing...' : 'Approve Loan'}
                    </button>
                  )}
                  
                  {assessmentDecision === 'refer_to_committee' && (
                    <button
                      onClick={handleReferToCommittee}
                      disabled={isProcessing || !committeeReferralReason.trim()}
                      className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 flex items-center justify-center"
                    >
                      <Users className="w-5 h-5 mr-2" />
                      {isProcessing ? 'Processing...' : 'Refer to Credit Committee'}
                    </button>
                  )}
                  
                  {assessmentDecision === 'reject' && (
                    <button
                      onClick={() => {
                        if (window.confirm('Are you sure you want to reject this loan application?')) {
                          // Handle rejection logic here
                          alert('Rejection functionality will be implemented');
                        }
                      }}
                      disabled={isProcessing}
                      className="flex-1 bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 flex items-center justify-center"
                    >
                      <AlertCircle className="w-5 h-5 mr-2" />
                      {isProcessing ? 'Processing...' : 'Reject Application'}
                    </button>
                  )}
                  
                  <button
                    onClick={() => navigate('/staff/loan-processing')}
                    className="flex-1 bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                </div>
                
                {/* Show message if no decision is selected */}
                {!assessmentDecision && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      Please select an assessment decision above to proceed with actions.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreditAssessment;

