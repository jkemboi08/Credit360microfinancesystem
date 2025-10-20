import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Users, 
  AlertCircle,
  FileText,
  User,
  Calendar,
  MessageSquare
} from 'lucide-react';
import { useSupabaseQuery, useSupabaseUpdate } from '../hooks/useSupabase';
import { supabase } from '../lib/supabaseClient';
import { toast } from 'react-hot-toast';
import { UnifiedApprovalService, ApprovalWorkflowState } from '../services/unifiedApprovalService';

interface LoanApprovalWorkflowProps {
  loanApplication: any;
  onStatusUpdate: () => void;
}

interface ApprovalHistory {
  id: string;
  action: string;
  performed_by: string;
  performed_at: string;
  comments: string;
  approval_level: string;
  previous_status: string;
  new_status: string;
  user_name?: string;
}

const LoanApprovalWorkflow: React.FC<LoanApprovalWorkflowProps> = ({ 
  loanApplication, 
  onStatusUpdate 
}) => {
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalAction, setApprovalAction] = useState<'approve' | 'reject' | 'refer_to_committee'>('approve');
  const [comments, setComments] = useState('');
  const [loading, setLoading] = useState(false);
  const [workflowState, setWorkflowState] = useState<ApprovalWorkflowState | null>(null);

  // Fetch approval history using the unified service
  const [approvalHistory, setApprovalHistory] = useState<any[]>([]);

  // Fetch committee members (if table exists)
  const { data: committeeMembers } = useSupabaseQuery('loan_committee_members', {
    filter: [{ column: 'is_active', operator: 'eq', value: true }]
  });

  // Fetch committee decisions (if table exists)
  const { data: committeeDecisions } = useSupabaseQuery('loan_committee_decisions', {
    filter: [{ column: 'loan_application_id', operator: 'eq', value: loanApplication.id }]
  });

  // Load workflow state and approval history
  useEffect(() => {
    const loadWorkflowData = async () => {
      try {
        const [state, history] = await Promise.all([
          UnifiedApprovalService.getApprovalWorkflowState(loanApplication.id),
          UnifiedApprovalService.getApprovalHistory(loanApplication.id)
        ]);
        setWorkflowState(state);
        setApprovalHistory(history);
      } catch (error) {
        console.error('Error loading workflow data:', error);
      }
    };

    loadWorkflowData();
  }, [loanApplication.id]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending_initial_review':
        return 'bg-yellow-100 text-yellow-800';
      case 'pending_supervisor_approval':
        return 'bg-blue-100 text-blue-800';
      case 'pending_manager_approval':
        return 'bg-purple-100 text-purple-800';
      case 'pending_committee_review':
        return 'bg-orange-100 text-orange-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'requires_additional_info':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getApprovalLevelColor = (level: string) => {
    switch (level) {
      case 'staff':
        return 'bg-blue-100 text-blue-800';
      case 'supervisor':
        return 'bg-purple-100 text-purple-800';
      case 'manager':
        return 'bg-indigo-100 text-indigo-800';
      case 'committee':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleApprovalAction = async () => {
    if (!comments.trim() && approvalAction !== 'approve') {
      toast.error('Please provide comments for this action');
      return;
    }

    if (!workflowState) {
      toast.error('Workflow state not loaded');
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Use the unified approval service
      const result = await UnifiedApprovalService.processApprovalAction(
        loanApplication.id,
        approvalAction,
        user.id,
        comments
      );

      if (result.success) {
        toast.success(result.message);
        setShowApprovalModal(false);
        setComments('');
        
        // Reload workflow state and history
        const [state, history] = await Promise.all([
          UnifiedApprovalService.getApprovalWorkflowState(loanApplication.id),
          UnifiedApprovalService.getApprovalHistory(loanApplication.id)
        ]);
        setWorkflowState(state);
        setApprovalHistory(history);
        
        onStatusUpdate();
      } else {
        toast.error(result.message);
      }
    } catch (error: any) {
      console.error('Error updating approval:', error);
      toast.error(error.message || 'Failed to update approval status');
    } finally {
      setLoading(false);
    }
  };

  const canApprove = () => {
    return workflowState?.canApprove || false;
  };

  const canReject = () => {
    return workflowState?.canReject || false;
  };

  const canReferToCommittee = () => {
    // Can refer to committee if not already in committee review and not committee required
    return workflowState?.approvalStatus === 'pending_initial_review' && 
           !workflowState?.isCommitteeRequired;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Users className="w-5 h-5 mr-2 text-blue-600" />
          Approval Workflow
        </h3>
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(workflowState?.approvalStatus || loanApplication.approval_status)}`}>
            {(workflowState?.approvalStatus || loanApplication.approval_status)?.replace(/_/g, ' ').toUpperCase()}
          </span>
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getApprovalLevelColor(workflowState?.currentApprovalLevel?.approval_authority || loanApplication.approval_level)}`}>
            {(workflowState?.currentApprovalLevel?.approval_authority || loanApplication.approval_level)?.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Workflow Progress */}
      {workflowState && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Approval Progress</span>
            <span className="text-sm text-gray-500">{workflowState.workflowProgress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${workflowState.workflowProgress}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Committee Review Requirement */}
      {(workflowState?.isCommitteeRequired || loanApplication.committee_review_required) && (
        <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-orange-600 mr-2" />
            <div>
              <h4 className="text-sm font-medium text-orange-800">Committee Review Required</h4>
              <p className="text-sm text-orange-700 mt-1">
                {loanApplication.committee_review_reason || 
                  `This loan requires committee review due to amount ($${loanApplication.requested_amount?.toLocaleString()}) and type (${loanApplication.client_type})`}
              </p>
              {workflowState?.currentApprovalLevel && (
                <p className="text-xs text-orange-600 mt-1">
                  Current approval level: {workflowState.currentApprovalLevel.level_name}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Approval Actions */}
      <div className="mb-6">
        <div className="flex space-x-3">
          {canApprove() && (
            <button
              onClick={() => {
                setApprovalAction('approve');
                setShowApprovalModal(true);
              }}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Approve
            </button>
          )}
          
          {canReject() && (
            <button
              onClick={() => {
                setApprovalAction('reject');
                setShowApprovalModal(true);
              }}
              className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <XCircle className="w-4 h-4 mr-2" />
              Reject
            </button>
          )}

          {canReferToCommittee() && (
            <button
              onClick={() => {
                setApprovalAction('refer_to_committee');
                setShowApprovalModal(true);
              }}
              className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            >
              <Users className="w-4 h-4 mr-2" />
              Refer to Committee
            </button>
          )}
        </div>
      </div>

      {/* Committee Decisions */}
      {(workflowState?.approvalStatus === 'pending_committee_review' || loanApplication.approval_status === 'pending_committee_review') && committeeDecisions && committeeDecisions.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Committee Decisions</h4>
          <div className="space-y-2">
            {committeeDecisions.map((decision: any) => (
              <div key={decision.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <User className="w-4 h-4 text-gray-500 mr-2" />
                  <span className="text-sm text-gray-700">
                    {decision.committee_member_id} - {decision.decision}
                  </span>
                </div>
                <span className="text-xs text-gray-500">
                  {new Date(decision.decision_date).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Approval History */}
      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-3">Approval History</h4>
        <div className="space-y-3">
          {approvalHistory && approvalHistory.length > 0 ? (
            approvalHistory.map((entry: ApprovalHistory) => (
              <div key={entry.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex-shrink-0">
                  {entry.action === 'approved' ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : entry.action === 'rejected' ? (
                    <XCircle className="w-5 h-5 text-red-600" />
                  ) : (
                    <Clock className="w-5 h-5 text-blue-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900">
                      {entry.action.replace(/_/g, ' ').toUpperCase()}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(entry.performed_at).toLocaleString()}
                    </p>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    Level: {entry.approval_level?.toUpperCase()}
                  </p>
                  {entry.comments && (
                    <p className="text-xs text-gray-700 mt-1 italic">
                      "{entry.comments}"
                    </p>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500 italic">No approval history available</p>
          )}
        </div>
      </div>

      {/* Approval Modal */}
      {showApprovalModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {approvalAction === 'approve' ? 'Approve Loan' : 
               approvalAction === 'reject' ? 'Reject Loan' : 
               'Refer to Committee'}
            </h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Comments {approvalAction !== 'approve' && <span className="text-red-500">*</span>}
              </label>
              <textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                placeholder={approvalAction === 'approve' ? 'Optional comments...' : 'Please provide reason...'}
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowApprovalModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleApprovalAction}
                disabled={loading}
                className={`px-4 py-2 text-white rounded-lg transition-colors ${
                  approvalAction === 'approve' ? 'bg-green-600 hover:bg-green-700' :
                  approvalAction === 'reject' ? 'bg-red-600 hover:bg-red-700' :
                  'bg-orange-600 hover:bg-orange-700'
                } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {loading ? 'Processing...' : 
                 approvalAction === 'approve' ? 'Approve' :
                 approvalAction === 'reject' ? 'Reject' :
                 'Refer to Committee'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoanApprovalWorkflow;
