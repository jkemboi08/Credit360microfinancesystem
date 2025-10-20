// Supabase Expense Types
// These types match the actual database schema

export interface SupabaseExpenseCategory {
  id: string;
  category_code: string;
  category_name: string;
  description: string | null;
  msp202_line_item: string | null;
  is_budgetable: boolean;
  budget_type: 'operating' | 'interest' | 'tax' | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SupabaseVendor {
  id: string;
  vendor_name: string;
  contact_person: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  tax_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SupabaseExpense {
  id: string;
  category_id: string;
  amount: number;
  currency: string;
  expense_date: string;
  description: string | null;
  vendor_name: string | null;
  vendor_id: string | null;
  supporting_documents: any[];
  approval_status: 'draft' | 'pending' | 'approved' | 'rejected';
  submitted_by: string;
  submitted_at: string;
  approved_by: string | null;
  approved_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface SupabaseBudgetPeriod {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  is_locked: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface SupabaseBudgetItem {
  id: string;
  category_id: string;
  budget_period_id: string;
  budgeted_amount: number;
  actual_amount: number;
  committed_amount: number;
  available_amount: number;
  variance_amount: number;
  variance_percentage: number;
  is_over_budget: boolean;
  last_updated: string;
  updated_by: string;
  created_at: string;
}

export interface SupabaseExpenseAuditLog {
  id: string;
  expense_id: string;
  action: string;
  details: string | null;
  user_id: string;
  timestamp: string;
  log_type: 'info' | 'warning' | 'error' | 'success';
}

// Enhanced types for the UI components
export interface EnhancedExpenseWithRelations extends SupabaseExpense {
  category: SupabaseExpenseCategory;
  vendor: SupabaseVendor | null;
  budget_impact: {
    category_name: string;
    budgeted_amount: number;
    actual_amount: number;
    variance_amount: number;
    variance_percentage: number;
    is_over_budget: boolean;
  };
  audit_trail: SupabaseExpenseAuditLog[];
  // Additional UI fields
  urgency: 'low' | 'medium' | 'high' | 'critical';
  priority: number;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  tags: string[];
  payment_method: 'cash' | 'bank' | 'credit_card' | 'mobile' | 'check';
  expense_type: 'bill' | 'reimbursement' | 'advance' | 'other';
  tax_amount: number;
  tax_rate: number;
  tax_type: 'vat' | 'withholding' | 'none';
  tax_reclaimable: boolean;
  is_recurring: boolean;
  recurring_pattern?: string;
  account_number: string;
  account_id: string;
  employee_id: string;
  policy_violations: any[];
  compliance_flags: any[];
  ledger_entries: any[];
  estimated_approval_time: number;
  last_modified: string;
  modified_by: string;
}

// Mock data generator that creates data matching the Supabase schema
export const generateMockExpenseData = (): EnhancedExpenseWithRelations[] => {
  const mockCategories: SupabaseExpenseCategory[] = [
    {
      id: 'cat-001',
      category_code: 'MOCK001',
      category_name: 'Office Supplies',
      description: 'Office materials and supplies for testing',
      msp202_line_item: 'D28',
      is_budgetable: true,
      budget_type: 'operating',
      is_active: true,
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z'
    },
    {
      id: 'cat-002',
      category_code: 'MOCK002',
      category_name: 'Transportation',
      description: 'Transport and travel expenses for testing',
      msp202_line_item: 'D27',
      is_budgetable: true,
      budget_type: 'operating',
      is_active: true,
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z'
    },
    {
      id: 'cat-003',
      category_code: 'MOCK003',
      category_name: 'Utilities',
      description: 'Electricity, water, and communication expenses',
      msp202_line_item: 'D26',
      is_budgetable: true,
      budget_type: 'operating',
      is_active: true,
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z'
    }
  ];

  const mockVendors: SupabaseVendor[] = [
    {
      id: 'vendor-001',
      vendor_name: 'ABC Office Supplies Ltd',
      contact_person: 'John Manager',
      email: 'contact@abcoffice.com',
      phone: '+255123456789',
      address: 'Dar es Salaam, Tanzania',
      tax_id: 'TIN123456789',
      is_active: true,
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z'
    },
    {
      id: 'vendor-002',
      vendor_name: 'City Transport Co',
      contact_person: 'Jane Director',
      email: 'info@citytransport.co.tz',
      phone: '+255987654321',
      address: 'Arusha, Tanzania',
      tax_id: 'TIN987654321',
      is_active: true,
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z'
    }
  ];

  const mockExpenses: SupabaseExpense[] = [
    {
      id: 'exp-001',
      category_id: 'cat-001',
      amount: 150000,
      currency: 'TZS',
      expense_date: '2025-01-15',
      description: 'Office supplies purchase for Q1 operations',
      vendor_name: 'ABC Office Supplies Ltd',
      vendor_id: 'vendor-001',
      supporting_documents: ['receipt.pdf', 'invoice.pdf'],
      approval_status: 'pending',
      submitted_by: 'user1@example.com',
      submitted_at: '2025-01-15T10:30:00Z',
      approved_by: null,
      approved_at: null,
      rejection_reason: null,
      created_at: '2025-01-15T10:30:00Z',
      updated_at: '2025-01-15T10:30:00Z'
    },
    {
      id: 'exp-002',
      category_id: 'cat-002',
      amount: 250000,
      currency: 'TZS',
      expense_date: '2025-01-18',
      description: 'Field visit transportation costs',
      vendor_name: 'City Transport Co',
      vendor_id: 'vendor-002',
      supporting_documents: ['receipt.pdf'],
      approval_status: 'pending',
      submitted_by: 'user2@example.com',
      submitted_at: '2025-01-18T09:00:00Z',
      approved_by: null,
      approved_at: null,
      rejection_reason: null,
      created_at: '2025-01-18T09:00:00Z',
      updated_at: '2025-01-18T09:00:00Z'
    }
  ];

  // Combine the data with enhanced fields for UI
  return mockExpenses.map(expense => {
    const category = mockCategories.find(c => c.id === expense.category_id)!;
    const vendor = mockVendors.find(v => v.id === expense.vendor_id);

    return {
      ...expense,
      category,
      vendor,
      budget_impact: {
        category_name: category.category_name,
        budgeted_amount: 1000000,
        actual_amount: 400000,
        variance_amount: -600000,
        variance_percentage: -60,
        is_over_budget: false
      },
      audit_trail: [
        {
          id: `audit-${expense.id}`,
          expense_id: expense.id,
          action: 'submitted',
          details: 'Expense submitted for approval',
          user_id: expense.submitted_by,
          timestamp: expense.submitted_at,
          log_type: 'info' as const
        }
      ],
      // Enhanced UI fields
      urgency: 'medium' as const,
      priority: 3,
      risk_level: 'low' as const,
      tags: ['office', 'supplies'],
      payment_method: 'bank' as const,
      expense_type: 'bill' as const,
      tax_amount: expense.amount * 0.18,
      tax_rate: 18,
      tax_type: 'vat' as const,
      tax_reclaimable: true,
      is_recurring: false,
      account_number: '5001',
      account_id: 'acc-5001',
      employee_id: 'emp-001',
      policy_violations: [],
      compliance_flags: [],
      ledger_entries: [],
      estimated_approval_time: 24,
      last_modified: expense.updated_at,
      modified_by: expense.submitted_by
    };
  });
};








































