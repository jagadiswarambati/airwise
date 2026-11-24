#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const errors = [];

function getFilesToCheck() {
  const files = [];
  const readme = path.resolve('README.md');
  if (fs.existsSync(readme)) files.push(readme);

  const docsDir = path.resolve('docs');
  if (fs.existsSync(docsDir)) {
    for (const file of fs.readdirSync(docsDir)) {
      if (file.endsWith('.md')) {
        files.push(path.join(docsDir, file));
      }
    }
  }
  return files;
}

const mdFiles = getFilesToCheck();
const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;

for (const file of mdFiles) {
  const content = fs.readFileSync(file, 'utf8');
  let match;
  while ((match = linkRegex.exec(content)) !== null) {
    const rawTarget = match[2].trim();
    // Skip external URLs, mailto, and pure anchor fragments
    if (
      rawTarget.startsWith('http://') ||
      rawTarget.startsWith('https://') ||
      rawTarget.startsWith('mailto:') ||
      rawTarget.startsWith('#')
    ) {
      continue;
    }

    // Strip anchor fragment if present (e.g. ./docs/BUILD_PLAN.md#phase-1)
    const filePathOnly = rawTarget.split('#')[0];
    if (!filePathOnly) continue;

    const fileDir = path.dirname(file);
    const resolvedPath = path.resolve(fileDir, filePathOnly);

    if (!fs.existsSync(resolvedPath)) {
      errors.push(
        `Broken relative link in ${path.relative('.', file)}: '${rawTarget}' -> resolved '${path.relative('.', resolvedPath)}' does not exist`,
      );
    }
  }
}

if (errors.length > 0) {
  console.error(`check:links failed with ${errors.length} broken link(s):`);
  errors.forEach((err) => console.error(' - ' + err));
  process.exit(1);
} else {
  console.log(
    'check:links passed: All relative links in README.md and docs/*.md resolve successfully.',
  );
  process.exit(0);
}
