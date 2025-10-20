import React from 'react';
import { CheckCircle, Clock, AlertCircle, ArrowRight, FileText, Upload, Shield, DollarSign } from 'lucide-react';
import { LoanProgressStatus } from '../services/loanWorkflowTracker';

interface LoanProgressPanelProps {
  progress: LoanProgressStatus;
  onAction: (action: string) => void;
  onClose: () => void;
}

const LoanProgressPanel: React.FC<LoanProgressPanelProps> = ({ progress, onAction, onClose }) => {
  const steps = [
    {
      id: 'assessment',
      title: 'Credit Assessment',
      description: 'Evaluate creditworthiness and risk',
      icon: <Shield className="w-5 h-5" />,
      completed: progress.isAssessmentCompleted,
      current: progress.currentStep === 'assessment',
      canProceed: progress.isAssessmentCompleted
    },
    {
      id: 'contract_generation',
      title: 'Contract Generation',
      description: 'Generate loan contract document',
      icon: <FileText className="w-5 h-5" />,
      completed: progress.isContractGenerated,
      current: progress.currentStep === 'contract_generation',
      canProceed: progress.canGenerateContract
    },
    {
      id: 'contract_upload',
      title: 'Contract Upload',
      description: 'Upload signed contract from client (Final Step)',
      icon: <Upload className="w-5 h-5" />,
      completed: progress.isContractSigned,
      current: progress.currentStep === 'contract_upload',
      canProceed: progress.canUploadContract
    }
  ];

  const getStepStatus = (step: any) => {
    if (step.completed) return 'completed';
    if (step.current) return 'current';
    if (step.canProceed) return 'available';
    return 'locked';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'current':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'available':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'locked':
        return 'bg-gray-100 text-gray-500 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-500 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'current':
        return <Clock className="w-5 h-5 text-blue-600" />;
      case 'available':
        return <ArrowRight className="w-5 h-5 text-yellow-600" />;
      case 'locked':
        return <AlertCircle className="w-5 h-5 text-gray-400" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold text-gray-900">Loan Processing Progress</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <AlertCircle className="w-6 h-6" />
            </button>
          </div>

          {/* Progress Overview */}
          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-lg font-medium text-blue-900">Progress Overview</h4>
                <p className="text-sm text-blue-700">
                  Current Step: {progress.currentStep.replace('_', ' ').toUpperCase()}
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-900">{progress.progressPercentage}%</div>
                <div className="text-sm text-blue-700">Complete</div>
              </div>
            </div>
            <div className="mt-3">
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress.progressPercentage}%` }}
                />
              </div>
            </div>
          </div>

          {/* Workflow Steps */}
          <div className="space-y-4">
            {steps.map((step, index) => {
              const status = getStepStatus(step);
              const isClickable = status === 'available' || status === 'current';
              
              return (
                <div key={step.id} className="relative">
                  {/* Connection Line */}
                  {index < steps.length - 1 && (
                    <div className={`absolute left-6 top-12 w-0.5 h-8 ${
                      status === 'completed' ? 'bg-green-200' : 'bg-gray-200'
                    }`} />
                  )}

                  <div
                    className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                      getStatusColor(status)
                    } ${
                      isClickable ? 'cursor-pointer hover:shadow-md' : 'cursor-not-allowed'
                    }`}
                    onClick={() => isClickable && onAction(step.id)}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        {getStatusIcon(status)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h5 className="text-sm font-medium">{step.title}</h5>
                          {status === 'available' && (
                            <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-1 rounded-full">
                              Click to proceed
                            </span>
                          )}
                        </div>
                        <p className="text-xs mt-1 opacity-75">{step.description}</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Close
            </button>
            {progress.nextStep && (
              <button
                onClick={() => onAction(progress.nextStep)}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Proceed to {progress.nextStep.replace('_', ' ').toUpperCase()}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoanProgressPanel;























