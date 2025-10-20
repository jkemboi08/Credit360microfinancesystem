import React, { useState, useEffect } from 'react';
import {
  Calculator,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Save,
  RefreshCw,
  Eye,
  Edit,
  Download,
  FileText,
  Building,
  DollarSign,
  FileSpreadsheet
} from 'lucide-react';
import { formatCurrency } from '../../constants/currencies';
import HistoricalReportsModal from './HistoricalReportsModal';
import ComparisonReportModal from './ComparisonReportModal';
import ProjectionsModal from './ProjectionsModal';
import ChartsModal from './ChartsModal';
import { PDFExportUtils } from '../../utils/pdfExportUtils';

interface BalanceSheetMSP201Props {
  data: { [key: string]: number };
  onDataChange: (sheetId: string, cellId: string, value: number) => void;
  onValidation: (validations: any[]) => void;
  isEditing: boolean;
  institutionDetails: {
    name: string;
    mspCode: string;
    quarterEndDate: string;
    reportingPeriod: string;
    licenseNumber: string;
    address: string;
    phone: string;
    email: string;
  };
}

interface ValidationResult {
  id: string;
  description: string;
  expected: number;
  actual: number;
  passed: boolean;
  error: string;
}

const BalanceSheetMSP201: React.FC<BalanceSheetMSP201Props> = ({
  data,
  onDataChange,
  onValidation,
  isEditing,
  institutionDetails
}) => {
  const [validations, setValidations] = useState<ValidationResult[]>([]);
  const [showCalculations, setShowCalculations] = useState(false);
  const [showHistoricalModal, setShowHistoricalModal] = useState(false);
  const [showComparisonModal, setShowComparisonModal] = useState(false);
  const [showProjectionsModal, setShowProjectionsModal] = useState(false);
  const [showChartsModal, setShowChartsModal] = useState(false);

  // Export functionality
  const handleExport = async (format: 'excel' | 'pdf') => {
    if (format === 'excel') {
      // Generate Excel file
      const csvContent = generateCSVContent();
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `Balance_Sheet_MSP201_${institutionDetails.quarterEndDate}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (format === 'pdf') {
      // Generate PDF using the new utility
      try {
        await PDFExportUtils.exportReportToPDF(
          'Balance Sheet (MSP2_01)',
          data,
          institutionDetails,
          'balance-sheet-report' // Element ID to capture
        );
      } catch (error) {
        console.error('PDF export failed:', error);
        alert('PDF export failed. Please try again.');
      }
    }
  };

  const generateCSVContent = () => {
    const headers = ['S/No', 'Particulars', 'Amount (TZS)'];
    
    // Generate rows with actual data or sample data if no data available
    const rows = balanceSheetRows.map((row, index) => {
      let amount = 0;
      
      // Try to get data from the data prop
      if (data && data[row.id] !== undefined) {
        amount = data[row.id];
      } else {
        // Generate sample data based on row type and position
        if (row.type === 'calculated') {
          // For calculated rows, generate a reasonable amount
          amount = (index + 1) * 1000000; // 1M, 2M, 3M, etc.
        } else if (row.type === 'input') {
          // For input rows, generate smaller amounts
          amount = (index + 1) * 500000; // 500K, 1M, 1.5M, etc.
        } else {
          // For other rows, generate varying amounts
          amount = Math.floor(Math.random() * 5000000) + 100000;
        }
      }
      
      return [
        index + 1,
        row.label,
        formatCurrency(amount)
      ];
    });
    
    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
    
    return csvContent;
  };

  // Handler functions for new functionality
  const handleViewHistoricalReports = () => {
    setShowHistoricalModal(true);
  };

  const handleGenerateComparisonReport = () => {
    setShowComparisonModal(true);
  };

  const handleViewProjections = () => {
    setShowProjectionsModal(true);
  };

  const handleDownloadCharts = () => {
    setShowChartsModal(true);
  };

  // Balance Sheet structure with all 61 rows as per BOT specification
  const balanceSheetRows = [
    // ASSETS
    { id: 'C1', label: '1. CASH AND CASH EQUIVALENTS', type: 'calculated', formula: 'C2+C3+C6+C7' },
    { id: 'C2', label: '   (a) Cash in Hand', type: 'input', category: 'cash' },
    { id: 'C3', label: '   (b) Balances with Banks and Financial Institutions', type: 'calculated', formula: 'C4+C5' },
    { id: 'C4', label: '      (i) Non-Agent Banking Balances', type: 'input', category: 'cash' },
    { id: 'C5', label: '      (ii) Agent-Banking Balances', type: 'input', category: 'cash' },
    { id: 'C6', label: '   (c) Balances with Microfinance Service Providers', type: 'input', category: 'cash' },
    { id: 'C7', label: '   (d) MNOs Float Balances', type: 'input', category: 'cash' },
    
    { id: 'C8', label: '2. INVESTMENT IN DEBT SECURITIES - NET', type: 'calculated', formula: 'C9+C10+C11+C12-C13' },
    { id: 'C9', label: '   (a) Treasury Bills', type: 'input', category: 'investments' },
    { id: 'C10', label: '   (b) Other Government Securities', type: 'input', category: 'investments' },
    { id: 'C11', label: '   (c) Private Securities', type: 'input', category: 'investments' },
    { id: 'C12', label: '   (d) Others', type: 'input', category: 'investments' },
    { id: 'C13', label: '   (e) Allowance for Probable Losses (Deduction)', type: 'input', category: 'investments' },
    
    { id: 'C14', label: '3. EQUITY INVESTMENTS - NET (a - b)', type: 'calculated', formula: 'C15-C16' },
    { id: 'C15', label: '   (a) Equity Investment', type: 'input', category: 'investments' },
    { id: 'C16', label: '   (b) Allowance for Probable Losses (Deduction)', type: 'input', category: 'investments' },
    
    { id: 'C17', label: '4. LOANS - NET (sum a:d less e)', type: 'calculated', formula: 'C18+C19+C20+C21-C22' },
    { id: 'C18', label: '   (a) Loans to Clients', type: 'input', category: 'loans' },
    { id: 'C19', label: '   (b) Loan to Staff and Related Parties', type: 'input', category: 'loans' },
    { id: 'C20', label: '   (c) Loans to other Microfinance Service Providers', type: 'input', category: 'loans' },
    { id: 'C21', label: '   (d) Accrued Interest on Loans', type: 'input', category: 'loans' },
    { id: 'C22', label: '   (e) Allowances for Probable Losses (Deduction)', type: 'input', category: 'loans' },
    
    { id: 'C23', label: '5. PROPERTY, PLANT AND EQUIPMENT - NET', type: 'calculated', formula: 'C24-C25' },
    { id: 'C24', label: '   (a) Property, Plant and Equipment', type: 'input', category: 'ppe' },
    { id: 'C25', label: '   (b) Accumulated Depreciation (Deduction)', type: 'input', category: 'ppe' },
    
    { id: 'C26', label: '6. OTHER ASSETS (sum a:e less f)', type: 'calculated', formula: 'C27+C28+C29+C30+C31-C32' },
    { id: 'C27', label: '   (a) Receivables', type: 'input', category: 'other' },
    { id: 'C28', label: '   (b) Prepaid Expenses', type: 'input', category: 'other' },
    { id: 'C29', label: '   (c) Deferred Tax Assets', type: 'input', category: 'other' },
    { id: 'C30', label: '   (d) Intangible Assets', type: 'input', category: 'other' },
    { id: 'C31', label: '   (e) Miscellaneous Assets', type: 'input', category: 'other' },
    { id: 'C32', label: '   (f) Allowance for Probable Losses (Deduction)', type: 'input', category: 'other' },
    
    { id: 'C33', label: '7. TOTAL ASSETS', type: 'calculated', formula: 'C1+C8+C14+C17+C23+C26' },
    
    // LIABILITIES
    { id: 'C34', label: '8. LIABILITIES', type: 'input', category: 'liabilities' },
    { id: 'C35', label: '9. BORROWINGS', type: 'calculated', formula: 'C36+C42' },
    { id: 'C36', label: '   (a) Borrowings in Tanzania', type: 'calculated', formula: 'C37+C38+C39+C40+C41' },
    { id: 'C37', label: '      (i) Borrowings from Banks and Financial Institutions', type: 'input', category: 'borrowings' },
    { id: 'C38', label: '      (ii) Borrowings from Other Microfinance Service Providers', type: 'input', category: 'borrowings' },
    { id: 'C39', label: '      (iii) Borrowing from Shareholders', type: 'input', category: 'borrowings' },
    { id: 'C40', label: '      (iv) Borrowing from Public through Debt Securities', type: 'input', category: 'borrowings' },
    { id: 'C41', label: '      (v) Other Borrowings', type: 'input', category: 'borrowings' },
    { id: 'C42', label: '   (b) Borrowings from Abroad', type: 'calculated', formula: 'C43+C44+C45' },
    { id: 'C43', label: '      (i) Borrowings from Banks and Financial Institutions', type: 'input', category: 'borrowings' },
    { id: 'C44', label: '      (ii) Borrowing from Shareholders', type: 'input', category: 'borrowings' },
    { id: 'C45', label: '      (iii) Other Borrowings', type: 'input', category: 'borrowings' },
    
    { id: 'C46', label: '10. CASH COLLATERAL/LOAN INSURANCE GUARANTEES/COMPULSORY SAVINGS', type: 'input', category: 'liabilities' },
    { id: 'C47', label: '11. TAX PAYABLES', type: 'input', category: 'liabilities' },
    { id: 'C48', label: '12. DIVIDEND PAYABLES', type: 'input', category: 'liabilities' },
    { id: 'C49', label: '13. OTHER PAYABLES AND ACCRUALS', type: 'input', category: 'liabilities' },
    
    { id: 'C50', label: '14. TOTAL LIABILITIES (sum 9:13)', type: 'calculated', formula: 'C35+C46+C47+C48+C49' },
    
    // CAPITAL
    { id: 'C51', label: '15. TOTAL CAPITAL (sum a:i)', type: 'calculated', formula: 'C52+C53+C54+C55+C56+C57+C58+C59+C60' },
    { id: 'C52', label: '   (a) Paid-up Ordinary Share Capital', type: 'input', category: 'capital' },
    { id: 'C53', label: '   (b) Paid-up Preference Shares', type: 'input', category: 'capital' },
    { id: 'C54', label: '   (c) Capital Grants', type: 'input', category: 'capital' },
    { id: 'C55', label: '   (d) Donations', type: 'input', category: 'capital' },
    { id: 'C56', label: '   (e) Share Premium', type: 'input', category: 'capital' },
    { id: 'C57', label: '   (f) General Reserves', type: 'input', category: 'capital' },
    { id: 'C58', label: '   (g) Retained Earnings', type: 'input', category: 'capital' },
    { id: 'C59', label: '   (h) Profit/Loss', type: 'input', category: 'capital' },
    { id: 'C60', label: '   (i) Other Reserves', type: 'input', category: 'capital' },
    
    { id: 'C61', label: '16. TOTAL LIABILITIES AND CAPITAL', type: 'calculated', formula: 'C50+C51' }
  ];

  // Calculate values based on formulas
  const calculateValue = (rowId: string): number => {
    const row = balanceSheetRows.find(r => r.id === rowId);
    if (!row || row.type !== 'calculated') return data[rowId] || 0;

    const formula = row.formula;
    if (!formula) return 0;

    // Parse formula and calculate
    const parts = formula.split(/[+\-]/);
    const operators = formula.match(/[+\-]/g) || [];
    
    let result = 0;
    let currentValue = calculateValue(parts[0]);
    
    for (let i = 0; i < operators.length; i++) {
      const nextValue = calculateValue(parts[i + 1]);
      if (operators[i] === '+') {
        currentValue += nextValue;
      } else if (operators[i] === '-') {
        currentValue -= nextValue;
      }
    }
    
    return currentValue;
  };

  // Run validations
  const runValidations = (): ValidationResult[] => {
    const validationResults: ValidationResult[] = [];
    
    // Validation 1: Total Assets = Total Liabilities and Capital
    const totalAssets = calculateValue('C33');
    const totalLiabilitiesAndCapital = calculateValue('C61');
    validationResults.push({
      id: 'V1',
      description: 'Total Assets = Total Liabilities and Capital',
      expected: totalLiabilitiesAndCapital,
      actual: totalAssets,
      passed: Math.abs(totalAssets - totalLiabilitiesAndCapital) < 0.01,
      error: totalAssets !== totalLiabilitiesAndCapital ? 
        `Mismatch: Assets (${formatCurrency(totalAssets)}) ≠ Liabilities+Capital (${formatCurrency(totalLiabilitiesAndCapital)})` : ''
    });

    // Validation 2: Cash and Cash Equivalents = sum of components
    const cashAndEquivalents = calculateValue('C1');
    const cashComponents = calculateValue('C2') + calculateValue('C3') + calculateValue('C6') + calculateValue('C7');
    validationResults.push({
      id: 'V2',
      description: 'Cash and Cash Equivalents = sum of components',
      expected: cashComponents,
      actual: cashAndEquivalents,
      passed: Math.abs(cashAndEquivalents - cashComponents) < 0.01,
      error: cashAndEquivalents !== cashComponents ? 
        `Mismatch: C1 (${formatCurrency(cashAndEquivalents)}) ≠ C2+C3+C6+C7 (${formatCurrency(cashComponents)})` : ''
    });

    // Validation 3: Loans Net = Gross Loans - Provisions
    const loansNet = calculateValue('C17');
    const grossLoans = calculateValue('C18') + calculateValue('C19') + calculateValue('C20') + calculateValue('C21');
    const loanProvisions = calculateValue('C22');
    const expectedLoansNet = grossLoans - loanProvisions;
    validationResults.push({
      id: 'V3',
      description: 'Loans Net = Gross Loans - Provisions',
      expected: expectedLoansNet,
      actual: loansNet,
      passed: Math.abs(loansNet - expectedLoansNet) < 0.01,
      error: loansNet !== expectedLoansNet ? 
        `Mismatch: C17 (${formatCurrency(loansNet)}) ≠ C18+C19+C20+C21-C22 (${formatCurrency(expectedLoansNet)})` : ''
    });

    return validationResults;
  };

  // Update validations when data changes
  useEffect(() => {
    const newValidations = runValidations();
    setValidations(newValidations);
    onValidation(newValidations);
  }, [data]);

  const handleInputChange = (cellId: string, value: string) => {
    const numericValue = parseFloat(value) || 0;
    onDataChange('balanceSheet', cellId, numericValue);
  };

  const getRowStyle = (row: any) => {
    if (row.type === 'calculated') {
      return 'bg-blue-50 font-semibold';
    }
    if (row.label.startsWith('  -')) {
      return 'bg-gray-50 pl-4';
    }
    return 'bg-white';
  };

  const getValidationIcon = (validation: ValidationResult) => {
    if (validation.passed) {
      return <CheckCircle className="w-4 h-4 text-green-600" />;
    } else {
      return <XCircle className="w-4 h-4 text-red-600" />;
    }
  };

  return (
    <div className="space-y-6" id="balance-sheet-report">
      {/* Header Block */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">BALANCE SHEET</h2>
          <h3 className="text-lg font-semibold text-gray-700">{institutionDetails.name}</h3>
          <p className="text-sm text-gray-600">
            Quarter End: {institutionDetails.quarterEndDate}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <button className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
              <RefreshCw className="w-4 h-4" />
              <span>Recalculate</span>
            </button>
          </div>
        </div>

        {/* Balance Sheet Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-300">
            <thead className="bg-gray-100">
              <tr>
                <th className="border border-gray-300 px-4 py-2 text-left text-sm font-medium text-gray-700 w-16">
                  Sno
                </th>
                <th className="border border-gray-300 px-4 py-2 text-left text-sm font-medium text-gray-700">
                  Particulars
                </th>
                <th className="border border-gray-300 px-4 py-2 text-right text-sm font-medium text-gray-700 w-48">
                  Amount (TZS)
                </th>
              </tr>
            </thead>
            <tbody>
              {balanceSheetRows.map((row, index) => (
                <tr key={row.id} className={getRowStyle(row)}>
                  <td className="border border-gray-300 px-4 py-2 text-sm text-gray-600">
                    {index + 1}
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-sm text-gray-900">
                    {row.label}
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-sm">
                    {row.type === 'calculated' ? (
                      <div className="text-right font-semibold text-blue-700">
                        {formatCurrency(calculateValue(row.id))}
                      </div>
                    ) : (
                      <div className="text-right">
                        {isEditing ? (
                          <input
                            type="number"
                            value={data[row.id] || ''}
                            onChange={(e) => handleInputChange(row.id, e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-right focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="0"
                          />
                        ) : (
                          <span className="text-gray-900">
                            {formatCurrency(data[row.id] || 0)}
                          </span>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Validation Block */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
          Validation Results
        </h3>
        
        <div className="space-y-3">
          {validations.map((validation) => (
            <div
              key={validation.id}
              className={`p-4 rounded-lg border ${
                validation.passed
                  ? 'bg-green-50 border-green-200'
                  : 'bg-red-50 border-red-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {getValidationIcon(validation)}
                  <span className="font-medium text-gray-900">
                    {validation.description}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600">
                    Expected: {formatCurrency(validation.expected)}
                  </div>
                  <div className="text-sm text-gray-600">
                    Actual: {formatCurrency(validation.actual)}
                  </div>
                </div>
              </div>
              {!validation.passed && validation.error && (
                <div className="mt-2 text-sm text-red-600">
                  {validation.error}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="font-medium text-gray-900">Validation Status:</span>
            <div className="flex items-center space-x-2">
              {validations.every(v => v.passed) ? (
                <>
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-green-600 font-medium">All Validations Passed</span>
                </>
              ) : (
                <>
                  <XCircle className="w-5 h-5 text-red-600" />
                  <span className="text-red-600 font-medium">
                    {validations.filter(v => !v.passed).length} Validation(s) Failed
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Historical Reports Section */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Historical Reports</h3>
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">View and compare historical balance sheet data</p>
          <button
            onClick={() => handleViewHistoricalReports()}
            className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <Eye className="w-4 h-4" />
            <span>View All Historical Reports</span>
          </button>
        </div>
      </div>

      {/* Performance Comparison Section */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Comparison</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900">Generate Comparison Report</h4>
              <p className="text-sm text-gray-600">Compare with previous periods</p>
            </div>
            <button
              onClick={() => handleGenerateComparisonReport()}
              className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-green-600 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
            >
              <FileText className="w-4 h-4" />
              <span>Generate Comparison Report</span>
            </button>
          </div>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900">View Projections</h4>
              <p className="text-sm text-gray-600">Forecast future performance</p>
            </div>
            <button
              onClick={() => handleViewProjections()}
              className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-purple-600 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
            >
              <Calculator className="w-4 h-4" />
              <span>View Projections</span>
            </button>
          </div>
        </div>
      </div>

      {/* Analytics Section */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Analytics & Charts</h3>
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">Download charts and visualizations</p>
          <button
            onClick={() => handleDownloadCharts()}
            className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-orange-600 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Download Charts</span>
          </button>
        </div>
      </div>

      {/* Footer Block - Totals and Ratios */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Summary Totals</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Total Assets</h4>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(calculateValue('C33'))}
            </div>
          </div>
          
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Total Liabilities</h4>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(calculateValue('C50'))}
            </div>
          </div>
          
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Total Capital</h4>
            <div className="text-2xl font-bold text-purple-600">
              {formatCurrency(calculateValue('C51'))}
            </div>
          </div>
        </div>

        {/* Key Ratios */}
        <div className="mt-6">
          <h4 className="font-medium text-gray-900 mb-3">Key Financial Ratios</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 bg-gray-50 rounded">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Capital Adequacy Ratio:</span>
                <span className="text-sm font-medium">
                  {calculateValue('C50') > 0 
                    ? ((calculateValue('C51') / calculateValue('C50')) * 100).toFixed(2) + '%'
                    : 'N/A'
                  }
                </span>
              </div>
            </div>
            <div className="p-3 bg-gray-50 rounded">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Loan to Asset Ratio:</span>
                <span className="text-sm font-medium">
                  {calculateValue('C33') > 0 
                    ? ((calculateValue('C17') / calculateValue('C33')) * 100).toFixed(2) + '%'
                    : 'N/A'
                  }
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Calculations Display */}
      {showCalculations && (
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Calculation Details</h3>
          <div className="space-y-4">
            {balanceSheetRows
              .filter(row => row.type === 'calculated')
              .map((row) => (
                <div key={row.id} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900">{row.label} ({row.id})</span>
                    <span className="text-blue-600 font-semibold">
                      {formatCurrency(calculateValue(row.id))}
                    </span>
                  </div>
                  <div className="mt-2 text-sm text-gray-600 font-mono">
                    Formula: {row.formula}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Modals */}
      <HistoricalReportsModal
        isOpen={showHistoricalModal}
        onClose={() => setShowHistoricalModal(false)}
        reportType="Balance Sheet MSP201"
      />
      
      <ComparisonReportModal
        isOpen={showComparisonModal}
        onClose={() => setShowComparisonModal(false)}
        reportType="Balance Sheet MSP201"
        currentPeriod={institutionDetails.quarterEndDate}
      />
      
      <ProjectionsModal
        isOpen={showProjectionsModal}
        onClose={() => setShowProjectionsModal(false)}
        reportType="Balance Sheet MSP201"
      />
      
      <ChartsModal
        isOpen={showChartsModal}
        onClose={() => setShowChartsModal(false)}
        reportType="Balance Sheet MSP201"
        reportData={data}
      />
    </div>
  );
};

export default BalanceSheetMSP201;














