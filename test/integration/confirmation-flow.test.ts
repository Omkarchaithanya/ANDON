import { handleConfirmRelationship, handleDismissRelationship } from '../../src/resolvers/confirmation.resolver';
import { CoverageResult, ReviewStatus } from '../../src/models/enums';

const mockDeployment = {
  id: 'deploy-amr-12',
  zone_id: 'zone-aisle-7',
  deployment_identifier: 'AMR-12',
  confluence_page_id: 'conf-page-amr12-commissioning',
  confluence_page_version: 3,
  owner_account_id: 'user-jane-smith',
  status: 'active',
};

const mockEvidence = {
  id: 'ev-commissioning-amr12-v3',
  deployment_id: 'deploy-amr-12',
  evidence_type: 'commissioning',
  confluence_page_id: 'conf-page-amr12-commissioning',
  confluence_page_version: 3,
  source_quoted_text: 'Observed route/perception results apply to AMR-12, camera configuration C4, Aisle 7, existing matte epoxy finish.',
  declared_scope: {
    conditions: [
      { attribute_name: 'surface_finish', attribute_value: 'matte_epoxy' },
      { attribute_name: 'lighting_type', attribute_value: 'standard_warehouse_led' },
    ],
    configuration_id: 'C4',
    zone_id: 'zone-aisle-7',
  },
  approved_by: 'user-jane-smith',
  status: 'current',
};

jest.mock('../../src/services/authorization.service', () => ({
  getCurrentUser: jest.fn().mockResolvedValue({ accountId: 'user-jane-smith', displayName: 'Jane Smith' }),
  canConfirmRelationship: jest.fn().mockResolvedValue(true),
}));

jest.mock('../../src/services/staleness.service', () => ({
  checkSourceStaleness: jest.fn().mockResolvedValue({ isStale: false }),
}));

jest.mock('../../src/db/repository', () => ({
  getChangeIntentById: jest.fn().mockResolvedValue({
    id: 'ci-123',
    jira_issue_id: 'issue-maint-1234',
    discovery_status: 'candidate',
    proposed_attribute: 'surface_finish',
    proposed_value: 'high_gloss_clear_finish',
    content_fingerprint: 'fp-123',
  }),
  confirmChangeIntent: jest.fn().mockResolvedValue(undefined),
  dismissChangeIntent: jest.fn().mockResolvedValue(undefined),
  getDeploymentById: jest.fn().mockImplementation(() => Promise.resolve(mockDeployment)),
  getEvidenceRevisionsByDeploymentId: jest.fn().mockImplementation(() => Promise.resolve([mockEvidence])),
  insertReviewDecision: jest.fn().mockImplementation((input) => Promise.resolve({ id: 'rd-new-456', ...input })),
  insertAuditLog: jest.fn().mockResolvedValue(undefined),
}));

describe('Confirmation Flow Integration', () => {
  it('confirms relationship and calculates prospective coverage gap', async () => {
    const reviewDecision = await handleConfirmRelationship(
      {
        changeIntentId: 'ci-123',
        deploymentId: 'deploy-amr-12',
        confirmedAttribute: 'surface_finish',
        confirmedValue: 'high_gloss_clear_finish',
      },
      {}
    );

    expect(reviewDecision.coverage_result).toBe(CoverageResult.GAP);
    expect(reviewDecision.review_status).toBe(ReviewStatus.CONFIRMED_GAP);
  });

  it('dismisses candidate relationship with audit reason', async () => {
    const res = await handleDismissRelationship(
      {
        changeIntentId: 'ci-123',
        reason: 'Work will be completed in isolated Bay 9 area with no AMR transit.',
      },
      {}
    );

    expect(res.success).toBe(true);
  });
});
