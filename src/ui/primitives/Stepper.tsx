import React from 'react';

export interface StepperProps {
  currentStep: number;
  totalSteps: number;
  stepTitle: string;
  className?: string;
}

const STAGE_TITLES = [
  'Where you live',
  'Who lives here',
  'Your home',
  'Getting around',
  'Daily routine',
];

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

      {/* Visual stage indicators for all 5 initial stages */}
      <div className="aw-stepper-stages" aria-label="Stages overview">
        {Array.from({ length: totalSteps }, (_, idx) => {
          const stepNum = idx + 1;
          const isActive = stepNum === currentStep;
          const isComplete = stepNum < currentStep;
          return (
            <div
              key={stepNum}
              className={`step-bar ${isActive ? 'active' : ''} ${isComplete ? 'complete' : ''}`.trim()}
              title={`Stage ${stepNum}: ${STAGE_TITLES[idx] || `Stage ${stepNum}`}`}
              aria-current={isActive ? 'step' : undefined}
            />
          );
        })}
      </div>
    </div>
  );
};

export default Stepper;
