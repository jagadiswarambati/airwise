import { z } from 'zod';
import {
  type Confidence,
  type ImpactDirection,
  type ImpactLabel,
  type ImpactStatement,
  type RiskLevel,
  type SlotId,
} from './types';

/**
 * ActionCategorySchema.
 */
export const ActionCategorySchema = z.enum(['indoor', 'personal', 'mobility', 'community']);
/**
 * ActionCategory.
 */
export type ActionCategory = z.infer<typeof ActionCategorySchema>;

/**
 * ActionCostSchema.
 */
export const ActionCostSchema = z.enum(['free', 'low', 'medium', 'high']);
/**
 * ActionCost.
 */
export type ActionCost = z.infer<typeof ActionCostSchema>;

/**
 * ActionEffortSchema.
 */
export const ActionEffortSchema = z.union([z.literal(1), z.literal(2), z.literal(3)]);
/**
 * ActionEffort.
 */
export type ActionEffort = z.infer<typeof ActionEffortSchema>;

/**
 * ActionEvidenceSchema.
 */
export const ActionEvidenceSchema = z.enum(['high', 'medium', 'low']);
/**
 * ActionEvidence.
 */
export type ActionEvidence = z.infer<typeof ActionEvidenceSchema>;

/**
 * ImpactSpec.
 */
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

/**
 * Action.
 */
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

/**
 * ActionCandidate.
 */
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

/**
 * TimelineSlot.
 */
export interface TimelineSlot {
  slotId: SlotId;
  slotLabel: string;
  actionIds: string[];
  actions: ActionCandidate[];
  note?: string;
}

/**
 * Plan.
 */
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
