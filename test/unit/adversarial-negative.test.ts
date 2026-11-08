import { sanitizeForDisplay, generateIdempotencyKey } from '../../src/utils/validation';
import { evaluateCoverage } from '../../src/services/scope-comparison.service';
import { checkSourceStaleness } from '../../src/services/staleness.service';
import { CoverageResult, EvidenceStatus, EvidenceType, SourceType } from '../../src/models/enums';
import {
  INJECTION_TICKET,
  XSS_TICKET,
  REPEATED_EVENT_REPLAY,
} from '../fixtures/adversarial-cases';
import {
  MISSING_SPECIFICATION_CASE,
  ALTERNATIVE_EVIDENCE_CASE,
} from '../fixtures/negative-cases';

jest.mock('../../src/services/confluence.service', () => ({
  getPageVersion: jest.fn().mockImplementation((pageId: string) => {
    if (pageId === 'conf-stale') {
      return Promise.resolve({ version: 3 });
    }
    return Promise.resolve({ version: 2 });
  }),
}));

jest.mock('../../src/services/jira.service', () => ({
  getIssue: jest.fn().mockResolvedValue({
    id: 'issue-1',
    summary: 'Test',
    description: 'Test',
  }),
}));

jest.mock('../../src/db/repository', () => ({
  updateSourceCheckTimestamp: jest.fn().mockResolvedValue(undefined),
}));

describe('Adversarial & Negative Cases Suite', () => {
  describe('Adversarial Security Defenses', () => {
    it('sanitizes XSS attacks in ticket summary and description', () => {
      const cleanSummary = sanitizeForDisplay(XSS_TICKET.summary);
      const cleanDescription = sanitizeForDisplay(XSS_TICKET.description);

      expect(cleanSummary).not.toContain('<script>');
      expect(cleanSummary).not.toContain('</script>');
      expect(cleanDescription).not.toContain('<img');
      expect(cleanDescription).not.toContain('onerror');
    });

    it('defends against prompt injection via deterministic coverage engine', () => {
      // Even if an adversarial prompt attempts to claim safety or override instructions:
      const evaluation = evaluateCoverage(
        {
          attribute_name: INJECTION_TICKET.expected.candidateAttribute,
          proposed_value: 'high_gloss_clear_finish',
        },
        {
          conditions: [
            { attribute_name: 'surface_finish', attribute_value: 'matte_epoxy' },
          ],
        }
      );

      // The deterministic engine cannot be influenced by prompt injection
      expect(evaluation.result).toBe(CoverageResult.GAP);
      expect(evaluation.explanation).toContain('does not establish coverage of the proposed');
    });

    it('detects stale source writes when revision numbers diverge', async () => {
      const check = await checkSourceStaleness(
        SourceType.CONFLUENCE_PAGE,
        'conf-stale',
        '2'
      );
      expect(check.isStale).toBe(true);
      expect(check.currentVersion).toBe('3');
      expect(check.knownVersion).toBe('2');
    });

    it('generates identical idempotency keys on webhook replays', () => {
      const key1 = generateIdempotencyKey(
        REPEATED_EVENT_REPLAY.jiraIssueId,
        'system',
        'intake'
      );
      const key2 = generateIdempotencyKey(
        REPEATED_EVENT_REPLAY.jiraIssueId,
        'system',
        'intake'
      );

      expect(key1).toBe(key2);
    });
  });

  describe('Negative Business Rules', () => {
    it('returns UNKNOWN when condition specification is missing or empty', () => {
      const evaluation = evaluateCoverage(
        {
          attribute_name: MISSING_SPECIFICATION_CASE.expected.attributeIdentified,
          proposed_value: '',
        },
        {
          conditions: [
            { attribute_name: 'surface_finish', attribute_value: 'matte_epoxy' },
          ],
        }
      );

      expect(evaluation.result).toBe(CoverageResult.UNKNOWN);
    });

    it('identifies alternative evidence path when valid equivalence exists', () => {
      const altEvidence = [
        {
          id: ALTERNATIVE_EVIDENCE_CASE.equivalenceEvidence.id,
          deployment_id: ALTERNATIVE_EVIDENCE_CASE.equivalenceEvidence.deployment_id,
          evidence_type: EvidenceType.EQUIVALENCE,
          declared_scope: ALTERNATIVE_EVIDENCE_CASE.equivalenceEvidence.declared_scope,
          status: EvidenceStatus.CURRENT,
          recorded_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      const evaluation = evaluateCoverage(
        ALTERNATIVE_EVIDENCE_CASE.proposedCondition,
        {
          conditions: [
            { attribute_name: 'surface_finish', attribute_value: 'matte_epoxy' },
          ],
        },
        altEvidence
      );

      expect(evaluation.result).toBe(CoverageResult.ALTERNATIVE_PATH);
      expect(evaluation.alternative_evidence_id).toBe(ALTERNATIVE_EVIDENCE_CASE.equivalenceEvidence.id);
    });
  });
});
