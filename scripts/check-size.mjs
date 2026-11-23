import fs from 'fs';
import path from 'path';

const WARN_THRESHOLD_BYTES = 3 * 1024 * 1024; // 3 MB target
const HARD_LIMIT_BYTES = 10 * 1024 * 1024; // 10 MB limit

// Exclude external dependencies, build artifacts, test coverage, and IDE cache.
// Per requirement: .git IS included when present.
export const IGNORED_DIRS = new Set(['node_modules', 'dist', 'coverage', '.gemini']);

export function getDirSizeBytes(dirPath, rootDir = dirPath) {
  let total = 0;
  if (!fs.existsSync(dirPath)) {
    return 0;
  }

  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    if (IGNORED_DIRS.has(entry.name)) {
      continue;
    }
    const fullPath = path.join(dirPath, entry.name);
    try {
      if (entry.isDirectory()) {
        total += getDirSizeBytes(fullPath, rootDir);
      } else if (entry.isFile()) {
        const stats = fs.statSync(fullPath);
        total += stats.size;
      }
    } catch (_e) {
      // Ignore transient access errors
    }
  }

  return total;
}

export function runSizeCheck(rootDir = process.cwd()) {
  const totalBytes = getDirSizeBytes(rootDir, rootDir);
  const totalMB = (totalBytes / (1024 * 1024)).toFixed(2);

  const gitExists = fs.existsSync(path.join(rootDir, '.git'));
  console.log(
    `Repository size check: ${totalMB} MB (${totalBytes.toLocaleString()} bytes)${gitExists ? ' [including .git]' : ''}`,
  );

  if (totalBytes > HARD_LIMIT_BYTES) {
    console.error(`ERROR: Repository size exceeds hard limit of 10 MB! (Current: ${totalMB} MB)`);
    return false;
  }

  if (totalBytes > WARN_THRESHOLD_BYTES) {
    console.warn(`WARNING: Repository size exceeds 3 MB target. (Current: ${totalMB} MB)`);
  } else {
    console.log(`PASS: Repository size is within target budget (< 3 MB).`);
  }

  return true;
}

if (process.argv[1] && process.argv[1].replace(/\\/g, '/').endsWith('scripts/check-size.mjs')) {
  const success = runSizeCheck();
  if (!success) {
    process.exit(1);
  }
  process.exit(0);
}
