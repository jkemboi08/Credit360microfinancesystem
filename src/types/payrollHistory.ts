/**
 * TypeScript interfaces for comprehensive payroll history system
 */

export interface PayrollRun {
  id: string;
  run_name: string;
  pay_period_start: string;
  pay_period_end: string;
  pay_month: string; // Format: YYYY-MM
  pay_year: number;
  status: 'draft' | 'calculated' | 'verified' | 'approved' | 'processed' | 'cancelled';
  total_employees: number;
  total_gross_pay: number;
  total_taxable_amount: number;
  total_paye: number;
  total_nssf_ee: number;
  total_nssf_er: number;
  total_wcf_er: number;
  total_sdl_er: number;
  total_heslb: number;
  total_loans: number;
  total_salary_advance: number;
  total_other_deductions: number;
  total_net_salary: number;
  total_allowances: number;
  notes?: string;
  processed_by?: string;
  approved_by?: string;
  processed_at: string;
  approved_at?: string;
  created_at: string;
  updated_at: string;
}

export interface PayrollEmployeeRecord {
  id: string;
  payroll_run_id: string;
  employee_id: string;
  
  // Basic salary components
  basic_salary: number;
  housing_allowance: number;
  transport_allowance: number;
  arrears: number;
  other_allowance: number;
  
  // Calculated amounts
  gross_pay: number;
  taxable_amount: number;
  
  // Tax and deductions
  paye: number;
  nssf_ee: number;
  hesbl: number;
  loan_deduction: number;
  salary_advance: number;
  other_deduction: number;
  
  // Final amounts
  total_deductions: number;
  net_salary: number;
  
  // Employer contributions
  nssf_er: number;
  wcf_er: number;
  sdl_er: number;
  
  // Status and metadata
  status: 'pending' | 'approved' | 'paid' | 'cancelled';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface PayrollAuditLog {
  id: string;
  payroll_run_id?: string;
  action: string;
  description: string;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  performed_by?: string;
  performed_at: string;
  ip_address?: string;
  user_agent?: string;
}

export interface PayrollRunSummary {
  id: string;
  run_name: string;
  pay_period_start: string;
  pay_period_end: string;
  pay_month: string;
  pay_year: number;
  status: string;
  total_employees: number;
  total_gross_pay: number;
  total_net_salary: number;
  processed_by_name?: string;
  processed_at: string;
  approved_at?: string;
}

export interface PayrollRunDetails {
  // Payroll run details
  run_id: string;
  run_name: string;
  pay_period_start: string;
  pay_period_end: string;
  pay_month: string;
  pay_year: number;
  status: string;
  total_employees: number;
  total_gross_pay: number;
  total_taxable_amount: number;
  total_paye: number;
  total_nssf_ee: number;
  total_nssf_er: number;
  total_wcf_er: number;
  total_sdl_er: number;
  total_heslb: number;
  total_loans: number;
  total_salary_advance: number;
  total_other_deductions: number;
  total_net_salary: number;
  total_allowances: number;
  notes?: string;
  processed_by_name?: string;
  approved_by_name?: string;
  processed_at: string;
  approved_at?: string;
  
  // Employee record details (repeated for each employee)
  employee_id?: string;
  employee_name?: string;
  employee_number?: string;
  basic_salary?: number;
  housing_allowance?: number;
  transport_allowance?: number;
  arrears?: number;
  other_allowance?: number;
  gross_pay?: number;
  taxable_amount?: number;
  paye?: number;
  nssf_ee?: number;
  hesbl?: number;
  loan_deduction?: number;
  salary_advance?: number;
  other_deduction?: number;
  total_deductions?: number;
  net_salary?: number;
  nssf_er?: number;
  wcf_er?: number;
  sdl_er?: number;
  employee_status?: string;
  employee_notes?: string;
}

export interface PayrollSearchFilters {
  search_term?: string;
  month?: string; // Format: YYYY-MM
  year?: number;
  status?: string;
  limit?: number;
  offset?: number;
}

export interface PayrollSearchResult {
  payroll_runs: PayrollRunSummary[];
  total_count: number;
  has_more: boolean;
}

export interface CreatePayrollRunData {
  run_name: string;
  pay_period_start: string;
  pay_period_end: string;
  notes?: string;
}

export interface UpdatePayrollRunStatusData {
  status: string;
  notes?: string;
}

// Legacy interface for backward compatibility
export interface PayrollHistory {
  id: string;
  date: string;
  period: string;
  status: 'draft' | 'calculated' | 'verified' | 'approved' | 'processed';
  totalEmployees: number;
  totalGross: number;
  totalNet: number;
  processedBy: string;
  processedAt: string;
}

// Employee interface for payroll calculations (updated)
export interface PayrollEmployee {
  id: string;
  name: string;
  employee_id?: string;
  basicSalary: number;
  housing: number;
  transport: number;
  arrears: number;
  otherAllowance: number;
  grossPay: number;
  taxableAmount: number;
  paye: number;
  nssfEE: number;
  hesbl: number;
  loan: number;
  salaryAdvance: number;
  otherDeduction: number;
  netSalary: number;
  nssfER: number;
  wcfER: number;
  sdlER: number;
}

// Payroll summary interface (updated)
export interface PayrollSummary {
  totalGross: number;
  totalTaxableAmount: number;
  totalPaye: number;
  totalNssfEE: number;
  totalNssfER: number;
  totalWcfER: number;
  totalSdlER: number;
  totalHeslb: number;
  totalLoans: number;
  totalSalaryAdvance: number;
  totalOtherDeductions: number;
  totalNetSalary: number;
  totalAllowances: number;
  totalEmployees: number;
}
