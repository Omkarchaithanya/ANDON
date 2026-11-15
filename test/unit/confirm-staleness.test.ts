import { handleConfirmRelationship } from '../../src/resolvers/confirmation.resolver';
import * as repository from '../../src/db/repository';
import * as authService from '../../src/services/authorization.service';
import * as stalenessService from '../../src/services/staleness.service';
import { DiscoveryStatus, SourceType } from '../../src/models/enums';
import { StaleSourceError } from '../../src/utils/errors';

jest.mock('../../src/db/repository');
jest.mock('../../src/services/authorization.service');
jest.mock('../../src/services/staleness.service');

describe('Confirm Relationship Staleness Guard', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (authService.getCurrentUser as jest.Mock).mockResolvedValue({
      accountId: 'reviewer-001',
      displayName: 'Reviewer One',
    });
    (authService.canConfirmRelationship as jest.Mock).mockResolvedValue(true);
  });

  it('rejects confirmation with StaleSourceError if the source Jira issue was modified', async () => {
    (repository.getChangeIntentById as jest.Mock).mockResolvedValue({
      id: 'intent-001',
      jira_issue_id: 'JIRA-100',
      jira_issue_key: 'JIRA-100',
      discovery_status: DiscoveryStatus.CANDIDATE,
      content_fingerprint: 'hash-v1',
      proposed_value: 'epoxy',
    });

    (stalenessService.checkSourceStaleness as jest.Mock).mockResolvedValue({
      isStale: true,
      currentVersion: 'hash-v2-modified',
      knownVersion: 'hash-v1',
      lastChecked: new Date().toISOString(),
    });

    await expect(
      handleConfirmRelationship(
        {
          changeIntentId: 'intent-001',
          deploymentId: 'dep-001',
          confirmedAttribute: 'surface_finish',
          confirmedValue: 'epoxy',
        },
        { accountId: 'reviewer-001' }
      )
    ).rejects.toThrow(StaleSourceError);
  });
});
