import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Calculator,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Download,
  FileText,
  Building,
  DollarSign,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { formatCurrency } from '../../constants/currencies';
import { balanceSheetApi, BalanceSheetData } from '../../services/balanceSheetApi';

interface BalanceSheetMSP201EnhancedProps {
  onDataChange: (sheetId: string, cellId: string, value: number) => void;
  onValidation: (validations: any[]) => void;
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

interface BalanceSheetRow {
  sno: number;
  particulars: string;
  amount: number;
  isComputed: boolean;
  isSubRow: boolean;
  level: number;
  formula?: string;
}

const BalanceSheetMSP201Enhanced: React.FC<BalanceSheetMSP201EnhancedProps> = ({
  onDataChange,
  onValidation,
  institutionDetails
}) => {
  const [balanceSheetData, setBalanceSheetData] = useState<BalanceSheetData>({});
  const [computedData, setComputedData] = useState<BalanceSheetData>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [validations, setValidations] = useState<ValidationResult[]>([]);
  const hasLoadedData = useRef(false);

  // Define the exact structure as specified
  const balanceSheetStructure: Omit<BalanceSheetRow, 'amount'>[] = [
    { sno: 1, particulars: "1. CASH AND CASH EQUIVALENTS", isComputed: true, isSubRow: false, level: 0, formula: "C2 + C3 + C6 + C7" },
    { sno: 2, particulars: " (a) Cash in Hand", isComputed: false, isSubRow: true, level: 1 },
    { sno: 3, particulars: " (b) Balances with Banks and Financial Institutions", isComputed: true, isSubRow: true, level: 1, formula: "C4 + C5" },
    { sno: 4, particulars: " (i) Non-Agent Banking Balances", isComputed: false, isSubRow: true, level: 2 },
    { sno: 5, particulars: " (ii) Agent-Banking Balances", isComputed: false, isSubRow: true, level: 2 },
    { sno: 6, particulars: " (c ) Balances with Microfinance Service Providers", isComputed: false, isSubRow: true, level: 1 },
    { sno: 7, particulars: " (d) MNOs Float Balances", isComputed: false, isSubRow: true, level: 1 },
    { sno: 8, particulars: "2. INVESTMENT IN DEBT SECURITIES - NET", isComputed: true, isSubRow: false, level: 0, formula: "C9 + C10 + C11 + C12 - C13" },
    { sno: 9, particulars: " (a )Treasury Bills", isComputed: false, isSubRow: true, level: 1 },
    { sno: 10, particulars: " (b) Other Government Securities", isComputed: false, isSubRow: true, level: 1 },
    { sno: 11, particulars: " (c) Private Securities", isComputed: false, isSubRow: true, level: 1 },
    { sno: 12, particulars: " (d) Others", isComputed: false, isSubRow: true, level: 1 },
    { sno: 13, particulars: " (e) Allowance for Probable Losses (Deduction)", isComputed: false, isSubRow: true, level: 1 },
    { sno: 14, particulars: "3. EQUITY INVESTMENTS - NET (a - b)", isComputed: true, isSubRow: false, level: 0, formula: "C15 - C16" },
    { sno: 15, particulars: " (a) Equity Investment", isComputed: false, isSubRow: true, level: 1 },
    { sno: 16, particulars: " (b) Allowance for Probable Losses (Deduction)", isComputed: false, isSubRow: true, level: 1 },
    { sno: 17, particulars: "4. LOANS - NET (sum a:d less e)", isComputed: true, isSubRow: false, level: 0, formula: "C18 + C19 + C20 + C21 - C22" },
    { sno: 18, particulars: " (a) Loans to Clients", isComputed: false, isSubRow: true, level: 1 },
    { sno: 19, particulars: " (b) Loan to Staff and Related Parties", isComputed: false, isSubRow: true, level: 1 },
    { sno: 20, particulars: " (c)Loans to other Microfinance Service Providers", isComputed: false, isSubRow: true, level: 1 },
    { sno: 21, particulars: " (d) Accrued Interest on Loans ", isComputed: false, isSubRow: true, level: 1 },
    { sno: 22, particulars: " (e) Allowances for Probable Losses (Deduction) ", isComputed: false, isSubRow: true, level: 1 },
    { sno: 23, particulars: "5. PROPERTY, PLANT AND EQUIPMENT -NET", isComputed: true, isSubRow: false, level: 0, formula: "C24 - C25" },
    { sno: 24, particulars: " (a) Property, Plant and Equipment", isComputed: false, isSubRow: true, level: 1 },
    { sno: 25, particulars: " (b) Accumulated Depreciation (Deduction)", isComputed: false, isSubRow: true, level: 1 },
    { sno: 26, particulars: "6. OTHER ASSETS (sum a:e less f)", isComputed: true, isSubRow: false, level: 0, formula: "C27 + C28 + C29 + C30 + C31 - C32" },
    { sno: 27, particulars: " (a) Receivables", isComputed: false, isSubRow: true, level: 1 },
    { sno: 28, particulars: " (b) Prepaid Expenses", isComputed: false, isSubRow: true, level: 1 },
    { sno: 29, particulars: " (c )Deffered Tax Assets", isComputed: false, isSubRow: true, level: 1 },
    { sno: 30, particulars: " (d )Intangible Assets", isComputed: false, isSubRow: true, level: 1 },
    { sno: 31, particulars: " (e) Miscellaneous Assets", isComputed: false, isSubRow: true, level: 1 },
    { sno: 32, particulars: " (f) Allowance for Probable Losses (Deduction)", isComputed: false, isSubRow: true, level: 1 },
    { sno: 33, particulars: "7. TOTAL ASSETS ", isComputed: true, isSubRow: false, level: 0, formula: "C1 + C8 + C14 + C17 + C23 + C26" },
    { sno: 34, particulars: "8. LIABILITIES", isComputed: false, isSubRow: false, level: 0 },
    { sno: 35, particulars: "9. BORROWINGS", isComputed: true, isSubRow: false, level: 0, formula: "C36 + C42" },
    { sno: 36, particulars: " (a)Borrowings in Tanzania", isComputed: true, isSubRow: true, level: 1, formula: "C37 + C38 + C39 + C40 + C41" },
    { sno: 37, particulars: " (i) Borrowings from Banks and Financial Institutions ", isComputed: false, isSubRow: true, level: 2 },
    { sno: 38, particulars: " (ii) Borrowings from Other Microfinance Service Providers ", isComputed: false, isSubRow: true, level: 2 },
    { sno: 39, particulars: " (iii) Borrowing from Shareholders ", isComputed: false, isSubRow: true, level: 2 },
    { sno: 40, particulars: " (iv) Borrowing from Public through Debt Securities ", isComputed: false, isSubRow: true, level: 2 },
    { sno: 41, particulars: " (v) Other Borrowings", isComputed: false, isSubRow: true, level: 2 },
    { sno: 42, particulars: " (b)Borrowings from Abroad", isComputed: true, isSubRow: true, level: 1, formula: "C43 + C44 + C45" },
    { sno: 43, particulars: " (i) Borrowings from Banks and Financial Institutions ", isComputed: false, isSubRow: true, level: 2 },
    { sno: 44, particulars: " (ii) Borrowing from Shareholders ", isComputed: false, isSubRow: true, level: 2 },
    { sno: 45, particulars: " (iii) Other Borrowings", isComputed: false, isSubRow: true, level: 2 },
    { sno: 46, particulars: "10. CASH COLLATERAL/LOAN INSURANCE GUARANTEES/COMPULSORY SAVINGS", isComputed: false, isSubRow: false, level: 0 },
    { sno: 47, particulars: "11.TAX PAYABLES", isComputed: false, isSubRow: false, level: 0 },
    { sno: 48, particulars: "12. DIVIDEND PAYABLES", isComputed: false, isSubRow: false, level: 0 },
    { sno: 49, particulars: "13. OTHER PAYABLES AND ACCRUALS", isComputed: false, isSubRow: false, level: 0 },
    { sno: 50, particulars: "14. TOTAL LIABILITIES (sum 9:13)", isComputed: true, isSubRow: false, level: 0, formula: "C35 + C46 + C47 + C48 + C49" },
    { sno: 51, particulars: "15. TOTAL CAPITAL (sum a:i)", isComputed: true, isSubRow: false, level: 0, formula: "C52 + C53 + C54 + C55 + C56 + C57 + C58 + C59 + C60" },
    { sno: 52, particulars: " (a) Paid-up Ordinary Share Capital", isComputed: false, isSubRow: true, level: 1 },
    { sno: 53, particulars: " (b) Paid-up Preference Shares", isComputed: false, isSubRow: true, level: 1 },
    { sno: 54, particulars: " (c) Capital Grants", isComputed: false, isSubRow: true, level: 1 },
    { sno: 55, particulars: " (d) Donations", isComputed: false, isSubRow: true, level: 1 },
    { sno: 56, particulars: " (e) Share Premium", isComputed: false, isSubRow: true, level: 1 },
    { sno: 57, particulars: " (f) General Reserves", isComputed: false, isSubRow: true, level: 1 },
    { sno: 58, particulars: " (g) Retained Earnings", isComputed: false, isSubRow: true, level: 1 },
    { sno: 59, particulars: " (h) Profit/Loss", isComputed: false, isSubRow: true, level: 1 },
    { sno: 60, particulars: " (i) Other Reserves", isComputed: false, isSubRow: true, level: 1 },
    { sno: 61, particulars: "16. TOTAL LIABILITIES AND CAPITAL", isComputed: true, isSubRow: false, level: 0, formula: "C50 + C51" }
  ];

  // Calculate computed values
  const calculateComputedValues = useCallback((data: BalanceSheetData): BalanceSheetData => {
    const computed: BalanceSheetData = { ...data };

    // Helper function to get value safely
    const getValue = (key: string): number => computed[key] || 0;

    // Calculate all computed rows
    computed['C3'] = getValue('C4') + getValue('C5'); // Balances with Banks and Financial Institutions
    computed['C1'] = getValue('C2') + getValue('C3') + getValue('C6') + getValue('C7'); // Cash and Cash Equivalents
    
    // Debug logging for verification
    console.log('🔍 Balance Sheet Enhanced Calculations:');
    console.log('C2 (Cash in Hand):', getValue('C2'));
    console.log('C3 (Banks & Financial Institutions):', computed['C3'], '= C4 + C5 =', getValue('C4'), '+', getValue('C5'));
    console.log('C6 (Microfinance Service Providers):', getValue('C6'));
    console.log('C7 (MNOs Float Balances):', getValue('C7'));
    console.log('C1 (Cash & Cash Equivalents):', computed['C1'], '= C2 + C3 + C6 + C7 =', getValue('C2'), '+', computed['C3'], '+', getValue('C6'), '+', getValue('C7'));
    computed['C8'] = getValue('C9') + getValue('C10') + getValue('C11') + getValue('C12') - getValue('C13'); // Investment in Debt Securities
    computed['C14'] = getValue('C15') - getValue('C16'); // Equity Investments
    computed['C17'] = getValue('C18') + getValue('C19') + getValue('C20') + getValue('C21') - getValue('C22'); // Loans
    computed['C23'] = getValue('C24') - getValue('C25'); // Property, Plant and Equipment
    computed['C26'] = getValue('C27') + getValue('C28') + getValue('C29') + getValue('C30') + getValue('C31') - getValue('C32'); // Other Assets
    computed['C33'] = getValue('C1') + getValue('C8') + getValue('C14') + getValue('C17') + getValue('C23') + getValue('C26'); // Total Assets
    computed['C36'] = getValue('C37') + getValue('C38') + getValue('C39') + getValue('C40') + getValue('C41'); // Borrowings in Tanzania
    computed['C42'] = getValue('C43') + getValue('C44') + getValue('C45'); // Borrowings from Abroad
    computed['C35'] = getValue('C36') + getValue('C42'); // Total Borrowings
    computed['C50'] = getValue('C35') + getValue('C46') + getValue('C47') + getValue('C48') + getValue('C49'); // Total Liabilities
    computed['C51'] = getValue('C52') + getValue('C53') + getValue('C54') + getValue('C55') + getValue('C56') + getValue('C57') + getValue('C58') + getValue('C59') + getValue('C60'); // Total Capital
    computed['C61'] = getValue('C50') + getValue('C51'); // Total Liabilities and Capital

    return computed;
  }, []);

  // Fetch data from CMS API
  const fetchData = useCallback(async (forceRefresh: boolean = false) => {
    setLoading(true);
    setError(null);

    try {
      const response = await balanceSheetApi.fetchBalanceSheetData(forceRefresh);
      
      if (response.success) {
        const computed = calculateComputedValues(response.data);
        setBalanceSheetData(response.data);
        setComputedData(computed);
        setLastUpdated(new Date());
        
        // Update parent component
        Object.keys(computed).forEach(key => {
          onDataChange('balanceSheet', key, computed[key]);
        });
        
        hasLoadedData.current = true;
      } else {
        setError(response.message || 'Failed to fetch data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  }, [calculateComputedValues, onDataChange]);

  // Run validations
  const runValidations = useCallback((): ValidationResult[] => {
    const validationResults: ValidationResult[] = [];
    
    // Validation: C33 === C61 (Total Assets === Total Liabilities and Capital)
    const totalAssets = computedData['C33'] || 0;
    const totalLiabilitiesAndCapital = computedData['C61'] || 0;
    const difference = Math.abs(totalAssets - totalLiabilitiesAndCapital);
    const tolerance = 0.01; // Allow for floating point precision

    validationResults.push({
      id: 'V1',
      description: 'Total Assets = Total Liabilities and Capital',
      expected: totalAssets,
      actual: totalLiabilitiesAndCapital,
      passed: difference < tolerance,
      error: difference >= tolerance ? 
        `Mismatch: Total Assets (${formatCurrency(totalAssets)}) ≠ Total Liabilities and Capital (${formatCurrency(totalLiabilitiesAndCapital)})` : ''
    });

    return validationResults;
  }, [computedData]);

  // Update validations when computed data changes
  useEffect(() => {
    if (Object.keys(computedData).length > 0) {
      const newValidations = runValidations();
      setValidations(newValidations);
      onValidation(newValidations);
    }
  }, [computedData, runValidations, onValidation]);

  // Load data on component mount only once
  useEffect(() => {
    if (!hasLoadedData.current) {
      fetchData();
    }
  }, []); // Empty dependency array to run only once

  // Handle refresh
  const handleRefresh = () => {
    fetchData(true);
  };

  // Format amount for display
  const formatAmount = (amount: number): string => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  // Get amount for a specific row
  const getRowAmount = (sno: number): number => {
    const key = `C${sno}`;
    return computedData[key] || 0;
  };

  // Get validation icon
  const getValidationIcon = (validation: ValidationResult) => {
    if (validation.passed) {
      return <CheckCircle className="w-4 h-4 text-green-600" />;
    } else {
      return <XCircle className="w-4 h-4 text-red-600" />;
    }
  };

  if (loading && !balanceSheetData) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading balance sheet data from CMS...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6">
        <div className="flex items-center mb-4">
          <AlertCircle className="w-6 h-6 text-red-600 mr-3" />
          <h3 className="text-lg font-semibold text-red-800">Error Loading Data</h3>
        </div>
        <p className="text-red-700 mb-4">{error}</p>
        <button
          onClick={handleRefresh}
          className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Retry</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Block */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">BALANCE SHEET</h2>
          <h3 className="text-lg font-semibold text-gray-700">{institutionDetails.name}</h3>
          <p className="text-sm text-gray-600">
            Quarter End: {institutionDetails.quarterEndDate}
          </p>
          {lastUpdated && (
            <p className="text-xs text-gray-500 mt-2">
              Last updated: {lastUpdated.toLocaleString()}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              <span>{loading ? 'Refreshing...' : 'Refresh Data'}</span>
            </button>
          </div>
        </div>

        {/* Balance Sheet Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-300">
            <thead className="bg-gray-100">
              <tr>
                <th className="border border-gray-300 px-4 py-3 text-center text-sm font-medium text-gray-700 w-16">S/No</th>
                <th className="border border-gray-300 px-4 py-3 text-left text-sm font-medium text-gray-700">Particulars</th>
                <th className="border border-gray-300 px-4 py-3 text-right text-sm font-medium text-gray-700 w-32">Amount (TZS)</th>
              </tr>
            </thead>
            <tbody>
              {balanceSheetStructure.map((row) => {
                const amount = getRowAmount(row.sno);
                const isComputed = row.isComputed;
                const isSubRow = row.isSubRow;
                
                return (
                  <tr key={row.sno} className={`hover:bg-gray-50 ${isComputed ? 'bg-blue-50 font-semibold' : ''}`}>
                    <td className="border border-gray-300 px-4 py-3 text-center text-sm text-gray-600">
                      {row.sno}
                    </td>
                    <td 
                      className={`border border-gray-300 px-4 py-3 text-sm ${
                        isComputed ? 'font-semibold text-blue-800' : 'text-gray-900'
                      }`}
                      style={{ paddingLeft: `${row.level * 20 + 16}px` }}
                    >
                      <div className="flex items-center space-x-2">
                        {isComputed && (
                          <Calculator className="w-4 h-4 text-blue-600" />
                        )}
                        <span>{row.particulars}</span>
                        {isComputed && (
                          <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-600">
                            Computed
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="border border-gray-300 px-4 py-3 text-right text-sm">
                      <span className={`${isComputed ? 'font-semibold text-blue-800' : 'text-gray-900'}`}>
                        {formatAmount(amount)}
                      </span>
                    </td>
                  </tr>
                );
              })}
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
                    Expected: {formatAmount(validation.expected)}
                  </div>
                  <div className="text-sm text-gray-600">
                    Actual: {formatAmount(validation.actual)}
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
      </div>

      {/* Footer Block - Key Totals */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Totals</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Total Assets</h4>
            <p className="text-2xl font-bold text-blue-600">
              {formatAmount(computedData['C33'] || 0)}
            </p>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Total Liabilities</h4>
            <p className="text-2xl font-bold text-red-600">
              {formatAmount(computedData['C50'] || 0)}
            </p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Total Capital</h4>
            <p className="text-2xl font-bold text-green-600">
              {formatAmount(computedData['C51'] || 0)}
            </p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Total Liabilities & Capital</h4>
            <p className="text-2xl font-bold text-purple-600">
              {formatAmount(computedData['C61'] || 0)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BalanceSheetMSP201Enhanced;
