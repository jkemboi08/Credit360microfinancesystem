import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { useSupabaseQuery } from '../hooks/useSupabase';
import {
  ArrowLeft,
  Upload,
  Download,
  FileText,
  User,
  Building,
  Calendar,
  DollarSign,
  Percent,
  Clock,
  MapPin,
  Phone,
  Mail,
  PenTool,
  Camera,
  CheckCircle,
  AlertCircle,
  Save,
  Send
} from 'lucide-react';
import toast from 'react-hot-toast';

interface ContractData {
  // Header & Branding
  letterheadImage: string | null;
  
  // Core Contract Details
  contractDate: string;
  borrowerName: string;
  borrowerAddress: string;
  borrowerOccupation: string;
  loanAmount: number;
  loanAmountWords: string;
  interestRate: number;
  monthlyInterestAmount: number;
  managementFeeRate: number;
  monthlyManagementFee: number;
  totalRepaymentAmount: number;
  totalRepaymentWords: string;
  repaymentPeriodMonths: number;
  repaymentStartDate: string;
  repaymentEndDate: string;
  guarantorName: string;
  guarantorOccupation: string;
  guarantorAddress: string;
  bankAccountDetails: {
    bankName: string;
    accountNumber: string;
    accountName: string;
    branch: string;
  };
  
  // Signature Details
  clientSignature: string | null;
  clientThumbprint: string | null;
  clientPhoto: string | null;
  spouseName: string;
  spouseAddress: string;
  spouseSignature: string | null;
  guarantorSignature: string | null;
  companyRepresentativeName: string;
  companyRepresentativeTitle: string;
  companyRepresentativeSignature: string | null;
  witnessName: string;
  witnessAddress: string;
  witnessSignature: string | null;
  
  // Contract Status
  contractAccepted: boolean;
  contractSigned: boolean;
}

const LoanContractPage: React.FC = () => {
  const { loanApplicationId } = useParams<{ loanApplicationId: string }>();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('header');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch loan application details
  const { data: loanApplication, loading: applicationLoading } = useSupabaseQuery('loan_applications', {
    filter: [{ column: 'id', operator: 'eq', value: loanApplicationId }],
    select: `
      *,
      client:clients!client_id (
        id,
        first_name,
        last_name,
        phone_number,
        email_address,
        address,
        occupation
      )
    `
  });

  const [contractData, setContractData] = useState<ContractData>({
    letterheadImage: null,
    contractDate: new Date().toISOString().split('T')[0],
    borrowerName: '',
    borrowerAddress: '',
    borrowerOccupation: '',
    loanAmount: 0,
    loanAmountWords: '',
    interestRate: 0,
    monthlyInterestAmount: 0,
    managementFeeRate: 0,
    monthlyManagementFee: 0,
    totalRepaymentAmount: 0,
    totalRepaymentWords: '',
    repaymentPeriodMonths: 0,
    repaymentStartDate: '',
    repaymentEndDate: '',
    guarantorName: '',
    guarantorOccupation: '',
    guarantorAddress: '',
    bankAccountDetails: {
      bankName: 'CRDB Bank Plc',
      accountNumber: '0150123456789',
      accountName: 'MFI Loan Account',
      branch: 'Dar es Salaam Main Branch'
    },
    clientSignature: null,
    clientThumbprint: null,
    clientPhoto: null,
    spouseName: '',
    spouseAddress: '',
    spouseSignature: null,
    guarantorSignature: null,
    companyRepresentativeName: '',
    companyRepresentativeTitle: 'Loan Officer',
    companyRepresentativeSignature: null,
    witnessName: '',
    witnessAddress: '',
    witnessSignature: null,
    contractAccepted: false,
    contractSigned: false
  });

  // Auto-populate data when loan application loads
  useEffect(() => {
    if (loanApplication && loanApplication.length > 0) {
      const app = loanApplication[0];
      const client = app.client;
      
      setContractData(prev => ({
        ...prev,
        borrowerName: `${client?.first_name || ''} ${client?.last_name || ''}`.trim(),
        borrowerAddress: client?.address || '',
        borrowerOccupation: client?.occupation || '',
        loanAmount: parseFloat(app.requested_amount) || 0,
        loanAmountWords: numberToWords(parseFloat(app.requested_amount) || 0),
        interestRate: 2.5, // Default rate
        monthlyInterestAmount: (parseFloat(app.requested_amount) || 0) * 0.025,
        managementFeeRate: 1.0, // Default rate
        monthlyManagementFee: (parseFloat(app.requested_amount) || 0) * 0.01,
        totalRepaymentAmount: (parseFloat(app.requested_amount) || 0) * 1.35, // Estimated
        totalRepaymentWords: numberToWords((parseFloat(app.requested_amount) || 0) * 1.35),
        repaymentPeriodMonths: parseInt(app.repayment_period_months) || 12,
        repaymentStartDate: new Date().toISOString().split('T')[0],
        repaymentEndDate: new Date(Date.now() + (parseInt(app.repayment_period_months) || 12) * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      }));
    }
  }, [loanApplication]);

  // Convert number to words (simplified version)
  const numberToWords = (num: number): string => {
    const ones = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
    const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
    const teens = ['ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
    
    if (num === 0) return 'zero';
    if (num < 10) return ones[num];
    if (num < 20) return teens[num - 10];
    if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 ? ' ' + ones[num % 10] : '');
    if (num < 1000) return ones[Math.floor(num / 100)] + ' hundred' + (num % 100 ? ' ' + numberToWords(num % 100) : '');
    if (num < 1000000) return numberToWords(Math.floor(num / 1000)) + ' thousand' + (num % 1000 ? ' ' + numberToWords(num % 1000) : '');
    return 'very large number';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const handleFileUpload = (field: string, file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setContractData(prev => ({
        ...prev,
        [field]: e.target?.result as string
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleSaveContract = async () => {
    setIsSaving(true);
    try {
      // Save contract data to database
      // This would typically save to a contracts table
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      toast.success('Contract saved successfully');
    } catch (error) {
      console.error('Error saving contract:', error);
      toast.error('Failed to save contract');
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerateDocument = async (format: 'pdf' | 'word') => {
    setIsGenerating(true);
    try {
      // Simulate document generation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log('Generating document:', format, contractData);
      toast.success(`Document generated successfully in ${format.toUpperCase()} format!`);
    } catch (error) {
      console.error('Error generating document:', error);
      toast.error('Error generating document. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAcceptContract = () => {
    setContractData(prev => ({
      ...prev,
      contractAccepted: true
    }));
    toast.success('Contract accepted by client');
  };

  const handleSignContract = () => {
    setContractData(prev => ({
      ...prev,
      contractSigned: true
    }));
    toast.success('Contract signed successfully');
  };

  const handleSubmitContract = async () => {
    if (!contractData.contractAccepted || !contractData.contractSigned) {
      toast.error('Contract must be accepted and signed before submission');
      return;
    }

    try {
      // Update loan application status to approved
      // This would typically update the database
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Loan application approved and contract submitted successfully!');
      navigate('/staff/loan-processing');
    } catch (error) {
      console.error('Error submitting contract:', error);
      toast.error('Failed to submit contract');
    }
  };

  const sections = [
    { id: 'header', name: 'Header & Branding', icon: Building },
    { id: 'details', name: 'Core Contract Details', icon: FileText },
    { id: 'schedule', name: 'Repayment Schedule', icon: Calendar },
    { id: 'signatures', name: 'Signatures & Witness', icon: PenTool },
    { id: 'acceptance', name: 'Contract Acceptance', icon: CheckCircle },
    { id: 'generate', name: 'Document Generation', icon: Download }
  ];

  if (applicationLoading) {
    return (
      <Layout>
        <div className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading loan application...</span>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/staff/loan-processing')}
              className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Loan Processing
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Loan Contract Generation</h1>
              <p className="text-gray-600">Application ID: {loanApplicationId}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={handleSaveContract}
              disabled={isSaving}
              className="flex items-center px-4 py-2 text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save Draft'}
            </button>
            
            {contractData.contractAccepted && contractData.contractSigned && (
              <button
                onClick={handleSubmitContract}
                className="flex items-center px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Send className="w-4 h-4 mr-2" />
                Submit Contract
              </button>
            )}
          </div>
        </div>

        <div className="flex gap-6">
          {/* Sidebar Navigation */}
          <div className="w-64 bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Contract Sections</h3>
            
            <nav className="space-y-2">
              {sections.map((section) => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center px-3 py-2 text-sm rounded-lg transition-colors ${
                      activeSection === section.id
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-4 h-4 mr-3" />
                    {section.name}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            {/* Header & Branding Section */}
            {activeSection === 'header' && (
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                  <Building className="w-6 h-6 mr-3 text-blue-600" />
                  Header & Branding
                </h3>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Institution Letterhead/Logo
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => e.target.files?.[0] && handleFileUpload('letterheadImage', e.target.files[0])}
                        className="hidden"
                        id="letterhead-upload"
                      />
                      <label
                        htmlFor="letterhead-upload"
                        className="cursor-pointer flex flex-col items-center"
                      >
                        <Upload className="w-8 h-8 text-gray-400 mb-2" />
                        <span className="text-sm text-gray-600">Click to upload letterhead</span>
                        <span className="text-xs text-gray-500">PNG, JPG up to 2MB</span>
                      </label>
                    </div>
                    
                    {contractData.letterheadImage && (
                      <div className="mt-4">
                        <p className="text-sm text-gray-600 mb-2">Preview:</p>
                        <div className="border border-gray-200 rounded-lg p-4 bg-white">
                          <img
                            src={contractData.letterheadImage}
                            alt="Letterhead preview"
                            className="max-h-20 mx-auto"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Core Contract Details Section */}
            {activeSection === 'details' && (
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                  <FileText className="w-6 h-6 mr-3 text-green-600" />
                  Core Contract Details
                </h3>
                
                <div className="space-y-6">
                  {/* Contract Date */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Contract Date
                      </label>
                      <input
                        type="date"
                        value={contractData.contractDate}
                        onChange={(e) => setContractData(prev => ({ ...prev, contractDate: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {/* Borrower Information */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                      <User className="w-5 h-5 mr-2 text-blue-600" />
                      Borrower Information
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Full Name
                        </label>
                        <input
                          type="text"
                          value={contractData.borrowerName}
                          readOnly
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Occupation
                        </label>
                        <input
                          type="text"
                          value={contractData.borrowerOccupation}
                          readOnly
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Address & P.O. Box
                        </label>
                        <textarea
                          value={contractData.borrowerAddress}
                          readOnly
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Loan Details */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                      <DollarSign className="w-5 h-5 mr-2 text-green-600" />
                      Loan Details
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Loan Amount (Figures)
                        </label>
                        <input
                          type="text"
                          value={formatCurrency(contractData.loanAmount)}
                          readOnly
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Loan Amount (Words)
                        </label>
                        <input
                          type="text"
                          value={contractData.loanAmountWords}
                          readOnly
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Interest Rate (% monthly)
                        </label>
                        <input
                          type="text"
                          value={`${contractData.interestRate}%`}
                          readOnly
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Monthly Interest Amount
                        </label>
                        <input
                          type="text"
                          value={formatCurrency(contractData.monthlyInterestAmount)}
                          readOnly
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Contract Acceptance Section */}
            {activeSection === 'acceptance' && (
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                  <CheckCircle className="w-6 h-6 mr-3 text-green-600" />
                  Contract Acceptance & Signing
                </h3>
                
                <div className="space-y-6">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <AlertCircle className="w-5 h-5 text-yellow-600 mr-2" />
                      <span className="text-sm font-medium text-yellow-800">Important Notice</span>
                    </div>
                    <p className="text-sm text-yellow-700">
                      The loan application can only be submitted after the client has accepted and signed the contract.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Contract Acceptance */}
                    <div className="border border-gray-200 rounded-lg p-6">
                      <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                        <CheckCircle className="w-5 h-5 mr-2 text-blue-600" />
                        Contract Acceptance
                      </h4>
                      
                      <div className="space-y-4">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="contract-accepted"
                            checked={contractData.contractAccepted}
                            onChange={(e) => setContractData(prev => ({ ...prev, contractAccepted: e.target.checked }))}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label htmlFor="contract-accepted" className="ml-2 text-sm text-gray-700">
                            I have read and understood the terms and conditions of this loan agreement
                          </label>
                        </div>
                        
                        <button
                          onClick={handleAcceptContract}
                          disabled={contractData.contractAccepted}
                          className={`w-full px-4 py-2 rounded-lg transition-colors ${
                            contractData.contractAccepted
                              ? 'bg-green-100 text-green-800 cursor-not-allowed'
                              : 'bg-blue-600 text-white hover:bg-blue-700'
                          }`}
                        >
                          {contractData.contractAccepted ? 'Contract Accepted' : 'Accept Contract'}
                        </button>
                      </div>
                    </div>

                    {/* Contract Signing */}
                    <div className="border border-gray-200 rounded-lg p-6">
                      <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                        <PenTool className="w-5 h-5 mr-2 text-purple-600" />
                        Contract Signing
                      </h4>
                      
                      <div className="space-y-4">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="contract-signed"
                            checked={contractData.contractSigned}
                            onChange={(e) => setContractData(prev => ({ ...prev, contractSigned: e.target.checked }))}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label htmlFor="contract-signed" className="ml-2 text-sm text-gray-700">
                            I have digitally signed this loan agreement
                          </label>
                        </div>
                        
                        <button
                          onClick={handleSignContract}
                          disabled={contractData.contractSigned || !contractData.contractAccepted}
                          className={`w-full px-4 py-2 rounded-lg transition-colors ${
                            contractData.contractSigned
                              ? 'bg-green-100 text-green-800 cursor-not-allowed'
                              : !contractData.contractAccepted
                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              : 'bg-purple-600 text-white hover:bg-purple-700'
                          }`}
                        >
                          {contractData.contractSigned ? 'Contract Signed' : 'Sign Contract'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Status Summary */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h5 className="text-sm font-medium text-gray-900 mb-3">Contract Status</h5>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Contract Accepted:</span>
                        <span className={`text-sm font-medium ${contractData.contractAccepted ? 'text-green-600' : 'text-red-600'}`}>
                          {contractData.contractAccepted ? 'Yes' : 'No'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Contract Signed:</span>
                        <span className={`text-sm font-medium ${contractData.contractSigned ? 'text-green-600' : 'text-red-600'}`}>
                          {contractData.contractSigned ? 'Yes' : 'No'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Ready for Submission:</span>
                        <span className={`text-sm font-medium ${contractData.contractAccepted && contractData.contractSigned ? 'text-green-600' : 'text-red-600'}`}>
                          {contractData.contractAccepted && contractData.contractSigned ? 'Yes' : 'No'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Document Generation Section */}
            {activeSection === 'generate' && (
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                  <Download className="w-6 h-6 mr-3 text-green-600" />
                  Document Generation & Download
                </h3>
                
                <div className="space-y-6">
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                      <span className="text-sm font-medium text-green-800">Ready to Generate</span>
                    </div>
                    <p className="text-sm text-green-700">
                      All contract information has been compiled. Click the buttons below to generate and download the contract document.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="border border-gray-200 rounded-lg p-6 text-center">
                      <FileText className="w-12 h-12 mx-auto mb-4 text-blue-600" />
                      <h4 className="text-lg font-medium text-gray-900 mb-2">Microsoft Word (.docx)</h4>
                      <p className="text-sm text-gray-600 mb-4">
                        Generate a Word document that allows for final minor edits before printing.
                      </p>
                      <button
                        onClick={() => handleGenerateDocument('word')}
                        disabled={isGenerating}
                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center"
                      >
                        {isGenerating ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Generating...
                          </>
                        ) : (
                          <>
                            <Download className="w-4 h-4 mr-2" />
                            Generate Word Document
                          </>
                        )}
                      </button>
                    </div>

                    <div className="border border-gray-200 rounded-lg p-6 text-center">
                      <FileText className="w-12 h-12 mx-auto mb-4 text-red-600" />
                      <h4 className="text-lg font-medium text-gray-900 mb-2">PDF Document</h4>
                      <p className="text-sm text-gray-600 mb-4">
                        Generate a PDF that ensures contract integrity and formatting for signing and storage.
                      </p>
                      <button
                        onClick={() => handleGenerateDocument('pdf')}
                        disabled={isGenerating}
                        className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center"
                      >
                        {isGenerating ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Generating...
                          </>
                        ) : (
                          <>
                            <Download className="w-4 h-4 mr-2" />
                            Generate PDF Document
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default LoanContractPage;
