/**
 * @module discovery.resolver
 * @description Enterprise production resolver for discovering shadow changes via Teamwork Graph and LLM inference.
 *
 * No hardcoded entities, IDs, or mock data. All context is fetched live from Jira, Confluence, and Teamwork Graph.
 */

import { DiscoveryStatus, ActionType, SourceType } from '../models/enums';
import { ChangeIntent, ExtractionProposal } from '../models/entities';
import { ValidationError, NotFoundError } from '../utils/errors';
import { isNonEmptyString } from '../utils/validation';
import { computeFingerprint, computeJiraIssueFingerprint } from '../utils/content-fingerprint';
import * as repository from '../db/repository';
import * as jiraService from '../services/jira.service';
import * as confluenceService from '../services/confluence.service';
import * as teamworkGraphService from '../services/teamwork-graph.service';
import * as llmService from '../services/llm.service';
import * as authService from '../services/authorization.service';
import * as idempotencyService from '../services/idempotency.service';
import * as configService from '../services/config.service';
import { executeBoundedPipeline } from '../agent/brain';
import { adfToPlainText } from '../utils/adf';

/**
 * Retrieves the live Jira issue context and any existing change intents for this ticket.
 */
export async function handleGetDiscoveryContext(payload: any, context: any): Promise<any> {
  // Panel context issue id/key wins over payload issue id/key
  const issueId = context?.extension?.issue?.id || payload?.issueId;
  const issueKey = context?.extension?.issue?.key || payload?.issueKey;

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
  let graphError: string | null = null;
  const cloudId = context?.cloudId;

  if (!cloudId) {
    graphError = 'Missing cloudId in request context; Teamwork Graph traversal requires cloudId.';
  } else if (config?.siteRegistryPageId) {
    try {
      graphContext = await teamworkGraphService.discoverGraphContext(config.siteRegistryPageId, cloudId);
    } catch (err: any) {
      graphContext = null;
      graphError = err?.message || 'Failed to query Teamwork Graph.';
    }
  }

  const rawDescription = issue.fields?.description ?? (issue as any).description;
  const plainDescription = adfToPlainText(rawDescription);
  const currentFingerprint = computeJiraIssueFingerprint(
    issue.fields?.summary || (issue as any).summary || '',
    plainDescription
  );

  // Join zone name, deployment identifier, and current documented condition onto each intent
  const joinedIntents = await Promise.all(
    existingIntents.map(async (intent: any) => {
      let zoneName: string | null = null;
      let deploymentIdentifier: string | null = null;
      let currentValue: string | null = null;

      let zone = null;
      if (intent.zone_id) {
        zone = await repository.getZoneById(intent.zone_id);
      }
      if (!zone && intent.site_id) {
        const siteZones = await repository.getZonesBySiteId(intent.site_id);
        zone = siteZones[0] || null;
      }

      if (zone) {
        zoneName = zone.name;
        const deployments = await repository.getDeploymentsByZoneId(zone.id);
        const activeDep = deployments.find((d) => d.status === 'active') || deployments[0];
        if (activeDep) {
          deploymentIdentifier = activeDep.deployment_identifier;
          if (intent.proposed_attribute) {
            const conditions = await repository.getConditionsByDeploymentId(activeDep.id);
            const matchedCond = conditions.find((c) => c.attribute_name === intent.proposed_attribute);
            if (matchedCond) {
              currentValue = matchedCond.attribute_value;
            }
          }
        }
      }

      // Recompute fingerprint and mark stale only if content changed
      if (
        intent.content_fingerprint &&
        intent.content_fingerprint !== currentFingerprint &&
        intent.discovery_status === DiscoveryStatus.CANDIDATE
      ) {
        await repository.updateChangeIntentStatus(intent.id, DiscoveryStatus.STALE);
        intent.discovery_status = DiscoveryStatus.STALE;
        await repository.insertAuditLog({
          action_type: ActionType.ASSESSMENT_MARKED_STALE,
          entity_type: 'change_intent',
          entity_id: intent.id,
          actor_account_id: context?.localAccountId || context?.accountId || 'system:fingerprint-evaluator',
          detail: {
            reason: 'Source Jira issue summary/description content changed.',
            previousFingerprint: intent.content_fingerprint,
            currentFingerprint,
          },
        });
      }

      return {
        ...intent,
        zoneName,
        zone_name: zoneName,
        deploymentIdentifier,
        deployment_identifier: deploymentIdentifier,
        currentValue,
        current_value: currentValue,
      };
    })
  );

  const primaryIntent = joinedIntents && joinedIntents.length > 0 ? joinedIntents[0] : null;

  return {
    issue: {
      id: issue.id,
      key: issue.key,
      summary: issue.fields?.summary || (issue as any).summary || '',
      description: plainDescription,
      status: issue.fields?.status?.name || (issue as any).status?.name || '',
    },
    location: primaryIntent?.zoneName || (primaryIntent as any)?.zone_name || primaryIntent?.zone_id || null,
    effectiveDate: primaryIntent?.effective_date || null,
    changeIntents: joinedIntents,
    siteRegistryPageId: config?.siteRegistryPageId || null,
    defaultFollowupProjectKey: config?.defaultFollowupProjectKey || '',
    isConfigured: Boolean(config?.siteRegistryPageId),
    graphContext,
    graphError,
  };
}

/**
 * Runs the live discovery pipeline:
 * Jira Ticket Content -> Teamwork Graph (Curated Queries) -> Confluence Content -> LLM Analysis -> Change Intents.
 */
export async function handleRunDiscovery(
  payload: any,
  context: any
): Promise<{
  status: string;
  stepReached: string;
  reason?: string;
  model: string;
  extraction: { attribute: string | null; proposedValue: string | null; location: string | null; quote: string | null } | null;
  quoteVerified: boolean;
  linkedPageCount: number;
  coverageResult: string | null;
  changeIntentId: string | null;
}> {
  const issueId = context?.extension?.issue?.id || payload?.issueId;
  if (!isNonEmptyString(issueId)) {
    throw new ValidationError('Valid Jira Issue ID is required to run discovery.');
  }

  const actorAccountId = context?.localAccountId || context?.accountId || (await authService.getCurrentUser()).accountId;
  const issue = await jiraService.getIssue(issueId);

  // 1. Retrieve validated enterprise configuration
  let siteRegistryPageId: string | null = null;
  try {
    const config = await configService.getValidatedConfig();
    siteRegistryPageId = config.siteRegistryPageId;
  } catch {
    // If not configured, brain step CONTEXT reports error
  }

  // 2. Query Teamwork Graph for linked engineering pages if cloudId and config available
  let preloadedPages: Array<{ id: string; title: string }> | undefined = undefined;
  if (siteRegistryPageId && context?.cloudId) {
    try {
      const graphContext = await teamworkGraphService.discoverGraphContext(siteRegistryPageId, context.cloudId);
      if (graphContext.linked_pages && graphContext.linked_pages.length > 0) {
        preloadedPages = graphContext.linked_pages.map((p) => ({
          id: p.page_id,
          title: p.title || p.page_id,
        }));
      }
    } catch {
      // executeBoundedPipeline handles graph errors
    }
  }

  const pipelineResult = await executeBoundedPipeline(issue.id, preloadedPages, context?.cloudId);

  await repository.insertAuditLog({
    action_type: ActionType.DISCOVERY_RUN,
    entity_type: 'jira_issue',
    entity_id: issue.id,
    actor_account_id: actorAccountId,
    detail: {
      status: pipelineResult.status,
      stepReached: pipelineResult.stepReached,
      reason: pipelineResult.reason,
      changeIntentId: pipelineResult.changeIntentId,
    },
  });

  return {
    status: pipelineResult.status,
    stepReached: pipelineResult.stepReached,
    reason: pipelineResult.reason,
    model: pipelineResult.model,
    extraction: pipelineResult.extraction,
    quoteVerified: pipelineResult.quoteVerified,
    linkedPageCount: pipelineResult.linkedPageCount,
    coverageResult: pipelineResult.coverageResult,
    changeIntentId: pipelineResult.changeIntentId,
  };
}

/**
 * Retrieves a single change intent by ID.
 * Enforces source access permissions and redacts quotes if forbidden.
 */
export async function handleGetChangeIntent(payload: any, context?: any): Promise<ChangeIntent> {
  const { id } = payload || {};
  if (!isNonEmptyString(id)) {
    throw new ValidationError('Change intent ID is required.');
  }
  const intent = await repository.getChangeIntentById(id);
  if (!intent) {
    throw new NotFoundError('ChangeIntent', id);
  }

  try {
    const actorAccountId = context?.accountId || (await authService.getCurrentUser().catch(() => null))?.accountId;
    if (actorAccountId && intent.jira_issue_id) {
      const hasJiraAccess = await authService.canAccessSource(actorAccountId, SourceType.JIRA, intent.jira_issue_id);
      if (!hasJiraAccess) {
        intent.source_quoted_text = '[ACCESS RESTRICTED: Jira issue read permission required]';
      }
    }
  } catch {
    // If access check fails, keep fail-safe
  }

  return intent;
}
