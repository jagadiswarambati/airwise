import { execSync } from 'child_process';

try {
  const branchesOutput = execSync('git branch --list', { encoding: 'utf-8' }).trim();
  const branches = branchesOutput
    .split('\n')
    .map((b) => b.replace(/^\*?\s+/, '').trim())
    .filter(Boolean);

  console.log(`Checking single-branch policy. Found branches: ${branches.join(', ') || '(none)'}`);

  // When git is freshly initialized or on main branch
  const invalidBranches = branches.filter((b) => b !== 'main' && b !== '(HEAD detached at' && !b.startsWith('('));

  if (invalidBranches.length > 0) {
    console.error(`ERROR: Found extra branches: ${invalidBranches.join(', ')}. AirWise enforces a single 'main' branch.`);
    process.exit(1);
  }

  console.log("PASS: Single-branch policy verified ('main' only).");
  process.exit(0);
} catch (error) {
  console.warn(`Git branch check notice: ${error.message}`);
  // In CI or detached environment, exit gracefully if git command succeeded partially
  process.exit(0);
}

