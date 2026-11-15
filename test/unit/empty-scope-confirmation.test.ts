import { handleConfirmRelationship } from '../../src/resolvers/confirmation.resolver';
import * as repository from '../../src/db/repository';
import * as authService from '../../src/services/authorization.service';
import * as stalenessService from '../../src/services/staleness.service';
import { CoverageResult, DiscoveryStatus } from '../../src/models/enums';

jest.mock('../../src/db/repository');
jest.mock('../../src/services/authorization.service');
jest.mock('../../src/services/staleness.service');

describe('Empty Declared Scope Confirmation Guard', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (authService.getCurrentUser as jest.Mock).mockResolvedValue({
      accountId: 'reviewer-001',
      displayName: 'Reviewer One',
    });
    (authService.canConfirmRelationship as jest.Mock).mockResolvedValue(true);
    (stalenessService.checkSourceStaleness as jest.Mock).mockResolvedValue({
      isStale: false,
      currentVersion: 'hash-v1',
      knownVersion: 'hash-v1',
      lastChecked: new Date().toISOString(),
    });
  });

  it('returns typed unknown without inserting review row when declared scope is empty', async () => {
    (repository.getChangeIntentById as jest.Mock).mockResolvedValue({
      id: 'intent-empty-001',
      jira_issue_id: 'JIRA-200',
      jira_issue_key: 'JIRA-200',
      discovery_status: DiscoveryStatus.CANDIDATE,
      content_fingerprint: 'hash-v1',
      proposed_value: 'high_gloss',
    });

    (repository.getDeploymentById as jest.Mock).mockResolvedValue({
      id: 'dep-001',
      deployment_identifier: 'BOT-01',
      status: 'active',
    });

    // Evidence revision has empty scope
    (repository.getEvidenceRevisionsByDeploymentId as jest.Mock).mockResolvedValue([
      {
        id: 'ev-001',
        deployment_id: 'dep-001',
        status: 'current',
        declared_scope: { conditions: [] },
      },
    ]);

    const result: any = await handleConfirmRelationship(
      {
        changeIntentId: 'intent-empty-001',
        deploymentId: 'dep-001',
        confirmedAttribute: 'surface_finish',
        confirmedValue: 'high_gloss',
      },
      { accountId: 'reviewer-001' }
    );

    // Must return typed status 'unknown'
    expect(result.status).toBe('unknown');
    expect(result.coverage_result).toBe(CoverageResult.UNKNOWN);
    expect(result.id).toBeUndefined();

    // Must NOT mutate change intent or insert review decision
    expect(repository.confirmChangeIntent).not.toHaveBeenCalled();
    expect(repository.insertReviewDecision).not.toHaveBeenCalled();
  });
});
