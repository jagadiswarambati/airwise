#!/usr/bin/env node
/**
 * check-css-used.mjs
 * Validates that every CSS class name referenced in src/ has a matching CSS rule:
 * (a) Collects every class name used in src/ (JSX className strings, template literals,
 *     conditional strings, binary expressions, and object properties passed through props).
 * (b) Validates each class against all defined CSS class selectors in src/ (including restored.css).
 * (c) Allows only genuinely dynamic prefixes, thoroughly documented.
 * (d) Exits with code 1 if any referenced class has no matching CSS rule.
 */
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

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

// ---------------------------------------------------------------------------
// 1. Allow-list of genuinely dynamic class prefixes (documented with source location):
// ---------------------------------------------------------------------------
// - aw-level-hero-: dynamically interpolated in LevelHero.tsx as `aw-level-hero-${effectiveLevel}` (0..4)
// - aw-haze-level-: dynamically interpolated in HazeBandSvg.tsx as `aw-haze-level-${slot.level}` (0..4)
// - aw-skeleton-: dynamically interpolated in Skeleton.tsx as `aw-skeleton-${variant}` (card, text, rect)
// - aw-atmosphere-: dynamically interpolated in SkyBackground.tsx as `aw-atmosphere-${atmosphere}`
// - aw-sky-: dynamically interpolated in SkyBackground.tsx as `aw-sky-${timeOfDay}`
// - aw-icon-: dynamically interpolated in Icon.tsx as `aw-icon-${name}`
// - aw-btn-: dynamically interpolated in Button.tsx as `aw-btn-${variant}` (primary, secondary, quiet, icon)
// - aw-badge-: dynamically interpolated in Badge.tsx as `aw-badge-${variant}` (neutral, data-type)
// - aw-banner-: dynamically interpolated in Banner.tsx as `aw-banner-${variant}` (warning, offline)
// - banner-: dynamically interpolated in LegalDocument.tsx as `banner-${type}` (warning, offline)
// - card-risk-level-: dynamically interpolated in CommunityBriefingCard.tsx as `card-risk-level-${level}` (0..4)
// - risk-level-: dynamically interpolated in RiskBadge.tsx as `risk-level-${level}` (0..4)
const DYNAMIC_PREFIXES = [
  'card-risk-level-',
  'risk-level-',
  'aw-level-hero-',
  'aw-haze-level-',
  'aw-skeleton-',
  'aw-atmosphere-',
  'aw-sky-',
  'aw-icon-',
  'aw-btn-',
  'aw-badge-',
  'aw-banner-',
  'banner-',
];

// ---------------------------------------------------------------------------
// 2. Extract defined CSS classes from all stylesheets in src/
// ---------------------------------------------------------------------------
const cssFiles = scanFiles('src', (f) => /\.css$/.test(f));
const definedClasses = new Set();
const classSelectorRegex = /\.([a-zA-Z0-9_-]+)/g;

for (const file of cssFiles) {
  const rawContent = fs.readFileSync(file, 'utf8');
  // Strip CSS comments to avoid extracting words from comments
  const content = rawContent.replace(/\/\*[\s\S]*?\*\//g, '');
  let m;
  classSelectorRegex.lastIndex = 0;
  while ((m = classSelectorRegex.exec(content)) !== null) {
    definedClasses.add(m[1]);
  }
}

// ---------------------------------------------------------------------------
// 3. Collect all referenced CSS classes from src/
// ---------------------------------------------------------------------------
const usedClasses = new Map(); // className -> Set of file paths

function registerClass(cls, file) {
  if (!cls || typeof cls !== 'string') return;
  const relFile = path.relative(process.cwd(), file).replace(/\\/g, '/');
  const tokens = cls.split(/\s+/);
  for (const token of tokens) {
    const cleaned = token.trim();
    if (
      !cleaned ||
      cleaned === '$' ||
      cleaned === '${}' ||
      cleaned === 'null' ||
      cleaned === 'undefined' ||
      cleaned === 'true' ||
      cleaned === 'false'
    ) {
      continue;
    }
    if (/^[()?:;,|&!=<>+*/~^]+$/.test(cleaned)) {
      continue;
    }
    const normalized = cleaned.replace(/^[^a-zA-Z0-9_-]+|[^a-zA-Z0-9_-]+$/g, '');
    if (!normalized) continue;

    if (!usedClasses.has(normalized)) {
      usedClasses.set(normalized, new Set());
    }
    usedClasses.get(normalized).add(relFile);
  }
}

function extractStringsFromNode(node, file) {
  if (!node) return;
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
    registerClass(node.text, file);
    return;
  }
  if (ts.isTemplateExpression(node)) {
    registerClass(node.head.text, file);
    for (const span of node.templateSpans) {
      registerClass(span.literal.text, file);
      extractStringsFromExpression(span.expression, file);
    }
    return;
  }
  extractStringsFromExpression(node, file);
}

function extractStringsFromExpression(expr, file) {
  if (!expr) return;
  if (ts.isStringLiteral(expr) || ts.isNoSubstitutionTemplateLiteral(expr)) {
    registerClass(expr.text, file);
  } else if (ts.isTemplateExpression(expr)) {
    registerClass(expr.head.text, file);
    for (const span of expr.templateSpans) {
      registerClass(span.literal.text, file);
      extractStringsFromExpression(span.expression, file);
    }
  } else if (ts.isConditionalExpression(expr)) {
    extractStringsFromExpression(expr.whenTrue, file);
    extractStringsFromExpression(expr.whenFalse, file);
  } else if (ts.isBinaryExpression(expr)) {
    extractStringsFromExpression(expr.left, file);
    extractStringsFromExpression(expr.right, file);
  } else if (ts.isCallExpression(expr)) {
    if (ts.isPropertyAccessExpression(expr.expression)) {
      extractStringsFromExpression(expr.expression.expression, file);
    }
    for (const arg of expr.arguments) {
      extractStringsFromExpression(arg, file);
    }
  } else if (ts.isParenthesizedExpression(expr)) {
    extractStringsFromExpression(expr.expression, file);
  } else if (ts.isArrayLiteralExpression(expr)) {
    for (const el of expr.elements) {
      extractStringsFromExpression(el, file);
    }
  }
}

const sourceFiles = [
  ...scanFiles('src', (f) => /\.(tsx|ts|html)$/.test(f)),
  ...(fs.existsSync('index.html') ? ['index.html'] : []),
];

for (const file of sourceFiles) {
  const content = fs.readFileSync(file, 'utf8');
  if (file.endsWith('.html')) {
    const classAttrRegex = /\bclass=["']([^"']+)["']/g;
    let m;
    while ((m = classAttrRegex.exec(content)) !== null) {
      registerClass(m[1], file);
    }
    continue;
  }
  const sourceFile = ts.createSourceFile(file, content, ts.ScriptTarget.Latest, true);

  function visit(node) {
    if (
      ts.isJsxAttribute(node) &&
      (node.name.text === 'className' || node.name.text === 'class') &&
      node.initializer
    ) {
      if (ts.isStringLiteral(node.initializer)) {
        registerClass(node.initializer.text, file);
      } else if (ts.isJsxExpression(node.initializer) && node.initializer.expression) {
        extractStringsFromNode(node.initializer.expression, file);
      }
    } else if (
      ts.isPropertyAssignment(node) &&
      node.name &&
      ((ts.isIdentifier(node.name) && (node.name.text === 'className' || node.name.text === 'class')) ||
        (ts.isStringLiteral(node.name) && (node.name.text === 'className' || node.name.text === 'class')))
    ) {
      extractStringsFromNode(node.initializer, file);
    }
    ts.forEachChild(node, visit);
  }
  visit(sourceFile);
}

// ---------------------------------------------------------------------------
// 4. Audit: Identify used classes that have no CSS definition
// ---------------------------------------------------------------------------
const missingClasses = [];

for (const [cls, files] of usedClasses.entries()) {
  const isDynamic = DYNAMIC_PREFIXES.some((prefix) => cls.startsWith(prefix));
  if (isDynamic) continue;

  if (!definedClasses.has(cls)) {
    missingClasses.push({ cls, files: Array.from(files).sort() });
  }
}

// Sort for deterministic reporting
missingClasses.sort((a, b) => a.cls.localeCompare(b.cls));

// ---------------------------------------------------------------------------
// 5. Output Report & Exit Status
// ---------------------------------------------------------------------------
console.log('--- AirWise Used CSS Classes Audit ---');
console.log(`Source files scanned: ${sourceFiles.length}`);
console.log(`CSS stylesheets scanned: ${cssFiles.length} (${cssFiles.map((f) => path.basename(f)).join(', ')})`);
console.log(`Distinct classes defined in CSS: ${definedClasses.size}`);
console.log(`Distinct classes referenced in src/: ${usedClasses.size}`);
console.log(`Allow-listed dynamic class prefixes: ${DYNAMIC_PREFIXES.length} (${DYNAMIC_PREFIXES.join(', ')})`);

if (missingClasses.length > 0) {
  console.error(`\nFAIL: Found ${missingClasses.length} referenced class(es) with NO CSS rule:`);
  for (const item of missingClasses) {
    console.error(`  - .${item.cls} (used in ${item.files.join(', ')})`);
  }
  process.exit(1);
}

console.log(`\nPASS: All ${usedClasses.size} referenced classes have corresponding CSS rules.`);
process.exit(0);
