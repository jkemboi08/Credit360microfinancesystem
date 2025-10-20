import React, { useState } from 'react';
import { CheckCircle, AlertTriangle, DollarSign, Calendar, TrendingUp, Shield, FileText, User, Phone, Mail } from 'lucide-react';
import { LoanData, TopUpStrategy, NetTopUpAllocation } from '../../types/topUp.types';
import { formatCurrency, calculateSettlementAmount, calculateInterestSavings } from '../../utils/topUpCalculations';

interface StrategyDetailsProps {
  loan: LoanData;
  topUpAmount: number;
  selectedStrategy: TopUpStrategy;
  netTopUpAllocation: NetTopUpAllocation;
}

const StrategyDetails: React.FC<StrategyDetailsProps> = ({
  loan,
  topUpAmount,
  selectedStrategy,
  netTopUpAllocation
}) => {
  const [requirements, setRequirements] = useState({
    clientInformed: false,
    consentObtained: false,
    collateralVerified: false,
    guarantorNotified: false
  });

  const [dtiOverride, setDtiOverride] = useState({
    approved: false,
    reason: '',
    approvedBy: ''
  });

  const [staffNotes, setStaffNotes] = useState('');

  const handleRequirementChange = (requirement: keyof typeof requirements) => {
    setRequirements(prev => ({
      ...prev,
      [requirement]: !prev[requirement]
    }));
  };

  const getAffordabilityStatus = (dtiRatio: number) => {
    if (dtiRatio <= 30) return { status: 'Excellent', color: 'text-green-600', bg: 'bg-green-100' };
    if (dtiRatio <= 40) return { status: 'Good', color: 'text-green-600', bg: 'bg-green-100' };
    if (dtiRatio <= 50) return { status: 'Warning', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    return { status: 'Critical', color: 'text-red-600', bg: 'bg-red-100' };
  };

  const renderConsolidationDetails = () => {
    const settlementAmount = calculateSettlementAmount(loan);
    const newLoanAmount = loan.outstandingBalance + topUpAmount;
    const newMonthlyPayment = selectedStrategy.calculations.newMonthlyPayment;
    const totalInterest = newLoanAmount * (loan.interestRate / 100) * (12 / 12);
    const totalRepayment = newLoanAmount + totalInterest;

    return (
      <div className="space-y-6">
        {/* Settlement Calculation */}
        <div className="bg-blue-50 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
            <DollarSign className="w-5 h-5 mr-2" />
            Settlement Calculation
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-blue-700 font-medium">Outstanding Principal</div>
              <div className="text-lg text-blue-900">{formatCurrency(loan.outstandingBalance)}</div>
            </div>
            <div>
              <div className="text-sm text-blue-700 font-medium">Accrued Interest</div>
              <div className="text-lg text-blue-900">{formatCurrency(loan.outstandingBalance * (loan.interestRate / 100) * (loan.daysPastDue / 30))}</div>
            </div>
            <div>
              <div className="text-sm text-blue-700 font-medium">Interest Rebate (50%)</div>
              <div className="text-lg text-green-600">-{formatCurrency(loan.outstandingBalance * (loan.interestRate / 100) * (loan.remainingMonths / 12) * 0.5)}</div>
            </div>
            <div>
              <div className="text-sm text-blue-700 font-medium">Prepayment Penalty</div>
              <div className="text-lg text-blue-900">TZS 0 (Waived for top-ups)</div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-blue-200">
            <div className="flex justify-between items-center">
              <div className="text-lg font-semibold text-blue-900">Total Settlement Amount</div>
              <div className="text-2xl font-bold text-blue-900">{formatCurrency(settlementAmount)}</div>
            </div>
          </div>
        </div>

        {/* New Consolidated Loan Details */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <FileText className="w-5 h-5 mr-2" />
            New Consolidated Loan Details
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-600 font-medium">Loan Number</div>
              <div className="text-lg text-gray-900">LA-{Date.now().toString().slice(-8)}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600 font-medium">Principal Amount</div>
              <div className="text-lg text-gray-900">{formatCurrency(newLoanAmount)}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600 font-medium">Interest Rate</div>
              <div className="text-lg text-gray-900">{loan.interestRate}% p.a.</div>
            </div>
            <div>
              <div className="text-sm text-gray-600 font-medium">Tenure</div>
              <div className="text-lg text-gray-900">12 months</div>
            </div>
            <div>
              <div className="text-sm text-gray-600 font-medium">Monthly Installment</div>
              <div className="text-lg text-gray-900">{formatCurrency(newMonthlyPayment)}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600 font-medium">Total Interest</div>
              <div className="text-lg text-gray-900">{formatCurrency(totalInterest)}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600 font-medium">Total Repayment</div>
              <div className="text-lg text-gray-900">{formatCurrency(totalRepayment)}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600 font-medium">First Payment Due</div>
              <div className="text-lg text-gray-900">{new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}</div>
            </div>
          </div>
        </div>

        {/* Disbursement Details */}
        <div className="bg-green-50 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-green-900 mb-4 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2" />
            Disbursement Details
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-green-700 font-medium">Disbursement Amount</div>
              <div className="text-2xl font-bold text-green-900">{formatCurrency(topUpAmount)}</div>
            </div>
            <div>
              <div className="text-sm text-green-700 font-medium">Processing Fee</div>
              <div className="text-lg text-green-900">{formatCurrency(topUpAmount * 0.01)}</div>
            </div>
            <div>
              <div className="text-sm text-green-700 font-medium">Insurance Fee</div>
              <div className="text-lg text-green-900">{formatCurrency(topUpAmount * 0.005)}</div>
            </div>
            <div>
              <div className="text-sm text-green-700 font-medium">Net Disbursement</div>
              <div className="text-2xl font-bold text-green-900">{formatCurrency(topUpAmount * 0.985)}</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderSettlementPlusNewDetails = () => {
    const settlementAmount = calculateSettlementAmount(loan);
    const newLoanAmount = topUpAmount - settlementAmount;
    const newMonthlyPayment = selectedStrategy.calculations.newMonthlyPayment;
    const interestSavings = calculateInterestSavings(loan, settlementAmount, newLoanAmount, selectedStrategy.calculations.tenure);

    return (
      <div className="space-y-6">
        {/* Step 1: Full Settlement */}
        <div className="bg-red-50 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-red-900 mb-4 flex items-center">
            <CheckCircle className="w-5 h-5 mr-2" />
            Step 1: Full Settlement of Existing Loan
          </h4>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-red-700 font-medium">Settlement Amount</div>
                <div className="text-2xl font-bold text-red-900">{formatCurrency(settlementAmount)}</div>
              </div>
              <div>
                <div className="text-sm text-red-700 font-medium">Source of Settlement</div>
                <div className="text-lg text-red-900">From top-up funds</div>
              </div>
            </div>
            <div className="bg-red-100 p-4 rounded-lg">
              <div className="text-sm text-red-800">
                <strong>Closure Confirmation:</strong> The existing loan will be completely paid off and closed.
              </div>
            </div>
            <div className="text-sm text-red-700">
              <strong>Credit History Impact:</strong> This will improve the client's credit history by showing a successfully completed loan.
            </div>
          </div>
        </div>

        {/* Step 2: New Loan */}
        <div className="bg-blue-50 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
            <FileText className="w-5 h-5 mr-2" />
            Step 2: New Loan for Remaining Amount
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-blue-700 font-medium">Principal Calculation</div>
              <div className="text-lg text-blue-900">{formatCurrency(topUpAmount)} - {formatCurrency(settlementAmount)} = {formatCurrency(newLoanAmount)}</div>
            </div>
            <div>
              <div className="text-sm text-blue-700 font-medium">Interest Rate</div>
              <div className="text-lg text-blue-900">{loan.interestRate}% p.a.</div>
            </div>
            <div>
              <div className="text-sm text-blue-700 font-medium">Tenure</div>
              <div className="text-lg text-blue-900">{selectedStrategy.calculations.tenure} months</div>
            </div>
            <div>
              <div className="text-sm text-blue-700 font-medium">Monthly Payment</div>
              <div className="text-lg text-blue-900">{formatCurrency(newMonthlyPayment)}</div>
            </div>
          </div>
        </div>

        {/* Before & After Comparison */}
        <div className="bg-green-50 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-green-900 mb-4 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2" />
            Before & After Comparison
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h5 className="font-semibold text-gray-900 mb-3">Before (Current Loan)</h5>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Outstanding Balance:</span>
                  <span>{formatCurrency(loan.outstandingBalance)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Monthly Payment:</span>
                  <span>{formatCurrency(loan.monthlyPayment)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Remaining Tenure:</span>
                  <span>{loan.remainingMonths} months</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Debt:</span>
                  <span>{formatCurrency(loan.outstandingBalance)}</span>
                </div>
              </div>
            </div>
            <div>
              <h5 className="font-semibold text-green-900 mb-3">After (New Loan)</h5>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Principal Amount:</span>
                  <span>{formatCurrency(newLoanAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Monthly Payment:</span>
                  <span className="text-green-600">{formatCurrency(newMonthlyPayment)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tenure:</span>
                  <span className="text-green-600">{selectedStrategy.calculations.tenure} months</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Debt:</span>
                  <span className="text-green-600">{formatCurrency(newLoanAmount)}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-4 p-4 bg-green-100 rounded-lg">
            <div className="text-sm text-green-800">
              <strong>Interest Savings:</strong> {formatCurrency(interestSavings)} saved through early settlement
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderNetTopUpDetails = () => {
    const newBalance = loan.outstandingBalance - netTopUpAllocation.appliedToLoan;
    const newMonthlyPayment = selectedStrategy.calculations.newMonthlyPayment;
    const paymentReduction = loan.monthlyPayment - newMonthlyPayment;

    return (
      <div className="space-y-6">
        {/* Transaction Breakdown */}
        <div className="bg-blue-50 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
            <DollarSign className="w-5 h-5 mr-2" />
            Transaction Breakdown
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-blue-700 font-medium">Top-up Approved</div>
              <div className="text-2xl font-bold text-blue-900">{formatCurrency(topUpAmount)}</div>
            </div>
            <div>
              <div className="text-sm text-blue-700 font-medium">Allocation Split</div>
              <div className="text-lg text-blue-900">
                {Math.round((netTopUpAllocation.appliedToLoan / topUpAmount) * 100)}% to loan, {Math.round((netTopUpAllocation.cashToClient / topUpAmount) * 100)}% to client
              </div>
            </div>
          </div>
        </div>

        {/* Allocation Pie Chart */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Allocation Breakdown</h4>
          <div className="flex items-center justify-center">
            <div className="relative w-48 h-48">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="8"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="8"
                  strokeDasharray={`${(netTopUpAllocation.appliedToLoan / topUpAmount) * 251.2} 251.2`}
                  strokeDashoffset="0"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="8"
                  strokeDasharray={`${(netTopUpAllocation.cashToClient / topUpAmount) * 251.2} 251.2`}
                  strokeDashoffset={`-${(netTopUpAllocation.appliedToLoan / topUpAmount) * 251.2}`}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-lg font-bold text-gray-900">{formatCurrency(topUpAmount)}</div>
                  <div className="text-xs text-gray-600">Total Top-up</div>
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-center space-x-6 mt-4">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-blue-500 rounded mr-2"></div>
              <span className="text-sm text-gray-600">Applied to Loan ({formatCurrency(netTopUpAllocation.appliedToLoan)})</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-green-500 rounded mr-2"></div>
              <span className="text-sm text-gray-600">Cash to Client ({formatCurrency(netTopUpAllocation.cashToClient)})</span>
            </div>
          </div>
        </div>

        {/* Existing Loan Modification */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Existing Loan Modification</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h5 className="font-semibold text-gray-900 mb-3">Before Modification</h5>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Outstanding Balance:</span>
                  <span>{formatCurrency(loan.outstandingBalance)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Monthly Payment:</span>
                  <span>{formatCurrency(loan.monthlyPayment)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Remaining Tenure:</span>
                  <span>{loan.remainingMonths} months</span>
                </div>
              </div>
            </div>
            <div>
              <h5 className="font-semibold text-green-900 mb-3">After Modification</h5>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>New Balance:</span>
                  <span className="text-green-600">{formatCurrency(newBalance)}</span>
                </div>
                <div className="flex justify-between">
                  <span>New Payment:</span>
                  <span className="text-green-600">{formatCurrency(newMonthlyPayment)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Remaining Tenure:</span>
                  <span>{loan.remainingMonths} months (unchanged)</span>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-4 p-4 bg-green-100 rounded-lg">
            <div className="text-sm text-green-800">
              <strong>Payment Reduction:</strong> Monthly payment reduced by {formatCurrency(paymentReduction)} ({Math.round((paymentReduction / loan.monthlyPayment) * 100)}%)
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderStackingDetails = () => {
    return (
      <div className="space-y-6">
        <div className="bg-yellow-50 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-yellow-900 mb-4 flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2" />
            Stacking Strategy Details
          </h4>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-yellow-700 font-medium">Existing Loan Payment</div>
                <div className="text-lg text-yellow-900">{formatCurrency(loan.monthlyPayment)}</div>
              </div>
              <div>
                <div className="text-sm text-yellow-700 font-medium">New Loan Payment</div>
                <div className="text-lg text-yellow-900">{formatCurrency(selectedStrategy.calculations.newMonthlyPayment - loan.monthlyPayment)}</div>
              </div>
              <div>
                <div className="text-sm text-yellow-700 font-medium">Total Monthly Payment</div>
                <div className="text-2xl font-bold text-yellow-900">{formatCurrency(selectedStrategy.calculations.newMonthlyPayment)}</div>
              </div>
              <div>
                <div className="text-sm text-yellow-700 font-medium">Total Debt</div>
                <div className="text-2xl font-bold text-yellow-900">{formatCurrency(selectedStrategy.calculations.totalDebt)}</div>
              </div>
            </div>
            <div className="bg-yellow-100 p-4 rounded-lg">
              <div className="text-sm text-yellow-800">
                <strong>Note:</strong> This strategy results in higher monthly payments and increased complexity. Consider other options if available.
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const affordabilityStatus = getAffordabilityStatus(selectedStrategy.calculations.dtiRatio);

  return (
    <div className="space-y-6">
      {/* Strategy-specific details */}
      {selectedStrategy.id === 'consolidation' && renderConsolidationDetails()}
      {selectedStrategy.id === 'settlement_plus_new' && renderSettlementPlusNewDetails()}
      {selectedStrategy.id === 'net_topup' && renderNetTopUpDetails()}
      {selectedStrategy.id === 'stacking' && renderStackingDetails()}

      {/* Affordability Check */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Shield className="w-5 h-5 mr-2" />
          Affordability Check
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <div className="text-sm text-gray-600 font-medium">Client Monthly Income</div>
            <div className="text-lg text-gray-900">{formatCurrency(loan.monthlyIncome)}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600 font-medium">New Monthly Payment</div>
            <div className="text-lg text-gray-900">{formatCurrency(selectedStrategy.calculations.newMonthlyPayment)}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600 font-medium">DTI Ratio</div>
            <div className={`text-lg font-bold ${affordabilityStatus.color}`}>
              {selectedStrategy.calculations.dtiRatio}%
            </div>
          </div>
        </div>
        <div className={`mt-4 p-4 rounded-lg ${affordabilityStatus.bg}`}>
          <div className={`font-medium ${affordabilityStatus.color}`}>
            Affordability Status: {affordabilityStatus.status}
          </div>
          <div className="text-sm text-gray-600 mt-1">
            {selectedStrategy.calculations.dtiRatio <= 40 ? 'Approved' : 'Requires supervisor approval'}
          </div>
        </div>
      </div>

      {/* DTI Override (if needed) */}
      {selectedStrategy.calculations.dtiRatio > 40 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-red-900 mb-4 flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2" />
            DTI Override Required
          </h4>
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="dtiOverride"
                checked={dtiOverride.approved}
                onChange={(e) => setDtiOverride(prev => ({ ...prev, approved: e.target.checked }))}
                className="mr-3"
              />
              <label htmlFor="dtiOverride" className="text-sm font-medium text-red-800">
                Override: Supervisor approved
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-red-700 mb-2">
                Override Reason
              </label>
              <textarea
                value={dtiOverride.reason}
                onChange={(e) => setDtiOverride(prev => ({ ...prev, reason: e.target.value }))}
                className="w-full px-3 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                rows={3}
                placeholder="Explain why this top-up should be approved despite high DTI..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-red-700 mb-2">
                Approved by
              </label>
              <select
                value={dtiOverride.approvedBy}
                onChange={(e) => setDtiOverride(prev => ({ ...prev, approvedBy: e.target.value }))}
                className="w-full px-3 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              >
                <option value="">Select supervisor</option>
                <option value="supervisor1">John Doe - Senior Manager</option>
                <option value="supervisor2">Jane Smith - Credit Manager</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Requirements Checklist */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <CheckCircle className="w-5 h-5 mr-2" />
          Required Actions Checklist
        </h4>
        <div className="space-y-3">
          {Object.entries(requirements).map(([key, checked]) => (
            <div key={key} className="flex items-center">
              <input
                type="checkbox"
                id={key}
                checked={checked}
                onChange={() => handleRequirementChange(key as keyof typeof requirements)}
                className="mr-3"
              />
              <label htmlFor={key} className="text-sm font-medium text-gray-700">
                {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Staff Notes */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <FileText className="w-5 h-5 mr-2" />
          Staff Notes
        </h4>
        <textarea
          value={staffNotes}
          onChange={(e) => setStaffNotes(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          rows={4}
          placeholder="Add any additional notes or observations..."
        />
      </div>
    </div>
  );
};

export default StrategyDetails;







