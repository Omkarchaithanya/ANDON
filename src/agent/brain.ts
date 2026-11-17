/**
 * @module brain
 * @description Bounded Single-Loop Architecture for ANDON:
 *   INTAKE (LLM, no tools)
 *   → CONTEXT (Teamwork Graph, no LLM)
 *   → GROUND (Exact NFKC Quote Verification, no LLM)
 *   → COMPARE (Deterministic Scope Comparison Engine)
 *   → PACKAGE (Human Qualified Reviewer Gate)
 *
 * Invariant: The LLM only proposes during INTAKE; it possesses zero mutation tools.
 * Invariant: Absence of a graph path means "Unknown: Graph returned nothing. That is not the same as no relationship."
 * Invariant: Registry rows come ONLY from configured Confluence site registry. No model auto-creation.
 * Invariant: Quotes must be exact NFKC substrings; unverified quotes drop the claim.
 */

import { extractChangeAttributes, resolveActiveModel } from '../services/llm.service';
import { getLinkedConfluencePages } from '../services/teamwork-graph.service';
import { getPageWithVersion, extractPlainText } from '../services/confluence.service';
import { verifyExactQuote } from '../utils/quote-verifier';
import { evaluateCoverage, ProposedCondition } from '../services/scope-comparison.service';
import { getIssue } from '../services/jira.service';
import { DeclaredScope } from '../models/entities';
import { DiscoveryStatus } from '../models/enums';
import { computeFingerprint, computeJiraIssueFingerprint } from '../utils/content-fingerprint';
import { adfToPlainText } from '../utils/adf';
import { CONFIG_KEYS } from '../services/config.service';
import * as idempotencyService from '../services/idempotency.service';
import * as repository from '../db/repository';

export enum PipelineStep {
  INTAKE = 'INTAKE',
  CONTEXT = 'CONTEXT',
  GROUND = 'GROUND',
  COMPARE = 'COMPARE',
  PACKAGE = 'PACKAGE',
}

export interface PipelineResult {
  status: 'COMPLETED' | 'UNKNOWN' | 'NO_CHANGE_FOUND';
  stepReached: PipelineStep;
  reason?: string;
  model: string;
  extraction: {
    attribute: string | null;
    proposedValue: string | null;
    location: string | null;
    quote: string | null;
  } | null;
  quoteVerified: boolean;
  linkedPageCount: number;
  coverageResult: string | null;
  changeIntentId: string | null;
  details?: Record<string, unknown>;
}

/**
 * Executes the bounded single-loop pipeline for a Jira issue.
 */
export async function executeBoundedPipeline(
  issueKeyOrId: string,
  preloadedGraphPages?: Array<{ id: string; title: string }>,
  cloudId?: string
): Promise<PipelineResult> {
  // -------------------------------------------------------------------------
  // Step 1: INTAKE (LLM extraction, zero tools)
  // -------------------------------------------------------------------------
  const model = await resolveActiveModel();

  const issue = await getIssue(issueKeyOrId);
  const issueSummary = issue.fields?.summary || (issue as any).summary || '';
  const rawDescription = issue.fields?.description ?? (issue as any).description;
  const plainDescription = adfToPlainText(rawDescription);
  const issueText = plainDescription ? `${issueSummary}\n${plainDescription}`.trim() : issueSummary.trim();

  let extraction;
  try {
    extraction = await extractChangeAttributes(issueText);
  } catch (err: any) {
    return {
      status: 'UNKNOWN',
      stepReached: PipelineStep.INTAKE,
      reason: `LLM extraction failed: ${err?.message || 'unknown error'}`,
      model,
      extraction: null,
      quoteVerified: false,
      linkedPageCount: 0,
      coverageResult: null,
      changeIntentId: null,
    };
  }

  if (!extraction || !extraction.attribute || !extraction.proposedValue) {
    return {
      status: 'NO_CHANGE_FOUND',
      stepReached: PipelineStep.INTAKE,
      reason: 'No clear physical attribute change identified in issue text.',
      model,
      extraction: extraction
        ? {
            attribute: extraction.attribute || null,
            proposedValue: extraction.proposedValue || null,
            location: extraction.location || null,
            quote: extraction.valueQuote || extraction.attributeQuote || null,
          }
        : null,
      quoteVerified: false,
      linkedPageCount: 0,
      coverageResult: null,
      changeIntentId: null,
    };
  }

  const extractionResult = {
    attribute: extraction.attribute,
    proposedValue: extraction.proposedValue,
    location: extraction.location || null,
    quote: extraction.valueQuote || extraction.attributeQuote || null,
  };

  // -------------------------------------------------------------------------
  // Step 2: CONTEXT (Teamwork Graph traversal & Page Body fetch, no LLM)
  // -------------------------------------------------------------------------
  const siteRegistryKey = CONFIG_KEYS?.SITE_REGISTRY_PAGE_ID || 'SITE_REGISTRY_PAGE_ID';
  const siteConfig =
    (await repository.getAppConfig(siteRegistryKey)) ||
    (await repository.getAppConfig('site_registry_page_id'));
  if (!siteConfig) {
    return {
      status: 'UNKNOWN',
      stepReached: PipelineStep.CONTEXT,
      reason: 'No site registry page is configured. Please configure SITE_REGISTRY_PAGE_ID.',
      model,
      extraction: extractionResult,
      quoteVerified: false,
      linkedPageCount: 0,
      coverageResult: null,
      changeIntentId: null,
    };
  }

  // Fetch actual site registry page body
  let registryPageText = '';
  try {
    const regPage = await getPageWithVersion(siteConfig);
    registryPageText = regPage.content || '';
  } catch (regErr: any) {
    return {
      status: 'UNKNOWN',
      stepReached: PipelineStep.CONTEXT,
      reason: `Could not retrieve site registry page (${siteConfig}): ${regErr?.message}`,
      model,
      extraction: extractionResult,
      quoteVerified: false,
      linkedPageCount: 0,
      coverageResult: null,
      changeIntentId: null,
    };
  }

  let linkedPages: Array<{ id: string; title: string }> = preloadedGraphPages || [];
  if (!preloadedGraphPages) {
    try {
      linkedPages = await getLinkedConfluencePages(siteConfig, cloudId);
    } catch (graphErr: any) {
      return {
        status: 'UNKNOWN',
        stepReached: PipelineStep.CONTEXT,
        reason: `Graph returned error (${graphErr?.message}). That is not the same as no relationship.`,
        model,
        extraction: extractionResult,
        quoteVerified: false,
        linkedPageCount: 0,
        coverageResult: null,
        changeIntentId: null,
      };
    }
  }

  if (!linkedPages || linkedPages.length === 0) {
    return {
      status: 'UNKNOWN',
      stepReached: PipelineStep.CONTEXT,
      reason: 'Graph returned nothing. That is not the same as no relationship.',
      model,
      extraction: extractionResult,
      quoteVerified: false,
      linkedPageCount: 0,
      coverageResult: null,
      changeIntentId: null,
    };
  }

  // Resolve zone from registry only
  if (!extraction.location) {
    return {
      status: 'UNKNOWN',
      stepReached: PipelineStep.CONTEXT,
      reason: 'No physical location/zone found in work request.',
      model,
      extraction: extractionResult,
      quoteVerified: false,
      linkedPageCount: linkedPages.length,
      coverageResult: null,
      changeIntentId: null,
    };
  }

  const locationName = extraction.location.trim();
  const locationInRegistry = registryPageText.toLowerCase().includes(locationName.toLowerCase());
  const matchedZone = await repository.getZoneByName(locationName);

  if (!matchedZone && !locationInRegistry) {
    return {
      status: 'UNKNOWN',
      stepReached: PipelineStep.CONTEXT,
      reason: `Location "${locationName}" is neither registered nor present in Confluence site registry (Page ${siteConfig}).`,
      model,
      extraction: extractionResult,
      quoteVerified: false,
      linkedPageCount: linkedPages.length,
      coverageResult: null,
      changeIntentId: null,
    };
  }

  if (!matchedZone) {
    return {
      status: 'UNKNOWN',
      stepReached: PipelineStep.CONTEXT,
      reason: `Location "${locationName}" found on registry page but lacks formal database deployment mapping.`,
      model,
      extraction: extractionResult,
      quoteVerified: false,
      linkedPageCount: linkedPages.length,
      coverageResult: null,
      changeIntentId: null,
    };
  }

  const deployments = await repository.getDeploymentsByZoneId(matchedZone.id);
  const matchedDeployment = deployments.find((d) => d.status === 'active');

  if (!matchedDeployment) {
    return {
      status: 'UNKNOWN',
      stepReached: PipelineStep.CONTEXT,
      reason: `No active robot deployment recorded in zone "${matchedZone.name}".`,
      model,
      extraction: extractionResult,
      quoteVerified: false,
      linkedPageCount: linkedPages.length,
      coverageResult: null,
      changeIntentId: null,
    };
  }

  // Fetch actual bodies for linked pages in parallel to verify commissioning quotes (C19 & C18)
  const pageFetchResults = await Promise.allSettled(
    linkedPages.map((lp) => getPageWithVersion(lp.id))
  );
  const linkedPageMap = new Map<string, string>();
  pageFetchResults.forEach((res, idx) => {
    if (res.status === 'fulfilled' && res.value?.content) {
      linkedPageMap.set(linkedPages[idx].id, res.value.content);
    }
  });

  // -------------------------------------------------------------------------
  // Step 3: GROUND (Exact NFKC quote verification, no LLM)
  // -------------------------------------------------------------------------
  let verifiedQuote: string | null = null;
  if (extraction.valueQuote) {
    const check = verifyExactQuote(issueText, extraction.valueQuote);
    if (check.verified) {
      verifiedQuote = extraction.valueQuote;
    }
  }
  if (!verifiedQuote && extraction.attributeQuote) {
    const check = verifyExactQuote(issueText, extraction.attributeQuote);
    if (check.verified) {
      verifiedQuote = extraction.attributeQuote;
    }
  }

  if (!verifiedQuote) {
    return {
      status: 'UNKNOWN',
      stepReached: PipelineStep.GROUND,
      reason: 'Candidate quote could not be verified as an exact NFKC substring of source text. Claim dropped.',
      model,
      extraction: extractionResult,
      quoteVerified: false,
      linkedPageCount: linkedPages.length,
      coverageResult: null,
      changeIntentId: null,
    };
  }

  // -------------------------------------------------------------------------
  // Step 4: COMPARE (Deterministic scope evaluation engine)
  // -------------------------------------------------------------------------
  const conditions = await repository.getConditionsByDeploymentId(matchedDeployment.id);
  const matchedCondition = conditions.find((c) => c.attribute_name === extraction.attribute);

  if (!matchedCondition) {
    return {
      status: 'UNKNOWN',
      stepReached: PipelineStep.COMPARE,
      reason: `Attribute "${extraction.attribute}" is not in declared baseline scope of deployment ${matchedDeployment.deployment_identifier}.`,
      model,
      extraction: extractionResult,
      quoteVerified: true,
      linkedPageCount: linkedPages.length,
      coverageResult: null,
      changeIntentId: null,
    };
  }

  // C18: Ground commissioning quote against live Confluence baseline page content
  if (matchedCondition.source_confluence_page_id && matchedCondition.source_quoted_text) {
    const baselineText = linkedPageMap.get(matchedCondition.source_confluence_page_id);
    if (baselineText) {
      const baselineQuoteCheck = verifyExactQuote(baselineText, matchedCondition.source_quoted_text);
      if (!baselineQuoteCheck.verified) {
        return {
          status: 'UNKNOWN',
          stepReached: PipelineStep.GROUND,
          reason: `Baseline condition quote "${matchedCondition.source_quoted_text}" does not match Confluence page ${matchedCondition.source_confluence_page_id} content.`,
          model,
          extraction: extractionResult,
          quoteVerified: false,
          linkedPageCount: linkedPages.length,
          coverageResult: null,
          changeIntentId: null,
        };
      }
    }
  }

  const declaredScope: DeclaredScope = {
    conditions: [
      {
        attribute_name: matchedCondition.attribute_name,
        declared_value: matchedCondition.attribute_value,
      },
    ],
  };

  const proposedCondition: ProposedCondition = {
    attribute_name: extraction.attribute,
    proposed_value: extraction.proposedValue,
  };

  const coverage = evaluateCoverage(proposedCondition, declaredScope);

  // -------------------------------------------------------------------------
  // Step 5: PACKAGE (Human gate preparation, no write)
  // -------------------------------------------------------------------------
  const fingerprint = computeJiraIssueFingerprint(issueSummary, rawDescription);
  const idempotencyKey = idempotencyService.generateChangeIntentKey(
    issue.id,
    extraction.attribute,
    extraction.proposedValue
  );

  const existing = await repository.getChangeIntentByIdempotencyKey(idempotencyKey);
  if (existing && existing.content_fingerprint === fingerprint) {
    return {
      status: 'COMPLETED',
      stepReached: PipelineStep.PACKAGE,
      reason: 'Candidate relationship identified and confirmed against operating baseline.',
      model,
      extraction: extractionResult,
      quoteVerified: true,
      linkedPageCount: linkedPages.length,
      coverageResult: coverage.result,
      changeIntentId: existing.id,
      details: {
        issueKey: issue.key,
        attribute: extraction.attribute,
        coverageResult: coverage.result,
        quoteVerified: true,
        deduplicated: true,
      },
    };
  }

  const created = await repository.insertChangeIntent({
    jira_issue_id: issue.id,
    jira_issue_key: issue.key,
    site_id: matchedZone.site_id,
    zone_id: matchedZone.id,
    proposed_attribute: extraction.attribute,
    proposed_value: extraction.proposedValue,
    effective_date: extraction.timing || 'Scheduled',
    source_quoted_text: verifiedQuote,
    content_fingerprint: fingerprint,
    discovery_status: DiscoveryStatus.CANDIDATE,
    llm_reasoning: extraction.reasoning,
    idempotency_key: idempotencyKey,
  });

  return {
    status: 'COMPLETED',
    stepReached: PipelineStep.PACKAGE,
    reason: 'Candidate relationship identified and confirmed against operating baseline.',
    model,
    extraction: extractionResult,
    quoteVerified: true,
    linkedPageCount: linkedPages.length,
    coverageResult: coverage.result,
    changeIntentId: created.id,
    details: {
      issueKey: issue.key,
      attribute: extraction.attribute,
      coverageResult: coverage.result,
      quoteVerified: true,
    },
  };
}
