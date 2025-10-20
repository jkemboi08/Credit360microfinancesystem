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
  Droplets,
  Shield,
  Activity,
  MessageSquare,
  AlertCircle,
  Clock,
  CheckSquare,
  XSquare,
  Building2,
  Banknote,
  Globe,
  Phone,
  User,
  Building,
  Loader2
} from 'lucide-react';
import { formatCurrency } from '../../constants/currencies';
import AgentBankingBalancesApiService, { AgentBankingBalance } from '../../services/agentBankingBalancesApi';

interface AgentBankingBalancesMSP208Props {
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

const AgentBankingBalancesMSP208: React.FC<AgentBankingBalancesMSP208Props> = ({
  data,
  onDataChange,
  onValidation,
  isEditing,
  institutionDetails,
  balanceSheetData = {}
}) => {
  const [validations, setValidations] = useState<ValidationResult[]>([]);
  const [showCalculations, setShowCalculations] = useState(false);
  const [agentBalances, setAgentBalances] = useState<AgentBankingBalance[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [msp201C5, setMsp201C5] = useState<number>(0);

  const apiService = AgentBankingBalancesApiService.getInstance();

  // Format currency for TZS with commas and 2 decimals
  const formatTZSCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  // Fetch data from CMS
  const fetchData = async (forceRefresh: boolean = false) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiService.fetchAgentBankingBalances(forceRefresh);
      
      if (response.success) {
        setAgentBalances(response.data);
        setLastUpdated(response.lastUpdated || new Date().toISOString());
        
        // Update global data store
        response.data.forEach(item => {
          onDataChange(`C${item.sno}`, item.balance);
        });

        // Fetch MSP2_01.C5 for validation
        const c5Value = await apiService.getMSP201C5Value();
        setMsp201C5(c5Value);
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
    
    if (agentBalances.length === 0) return validationResults;

    // Find total balance (row 30)
    const totalBalanceItem = agentBalances.find(item => item.sno === 30);
    const totalBalance = totalBalanceItem?.balance || 0;
    
    // Validation: C30 == MSP2_01.C5 (Total Balance)
    if (msp201C5 > 0) {
      const isMatch = Math.abs(totalBalance - msp201C5) < 0.01;
      validationResults.push({
        id: 'V1',
        description: 'Total Balance (C30) = MSP2_01.C5',
        expected: msp201C5,
        actual: totalBalance,
        passed: isMatch,
        error: !isMatch ? 
          `Mismatch: Total Balance (${formatTZSCurrency(totalBalance)}) ≠ MSP2_01.C5 (${formatTZSCurrency(msp201C5)})` : ''
      });
    }

    return validationResults;
  };

  // Update validations when data changes
  useEffect(() => {
    const newValidations = runValidations();
    setValidations(newValidations);
    onValidation(newValidations);
  }, [agentBalances, msp201C5]);

  const getValidationIcon = (validation: ValidationResult) => {
    if (validation.passed) {
      return <CheckCircle className="w-4 h-4 text-green-600" />;
    } else {
      return <XCircle className="w-4 h-4 text-red-600" />;
    }
  };

  const handleRefresh = () => {
    fetchData(true);
  };

  const totalBalance = agentBalances.find(item => item.sno === 30)?.balance || 0;

  return (
    <div className="space-y-6">
      {/* Header Block */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">AGENT BANKING BALANCES</h2>
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
        {isLoading && agentBalances.length === 0 && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-gray-600">Loading agent banking balances from CMS...</p>
            </div>
          </div>
        )}

        {/* Agent Banking Balances Table */}
        {!isLoading && agentBalances.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-300">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border border-gray-300 px-2 py-2 text-center text-xs font-medium text-gray-700 w-12">S/No</th>
                  <th className="border border-gray-300 px-2 py-2 text-left text-xs font-medium text-gray-700">Name</th>
                  <th className="border border-gray-300 px-2 py-2 text-right text-xs font-medium text-gray-700 w-40">Balance (TZS)</th>
                </tr>
              </thead>
              <tbody>
                {agentBalances.map((item) => (
                  <tr 
                    key={item.sno} 
                    className={`hover:bg-gray-50 ${item.sno === 30 ? 'bg-blue-50 font-semibold' : ''}`}
                  >
                    <td className="border border-gray-300 px-2 py-2 text-center text-sm text-gray-600">
                      {item.sno}
                    </td>
                    <td className="border border-gray-300 px-2 py-2 text-sm text-gray-900">
                      <div className="flex items-center space-x-2">
                        <Building className="w-4 h-4 text-blue-600" />
                        <span className={item.sno === 30 ? 'font-semibold' : ''}>
                          {item.name}
                        </span>
                        {item.sno === 30 && (
                          <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-600">
                            Calculated
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="border border-gray-300 px-2 py-2 text-right text-sm">
                      <span className={`text-gray-900 ${item.sno === 30 ? 'font-semibold text-blue-700' : ''}`}>
                        {formatTZSCurrency(item.balance)}
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

      {/* Footer Block - Summary Analysis */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Summary Analysis</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Total Balance Summary */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900 flex items-center">
              <Banknote className="w-5 h-5 mr-2 text-blue-600" />
              Total Balance Summary
            </h4>
            <div className="space-y-3">
              <div className="p-3 bg-blue-50 rounded">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-700">Total Agent Balances (C30)</span>
                  <span className="font-semibold text-blue-600">
                    {formatTZSCurrency(totalBalance)}
                  </span>
                </div>
              </div>
              <div className="p-3 bg-green-50 rounded">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-700">Number of Banks</span>
                  <span className="font-semibold text-green-600">
                    {agentBalances.filter(item => item.sno !== 30).length}
                  </span>
                </div>
              </div>
              <div className="p-3 bg-purple-50 rounded">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-700">Average Balance per Bank</span>
                  <span className="font-semibold text-purple-600">
                    {formatTZSCurrency(
                      agentBalances.filter(item => item.sno !== 30).length > 0 
                        ? totalBalance / agentBalances.filter(item => item.sno !== 30).length 
                        : 0
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Balance Distribution */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900 flex items-center">
              <BarChart3 className="w-5 h-5 mr-2 text-green-600" />
              Balance Distribution
            </h4>
            <div className="space-y-3">
              <div className="p-3 bg-orange-50 rounded">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-700">Highest Balance</span>
                  <span className="font-semibold text-orange-600">
                    {formatTZSCurrency(
                      Math.max(...agentBalances.filter(item => item.sno !== 30).map(item => item.balance), 0)
                    )}
                  </span>
                </div>
              </div>
              <div className="p-3 bg-red-50 rounded">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-700">Lowest Balance</span>
                  <span className="font-semibold text-red-600">
                    {formatTZSCurrency(
                      Math.min(...agentBalances.filter(item => item.sno !== 30).map(item => item.balance), 0)
                    )}
                  </span>
                </div>
              </div>
              <div className="p-3 bg-yellow-50 rounded">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-700">Banks with Zero Balance</span>
                  <span className="font-semibold text-yellow-600">
                    {agentBalances.filter(item => item.sno !== 30 && item.balance === 0).length}
                  </span>
                </div>
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
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-900">Total Balance (Row 30)</span>
                <div className="text-right">
                  <div className="text-blue-600 font-semibold">
                    Balance: {formatTZSCurrency(totalBalance)}
                  </div>
                </div>
              </div>
              <div className="mt-2 text-sm text-gray-600 font-mono">
                Formula: Sum of all bank balances (C1:C29)
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentBankingBalancesMSP208;
