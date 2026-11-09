/**
 * @module quote-verifier
 * @description Verifies that candidate claims and quotes are verbatim NFKC-normalized
 * substrings of the authoritative source records fetched from Jira or Confluence.
 */

export interface QuoteVerificationResult {
  verified: boolean;
  startIndex: number;
  endIndex: number;
  reason?: string;
}

/**
 * Normalizes text using Unicode NFKC and strips superfluous carriage returns.
 */
export function normalizeForVerification(text: string): string {
  if (!text) return '';
  return text
    .normalize('NFKC')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .trim();
}

/**
 * Verifies that a quote is an exact NFKC-normalized substring of the source text.
 * Returns true with exact start and end offsets if verified.
 */
export function verifyExactQuote(sourceText: string, quote: string): QuoteVerificationResult {
  if (!sourceText || !quote) {
    return {
      verified: false,
      startIndex: -1,
      endIndex: -1,
      reason: 'Source text or quote is empty',
    };
  }

  const normSource = normalizeForVerification(sourceText);
  const normQuote = normalizeForVerification(quote);

  const index = normSource.indexOf(normQuote);
  if (index === -1) {
    return {
      verified: false,
      startIndex: -1,
      endIndex: -1,
      reason: 'Quote is not an exact substring of the authoritative source text',
    };
  }

  return {
    verified: true,
    startIndex: index,
    endIndex: index + normQuote.length,
  };
}
