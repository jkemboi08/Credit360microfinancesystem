import React from 'react';
import { CheckCircle, Clock, FileText, Upload, DollarSign, AlertCircle } from 'lucide-react';

interface ProgressStep {
  id: string;
  title: string;
  description: string;
  status: 'completed' | 'current' | 'pending' | 'locked';
  icon: React.ReactNode;
}

interface LoanProcessingProgressProps {
  currentStep: string;
  loanStatus: string;
  contractStatus: string;
  onStepClick: (stepId: string) => void;
}

const LoanProcessingProgress: React.FC<LoanProcessingProgressProps> = ({
  currentStep,
  loanStatus,
  contractStatus,
  onStepClick
}) => {
  const getStepStatus = (stepId: string): 'completed' | 'current' | 'pending' | 'locked' => {
    const stepOrder = ['assessment', 'contract_generation', 'contract_upload'];
    const currentIndex = stepOrder.indexOf(currentStep);
    const stepIndex = stepOrder.indexOf(stepId);

    // Special handling for contract upload completion
    if (stepId === 'contract_upload' && (contractStatus === 'uploaded' || contractStatus === 'verified' || contractStatus === 'signed')) {
      return 'completed';
    }

    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'current';
    if (stepIndex === currentIndex + 1) return 'pending';
    return 'locked';
  };

  const steps: ProgressStep[] = [
    {
      id: 'assessment',
      title: 'Credit Assessment',
      description: 'Evaluate creditworthiness and risk',
      status: getStepStatus('assessment'),
      icon: <CheckCircle className="w-5 h-5" />
    },
    {
      id: 'contract_generation',
      title: 'Contract Generation',
      description: 'Generate loan contract document',
      status: getStepStatus('contract_generation'),
      icon: <FileText className="w-5 h-5" />
    },
    {
      id: 'contract_upload',
      title: 'Contract Upload',
      description: 'Upload signed contract from client (Final Step)',
      status: getStepStatus('contract_upload'),
      icon: <Upload className="w-5 h-5" />
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'current':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'pending':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'locked':
        return 'text-gray-400 bg-gray-50 border-gray-200';
      default:
        return 'text-gray-400 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'current':
        return <Clock className="w-4 h-4 text-blue-600" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'locked':
        return <AlertCircle className="w-4 h-4 text-gray-400" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Loan Processing Progress</h3>
        <p className="text-sm text-gray-600">Track the progress of this loan application</p>
      </div>

      <div className="space-y-4">
        {steps.map((step, index) => (
          <div key={step.id} className="relative">
            {/* Connection Line */}
            {index < steps.length - 1 && (
              <div className={`absolute left-6 top-12 w-0.5 h-8 ${
                step.status === 'completed' ? 'bg-green-200' : 'bg-gray-200'
              }`} />
            )}

            <button
              onClick={() => onStepClick(step.id)}
              disabled={step.status === 'locked'}
              className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 ${
                getStatusColor(step.status)
              } ${
                step.status === 'locked' 
                  ? 'cursor-not-allowed opacity-50' 
                  : 'cursor-pointer hover:shadow-md'
              }`}
            >
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  {getStatusIcon(step.status)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium">{step.title}</h4>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      step.status === 'completed' ? 'bg-green-100 text-green-800' :
                      step.status === 'current' ? 'bg-blue-100 text-blue-800' :
                      step.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {step.status === 'completed' ? 'Completed' :
                       step.status === 'current' ? 'Current' :
                       step.status === 'pending' ? 'Next' : 'Locked'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">{step.description}</p>
                </div>
              </div>
            </button>
          </div>
        ))}
      </div>

      {/* Status Summary */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Current Status</h4>
        <div className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-600">Loan Status:</span>
            <span className="font-medium capitalize">{loanStatus.replace(/_/g, ' ')}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Contract Status:</span>
            <span className="font-medium capitalize">{contractStatus.replace(/_/g, ' ')}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoanProcessingProgress;




