import { z } from 'zod';

/**
 * Contract schema for Forge Custom UI / Resolver invocation context
 * Based on official Forge Context Documentation and community security audits
 */
export const ForgeContextContractSchema = z.object({
  accountId: z.string().min(1, 'Platform-verified accountId must not be empty'),
  cloudId: z.string().min(1, 'cloudId must be present'),
  siteUrl: z.string().url('siteUrl must be a valid Atlassian URL'),
  extension: z.object({
    type: z.literal('jira:issuePanel'),
    issue: z.object({
      id: z.string().min(1),
      key: z.string().regex(/^[A-Z][A-Z0-9]+-\d+$/, 'Issue key must match standard Jira format'),
      type: z.string().optional(),
    }),
    project: z.object({
      id: z.string().min(1),
      key: z.string().min(1),
    }).optional(),
  }),
});

/**
 * Contract schema for Forge Async Consumer Queue Event Payload
 */
export const ForgeQueueEventContractSchema = z.object({
  queueName: z.string().min(1),
  event: z.object({
    eventType: z.enum(['REVALIDATE_CHANGE_INTENT', 'CHECK_STALENESS', 'PURGE_EXPIRED']),
    changeIntentId: z.string().min(1),
    confluencePageId: z.string().optional(),
    confluencePageVersion: z.number().int().positive().optional(),
    timestamp: z.string().datetime(),
  }),
});

describe('Forge Context & Event Payload Contract Verification', () => {
  it('validates a compliant Forge Custom UI context object', () => {
    const validContext = {
      accountId: 'qm:lead-robotics-eng',
      cloudId: 'd9e0341e-3cb4-49c6-8c43-182390fcae12',
      siteUrl: 'https://facility-alpha.atlassian.net',
      extension: {
        type: 'jira:issuePanel',
        issue: {
          id: '10482',
          key: 'FAC-1042',
          type: 'Maintenance',
        },
        project: {
          id: '10010',
          key: 'FAC',
        },
      },
    };

    const parsed = ForgeContextContractSchema.safeParse(validContext);
    expect(parsed.success).toBe(true);
  });

  it('rejects contexts missing the critical platform-verified accountId', () => {
    const unverifiedContext = {
      accountId: '',
      cloudId: 'd9e0341e-3cb4-49c6-8c43-182390fcae12',
      siteUrl: 'https://facility-alpha.atlassian.net',
      extension: {
        type: 'jira:issuePanel',
        issue: {
          id: '10482',
          key: 'FAC-1042',
        },
      },
    };

    const parsed = ForgeContextContractSchema.safeParse(unverifiedContext);
    expect(parsed.success).toBe(false);
  });

  it('validates a compliant Forge Queue Event payload', () => {
    const validQueueEvent = {
      queueName: 'andon-events',
      event: {
        eventType: 'REVALIDATE_CHANGE_INTENT',
        changeIntentId: 'demo-intent-aisle7',
        confluencePageId: '10483',
        confluencePageVersion: 3,
        timestamp: new Date().toISOString(),
      },
    };

    const parsed = ForgeQueueEventContractSchema.safeParse(validQueueEvent);
    expect(parsed.success).toBe(true);
  });
});
