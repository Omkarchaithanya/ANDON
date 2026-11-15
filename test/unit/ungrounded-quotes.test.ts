import { verifyExactQuote } from '../../src/utils/quote-verifier';

describe('Quote Verifier Grounding Guard', () => {
  const sourceText = 'Scheduled maintenance: Applying polyurethane floor sealer to Sector 4 next weekend.';

  it('accepts exact NFKC verbatim substring', () => {
    const quote = 'Applying polyurethane floor sealer to Sector 4 next weekend.';
    const result = verifyExactQuote(sourceText, quote);
    expect(result.verified).toBe(true);
    expect(result.startIndex).toBeGreaterThanOrEqual(0);
  });

  it('rejects paraphrased text not found verbatim in source', () => {
    const alteredQuote = 'Applying high-gloss floor coat to Sector 4.';
    const result = verifyExactQuote(sourceText, alteredQuote);
    expect(result.verified).toBe(false);
  });

  it('rejects hallucinated or invented text', () => {
    const inventedQuote = 'Robot velocity must not exceed 0.5 m/s in Sector 4.';
    const result = verifyExactQuote(sourceText, inventedQuote);
    expect(result.verified).toBe(false);
  });

  it('rejects empty quotes', () => {
    expect(verifyExactQuote(sourceText, '').verified).toBe(false);
    expect(verifyExactQuote(sourceText, '   ').verified).toBe(false);
  });
});
