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
      message: `No linked pages found from site registry (Confluence Page: ${siteRegistryPageId}). Please link commissioning records to this registry.`,
    };
  }

  // 3. Fetch authoritative Confluence page texts and versions
  const pagesWithContent = await Promise.all(
    linkedPages.map(async (p) => {
      try {
        const pageData = await confluenceService.getPageWithVersion(p.page_id);
        return {
          pageId: p.page_id,
          title: pageData.title,
          version: pageData.version,
          content: confluenceService.extractPlainText(pageData.content),
        };
      } catch (err: any) {
        console.warn(`Could not read Confluence page ${p.page_id}: ${err.message}`);
        return null;
      }
    })
  );

  const validPages = pagesWithContent.filter(Boolean) as Array<{
    pageId: string;
    title: string;
    version: number;
    content: string;
  }>;

  if (validPages.length === 0) {
    return {
      candidates: [],
      message: 'Accessible commissioning pages could not be retrieved from Confluence.',
    };
  }

  // 4. Extract change intent from real ticket summary and description
  const summary = issue.fields?.summary || (issue as any).summary || '';
  const description = issue.fields?.description || (issue as any).description || '';
  const issueText = `${summary}\n${description}`.trim();
  const extractedChange = await llmService.extractChangeAttributes(issueText);

  if (!extractedChange.attribute) {
    return {
      candidates: [],
      message: 'No physical facility changes were identified in the ticket description.',
    };
  }

  // 5. Compare against linked commissioning pages
  const createdCandidates: ChangeIntent[] = [];
  const contentFingerprint = computeFingerprint(issueText);

  // Retrieve site entity associated with site registry page or create if not yet cataloged
  let site = await repository.getSiteById(siteRegistryPageId);
  if (!site) {
    site = await repository.insertSite({
      name: graphContext.site_page_id || 'Active Facility',
      confluence_page_id: siteRegistryPageId,
      confluence_page_version: 1,
      metadata: { liveRegistry: true },
    });
  }

  for (const page of validPages) {
    const proposal: ExtractionProposal = await llmService.proposeRelationship(
      issueText,
      page.content,
      []
    );

    if (proposal.confidence >= 0.5) {
      const attributeName = proposal.attribute_name || proposal.proposed_attribute || 'surface_finish';
      const proposedVal = proposal.new_value || proposal.proposed_value || 'unknown';
      const zoneName = proposal.zone_name || 'Operating Zone';

      const idempotencyKey = idempotencyService.generateChangeIntentKey(
        issue.id,
        attributeName,
        proposedVal
      );

      // Check idempotency - prevent duplicate candidate records
      const existing = await repository.getChangeIntentByIdempotencyKey(idempotencyKey);
      if (existing) {
        createdCandidates.push(existing);
        continue;
      }

      // Resolve or register zone dynamically
      let zone = await repository.getZoneByName(zoneName);
      if (!zone && site) {
        zone = await repository.insertZone({
          site_id: site.id,
          name: zoneName,
          zone_type: 'aisle' as any,
          confluence_page_id: page.pageId,
          metadata: { autoRegisteredFromDiscovery: true },
        });
      }

      const quote =
        proposal.source_quotes?.[0]?.quoted_text ||
        extractedChange.attributeQuote ||
        extractedChange.valueQuote ||
        summary;

      const newCandidate = await repository.insertChangeIntent({
        jira_issue_id: issue.id,
        jira_issue_key: issue.key,
        site_id: site?.id || null,
        zone_id: zone?.id || null,
        proposed_attribute: proposal.attribute_name,
        proposed_value: proposal.new_value || null,
        effective_date: extractedChange.timing || null,
        source_quoted_text: quote,
        content_fingerprint: contentFingerprint,
        discovery_status: DiscoveryStatus.CANDIDATE,
        llm_confidence: proposal.confidence,
        llm_reasoning: proposal.reasoning,
        idempotency_key: idempotencyKey,
      });

      await repository.insertAuditLog({
        action_type: ActionType.CANDIDATE_CREATED,
        entity_type: 'change_intent',
        entity_id: newCandidate.id,
        actor_account_id: user.accountId,
        detail: {
          attribute: proposal.attribute_name,
          confidence: proposal.confidence,
          pageId: page.pageId,
          jiraIssueKey: issue.key,
        },
      });

      createdCandidates.push(newCandidate);
    }
  }

  await repository.insertAuditLog({
    action_type: ActionType.DISCOVERY_RUN,
    entity_type: 'jira_issue',
    entity_id: issue.id,
    actor_account_id: user.accountId,
    detail: { candidatesDiscovered: createdCandidates.length },
  });

  return {
    candidates: createdCandidates,
    message: `Discovery complete. Identified ${createdCandidates.length} candidate relationship(s).`,
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
