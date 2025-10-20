import React, { useState, useEffect } from 'react';
import { 
  Eye, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  X,
  Search,
  TrendingUp,
  DollarSign,
  FileText,
  BarChart3,
  RefreshCw
} from 'lucide-react';
import { SupabaseExpenseService } from '../../services/supabaseExpenseService';

interface PendingApprovalsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApprovalChange?: () => void;
}

interface PendingExpense {
  id: string;
  category: string;
  amount: number;
  currency: string;
  date: string;
  description: string;
  vendor: string;
  vendorId: string;
  submittedBy: string;
  submittedAt: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  documents: string[];
  status: 'pending' | 'under_review' | 'requires_info';
  tags: string[];
  paymentMethod: string;
  expenseType: string;
  taxAmount: number;
  taxRate: number;
  taxType: string;
  taxReclaimable: boolean;
  isRecurring: boolean;
  recurringPattern?: string;
  accountNumber: string;
  accountId: string;
  employeeId: string;
  priority: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  policyViolations: any[];
  complianceFlags: any[];
  ledgerEntries: any[];
  budgetImpact: any;
  botImpact: any;
  estimatedApprovalTime: number;
  lastModified: string;
  modifiedBy: string;
}

interface FilterState {
  urgency: string;
  category: string;
  search: string;
  tags: string[];
}

interface MiniMetrics {
  totalPending: number;
  totalAmount: number;
  averageAmount: number;
  criticalCount: number;
}

interface SwipeState {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  isDragging: boolean;
  direction: 'left' | 'right' | 'up' | 'down' | null;
}

const PendingApprovalsModal: React.FC<PendingApprovalsModalProps> = ({ 
  isOpen, 
  onClose, 
  onApprovalChange 
}) => {
  const [pendingExpenses, setPendingExpenses] = useState<PendingExpense[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [showMiniMetrics] = useState(true);
  const [selectedExpenses, setSelectedExpenses] = useState<string[]>([]);
  const [swipeState, setSwipeState] = useState<SwipeState>({
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    isDragging: false,
    direction: null
  });
  const [filters, setFilters] = useState<FilterState>({
    urgency: 'all',
    category: 'all',
    search: '',
    tags: []
  });
  const [miniMetrics, setMiniMetrics] = useState<MiniMetrics>({
    totalPending: 0,
    totalAmount: 0,
    averageAmount: 0,
    criticalCount: 0
  });

  // Load pending expenses from Supabase
  const loadPendingExpenses = async () => {
    setIsLoading(true);
    try {
      const expenses = await SupabaseExpenseService.getEnhancedPendingExpenses();
      
      // Transform Supabase data to PendingExpense format
      const transformedExpenses: PendingExpense[] = expenses.map(expense => ({
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
        },
        ledgerEntries: expense.ledger_entries || [],
        isRecurring: expense.is_recurring || false,
        recurringPattern: expense.recurring_pattern,
        lastModified: expense.last_modified || expense.updated_at,
        modifiedBy: expense.modified_by || expense.submitted_by
      }));

      setPendingExpenses(transformedExpenses);
      updateMiniMetrics(transformedExpenses);
      console.log('Loaded pending expenses:', transformedExpenses.length);
    } catch (error) {
      console.error('Error loading pending expenses:', error);
      setPendingExpenses([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Update mini metrics
  const updateMiniMetrics = (expenses: PendingExpense[]) => {
    const totalPending = expenses.length;
    const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const averageAmount = totalPending > 0 ? totalAmount / totalPending : 0;
    const criticalCount = expenses.filter(expense => expense.urgency === 'critical').length;

    setMiniMetrics({
      totalPending,
      totalAmount,
      averageAmount,
      criticalCount
    });
  };

  // Enhanced utility functions
  const formatCurrency = (amount: number, currency: string = 'TZS'): string => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-TZ', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical': return 'text-red-600 bg-red-100 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-100 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-100 border-green-200';
      default: return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const getUrgencyIcon = (urgency: string) => {
    switch (urgency) {
      case 'critical': return <AlertTriangle className="h-4 w-4" />;
      case 'high': return <Clock className="h-4 w-4" />;
      case 'medium': return <Clock className="h-4 w-4" />;
      case 'low': return <Clock className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };


  // Swipe gesture handlers
  const handleSwipeStart = (e: React.TouchEvent | React.MouseEvent, _expenseId: string) => {
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    setSwipeState({
      startX: clientX,
      startY: clientY,
      currentX: clientX,
      currentY: clientY,
      isDragging: true,
      direction: null
    });
  };

  const handleSwipeMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!swipeState.isDragging) return;
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const deltaX = clientX - swipeState.startX;
    const deltaY = clientY - swipeState.startY;
    
    let direction: 'left' | 'right' | 'up' | 'down' | null = null;
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      direction = deltaX > 0 ? 'right' : 'left';
    } else {
      direction = deltaY > 0 ? 'down' : 'up';
    }
    
    setSwipeState(prev => ({
      ...prev,
      currentX: clientX,
      currentY: clientY,
      direction
    }));
  };

  const handleSwipeEnd = (expenseId: string) => {
    if (!swipeState.isDragging) return;
    
    const deltaX = swipeState.currentX - swipeState.startX;
    const threshold = 100;

    if (Math.abs(deltaX) > threshold) {
      if (deltaX > 0) {
        // Swipe right - approve
        const expense = pendingExpenses.find(e => e.id === expenseId);
        if (expense) handleApprove(expense);
      } else {
        // Swipe left - reject
        const expense = pendingExpenses.find(e => e.id === expenseId);
        if (expense) handleReject(expense);
      }
    }
    
    setSwipeState({
      startX: 0,
      startY: 0,
      currentX: 0,
      currentY: 0,
      isDragging: false,
      direction: null
    });
  };

  // Selection handlers
  const toggleExpenseSelection = (expenseId: string) => {
    setSelectedExpenses(prev => 
      prev.includes(expenseId) 
        ? prev.filter(id => id !== expenseId)
        : [...prev, expenseId]
    );
  };


  const clearSelection = () => {
    setSelectedExpenses([]);
  };

  const handleApprove = async (expense: PendingExpense) => {
    setIsProcessing(true);
    try {
      await SupabaseExpenseService.approveExpense(expense.id, 'approved');
      setPendingExpenses(prev => prev.filter(e => e.id !== expense.id));
      onApprovalChange?.();
    } catch (error) {
      console.error('Error approving expense:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async (expense: PendingExpense) => {
    setIsProcessing(true);
    try {
      await SupabaseExpenseService.approveExpense(expense.id, 'rejected');
      setPendingExpenses(prev => prev.filter(e => e.id !== expense.id));
      onApprovalChange?.();
    } catch (error) {
      console.error('Error rejecting expense:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Enhanced bulk actions
  const handleBulkApprove = async (expenseIds: string[]) => {
    setIsProcessing(true);
    try {
      await Promise.all(
        expenseIds.map(id => SupabaseExpenseService.approveExpense(id, 'approved'))
      );
      setPendingExpenses(prev => prev.filter(e => !expenseIds.includes(e.id)));
      setSelectedExpenses([]);
      onApprovalChange?.();
    } catch (error) {
      console.error('Error bulk approving expenses:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkReject = async (expenseIds: string[]) => {
    setIsProcessing(true);
    try {
      await Promise.all(
        expenseIds.map(id => SupabaseExpenseService.approveExpense(id, 'rejected'))
      );
      setPendingExpenses(prev => prev.filter(e => !expenseIds.includes(e.id)));
      setSelectedExpenses([]);
      onApprovalChange?.();
    } catch (error) {
      console.error('Error bulk rejecting expenses:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Enhanced filtering
  const filteredExpenses = pendingExpenses.filter(expense => {
    if (filters.urgency !== 'all' && expense.urgency !== filters.urgency) return false;
    if (filters.category !== 'all' && expense.category !== filters.category) return false;
    if (filters.search && !expense.description.toLowerCase().includes(filters.search.toLowerCase()) && 
        !expense.vendor.toLowerCase().includes(filters.search.toLowerCase())) return false;
    if (filters.tags.length > 0 && !filters.tags.some(tag => expense.tags.includes(tag))) return false;
    return true;
  });

  // Load pending expenses on component mount
  useEffect(() => {
    if (isOpen) {
      loadPendingExpenses();
    }
  }, [isOpen]);

  // Set up real-time refresh every 10 seconds when modal is open
  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      loadPendingExpenses();
    }, 10000); // Refresh every 10 seconds

    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-7xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <h3 className="text-xl font-semibold text-gray-900">Enhanced Pending Approvals</h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setViewMode('cards')}
                className={`p-2 rounded-md ${viewMode === 'cards' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <BarChart3 className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-2 rounded-md ${viewMode === 'table' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <FileText className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={loadPendingExpenses}
              disabled={isLoading}
              className="flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
              <X className="h-6 w-6" />
          </button>
        </div>
        </div>

        {/* Mini Metrics Dashboard */}
        {showMiniMetrics && (
          <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
            <div>
                  <p className="text-sm font-medium text-blue-600">Total Pending</p>
                  <p className="text-2xl font-bold text-blue-900">{miniMetrics.totalPending}</p>
                </div>
                <Clock className="h-8 w-8 text-blue-500" />
              </div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
            <div>
                  <p className="text-sm font-medium text-green-600">Total Amount</p>
                  <p className="text-2xl font-bold text-green-900">{formatCurrency(miniMetrics.totalAmount)}</p>
                </div>
                <DollarSign className="h-8 w-8 text-green-500" />
              </div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
            <div>
                  <p className="text-sm font-medium text-purple-600">Average Amount</p>
                  <p className="text-2xl font-bold text-purple-900">{formatCurrency(miniMetrics.averageAmount)}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-500" />
              </div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
            <div>
                  <p className="text-sm font-medium text-red-600">Critical</p>
                  <p className="text-2xl font-bold text-red-900">{miniMetrics.criticalCount}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-500" />
              </div>
            </div>
          </div>
        )}
          
        {/* Filters */}
        <div className="mb-6 space-y-4">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  placeholder="Search expenses..."
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
              <select
                value={filters.urgency}
                onChange={(e) => setFilters(prev => ({ ...prev, urgency: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Urgency</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
              <select
                value={filters.category}
                onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Categories</option>
                <option value="Office Supplies">Office Supplies</option>
              <option value="Transportation">Transportation</option>
              <option value="Utilities">Utilities</option>
              <option value="Training">Training</option>
              <option value="Equipment">Equipment</option>
                <option value="Marketing">Marketing</option>
              </select>
            </div>
          </div>
          
        {/* Bulk Actions */}
        {selectedExpenses.length > 0 && (
          <div className="mb-6 bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-blue-900">
                {selectedExpenses.length} expense(s) selected
                        </span>
                        <div className="flex items-center space-x-2">
            <button
                  onClick={() => handleBulkApprove(selectedExpenses)}
                  disabled={isProcessing}
                  className="flex items-center px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Approve All
            </button>
            <button
                  onClick={() => handleBulkReject(selectedExpenses)}
                  disabled={isProcessing}
                  className="flex items-center px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Reject All
            </button>
                <button
                  onClick={clearSelection}
                  className="px-3 py-2 text-gray-600 hover:text-gray-800"
                >
                  Clear Selection
                </button>
              </div>
          </div>
        </div>
        )}

        {/* Expenses List */}
                {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredExpenses.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No pending expenses found</p>
                      </div>
        ) : (
          <div className="space-y-4">
            {filteredExpenses.map((expense) => (
              <div
                key={expense.id}
                className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                onTouchStart={(e) => handleSwipeStart(e, expense.id)}
                onTouchMove={handleSwipeMove}
                onTouchEnd={() => handleSwipeEnd(expense.id)}
                onMouseDown={(e) => handleSwipeStart(e, expense.id)}
                onMouseMove={handleSwipeMove}
                onMouseUp={() => handleSwipeEnd(expense.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <input
                      type="checkbox"
                      checked={selectedExpenses.includes(expense.id)}
                      onChange={() => toggleExpenseSelection(expense.id)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getUrgencyColor(expense.urgency)}`}>
                          {getUrgencyIcon(expense.urgency)}
                          <span className="ml-1">{expense.urgency}</span>
                        </span>
                        <span className="text-sm text-gray-500">{expense.category}</span>
                        <span className="text-sm text-gray-500">•</span>
                        <span className="text-sm text-gray-500">{formatDate(expense.date)}</span>
                      </div>
                      <h4 className="font-medium text-gray-900">{expense.description}</h4>
                      <p className="text-sm text-gray-600">Vendor: {expense.vendor}</p>
                      <p className="text-sm text-gray-600">Submitted by: {expense.submittedBy}</p>
                    </div>
                        </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-lg font-semibold text-gray-900">{formatCurrency(expense.amount, expense.currency)}</p>
                      <p className="text-sm text-gray-500">{expense.paymentMethod}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleApprove(expense)}
                            disabled={isProcessing}
                        className="flex items-center px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                          >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Approve
                          </button>
                          <button
                            onClick={() => handleReject(expense)}
                            disabled={isProcessing}
                        className="flex items-center px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                  Reject
                </button>
                      <button className="p-2 text-gray-400 hover:text-gray-600">
                        <Eye className="h-4 w-4" />
                </button>
              </div>
            </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PendingApprovalsModal;