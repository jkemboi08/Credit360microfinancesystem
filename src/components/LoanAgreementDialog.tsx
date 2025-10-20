import React, { useState, useEffect } from 'react';
import { X, Upload, Download, FileText, User, Building, Calendar, DollarSign, Percent, Clock, MapPin, Phone, Mail, Signature, Camera, CheckCircle, AlertCircle } from 'lucide-react';

interface LoanAgreementDialogProps {
  isOpen: boolean;
  onClose: () => void;
  loanApplication: any;
  loanParams: any;
  calculatedTotals: any;
  repaymentSchedule: any[];
  clientData: any;
}

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
}

const LoanAgreementDialog: React.FC<LoanAgreementDialogProps> = ({
  isOpen,
  onClose,
  loanApplication,
  loanParams,
  calculatedTotals,
  repaymentSchedule,
  clientData
}) => {
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
    witnessSignature: null
  });

  const [activeSection, setActiveSection] = useState('header');
  const [isGenerating, setIsGenerating] = useState(false);

  // Auto-populate data when dialog opens
  useEffect(() => {
    if (isOpen && loanApplication && loanParams) {
      const disbursementDate = new Date(loanParams.disbursement_date);
      const endDate = new Date(disbursementDate);
      endDate.setMonth(endDate.getMonth() + parseInt(loanParams.term_months));

      setContractData(prev => ({
        ...prev,
        borrowerName: loanApplication.clientName || '',
        borrowerAddress: clientData?.address || '',
        borrowerOccupation: clientData?.occupation || '',
        loanAmount: parseFloat(loanParams.principal_amount) || 0,
        loanAmountWords: numberToWords(parseFloat(loanParams.principal_amount) || 0),
        interestRate: parseFloat(loanParams.interest_rate) || 0,
        monthlyInterestAmount: (parseFloat(loanParams.principal_amount) || 0) * (parseFloat(loanParams.interest_rate) || 0) / 100,
        managementFeeRate: parseFloat(loanParams.management_fee_rate) || 0,
        monthlyManagementFee: (parseFloat(loanParams.principal_amount) || 0) * (parseFloat(loanParams.management_fee_rate) || 0) / 100,
        totalRepaymentAmount: calculatedTotals.totalRepayment || 0,
        totalRepaymentWords: numberToWords(calculatedTotals.totalRepayment || 0),
        repaymentPeriodMonths: parseInt(loanParams.term_months) || 0,
        repaymentStartDate: disbursementDate.toISOString().split('T')[0],
        repaymentEndDate: endDate.toISOString().split('T')[0],
        guarantorName: clientData?.guarantor_name || '',
        guarantorOccupation: clientData?.guarantor_occupation || '',
        guarantorAddress: clientData?.guarantor_address || ''
      }));
    }
  }, [isOpen, loanApplication, loanParams, calculatedTotals, clientData]);

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

  const handleGenerateDocument = async (format: 'pdf' | 'word') => {
    setIsGenerating(true);
    try {
      // Simulate document generation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // In a real implementation, this would call a document generation service
      console.log('Generating document:', format, contractData);
      
      // For now, just show success message
      alert(`Document generated successfully in ${format.toUpperCase()} format!`);
    } catch (error) {
      console.error('Error generating document:', error);
      alert('Error generating document. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const sections = [
    { id: 'header', name: 'Header & Branding', icon: Building },
    { id: 'details', name: 'Core Contract Details', icon: FileText },
    { id: 'schedule', name: 'Repayment Schedule', icon: Calendar },
    { id: 'signatures', name: 'Signatures & Witness', icon: Signature },
    { id: 'generate', name: 'Document Generation', icon: Download }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      
      <div className="relative flex h-full">
        {/* Sidebar Navigation */}
        <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Loan Agreement Generator</h2>
            <p className="text-sm text-gray-600">Generate contract document</p>
          </div>
          
          <nav className="flex-1 p-4 space-y-2">
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
          
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="w-full flex items-center justify-center px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-4 h-4 mr-2" />
              Close Dialog
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 bg-gray-50 overflow-y-auto">
          <div className="p-6">
            {/* Header & Branding Section */}
            {activeSection === 'header' && (
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
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
                  
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <CheckCircle className="w-5 h-5 text-blue-600 mr-2" />
                      <span className="text-sm font-medium text-blue-800">Best Practice</span>
                    </div>
                    <p className="text-sm text-blue-700">
                      The system will store the uploaded letterhead for future use, making it the default option for all subsequent contracts.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Core Contract Details Section */}
            {activeSection === 'details' && (
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
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
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Management Fee Rate (% monthly)
                        </label>
                        <input
                          type="text"
                          value={`${contractData.managementFeeRate}%`}
                          readOnly
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Monthly Management Fee
                        </label>
                        <input
                          type="text"
                          value={formatCurrency(contractData.monthlyManagementFee)}
                          readOnly
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Total Repayment Amount (Figures)
                        </label>
                        <input
                          type="text"
                          value={formatCurrency(contractData.totalRepaymentAmount)}
                          readOnly
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Total Repayment Amount (Words)
                        </label>
                        <input
                          type="text"
                          value={contractData.totalRepaymentWords}
                          readOnly
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Repayment Terms */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                      <Clock className="w-5 h-5 mr-2 text-purple-600" />
                      Repayment Terms
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Repayment Period (Months)
                        </label>
                        <input
                          type="text"
                          value={`${contractData.repaymentPeriodMonths} months`}
                          readOnly
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Repayment Start Date
                        </label>
                        <input
                          type="date"
                          value={contractData.repaymentStartDate}
                          readOnly
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Repayment End Date
                        </label>
                        <input
                          type="date"
                          value={contractData.repaymentEndDate}
                          readOnly
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Guarantor Information */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                      <User className="w-5 h-5 mr-2 text-orange-600" />
                      Guarantor Information
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Guarantor Name
                        </label>
                        <input
                          type="text"
                          value={contractData.guarantorName}
                          readOnly
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Guarantor Occupation
                        </label>
                        <input
                          type="text"
                          value={contractData.guarantorOccupation}
                          readOnly
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Guarantor Address
                        </label>
                        <textarea
                          value={contractData.guarantorAddress}
                          readOnly
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Bank Account Details */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                      <Building className="w-5 h-5 mr-2 text-indigo-600" />
                      Bank Account Details for Repayment
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Bank Name
                        </label>
                        <input
                          type="text"
                          value={contractData.bankAccountDetails.bankName}
                          onChange={(e) => setContractData(prev => ({
                            ...prev,
                            bankAccountDetails: { ...prev.bankAccountDetails, bankName: e.target.value }
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Account Number
                        </label>
                        <input
                          type="text"
                          value={contractData.bankAccountDetails.accountNumber}
                          onChange={(e) => setContractData(prev => ({
                            ...prev,
                            bankAccountDetails: { ...prev.bankAccountDetails, accountNumber: e.target.value }
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Account Name
                        </label>
                        <input
                          type="text"
                          value={contractData.bankAccountDetails.accountName}
                          onChange={(e) => setContractData(prev => ({
                            ...prev,
                            bankAccountDetails: { ...prev.bankAccountDetails, accountName: e.target.value }
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Branch
                        </label>
                        <input
                          type="text"
                          value={contractData.bankAccountDetails.branch}
                          onChange={(e) => setContractData(prev => ({
                            ...prev,
                            bankAccountDetails: { ...prev.bankAccountDetails, branch: e.target.value }
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Repayment Schedule Section */}
            {activeSection === 'schedule' && (
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                  <Calendar className="w-6 h-6 mr-3 text-orange-600" />
                  Dynamic Repayment Schedule
                </h3>
                
                <div className="space-y-4">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <CheckCircle className="w-5 h-5 text-blue-600 mr-2" />
                      <span className="text-sm font-medium text-blue-800">Auto-Generated Schedule</span>
                    </div>
                    <p className="text-sm text-blue-700">
                      This table is automatically generated from the repayment schedule preview in the loan processing page.
                    </p>
                  </div>

                  {repaymentSchedule.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm border border-gray-200 rounded-lg">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left border-b font-medium text-gray-700">Tarehe (Date)</th>
                            <th className="px-4 py-3 text-left border-b font-medium text-gray-700">Mkopo uliotolewa (Principal)</th>
                            <th className="px-4 py-3 text-left border-b font-medium text-gray-700">Riba ya mkopo (Interest)</th>
                            <th className="px-4 py-3 text-left border-b font-medium text-gray-700">Ada ya usimamizi (Mgmt Fee)</th>
                            <th className="px-4 py-3 text-left border-b font-medium text-gray-700">Jumla ya rejesho (Total)</th>
                            <th className="px-4 py-3 text-left border-b font-medium text-gray-700">Salio la mkopo (Balance)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {repaymentSchedule.map((entry, index) => (
                            <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                              <td className="px-4 py-3">{entry.dueDate}</td>
                              <td className="px-4 py-3">{formatCurrency(entry.principalPortion)}</td>
                              <td className="px-4 py-3">{formatCurrency(entry.interestPortion)}</td>
                              <td className="px-4 py-3">{formatCurrency(entry.managementFeePortion)}</td>
                              <td className="px-4 py-3 font-medium">{formatCurrency(entry.totalPayment)}</td>
                              <td className="px-4 py-3">{formatCurrency(entry.remainingBalance)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>No repayment schedule available</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Signatures & Witness Section */}
            {activeSection === 'signatures' && (
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                  <Signature className="w-6 h-6 mr-3 text-purple-600" />
                  Signatures & Witness Details
                </h3>
                
                <div className="space-y-8">
                  {/* Client Details */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                      <User className="w-5 h-5 mr-2 text-blue-600" />
                      Client Details
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Client Name
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
                          Client Signature
                        </label>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 h-20 flex items-center justify-center">
                          {contractData.clientSignature ? (
                            <img src={contractData.clientSignature} alt="Client signature" className="max-h-16" />
                          ) : (
                            <span className="text-gray-500 text-sm">Digital signature will be captured here</span>
                          )}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Client Thumbprint
                        </label>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 h-20 flex items-center justify-center">
                          {contractData.clientThumbprint ? (
                            <img src={contractData.clientThumbprint} alt="Client thumbprint" className="max-h-16" />
                          ) : (
                            <span className="text-gray-500 text-sm">Thumbprint will be captured here</span>
                          )}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Client Photo
                        </label>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 h-20 flex items-center justify-center">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => e.target.files?.[0] && handleFileUpload('clientPhoto', e.target.files[0])}
                            className="hidden"
                            id="client-photo-upload"
                          />
                          <label
                            htmlFor="client-photo-upload"
                            className="cursor-pointer flex flex-col items-center"
                          >
                            <Camera className="w-6 h-6 text-gray-400 mb-1" />
                            <span className="text-xs text-gray-500">Upload Photo</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Spouse Details */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                      <User className="w-5 h-5 mr-2 text-pink-600" />
                      Spouse Details
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Spouse Name
                        </label>
                        <input
                          type="text"
                          value={contractData.spouseName}
                          onChange={(e) => setContractData(prev => ({ ...prev, spouseName: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Spouse Address
                        </label>
                        <input
                          type="text"
                          value={contractData.spouseAddress}
                          onChange={(e) => setContractData(prev => ({ ...prev, spouseAddress: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Spouse Signature
                        </label>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 h-20 flex items-center justify-center">
                          {contractData.spouseSignature ? (
                            <img src={contractData.spouseSignature} alt="Spouse signature" className="max-h-16" />
                          ) : (
                            <span className="text-gray-500 text-sm">Digital signature will be captured here</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Guarantor Details */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                      <User className="w-5 h-5 mr-2 text-orange-600" />
                      Guarantor Details
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Guarantor Name
                        </label>
                        <input
                          type="text"
                          value={contractData.guarantorName}
                          readOnly
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Guarantor Address
                        </label>
                        <input
                          type="text"
                          value={contractData.guarantorAddress}
                          readOnly
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Guarantor Signature
                        </label>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 h-20 flex items-center justify-center">
                          {contractData.guarantorSignature ? (
                            <img src={contractData.guarantorSignature} alt="Guarantor signature" className="max-h-16" />
                          ) : (
                            <span className="text-gray-500 text-sm">Digital signature will be captured here</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Company Representative Details */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                      <Building className="w-5 h-5 mr-2 text-indigo-600" />
                      Company Representative Details
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Representative Name
                        </label>
                        <input
                          type="text"
                          value={contractData.companyRepresentativeName}
                          onChange={(e) => setContractData(prev => ({ ...prev, companyRepresentativeName: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Title/Position
                        </label>
                        <input
                          type="text"
                          value={contractData.companyRepresentativeTitle}
                          onChange={(e) => setContractData(prev => ({ ...prev, companyRepresentativeTitle: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Representative Signature
                        </label>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 h-20 flex items-center justify-center">
                          {contractData.companyRepresentativeSignature ? (
                            <img src={contractData.companyRepresentativeSignature} alt="Company representative signature" className="max-h-16" />
                          ) : (
                            <span className="text-gray-500 text-sm">Digital signature will be captured here</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Witness Details */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                      <User className="w-5 h-5 mr-2 text-gray-600" />
                      Witness Details (Magistrate/Lawyer)
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Witness Name
                        </label>
                        <input
                          type="text"
                          value={contractData.witnessName}
                          onChange={(e) => setContractData(prev => ({ ...prev, witnessName: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Witness Address
                        </label>
                        <input
                          type="text"
                          value={contractData.witnessAddress}
                          onChange={(e) => setContractData(prev => ({ ...prev, witnessAddress: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Witness Signature
                        </label>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 h-20 flex items-center justify-center">
                          {contractData.witnessSignature ? (
                            <img src={contractData.witnessSignature} alt="Witness signature" className="max-h-16" />
                          ) : (
                            <span className="text-gray-500 text-sm">Digital signature will be captured here</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Document Generation Section */}
            {activeSection === 'generate' && (
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
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

                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <CheckCircle className="w-5 h-5 text-blue-600 mr-2" />
                      <span className="text-sm font-medium text-blue-800">Best Practice</span>
                    </div>
                    <p className="text-sm text-blue-700">
                      The system will automatically archive a copy of the final, signed PDF within the client's profile for future reference and compliance purposes.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoanAgreementDialog;






