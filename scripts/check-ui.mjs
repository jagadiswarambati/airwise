#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const errors = [];

// 1. Parse tokens.css to collect defined tokens
const tokensFile = path.resolve('src/styles/tokens.css');
if (!fs.existsSync(tokensFile)) {
  console.error('tokens.css not found!');
  process.exit(1);
}
const tokensContent = fs.readFileSync(tokensFile, 'utf8');
const declaredTokens = new Set();
const tokenDefRegex = /(--[a-zA-Z0-9-_]+)\s*:/g;
let m;
while ((m = tokenDefRegex.exec(tokensContent)) !== null) {
  declaredTokens.add(m[1]);
}

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

// 2. Scan src/ for undefined var(--x)
const allSrcFiles = scanFiles('src', (f) => /\.(css|ts|tsx)$/.test(f));
for (const file of allSrcFiles) {
  const content = fs.readFileSync(file, 'utf8');
  const varRegex = /var\((--[a-zA-Z0-9-_]+)/g;
  let vm;
  while ((vm = varRegex.exec(content)) !== null) {
    const token = vm[1];
    if (!declaredTokens.has(token)) {
      errors.push(`Undefined CSS variable '${token}' used in ${file}`);
    }
  }
}

// 3. Scan src/**/*.{ts,tsx} outside src/ui/icons for hex/rgb/hsl literals
const codeFiles = scanFiles('src', (f) => /\.(ts|tsx)$/.test(f));
const colorRegex = /(#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bhsla?\()/;
for (const file of codeFiles) {
  const normalized = file.replace(/\\/g, '/');
  if (normalized.includes('/ui/icons/')) continue;
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) return;
    if (colorRegex.test(line)) {
      errors.push(`Literal color found in ${file}:${idx + 1}: ${trimmed}`);
    }
  });
}

// 4. Scan src/**/*.{ts,tsx} for inline style={{ with non--- keys
const styleBlockRegex = /style=\{\{([^}]+)\}\}/g;
for (const file of codeFiles) {
  const content = fs.readFileSync(file, 'utf8');
  let sm;
  while ((sm = styleBlockRegex.exec(content)) !== null) {
    const inner = sm[1];
    const props = inner
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean);
    for (const prop of props) {
      if (prop.startsWith('...')) continue;
      const keyMatch = prop.match(/^(['"]?)([^:'"\s]+)\1\s*:/);
      if (keyMatch) {
        const key = keyMatch[2];
        if (!key.startsWith('--')) {
          errors.push(
            `Disallowed inline style property '${key}' in ${file}: style={{ ${inner.trim()} }}`,
          );
        }
      } else {
        if (!prop.includes('--')) {
          errors.push(
            `Non-custom-property style expression in ${file}: style={{ ${inner.trim()} }}`,
          );
        }
      }
    }
  }
}

// 5. Scan src/ui for emoji code points
const uiFiles = scanFiles(path.join('src', 'ui'), (f) => /\.(ts|tsx)$/.test(f));
const emojiRegex =
  /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1FA00}-\u{1FAFF}]/u;
for (const file of uiFiles) {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    if (emojiRegex.test(line)) {
      errors.push(`Emoji found in ${file}:${idx + 1}: ${line.trim()}`);
    }
  });
}

// 6. Scan src/**/*.css for disallowed text-transform: uppercase
const cssFiles = scanFiles('src', (f) => f.endsWith('.css'));
for (const file of cssFiles) {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    if (/text-transform\s*:\s*uppercase/i.test(line)) {
      errors.push(`Disallowed 'text-transform: uppercase' found in ${file}:${idx + 1}`);
    }
  });
}

// 7. Scan src/ for role="alert" outside ErrorBoundary and ErrorSummary
for (const file of codeFiles) {
  const normalized = file.replace(/\\/g, '/');
  if (normalized.endsWith('ErrorBoundary.tsx') || normalized.endsWith('ErrorSummary.tsx')) {
    continue;
  }
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) return;
    if (/role=["']alert["']/.test(line)) {
      errors.push(
        `Disallowed role="alert" found in ${file}:${idx + 1}. Page-load alerts interrupt screen readers; reserve for real blocking errors.`,
      );
    }
  });
}

if (errors.length > 0) {
  console.error(`UI check failed with ${errors.length} error(s):`);
  errors.forEach((e) => console.error(' - ' + e));
  process.exit(1);
} else {
  console.log(
    'UI checks passed: 0 undefined tokens, 0 literal colors in code, 0 non-custom-prop inline styles, 0 emojis in UI, 0 uppercase transforms, 0 disallowed alerts.',
  );
  process.exit(0);
}
