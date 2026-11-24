import { z } from 'zod';
import { type Confidence, type RiskLevel, type AgeGroup, type BudgetTier } from '../domain/types';

/**
 * Strict schema for AI-personalized clean-air plan output.
 * Matches README Section 16 specification.
 */
export const AIPlanOutputSchema = z.object({
  schemaVersion: z.literal(1),
  headline: z.string().min(5).max(90),
  topActionIds: z.tuple([z.string(), z.string(), z.string()]),
  timeline: z.array(
    z.object({
      slotId: z.string(),
      actionIds: z.array(z.string()),
      note: z.string().max(160),
    }).strict()
  ),
  explanations: z.record(z.string(), z.string().max(200)),
  assumptions: z.array(z.string().max(140)),
  planConfidence: z.enum(['high', 'medium', 'low']),
  confidenceReason: z.string().max(160),
}).strict();

export type AIPlanOutput = z.infer<typeof AIPlanOutputSchema>;

/**
 * Minimal structured payload sent to the LLM.
 * Strictly non-identifying: no coordinates, no names, no free text.
 * Candidate summaries and allowable numbers are derived on the server.
 */
export interface AIPlanInput {
  effectiveLevel: RiskLevel;
  trend: 'unknown' | 'rising' | 'steady' | 'falling';
  slotRisks: Array<{
    slotId: string;
    level: RiskLevel;
  }>;
  radar: {
    memberBand: AgeGroup | 'mixed';
    peakSlotId: string;
  };
  approvedCandidateIds: string[];
  mustIncludeIds: string[];
  forbiddenActionIds: string[];
  budgetTier: BudgetTier;
  householdDescriptors: {
    sensitiveCategory: 'respiratory' | 'cardiovascular' | 'pregnancy' | 'general' | 'none';
    ageGroups: AgeGroup[];
    equipment: {
      purifier: boolean;
      windowAC: boolean;
      hvac: boolean;
      kitchenExhaust: boolean;
    };
    homeHeating: 'none' | 'electric' | 'combustion';
  };
  confidenceCeiling: Confidence;
  numericFacts: {
    pm25Now: number | null;
    slotMeanPm25Values: Array<{
      slotId: string;
      pm25: number | null;
    }>;
    routineTimes: string[];
  };
}

export const AIPlanInputSchema = z.object({
  effectiveLevel: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
  trend: z.enum(['unknown', 'rising', 'steady', 'falling']),
  slotRisks: z.array(
    z.object({
      slotId: z.string(),
      level: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
    }).strict()
  ),
  radar: z.object({
    memberBand: z.enum(['u5', '5-12', '13-17', '18-64', '65+', 'mixed']),
    peakSlotId: z.string(),
  }).strict(),
  approvedCandidateIds: z.array(z.string()),
  mustIncludeIds: z.array(z.string()),
  forbiddenActionIds: z.array(z.string()),
  budgetTier: z.enum(['free', 'low', 'flexible']),
  householdDescriptors: z.object({
    sensitiveCategory: z.enum(['respiratory', 'cardiovascular', 'pregnancy', 'general', 'none']),
    ageGroups: z.array(z.enum(['u5', '5-12', '13-17', '18-64', '65+'])),
    equipment: z.object({
      purifier: z.boolean(),
      windowAC: z.boolean(),
      hvac: z.boolean(),
      kitchenExhaust: z.boolean(),
    }).strict(),
    homeHeating: z.enum(['none', 'electric', 'combustion']),
  }).strict(),
  confidenceCeiling: z.enum(['high', 'medium', 'low']),
  numericFacts: z.object({
    pm25Now: z.number().nullable(),
    slotMeanPm25Values: z.array(
      z.object({
        slotId: z.string(),
        pm25: z.number().nullable(),
      }).strict()
    ),
    routineTimes: z.array(z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/)),
  }).strict(),
}).strict();
