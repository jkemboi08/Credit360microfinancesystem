// Payroll Management Page
// Comprehensive payroll processing interface matching the screenshot

import React, { useState, useEffect } from 'react';
import { useSupabaseAuth } from '../context/SupabaseAuthContext';
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
  Settings
} from 'lucide-react';

interface Employee {
  id: string;
  name: string;
  basicSalary: number;
  housing: number;
  transport: number;
  arrears: number;
  otherAllowance: number;
  grossPay: number;
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

const PayrollManagement: React.FC = () => {
  const { user, isAuthenticated } = useSupabaseAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [summary, setSummary] = useState<PayrollSummary>({
    totalGross: 0,
    totalHesbl: 0,
    totalSdl: 0,
    totalAllowances: 0,
    totalOtherDeduction: 0,
    totalPaye: 0,
    totalNssfER: 0,
    totalNssfEE: 0,
    totalWcf: 0,
    totalNetSalary: 0
  });
  const [preProcessingChecks, setPreProcessingChecks] = useState({
    verifyAttendance: false,
    validateDeductions: false,
    confirmLeaveRecords: false,
    processHiresTerminations: false
  });
  const [currentWorkflowStep, setCurrentWorkflowStep] = useState(1);
  const [isCalculating, setIsCalculating] = useState(false);
  
  // New state for enhanced features
  const [activeTab, setActiveTab] = useState('payroll');
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [exceptions, setExceptions] = useState<any[]>([]);
  const [auditLog, setAuditLog] = useState<any[]>([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [payeBrackets, setPayeBrackets] = useState([
    { from: 0, to: 310000, rate: 0, fixedAmount: 0 },
    { from: 310001, to: 840000, rate: 8, fixedAmount: 0 },
    { from: 840001, to: 1340000, rate: 20, fixedAmount: 42400 },
    { from: 1340001, to: 1840000, rate: 25, fixedAmount: 142400 },
    { from: 1840001, to: Infinity, rate: 30, fixedAmount: 267400 }
  ]);

  useEffect(() => {
    loadPayrollData();
    loadExceptions();
    loadAuditLog();
  }, []);

  // Enhanced functions
  const loadExceptions = () => {
    // Simulate loading exceptions
    const sampleExceptions = [
      {
        id: 1,
        employeeId: '1',
        employeeName: 'Aisha Juma',
        type: 'high_deduction',
        message: 'Loan deduction exceeds 30% of gross salary',
        severity: 'high',
        amount: 100000,
        threshold: 750000,
        status: 'pending'
      },
      {
        id: 2,
        employeeId: '2',
        employeeName: 'John Mwamba',
        type: 'missing_attendance',
        message: 'No attendance records for the last 7 days',
        severity: 'medium',
        amount: 0,
        threshold: 0,
        status: 'pending'
      }
    ];
    setExceptions(sampleExceptions);
  };

  const loadAuditLog = () => {
    // Simulate loading audit log
    const sampleAuditLog = [
      {
        id: 1,
        timestamp: new Date().toISOString(),
        user: user?.name || 'System',
        action: 'payroll_calculation_started',
        details: 'Payroll calculation initiated for September 2025',
        status: 'success'
      },
      {
        id: 2,
        timestamp: new Date(Date.now() - 300000).toISOString(),
        user: user?.name || 'System',
        action: 'employee_data_updated',
        details: 'Aisha Juma salary updated from 2,500,000 to 2,600,000',
        status: 'success'
      }
    ];
    setAuditLog(sampleAuditLog);
  };

  const addAuditLogEntry = (action: string, details: string, status: string = 'success') => {
    const newEntry = {
      id: auditLog.length + 1,
      timestamp: new Date().toISOString(),
      user: user?.name || 'System',
      action,
      details,
      status
    };
    setAuditLog(prev => [newEntry, ...prev]);
  };

  const handleEditEmployee = (employee: Employee) => {
    setEditingEmployee(employee);
    setShowEditModal(true);
    addAuditLogEntry('employee_edit_opened', `Edit opened for ${employee.name}`, 'info');
  };

  const handleSaveEmployee = (updatedEmployee: Employee) => {
    setEmployees(prev => prev.map(emp => 
      emp.id === updatedEmployee.id ? updatedEmployee : emp
    ));
    setShowEditModal(false);
    setEditingEmployee(null);
    addAuditLogEntry('employee_data_saved', `Updated payroll data for ${updatedEmployee.name}`, 'success');
    
    // Recalculate payroll
    calculatePayroll();
  };

  const checkExceptions = (employee: Employee) => {
    const newExceptions: any[] = [];
    
    // Check for high deductions
    const totalDeductions = employee.paye + employee.nssfEE + employee.hesbl + employee.loan + employee.salaryAdvance + employee.otherDeduction;
    const deductionPercentage = (totalDeductions / employee.grossPay) * 100;
    
    if (deductionPercentage > 30) {
      newExceptions.push({
        id: Date.now(),
        employeeId: employee.id,
        employeeName: employee.name,
        type: 'high_deduction',
        message: `Deductions (${deductionPercentage.toFixed(1)}%) exceed 30% threshold`,
        severity: 'high',
        amount: totalDeductions,
        threshold: employee.grossPay * 0.3,
        status: 'pending'
      });
    }
    
    // Check for negative net salary
    if (employee.netSalary < 0) {
      newExceptions.push({
        id: Date.now() + 1,
        employeeId: employee.id,
        employeeName: employee.name,
        type: 'negative_net_salary',
        message: 'Net salary is negative',
        severity: 'critical',
        amount: employee.netSalary,
        threshold: 0,
        status: 'pending'
      });
    }
    
    return newExceptions;
  };

  const loadPayrollData = () => {
    // Sample employee data matching the screenshot
    const sampleEmployees: Employee[] = [
      {
        id: '1',
        name: 'Aisha Juma',
        basicSalary: 2500000,
        housing: 375000,
        transport: 100000,
        arrears: 0,
        otherAllowance: 0,
        grossPay: 0,
        paye: 0,
        nssfEE: 0,
        hesbl: 0,
        loan: 100000,
        salaryAdvance: 0,
        otherDeduction: 0,
        netSalary: 0,
        nssfER: 0,
        wcfER: 0,
        sdlER: 0
      },
      {
        id: '2',
        name: 'John Doe',
        basicSalary: 3500000,
        housing: 525000,
        transport: 100000,
        arrears: 0,
        otherAllowance: 0,
        grossPay: 0,
        paye: 0,
        nssfEE: 0,
        hesbl: 300000,
        loan: 0,
        salaryAdvance: 200000,
        otherDeduction: 0,
        netSalary: 0,
        nssfER: 0,
        wcfER: 0,
        sdlER: 0
      },
      {
        id: '3',
        name: 'David Mwangi',
        basicSalary: 1800000,
        housing: 270000,
        transport: 100000,
        arrears: 50000,
        otherAllowance: 0,
        grossPay: 0,
        paye: 0,
        nssfEE: 0,
        hesbl: 0,
        loan: 50000,
        salaryAdvance: 0,
        otherDeduction: 0,
        netSalary: 0,
        nssfER: 0,
        wcfER: 0,
        sdlER: 0
      },
      {
        id: '4',
        name: 'Catherine Mboya',
        basicSalary: 4500000,
        housing: 675000,
        transport: 150000,
        arrears: 0,
        otherAllowance: 0,
        grossPay: 0,
        paye: 0,
        nssfEE: 0,
        hesbl: 0,
        loan: 200000,
        salaryAdvance: 0,
        otherDeduction: 0,
        netSalary: 0,
        nssfER: 0,
        wcfER: 0,
        sdlER: 0
      },
      {
        id: '5',
        name: 'Eva Green',
        basicSalary: 3800000,
        housing: 570000,
        transport: 120000,
        arrears: 0,
        otherAllowance: 0,
        grossPay: 0,
        paye: 0,
        nssfEE: 0,
        hesbl: 0,
        loan: 0,
        salaryAdvance: 0,
        otherDeduction: 0,
        netSalary: 0,
        nssfER: 0,
        wcfER: 0,
        sdlER: 0
      }
    ];

    setEmployees(sampleEmployees);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const handlePreProcessingCheck = (check: string) => {
    setPreProcessingChecks(prev => ({
      ...prev,
      [check]: !prev[check as keyof typeof prev]
    }));
  };

  const calculatePayroll = async () => {
    setIsCalculating(true);
    addAuditLogEntry('payroll_calculation_started', 'Payroll calculation initiated', 'info');
    
    // Simulate calculation delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Calculate payroll for each employee
    const updatedEmployees = employees.map(emp => {
      const grossPay = emp.basicSalary + emp.housing + emp.transport + emp.arrears + emp.otherAllowance;
      const paye = calculatePAYE(grossPay);
      const nssfEE = calculateNSSF(grossPay);
      const totalDeductions = paye + nssfEE + emp.hesbl + emp.loan + emp.salaryAdvance + emp.otherDeduction;
      const netSalary = grossPay - totalDeductions;
      const nssfER = calculateNSSFEmployer(grossPay);
      const wcfER = calculateWCF(grossPay);
      const sdlER = calculateSDL(grossPay);

      return {
        ...emp,
        grossPay,
        paye,
        nssfEE,
        netSalary,
        nssfER,
        wcfER,
        sdlER
      };
    });

    setEmployees(updatedEmployees);
    
    // Check for exceptions
    const allExceptions: any[] = [];
    updatedEmployees.forEach(emp => {
      const empExceptions = checkExceptions(emp);
      allExceptions.push(...empExceptions);
    });
    setExceptions(allExceptions);
    
    // Calculate summary totals
    const newSummary: PayrollSummary = {
      totalGross: updatedEmployees.reduce((sum, emp) => sum + emp.grossPay, 0),
      totalHesbl: updatedEmployees.reduce((sum, emp) => sum + emp.hesbl, 0),
      totalSdl: updatedEmployees.reduce((sum, emp) => sum + emp.sdlER, 0),
      totalAllowances: updatedEmployees.reduce((sum, emp) => sum + emp.housing + emp.transport + emp.arrears + emp.otherAllowance, 0),
      totalOtherDeduction: updatedEmployees.reduce((sum, emp) => sum + emp.otherDeduction, 0),
      totalPaye: updatedEmployees.reduce((sum, emp) => sum + emp.paye, 0),
      totalNssfER: updatedEmployees.reduce((sum, emp) => sum + emp.nssfER, 0),
      totalNssfEE: updatedEmployees.reduce((sum, emp) => sum + emp.nssfEE, 0),
      totalWcf: updatedEmployees.reduce((sum, emp) => sum + emp.wcfER, 0),
      totalNetSalary: updatedEmployees.reduce((sum, emp) => sum + emp.netSalary, 0)
    };

    setSummary(newSummary);
    setCurrentWorkflowStep(2);
    setIsCalculating(false);
    
    addAuditLogEntry('payroll_calculation_completed', `Payroll calculated for ${updatedEmployees.length} employees`, 'success');
    if (allExceptions.length > 0) {
      addAuditLogEntry('exceptions_detected', `${allExceptions.length} exceptions found during calculation`, 'warning');
    }
  };

  const calculatePAYE = (grossPay: number): number => {
    // Tanzanian PAYE calculation using proper tax brackets
    for (const bracket of payeBrackets) {
      if (grossPay >= bracket.from && grossPay <= bracket.to) {
        if (bracket.rate === 0) return bracket.fixedAmount;
        return bracket.fixedAmount + ((grossPay - bracket.from) * bracket.rate / 100);
      }
    }
    return 0;
  };

  const calculateNSSF = (grossPay: number): number => {
    // NSSF employee contribution (10% of gross pay, max 1,000,000)
    return Math.min(grossPay * 0.10, 1000000);
  };

  const calculateNSSFEmployer = (grossPay: number): number => {
    // NSSF employer contribution (10% of gross pay, max 1,000,000)
    return Math.min(grossPay * 0.10, 1000000);
  };

  const calculateWCF = (grossPay: number): number => {
    // Workers Compensation Fund (1% of gross pay)
    return grossPay * 0.01;
  };

  const calculateSDL = (grossPay: number): number => {
    // Skills Development Levy (4.5% of gross pay)
    return grossPay * 0.045;
  };

  const allPreProcessingChecksComplete = Object.values(preProcessingChecks).every(check => check);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Payroll Management</h1>
          <p className="text-gray-600 mt-2">Process employee payroll for September 2025</p>
        </div>

        {/* Enhanced Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('payroll')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'payroll'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Calculator className="w-4 h-4 inline mr-2" />
                Payroll Processing
              </button>
              <button
                onClick={() => setActiveTab('exceptions')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'exceptions'
                    ? 'border-red-500 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <AlertTriangle className="w-4 h-4 inline mr-2" />
                Exceptions ({exceptions.length})
              </button>
              <button
                onClick={() => setActiveTab('audit')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'audit'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <FileText className="w-4 h-4 inline mr-2" />
                Audit Log
              </button>
              <button
                onClick={() => setActiveTab('paye')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'paye'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Settings className="w-4 h-4 inline mr-2" />
                PAYE Management
              </button>
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'payroll' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Pre-processing Checklist */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center mb-4">
              <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Pre-processing Checklist</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Ensure all data is accurate before running payroll. All items must be checked to proceed.
            </p>
            
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={preProcessingChecks.verifyAttendance}
                  onChange={() => handlePreProcessingCheck('verifyAttendance')}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Verify Attendance Data (Absences, Overtime)</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={preProcessingChecks.validateDeductions}
                  onChange={() => handlePreProcessingCheck('validateDeductions')}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Validate Loan/Advance Deductions</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={preProcessingChecks.confirmLeaveRecords}
                  onChange={() => handlePreProcessingCheck('confirmLeaveRecords')}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Confirm Leave Records (Unpaid leave)</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={preProcessingChecks.processHiresTerminations}
                  onChange={() => handlePreProcessingCheck('processHiresTerminations')}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Process New Hires & Terminations</span>
              </label>
            </div>
          </div>

          {/* Exceptions */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center mb-4">
              <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Exceptions</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Items requiring review or correction.
            </p>
            
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-center">
                <AlertTriangle className="w-4 h-4 text-red-500 mr-2" />
                <span className="text-sm text-red-700 font-medium">EMP12347: Missing Timesheet Data for 3 days (High)</span>
              </div>
            </div>
          </div>

          {/* Audit Log */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center mb-4">
              <FileText className="w-5 h-5 text-blue-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Audit Log</h3>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Payroll Created</span>
                  <span>Sep 1, 2025</span>
                </div>
                <div className="flex justify-between">
                  <span>Last Modified</span>
                  <span>Sep 15, 2025</span>
                </div>
                <div className="flex justify-between">
                  <span>Status</span>
                  <span className="text-blue-600">Draft</span>
                </div>
              </div>
            </div>
          </div>
        </div>

