import * as configService from '../../src/services/config.service';
import * as authService from '../../src/services/authorization.service';
import * as repository from '../../src/db/repository';

jest.mock('../../src/db/repository');

describe('Reviewer Policy Configuration & Authorization alignment', () => {
  let storedConfig: Record<string, string> = {};

  beforeEach(() => {
    storedConfig = {};
    (repository.getAppConfig as jest.Mock).mockImplementation((key: string) => {
      return Promise.resolve(storedConfig[key] || null);
    });
    (repository.setAppConfig as jest.Mock).mockImplementation((key: string, value: string) => {
      storedConfig[key] = value;
      return Promise.resolve();
    });
  });

  it('defaults to fail-closed (configured_list with empty allowed_account_ids) when no config is set', async () => {
    const policy = await authService.getReviewerPolicy();
    expect(policy.mode).toBe('configured_list');
    expect(policy.allowed_account_ids).toEqual([]);
  });

  it('updates reviewer policy via configService and verifies getReviewerPolicy reads the exact same key', async () => {
    await configService.updateConfiguration({
      reviewerPolicyMode: 'configured_list',
      allowedReviewerAccountIds: ['user-alice', 'user-bob'],
    });

    // Check that repository stored it under REVIEWER_POLICY
    expect(storedConfig['REVIEWER_POLICY']).toBeDefined();
    const parsed = JSON.parse(storedConfig['REVIEWER_POLICY']);
    expect(parsed.mode).toBe('configured_list');
    expect(parsed.allowed_account_ids).toEqual(['user-alice', 'user-bob']);

    // Check that authService reads it faithfully
    const policy = await authService.getReviewerPolicy();
    expect(policy.mode).toBe('configured_list');
    expect(policy.allowed_account_ids).toEqual(['user-alice', 'user-bob']);
  });

  it('supports owner_only mode written by configService', async () => {
    await configService.updateConfiguration({
      reviewerPolicyMode: 'owner_only',
    });

    const policy = await authService.getReviewerPolicy();
    expect(policy.mode).toBe('owner_only');
  });
});
