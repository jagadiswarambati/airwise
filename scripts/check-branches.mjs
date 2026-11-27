import { execSync } from 'child_process';

/**
 * Validates whether a branch name is an authorized Dependabot branch.
 * Allowed pattern: dependabot/<ecosystem>/<package-details>
 * Explicitly rejects empty suffixes, directory traversal, or malformed characters.
 */
export function isValidDependabotBranch(name) {
  if (typeof name !== 'string') return false;
  if (!name.startsWith('dependabot/')) return false;
  if (name.includes('..')) return false;
  return /^dependabot\/[a-zA-Z0-9_./-]+$/.test(name);
}

/**
 * Checks if a branch is authorized under the single-main-branch policy.
 * Authorized branches: 'main' and valid 'dependabot/**' PR branches.
 */
export function isAuthorizedBranch(name) {
  return name === 'main' || isValidDependabotBranch(name);
}

/**
 * Resolves current branch names from custom options or git commands.
 */
function resolveBranchNames(options = {}) {
  const customRemoteHeads = options.customRemoteHeads ?? process.env.AIRWISE_FAKE_REMOTE_HEADS;
  const customLocalBranches =
    options.customLocalBranches ?? process.env.AIRWISE_FAKE_LOCAL_BRANCHES;

  if (customRemoteHeads !== undefined) {
    return customRemoteHeads
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const match = line.match(/refs\/heads\/(.+)$/);
        return match ? match[1] : line.split('\t')[1]?.replace('refs/heads/', '') || line;
      });
  }

  if (customLocalBranches !== undefined) {
    return customLocalBranches
      .split('\n')
      .map((b) => b.replace(/^\*?\s+/, '').trim())
      .filter(Boolean);
  }

  const remotesOutput = execSync('git remote', {
    encoding: 'utf-8',
    stdio: ['pipe', 'pipe', 'pipe'],
  }).trim();
  const remotes = remotesOutput
    .split('\n')
    .map((r) => r.trim())
    .filter(Boolean);

  if (remotes.includes('origin')) {
    const lsRemoteOutput = execSync('git ls-remote --heads origin', {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();

    return lsRemoteOutput
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const match = line.match(/refs\/heads\/(.+)$/);
        return match ? match[1] : line.split('\t')[1]?.replace('refs/heads/', '') || line;
      });
  }

  const localBranchOutput = execSync('git branch --list', {
    encoding: 'utf-8',
    stdio: ['pipe', 'pipe', 'pipe'],
  }).trim();

  return localBranchOutput
    .split('\n')
    .map((b) => b.replace(/^\*?\s+/, '').trim())
    .filter(Boolean);
}

/**
 * Single Branch Guard
 * Ensures repository contains primary branch 'main' and only authorized 'dependabot/**' branches.
 * Uses 'git ls-remote --heads origin' when remote exists (else local 'git branch').
 * Fails CLOSED on any error.
 */
export function checkBranches(options = {}) {
  try {
    const branchNames = resolveBranchNames(options);

    console.log(
      `Checking single-branch policy. Found branches: ${branchNames.join(', ') || '(none)'}`,
    );

    // Fail-closed if no branches exist
    if (branchNames.length === 0) {
      console.error(
        "ERROR: Single-branch policy violated! Expected exactly ['main'], found: []. Invalid: [].",
      );
      return false;
    }

    // Must have primary branch 'main'
    if (!branchNames.includes('main')) {
      console.error(
        `ERROR: Single-branch policy violated! Base branch 'main' is missing. Found: [${branchNames.join(', ')}].`,
      );
      return false;
    }

    // All extra branches must be valid dependabot/** branches
    const unauthorized = branchNames.filter((b) => !isAuthorizedBranch(b));
    if (unauthorized.length > 0) {
      console.error(
        `ERROR: Single-branch policy violated! Expected only 'main' and authorized 'dependabot/**' branches, found: [${branchNames.join(', ')}]. Invalid: [${unauthorized.join(', ')}].`,
      );
      return false;
    }

    const dependabotBranches = branchNames.filter((b) => b !== 'main');
    if (dependabotBranches.length > 0) {
      console.log(
        `PASS: Single-branch policy verified ('main' present with ${dependabotBranches.length} authorized dependabot branch(es)).`,
      );
    } else {
      console.log("PASS: Single-branch policy verified (exactly 'main' only).");
    }
    return true;
  } catch (error) {
    // Fail CLOSED on any git error or inspection failure
    console.error(`ERROR: Single-branch guard failed closed due to error: ${error.message}`);
    return false;
  }
}

// Direct execution from CLI
if (process.argv[1] && process.argv[1].replace(/\\/g, '/').endsWith('scripts/check-branches.mjs')) {
  const success = checkBranches();
  if (!success) {
    process.exit(1);
  }
  process.exit(0);
}
