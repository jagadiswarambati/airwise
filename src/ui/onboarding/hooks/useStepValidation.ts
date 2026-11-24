import { useState, useCallback } from 'react';
import { type ErrorItem } from '../../primitives/ErrorSummary';
import { type HouseholdProfile, type Member, type Mode } from '../../../domain/types';
import {
  validateStep1 as checkStep1,
  validateStep2 as checkStep2,
  validateStep4 as checkStep4,
  validateStep5 as checkStep5,
  validateFullProfile as checkFullProfile,
} from '../validation';

export function useStepValidation() {
  const [errors, setErrors] = useState<ErrorItem[]>([]);

  const getFieldError = useCallback((id: string): string | undefined => {
    return errors.find((e) => e.fieldId === id)?.message;
  }, [errors]);

  const validateStep1 = useCallback((cityLabel: string, lat: number, lon: number): boolean => {
    const errs = checkStep1(cityLabel, lat, lon);
    setErrors(errs);
    return errs.length === 0;
  }, []);

  const validateStep2 = useCallback((members: Member[]): boolean => {
    const errs = checkStep2(members);
    setErrors(errs);
    return errs.length === 0;
  }, []);

  const validateStep3 = useCallback((): boolean => {
    setErrors([]);
    return true;
  }, []);

  const validateStep4 = useCallback((modes: Mode[], oneWayKm: number, tripsPerWeek: number): boolean => {
    const errs = checkStep4(modes, oneWayKm, tripsPerWeek);
    setErrors(errs);
    return errs.length === 0;
  }, []);

  const validateStep5 = useCallback((wake: string, leave: string, returnHome: string, bed: string): boolean => {
    const errs = checkStep5(wake, leave, returnHome, bed);
    setErrors(errs);
    return errs.length === 0;
  }, []);

  const validateFull = useCallback((rawProfile: HouseholdProfile): HouseholdProfile | null => {
    const { profile, errors: errs } = checkFullProfile(rawProfile);
    if (!profile) setErrors(errs);
    return profile;
  }, []);

  return {
    errors,
    setErrors,
    getFieldError,
    validateStep1,
    validateStep2,
    validateStep3,
    validateStep4,
    validateStep5,
    validateFullProfile: validateFull,
  };
}
