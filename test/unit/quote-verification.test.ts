/**
 * @file test/unit/quote-verification.test.ts
 * @description Verifies quote grounding behavior against live source buffers:
 * exact NFKC substrings pass, paraphrased or altered quotes fail closed.
 */

import { verifyExactQuote } from '../../src/utils/quote-verifier';

describe('Authoritative Source Quote Verification', () => {
  const JIRA_SOURCE_TEXT =
    'Facilities Work Order #7142: Scheduled floor resurfacing on Aisle 7. Planned work: Apply high-gloss clear finish to Aisle 7 next Saturday starting at 08:00 UTC.';

  const CONFLUENCE_SOURCE_PAGE =
    '<h1>AMR Commissioning Baseline</h1><p>Observed route/perception results apply to AMR-12, camera configuration C4, Aisle 7, existing matte epoxy finish.</p>';

  test('Facilities ticket quote matches verbatim substring', () => {
    const quote = 'Apply high-gloss clear finish to Aisle 7 next Saturday';
    const result = verifyExactQuote(JIRA_SOURCE_TEXT, quote);
    expect(result.verified).toBe(true);
    expect(result.startIndex).toBeGreaterThanOrEqual(0);
    expect(result.endIndex).toBe(result.startIndex + quote.length);
  });

  test('Commissioning record quote matches verbatim substring', () => {
    const quote = 'Observed route/perception results apply to AMR-12, camera configuration C4, Aisle 7, existing matte epoxy finish.';
    const result = verifyExactQuote(CONFLUENCE_SOURCE_PAGE, quote);
    expect(result.verified).toBe(true);
    expect(result.startIndex).toBeGreaterThanOrEqual(0);
  });

  test('Paraphrased quote is rejected fail-closed', () => {
    const paraphrase = 'Apply high gloss clear coating to Aisle 7 next Saturday';
    const result = verifyExactQuote(JIRA_SOURCE_TEXT, paraphrase);
    expect(result.verified).toBe(false);
  });
});

