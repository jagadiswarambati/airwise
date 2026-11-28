import { z } from 'zod';
import { HHMMSchema } from './profileTypes';

export * from './profileTypes';

// ============================================================================
// Air Snapshot & Quality Models
// ============================================================================

/**
 * HourlyPointSchema.
 */
export const HourlyPointSchema = z.object({
  time: z.string(), // ISO 8601
  pm25: z.number().nullable(), // µg/m³
  aqi: z.number().optional(),
});
/**
 * HourlyPoint.
 */
export type HourlyPoint = z.infer<typeof HourlyPointSchema>;

/**
 * AQIStandardSchema.
 */
export const AQIStandardSchema = z.enum(['US', 'EU', 'IN']);
/**
 * AQIStandard.
 */
export type AQIStandard = z.infer<typeof AQIStandardSchema>;

/**
 * AQIReadingSchema.
 */
export const AQIReadingSchema = z.object({
  value: z.number(),
  standard: AQIStandardSchema,
  isComputed: z.boolean().optional(),
});
/**
 * AQIReading.
 */
export type AQIReading = z.infer<typeof AQIReadingSchema>;

/**
 * DataFreshnessSchema.
 */
export const DataFreshnessSchema = z.enum(['fresh', 'aging', 'stale', 'none']);
/**
 * DataFreshness.
 */
export type DataFreshness = z.infer<typeof DataFreshnessSchema>;

/**
 * DataTypeSchema.
 */
export const DataTypeSchema = z.enum(['modelled', 'observed', 'sample']);
/**
 * DataType.
 */
export type DataType = z.infer<typeof DataTypeSchema>;

/**
 * DataSourceMetadataSchema.
 */
export const DataSourceMetadataSchema = z.object({
  id: z.string(),
  name: z.string(),
  dataType: DataTypeSchema,
  resolutionNote: z.string(),
  attribution: z.string().optional(),
});
/**
 * DataSourceMetadata.
 */
export type DataSourceMetadata = z.infer<typeof DataSourceMetadataSchema>;

/**
 * TrendSchema.
 */
export const TrendSchema = z.enum(['rising', 'steady', 'falling', 'unknown']);
/**
 * Trend.
 */
export type Trend = z.infer<typeof TrendSchema>;

/**
 * DaylightSchema.
 */
export const DaylightSchema = z.object({
  sunrise: z.string(),
  sunset: z.string(),
});
/**
 * Daylight.
 */
export type Daylight = z.infer<typeof DaylightSchema>;

/**
 * WeatherHourlyPointSchema.
 */
export const WeatherHourlyPointSchema = z.object({
  time: z.string(),
  temperature2m: z.number().nullable().optional(),
  windSpeed10m: z.number().nullable().optional(),
  relativeHumidity2m: z.number().nullable().optional(),
});
/**
 * WeatherHourlyPoint.
 */
export type WeatherHourlyPoint = z.infer<typeof WeatherHourlyPointSchema>;

/**
 * WeatherSnapshotSchema.
 */
export const WeatherSnapshotSchema = z.object({
  temperature2m: z.number().nullable().optional(),
  windSpeed10m: z.number().nullable().optional(),
  relativeHumidity2m: z.number().nullable().optional(),
  hourly: z.array(WeatherHourlyPointSchema).optional(),
  daylight: DaylightSchema.optional(),
});
/**
 * WeatherSnapshot.
 */
export type WeatherSnapshot = z.infer<typeof WeatherSnapshotSchema>;

/**
 * AirSnapshotSchema.
 */
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
/**
 * AirSnapshot.
 */
export type AirSnapshot = z.infer<typeof AirSnapshotSchema>;

// ============================================================================
// Risk Assessment & Risk Bands
// ============================================================================

/**
 * RiskLevelSchema.
 */
export const RiskLevelSchema = z.union([
  z.literal(0), // Clear
  z.literal(1), // Watch
  z.literal(2), // Caution
  z.literal(3), // Protect
  z.literal(4), // Severe for your household
]);
/**
 * RiskLevel.
 */
export type RiskLevel = z.infer<typeof RiskLevelSchema>;

/**
 * SlotIdSchema.
 */
export const SlotIdSchema = z.enum([
  'early-morning',
  'commute-out',
  'daytime',
  'commute-back',
  'evening',
  'night',
]);
/**
 * SlotId.
 */
export type SlotId = z.infer<typeof SlotIdSchema>;

/**
 * TimeSlotSchema.
 */
export const TimeSlotSchema = z.object({
  id: SlotIdSchema,
  label: z.string(),
  startTime: HHMMSchema,
  endTime: HHMMSchema,
  forecastMeanPm25: z.number().nullable(),
  forecastLevel: RiskLevelSchema,
  outdoorActivity: z.enum(['none', 'commute', 'active']),
});
/**
 * TimeSlot.
 */
export type TimeSlot = z.infer<typeof TimeSlotSchema>;

/**
 * VentilationVerdictSchema.
 */
export const VentilationVerdictSchema = z.enum(['closed', 'brief', 'open']);
/**
 * VentilationVerdict.
 */
export type VentilationVerdict = z.infer<typeof VentilationVerdictSchema>;

/**
 * VentilationDecisionSchema.
 */
export const VentilationDecisionSchema = z.object({
  verdict: VentilationVerdictSchema,
  atHour: z.number().min(0).max(23).optional(),
  reasonCode: z.string(),
  explanation: z.string(),
  uncertainty: z.string(),
});
/**
 * VentilationDecision.
 */
export type VentilationDecision = z.infer<typeof VentilationDecisionSchema>;

/**
 * RiskRadarResultSchema.
 */
export const RiskRadarResultSchema = z.object({
  memberId: z.string(),
  memberRoleLabel: z.string(),
  slotId: SlotIdSchema,
  slotLabel: z.string(),
  reasonCode: z.string(),
  explanation: z.string(),
  score: z.number(),
});
/**
 * RiskRadarResult.
 */
export type RiskRadarResult = z.infer<typeof RiskRadarResultSchema>;

/**
 * RiskAssessmentSchema.
 */
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
/**
 * RiskAssessment.
 */
export type RiskAssessment = z.infer<typeof RiskAssessmentSchema>;

// ============================================================================
// Impact Framework
// ============================================================================

/**
 * ConfidenceSchema.
 */
export const ConfidenceSchema = z.enum(['high', 'medium', 'low']);
/**
 * Confidence.
 */
export type Confidence = z.infer<typeof ConfidenceSchema>;

/**
 * ImpactDirectionSchema.
 */
export const ImpactDirectionSchema = z.enum([
  'reduces',
  'neutral',
  'increases',
  'conditional',
  'unknown',
]);
/**
 * ImpactDirection.
 */
export type ImpactDirection = z.infer<typeof ImpactDirectionSchema>;

/**
 * ImpactLabelSchema.
 */
export const ImpactLabelSchema = z.enum(['Measured', 'Estimated', 'Recommended']);
/**
 * ImpactLabel.
 */
export type ImpactLabel = z.infer<typeof ImpactLabelSchema>;

/**
 * ExposureImpactSchema.
 */
export const ExposureImpactSchema = z.object({
  direction: ImpactDirectionSchema,
  magnitude: z.string().optional(),
  label: ImpactLabelSchema,
  confidence: ConfidenceSchema,
  note: z.string(),
});
/**
 * ExposureImpact.
 */
export type ExposureImpact = z.infer<typeof ExposureImpactSchema>;

/**
 * EmissionsImpactSchema.
 */
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
/**
 * EmissionsImpact.
 */
export type EmissionsImpact = z.infer<typeof EmissionsImpactSchema>;

/**
 * ImpactStatementSchema.
 */
export const ImpactStatementSchema = z.object({
  exposure: ExposureImpactSchema,
  emissions: EmissionsImpactSchema,
  assumptions: z.array(z.string()),
  doesNotChange: z.string(),
  explanation: z.string(),
});
/**
 * ImpactStatement.
 */
export type ImpactStatement = z.infer<typeof ImpactStatementSchema>;

// ============================================================================
// Action Catalog & Plan Builder (re-exported from ./planTypes)
// ============================================================================

export * from './planTypes';


