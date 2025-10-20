// Payroll Management Page - Enhanced with full functionality
// Based on the screenshot showing a comprehensive payroll workspace

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupabaseAuth } from '../context/SupabaseAuthContext';
import Layout from '../components/Layout';
import { calculatePAYE, calculateNSSFEmployee, calculateNSSFEmployer, calculateTaxableAmount } from '../utils/payeCalculator';
import { PayrollHistoryService } from '../services/payrollHistoryService';
import { EmployeeService } from '../services/employeeService';
import { PayrollEmployeeService } from '../services/payrollEmployeeService';
import PayrollHistorySearch from '../components/PayrollHistorySearch';
import PayrollDetailsView from '../components/PayrollDetailsView';
import { PayrollEmployee, CreatePayrollRunData } from '../types/payrollHistory';
import { 
  CheckCircle, 
  AlertTriangle, 
  Edit3, 
  Calculator, 
  Check, 
  Mail, 
  X,
  Clock,
  Users,
  DollarSign,
  FileText,
  Settings,
  BarChart3,
  Play,
  Pause,
  Save,
  Download,
  History,
  Banknote,
  Eye,
  CheckSquare,
  AlertCircle,
  Info,
  Upload,
  ArrowLeft,
  RefreshCw
} from 'lucide-react';
import * as XLSX from 'xlsx';

// Use PayrollEmployee from types instead of local interface
type Employee = PayrollEmployee;

interface PayrollSummary {
  totalGross: number;
  totalHesbl: number;
  totalSdl: number;
  totalAllowances: number;
  totalOtherDeduction: number;
  totalPaye: number;
  totalNssfER: number;
  totalNssfEE: number;
  totalWcf: number;
  totalNetSalary: number;
}

interface PayrollHistory {
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

interface AuditLog {
  id: string;
  timestamp: string;
  action: string;
  user: string;
  details: string;
  type: 'info' | 'warning' | 'error' | 'success';
}

interface BankPaymentRecord {
  employeeId: string;
  employeeName: string;
  bankAccount: string;
  bankName: string;
  amount: number;
  reference: string;
}

const PayrollManagement: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useSupabaseAuth();
  const [checklistItems, setChecklistItems] = useState({
    attendance: false,
    loans: false,
    leave: false,
    hires: false
  });
  const [payrollHistory, setPayrollHistory] = useState<PayrollHistory[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [bankPaymentRecords, setBankPaymentRecords] = useState<BankPaymentRecord[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showBankPayment, setShowBankPayment] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  
  // Enhanced payroll history state
  const [showPayrollHistory, setShowPayrollHistory] = useState(false);
  const [showPayrollDetails, setShowPayrollDetails] = useState(false);
  const [selectedPayrollRunId, setSelectedPayrollRunId] = useState<string | null>(null);
  const [currentPayrollRunId, setCurrentPayrollRunId] = useState<string | null>(null);
  const [payrollRunName, setPayrollRunName] = useState('');
  const [payPeriodStart, setPayPeriodStart] = useState('');
  const [payPeriodEnd, setPayPeriodEnd] = useState('');
  const [showCreateRunModal, setShowCreateRunModal] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [editingEmployee, setEditingEmployee] = useState<string | null>(null);
  const [workflowStep, setWorkflowStep] = useState(1);
  const [showError, setShowError] = useState(true);
  const [loadingEmployees, setLoadingEmployees] = useState(false);

  // Add audit log entry
  const addAuditLog = (action: string, details: string, type: AuditLog['type'] = 'info') => {
    const newLog: AuditLog = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      action,
      user: user?.email || 'System',
      details,
      type
    };
    setAuditLogs(prev => [newLog, ...prev.slice(0, 49)]); // Keep last 50 logs
  };

  // Load employees from database
  const loadEmployeesFromDatabase = async () => {
    setLoadingEmployees(true);
    try {
      addAuditLog('Data Loading', 'Loading employees from database', 'info');

      const result = await PayrollEmployeeService.getPayrollEmployees();

      if (result.success && result.data) {
        setEmployees(result.data);
        addAuditLog('Data Loading', `Loaded ${result.data.length} employees from database`, 'success');
        console.log(`✅ Loaded ${result.data.length} employees for payroll`);
      } else {
        addAuditLog('Data Loading', `Failed to load employees: ${result.error}`, 'warning');
        console.warn('Failed to load employees from database:', result.error);
        // Set empty array if loading fails
        setEmployees([]);
      }
    } catch (error) {
      addAuditLog('Data Loading', `Error loading employees: ${error}`, 'error');
      console.error('Error loading employees from database:', error);
      setEmployees([]);
    } finally {
      setLoadingEmployees(false);
    }
  };

  // Initialize with sample audit logs and load employees
  useEffect(() => {
    addAuditLog('System', 'Payroll Management system initialized', 'info');
    addAuditLog('User', 'User accessed payroll workspace', 'info');
    
    // Load employees from database
    loadEmployeesFromDatabase();
  }, []);

  // Calculate payroll for each employee
  const calculatePayroll = (employee: Employee): Employee => {
    const grossPay = employee.basicSalary + employee.housing + employee.transport + 
                    employee.arrears + employee.otherAllowance;
    
    // Calculate NSSF Employee contribution (10% of gross pay)
    const nssfEE = calculateNSSFEmployee(grossPay);
    
    // Calculate taxable amount (gross pay minus NSSF employee contribution)
    const taxableAmount = calculateTaxableAmount(grossPay);
    
    // Calculate PAYE using the new progressive tax brackets
    const payeResult = calculatePAYE(taxableAmount, true); // true for resident
    const paye = payeResult.taxAmount;
    
    // Calculate total deductions
    const totalDeductions = paye + nssfEE + employee.hesbl + employee.loan + 
                           employee.salaryAdvance + employee.otherDeduction;
    
    const netSalary = grossPay - totalDeductions;
    
    // Calculate employer contributions
    const nssfER = calculateNSSFEmployer(grossPay); // 10% of gross pay
    const wcfER = grossPay * 0.01;
    const sdlER = grossPay * 0.01;

    return {
      ...employee,
      grossPay,
      taxableAmount,
      paye,
      nssfEE,
      netSalary,
      nssfER,
      wcfER,
      sdlER
    };
  };
    
    // Calculate summary totals
  const calculateSummary = (): PayrollSummary => {
    const calculatedEmployees = employees.map(calculatePayroll);
    
    return {
      totalGross: calculatedEmployees.reduce((sum, emp) => sum + emp.grossPay, 0),
      totalHesbl: calculatedEmployees.reduce((sum, emp) => sum + emp.hesbl, 0),
      totalSdl: calculatedEmployees.reduce((sum, emp) => sum + emp.sdlER, 0),
      totalAllowances: calculatedEmployees.reduce((sum, emp) => 
        sum + emp.housing + emp.transport + emp.arrears + emp.otherAllowance, 0),
      totalOtherDeduction: calculatedEmployees.reduce((sum, emp) => sum + emp.otherDeduction, 0),
      totalPaye: calculatedEmployees.reduce((sum, emp) => sum + emp.paye, 0),
      totalNssfER: calculatedEmployees.reduce((sum, emp) => sum + emp.nssfER, 0),
      totalNssfEE: calculatedEmployees.reduce((sum, emp) => sum + emp.nssfEE, 0),
      totalWcf: calculatedEmployees.reduce((sum, emp) => sum + emp.wcfER, 0),
      totalNetSalary: calculatedEmployees.reduce((sum, emp) => sum + emp.netSalary, 0)
    };
  };

  const summary = calculateSummary();

  const handleChecklistChange = (item: keyof typeof checklistItems) => {
    setChecklistItems(prev => ({
      ...prev,
      [item]: !prev[item]
    }));
  };

  const handleEmployeeEdit = (employeeId: string) => {
    setEditingEmployee(employeeId);
  };

  const handleEmployeeUpdate = (employeeId: string, field: keyof Employee, value: number) => {
    setEmployees(prev => prev.map(emp => 
      emp.id === employeeId ? { ...emp, [field]: value } : emp
    ));
  };

  const handleCalculatePayroll = async () => {
    setIsCalculating(true);
    addAuditLog('Payroll Calculation', 'Starting payroll calculation process', 'info');
    
    try {
      // Calculate payroll for all employees
      const calculatedEmployees = employees.map(calculatePayroll);
      setEmployees(calculatedEmployees);
      setWorkflowStep(2);
      
      // Save to database if we have a current payroll run
      if (currentPayrollRunId) {
        const result = await PayrollHistoryService.saveCalculatedPayroll(
          currentPayrollRunId,
          calculatedEmployees
        );
        
        if (result.success) {
          addAuditLog('Payroll Calculation', `Payroll calculated and saved to database for ${employees.length} employees`, 'success');
        } else {
          addAuditLog('Payroll Calculation', `Payroll calculated but failed to save to database: ${result.error}`, 'error');
        }
      } else {
        // Legacy: Add to local payroll history
        const summary = calculateSummary();
        const newPayrollRecord: PayrollHistory = {
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          date: new Date().toISOString().split('T')[0],
          period: 'September 2025',
          status: 'calculated',
          totalEmployees: employees.length,
          totalGross: summary.totalGross,
          totalNet: summary.totalNetSalary,
          processedBy: user?.email || 'System',
          processedAt: new Date().toISOString()
        };
        
        setPayrollHistory(prev => [newPayrollRecord, ...prev]);
        addAuditLog('Payroll Calculation', `Payroll calculated for ${employees.length} employees`, 'success');
      }
    } catch (error) {
      addAuditLog('Payroll Calculation', `Error during payroll calculation: ${error}`, 'error');
    } finally {
      setIsCalculating(false);
    }
  };

  // Create new payroll run
  const handleCreatePayrollRun = async () => {
    if (!payrollRunName || !payPeriodStart || !payPeriodEnd) {
      addAuditLog('Payroll Run', 'Please fill in all required fields', 'error');
      return;
    }

    try {
      const runData: CreatePayrollRunData = {
        run_name: payrollRunName,
        pay_period_start: payPeriodStart,
        pay_period_end: payPeriodEnd,
        notes: `Payroll run for ${payrollRunName}`
      };

      const result = await PayrollHistoryService.createPayrollRun(runData);
      
      if (result.success && result.data) {
        setCurrentPayrollRunId(result.data.id);
        setShowCreateRunModal(false);
        setPayrollRunName('');
        setPayPeriodStart('');
        setPayPeriodEnd('');
        addAuditLog('Payroll Run', `Created new payroll run: ${result.data.run_name}`, 'success');
      } else {
        addAuditLog('Payroll Run', `Failed to create payroll run: ${result.error}`, 'error');
      }
    } catch (error) {
      addAuditLog('Payroll Run', `Error creating payroll run: ${error}`, 'error');
    }
  };

  // Handle payroll history search
  const handleViewPayrollHistory = () => {
    setShowPayrollHistory(true);
  };

  // Handle payroll details view
  const handleViewPayrollDetails = (payrollRunId: string) => {
    setSelectedPayrollRunId(payrollRunId);
    setShowPayrollDetails(true);
  };

  // Close payroll history
  const handleClosePayrollHistory = () => {
    setShowPayrollHistory(false);
  };

  // Close payroll details
  const handleClosePayrollDetails = () => {
    setShowPayrollDetails(false);
    setSelectedPayrollRunId(null);
  };

  // Navigate back to staff management dashboard
  const handleBackToDashboard = () => {
    navigate('/staff/dashboard');
  };

  // Refresh employees from database
  const handleRefreshEmployees = async () => {
    addAuditLog('User Action', 'Refreshing employee list', 'info');
    await loadEmployeesFromDatabase();
  };

  // Create employees from payroll data
  const handleCreateEmployeesFromPayroll = async () => {
    try {
      addAuditLog('Employee Management', 'Creating employees from payroll data', 'info');
      
      const result = await EmployeeService.createEmployeesFromPayroll(employees);
      
      if (result.success && result.data) {
        const { created, skipped, errors } = result.data;
        addAuditLog(
          'Employee Management', 
          `Created ${created} employees, skipped ${skipped} existing employees${errors.length > 0 ? `. Errors: ${errors.join(', ')}` : ''}`, 
          errors.length > 0 ? 'warning' : 'success'
        );
        
        // Show success message
        alert(`Successfully created ${created} employees from payroll data. ${skipped} employees already existed.`);
      } else {
        addAuditLog('Employee Management', `Failed to create employees: ${result.error}`, 'error');
        alert(`Failed to create employees: ${result.error}`);
      }
    } catch (error) {
      addAuditLog('Employee Management', `Error creating employees: ${error}`, 'error');
      console.error('Error creating employees:', error);
      alert('An error occurred while creating employees');
    }
  };

  // Export to Excel
  const exportToExcel = () => {
    addAuditLog('Export', 'Exporting payroll data to Excel', 'info');
    
    const calculatedEmployees = employees.map(calculatePayroll);
    const summary = calculateSummary();
    
    // Create employee data worksheet
    const employeeData = calculatedEmployees.map(emp => ({
      'Employee Name': emp.name,
      'Basic Salary': emp.basicSalary,
      'Housing': emp.housing,
      'Transport': emp.transport,
      'Arrears': emp.arrears,
      'Other Allowance': emp.otherAllowance,
      'Gross Pay': emp.grossPay,
      'Taxable Amount': emp.taxableAmount,
      'PAYE': emp.paye,
      'NSSF (EE)': emp.nssfEE,
      'HESLB': emp.hesbl,
      'Loan': emp.loan,
      'Salary Advance': emp.salaryAdvance,
      'Other Deduction': emp.otherDeduction,
      'Net Salary': emp.netSalary,
      'NSSF (ER)': emp.nssfER,
      'WCF (ER)': emp.wcfER,
      'SDL (ER)': emp.sdlER
    }));

    // Create summary data worksheet
    const summaryData = [{
      'Total Gross': summary.totalGross,
      'Total HESLB': summary.totalHesbl,
      'Total SDL': summary.totalSdl,
      'Total Allowances': summary.totalAllowances,
      'Total Other Deduction': summary.totalOtherDeduction,
      'Total PAYE': summary.totalPaye,
      'Total NSSF (ER)': summary.totalNssfER,
      'Total NSSF (EE)': summary.totalNssfEE,
      'Total WCF': summary.totalWcf,
      'Total Net Salary': summary.totalNetSalary
    }];

    // Create workbook
    const wb = XLSX.utils.book_new();
    const ws1 = XLSX.utils.json_to_sheet(employeeData);
    const ws2 = XLSX.utils.json_to_sheet(summaryData);
    
    XLSX.utils.book_append_sheet(wb, ws1, 'Employee Payroll');
    XLSX.utils.book_append_sheet(wb, ws2, 'Summary Totals');
    
    // Save file
    const fileName = `Payroll_September_2025_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
    
    addAuditLog('Export', `Excel file exported: ${fileName}`, 'success');
  };

  // Generate bank payment file
  const generateBankPaymentFile = () => {
    addAuditLog('Bank Payment', 'Generating bank payment file', 'info');
    
    const calculatedEmployees = employees.map(calculatePayroll);
    const bankRecords: BankPaymentRecord[] = calculatedEmployees.map(emp => ({
      employeeId: emp.id,
      employeeName: emp.name,
      bankAccount: `ACC${emp.id.padStart(6, '0')}`, // Mock account number
      bankName: 'CRDB Bank', // Mock bank name
      amount: emp.netSalary,
      reference: `PAY${emp.id}_${new Date().toISOString().split('T')[0]}`
    }));
    
    setBankPaymentRecords(bankRecords);
    setShowBankPayment(true);
    
    // Export bank payment file
    const bankData = bankRecords.map(record => ({
      'Employee ID': record.employeeId,
      'Employee Name': record.employeeName,
      'Bank Account': record.bankAccount,
      'Bank Name': record.bankName,
      'Amount': record.amount,
      'Reference': record.reference
    }));
    
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(bankData);
    XLSX.utils.book_append_sheet(wb, ws, 'Bank Payment');
    
    const fileName = `Bank_Payment_September_2025_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
    
    addAuditLog('Bank Payment', `Bank payment file generated: ${fileName}`, 'success');
  };

  // Process approval workflow
  const processApprovalStep = (step: number) => {
    addAuditLog('Approval', `Processing approval step ${step}`, 'info');
    setWorkflowStep(step);
    
    if (step === 4) {
      addAuditLog('Approval', 'Payroll approved and ready for disbursement', 'success');
    }
  };

  // Approve payroll
  const approvePayroll = () => {
    addAuditLog('Approval', 'Payroll approved by user', 'success');
    setIsApproved(true);
    setWorkflowStep(4);
    addAuditLog('Approval', 'Payroll approved and ready for bank payment generation', 'success');
  };

  // Generate Excel template for bulk upload
  const generateTemplate = () => {
    addAuditLog('Template', 'Generating Excel template for bulk upload', 'info');
    
    const templateData = [{
      'Employee Name': 'John Doe',
      'Basic Salary': 3500000,
      'Housing': 525000,
      'Transport': 100000,
      'Arrears': 0,
      'Other Allowance': 0,
      'HESLB': 300000,
      'Loan': 0,
      'Salary Advance': 200000,
      'Other Deduction': 0
    }];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(templateData);
    XLSX.utils.book_append_sheet(wb, ws, 'Employee Data');
    
    const fileName = `Payroll_Bulk_Upload_Template_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
    
    addAuditLog('Template', `Excel template generated: ${fileName}`, 'success');
  };

  // Handle bulk upload
  const handleBulkUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      addAuditLog('Upload', `File selected for bulk upload: ${file.name}`, 'info');
    }
  };

  // Process uploaded file
  const processBulkUpload = () => {
    if (!uploadedFile) return;
    
    addAuditLog('Upload', 'Processing bulk upload file', 'info');
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        const newEmployees: Employee[] = jsonData.map((row: any, index: number) => ({
          id: `${Date.now()}-${index}-${Math.random().toString(36).substr(2, 5)}`,
          name: row['Employee Name'] || '',
          basicSalary: Number(row['Basic Salary']) || 0,
          housing: Number(row['Housing']) || 0,
          transport: Number(row['Transport']) || 0,
          arrears: Number(row['Arrears']) || 0,
          otherAllowance: Number(row['Other Allowance']) || 0,
          grossPay: 0,
          taxableAmount: 0,
          paye: 0,
          nssfEE: 0,
          hesbl: Number(row['HESLB']) || 0,
          loan: Number(row['Loan']) || 0,
          salaryAdvance: Number(row['Salary Advance']) || 0,
          otherDeduction: Number(row['Other Deduction']) || 0,
          netSalary: 0,
          nssfER: 0,
          wcfER: 0,
          sdlER: 0
        }));
        
        setEmployees(prev => [...prev, ...newEmployees]);
        setShowBulkUpload(false);
        setUploadedFile(null);
        addAuditLog('Upload', `Successfully uploaded ${newEmployees.length} employees`, 'success');
      } catch (error) {
        addAuditLog('Upload', 'Error processing uploaded file', 'error');
        console.error('Error processing file:', error);
      }
    };
    
    reader.readAsArrayBuffer(uploadedFile);
  };

  // Export audit logs to PDF
  const exportAuditLogsToPDF = () => {
    addAuditLog('Export', 'Exporting audit logs to PDF', 'info');
    
    // Create audit log data for PDF
    const auditData = auditLogs.map(log => ({
      'Timestamp': new Date(log.timestamp).toLocaleString(),
      'Action': log.action,
      'Details': log.details,
      'User': log.user,
      'Type': log.type
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(auditData);
    XLSX.utils.book_append_sheet(wb, ws, 'Audit Logs');
    
    const fileName = `Audit_Logs_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
    
    addAuditLog('Export', `Audit logs exported to PDF: ${fileName}`, 'success');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const allChecklistItemsChecked = Object.values(checklistItems).every(Boolean);

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Payroll Workspace</h1>
              <p className="text-gray-600 mt-2">Process employee payroll for September 2025</p>
            </div>
            <button
              onClick={handleBackToDashboard}
              className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-4">
            {/* Refresh Employees Button */}
              <button
                onClick={handleRefreshEmployees}
                disabled={loadingEmployees}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loadingEmployees ? 'animate-spin' : ''}`} />
                {loadingEmployees ? 'Loading...' : 'Refresh Employees'}
              </button>

            {/* Create Payroll Run Button */}
            {!currentPayrollRunId && (
              <button
                onClick={() => setShowCreateRunModal(true)}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors flex items-center"
              >
                <FileText className="h-4 w-4 mr-2" />
                Create Payroll Run
              </button>
            )}
            
            {/* Current Payroll Run Info */}
            {currentPayrollRunId && (
              <div className="px-4 py-2 bg-green-100 text-green-800 rounded-md flex items-center">
                <CheckCircle className="h-4 w-4 mr-2" />
                Active Payroll Run: {payrollRunName || 'Current Run'}
              </div>
            )}
            
            <button
              onClick={exportToExcel}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center"
            >
              <Download className="h-4 w-4 mr-2" />
              Export to Excel
            </button>
            <button
              onClick={handleViewPayrollHistory}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center"
            >
              <History className="h-4 w-4 mr-2" />
              Search Payroll History
            </button>
            <button
              onClick={() => setShowHistory(true)}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors flex items-center"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Legacy History
            </button>
            <button
              onClick={generateBankPaymentFile}
              disabled={!isApproved}
              className={`px-4 py-2 rounded-md transition-colors flex items-center ${
                isApproved
                  ? 'bg-purple-600 text-white hover:bg-purple-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <Banknote className="h-4 w-4 mr-2" />
              Generate Payment File
            </button>
            <button
              onClick={generateTemplate}
              className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors flex items-center"
            >
              <FileText className="h-4 w-4 mr-2" />
              Download Template
            </button>
            <button
              onClick={() => setShowBulkUpload(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors flex items-center"
            >
              <Upload className="h-4 w-4 mr-2" />
              Bulk Upload
            </button>
            <button
              onClick={handleCreateEmployeesFromPayroll}
              className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 transition-colors flex items-center"
            >
              <Users className="h-4 w-4 mr-2" />
              Create Employees
            </button>
          </div>
        </div>

          {/* Pre-processing Checklist */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
            <div className="flex items-center mb-4">
            <CheckCircle className="h-6 w-6 text-blue-600 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900">Pre-processing Checklist</h2>
            </div>
          <p className="text-gray-600 mb-6">
              Ensure all data is accurate before running payroll. All items must be checked to proceed.
            </p>
            
          <div className="space-y-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                checked={checklistItems.attendance}
                onChange={() => handleChecklistChange('attendance')}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-3 text-sm text-gray-700">
                Verify Attendance Data (Absences, Overtime)
              </span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                checked={checklistItems.loans}
                onChange={() => handleChecklistChange('loans')}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-3 text-sm text-gray-700">
                Validate Loan/Advance Deductions
              </span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                checked={checklistItems.leave}
                onChange={() => handleChecklistChange('leave')}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-3 text-sm text-gray-700">
                Confirm Leave Records (Unpaid leave)
              </span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                checked={checklistItems.hires}
                onChange={() => handleChecklistChange('hires')}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-3 text-sm text-gray-700">
                Process New Hires & Terminations
              </span>
              </label>
            </div>
          </div>

        {/* Employee Payroll Details */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Employee Payroll Details</h2>
              <p className="text-gray-600 mt-1">Review individual payroll calculations for September 2025.</p>
            </div>
            <button
              onClick={handleCalculatePayroll}
              disabled={!allChecklistItemsChecked || isCalculating}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center ${
                allChecklistItemsChecked && !isCalculating
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isCalculating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Calculating...
                </>
              ) : (
                <>
                  <Calculator className="h-4 w-4 mr-2" />
                  Calculate Payroll
                </>
              )}
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employee
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Basic Salary
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Housing
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Transport
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Arrears
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Other Allow.
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Gross Pay
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Taxable Amount
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    PAYE
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    NSSF (EE)
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    HESLB
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Loan
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Salary Advance
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Other Ded.
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Net Salary
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    NSSF (ER)
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    WCF (ER)
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    SDL (ER)
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loadingEmployees ? (
                  <tr>
                    <td colSpan={12} className="px-6 py-8 text-center text-gray-500">
                      <div className="flex items-center justify-center">
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Loading employees...
                      </div>
                    </td>
                  </tr>
                ) : employees.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="px-6 py-8 text-center text-gray-500">
                      No employees found. Click "Refresh Employees" to load from database.
                    </td>
                  </tr>
                ) : (
                  employees.map((employee) => {
                  const calculated = calculatePayroll(employee);
                  return (
                  <tr key={employee.id} className="hover:bg-gray-50">
                      <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {employee.name}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                        {editingEmployee === employee.id ? (
                          <input
                            type="number"
                            value={employee.basicSalary}
                            onChange={(e) => handleEmployeeUpdate(employee.id, 'basicSalary', Number(e.target.value))}
                            className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
                          />
                        ) : (
                          formatCurrency(employee.basicSalary)
                        )}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                        {editingEmployee === employee.id ? (
                          <input
                            type="number"
                            value={employee.housing}
                            onChange={(e) => handleEmployeeUpdate(employee.id, 'housing', Number(e.target.value))}
                            className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                          />
                        ) : (
                          formatCurrency(employee.housing)
                        )}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                        {editingEmployee === employee.id ? (
                          <input
                            type="number"
                            value={employee.transport}
                            onChange={(e) => handleEmployeeUpdate(employee.id, 'transport', Number(e.target.value))}
                            className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                          />
                        ) : (
                          formatCurrency(employee.transport)
                        )}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                        {editingEmployee === employee.id ? (
                          <input
                            type="number"
                            value={employee.arrears}
                            onChange={(e) => handleEmployeeUpdate(employee.id, 'arrears', Number(e.target.value))}
                            className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                          />
                        ) : (
                          formatCurrency(employee.arrears)
                        )}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                        {editingEmployee === employee.id ? (
                          <input
                            type="number"
                            value={employee.otherAllowance}
                            onChange={(e) => handleEmployeeUpdate(employee.id, 'otherAllowance', Number(e.target.value))}
                            className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                          />
                        ) : (
                          formatCurrency(employee.otherAllowance)
                        )}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                        {formatCurrency(calculated.grossPay)}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(calculated.taxableAmount)}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(calculated.paye)}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(calculated.nssfEE)}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                        {editingEmployee === employee.id ? (
                          <input
                            type="number"
                            value={employee.hesbl}
                            onChange={(e) => handleEmployeeUpdate(employee.id, 'hesbl', Number(e.target.value))}
                            className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                          />
                        ) : (
                          formatCurrency(employee.hesbl)
                        )}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                        {editingEmployee === employee.id ? (
                          <input
                            type="number"
                            value={employee.loan}
                            onChange={(e) => handleEmployeeUpdate(employee.id, 'loan', Number(e.target.value))}
                            className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                          />
                        ) : (
                          formatCurrency(employee.loan)
                        )}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                        {editingEmployee === employee.id ? (
                          <input
                            type="number"
                            value={employee.salaryAdvance}
                            onChange={(e) => handleEmployeeUpdate(employee.id, 'salaryAdvance', Number(e.target.value))}
                            className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                          />
                        ) : (
                          formatCurrency(employee.salaryAdvance)
                        )}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                        {editingEmployee === employee.id ? (
                          <input
                            type="number"
                            value={employee.otherDeduction}
                            onChange={(e) => handleEmployeeUpdate(employee.id, 'otherDeduction', Number(e.target.value))}
                            className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                          />
                        ) : (
                          formatCurrency(employee.otherDeduction)
                        )}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm font-bold text-blue-600">
                        {formatCurrency(calculated.netSalary)}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(calculated.nssfER)}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(calculated.wcfER)}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(calculated.sdlER)}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                        <button
                          onClick={() => handleEmployeeEdit(employee.id)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Edit3 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                  );
                })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary Totals */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
            <div className="flex items-center mb-4">
            <BarChart3 className="h-6 w-6 text-blue-600 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900">Summary Totals</h2>
          </div>
          
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{formatCurrency(summary.totalGross)}</div>
                <div className="text-sm text-gray-500">Total Gross</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{formatCurrency(summary.totalHesbl)}</div>
                <div className="text-sm text-gray-500">Total HESLB</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{formatCurrency(summary.totalSdl)}</div>
                <div className="text-sm text-gray-500">Total SDL</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{formatCurrency(summary.totalAllowances)}</div>
                <div className="text-sm text-gray-500">Total Allowances</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{formatCurrency(summary.totalOtherDeduction)}</div>
                <div className="text-sm text-gray-500">Total Other Ded.</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{formatCurrency(summary.totalPaye)}</div>
                <div className="text-sm text-gray-500">Total PAYE</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{formatCurrency(summary.totalNssfER)}</div>
                <div className="text-sm text-gray-500">Total NSSF (ER)</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{formatCurrency(summary.totalNssfEE)}</div>
                <div className="text-sm text-gray-500">Total NSSF (EE)</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{formatCurrency(summary.totalWcf)}</div>
                <div className="text-sm text-gray-500">Total WCF</div>
              </div>
              <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{formatCurrency(summary.totalNetSalary)}</div>
                <div className="text-sm text-gray-500">Total Net Salary</div>
            </div>
          </div>
        </div>

        {/* Approval Workflow & Audit */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Approval Workflow & Audit</h2>
              <p className="text-gray-600 mt-1">Run payroll and track its progress through the approval stages.</p>
            </div>
            {showError && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3 flex items-center">
                <AlertTriangle className="h-4 w-4 text-red-400 mr-2" />
                <span className="text-sm text-red-800">1 error</span>
                <button
                  onClick={() => setShowError(false)}
                  className="ml-2 text-red-400 hover:text-red-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-8">
            <button
              onClick={() => processApprovalStep(1)}
              className={`flex items-center ${workflowStep >= 1 ? 'text-blue-600' : 'text-gray-400'} hover:text-blue-600 transition-colors`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                workflowStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                  1
                </div>
              <span className="ml-2 text-sm font-medium">Calculation</span>
            </button>
            
            <button
              onClick={() => processApprovalStep(2)}
              disabled={workflowStep < 1}
              className={`flex items-center ${workflowStep >= 2 ? 'text-blue-600' : 'text-gray-400'} hover:text-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                workflowStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                  2
                </div>
              <span className="ml-2 text-sm font-medium">Verification</span>
            </button>
            
            <button
              onClick={() => processApprovalStep(3)}
              disabled={workflowStep < 2}
              className={`flex items-center ${workflowStep >= 3 ? 'text-blue-600' : 'text-gray-400'} hover:text-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                workflowStep >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                  3
                </div>
              <span className="ml-2 text-sm font-medium">Approval</span>
            </button>
            
            <button
              onClick={() => processApprovalStep(4)}
              disabled={workflowStep < 3}
              className={`flex items-center ${workflowStep >= 4 ? 'text-blue-600' : 'text-gray-400'} hover:text-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                workflowStep >= 4 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                  4
                </div>
              <span className="ml-2 text-sm font-medium">Disbursement Prep</span>
            </button>
              </div>
            </div>

        {/* Payroll History Modal */}
        {showHistory && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full h-full mx-0 my-0 overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold">Payroll History</h3>
              <button
                  onClick={() => setShowHistory(false)}
                  className="text-gray-400 hover:text-gray-600"
              >
                  <X className="h-6 w-6" />
              </button>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Period</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employees</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Gross</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Net</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Processed By</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {payrollHistory.map((record) => (
                      <tr key={record.id}>
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">{record.date}</td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">{record.period}</td>
                        <td className="px-3 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            record.status === 'processed' ? 'bg-green-100 text-green-800' :
                            record.status === 'approved' ? 'bg-blue-100 text-blue-800' :
                            record.status === 'calculated' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {record.status}
                          </span>
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">{record.totalEmployees}</td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(record.totalGross)}</td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(record.totalNet)}</td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">{record.processedBy}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Bank Payment Modal */}
        {showBankPayment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full h-full mx-0 my-0 overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold">Bank Payment Records</h3>
              <button
                  onClick={() => setShowBankPayment(false)}
                  className="text-gray-400 hover:text-gray-600"
              >
                  <X className="h-6 w-6" />
              </button>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bank Account</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bank Name</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reference</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {bankPaymentRecords.map((record) => (
                      <tr key={record.employeeId}>
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">{record.employeeName}</td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">{record.bankAccount}</td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">{record.bankName}</td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(record.amount)}</td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">{record.reference}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Bulk Upload Modal */}
        {showBulkUpload && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold">Bulk Upload Employee Data</h3>
              <button
                  onClick={() => setShowBulkUpload(false)}
                  className="text-gray-400 hover:text-gray-600"
              >
                  <X className="h-6 w-6" />
              </button>
              </div>
              
              <div className="mb-6">
                <p className="text-gray-600 mb-4">
                  Upload an Excel file with employee payroll data. Use the template format for best results.
                </p>
                
                <div className="flex items-center space-x-4 mb-4">
              <button
                    onClick={generateTemplate}
                    className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors flex items-center"
              >
                    <FileText className="h-4 w-4 mr-2" />
                    Download Template
              </button>
                  <span className="text-sm text-gray-500">Download the template first to see the required format</span>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Excel File
                </label>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleBulkUpload}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {uploadedFile && (
                  <p className="mt-2 text-sm text-green-600">
                    Selected: {uploadedFile.name}
                  </p>
                )}
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowBulkUpload(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                >
                Cancel
              </button>
                <button
                  onClick={processBulkUpload}
                  disabled={!uploadedFile}
                  className={`px-4 py-2 rounded-md transition-colors ${
                    uploadedFile
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  Upload & Process
                </button>
            </div>
          </div>
        </div>
        )}

        {/* Audit Logs Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Clock className="h-6 w-6 text-blue-600 mr-3" />
              <h2 className="text-xl font-semibold text-gray-900">Audit Logs</h2>
            </div>
            <button
              onClick={exportAuditLogsToPDF}
              className="text-sm text-blue-600 hover:text-blue-700 px-3 py-1 rounded-md hover:bg-blue-50 flex items-center"
            >
              <Download className="h-4 w-4 mr-1" />
              Export PDF
            </button>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {auditLogs.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No audit logs yet</p>
            ) : (
              auditLogs.slice(0, 10).map((log) => (
                <div key={log.id} className="p-3 border-b border-gray-100 last:border-b-0">
                  <div className="flex items-start space-x-3">
                    <div className={`w-3 h-3 rounded-full mt-1 ${
                      log.type === 'success' ? 'bg-green-500' :
                      log.type === 'warning' ? 'bg-yellow-500' :
                      log.type === 'error' ? 'bg-red-500' :
                      'bg-blue-500'
                    }`}></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900">{log.action}</p>
                        <p className="text-xs text-gray-400">{new Date(log.timestamp).toLocaleTimeString()}</p>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{log.details}</p>
                      <p className="text-xs text-gray-400 mt-1">By: {log.user}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Approve Payroll Button */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Payroll Approval</h2>
              <p className="text-gray-600 mt-1">
                {isApproved 
                  ? 'Payroll has been approved and is ready for bank payment generation'
                  : 'Review all payroll details and approve to proceed with bank payment generation'
                }
              </p>
            </div>
            <button
              onClick={approvePayroll}
              disabled={isApproved || !allChecklistItemsChecked}
              className={`px-6 py-3 rounded-md text-sm font-medium transition-colors flex items-center ${
                isApproved
                  ? 'bg-green-600 text-white cursor-not-allowed'
                  : allChecklistItemsChecked
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isApproved ? (
                <>
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Approved
                </>
              ) : (
                <>
                  <CheckSquare className="h-5 w-5 mr-2" />
                  Approve Payroll
                </>
              )}
            </button>
          </div>
        </div>

        {/* Create Payroll Run Modal */}
        {showCreateRunModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Create Payroll Run</h3>
                <button
                  onClick={() => setShowCreateRunModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Run Name *
                  </label>
                  <input
                    type="text"
                    value={payrollRunName}
                    onChange={(e) => setPayrollRunName(e.target.value)}
                    placeholder="e.g., September 2025 Payroll"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pay Period Start *
                  </label>
                  <input
                    type="date"
                    value={payPeriodStart}
                    onChange={(e) => setPayPeriodStart(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pay Period End *
                  </label>
                  <input
                    type="date"
                    value={payPeriodEnd}
                    onChange={(e) => setPayPeriodEnd(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowCreateRunModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreatePayrollRun}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Create Run
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Payroll History Search Modal */}
        {showPayrollHistory && (
          <PayrollHistorySearch
            onClose={handleClosePayrollHistory}
            onViewDetails={handleViewPayrollDetails}
          />
        )}

        {/* Payroll Details View Modal */}
        {showPayrollDetails && selectedPayrollRunId && (
          <PayrollDetailsView
            payrollRunId={selectedPayrollRunId}
            onClose={handleClosePayrollDetails}
          />
        )}
      </div>
    </Layout>
  );
};

export default PayrollManagement;
