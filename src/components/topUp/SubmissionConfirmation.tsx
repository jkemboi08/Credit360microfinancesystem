import React from 'react';
import { CheckCircle, Clock, User, FileText, DollarSign, TrendingUp, Calendar, Phone, Mail } from 'lucide-react';
import { LoanData, TopUpStrategy, NetTopUpAllocation } from '../../types/topUp.types';
import { formatCurrency } from '../../utils/topUpCalculations';

interface SubmissionConfirmationProps {
  loan: LoanData;
  topUpAmount: number;
  selectedStrategy: TopUpStrategy;
  netTopUpAllocation: NetTopUpAllocation;
  submittedRequest?: any;
}

const SubmissionConfirmation: React.FC<SubmissionConfirmationProps> = ({
  loan,
  topUpAmount,
  selectedStrategy,
  netTopUpAllocation,
  submittedRequest
}) => {
  const requestId = submittedRequest?.id || `TR-${Date.now().toString().slice(-6)}`;
  const requestNumber = submittedRequest?.request_number || `TR-2025-${requestId.slice(-6)}`;

  const getWorkflowSteps = () => {
    return [
      {
        step: 'Credit Officer Review',
        status: 'pending',
        description: 'Initial review of top-up request and client eligibility',
        estimatedTime: '1-2 hours'
      },
      {
        step: 'Supervisor Approval',
        status: 'pending',
        description: 'Supervisor review and approval of the request',
        estimatedTime: '2-4 hours'
      },
      {
        step: 'Committee Approval',
        status: 'pending',
        description: 'Final committee approval for disbursement',
        estimatedTime: '1-2 days'
      },
      {
        step: 'Disbursement',
        status: 'pending',
        description: 'Funds disbursed to client account',
        estimatedTime: 'Same day after approval'
      }
    ];
  };

  const workflowSteps = getWorkflowSteps();

  const getStrategySummary = () => {
    switch (selectedStrategy.id) {
      case 'consolidation':
        return {
          title: 'Consolidation (Full Refinancing)',
          description: 'Close old loan and create new larger loan',
          keyPoints: [
            `New loan amount: ${formatCurrency(selectedStrategy.calculations.newLoanAmount!)}`,
            `Monthly payment: ${formatCurrency(selectedStrategy.calculations.newMonthlyPayment)}`,
            `Tenure: ${selectedStrategy.calculations.tenure} months`,
            `Cash to client: ${formatCurrency(selectedStrategy.calculations.netCashToClient)}`
          ]
        };
      case 'settlement_plus_new':
        return {
          title: 'Settlement + New Loan (Clean Slate)',
          description: 'Pay off old loan completely and start fresh',
          keyPoints: [
            `Settlement amount: ${formatCurrency(selectedStrategy.calculations.settlementAmount!)}`,
            `New loan amount: ${formatCurrency(selectedStrategy.calculations.newLoanAmount!)}`,
            `Monthly payment: ${formatCurrency(selectedStrategy.calculations.newMonthlyPayment)}`,
            `Tenure: ${selectedStrategy.calculations.tenure} months`,
            `Cash to client: ${formatCurrency(selectedStrategy.calculations.netCashToClient)}`
          ]
        };
      case 'net_topup':
        return {
          title: 'Net Top-Up (Flexible Allocation)',
          description: 'Custom split between loan reduction and cash',
          keyPoints: [
            `Applied to loan: ${formatCurrency(netTopUpAllocation.appliedToLoan)}`,
            `Cash to client: ${formatCurrency(netTopUpAllocation.cashToClient)}`,
            `New monthly payment: ${formatCurrency(selectedStrategy.calculations.newMonthlyPayment)}`,
            `Tenure: ${selectedStrategy.calculations.tenure} months (unchanged)`
          ]
        };
      case 'stacking':
        return {
          title: 'Stacking (Separate Loans)',
          description: 'Keep existing loan active and add new loan',
          keyPoints: [
            `Existing loan payment: ${formatCurrency(loan.monthlyPayment)}`,
            `New loan payment: ${formatCurrency(selectedStrategy.calculations.newMonthlyPayment - loan.monthlyPayment)}`,
            `Total monthly payment: ${formatCurrency(selectedStrategy.calculations.newMonthlyPayment)}`,
            `Cash to client: ${formatCurrency(selectedStrategy.calculations.netCashToClient)}`
          ]
        };
      default:
        return {
          title: 'Unknown Strategy',
          description: '',
          keyPoints: []
        };
    }
  };

  const strategySummary = getStrategySummary();

  return (
    <div className="space-y-6">
      {/* Success Message */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <div className="flex items-center">
          <CheckCircle className="w-8 h-8 text-green-600 mr-4" />
          <div>
            <h3 className="text-xl font-semibold text-green-900">Top-Up Request Submitted Successfully!</h3>
            <p className="text-green-700 mt-1">
              Your top-up request has been submitted and is now in the approval workflow.
            </p>
          </div>
        </div>
      </div>

      {/* Request Summary */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <FileText className="w-5 h-5 mr-2" />
          Request Summary
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h5 className="font-semibold text-gray-900 mb-3">Request Details</h5>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Request ID:</span>
                <span className="font-medium">{requestId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Request Number:</span>
                <span className="font-medium">{requestNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Submitted Date:</span>
                <span className="font-medium">{new Date().toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className="font-medium text-blue-600">Pending Credit Review</span>
              </div>
            </div>
          </div>
          <div>
            <h5 className="font-semibold text-gray-900 mb-3">Client Information</h5>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Name:</span>
                <span className="font-medium">{loan.clientName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Phone:</span>
                <span className="font-medium">{loan.clientPhone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Email:</span>
                <span className="font-medium">{loan.clientEmail}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Monthly Income:</span>
                <span className="font-medium">{formatCurrency(loan.monthlyIncome)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Old Loan Details */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <DollarSign className="w-5 h-5 mr-2" />
          Current Loan Details
        </h4>
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
            <div className="text-sm text-gray-600 font-medium">Interest Rate</div>
            <div className="text-lg text-gray-900">{loan.interestRate}% p.a.</div>
          </div>
        </div>
      </div>

      {/* New Loan Details */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h4 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
          <TrendingUp className="w-5 h-5 mr-2" />
          {strategySummary.title}
        </h4>
        <p className="text-blue-700 mb-4">{strategySummary.description}</p>
        <div className="space-y-2">
          {strategySummary.keyPoints.map((point, index) => (
            <div key={index} className="flex items-center text-sm text-blue-800">
              <CheckCircle className="w-4 h-4 text-blue-600 mr-2" />
              {point}
            </div>
          ))}
        </div>
      </div>

      {/* Approval Workflow */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Clock className="w-5 h-5 mr-2" />
          Approval Workflow
        </h4>
        <div className="space-y-4">
          {workflowSteps.map((step, index) => (
            <div key={index} className="flex items-start">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium mr-4 ${
                step.status === 'completed' 
                  ? 'bg-green-600 text-white' 
                  : step.status === 'current'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}>
                {step.status === 'completed' ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  index + 1
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h5 className="font-semibold text-gray-900">{step.step}</h5>
                  <span className="text-sm text-gray-500">{step.estimatedTime}</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">{step.description}</p>
                {index < workflowSteps.length - 1 && (
                  <div className="w-px h-8 bg-gray-200 ml-4 mt-2"></div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Next Steps */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <h4 className="text-lg font-semibold text-yellow-900 mb-4 flex items-center">
          <Calendar className="w-5 h-5 mr-2" />
          Next Steps
        </h4>
        <div className="space-y-3 text-sm text-yellow-800">
          <div className="flex items-start">
            <div className="w-2 h-2 bg-yellow-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
            <div>
              <strong>Client Notification:</strong> An SMS will be sent to {loan.clientPhone} confirming the top-up request submission.
            </div>
          </div>
          <div className="flex items-start">
            <div className="w-2 h-2 bg-yellow-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
            <div>
              <strong>Credit Officer Review:</strong> The request will be reviewed by a credit officer within 1-2 hours.
            </div>
          </div>
          <div className="flex items-start">
            <div className="w-2 h-2 bg-yellow-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
            <div>
              <strong>Supervisor Approval:</strong> If approved, the request will be forwarded to a supervisor for final approval.
            </div>
          </div>
          <div className="flex items-start">
            <div className="w-2 h-2 bg-yellow-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
            <div>
              <strong>Committee Review:</strong> The loan committee will review and approve the disbursement.
            </div>
          </div>
          <div className="flex items-start">
            <div className="w-2 h-2 bg-yellow-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
            <div>
              <strong>Disbursement:</strong> Once approved, funds will be disbursed to the client's account on the same day.
            </div>
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Phone className="w-5 h-5 mr-2" />
          Need Help?
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <div className="font-medium text-gray-900">Credit Department</div>
            <div className="text-gray-600">+255 123 456 789</div>
            <div className="text-gray-600">credit@company.com</div>
          </div>
          <div>
            <div className="font-medium text-gray-900">Customer Service</div>
            <div className="text-gray-600">+255 987 654 321</div>
            <div className="text-gray-600">support@company.com</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubmissionConfirmation;
