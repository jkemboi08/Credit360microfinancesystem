import React from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, DollarSign, TrendingUp, Clock, Shield } from 'lucide-react';
import { LoanData, TopUpEligibility } from '../../types/topUp.types';
import { formatCurrency } from '../../utils/topUpCalculations';

interface EligibilityCheckProps {
  loan: LoanData;
  eligibility: TopUpEligibility;
  topUpAmount: number;
  onTopUpAmountChange: (amount: number) => void;
  requestedTenure: number;
  onRequestedTenureChange: (tenure: number) => void;
}

const EligibilityCheck: React.FC<EligibilityCheckProps> = ({
  loan,
  eligibility,
  topUpAmount,
  onTopUpAmountChange,
  requestedTenure,
  onRequestedTenureChange
}) => {
  const getCriteriaIcon = (passed: boolean) => {
    return passed ? (
      <CheckCircle className="w-5 h-5 text-green-600" />
    ) : (
      <XCircle className="w-5 h-5 text-red-600" />
    );
  };

  const getCriteriaColor = (passed: boolean) => {
    return passed ? 'text-green-800' : 'text-red-800';
  };

  return (
    <div className="space-y-6">
      {/* Client Information Summary */}
      <div className="bg-blue-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
          <Info className="w-5 h-5 mr-2" />
          Client Information Summary
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-blue-700 font-medium">Client Name</div>
            <div className="text-lg text-blue-900">{loan.clientName}</div>
          </div>
          <div>
            <div className="text-sm text-blue-700 font-medium">Phone Number</div>
            <div className="text-lg text-blue-900">{loan.clientPhone}</div>
          </div>
          <div>
            <div className="text-sm text-blue-700 font-medium">Monthly Income</div>
            <div className="text-lg text-blue-900">{formatCurrency(loan.monthlyIncome)}</div>
          </div>
          <div>
            <div className="text-sm text-blue-700 font-medium">Current DTI Ratio</div>
            <div className="text-lg text-blue-900">{loan.dtiRatio}%</div>
          </div>
        </div>
      </div>

      {/* Current Loan Details */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <DollarSign className="w-5 h-5 mr-2" />
          Current Loan Details
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <div className="text-sm text-gray-600 font-medium">Loan Number</div>
            <div className="text-lg text-gray-900">{loan.id.slice(-8)}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600 font-medium">Original Amount</div>
            <div className="text-lg text-gray-900">{formatCurrency(loan.originalAmount)}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600 font-medium">Outstanding Balance</div>
            <div className="text-lg text-gray-900">{formatCurrency(loan.outstandingBalance)}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600 font-medium">Monthly Payment</div>
            <div className="text-lg text-gray-900">{formatCurrency(loan.monthlyPayment)}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600 font-medium">Remaining Tenure</div>
            <div className="text-lg text-gray-900">{loan.remainingMonths} months</div>
          </div>
          <div>
            <div className="text-sm text-gray-600 font-medium">Payment Status</div>
            <div className={`text-lg font-medium ${
              loan.daysPastDue === 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {loan.daysPastDue === 0 ? 'Current' : `${loan.daysPastDue} days overdue`}
            </div>
          </div>
        </div>
      </div>

      {/* Top-Up Amount and Tenure Input */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <TrendingUp className="w-5 h-5 mr-2" />
          Requested Top-Up Details
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Top-Up Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amount (TZS)
            </label>
            <div className="relative">
              <input
                type="number"
                min="500"
                max={eligibility.maxTopUpAmount}
                value={topUpAmount}
                onChange={(e) => onTopUpAmountChange(Number(e.target.value))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
                placeholder="Enter top-up amount"
              />
              <div className="absolute right-3 top-3 text-gray-500">
                TZS
              </div>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Maximum allowed: {formatCurrency(eligibility.maxTopUpAmount)}
            </p>
          </div>

          {/* Loan Tenure */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Loan Tenure (Months)
            </label>
            <div className="relative">
              <input
                type="number"
                min="3"
                max="36"
                value={requestedTenure}
                onChange={(e) => onRequestedTenureChange(Number(e.target.value))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
                placeholder="Enter loan tenure"
              />
              <div className="absolute right-3 top-3 text-gray-500">
                months
              </div>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Current loan tenure: {loan.remainingMonths} months remaining
            </p>
          </div>
        </div>
      </div>

      {/* Eligibility Criteria */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Shield className="w-5 h-5 mr-2" />
          Eligibility Criteria
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center">
              {getCriteriaIcon(eligibility.eligibilityCriteria.paymentHistory.passed)}
              <div className="ml-3">
                <div className="font-medium text-gray-900">Payment History</div>
                <div className="text-sm text-gray-600">
                  {eligibility.eligibilityCriteria.paymentHistory.percentage}% on-time payments
                </div>
              </div>
            </div>
            <div className={`text-sm font-medium ${getCriteriaColor(eligibility.eligibilityCriteria.paymentHistory.passed)}`}>
              {eligibility.eligibilityCriteria.paymentHistory.passed ? 'PASSED' : 'FAILED'}
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center">
              {getCriteriaIcon(eligibility.eligibilityCriteria.daysOverdue.passed)}
              <div className="ml-3">
                <div className="font-medium text-gray-900">No Missed Payments</div>
                <div className="text-sm text-gray-600">
                  {eligibility.eligibilityCriteria.daysOverdue.days} days past due
                </div>
              </div>
            </div>
            <div className={`text-sm font-medium ${getCriteriaColor(eligibility.eligibilityCriteria.daysOverdue.passed)}`}>
              {eligibility.eligibilityCriteria.daysOverdue.passed ? 'PASSED' : 'FAILED'}
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center">
              {getCriteriaIcon(eligibility.eligibilityCriteria.dtiRatio.passed)}
              <div className="ml-3">
                <div className="font-medium text-gray-900">DTI Ratio</div>
                <div className="text-sm text-gray-600">
                  {eligibility.eligibilityCriteria.dtiRatio.ratio}% (limit: 80%)
                </div>
              </div>
            </div>
            <div className={`text-sm font-medium ${getCriteriaColor(eligibility.eligibilityCriteria.dtiRatio.passed)}`}>
              {eligibility.eligibilityCriteria.dtiRatio.passed ? 'PASSED' : 'FAILED'}
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center">
              {getCriteriaIcon(eligibility.eligibilityCriteria.exposureLimit.passed)}
              <div className="ml-3">
                <div className="font-medium text-gray-900">Exposure Limit</div>
                <div className="text-sm text-gray-600">
                  {formatCurrency(eligibility.eligibilityCriteria.exposureLimit.currentExposure)} / {formatCurrency(eligibility.eligibilityCriteria.exposureLimit.maxExposure)}
                </div>
              </div>
            </div>
            <div className={`text-sm font-medium ${getCriteriaColor(eligibility.eligibilityCriteria.exposureLimit.passed)}`}>
              {eligibility.eligibilityCriteria.exposureLimit.passed ? 'PASSED' : 'FAILED'}
            </div>
          </div>
        </div>
      </div>

      {/* Recommendation */}
      <div className={`rounded-lg p-6 ${
        eligibility.isEligible 
          ? 'bg-green-50 border border-green-200' 
          : 'bg-red-50 border border-red-200'
      }`}>
        <div className="flex items-center">
          {eligibility.isEligible ? (
            <CheckCircle className="w-6 h-6 text-green-600 mr-3" />
          ) : (
            <XCircle className="w-6 h-6 text-red-600 mr-3" />
          )}
          <div>
            <h4 className={`text-lg font-semibold ${
              eligibility.isEligible ? 'text-green-900' : 'text-red-900'
            }`}>
              {eligibility.isEligible ? 'Client is Eligible for Top-Up' : 'Client is Not Eligible'}
            </h4>
            <p className={`text-sm mt-1 ${
              eligibility.isEligible ? 'text-green-700' : 'text-red-700'
            }`}>
              {eligibility.reason}
            </p>
            {eligibility.isEligible && eligibility.recommendedStrategy && (
              <p className="text-sm text-green-700 mt-2">
                Recommended strategy: {eligibility.recommendedStrategy.replace('_', ' ').toUpperCase()}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EligibilityCheck;





