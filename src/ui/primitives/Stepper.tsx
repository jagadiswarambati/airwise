import React from 'react';

export interface StepperProps {
  currentStep: number;
  totalSteps: number;
  stepTitle: string;
  className?: string;
}

export const Stepper: React.FC<StepperProps> = ({
  currentStep,
  totalSteps,
  stepTitle,
  className = '',
}) => {
  const progressPercent = Math.round((currentStep / totalSteps) * 100);

  return (
    <div
      className={`aw-stepper mb-4 ${className}`.trim()}
      role="group"
      aria-label={`Step ${currentStep} of ${totalSteps}: ${stepTitle}`}
    >
      <div className="aw-stepper-header flex-between mb-1">
        <span className="aw-stepper-label text-sm font-semibold">
          Step {currentStep} of {totalSteps}: {stepTitle}
        </span>
        <span className="aw-stepper-percent text-xs text-muted" aria-hidden="true">
          {progressPercent}%
        </span>
      </div>

      <div className="aw-stepper-track" aria-hidden="true">
        <div
          className="aw-stepper-fill"
          style={{ ['--stepper-progress' as string]: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
};

export default Stepper;
