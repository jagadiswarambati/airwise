import React from 'react';
import {
  type BudgetTier,
  type CookingFuel,
  type HomeHeating,
  type HousingType,
  type Tenure,
} from '../../../domain/types';
import { Field } from '../../primitives/Field';
import { Fieldset } from '../../primitives/Fieldset';
import {
  HOUSING_TENURE_OPTIONS,
  HOUSING_TYPE_OPTIONS,
  BUDGET_TIER_OPTIONS,
} from '../options';
import { CookingHeatingSection } from '../components/CookingHeatingSection';
import { EquipmentSection } from '../components/EquipmentSection';

interface HousingStructureProps {
  tenure: Tenure;
  setTenure: (val: Tenure) => void;
  housingType: HousingType;
  setHousingType: (val: HousingType) => void;
}

function HousingStructureSection({ tenure, setTenure, housingType, setHousingType }: HousingStructureProps) {
  return (
    <Fieldset legend="Housing structure" className="mb-4">
      <div className="grid-2-col">
        <Field id="housing-tenure" label="Housing tenure">
          <select
            value={tenure}
            onChange={(e) => setTenure(e.target.value as Tenure)}
            className="form-select"
          >
            {HOUSING_TENURE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </Field>

        <Field id="housing-type" label="Home type">
          <select
            value={housingType}
            onChange={(e) => setHousingType(e.target.value as HousingType)}
            className="form-select"
          >
            {HOUSING_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </Field>
      </div>
    </Fieldset>
  );
}

function BudgetField({
  budget,
  setBudget,
}: {
  budget: BudgetTier;
  setBudget: (val: BudgetTier) => void;
}) {
  return (
    <Field
      id="budget-tier"
      label="Action budget preference"
      helperText="Filters recommendations to fit your household budget"
      className="mb-4"
    >
      <select
        value={budget}
        onChange={(e) => setBudget(e.target.value as BudgetTier)}
        className="form-select"
      >
        {BUDGET_TIER_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </Field>
  );
}

export interface HomeStepProps {
  h1Ref: React.RefObject<HTMLHeadingElement>;
  tenure: Tenure;
  setTenure: (val: Tenure) => void;
  housingType: HousingType;
  setHousingType: (val: HousingType) => void;
  fuel: CookingFuel;
  setFuel: (val: CookingFuel) => void;
  hasExhaust: boolean;
  setHasExhaust: (val: boolean) => void;
  homeHeating: HomeHeating;
  setHomeHeating: (val: HomeHeating) => void;
  hasPurifier: boolean;
  setHasPurifier: (val: boolean) => void;
  hasWindowAC: boolean;
  setHasWindowAC: (val: boolean) => void;
  hasHvac: boolean;
  setHasHvac: (val: boolean) => void;
  budget: BudgetTier;
  setBudget: (val: BudgetTier) => void;
  onBack: () => void;
}

export const HomeStep: React.FC<HomeStepProps> = ({
  h1Ref,
  tenure,
  setTenure,
  housingType,
  setHousingType,
  fuel,
  setFuel,
  hasExhaust,
  setHasExhaust,
  homeHeating,
  setHomeHeating,
  hasPurifier,
  setHasPurifier,
  hasWindowAC,
  setHasWindowAC,
  hasHvac,
  setHasHvac,
  budget,
  setBudget,
  onBack,
}) => (
  <div className="card">
    <h1 ref={h1Ref} tabIndex={-1} className="aw-onboarding-heading mb-2">
      Your home
    </h1>
    <p className="text-sm text-muted mb-4">
      Cooking fuel, ventilation, and heating help us recommend actions that match your living reality.
    </p>

    <HousingStructureSection
      tenure={tenure}
      setTenure={setTenure}
      housingType={housingType}
      setHousingType={setHousingType}
    />

    <CookingHeatingSection
      fuel={fuel}
      setFuel={setFuel}
      hasExhaust={hasExhaust}
      setHasExhaust={setHasExhaust}
      homeHeating={homeHeating}
      setHomeHeating={setHomeHeating}
    />

    <EquipmentSection
      hasPurifier={hasPurifier}
      setHasPurifier={setHasPurifier}
      hasWindowAC={hasWindowAC}
      setHasWindowAC={setHasWindowAC}
      hasHvac={hasHvac}
      setHasHvac={setHasHvac}
    />

    <BudgetField budget={budget} setBudget={setBudget} />

    <div className="aw-btn-row">
      <button type="button" onClick={onBack} className="aw-btn aw-btn-secondary">
        Back
      </button>
      <button type="submit" className="aw-btn aw-btn-primary">
        Continue
      </button>
    </div>
  </div>
);
