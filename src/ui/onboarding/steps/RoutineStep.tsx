import React from 'react';
import { Field } from '../../primitives/Field';

export interface RoutineStepProps {
  h1Ref: React.RefObject<HTMLHeadingElement>;
  wake: string;
  setWake: (val: string) => void;
  leave: string;
  setLeave: (val: string) => void;
  returnHome: string;
  setReturnHome: (val: string) => void;
  bed: string;
  setBed: (val: string) => void;
  onBack: () => void;
  getFieldError: (id: string) => string | undefined;
}

interface RoutineTimeFieldsProps {
  wake: string;
  setWake: (val: string) => void;
  leave: string;
  setLeave: (val: string) => void;
  returnHome: string;
  setReturnHome: (val: string) => void;
  bed: string;
  setBed: (val: string) => void;
  getFieldError: (id: string) => string | undefined;
}

function RoutineTimeFields({
  wake,
  setWake,
  leave,
  setLeave,
  returnHome,
  setReturnHome,
  bed,
  setBed,
  getFieldError,
}: RoutineTimeFieldsProps) {
  return (
    <div className="grid-2-col mb-4">
      <Field
        id="routine-wake"
        label="Wake up time"
        helperText="Typical morning waking hour"
        error={getFieldError('routine-wake')}
        required
      >
        <input
          type="time"
          className="form-input"
          value={wake}
          onChange={(e) => setWake(e.target.value)}
          required
        />
      </Field>

      <Field
        id="routine-leave"
        label="Leave home"
        helperText="Morning commute departure"
        error={getFieldError('routine-leave')}
        required
      >
        <input
          type="time"
          className="form-input"
          value={leave}
          onChange={(e) => setLeave(e.target.value)}
          required
        />
      </Field>

      <Field
        id="routine-return"
        label="Return home"
        helperText="Evening commute arrival"
        error={getFieldError('routine-return')}
        required
      >
        <input
          type="time"
          className="form-input"
          value={returnHome}
          onChange={(e) => setReturnHome(e.target.value)}
          required
        />
      </Field>

      <Field
        id="routine-bed"
        label="Bedtime"
        helperText="Nighttime sleeping hour"
        error={getFieldError('routine-bed')}
        required
      >
        <input
          type="time"
          className="form-input"
          value={bed}
          onChange={(e) => setBed(e.target.value)}
          required
        />
      </Field>
    </div>
  );
}

export const RoutineStep: React.FC<RoutineStepProps> = ({
  h1Ref,
  wake,
  setWake,
  leave,
  setLeave,
  returnHome,
  setReturnHome,
  bed,
  setBed,
  onBack,
  getFieldError,
}) => {
  return (
    <div className="card">
      <h1 ref={h1Ref} tabIndex={-1} className="aw-onboarding-heading mb-2">
        Daily routine
      </h1>
      <p className="text-sm text-muted mb-4">
        Aligns daily clean-air advice with your family's waking and transit hours.
      </p>

      <RoutineTimeFields
        wake={wake}
        setWake={setWake}
        leave={leave}
        setLeave={setLeave}
        returnHome={returnHome}
        setReturnHome={setReturnHome}
        bed={bed}
        setBed={setBed}
        getFieldError={getFieldError}
      />

      <div className="aw-btn-row mt-4">
        <button type="button" className="aw-btn aw-btn-secondary" onClick={onBack}>
          Back
        </button>
        <button type="submit" className="aw-btn aw-btn-primary">
          Save &amp; generate plan
        </button>
      </div>
    </div>
  );
};
