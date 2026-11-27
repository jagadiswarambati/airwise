export interface CheckBranchesOptions {
  customRemoteHeads?: string;
  customLocalBranches?: string;
}

export function isValidDependabotBranch(name?: string): boolean;
export function isAuthorizedBranch(name?: string): boolean;
export function checkBranches(options?: CheckBranchesOptions): boolean;
