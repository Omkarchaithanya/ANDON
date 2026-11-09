import { handleRunDiscovery } from '../../src/resolvers/discovery.resolver';

const mockJiraIssue = {
  id: 'issue-maint-1234',
  key: 'MAINT-1234',
  fields: {
    summary: 'Apply high-gloss clear finish to Aisle 7 next Saturday',
    description: 'Floor team will apply high-gloss finish to Aisle 7.',
    status: { name: 'To Do' },
    issuetype: { name: 'Task' },
  },
};

const mockGraphContext = {
  site_page_id: 'conf-page-site-registry-001',
  linked_pages: [
    { page_id: 'conf-page-aisle7-001', title: 'Aisle 7 Zone Details', page_type: 'zone' },
    { page_id: 'conf-page-amr12-commissioning', title: 'AMR-12 Commissioning Record', page_type: 'commissioning' },
  ],
  page_owners: [
    { page_id: 'conf-page-amr12-commissioning', owner_account_id: 'user-jane-smith', owner_display_name: 'Jane Smith' },
  ],
};

jest.mock('../../src/services/jira.service', () => ({
  getIssue: jest.fn().mockImplementation(() => Promise.resolve(mockJiraIssue)),
}));

jest.mock('../../src/services/teamwork-graph.service', () => ({
  discoverGraphContext: jest.fn().mockImplementation(() => Promise.resolve(mockGraphContext)),
}));

jest.mock('../../src/services/confluence.service', () => ({
  getPageWithVersion: jest.fn().mockResolvedValue({
    title: 'Commissioning Record',
    version: 3,
    content: 'Observed route/perception results apply to AMR-12, camera configuration C4, Aisle 7, existing matte epoxy finish.',
  }),
  extractPlainText: jest.fn().mockImplementation((t) => t),
}));

jest.mock('../../src/services/llm.service', () => ({
  extractChangeAttributes: jest.fn().mockResolvedValue({
    attribute: 'surface_finish',
    proposedValue: 'high_gloss_clear_finish',
    currentValue: 'matte_epoxy',
    location: 'Aisle 7',
    timing: 'next Saturday',
    attributeQuote: 'Apply high-gloss clear finish to Aisle 7 next Saturday',
    valueQuote: 'high-gloss clear finish',
    confidence: 0.95,
    reasoning: 'Clear surface finish change specified.',
  }),
  proposeRelationship: jest.fn().mockResolvedValue({
    zone_name: 'Aisle 7',
    attribute_name: 'surface_finish',
    new_value: 'high_gloss_clear_finish',
    confidence: 0.94,
    reasoning: 'Ticket describes high-gloss finish to Aisle 7, touching AMR-12 baseline matte epoxy.',
    source_quotes: [
      {
        quoted_text: 'Apply high-gloss clear finish to Aisle 7 next Saturday',
      },
    ],
  }),
}));

jest.mock('../../src/services/authorization.service', () => ({
  getCurrentUser: jest.fn().mockResolvedValue({ accountId: 'user-bob-wilson', displayName: 'Bob Wilson' }),
}));

jest.mock('../../src/services/config.service', () => ({
  getValidatedConfig: jest.fn().mockResolvedValue({
    siteRegistryPageId: 'conf-page-site-registry-001',
    defaultFollowupProjectKey: 'ROBOT',
    environment: 'production',
    reviewerPolicyMode: 'any_authenticated',
  }),
}));

jest.mock('../../src/db/repository', () => ({
  getAppConfig: jest.fn().mockResolvedValue('conf-page-site-registry-001'),
  getSiteById: jest.fn().mockResolvedValue({ id: 'site-warehouse-alpha', name: 'Warehouse Alpha' }),
  getZoneByName: jest.fn().mockResolvedValue({ id: 'zone-aisle-7', site_id: 'site-warehouse-alpha', name: 'Aisle 7' }),
  getDeploymentsByZoneId: jest.fn().mockResolvedValue([
    { id: 'dep-amr-12', deployment_identifier: 'AMR-12', status: 'active', site_id: 'site-warehouse-alpha', zone_id: 'zone-aisle-7' },
  ]),
  getConditionsByDeploymentId: jest.fn().mockResolvedValue([
    { attribute_name: 'surface_finish', attribute_value: 'matte_epoxy' },
  ]),
  getChangeIntentByIdempotencyKey: jest.fn().mockResolvedValue(null),
  insertChangeIntent: jest.fn().mockImplementation((input) => Promise.resolve({ id: 'ci-new-123', ...input })),
  getChangeIntentById: jest.fn().mockResolvedValue({
    id: 'ci-new-123',
    proposed_attribute: 'surface_finish',
    proposed_value: 'high_gloss_clear_finish',
    discovery_status: 'candidate',
    source_quoted_text: 'high-gloss clear finish',
  }),
  insertAuditLog: jest.fn().mockResolvedValue(undefined),
}));

describe('Discovery Flow Integration', () => {
  it('discovers candidate relationship from unlinked facilities request via Teamwork Graph', async () => {
    const result = await handleRunDiscovery({ issueId: 'issue-maint-1234' }, {});

    expect(result.candidates.length).toBeGreaterThan(0);
    const candidate = result.candidates[0];
    expect(candidate.proposed_attribute).toBe('surface_finish');
    expect(candidate.proposed_value).toBe('high_gloss_clear_finish');
    expect(candidate.discovery_status).toBe('candidate');
    expect(candidate.source_quoted_text).toContain('high-gloss clear finish');
  });
});
