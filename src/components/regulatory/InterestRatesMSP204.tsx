import React, { useState, useEffect } from 'react';
import {
  Calculator,
  CheckCircle,
  XCircle,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  FileText,
  BarChart3,
  PieChart,
  RefreshCw,
  Download,
  Eye,
  Edit,
  Percent,
  Target,
  Zap,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { formatCurrency } from '../../constants/currencies';
import InterestRatesApiService, { InterestRateData } from '../../services/interestRatesApi';

interface InterestRatesMSP204Props {
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
  loanPortfolioData?: { [key: string]: number };
}

interface ValidationResult {
  id: string;
  description: string;
  expected: number;
  actual: number;
  passed: boolean;
  error: string;
}

const InterestRatesMSP204: React.FC<InterestRatesMSP204Props> = ({
  data,
  onDataChange,
  onValidation,
  isEditing,
  institutionDetails,
  balanceSheetData = {},
  loanPortfolioData = {}
}) => {
  const [validations, setValidations] = useState<ValidationResult[]>([]);
  const [showCalculations, setShowCalculations] = useState(false);
  const [interestRates, setInterestRates] = useState<InterestRateData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [msp201C17C22, setMsp201C17C22] = useState<number>(0);
  const [msp203C67, setMsp203C67] = useState<number>(0);

  const apiService = InterestRatesApiService.getInstance();

  // Format currency for TZS with commas and 2 decimals
  const formatTZSCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  // Format numbers with commas
  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('en-TZ').format(num);
  };

  // Format percentages
  const formatPercentage = (rate: number): string => {
    return `${rate.toFixed(2)}%`;
  };

  // Fetch data from CMS
  const fetchData = async (forceRefresh: boolean = false) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiService.fetchInterestRatesData(forceRefresh);
      
      if (response.success) {
        setInterestRates(response.data);
        setLastUpdated(response.lastUpdated || new Date().toISOString());
        
        // Update global data store
        response.data.forEach(item => {
          onDataChange(`C${item.sno}`, item.borrowers);
          onDataChange(`D${item.sno}`, item.outstandingAmount);
          onDataChange(`E${item.sno}`, item.weightedAvgRateStraight);
          onDataChange(`F${item.sno}`, item.nominalLowStraight);
          onDataChange(`G${item.sno}`, item.nominalHighStraight);
          onDataChange(`H${item.sno}`, item.weightedAvgRateReducing);
          onDataChange(`I${item.sno}`, item.nominalLowReducing);
          onDataChange(`J${item.sno}`, item.nominalHighReducing);
        });

        // Fetch validation values
        const c17c22Value = await apiService.getMSP201C17C22Value();
        const c67Value = await apiService.getMSP203C67Value();
        setMsp201C17C22(c17c22Value);
        setMsp203C67(c67Value);
      } else {
        setError(response.message || 'Failed to fetch data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, []);

  // Run validations
  const runValidations = (): ValidationResult[] => {
    const validationResults: ValidationResult[] = [];
    
    if (interestRates.length === 0) return validationResults;

    // Find total row (row 15)
    const totalRow = interestRates.find(item => item.sno === 15);
    if (!totalRow) return validationResults;

    // Validation 1: D15 === MSP2_01.C17 + MSP2_01.C22
    if (msp201C17C22 > 0) {
      const isMatch = Math.abs(totalRow.outstandingAmount - msp201C17C22) < 0.01;
      validationResults.push({
        id: 'V1',
        description: 'Total Outstanding (D15) = MSP2_01.C17 + MSP2_01.C22',
        expected: msp201C17C22,
        actual: totalRow.outstandingAmount,
        passed: isMatch,
        error: !isMatch ? 
          `Mismatch: Total Outstanding (${formatTZSCurrency(totalRow.outstandingAmount)}) ≠ MSP2_01.C17+C22 (${formatTZSCurrency(msp201C17C22)})` : ''
      });
    }

    // Validation 2: C15 === MSP2_03.C67
    if (msp203C67 > 0) {
      const isMatch = Math.abs(totalRow.borrowers - msp203C67) < 0.01;
      validationResults.push({
        id: 'V2',
        description: 'Total Borrowers (C15) = MSP2_03.C67',
        expected: msp203C67,
        actual: totalRow.borrowers,
        passed: isMatch,
        error: !isMatch ? 
          `Mismatch: Total Borrowers (${formatNumber(totalRow.borrowers)}) ≠ MSP2_03.C67 (${formatNumber(msp203C67)})` : ''
      });
    }

    return validationResults;
  };

  // Update validations when data changes
  useEffect(() => {
    const newValidations = runValidations();
    setValidations(newValidations);
    onValidation(newValidations);
  }, [interestRates, msp201C17C22, msp203C67]);

  const getValidationIcon = (validation: ValidationResult) => {
    if (validation.passed) {
      return <CheckCircle className="w-4 h-4 text-green-600" />;
    } else {
      return <XCircle className="w-4 h-4 text-red-600" />;
    }
  };

  const getRateStatus = (rate: number) => {
    if (rate < 15) return { status: 'Low', color: 'text-green-600', bg: 'bg-green-50' };
    if (rate < 25) return { status: 'Moderate', color: 'text-yellow-600', bg: 'bg-yellow-50' };
    return { status: 'High', color: 'text-red-600', bg: 'bg-red-50' };
  };

  const getLoanTypeIcon = (loanType: InterestRateData) => {
    if (loanType.isSubRow) return <Target className="w-4 h-4 text-gray-500" />;
    if (loanType.type.includes('Consumer')) return <Users className="w-4 h-4 text-blue-600" />;
    if (loanType.type.includes('Business')) return <DollarSign className="w-4 h-4 text-purple-600" />;
    if (loanType.type.includes('Agricultural')) return <Target className="w-4 h-4 text-green-600" />;
    if (loanType.type.includes('Salaried')) return <Users className="w-4 h-4 text-orange-600" />;
    if (loanType.type.includes('Islamic')) return <Zap className="w-4 h-4 text-indigo-600" />;
    return <BarChart3 className="w-4 h-4 text-gray-600" />;
  };

  const handleRefresh = () => {
    fetchData(true);
  };

  // Calculate totals
  const totalBorrowers = interestRates.reduce((sum, item) => sum + item.borrowers, 0);
  const totalOutstanding = interestRates.reduce((sum, item) => sum + item.outstandingAmount, 0);

  return (
    <div className="space-y-6">
      {/* Header Block */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">INTEREST RATES STRUCTURE FOR MICROFINANCE LOANS</h2>
          <h3 className="text-lg font-semibold text-gray-700">{institutionDetails.name}</h3>
          <p className="text-sm text-gray-600">
            Quarter End: {institutionDetails.quarterEndDate}
          </p>
          {lastUpdated && (
            <p className="text-xs text-gray-500 mt-1">
              Last Updated: {new Date(lastUpdated).toLocaleString()}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              <span>{isLoading ? 'Refreshing...' : 'Refresh Data'}</span>
            </button>
            <button
              onClick={() => setShowCalculations(!showCalculations)}
              className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Calculator className="w-4 h-4" />
              <span>{showCalculations ? 'Hide' : 'Show'} Calculations</span>
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
              <span className="text-red-800">{error}</span>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && interestRates.length === 0 && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-gray-600">Loading interest rates data from CMS...</p>
            </div>
          </div>
        )}

        {/* Interest Rates Table */}
        {!isLoading && interestRates.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-300">
            <thead className="bg-gray-100">
              <tr>
                <th className="border border-gray-300 px-2 py-2 text-center text-xs font-medium text-gray-700 w-12">S/No</th>
                <th className="border border-gray-300 px-2 py-2 text-left text-xs font-medium text-gray-700">Type</th>
                <th className="border border-gray-300 px-2 py-2 text-center text-xs font-medium text-gray-700 w-20">No. of Borrowers</th>
                  <th className="border border-gray-300 px-2 py-2 text-right text-xs font-medium text-gray-700 w-32">Outstanding Amount (TZS)</th>
                  <th className="border border-gray-300 px-2 py-2 text-center text-xs font-medium text-gray-700 w-24">Wt. Avg Rate (Straight)</th>
                  <th className="border border-gray-300 px-2 py-2 text-center text-xs font-medium text-gray-700 w-24">Nominal Low (Straight)</th>
                  <th className="border border-gray-300 px-2 py-2 text-center text-xs font-medium text-gray-700 w-24">Nominal High (Straight)</th>
                  <th className="border border-gray-300 px-2 py-2 text-center text-xs font-medium text-gray-700 w-24">Wt. Avg Rate (Reducing)</th>
                  <th className="border border-gray-300 px-2 py-2 text-center text-xs font-medium text-gray-700 w-24">Nominal Low (Reducing)</th>
                  <th className="border border-gray-300 px-2 py-2 text-center text-xs font-medium text-gray-700 w-24">Nominal High (Reducing)</th>
              </tr>
            </thead>
            <tbody>
                {interestRates
                  .filter(item => item.sno <= 15) // Show all rows including sub-rows
                  .sort((a, b) => a.sno - b.sno) // Sort by serial number
                  .map((item) => (
                  <tr 
                    key={item.sno} 
                    className={`hover:bg-gray-50 ${item.isCalculated ? 'bg-blue-50 font-semibold' : ''} ${item.isSubRow ? 'bg-gray-50' : ''}`}
                  >
                  <td className="border border-gray-300 px-2 py-2 text-center text-sm text-gray-600">
                      {item.isSubRow ? '' : item.sno}
                  </td>
                  <td className="border border-gray-300 px-2 py-2 text-sm text-gray-900">
                    <div className="flex items-center space-x-2">
                        {getLoanTypeIcon(item)}
                        <span 
                          className={`${item.isCalculated ? 'font-semibold' : ''} ${item.isSubRow ? 'pl-4 text-sm' : ''}`}
                        >
                          {item.type}
                        </span>
                        {item.isCalculated && (
                          <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-600">
                            Calculated
                          </span>
                        )}
                    </div>
                  </td>
                  <td className="border border-gray-300 px-2 py-2 text-center text-sm">
                      <span className={`text-gray-900 ${item.isCalculated ? 'font-semibold text-blue-700' : ''}`}>
                        {formatNumber(item.borrowers)}
                      </span>
                  </td>
                  <td className="border border-gray-300 px-2 py-2 text-right text-sm">
                      <span className={`text-gray-900 ${item.isCalculated ? 'font-semibold text-blue-700' : ''}`}>
                        {formatTZSCurrency(item.outstandingAmount)}
                      </span>
                  </td>
                  <td className="border border-gray-300 px-2 py-2 text-center text-sm">
                      <span className={`text-gray-900 ${item.isCalculated ? 'font-semibold text-blue-700' : ''}`}>
                        {formatPercentage(item.weightedAvgRateStraight)}
                      </span>
                  </td>
                  <td className="border border-gray-300 px-2 py-2 text-center text-sm">
                      <span className={`text-gray-900 ${item.isCalculated ? 'font-semibold text-blue-700' : ''}`}>
                        {formatPercentage(item.nominalLowStraight)}
                      </span>
                  </td>
                  <td className="border border-gray-300 px-2 py-2 text-center text-sm">
                      <span className={`text-gray-900 ${item.isCalculated ? 'font-semibold text-blue-700' : ''}`}>
                        {formatPercentage(item.nominalHighStraight)}
                      </span>
                  </td>
                  <td className="border border-gray-300 px-2 py-2 text-center text-sm">
                      <span className={`text-gray-900 ${item.isCalculated ? 'font-semibold text-blue-700' : ''}`}>
                        {formatPercentage(item.weightedAvgRateReducing)}
                      </span>
                  </td>
                  <td className="border border-gray-300 px-2 py-2 text-center text-sm">
                      <span className={`text-gray-900 ${item.isCalculated ? 'font-semibold text-blue-700' : ''}`}>
                        {formatPercentage(item.nominalLowReducing)}
                      </span>
                  </td>
                  <td className="border border-gray-300 px-2 py-2 text-center text-sm">
                      <span className={`text-gray-900 ${item.isCalculated ? 'font-semibold text-blue-700' : ''}`}>
                        {formatPercentage(item.nominalHighReducing)}
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
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
          Validation Results
        </h3>
        
        <div className="space-y-3">
          {validations.length === 0 ? (
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-gray-600 text-sm">No validations to display</p>
            </div>
          ) : (
            validations.map((validation) => (
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
            ))
          )}
        </div>
      </div>

      {/* Footer Block - Interest Rate Analysis */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Interest Rate Analysis</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Straight Method Analysis */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
              Straight Method Analysis
            </h4>
            <div className="space-y-3">
              <div className="p-3 bg-gray-50 rounded">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-700">Weighted Average Rate</span>
                  <span className="font-semibold text-green-600">
                    {interestRates.length > 0 ? formatPercentage(interestRates[interestRates.length - 1]?.weightedAvgRateStraight || 0) : '0.00%'}
                  </span>
                </div>
              </div>
              <div className="p-3 bg-gray-50 rounded">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-700">Rate Range</span>
                  <span className="font-semibold text-blue-600">
                    {interestRates.length > 0 ? 
                      `${formatPercentage(interestRates[interestRates.length - 1]?.nominalLowStraight || 0)} - ${formatPercentage(interestRates[interestRates.length - 1]?.nominalHighStraight || 0)}` : 
                      '0.00% - 0.00%'
                    }
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Reducing Method Analysis */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900 flex items-center">
              <TrendingDown className="w-5 h-5 mr-2 text-purple-600" />
              Reducing Method Analysis
            </h4>
            <div className="space-y-3">
              <div className="p-3 bg-gray-50 rounded">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-700">Weighted Average Rate</span>
                  <span className="font-semibold text-purple-600">
                    {interestRates.length > 0 ? formatPercentage(interestRates[interestRates.length - 1]?.weightedAvgRateReducing || 0) : '0.00%'}
                  </span>
                </div>
              </div>
              <div className="p-3 bg-gray-50 rounded">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-700">Rate Range</span>
                  <span className="font-semibold text-blue-600">
                    {interestRates.length > 0 ? 
                      `${formatPercentage(interestRates[interestRates.length - 1]?.nominalLowReducing || 0)} - ${formatPercentage(interestRates[interestRates.length - 1]?.nominalHighReducing || 0)}` : 
                      '0.00% - 0.00%'
                    }
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Portfolio Summary */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-3">Portfolio Summary (C15, D15)</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{formatNumber(totalBorrowers)}</div>
              <div className="text-sm text-gray-600">Total Borrowers (C15)</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{formatTZSCurrency(totalOutstanding)}</div>
              <div className="text-sm text-gray-600">Total Outstanding (D15)</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {totalBorrowers > 0 ? formatTZSCurrency(totalOutstanding / totalBorrowers) : 'N/A'}
              </div>
              <div className="text-sm text-gray-600">Average Loan Size</div>
            </div>
          </div>
        </div>
      </div>

      {/* Calculations Display */}
      {showCalculations && (
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Calculation Details</h3>
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-900">Total (Row 15)</span>
                <div className="text-right">
                  <div className="text-blue-600 font-semibold">
                    Borrowers: {formatNumber(totalBorrowers)}
                  </div>
                  <div className="text-green-600 font-semibold">
                    Outstanding: {formatTZSCurrency(totalOutstanding)}
                  </div>
                </div>
              </div>
              <div className="mt-2 text-sm text-gray-600 font-mono">
                Formula: Sum of all loan types (C1:C14, D1:D14)
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InterestRatesMSP204;








