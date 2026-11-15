/**
 * @file test/unit/mechanisms.test.ts
 * @description Unit and property-style invariant tests for ANDON's 7 generic mechanisms.
 */

import {
  ConditionRegistry,
  defaultConditionRegistry,
} from '../../src/domain/condition-registry';
import {
  normalizeWithOffsetMap,
  verifyQuoteSubstring,
  compareDeclaredScope,
  resolveEntityIdentity,
  computeActionIdempotencyHash,
  evaluateBitemporalTimestamps,
  evaluateSourceStaleness,
} from '../../src/domain/mechanisms';

describe('ANDON Generic Algorithmic Mechanisms', () => {
  describe('Mechanism 1: Declarative Condition Registry', () => {
    it('registers new condition family without code modification', () => {
      const registry = new ConditionRegistry();
      registry.register({
        attribute: 'magnetic_guide_polarity',
        label: 'Floor Magnetic Guide Polarity',
        description: 'Magnetic polarity sequence embedded in factory floor for AGV navigation.',
        allowedValues: ['north_positive', 'south_positive', 'alternating_dual'],
        synonyms: {
          'north': 'north_positive',
          'south': 'south_positive',
        },
        comparisonMode: 'EXACT',
      });

      const fam = registry.get('magnetic_guide_polarity');
      expect(fam).toBeDefined();
      expect(fam?.allowedValues).toContain('north_positive');

      // Resolves allowed value directly and via synonym
      expect(registry.resolveAllowedValue('magnetic_guide_polarity', 'north_positive')).toBe('north_positive');
      expect(registry.resolveAllowedValue('magnetic_guide_polarity', 'north')).toBe('north_positive');
      expect(registry.resolveAllowedValue('magnetic_guide_polarity', 'uncalibrated')).toBeNull();
    });

    it('generates parameterized extraction prompt containing registered families', () => {
      const prompt = defaultConditionRegistry.buildParametrizedExtractionPrompt();
      expect(prompt).toContain('surface_finish');
      expect(prompt).toContain('matte_epoxy');
      expect(prompt).toContain('lighting_configuration');
      expect(prompt).toContain('high_output_led');
    });

    it('validates candidate against closed-world schema', () => {
      const validCandidate = {
        attribute: 'surface_finish',
        proposedValue: 'high_gloss_clear_finish',
      };
      const validResult = defaultConditionRegistry.validateExtractedCandidate(validCandidate);
      expect(validResult.isValid).toBe(true);
      expect(validResult.normalizedValue).toBe('high_gloss_clear_finish');

      const invalidAttr = {
        attribute: 'wall_paint_color',
        proposedValue: 'blue',
      };
      const invalidResult = defaultConditionRegistry.validateExtractedCandidate(invalidAttr);
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.error).toContain('not in the declared condition registry');
    });
  });

  describe('Mechanism 3: Exact NFKC Substring Grounding with Offset Mapping', () => {
    it('verifies exact substring across NFKC whitespace runs', () => {
      const source = 'Work Order:\n  Apply high-gloss clear finish to Aisle 7 next Saturday morning.';
      const quote = 'Apply high-gloss clear finish to Aisle 7 next Saturday';

      const result = verifyQuoteSubstring(source, quote);
      expect(result.verified).toBe(true);
      expect(result.rawStartIndex).toBeGreaterThan(0);
      expect(result.rawEndIndex).toBeGreaterThan(result.rawStartIndex);
      expect(source.slice(result.rawStartIndex, result.rawEndIndex)).toBe(quote);
    });

    it('rejects hallucinated or ungrounded quotes', () => {
      const source = 'Apply high-gloss clear finish to Aisle 7 next Saturday.';
      const quote = 'Apply ultra glossy high reflection finish';

      const result = verifyQuoteSubstring(source, quote);
      expect(result.verified).toBe(false);
      expect(result.startIndex).toBe(-1);
    });
  });

  describe('Mechanism 4: Deterministic Set-Membership Comparator', () => {
    it('detects Prospective coverage gap when proposed value differs from baseline', () => {
      const declared = [{ attribute_name: 'surface_finish', declared_value: 'matte_epoxy' }];
      const res = compareDeclaredScope('surface_finish', 'high_gloss_clear_finish', declared);

      expect(res.outcome).toBe('Prospective coverage gap');
      expect(res.findingSentence).toBe(
        'The selected baseline does not establish coverage of the proposed high_gloss_clear_finish condition.'
      );
    });

    it('detects Supported within declared scope when proposed value matches baseline', () => {
      const declared = [{ attribute_name: 'surface_finish', declared_value: 'matte_epoxy' }];
      const res = compareDeclaredScope('surface_finish', 'matte_epoxy', declared);

      expect(res.outcome).toBe('Supported within declared scope');
    });

    it('supports alternative equivalence evidence scopes', () => {
      const declared = [{ attribute_name: 'surface_finish', declared_value: 'matte_epoxy' }];
      const equiv = [{ attribute_name: 'surface_finish', accepted_value: 'polished_concrete' }];
      const res = compareDeclaredScope('surface_finish', 'polished_concrete', declared, equiv);

      expect(res.outcome).toBe('Supported within declared scope');
    });

    it('returns Unknown when attribute is not in declared baseline scope', () => {
      const declared = [{ attribute_name: 'surface_finish', declared_value: 'matte_epoxy' }];
      const res = compareDeclaredScope('lighting_configuration', 'high_output_led', declared);

      expect(res.outcome).toBe('Unknown');
    });
  });

  describe('Mechanism 5: Registry-Only Identity Resolution', () => {
    const zones = [
      { id: 'z-1', name: 'Aisle 7' },
      { id: 'z-2', name: 'Aisle 8' },
      { id: 'z-3', name: 'Dock Bay 1' },
    ];

    it('resolves exact registered zone', () => {
      const res = resolveEntityIdentity('Aisle 7', zones);
      expect(res.resolved).toBe(true);
      expect(res.zone?.id).toBe('z-1');
    });

    it('flags ambiguous matches fail-closed without guessing', () => {
      const res = resolveEntityIdentity('Aisle', zones);
      expect(res.resolved).toBe(false);
      expect(res.zone).toBeNull();
      expect(res.reason).toContain('Ambiguous location query');
    });

    it('fails closed on unknown location', () => {
      const res = resolveEntityIdentity('South Mezzanine', zones);
      expect(res.resolved).toBe(false);
      expect(res.zone).toBeNull();
    });
  });

  describe('Mechanism 6: Compound Action Idempotency Hashing', () => {
    it('produces deterministic SHA-256 hash', () => {
      const h1 = computeActionIdempotencyHash('FAC-1042', 'surface_finish', 'high_gloss_clear_finish', 'ev-hash-1');
      const h2 = computeActionIdempotencyHash('FAC-1042', 'surface_finish', 'high_gloss_clear_finish', 'ev-hash-1');
      expect(h1).toBe(h2);
      expect(h1).toMatch(/^[a-f0-9]{64}$/);

      const h3 = computeActionIdempotencyHash('FAC-1042', 'surface_finish', 'matte_epoxy', 'ev-hash-1');
      expect(h1).not.toBe(h3);
    });
  });

  describe('Mechanism 7: Bitemporal Evaluation & Staleness', () => {
    it('evaluates prospective vs retroactive effective dates', () => {
      const future = new Date(Date.now() + 86400000);
      const past = new Date(Date.now() - 86400000);

      const evalFuture = evaluateBitemporalTimestamps(future);
      expect(evalFuture.isProspective).toBe(true);
      expect(evalFuture.isRetroactive).toBe(false);

      const evalPast = evaluateBitemporalTimestamps(past);
      expect(evalPast.isRetroactive).toBe(true);
      expect(evalPast.isProspective).toBe(false);
    });

    it('detects source document staleness on revision or fingerprint mismatch', () => {
      expect(evaluateSourceStaleness(1, 2)).toBe(true);
      expect(evaluateSourceStaleness(3, 3)).toBe(false);
      expect(evaluateSourceStaleness(3, 3, 'fp-1', 'fp-2')).toBe(true);
      expect(evaluateSourceStaleness(3, 3, 'fp-1', 'fp-1')).toBe(false);
    });
  });
});

