import { type ErrorItem } from '../primitives/ErrorSummary';
import {
  type HouseholdProfile,
  HouseholdProfileSchema,
  type Member,
  type Mode,
} from '../../domain/types';

export function validateStep1(cityLabel: string, lat: number, lon: number): ErrorItem[] {
  const errs: ErrorItem[] = [];
  if (!cityLabel.trim()) {
    errs.push({ fieldId: 'location-label', message: 'Please enter a location name or select a city.' });
  }
  if (isNaN(lat) || lat < -90 || lat > 90) {
    errs.push({ fieldId: 'location-lat', message: 'Latitude must be a valid number between -90 and 90.' });
  }
  if (isNaN(lon) || lon < -180 || lon > 180) {
    errs.push({ fieldId: 'location-lon', message: 'Longitude must be a valid number between -180 and 180.' });
  }
  return errs;
}

export function validateStep2(members: Member[]): ErrorItem[] {
  if (members.length === 0) {
    return [{ fieldId: 'members-list', message: 'At least one household member is required.' }];
  }
  return [];
}

export function validateStep4(modes: Mode[], oneWayKm: number, tripsPerWeek: number): ErrorItem[] {
  const errs: ErrorItem[] = [];
  if (modes.length === 0) {
    errs.push({ fieldId: 'commute-modes', message: 'Please select at least one commute mode.' });
  }
  if (isNaN(oneWayKm) || oneWayKm < 0) {
    errs.push({ fieldId: 'travel-distance', message: 'Commute distance must be 0 km or greater.' });
  }
  if (isNaN(tripsPerWeek) || tripsPerWeek < 0) {
    errs.push({ fieldId: 'travel-trips', message: 'Trips per week must be 0 or greater.' });
  }
  return errs;
}

export function validateStep5(wake: string, leave: string, returnHome: string, bed: string): ErrorItem[] {
  const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;
  const errs: ErrorItem[] = [];

  if (!timeRegex.test(wake)) {
    errs.push({ fieldId: 'routine-wake', message: 'Wake time must be in HH:MM 24-hour format.' });
  }
  if (!timeRegex.test(leave)) {
    errs.push({ fieldId: 'routine-leave', message: 'Departure time must be in HH:MM 24-hour format.' });
  }
  if (!timeRegex.test(returnHome)) {
    errs.push({ fieldId: 'routine-return', message: 'Return time must be in HH:MM 24-hour format.' });
  }
  if (!timeRegex.test(bed)) {
    errs.push({ fieldId: 'routine-bed', message: 'Bedtime must be in HH:MM 24-hour format.' });
  }

  return errs;
}

export function validateFullProfile(rawProfile: HouseholdProfile): {
  profile: HouseholdProfile | null;
  errors: ErrorItem[];
} {
  const parsed = HouseholdProfileSchema.safeParse(rawProfile);
  if (!parsed.success) {
    const errors = parsed.error.issues.map((issue) => ({
      fieldId: issue.path.join('-') || 'form',
      message: issue.message,
    }));
    return { profile: null, errors };
  }
  return { profile: parsed.data, errors: [] };
}
