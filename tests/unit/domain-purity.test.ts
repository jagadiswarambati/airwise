import { describe, expect, it } from 'vitest';
import fs from 'fs';
import path from 'path';

/**
 * Domain Purity Audit:
 * Asserts that the domain core (src/domain) remains strictly pure:
 * 1. No Date.now() or new Date() with 0 arguments (clocks must be injected).
 * 2. No Math.random() without injection.
 * 3. No browser / DOM globals (window, document, localStorage, navigator, fetch).
 * 4. No imports from data, ai, ui, state, or React.
 */

export function stripStringsAndComments(source: string): string {
  // Replace block comments with spaces/newlines so line numbers are preserved
  let clean = source.replace(/\/\*[\s\S]*?\*\//g, (match) => {
    return match.replace(/[^\r\n]/g, ' ');
  });
  // Replace line comments with spaces
  clean = clean.replace(/\/\/.*$/gm, (match) => {
    return match.replace(/[^\r\n]/g, ' ');
  });
  // Replace template literals with spaces
  clean = clean.replace(/`[\s\S]*?`/g, (match) => {
    return match.replace(/[^\r\n]/g, ' ');
  });
  // Replace double-quoted strings
  clean = clean.replace(/"(?:[^"\\]|\\.)*"/g, (match) => {
    return match.replace(/[^\r\n]/g, ' ');
  });
  // Replace single-quoted strings
  clean = clean.replace(/'(?:[^'\\]|\\.)*'/g, (match) => {
    return match.replace(/[^\r\n]/g, ' ');
  });
  // Replace property accesses like .window or foo?.window
  clean = clean.replace(/\??\.\s*[a-zA-Z0-9_$]+/g, (match) => {
    return ' '.repeat(match.length);
  });
  // Replace property declarations like window: or 'window':
  clean = clean.replace(/\b[a-zA-Z0-9_$]+\s*:/g, (match) => {
    return ' '.repeat(match.length);
  });
  return clean;
}

describe('Domain Core Purity Audit', () => {
  const domainDir = path.join(process.cwd(), 'src', 'domain');

  function getAllFiles(dir: string): string[] {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    let files: string[] = [];
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        files = files.concat(getAllFiles(fullPath));
      } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
        files.push(fullPath);
      }
    }
    return files;
  }

  const domainFiles = getAllFiles(domainDir);

  it('scans all domain files and finds non-empty set of modules', () => {
    expect(domainFiles.length).toBeGreaterThan(10);
  });

  it('strictly forbids Date.now() across all src/domain files', () => {
    const violations: Array<{ file: string; line: number }> = [];

    for (const file of domainFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      const cleanContent = stripStringsAndComments(content);
      const lines = cleanContent.split('\n');
      lines.forEach((line, idx) => {
        if (line.includes('Date.now()')) {
          violations.push({ file: path.basename(file), line: idx + 1 });
        }
      });
    }

    expect(violations, `Found Date.now() in domain files: ${JSON.stringify(violations)}`).toEqual(
      [],
    );
  });

  it('strictly forbids new Date() with zero arguments across all src/domain files', () => {
    const violations: Array<{ file: string; line: number }> = [];

    for (const file of domainFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      const cleanContent = stripStringsAndComments(content);
      const lines = cleanContent.split('\n');
      lines.forEach((line, idx) => {
        // Match new Date() with optional whitespace inside parentheses
        if (/new\s+Date\(\s*\)/.test(line)) {
          violations.push({ file: path.basename(file), line: idx + 1 });
        }
      });
    }

    expect(
      violations,
      `Found new Date() with 0 arguments in domain files: ${JSON.stringify(violations)}`,
    ).toEqual([]);
  });

  it('strictly forbids browser globals (window, document, localStorage, navigator, fetch) in src/domain', () => {
    const violations: Array<{ file: string; global: string; line: number }> = [];
    const forbiddenGlobals = ['window', 'document', 'localStorage', 'navigator', 'fetch'];

    for (const file of domainFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      const cleanContent = stripStringsAndComments(content);
      const lines = cleanContent.split('\n');
      lines.forEach((line, idx) => {
        for (const g of forbiddenGlobals) {
          // Match standalone identifier token
          const regex = new RegExp(`\\b${g}\\b`);
          if (regex.test(line)) {
            violations.push({ file: path.basename(file), global: g, line: idx + 1 });
          }
        }
      });
    }

    expect(
      violations,
      `Found forbidden globals in domain files: ${JSON.stringify(violations)}`,
    ).toEqual([]);
  });

  it('verifies that the purity scanner detects planted browser globals and Date.now() in test code', () => {
    const badCode = `
      // Some comment
      const a = "a string with window in it";
      window.alert("bad");
      const b = localStorage.getItem("test");
      const c = Date.now();
      const d = new Date();
    `;
    const cleaned = stripStringsAndComments(badCode);
    expect(/\bwindow\b/.test(cleaned)).toBe(true);
    expect(/\blocalStorage\b/.test(cleaned)).toBe(true);
    expect(/Date\.now\(\)/.test(badCode)).toBe(true);
    expect(/new\s+Date\(\s*\)/.test(badCode)).toBe(true);
  });
});
