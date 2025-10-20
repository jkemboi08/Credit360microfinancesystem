import React, { useState, useEffect } from 'react';
import { X, ArrowLeft, ArrowRight, CheckCircle, AlertTriangle, Info, Calculator, TrendingUp, DollarSign, Clock, Shield } from 'lucide-react';
import { LoanData, TopUpEligibility, TopUpStrategy, NetTopUpAllocation } from '../../types/topUp.types';
import { calculateStrategyOptions, formatCurrency, calculatePercentageChange } from '../../utils/topUpCalculations';
import { useTopUpSubmission } from '../../hooks/useTopUp';
import { useSupabaseAuth } from '../../context/SupabaseAuthContext';
import toast from 'react-hot-toast';
import EligibilityCheck from './EligibilityCheck';
import StrategySelector from './StrategySelector';
import StrategyDetails from './StrategyDetails';
import SubmissionConfirmation from './SubmissionConfirmation';

interface TopUpRequestDialogProps {
  loan: LoanData;
  eligibility: TopUpEligibility;
  onClose: () => void;
  onSuccess: () => void;
}

type DialogStep = 'eligibility' | 'strategy' | 'details' | 'confirmation';

const TopUpRequestDialog: React.FC<TopUpRequestDialogProps> = ({
  loan,
  eligibility,
  onClose,
  onSuccess
}) => {
  const { user: currentUser } = useSupabaseAuth();
  const { submitRequest, submitting, error } = useTopUpSubmission();
  const [currentStep, setCurrentStep] = useState<DialogStep>('eligibility');
  const [topUpAmount, setTopUpAmount] = useState<number>(0);
  const [requestedTenure, setRequestedTenure] = useState<number>(12); // Default to 12 months
  const [selectedStrategy, setSelectedStrategy] = useState<TopUpStrategy | null>(null);
  const [netTopUpAllocation, setNetTopUpAllocation] = useState<NetTopUpAllocation>({
    appliedToLoan: 0,
    cashToClient: 0
  });
  const [strategies, setStrategies] = useState<TopUpStrategy[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [submittedRequest, setSubmittedRequest] = useState<any>(null);

  // Initialize top-up amount and tenure with defaults
  useEffect(() => {
    if (eligibility.isEligible) {
      setTopUpAmount(Math.min(eligibility.maxTopUpAmount, 10000)); // Default to 10,000 or max allowed
      setRequestedTenure(loan.remainingMonths || 12); // Default to remaining months or 12
    }
  }, [eligibility, loan.remainingMonths]);

  // Calculate strategies when top-up amount or tenure changes
  useEffect(() => {
    if (topUpAmount > 0) {
      calculateStrategies();
    }
  }, [topUpAmount, requestedTenure, netTopUpAllocation]);

  const calculateStrategies = async () => {
    setIsCalculating(true);
    try {
      const calculatedStrategies = calculateStrategyOptions(loan, topUpAmount, netTopUpAllocation, requestedTenure);
      setStrategies(calculatedStrategies);
    } catch (error) {
      console.error('Error calculating strategies:', error);
    } finally {
      setIsCalculating(false);
    }
  };

  const handleNext = () => {
    switch (currentStep) {
      case 'eligibility':
        if (eligibility.isEligible) {
          setCurrentStep('strategy');
        }
        break;
      case 'strategy':
        if (selectedStrategy) {
          setCurrentStep('details');
        }
        break;
      case 'details':
        setCurrentStep('confirmation');
        break;
      case 'confirmation':
        handleSubmit();
        break;
    }
  };

  const handleBack = () => {
    switch (currentStep) {
      case 'strategy':
        setCurrentStep('eligibility');
        break;
      case 'details':
        setCurrentStep('strategy');
        break;
      case 'confirmation':
        setCurrentStep('details');
        break;
    }
  };

  const handleSubmit = async () => {
    if (!selectedStrategy || !currentUser) return;

    try {
      const requestData = {
        clientId: loan.clientId,
        existingLoanId: loan.id,
        requestedAmount: topUpAmount,
        requestedTenure: requestedTenure,
        selectedStrategy: selectedStrategy.id as any,
        strategyDetails: {
          settlementAmount: selectedStrategy.calculations.settlementAmount,
          newLoanAmount: selectedStrategy.calculations.newLoanAmount,
          netCashAmount: selectedStrategy.calculations.netCashToClient,
          loanReductionAmount: selectedStrategy.calculations.loanReductionAmount
        },
        disbursementMethod: 'mpesa' as any,
        disbursementDetails: {
          phoneNumber: loan.clientPhone,
          accountNumber: null
        },
        fees: {
          processingFee: topUpAmount * 0.01,
          insuranceFee: topUpAmount * 0.005,
          netDisbursement: topUpAmount * 0.985
        },
        requirementsChecklist: {
          clientInformed: true,
          consentObtained: true,
          collateralVerified: true,
          guarantorNotified: true
        },
        dtiOverride: selectedStrategy.calculations.dtiRatio > 40 ? {
          approved: true,
          approvedBy: currentUser.id,
          reason: 'High DTI approved by supervisor'
        } : undefined,
        staffNotes: 'Top-up request submitted via enhanced loan monitoring system',
        createdBy: currentUser.id
      };

      const result = await submitRequest(requestData);
      setSubmittedRequest(result);
      toast.success('Top-up request submitted successfully!');
      setCurrentStep('confirmation');
    } catch (error) {
      console.error('Error submitting top-up request:', error);
      toast.error('Failed to submit top-up request');
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 'eligibility':
        return eligibility.isEligible;
      case 'strategy':
        return selectedStrategy !== null;
      case 'details':
        return true; // Add validation logic here
      case 'confirmation':
        return true;
      default:
        return false;
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 'eligibility':
        return 'Eligibility Check';
      case 'strategy':
        return 'Select Top-Up Strategy';
      case 'details':
        return 'Review & Confirm';
      case 'confirmation':
        return 'Submission Confirmation';
      default:
        return '';
    }
  };

  const getStepDescription = () => {
    switch (currentStep) {
      case 'eligibility':
        return 'Verify client eligibility for top-up request';
      case 'strategy':
        return 'Choose the best strategy for this top-up';
      case 'details':
        return 'Review details and complete requirements';
      case 'confirmation':
        return 'Your top-up request has been submitted';
      default:
        return '';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{getStepTitle()}</h2>
            <p className="text-sm text-gray-600 mt-1">{getStepDescription()}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Progress Indicator */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center justify-between">
            {['eligibility', 'strategy', 'details', 'confirmation'].map((step, index) => (
              <div key={step} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  currentStep === step 
                    ? 'bg-blue-600 text-white' 
                    : index < ['eligibility', 'strategy', 'details', 'confirmation'].indexOf(currentStep)
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {index < ['eligibility', 'strategy', 'details', 'confirmation'].indexOf(currentStep) ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    index + 1
                  )}
                </div>
                {index < 3 && (
                  <div className={`w-16 h-1 mx-2 ${
                    index < ['eligibility', 'strategy', 'details', 'confirmation'].indexOf(currentStep)
                      ? 'bg-green-600'
                      : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {currentStep === 'eligibility' && (
            <EligibilityCheck
              loan={loan}
              eligibility={eligibility}
              topUpAmount={topUpAmount}
              onTopUpAmountChange={setTopUpAmount}
              requestedTenure={requestedTenure}
              onRequestedTenureChange={setRequestedTenure}
            />
          )}

          {currentStep === 'strategy' && (
            <StrategySelector
              loan={loan}
              topUpAmount={topUpAmount}
              strategies={strategies}
              selectedStrategy={selectedStrategy}
              onStrategySelect={setSelectedStrategy}
              netTopUpAllocation={netTopUpAllocation}
              onNetTopUpAllocationChange={setNetTopUpAllocation}
              isCalculating={isCalculating}
            />
          )}

          {currentStep === 'details' && selectedStrategy && (
            <StrategyDetails
              loan={loan}
              topUpAmount={topUpAmount}
              selectedStrategy={selectedStrategy}
              netTopUpAllocation={netTopUpAllocation}
            />
          )}

          {currentStep === 'confirmation' && (
            <SubmissionConfirmation
              loan={loan}
              topUpAmount={topUpAmount}
              selectedStrategy={selectedStrategy!}
              netTopUpAllocation={netTopUpAllocation}
              submittedRequest={submittedRequest}
            />
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={currentStep === 'eligibility' ? onClose : handleBack}
            className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {currentStep === 'eligibility' ? 'Cancel' : 'Back'}
          </button>

          <div className="flex items-center space-x-3">
            {currentStep === 'confirmation' ? (
              <button
                onClick={onSuccess}
                className="flex items-center px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Done
              </button>
            ) : (
              <button
                onClick={handleNext}
                disabled={!canProceed() || isCalculating || submitting}
                className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCalculating ? (
                  <>
                    <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Calculating...
                  </>
                ) : submitting ? (
                  <>
                    <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    Next
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopUpRequestDialog;
