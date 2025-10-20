import React, { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, X, RefreshCw } from 'lucide-react';
import { ContractService } from '../services/contractService';
import { useSupabaseAuth } from '../context/SupabaseAuthContext';

interface EnhancedContractUploadProps {
  loanApplicationId: string;
  clientId: string;
  contractData: any;
  onContractUpdated: () => void;
  onMoveToDisbursement: () => void;
}

const EnhancedContractUpload: React.FC<EnhancedContractUploadProps> = ({
  loanApplicationId,
  clientId,
  contractData,
  onContractUpdated,
  onMoveToDisbursement
}) => {
  const { user } = useSupabaseAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  const ALLOWED_FILE_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];

  const validateFile = (file: File): string[] => {
    const errors: string[] = [];

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      errors.push(`File size must be less than ${MAX_FILE_SIZE / (1024 * 1024)}MB`);
    }

    // Check file type
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      errors.push('File must be a PDF, JPEG, or PNG file');
    }

    // Check file name
    if (file.name.length > 100) {
      errors.push('File name must be less than 100 characters');
    }

    // Check for suspicious file extensions
    const suspiciousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.pif', '.vbs', '.js'];
    const hasSuspiciousExtension = suspiciousExtensions.some(ext => 
      file.name.toLowerCase().endsWith(ext)
    );
    if (hasSuspiciousExtension) {
      errors.push('File type not allowed for security reasons');
    }

    return errors;
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setValidationErrors([]);
    setUploadedFile(null);

    const errors = validateFile(file);
    if (errors.length > 0) {
      setValidationErrors(errors);
      setUploadStatus('error');
      return;
    }

    setUploadedFile(file);
    setUploadStatus('idle');
  };

  const handleUpload = async () => {
    if (!uploadedFile || !user) return;

    setIsUploading(true);
    setUploadStatus('uploading');
    setUploadProgress(0);
    setError(null);

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // Upload file to Supabase Storage
      const fileExt = uploadedFile.name.split('.').pop();
      const fileName = `contract_${loanApplicationId}_${Date.now()}.${fileExt}`;
      const filePath = `contracts/${clientId}/${fileName}`;

      const { error: uploadError } = await ContractService.uploadContractFile(
        uploadedFile,
        filePath
      );

      clearInterval(progressInterval);

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      // Update contract record
      const { error: updateError } = await ContractService.updateContractStatus(
        contractData.id,
        'signed',
        filePath
      );

      if (updateError) {
        throw new Error(updateError.message);
      }

      // Update loan application status
      const { error: loanUpdateError } = await ContractService.updateLoanStatus(
        loanApplicationId,
        'contract_signed'
      );

      if (loanUpdateError) {
        throw new Error(loanUpdateError.message);
      }

      setUploadProgress(100);
      setUploadStatus('success');
      
      // Notify parent components
      onContractUpdated();
      
      // Auto-move to disbursement after successful upload
      setTimeout(() => {
        onMoveToDisbursement();
      }, 2000);

    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : 'Upload failed');
      setUploadStatus('error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRetry = () => {
    setError(null);
    setUploadStatus('idle');
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
    setUploadStatus('idle');
    setError(null);
    setValidationErrors([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Upload className="w-5 h-5 mr-2 text-orange-600" />
          Upload Signed Contract
        </h3>
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-800">
          Required
        </span>
      </div>

      {/* Contract Information */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Contract Details</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Loan Amount:</span>
            <span className="ml-2 font-medium">TZS {contractData.loan_amount?.toLocaleString() || 'N/A'}</span>
          </div>
          <div>
            <span className="text-gray-600">Interest Rate:</span>
            <span className="ml-2 font-medium">{contractData.interest_rate || 'N/A'}%</span>
          </div>
          <div>
            <span className="text-gray-600">Term:</span>
            <span className="ml-2 font-medium">{contractData.repayment_period_months || 'N/A'} months</span>
          </div>
          <div>
            <span className="text-gray-600">Monthly Payment:</span>
            <span className="ml-2 font-medium">TZS {contractData.monthly_payment?.toLocaleString() || 'N/A'}</span>
          </div>
        </div>
      </div>

      {/* Upload Area */}
      <div className="space-y-4">
        {/* File Input */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={handleFileSelect}
            className="hidden"
            disabled={isUploading}
          />
          
          {!uploadedFile ? (
            <div>
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-900 mb-2">
                Upload Signed Contract
              </p>
              <p className="text-sm text-gray-600 mb-4">
                Drag and drop your file here, or click to browse
              </p>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50"
              >
                Choose File
              </button>
              <p className="text-xs text-gray-500 mt-2">
                Supported formats: PDF, JPEG, PNG (Max 10MB)
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-center">
                <FileText className="w-8 h-8 text-green-600 mr-3" />
                <div className="text-left">
                  <p className="font-medium text-gray-900">{uploadedFile.name}</p>
                  <p className="text-sm text-gray-600">
                    {(uploadedFile.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
                <button
                  onClick={handleRemoveFile}
                  disabled={isUploading}
                  className="ml-4 text-red-600 hover:text-red-800 disabled:opacity-50"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Upload Progress */}
              {isUploading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Uploading...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-orange-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Upload Status */}
              {uploadStatus === 'success' && (
                <div className="flex items-center justify-center text-green-600">
                  <CheckCircle className="w-5 h-5 mr-2" />
                  <span className="font-medium">Contract uploaded successfully!</span>
                </div>
              )}

              {uploadStatus === 'error' && (
                <div className="flex items-center justify-center text-red-600">
                  <AlertCircle className="w-5 h-5 mr-2" />
                  <span className="font-medium">Upload failed</span>
                </div>
              )}

              {/* Action Buttons */}
              {uploadStatus === 'idle' && (
                <div className="flex space-x-3">
                  <button
                    onClick={handleUpload}
                    disabled={isUploading}
                    className="flex-1 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 flex items-center justify-center"
                  >
                    {isUploading ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Contract
                      </>
                    )}
                  </button>
                </div>
              )}

              {uploadStatus === 'error' && (
                <div className="flex space-x-3">
                  <button
                    onClick={handleRetry}
                    className="flex-1 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Try Again
                  </button>
                  <button
                    onClick={handleRemoveFile}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Choose Different File
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-red-800 mb-2">Validation Errors:</h4>
            <ul className="text-sm text-red-700 space-y-1">
              {validationErrors.map((error, index) => (
                <li key={index} className="flex items-center">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  {error}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Upload Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
              <span className="text-red-800">{error}</span>
            </div>
          </div>
        )}

        {/* Success Message */}
        {uploadStatus === 'success' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
              <div>
                <p className="text-green-800 font-medium">Contract uploaded successfully!</p>
                <p className="text-green-700 text-sm">
                  The loan will be automatically moved to the disbursement queue.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedContractUpload;




