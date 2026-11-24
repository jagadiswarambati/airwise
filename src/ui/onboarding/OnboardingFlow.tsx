import React, { useState, useEffect, useRef } from 'react';
import { type HouseholdProfile } from '../../domain/types';
import { announce } from '../components/liveRegionAnnouncer';
import { ErrorSummary } from '../primitives/ErrorSummary';
import { Stepper } from '../primitives/Stepper';
import { STEP_TITLES } from './options';
import { useOnboardingDraft } from './hooks/useOnboardingDraft';
import { useStepValidation } from './hooks/useStepValidation';
import { WhereStep } from './steps/WhereStep';
import { HouseholdStep } from './steps/HouseholdStep';
import { HomeStep } from './steps/HomeStep';
import { CommuteStep } from './steps/CommuteStep';
import { RoutineStep } from './steps/RoutineStep';

export interface OnboardingFlowProps {
  initialProfile?: HouseholdProfile | null;
  onComplete: (profile: HouseholdProfile) => void;
  onLoadPriya: () => void;
  onCancel?: () => void;
}

interface StepProps {
  h1Ref: React.RefObject<HTMLHeadingElement>;
  draft: ReturnType<typeof useOnboardingDraft>;
  validation: ReturnType<typeof useStepValidation>;
  onLoadPriya: () => void;
  onCancel?: () => void;
  onSetStep: (step: number) => void;
}

function renderFirstHalf(step: number, props: StepProps) {
  const { h1Ref, draft, validation, onLoadPriya, onCancel, onSetStep } = props;
  if (step === 1) {
    return (
      <WhereStep
        h1Ref={h1Ref}
        cityLabel={draft.cityLabel}
        setCityLabel={draft.setCityLabel}
        lat={draft.lat}
        setLat={draft.setLat}
        lon={draft.lon}
        setLon={draft.setLon}
        setCountry={draft.setCountry}
        onLoadPriya={onLoadPriya}
        onCancel={onCancel}
        getFieldError={validation.getFieldError}
      />
    );
  }
  return (
    <HouseholdStep
      h1Ref={h1Ref}
      members={draft.members}
      addMember={draft.addMember}
      updateMember={draft.updateMember}
      removeMember={draft.removeMember}
      toggleFlag={draft.toggleFlag}
      onBack={() => onSetStep(1)}
    />
  );
}

function renderSecondHalf(step: number, props: StepProps) {
  const { h1Ref, draft, validation, onSetStep } = props;
  if (step === 3) {
    return (
      <HomeStep
        h1Ref={h1Ref}
        tenure={draft.tenure}
        setTenure={draft.setTenure}
        housingType={draft.housingType}
        setHousingType={draft.setHousingType}
        fuel={draft.fuel}
        setFuel={draft.setFuel}
        hasExhaust={draft.hasExhaust}
        setHasExhaust={draft.setHasExhaust}
        homeHeating={draft.homeHeating}
        setHomeHeating={draft.setHomeHeating}
        hasPurifier={draft.hasPurifier}
        setHasPurifier={draft.setHasPurifier}
        hasWindowAC={draft.hasWindowAC}
        setHasWindowAC={draft.setHasWindowAC}
        hasHvac={draft.hasHvac}
        setHasHvac={draft.setHasHvac}
        budget={draft.budget}
        setBudget={draft.setBudget}
        onBack={() => onSetStep(2)}
      />
    );
  }
  if (step === 4) {
    return (
      <CommuteStep
        h1Ref={h1Ref}
        modes={draft.modes}
        toggleMode={draft.toggleMode}
        oneWayKm={draft.oneWayKm}
        setOneWayKm={draft.setOneWayKm}
        tripsPerWeek={draft.tripsPerWeek}
        setTripsPerWeek={draft.setTripsPerWeek}
        transitAvailable={draft.transitAvailable}
        setTransitAvailable={draft.setTransitAvailable}
        canShiftTime={draft.canShiftTime}
        setCanShiftTime={draft.setCanShiftTime}
        canWorkRemotely={draft.canWorkRemotely}
        setCanWorkRemotely={draft.setCanWorkRemotely}
        outdoorWorker={draft.outdoorWorker}
        setOutdoorWorker={draft.setOutdoorWorker}
        onBack={() => onSetStep(3)}
        getFieldError={validation.getFieldError}
      />
    );
  }
  return (
    <RoutineStep
      h1Ref={h1Ref}
      wake={draft.wake}
      setWake={draft.setWake}
      leave={draft.leave}
      setLeave={draft.setLeave}
      returnHome={draft.returnHome}
      setReturnHome={draft.setReturnHome}
      bed={draft.bed}
      setBed={draft.setBed}
      onBack={() => onSetStep(4)}
      getFieldError={validation.getFieldError}
    />
  );
}

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({
  initialProfile,
  onComplete,
  onLoadPriya,
  onCancel,
}) => {
  const [step, setStep] = useState<number>(1);
  const h1Ref = useRef<HTMLHeadingElement>(null);

  const draft = useOnboardingDraft(initialProfile);
  const validation = useStepValidation();

  // Focus h1 and announce on step change
  useEffect(() => {
    h1Ref.current?.focus();
    announce(`Step ${step} of 5: ${STEP_TITLES[step - 1]}`);
    validation.setErrors([]);
  }, [step, validation]);

  const handleStepSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (step === 1) {
      if (validation.validateStep1(draft.cityLabel, draft.lat, draft.lon)) setStep(2);
    } else if (step === 2) {
      if (validation.validateStep2(draft.members)) setStep(3);
    } else if (step === 3) {
      if (validation.validateStep3()) setStep(4);
    } else if (step === 4) {
      if (validation.validateStep4(draft.modes, draft.oneWayKm, draft.tripsPerWeek)) setStep(5);
    } else if (step === 5) {
      if (!validation.validateStep5(draft.wake, draft.leave, draft.returnHome, draft.bed)) return;

      const rawProfile = draft.buildRawProfile();
      const parsed = validation.validateFullProfile(rawProfile);
      if (parsed) onComplete(parsed);
    }
  };

  const stepProps: StepProps = {
    h1Ref,
    draft,
    validation,
    onLoadPriya,
    onCancel,
    onSetStep: setStep,
  };

  return (
    <div className="aw-onboarding-wrapper">
      <div className="aw-onboarding-container">
        <Stepper
          currentStep={step}
          totalSteps={5}
          stepTitle={STEP_TITLES[step - 1]}
          className="mb-4"
        />

        <form onSubmit={handleStepSubmit} noValidate className="aw-onboarding-form">
          <ErrorSummary errors={validation.errors} />
          {step <= 2 ? renderFirstHalf(step, stepProps) : renderSecondHalf(step, stepProps)}
        </form>
      </div>
    </div>
  );
};

export default OnboardingFlow;
