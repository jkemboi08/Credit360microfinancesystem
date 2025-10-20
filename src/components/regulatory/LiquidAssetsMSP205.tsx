import React, { useState, useEffect } from 'react';
import {
  CheckCircle,
  XCircle,
  RefreshCw,
  Download,
  Loader2,
  FileText,
  FileSpreadsheet
} from 'lucide-react';
import LiquidAssetsApiService, { LiquidAssetsData } from '../../services/liquidAssetsApi';
import { PDFExportUtils } from '../../utils/pdfExportUtils';

interface LiquidAssetsMSP205Props {
  data: { [key: string]: number };
  onDataChange: (key: string, value: number) => void;
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

interface LiquidAssetRow {
  id: number;
  particular: string;
  amount: number;
  isCalculated: boolean;
  isFetched: boolean;
  indentLevel: number;
}

const LiquidAssetsMSP205: React.FC<LiquidAssetsMSP205Props> = ({
  data,
  onDataChange,
  onValidation,
  isEditing,
  institutionDetails,
  balanceSheetData = {}
}) => {
  const [cmsData, setCmsData] = useState<LiquidAssetsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [validations, setValidations] = useState<ValidationResult[]>([]);
  const [liquidAssetRows, setLiquidAssetRows] = useState<LiquidAssetRow[]>([]);

  // Export functionality
  const handleExport = async (format: 'excel' | 'pdf') => {
    if (format === 'excel') {
      // Generate Excel file
      const csvContent = generateCSVContent();
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `Liquid_Assets_MSP205_${institutionDetails.quarterEndDate}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (format === 'pdf') {
      // Generate PDF using the new utility
      try {
        await PDFExportUtils.exportReportToPDF(
          'Liquid Assets (MSP2_05)',
          data,
          institutionDetails,
          'liquid-assets-report' // Element ID to capture
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
    const rows = liquidAssetRows.length > 0 ? liquidAssetRows.map((row, index) => [
      index + 1,
      row.particular,
      formatTZSCurrency(row.amount)
    ]) : [
      // Sample data if no liquidAssetRows available
      [1, 'Cash in Hand', formatTZSCurrency(1500000)],
      [2, 'Balances with Banks', formatTZSCurrency(30000000)],
      [3, 'Treasury Bills', formatTZSCurrency(25000000)],
      [4, 'Government Securities', formatTZSCurrency(20000000)],
      [5, 'Other Liquid Assets', formatTZSCurrency(10000000)],
      [6, 'Total Liquid Assets', formatTZSCurrency(86500000)]
    ];
    
    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
    
    return csvContent;
  };

  // Format currency for TZS
  const formatTZSCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  // Define the exact 13-row structure as per requirements
  const createLiquidAssetRows = (): LiquidAssetRow[] => {
    if (!cmsData) return [];

    const rows: LiquidAssetRow[] = [];
    let rowId = 1;

    // Calculate total liquid assets (A)
    const totalLiquidAssets = cmsData.cashInHand + cmsData.balancesWithBanks + 
                             cmsData.balancesWithMFSPs + cmsData.mnosFloatCash + 
                             cmsData.treasuryBills + cmsData.governmentSecurities + 
                             cmsData.privateSecurities + cmsData.otherLiquidAssets;

    // Row 1: A: TOTAL AVAILABLE LIQUID ASSETS
    rows.push({
      id: rowId++,
      particular: "A: TOTAL AVAILABLE LIQUID ASSETS",
      amount: totalLiquidAssets,
      isCalculated: true,
      isFetched: false,
      indentLevel: 0
    });

    // Row 2: (a) Cash in hand
    rows.push({
      id: rowId++,
      particular: "(a) Cash in hand",
      amount: cmsData.cashInHand,
      isCalculated: false,
      isFetched: true,
      indentLevel: 1
    });

    // Row 3: (b) Balances with Banks and Financial Institutions
    rows.push({
      id: rowId++,
      particular: "(b) Balances with Banks and Financial Institutions",
      amount: cmsData.balancesWithBanks,
      isCalculated: false,
      isFetched: true,
      indentLevel: 1
    });

    // Row 4: (c) Balances with Microfinance Service Providers
    rows.push({
      id: rowId++,
      particular: "(c) Balances with Microfinance Service Providers",
      amount: cmsData.balancesWithMFSPs,
      isCalculated: false,
      isFetched: true,
      indentLevel: 1
    });

    // Row 5: (d) MNOs Float Cash Balances
    rows.push({
      id: rowId++,
      particular: "(d) MNOs Float Cash Balances",
      amount: cmsData.mnosFloatCash,
      isCalculated: false,
      isFetched: true,
      indentLevel: 1
    });

    // Row 6: (e) Treasury Bills (Unencumbered)
    rows.push({
      id: rowId++,
      particular: "(e) Treasury Bills (Unencumbered)",
      amount: cmsData.treasuryBills,
      isCalculated: false,
      isFetched: true,
      indentLevel: 1
    });

    // Row 7: (f) Other Government Securities with Residual Maturity of One Year or Less (Unencumbered)
    rows.push({
      id: rowId++,
      particular: "(f) Other Government Securities with Residual Maturity of One Year or Less (Unencumbered)",
      amount: cmsData.governmentSecurities,
      isCalculated: false,
      isFetched: true,
      indentLevel: 1
    });

    // Row 8: (g) Private Securities with Residual Maturity of One Year or Less (Unencumbered)
    rows.push({
      id: rowId++,
      particular: "(g) Private Securities with Residual Maturity of One Year or Less (Unencumbered)",
      amount: cmsData.privateSecurities,
      isCalculated: false,
      isFetched: true,
      indentLevel: 1
    });

    // Row 9: (h) Other Liquid Assets Maturing within 12 Months
    rows.push({
      id: rowId++,
      particular: "(h) Other Liquid Assets Maturing within 12 Months",
      amount: cmsData.otherLiquidAssets,
      isCalculated: false,
      isFetched: true,
      indentLevel: 1
    });

    // Row 10: B. TOTAL ASSETS
    rows.push({
      id: rowId++,
      particular: "B. TOTAL ASSETS",
      amount: cmsData.totalAssets,
      isCalculated: false,
      isFetched: true,
      indentLevel: 0
    });

    // Row 11: C: Required Minimum Liquid Assets (5%*B)
    const requiredMinimum = cmsData.totalAssets * 0.05;
    rows.push({
      id: rowId++,
      particular: "C: Required Minimum Liquid Assets (5%*B)",
      amount: requiredMinimum,
      isCalculated: true,
      isFetched: false,
      indentLevel: 0
    });

    // Row 12: D: Excess (Deficiency) Liquid Assets (A-C)
    const excessDeficiency = totalLiquidAssets - requiredMinimum;
    rows.push({
      id: rowId++,
      particular: "D: Excess (Deficiency) Liquid Assets (A-C)",
      amount: excessDeficiency,
      isCalculated: true,
      isFetched: false,
      indentLevel: 0
    });

    // Row 13: E: Liquid Asset Ratio (A / B)
    const liquidAssetRatio = cmsData.totalAssets > 0 ? (totalLiquidAssets / cmsData.totalAssets) * 100 : 0;
    rows.push({
      id: rowId++,
      particular: "E: Liquid Asset Ratio (A / B)",
      amount: liquidAssetRatio,
      isCalculated: true,
      isFetched: false,
      indentLevel: 0
    });

    return rows;
  };

  // Fetch data from CMS
  const fetchDataFromCMS = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const apiService = LiquidAssetsApiService.getInstance();
      const response = await apiService.fetchLiquidAssetsData();
      
      if (response.success) {
        setCmsData(response.data);
        setLastUpdated(response.lastUpdated);
        
        // Update global data store
        onDataChange('C1', response.data.cashInHand + response.data.balancesWithBanks + 
                    response.data.balancesWithMFSPs + response.data.mnosFloatCash + 
                    response.data.treasuryBills + response.data.governmentSecurities + 
                    response.data.privateSecurities + response.data.otherLiquidAssets);
        onDataChange('C10', response.data.totalAssets);
        onDataChange('C11', response.data.totalAssets * 0.05);
        onDataChange('C12', (response.data.cashInHand + response.data.balancesWithBanks + 
                    response.data.balancesWithMFSPs + response.data.mnosFloatCash + 
                    response.data.treasuryBills + response.data.governmentSecurities + 
                    response.data.privateSecurities + response.data.otherLiquidAssets) - 
                    (response.data.totalAssets * 0.05));
        onDataChange('C13', response.data.totalAssets > 0 ? 
                    ((response.data.cashInHand + response.data.balancesWithBanks + 
                    response.data.balancesWithMFSPs + response.data.mnosFloatCash + 
                    response.data.treasuryBills + response.data.governmentSecurities + 
                    response.data.privateSecurities + response.data.otherLiquidAssets) / 
                    response.data.totalAssets) * 100 : 0);
      } else {
        throw new Error('Failed to fetch data from CMS');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle refresh
  const handleRefresh = () => {
    LiquidAssetsApiService.getInstance().clearCache();
    fetchDataFromCMS();
  };

  // Initialize data on component mount
  useEffect(() => {
    fetchDataFromCMS();
  }, []);

  // Update liquid asset rows when CMS data changes
  useEffect(() => {
    const rows = createLiquidAssetRows();
    setLiquidAssetRows(rows);
  }, [cmsData]);

  // Run validations
  const runValidations = (): ValidationResult[] => {
    const validationResults: ValidationResult[] = [];
    
    if (!cmsData) return validationResults;

    // Validation 1: C2 = MSP2_01.C2 (Cash in hand)
    const c2Amount = cmsData.cashInHand;
    const msp201C2 = balanceSheetData['C2'] || 0;
    
    if (msp201C2 > 0) {
      validationResults.push({
        id: 'V1',
        description: 'C2 = MSP2_01.C2 (Cash in hand)',
        expected: msp201C2,
        actual: c2Amount,
        passed: Math.abs(c2Amount - msp201C2) < 0.01,
        error: c2Amount !== msp201C2 ? 
          `Mismatch: C2 (${formatTZSCurrency(c2Amount)}) ≠ MSP2_01.C2 (${formatTZSCurrency(msp201C2)})` : ''
      });
    }

    // Validation 2: C3 = MSP2_01.C3 (Balances with Banks)
    const c3Amount = cmsData.balancesWithBanks;
    const msp201C3 = balanceSheetData['C3'] || 0;
    
    if (msp201C3 > 0) {
      validationResults.push({
        id: 'V2',
        description: 'C3 = MSP2_01.C3 (Balances with Banks)',
        expected: msp201C3,
        actual: c3Amount,
        passed: Math.abs(c3Amount - msp201C3) < 0.01,
        error: c3Amount !== msp201C3 ? 
          `Mismatch: C3 (${formatTZSCurrency(c3Amount)}) ≠ MSP2_01.C3 (${formatTZSCurrency(msp201C3)})` : ''
      });
    }

    // Validation 3: C4 = MSP2_01.C4 (Balances with MFSPs)
    const c4Amount = cmsData.balancesWithMFSPs;
    const msp201C4 = balanceSheetData['C4'] || 0;
    
    if (msp201C4 > 0) {
      validationResults.push({
        id: 'V3',
        description: 'C4 = MSP2_01.C4 (Balances with MFSPs)',
        expected: msp201C4,
        actual: c4Amount,
        passed: Math.abs(c4Amount - msp201C4) < 0.01,
        error: c4Amount !== msp201C4 ? 
          `Mismatch: C4 (${formatTZSCurrency(c4Amount)}) ≠ MSP2_01.C4 (${formatTZSCurrency(msp201C4)})` : ''
      });
    }

    // Validation 4: C5 = MSP2_01.C5 (MNOs Float Cash)
    const c5Amount = cmsData.mnosFloatCash;
    const msp201C5 = balanceSheetData['C5'] || 0;
    
    if (msp201C5 > 0) {
    validationResults.push({
      id: 'V4',
        description: 'C5 = MSP2_01.C5 (MNOs Float Cash)',
        expected: msp201C5,
        actual: c5Amount,
        passed: Math.abs(c5Amount - msp201C5) < 0.01,
        error: c5Amount !== msp201C5 ? 
          `Mismatch: C5 (${formatTZSCurrency(c5Amount)}) ≠ MSP2_01.C5 (${formatTZSCurrency(msp201C5)})` : ''
      });
    }

    return validationResults;
  };

  // Update validations when data changes
  useEffect(() => {
    const newValidations = runValidations();
    setValidations(newValidations);
    onValidation(newValidations);
  }, [cmsData, balanceSheetData]);

  const getValidationIcon = (validation: ValidationResult) => {
    if (validation.passed) {
      return <CheckCircle className="w-4 h-4 text-green-600" />;
    } else {
      return <XCircle className="w-4 h-4 text-red-600" />;
    }
  };

  return (
    <div className="space-y-6" id="liquid-assets-report">
      {/* Header Block */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">COMPUTATION OF LIQUID ASSETS</h2>
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
              className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
              <RefreshCw className="w-4 h-4" />
              )}
              <span>Refresh Data</span>
            </button>
            {lastUpdated && (
              <span className="text-xs text-gray-500">
                Last updated: {new Date(lastUpdated).toLocaleString()}
              </span>
            )}
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Loading data from CMS...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <XCircle className="w-5 h-5 text-red-600 mr-2" />
              <span className="text-red-800">{error}</span>
            </div>
          </div>
        )}

        {/* Liquid Assets Table */}
        {!isLoading && !error && (
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-300">
            <thead className="bg-gray-100">
              <tr>
                <th className="border border-gray-300 px-4 py-2 text-center text-sm font-medium text-gray-700 w-16">S/No</th>
                <th className="border border-gray-300 px-4 py-2 text-left text-sm font-medium text-gray-700">Particular</th>
                <th className="border border-gray-300 px-4 py-2 text-right text-sm font-medium text-gray-700 w-48">Amount (TZS)</th>
              </tr>
            </thead>
            <tbody>
                {liquidAssetRows.map((row) => (
                  <tr 
                    key={row.id} 
                    className={`hover:bg-gray-50 ${
                      row.isCalculated ? 'bg-blue-50 font-semibold' : ''
                    }`}
                  >
                  <td className="border border-gray-300 px-4 py-2 text-center text-sm text-gray-600">
                      {row.id}
                  </td>
                    <td 
                      className={`border border-gray-300 px-4 py-2 text-sm text-gray-900 ${
                        row.indentLevel > 0 ? `pl-${row.indentLevel * 6}` : ''
                      }`}
                      style={{ paddingLeft: row.indentLevel > 0 ? `${row.indentLevel * 24}px` : '16px' }}
                    >
                      {row.particular}
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-right text-sm">
                      <span className={`text-gray-900 ${row.isCalculated ? 'font-semibold text-blue-700' : ''}`}>
                        {row.id === 13 ? `${row.amount.toFixed(2)}%` : formatTZSCurrency(row.amount)}
                      </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}
      </div>

      {/* Validation Block */}
      {!isLoading && !error && (
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
      </div>
      )}

      {/* Footer Block - Notes */}
      {!isLoading && !error && (
      <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h3>
          
          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="text-sm text-yellow-800">
              <strong>Template is version 0.0.0.0</strong>
                      </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiquidAssetsMSP205;




