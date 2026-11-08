import { checkSourceStaleness } from '../../src/services/staleness.service';
import { SourceType } from '../../src/models/enums';

// Mock confluence and jira services
jest.mock('../../src/services/confluence.service', () => ({
  getPageVersion: jest.fn().mockImplementation((pageId: string) => {
    if (pageId === 'conf-page-updated') {
      return Promise.resolve({ version: 4 });
    }
    return Promise.resolve({ version: 3 });
  }),
}));

jest.mock('../../src/services/jira.service', () => ({
  getIssue: jest.fn().mockImplementation((issueId: string) => {
    return Promise.resolve({
      id: issueId,
      summary: 'Updated summary',
      description: 'Updated text content',
    });
  }),
}));

jest.mock('../../src/db/repository', () => ({
  updateSourceCheckTimestamp: jest.fn().mockResolvedValue(undefined),
}));

describe('StalenessService', () => {
  it('detects Confluence page version increment as stale', async () => {
    const check = await checkSourceStaleness(
      SourceType.CONFLUENCE_PAGE,
      'conf-page-updated',
      '3' // Known version is 3, current is 4
    );

    expect(check.isStale).toBe(true);
    expect(check.currentVersion).toBe('4');
    expect(check.knownVersion).toBe('3');
  });

  it('marks current when version matches', async () => {
    const check = await checkSourceStaleness(
      SourceType.CONFLUENCE_PAGE,
      'conf-page-current',
      '3' // Matches mocked 3
    );

    expect(check.isStale).toBe(false);
  });
});

