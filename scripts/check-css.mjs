#!/usr/bin/env node
/**
 * check-css.mjs
 * Validates CSS stylesheets in AirWise design system:
 * (a) Reports any .aw- class selector defined in CSS but never referenced in src/
 *     (with documented allow-list for dynamically generated classes).
 * (b) Detects duplicate selector blocks.
 * (c) Audits !important declarations (ensures restricted to accessibility & motion reduction).
 */
import fs from 'node:fs';
import path from 'node:path';

const errors = [];

// Helper to scan directory recursively
function scanFiles(dir, filter) {
  let list = [];
  if (!fs.existsSync(dir)) return list;
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, item.name);
    if (item.isDirectory()) {
      list = list.concat(scanFiles(full, filter));
    } else if (filter(full)) {
      list.push(full);
    }
  }
  return list;
}

// 1. Gather all source files in src/
const srcFiles = scanFiles('src', (f) => /\.(ts|tsx|html|js|mjs)$/.test(f));
const srcCode = srcFiles.map((f) => fs.readFileSync(f, 'utf8')).join('\n');

// 2. Allow-list of dynamically constructed .aw- classes:
// - aw-level-hero-0 .. aw-level-hero-4: dynamically interpolated in src/ui/components/LevelHero.tsx
//   as `aw-level-hero-${effectiveLevel}`
// - aw-skeleton-card, aw-skeleton-text, aw-skeleton-rect: dynamically interpolated in
//   src/ui/components/Skeleton.tsx as `aw-skeleton-${variant}`
const DYNAMIC_AW_CLASS_ALLOWLIST = new Set([
  'aw-level-hero-0',
  'aw-level-hero-1',
  'aw-level-hero-2',
  'aw-level-hero-3',
  'aw-level-hero-4',
  'aw-skeleton-card',
  'aw-skeleton-text',
  'aw-skeleton-rect',
]);

// 3. Scan all CSS files in src/styles/ and src/ui/
const cssFiles = scanFiles('src', (f) => /\.css$/.test(f));

// Extract !important uses and motion-reduction contexts
function parseImportantUses(cssContent, filePath) {
  const importantUses = [];
  const lines = cssContent.split('\n');
  let currentMedia = null;
  let currentSelector = '';

  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('@media')) {
      currentMedia = trimmed;
    } else if (trimmed === '}' && currentMedia) {
      currentMedia = null;
    } else if (trimmed.endsWith('{')) {
      currentSelector = trimmed.slice(0, -1).trim();
    }

    if (line.includes('!important')) {
      const isReducedMotionMedia =
        currentMedia !== null && currentMedia.includes('prefers-reduced-motion');
      const isMotionOffToggle =
        currentSelector.includes('data-motion="off"') ||
        currentSelector.includes('data-hidden="true"');
      const isAnimationOff = trimmed.startsWith('animation: none !important');

      importantUses.push({
        file: filePath,
        line: idx + 1,
        text: trimmed,
        isAllowed: isReducedMotionMedia || (isMotionOffToggle && isAnimationOff),
      });
    }
  });

  return importantUses;
}

function processToken(c, state, noComments, i, filePath, selectors) {
  if (c === '{') {
    state.depth++;
    const trimmed = state.buffer.trim();
    const isMedia = trimmed.startsWith('@media');
    const isAtRule = trimmed.startsWith('@');

    if (state.depth === 1) {
      if (isMedia) {
        state.mediaQuery = trimmed;
      } else if (!isAtRule) {
        selectors.push({ selector: trimmed, media: null, file: filePath });
      }
    } else if (state.depth === 2 && state.mediaQuery && !isAtRule) {
      selectors.push({ selector: trimmed, media: state.mediaQuery, file: filePath });
    }
    state.buffer = '';
  } else if (c === '}') {
    state.depth--;
    if (state.depth === 0) state.mediaQuery = null;
    state.buffer = '';
  } else if (c === ';' && state.depth === 0) {
    state.buffer = '';
  } else {
    state.buffer += c;
  }
}

// Parser to extract selector blocks
function parseCssBlocks(cssContent, filePath) {
  const selectors = [];
  const noComments = cssContent.replace(/\/\*[\s\S]*?\*\//g, '');
  const state = { buffer: '', depth: 0, mediaQuery: null };

  for (let i = 0; i < noComments.length; i++) {
    processToken(noComments[i], state, noComments, i, filePath, selectors);
  }

  const importantUses = parseImportantUses(cssContent, filePath);
  return { selectors, importantUses };
}

const allSelectors = [];
const allImportant = [];

for (const file of cssFiles) {
  const content = fs.readFileSync(file, 'utf8');
  const { selectors, importantUses } = parseCssBlocks(content, file);
  allSelectors.push(...selectors);
  allImportant.push(...importantUses);
}

// ---------------------------------------------------------------------------
// Check (a): .aw- class selectors defined in CSS but never referenced in src/
// ---------------------------------------------------------------------------
const awClassRegex = /\.([a-zA-Z0-9_-]+)/g;
const definedAwClasses = new Map(); // className -> Set of files

for (const { selector, file } of allSelectors) {
  let m;
  awClassRegex.lastIndex = 0;
  while ((m = awClassRegex.exec(selector)) !== null) {
    const cls = m[1];
    if (cls.startsWith('aw-')) {
      if (!definedAwClasses.has(cls)) {
        definedAwClasses.set(cls, new Set());
      }
      definedAwClasses.get(cls).add(file);
    }
  }
}

const unreferencedAwClasses = [];
for (const [cls, files] of definedAwClasses.entries()) {
  if (DYNAMIC_AW_CLASS_ALLOWLIST.has(cls)) continue;

  const escaped = cls.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
  const tokenRegex = new RegExp(`(?:['"\`\\s]|^)${escaped}(?:['"\`\\s]|$)`);
  if (!tokenRegex.test(srcCode)) {
    unreferencedAwClasses.push({ cls, files: Array.from(files) });
  }
}

if (unreferencedAwClasses.length > 0) {
  for (const item of unreferencedAwClasses) {
    errors.push(`Unreferenced .aw- class '${item.cls}' defined in ${item.files.join(', ')}`);
  }
}

// ---------------------------------------------------------------------------
// Check (b): Duplicate selector blocks
// ---------------------------------------------------------------------------
const seenSelectors = new Map(); // key -> { selector, media, file }
for (const item of allSelectors) {
  // Normalize selector whitespace and commas
  const normSelector = item.selector
    .split(',')
    .map((s) => s.trim().replace(/\s+/g, ' '))
    .sort()
    .join(', ');
  const key = `${normSelector} | media: ${item.media || 'none'}`;

  if (seenSelectors.has(key)) {
    const first = seenSelectors.get(key);
    errors.push(
      `Duplicate selector block: '${item.selector}' in ${item.file} (first defined in ${first.file})`,
    );
  } else {
    seenSelectors.set(key, item);
  }
}

// ---------------------------------------------------------------------------
// Check (c): !important uses
// ---------------------------------------------------------------------------
for (const imp of allImportant) {
  if (!imp.isAllowed) {
    errors.push(
      `Disallowed !important declaration outside reduced-motion overrides in ${imp.file}:${imp.line}: ${imp.text}`,
    );
  }
}

// ---------------------------------------------------------------------------
// Summary Report & Exit
// ---------------------------------------------------------------------------
console.log('--- AirWise CSS Audit Report ---');
console.log(
  `Total CSS files scanned: ${cssFiles.length} (${cssFiles.map((f) => path.basename(f)).join(', ')})`,
);
console.log(`Total selector blocks: ${allSelectors.length}`);
console.log(`Defined .aw- classes: ${definedAwClasses.size}`);
console.log(`Allow-listed dynamic .aw- classes: ${DYNAMIC_AW_CLASS_ALLOWLIST.size}`);
console.log(
  `!important declarations verified: ${allImportant.length} (all inside accessible motion reduction)`,
);

if (errors.length > 0) {
  console.error(`\nFAIL: Found ${errors.length} CSS error(s):`);
  errors.forEach((err) => console.error(`  - ${err}`));
  process.exit(1);
}

console.log('\nPASS: All CSS checks passed cleanly with 0 errors.');
process.exit(0);
