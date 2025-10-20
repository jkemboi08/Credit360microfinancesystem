import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Clock, 
  Eye,
  Search,
  SortAsc,
  SortDesc,
  MessageSquare,
  Flag,
  CreditCard,
  Shield,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { 
  PendingExpense
} from '../types/expense';
import { SupabaseExpenseService } from '../services/supabaseExpenseService';

// Enhanced types for the new features
interface EnhancedPendingExpense extends PendingExpense {
  tags: string[];
  currency: string;
  exchangeRate: number;
  originalAmount: number;
  originalCurrency: string;
  expenseType: 'bill' | 'payment';
  paymentMethod: 'cash' | 'bank' | 'credit_card' | 'mobile' | 'check';
  taxAmount: number;
  taxRate: number;
  taxType: 'vat' | 'withholding' | 'other';
  taxReclaimable: boolean;
  isReimbursement: boolean;
  employeeId: string;
  advanceAmount: number;
  reimbursementType: 'advance' | 'expense' | 'both';
  accountNumber: string;
  accountId: string;
  expenseLines: ExpenseLine[];
  policyViolations: PolicyViolation[];
  auditTrail: AuditEntry[];
  priority: number;
  estimatedApprovalTime: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  complianceFlags: ComplianceFlag[];
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

interface AuditEntry {
  id: string;
  timestamp: Date;
  action: string;
  performedBy: string;
  details: string;
  ipAddress?: string;
  userAgent?: string;
}

interface FilterState {
  search: string;
  urgency: string;
  category: string;
  currency: string;
  amountRange: { min: number; max: number };
  dateRange: { start: Date | null; end: Date | null };
  tags: string[];
  riskLevel: string;
  policyViolations: boolean;
  paymentMethod: string;
  expenseType: string;
  isReimbursement: boolean | null;
  // New advanced filters
  taxReclaimable: boolean | null;
  complianceFlags: string[];
  priority: string;
  estimatedApprovalTime: { min: number; max: number };
  vendorName: string;
  accountNumber: string;
  // Faceted search
  facets: {
    categories: string[];
    currencies: string[];
    paymentMethods: string[];
    expenseTypes: string[];
    riskLevels: string[];
    tags: string[];
  };
}

const ExpenseApprovalWorkflow: React.FC = () => {
  // Enhanced state management
  const [pendingExpenses, setPendingExpenses] = useState<EnhancedPendingExpense[]>([]);
  const [selectedExpense, setSelectedExpense] = useState<EnhancedPendingExpense | null>(null);
  const [filteredExpenses, setFilteredExpenses] = useState<EnhancedPendingExpense[]>([]);
  const [selectedExpenses, setSelectedExpenses] = useState<Set<string>>(new Set());
  const [showExpenseDetails, setShowExpenseDetails] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Enhanced filter state
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    urgency: 'all',
    category: 'all',
    currency: 'all',
    amountRange: { min: 0, max: 1000000 },
    dateRange: { start: null, end: null },
    tags: [],
    riskLevel: 'all',
    policyViolations: false,
    paymentMethod: 'all',
    expenseType: 'all',
    isReimbursement: null,
    // New advanced filters
    taxReclaimable: null,
    complianceFlags: [],
    priority: 'all',
    estimatedApprovalTime: { min: 0, max: 168 }, // 0 to 7 days in hours
    vendorName: '',
    accountNumber: '',
    // Faceted search
    facets: {
      categories: [],
      currencies: [],
      paymentMethods: [],
      expenseTypes: [],
      riskLevels: [],
      tags: []
    }
  });
  
  // Sorting and pagination
  const [sortBy, setSortBy] = useState<'amount' | 'date' | 'urgency' | 'priority' | 'risk'>('priority');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  


  // Load real data from Supabase
  useEffect(() => {
    const loadPendingExpenses = async () => {
      setIsLoading(true);
      try {
        const expenses = await SupabaseExpenseService.getEnhancedPendingExpenses();
        
        // Transform Supabase data to EnhancedPendingExpense format
        const transformedExpenses: EnhancedPendingExpense[] = expenses.map(expense => ({
          id: expense.id,
          category: expense.category?.category_name || 'Unknown',
          amount: expense.amount,
          currency: expense.currency,
          date: expense.expense_date,
          description: expense.description || '',
          vendor: expense.vendor_name || '',
          vendorName: expense.vendor_name || '',
          vendorId: expense.vendor_id,
          submittedBy: expense.submitted_by,
          submittedAt: expense.submitted_at,
          submissionDate: expense.submitted_at,
          urgency: expense.urgency || 'medium',
          documents: expense.supporting_documents || [],
          status: expense.approval_status as 'pending' | 'under_review' | 'requires_info',
          tags: expense.tags || [],
          exchangeRate: expense.exchange_rate || 1,
          originalAmount: expense.original_amount || expense.amount,
          originalCurrency: expense.original_currency || expense.currency,
          expenseType: expense.expense_type || 'bill',
          paymentMethod: expense.payment_method || 'bank',
          taxAmount: expense.tax_amount || 0,
          taxRate: expense.tax_rate || 0,
          taxType: expense.tax_type || 'none',
          taxReclaimable: expense.tax_reclaimable || false,
          isReimbursement: expense.is_reimbursement || false,
          employeeId: expense.employee_id || '',
          advanceAmount: expense.advance_amount || 0,
          reimbursementType: expense.reimbursement_type || 'expense',
          accountNumber: expense.account_number || '',
          accountId: expense.account_id || '',
          expenseLines: expense.expense_lines || [],
          policyViolations: expense.policy_violations || [],
          auditTrail: expense.audit_trail || [],
          priority: expense.priority || 3,
          estimatedApprovalTime: expense.estimated_approval_time || 24,
          riskLevel: expense.risk_level || 'low',
          complianceFlags: expense.compliance_flags || [],
          botImpact: expense.bot_impact || {
            msp202Impact: [{
              lineItem: expense.category?.msp202_line_item || 'D99',
              amount: expense.amount,
              description: expense.description || ''
            }],
            otherReportsImpact: []
          },
          budgetImpact: expense.budget_impact || {
            category: expense.category?.category_name || 'Unknown',
            allocated: 1000000,
            spent: expense.amount,
            remaining: 1000000 - expense.amount,
            variance: expense.amount - 1000000,
            variancePercentage: ((expense.amount - 1000000) / 1000000) * 100,
            overBudget: expense.amount > 1000000
          }
        }));
        
        setPendingExpenses(transformedExpenses);
        console.log('Loaded pending expenses:', transformedExpenses.length);
      } catch (error) {
        console.error('Error loading pending expenses:', error);
        setPendingExpenses([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadPendingExpenses();
  }, []);

  // Set up real-time refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const expenses = await SupabaseExpenseService.getEnhancedPendingExpenses();
        // Transform and update expenses
        const transformedExpenses: EnhancedPendingExpense[] = expenses.map(expense => ({
      id: expense.id,
          category: expense.category?.category_name || 'Unknown',
          amount: expense.amount,
          currency: expense.currency,
          date: expense.expense_date,
          description: expense.description || '',
          vendor: expense.vendor_name || '',
          vendorName: expense.vendor_name || '',
          vendorId: expense.vendor_id,
          submittedBy: expense.submitted_by,
          submittedAt: expense.submitted_at,
          submissionDate: expense.submitted_at,
      urgency: expense.urgency || 'medium',
          documents: expense.supporting_documents || [],
          status: expense.approval_status as 'pending' | 'under_review' | 'requires_info',
          tags: expense.tags || [],
          exchangeRate: expense.exchange_rate || 1,
          originalAmount: expense.original_amount || expense.amount,
          originalCurrency: expense.original_currency || expense.currency,
          expenseType: expense.expense_type || 'bill',
          paymentMethod: expense.payment_method || 'bank',
          taxAmount: expense.tax_amount || 0,
          taxRate: expense.tax_rate || 0,
          taxType: expense.tax_type || 'none',
          taxReclaimable: expense.tax_reclaimable || false,
          isReimbursement: expense.is_reimbursement || false,
          employeeId: expense.employee_id || '',
          advanceAmount: expense.advance_amount || 0,
          reimbursementType: expense.reimbursement_type || 'expense',
          accountNumber: expense.account_number || '',
          accountId: expense.account_id || '',
          expenseLines: expense.expense_lines || [],
          policyViolations: expense.policy_violations || [],
          auditTrail: expense.audit_trail || [],
          priority: expense.priority || 3,
          estimatedApprovalTime: expense.estimated_approval_time || 24,
          riskLevel: expense.risk_level || 'low',
          complianceFlags: expense.compliance_flags || [],
          botImpact: expense.bot_impact || {
        msp202Impact: [{ 
              lineItem: expense.category?.msp202_line_item || 'D99',
              amount: expense.amount,
              description: expense.description || ''
        }],
        otherReportsImpact: []
      },
          budgetImpact: expense.budget_impact || {
            category: expense.category?.category_name || 'Unknown',
            allocated: 1000000,
            spent: expense.amount,
            remaining: 1000000 - expense.amount,
            variance: expense.amount - 1000000,
            variancePercentage: ((expense.amount - 1000000) / 1000000) * 100,
            overBudget: expense.amount > 1000000
          }
        }));
        
        setPendingExpenses(transformedExpenses);
      } catch (error) {
        console.error('Error refreshing pending expenses:', error);
      }
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, []);

  // Load mock data for demonstration (fallback)
  useEffect(() => {
    const mockPendingExpenses: EnhancedPendingExpense[] = [
      {
        id: 'EXP-001',
        submittedBy: 'John Doe',
        category: 'Office Supplies',
        amount: 15000,
        submissionDate: new Date('2024-01-15'),
        urgency: 'medium',
        documents: [],
        botImpact: {
          msp202Impact: [{ lineItem: 'D28', amount: 15000, description: 'Office Supplies' }],
          otherReportsImpact: []
        },
        budgetImpact: {
          budgetCategory: 'Operations',
          allocatedAmount: 100000,
          spentAmount: 75000,
          remainingAmount: 25000,
          variance: -10000,
          variancePercentage: -10
        },
        description: 'Purchase of office stationery and supplies for Q1 operations',
        vendorName: 'ABC Office Supplies Ltd',
        // Enhanced fields
        tags: ['office', 'supplies'],
        currency: 'TZS',
        exchangeRate: 1,
        originalAmount: 15000,
        originalCurrency: 'TZS',
        expenseType: 'bill',
        paymentMethod: 'bank',
        taxAmount: 2700,
        taxRate: 18,
        taxType: 'vat',
        taxReclaimable: true,
        isReimbursement: false,
        employeeId: 'EMP001',
        advanceAmount: 0,
        reimbursementType: 'expense',
        accountNumber: '5001',
        accountId: '1',
        expenseLines: [],
        policyViolations: [],
        auditTrail: [],
        priority: 1,
        estimatedApprovalTime: 24,
        riskLevel: 'low',
        complianceFlags: []
      },
      {
        id: 'EXP-002',
        submittedBy: 'Jane Smith',
        category: 'Training & Development',
        amount: 45000,
        submissionDate: new Date('2024-01-16'),
        urgency: 'high',
        documents: [],
        botImpact: {
          msp202Impact: [{ lineItem: 'D15', amount: 45000, description: 'Training & Development' }],
          otherReportsImpact: []
        },
        budgetImpact: {
          budgetCategory: 'Human Resources',
          allocatedAmount: 200000,
          spentAmount: 120000,
          remainingAmount: 80000,
          variance: -20000,
          variancePercentage: -10
        },
        description: 'Professional development course for staff',
        vendorName: 'Training Institute Ltd',
        // Enhanced fields
        tags: ['training', 'development', 'urgent'],
        currency: 'USD',
        exchangeRate: 2500,
        originalAmount: 18,
        originalCurrency: 'USD',
        expenseType: 'bill',
        paymentMethod: 'credit_card',
        taxAmount: 8100,
        taxRate: 18,
        taxType: 'vat',
        taxReclaimable: true,
        isReimbursement: false,
        employeeId: 'EMP002',
        advanceAmount: 0,
        reimbursementType: 'expense',
        accountNumber: '5002',
        accountId: '2',
        expenseLines: [],
        policyViolations: [
          {
            id: 'PV001',
            type: 'amount_exceeded',
            severity: 'medium',
            description: 'Amount exceeds standard training budget',
            rule: 'Training expenses should not exceed 40,000 TZS',
            suggestedAction: 'Request additional budget approval',
            canOverride: true,
            overrideReason: ''
          }
        ],
        auditTrail: [],
        priority: 2,
        estimatedApprovalTime: 48,
        riskLevel: 'medium',
        complianceFlags: [
          {
            id: 'CF001',
            type: 'budget_variance',
            severity: 'medium',
            description: 'Exceeds allocated budget by 10%',
            actionRequired: 'Budget approval required',
            dueDate: new Date('2024-01-20')
          }
        ]
      },
      {
        id: 'EXP-003',
        submittedBy: 'Mike Johnson',
        category: 'Rent & Utilities',
        amount: 120000,
        submissionDate: new Date('2024-01-14'),
        urgency: 'critical',
        documents: [],
        botImpact: {
          msp202Impact: [{ lineItem: 'D30', amount: 120000, description: 'Rent & Utilities' }],
          otherReportsImpact: []
        },
        budgetImpact: {
          budgetCategory: 'Operations',
          allocatedAmount: 500000,
          spentAmount: 480000,
          remainingAmount: 20000,
          variance: 0,
          variancePercentage: 0
        },
        description: 'Monthly office rent payment',
        vendorName: 'Property Management Co',
        // Enhanced fields
        tags: ['rent', 'utilities', 'monthly'],
        currency: 'TZS',
        exchangeRate: 1,
        originalAmount: 120000,
        originalCurrency: 'TZS',
        expenseType: 'payment',
        paymentMethod: 'bank',
        taxAmount: 0,
        taxRate: 0,
        taxType: 'vat',
        taxReclaimable: false,
        isReimbursement: false,
        employeeId: 'EMP003',
        advanceAmount: 0,
        reimbursementType: 'expense',
        accountNumber: '5003',
        accountId: '3',
        expenseLines: [],
        policyViolations: [],
        auditTrail: [],
        priority: 3,
        estimatedApprovalTime: 12,
        riskLevel: 'low',
        complianceFlags: []
      },
      {
        id: 'EXP-004',
        submittedBy: 'Sarah Wilson',
        category: 'Marketing & Advertising',
        amount: 25000,
        submissionDate: new Date('2024-01-17'),
        urgency: 'low',
        documents: [],
        botImpact: {
          msp202Impact: [{ lineItem: 'D25', amount: 25000, description: 'Marketing & Advertising' }],
          otherReportsImpact: []
        },
        budgetImpact: {
          budgetCategory: 'Marketing',
          allocatedAmount: 150000,
          spentAmount: 75000,
          remainingAmount: 75000,
          variance: 25000,
          variancePercentage: 20
        },
        description: 'Social media advertising campaign',
        vendorName: 'Digital Marketing Agency',
        // Enhanced fields
        tags: ['marketing', 'advertising', 'social_media'],
        currency: 'TZS',
        exchangeRate: 1,
        originalAmount: 25000,
        originalCurrency: 'TZS',
        expenseType: 'bill',
        paymentMethod: 'mobile',
        taxAmount: 4500,
        taxRate: 18,
        taxType: 'vat',
        taxReclaimable: true,
        isReimbursement: false,
        employeeId: 'EMP004',
        advanceAmount: 0,
        reimbursementType: 'expense',
        accountNumber: '5004',
        accountId: '4',
        expenseLines: [],
        policyViolations: [],
        auditTrail: [],
        priority: 4,
        estimatedApprovalTime: 72,
        riskLevel: 'low',
        complianceFlags: []
      },
      {
        id: 'EXP-005',
        submittedBy: 'David Brown',
        category: 'Audit & Legal',
        amount: 80000,
        submissionDate: new Date('2024-01-18'),
        urgency: 'high',
        documents: [],
        botImpact: {
          msp202Impact: [{ lineItem: 'D35', amount: 80000, description: 'Audit & Legal' }],
          otherReportsImpact: []
        },
        budgetImpact: {
          budgetCategory: 'Legal & Compliance',
          allocatedAmount: 300000,
          spentAmount: 200000,
          remainingAmount: 100000,
          variance: -20000,
          variancePercentage: -6.7
        },
        description: 'Legal consultation fees for contract review',
        vendorName: 'Legal Associates LLP',
        // Enhanced fields
        tags: ['legal', 'consultation', 'contract'],
        currency: 'TZS',
        exchangeRate: 1,
        originalAmount: 80000,
        originalCurrency: 'TZS',
        expenseType: 'bill',
        paymentMethod: 'check',
        taxAmount: 14400,
        taxRate: 18,
        taxType: 'vat',
        taxReclaimable: true,
        isReimbursement: false,
        employeeId: 'EMP005',
        advanceAmount: 0,
        reimbursementType: 'expense',
        accountNumber: '5005',
        accountId: '5',
        expenseLines: [],
        policyViolations: [
          {
            id: 'PV002',
            type: 'approval_required',
            severity: 'high',
            description: 'Legal fees require board approval',
            rule: 'Legal expenses over 50,000 TZS need board approval',
            suggestedAction: 'Escalate to board for approval',
            canOverride: false,
            overrideReason: ''
          }
        ],
        auditTrail: [],
        priority: 2,
        estimatedApprovalTime: 96,
        riskLevel: 'high',
        complianceFlags: [
          {
            id: 'CF002',
            type: 'approval_required',
            severity: 'high',
            description: 'Board approval required for legal fees',
            actionRequired: 'Board meeting scheduled',
            dueDate: new Date('2024-01-25')
          }
        ]
      }
    ];

    setPendingExpenses(mockPendingExpenses);
    setFilteredExpenses(mockPendingExpenses);
  }, []);

  // Enhanced utility functions
  const formatCurrency = (amount: number, currency: string = 'TZS') => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return 'N/A';
    
    const dateObj = date instanceof Date ? date : new Date(date);
    
    // Check if the date is valid
    if (isNaN(dateObj.getTime())) {
      return 'Invalid Date';
    }
    
    return dateObj.toLocaleDateString('en-TZ', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical':
        return 'text-red-600 bg-red-100 border-red-200';
      case 'high':
        return 'text-orange-600 bg-orange-100 border-orange-200';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'low':
        return 'text-green-600 bg-green-100 border-green-200';
      default:
        return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const getUrgencyIcon = (urgency: string) => {
    switch (urgency) {
      case 'critical':
        return <Flag className="h-4 w-4" />;
      case 'high':
        return <AlertTriangle className="h-4 w-4" />;
      case 'medium':
        return <Clock className="h-4 w-4" />;
      case 'low':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  // Enhanced filtering and sorting
  const applyFilters = useCallback((expenses: EnhancedPendingExpense[], filterState: FilterState) => {
    let filtered = [...expenses];

    // Search filter (enhanced with more fields)
    if (filterState.search) {
      const searchLower = filterState.search.toLowerCase();
      filtered = filtered.filter(expense => 
        expense.id.toLowerCase().includes(searchLower) ||
        expense.submittedBy.toLowerCase().includes(searchLower) ||
        expense.category.toLowerCase().includes(searchLower) ||
        expense.vendorName.toLowerCase().includes(searchLower) ||
        expense.description.toLowerCase().includes(searchLower) ||
        expense.tags.some(tag => tag.toLowerCase().includes(searchLower)) ||
        expense.accountNumber.toLowerCase().includes(searchLower) ||
        expense.employeeId.toLowerCase().includes(searchLower)
      );
    }

    // Urgency filter
    if (filterState.urgency !== 'all') {
      filtered = filtered.filter(expense => expense.urgency === filterState.urgency);
    }

    // Category filter
    if (filterState.category !== 'all') {
      filtered = filtered.filter(expense => expense.category === filterState.category);
    }

    // Currency filter
    if (filterState.currency !== 'all') {
      filtered = filtered.filter(expense => expense.currency === filterState.currency);
    }

    // Amount range filter
      filtered = filtered.filter(expense => 
      expense.amount >= filterState.amountRange.min && 
      expense.amount <= filterState.amountRange.max
    );

    // Date range filter
    if (filterState.dateRange.start) {
      filtered = filtered.filter(expense => 
        expense.submissionDate >= filterState.dateRange.start!
      );
    }
    if (filterState.dateRange.end) {
      filtered = filtered.filter(expense => 
        expense.submissionDate <= filterState.dateRange.end!
      );
    }

    // Tags filter
    if (filterState.tags.length > 0) {
      filtered = filtered.filter(expense => 
        filterState.tags.some(tag => expense.tags.includes(tag))
      );
    }

    // Risk level filter
    if (filterState.riskLevel !== 'all') {
      filtered = filtered.filter(expense => expense.riskLevel === filterState.riskLevel);
    }

    // Policy violations filter
    if (filterState.policyViolations) {
      filtered = filtered.filter(expense => expense.policyViolations.length > 0);
    }

    // Payment method filter
    if (filterState.paymentMethod !== 'all') {
      filtered = filtered.filter(expense => expense.paymentMethod === filterState.paymentMethod);
    }

    // Expense type filter
    if (filterState.expenseType !== 'all') {
      filtered = filtered.filter(expense => expense.expenseType === filterState.expenseType);
    }

    // Reimbursement filter
    if (filterState.isReimbursement !== null) {
      filtered = filtered.filter(expense => expense.isReimbursement === filterState.isReimbursement);
    }

    // Tax reclaimable filter
    if (filterState.taxReclaimable !== null) {
      filtered = filtered.filter(expense => expense.taxReclaimable === filterState.taxReclaimable);
    }

    // Compliance flags filter
    if (filterState.complianceFlags.length > 0) {
      filtered = filtered.filter(expense => 
        filterState.complianceFlags.some(flag => 
          expense.complianceFlags.some(cf => cf.type === flag)
        )
      );
    }

    // Priority filter
    if (filterState.priority !== 'all') {
      const priorityValue = parseInt(filterState.priority);
      filtered = filtered.filter(expense => expense.priority === priorityValue);
    }

    // Estimated approval time filter
    filtered = filtered.filter(expense => 
      expense.estimatedApprovalTime >= filterState.estimatedApprovalTime.min && 
      expense.estimatedApprovalTime <= filterState.estimatedApprovalTime.max
    );

    // Vendor name filter
    if (filterState.vendorName) {
      filtered = filtered.filter(expense => 
        expense.vendorName.toLowerCase().includes(filterState.vendorName.toLowerCase())
      );
    }

    // Account number filter
    if (filterState.accountNumber) {
      filtered = filtered.filter(expense => 
        expense.accountNumber.includes(filterState.accountNumber)
      );
    }

    // Faceted filters
    if (filterState.facets.categories.length > 0) {
      filtered = filtered.filter(expense => 
        filterState.facets.categories.includes(expense.category)
      );
    }

    if (filterState.facets.currencies.length > 0) {
      filtered = filtered.filter(expense => 
        filterState.facets.currencies.includes(expense.currency)
      );
    }

    if (filterState.facets.paymentMethods.length > 0) {
      filtered = filtered.filter(expense => 
        filterState.facets.paymentMethods.includes(expense.paymentMethod)
      );
    }

    if (filterState.facets.expenseTypes.length > 0) {
      filtered = filtered.filter(expense => 
        filterState.facets.expenseTypes.includes(expense.expenseType)
      );
    }

    if (filterState.facets.riskLevels.length > 0) {
      filtered = filtered.filter(expense => 
        filterState.facets.riskLevels.includes(expense.riskLevel)
      );
    }

    if (filterState.facets.tags.length > 0) {
      filtered = filtered.filter(expense => 
        filterState.facets.tags.some(tag => expense.tags.includes(tag))
      );
    }

    return filtered;
  }, []);

  const sortExpenses = useCallback((expenses: EnhancedPendingExpense[], sortField: string, order: 'asc' | 'desc') => {
    return [...expenses].sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortField) {
        case 'amount':
          aValue = a.amount;
          bValue = b.amount;
          break;
        case 'date':
          aValue = a.submissionDate.getTime();
          bValue = b.submissionDate.getTime();
          break;
        case 'urgency':
          const urgencyOrder = { critical: 4, high: 3, medium: 2, low: 1 };
          aValue = urgencyOrder[a.urgency as keyof typeof urgencyOrder];
          bValue = urgencyOrder[b.urgency as keyof typeof urgencyOrder];
          break;
        case 'priority':
          aValue = a.priority;
          bValue = b.priority;
          break;
        case 'risk':
          const riskOrder = { critical: 4, high: 3, medium: 2, low: 1 };
          aValue = riskOrder[a.riskLevel as keyof typeof riskOrder];
          bValue = riskOrder[b.riskLevel as keyof typeof riskOrder];
          break;
        default:
          return 0;
      }

      if (order === 'asc') {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      } else {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
      }
    });
  }, []);

  // Apply filters and sorting when data changes
  useEffect(() => {
    const filtered = applyFilters(pendingExpenses, filters);
    const sorted = sortExpenses(filtered, sortBy, sortOrder);
    setFilteredExpenses(sorted);
  }, [pendingExpenses, filters, sortBy, sortOrder, applyFilters, sortExpenses]);


  // Selection functions
  const toggleExpenseSelection = (expenseId: string) => {
    setSelectedExpenses(prev => {
      const newSet = new Set(prev);
      if (newSet.has(expenseId)) {
        newSet.delete(expenseId);
      } else {
        newSet.add(expenseId);
      }
      return newSet;
    });
  };

  const selectAllExpenses = () => {
    setSelectedExpenses(new Set(filteredExpenses.map(exp => exp.id)));
  };

  const clearSelection = () => {
    setSelectedExpenses(new Set());
  };

  // Enhanced approval functions
  const approveExpense = async (expense: EnhancedPendingExpense) => {
    try {
      setIsLoading(true);
      
      // Check for policy violations that require override
      const criticalViolations = expense.policyViolations.filter(v => v.severity === 'critical' && !v.overrideReason);
      if (criticalViolations.length > 0) {
        const overrideReason = prompt(`Critical policy violations detected:\n${criticalViolations.map(v => `- ${v.description}`).join('\n')}\n\nPlease provide override reason:`);
        if (!overrideReason) {
          alert('Approval cancelled. Override reason required for critical policy violations.');
          return;
        }
      }

      // Approve expense
      const result = await SupabaseExpenseService.approveExpense(expense.id, 'current_user');
      if (result.success) {
        console.log('Expense approved successfully:', expense.id);
        
        // Remove from lists
        setPendingExpenses(prev => prev.filter(e => e.id !== expense.id));
        setFilteredExpenses(prev => prev.filter(e => e.id !== expense.id));
        setSelectedExpenses(prev => {
          const newSet = new Set(prev);
          newSet.delete(expense.id);
          return newSet;
        });
        
        setSelectedExpense(null);
        setShowExpenseDetails(false);
        
        alert(`Expense ${expense.id} approved successfully!`);
      } else {
        console.error('Error approving expense:', result.error);
        alert('Error approving expense: ' + result.error);
      }
    } catch (error) {
      console.error('Error approving expense:', error);
      alert('Error approving expense: ' + error);
    } finally {
      setIsLoading(false);
    }
  };

  const rejectExpense = async (expense: EnhancedPendingExpense) => {
    try {
      const reason = prompt('Please provide a reason for rejection:');
      if (reason) {
        setIsLoading(true);
        
        // Log rejection with reason
        await SupabaseExpenseService.logExpenseAction(
          expense.id, 
          'rejected', 
          `Rejection reason: ${reason}`, 
          'error'
        );
        
        const result = await SupabaseExpenseService.rejectExpense(expense.id, 'current_user', reason);
        if (result.success) {
          console.log('Expense rejected successfully:', expense.id);
          
          // Remove from lists
          setPendingExpenses(prev => prev.filter(e => e.id !== expense.id));
          setFilteredExpenses(prev => prev.filter(e => e.id !== expense.id));
          setSelectedExpenses(prev => {
            const newSet = new Set(prev);
            newSet.delete(expense.id);
            return newSet;
          });
          
          setSelectedExpense(null);
          setShowExpenseDetails(false);
          
          alert(`Expense ${expense.id} rejected successfully!`);
        } else {
          console.error('Error rejecting expense:', result.error);
          alert('Error rejecting expense: ' + result.error);
        }
      }
    } catch (error) {
      console.error('Error rejecting expense:', error);
      alert('Error rejecting expense: ' + error);
    } finally {
      setIsLoading(false);
    }
  };

  const requestMoreInfo = async (expense: EnhancedPendingExpense) => {
    try {
      const info = prompt('What additional information is needed?');
      if (info) {
        // Log the request for more info
        await SupabaseExpenseService.logExpenseAction(
          expense.id, 
          'info_requested', 
          `More info requested: ${info}`, 
          'info'
        );
        console.log('More info requested for expense:', expense.id);
        alert('Information request logged successfully!');
      }
    } catch (error) {
      console.error('Error requesting more info:', error);
      alert('Error requesting more info: ' + error);
    }
  };

  // Bulk action functions
  const handleBulkApprove = async () => {
    if (selectedExpenses.size === 0) return;
    
    try {
      setIsLoading(true);
      const selectedExpensesList = filteredExpenses.filter(exp => selectedExpenses.has(exp.id));
      
      // Check for policy violations that require override
      const expensesWithViolations = selectedExpensesList.filter(exp => 
        exp.policyViolations.some(v => v.severity === 'critical' && !v.overrideReason)
      );
      
      if (expensesWithViolations.length > 0) {
        const overrideReason = prompt(`Critical policy violations detected in ${expensesWithViolations.length} expenses. Please provide override reason:`);
        if (!overrideReason) {
          alert('Bulk approval cancelled. Override reason required for critical policy violations.');
          return;
        }
      }
      
      // Process bulk approval
      for (const expense of selectedExpensesList) {
        await approveExpense(expense);
      }
      
      // Clear selection
      clearSelection();
      alert(`Successfully approved ${selectedExpensesList.length} expenses`);
    } catch (error) {
      console.error('Error in bulk approval:', error);
      alert('Error in bulk approval: ' + error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkReject = async () => {
    if (selectedExpenses.size === 0) return;
    
    const reason = prompt('Please provide reason for bulk rejection:');
    if (!reason) {
      alert('Bulk rejection cancelled. Reason required.');
      return;
    }
    
    try {
      setIsLoading(true);
      const selectedExpensesList = filteredExpenses.filter(exp => selectedExpenses.has(exp.id));
      
      // Process bulk rejection
      for (const expense of selectedExpensesList) {
        await rejectExpense(expense);
      }
      
      // Clear selection
      clearSelection();
      alert(`Successfully rejected ${selectedExpensesList.length} expenses`);
    } catch (error) {
      console.error('Error in bulk rejection:', error);
      alert('Error in bulk rejection: ' + error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkPayment = async () => {
    if (selectedExpenses.size === 0) return;
    
    try {
      setIsLoading(true);
      const selectedExpensesList = filteredExpenses.filter(exp => selectedExpenses.has(exp.id));
      
      // Process bulk payment
      for (const expense of selectedExpensesList) {
        await initiatePayment(expense.id);
      }
      
      // Clear selection
      clearSelection();
      alert(`Successfully initiated payment for ${selectedExpensesList.length} expenses`);
    } catch (error) {
      console.error('Error in bulk payment:', error);
      alert('Error in bulk payment: ' + error);
    } finally {
      setIsLoading(false);
    }
  };

  // Payment initiation function
  const initiatePayment = async (expenseId: string) => {
    try {
      // Here you would typically call an API to initiate payment
      console.log('Initiating payment for expense:', expenseId);
      // await SupabaseExpenseService.initiatePayment(expenseId);
      alert('Payment initiated for expense ' + expenseId);
    } catch (error) {
      console.error('Error initiating payment:', error);
      alert('Error initiating payment: ' + error);
    }
  };

  // Keyboard shortcuts
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Don't trigger shortcuts when typing in inputs
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement || event.target instanceof HTMLSelectElement) {
      return;
    }

    const { key, ctrlKey, shiftKey } = event;

    // Ctrl/Cmd + K: Toggle keyboard shortcuts help
    if ((ctrlKey || event.metaKey) && key === 'k') {
      event.preventDefault();
      setShowKeyboardShortcuts(!showKeyboardShortcuts);
      return;
    }

    // Ctrl/Cmd + F: Focus search
    if ((ctrlKey || event.metaKey) && key === 'f') {
      event.preventDefault();
      const searchInput = document.querySelector('input[placeholder*="Search by ID"]') as HTMLInputElement;
      if (searchInput) {
        searchInput.focus();
      }
      return;
    }

    // Ctrl/Cmd + A: Select all visible expenses
    if ((ctrlKey || event.metaKey) && key === 'a' && !showExpenseDetails) {
      event.preventDefault();
      selectAllExpenses();
      return;
    }

    // Escape: Close modals/panels
    if (key === 'Escape') {
      if (showExpenseDetails) {
        setShowExpenseDetails(false);
      } else if (showKeyboardShortcuts) {
        setShowKeyboardShortcuts(false);
      } else if (showAdvancedFilters) {
        setShowAdvancedFilters(false);
      }
      return;
    }

    // Arrow keys: Navigate through expenses
    if ((key === 'ArrowDown' || key === 'ArrowUp') && !showExpenseDetails) {
      event.preventDefault();
      const currentIndex = selectedExpense ? filteredExpenses.findIndex(exp => exp.id === selectedExpense.id) : -1;
      let newIndex;
      
      if (key === 'ArrowDown') {
        newIndex = currentIndex < filteredExpenses.length - 1 ? currentIndex + 1 : 0;
      } else {
        newIndex = currentIndex > 0 ? currentIndex - 1 : filteredExpenses.length - 1;
      }
      
      if (filteredExpenses[newIndex]) {
        setSelectedExpense(filteredExpenses[newIndex]);
      }
      return;
    }

    // Enter: Open selected expense details
    if (key === 'Enter' && selectedExpense && !showExpenseDetails) {
      event.preventDefault();
      setShowExpenseDetails(true);
      return;
    }

    // Space: Toggle selection of current expense
    if (key === ' ' && selectedExpense && !showExpenseDetails) {
      event.preventDefault();
      toggleExpenseSelection(selectedExpense.id);
      return;
    }

    // Quick action shortcuts (only when expense details are open)
    if (showExpenseDetails && selectedExpense) {
      // A: Approve
      if (key === 'a' || key === 'A') {
        event.preventDefault();
        approveExpense(selectedExpense);
        return;
      }

      // R: Reject
      if (key === 'r' || key === 'R') {
        event.preventDefault();
        rejectExpense(selectedExpense);
        return;
      }

      // I: Request more info
      if (key === 'i' || key === 'I') {
        event.preventDefault();
        requestMoreInfo(selectedExpense);
        return;
      }

      // C: Close details
      if (key === 'c' || key === 'C') {
        event.preventDefault();
        setShowExpenseDetails(false);
        return;
      }
    }

    // Bulk action shortcuts
    if (selectedExpenses.size > 0 && !showExpenseDetails) {
      // Ctrl/Cmd + Shift + A: Bulk approve
      if ((ctrlKey || event.metaKey) && shiftKey && key === 'A') {
        event.preventDefault();
        handleBulkApprove();
        return;
      }

      // Ctrl/Cmd + Shift + R: Bulk reject
      if ((ctrlKey || event.metaKey) && shiftKey && key === 'R') {
        event.preventDefault();
        handleBulkReject();
        return;
      }

      // Ctrl/Cmd + Shift + P: Bulk payment
      if ((ctrlKey || event.metaKey) && shiftKey && key === 'P') {
        event.preventDefault();
        handleBulkPayment();
        return;
      }
    }
  }, [showKeyboardShortcuts, showExpenseDetails, showAdvancedFilters, selectedExpense, filteredExpenses, selectedExpenses, approveExpense, rejectExpense, requestMoreInfo, selectAllExpenses, toggleExpenseSelection, handleBulkApprove, handleBulkReject, handleBulkPayment]);

  // Add keyboard event listener
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  return (
    <Layout>
      <div className="space-y-6">
        {/* Enhanced Header */}
        <div className="bg-gradient-to-r from-amber-600 to-orange-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Enhanced Expense Approval Workflow</h1>
              <p className="text-amber-100">Advanced review and approval with workflow automation</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-amber-100">
                {filteredExpenses.length} of {pendingExpenses.length} expenses
              </div>
              <div className="text-sm text-amber-100">
                {selectedExpenses.size} selected
              </div>
              <button
                onClick={() => setShowBulkActions(!showBulkActions)}
                className="bg-white bg-opacity-20 hover:bg-opacity-30 px-3 py-1 rounded-md text-sm transition-colors"
              >
                Bulk Actions
              </button>
                      <button
                onClick={() => setShowKeyboardShortcuts(!showKeyboardShortcuts)}
                className="bg-white bg-opacity-20 hover:bg-opacity-30 px-3 py-1 rounded-md text-sm transition-colors"
              >
                Keyboard Shortcuts
              </button>
            </div>
          </div>
        </div>

        {/* Keyboard Shortcuts Help Panel */}
        {showKeyboardShortcuts && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Keyboard Shortcuts</h3>
              <button
                onClick={() => setShowKeyboardShortcuts(false)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                <XCircle className="h-5 w-5" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Navigation</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Focus Search:</span>
                    <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Ctrl + F</kbd>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Navigate Up/Down:</span>
                    <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">↑ ↓</kbd>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Open Details:</span>
                    <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Enter</kbd>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Toggle Selection:</span>
                    <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Space</kbd>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Select All:</span>
                    <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Ctrl + A</kbd>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Close Panels:</span>
                    <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Escape</kbd>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Actions (in Details View)</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Approve:</span>
                    <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">A</kbd>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Reject:</span>
                    <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">R</kbd>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Request Info:</span>
                    <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">I</kbd>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Close Details:</span>
                    <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">C</kbd>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Bulk Actions</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Bulk Approve:</span>
                    <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Ctrl + Shift + A</kbd>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Bulk Reject:</span>
                    <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Ctrl + Shift + R</kbd>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Bulk Payment:</span>
                    <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Ctrl + Shift + P</kbd>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-3">General</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Show Shortcuts:</span>
                    <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Ctrl + K</kbd>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Toggle Filters:</span>
                    <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Ctrl + Shift + F</kbd>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {/* Advanced Search Bar */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">Advanced Search</label>
              <button
                onClick={async () => {
                  setIsLoading(true);
                  try {
                    const expenses = await SupabaseExpenseService.getEnhancedPendingExpenses();
                    // Transform and update expenses
                    const transformedExpenses: EnhancedPendingExpense[] = expenses.map(expense => ({
                      id: expense.id,
                      category: expense.category?.category_name || 'Unknown',
                      amount: expense.amount,
                      currency: expense.currency,
                      date: expense.expense_date,
                      description: expense.description || '',
                      vendor: expense.vendor_name || '',
                      vendorName: expense.vendor_name || '',
                      vendorId: expense.vendor_id,
                      submittedBy: expense.submitted_by,
                      submittedAt: expense.submitted_at,
                      submissionDate: expense.submitted_at,
                      urgency: expense.urgency || 'medium',
                      documents: expense.supporting_documents || [],
                      status: expense.approval_status as 'pending' | 'under_review' | 'requires_info',
                      tags: expense.tags || [],
                      exchangeRate: expense.exchange_rate || 1,
                      originalAmount: expense.original_amount || expense.amount,
                      originalCurrency: expense.original_currency || expense.currency,
                      expenseType: expense.expense_type || 'bill',
                      paymentMethod: expense.payment_method || 'bank',
                      taxAmount: expense.tax_amount || 0,
                      taxRate: expense.tax_rate || 0,
                      taxType: expense.tax_type || 'none',
                      taxReclaimable: expense.tax_reclaimable || false,
                      isReimbursement: expense.is_reimbursement || false,
                      employeeId: expense.employee_id || '',
                      advanceAmount: expense.advance_amount || 0,
                      reimbursementType: expense.reimbursement_type || 'expense',
                      accountNumber: expense.account_number || '',
                      accountId: expense.account_id || '',
                      expenseLines: expense.expense_lines || [],
                      policyViolations: expense.policy_violations || [],
                      auditTrail: expense.audit_trail || [],
                      priority: expense.priority || 3,
                      estimatedApprovalTime: expense.estimated_approval_time || 24,
                      riskLevel: expense.risk_level || 'low',
                      complianceFlags: expense.compliance_flags || [],
                      botImpact: expense.bot_impact || {
                        msp202Impact: [{
                          lineItem: expense.category?.msp202_line_item || 'D99',
                          amount: expense.amount,
                          description: expense.description || ''
                        }],
                        otherReportsImpact: []
                      },
                      budgetImpact: expense.budget_impact || {
                        category: expense.category?.category_name || 'Unknown',
                        allocated: 1000000,
                        spent: expense.amount,
                        remaining: 1000000 - expense.amount,
                        variance: expense.amount - 1000000,
                        variancePercentage: ((expense.amount - 1000000) / 1000000) * 100,
                        overBudget: expense.amount > 1000000
                      }
                    }));
                    
                    setPendingExpenses(transformedExpenses);
                    console.log('Refreshed pending expenses:', transformedExpenses.length);
                  } catch (error) {
                    console.error('Error refreshing pending expenses:', error);
                  } finally {
                    setIsLoading(false);
                  }
                }}
                disabled={isLoading}
                className="flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
            <div className="relative">
              <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                placeholder="Search by ID, submitter, category, vendor, description, tags, account number, or employee ID..."
                className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Quick Filters Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Urgency</label>
              <select
                value={filters.urgency}
                onChange={(e) => setFilters(prev => ({ ...prev, urgency: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Urgency</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={filters.category}
                onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Categories</option>
                <option value="Office Supplies">Office Supplies</option>
                <option value="Training & Development">Training & Development</option>
                <option value="Rent & Utilities">Rent & Utilities</option>
                <option value="Audit & Legal">Audit & Legal</option>
                <option value="Marketing & Advertising">Marketing & Advertising</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
              <select
                value={filters.currency}
                onChange={(e) => setFilters(prev => ({ ...prev, currency: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Currencies</option>
                <option value="TZS">TZS</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Risk Level</label>
              <select
                value={filters.riskLevel}
                onChange={(e) => setFilters(prev => ({ ...prev, riskLevel: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Risk Levels</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>

          {/* Advanced Filters Toggle */}
          <div className="mb-4">
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="flex items-center text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              <span className="mr-1">{showAdvancedFilters ? '▼' : '▶'}</span>
              Advanced Filters
            </button>
          </div>

          {/* Advanced Filters Panel */}
          {showAdvancedFilters && (
            <div className="border-t pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                {/* Amount Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount Range (TZS)</label>
                  <div className="flex space-x-2">
                    <input
                      type="number"
                      value={filters.amountRange.min}
                      onChange={(e) => setFilters(prev => ({ 
                        ...prev, 
                        amountRange: { ...prev.amountRange, min: parseInt(e.target.value) || 0 }
                      }))}
                      placeholder="Min"
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="number"
                      value={filters.amountRange.max}
                      onChange={(e) => setFilters(prev => ({ 
                        ...prev, 
                        amountRange: { ...prev.amountRange, max: parseInt(e.target.value) || 1000000 }
                      }))}
                      placeholder="Max"
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Date Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
                  <div className="flex space-x-2">
                    <input
                      type="date"
                      value={filters.dateRange.start ? filters.dateRange.start.toISOString().split('T')[0] : ''}
                      onChange={(e) => setFilters(prev => ({ 
                        ...prev, 
                        dateRange: { ...prev.dateRange, start: e.target.value ? new Date(e.target.value) : null }
                      }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="date"
                      value={filters.dateRange.end ? filters.dateRange.end.toISOString().split('T')[0] : ''}
                      onChange={(e) => setFilters(prev => ({ 
                        ...prev, 
                        dateRange: { ...prev.dateRange, end: e.target.value ? new Date(e.target.value) : null }
                      }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Payment Method */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                  <select
                    value={filters.paymentMethod}
                    onChange={(e) => setFilters(prev => ({ ...prev, paymentMethod: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Methods</option>
                    <option value="cash">Cash</option>
                    <option value="bank">Bank Transfer</option>
                    <option value="credit_card">Credit Card</option>
                    <option value="mobile">Mobile Payment</option>
                    <option value="check">Check</option>
                  </select>
                </div>

                {/* Expense Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Expense Type</label>
                  <select
                    value={filters.expenseType}
                    onChange={(e) => setFilters(prev => ({ ...prev, expenseType: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Types</option>
                    <option value="bill">Bill</option>
                    <option value="payment">Payment</option>
                  </select>
                </div>

                {/* Tax Reclaimable */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tax Reclaimable</label>
                  <select
                    value={filters.taxReclaimable === null ? 'all' : filters.taxReclaimable ? 'yes' : 'no'}
                    onChange={(e) => setFilters(prev => ({ 
                      ...prev, 
                      taxReclaimable: e.target.value === 'all' ? null : e.target.value === 'yes'
                    }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All</option>
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                </div>

                {/* Reimbursement Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reimbursement</label>
                  <select
                    value={filters.isReimbursement === null ? 'all' : filters.isReimbursement ? 'yes' : 'no'}
                    onChange={(e) => setFilters(prev => ({ 
                      ...prev, 
                      isReimbursement: e.target.value === 'all' ? null : e.target.value === 'yes'
                    }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All</option>
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                </div>
              </div>

              {/* Additional Filters Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                {/* Vendor Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vendor Name</label>
                  <input
                    type="text"
                    value={filters.vendorName}
                    onChange={(e) => setFilters(prev => ({ ...prev, vendorName: e.target.value }))}
                    placeholder="Filter by vendor..."
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Account Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
                  <input
                    type="text"
                    value={filters.accountNumber}
                    onChange={(e) => setFilters(prev => ({ ...prev, accountNumber: e.target.value }))}
                    placeholder="Filter by account..."
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Priority */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select
                    value={filters.priority}
                    onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Priorities</option>
                    <option value="1">1 - Highest</option>
                    <option value="2">2 - High</option>
                    <option value="3">3 - Medium</option>
                    <option value="4">4 - Low</option>
                    <option value="5">5 - Lowest</option>
                  </select>
                </div>
              </div>

              {/* Tags Filter */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
                <div className="flex flex-wrap gap-2">
                  {['office', 'supplies', 'training', 'development', 'urgent', 'rent', 'utilities', 'monthly', 'marketing', 'advertising', 'social_media', 'legal', 'consultation', 'contract'].map(tag => (
                    <button
                      key={tag}
                      onClick={() => {
                        setFilters(prev => ({
                          ...prev,
                          tags: prev.tags.includes(tag) 
                            ? prev.tags.filter(t => t !== tag)
                            : [...prev.tags, tag]
                        }));
                      }}
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        filters.tags.includes(tag)
                          ? 'bg-blue-100 text-blue-800 border border-blue-200'
                          : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Policy Violations Filter */}
              <div className="mb-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.policyViolations}
                    onChange={(e) => setFilters(prev => ({ ...prev, policyViolations: e.target.checked }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm font-medium text-gray-700">Show only expenses with policy violations</span>
                </label>
              </div>
            </div>
          )}

          {/* Sort Controls */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-gray-700">Sort by:</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="priority">Priority</option>
                    <option value="date">Date</option>
                    <option value="amount">Amount</option>
                    <option value="urgency">Urgency</option>
                    <option value="risk">Risk Level</option>
                  </select>
                  <button
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                  </button>
                </div>
                <div className="text-sm text-gray-500">
                  {filteredExpenses.length} of {pendingExpenses.length} expenses
                </div>
              </div>
              <button
                onClick={() => setFilters({
                  search: '',
                  urgency: 'all',
                  category: 'all',
                  currency: 'all',
                  amountRange: { min: 0, max: 1000000 },
                  dateRange: { start: null, end: null },
                  tags: [],
                  riskLevel: 'all',
                  policyViolations: false,
                  paymentMethod: 'all',
                  expenseType: 'all',
                  isReimbursement: null,
                  taxReclaimable: null,
                  complianceFlags: [],
                  priority: 'all',
                  estimatedApprovalTime: { min: 0, max: 168 },
                  vendorName: '',
                  accountNumber: '',
                  facets: {
                    categories: [],
                    currencies: [],
                    paymentMethods: [],
                    expenseTypes: [],
                    riskLevels: [],
                    tags: []
                  }
                })}
                className="text-sm text-gray-600 hover:text-gray-800"
              >
                Clear All Filters
              </button>
            </div>
          </div>
        </div>

        {/* Bulk Actions Panel */}
        {selectedExpenses.size > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">
                  {selectedExpenses.size} selected
                </span>
                <button
                  onClick={selectAllExpenses}
                  className="text-blue-600 hover:text-blue-700 text-sm"
                >
                  Select All
                </button>
                <button
                  onClick={clearSelection}
                  className="text-gray-600 hover:text-gray-700 text-sm"
                >
                  Clear Selection
                </button>
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={handleBulkApprove}
                  disabled={selectedExpenses.size === 0 || isLoading}
                  className="flex items-center px-3 py-2 rounded-md text-sm font-medium bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-1" />
                  )}
                  Approve Selected
                      </button>
                <button
                  onClick={handleBulkReject}
                  disabled={selectedExpenses.size === 0 || isLoading}
                  className="flex items-center px-3 py-2 rounded-md text-sm font-medium bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Reject Selected
                </button>
                <button
                  onClick={handleBulkPayment}
                  disabled={selectedExpenses.size === 0 || isLoading}
                  className="flex items-center px-3 py-2 rounded-md text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CreditCard className="h-4 w-4 mr-1" />
                  Pay Selected
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Analytics Dashboard */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Approval Analytics</h3>
            <div className="text-sm text-gray-500">
              Last updated: {new Date().toLocaleTimeString()}
                  </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Key Metrics */}
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Clock className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-blue-900">Avg. Approval Time</p>
                  <p className="text-2xl font-bold text-blue-600">2.4h</p>
                </div>
              </div>
            </div>
            
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-900">Approval Rate</p>
                  <p className="text-2xl font-bold text-green-600">87%</p>
                </div>
              </div>
            </div>
            
            <div className="bg-yellow-50 rounded-lg p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <AlertTriangle className="h-8 w-8 text-yellow-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-yellow-900">Policy Violations</p>
                  <p className="text-2xl font-bold text-yellow-600">3</p>
                </div>
              </div>
            </div>
            
            <div className="bg-red-50 rounded-lg p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <XCircle className="h-8 w-8 text-red-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-red-900">Overdue</p>
                  <p className="text-2xl font-bold text-red-600">2</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Approval Trends Chart Placeholder */}
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Approval Trends (Last 7 Days)</h4>
            <div className="h-32 bg-white rounded border flex items-center justify-center">
              <div className="text-center">
                <div className="text-2xl text-gray-400 mb-2">📊</div>
                <p className="text-sm text-gray-500">Chart visualization would go here</p>
                <p className="text-xs text-gray-400">Integration with charting library needed</p>
              </div>
            </div>
          </div>
          
          {/* Budget Impact Analysis */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Budget Impact Analysis</h4>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Operations</span>
                  <span className="text-gray-900">75% used</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: '75%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Human Resources</span>
                  <span className="text-gray-900">60% used</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-600 h-2 rounded-full" style={{ width: '60%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Marketing</span>
                  <span className="text-gray-900">50% used</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-yellow-600 h-2 rounded-full" style={{ width: '50%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Legal & Compliance</span>
                  <span className="text-gray-900">67% used</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-orange-600 h-2 rounded-full" style={{ width: '67%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Enhanced Pending Approvals Queue */}
          <div className="lg:col-span-2">
            <div className="pending-approvals-queue">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Pending Expense Approvals</h4>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <input
                            type="checkbox"
                            checked={selectedExpenses.size === filteredExpenses.length && filteredExpenses.length > 0}
                            onChange={(e) => {
                              if (e.target.checked) {
                                selectAllExpenses();
                              } else {
                                clearSelection();
                              }
                            }}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted By</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Urgency</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
                      {filteredExpenses.map((expense) => (
              <tr
                key={expense.id}
                          className={`hover:bg-gray-50 cursor-pointer ${
                            selectedExpenses.has(expense.id) ? 'bg-blue-50' : ''
                          } ${
                            expense.policyViolations.length > 0 ? 'border-l-4 border-yellow-400' : ''
                          }`}
                onClick={() => {
                            setSelectedExpense(expense);
                  setShowExpenseDetails(true);
                }}
              >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="checkbox"
                              checked={selectedExpenses.has(expense.id)}
                              onChange={(e) => {
                                e.stopPropagation();
                                toggleExpenseSelection(expense.id);
                              }}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                          </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            <div className="flex items-center">
                  {expense.id}
                              {expense.policyViolations.length > 0 && (
                                <AlertTriangle className="h-4 w-4 text-yellow-500 ml-2" />
                              )}
                              {expense.riskLevel === 'critical' && (
                                <Flag className="h-4 w-4 text-red-500 ml-2" />
                              )}
                            </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {expense.submittedBy}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div className="flex items-center">
                              <span>{expense.category}</span>
                              {expense.tags.length > 0 && (
                                <div className="ml-2 flex space-x-1">
                                  {expense.tags.slice(0, 2).map(tag => (
                                    <span key={tag} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                      {tag}
                                    </span>
                                  ))}
                                  {expense.tags.length > 2 && (
                                    <span className="text-xs text-gray-500">+{expense.tags.length - 2}</span>
                                  )}
                                </div>
                              )}
                            </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div className="flex flex-col">
                              <span className="font-medium">{formatCurrency(expense.amount, expense.currency)}</span>
                              {expense.originalCurrency !== expense.currency && (
                                <span className="text-xs text-gray-500">
                                  {formatCurrency(expense.originalAmount, expense.originalCurrency)}
                                </span>
                              )}
                            </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatDate(expense.submissionDate)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex flex-col space-y-1">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getUrgencyColor(expense.urgency)}`}>
                    {getUrgencyIcon(expense.urgency)}
                    <span className="ml-1">{expense.urgency.toUpperCase()}</span>
                  </span>
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                expense.riskLevel === 'critical' ? 'bg-red-100 text-red-800' :
                                expense.riskLevel === 'high' ? 'bg-orange-100 text-orange-800' :
                                expense.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-green-100 text-green-800'
                              }`}>
                                {expense.riskLevel.toUpperCase()}
                              </span>
                            </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center space-x-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                                  setSelectedExpense(expense);
                      setShowExpenseDetails(true);
                    }}
                    className="text-blue-600 hover:text-blue-900"
                                title="View Details"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                              {expense.policyViolations.length > 0 && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    alert('Policy violations detected');
                                  }}
                                  className="text-yellow-600 hover:text-yellow-900"
                                  title="Policy Violations"
                                >
                                  <Shield className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
            </div>
          </div>

          {/* Analytics Panel */}
          <div className="approval-analytics">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Approval Analytics</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">48h</div>
                  <div className="text-sm text-gray-600">Avg. Approval Time</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">85%</div>
                  <div className="text-sm text-gray-600">Approval Rate</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">{filteredExpenses.length}</div>
                  <div className="text-sm text-gray-600">Pending</div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">3</div>
                  <div className="text-sm text-gray-600">Overdue</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Expense Review Panel */}
        {showExpenseDetails && selectedExpense && (
          <div className="expense-review-panel">
            {/* Policy Violations Alert */}
            {selectedExpense.policyViolations.length > 0 && (
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertTriangle className="h-5 w-5 text-yellow-400" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">
                      Policy Violations Detected
                    </h3>
                    <div className="mt-2 text-sm text-yellow-700">
                      <ul className="list-disc list-inside space-y-1">
                        {selectedExpense.policyViolations.map(violation => (
                          <li key={violation.id}>
                            <strong>{violation.type.replace('_', ' ').toUpperCase()}:</strong> {violation.description}
                            {violation.canOverride && (
                              <span className="ml-2 text-xs bg-yellow-200 text-yellow-800 px-2 py-0.5 rounded">
                                Can Override
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Compliance Flags Alert */}
            {selectedExpense.complianceFlags.length > 0 && (
              <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <Shield className="h-5 w-5 text-red-400" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">
                      Compliance Flags
                    </h3>
                    <div className="mt-2 text-sm text-red-700">
                      <ul className="list-disc list-inside space-y-1">
                        {selectedExpense.complianceFlags.map(flag => (
                          <li key={flag.id}>
                            <strong>{flag.type.replace('_', ' ').toUpperCase()}:</strong> {flag.description}
                            <div className="text-xs mt-1">
                              Action Required: {flag.actionRequired}
                              {flag.dueDate && (
                                <span className="ml-2">Due: {formatDate(flag.dueDate)}</span>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Expense Review</h3>
        <div className="flex items-center space-x-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getUrgencyColor(selectedExpense.urgency)}`}>
                    {getUrgencyIcon(selectedExpense.urgency)}
                    <span className="ml-1">{selectedExpense.urgency.toUpperCase()}</span>
                  </span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                    selectedExpense.riskLevel === 'critical' ? 'bg-red-100 text-red-800' :
                    selectedExpense.riskLevel === 'high' ? 'bg-orange-100 text-orange-800' :
                    selectedExpense.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {selectedExpense.riskLevel.toUpperCase()} RISK
          </span>
        </div>
      </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column - Expense Details */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Expense Details</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Expense ID:</span>
                      <span className="font-medium">{selectedExpense.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Submitted By:</span>
                      <span className="font-medium">{selectedExpense.submittedBy}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Category:</span>
                      <span className="font-medium">{selectedExpense.category}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Type:</span>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        selectedExpense.expenseType === 'bill' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {selectedExpense.expenseType.toUpperCase()}
                      </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Amount:</span>
                      <div className="text-right">
                        <div className="font-medium text-lg">{formatCurrency(selectedExpense.amount, selectedExpense.currency)}</div>
                        {selectedExpense.originalCurrency !== selectedExpense.currency && (
                          <div className="text-xs text-gray-500">
                            {formatCurrency(selectedExpense.originalAmount, selectedExpense.originalCurrency)}
                          </div>
                        )}
                      </div>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Vendor:</span>
                      <span className="font-medium">{selectedExpense.vendorName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Payment Method:</span>
                      <span className="font-medium">{selectedExpense.paymentMethod}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Account Number:</span>
                      <span className="font-medium">{selectedExpense.accountNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Submission Date:</span>
                      <span className="font-medium">{formatDate(selectedExpense.submissionDate)}</span>
            </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Priority:</span>
                      <span className="font-medium">{selectedExpense.priority}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Est. Approval Time:</span>
                      <span className="font-medium">{selectedExpense.estimatedApprovalTime}h</span>
                    </div>
                    {selectedExpense.tags.length > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Tags:</span>
                        <div className="flex flex-wrap gap-1">
                          {selectedExpense.tags.map(tag => (
                            <span key={tag} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
          </div>
        </div>

                {/* Right Column - Description and Tax Information */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Description</h4>
          <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                    {selectedExpense.description}
                  </p>
                  
                  {/* Tax Information */}
                  {selectedExpense.taxAmount > 0 && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                      <h5 className="font-medium text-blue-900 mb-2">Tax Information</h5>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-blue-700">Tax Type:</span>
                          <span className="font-medium">{selectedExpense.taxType.toUpperCase()}</span>
        </div>
                        <div className="flex justify-between">
                          <span className="text-blue-700">Tax Rate:</span>
                          <span className="font-medium">{selectedExpense.taxRate}%</span>
      </div>
                        <div className="flex justify-between">
                          <span className="text-blue-700">Tax Amount:</span>
                          <span className="font-medium">{formatCurrency(selectedExpense.taxAmount, selectedExpense.currency)}</span>
                </div>
                        <div className="flex justify-between">
                          <span className="text-blue-700">Reclaimable:</span>
                          <span className={`font-medium ${selectedExpense.taxReclaimable ? 'text-green-600' : 'text-red-600'}`}>
                            {selectedExpense.taxReclaimable ? 'Yes' : 'No'}
                          </span>
            </div>
                  </div>
              </div>
            )}
        </div>
      </div>

              {/* Ledger Impact Section */}
              <div className="border-t pt-6">
                <h4 className="font-medium text-gray-900 mb-4">Ledger Impact</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
                      <h5 className="text-sm font-medium text-gray-700 mb-2">Debit Entries</h5>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Expense Account ({selectedExpense.accountNumber}):</span>
                          <span className="font-medium text-red-600">
                            {formatCurrency(selectedExpense.amount, selectedExpense.currency)}
                          </span>
            </div>
                        {selectedExpense.taxAmount > 0 && selectedExpense.taxReclaimable && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Tax Recoverable Account:</span>
                            <span className="font-medium text-red-600">
                              {formatCurrency(selectedExpense.taxAmount, selectedExpense.currency)}
                            </span>
            </div>
                        )}
                      </div>
            </div>
            <div>
                      <h5 className="text-sm font-medium text-gray-700 mb-2">Credit Entries</h5>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Payables Account:</span>
                          <span className="font-medium text-green-600">
                            {formatCurrency(selectedExpense.amount + (selectedExpense.taxReclaimable ? selectedExpense.taxAmount : 0), selectedExpense.currency)}
                          </span>
            </div>
                        {selectedExpense.taxAmount > 0 && !selectedExpense.taxReclaimable && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Tax Payable Account:</span>
                            <span className="font-medium text-green-600">
                              {formatCurrency(selectedExpense.taxAmount, selectedExpense.currency)}
              </span>
                          </div>
                        )}
                      </div>
            </div>
          </div>
        </div>
      </div>

              {/* BOT Report Impact */}
              <div className="border-t pt-6">
                <h4 className="font-medium text-gray-900 mb-4">BOT Report Impact</h4>
                <div className="bg-gray-50 rounded-lg p-4">
          <div className="space-y-2">
                    {selectedExpense.botImpact.msp202Impact.map((impact, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span className="text-gray-600">Line {impact.lineItem}:</span>
                        <span className="font-medium">{formatCurrency(impact.amount, selectedExpense.currency)}</span>
              </div>
            ))}
          </div>
        </div>
    </div>

              {/* Budget Impact */}
              <div className="border-t pt-6">
                <h4 className="font-medium text-gray-900 mb-4">Budget Impact</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Category:</span>
                      <span className="font-medium">{selectedExpense.budgetImpact.budgetCategory}</span>
        </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Allocated:</span>
                      <span className="font-medium">{formatCurrency(selectedExpense.budgetImpact.allocatedAmount, selectedExpense.currency)}</span>
        </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Spent:</span>
                      <span className="font-medium">{formatCurrency(selectedExpense.budgetImpact.spentAmount, selectedExpense.currency)}</span>
        </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Remaining:</span>
                      <span className="font-medium">{formatCurrency(selectedExpense.budgetImpact.remainingAmount, selectedExpense.currency)}</span>
        </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Variance:</span>
                      <span className={`font-medium ${selectedExpense.budgetImpact.variance < 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {formatCurrency(selectedExpense.budgetImpact.variance, selectedExpense.currency)} ({selectedExpense.budgetImpact.variancePercentage}%)
                      </span>
      </div>
    </div>
            </div>
              </div>

              {/* Supporting Documents - Side by Side View */}
              <div className="border-t pt-6">
                <h4 className="font-medium text-gray-900 mb-4">Supporting Documents</h4>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h5 className="text-sm font-medium text-gray-700 mb-2">Document List</h5>
                    <div className="space-y-2">
                      {selectedExpense.documents && selectedExpense.documents.length > 0 ? (
                        selectedExpense.documents.map((doc, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-white rounded border">
                            <span className="text-sm text-gray-700">{doc.name || `Document ${index + 1}`}</span>
                            <button className="text-blue-600 hover:text-blue-800 text-sm">
                              View
                            </button>
            </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500">No documents attached</p>
                      )}
          </div>
        </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h5 className="text-sm font-medium text-gray-700 mb-2">Document Preview</h5>
                    <div className="bg-white rounded border p-8 text-center">
                      <Eye className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">Select a document to preview</p>
            </div>
          </div>
          </div>
          </div>

              {/* Audit Trail */}
              <div className="border-t pt-6">
                <h4 className="font-medium text-gray-900 mb-4">Audit Trail</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="space-y-3">
                    {selectedExpense.auditTrail && selectedExpense.auditTrail.length > 0 ? (
                      selectedExpense.auditTrail.map((entry, index) => (
                        <div key={index} className="flex items-start space-x-3 p-2 bg-white rounded border">
                          <div className="flex-shrink-0">
                            <div className="w-2 h-2 bg-blue-400 rounded-full mt-2"></div>
            </div>
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-900">{entry.action}</div>
                            <div className="text-xs text-gray-500">
                              {entry.performedBy} • {formatDate(entry.timestamp)}
          </div>
                            {entry.details && (
                              <div className="text-xs text-gray-600 mt-1">{entry.details}</div>
                            )}
        </div>
      </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500">No audit entries yet</p>
                    )}
          </div>
        </div>
        </div>
      </div>
          
          <div className="approval-actions bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Approval Actions</h4>
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => approveExpense(selectedExpense)}
                  disabled={isLoading}
                  className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
                  )}
                Approve Expense
              </button>
              <button 
                onClick={() => rejectExpense(selectedExpense)}
                  disabled={isLoading}
                  className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Reject Expense
              </button>
              <button 
                onClick={() => requestMoreInfo(selectedExpense)}
                className="flex items-center px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Request More Info
              </button>
              <button
                onClick={() => setShowExpenseDetails(false)}
                className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </Layout>
  );
};

export default ExpenseApprovalWorkflow;