/**
 * @module quote-verifier
 * @description Verifies that candidate claims and quotes are verbatim NFKC-normalized
 * substrings of the authoritative source records fetched from Jira or Confluence.
 */

import { verifyQuoteSubstring } from '../domain/mechanisms';

export interface QuoteVerificationResult {
  verified: boolean;
  startIndex: number;
  endIndex: number;
  rawStartIndex?: number;
  rawEndIndex?: number;
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
 * Standardized on domain/mechanisms.verifyQuoteSubstring with raw offset projection.
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

  const res = verifyQuoteSubstring(sourceText, quote);
  if (!res.verified) {
    return {
      verified: false,
      startIndex: -1,
      endIndex: -1,
      reason: 'Quote is not an exact substring of the authoritative source text',
    };
  }

  return {
    verified: true,
    startIndex: res.startIndex,
    endIndex: res.endIndex,
    rawStartIndex: res.rawStartIndex,
    rawEndIndex: res.rawEndIndex,
  };
}

export { verifyQuoteSubstring };

