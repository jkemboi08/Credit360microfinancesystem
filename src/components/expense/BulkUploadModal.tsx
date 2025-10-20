import React, { useState, useRef, useCallback, useEffect } from 'react';
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  X, 
  Download,
  Eye,
  Trash2,
  Edit3,
  Save,
  RefreshCw,
  MapPin,
  CreditCard,
  Calendar,
  DollarSign,
  Tag,
  Building,
  AlertTriangle,
  TrendingUp,
  BarChart3,
  Settings,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';
import { SupabaseExpenseService } from '../../services/supabaseExpenseService';

interface BulkUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (count: number) => void;
}

interface UploadedFile {
  file: File;
  id: string;
  status: 'pending' | 'processing' | 'success' | 'error';
  error?: string;
  processedCount?: number;
  validationResult?: ValidationResult;
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  data: EnhancedExpenseData[];
  duplicates: DuplicateInfo[];
  mappingSuggestions: MappingSuggestions;
  botImpact: BOTImpactPreview;
  budgetImpact: BudgetImpactPreview;
}

interface EnhancedExpenseData {
  id: string;
  category: string;
  amount: number;
  currency: string;
  exchangeRate: number;
  originalAmount: number;
  originalCurrency: string;
  date: string;
  description: string;
  vendor: string;
  vendorId?: string;
  tags: string[];
  paymentMethod: 'cash' | 'bank' | 'credit_card' | 'mobile' | 'check';
  expenseType: 'bill' | 'payment';
  taxAmount: number;
  taxRate: number;
  taxType: 'vat' | 'withholding' | 'other';
  taxReclaimable: boolean;
  isRecurring: boolean;
  recurringPattern?: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  accountNumber: string;
  accountId: string;
  employeeId: string;
  submittedBy: string;
  priority: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  policyViolations: PolicyViolation[];
  complianceFlags: ComplianceFlag[];
  ledgerEntries: LedgerEntry[];
  isEdited: boolean;
  editHistory: EditHistory[];
}

interface DuplicateInfo {
  id: string;
  type: 'exact' | 'similar' | 'potential';
  confidence: number;
  existingExpenseId?: string;
  differences: string[];
}

interface MappingSuggestions {
  categories: CategoryMapping[];
  vendors: VendorMapping[];
  tags: TagMapping[];
  accounts: AccountMapping[];
}

interface CategoryMapping {
  input: string;
  suggested: string;
  confidence: number;
  alternatives: string[];
}

interface VendorMapping {
  input: string;
  suggested: string;
  confidence: number;
  vendorId?: string;
  alternatives: string[];
}

interface TagMapping {
  input: string;
  suggested: string[];
  confidence: number;
}

interface AccountMapping {
  input: string;
  suggested: string;
  confidence: number;
  accountId?: string;
}

interface BOTImpactPreview {
  totalAmount: number;
  lineItems: BOTLineItem[];
  warnings: string[];
}

interface BOTLineItem {
  lineItem: string;
  amount: number;
  description: string;
  category: string;
}

interface BudgetImpactPreview {
  totalAmount: number;
  categoryImpacts: CategoryBudgetImpact[];
  warnings: string[];
  overBudget: boolean;
}

interface CategoryBudgetImpact {
  category: string;
  allocated: number;
  spent: number;
  remaining: number;
  newAmount: number;
  newSpent: number;
  newRemaining: number;
  variance: number;
  variancePercentage: number;
  overBudget: boolean;
}

interface PolicyViolation {
  id: string;
  type: 'amount_limit' | 'approval_level' | 'documentation' | 'timing' | 'category' | 'vendor' | 'amount_exceeded' | 'approval_required';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  rule: string;
  suggestedAction: string;
  canOverride: boolean;
  overrideReason?: string;
}

interface ComplianceFlag {
  id: string;
  type: 'regulatory' | 'internal' | 'audit' | 'tax' | 'budget' | 'budget_variance' | 'approval_required';
  severity: 'info' | 'warning' | 'error' | 'critical' | 'medium' | 'high';
  description: string;
  actionRequired: string;
  dueDate: Date;
}

interface LedgerEntry {
  accountNumber: string;
  accountName: string;
  debitCredit: 'debit' | 'credit';
  amount: number;
  description: string;
  lineType: 'expense' | 'tax' | 'discount' | 'other';
}

interface EditHistory {
  timestamp: Date;
  field: string;
  oldValue: any;
  newValue: any;
  editedBy: string;
}

interface ColumnMapping {
  [key: string]: string;
}

interface ImportSummary {
  totalRecords: number;
  validRecords: number;
  errorRecords: number;
  duplicateRecords: number;
  recurringRecords: number;
  totalAmount: number;
  averageAmount: number;
  categories: { [key: string]: number };
  currencies: { [key: string]: number };
  paymentMethods: { [key: string]: number };
}

const BulkUploadModal: React.FC<BulkUploadModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [validationResults, setValidationResults] = useState<ValidationResult | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showColumnMapping, setShowColumnMapping] = useState(false);
  const [showImportSummary, setShowImportSummary] = useState(false);
  const [currentStep, setCurrentStep] = useState<'upload' | 'mapping' | 'preview' | 'summary'>('upload');
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({});
  const [editingRow, setEditingRow] = useState<string | null>(null);
  const [importSummary, setImportSummary] = useState<ImportSummary | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Supported file types
  const supportedTypes = [
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv'
  ];

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    // Validate file types
    const validFiles = files.filter(file => {
      if (!supportedTypes.includes(file.type)) {
        alert(`Unsupported file type: ${file.name}. Please upload Excel or CSV files.`);
        return false;
      }
      return true;
    });

    // Add files to state
    const newFiles: UploadedFile[] = validFiles.map(file => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      status: 'pending'
    }));

    setUploadedFiles(prev => [...prev, ...newFiles]);

    // Auto-advance to validation step if files are selected
    if (validFiles.length > 0) {
      setCurrentStep(2);
    }
  };

  const handleStep2Next = async () => {
    if (uploadedFiles.length === 0) return;
    
    // Validate the first file to get preview data
    try {
      const validation = await validateFileData(uploadedFiles[0].file);
      setValidationResults(validation);
      setCurrentStep(3);
    } catch (error) {
      console.error('Error validating file:', error);
      alert('Error validating file. Please try again.');
    }
  };

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const validateFileData = async (file: File): Promise<ValidationResult> => {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Read file content
      const content = await readFileContent(file);
      
      // Parse based on file type
      let parsedData: any[] = [];
      if (file.type === 'text/csv') {
        parsedData = parseCSV(content);
      } else {
        parsedData = simulateExcelParsing(content);
      }

      // Enhanced validation with auto-mapping
      const enhancedData = await enhanceExpenseData(parsedData);
      const duplicates = await findAdvancedDuplicates(enhancedData);
      const mappingSuggestions = await generateMappingSuggestions(enhancedData);
      const botImpact = await calculateBOTImpact(enhancedData);
      const budgetImpact = await calculateBudgetImpact(enhancedData);

      // Validate required fields
      const requiredFields = ['category', 'amount', 'date', 'description', 'vendor'];
      const headers = Object.keys(parsedData[0] || {});
      
      requiredFields.forEach(field => {
        if (!headers.includes(field)) {
          errors.push(`Missing required field: ${field}`);
        }
      });

      // Enhanced validation
      enhancedData.forEach((row, index) => {
        if (!row.category || row.category.trim() === '') {
          errors.push(`Row ${index + 2}: Category is required`);
        }
        
        if (!row.amount || isNaN(row.amount) || row.amount <= 0) {
          errors.push(`Row ${index + 2}: Amount must be a valid positive number`);
        }
        
        if (!row.date || isNaN(Date.parse(row.date))) {
          errors.push(`Row ${index + 2}: Date must be a valid date`);
        }
        
        if (!row.description || row.description.trim() === '') {
          errors.push(`Row ${index + 2}: Description is required`);
        }

        // Currency validation
        if (!row.currency || !['TZS', 'USD', 'EUR', 'GBP'].includes(row.currency)) {
          warnings.push(`Row ${index + 2}: Unsupported currency ${row.currency}, defaulting to TZS`);
        }

        // Tax validation
        if (row.taxAmount > 0 && !row.taxType) {
          warnings.push(`Row ${index + 2}: Tax amount specified but no tax type provided`);
        }
      });

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        data: enhancedData,
        duplicates,
        mappingSuggestions,
        botImpact,
        budgetImpact
      };
    } catch (error) {
      return {
        isValid: false,
        errors: [`Failed to parse file: ${error}`],
        warnings: [],
        data: [],
        duplicates: [],
        mappingSuggestions: { categories: [], vendors: [], tags: [], accounts: [] },
        botImpact: { totalAmount: 0, lineItems: [], warnings: [] },
        budgetImpact: { totalAmount: 0, categoryImpacts: [], warnings: [], overBudget: false }
      };
    }
  };

  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  const parseCSV = (content: string): any[] => {
    const lines = content.split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    const data = lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim());
      const row: any = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      return row;
    });
    return data.filter(row => Object.values(row).some(v => v !== ''));
  };

  const simulateExcelParsing = (content: string): any[] => {
    // This would normally use a library like xlsx
    // For now, we'll return sample data
    return [
      {
        category: 'Office Supplies',
        amount: '150000',
        date: '2025-01-15',
        description: 'Office supplies purchase',
        vendor: 'ABC Office Supplies Ltd'
      },
      {
        category: 'Transport',
        amount: '50000',
        date: '2025-01-16',
        description: 'Fuel expenses',
        vendor: 'City Transport Co'
      }
    ];
  };

  const findDuplicates = (data: any[]): any[] => {
    const seen = new Set();
    const duplicates: any[] = [];
    
    data.forEach(row => {
      const key = `${row.category}-${row.amount}-${row.date}-${row.description}`;
      if (seen.has(key)) {
        duplicates.push(row);
      } else {
        seen.add(key);
      }
    });
    
    return duplicates;
  };

  // Enhanced helper functions
  const enhanceExpenseData = async (data: any[]): Promise<EnhancedExpenseData[]> => {
    return data.map((row, index) => ({
      id: `temp_${index}`,
      category: row.category || '',
      amount: parseFloat(row.amount) || 0,
      currency: row.currency || 'TZS',
      exchangeRate: row.exchangeRate || 1,
      originalAmount: parseFloat(row.originalAmount) || parseFloat(row.amount) || 0,
      originalCurrency: row.originalCurrency || row.currency || 'TZS',
      date: row.date || '',
      description: row.description || '',
      vendor: row.vendor || '',
      vendorId: row.vendorId,
      tags: row.tags ? (Array.isArray(row.tags) ? row.tags : row.tags.split(',').map((t: string) => t.trim())) : [],
      paymentMethod: row.paymentMethod || 'bank',
      expenseType: row.expenseType || 'bill',
      taxAmount: parseFloat(row.taxAmount) || 0,
      taxRate: parseFloat(row.taxRate) || 0,
      taxType: row.taxType || 'vat',
      taxReclaimable: row.taxReclaimable === 'true' || row.taxReclaimable === true,
      isRecurring: row.isRecurring === 'true' || row.isRecurring === true,
      recurringPattern: row.recurringPattern,
      accountNumber: row.accountNumber || '',
      accountId: row.accountId || '',
      employeeId: row.employeeId || '',
      submittedBy: row.submittedBy || 'current_user',
      priority: parseInt(row.priority) || 3,
      riskLevel: row.riskLevel || 'low',
      policyViolations: [],
      complianceFlags: [],
      ledgerEntries: generateLedgerEntries(row),
      isEdited: false,
      editHistory: []
    }));
  };

  const generateLedgerEntries = (row: any): LedgerEntry[] => {
    const entries: LedgerEntry[] = [];
    const amount = parseFloat(row.amount) || 0;
    const taxAmount = parseFloat(row.taxAmount) || 0;
    const taxReclaimable = row.taxReclaimable === 'true' || row.taxReclaimable === true;

    // Expense account (debit)
    entries.push({
      accountNumber: row.accountNumber || '5001',
      accountName: `${row.category} Account`,
      debitCredit: 'debit',
      amount: amount,
      description: row.description,
      lineType: 'expense'
    });

    // Tax recoverable account (debit) if applicable
    if (taxAmount > 0 && taxReclaimable) {
      entries.push({
        accountNumber: '1200',
        accountName: 'Tax Recoverable',
        debitCredit: 'debit',
        amount: taxAmount,
        description: `${row.taxType.toUpperCase()} Tax`,
        lineType: 'tax'
      });
    }

    // Payables account (credit)
    entries.push({
      accountNumber: '2000',
      accountName: 'Accounts Payable',
      debitCredit: 'credit',
      amount: amount + (taxReclaimable ? taxAmount : 0),
      description: `Payable to ${row.vendor}`,
      lineType: 'other'
    });

    return entries;
  };

  const findAdvancedDuplicates = async (data: EnhancedExpenseData[]): Promise<DuplicateInfo[]> => {
    const duplicates: DuplicateInfo[] = [];
    const seen = new Map<string, EnhancedExpenseData>();

    data.forEach(row => {
      const exactKey = `${row.category}-${row.amount}-${row.date}-${row.description}`;
      const similarKey = `${row.category}-${row.amount}-${row.date}`;
      
      if (seen.has(exactKey)) {
        duplicates.push({
          id: row.id,
          type: 'exact',
          confidence: 1.0,
          existingExpenseId: seen.get(exactKey)?.id,
          differences: []
        });
      } else if (seen.has(similarKey)) {
        const existing = seen.get(similarKey)!;
        const differences = [];
        if (existing.description !== row.description) differences.push('description');
        
        duplicates.push({
          id: row.id,
          type: 'similar',
          confidence: 0.8,
          existingExpenseId: existing.id,
          differences
        });
      } else {
        seen.set(exactKey, row);
        seen.set(similarKey, row);
      }
    });

    return duplicates;
  };

  const generateMappingSuggestions = async (data: EnhancedExpenseData[]): Promise<MappingSuggestions> => {
    const categories: CategoryMapping[] = [];
    const vendors: VendorMapping[] = [];
    const tags: TagMapping[] = [];
    const accounts: AccountMapping[] = [];

    // Mock mapping suggestions - in real implementation, this would use ML/AI
    const uniqueCategories = [...new Set(data.map(row => row.category))];
    uniqueCategories.forEach(cat => {
      categories.push({
        input: cat,
        suggested: cat,
        confidence: 0.9,
        alternatives: [cat, 'Other']
      });
    });

    const uniqueVendors = [...new Set(data.map(row => row.vendor))];
    uniqueVendors.forEach(vendor => {
      vendors.push({
        input: vendor,
        suggested: vendor,
        confidence: 0.8,
        vendorId: `vendor_${vendor.toLowerCase().replace(/\s+/g, '_')}`,
        alternatives: [vendor]
      });
    });

    return { categories, vendors, tags, accounts };
  };

  const calculateBOTImpact = async (data: EnhancedExpenseData[]): Promise<BOTImpactPreview> => {
    const totalAmount = data.reduce((sum, row) => sum + row.amount, 0);
    const lineItems: BOTLineItem[] = [];
    const warnings: string[] = [];

    // Group by category for BOT line items
    const categoryGroups = data.reduce((groups, row) => {
      if (!groups[row.category]) {
        groups[row.category] = 0;
      }
      groups[row.category] += row.amount;
      return groups;
    }, {} as { [key: string]: number });

    Object.entries(categoryGroups).forEach(([category, amount]) => {
      lineItems.push({
        lineItem: `D${Math.floor(Math.random() * 50) + 1}`,
        amount,
        description: category,
        category
      });
    });

    if (totalAmount > 1000000) {
      warnings.push('Total amount exceeds 1M TZS - may require additional approvals');
    }

    return { totalAmount, lineItems, warnings };
  };

  const calculateBudgetImpact = async (data: EnhancedExpenseData[]): Promise<BudgetImpactPreview> => {
    const totalAmount = data.reduce((sum, row) => sum + row.amount, 0);
    const categoryImpacts: CategoryBudgetImpact[] = [];
    const warnings: string[] = [];
    let overBudget = false;

    // Mock budget data - in real implementation, this would come from budget service
    const budgetData = {
      'Office Supplies': { allocated: 500000, spent: 200000 },
      'Transport': { allocated: 300000, spent: 150000 },
      'Marketing': { allocated: 1000000, spent: 400000 },
      'Training': { allocated: 200000, spent: 100000 }
    };

    const categoryGroups = data.reduce((groups, row) => {
      if (!groups[row.category]) {
        groups[row.category] = 0;
      }
      groups[row.category] += row.amount;
      return groups;
    }, {} as { [key: string]: number });

    Object.entries(categoryGroups).forEach(([category, newAmount]) => {
      const budget = budgetData[category] || { allocated: 0, spent: 0 };
      const newSpent = budget.spent + newAmount;
      const newRemaining = budget.allocated - newSpent;
      const variance = newRemaining;
      const variancePercentage = (variance / budget.allocated) * 100;
      const isOverBudget = newSpent > budget.allocated;

      if (isOverBudget) {
        overBudget = true;
        warnings.push(`Category ${category} will exceed budget by ${Math.abs(variance).toLocaleString()} TZS`);
      }

      categoryImpacts.push({
        category,
        allocated: budget.allocated,
        spent: budget.spent,
        remaining: budget.allocated - budget.spent,
        newAmount,
        newSpent,
        newRemaining,
        variance,
        variancePercentage,
        overBudget: isOverBudget
      });
    });

    return { totalAmount, categoryImpacts, warnings, overBudget };
  };

  const processFiles = async () => {
    setIsProcessing(true);
    let totalProcessed = 0;
    const errors: string[] = [];

    try {
      // Process all files
    for (const uploadedFile of uploadedFiles) {
      try {
        // Update file status to processing
        setUploadedFiles(prev => 
          prev.map(f => f.id === uploadedFile.id ? { ...f, status: 'processing' } : f)
        );

        // Validate file
        const validation = await validateFileData(uploadedFile.file);
        setValidationResults(validation);

        if (validation.isValid) {
          // Process valid data
          const processedCount = await processExpenseData(validation.data);
          totalProcessed += processedCount;

          // Update file status to success
          setUploadedFiles(prev => 
            prev.map(f => f.id === uploadedFile.id ? { 
              ...f, 
              status: 'success',
              processedCount 
            } : f)
          );
        } else {
          // Update file status to error
            const errorMessage = validation.errors.join(', ');
            errors.push(`${uploadedFile.file.name}: ${errorMessage}`);
          setUploadedFiles(prev => 
            prev.map(f => f.id === uploadedFile.id ? { 
              ...f, 
              status: 'error',
                error: errorMessage
            } : f)
          );
        }
      } catch (error) {
        // Update file status to error
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          errors.push(`${uploadedFile.file.name}: ${errorMessage}`);
        setUploadedFiles(prev => 
          prev.map(f => f.id === uploadedFile.id ? { 
            ...f, 
            status: 'error',
              error: errorMessage
          } : f)
        );
      }
    }

      // Create import summary
      const summary: ImportSummary = {
        successCount: totalProcessed,
        errorCount: errors.length,
        totalFiles: uploadedFiles.length,
        errors,
        timestamp: new Date().toISOString()
      };

      setImportSummary(summary);
      setCurrentStep(4); // Move to summary step
    } catch (error) {
      console.error('Error in processFiles:', error);
      errors.push('Unexpected error during processing');
    } finally {
    setIsProcessing(false);
    }
  };

  const processExpenseData = async (data: any[]): Promise<number> => {
    let processedCount = 0;

    for (const row of data) {
      try {
        // Create expense object
        const expense = {
          category: row.category, // This will be handled by the service
          amount: parseFloat(row.amount),
          expenseDate: new Date(row.date),
          description: row.description,
          vendorName: row.vendor,
          approvalStatus: 'pending',
          supportingDocuments: []
        };

        // Save to database
        await SupabaseExpenseService.createExpense(expense);
        processedCount++;
      } catch (error) {
        console.error('Error processing expense:', error);
      }
    }

    return processedCount;
  };

  const downloadTemplate = () => {
    // Create CSV template
    const template = [
      'category,amount,date,description,vendor',
      'Office Supplies,150000,2025-01-15,Office supplies purchase,ABC Office Supplies Ltd',
      'Transport,50000,2025-01-16,Fuel expenses,City Transport Co',
      'Marketing,200000,2025-01-17,Advertising campaign,Tech Solutions Inc'
    ].join('\n');

    // Download template
    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'expense_upload_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-900">Enhanced Bulk Upload Expenses</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-4">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  currentStep >= step 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {step}
                </div>
                {step < 4 && (
                  <div className={`w-16 h-0.5 ${
                    currentStep > step ? 'bg-blue-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step 1: File Upload */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Upload Files</h3>
              <p className="text-gray-600">Select Excel or CSV files to upload</p>
        </div>

        {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">Upload Instructions</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Upload Excel (.xlsx) or CSV files only</li>
            <li>• Include required fields: category, amount, date, description, vendor</li>
            <li>• Use the template below for proper formatting</li>
            <li>• Maximum file size: 10MB per file</li>
          </ul>
        </div>

        {/* Template Download */}
            <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-gray-900">Download Template</h4>
            <p className="text-sm text-gray-600">Use this template to ensure proper formatting</p>
          </div>
          <button
            onClick={downloadTemplate}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <Download className="h-4 w-4 mr-2" />
            Download Template
          </button>
        </div>

        {/* File Upload */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".xlsx,.xls,.csv"
            onChange={handleFileSelect}
            className="hidden"
          />
          <div className="text-center">
            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">Upload Files</h4>
            <p className="text-gray-600 mb-4">Select Excel or CSV files to upload</p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Select Files
            </button>
          </div>
        </div>

        {/* Uploaded Files */}
        {uploadedFiles.length > 0 && (
              <div>
            <h4 className="font-medium text-gray-900 mb-4">Uploaded Files</h4>
            <div className="space-y-3">
              {uploadedFiles.map(file => (
                <div key={file.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <FileText className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900">{file.file.name}</p>
                      <p className="text-sm text-gray-600">
                        {(file.file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {file.status === 'success' && (
                      <div className="flex items-center text-green-600">
                        <CheckCircle className="h-4 w-4 mr-1" />
                        <span className="text-sm">
                          {file.processedCount} expenses processed
                        </span>
                      </div>
                    )}
                    {file.status === 'error' && (
                      <div className="flex items-center text-red-600">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        <span className="text-sm">{file.error}</span>
                      </div>
                    )}
                    {file.status === 'processing' && (
                      <div className="flex items-center text-blue-600">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                        <span className="text-sm">Processing...</span>
                      </div>
                    )}
                    <button
                      onClick={() => removeFile(file.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Column Mapping */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Map Columns</h3>
            <p className="text-gray-600">Map your CSV columns to expense fields</p>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Category Column</label>
                <select 
                  className="w-full p-2 border rounded"
                  value={columnMapping.category}
                  onChange={(e) => setColumnMapping(prev => ({ ...prev, category: e.target.value }))}
                >
                  <option value="category">Category</option>
                  <option value="type">Type</option>
                  <option value="expense_type">Expense Type</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Amount Column</label>
                <select 
                  className="w-full p-2 border rounded"
                  value={columnMapping.amount}
                  onChange={(e) => setColumnMapping(prev => ({ ...prev, amount: e.target.value }))}
                >
                  <option value="amount">Amount</option>
                  <option value="total">Total</option>
                  <option value="value">Value</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Date Column</label>
                <select 
                  className="w-full p-2 border rounded"
                  value={columnMapping.date}
                  onChange={(e) => setColumnMapping(prev => ({ ...prev, date: e.target.value }))}
                >
                  <option value="date">Date</option>
                  <option value="transaction_date">Transaction Date</option>
                  <option value="expense_date">Expense Date</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Description Column</label>
                <select 
                  className="w-full p-2 border rounded"
                  value={columnMapping.description}
                  onChange={(e) => setColumnMapping(prev => ({ ...prev, description: e.target.value }))}
                >
                  <option value="description">Description</option>
                  <option value="notes">Notes</option>
                  <option value="details">Details</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Vendor Column</label>
                <select 
                  className="w-full p-2 border rounded"
                  value={columnMapping.vendor}
                  onChange={(e) => setColumnMapping(prev => ({ ...prev, vendor: e.target.value }))}
                >
                  <option value="vendor">Vendor</option>
                  <option value="supplier">Supplier</option>
                  <option value="merchant">Merchant</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Currency Column</label>
                <select 
                  className="w-full p-2 border rounded"
                  value={columnMapping.currency}
                  onChange={(e) => setColumnMapping(prev => ({ ...prev, currency: e.target.value }))}
                >
                  <option value="currency">Currency</option>
                  <option value="ccy">CCY</option>
                  <option value="curr">Curr</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Preview & Edit */}
        {currentStep === 3 && validationResults && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Preview & Edit Data</h3>
            <p className="text-gray-600">Review and edit the imported data before processing</p>

            {/* BOT Impact Preview */}
            {validationResults.botImpact && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">BOT Report Impact</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-blue-700">Total Amount: </span>
                    <span className="font-medium">{validationResults.botImpact.totalAmount.toLocaleString()} TZS</span>
                  </div>
                  <div>
                    <span className="text-blue-700">Line Items: </span>
                    <span className="font-medium">{validationResults.botImpact.lineItems.length}</span>
                  </div>
                </div>
                {validationResults.botImpact.warnings.length > 0 && (
                  <div className="mt-2">
                    <p className="text-yellow-700 font-medium">Warnings:</p>
                    <ul className="text-yellow-700 text-sm">
                      {validationResults.botImpact.warnings.map((warning, index) => (
                        <li key={index}>• {warning}</li>
                    ))}
                  </ul>
                </div>
              )}
              </div>
            )}

            {/* Budget Impact Preview */}
            {validationResults.budgetImpact && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-medium text-green-900 mb-2">Budget Impact</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-green-700">Total Amount: </span>
                    <span className="font-medium">{validationResults.budgetImpact.totalAmount.toLocaleString()} TZS</span>
                  </div>
                  <div>
                    <span className="text-green-700">Over Budget: </span>
                    <span className={`font-medium ${validationResults.budgetImpact.overBudget ? 'text-red-600' : 'text-green-600'}`}>
                      {validationResults.budgetImpact.overBudget ? 'Yes' : 'No'}
                    </span>
                  </div>
                </div>
                {validationResults.budgetImpact.warnings.length > 0 && (
                  <div className="mt-2">
                    <p className="text-yellow-700 font-medium">Warnings:</p>
                    <ul className="text-yellow-700 text-sm">
                      {validationResults.budgetImpact.warnings.map((warning, index) => (
                      <li key={index}>• {warning}</li>
                    ))}
                  </ul>
                </div>
              )}
              </div>
            )}

            {/* Duplicate Detection */}
            {validationResults.duplicates.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-medium text-yellow-900 mb-2">Duplicate Detection</h4>
                <p className="text-yellow-800 text-sm mb-2">
                  Found {validationResults.duplicates.length} potential duplicates
                </p>
                <div className="space-y-2">
                  {validationResults.duplicates.slice(0, 3).map((dup, index) => (
                    <div key={index} className="text-sm text-yellow-700">
                      • {dup.type} duplicate (confidence: {Math.round(dup.confidence * 100)}%)
                    </div>
                  ))}
                  {validationResults.duplicates.length > 3 && (
                    <div className="text-sm text-yellow-700">
                      ... and {validationResults.duplicates.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Data Preview Table */}
            <div className="border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Vendor</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {validationResults.data.slice(0, 10).map((row, index) => (
                      <tr key={index} className={row.isEdited ? 'bg-blue-50' : ''}>
                        <td className="px-4 py-2 text-sm text-gray-900">{row.category}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">{row.amount.toLocaleString()} {row.currency}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">{row.date}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">{row.description}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">{row.vendor}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">
                          <button
                            onClick={() => setEditingRow(editingRow === index ? null : index)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            {editingRow === index ? 'Cancel' : 'Edit'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {validationResults.data.length > 10 && (
                <div className="px-4 py-2 bg-gray-50 text-sm text-gray-600">
                  Showing 10 of {validationResults.data.length} rows
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 4: Import Summary */}
        {currentStep === 4 && importSummary && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Import Summary</h3>
            <p className="text-gray-600">Review the import results and next steps</p>

            <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-medium text-green-900 mb-2">Successfully Processed</h4>
                <div className="text-2xl font-bold text-green-600">{importSummary.successCount}</div>
                <div className="text-sm text-green-700">expenses imported</div>
                  </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="font-medium text-red-900 mb-2">Failed</h4>
                <div className="text-2xl font-bold text-red-600">{importSummary.errorCount}</div>
                <div className="text-sm text-red-700">expenses failed</div>
              </div>
            </div>

            {importSummary.errors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="font-medium text-red-900 mb-2">Errors</h4>
                <ul className="text-sm text-red-800 space-y-1">
                  {importSummary.errors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
                </div>
              )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Next Steps</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Review imported expenses in the expense management page</li>
                <li>• Process any pending approvals</li>
                <li>• Check for any policy violations that need attention</li>
              </ul>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          
          <div className="flex items-center space-x-3">
            {currentStep > 1 && (
          <button
                onClick={() => setCurrentStep(currentStep - 1)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
          >
                Previous
          </button>
            )}
            
            {currentStep < 4 ? (
              <button
                onClick={currentStep === 2 ? handleStep2Next : () => setCurrentStep(currentStep + 1)}
                disabled={uploadedFiles.length === 0}
                className={`px-4 py-2 rounded-md transition-colors ${
                  uploadedFiles.length === 0
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                Next
              </button>
            ) : (
          <button
            onClick={processFiles}
                disabled={isProcessing}
            className={`px-4 py-2 rounded-md transition-colors flex items-center ${
                  isProcessing
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {isProcessing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Processing...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                    Import Expenses
              </>
            )}
          </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkUploadModal;



























