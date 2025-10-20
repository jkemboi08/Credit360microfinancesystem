import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  Clock, 
  Lock, 
  AlertCircle, 
  BarChart3, 
  FileText, 
  Upload,
  DollarSign,
  Users,
  ArrowRight,
  RefreshCw,
  ExternalLink,
  X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { LoanWorkflowStateMachine, LoanWorkflowState, ApprovalLevel } from '../services/loanWorkflowStateMachine';
import { useSupabaseAuth } from '../context/SupabaseAuthContext';
import { supabase } from '../lib/supabaseClient';
import ContractUploadModal from './ContractUploadModal';

interface EnhancedLoanProcessingWorkflowProps {
  loan: any;
  approvalLevels: ApprovalLevel[];
  generatedContracts: Set<string>;
  onStatusChange: (loanId: string, newStatus: string) => void;
  onContractGenerated: (loanId: string) => void;
  onMoveToDisbursement: (loanId: string) => void;
}

const EnhancedLoanProcessingWorkflow: React.FC<EnhancedLoanProcessingWorkflowProps> = ({
  loan,
  approvalLevels,
  generatedContracts,
  onStatusChange,
  onContractGenerated,
  onMoveToDisbursement
}) => {
  const { user } = useSupabaseAuth();
  const navigate = useNavigate();
  const [workflowState, setWorkflowState] = useState<LoanWorkflowState | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showContractUploadModal, setShowContractUploadModal] = useState(false);
  const [contractData, setContractData] = useState<any>(null);

  const stateMachine = LoanWorkflowStateMachine.getInstance();

  useEffect(() => {
    const state = stateMachine.calculateWorkflowState(loan, approvalLevels, generatedContracts);
    setWorkflowState(state);
  }, [loan, approvalLevels, generatedContracts]);

  // Load contract data when component mounts
  useEffect(() => {
    const loadContractData = async () => {
      try {
        console.log('🔍 Loading contract data for loan:', loan.id);
        const { data, error } = await supabase
          .from('loan_contracts')
          .select('*')
          .eq('loan_application_id', loan.id)
          .single();
        
        console.log('📋 Contract data query result:', { data, error });
        
        if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
          console.error('Error loading contract data:', error);
        } else if (data) {
          console.log('✅ Contract data loaded:', data);
          setContractData(data);
        } else {
          console.log('ℹ️ No contract data found for loan:', loan.id);
          // If no contract data found but contract should be generated, create it
          if (workflowState?.canUploadContract && !contractData) {
            console.log('🔧 Creating contract data for upload...');
            await createContractForUpload();
          }
        }
      } catch (err) {
        console.error('Error loading contract data:', err);
      }
    };

    if (loan?.id) {
      loadContractData();
    }
  }, [loan?.id, workflowState?.canUploadContract]);

  // Create contract for upload if needed
  const createContractForUpload = async () => {
    try {
      console.log('🔧 Creating contract for upload for loan:', loan.id);
      
      // Import ContractService dynamically
      const { ContractService } = await import('../services/contractService');
      
      // Get loan application data
      const { data: loanData, error: loanError } = await supabase
        .from('loan_applications')
        .select('*')
        .eq('id', loan.id)
        .single();
      
      if (loanError || !loanData) {
        console.error('❌ Error fetching loan data for contract creation:', loanError);
        return;
      }
      
      // Calculate loan terms
      const loanAmount = parseFloat(loanData.requested_amount) || 0;
      const interestRate = 0.15; // 15% annual interest rate
      const managementFeeRate = 0.02; // 2% management fee
      const repaymentPeriodMonths = 12; // 12 months default
      const totalInterest = loanAmount * interestRate;
      const totalManagementFee = loanAmount * managementFeeRate;
      const totalRepaymentAmount = loanAmount + totalInterest + totalManagementFee;
      const monthlyPayment = totalRepaymentAmount / repaymentPeriodMonths;
      
      // Create contract record
      const contractData = {
        loan_application_id: loan.id,
        client_id: loanData.client_id,
        status: 'generated' as const,
        contract_type: 'loan_agreement',
        loan_amount: loanAmount,
        interest_rate: interestRate,
        management_fee_rate: managementFeeRate,
        repayment_period_months: repaymentPeriodMonths,
        total_repayment_amount: totalRepaymentAmount,
        monthly_payment: monthlyPayment,
        created_by_user_id: user?.id || 'system',
        updated_by_user_id: user?.id || 'system'
      };
      
      console.log('🔧 Creating contract with data:', contractData);
      const newContract = await ContractService.createContract(contractData);
      console.log('✅ Contract created for upload:', newContract);
      
      setContractData(newContract);
    } catch (error) {
      console.error('❌ Error creating contract for upload:', error);
    }
  };


  const handleAction = async (action: string) => {
    if (!workflowState || !user) return;

    setIsProcessing(true);
    setError(null);

    try {
      const result = await stateMachine.executeAction(
        action as any,
        loan.id,
        user.id,
        { loan, workflowState }
      );

      if (result.success) {
        onStatusChange(loan.id, result.newStatus);
        
        if (action === 'generate_contract') {
          onContractGenerated(loan.id);
        } else if (action === 'move_to_disbursement') {
          onMoveToDisbursement(loan.id);
        }
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleNavigateToAssessment = () => {
    // Navigate to original credit assessment page
    navigate(`/staff/loan-processing/${loan.id}/assess`);
  };

  const handleNavigateToContractGeneration = () => {
    // Navigate to original contract generation page
    navigate(`/staff/loan-processing/${loan.id}/contract-generation`);
  };

  const handleOpenContractUploadModal = async () => {
    // If no contract data, try to create it first
    if (!contractData) {
      console.log('🔧 No contract data available, creating contract for upload...');
      await createContractForUpload();
    }
    setShowContractUploadModal(true);
  };

  const handleCloseContractUploadModal = () => {
    setShowContractUploadModal(false);
  };

  const handleContractUpdated = async () => {
    console.log('🔄 Contract updated, reloading data...');
    
    // Reload contract data
    try {
      const { data, error } = await supabase
        .from('loan_contracts')
        .select('*')
        .eq('loan_application_id', loan.id)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error reloading contract data:', error);
      } else if (data) {
        console.log('✅ Contract data reloaded:', data);
        setContractData(data);
      }
    } catch (err) {
      console.error('Error reloading contract data:', err);
    }

    // Update workflow state
    const state = stateMachine.calculateWorkflowState(loan, approvalLevels, generatedContracts);
    setWorkflowState(state);

    // Show success message
    console.log('✅ Contract upload process completed successfully');
    
    // Call parent callback to move to disbursement
    onMoveToDisbursement(loan.id);
    
    // Close modal
    setShowContractUploadModal(false);
  };


  const getStepIcon = (indicator: 'completed' | 'in_progress' | 'locked' | 'error') => {
    switch (indicator) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'in_progress':
        return <Clock className="w-5 h-5 text-blue-600" />;
      case 'locked':
        return <Lock className="w-5 h-5 text-gray-400" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
    }
  };

  const getStepColor = (indicator: 'completed' | 'in_progress' | 'locked' | 'error') => {
    switch (indicator) {
      case 'completed':
        return 'bg-green-50 border-green-200';
      case 'in_progress':
        return 'bg-blue-50 border-blue-200';
      case 'locked':
        return 'bg-gray-50 border-gray-200';
      case 'error':
        return 'bg-red-50 border-red-200';
    }
  };

  if (!workflowState) {
    return <div className="animate-pulse bg-gray-200 h-64 rounded-lg"></div>;
  }

  return (
    <div className="space-y-6">
      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
          <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
          <span className="text-red-800">{error}</span>
        </div>
      )}

      {/* Workflow Progress */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <RefreshCw className="w-5 h-5 mr-2 text-gray-600" />
          Workflow Progress
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Credit Assessment Step */}
          <div className={`p-4 rounded-lg border-2 ${getStepColor(workflowState.uiIndicators.creditAssessment)}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <BarChart3 className="w-5 h-5 mr-2 text-blue-600" />
                <span className="font-medium text-gray-900">Credit Assessment</span>
              </div>
              {getStepIcon(workflowState.uiIndicators.creditAssessment)}
            </div>
            <p className="text-sm text-gray-600 mb-3">
              {workflowState.uiIndicators.creditAssessment === 'completed' 
                ? 'Assessment completed' 
                : workflowState.uiIndicators.creditAssessment === 'in_progress'
                ? 'Assessment in progress'
                : 'Assessment pending'
              }
            </p>
            
            {/* Navigation Button */}
            <button
              onClick={handleNavigateToAssessment}
              className="w-full flex items-center justify-center bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium mb-2"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Open Assessment Page
            </button>
            
            {/* Action Buttons */}
            {workflowState.canApprove && (
              <button
                onClick={() => handleAction('approve')}
                disabled={isProcessing}
                className="w-full bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium disabled:opacity-50"
              >
                {isProcessing ? 'Processing...' : 'Approve Loan'}
              </button>
            )}
            
            {workflowState.canForwardToCommittee && (
              <button
                onClick={() => handleAction('forward_to_committee')}
                disabled={isProcessing}
                className="w-full bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50"
              >
                {isProcessing ? 'Processing...' : 'Forward to Committee'}
              </button>
            )}
          </div>

          {/* Contract Generation Step */}
          <div className={`p-4 rounded-lg border-2 ${getStepColor(workflowState.uiIndicators.contractGeneration)}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <FileText className="w-5 h-5 mr-2 text-purple-600" />
                <span className="font-medium text-gray-900">Contract Generation</span>
              </div>
              {getStepIcon(workflowState.uiIndicators.contractGeneration)}
            </div>
            <p className="text-sm text-gray-600 mb-3">
              {workflowState.uiIndicators.contractGeneration === 'completed' 
                ? 'Contract generated' 
                : workflowState.uiIndicators.contractGeneration === 'in_progress'
                ? 'Ready to generate'
                : 'Generate contract first'
              }
            </p>
            
            {/* Navigation Button */}
            <button
              onClick={handleNavigateToContractGeneration}
              className="w-full flex items-center justify-center bg-purple-600 text-white px-3 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium mb-2"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Open Contract Generation
            </button>
            
            {workflowState.canGenerateContract && (
              <button
                onClick={() => handleAction('generate_contract')}
                disabled={isProcessing}
                className="w-full bg-purple-600 text-white px-3 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium disabled:opacity-50"
              >
                {isProcessing ? 'Processing...' : 'Generate Contract'}
              </button>
            )}
          </div>

          {/* Contract Upload Step */}
          <div className={`p-4 rounded-lg border-2 ${getStepColor(workflowState.uiIndicators.contractUpload)}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <Upload className="w-5 h-5 mr-2 text-orange-600" />
                <span className="font-medium text-gray-900">Contract Upload</span>
              </div>
              {getStepIcon(workflowState.uiIndicators.contractUpload)}
            </div>
            <p className="text-sm text-gray-600 mb-3">
              {workflowState.uiIndicators.contractUpload === 'completed' 
                ? 'Contract uploaded - Loan moved to disbursement queue' 
                : workflowState.uiIndicators.contractUpload === 'in_progress'
                ? 'Ready to upload (Final Step)'
                : 'Upload signed contract (Final Step)'
              }
            </p>
            
            {/* Contract Upload Button */}
            {(() => {
              console.log('🔍 Contract Upload Button Debug:', {
                canUploadContract: workflowState.canUploadContract,
                contractData: !!contractData,
                contractStatus: contractData?.status,
                workflowState: workflowState,
                loanId: loan.id,
                loanStatus: loan.status
              });
              
              // Show button if contract can be uploaded (either has contract data OR can upload)
              if (workflowState.canUploadContract) {
                return (
                  <button
                    onClick={handleOpenContractUploadModal}
                    className="w-full flex items-center justify-center bg-orange-600 text-white px-3 py-2 rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Contract
                  </button>
                );
              } else {
                return (
                  <div className="w-full text-center text-sm text-gray-500 py-2">
                    Contract must be generated first
                  </div>
                );
              }
            })()}
          </div>

        </div>
      </div>


      {/* Next Steps */}
      {workflowState.nextSteps.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-900 mb-2 flex items-center">
            <ArrowRight className="w-4 h-4 mr-1" />
            Next Steps Available
          </h4>
          <div className="flex flex-wrap gap-2">
            {workflowState.nextSteps.map((step, index) => (
              <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                {step}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Contract Upload Modal */}
      {showContractUploadModal && (
        <ContractUploadModal
          isOpen={showContractUploadModal}
          onClose={handleCloseContractUploadModal}
          loanApplicationId={loan.id}
          clientId={loan.client_id}
          contractData={contractData}
          onContractUpdated={handleContractUpdated}
        />
      )}

    </div>
  );
};

export default EnhancedLoanProcessingWorkflow;
