import React from 'react';

export interface StepItem {
  number: number;
  title: string;
  description: string;
}

interface StepListProps {
  steps: StepItem[];
  className?: string;
}

export const StepList: React.FC<StepListProps> = ({ steps, className = '' }) => {
  return (
    <ol className={`aw-step-list ${className}`.trim()}>
      {steps.map((step) => (
        <li key={step.number} className="aw-step-item">
          <div className="aw-step-badge" aria-hidden="true">
            {step.number}
          </div>
          <div className="aw-step-content">
            <h3 className="aw-step-title">{step.title}</h3>
            <p className="aw-step-desc">{step.description}</p>
          </div>
        </li>
      ))}
    </ol>
  );
};
