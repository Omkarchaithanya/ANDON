import {
  computeFingerprint,
  normalizeContent,
  hasContentChanged,
} from '../../src/utils/content-fingerprint';

describe('ContentFingerprint Utility', () => {
  it('computes deterministic SHA-256 hash', () => {
    const text = 'Apply high-gloss clear finish to Aisle 7 next Saturday';
    const hash1 = computeFingerprint(text);
    const hash2 = computeFingerprint(text);
    expect(hash1).toBe(hash2);
    expect(hash1.length).toBe(64);
  });

  it('normalizes whitespace and case before hashing', () => {
    const textA = 'Apply   High-Gloss   clear Finish  to Aisle 7\n';
    const textB = 'apply high-gloss clear finish to aisle 7';
    expect(computeFingerprint(textA)).toBe(computeFingerprint(textB));
  });

  it('detects substantive content change', () => {
    const original = 'Apply high-gloss clear finish to Aisle 7 next Saturday';
    const hash = computeFingerprint(original);
    const changed = 'Apply high-gloss clear finish to Aisle 7 next Sunday';

    expect(hasContentChanged(hash, changed)).toBe(true);
  });

  it('ignores trivial whitespace differences', () => {
    const original = 'Apply high-gloss finish';
    const hash = computeFingerprint(original);
    const withSpaces = '  Apply    high-gloss    finish   \n';

    expect(hasContentChanged(hash, withSpaces)).toBe(false);
  });
});

