import React, { useState, useRef } from 'react';
import { X, Upload, FileText, CheckCircle, AlertCircle, Eye, Download, Trash2 } from 'lucide-react';
import { ContractService, ContractData, ContractAttachment } from '../services/contractService';
import { useSupabaseAuth } from '../context/SupabaseAuthContext';
import { supabase } from '../lib/supabaseClient';
import toast from 'react-hot-toast';

interface ContractUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  loanApplicationId: string;
  clientId: string;
  contractData?: ContractData;
  onContractUpdated: () => void;
}

const ContractUploadModal: React.FC<ContractUploadModalProps> = ({
  isOpen,
  onClose,
  loanApplicationId,
  clientId,
  contractData,
  onContractUpdated
}) => {
  const { user } = useSupabaseAuth();
  const [uploading, setUploading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verificationNotes, setVerificationNotes] = useState('');
  const [verificationStatus, setVerificationStatus] = useState<'approved' | 'rejected' | 'needs_revision'>('approved');
  const [attachments, setAttachments] = useState<ContractAttachment[]>([]);
  const [loadingAttachments, setLoadingAttachments] = useState(false);
  const [selectedFileForUpload, setSelectedFileForUpload] = useState<File | null>(null);
  const [localContractData, setLocalContractData] = useState<ContractData | null>(contractData || null);
  const attachmentInputRef = useRef<HTMLInputElement>(null);

  // Sync local contract data with prop
  React.useEffect(() => {
    setLocalContractData(contractData || null);
  }, [contractData]);

  // Load attachments when modal opens
  React.useEffect(() => {
    if (isOpen && localContractData?.id) {
      loadAttachments();
    }
  }, [isOpen, localContractData?.id]);

  const loadAttachments = async () => {
    if (!localContractData?.id) {
      console.log('No contract data available for loading attachments');
      return;
    }
    
    console.log('Loading attachments for contract:', localContractData.id);
    setLoadingAttachments(true);
    try {
      const data = await ContractService.getContractAttachments(localContractData.id);
      console.log('Loaded attachments:', data);
      setAttachments(data);
    } catch (error) {
      console.error('Failed to load attachments:', error);
      toast.error(`Failed to load contract attachments: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoadingAttachments(false);
    }
  };



  const handleVerifyContract = async () => {
    if (!contractData?.id) return;

    if (!user?.id) {
      toast.error('You must be logged in to verify contracts');
      return;
    }

    setVerifying(true);
    try {
      if (!localContractData?.id) {
        toast.error('Contract data not available');
        return;
      }
      
      await ContractService.verifyContract(
        localContractData.id,
        verificationStatus,
        verificationNotes,
        user.id // Use actual authenticated user ID
      );
      
      toast.success('Contract verification completed');
      onContractUpdated();
      onClose();
    } catch (error) {
      console.error('Verification failed:', error);
      toast.error('Failed to verify contract');
    } finally {
      setVerifying(false);
    }
  };

  const handleSaveContract = async () => {
    console.log('💾 Starting contract save process...');
    console.log('Selected file:', selectedFileForUpload);
    console.log('Selected file for upload:', selectedFileForUpload);
    console.log('Contract data:', contractData);
    console.log('User:', user);

    if (!user?.id) {
      toast.error('You must be logged in to save contracts');
      return;
    }

    const fileToUpload = selectedFileForUpload;
    if (!fileToUpload) {
      toast.error('Please select a contract file to upload');
      return;
    }

    setUploading(true);
    try {
      let contractToUse = localContractData;

      // Step 1: Create contract record if it doesn't exist
      if (!contractToUse?.id) {
        console.log('🔧 Creating contract record...');
        
        // Load loan application data
        const { data: loanApp, error: loanError } = await supabase
          .from('loan_applications')
          .select('*')
          .eq('id', loanApplicationId)
          .single();
        
        if (loanError) {
          console.error('❌ Error loading loan application:', loanError);
          throw new Error('Failed to load loan application data');
        }
        
        // Create contract data
        const newContractData = {
          loan_application_id: loanApplicationId,
          client_id: clientId,
          status: 'generated' as const,
          contract_text: '',
          loan_amount: loanApp.requested_amount || 0,
          interest_rate: loanApp.interest_rate || 0,
          management_fee_rate: loanApp.management_fee_rate || 8.5,
          repayment_period_months: loanApp.repayment_period_months || 0,
          total_repayment_amount: loanApp.total_repayment_amount || 0,
          monthly_payment: loanApp.monthly_payment || 0,
          created_by_user_id: user.id,
          updated_by_user_id: user.id
        };
        
        console.log('📝 Creating contract with data:', newContractData);
        contractToUse = await ContractService.createContract(newContractData);
        console.log('✅ Contract created successfully:', contractToUse);
        setLocalContractData(contractToUse);
      }

      // Step 2: Upload the file to storage bucket
      console.log('📤 Uploading file to storage...');
      if (!contractToUse?.id) {
        throw new Error('Contract ID not available');
      }
      
      const result = await ContractService.addContractAttachment(
        contractToUse.id,
        fileToUpload,
        'signed_contract',
        `Signed Contract: ${fileToUpload.name}`,
        true, // Mark as required
        user.id
      );
      
      console.log('✅ File uploaded successfully:', result);
      
      // Step 3: Update contract status to uploaded
      console.log('🔄 Updating contract status...');
      await ContractService.updateContractStatus(
        contractToUse.id,
        'uploaded',
        { updated_by_user_id: user.id }
      );
      
      console.log('✅ Contract status updated to uploaded');
      
      // Step 4: Update loan application status and move to disbursement
      console.log('🔄 Updating loan application status and moving to disbursement...');
      const { error: loanUpdateError } = await supabase
        .from('loan_applications')
        .update({
          status: 'approved',
          contract_status: 'signed_by_client',
          updated_at: new Date().toISOString()
        })
        .eq('id', loanApplicationId);
      
      if (loanUpdateError) {
        console.warn('⚠️ Failed to update loan application status:', loanUpdateError);
        // Try alternative update approach
        try {
          const { error: altError } = await supabase
            .from('loan_applications')
            .update({
              contract_status: 'signed_by_client',
              updated_at: new Date().toISOString()
            })
            .eq('id', loanApplicationId);
          
          if (altError) {
            console.error('❌ Alternative update also failed:', altError);
            toast.error('Contract uploaded but failed to update loan status. Please use the Fix Status button.');
          } else {
            console.log('✅ Loan contract status updated (alternative method)');
          }
        } catch (altError) {
          console.error('❌ Alternative update failed:', altError);
          toast.error('Contract uploaded but failed to update loan status. Please use the Fix Status button.');
        }
      } else {
        console.log('✅ Loan application moved to disbursement queue');
      }
      
      // Step 5: Record workflow step completion
      try {
        const { LoanWorkflowTracker } = await import('../services/loanWorkflowTracker');
        await LoanWorkflowTracker.recordWorkflowStep(
          loanApplicationId,
          'contract_uploaded',
          'completed',
          user.id,
          'Contract document uploaded and signed'
        );
        
        // Move to disbursement queue
        await LoanWorkflowTracker.moveToDisbursementQueue(
          loanApplicationId,
          user.id
        );
        
        console.log('✅ Workflow steps recorded successfully');
      } catch (workflowError) {
        console.warn('⚠️ Failed to record workflow steps:', workflowError);
        // Don't fail the whole process for this
      }
      
      // Success!
      toast.success('✅ Contract saved successfully! Loan moved to disbursement queue.');
      onContractUpdated();
      onClose();
      
    } catch (error) {
      console.error('❌ Error saving contract:', error);
      toast.error(`Failed to save contract: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setUploading(false);
    }
  };

  const handleAddAttachment = async (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log('🔍 File input changed:', event.target.files);
    console.log('🔍 Files length:', event.target.files?.length);
    
    const file = event.target.files?.[0];
    console.log('🔍 Selected file:', file);
    console.log('🔍 Contract data:', contractData);
    
    if (!file) {
      console.log('❌ No file selected');
      toast.error('Please select a file to upload');
      return;
    }
    
    // Set the selected file for visual feedback
    setSelectedFileForUpload(file);
    console.log('✅ File selected:', file.name, 'Size:', file.size, 'Type:', file.type);
    
    if (!localContractData?.id) {
      console.log('🔍 No contract data available, creating new contract automatically...');
      
      try {
        const { ContractService } = await import('../services/contractService');
        const { supabase } = await import('../lib/supabaseClient');
        
        console.log('🔍 Creating contract for loan:', loanApplicationId);
        console.log('🔍 Client ID:', clientId);
        
        // First, try to find existing contract
        let existingContracts: any[] = [];
        
        // Search by loan_application_id
        try {
          existingContracts = await ContractService.getContractsByLoanApplication(loanApplicationId);
          console.log('📋 Contracts found by loan_application_id:', existingContracts.length);
        } catch (error) {
          console.log('❌ Error searching by loan_application_id:', error);
        }
        
        // If no existing contract found, create a new one
        if (existingContracts.length === 0) {
          console.log('🔧 Creating new contract record...');
          
          // Load loan application data to get contract details
          const { data: loanApp, error: loanError } = await supabase
            .from('loan_applications')
            .select('*')
            .eq('id', loanApplicationId)
            .single();
          
          if (loanError) {
            console.error('❌ Error loading loan application:', loanError);
            toast.error('Failed to load loan application data. Please try again.');
            return;
          }
          
          // Create contract data with loan application details
          const newContractData = {
            loan_application_id: loanApplicationId,
            client_id: clientId,
            status: 'generated' as const,
            contract_text: '', // Will be populated when contract is generated
            loan_amount: loanApp.requested_amount || 0,
            interest_rate: loanApp.interest_rate || 0,
            management_fee_rate: loanApp.management_fee_rate || 8.5,
            repayment_period_months: loanApp.repayment_period_months || 0,
            total_repayment_amount: loanApp.total_repayment_amount || 0,
            monthly_payment: loanApp.monthly_payment || 0,
            created_by_user_id: user?.id || 'system',
            updated_by_user_id: user?.id || 'system'
          };
          
          console.log('📝 Creating contract with data:', newContractData);
          const newContract = await ContractService.createContract(newContractData);
          console.log('✅ Contract created successfully:', newContract);
          setLocalContractData(newContract);
          
          // Don't show success toast here - let the attachment process handle it
          console.log('Contract record created, proceeding with attachment...');
        } else {
          console.log('✅ Found existing contract:', existingContracts[0]);
          setLocalContractData(existingContracts[0]);
        }
      } catch (error) {
        console.error('❌ Error creating/loading contract:', error);
        toast.error('Failed to create contract record. Please try again.');
        return;
      }
    }

    if (!user?.id) {
      toast.error('You must be logged in to upload attachments');
      return;
    }

    console.log('Adding attachment:', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      contractId: localContractData?.id,
      userId: user.id
    });

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please select a PDF or image file (JPG, PNG)');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }

    // Show loading state
    setLoadingAttachments(true);

    try {
      // Ensure we have a valid contract ID
      let contractId = localContractData?.id;
      
      if (!contractId) {
        console.log('❌ No contract ID available, cannot add attachment');
        toast.error('Contract record not found. Please try uploading again.');
        return;
      }
      
      console.log('Calling ContractService.addContractAttachment with contract ID:', contractId);
      const result = await ContractService.addContractAttachment(
        contractId,
        file,
        'signed_contract', // Use specific type for signed contracts
        `Signed Contract: ${file.name}`,
        true, // Mark as required
        user.id // Use actual authenticated user ID
      );
      
      console.log('Attachment added successfully:', result);
      
      // Show success message with file details
      toast.success(`✅ Contract "${file.name}" uploaded successfully!`, {
        duration: 4000,
        style: {
          background: '#10B981',
          color: 'white',
          fontWeight: 'bold'
        }
      });
      
      // Clear the file input and selected file
      if (attachmentInputRef.current) {
        attachmentInputRef.current.value = '';
      }
      setSelectedFileForUpload(null);
      
      // Update contract status to uploaded
      try {
        if (localContractData?.id) {
          const { ContractService } = await import('../services/contractService');
          await ContractService.updateContractStatus(
            localContractData.id,
            'uploaded',
            { updated_by_user_id: user.id }
          );
          console.log('✅ Contract status updated to uploaded');
        }
      } catch (error) {
        console.error('⚠️ Failed to update contract status:', error);
        // Don't fail the whole process for this
      }
      
      // Reload attachments to show the new one
      await loadAttachments();
      
      // Update loan application status and move to disbursement
      try {
        console.log('🔄 Moving loan to disbursement queue...');
        const { error: loanUpdateError } = await supabase
          .from('loan_applications')
          .update({
            status: 'approved',
            contract_status: 'signed_by_client',
            updated_at: new Date().toISOString()
          })
          .eq('id', loanApplicationId);
        
        if (loanUpdateError) {
          console.warn('⚠️ Failed to update loan application status:', loanUpdateError);
        } else {
          console.log('✅ Loan application moved to disbursement queue');
        }
        
        // Record workflow step completion
        const { LoanWorkflowTracker } = await import('../services/loanWorkflowTracker');
        await LoanWorkflowTracker.recordWorkflowStep(
          loanApplicationId,
          'contract_uploaded',
          'completed',
          user.id,
          'Contract document uploaded and signed'
        );
        
        // Move to disbursement queue
        await LoanWorkflowTracker.moveToDisbursementQueue(
          loanApplicationId,
          user.id
        );
        
        console.log('✅ Workflow steps recorded successfully');
        toast.success('✅ Contract uploaded! Loan moved to disbursement queue.');
      } catch (workflowError) {
        console.warn('⚠️ Failed to update workflow:', workflowError);
        // Don't show duplicate success message
      }
      
      // Call parent callback to update the workflow
      onContractUpdated();
      
    } catch (error) {
      console.error('Failed to add attachment:', error);
      toast.error(`❌ Failed to add attachment: ${error instanceof Error ? error.message : 'Unknown error'}`, {
        duration: 5000,
        style: {
          background: '#EF4444',
          color: 'white',
          fontWeight: 'bold'
        }
      });
    } finally {
      setLoadingAttachments(false);
    }
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    if (!confirm('Are you sure you want to delete this attachment?')) return;

    try {
      await ContractService.deleteContractAttachment(attachmentId);
      toast.success('Attachment deleted successfully');
      loadAttachments();
    } catch (error) {
      console.error('Failed to delete attachment:', error);
      toast.error('Failed to delete attachment');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'generated':
        return 'bg-blue-100 text-blue-800';
      case 'sent_to_client':
        return 'bg-yellow-100 text-yellow-800';
      case 'signed_by_client':
        return 'bg-purple-100 text-purple-800';
      case 'uploaded':
        return 'bg-green-100 text-green-800';
      case 'verified':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
        return <CheckCircle className="w-4 h-4" />;
      case 'rejected':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FileText className="w-8 h-8" />
              <div>
                <h2 className="text-2xl font-bold">Contract Management</h2>
                <p className="text-blue-100">Upload and verify signed contracts</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Contract Status */}
          {localContractData && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Contract Status</h3>
              <div className="flex items-center space-x-4">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(localContractData.status)}`}>
                  {getStatusIcon(localContractData.status)}
                  <span className="ml-2">{localContractData.status.replace(/_/g, ' ').toUpperCase()}</span>
                </span>
                {localContractData.created_at && (
                  <span className="text-sm text-gray-600">
                    Created: {new Date(localContractData.created_at).toLocaleDateString()}
                  </span>
                )}
                {localContractData.updated_at && (
                  <span className="text-sm text-gray-600">
                    Updated: {new Date(localContractData.updated_at).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          )}


          {/* Contract Verification */}
          {localContractData && localContractData.status === 'uploaded' && (
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Verify Contract</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Verification Status
                  </label>
                  <select
                    value={verificationStatus}
                    onChange={(e) => setVerificationStatus(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="approved">Approve</option>
                    <option value="needs_revision">Needs Revision</option>
                    <option value="rejected">Reject</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Verification Notes
                  </label>
                  <textarea
                    value={verificationNotes}
                    onChange={(e) => setVerificationNotes(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter verification notes..."
                  />
                </div>

                <button
                  onClick={handleVerifyContract}
                  disabled={verifying}
                  className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {verifying ? 'Verifying...' : 'Verify Contract'}
                </button>
              </div>
            </div>
          )}

          {/* Contract Upload Section */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-blue-600" />
                  Contract Document Upload
                </h3>
                <div className="flex space-x-2">
                  <button
                    onClick={async () => {
                      const { testDatabaseSetup } = await import('../utils/testDatabaseSetup');
                      const result = await testDatabaseSetup();
                      console.log('🔍 Database setup test result:', result);
                      toast.success(`Database: ${result.contractsTable ? '✅' : '❌'} | Attachments: ${result.attachmentsTable ? '✅' : '❌'} | Storage: ${result.storageBucket ? '✅' : '❌'}`);
                    }}
                    className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded hover:bg-gray-200"
                  >
                    Test DB
                  </button>
                  <button
                    onClick={async () => {
                      const { supabase } = await import('../lib/supabaseClient');
                      try {
                        const { data: allContracts, error } = await supabase
                          .from('loan_contracts')
                          .select('id, loan_application_id, client_id, status, created_at')
                          .order('created_at', { ascending: false })
                          .limit(10);
                        
                        if (error) {
                          console.error('❌ Error fetching contracts:', error);
                          toast.error('Failed to fetch contracts');
                        } else {
                          console.log('📋 All contracts in database:', allContracts);
                          toast.success(`Found ${allContracts?.length || 0} contracts. Check console for details.`);
                        }
                      } catch (err) {
                        console.error('❌ Error:', err);
                        toast.error('Failed to fetch contracts');
                      }
                    }}
                    className="text-xs px-2 py-1 bg-blue-100 text-blue-600 rounded hover:bg-blue-200"
                  >
                    Show Contracts
                  </button>
                </div>
              </div>
              <p className="text-sm text-gray-500">Select and upload the signed contract document. The file will be saved to the database and storage bucket.</p>
            </div>

            <input
              ref={attachmentInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleAddAttachment}
              className="hidden"
              multiple={false}
            />

            {loadingAttachments ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-sm text-gray-600 mt-3 font-medium">Uploading document...</p>
                <p className="text-xs text-gray-500 mt-1">Please wait while we process your file</p>
              </div>
            ) : attachments.length > 0 ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-semibold text-gray-700">
                    📎 {attachments.length} Document{attachments.length !== 1 ? 's' : ''} Attached
                  </h4>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs text-green-600 font-medium">Live</span>
                  </div>
                </div>
                {attachments.map((attachment) => (
                  <div key={attachment.id} className="group flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg hover:shadow-md transition-all duration-200">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                          <FileText className="w-5 h-5 text-green-600" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {attachment.file_name}
                        </p>
                        <div className="flex items-center space-x-3 mt-1">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {attachment.attachment_type.replace(/_/g, ' ')}
                          </span>
                          <span className="text-xs text-gray-500">
                            {(attachment.file_size / 1024 / 1024).toFixed(2)} MB
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(attachment.uploaded_at || '').toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <button
                        onClick={() => window.open(attachment.file_path, '_blank')}
                        className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                        title="View document"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => window.open(attachment.file_path, '_blank')}
                        className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                        title="Download document"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteAttachment(attachment.id!)}
                        className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                        title="Remove document"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-blue-600" />
                    <p className="text-sm text-blue-800 font-medium">
                      All documents are securely stored and accessible
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-lg font-medium text-gray-700 mb-2">No contract uploaded yet</p>
                <p className="text-sm text-gray-500 mb-6">Upload the signed contract document to complete the loan process</p>
                
                {/* File Selection Indicator */}
                {selectedFileForUpload && (
                  <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center justify-center space-x-3">
                      <FileText className="w-5 h-5 text-blue-600" />
                      <div className="text-left">
                        <p className="text-sm font-medium text-blue-900">{selectedFileForUpload.name}</p>
                        <p className="text-xs text-blue-600">
                          {(selectedFileForUpload.size / 1024 / 1024).toFixed(2)} MB • {selectedFileForUpload.type}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                <button
                  onClick={() => {
                    console.log('🔍 Upload button clicked...');
                    if (selectedFileForUpload) {
                      // If file is already selected, trigger upload
                      const syntheticEvent = {
                        target: {
                          files: [selectedFileForUpload]
                        }
                      } as unknown as React.ChangeEvent<HTMLInputElement>;
                      handleAddAttachment(syntheticEvent);
                    } else {
                      // If no file selected, trigger file input
                      attachmentInputRef.current?.click();
                    }
                  }}
                  disabled={loadingAttachments || uploading}
                  className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-lg"
                >
                  <Upload className="w-5 h-5 mr-2" />
                  {loadingAttachments || uploading ? 'Uploading...' : selectedFileForUpload ? 'Upload Selected File' : 'Upload Signed Contract'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 rounded-b-lg">
          <div className="flex justify-between">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveContract}
              disabled={!selectedFileForUpload}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {uploading || loadingAttachments ? 'Saving...' : 'Save Contract'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContractUploadModal;







