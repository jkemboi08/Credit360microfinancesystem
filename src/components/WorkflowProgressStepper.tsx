import React from 'react';
import { CheckCircle, Clock, Lock, AlertCircle, ArrowRight } from 'lucide-react';

interface WorkflowStep {
  id: string;
  title: string;
  description: string;
  status: 'completed' | 'in_progress' | 'locked' | 'error';
  icon: React.ReactNode;
}

interface WorkflowProgressStepperProps {
  steps: WorkflowStep[];
  currentStep: number;
  onStepClick?: (stepIndex: number) => void;
}

const WorkflowProgressStepper: React.FC<WorkflowProgressStepperProps> = ({
  steps,
  currentStep,
  onStepClick
}) => {
  const getStepIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'in_progress':
        return <Clock className="w-5 h-5 text-blue-600" />;
      case 'locked':
        return <Lock className="w-5 h-5 text-gray-400" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStepColor = (status: string, isActive: boolean) => {
    if (isActive) {
      return 'bg-blue-50 border-blue-200 text-blue-900';
    }
    
    switch (status) {
      case 'completed':
        return 'bg-green-50 border-green-200 text-green-900';
      case 'in_progress':
        return 'bg-blue-50 border-blue-200 text-blue-900';
      case 'locked':
        return 'bg-gray-50 border-gray-200 text-gray-500';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-900';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-500';
    }
  };

  const getConnectorColor = (stepIndex: number) => {
    if (stepIndex < currentStep) {
      return 'bg-green-500';
    } else if (stepIndex === currentStep) {
      return 'bg-blue-500';
    } else {
      return 'bg-gray-300';
    }
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <React.Fragment key={step.id}>
            <div
              className={`flex-1 p-4 rounded-lg border-2 transition-all duration-200 ${
                getStepColor(step.status, index === currentStep)
              } ${onStepClick ? 'cursor-pointer hover:shadow-md' : ''}`}
              onClick={() => onStepClick && onStepClick(index)}
            >
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  {getStepIcon(step.status)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium truncate">
                    {step.title}
                  </h3>
                  <p className="text-xs opacity-75 truncate">
                    {step.description}
                  </p>
                </div>
              </div>
            </div>
            
            {index < steps.length - 1 && (
              <div className="flex items-center px-2">
                <div className={`w-8 h-0.5 ${getConnectorColor(index)}`}></div>
                <ArrowRight className="w-4 h-4 text-gray-400 mx-1" />
                <div className={`w-8 h-0.5 ${getConnectorColor(index + 1)}`}></div>
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default WorkflowProgressStepper;




