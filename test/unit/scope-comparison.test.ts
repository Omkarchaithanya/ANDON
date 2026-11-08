import {
  evaluateCoverage,
  compareConditionValue,
  findAlternativeCoverage,
  buildCoverageDetail,
} from '../../src/services/scope-comparison.service';
import { CoverageResult, EvidenceStatus, EvidenceType } from '../../src/models/enums';
import { DeclaredScope, EvidenceRevision } from '../../src/models/entities';

describe('ScopeComparisonService (Deterministic Engine)', () => {
  const baselineScope: DeclaredScope = {
    conditions: [
      { attribute_name: 'surface_finish', attribute_value: 'matte_epoxy' },
      { attribute_name: 'lighting_type', attribute_value: 'standard_warehouse_led' },
    ],
    configuration_id: 'C4',
    zone_id: 'zone-aisle-7',
  };

  describe('evaluateCoverage', () => {
    it('should return GAP when proposed condition value differs from declared baseline', () => {
      const evaluation = evaluateCoverage(
        {
          attribute_name: 'surface_finish',
          proposed_value: 'high_gloss_clear_finish',
        },
        baselineScope
      );

      expect(evaluation.result).toBe(CoverageResult.GAP);
      expect(evaluation.unmatched.length).toBe(1);
      expect(evaluation.unmatched[0].attribute).toBe('surface_finish');
      expect(evaluation.unmatched[0].actual).toBe('matte_epoxy');
      expect(evaluation.unmatched[0].expected).toBe('high_gloss_clear_finish');
    });

    it('should return COVERED when proposed value matches declared scope exactly', () => {
      const evaluation = evaluateCoverage(
        {
          attribute_name: 'surface_finish',
          proposed_value: 'matte_epoxy',
        },
        baselineScope
      );

      expect(evaluation.result).toBe(CoverageResult.COVERED);
      expect(evaluation.matched.length).toBe(1);
      expect(evaluation.unmatched.length).toBe(0);
    });

    it('should return UNKNOWN when the attribute is not present in declared baseline scope', () => {
      const evaluation = evaluateCoverage(
        {
          attribute_name: 'ambient_temperature',
          proposed_value: 'freezer_minus_20c',
        },
        baselineScope
      );

      expect(evaluation.result).toBe(CoverageResult.UNKNOWN);
      expect(evaluation.missing.length).toBe(1);
      expect(evaluation.missing[0].attribute).toBe('ambient_temperature');
    });

    it('should return UNKNOWN when proposed value is empty or not specified', () => {
      const evaluation = evaluateCoverage(
        {
          attribute_name: 'surface_finish',
          proposed_value: '',
        },
        baselineScope
      );

      expect(evaluation.result).toBe(CoverageResult.UNKNOWN);
    });

    it('should return ALTERNATIVE_PATH when accepted equivalence evidence covers the proposed value', () => {
      const alternativeEvidence: EvidenceRevision[] = [
        {
          id: 'ev-equiv-01',
          deployment_id: 'deploy-amr-12',
          evidence_type: EvidenceType.EQUIVALENCE,
          declared_scope: {
            conditions: [
              { attribute_name: 'surface_finish', attribute_value: 'matte_epoxy' },
              { attribute_name: 'surface_finish', attribute_value: 'high_gloss_clear_finish' },
            ],
          },
          status: EvidenceStatus.CURRENT,
          recorded_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      const evaluation = evaluateCoverage(
        {
          attribute_name: 'surface_finish',
          proposed_value: 'high_gloss_clear_finish',
          current_value: 'matte_epoxy',
        },
        baselineScope,
        alternativeEvidence
      );

      expect(evaluation.result).toBe(CoverageResult.ALTERNATIVE_PATH);
      expect(evaluation.alternative_evidence_id).toBe('ev-equiv-01');
    });
  });

  describe('compareConditionValue', () => {
    it('matches identical normalized strings', () => {
      const match = compareConditionValue('surface_finish', 'matte_epoxy', 'surface_finish', 'matte_epoxy');
      expect(match.matches).toBe(true);
    });

    it('differentiates non-identical values', () => {
      const match = compareConditionValue('surface_finish', 'high_gloss', 'surface_finish', 'matte_epoxy');
      expect(match.matches).toBe(false);
    });
  });

  describe('buildCoverageDetail', () => {
    it('builds clear structured explanation for gap results', () => {
      const evaluation = evaluateCoverage(
        { attribute_name: 'surface_finish', proposed_value: 'high_gloss_clear_finish' },
        baselineScope
      );
      const detail = buildCoverageDetail(evaluation);

      expect(detail.explanation).toContain('does not establish coverage of the proposed');
      expect(detail.unmatched_conditions?.length).toBe(1);
    });
  });
});

