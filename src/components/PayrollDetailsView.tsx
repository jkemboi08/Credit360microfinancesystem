/**
 * Detailed Payroll View Component
 * Shows comprehensive details of a specific payroll run
 */

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Download, 
  Users, 
  DollarSign, 
  Calculator, 
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  BarChart3,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  ArrowLeft
} from 'lucide-react';
import { PayrollHistoryService } from '../services/payrollHistoryService';
import { PayrollRunDetails } from '../types/payrollHistory';
import * as XLSX from 'xlsx';

interface PayrollDetailsViewProps {
  payrollRunId: string;
  onClose: () => void;
}

const PayrollDetailsView: React.FC<PayrollDetailsViewProps> = ({ payrollRunId, onClose }) => {
  const [payrollDetails, setPayrollDetails] = useState<PayrollRunDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get payroll run details
  const fetchPayrollDetails = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await PayrollHistoryService.getPayrollRunDetails(payrollRunId);

      if (result.success && result.data) {
        setPayrollDetails(result.data);
      } else {
        setError(result.error || 'Failed to load payroll details');
      }
    } catch (err) {
      setError('An error occurred while loading payroll details');
      console.error('Error loading payroll details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayrollDetails();
  }, [payrollRunId]);

  // Get payroll run summary (first record contains run details)
  const payrollRun = payrollDetails[0];
  // Filter out records with null employee_id (these are the summary records)
  const employeeRecords = payrollDetails.filter(record => record.employee_id && record.employee_id !== null);
  
  // Debug logging
  console.log('PayrollDetailsView - payrollDetails:', payrollDetails);
  console.log('PayrollDetailsView - employeeRecords:', employeeRecords);
  console.log('PayrollDetailsView - payrollRun:', payrollRun);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Get status display
  const getStatusDisplay = (status: string) => {
    const statusConfig = {
      draft: { color: 'bg-gray-100 text-gray-800', icon: FileText },
      calculated: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      verified: { color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
      approved: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      processed: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      cancelled: { color: 'bg-red-100 text-red-800', icon: AlertCircle }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
        <Icon className="w-4 h-4 mr-2" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  // Export to Excel
  const exportToExcel = () => {
    if (!payrollRun || !employeeRecords.length) return;

    // Prepare employee data for export
    const employeeData = employeeRecords.map(record => ({
      'Employee ID': record.employee_number || record.employee_id?.slice(0, 8) || '',
      'Employee Name': record.employee_name || '',
      'Basic Salary': record.basic_salary || 0,
      'Housing Allowance': record.housing_allowance || 0,
      'Transport Allowance': record.transport_allowance || 0,
      'Arrears': record.arrears || 0,
      'Other Allowance': record.other_allowance || 0,
      'Gross Pay': record.gross_pay || 0,
      'Taxable Amount': record.taxable_amount || 0,
      'PAYE': record.paye || 0,
      'NSSF (EE)': record.nssf_ee || 0,
      'HESLB': record.hesbl || 0,
      'Loan Deduction': record.loan_deduction || 0,
      'Salary Advance': record.salary_advance || 0,
      'Other Deduction': record.other_deduction || 0,
      'Total Deductions': record.total_deductions || 0,
      'Net Salary': record.net_salary || 0,
      'NSSF (ER)': record.nssf_er || 0,
      'WCF (ER)': record.wcf_er || 0,
      'SDL (ER)': record.sdl_er || 0,
      'Status': record.employee_status || ''
    }));

    // Create workbook
    const wb = XLSX.utils.book_new();
    
    // Add employee data sheet
    const ws = XLSX.utils.json_to_sheet(employeeData);
    XLSX.utils.book_append_sheet(wb, ws, 'Employee Payroll Details');

    // Add summary sheet
    const summaryData = [{
      'Payroll Run': payrollRun.run_name,
      'Period': `${formatDate(payrollRun.pay_period_start)} - ${formatDate(payrollRun.pay_period_end)}`,
      'Status': payrollRun.status,
      'Total Employees': payrollRun.total_employees,
      'Total Gross Pay': payrollRun.total_gross_pay,
      'Total Taxable Amount': payrollRun.total_taxable_amount,
      'Total PAYE': payrollRun.total_paye,
      'Total NSSF (EE)': payrollRun.total_nssf_ee,
      'Total NSSF (ER)': payrollRun.total_nssf_er,
      'Total WCF (ER)': payrollRun.total_wcf_er,
      'Total SDL (ER)': payrollRun.total_sdl_er,
      'Total HESLB': payrollRun.total_heslb,
      'Total Loans': payrollRun.total_loans,
      'Total Salary Advance': payrollRun.total_salary_advance,
      'Total Other Deductions': payrollRun.total_other_deductions,
      'Total Net Salary': payrollRun.total_net_salary,
      'Total Allowances': payrollRun.total_allowances,
      'Processed By': payrollRun.processed_by_name || 'System',
      'Processed At': formatDate(payrollRun.processed_at),
      'Approved At': payrollRun.approved_at ? formatDate(payrollRun.approved_at) : 'Not Approved'
    }];

    const summaryWs = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, summaryWs, 'Payroll Summary');

    // Save file
    const fileName = `payroll_${payrollRun.run_name.replace(/[^a-zA-Z0-9]/g, '_')}_${payrollRun.pay_month}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 w-full h-full mx-0 my-0 flex items-center justify-center">
          <div className="flex items-center justify-center space-x-3">
            <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
            <span className="text-gray-600">Loading payroll details...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !payrollRun) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 w-full h-full mx-0 my-0 flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 font-medium">Error loading payroll details</p>
            <p className="text-gray-500 text-sm mt-1">{error}</p>
            <button
              onClick={onClose}
              className="mt-4 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full h-full mx-0 my-0 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <BarChart3 className="h-6 w-6 text-blue-600" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{payrollRun.run_name}</h2>
              <p className="text-gray-600">
                {formatDate(payrollRun.pay_period_start)} - {formatDate(payrollRun.pay_period_end)}
              </p>
            </div>
            {getStatusDisplay(payrollRun.status)}
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to History
            </button>
            <button
              onClick={exportToExcel}
              className="flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
            >
              <Download className="h-4 w-4 mr-2" />
              Export Excel
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Total Employees</p>
                  <p className="text-2xl font-bold text-gray-900">{payrollRun.total_employees}</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="flex items-center">
                <DollarSign className="h-8 w-8 text-green-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Total Gross Pay</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(payrollRun.total_gross_pay)}</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="flex items-center">
                <Calculator className="h-8 w-8 text-purple-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Total Net Salary</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(payrollRun.total_net_salary)}</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="flex items-center">
                <TrendingDown className="h-8 w-8 text-red-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Total Deductions</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(payrollRun.total_gross_pay - payrollRun.total_net_salary)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Breakdown */}
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Payroll Breakdown</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Allowances</h4>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(payrollRun.total_allowances)}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Taxes & Contributions</h4>
              <p className="text-2xl font-bold text-red-600">{formatCurrency(payrollRun.total_paye + payrollRun.total_nssf_ee)}</p>
              <p className="text-sm text-gray-600">PAYE: {formatCurrency(payrollRun.total_paye)}</p>
              <p className="text-sm text-gray-600">NSSF (EE): {formatCurrency(payrollRun.total_nssf_ee)}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Other Deductions</h4>
              <p className="text-2xl font-bold text-orange-600">
                {formatCurrency(payrollRun.total_heslb + payrollRun.total_loans + payrollRun.total_salary_advance + payrollRun.total_other_deductions)}
              </p>
              <p className="text-sm text-gray-600">HESLB: {formatCurrency(payrollRun.total_heslb)}</p>
              <p className="text-sm text-gray-600">Loans: {formatCurrency(payrollRun.total_loans)}</p>
            </div>
          </div>
        </div>

        {/* Employee Details Table */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Employee Details</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Employee ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Employee
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Basic Salary
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Allowances
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Gross Pay
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Taxable Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      PAYE
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      NSSF (EE)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Other Deductions
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Net Salary
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {employeeRecords.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="px-6 py-8 text-center text-gray-500">
                        <div className="flex flex-col items-center">
                          <Users className="h-8 w-8 text-gray-400 mb-2" />
                          <p className="text-sm">No employee records found</p>
                          <p className="text-xs text-gray-400 mt-1">
                            This payroll run may not have employee details saved yet.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    employeeRecords.map((record, index) => (
                    <tr key={record.employee_id || index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {record.employee_number || record.employee_id?.slice(0, 8) || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {record.employee_name || 'Unknown Employee'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(record.basic_salary || 0)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency((record.housing_allowance || 0) + (record.transport_allowance || 0) + (record.arrears || 0) + (record.other_allowance || 0))}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                        {formatCurrency(record.gross_pay || 0)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(record.taxable_amount || 0)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                        {formatCurrency(record.paye || 0)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                        {formatCurrency(record.nssf_ee || 0)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-orange-600">
                        {formatCurrency((record.hesbl || 0) + (record.loan_deduction || 0) + (record.salary_advance || 0) + (record.other_deduction || 0))}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                        {formatCurrency(record.net_salary || 0)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          record.employee_status === 'paid' ? 'bg-green-100 text-green-800' :
                          record.employee_status === 'approved' ? 'bg-blue-100 text-blue-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {record.employee_status || 'pending'}
                        </span>
                      </td>
                    </tr>
                  ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PayrollDetailsView;
