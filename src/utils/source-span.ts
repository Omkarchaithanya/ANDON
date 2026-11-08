/**
 * @module source-span
 * @description Utilities for extracting, verifying, and highlighting source text spans and quotes.
 */

/**
 * Extracts a substring bounded by start and end indices.
 */
export function extractSpan(fullText: string, start: number, end: number): string {
  if (!fullText) return '';
  const safeStart = Math.max(0, start);
  const safeEnd = Math.min(fullText.length, end);
  if (safeStart >= safeEnd) return '';
  return fullText.substring(safeStart, safeEnd);
}

/**
 * Finds the character span { start, end } for an exact quoted substring within text.
 */
export function findSpanByQuote(
  fullText: string,
  quote: string
): { start: number; end: number } | null {
  if (!fullText || !quote) return null;
  const index = fullText.indexOf(quote);
  if (index === -1) return null;
  return {
    start: index,
    end: index + quote.length,
  };
}

/**
 * Highlights a span within full text using custom markers (defaults to markdown bolding / quotes).
 */
export function highlightSpan(
  fullText: string,
  start: number,
  end: number,
  prefix = '«',
  suffix = '»'
): string {
  if (!fullText) return '';
  const before = fullText.substring(0, start);
  const target = fullText.substring(start, end);
  const after = fullText.substring(end);
  return `${before}${prefix}${target}${suffix}${after}`;
}

/**
 * Truncates text around a span, returning the highlighted snippet with context on both sides.
 */
export function truncateContext(
  fullText: string,
  start: number,
  end: number,
  contextChars = 60
): string {
  if (!fullText) return '';
  const ctxStart = Math.max(0, start - contextChars);
  const ctxEnd = Math.min(fullText.length, end + contextChars);

  const prefix = ctxStart > 0 ? '...' : '';
  const suffix = ctxEnd < fullText.length ? '...' : '';

  return `${prefix}${fullText.substring(ctxStart, ctxEnd)}${suffix}`.trim();
}

