import { z } from 'zod';

// ============================================================================
// Core Identifiers & Primitive Types
// ============================================================================

export const AgeGroupSchema = z.enum(['u5', '5-12', '13-17', '18-64', '65+']);
export type AgeGroup = z.infer<typeof AgeGroupSchema>;

export const FlagSchema = z.enum(['asthma_copd', 'heart', 'pregnancy', 'other_sensitivity']);
export type Flag = z.infer<typeof FlagSchema>;

export const MemberSchema = z.object({
  id: z.string().min(1),
  roleLabel: z.string().min(1), // Standard derived age-band label e.g. "Child 5-12", "Adult 65+"
  ageGroup: AgeGroupSchema,
  flags: z.array(FlagSchema),
});
export type Member = z.infer<typeof MemberSchema>;

/**
 * Derives standard privacy-preserving age-band role label for a household member (Decision A-36).
 * Never exposes exact ages, names, or occupations.
 */
export function roleLabelFor(member: { ageGroup: AgeGroup }): string {
  switch (member.ageGroup) {
    case 'u5':
      return 'Infant under 5';
    case '5-12':
      return 'Child 5-12';
    case '13-17':
      return 'Teen 13-17';
    case '18-64':
      return 'Adult 18-64';
    case '65+':
      return 'Adult 65+';
  }
}

export const HousingTypeSchema = z.enum(['apartment', 'house']);
export type HousingType = z.infer<typeof HousingTypeSchema>;

export const TenureSchema = z.enum(['own', 'rent']);
export type Tenure = z.infer<typeof TenureSchema>;

export const CookingFuelSchema = z.enum(['lpg', 'electric', 'biomass', 'other']);
export type CookingFuel = z.infer<typeof CookingFuelSchema>;

export const HomeHeatingSchema = z.enum(['none', 'electric', 'combustion']);
export type HomeHeating = z.infer<typeof HomeHeatingSchema>;

export const BudgetTierSchema = z.enum(['free', 'low', 'flexible']);
export type BudgetTier = z.infer<typeof BudgetTierSchema>;

export const ModeSchema = z.enum([
  'car',
  'two_wheeler',
  'auto_rickshaw',
  'bus',
  'metro_rail',
  'cycle',
  'walk',
]);
export type Mode = z.infer<typeof ModeSchema>;

export const HHMM_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;
export const HHMMSchema = z.string().regex(HHMM_REGEX, 'Must be HH:MM format');
export type HHMM = z.infer<typeof HHMMSchema>;

export const LocationSchema = z.object({
  label: z.string(),
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
  country: z.string().optional(),
});
export type Location = z.infer<typeof LocationSchema>;

// ============================================================================
// Household Profile
// ============================================================================

export const HouseholdProfileSchema = z.object({
  schemaVersion: z.literal(1),
  location: LocationSchema,
  members: z.array(MemberSchema).min(1),
  housing: z.object({
    tenure: TenureSchema,
    type: HousingTypeSchema,
  }),
  cooking: z.object({
    fuel: CookingFuelSchema,
    hasExhaust: z.boolean(),
  }),
  homeHeating: HomeHeatingSchema, // P-22 combustion safety
  equipment: z.object({
    purifier: z.boolean(),
    windowAC: z.boolean(),
    hvac: z.boolean(),
  }),
  budget: BudgetTierSchema,
  travel: z.object({
    modes: z.array(ModeSchema),
    oneWayKm: z.number().min(0),
    tripsPerWeek: z.number().min(0), // Round trips per week
    canShiftTime: z.boolean(),
    canWorkRemotely: z.boolean(),
    transitAvailable: z.union([z.boolean(), z.literal('unknown')]),
    outdoorWorker: z.boolean(),
  }),
  routine: z.object({
    wake: HHMMSchema,
    leave: HHMMSchema,
    returnHome: HHMMSchema,
    cooking: z.array(HHMMSchema),
    bed: HHMMSchema,
  }),
});
export type HouseholdProfile = z.infer<typeof HouseholdProfileSchema>;
