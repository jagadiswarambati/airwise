import {
  type BudgetTier,
  type CookingFuel,
  type HomeHeating,
  type HouseholdProfile,
  type HousingType,
  type Mode,
  type Tenure,
} from '../../../domain/types';

export interface DefaultHomeState {
  tenure: Tenure;
  housingType: HousingType;
  fuel: CookingFuel;
  hasExhaust: boolean;
  homeHeating: HomeHeating;
  hasPurifier: boolean;
  hasWindowAC: boolean;
  hasHvac: boolean;
  budget: BudgetTier;
}

export function getDefaultHome(initial?: HouseholdProfile | null): DefaultHomeState {
  if (!initial) {
    return {
      tenure: 'rent',
      housingType: 'apartment',
      fuel: 'lpg',
      hasExhaust: false,
      homeHeating: 'none',
      hasPurifier: false,
      hasWindowAC: true,
      hasHvac: false,
      budget: 'low',
    };
  }
  return {
    tenure: initial.housing.tenure,
    housingType: initial.housing.type,
    fuel: initial.cooking.fuel,
    hasExhaust: initial.cooking.hasExhaust,
    homeHeating: initial.homeHeating,
    hasPurifier: initial.equipment.purifier,
    hasWindowAC: initial.equipment.windowAC,
    hasHvac: initial.equipment.hvac,
    budget: initial.budget,
  };
}

export interface DefaultCommuteState {
  modes: Mode[];
  oneWayKm: number;
  tripsPerWeek: number;
  transitAvailable: boolean | 'unknown';
  canShiftTime: boolean;
  canWorkRemotely: boolean;
  outdoorWorker: boolean;
}

export function getDefaultCommute(initial?: HouseholdProfile | null): DefaultCommuteState {
  if (!initial) {
    return {
      modes: ['two_wheeler'],
      oneWayKm: 12,
      tripsPerWeek: 5,
      transitAvailable: true,
      canShiftTime: false,
      canWorkRemotely: false,
      outdoorWorker: false,
    };
  }
  return {
    modes: initial.travel.modes,
    oneWayKm: initial.travel.oneWayKm,
    tripsPerWeek: initial.travel.tripsPerWeek,
    transitAvailable: initial.travel.transitAvailable,
    canShiftTime: initial.travel.canShiftTime,
    canWorkRemotely: initial.travel.canWorkRemotely,
    outdoorWorker: initial.travel.outdoorWorker,
  };
}
