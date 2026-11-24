import {
  type AgeGroup,
  type BudgetTier,
  type CookingFuel,
  type Flag,
  type HomeHeating,
  type HousingType,
  type Mode,
  type Tenure,
} from '../../domain/types';

export const STEP_TITLES = [
  'Where you live',
  'Who lives here',
  'Home & equipment',
  'Commute & travel',
  'Daily routine',
] as const;

export interface PresetCity {
  name: string;
  country: string;
  lat: number;
  lon: number;
}

export const PRESET_CITIES: PresetCity[] = [
  { name: 'Hyderabad', country: 'IN', lat: 17.38, lon: 78.48 },
  { name: 'Delhi', country: 'IN', lat: 28.61, lon: 77.23 },
  { name: 'Mumbai', country: 'IN', lat: 19.07, lon: 72.87 },
  { name: 'Bengaluru', country: 'IN', lat: 12.97, lon: 77.59 },
  { name: 'Kolkata', country: 'IN', lat: 22.57, lon: 88.36 },
  { name: 'Chennai', country: 'IN', lat: 13.08, lon: 80.27 },
];

export interface AgeGroupOption {
  value: AgeGroup;
  label: string;
}

export const AGE_GROUP_OPTIONS: AgeGroupOption[] = [
  { value: 'u5', label: 'Under 5 years (Infant / toddler)' },
  { value: '5-12', label: '5–12 years (Child)' },
  { value: '13-17', label: '13–17 years (Teen)' },
  { value: '18-64', label: '18–64 years (Adult)' },
  { value: '65+', label: '65+ years (Senior)' },
];

export interface FlagOption {
  flag: Flag;
  label: string;
}

export const FLAG_OPTIONS: FlagOption[] = [
  { flag: 'asthma_copd', label: 'Asthma or breathing sensitivity' },
  { flag: 'heart', label: 'Heart condition' },
  { flag: 'pregnancy', label: 'Pregnancy' },
  { flag: 'other_sensitivity', label: 'Other sensitivity' },
];

export const HOUSING_TENURE_OPTIONS: { value: Tenure; label: string }[] = [
  { value: 'rent', label: 'Rented' },
  { value: 'own', label: 'Owned' },
];

export const HOUSING_TYPE_OPTIONS: { value: HousingType; label: string }[] = [
  { value: 'apartment', label: 'Apartment' },
  { value: 'house', label: 'Independent house' },
];

export const COOKING_FUEL_OPTIONS: { value: CookingFuel; label: string }[] = [
  { value: 'lpg', label: 'LPG / piped gas' },
  { value: 'electric', label: 'Electric / induction' },
  { value: 'biomass', label: 'Biomass / firewood' },
  { value: 'other', label: 'Other' },
];

export const HOME_HEATING_OPTIONS: { value: HomeHeating; label: string }[] = [
  { value: 'none', label: 'No heating or warm climate' },
  { value: 'electric', label: 'Electric heating or heat pump' },
  { value: 'combustion', label: 'Combustion (Angithi / unvented gas / coal)' },
];

export const BUDGET_TIER_OPTIONS: { value: BudgetTier; label: string }[] = [
  { value: 'free', label: 'Free only (no purchases)' },
  { value: 'low', label: 'Low cost (masks, basic weather strips)' },
  { value: 'flexible', label: 'Flexible' },
];

export interface CommuteModeOption {
  mode: Mode;
  label: string;
}

export const COMMUTE_MODE_OPTIONS: CommuteModeOption[] = [
  { mode: 'two_wheeler', label: 'Motorcycle / scooter' },
  { mode: 'car', label: 'Car' },
  { mode: 'auto_rickshaw', label: 'Auto-rickshaw' },
  { mode: 'bus', label: 'Bus' },
  { mode: 'metro_rail', label: 'Metro / suburban rail' },
  { mode: 'walk', label: 'Walk' },
  { mode: 'cycle', label: 'Cycle' },
];
