import React, { useState, useEffect } from 'react';
import { Star, AlertTriangle, CheckCircle, XCircle, TrendingUp, DollarSign, Clock, Calculator, Sliders } from 'lucide-react';
import { LoanData, TopUpStrategy, NetTopUpAllocation } from '../../types/topUp.types';
import { formatCurrency, calculatePercentageChange } from '../../utils/topUpCalculations';

interface StrategySelectorProps {
  loan: LoanData;
  topUpAmount: number;
  strategies: TopUpStrategy[];
  selectedStrategy: TopUpStrategy | null;
  onStrategySelect: (strategy: TopUpStrategy) => void;
  netTopUpAllocation: NetTopUpAllocation;
  onNetTopUpAllocationChange: (allocation: NetTopUpAllocation) => void;
  isCalculating: boolean;
}

const StrategySelector: React.FC<StrategySelectorProps> = ({
  loan,
  topUpAmount,
  strategies,
  selectedStrategy,
  onStrategySelect,
  netTopUpAllocation,
  onNetTopUpAllocationChange,
  isCalculating
}) => {
  const [showComparison, setShowComparison] = useState(false);

  // Update net top-up allocation when top-up amount changes
  useEffect(() => {
    if (topUpAmount > 0 && netTopUpAllocation.appliedToLoan === 0 && netTopUpAllocation.cashToClient === 0) {
      const defaultAppliedToLoan = Math.round(topUpAmount * 0.3); // Default 30% to loan
      onNetTopUpAllocationChange({
        appliedToLoan: defaultAppliedToLoan,
        cashToClient: topUpAmount - defaultAppliedToLoan
      });
    }
  }, [topUpAmount]);

  const handleNetTopUpAllocationChange = (appliedToLoan: number) => {
    onNetTopUpAllocationChange({
      appliedToLoan,
      cashToClient: topUpAmount - appliedToLoan
    });
  };

  const getStrategyIcon = (strategyId: string) => {
    switch (strategyId) {
      case 'consolidation':
        return <TrendingUp className="w-5 h-5" />;
      case 'settlement_plus_new':
        return <CheckCircle className="w-5 h-5" />;
      case 'net_topup':
        return <Sliders className="w-5 h-5" />;
      case 'stacking':
        return <DollarSign className="w-5 h-5" />;
      default:
        return <Calculator className="w-5 h-5" />;
    }
  };

  const getStrategyColor = (strategy: TopUpStrategy) => {
    if (!strategy.isAvailable) return 'border-gray-200 bg-gray-50';
    if (strategy.isRecommended) return 'border-blue-500 bg-blue-50';
    if (selectedStrategy?.id === strategy.id) return 'border-green-500 bg-green-50';
    return 'border-gray-300 bg-white hover:border-gray-400';
  };

  const getComparisonData = () => {
    const current = {
      monthlyPayment: loan.monthlyPayment,
      totalDebt: loan.outstandingBalance,
      tenure: loan.remainingMonths,
      dtiRatio: loan.dtiRatio,
      loanStatus: 'Active'
    };

    const strategyData = strategies.reduce((acc, strategy) => {
      acc[strategy.id] = {
        monthlyPayment: strategy.calculations.newMonthlyPayment,
        totalDebt: strategy.calculations.totalDebt,
        tenure: strategy.calculations.tenure,
        dtiRatio: strategy.calculations.dtiRatio,
        loanStatus: strategy.id === 'settlement_plus_new' ? 'CLOSED ✅' : 
                   strategy.id === 'net_topup' ? 'Reduced' : 
                   strategy.id === 'consolidation' ? 'Closed' : 'Active',
        netCashToClient: strategy.calculations.netCashToClient
      };
      return acc;
    }, {} as any);

    return { current, strategies: strategyData };
  };

  const comparisonData = getComparisonData();

  return (
    <div className="space-y-6">
      {/* Top-Up Amount Summary */}
      <div className="bg-blue-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
          <DollarSign className="w-5 h-5 mr-2" />
          Top-Up Request Summary
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <div className="text-sm text-blue-700 font-medium">Requested Amount</div>
            <div className="text-2xl font-bold text-blue-900">{formatCurrency(topUpAmount)}</div>
          </div>
          <div>
            <div className="text-sm text-blue-700 font-medium">Outstanding Balance</div>
            <div className="text-2xl font-bold text-blue-900">{formatCurrency(loan.outstandingBalance)}</div>
          </div>
          <div>
            <div className="text-sm text-blue-700 font-medium">Ratio</div>
            <div className="text-2xl font-bold text-blue-900">
              {Math.round((topUpAmount / loan.outstandingBalance) * 100)}%
            </div>
          </div>
        </div>
        
        {topUpAmount > loan.outstandingBalance && (
          <div className="mt-4 p-4 bg-yellow-100 border border-yellow-300 rounded-lg">
            <div className="flex items-center">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2" />
              <div>
                <div className="font-medium text-yellow-800">Special Situation</div>
                <div className="text-sm text-yellow-700">
                  Top-up ({formatCurrency(topUpAmount)}) exceeds balance ({formatCurrency(loan.outstandingBalance)}) by {formatCurrency(topUpAmount - loan.outstandingBalance)}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Strategy Options */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Calculator className="w-5 h-5 mr-2" />
          Select Top-Up Strategy
        </h3>
        
        {isCalculating ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mr-3" />
            <span className="text-gray-600">Calculating strategies...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {strategies.map((strategy) => (
              <div
                key={strategy.id}
                className={`border-2 rounded-lg p-6 cursor-pointer transition-all ${
                  getStrategyColor(strategy)
                } ${!strategy.isAvailable ? 'cursor-not-allowed' : ''}`}
                onClick={() => strategy.isAvailable && onStrategySelect(strategy)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <div className={`p-2 rounded-lg mr-3 ${
                      strategy.isAvailable ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'
                    }`}>
                      {getStrategyIcon(strategy.id)}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 flex items-center">
                        {strategy.name}
                        {strategy.isRecommended && (
                          <Star className="w-4 h-4 text-yellow-500 ml-2" />
                        )}
                      </h4>
                      <p className="text-sm text-gray-600">{strategy.description}</p>
                    </div>
                  </div>
                  {selectedStrategy?.id === strategy.id && (
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  )}
                </div>

                {!strategy.isAvailable ? (
                  <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                    <XCircle className="w-4 h-4 inline mr-1" />
                    {strategy.unavailableReason}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-gray-600">Cash to Client</div>
                        <div className="font-semibold text-green-600">
                          {formatCurrency(strategy.calculations.netCashToClient)}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-600">New Monthly Payment</div>
                        <div className="font-semibold">
                          {formatCurrency(strategy.calculations.newMonthlyPayment)}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-600">Total Debt</div>
                        <div className="font-semibold">
                          {formatCurrency(strategy.calculations.totalDebt)}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-600">Tenure</div>
                        <div className="font-semibold">
                          {strategy.calculations.tenure} months
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="text-sm font-medium text-gray-700">Benefits:</div>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {strategy.benefits.map((benefit, index) => (
                          <li key={index} className="flex items-center">
                            <CheckCircle className="w-3 h-3 text-green-500 mr-2" />
                            {benefit}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {strategy.warnings.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-sm font-medium text-gray-700">Warnings:</div>
                        <ul className="text-sm text-yellow-600 space-y-1">
                          {strategy.warnings.map((warning, index) => (
                            <li key={index} className="flex items-center">
                              <AlertTriangle className="w-3 h-3 text-yellow-500 mr-2" />
                              {warning}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Net Top-Up Allocation Slider (only for net_topup strategy) */}
      {selectedStrategy?.id === 'net_topup' && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Sliders className="w-5 h-5 mr-2" />
            Flexible Allocation
          </h4>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount Applied to Loan Reduction: {formatCurrency(netTopUpAllocation.appliedToLoan)}
              </label>
              <input
                type="range"
                min="0"
                max={topUpAmount}
                step="100"
                value={netTopUpAllocation.appliedToLoan}
                onChange={(e) => handleNetTopUpAllocationChange(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-green-50 p-3 rounded-lg">
                <div className="text-green-700 font-medium">Cash to Client</div>
                <div className="text-lg font-bold text-green-800">
                  {formatCurrency(netTopUpAllocation.cashToClient)}
                </div>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="text-blue-700 font-medium">Applied to Loan</div>
                <div className="text-lg font-bold text-blue-800">
                  {formatCurrency(netTopUpAllocation.appliedToLoan)}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Comparison Table Toggle */}
      <div className="flex justify-center">
        <button
          onClick={() => setShowComparison(!showComparison)}
          className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
        >
          <Calculator className="w-4 h-4 mr-2" />
          {showComparison ? 'Hide' : 'Show'} Comparison Table
        </button>
      </div>

      {/* Comparison Table */}
      {showComparison && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Metric
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Current
                  </th>
                  {strategies.filter(s => s.isAvailable).map((strategy) => (
                    <th key={strategy.id} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {strategy.name.split(' ')[0]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    Cash to Client
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatCurrency(0)}
                  </td>
                  {strategies.filter(s => s.isAvailable).map((strategy) => (
                    <td key={strategy.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(strategy.calculations.netCashToClient)}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    Monthly Payment
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatCurrency(comparisonData.current.monthlyPayment)}
                  </td>
                  {strategies.filter(s => s.isAvailable).map((strategy) => {
                    const change = calculatePercentageChange(
                      comparisonData.current.monthlyPayment,
                      strategy.calculations.newMonthlyPayment
                    );
                    const isImprovement = strategy.calculations.newMonthlyPayment < comparisonData.current.monthlyPayment;
                    return (
                      <td key={strategy.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center">
                          {formatCurrency(strategy.calculations.newMonthlyPayment)}
                          <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                            isImprovement ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {change}
                          </span>
                        </div>
                      </td>
                    );
                  })}
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    Total Debt
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatCurrency(comparisonData.current.totalDebt)}
                  </td>
                  {strategies.filter(s => s.isAvailable).map((strategy) => {
                    const isReduction = strategy.calculations.totalDebt < comparisonData.current.totalDebt;
                    return (
                      <td key={strategy.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center">
                          {formatCurrency(strategy.calculations.totalDebt)}
                          {isReduction && (
                            <span className="ml-2 text-green-600 text-xs">↓</span>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    Loan Ends In
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {comparisonData.current.tenure} months
                  </td>
                  {strategies.filter(s => s.isAvailable).map((strategy) => (
                    <td key={strategy.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {strategy.calculations.tenure} months
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    DTI Ratio
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {comparisonData.current.dtiRatio}%
                  </td>
                  {strategies.filter(s => s.isAvailable).map((strategy) => {
                    const dtiStatus = strategy.calculations.dtiRatio <= 40 ? '✅' : 
                                    strategy.calculations.dtiRatio <= 50 ? '⚠️' : '❌';
                    return (
                      <td key={strategy.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center">
                          {strategy.calculations.dtiRatio}%
                          <span className="ml-2">{dtiStatus}</span>
                        </div>
                      </td>
                    );
                  })}
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    Old Loan Status
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {comparisonData.current.loanStatus}
                  </td>
                  {strategies.filter(s => s.isAvailable).map((strategy) => (
                    <td key={strategy.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {comparisonData.strategies[strategy.id].loanStatus}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default StrategySelector;







