/**
 * @module discovery.resolver
 * @description Enterprise production resolver for discovering shadow changes via Teamwork Graph and LLM inference.
 *
 * No hardcoded entities, IDs, or mock data. All context is fetched live from Jira, Confluence, and Teamwork Graph.
 */

import { DiscoveryStatus, ActionType } from '../models/enums';
import { ChangeIntent, ExtractionProposal } from '../models/entities';
import { ValidationError, NotFoundError } from '../utils/errors';
import { isNonEmptyString } from '../utils/validation';
import { computeFingerprint } from '../utils/content-fingerprint';
import * as repository from '../db/repository';
import * as jiraService from '../services/jira.service';
import * as confluenceService from '../services/confluence.service';
import * as teamworkGraphService from '../services/teamwork-graph.service';
import * as llmService from '../services/llm.service';
import * as authService from '../services/authorization.service';
import * as idempotencyService from '../services/idempotency.service';
import * as configService from '../services/config.service';
import { executeBoundedPipeline } from '../agent/brain';

/**
 * Retrieves the live Jira issue context and any existing change intents for this ticket.
 */
export async function handleGetDiscoveryContext(payload: any, context: any): Promise<any> {
  const issueId = payload?.issueId || context?.extension?.issue?.id;
  const issueKey = payload?.issueKey || context?.extension?.issue?.key;

  if (!isNonEmptyString(issueId) && !isNonEmptyString(issueKey)) {
    throw new ValidationError('A valid Jira Issue ID or Key is required to load discovery context.');
  }

  const issue = await jiraService.getIssue(issueId || issueKey);
  const existingIntents = await repository.getChangeIntentsByJiraIssueId(issue.id);

  let config = null;
  try {
    config = await configService.getValidatedConfig();
  } catch {
    config = null;
  }

  let graphContext: any = null;
  if (config?.siteRegistryPageId) {
    try {
      graphContext = await teamworkGraphService.discoverGraphContext(config.siteRegistryPageId);
    } catch {
      graphContext = null;
    }
  }

  return {
    issue: {
      id: issue.id,
      key: issue.key,
      summary: issue.fields?.summary || (issue as any).summary || '',
      description: issue.fields?.description || (issue as any).description || '',
      status: issue.fields?.status?.name || (issue as any).status?.name || '',
    },
    changeIntents: existingIntents,
    siteRegistryPageId: config?.siteRegistryPageId || null,
    defaultFollowupProjectKey: config?.defaultFollowupProjectKey || '',
    isConfigured: Boolean(config?.siteRegistryPageId),
    graphContext,
  };
}

/**
 * Runs the live discovery pipeline:
 * Jira Ticket Content -> Teamwork Graph (Curated Queries) -> Confluence Content -> LLM Analysis -> Change Intents.
 */
export async function handleRunDiscovery(
  payload: any,
  context: any
): Promise<{ candidates: ChangeIntent[]; message: string }> {
  const issueId = payload?.issueId || context?.extension?.issue?.id;
  if (!isNonEmptyString(issueId)) {
    throw new ValidationError('Valid Jira Issue ID is required to run discovery.');
  }

  const user = await authService.getCurrentUser();
  const issue = await jiraService.getIssue(issueId);

  // 1. Retrieve validated enterprise configuration
  const config = await configService.getValidatedConfig();
  const siteRegistryPageId = config.siteRegistryPageId;

  // 2. Query Teamwork Graph for linked engineering pages and owners
  const graphContext = await teamworkGraphService.discoverGraphContext(siteRegistryPageId);
  const linkedPages = graphContext.linked_pages;

  if (!linkedPages || linkedPages.length === 0) {
    return {
      candidates: [],
      message: 'Graph returned nothing. That is not the same as no relationship.',
    };
  }

  const preloadedPages = linkedPages.map((p) => ({
    id: p.page_id,
    title: p.title || p.page_id,
  }));

  const summary = issue.fields?.summary || (issue as any).summary || '';
  const description = issue.fields?.description || (issue as any).description || '';

  const pipelineResult = await executeBoundedPipeline(issue.id, preloadedPages);

  if (pipelineResult.status === 'COMPLETED' && pipelineResult.changeIntentId) {
    const candidate = await repository.getChangeIntentById(pipelineResult.changeIntentId);

    await repository.insertAuditLog({
      action_type: ActionType.DISCOVERY_RUN,
      entity_type: 'jira_issue',
      entity_id: issue.id,
      actor_account_id: user.accountId,
      detail: { candidatesDiscovered: candidate ? 1 : 0 },
    });

    return {
      candidates: candidate ? [candidate] : [],
      message: 'Discovery complete. Identified 1 candidate relationship.',
    };
  }

  await repository.insertAuditLog({
    action_type: ActionType.DISCOVERY_RUN,
    entity_type: 'jira_issue',
    entity_id: issue.id,
    actor_account_id: user.accountId,
    detail: { candidatesDiscovered: 0, reason: pipelineResult.reason },
  });

  return {
    candidates: [],
    message: pipelineResult.reason || 'No candidate relationship identified.',
  };
}

/**
 * Retrieves a single change intent by ID.
 */
export async function handleGetChangeIntent(payload: any): Promise<ChangeIntent> {
  const { id } = payload || {};
  if (!isNonEmptyString(id)) {
    throw new ValidationError('Change intent ID is required.');
  }
  const intent = await repository.getChangeIntentById(id);
  if (!intent) {
    throw new NotFoundError('ChangeIntent', id);
  }
  return intent;
}
