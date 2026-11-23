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

// ============================================================================
// Air Snapshot & Quality Models
// ============================================================================

export const HourlyPointSchema = z.object({
  time: z.string(), // ISO 8601
  pm25: z.number().nullable(), // µg/m³
  aqi: z.number().optional(),
});
export type HourlyPoint = z.infer<typeof HourlyPointSchema>;

export const AQIStandardSchema = z.enum(['US', 'EU', 'IN']);
export type AQIStandard = z.infer<typeof AQIStandardSchema>;

export const AQIReadingSchema = z.object({
  value: z.number(),
  standard: AQIStandardSchema,
  isComputed: z.boolean().optional(),
});
export type AQIReading = z.infer<typeof AQIReadingSchema>;

export const DataFreshnessSchema = z.enum(['fresh', 'aging', 'stale', 'none']);
export type DataFreshness = z.infer<typeof DataFreshnessSchema>;

export const DataTypeSchema = z.enum(['modelled', 'observed', 'sample']);
export type DataType = z.infer<typeof DataTypeSchema>;

export const DataSourceMetadataSchema = z.object({
  id: z.string(),
  name: z.string(),
  dataType: DataTypeSchema,
  resolutionNote: z.string(),
  attribution: z.string().optional(),
});
export type DataSourceMetadata = z.infer<typeof DataSourceMetadataSchema>;

export const TrendSchema = z.enum(['rising', 'steady', 'falling', 'unknown']);
export type Trend = z.infer<typeof TrendSchema>;

export const DaylightSchema = z.object({
  sunrise: z.string(),
  sunset: z.string(),
});
export type Daylight = z.infer<typeof DaylightSchema>;

export const WeatherHourlyPointSchema = z.object({
  time: z.string(),
  temperature2m: z.number().nullable().optional(),
  windSpeed10m: z.number().nullable().optional(),
  relativeHumidity2m: z.number().nullable().optional(),
});
export type WeatherHourlyPoint = z.infer<typeof WeatherHourlyPointSchema>;

export const WeatherSnapshotSchema = z.object({
  temperature2m: z.number().nullable().optional(),
  windSpeed10m: z.number().nullable().optional(),
  relativeHumidity2m: z.number().nullable().optional(),
  hourly: z.array(WeatherHourlyPointSchema).optional(),
  daylight: DaylightSchema.optional(),
});
export type WeatherSnapshot = z.infer<typeof WeatherSnapshotSchema>;

export const AirSnapshotSchema = z.object({
  pm25: z.object({
    now: z.number().nullable(),
    hourly: z.array(HourlyPointSchema),
  }),
  aqi: AQIReadingSchema.optional(),
  trend: TrendSchema,
  observedAt: z.string(), // ISO Date
  fetchedAt: z.string(), // ISO Date
  source: DataSourceMetadataSchema,
  freshness: DataFreshnessSchema,
  officialAlert: z
    .object({
      active: z.boolean(),
      text: z.string().optional(),
    })
    .optional(),
  daylight: DaylightSchema.optional(),
  weather: WeatherSnapshotSchema.optional(),
  utcOffsetSeconds: z.number().optional(),
  timezone: z.string().optional(),
  isFallback: z.boolean().optional(),
  fallbackReason: z.string().optional(),
});
export type AirSnapshot = z.infer<typeof AirSnapshotSchema>;

// ============================================================================
// Risk Assessment & Risk Bands
// ============================================================================

export const RiskLevelSchema = z.union([
  z.literal(0), // Clear
  z.literal(1), // Watch
  z.literal(2), // Caution
  z.literal(3), // Protect
  z.literal(4), // Severe for your household
]);
export type RiskLevel = z.infer<typeof RiskLevelSchema>;

export const SlotIdSchema = z.enum([
  'early-morning',
  'commute-out',
  'daytime',
  'commute-back',
  'evening',
  'night',
]);
export type SlotId = z.infer<typeof SlotIdSchema>;

export const TimeSlotSchema = z.object({
  id: SlotIdSchema,
  label: z.string(),
  startTime: HHMMSchema,
  endTime: HHMMSchema,
  forecastMeanPm25: z.number().nullable(),
  forecastLevel: RiskLevelSchema,
  outdoorActivity: z.enum(['none', 'commute', 'active']),
});
export type TimeSlot = z.infer<typeof TimeSlotSchema>;

export const VentilationVerdictSchema = z.enum(['closed', 'brief', 'open']);
export type VentilationVerdict = z.infer<typeof VentilationVerdictSchema>;

export const VentilationDecisionSchema = z.object({
  verdict: VentilationVerdictSchema,
  atHour: z.number().min(0).max(23).optional(),
  reasonCode: z.string(),
  explanation: z.string(),
  uncertainty: z.string(),
});
export type VentilationDecision = z.infer<typeof VentilationDecisionSchema>;

export const RiskRadarResultSchema = z.object({
  memberId: z.string(),
  memberRoleLabel: z.string(),
  slotId: SlotIdSchema,
  slotLabel: z.string(),
  reasonCode: z.string(),
  explanation: z.string(),
  score: z.number(),
});
export type RiskRadarResult = z.infer<typeof RiskRadarResultSchema>;

export const RiskAssessmentSchema = z.object({
  baseLevel: RiskLevelSchema,
  effectiveLevel: RiskLevelSchema,
  headline: z.string(),
  explanation: z.string(),
  trend: TrendSchema,
  radar: RiskRadarResultSchema,
  slots: z.array(TimeSlotSchema),
  ventilation: VentilationDecisionSchema,
  flags: z.object({
    severeMode: z.boolean(),
    lowCostMode: z.boolean(),
    staleData: z.boolean(),
    noData: z.boolean(),
  }),
});
export type RiskAssessment = z.infer<typeof RiskAssessmentSchema>;

// ============================================================================
// Impact Framework
// ============================================================================

export const ConfidenceSchema = z.enum(['high', 'medium', 'low']);
export type Confidence = z.infer<typeof ConfidenceSchema>;

export const ImpactDirectionSchema = z.enum([
  'reduces',
  'neutral',
  'increases',
  'conditional',
  'unknown',
]);
export type ImpactDirection = z.infer<typeof ImpactDirectionSchema>;

export const ImpactLabelSchema = z.enum(['Measured', 'Estimated', 'Recommended']);
export type ImpactLabel = z.infer<typeof ImpactLabelSchema>;

export const ExposureImpactSchema = z.object({
  direction: ImpactDirectionSchema,
  magnitude: z.string().optional(),
  label: ImpactLabelSchema,
  confidence: ConfidenceSchema,
  note: z.string(),
});
export type ExposureImpact = z.infer<typeof ExposureImpactSchema>;

export const EmissionsImpactSchema = z.object({
  direction: ImpactDirectionSchema,
  value: z
    .object({
      vkm: z.number(),
      co2eKg: z.tuple([z.number(), z.number()]).optional(),
    })
    .optional(),
  label: ImpactLabelSchema,
  confidence: ConfidenceSchema,
  note: z.string(),
});
export type EmissionsImpact = z.infer<typeof EmissionsImpactSchema>;

export const ImpactStatementSchema = z.object({
  exposure: ExposureImpactSchema,
  emissions: EmissionsImpactSchema,
  assumptions: z.array(z.string()),
  doesNotChange: z.string(),
  explanation: z.string(),
});
export type ImpactStatement = z.infer<typeof ImpactStatementSchema>;

// ============================================================================
// Action Catalog & Plan Builder
// ============================================================================

export const ActionCategorySchema = z.enum(['indoor', 'personal', 'mobility', 'community']);
export type ActionCategory = z.infer<typeof ActionCategorySchema>;

export const ActionCostSchema = z.enum(['free', 'low', 'medium', 'high']);
export type ActionCost = z.infer<typeof ActionCostSchema>;

export const ActionEffortSchema = z.union([z.literal(1), z.literal(2), z.literal(3)]);
export type ActionEffort = z.infer<typeof ActionEffortSchema>;

export const ActionEvidenceSchema = z.enum(['high', 'medium', 'low']);
export type ActionEvidence = z.infer<typeof ActionEvidenceSchema>;

export interface ImpactSpec {
  exposure: {
    direction: ImpactDirection;
    label: ImpactLabel;
    evidence: ActionEvidence;
    noteTemplate: string;
  };
  emissions: {
    direction: ImpactDirection;
    label: ImpactLabel;
    evidence: ActionEvidence;
    noteTemplate: string;
    hasFormula?: 'E1' | 'E2';
  };
  assumptions: string[];
  doesNotChange: string;
}

export interface Action {
  id: string;
  title: string;
  category: ActionCategory;
  cost: ActionCost;
  effort: ActionEffort;
  evidence: ActionEvidence;
  impactSpec: ImpactSpec;
  templateKey: string;
  minLevel?: RiskLevel;
  forbiddenLevels?: RiskLevel[];
  requiresPurifier?: boolean;
  requiresAcHvac?: boolean;
  requiresExhaust?: boolean;
}

export interface ActionCandidate {
  action: Action;
  impact: ImpactStatement;
  healthUrgency: number;
  feasibility: number;
  costFit: number;
  priorityScore: number;
  tags: {
    health: string;
    urgency: string;
    cost: string;
    effort: string;
  };
  applicableSlot?: SlotId;
  isMandatory: boolean;
  fixedDisclaimers?: string[];
}

export interface TimelineSlot {
  slotId: SlotId;
  slotLabel: string;
  actionIds: string[];
  actions: ActionCandidate[];
  note?: string;
}

export interface Plan {
  source: 'deterministic' | 'ai';
  generatedAt: string;
  headline: string;
  topActionIds: [string, string, string];
  topActions: ActionCandidate[];
  timeline: TimelineSlot[];
  explanations: Record<string, string>;
  planConfidence: Confidence;
  confidenceReason: string;
  assumptions: string[];
  flags: {
    severeMode: boolean;
    lowCostMode: boolean;
    fallbackPlan: boolean;
  };
}

