import {
  generateChangeIntentKey,
  generateFollowupKey,
  checkChangeIntentIdempotency,
} from '../../src/services/idempotency.service';

jest.mock('../../src/db/repository', () => ({
  getChangeIntentByIdempotencyKey: jest.fn().mockImplementation((key: string) => {
    if (key) {
      return Promise.resolve({ id: 'ci-existing-123', discovery_status: 'candidate' });
    }
    return Promise.resolve(null);
  }),
}));

describe('IdempotencyService', () => {
  it('generates consistent, deterministic idempotency key', () => {
    const key1 = generateChangeIntentKey('MAINT-1234', 'surface_finish', 'high_gloss_clear_finish');
    const key2 = generateChangeIntentKey('MAINT-1234', 'surface_finish', 'high_gloss_clear_finish');
    expect(key1).toBe(key2);
    expect(key1.length).toBe(64);
  });

  it('differentiates distinct attribute changes', () => {
    const key1 = generateChangeIntentKey('MAINT-1234', 'surface_finish', 'high_gloss');
    const key2 = generateChangeIntentKey('MAINT-1234', 'lighting_type', 'high_gloss');
    expect(key1).not.toBe(key2);
  });

  it('generates follow-up idempotency key linking change and deployment', () => {
    const key = generateFollowupKey('ci-999', 'deploy-amr-12');
    expect(key).toBeDefined();
    expect(key.length).toBe(64);
  });

  it('detects existing duplicate change intent', async () => {
    const res = await checkChangeIntentIdempotency('duplicate-issue', 'surface_finish', 'gloss');
    expect(res.isDuplicate).toBe(true);
    expect(res.existingEntityId).toBe('ci-existing-123');
  });
});

