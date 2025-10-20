import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useLanguage } from '../context/LanguageContext';
import { useSupabaseAuth } from '../context/SupabaseAuthContext';
import { useSupabaseQuery } from '../hooks/useSupabase';
import { supabase } from '../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Users,
  CheckCircle,
  Clock,
  Eye,
  Vote,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { UnifiedApprovalService } from '../services/unifiedApprovalService';
import { CommitteeVotingService, VotingSummary } from '../services/committeeVotingService';
import CommitteeVotingModal from '../components/CommitteeVotingModal';
import CommitteeApprovalDebug from '../components/CommitteeApprovalDebug';
import { LoanStatusFlowService } from '../services/loanStatusFlowService';

interface LoanApplication {
  id: string;
  status: string;
  requested_amount: number;
  loan_purpose: string;
  term_months: number;
  created_at: string;
  updated_at: string;
  credit_score: number;
  risk_grade: string;
  assessment_score: number;
  clients: {
    id: string;
    first_name: string;
    last_name: string;
    phone_number: string;
    email_address: string;
    street_name: string;
    house_number: string;
    area_of_residence: string;
  };
}

const LoanCommitteeApproval: React.FC = () => {
  const { language } = useLanguage();
  const { user } = useSupabaseAuth();
  const navigate = useNavigate();
  const [selectedApplication, setSelectedApplication] = useState<LoanApplication | null>(null);
  const [showDecisionModal, setShowDecisionModal] = useState(false);
  const [showVotingModal, setShowVotingModal] = useState(false);
  const [decision, setDecision] = useState<'approve' | 'reject' | ''>('');
  const [comments, setComments] = useState('');
  const [approvalStage, setApprovalStage] = useState('credit_committee');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [votingSummaries, setVotingSummaries] = useState<Map<string, VotingSummary>>(new Map());
  const [isCommitteeMember, setIsCommitteeMember] = useState(false);

  // Fetch loan applications that need committee approval using status flow service
  const [applications, setApplications] = useState<LoanApplication[]>([]);
  const [applicationsLoading, setApplicationsLoading] = useState(true);
  const [applicationsError, setApplicationsError] = useState<string | null>(null);

  useEffect(() => {
    const loadApplications = async () => {
      try {
        setApplicationsLoading(true);
        setApplicationsError(null);
        
        console.log('🔍 Committee Approval - Starting to load applications...');
        
        // First, let's check what loans exist in the database
        console.log('🔍 Checking all loans in database...');
        const { data: allLoans, error: allLoansError } = await supabase
          .from('loan_applications')
          .select('id, status, client_id, requested_amount')
          .order('created_at', { ascending: false });
        
        if (allLoansError) {
          console.error('❌ Error fetching all loans:', allLoansError);
          setApplicationsError(`Database error: ${allLoansError.message}`);
          return;
        }
        
        console.log('📋 All loans in database:', {
          count: allLoans.length,
          statuses: [...new Set(allLoans.map(loan => loan.status))],
          loans: allLoans.map(loan => ({ id: loan.id, status: loan.status, client_id: loan.client_id }))
        });
        
        // Check if we have any loans with pending_committee_review status
        const committeeLoans = allLoans.filter(loan => loan.status === 'pending_committee_review');
        console.log('🔍 Loans with pending_committee_review status:', committeeLoans.length);
        
        // Only show loans that are actually pending committee review
        // No automatic status updates - loans should only be here if they were properly routed from credit assessment
        
        // Fix Cole-Griffith's loan if it was incorrectly moved here
        const coleGriffithLoan = allLoans.find(loan => loan.application_id === 'LA-1760439557884');
        if (coleGriffithLoan && coleGriffithLoan.status === 'pending_committee_review') {
          console.log('🔧 Fixing Cole-Griffith loan status - moving from committee approval to disbursement');
          const { error: fixError } = await supabase
            .from('loan_applications')
            .update({ 
              status: 'approved',
              contract_status: 'signed_by_client',
              updated_at: new Date().toISOString()
            })
            .eq('id', coleGriffithLoan.id);
          
          if (fixError) {
            console.error('❌ Error fixing Cole-Griffith loan status:', fixError);
          } else {
            console.log('✅ Successfully moved Cole-Griffith loan to disbursement');
          }
        }
        
        // Now try to get committee approval loans
        console.log('🔍 Getting committee approval loans...');
        const loans = await LoanStatusFlowService.getLoansForPage('committee_approval');
        console.log('🔍 Committee Approval - Loaded applications:', {
          count: loans.length,
          applications: loans.map(app => ({
            id: app.id,
            application_id: app.application_id,
            client_id: app.client_id,
            client_name: app.clients ? `${app.clients.first_name} ${app.clients.last_name}` : 'No client data',
            client_full_name: app.clients?.full_name,
            status: app.status
          }))
        });
        
        setApplications(loans);
        
        // Load voting summaries for each application
        if (user?.id && loans.length > 0) {
          try {
            await loadVotingSummaries(loans, user.id);
          } catch (err) {
            console.error('❌ Error loading voting summaries:', err);
            // Don't fail the whole page if voting summaries fail
          }
        }
      } catch (err) {
        console.error('❌ Error loading committee applications:', err);
        setApplicationsError(`Failed to load applications: ${err instanceof Error ? err.message : 'Unknown error'}`);
      } finally {
        setApplicationsLoading(false);
      }
    };

    const checkCommitteeMembership = async () => {
      try {
        if (user?.id) {
          const isMember = await CommitteeVotingService.isCommitteeMember(user.id);
          setIsCommitteeMember(isMember);
          console.log('🔍 Committee membership check:', { userId: user.id, isMember });
        }
      } catch (err) {
        console.error('❌ Error checking committee membership:', err);
        // Don't fail the whole page if committee check fails
        setIsCommitteeMember(false);
      }
    };

    loadApplications();
    checkCommitteeMembership();
  }, [user?.id]);

  const loadVotingSummaries = async (loans: LoanApplication[], userId: string) => {
    const summaries = new Map<string, VotingSummary>();
    
    for (const loan of loans) {
      try {
        const summary = await CommitteeVotingService.getVotingSummary(loan.id, userId);
        if (summary) {
          summaries.set(loan.id, summary);
        }
      } catch (error) {
        console.error(`Error loading voting summary for loan ${loan.id}:`, error);
      }
    }
    
    setVotingSummaries(summaries);
  };

  const refetch = async () => {
    try {
      setApplicationsLoading(true);
      const loans = await LoanStatusFlowService.getLoansForPage('committee_approval');
      setApplications(loans);
      
      // Reload voting summaries
      if (user?.id) {
        await loadVotingSummaries(loans, user.id);
      }
    } catch (err) {
      console.error('Error refetching applications:', err);
      setApplicationsError('Failed to refetch applications');
    } finally {
      setApplicationsLoading(false);
    }
  };

  const getRiskGradeColor = (grade: string) => {
    if (grade?.startsWith('A')) return 'text-green-600 bg-green-100';
    if (grade?.startsWith('B')) return 'text-yellow-600 bg-yellow-100';
    if (grade?.startsWith('C')) return 'text-red-600 bg-red-100';
    return 'text-gray-600 bg-gray-100';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending_review': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleViewApplication = (app: LoanApplication) => {
    setSelectedApplication(app);
  };

  const handleMakeDecision = (app: LoanApplication) => {
    console.log('🔍 Selected application for decision:', {
      id: app.id,
      status: app.status,
      client_id: app.client_id,
      requested_amount: app.requested_amount
    });
    setSelectedApplication(app);
    setDecision('');
    setComments('');
    setShowDecisionModal(true);
  };

  const handleVote = (app: LoanApplication) => {
    setSelectedApplication(app);
    setShowVotingModal(true);
  };

  const handleVotingComplete = async () => {
    setShowVotingModal(false);
    setSelectedApplication(null);
    await refetch(); // Refresh the applications and voting summaries
  };

  const handleSubmitDecision = async () => {
    if (!selectedApplication || !decision || !user) return;
    
    setIsSubmitting(true);
    
    try {
      console.log('Processing committee decision:', {
        applicationId: selectedApplication.id,
        decision,
        comments,
        userId: user.id
      });

      // Direct database update for committee decisions (bypassing complex approval workflow)
      const newStatus = decision === 'approve' ? 'approved' : 'rejected';
      const newApprovalStatus = decision === 'approve' ? 'approved' : 'rejected';
      
      console.log('🔍 Updating loan application:', {
        loanId: selectedApplication.id,
        newStatus,
        newApprovalStatus,
        decision,
        comments,
        userId: user.id,
        userEmail: user.email
      });

      // First, check if the user exists in profiles table
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();

      console.log('🔍 Profile check:', { profileData, profileError });

      // Update loan application with committee decision (without submitted_by if user doesn't exist in profiles)
      const updateData: any = {
        status: newStatus,
        approval_status: newApprovalStatus,
        committee_decision: decision,
        committee_comments: comments,
        committee_approved_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Only include submitted_by if the user exists in profiles table
      if (profileData && !profileError) {
        updateData.submitted_by = user.id;
        console.log('✅ User found in profiles, including submitted_by field');
      } else {
        console.log('⚠️ User not found in profiles table, skipping submitted_by field');
      }

      // If approving, add disbursement_method with a valid enum value to prevent trigger issues
      if (decision === 'approve') {
        // Use 'bank_transfer' which is a valid enum value according to the check constraint
        updateData.disbursement_method = 'bank_transfer';
        console.log('✅ Adding disbursement method (bank_transfer) for approved loan');
      }

      const { error: updateError } = await supabase
        .from('loan_applications')
        .update(updateData)
        .eq('id', selectedApplication.id);

      // If the update fails due to enum constraint, try without disbursement_method
      if (updateError && updateError.message.includes('enum')) {
        console.log('⚠️ Enum constraint error, retrying without disbursement_method');
        delete updateData.disbursement_method;
        
        const { error: retryError } = await supabase
          .from('loan_applications')
          .update(updateData)
          .eq('id', selectedApplication.id);
          
        if (retryError) {
          console.error('❌ Retry also failed:', retryError);
          console.error('❌ Error details:', {
            message: retryError.message,
            details: retryError.details,
            hint: retryError.hint,
            code: retryError.code
          });
          toast.error(`Failed to update loan: ${retryError.message}`);
          return;
        } else {
          console.log('✅ Update succeeded without disbursement_method');
        }
      } else if (updateError) {
        console.error('❌ Failed to update loan application:', updateError);
        console.error('❌ Error details:', {
          message: updateError.message,
          details: updateError.details,
          hint: updateError.hint,
          code: updateError.code
        });
        toast.error(`Failed to update loan: ${updateError.message}`);
        return;
      }

      console.log('✅ Committee decision recorded successfully');
      
      // Show success message
      toast.success(
        `Loan ${decision === 'approve' ? 'approved' : 'rejected'} successfully! ${
          decision === 'approve' 
            ? 'Loan has been moved back to Loan Processing for contract generation.' 
            : 'Loan has been rejected and moved to rejected applications.'
        }`
      );
      
      // Close modal and refresh data
      setShowDecisionModal(false);
      setDecision('');
      setComments('');
      refetch();
      
      // Navigate to loan processing if approved
      if (decision === 'approve') {
        setTimeout(() => {
          navigate('/staff/loan-processing');
        }, 1500);
      }
      
    } catch (error) {
      console.error('Error submitting committee decision:', error);
      toast.error('Error submitting decision. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 text-white">
          <h1 className="text-3xl font-bold mb-2">
            {language === 'en' ? 'Loan Committee Approval' : 'Idhini ya Kamati ya Mikopo'}
          </h1>
          <p className="text-blue-100">
            {language === 'en' 
              ? 'Review and approve loan applications with comprehensive risk assessment'
              : 'Kagua na idhinisha maombi ya mkopo kwa uchambuzi kamili wa hatari'
            }
          </p>
        </div>


        {/* Committee Overview */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Users className="w-5 h-5 mr-2 text-blue-600" />
            {language === 'en' ? 'Committee Overview' : 'Muhtasari wa Kamati'}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-2xl font-bold text-blue-700">{applications?.length || 0}</div>
              <p className="text-sm text-blue-600">
                {language === 'en' ? 'Pending Applications' : 'Maombi Yanayosubiri'}
              </p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="text-2xl font-bold text-green-700">
                {applications?.filter(app => app.status === 'approved').length || 0}
              </div>
              <p className="text-sm text-green-600">
                {language === 'en' ? 'Approved Today' : 'Yameidhinishwa Leo'}
              </p>
            </div>
            <div className="p-4 bg-red-50 rounded-lg border border-red-200">
              <div className="text-2xl font-bold text-red-700">
                {applications?.filter(app => app.status === 'rejected').length || 0}
              </div>
              <p className="text-sm text-red-600">
                {language === 'en' ? 'Rejected Today' : 'Yamekataliwa Leo'}
              </p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <div className="text-2xl font-bold text-purple-700">
                {formatCurrency(applications?.reduce((sum, app) => sum + (app.requested_amount || 0), 0) || 0)}
              </div>
              <p className="text-sm text-purple-600">
                {language === 'en' ? 'Total Exposure' : 'Jumla ya Hatari'}
              </p>
            </div>
          </div>
        </div>

        {/* Applications List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              {language === 'en' ? 'Pending Applications' : 'Maombi Yanayosubiri'}
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {language === 'en' 
                ? 'Review applications and make approval decisions'
                : 'Kagua maombi na fanya maamuzi ya idhini'
              }
            </p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {language === 'en' ? 'Application ID' : 'Kitambulisho cha Maombi'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {language === 'en' ? 'Client Name' : 'Jina la Mteja'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {language === 'en' ? 'Loan Amount' : 'Kiasi cha Mkopo'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {language === 'en' ? 'Reason for Loan' : 'Sababu ya Mkopo'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {language === 'en' ? 'Date Submitted' : 'Tarehe ya Kuwasilisha'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {language === 'en' ? 'Risk Assessment' : 'Tathmini ya Hatari'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {language === 'en' ? 'Voting Status' : 'Hali ya Kura'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {language === 'en' ? 'Actions' : 'Vitendo'}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {applicationsLoading ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center">
                        <Clock className="w-4 h-4 mr-2 animate-spin" />
                        {language === 'en' ? 'Loading applications...' : 'Inapakia maombi...'}
                      </div>
                    </td>
                  </tr>
                ) : applicationsError ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-4 text-center text-red-600">
                      {language === 'en' ? 'Error loading applications' : 'Hitilafu ya kupakia maombi'}
                    </td>
                  </tr>
                ) : applications?.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                      {language === 'en' ? 'No applications pending committee review' : 'Hakuna maombi yanayosubiri ukaguzi wa kamati'}
                    </td>
                  </tr>
                ) : (
                  applications?.map((app: any) => (
                    <tr key={app.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          App ID: {app.application_id || `LA-${app.id.slice(-8)}`}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {app.clients?.first_name && app.clients?.last_name 
                            ? `${app.clients.first_name} ${app.clients.last_name}`
                            : app.clients?.full_name || 'Client Name Not Available'
                          }
                        </div>
                        <div className="text-sm text-gray-500">{app.clients?.phone_number}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {formatCurrency(app.requested_amount || 0)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {app.loan_purpose || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(app.created_at).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-1">
                          <div className="flex items-center">
                            <span className="text-sm font-medium text-gray-900">
                              Score: {app.credit_score || app.assessment_score || 'N/A'}
                            </span>
                          </div>
                          <div className="flex items-center">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRiskGradeColor(app.risk_grade || 'N/A')}`}>
                              {app.risk_grade || 'N/A'}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {(() => {
                          const votingSummary = votingSummaries.get(app.id);
                          if (!votingSummary) {
                            return (
                              <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
                                {language === 'en' ? 'Loading...' : 'Inapakia...'}
                              </span>
                            );
                          }

                          if (votingSummary.final_decision === 'approve') {
                            return (
                              <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                                {language === 'en' ? 'Approved' : 'Imeidhinishwa'}
                              </span>
                            );
                          }

                          if (votingSummary.final_decision === 'reject') {
                            return (
                              <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                                {language === 'en' ? 'Rejected' : 'Imekataliwa'}
                              </span>
                            );
                          }

                          return (
                            <div className="space-y-1">
                              <div className="flex items-center space-x-2">
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                  votingSummary.quorum_met ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {votingSummary.approve_votes}A / {votingSummary.reject_votes}R / {votingSummary.abstain_votes}Ab
                                </span>
                              </div>
                              <div className="text-xs text-gray-500">
                                {votingSummary.votes_remaining} {language === 'en' ? 'votes remaining' : 'kura zilizobaki'}
                              </div>
                            </div>
                          );
                        })()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-3">
                          {/* Fix button for Cole-Griffith */}
                          {app.application_id === 'LA-1760439557884' && (
                            <button
                              onClick={async () => {
                                console.log('🔧 Fixing Cole-Griffith loan status...');
                                try {
                                  const { error } = await supabase
                                    .from('loan_applications')
                                    .update({ 
                                      status: 'approved',
                                      contract_status: 'signed_by_client',
                                      updated_at: new Date().toISOString()
                                    })
                                    .eq('id', app.id);
                                  
                                  if (error) {
                                    console.error('❌ Error fixing loan status:', error);
                                    alert('Failed to fix loan status: ' + error.message);
                                  } else {
                                    console.log('✅ Successfully moved Cole-Griffith to disbursement');
                                    alert('✅ Cole-Griffith loan moved to disbursement page!');
                                    // Refresh the page
                                    window.location.reload();
                                  }
                                } catch (error) {
                                  console.error('❌ Error:', error);
                                  alert('Error fixing loan status: ' + error.message);
                                }
                              }}
                              className="px-3 py-2 text-sm font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 shadow-sm transition-all duration-200 transform hover:scale-105 flex items-center"
                              title="Fix Cole-Griffith loan - move to disbursement"
                            >
                              <RefreshCw className="w-4 h-4 mr-2" />
                              Fix
                            </button>
                          )}
                          
                          {isCommitteeMember ? (
                            <button
                              onClick={() => handleVote(app)}
                              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-sm transition-all duration-200 transform hover:scale-105 flex items-center"
                              title={language === 'en' ? 'Vote on Application' : 'Piga Kura'}
                            >
                              <Vote className="w-4 h-4 mr-2" />
                              {language === 'en' ? 'Vote' : 'Piga Kura'}
                            </button>
                          ) : (
                            <button
                              onClick={() => handleMakeDecision(app)}
                              className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 shadow-sm transition-all duration-200 transform hover:scale-105 flex items-center"
                              title={language === 'en' ? 'Make Decision' : 'Fanya Uamuzi'}
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              {language === 'en' ? 'Decide' : 'Amua'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Decision Modal */}
        {showDecisionModal && selectedApplication && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900">
                  {language === 'en' ? 'Committee Decision' : 'Maamuzi ya Kamati'} - {selectedApplication.clients?.first_name} {selectedApplication.clients?.last_name}
                </h3>
                <button
                  onClick={() => setShowDecisionModal(false)}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-6">
                {/* Application Summary */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">
                    {language === 'en' ? 'Application Summary' : 'Muhtasari wa Maombi'}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p><strong>{language === 'en' ? 'Amount' : 'Kiasi'}:</strong> {formatCurrency(selectedApplication.requested_amount || 0)}</p>
                      <p><strong>{language === 'en' ? 'Product' : 'Bidhaa'}:</strong> {selectedApplication.loan_purpose || 'N/A'}</p>
                      <p><strong>{language === 'en' ? 'Credit Score' : 'Alama ya Mikopo'}:</strong> {selectedApplication.credit_score || selectedApplication.assessment_score || 'N/A'}</p>
                    </div>
                    <div>
                      <p><strong>{language === 'en' ? 'Risk Grade' : 'Daraja la Hatari'}:</strong> {selectedApplication.risk_grade || 'N/A'}</p>
                      <p><strong>{language === 'en' ? 'Purpose' : 'Dhumuni'}:</strong> {selectedApplication.loan_purpose || 'N/A'}</p>
                      <p><strong>{language === 'en' ? 'Term' : 'Muda'}:</strong> {selectedApplication.term_months || 'N/A'} {language === 'en' ? 'months' : 'miezi'}</p>
                    </div>
                  </div>
                </div>

                {/* Risk Assessment Details */}
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <h4 className="font-medium text-gray-900 mb-3">
                    {language === 'en' ? 'Risk Assessment Details' : 'Maelezo ya Tathmini ya Hatari'}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p><strong>{language === 'en' ? 'Credit Score' : 'Alama ya Mikopo'}:</strong> {selectedApplication.credit_score || selectedApplication.assessment_score || 'N/A'}</p>
                      <p><strong>{language === 'en' ? 'Risk Grade' : 'Daraja la Hatari'}:</strong> {selectedApplication.risk_grade || 'N/A'}</p>
                    </div>
                    <div>
                      <p><strong>{language === 'en' ? 'Application Date' : 'Tarehe ya Maombi'}:</strong> {new Date(selectedApplication.created_at).toLocaleDateString()}</p>
                      <p><strong>{language === 'en' ? 'Status' : 'Hali'}:</strong> {selectedApplication.status}</p>
                    </div>
                  </div>
                </div>

                {/* Decision Form */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {language === 'en' ? 'Approval Stage' : 'Hatua ya Idhini'}
                  </label>
                  <select
                    value={approvalStage}
                    onChange={(e) => setApprovalStage(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="loan_officer">{language === 'en' ? 'Loan Officer Review' : 'Ukaguzi wa Afisa wa Mikopo'}</option>
                    <option value="credit_committee">{language === 'en' ? 'Credit Committee' : 'Kamati ya Mikopo'}</option>
                    <option value="final_approval">{language === 'en' ? 'Final Approval' : 'Idhini ya Mwisho'}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {language === 'en' ? 'Decision' : 'Maamuzi'} *
                  </label>
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="approve"
                        checked={decision === 'approve'}
                        onChange={(e) => setDecision(e.target.value as 'approve')}
                        className="text-green-600 focus:ring-green-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        {language === 'en' ? 'Approve' : 'Idhinisha'}
                      </span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="reject"
                        checked={decision === 'reject'}
                        onChange={(e) => setDecision(e.target.value as 'reject')}
                        className="text-red-600 focus:ring-red-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        {language === 'en' ? 'Reject' : 'Kataa'}
                      </span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {language === 'en' ? 'Comments & Justification' : 'Maoni na Uthibitisho'} *
                  </label>
                  <textarea
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder={language === 'en' 
                      ? 'Enter detailed comments about the decision...'
                      : 'Andika maoni ya kina kuhusu maamuzi...'
                    }
                    required
                  />
                </div>

                {/* Notification Settings */}
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <h5 className="font-medium text-gray-900 mb-2">
                    {language === 'en' ? 'Client Notification' : 'Arifa ya Mteja'}
                  </h5>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" defaultChecked />
                      <span className="ml-2 text-sm text-gray-700">
                        {language === 'en' ? 'Send SMS notification (English/Kiswahili)' : 'Tuma arifa ya SMS (Kiingereza/Kiswahili)'}
                      </span>
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" defaultChecked />
                      <span className="ml-2 text-sm text-gray-700">
                        {language === 'en' ? 'Send email notification' : 'Tuma arifa ya barua pepe'}
                      </span>
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" defaultChecked />
                      <span className="ml-2 text-sm text-gray-700">
                        {language === 'en' ? 'Notify field officer' : 'Arifu afisa wa shamba'}
                      </span>
                    </label>
                  </div>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowDecisionModal(false)}
                    className="px-6 py-3 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 shadow-sm transition-all duration-200 transform hover:scale-105 font-medium"
                  >
                    {language === 'en' ? 'Cancel' : 'Ghairi'}
                  </button>
                  <button
                    onClick={handleSubmitDecision}
                    disabled={!decision || !comments || isSubmitting}
                    className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 shadow-sm transition-all duration-200 transform hover:scale-105 font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center"
                  >
                    {isSubmitting ? (
                      <>
                        <Clock className="w-4 h-4 mr-2 animate-spin" />
                        {language === 'en' ? 'Processing...' : 'Inachakata...'}
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        {language === 'en' ? 'Confirm Decision' : 'Thibitisha Maamuzi'}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Committee Voting Modal */}
        {selectedApplication && (
          <CommitteeVotingModal
            isOpen={showVotingModal}
            onClose={() => setShowVotingModal(false)}
            loanApplication={selectedApplication}
            onDecisionFinalized={handleVotingComplete}
          />
        )}
      </div>
    </Layout>
  );
};

export default LoanCommitteeApproval;



