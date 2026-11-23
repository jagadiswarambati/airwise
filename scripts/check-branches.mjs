import { execSync } from 'child_process';

/**
 * Single Branch Guard
 * Ensures repository contains exactly one branch: 'main'.
 * Uses 'git ls-remote --heads origin' when remote exists (else local 'git branch').
 * Fails CLOSED on any error.
 */
export function checkBranches(options = {}) {
  const customRemoteHeads = options.customRemoteHeads ?? process.env.AIRWISE_FAKE_REMOTE_HEADS;
  const customLocalBranches =
    options.customLocalBranches ?? process.env.AIRWISE_FAKE_LOCAL_BRANCHES;

  let branchNames = [];

  try {
    if (customRemoteHeads !== undefined) {
      // Test injection for remote heads
      branchNames = customRemoteHeads
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
          const match = line.match(/refs\/heads\/(.+)$/);
          return match ? match[1] : line.split('\t')[1]?.replace('refs/heads/', '') || line;
        });
    } else if (customLocalBranches !== undefined) {
      // Test injection for local branches
      branchNames = customLocalBranches
        .split('\n')
        .map((b) => b.replace(/^\*?\s+/, '').trim())
        .filter(Boolean);
    } else {
      // Check remotes
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

        branchNames = lsRemoteOutput
          .split('\n')
          .map((line) => line.trim())
          .filter(Boolean)
          .map((line) => {
            const match = line.match(/refs\/heads\/(.+)$/);
            return match ? match[1] : line.split('\t')[1]?.replace('refs/heads/', '') || line;
          });
      } else {
        const localBranchOutput = execSync('git branch --list', {
          encoding: 'utf-8',
          stdio: ['pipe', 'pipe', 'pipe'],
        }).trim();

        branchNames = localBranchOutput
          .split('\n')
          .map((b) => b.replace(/^\*?\s+/, '').trim())
          .filter(Boolean);
      }
    }

    console.log(
      `Checking single-branch policy. Found branches: ${branchNames.join(', ') || '(none)'}`,
    );

    // Strict validation: must contain exactly 'main' and nothing else
    if (branchNames.length !== 1 || branchNames[0] !== 'main') {
      const invalid = branchNames.filter((b) => b !== 'main');
      console.error(
        `ERROR: Single-branch policy violated! Expected exactly ['main'], found: [${branchNames.join(', ')}]. Invalid: [${invalid.join(', ')}].`,
      );
      return false;
    }

    console.log("PASS: Single-branch policy verified (exactly 'main' only).");
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
