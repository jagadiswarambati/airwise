import { z } from 'zod';
import { Confidence, RiskLevel, AgeGroup, BudgetTier } from '../domain/types';

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
    })
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
 */
export interface AIPlanInput {
  effectiveLevel: RiskLevel;
  trend: 'unknown' | 'rising' | 'steady' | 'falling';
  slotRisks: Array<{
    slotId: string;
    level: RiskLevel;
  }>;
  radar: {
    vulnerableRoleLabel: string;
    peakSlotId: string;
    peakWindowReason: string;
  };
  approvedCandidateIds: string[];
  candidateSummaries: Array<{
    id: string;
    title: string;
    category: string;
    costTier: string;
    exposureImpact: string;
    emissionsImpact: string;
  }>;
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
  allowlistedNumbers: string[];
}
