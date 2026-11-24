import React from 'react';
import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { ACTION_CATALOG } from '../../src/domain/catalog/actions';
import { ACTION_TEMPLATES } from '../../src/domain/templates';
import { GREEN_MEADOWS_SOCIETY, generateShareableBriefing } from '../../src/data/community';
import { getSampleScenarioSnapshot } from '../../src/data/fallback-chain';
import { AboutScreen } from '../../src/ui/screens/AboutScreen';
import { PrivacyScreen } from '../../src/ui/screens/PrivacyScreen';
import { TermsScreen } from '../../src/ui/screens/TermsScreen';

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
      expect(action.impactSpec.exposure.label).toMatch(/^(Estimated|Recommended)$/);
      expect(action.impactSpec.exposure.evidence).toMatch(/^(high|medium|low)$/);
      expect(action.impactSpec.exposure.noteTemplate.trim().length).toBeGreaterThan(0);

      // Emissions axis
      expect(action.impactSpec.emissions).toBeDefined();
      expect(action.impactSpec.emissions.direction).toBeDefined();
      expect(action.impactSpec.emissions.label).toMatch(/^(Estimated|Recommended)$/);
      expect(action.impactSpec.emissions.evidence).toMatch(/^(high|medium|low)$/);
      expect(action.impactSpec.emissions.noteTemplate.trim().length).toBeGreaterThan(0);

      // Boundary & Assumptions
      expect(action.impactSpec.doesNotChange.trim().length).toBeGreaterThan(0);
      expect(action.impactSpec.assumptions.length).toBeGreaterThan(0);
    }
  });

  it('strictly bans the word "Measured" across all catalog impact specifications and user copy in MVP', () => {
    // In MVP, without hardware sensors or personal monitors, all figures are Estimated or Recommended
    for (const action of ACTION_CATALOG) {
      expect(action.impactSpec.exposure.label).not.toBe('Measured');
      expect(action.impactSpec.emissions.label).not.toBe('Measured');
      expect(action.impactSpec.exposure.noteTemplate).not.toMatch(/\bMeasured\b/);
      expect(action.impactSpec.emissions.noteTemplate).not.toMatch(/\bMeasured\b/);
    }

    for (const [id, template] of Object.entries(ACTION_TEMPLATES)) {
      expect(template.shortWhy, `Template ${id}`).not.toMatch(/\bMeasured\b/);
      expect(template.fullDescription, `Template ${id}`).not.toMatch(/\bMeasured\b/);
    }

    // Public pages copy check
    const aboutHtml = renderToString(React.createElement(AboutScreen));
    const privacyHtml = renderToString(React.createElement(PrivacyScreen));
    const termsHtml = renderToString(React.createElement(TermsScreen));
    expect(aboutHtml).not.toMatch(/\bMeasured\b/);
    expect(privacyHtml).not.toMatch(/\bMeasured\b/);
    expect(termsHtml).not.toMatch(/\bMeasured\b/);
  });

  it('ensures all action templates have complete copy and boundary disclosures', () => {
    for (const [id, template] of Object.entries(ACTION_TEMPLATES)) {
      expect(template.title.trim().length, `Template ${id} missing title`).toBeGreaterThan(0);
      expect(template.shortWhy.trim().length, `Template ${id} missing shortWhy`).toBeGreaterThan(0);
      expect(
        template.fullDescription.trim().length,
        `Template ${id} missing fullDescription`,
      ).toBeGreaterThan(0);
      expect(
        template.doesNotChange.trim().length,
        `Template ${id} missing doesNotChange`,
      ).toBeGreaterThan(0);
      expect(template.assumptions.length, `Template ${id} missing assumptions`).toBeGreaterThan(0);
    }
  });

  it('verifies PE-04 emergency medical caveat is verbatim (Rule P-14)', () => {
    const pe04 = ACTION_TEMPLATES['PE-04'];
    expect(pe04).toBeDefined();
    expect(pe04.fixedDisclaimer).toBe(
      "Follow your clinician's plan; seek urgent care if breathing is difficult or symptoms are severe.",
    );
  });

  it('verifies PE-02 respirator guidance includes clinician caveat (Rule P-13)', () => {
    const pe02 = ACTION_TEMPLATES['PE-02'];
    expect(pe02).toBeDefined();
    expect(pe02.fixedDisclaimer).toContain(
      'Some respirators make breathing harder. Ask your clinician',
    );
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
      'we prescribe',
      'prescribe medication',
      'prescribe a dose',
      'take 2 puffs',
    ];

    // Gather user-facing text corpora
    const textCorpus: string[] = [
      JSON.stringify(ACTION_CATALOG),
      JSON.stringify(ACTION_TEMPLATES),
      JSON.stringify(GREEN_MEADOWS_SOCIETY),
      generateShareableBriefing(getSampleScenarioSnapshot('moderate'), 2),
      renderToString(React.createElement(AboutScreen)),
      renderToString(React.createElement(PrivacyScreen)),
      renderToString(React.createElement(TermsScreen)),
    ];

    for (const text of textCorpus) {
      const lower = text.toLowerCase();
      for (const banned of bannedPhrases) {
        expect(lower).not.toContain(banned);
      }
    }
  });

  it('checks for unsourced percent figures across action copy: only documented figures allowed', () => {
    const allowedPercentages = ['95%', '100%', '50%', '15%', '0%'];

    for (const action of ACTION_CATALOG) {
      const combined = `${action.title} ${action.impactSpec.exposure.noteTemplate} ${action.impactSpec.emissions.noteTemplate} ${action.impactSpec.doesNotChange}`;
      const matches = combined.match(/\d+%/g) || [];
      for (const match of matches) {
        expect(
          allowedPercentages,
          `Action ${action.id} contains undocumented percentage ${match}`,
        ).toContain(match);
      }
    }

    for (const [id, template] of Object.entries(ACTION_TEMPLATES)) {
      const combined = `${template.title} ${template.shortWhy} ${template.fullDescription} ${template.doesNotChange}`;
      const matches = combined.match(/\d+%/g) || [];
      for (const match of matches) {
        expect(
          allowedPercentages,
          `Template ${id} contains undocumented percentage ${match}`,
        ).toContain(match);
      }
    }
  });

  it('verifies that community briefing preserves privacy: contains no individual ages, health flags, or coordinates', () => {
    const briefing = generateShareableBriefing(getSampleScenarioSnapshot('moderate'), 2);

    // No personal names
    expect(briefing).not.toMatch(/\bPriya\b/i);
    expect(briefing).not.toMatch(/\bArjun\b/i);
    expect(briefing).not.toMatch(/\bRamesh\b/i);

    // No specific personal health flags
    expect(briefing).not.toMatch(/\basthma\b/i);
    expect(briefing).not.toMatch(/\bcopd\b/i);
    expect(briefing).not.toMatch(/\bheart\b/i);
    expect(briefing).not.toMatch(/\bpregnant\b/i);

    // No individual member age strings (e.g. "8yo", "age 8", "Child, 8")
    expect(briefing).not.toMatch(/\b\d+\s*yo\b/i);
    expect(briefing).not.toMatch(/\bage\s*\d+\b/i);
    expect(briefing).not.toMatch(/Child,\s*\d+/i);

    // No fine-grained GPS coordinates
    expect(briefing).not.toMatch(/\d+\.\d{3,}/);
  });

  it('verifies honest dual-axis distinction: no claim that exposure reduction automatically reduces emissions', () => {
    for (const action of ACTION_CATALOG) {
      if (
        action.impactSpec.exposure.direction === 'reduces' &&
        action.impactSpec.emissions.direction === 'reduces'
      ) {
        expect(['IN-08', 'IN-09', 'MO-01', 'MO-04', 'MO-05', 'CM-01', 'CM-04']).toContain(
          action.id,
        );
      }
    }
  });

  it('verifies no text-transform: uppercase across all CSS files in src/', () => {
    function getCssFiles(dir: string): string[] {
      let list: string[] = [];
      for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, item.name);
        if (item.isDirectory()) {
          list = list.concat(getCssFiles(full));
        } else if (item.isFile() && item.name.endsWith('.css')) {
          list.push(full);
        }
      }
      return list;
    }

    const cssFiles = getCssFiles(path.resolve('src'));
    expect(cssFiles.length).toBeGreaterThan(0);

    for (const file of cssFiles) {
      const content = fs.readFileSync(file, 'utf8');
      expect(content, `File ${file} contains text-transform: uppercase`).not.toMatch(
        /text-transform\s*:\s*uppercase/i,
      );
    }
  });

  it('ensures zero NUL bytes across all markdown files in the repository', () => {
    function getMdFiles(dir: string): string[] {
      let list: string[] = [];
      for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
        if (item.name === 'node_modules' || item.name === '.git' || item.name === 'dist') continue;
        const full = path.join(dir, item.name);
        if (item.isDirectory()) {
          list = list.concat(getMdFiles(full));
        } else if (item.isFile() && item.name.endsWith('.md')) {
          list.push(full);
        }
      }
      return list;
    }

    const mdFiles = getMdFiles(path.resolve('.'));
    expect(mdFiles.length).toBeGreaterThan(0);

    for (const file of mdFiles) {
      const buf = fs.readFileSync(file);
      let nuls = 0;
      for (const b of buf) {
        if (b === 0) nuls++;
      }
      expect(nuls, `Markdown file ${file} contains ${nuls} NUL byte(s)`).toBe(0);
    }
  });

  it('ensures role="alert" is strictly confined to ErrorBoundary and ErrorSummary', () => {
    function getCodeFiles(dir: string): string[] {
      let list: string[] = [];
      for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, item.name);
        if (item.isDirectory()) {
          list = list.concat(getCodeFiles(full));
        } else if (item.isFile() && /\.(tsx|ts)$/.test(item.name)) {
          list.push(full);
        }
      }
      return list;
    }

    const codeFiles = getCodeFiles(path.resolve('src'));
    for (const file of codeFiles) {
      const normalized = file.replace(/\\/g, '/');
      if (normalized.endsWith('ErrorBoundary.tsx') || normalized.endsWith('ErrorSummary.tsx')) {
        continue;
      }
      const content = fs.readFileSync(file, 'utf8');
      const lines = content.split('\n');
      lines.forEach((line, idx) => {
        const trimmed = line.trim();
        if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) return;
        expect(
          line,
          `Disallowed role="alert" in ${file}:${idx + 1}. Interrupts screen readers on page load.`,
        ).not.toMatch(/role=["']alert["']/);
      });
    }
  });

  it('confirms Terms page renders jurisdiction as India and source code licence as MIT', () => {
    const html = renderToString(React.createElement(TermsScreen));
    expect(html).toContain('India');
    expect(html).toContain('Source code licence:');
    expect(html).toContain('MIT');
  });
});
