export interface CheckBranchesOptions {
  customRemoteHeads?: string;
  customLocalBranches?: string;
}

export interface CheckBranchesResult {
  ok: boolean;
  branches?: string[];
  error?: string;
}

export function checkBranches(options?: CheckBranchesOptions): CheckBranchesResult;
