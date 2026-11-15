import { handleApproveFollowup } from '../../src/resolvers/mutation.resolver';
import * as repository from '../../src/db/repository';
import * as authService from '../../src/services/authorization.service';
import * as jiraService from '../../src/services/jira.service';
import * as stalenessService from '../../src/services/staleness.service';
import { FollowupCreationStatus, ReviewStatus } from '../../src/models/enums';

jest.mock('../../src/db/repository');
jest.mock('../../src/services/authorization.service');
jest.mock('../../src/services/jira.service');
jest.mock('../../src/services/staleness.service');

describe('Follow-up Creation Idempotency & Call Count Guarantee', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (authService.getCurrentUser as jest.Mock).mockResolvedValue({
      accountId: 'reviewer-eng-1',
      displayName: 'Lead Engineer',
    });
    (authService.canApproveFollowup as jest.Mock).mockResolvedValue(true);
    (stalenessService.checkSourceStaleness as jest.Mock).mockResolvedValue({ isStale: false });
  });

  it('short-circuits and calls jiraService.createIssue ZERO times when follow-up was already created', async () => {
    (repository.getReviewDecisionById as jest.Mock).mockResolvedValue({
      id: 'rev-dec-100',
      change_intent_id: 'intent-100',
      deployment_id: 'dep-100',
      review_status: ReviewStatus.CONFIRMED_GAP,
    });

    // Existing follow-up found with status CREATED
    (repository.getFollowupByIdempotencyKey as jest.Mock).mockResolvedValue({
      id: 'rev-dec-100',
      followup_creation_status: FollowupCreationStatus.CREATED,
      followup_jira_issue_key: 'ENG-9988',
      followup_jira_issue_id: '12345',
    });

    const result = await handleApproveFollowup(
      {
        reviewDecisionId: 'rev-dec-100',
        targetProjectKey: 'ENG',
        summary: 'Revalidate sensor baseline',
        description: 'Testing requirement',
      },
      {}
    );

    expect(result.success).toBe(true);
    expect(result.duplicate).toBe(true);
    expect(result.issueKey).toBe('ENG-9988');

    // Invariant: External mutation called 0 times on duplicate invocation
    expect(jiraService.createIssue).toHaveBeenCalledTimes(0);
  });

  it('persists idempotency key before calling createIssue exactly once on first approval', async () => {
    (repository.getReviewDecisionById as jest.Mock).mockResolvedValue({
      id: 'rev-dec-200',
      change_intent_id: 'intent-200',
      deployment_id: 'dep-200',
      review_status: ReviewStatus.CONFIRMED_GAP,
    });

    (repository.getFollowupByIdempotencyKey as jest.Mock).mockResolvedValue(null);

    (jiraService.createIssue as jest.Mock).mockResolvedValue({
      id: 'new-issue-id',
      key: 'ENG-5555',
    });

    const callOrder: string[] = [];

    (repository.setFollowupPendingWithKey as jest.Mock).mockImplementation(() => {
      callOrder.push('setFollowupPendingWithKey');
      return Promise.resolve();
    });

    (jiraService.createIssue as jest.Mock).mockImplementation(() => {
      callOrder.push('createIssue');
      return Promise.resolve({ id: 'new-issue-id', key: 'ENG-5555' });
    });

    const result = await handleApproveFollowup(
      {
        reviewDecisionId: 'rev-dec-200',
        targetProjectKey: 'ENG',
        summary: 'Revalidate sensor baseline',
        description: 'Testing requirement',
      },
      {}
    );

    expect(result.success).toBe(true);
    expect(result.issueKey).toBe('ENG-5555');

    // Invariant: external Jira mutation called exactly 1 time
    expect(jiraService.createIssue).toHaveBeenCalledTimes(1);

    // Invariant: idempotency key is persisted to DB BEFORE external API mutation is invoked
    expect(callOrder).toEqual(['setFollowupPendingWithKey', 'createIssue']);
  });
});
