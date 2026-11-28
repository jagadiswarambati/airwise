const BANNED_PATTERNS = [
  /\bdiagnos[a-z]*/i,
  /\btreat(?:ment|s|ing)?\b/i,
  /\bcures?\b/i,
  /\bmedicat(?:ion|ions|ed)?\b/i,
  /\bmedicines?\b/i,
  /\bdos(?:e|age|ages|ing)?\b/i,
  /\bprescrib[a-z]*/i,
  /\binhaler dose\b/i,
  /\bdoctor ordered\b/i,
  /sav(?:e|ed|ing) the planet/i,
  /\bguarantee(?:d|s)?\b/i,
];

function toAsciiDigit(ch: string): string {
  const cp = ch.codePointAt(0);
  if (cp === undefined) return ch;
  if (cp >= 0x30 && cp <= 0x39) return ch;
  let zero = cp;
  while (zero > 0 && /^\p{Nd}$/u.test(String.fromCodePoint(zero - 1)) && cp - zero < 9) {
    zero--;
  }
  return String(cp - zero);
}

/**
 * Normalises all Unicode decimal digits to ASCII.
 * Applies NFKC first (handles full-width digits like '８' -> '8'),
 * then maps any remaining Unicode decimal digits (\p{Nd}, e.g. Devanagari '१', Telugu '౧')
 * to standard ASCII '0'-'9'.
 */
export function normalizeUnicodeDigitsToAscii(str: string): string {
  const nfkc = str.normalize('NFKC');
  return nfkc.replace(/\p{Nd}/gu, toAsciiDigit);
}

export { BANNED_PATTERNS };
