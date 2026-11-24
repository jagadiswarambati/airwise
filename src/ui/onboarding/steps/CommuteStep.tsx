import React from 'react';
import { type Mode } from '../../../domain/types';
import { Field } from '../../primitives/Field';
import { CommuteModesSection } from '../components/CommuteModesSection';
import { CommuteFlexibilitySection } from '../components/CommuteFlexibilitySection';

interface CommuteDistanceProps {
  oneWayKm: number;
  setOneWayKm: (val: number) => void;
  tripsPerWeek: number;
  setTripsPerWeek: (val: number) => void;
  getFieldError: (id: string) => string | undefined;
}

function CommuteDistanceSection({
  oneWayKm,
  setOneWayKm,
  tripsPerWeek,
  setTripsPerWeek,
  getFieldError,
}: CommuteDistanceProps) {
  return (
    <div className="grid-2-col mb-4">
      <Field
        id="travel-distance"
        label="One-way commute distance (km)"
        error={getFieldError('travel-distance')}
      >
        <input
          type="number"
          step="1"
          min="0"
          inputMode="numeric"
          className="form-input"
          value={oneWayKm}
          onChange={(e) => setOneWayKm(Math.max(0, parseInt(e.target.value) || 0))}
        />
      </Field>

      <Field
        id="travel-trips"
        label="Commute trips per week"
        error={getFieldError('travel-trips')}
      >
        <input
          type="number"
          step="1"
          min="0"
          max="14"
          inputMode="numeric"
          className="form-input"
          value={tripsPerWeek}
          onChange={(e) => setTripsPerWeek(Math.max(0, parseInt(e.target.value) || 0))}
        />
      </Field>
    </div>
  );
}

interface TransitFieldProps {
  transitAvailable: boolean | 'unknown';
  setTransitAvailable: (val: boolean | 'unknown') => void;
}

function TransitAccessibilityField({ transitAvailable, setTransitAvailable }: TransitFieldProps) {
  let selectValue = 'unknown';
  if (transitAvailable === true) selectValue = 'yes';
  else if (transitAvailable === false) selectValue = 'no';

  return (
    <Field
      id="travel-transit"
      label="Public transit accessibility"
      helperText="Whether bus or rail is practical for regular trips"
      className="mb-4"
    >
      <select
        value={selectValue}
        onChange={(e) => {
          const v = e.target.value;
          if (v === 'yes') setTransitAvailable(true);
          else if (v === 'no') setTransitAvailable(false);
          else setTransitAvailable('unknown');
        }}
        className="form-select"
      >
        <option value="yes">Accessible near home and work</option>
        <option value="no">Not available or impractical</option>
        <option value="unknown">Unknown</option>
      </select>
    </Field>
  );
}

export interface CommuteStepProps {
  h1Ref: React.RefObject<HTMLHeadingElement>;
  modes: Mode[];
  toggleMode: (m: Mode) => void;
  oneWayKm: number;
  setOneWayKm: (val: number) => void;
  tripsPerWeek: number;
  setTripsPerWeek: (val: number) => void;
  transitAvailable: boolean | 'unknown';
  setTransitAvailable: (val: boolean | 'unknown') => void;
  canShiftTime: boolean;
  setCanShiftTime: (val: boolean) => void;
  canWorkRemotely: boolean;
  setCanWorkRemotely: (val: boolean) => void;
  outdoorWorker: boolean;
  setOutdoorWorker: (val: boolean) => void;
  onBack: () => void;
  getFieldError: (id: string) => string | undefined;
}

export const CommuteStep: React.FC<CommuteStepProps> = ({
  h1Ref,
  modes,
  toggleMode,
  oneWayKm,
  setOneWayKm,
  tripsPerWeek,
  setTripsPerWeek,
  transitAvailable,
  setTransitAvailable,
  canShiftTime,
  setCanShiftTime,
  canWorkRemotely,
  setCanWorkRemotely,
  outdoorWorker,
  setOutdoorWorker,
  onBack,
  getFieldError,
}) => {
  return (
    <div className="card">
      <h1 ref={h1Ref} tabIndex={-1} className="aw-onboarding-heading mb-2">
        Commute &amp; travel
      </h1>
      <p className="text-sm text-muted mb-4">
        Helps calculate avoided vehicle-kilometers and recommend safe transit windows.
      </p>

      <CommuteModesSection
        modes={modes}
        toggleMode={toggleMode}
        error={getFieldError('commute-modes')}
      />

      <CommuteDistanceSection
        oneWayKm={oneWayKm}
        setOneWayKm={setOneWayKm}
        tripsPerWeek={tripsPerWeek}
        setTripsPerWeek={setTripsPerWeek}
        getFieldError={getFieldError}
      />

      <TransitAccessibilityField
        transitAvailable={transitAvailable}
        setTransitAvailable={setTransitAvailable}
      />

      <CommuteFlexibilitySection
        canShiftTime={canShiftTime}
        setCanShiftTime={setCanShiftTime}
        canWorkRemotely={canWorkRemotely}
        setCanWorkRemotely={setCanWorkRemotely}
        outdoorWorker={outdoorWorker}
        setOutdoorWorker={setOutdoorWorker}
      />

      <div className="aw-btn-row">
        <button type="button" className="aw-btn aw-btn-secondary" onClick={onBack}>
          Back
        </button>
        <button type="submit" className="aw-btn aw-btn-primary">
          Continue
        </button>
      </div>
    </div>
  );
};
