import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout';
import { 
  Save, 
  Send, 
  Upload, 
  FileText, 
  AlertCircle, 
  CheckCircle, 
  DollarSign,
  Calendar,
  Building,
  User,
  FileImage,
  X,
  Plus,
  Info,
  ChevronRight,
  ChevronLeft,
  CreditCard,
  Banknote,
  Smartphone,
  Receipt,
  Tag,
  Globe,
  Calculator,
  Eye,
  RefreshCw,
  Clock,
  CheckCircle2,
  XCircle,
  TrendingUp,
  TrendingDown,
  Search,
  Filter,
  Download,
  Edit3,
  Trash2,
  AlertTriangle,
  Shield,
  Target,
  BarChart3,
  PieChart,
  ArrowRight,
  ArrowLeft,
  Zap,
  Bell,
  Settings,
  Maximize2,
  Minimize2,
  MoreHorizontal,
  Play,
  Pause,
  RotateCcw
} from 'lucide-react';
import { 
  ExpenseFormData, 
  ExpenseCategory, 
  Vendor, 
  BOTReportImpact, 
  BudgetImpact,
  ApprovalWorkflow,
  LegacyExpenseCategory
} from '../types/expense';
import { ExpenseCategoryService } from '../services/expenseCategoryService';
import { SupabaseExpenseService } from '../services/supabaseExpenseService';
import { useRealtimeData } from '../hooks/useRealtimeData';

// Enhanced types for the new features
interface EnhancedExpenseFormData extends ExpenseFormData {
  // Expense Type
  expenseType: 'bill' | 'payment';
  
  // Payment and Currency
  paymentMethod: 'cash' | 'bank' | 'credit_card' | 'mobile' | 'check';
  currency: string;
  exchangeRate: number;
  originalAmount: number;
  originalCurrency: string;
  
  // Recurring
  isRecurring: boolean;
  recurringFrequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  recurringEndDate?: Date;
  recurringDescription?: string;
  
  // Tax
  taxAmount: number;
  taxRate: number;
  taxType: 'vat' | 'withholding' | 'other';
  taxReclaimable: boolean;
  
  // Advanced Categorization
  subCategory: string;
  tags: string[];
  customTags: string[];
  
  // Vendor Details
  vendorContact: string;
  vendorEmail: string;
  vendorPhone: string;
  paymentTerms: string;
  isCreditPurchase: boolean;
  
  // Reimbursement
  isReimbursement: boolean;
  employeeId: string;
  advanceAmount: number;
  reimbursementType: 'advance' | 'expense' | 'both';
  
  // Accounting
  debitAccount: string;
  creditAccount: string;
  accrualBasis: boolean;
  
  // Account Management
  accountNumber: string;
  accountId: string;
  expenseLines: ExpenseLine[];
  
  // Auto-save
  lastSaved: Date;
  isDirty: boolean;
}

interface ExpenseLine {
  id: string;
  description: string;
  amount: number;
  accountNumber: string;
  accountId: string;
  accountName: string;
  debitCredit: 'debit' | 'credit';
  lineType: 'expense' | 'tax' | 'discount' | 'other';
}

interface ChartOfAccount {
  id: string;
  accountNumber: string;
  accountName: string;
  accountType: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  parentAccount?: string;
  isActive: boolean;
  description?: string;
}

interface StepperStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  completed: boolean;
  current: boolean;
}

interface LedgerEntry {
  account: string;
  debit: number;
  credit: number;
  description: string;
  type: 'debit' | 'credit';
}

// Utility functions
const formatCurrency = (amount: number, currency: string = 'TZS') => {
  return new Intl.NumberFormat('en-TZ', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Step Components - defined outside main component
const BasicInfoStep: React.FC<{
  expenseCategories: ExpenseCategory[];
  selectedCategory: string;
  handleCategoryChange: (categoryId: string) => void;
  expenseForm: EnhancedExpenseFormData;
  handleAmountChange: (value: string) => void;
  handleDateChange: (date: Date) => void;
  updateFormField: (field: keyof EnhancedExpenseFormData, value: any) => void;
  chartOfAccounts: ChartOfAccount[];
  expenseLines: ExpenseLine[];
  addExpenseLine: () => void;
  updateExpenseLine: (id: string, field: keyof ExpenseLine, value: any) => void;
  removeExpenseLine: (id: string) => void;
  handleAccountChange: (lineId: string, accountId: string) => void;
  showExpenseLinesModal: boolean;
  setShowExpenseLinesModal: (show: boolean) => void;
}> = ({ 
  expenseCategories, 
  selectedCategory, 
  handleCategoryChange, 
  expenseForm, 
  handleAmountChange, 
  handleDateChange, 
  updateFormField,
  chartOfAccounts,
  expenseLines,
  addExpenseLine,
  updateExpenseLine,
  removeExpenseLine,
  handleAccountChange,
  showExpenseLinesModal,
  setShowExpenseLinesModal
}) => (
  <div className="space-y-6">
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Basic Information</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Expense Type</label>
          <select
            value={expenseForm.expenseType}
            onChange={(e) => updateFormField('expenseType', e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="bill">Bill</option>
            <option value="payment">Payment</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
          <ExpenseCategorySelector
            categories={expenseCategories}
            value={selectedCategory}
            onChange={handleCategoryChange}
            showBOTMapping={true}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
          <CurrencyInput
            value={expenseForm.amount}
            onChange={handleAmountChange}
            currency={expenseForm.currency}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
          <DatePicker
            value={expenseForm.expenseDate}
            onChange={handleDateChange}
            maxDate={new Date()}
            required
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
          <textarea
            value={expenseForm.description}
            onChange={(e) => updateFormField('description', e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
            placeholder="Enter expense description"
            required
          />
        </div>
      </div>
    </div>

    {/* Expense Lines Section */}
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Expense Lines</h3>
        <button
          onClick={() => setShowExpenseLinesModal(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Manage Lines
        </button>
      </div>
      
      {expenseLines.length > 0 ? (
        <div className="space-y-2">
          {expenseLines.map((line) => (
            <div key={line.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
              <div className="flex-1 grid grid-cols-4 gap-4">
                <span className="text-sm font-medium">{line.description || 'No description'}</span>
                <span className="text-sm">{line.accountNumber} - {line.accountName}</span>
                <span className="text-sm">{line.debitCredit.toUpperCase()}</span>
                <span className="text-sm font-medium">{formatCurrency(line.amount)}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 text-sm">No expense lines added yet. Click "Manage Lines" to add them.</p>
      )}
    </div>

    {/* Expense Lines Modal */}
    {showExpenseLinesModal && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Manage Expense Lines</h3>
            <button
              onClick={() => setShowExpenseLinesModal(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          
          <div className="space-y-4">
            {expenseLines.map((line) => (
              <div key={line.id} className="border border-gray-200 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <input
                      type="text"
                      value={line.description}
                      onChange={(e) => updateExpenseLine(line.id, 'description', e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                      placeholder="Line description"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Account</label>
                    <select
                      value={line.accountId}
                      onChange={(e) => handleAccountChange(line.id, e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    >
                      <option value="">Select Account</option>
                      {chartOfAccounts.map(account => (
                        <option key={account.id} value={account.id}>
                          {account.accountNumber} - {account.accountName}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                    <input
                      type="number"
                      value={line.amount}
                      onChange={(e) => updateExpenseLine(line.id, 'amount', parseFloat(e.target.value) || 0)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                      placeholder="0.00"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                    <select
                      value={line.debitCredit}
                      onChange={(e) => updateExpenseLine(line.id, 'debitCredit', e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    >
                      <option value="debit">Debit</option>
                      <option value="credit">Credit</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Line Type</label>
                    <select
                      value={line.lineType}
                      onChange={(e) => updateExpenseLine(line.id, 'lineType', e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    >
                      <option value="expense">Expense</option>
                      <option value="tax">Tax</option>
                      <option value="discount">Discount</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={() => removeExpenseLine(line.id)}
                      className="text-red-600 hover:text-red-700 p-2"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            
            <button
              onClick={addExpenseLine}
              className="w-full flex items-center justify-center px-4 py-2 border-2 border-dashed border-gray-300 rounded-md text-gray-600 hover:border-gray-400 hover:text-gray-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Expense Line
            </button>
          </div>
          
          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={() => setShowExpenseLinesModal(false)}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    )}
  </div>
);

const VendorPaymentStep: React.FC<{
  approvedVendors: Vendor[];
  expenseForm: EnhancedExpenseFormData;
  handleVendorChange: (vendorId: string) => void;
  updateFormField: (field: keyof EnhancedExpenseFormData, value: any) => void;
  onAddNewVendor: () => void;
}> = ({ approvedVendors, expenseForm, handleVendorChange, updateFormField, onAddNewVendor }) => (
  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
    <h3 className="text-lg font-semibold text-gray-900 mb-6">Vendor & Payment Details</h3>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Vendor</label>
        <VendorSelector
          vendors={approvedVendors}
          value={expenseForm.vendorId}
          onChange={handleVendorChange}
          allowNewVendor={true}
          onAddNewVendor={onAddNewVendor}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
        <select
          value={expenseForm.paymentMethod}
          onChange={(e) => updateFormField('paymentMethod', e.target.value)}
          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="cash">Cash</option>
          <option value="bank">Bank Transfer</option>
          <option value="credit_card">Credit Card</option>
          <option value="mobile">Mobile Money</option>
          <option value="check">Check</option>
        </select>
      </div>
    </div>
  </div>
);

const AttachmentsStep: React.FC<{
  supportingDocs: File[];
  handleFileUpload: (files: FileList | null) => void;
  removeFile: (index: number) => void;
}> = ({ supportingDocs, handleFileUpload, removeFile }) => (
  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
    <h3 className="text-lg font-semibold text-gray-900 mb-6">Supporting Documents</h3>
    <DocumentUploadArea
      acceptedTypes={['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx']}
      maxFiles={5}
      onFilesUpload={handleFileUpload}
      required
    />
    {supportingDocs.length > 0 && (
      <div className="mt-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Uploaded Files</h4>
        <div className="space-y-2">
          {supportingDocs.map((file, index) => (
            <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
              <span className="text-sm text-gray-700">{file.name}</span>
              <button
                onClick={() => removeFile(index)}
                className="text-red-600 hover:text-red-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    )}
  </div>
);

const ReviewStep: React.FC<{
  expenseForm: EnhancedExpenseFormData;
  determineRequiredApprovers: () => ApprovalWorkflow;
  getApprovalLimits: () => any[];
  calculateApprovalTime: () => number;
}> = ({ expenseForm, determineRequiredApprovers, getApprovalLimits, calculateApprovalTime }) => (
  <div className="space-y-6">
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Review & Submit</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Expense Details</h4>
          <div className="space-y-2 text-sm">
            <div><span className="font-medium">Category:</span> {expenseForm.category}</div>
            <div><span className="font-medium">Amount:</span> {formatCurrency(expenseForm.amount, expenseForm.currency)}</div>
            <div><span className="font-medium">Date:</span> {expenseForm.expenseDate instanceof Date ? expenseForm.expenseDate.toLocaleDateString() : new Date(expenseForm.expenseDate).toLocaleDateString()}</div>
            <div><span className="font-medium">Vendor:</span> {expenseForm.vendorName}</div>
            <div><span className="font-medium">Description:</span> {expenseForm.description}</div>
          </div>
        </div>
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Approval Workflow</h4>
          <ApprovalWorkflowDisplay
            requiredApprovers={determineRequiredApprovers().requiredApprovers}
            approvalLimits={getApprovalLimits()}
            estimatedApprovalTime={calculateApprovalTime()}
          />
        </div>
      </div>
    </div>
  </div>
);

const StepperWizard: React.FC<{ steps: StepperStep[] }> = ({ steps }) => (
  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
    <div className="flex items-center justify-between">
      {steps.map((step, index) => (
        <div key={step.id} className="flex items-center">
          <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
            step.completed 
              ? 'bg-green-500 border-green-500 text-white' 
              : step.current 
              ? 'bg-blue-500 border-blue-500 text-white' 
              : 'bg-gray-100 border-gray-300 text-gray-500'
          }`}>
            {step.completed ? <CheckCircle2 className="h-5 w-5" /> : step.icon}
          </div>
          <div className="ml-3">
            <h3 className={`text-sm font-medium ${
              step.current ? 'text-blue-600' : step.completed ? 'text-green-600' : 'text-gray-500'
            }`}>
              {step.title}
            </h3>
            <p className="text-xs text-gray-500">{step.description}</p>
          </div>
          {index < steps.length - 1 && (
            <ChevronRight className="h-5 w-5 text-gray-400 mx-4" />
          )}
        </div>
      ))}
    </div>
  </div>
);

const AutoSaveIndicator: React.FC = () => {
  const [lastAutoSave, setLastAutoSave] = useState<Date>(new Date());
  const [isDirty, setIsDirty] = useState(false);

  return (
    <div className="flex items-center text-sm text-gray-500 mb-4">
      {isDirty ? (
        <div className="flex items-center">
          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          <span>Auto-saving...</span>
        </div>
      ) : (
        <div className="flex items-center">
          <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
          <span>Last saved: {lastAutoSave.toLocaleTimeString()}</span>
        </div>
      )}
    </div>
  );
};

const ExpenseEntryForm: React.FC = () => {
  // Stepper state
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState<StepperStep[]>([
    { id: 'basic', title: 'Basic Info', description: 'Expense details and amount', icon: <DollarSign className="h-5 w-5" />, completed: false, current: true },
    { id: 'vendor', title: 'Vendor & Payment', description: 'Vendor details and payment method', icon: <Building className="h-5 w-5" />, completed: false, current: false },
    { id: 'attachments', title: 'Documents', description: 'Supporting documents and files', icon: <FileImage className="h-5 w-5" />, completed: false, current: false },
    { id: 'review', title: 'Review & Submit', description: 'Review and submit for approval', icon: <Eye className="h-5 w-5" />, completed: false, current: false }
  ]);

  const [expenseForm, setExpenseForm] = useState<EnhancedExpenseFormData>({
    category: '',
    amount: 0,
    expenseDate: new Date(),
    vendorId: '',
    vendorName: '',
    description: '',
    supportingDocuments: [],
    approvalStatus: 'draft',
    submittedBy: 'Current User',
    submittedDate: new Date(),
    botImpact: {
      msp202Impact: [],
      otherReportsImpact: []
    },
    budgetImpact: {
      budgetCategory: '',
      allocatedAmount: 0,
      spentAmount: 0,
      remainingAmount: 0,
      variance: 0,
      variancePercentage: 0
    },
    // Enhanced fields
    expenseType: 'bill',
    paymentMethod: 'cash',
    currency: 'TZS',
    exchangeRate: 1,
    originalAmount: 0,
    originalCurrency: 'TZS',
    isRecurring: false,
    recurringFrequency: 'monthly',
    taxAmount: 0,
    taxRate: 18, // 18% VAT
    taxType: 'vat',
    taxReclaimable: true,
    subCategory: '',
    tags: [],
    customTags: [],
    vendorContact: '',
    vendorEmail: '',
    vendorPhone: '',
    paymentTerms: 'immediate',
    isCreditPurchase: false,
    isReimbursement: false,
    employeeId: '',
    advanceAmount: 0,
    reimbursementType: 'expense',
    debitAccount: 'Expense Account',
    creditAccount: 'Cash Account',
    accrualBasis: false,
    accountNumber: '',
    accountId: '',
    expenseLines: [],
    lastSaved: new Date(),
    isDirty: false
  });

  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [supportingDocs, setSupportingDocs] = useState<File[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>([]);
  const [approvedVendors, setApprovedVendors] = useState<Vendor[]>([]);
  const [showNewVendor, setShowNewVendor] = useState(false);
  const [newVendor, setNewVendor] = useState<Partial<Vendor>>({});
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  
  // Enhanced state
  const [subCategories, setSubCategories] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);
  const [showLedgerPreview, setShowLedgerPreview] = useState(false);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [lastAutoSave, setLastAutoSave] = useState<Date>(new Date());
  const [similarExpenses, setSimilarExpenses] = useState<any[]>([]);
  const [isCalculatingTax, setIsCalculatingTax] = useState(false);
  const [currencyRates, setCurrencyRates] = useState<{[key: string]: number}>({
    'TZS': 1,
    'USD': 2500,
    'EUR': 2800,
    'GBP': 3200
  });
  const [employees, setEmployees] = useState<any[]>([]);
  const [showVendorModal, setShowVendorModal] = useState(false);
  const [showReimbursementModal, setShowReimbursementModal] = useState(false);
  const [documentPreviews, setDocumentPreviews] = useState<{[key: string]: string}>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitProgress, setSubmitProgress] = useState(0);
  
  // Chart of Accounts and Expense Lines
  const [chartOfAccounts, setChartOfAccounts] = useState<ChartOfAccount[]>([]);
  const [expenseLines, setExpenseLines] = useState<ExpenseLine[]>([]);
  const [showExpenseLinesModal, setShowExpenseLinesModal] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  
  // Real-time data integration
  const { emitEvent } = useRealtimeData({
    events: ['expense_created', 'expense_updated', 'expense_approved']
  });

  // Auto-save functionality
  const autoSave = useCallback(async () => {
    if (!expenseForm.isDirty || !autoSaveEnabled) return;
    
    try {
      const result = await SupabaseExpenseService.createExpense({
        ...expenseForm,
        approvalStatus: 'draft'
      });
      
      if (result.success) {
        setExpenseForm(prev => ({ 
          ...prev, 
          isDirty: false, 
          lastSaved: new Date() 
        }));
        setLastAutoSave(new Date());
        console.log('Auto-saved successfully');
      }
    } catch (error) {
      console.error('Auto-save failed:', error);
    }
  }, [expenseForm, autoSaveEnabled]);

  // Auto-save effect
  useEffect(() => {
    const interval = setInterval(() => {
      if (expenseForm.isDirty && autoSaveEnabled) {
        autoSave();
      }
    }, 30000); // Auto-save every 30 seconds

    return () => clearInterval(interval);
  }, [autoSave, expenseForm.isDirty, autoSaveEnabled]);

  // Mark form as dirty when any field changes
  const updateFormField = (field: keyof EnhancedExpenseFormData, value: any) => {
    setExpenseForm(prev => ({ 
      ...prev, 
      [field]: value, 
      isDirty: true 
    }));
  };

  // Load real data from Supabase
  useEffect(() => {
    const loadFormData = async () => {
      try {
        // Load expense categories from Supabase
        const categories = await SupabaseExpenseService.getExpenseCategories();
        
        // Convert to legacy format for backward compatibility
        const legacyCategories: LegacyExpenseCategory[] = categories.map(category => ({
          id: category.id,
          name: category.category_name,
          description: category.description,
          botMapping: category.msp202_line_item || '',
          approvalRequired: category.is_budgetable, // Only budgetable items need approval
          approvalLimit: category.is_budgetable ? 10000 : 0,
          budgetCategory: category.budget_type === 'interest' ? 'Interest' : 
                         category.budget_type === 'operating' ? 'Operating' : 'Tax',
          isActive: category.is_active
        }));

        setExpenseCategories(legacyCategories);
        
        // Load chart of accounts
        const mockAccounts: ChartOfAccount[] = [
          { id: '1', accountNumber: '1001', accountName: 'Cash', accountType: 'asset', isActive: true },
          { id: '2', accountNumber: '1002', accountName: 'Bank Account', accountType: 'asset', isActive: true },
          { id: '3', accountNumber: '2001', accountName: 'Accounts Payable', accountType: 'liability', isActive: true },
          { id: '4', accountNumber: '5001', accountName: 'Office Supplies', accountType: 'expense', isActive: true },
          { id: '5', accountNumber: '5002', accountName: 'Travel Expenses', accountType: 'expense', isActive: true },
          { id: '6', accountNumber: '5003', accountName: 'Utilities', accountType: 'expense', isActive: true },
          { id: '7', accountNumber: '5004', accountName: 'Professional Services', accountType: 'expense', isActive: true },
          { id: '8', accountNumber: '5005', accountName: 'Marketing Expenses', accountType: 'expense', isActive: true },
          { id: '9', accountNumber: '6001', accountName: 'VAT Payable', accountType: 'liability', isActive: true },
          { id: '10', accountNumber: '6002', accountName: 'VAT Recoverable', accountType: 'asset', isActive: true }
        ];
        setChartOfAccounts(mockAccounts);
        
        // Keep mock vendors for now - can be replaced with real vendor data later
        const mockVendors: Vendor[] = [
          { id: '1', name: 'ABC Office Supplies Ltd', type: 'supplier', contactPerson: 'John Doe', email: 'john@abc.com', phone: '+255123456789', address: 'Dar es Salaam', isApproved: true, taxId: '123456789' },
          { id: '2', name: 'XYZ Legal Services', type: 'service_provider', contactPerson: 'Jane Smith', email: 'jane@xyz.com', phone: '+255987654321', address: 'Arusha', isApproved: true, taxId: '987654321' },
          { id: '3', name: 'City Transport Co', type: 'service_provider', contactPerson: 'Mike Johnson', email: 'mike@citytransport.com', phone: '+255555555555', address: 'Mwanza', isApproved: true, taxId: '555555555' },
          { id: '4', name: 'Tech Solutions Inc', type: 'contractor', contactPerson: 'Sarah Wilson', email: 'sarah@techsolutions.com', phone: '+255777777777', address: 'Dodoma', isApproved: true, taxId: '777777777' }
        ];
        
        setApprovedVendors(mockVendors);
      } catch (error) {
        console.error('Error loading form data:', error);
      }
    };

    loadFormData();
  }, []);


  // Currency conversion
  const convertCurrency = (amount: number, fromCurrency: string, toCurrency: string): number => {
    if (fromCurrency === toCurrency) return amount;
    const fromRate = currencyRates[fromCurrency] || 1;
    const toRate = currencyRates[toCurrency] || 1;
    return (amount * fromRate) / toRate;
  };

  // Tax calculation
  const calculateTax = (amount: number, taxRate: number, taxType: string): number => {
    switch (taxType) {
      case 'vat':
        return amount * (taxRate / 100);
      case 'withholding':
        return amount * (taxRate / 100);
      default:
        return 0;
    }
  };

  // Generate ledger entries
  const generateLedgerEntries = (): LedgerEntry[] => {
    const entries: LedgerEntry[] = [];
    const baseAmount = expenseForm.originalAmount || expenseForm.amount;
    const taxAmount = expenseForm.taxAmount || 0;
    const totalAmount = baseAmount + taxAmount;

    // Debit entries
    entries.push({
      account: expenseForm.debitAccount,
      debit: baseAmount,
      credit: 0,
      description: `${expenseForm.category} - ${expenseForm.description}`,
      type: 'debit'
    });

    if (taxAmount > 0) {
      entries.push({
        account: 'Tax Expense Account',
        debit: taxAmount,
        credit: 0,
        description: `${expenseForm.taxType.toUpperCase()} Tax - ${expenseForm.description}`,
        type: 'debit'
      });
    }

    // Credit entries
    if (expenseForm.isCreditPurchase) {
      entries.push({
        account: 'Accounts Payable',
        debit: 0,
        credit: totalAmount,
        description: `Payable to ${expenseForm.vendorName}`,
        type: 'credit'
      });
    } else {
      entries.push({
        account: expenseForm.creditAccount,
        debit: 0,
        credit: totalAmount,
        description: `Payment to ${expenseForm.vendorName}`,
        type: 'credit'
      });
    }

    return entries;
  };

  // Update ledger entries when form changes
  useEffect(() => {
    setLedgerEntries(generateLedgerEntries());
  }, [expenseForm.amount, expenseForm.taxAmount, expenseForm.isCreditPurchase, expenseForm.vendorName]);

  // Stepper navigation
  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
      updateSteps(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      updateSteps(currentStep - 1);
    }
  };

  const updateSteps = (activeStep: number) => {
    setSteps(prev => prev.map((step, index) => ({
      ...step,
      current: index === activeStep,
      completed: index < activeStep
    })));
  };

  // Enhanced validation
  const validateStep = (stepIndex: number): boolean => {
    const errors: string[] = [];
    
    switch (stepIndex) {
      case 0: // Basic Info
        if (!expenseForm.category) errors.push('Category is required');
        if (!expenseForm.amount || expenseForm.amount <= 0) errors.push('Amount must be greater than 0');
        if (!expenseForm.description.trim()) errors.push('Description is required');
        break;
      case 1: // Vendor & Payment
        if (!expenseForm.vendorId) errors.push('Vendor is required');
        if (!expenseForm.paymentMethod) errors.push('Payment method is required');
        break;
      case 2: // Attachments
        if (supportingDocs.length === 0) errors.push('At least one supporting document is required');
        break;
      case 3: // Review
        // Final validation
        break;
    }
    
    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleAmountChange = (value: string) => {
    const numericValue = parseFloat(value) || 0;
    updateFormField('amount', numericValue);
    
    // Calculate tax
    const taxAmount = calculateTax(numericValue, expenseForm.taxRate, expenseForm.taxType);
    updateFormField('taxAmount', taxAmount);
    
    // Convert currency if needed
    if (expenseForm.originalCurrency !== expenseForm.currency) {
      const convertedAmount = convertCurrency(numericValue, expenseForm.originalCurrency, expenseForm.currency);
      updateFormField('originalAmount', convertedAmount);
    } else {
      updateFormField('originalAmount', numericValue);
    }
    
    calculateBOTImpact();
    calculateBudgetImpact();
  };

  const handleCurrencyChange = (currency: string) => {
    updateFormField('currency', currency);
    updateFormField('exchangeRate', currencyRates[currency] || 1);
    
    // Convert amount to new currency
    const convertedAmount = convertCurrency(expenseForm.amount, expenseForm.currency, currency);
    updateFormField('amount', convertedAmount);
  };

  const handleTaxRateChange = (rate: number) => {
    updateFormField('taxRate', rate);
    const taxAmount = calculateTax(expenseForm.amount, rate, expenseForm.taxType);
    updateFormField('taxAmount', taxAmount);
  };

  const handleDateChange = (date: Date) => {
    updateFormField('expenseDate', date);
  };

  const handleVendorChange = (vendorId: string) => {
    const vendor = approvedVendors.find(v => v.id === vendorId);
    updateFormField('vendorId', vendorId);
    updateFormField('vendorName', vendor?.name || '');
    updateFormField('vendorContact', vendor?.contactPerson || '');
    updateFormField('vendorEmail', vendor?.email || '');
    updateFormField('vendorPhone', vendor?.phone || '');
  };

  const handleCategoryChange = (categoryId: string) => {
    const category = expenseCategories.find(c => c.id === categoryId);
    setSelectedCategory(categoryId);
    // Store the category ID instead of name for proper database insertion
    updateFormField('category', categoryId);
    updateFormField('subCategory', '');
    
    // Load sub-categories for this category
    if (category) {
      // Mock sub-categories - in real app, load from API
      const mockSubCategories = ['Office Supplies', 'Travel', 'Meals', 'Transportation'];
      setSubCategories(mockSubCategories);
    }
    
    calculateBOTImpact();
    calculateBudgetImpact();
  };

  const handleTagAdd = (tag: string) => {
    if (!expenseForm.tags.includes(tag)) {
      updateFormField('tags', [...expenseForm.tags, tag]);
    }
  };

  const handleTagRemove = (tag: string) => {
    updateFormField('tags', expenseForm.tags.filter(t => t !== tag));
  };

  const handleCustomTagAdd = (tag: string) => {
    if (!expenseForm.customTags.includes(tag)) {
      updateFormField('customTags', [...expenseForm.customTags, tag]);
      setAvailableTags(prev => [...prev, tag]);
    }
  };

  const calculateBOTImpact = () => {
    const category = expenseCategories.find(c => c.id === selectedCategory);
    if (!category || !expenseForm.amount) return;

    const msp202Impact = [{
      lineItem: category.botMapping,
      amount: expenseForm.amount,
      description: `${category.name} - ${category.description}`
    }];

    const otherReportsImpact = [
      {
        reportName: 'MSP2_10 Regional Analysis',
        lineItem: 'Regional Operating Expenses',
        amount: expenseForm.amount
      }
    ];

    setExpenseForm(prev => ({
      ...prev,
      botImpact: {
        msp202Impact,
        otherReportsImpact
      }
    }));
  };

  const calculateBudgetImpact = () => {
    const category = expenseCategories.find(c => c.id === selectedCategory);
    if (!category || !expenseForm.amount) return;

    // Mock budget data - replace with actual API call
    const allocatedAmount = 100000; // This would come from budget system
    const spentAmount = 25000; // This would come from existing expenses
    const remainingAmount = allocatedAmount - spentAmount;
    const variance = expenseForm.amount - remainingAmount;
    const variancePercentage = (variance / allocatedAmount) * 100;

    setExpenseForm(prev => ({
      ...prev,
      budgetImpact: {
        budgetCategory: category.budgetCategory,
        allocatedAmount,
        spentAmount,
        remainingAmount,
        variance,
        variancePercentage
      }
    }));
  };

  const determineRequiredApprovers = (): ApprovalWorkflow => {
    const category = expenseCategories.find(c => c.id === selectedCategory);
    if (!category) return { requiredApprovers: [], approvalLimits: [], estimatedApprovalTime: 0 };

    const approvalLimits = [
      { level: 1, maxAmount: 10000, approvers: ['Supervisor'] },
      { level: 2, maxAmount: 50000, approvers: ['Manager'] },
      { level: 3, maxAmount: 100000, approvers: ['Director'] },
      { level: 4, maxAmount: Infinity, approvers: ['CEO', 'Board'] }
    ];

    const requiredLevel = approvalLimits.find(limit => expenseForm.amount <= limit.maxAmount);
    const estimatedTime = requiredLevel ? requiredLevel.level * 24 : 96; // hours

    return {
      requiredApprovers: requiredLevel?.approvers || [],
      approvalLimits,
      estimatedApprovalTime: estimatedTime
    };
  };

  const getApprovalLimits = () => {
    return determineRequiredApprovers().approvalLimits;
  };

  const calculateApprovalTime = () => {
    return determineRequiredApprovers().estimatedApprovalTime;
  };

  const handleFileUpload = (files: FileList | null) => {
    if (!files) return;
    const newFiles = Array.from(files);
    setSupportingDocs(prev => [...prev, ...newFiles]);
    setExpenseForm(prev => ({ 
      ...prev, 
      supportingDocuments: [...prev.supportingDocuments, ...newFiles] 
    }));
  };

  const removeFile = (index: number) => {
    setSupportingDocs(prev => prev.filter((_, i) => i !== index));
    setExpenseForm(prev => ({ 
      ...prev, 
      supportingDocuments: prev.supportingDocuments.filter((_, i) => i !== index) 
    }));
  };

  const addNewVendor = () => {
    if (!newVendor.name || !newVendor.contactPerson || !newVendor.email) return;
    
    const vendor: Vendor = {
      id: (approvedVendors.length + 1).toString(),
      name: newVendor.name!,
      type: newVendor.type || 'supplier',
      contactPerson: newVendor.contactPerson!,
      email: newVendor.email!,
      phone: newVendor.phone || '',
      address: newVendor.address || '',
      isApproved: false,
      taxId: newVendor.taxId
    };

    setApprovedVendors(prev => [...prev, vendor]);
    setExpenseForm(prev => ({ 
      ...prev, 
      vendorId: vendor.id, 
      vendorName: vendor.name 
    }));
    setShowNewVendor(false);
    setNewVendor({});
  };

  // Expense Lines Management
  const addExpenseLine = () => {
    const newLine: ExpenseLine = {
      id: Date.now().toString(),
      description: '',
      amount: 0,
      accountNumber: '',
      accountId: '',
      accountName: '',
      debitCredit: 'debit',
      lineType: 'expense'
    };
    setExpenseLines(prev => [...prev, newLine]);
  };

  const updateExpenseLine = (id: string, field: keyof ExpenseLine, value: any) => {
    setExpenseLines(prev => prev.map(line => 
      line.id === id ? { ...line, [field]: value } : line
    ));
  };

  const removeExpenseLine = (id: string) => {
    setExpenseLines(prev => prev.filter(line => line.id !== id));
  };

  const handleAccountChange = (lineId: string, accountId: string) => {
    const account = chartOfAccounts.find(acc => acc.id === accountId);
    if (account) {
      updateExpenseLine(lineId, 'accountId', accountId);
      updateExpenseLine(lineId, 'accountNumber', account.accountNumber);
      updateExpenseLine(lineId, 'accountName', account.accountName);
    }
  };

  const validateForm = (): boolean => {
    const errors: string[] = [];
    
    if (!expenseForm.category) errors.push('Category is required');
    if (!expenseForm.amount || expenseForm.amount <= 0) errors.push('Amount must be greater than 0');
    if (!expenseForm.vendorId) errors.push('Vendor is required');
    if (!expenseForm.description.trim()) errors.push('Description is required');
    if (supportingDocs.length === 0) errors.push('At least one supporting document is required');
    
    setValidationErrors(errors);
    return errors.length === 0;
  };

  const saveDraft = async () => {
    if (!validateForm()) return;
    
    try {
      setIsSavingDraft(true);
      setExpenseForm(prev => ({ 
        ...prev, 
        approvalStatus: 'draft',
        expenseLines: expenseLines,
        isDirty: false,
        lastSaved: new Date()
      }));
      
      // Prepare expense data with all fields
      const expenseData = {
        ...expenseForm,
        approvalStatus: 'draft',
        expenseLines: expenseLines,
        submittedBy: 'Current User', // This should come from auth context
        submittedDate: new Date(),
        isDirty: false,
        lastSaved: new Date()
      };
      
      // Save to Supabase
      const result = await SupabaseExpenseService.createExpense(expenseData);
      
      if (result.success) {
        // Emit real-time event for expense creation
        emitEvent('expense_created', {
          ...expenseData,
          id: result.id,
          timestamp: new Date()
        }, 'current_user');
        
        console.log('Draft saved successfully:', result.id);
        
        // Show success message
        alert('Draft saved successfully!');
      } else {
        console.error('Error saving draft:', result.error);
        alert('Error saving draft: ' + result.error);
      }
    } catch (error) {
      console.error('Error saving draft:', error);
      alert('Error saving draft: ' + error);
    } finally {
      setIsSavingDraft(false);
    }
  };

  const submitForApproval = async () => {
    if (!validateForm()) return;
    
    try {
      setIsSubmitting(true);
      setSubmitProgress(0);
      
      // Update progress
      setSubmitProgress(25);
      
      setExpenseForm(prev => ({ 
        ...prev, 
        approvalStatus: 'pending',
        expenseLines: expenseLines,
        isDirty: false,
        lastSaved: new Date()
      }));
      
      // Update progress
      setSubmitProgress(50);
      
      // Prepare expense data with all fields
      const expenseData = {
        ...expenseForm,
        approvalStatus: 'pending',
        expenseLines: expenseLines,
        submittedBy: 'Current User', // This should come from auth context
        submittedDate: new Date(),
        isDirty: false,
        lastSaved: new Date()
      };
      
      // Update progress
      setSubmitProgress(75);
      
      // Save to Supabase
      const result = await SupabaseExpenseService.createExpense(expenseData);
      
      if (result.success) {
        // Update progress
        setSubmitProgress(100);
        
        // Emit real-time event for expense submission
        emitEvent('expense_updated', {
          ...expenseData,
          id: result.id,
          timestamp: new Date()
        }, 'current_user');
        
        console.log('Expense submitted for approval:', result.id);
        
        // Show success message and redirect or reset form
        alert('Expense submitted for approval successfully!');
        
        // Reset form or redirect
        // You might want to redirect to a success page or reset the form
        // window.location.href = '/expense-management';
        
      } else {
        console.error('Error submitting for approval:', result.error);
        alert('Error submitting for approval: ' + result.error);
      }
    } catch (error) {
      console.error('Error submitting for approval:', error);
      alert('Error submitting for approval: ' + error);
    } finally {
      setIsSubmitting(false);
      setSubmitProgress(0);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-600 to-red-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Enhanced Expense Entry Form</h1>
              <p className="text-orange-100">Comprehensive expense recording with step-by-step guidance</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-orange-100">Step {currentStep + 1} of {steps.length}</div>
              <div className="text-lg font-semibold">{steps[currentStep]?.title}</div>
            </div>
          </div>
        </div>

        {/* Auto-save indicator */}
        <AutoSaveIndicator />

        {/* Stepper Wizard */}
        <StepperWizard steps={steps} />

        {validationErrors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
              <h4 className="font-medium text-red-800">Validation Errors</h4>
            </div>
            <ul className="text-sm text-red-700 space-y-1">
              {validationErrors.map((error, index) => (
                <li key={index}>• {error}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Step Content */}
        {currentStep === 0 && (
          <BasicInfoStep
            expenseCategories={expenseCategories}
            selectedCategory={selectedCategory}
            handleCategoryChange={handleCategoryChange}
            expenseForm={expenseForm}
            handleAmountChange={handleAmountChange}
            handleDateChange={handleDateChange}
            updateFormField={updateFormField}
            chartOfAccounts={chartOfAccounts}
            expenseLines={expenseLines}
            addExpenseLine={addExpenseLine}
            updateExpenseLine={updateExpenseLine}
            removeExpenseLine={removeExpenseLine}
            handleAccountChange={handleAccountChange}
            showExpenseLinesModal={showExpenseLinesModal}
            setShowExpenseLinesModal={setShowExpenseLinesModal}
          />
        )}
        {currentStep === 1 && (
          <VendorPaymentStep
            approvedVendors={approvedVendors}
            expenseForm={expenseForm}
            handleVendorChange={handleVendorChange}
            updateFormField={updateFormField}
            onAddNewVendor={() => setShowNewVendor(true)}
          />
        )}
        {currentStep === 2 && (
          <AttachmentsStep
            supportingDocs={supportingDocs}
            handleFileUpload={handleFileUpload}
            removeFile={removeFile}
          />
        )}
        {currentStep === 3 && (
          <ReviewStep
            expenseForm={expenseForm}
            determineRequiredApprovers={determineRequiredApprovers}
            getApprovalLimits={getApprovalLimits}
            calculateApprovalTime={calculateApprovalTime}
          />
        )}

        {/* Navigation */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <button
              onClick={prevStep}
              disabled={currentStep === 0}
              className={`flex items-center px-4 py-2 rounded-md ${
                currentStep === 0 
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Previous
            </button>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={saveDraft}
                disabled={isSavingDraft}
                className="flex items-center px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSavingDraft ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Draft
                  </>
                )}
              </button>
              
              {currentStep < steps.length - 1 ? (
                <button
                  onClick={() => {
                    if (validateStep(currentStep)) {
                      nextStep();
                    }
                  }}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-2" />
                </button>
              ) : (
                <button
                  onClick={submitForApproval}
                  disabled={isSubmitting}
                  className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      Submit for Approval
                      <Send className="h-4 w-4 ml-2" />
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

// Helper Components - moved outside main function to fix hoisting issues
const ExpenseCategorySelector: React.FC<{ 
  categories: ExpenseCategory[]; 
  value: string; 
  onChange: (value: string) => void; 
  showBOTMapping: boolean 
}> = ({ categories, value, onChange, showBOTMapping }) => (
  <select 
    value={value} 
    onChange={(e) => onChange(e.target.value)}
    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
  >
    <option value="">Select Category</option>
    {categories.map(category => (
      <option key={category.id} value={category.id}>
        {category.name}
      </option>
    ))}
  </select>
);

const CurrencyInput: React.FC<{ 
    value: number; 
    onChange: (value: string) => void; 
    currency: string; 
    required?: boolean 
  }> = ({ value, onChange, currency, required = false }) => (
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <span className="text-gray-500 text-sm">{currency}</span>
      </div>
      <input
        type="number"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className="w-full pl-12 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="0"
        required={required}
        min="0"
        step="0.01"
      />
    </div>
  );

  const DatePicker: React.FC<{ 
    value: Date; 
    onChange: (date: Date) => void; 
    maxDate?: Date; 
    required?: boolean 
  }> = ({ value, onChange, maxDate, required = false }) => {
    // Ensure value is a valid Date object
    const dateValue = value instanceof Date ? value : new Date(value);
    
    // Check if the date is valid
    const isValidDate = !isNaN(dateValue.getTime());
    
    return (
      <input
        type="date"
        value={isValidDate ? dateValue.toISOString().split('T')[0] : ''}
        onChange={(e) => onChange(new Date(e.target.value))}
        max={maxDate?.toISOString().split('T')[0]}
        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        required={required}
      />
    );
  };

const VendorSelector: React.FC<{ 
  vendors: Vendor[]; 
  value: string; 
  onChange: (value: string) => void; 
  allowNewVendor?: boolean;
  onAddNewVendor?: () => void;
}> = ({ vendors, value, onChange, allowNewVendor = false, onAddNewVendor }) => (
    <div className="space-y-2">
      <select 
        value={value} 
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">Select Vendor</option>
        {vendors.map(vendor => (
          <option key={vendor.id} value={vendor.id}>
            {vendor.name} {vendor.isApproved ? '(Approved)' : '(Pending)'}
          </option>
        ))}
      </select>
      {allowNewVendor && (
        <button
          type="button"
          onClick={onAddNewVendor}
          className="text-blue-600 hover:text-blue-700 text-sm flex items-center"
        >
          <Plus className="h-4 w-4 mr-1" />
          Add New Vendor
        </button>
      )}
    </div>
  );

  const BOTReportImpactDisplay: React.FC<{ 
    msp202Impact: any[]; 
    otherReportsImpact: any[]; 
    showValidation: boolean 
  }> = ({ msp202Impact, otherReportsImpact, showValidation }) => (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <h5 className="font-medium text-blue-900 mb-3 flex items-center">
        <Info className="h-4 w-4 mr-2" />
        Report Impact
      </h5>
      <div className="space-y-3">
        <div>
          <h6 className="font-medium text-blue-800 text-sm">Income Statement</h6>
          {msp202Impact.map((impact, index) => (
            <div key={index} className="text-sm text-blue-700 ml-4">
              {impact.lineItem}: {formatCurrency(impact.amount)} - {impact.description}
            </div>
          ))}
        </div>
        <div>
          <h6 className="font-medium text-blue-800 text-sm">Other Reports</h6>
          {otherReportsImpact.map((impact, index) => (
            <div key={index} className="text-sm text-blue-700 ml-4">
              {impact.reportName} - {impact.lineItem}: {formatCurrency(impact.amount)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const DocumentUploadArea: React.FC<{ 
    acceptedTypes: string[]; 
    maxFiles: number; 
    onFilesUpload: (files: FileList | null) => void; 
    required?: boolean 
  }> = ({ acceptedTypes, maxFiles, onFilesUpload, required = false }) => (
    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
      <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
      <p className="text-gray-600 mb-2">
        Drop files here or click to upload
      </p>
      <p className="text-xs text-gray-500 mb-4">
        Accepted: {acceptedTypes.join(', ')} (Max {maxFiles} files)
      </p>
      <input
        type="file"
        multiple
        accept={acceptedTypes.join(',')}
        onChange={(e) => onFilesUpload(e.target.files)}
        className="hidden"
        id="file-upload"
        required={required}
      />
      <label
        htmlFor="file-upload"
        className="cursor-pointer bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
      >
        Choose Files
      </label>
    </div>
  );

  const ApprovalWorkflowDisplay: React.FC<{ 
    requiredApprovers: string[]; 
    approvalLimits: any[]; 
    estimatedApprovalTime: number 
  }> = ({ requiredApprovers, approvalLimits, estimatedApprovalTime }) => (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
      <h5 className="font-medium text-yellow-900 mb-3">Approval Workflow</h5>
      <div className="space-y-2 text-sm">
        <div>
          <span className="font-medium text-yellow-800">Required Approvers:</span>
          <span className="ml-2 text-yellow-700">{requiredApprovers.join(', ')}</span>
        </div>
        <div>
          <span className="font-medium text-yellow-800">Estimated Time:</span>
          <span className="ml-2 text-yellow-700">{estimatedApprovalTime} hours</span>
        </div>
        <div>
          <span className="font-medium text-yellow-800">Approval Limits:</span>
          <div className="ml-2 text-yellow-700">
            {approvalLimits.map((limit, index) => (
              <div key={index}>
                Level {limit.level}: Up to {formatCurrency(limit.maxAmount)} - {limit.approvers.join(', ')}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );


export default ExpenseEntryForm;