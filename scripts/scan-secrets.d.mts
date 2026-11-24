export interface SecretPattern {
  name: string;
  regex: RegExp;
}

export const SECRET_PATTERNS: SecretPattern[];
export const IGNORED_DIR_NAMES: Set<string>;
export const IGNORED_RELATIVE_FILES: Set<string>;

export function shouldIgnore(filePath: string, rootDir?: string): boolean;
export function scanFile(
  filePath: string,
  patterns?: SecretPattern[],
): Array<{ name: string; match: string }>;
export function scanDir(
  dirPath: string,
  rootDir?: string,
): Array<{ file: string; detections: Array<{ name: string; match: string }> }>;
export function runSecretScan(rootDir?: string): boolean;
