import {
  extractSpan,
  findSpanByQuote,
  highlightSpan,
  truncateContext,
} from '../../src/utils/source-span';

describe('SourceSpan Utilities', () => {
  const fullText =
    'Observed route/perception results apply to AMR-12, camera configuration C4, Aisle 7, existing matte epoxy finish.';

  it('extracts exact substring by indices', () => {
    const span = extractSpan(fullText, 0, 8);
    expect(span).toBe('Observed');
  });

  it('finds span indices for exact quote', () => {
    const span = findSpanByQuote(fullText, 'matte epoxy finish');
    expect(span).not.toBeNull();
    expect(span?.start).toBeGreaterThan(0);
    expect(fullText.substring(span!.start, span!.end)).toBe('matte epoxy finish');
  });

  it('highlights span with custom boundary markers', () => {
    const span = findSpanByQuote(fullText, 'Aisle 7')!;
    const highlighted = highlightSpan(fullText, span.start, span.end, '[*', '*]');
    expect(highlighted).toContain('[*Aisle 7*]');
  });

  it('truncates context safely around target span', () => {
    const span = findSpanByQuote(fullText, 'camera configuration C4')!;
    const context = truncateContext(fullText, span.start, span.end, 15);
    expect(context).toContain('camera configuration C4');
  });
});

