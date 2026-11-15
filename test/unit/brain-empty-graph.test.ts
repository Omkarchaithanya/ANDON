jest.mock(
  '@forge/llm',
  () => ({
    chat: jest.fn(),
  }),
  { virtual: true }
);

import { executeBoundedPipeline, PipelineStep } from '../../src/agent/brain';
import * as jiraService from '../../src/services/jira.service';
import * as llmService from '../../src/services/llm.service';
import * as teamworkGraphService from '../../src/services/teamwork-graph.service';
import * as confluenceService from '../../src/services/confluence.service';
import * as repository from '../../src/db/repository';

jest.mock('../../src/services/jira.service');
jest.mock('../../src/services/llm.service');
jest.mock('../../src/services/teamwork-graph.service');
jest.mock('../../src/services/confluence.service');
jest.mock('../../src/db/repository');

describe('Brain Pipeline on Empty Teamwork Graph', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (jiraService.getIssue as jest.Mock).mockResolvedValue({
      id: 'issue-500',
      key: 'FAC-500',
      fields: {
        summary: 'Repaint floor markers in Bay 2',
        description: 'Repainting guidance lines with reflective paint.',
      },
    });

    (llmService.extractChangeAttributes as jest.Mock).mockResolvedValue({
      attribute: 'floor_marking',
      proposedValue: 'reflective_paint',
      location: 'Bay 2',
      timing: 'Next week',
      valueQuote: 'reflective paint',
      reasoning: 'Extracted floor marking change.',
    });

    (repository.getAppConfig as jest.Mock).mockResolvedValue('page-registry-99');

    (confluenceService.getPageWithVersion as jest.Mock).mockResolvedValue({
      id: 'page-registry-99',
      title: 'Facility Site Registry',
      status: 'current',
      version: 1,
      bodyStorage: '<p>Bay 2 Robot Operations</p>',
    });
  });

  it('returns UNKNOWN at CONTEXT step when graph traversal returns 0 linked pages', async () => {
    // Empty graph traversal
    (teamworkGraphService.getLinkedConfluencePages as jest.Mock).mockResolvedValue([]);

    const result = await executeBoundedPipeline('FAC-500');

    expect(result.status).toBe('UNKNOWN');
    expect(result.stepReached).toBe(PipelineStep.CONTEXT);
    expect(result.reason).toContain('Graph returned nothing. That is not the same as no relationship.');

    // Invariant: no change intent inserted when graph is empty
    expect(repository.insertChangeIntent).not.toHaveBeenCalled();
  });
});
