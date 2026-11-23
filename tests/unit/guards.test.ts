import { describe, expect, it } from 'vitest';
import path from 'path';
import fs from 'fs';
// @ts-expect-error script module without types
import { checkBranches } from '../../scripts/check-branches.mjs';
// @ts-expect-error script module without types
import { scanFile, shouldIgnore, SECRET_PATTERNS } from '../../scripts/scan-secrets.mjs';
// @ts-expect-error script module without types
import { getDirSizeBytes } from '../../scripts/check-size.mjs';

describe('Guards Unit Tests: Fail-Closed Behavior & Path Anchoring', () => {
  describe('scan-secrets: Anchored Path-Segment Ignores', () => {
    it('does NOT ignore paths that merely contain "dist" as a substring in directory or file name', () => {
      const root = 'C:/projects/airwise';
      // Substring "dist" inside "distribution" or "redis_storage"
      expect(shouldIgnore('C:/projects/airwise/src/distribution/index.ts', root)).toBe(false);
      expect(shouldIgnore('C:/projects/airwise/src/ui/distance.ts', root)).toBe(false);
      expect(shouldIgnore('C:/projects/airwise/src/redistribution/data.ts', root)).toBe(false);
    });

    it('correctly ignores true build and dependency directories and known ignore files', () => {
      const root = 'C:/projects/airwise';
      expect(shouldIgnore('C:/projects/airwise/dist/index.html', root)).toBe(true);
      expect(shouldIgnore('C:/projects/airwise/dist/assets/index.js', root)).toBe(true);
      expect(shouldIgnore('C:/projects/airwise/node_modules/zod/index.js', root)).toBe(true);
      expect(shouldIgnore('C:/projects/airwise/.git/config', root)).toBe(true);
      expect(shouldIgnore('C:/projects/airwise/.gemini/antigravity.json', root)).toBe(true);
      expect(shouldIgnore('C:/projects/airwise/coverage/lcov.info', root)).toBe(true);
      expect(shouldIgnore('C:/projects/airwise/package-lock.json', root)).toBe(true);
      expect(shouldIgnore('C:/projects/airwise/.env.example', root)).toBe(true);
      expect(shouldIgnore('C:/projects/airwise/scripts/scan-secrets.mjs', root)).toBe(true);
    });

    it('detects a planted secret in a path containing "dist" as a substring', () => {
      const tempDistDir = path.join(process.cwd(), 'tests', 'fixtures', 'distribution_test');
      fs.mkdirSync(tempDistDir, { recursive: true });
      const tempFile = path.join(tempDistDir, 'sample_dist.ts');
      const fakeSecret = 'AIzaSy' + 'B1234567890abcdefghijklmnopqrstuv'; // Valid format pattern
      fs.writeFileSync(tempFile, `export const KEY = "${fakeSecret}";\n`, 'utf-8');

      try {
        expect(shouldIgnore(tempFile, process.cwd())).toBe(false);
        const detections = scanFile(tempFile, SECRET_PATTERNS);
        expect(detections.length).toBeGreaterThan(0);
        expect(detections[0].name).toBe('Gemini API Key');
      } finally {
        if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
        if (fs.existsSync(tempDistDir)) fs.rmdirSync(tempDistDir);
      }
    });
  });

  describe('check-branches: Single Branch Guard & Fail-Closed Logic', () => {
    it('passes when remote origin has exactly "main"', () => {
      const fakeRemoteOutput = '6391d17494f43d89d8429bde4bdb7374ffd69868\trefs/heads/main';
      const result = checkBranches({ customRemoteHeads: fakeRemoteOutput });
      expect(result).toBe(true);
    });

    it('fails closed when remote origin has extra branches', () => {
      const fakeRemoteOutput = [
        '6391d17494f43d89d8429bde4bdb7374ffd69868\trefs/heads/main',
        'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2\trefs/heads/feature-branch',
      ].join('\n');

      const result = checkBranches({ customRemoteHeads: fakeRemoteOutput });
      expect(result).toBe(false);
    });

    it('fails closed when branch is not main (e.g. dev or master)', () => {
      const fakeRemoteOutput = '6391d17494f43d89d8429bde4bdb7374ffd69868\trefs/heads/dev';
      const result = checkBranches({ customRemoteHeads: fakeRemoteOutput });
      expect(result).toBe(false);
    });

    it('fails closed on empty branch list or unexpected output', () => {
      const result = checkBranches({ customRemoteHeads: '' });
      expect(result).toBe(false);
    });
  });

  describe('check-size: Includes .git directory', () => {
    it('measures repository size and includes .git directory when present', () => {
      const sizeBytes = getDirSizeBytes(process.cwd(), process.cwd());
      expect(sizeBytes).toBeGreaterThan(100 * 1024); // More than 100 KB
      // Confirm .git size contributes if .git exists
      const gitPath = path.join(process.cwd(), '.git');
      if (fs.existsSync(gitPath)) {
        const gitSize = getDirSizeBytes(gitPath, process.cwd());
        expect(gitSize).toBeGreaterThan(0);
        expect(sizeBytes).toBeGreaterThan(gitSize);
      }
    });
  });
});
