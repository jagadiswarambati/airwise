import { z } from 'zod';
import { HHMMSchema } from './profileTypes';

export * from './profileTypes';

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
// Action Catalog & Plan Builder (re-exported from ./planTypes)
// ============================================================================

export * from './planTypes';


