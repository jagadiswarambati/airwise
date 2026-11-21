import { describe, it, expect } from 'vitest';
import { ACTION_CATALOG } from '../../src/domain/catalog/actions';
import { ACTION_TEMPLATES } from '../../src/domain/templates';
import { PLAN_SYSTEM_PROMPT } from '../../src/ai/prompts/planPrompt';
import { GREEN_MEADOWS_SOCIETY, generateShareableBriefing } from '../../src/data/community';
import { getSampleScenarioSnapshot } from '../../src/data/fallback-chain';

describe('Content Lint & Safety Audit', () => {
  it('ensures all catalog actions have complete dual-axis impact specifications', () => {
    expect(ACTION_CATALOG.length).toBeGreaterThanOrEqual(24);

    for (const action of ACTION_CATALOG) {
      expect(action.id).toBeDefined();
      expect(action.title.trim().length).toBeGreaterThan(0);
      expect(action.category).toMatch(/^(indoor|personal|mobility|community)$/);
      expect(action.impactSpec).toBeDefined();

      // Exposure axis
      expect(action.impactSpec.exposure).toBeDefined();
      expect(action.impactSpec.exposure.direction).toBeDefined();
      expect(action.impactSpec.exposure.label).toMatch(/^(Measured|Estimated|Recommended)$/);
      expect(action.impactSpec.exposure.evidence).toMatch(/^(high|medium|low)$/);
      expect(action.impactSpec.exposure.noteTemplate.trim().length).toBeGreaterThan(0);

      // Emissions axis
      expect(action.impactSpec.emissions).toBeDefined();
      expect(action.impactSpec.emissions.direction).toBeDefined();
      expect(action.impactSpec.emissions.label).toMatch(/^(Measured|Estimated|Recommended)$/);
      expect(action.impactSpec.emissions.evidence).toMatch(/^(high|medium|low)$/);
      expect(action.impactSpec.emissions.noteTemplate.trim().length).toBeGreaterThan(0);

      // Boundary & Assumptions
      expect(action.impactSpec.doesNotChange.trim().length).toBeGreaterThan(0);
      expect(action.impactSpec.assumptions.length).toBeGreaterThan(0);
    }
  });

  it('ensures all action templates have complete copy and boundary disclosures', () => {
    for (const [id, template] of Object.entries(ACTION_TEMPLATES)) {
      expect(template.title.trim().length, `Template ${id} missing title`).toBeGreaterThan(0);
      expect(template.shortWhy.trim().length, `Template ${id} missing shortWhy`).toBeGreaterThan(0);
      expect(template.fullDescription.trim().length, `Template ${id} missing fullDescription`).toBeGreaterThan(0);
      expect(template.doesNotChange.trim().length, `Template ${id} missing doesNotChange`).toBeGreaterThan(0);
      expect(template.assumptions.length, `Template ${id} missing assumptions`).toBeGreaterThan(0);
    }
  });

  it('verifies PE-04 emergency medical caveat is verbatim (Rule P-14)', () => {
    const pe04 = ACTION_TEMPLATES['PE-04'];
    expect(pe04).toBeDefined();
    expect(pe04.fixedDisclaimer).toBe(
      "Follow your clinician's plan; seek urgent care if breathing is difficult or symptoms are severe."
    );
  });

  it('verifies PE-02 respirator guidance includes clinician caveat (Rule P-13)', () => {
    const pe02 = ACTION_TEMPLATES['PE-02'];
    expect(pe02).toBeDefined();
    expect(pe02.fixedDisclaimer).toContain('Some respirators make breathing harder. Ask your clinician');
  });

  it('asserts zero banned phrases across catalog, templates, prompt, and community data', () => {
    const bannedPhrases = [
      'you saved the planet',
      'saved the planet',
      'cure asthma',
      'cures asthma',
      'curing asthma',
      'treat your asthma',
      'cures respiratory',
      'guaranteed health outcome',
      'prescribe',
      'take 2 puffs',
    ];

    // Gather all text blobs
    const textCorpus: string[] = [
      PLAN_SYSTEM_PROMPT,
      JSON.stringify(ACTION_CATALOG),
      JSON.stringify(ACTION_TEMPLATES),
      JSON.stringify(GREEN_MEADOWS_SOCIETY),
      generateShareableBriefing(getSampleScenarioSnapshot('moderate'), 2),
    ];

    for (const text of textCorpus) {
      const lower = text.toLowerCase();
      for (const banned of bannedPhrases) {
        expect(lower).not.toContain(banned);
      }
    }
  });

  it('verifies honest dual-axis distinction: no claim that exposure reduction automatically reduces emissions', () => {
    for (const action of ACTION_CATALOG) {
      // If action reduces exposure, ensure emissions isn't claimed to reduce without explicit rationale
      if (action.impactSpec.exposure.direction === 'reduces' && action.impactSpec.emissions.direction === 'reduces') {
        // Only actions that genuinely reduce both (e.g. CM-01 no burning) should do so
        expect(['CM-01', 'CM-04']).toContain(action.id);
      }
    }
  });
});
