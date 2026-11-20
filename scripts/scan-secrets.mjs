import fs from 'fs';
import path from 'path';

const SECRET_PATTERNS = [
  { name: 'Gemini API Key', regex: /AIza[0-9A-Za-z-_]{35}/ },
  { name: 'Private Key Block', regex: /-----BEGIN (?:[A-Z]+ )?PRIVATE KEY-----/ },
  { name: 'AWS Access Key ID', regex: /AKIA[0-9A-Z]{16}/ },
  { name: 'GitHub Personal Access Token', regex: /(?:ghp_[0-9a-zA-Z]{36}|github_pat_[0-9a-zA-Z_]{82})/ },
  { name: 'OpenAI API Key', regex: /sk-[a-zA-Z0-9]{20,}/ },
  { name: 'Slack Bot Token', regex: /xoxb-[0-9]{11,13}-[0-9]{11,13}-[a-zA-Z0-9]{24}/ },
];

const IGNORED_PATHS = [
  'node_modules',
  '.git',
  'dist',
  'coverage',
  '.gemini',
  'package-lock.json',
  '.env.example',
  'scripts/scan-secrets.mjs',
];

function shouldIgnore(filePath) {
  return IGNORED_PATHS.some((ignored) => filePath.includes(ignored));
}

let foundSecrets = 0;

function scanDir(dirPath) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (shouldIgnore(fullPath)) {
      continue;
    }

    if (entry.isDirectory()) {
      scanDir(fullPath);
    } else if (entry.isFile()) {
      scanFile(fullPath);
    }
  }
}

function scanFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      for (const pattern of SECRET_PATTERNS) {
        if (pattern.regex.test(line)) {
          console.error(`SECRET DETECTED [${pattern.name}] in ${filePath}:${i + 1}`);
          foundSecrets++;
        }
      }
    }
  } catch (_e) {
    // Skip binary or unreadable files
  }
}

console.log('Scanning repository for committed secrets...');
scanDir(process.cwd());

if (foundSecrets > 0) {
  console.error(`ERROR: Found ${foundSecrets} potential secrets committed! Fix immediately.`);
  process.exit(1);
}

console.log('PASS: No secrets detected in scanned files.');
process.exit(0);

