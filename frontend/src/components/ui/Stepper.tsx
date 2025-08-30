import React from 'react';
import { cn } from '../../utils/cn';
import { Check, ChevronRight } from 'lucide-react';

interface Step {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'current' | 'completed' | 'error';
}

interface StepperProps {
  steps: Step[];
  currentStep: number;
  onStepClick?: (stepIndex: number) => void;
  className?: string;
}

const Stepper: React.FC<StepperProps> = ({
  steps,
  currentStep,
  onStepClick,
  className,
}) => {
  const getStepIcon = (step: Step, index: number) => {
    if (step.status === 'completed') {
      return <Check className="h-5 w-5 text-white" />;
    }
    if (step.status === 'error') {
      return <span className="text-white font-bold">!</span>;
    }
    return <span className="text-sm font-medium">{index + 1}</span>;
  };

  const getStepClasses = (step: Step, index: number) => {
    const baseClasses = 'flex items-center justify-center w-8 h-8 rounded-full border-2 font-medium transition-all duration-200';
    
    if (step.status === 'completed') {
      return cn(baseClasses, 'bg-green-600 border-green-600 text-white');
    }
    if (step.status === 'current') {
      return cn(baseClasses, 'bg-blue-600 border-blue-600 text-white');
    }
    if (step.status === 'error') {
      return cn(baseClasses, 'bg-red-600 border-red-600 text-white');
    }
    return cn(baseClasses, 'bg-white border-gray-300 text-gray-500');
  };

  return (
    <div className={cn('flex items-center justify-center', className)}>
      {steps.map((step, index) => (
        <div key={step.id} className="flex items-center">
          {/* Step Circle */}
          <button
            onClick={() => onStepClick?.(index)}
            className={cn(
              getStepClasses(step, index),
              onStepClick && 'cursor-pointer hover:scale-110'
            )}
            disabled={!onStepClick}
          >
            {getStepIcon(step, index)}
          </button>
          
          {/* Step Label */}
          <div className="ml-3 text-left">
            <div className="text-sm font-medium text-gray-900">{step.title}</div>
            {step.description && (
              <div className="text-xs text-gray-500">{step.description}</div>
            )}
          </div>
          
          {/* Connector Line */}
          {index < steps.length - 1 && (
            <div className="flex items-center mx-4">
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export { Stepper };
export type { Step };
