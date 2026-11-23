import fs from 'fs';
import path from 'path';

export const SECRET_PATTERNS = [
  { name: 'Gemini API Key', regex: /AIza[0-9A-Za-z-_]{35}/ },
  { name: 'Private Key Block', regex: /-----BEGIN (?:[A-Z]+ )?PRIVATE KEY-----/ },
  { name: 'AWS Access Key ID', regex: /AKIA[0-9A-Z]{16}/ },
  {
    name: 'GitHub Personal Access Token',
    regex: /(?:ghp_[0-9a-zA-Z]{36}|github_pat_[0-9a-zA-Z_]{82})/,
  },
  { name: 'OpenAI API Key', regex: /sk-[a-zA-Z0-9]{20,}/ },
  { name: 'Slack Bot Token', regex: /xoxb-[0-9]{11,13}-[0-9]{11,13}-[a-zA-Z0-9]{24}/ },
];

export const IGNORED_DIR_NAMES = new Set(['node_modules', '.git', 'dist', 'coverage', '.gemini']);

export const IGNORED_RELATIVE_FILES = new Set([
  'package-lock.json',
  '.env.example',
  'scripts/scan-secrets.mjs',
]);

/**
 * Anchored path-segment ignore check:
 * Checks whether any directory component of the path matches an ignored directory,
 * or whether the relative file path matches an explicitly ignored file.
 * Avoids false substring matches (e.g. 'src/distribution' is NOT ignored).
 */
export function shouldIgnore(filePath, rootDir = process.cwd()) {
  const relPath = path.relative(rootDir, filePath).replace(/\\/g, '/');
  if (relPath === '' || relPath === '.') {
    return false;
  }

  if (IGNORED_RELATIVE_FILES.has(relPath)) {
    return true;
  }

  const segments = relPath.split('/');
  // If the path itself is an ignored directory
  if (segments.length === 1 && IGNORED_DIR_NAMES.has(segments[0])) {
    return true;
  }

  // Check all directory segments
  for (let i = 0; i < segments.length - 1; i++) {
    if (IGNORED_DIR_NAMES.has(segments[i])) {
      return true;
    }
  }

  return false;
}

export function scanFile(filePath, patterns = SECRET_PATTERNS) {
  const detections = [];
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      for (const pattern of patterns) {
        if (pattern.regex.test(line)) {
          detections.push({
            name: pattern.name,
            file: filePath,
            line: i + 1,
          });
        }
      }
    }
  } catch (_e) {
    // Skip binary or unreadable files
  }
  return detections;
}

export function scanDir(dirPath, rootDir = dirPath) {
  let detections = [];
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (shouldIgnore(fullPath, rootDir)) {
      continue;
    }

    if (entry.isDirectory()) {
      detections = detections.concat(scanDir(fullPath, rootDir));
    } else if (entry.isFile()) {
      detections = detections.concat(scanFile(fullPath));
    }
  }

  return detections;
}

export function runSecretScan(rootDir = process.cwd()) {
  console.log('Scanning repository for committed secrets (anchored path segments)...');
  const detections = scanDir(rootDir, rootDir);

  for (const d of detections) {
    console.error(`SECRET DETECTED [${d.name}] in ${d.file}:${d.line}`);
  }

  if (detections.length > 0) {
    console.error(
      `ERROR: Found ${detections.length} potential secrets committed! Fix immediately.`,
    );
    return false;
  }

  console.log('PASS: No secrets detected in scanned files.');
  return true;
}

if (process.argv[1] && process.argv[1].replace(/\\/g, '/').endsWith('scripts/scan-secrets.mjs')) {
  const success = runSecretScan();
  if (!success) {
    process.exit(1);
  }
  process.exit(0);
}
