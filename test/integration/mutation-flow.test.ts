import { handleApproveFollowup } from '../../src/resolvers/mutation.resolver';
import { FollowupCreationStatus } from '../../src/models/enums';

jest.mock('../../src/services/authorization.service', () => ({
  getCurrentUser: jest.fn().mockResolvedValue({ accountId: 'user-jane-smith', displayName: 'Jane Smith' }),
  canApproveFollowup: jest.fn().mockResolvedValue(true),
}));

jest.mock('../../src/services/staleness.service', () => ({
  checkSourceStaleness: jest.fn().mockResolvedValue({ isStale: false }),
}));

jest.mock('../../src/services/jira.service', () => ({
  createIssue: jest.fn().mockResolvedValue({
    id: 'issue-robot-456',
    key: 'ROBOT-456',
  }),
}));

jest.mock('../../src/db/repository', () => ({
  getReviewDecisionById: jest.fn().mockResolvedValue({
    id: 'rd-123',
    change_intent_id: 'ci-123',
    deployment_id: 'deploy-amr-12',
    evidence_revision_id: 'ev-123',
  }),
  getFollowupByIdempotencyKey: jest.fn().mockResolvedValue(null),
  getEvidenceRevisionById: jest.fn().mockResolvedValue({
    confluence_page_id: 'conf-123',
    confluence_page_version: 3,
  }),
  updateReviewDecisionFollowup: jest.fn().mockResolvedValue(undefined),
  insertAuditLog: jest.fn().mockResolvedValue(undefined),
}));

describe('Mutation Flow Integration', () => {
  it('creates approved Jira follow-up with idempotency and audit trail', async () => {
    const result = await handleApproveFollowup(
      {
        reviewDecisionId: 'rd-123',
        targetProjectKey: 'ROBOT',
        summary: '[ANDON Review] AMR-12 - surface_finish change in Aisle 7',
        description: 'Prospective coverage gap identified.',
      },
      {}
    );

    expect(result.success).toBe(true);
    expect(result.issueKey).toBe('ROBOT-456');
  });
});

