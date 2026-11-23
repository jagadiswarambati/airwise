import fs from 'fs';
import path from 'path';

/**
 * Traceability Audit Script:
 * Verifies tests/README.md maps:
 * 1. Every policy rule ID P-01 to P-22.
 * 2. All required ImpactStatement fields: exposure, emissions, assumptions, doesNotChange, explanation.
 * 3. All required error types: DataUnavailable, DataStale, ProviderSchemaError, LlmUnavailable,
 *    LlmInvalid, GeolocationDenied, StorageUnavailable, RateLimited, ValidationError.
 * 4. Verifies that all referenced test files exist on disk.
 */

const readmePath = path.join(process.cwd(), 'tests', 'README.md');
if (!fs.existsSync(readmePath)) {
  console.error('ERROR: tests/README.md does not exist!');
  process.exit(1);
}

const readmeContent = fs.readFileSync(readmePath, 'utf-8');

const errors = [];

// 1. Check all P-rules P-01 to P-22
for (let i = 1; i <= 22; i++) {
  const ruleId = `P-${String(i).padStart(2, '0')}`;
  const regex = new RegExp(`\\|\\s*${ruleId}\\s*\\|`);
  if (!regex.test(readmeContent)) {
    errors.push(`Missing rule ID in traceability table: ${ruleId}`);
  }
}

// 2. Check ImpactStatement fields
const requiredImpactFields = [
  'exposure',
  'emissions',
  'assumptions',
  'doesNotChange',
  'explanation',
];
for (const field of requiredImpactFields) {
  const regex = new RegExp(`\`${field}\``);
  if (!regex.test(readmeContent)) {
    errors.push(`Missing ImpactStatement field in traceability table: ${field}`);
  }
}

// 3. Check Error types
const requiredErrorTypes = [
  'DataUnavailable',
  'DataStale',
  'ProviderSchemaError',
  'LlmUnavailable',
  'LlmInvalid',
  'GeolocationDenied',
  'StorageUnavailable',
  'RateLimited',
  'ValidationError',
];
for (const errType of requiredErrorTypes) {
  const regex = new RegExp(`\`${errType}\``);
  if (!regex.test(readmeContent)) {
    errors.push(`Missing Error type in traceability table: ${errType}`);
  }
}

// 4. Verify all referenced test files exist on disk
const fileRegex = /`tests\/[a-zA-Z0-9_\-\.\/]+`/g;
const matches = readmeContent.match(fileRegex) || [];
const referencedFiles = Array.from(new Set(matches.map((m) => m.replace(/`/g, ''))));

for (const relFile of referencedFiles) {
  const fullPath = path.join(process.cwd(), relFile);
  if (!fs.existsSync(fullPath)) {
    errors.push(`Referenced test file does not exist on disk: ${relFile}`);
  }
}

if (errors.length > 0) {
  console.error(`Traceability check FAILED with ${errors.length} error(s):`);
  errors.forEach((e) => console.error(`  - ${e}`));
  process.exit(1);
}

console.log(
  `Traceability check PASSED: All 22 P-rules, 5 Impact fields, 9 Error types, and ${referencedFiles.length} referenced test files verified.`,
);
process.exit(0);
