import React, { useState, useEffect } from 'react';
import {
  CheckCircle,
  XCircle,
  RefreshCw,
  Download,
  Loader2
} from 'lucide-react';
import SectoralClassificationApiService, { SectoralLoanData } from '../../services/sectoralClassificationApi';
import BOTLoanClassificationService from '../../services/botLoanClassificationService';

interface LoanPortfolioMSP203Props {
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

interface SectoralRow {
  id: number;
  sector: string;
  numberOfBorrowers: number;
  totalOutstanding: number;
  currentAmount: number;
  esm: number;
  substandard: number;
  doubtful: number;
  loss: number;
  amountWrittenOff: number;
  isBlank: boolean;
  isTotal: boolean;
  isCalculation: boolean;
}

const LoanPortfolioMSP203: React.FC<LoanPortfolioMSP203Props> = ({
  data,
  onDataChange,
  onValidation,
  isEditing,
  institutionDetails,
  balanceSheetData = {}
}) => {
  const [cmsData, setCmsData] = useState<SectoralLoanData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [validations, setValidations] = useState<ValidationResult[]>([]);
  const [sectoralRows, setSectoralRows] = useState<SectoralRow[]>([]);

  // Format currency for TZS
  const formatTZSCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  // Define the exact structure without blank rows, with automatic renumbering
  const createSectoralRows = (): SectoralRow[] => {
    const rows: SectoralRow[] = [];
    let rowId = 1;

    // Define the 22 sectors with their exact names
  const sectors = [
      "Agriculture",
      "Fishing", 
      "Forest",
      "Hunting",
      "Financial Intermediaries",
      "Mining and Quarrying",
      "Manufacturing",
      "Building and Construction",
      "Real Estate",
      "Leasing",
      "Transport and Communication",
      "Trade",
      "Tourism",
      "Hotels and Restaurants",
      "Warehousing and Storage",
      "Electricity",
      "Gas",
      "Water",
      "Education",
      "Health",
      "Other Services",
      "Personal (Private)"
    ];

    // Add sector rows without blank rows
    sectors.forEach((sector, index) => {
      // Add sector row
      const sectorData = cmsData.find(d => d.sector === sector) || {
        sector,
        numberOfBorrowers: 0,
        currentAmount: 0,
        esm: 0,
        substandard: 0,
        doubtful: 0,
        loss: 0,
        amountWrittenOff: 0
      };

      const totalOutstanding = sectorData.currentAmount + sectorData.esm + 
                             sectorData.substandard + sectorData.doubtful + sectorData.loss;

      rows.push({
        id: rowId++,
        sector: `${index + 1}. ${sector}`,
        numberOfBorrowers: sectorData.numberOfBorrowers,
        totalOutstanding,
        currentAmount: sectorData.currentAmount,
        esm: sectorData.esm,
        substandard: sectorData.substandard,
        doubtful: sectorData.doubtful,
        loss: sectorData.loss,
        amountWrittenOff: sectorData.amountWrittenOff,
        isBlank: false,
        isTotal: false,
        isCalculation: false
      });
    });

    // Add calculation rows with automatic renumbering
    const totals = calculateTotals();
    
    // Total row
    rows.push({
      id: rowId++,
      sector: "Total",
      numberOfBorrowers: totals.totalBorrowers,
      totalOutstanding: totals.totalOutstanding,
      currentAmount: totals.totalCurrent,
      esm: totals.totalEsm,
      substandard: totals.totalSubstandard,
      doubtful: totals.totalDoubtful,
      loss: totals.totalLoss,
      amountWrittenOff: totals.totalWrittenOff,
      isBlank: false,
      isTotal: true,
      isCalculation: false
    });

    // Provision Rate row - Updated with correct BOT rates
    rows.push({
      id: rowId++,
      sector: "Provision Rate",
      numberOfBorrowers: 0,
      totalOutstanding: 0,
      currentAmount: 0.01,    // 1% for Current (0-5 days)
      esm: 0.05,             // 5% for ESM (6-30 days)
      substandard: 0.25,     // 25% for Substandard (31-60 days)
      doubtful: 0.5,         // 50% for Doubtful (61-90 days)
      loss: 1,               // 100% for Loss (90+ days)
      amountWrittenOff: 0,
      isBlank: false,
      isTotal: false,
      isCalculation: true
    });

    // Provision Amount row
    const provisionAmount = (totals.totalCurrent * 0.01) + (totals.totalEsm * 0.05) + 
                           (totals.totalSubstandard * 0.25) + (totals.totalDoubtful * 0.5) + 
                           (totals.totalLoss * 1);
    rows.push({
      id: rowId++,
      sector: "Provision Amount",
      numberOfBorrowers: 0,
      totalOutstanding: provisionAmount,
      currentAmount: totals.totalCurrent * 0.01,
      esm: totals.totalEsm * 0.05,
      substandard: totals.totalSubstandard * 0.25,
      doubtful: totals.totalDoubtful * 0.5,
      loss: totals.totalLoss * 1,
      amountWrittenOff: 0,
      isBlank: false,
      isTotal: false,
      isCalculation: true
    });

    // Less Cash Collateral/Insurance Guarantee/Compulsory Saving row
    rows.push({
      id: rowId++,
      sector: "Less Cash Collateral/Insurance Guarantee/Compulsory Saving",
      numberOfBorrowers: 0,
      totalOutstanding: 0,
      currentAmount: 0,
      esm: 0,
      substandard: 0,
      doubtful: 0,
      loss: 0,
      amountWrittenOff: 0,
      isBlank: false,
      isTotal: false,
      isCalculation: true
    });

    // Net Provision Amount row
    rows.push({
      id: rowId++,
      sector: "Net Provision Amount",
      numberOfBorrowers: 0,
      totalOutstanding: provisionAmount,
      currentAmount: totals.totalCurrent * 0.01,
      esm: totals.totalEsm * 0.05,
      substandard: totals.totalSubstandard * 0.25,
      doubtful: totals.totalDoubtful * 0.5,
      loss: totals.totalLoss * 1,
      amountWrittenOff: 0,
      isBlank: false,
      isTotal: false,
      isCalculation: true
    });

    // TOTAL (Net Amount) row
    rows.push({
      id: rowId++,
      sector: "TOTAL (Net Amount)",
      numberOfBorrowers: 0,
      totalOutstanding: provisionAmount,
      currentAmount: totals.totalCurrent * 0.01,
      esm: totals.totalEsm * 0.05,
      substandard: totals.totalSubstandard * 0.25,
      doubtful: totals.totalDoubtful * 0.5,
      loss: totals.totalLoss * 1,
      amountWrittenOff: 0,
      isBlank: false,
      isTotal: false,
      isCalculation: true
    });

    // Ratio of Non-Performing Loans to Gross Loans row
    const nplRatio = totals.totalOutstanding > 0 ? 
      ((totals.totalEsm + totals.totalSubstandard + totals.totalDoubtful + totals.totalLoss) / totals.totalOutstanding) : 0;
    rows.push({
      id: rowId++,
      sector: "Ratio of Non-Performing Loans to Gross Loans",
      numberOfBorrowers: 0,
      totalOutstanding: nplRatio,
      currentAmount: 0,
      esm: 0,
      substandard: 0,
      doubtful: 0,
      loss: 0,
      amountWrittenOff: 0,
      isBlank: false,
      isTotal: false,
      isCalculation: true
    });

    return rows;
  };

  // Calculate totals from CMS data
  const calculateTotals = () => {
    return cmsData.reduce((acc, sector) => {
      const totalOutstanding = sector.currentAmount + sector.esm + sector.substandard + sector.doubtful + sector.loss;
      return {
        totalBorrowers: acc.totalBorrowers + sector.numberOfBorrowers,
        totalOutstanding: acc.totalOutstanding + totalOutstanding,
        totalCurrent: acc.totalCurrent + sector.currentAmount,
        totalEsm: acc.totalEsm + sector.esm,
        totalSubstandard: acc.totalSubstandard + sector.substandard,
        totalDoubtful: acc.totalDoubtful + sector.doubtful,
        totalLoss: acc.totalLoss + sector.loss,
        totalWrittenOff: acc.totalWrittenOff + sector.amountWrittenOff
      };
    }, {
      totalBorrowers: 0,
      totalOutstanding: 0,
      totalCurrent: 0,
      totalEsm: 0,
      totalSubstandard: 0,
      totalDoubtful: 0,
      totalLoss: 0,
      totalWrittenOff: 0
    });
  };

  // Fetch data from CMS
  const fetchDataFromCMS = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const apiService = SectoralClassificationApiService.getInstance();
      const response = await apiService.fetchSectoralClassificationData();
      
      if (response.success) {
        setCmsData(response.data);
        setLastUpdated(response.lastUpdated);
        
        // Update global data store
        const totals = response.totals;
        if (totals) {
          onDataChange('C67', totals.totalBorrowers);
          onDataChange('D67', totals.totalOutstanding);
          onDataChange('E67', totals.totalCurrent);
          onDataChange('F67', totals.totalEsm);
          onDataChange('G67', totals.totalSubstandard);
          onDataChange('H67', totals.totalDoubtful);
          onDataChange('I67', totals.totalLoss);
          onDataChange('J67', totals.totalWrittenOff);
        }
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
    SectoralClassificationApiService.getInstance().clearCache();
    fetchDataFromCMS();
  };

  // Initialize data on component mount
  useEffect(() => {
    fetchDataFromCMS();
  }, []);

  // Update sectoral rows when CMS data changes
  useEffect(() => {
    const rows = createSectoralRows();
    setSectoralRows(rows);
  }, [cmsData]);

  // Run validations
  const runValidations = (): ValidationResult[] => {
    const validationResults: ValidationResult[] = [];
    const totals = calculateTotals();
    
    // Validation 1: C67 = MSP2_04.C15 (Total Borrowers)
    const totalBorrowers = totals.totalBorrowers;
    const msp204C15 = balanceSheetData['C15'] || 0;
    
    if (msp204C15 > 0) {
      validationResults.push({
        id: 'V1',
        description: 'C67 = MSP2_04.C15 (Total Borrowers)',
        expected: msp204C15,
        actual: totalBorrowers,
        passed: Math.abs(totalBorrowers - msp204C15) < 0.01,
        error: totalBorrowers !== msp204C15 ? 
          `Mismatch: C67 (${totalBorrowers}) ≠ MSP2_04.C15 (${msp204C15})` : ''
      });
    }

    // Validation 2: D67 = MSP2_01.C17 + MSP2_01.C22 (Gross Loans)
    const grossLoans = totals.totalOutstanding;
    const msp201C17 = balanceSheetData['C17'] || 0; // Net Loans
    const msp201C22Provision = balanceSheetData['C22'] || 0; // Provision for Loan Losses
    const expectedGrossLoans = msp201C17 + msp201C22Provision;
    
    if (expectedGrossLoans > 0) {
      validationResults.push({
        id: 'V2',
        description: 'D67 = MSP2_01.C17 + MSP2_01.C22 (Gross Loans)',
        expected: expectedGrossLoans,
        actual: grossLoans,
        passed: Math.abs(grossLoans - expectedGrossLoans) < 0.01,
        error: grossLoans !== expectedGrossLoans ? 
          `Mismatch: D67 (${formatTZSCurrency(grossLoans)}) ≠ MSP2_01.C17+C22 (${formatTZSCurrency(expectedGrossLoans)})` : ''
      });
    }

    // Validation 3: D69 = MSP2_01.C22 (Provision Amount)
    const provisionAmount = (totals.totalCurrent * 0.01) + (totals.totalEsm * 0.05) + 
                           (totals.totalSubstandard * 0.25) + (totals.totalDoubtful * 0.5) + 
                           (totals.totalLoss * 1);
    const msp201C22 = balanceSheetData['C22'] || 0;
    
    if (msp201C22 > 0) {
      validationResults.push({
        id: 'V3',
        description: 'D69 = MSP2_01.C22 (Provision Amount)',
        expected: msp201C22,
        actual: provisionAmount,
        passed: Math.abs(provisionAmount - msp201C22) < 0.01,
        error: provisionAmount !== msp201C22 ? 
          `Mismatch: D69 (${formatTZSCurrency(provisionAmount)}) ≠ MSP2_01.C22 (${formatTZSCurrency(msp201C22)})` : ''
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
    <div className="space-y-6">
      {/* Header Block */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">SECTORAL CLASSIFICATION OF MICROFINANCE LOANS</h2>
          <h3 className="text-lg font-semibold text-gray-700">{institutionDetails.name}</h3>
          <p className="text-sm text-gray-600">
            Date: {institutionDetails.quarterEndDate}
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

        {/* Sectoral Classification Table */}
        {!isLoading && !error && (
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-300">
            <thead className="bg-gray-100">
              <tr>
                <th className="border border-gray-300 px-2 py-2 text-center text-xs font-medium text-gray-700 w-12">Sno</th>
                <th className="border border-gray-300 px-2 py-2 text-left text-xs font-medium text-gray-700">Sector</th>
                <th className="border border-gray-300 px-2 py-2 text-center text-xs font-medium text-gray-700 w-20">No. of Borrowers</th>
                <th className="border border-gray-300 px-2 py-2 text-right text-xs font-medium text-gray-700 w-24">Total Outstanding</th>
                <th className="border border-gray-300 px-2 py-2 text-right text-xs font-medium text-gray-700 w-20">Current</th>
                <th className="border border-gray-300 px-2 py-2 text-right text-xs font-medium text-gray-700 w-20">ESM</th>
                <th className="border border-gray-300 px-2 py-2 text-right text-xs font-medium text-gray-700 w-24">Substandard</th>
                <th className="border border-gray-300 px-2 py-2 text-right text-xs font-medium text-gray-700 w-20">Doubtful</th>
                <th className="border border-gray-300 px-2 py-2 text-right text-xs font-medium text-gray-700 w-20">Loss</th>
                <th className="border border-gray-300 px-2 py-2 text-right text-xs font-medium text-gray-700 w-24">Amount Written-off</th>
              </tr>
            </thead>
            <tbody>
                {sectoralRows.map((row) => (
                  <tr 
                    key={row.id} 
                    className={`${
                      row.isTotal ? 'bg-blue-50 font-bold' : 
                      row.isCalculation ? 'bg-gray-50' : 
                      'hover:bg-gray-50'
                    }`}
                  >
                  <td className="border border-gray-300 px-2 py-2 text-center text-sm text-gray-600">
                      {row.id}
                  </td>
                    <td className={`border border-gray-300 px-2 py-2 text-sm ${
                      row.isTotal ? 'text-blue-800' : 
                      row.isCalculation ? 'text-gray-700' : 
                      'text-gray-900'
                    }`}>
                      {row.sector}
                  </td>
                    <td className={`border border-gray-300 px-2 py-2 text-center text-sm ${
                      row.isTotal ? 'text-blue-800' : 
                      row.isCalculation ? 'text-gray-700' : 
                      'text-gray-900'
                    }`}>
                      {row.numberOfBorrowers}
                  </td>
                    <td className={`border border-gray-300 px-2 py-2 text-right text-sm ${
                      row.isTotal ? 'text-blue-800' : 
                      row.isCalculation ? 'text-gray-700' : 
                      'text-gray-900'
                    }`}>
                      {formatTZSCurrency(row.totalOutstanding)}
                  </td>
                    <td className={`border border-gray-300 px-2 py-2 text-right text-sm ${
                      row.isTotal ? 'text-blue-800' : 
                      row.isCalculation ? 'text-gray-700' : 
                      'text-gray-900'
                    }`}>
                      {formatTZSCurrency(row.currentAmount)}
                  </td>
                    <td className={`border border-gray-300 px-2 py-2 text-right text-sm ${
                      row.isTotal ? 'text-blue-800' : 
                      row.isCalculation ? 'text-gray-700' : 
                      'text-gray-900'
                    }`}>
                      {formatTZSCurrency(row.esm)}
                  </td>
                    <td className={`border border-gray-300 px-2 py-2 text-right text-sm ${
                      row.isTotal ? 'text-blue-800' : 
                      row.isCalculation ? 'text-gray-700' : 
                      'text-gray-900'
                    }`}>
                      {formatTZSCurrency(row.substandard)}
                  </td>
                    <td className={`border border-gray-300 px-2 py-2 text-right text-sm ${
                      row.isTotal ? 'text-blue-800' : 
                      row.isCalculation ? 'text-gray-700' : 
                      'text-gray-900'
                    }`}>
                      {formatTZSCurrency(row.doubtful)}
                  </td>
                    <td className={`border border-gray-300 px-2 py-2 text-right text-sm ${
                      row.isTotal ? 'text-blue-800' : 
                      row.isCalculation ? 'text-gray-700' : 
                      'text-gray-900'
                    }`}>
                      {formatTZSCurrency(row.loss)}
                  </td>
                    <td className={`border border-gray-300 px-2 py-2 text-right text-sm ${
                      row.isTotal ? 'text-blue-800' : 
                      row.isCalculation ? 'text-gray-700' : 
                      'text-gray-900'
                    }`}>
                      {formatTZSCurrency(row.amountWrittenOff)}
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

      {/* Footer Block - Notes and Additional Information */}
      {!isLoading && !error && (
      <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h3>
        
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">1. General Loans Classification (BOT Guidelines)</h4>
              <div className="text-sm text-blue-800 space-y-1">
                <div>• 0-5 days: Current - 1% provision</div>
                <div>• 6-30 days: Especially Mentioned - 5% provision</div>
                <div>• 31-60 days: Substandard - 25% provision</div>
                <div>• 61-90 days: Doubtful - 50% provision</div>
                <div>• 90+ days: Loss - 100% provision</div>
              </div>
              </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-medium text-green-900 mb-2">2. Housing Microfinance Loans Classification (BOT Guidelines)</h4>
              <div className="text-sm text-green-800 space-y-1">
                <div>• 0-90 days: Current - 1% provision</div>
                <div>• 91-180 days: Substandard - 25% provision</div>
                <div>• 181-360 days: Doubtful - 50% provision</div>
                <div>• 361+ days: Loss - 100% provision</div>
                <div className="text-xs text-green-700 mt-2 italic">Note: No ESM category for housing microfinance loans</div>
            </div>
          </div>

            <div className="bg-yellow-50 p-4 rounded-lg">
              <h4 className="font-medium text-yellow-900 mb-2">NOTE:</h4>
              <div className="text-sm text-yellow-800">
                <strong>NB Total outstanding = Current + ESM + Substandard + Doubtful + Loss for each Individual activity</strong>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoanPortfolioMSP203;
