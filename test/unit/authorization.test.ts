/**
 * @file test/unit/authorization.test.ts
 * @description Unit tests for fail-closed authorization, reviewer policies, and IDOR defenses.
 */

import {
  isAuthorizedReviewer,
  canConfirmRelationship,
  canApproveFollowup,
  validateActorForAction,
  getReviewerPolicy,
} from '../../src/services/authorization.service';
import { ActionType } from '../../src/models/enums';
import { AuthorizationError, ValidationError } from '../../src/utils/errors';
import * as repository from '../../src/db/repository';

jest.mock('../../src/db/repository');
jest.mock('@forge/api', () => ({
  __esModule: true,
  default: {
    asUser: () => ({
      requestJira: jest.fn(),
      requestConfluence: jest.fn(),
    }),
  },
  route: (strings: TemplateStringsArray, ...values: any[]) => strings.join(''),
}));

describe('Authorization Service (Fail-Closed & IDOR Defenses)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Validation', () => {
    it('rejects empty account IDs with ValidationError', async () => {
      await expect(isAuthorizedReviewer('', 'dep-1')).rejects.toThrow(ValidationError);
      await expect(canConfirmRelationship('')).rejects.toThrow(ValidationError);
      await expect(canApproveFollowup('')).rejects.toThrow(ValidationError);
    });

    it('rejects empty deployment IDs with ValidationError', async () => {
      await expect(isAuthorizedReviewer('acc-1', '')).rejects.toThrow(ValidationError);
    });
  });

  describe('Fail-Closed Default Policy', () => {
    it('defaults to configured_list with empty allowed_account_ids (denying unknown users)', async () => {
      (repository.getAppConfig as jest.Mock).mockResolvedValue(null);

      const policy = await getReviewerPolicy();
      expect(policy.mode).toBe('configured_list');
      expect(policy.allowed_account_ids).toEqual([]);

      const isAuth = await isAuthorizedReviewer('random-user', 'dep-1');
      expect(isAuth).toBe(false);
    });

    it('throws AuthorizationError when policy storage read fails (fails closed)', async () => {
      (repository.getAppConfig as jest.Mock).mockRejectedValue(new Error('DB read timeout'));

      await expect(isAuthorizedReviewer('user-1', 'dep-1')).rejects.toThrow(AuthorizationError);
    });
  });

  describe('Configured List Mode', () => {
    it('authorizes users in the allowed list and rejects others', async () => {
      (repository.getAppConfig as jest.Mock).mockResolvedValue(
        JSON.stringify({
          mode: 'configured_list',
          allowed_account_ids: ['qm:lead-robotics-eng', 'qm:site-admin'],
        })
      );

      const authorized = await isAuthorizedReviewer('qm:lead-robotics-eng', 'dep-1');
      const unauthorized = await isAuthorizedReviewer('unauthorized-user', 'dep-1');

      expect(authorized).toBe(true);
      expect(unauthorized).toBe(false);
    });
  });

  describe('Owner Only Mode (Object-Level Authorization)', () => {
    it('permits only the deployment owner', async () => {
      (repository.getAppConfig as jest.Mock).mockResolvedValue(
        JSON.stringify({ mode: 'owner_only' })
      );
      (repository.getDeploymentById as jest.Mock).mockResolvedValue({
        id: 'dep-1',
        owner_account_id: 'qm:lead-robotics-eng',
      });

      const ownerAuth = await isAuthorizedReviewer('qm:lead-robotics-eng', 'dep-1');
      const nonOwnerAuth = await isAuthorizedReviewer('other-user', 'dep-1');

      expect(ownerAuth).toBe(true);
      expect(nonOwnerAuth).toBe(false);
    });
  });

  describe('validateActorForAction Guard', () => {
    it('throws AuthorizationError when actor is not permitted', async () => {
      (repository.getAppConfig as jest.Mock).mockResolvedValue(
        JSON.stringify({
          mode: 'configured_list',
          allowed_account_ids: ['permitted-actor'],
        })
      );

      await expect(
        validateActorForAction('denied-actor', ActionType.FOLLOWUP_CREATED, 'dep-1')
      ).rejects.toThrow(AuthorizationError);
    });
  });
});
