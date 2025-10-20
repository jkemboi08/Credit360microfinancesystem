import React, { useState, useEffect } from 'react';
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart3,
  Loader2
} from 'lucide-react';
import { formatCurrency } from '../../constants/currencies';
import IncomeStatementApiService from '../../services/incomeStatementApi';
import { PDFExportUtils } from '../../utils/pdfExportUtils';

interface IncomeStatementMSP202Props {
  data: { [key: string]: { quarterly: number; ytd: number } };
  onDataChange: (sheetId: string, cellId: string, value: { quarterly: number; ytd: number }) => void;
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
  balanceSheetData?: { [key: string]: number };
}

interface ValidationResult {
  id: string;
  description: string;
  expected: number;
  actual: number;
  passed: boolean;
  error: string;
}

const IncomeStatementMSP202: React.FC<IncomeStatementMSP202Props> = ({
  data,
  onDataChange,
  onValidation,
  isEditing,
  institutionDetails,
  balanceSheetData = {}
}) => {
  const [validations, setValidations] = useState<ValidationResult[]>([]);
  const [cmsData, setCmsData] = useState<{ [key: string]: { quarterly: number; ytd: number } }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);


  // Income Statement structure with exact 42 rows as per BOT specification
  const incomeStatementRows = [
    // 1. INTEREST INCOME
    { id: 'C1', label: '1. INTEREST INCOME', type: 'calculated', formula: 'C2+C3+C4+C5+C6', indent: 0 },
    { id: 'C2', label: '   a. Interest - Loans to Clients', type: 'fetched', category: 'interest_income', indent: 1 },
    { id: 'C3', label: '   b. Interest - Loans to Microfinance Service Providers', type: 'fetched', category: 'interest_income', indent: 1 },
    { id: 'C4', label: '   c. Interest - Investments in Govt Securities', type: 'fetched', category: 'interest_income', indent: 1 },
    { id: 'C5', label: '   d. Interest - Bank Deposits', type: 'fetched', category: 'interest_income', indent: 1 },
    { id: 'C6', label: '   e. Interest - Others', type: 'fetched', category: 'interest_income', indent: 1 },
    
    // 2. INTEREST EXPENSE
    { id: 'C7', label: '2. INTEREST EXPENSE', type: 'calculated', formula: 'C8+C9+C10+C11+C12', indent: 0 },
    { id: 'C8', label: '   a. Interest - Borrowings from Banks & Financial Institutions in Tanzania', type: 'fetched', category: 'interest_expense', indent: 1 },
    { id: 'C9', label: '   b. Interest - Borrowing from Microfinance Service Providers in Tanzania', type: 'fetched', category: 'interest_expense', indent: 1 },
    { id: 'C10', label: '   c. Interest - Borrowings from Abroad', type: 'fetched', category: 'interest_expense', indent: 1 },
    { id: 'C11', label: '   d. Interest - Borrowing from Shareholders', type: 'fetched', category: 'interest_expense', indent: 1 },
    { id: 'C12', label: '   e. Interest - Others', type: 'fetched', category: 'interest_expense', indent: 1 },
    
    // 3. NET INTEREST INCOME
    { id: 'C13', label: '3. NET INTEREST INCOME (1 less 2)', type: 'calculated', formula: 'C1-C7', indent: 0 },
    
    // 4. BAD DEBTS WRITTEN OFF
    { id: 'C14', label: '4. BAD DEBTS WRITTEN OFF NOT PROVIDED FOR', type: 'fetched', category: 'bad_debts', indent: 0 },
    
    // 5. PROVISION FOR BAD AND DOUBTFUL DEBTS
    { id: 'C15', label: '5. PROVISION FOR BAD AND DOUBTFUL DEBTS', type: 'fetched', category: 'provisions', indent: 0 },
    
    // 6. NON-INTEREST INCOME
    { id: 'C16', label: '6. NON-INTEREST INCOME', type: 'calculated', formula: 'C17+C18+C19+C20+C21+C22', indent: 0 },
    { id: 'C17', label: '    a. Commissions', type: 'fetched', category: 'non_interest_income', indent: 1 },
    { id: 'C18', label: '    b. Fees', type: 'fetched', category: 'non_interest_income', indent: 1 },
    { id: 'C19', label: '    c. Rental Income on Premises', type: 'fetched', category: 'non_interest_income', indent: 1 },
    { id: 'C20', label: '    d. Dividends on Equity Investment', type: 'fetched', category: 'non_interest_income', indent: 1 },
    { id: 'C21', label: '    e. Income from Recovery of Charged off Assets and Acquired Assets', type: 'fetched', category: 'non_interest_income', indent: 1 },
    { id: 'C22', label: '    f. Other Income', type: 'fetched', category: 'non_interest_income', indent: 1 },
    
    // 7. NON-INTEREST EXPENSES
    { id: 'C23', label: '7. NON-INTEREST EXPENSES', type: 'calculated', formula: 'C24+C25+C26+C27+C28+C29+C30+C31+C32+C33+C34+C35+C36+C37+C38+C39', indent: 0 },
    { id: 'C24', label: '    a. Management Salaries and Benefits', type: 'fetched', category: 'non_interest_expense', indent: 1 },
    { id: 'C25', label: '    b. Employees Salaries and Benefits', type: 'fetched', category: 'non_interest_expense', indent: 1 },
    { id: 'C26', label: '    c. Wages', type: 'fetched', category: 'non_interest_expense', indent: 1 },
    { id: 'C27', label: '    d. Pensions Contributions', type: 'fetched', category: 'non_interest_expense', indent: 1 },
    { id: 'C28', label: '    e. Skills and Development Levy', type: 'fetched', category: 'non_interest_expense', indent: 1 },
    { id: 'C29', label: '    f. Rental Expense on Premises and Equipment', type: 'fetched', category: 'non_interest_expense', indent: 1 },
    { id: 'C30', label: '    g. Depreciation - Premises and Equipment', type: 'fetched', category: 'non_interest_expense', indent: 1 },
    { id: 'C31', label: '    h. Amortization - Leasehold Rights and Equipments', type: 'fetched', category: 'non_interest_expense', indent: 1 },
    { id: 'C32', label: '    i. Foreclosure and Litigation Expenses', type: 'fetched', category: 'non_interest_expense', indent: 1 },
    { id: 'C33', label: '    j. Management Fees', type: 'fetched', category: 'non_interest_expense', indent: 1 },
    { id: 'C34', label: '    k. Auditors Fees', type: 'fetched', category: 'non_interest_expense', indent: 1 },
    { id: 'C35', label: '    l. Taxes', type: 'fetched', category: 'non_interest_expense', indent: 1 },
    { id: 'C36', label: '    m. License Fees', type: 'fetched', category: 'non_interest_expense', indent: 1 },
    { id: 'C37', label: '    n. Insurance', type: 'fetched', category: 'non_interest_expense', indent: 1 },
    { id: 'C38', label: '    o. Utilities Expenses', type: 'fetched', category: 'non_interest_expense', indent: 1 },
    { id: 'C39', label: '    p. Other Non-Interest Expenses', type: 'fetched', category: 'non_interest_expense', indent: 1 },
    
    // 8. NET INCOME BEFORE TAX
    { id: 'C40', label: '8. NET INCOME / (LOSS) BEFORE INCOME TAX (3+6 Less 4,5 and 7)', type: 'calculated', formula: 'C13+C16-C14-C15-C23', indent: 0 },
    
    // 9. INCOME TAX PROVISION
    { id: 'C41', label: '9. INCOME TAX PROVISION', type: 'fetched', category: 'tax', indent: 0 },
    
    // 10. NET INCOME AFTER TAX
    { id: 'C42', label: '10. NET INCOME / (LOSS) AFTER INCOME TAX (8 less 9)', type: 'calculated', formula: 'C40-C41', indent: 0 }
  ];

  // Fetch data from CMS on component mount
  useEffect(() => {
    fetchDataFromCMS();
  }, []);

  // Fetch data from CMS
  const fetchDataFromCMS = async (forceRefresh: boolean = false) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const apiService = IncomeStatementApiService.getInstance();
      const response = await apiService.fetchIncomeStatementData(forceRefresh);
      
      if (response.success) {
        setCmsData(response.data);
        setLastUpdated(response.lastUpdated || new Date().toISOString());
        
        // Update parent component with fetched data
        Object.keys(response.data).forEach(key => {
          onDataChange('incomeStatement', key, response.data[key]);
        });
      } else {
        setError(response.message || 'Failed to fetch data from CMS');
      }
    } catch (err) {
      setError('An error occurred while fetching data from CMS');
      console.error('Error fetching income statement data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh data function
  const handleRefresh = () => {
    fetchDataFromCMS(true);
  };

  // Calculate quarterly values based on formulas or fetched data
  const calculateQuarterlyValue = (rowId: string): number => {
    const row = incomeStatementRows.find(r => r.id === rowId);
    if (!row) return 0;

    // For fetched data, return from CMS
    if (row.type === 'fetched') {
      return cmsData[rowId]?.quarterly || 0;
    }

    // For calculated data, compute using formula
    if (row.type === 'calculated' && row.formula) {
      const formula = row.formula;
      const parts = formula.split(/[+\-]/);
      const operators = formula.match(/[+\-]/g) || [];
      
      let currentValue = calculateQuarterlyValue(parts[0]);
      
      for (let i = 0; i < operators.length; i++) {
        const nextValue = calculateQuarterlyValue(parts[i + 1]);
        if (operators[i] === '+') {
          currentValue += nextValue;
        } else if (operators[i] === '-') {
          currentValue -= nextValue;
        }
      }
      
      return currentValue;
    }

    return 0;
  };

  // Calculate YTD values (fetched from CMS as cumulative)
  const calculateYtdValue = (rowId: string): number => {
    const row = incomeStatementRows.find(r => r.id === rowId);
    if (!row) return 0;

    // For fetched data, return YTD from CMS
    if (row.type === 'fetched') {
      return cmsData[rowId]?.ytd || 0;
    }

    // For calculated data, compute YTD using formula
    if (row.type === 'calculated' && row.formula) {
      const formula = row.formula;
      const parts = formula.split(/[+\-]/);
      const operators = formula.match(/[+\-]/g) || [];
      
      let currentValue = calculateYtdValue(parts[0]);
      
      for (let i = 0; i < operators.length; i++) {
        const nextValue = calculateYtdValue(parts[i + 1]);
        if (operators[i] === '+') {
          currentValue += nextValue;
        } else if (operators[i] === '-') {
          currentValue -= nextValue;
        }
      }
      
      return currentValue;
    }

    return 0;
  };

  // Format currency in TZS with commas and 2 decimals
  const formatTZSCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  // Run validations
  const runValidations = (): ValidationResult[] => {
    const validationResults: ValidationResult[] = [];
    
    // Validation 1: D42 = MSP2_01.C59 (Net Income After Tax YTD = Balance Sheet Retained Earnings)
    const netIncomeAfterTaxYTD = calculateYtdValue('C42');
    const retainedEarnings = balanceSheetData['C59'] || 0; // MSP2_01.C59
    
    validationResults.push({
      id: 'V1',
      description: 'D42 = MSP2_01.C59 (Net Income After Tax YTD = Retained Earnings)',
      expected: retainedEarnings,
      actual: netIncomeAfterTaxYTD,
      passed: Math.abs(netIncomeAfterTaxYTD - retainedEarnings) < 0.01,
      error: Math.abs(netIncomeAfterTaxYTD - retainedEarnings) >= 0.01 ? 
        `Mismatch: D42 (${formatTZSCurrency(netIncomeAfterTaxYTD)}) ≠ MSP2_01.C59 (${formatTZSCurrency(retainedEarnings)})` : ''
    });

    // Validation 2: Interest Income = sum of components
    const interestIncome = calculateQuarterlyValue('C1');
    const interestComponents = calculateQuarterlyValue('C2') + calculateQuarterlyValue('C3') + 
                              calculateQuarterlyValue('C4') + calculateQuarterlyValue('C5') + 
                              calculateQuarterlyValue('C6');
    validationResults.push({
      id: 'V2',
      description: 'Interest Income = sum of components',
      expected: interestComponents,
      actual: interestIncome,
      passed: Math.abs(interestIncome - interestComponents) < 0.01,
      error: Math.abs(interestIncome - interestComponents) >= 0.01 ? 
        `Mismatch: C1 (${formatTZSCurrency(interestIncome)}) ≠ C2+C3+C4+C5+C6 (${formatTZSCurrency(interestComponents)})` : ''
    });

    // Validation 3: Net Interest Income = Interest Income - Interest Expense
    const netInterestIncome = calculateQuarterlyValue('C13');
    const interestIncome2 = calculateQuarterlyValue('C1');
    const interestExpense = calculateQuarterlyValue('C7');
    const expectedNetInterest = interestIncome2 - interestExpense;
    validationResults.push({
      id: 'V3',
      description: 'Net Interest Income = Interest Income - Interest Expense',
      expected: expectedNetInterest,
      actual: netInterestIncome,
      passed: Math.abs(netInterestIncome - expectedNetInterest) < 0.01,
      error: Math.abs(netInterestIncome - expectedNetInterest) >= 0.01 ? 
        `Mismatch: C13 (${formatTZSCurrency(netInterestIncome)}) ≠ C1-C7 (${formatTZSCurrency(expectedNetInterest)})` : ''
    });

    // Validation 4: Net Income After Tax = Net Income Before Tax - Tax Expense
    const netIncomeAfterTax2 = calculateQuarterlyValue('C42');
    const netIncomeBeforeTax = calculateQuarterlyValue('C40');
    const taxExpense = calculateQuarterlyValue('C41');
    const expectedNetIncomeAfterTax = netIncomeBeforeTax - taxExpense;
    validationResults.push({
      id: 'V4',
      description: 'Net Income After Tax = Net Income Before Tax - Tax Expense',
      expected: expectedNetIncomeAfterTax,
      actual: netIncomeAfterTax2,
      passed: Math.abs(netIncomeAfterTax2 - expectedNetIncomeAfterTax) < 0.01,
      error: Math.abs(netIncomeAfterTax2 - expectedNetIncomeAfterTax) >= 0.01 ? 
        `Mismatch: C42 (${formatTZSCurrency(netIncomeAfterTax2)}) ≠ C40-C41 (${formatTZSCurrency(expectedNetIncomeAfterTax)})` : ''
    });

    return validationResults;
  };

  // Update validations when data changes
  useEffect(() => {
    const newValidations = runValidations();
    setValidations(newValidations);
    onValidation(newValidations);
  }, [cmsData, balanceSheetData]);

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

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'interest_income':
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'interest_expense':
        return <TrendingDown className="w-4 h-4 text-red-600" />;
      case 'non_interest_income':
        return <DollarSign className="w-4 h-4 text-blue-600" />;
      case 'non_interest_expense':
        return <AlertTriangle className="w-4 h-4 text-orange-600" />;
      case 'tax':
        return <BarChart3 className="w-4 h-4 text-purple-600" />;
      default:
        return <DollarSign className="w-4 h-4 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6" id="income-statement-report">
      {/* Header Block */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">STATEMENT OF INCOME AND EXPENSE</h2>
          <h3 className="text-lg font-semibold text-gray-700">{institutionDetails.name}</h3>
          <p className="text-sm text-gray-600">
            Quarter End: {institutionDetails.quarterEndDate}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              <span>{isLoading ? 'Refreshing...' : 'Refresh Data'}</span>
            </button>
            {lastUpdated && (
              <div className="text-xs text-gray-500">
                Last updated: {new Date(lastUpdated).toLocaleString()}
              </div>
            )}
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <XCircle className="w-5 h-5 text-red-600 mr-2" />
              <span className="text-red-800 font-medium">Error: {error}</span>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center">
              <Loader2 className="w-5 h-5 text-blue-600 mr-2 animate-spin" />
              <span className="text-blue-800 font-medium">Loading data from CMS...</span>
            </div>
          </div>
        )}

        {/* Income Statement Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-300">
            <thead className="bg-gray-100">
              <tr>
                <th className="border border-gray-300 px-4 py-2 text-left text-sm font-medium text-gray-700 w-16">
                  Sno
                </th>
                <th className="border border-gray-300 px-4 py-2 text-left text-sm font-medium text-gray-700">
                  Particular
                </th>
                <th className="border border-gray-300 px-4 py-2 text-right text-sm font-medium text-gray-700 w-48">
                  Quarterly Amount (TZS)
                </th>
                <th className="border border-gray-300 px-4 py-2 text-right text-sm font-medium text-gray-700 w-48">
                  YTD Amount (TZS)
                </th>
                <th className="border border-gray-300 px-4 py-2 text-center text-sm font-medium text-gray-700 w-24">
                  Validation
                </th>
              </tr>
            </thead>
            <tbody>
              {incomeStatementRows.map((row, index) => (
                <tr key={row.id} className={getRowStyle(row)}>
                  <td className="border border-gray-300 px-4 py-2 text-sm text-gray-600">
                    {index + 1}
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-sm text-gray-900">
                    <div 
                      className="flex items-center space-x-2"
                      style={{ paddingLeft: `${row.indent * 20}px` }}
                    >
                      {row.category && getCategoryIcon(row.category)}
                      <span className={row.type === 'calculated' ? 'font-semibold' : ''}>
                        {row.label}
                      </span>
                    </div>
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-sm">
                    <div className="text-right">
                      <span className={row.type === 'calculated' ? 'font-semibold text-blue-700' : 'text-gray-900'}>
                        {formatTZSCurrency(calculateQuarterlyValue(row.id))}
                      </span>
                    </div>
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-sm">
                    <div className="text-right">
                      <span className={row.type === 'calculated' ? 'font-semibold text-green-700' : 'text-gray-900'}>
                        {formatTZSCurrency(calculateYtdValue(row.id))}
                      </span>
                    </div>
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-sm text-center">
                    {row.id === 'C42' ? (
                      <div className="flex justify-center">
                        {validations.find(v => v.id === 'V1')?.passed ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-600" />
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
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
                    Expected: {formatTZSCurrency(validation.expected)}
                  </div>
                  <div className="text-sm text-gray-600">
                    Actual: {formatTZSCurrency(validation.actual)}
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

      {/* Footer Block - Summary Totals */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Summary Totals</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Net Income After Tax (Quarterly)</h4>
            <div className="text-2xl font-bold text-green-600">
              {formatTZSCurrency(calculateQuarterlyValue('C42'))}
            </div>
          </div>
          
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Net Income After Tax (YTD)</h4>
            <div className="text-2xl font-bold text-blue-600">
              {formatTZSCurrency(calculateYtdValue('C42'))}
            </div>
          </div>
        </div>

        {/* Key Ratios */}
        <div className="mt-6">
          <h4 className="font-medium text-gray-900 mb-3">Key Performance Ratios</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-3 bg-gray-50 rounded">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Net Interest Margin:</span>
                <span className="text-sm font-medium">
                  {calculateQuarterlyValue('C1') > 0 
                    ? ((calculateQuarterlyValue('C13') / calculateQuarterlyValue('C1')) * 100).toFixed(2) + '%'
                    : 'N/A'
                  }
                </span>
              </div>
            </div>
            <div className="p-3 bg-gray-50 rounded">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Operating Efficiency:</span>
                <span className="text-sm font-medium">
                  {calculateQuarterlyValue('C1') > 0 
                    ? ((calculateQuarterlyValue('C23') / calculateQuarterlyValue('C1')) * 100).toFixed(2) + '%'
                    : 'N/A'
                  }
                </span>
              </div>
            </div>
            <div className="p-3 bg-gray-50 rounded">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Tax Rate:</span>
                <span className="text-sm font-medium">
                  {calculateQuarterlyValue('C40') > 0 
                    ? ((calculateQuarterlyValue('C41') / calculateQuarterlyValue('C40')) * 100).toFixed(2) + '%'
                    : 'N/A'
                  }
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default IncomeStatementMSP202;




