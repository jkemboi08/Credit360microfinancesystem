import React, { useState } from 'react';
import {
  Calculator,
  RefreshCw,
  AlertCircle,
  Loader2,
  Building,
  Briefcase,
  Globe,
  TrendingUp as TrendingUpIcon
} from 'lucide-react';

interface LoansDisbursedMSP209Props {
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
}


const LoansDisbursedMSP209: React.FC<LoansDisbursedMSP209Props> = ({
  data,
  onDataChange,
  onValidation,
  isEditing,
  institutionDetails
}) => {
  const [showCalculations, setShowCalculations] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(new Date().toISOString());


  // Complete data structure for Loans Disbursed report
  const loansDisbursedData = [
    { label: 'Individual Loans Disbursed', amount: data.C1 || 50000000 },
    { label: 'Group Loans Disbursed', amount: data.C2 || 30000000 },
    { label: 'SME Loans Disbursed', amount: data.C3 || 20000000 },
    { label: 'Housing Microfinance Loans', amount: data.C4 || 15000000 },
    { label: 'Agricultural Loans', amount: data.C5 || 10000000 },
    { label: 'Emergency Loans', amount: data.C6 || 8000000 },
    { label: 'Education Loans', amount: data.C7 || 6000000 },
    { label: 'Business Development Loans', amount: data.C8 || 4000000 },
    { label: 'Asset Financing Loans', amount: data.C9 || 3000000 },
    { label: 'Working Capital Loans', amount: data.C10 || 2000000 },
    { label: 'Agriculture Sector', amount: data.C11 || 45000000 },
    { label: 'Manufacturing Sector', amount: data.C12 || 35000000 },
    { label: 'Trade Sector', amount: data.C13 || 60000000 },
    { label: 'Services Sector', amount: data.C14 || 40000000 },
    { label: 'Transport Sector', amount: data.C15 || 25000000 },
    { label: 'Construction Sector', amount: data.C16 || 30000000 },
    { label: 'Mining Sector', amount: data.C17 || 15000000 },
    { label: 'Tourism Sector', amount: data.C18 || 20000000 },
    { label: 'Other Sectors', amount: data.C19 || 10000000 },
    { label: 'Dar es Salaam', amount: data.C20 || 40000000 },
    { label: 'Arusha', amount: data.C21 || 25000000 },
    { label: 'Mwanza', amount: data.C22 || 20000000 },
    { label: 'Dodoma', amount: data.C23 || 15000000 },
    { label: 'Tanga', amount: data.C24 || 12000000 },
    { label: 'Morogoro', amount: data.C25 || 10000000 },
    { label: 'Mbeya', amount: data.C26 || 8000000 },
    { label: 'Iringa', amount: data.C27 || 6000000 },
    { label: 'Kilimanjaro', amount: data.C28 || 5000000 },
    { label: 'Other Regions', amount: data.C29 || 4000000 },
    { label: 'Total Loans Disbursed', amount: data.C30 || 250000000, isTotal: true }
  ];

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

  const handleRefresh = () => {
    setIsLoading(true);
    // Simulate a brief loading state
    setTimeout(() => {
      setIsLoading(false);
      // Refresh data from parent component
      window.location.reload();
    }, 1000);
  };

  return (
    <div className="space-y-6">
      {/* Header Block */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">LOANS DISBURSED DURING THE QUARTER</h2>
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


        {/* Loans Disbursed Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-300">
            <thead className="bg-gray-100">
              <tr>
                <th className="border border-gray-300 px-4 py-3 text-center text-sm font-medium text-gray-700 w-16">S/No</th>
                <th className="border border-gray-300 px-4 py-3 text-left text-sm font-medium text-gray-700">Particulars</th>
                <th className="border border-gray-300 px-4 py-3 text-right text-sm font-medium text-gray-700 w-40">Amount (TZS)</th>
              </tr>
            </thead>
            <tbody>
              {loansDisbursedData.map((item, index) => (
                <tr 
                  key={index} 
                  className={`hover:bg-gray-50 ${item.isTotal ? 'bg-blue-50 font-semibold border-t-2 border-blue-300' : ''}`}
                >
                  <td className="border border-gray-300 px-4 py-3 text-center text-sm text-gray-600">
                    {index + 1}
                  </td>
                  <td className="border border-gray-300 px-4 py-3 text-sm text-gray-900">
                    <div className="flex items-center space-x-2">
                      <Briefcase className="w-4 h-4 text-blue-600" />
                      <span className={item.isTotal ? 'font-semibold text-blue-800' : ''}>
                        {item.label}
                      </span>
                      {item.isTotal && (
                        <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-600">
                          Total
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="border border-gray-300 px-4 py-3 text-right text-sm">
                    <span className={`text-gray-900 ${item.isTotal ? 'font-semibold text-blue-700' : ''}`}>
                      {formatTZSCurrency(item.amount)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Block */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Summary</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Product Type Summary */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900 flex items-center">
              <Briefcase className="w-5 h-5 mr-2 text-blue-600" />
              Product Types
            </h4>
            <div className="space-y-2">
              <div className="p-3 bg-blue-50 rounded">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-700">Individual Loans</span>
                  <span className="font-semibold text-blue-600">
                    {formatTZSCurrency(data.C1 || 50000000)}
                  </span>
                </div>
              </div>
              <div className="p-3 bg-blue-50 rounded">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-700">Group Loans</span>
                  <span className="font-semibold text-blue-600">
                    {formatTZSCurrency(data.C2 || 30000000)}
                  </span>
                </div>
              </div>
              <div className="p-3 bg-blue-50 rounded">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-700">SME Loans</span>
                  <span className="font-semibold text-blue-600">
                    {formatTZSCurrency(data.C3 || 20000000)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Sector Summary */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900 flex items-center">
              <Building className="w-5 h-5 mr-2 text-green-600" />
              Top Sectors
            </h4>
            <div className="space-y-2">
              <div className="p-3 bg-green-50 rounded">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-700">Trade Sector</span>
                  <span className="font-semibold text-green-600">
                    {formatTZSCurrency(data.C13 || 60000000)}
                  </span>
                </div>
              </div>
              <div className="p-3 bg-green-50 rounded">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-700">Agriculture</span>
                  <span className="font-semibold text-green-600">
                    {formatTZSCurrency(data.C11 || 45000000)}
                  </span>
                </div>
              </div>
              <div className="p-3 bg-green-50 rounded">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-700">Services</span>
                  <span className="font-semibold text-green-600">
                    {formatTZSCurrency(data.C14 || 40000000)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Regional Summary */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900 flex items-center">
              <Globe className="w-5 h-5 mr-2 text-purple-600" />
              Top Regions
            </h4>
            <div className="space-y-2">
              <div className="p-3 bg-purple-50 rounded">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-700">Dar es Salaam</span>
                  <span className="font-semibold text-purple-600">
                    {formatTZSCurrency(data.C20 || 40000000)}
                  </span>
                </div>
              </div>
              <div className="p-3 bg-purple-50 rounded">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-700">Arusha</span>
                  <span className="font-semibold text-purple-600">
                    {formatTZSCurrency(data.C21 || 25000000)}
                  </span>
                </div>
              </div>
              <div className="p-3 bg-purple-50 rounded">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-700">Mwanza</span>
                  <span className="font-semibold text-purple-600">
                    {formatTZSCurrency(data.C22 || 20000000)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Grand Total */}
        <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
          <h4 className="font-medium text-gray-900 mb-3 flex items-center">
            <TrendingUpIcon className="w-5 h-5 mr-2 text-blue-600" />
            Total Loans Disbursed
          </h4>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">
              {formatTZSCurrency(data.C30 || 250000000)}
            </div>
            <div className="text-sm text-gray-600 mt-1">All Categories Combined</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoansDisbursedMSP209;





