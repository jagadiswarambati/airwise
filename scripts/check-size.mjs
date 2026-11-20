import fs from 'fs';
import path from 'path';

const WARN_THRESHOLD_BYTES = 3 * 1024 * 1024; // 3 MB target
const HARD_LIMIT_BYTES = 10 * 1024 * 1024; // 10 MB limit

const IGNORED_DIRS = new Set([
  'node_modules',
  '.git',
  'dist',
  'coverage',
  '.gemini',
]);

function getDirSizeBytes(dirPath) {
  let total = 0;
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    if (IGNORED_DIRS.has(entry.name)) {
      continue;
    }
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      total += getDirSizeBytes(fullPath);
    } else if (entry.isFile()) {
      const stats = fs.statSync(fullPath);
      total += stats.size;
    }
  }

  return total;
}

const rootDir = process.cwd();
const totalBytes = getDirSizeBytes(rootDir);
const totalMB = (totalBytes / (1024 * 1024)).toFixed(2);

console.log(`Repository size check: ${totalMB} MB (${totalBytes.toLocaleString()} bytes)`);

if (totalBytes > HARD_LIMIT_BYTES) {
  console.error(`ERROR: Repository size exceeds hard limit of 10 MB! (Current: ${totalMB} MB)`);
  process.exit(1);
}

if (totalBytes > WARN_THRESHOLD_BYTES) {
  console.warn(`WARNING: Repository size exceeds 3 MB target. (Current: ${totalMB} MB)`);
} else {
  console.log(`PASS: Repository size is within target budget (< 3 MB).`);
}

process.exit(0);

