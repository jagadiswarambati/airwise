export const WARN_THRESHOLD_BYTES: number;
export const HARD_LIMIT_BYTES: number;
export const IGNORED_DIRS: Set<string>;

export function getDirSizeBytes(dirPath: string, rootDir?: string): number;
export function runSizeCheck(rootDir?: string): boolean;
