import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

function findFilesRecursive(dir: string): string[] {
  let results: string[] = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(findFilesRecursive(fullPath));
    } else {
      results.push(fullPath);
    }
  }
  return results;
}

describe('Zero External Provider Direct Calls in src/ (CSP connect-src self)', () => {
  it('ensures "open-meteo.com" does not appear anywhere under src/', () => {
    const srcDir = path.resolve(__dirname, '../../src');
    const files = findFilesRecursive(srcDir);

    const violations: { file: string; line: number; text: string }[] = [];

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');
      const lines = content.split('\n');
      lines.forEach((line, idx) => {
        if (/open-meteo\.com/i.test(line)) {
          violations.push({
            file: path.relative(srcDir, file),
            line: idx + 1,
            text: line.trim(),
          });
        }
      });
    }

    expect(
      violations,
      `Found direct references to "open-meteo.com" under src/. All provider calls must go through same-origin /api/*:\n${JSON.stringify(violations, null, 2)}`,
    ).toEqual([]);
  });
});
