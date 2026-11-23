import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('Running full Cartesian Policy Matrix (691,200 cases + P-22 submatrix)...');

try {
  execSync('npx vitest run tests/policy/matrix-full.test.ts', {
    stdio: 'inherit',
    env: process.env,
  });

  const matrixRunFile = path.join(process.cwd(), 'docs', 'matrix-run.txt');
  if (!fs.existsSync(matrixRunFile)) {
    console.error('ERROR: docs/matrix-run.txt was not generated!');
    process.exit(1);
  }

  const content = fs.readFileSync(matrixRunFile, 'utf-8');
  if (!content.includes('STATUS: PASS (100% invariant satisfaction, zero violations)')) {
    console.error('ERROR: docs/matrix-run.txt does not report PASS!');
    process.exit(1);
  }

  console.log(
    'Full Cartesian Policy Matrix successfully verified and saved to docs/matrix-run.txt',
  );
  process.exit(0);
} catch (error) {
  console.error('ERROR: Matrix test execution failed:', error.message);
  process.exit(1);
}
