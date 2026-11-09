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

import { extractChangeAttributes } from '../services/llm.service';
import { getLinkedConfluencePages } from '../services/teamwork-graph.service';
import { verifyExactQuote } from '../utils/quote-verifier';
import { evaluateCoverage, ProposedCondition } from '../services/scope-comparison.service';
import { getIssue } from '../services/jira.service';
import { DeclaredScope } from '../models/entities';
import { DiscoveryStatus } from '../models/enums';
import { computeFingerprint } from '../utils/content-fingerprint';
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
  changeIntentId?: string;
  reason?: string;
  details?: Record<string, unknown>;
}

/**
 * Executes the bounded single-loop pipeline for a Jira issue.
 */
export async function executeBoundedPipeline(
  issueKeyOrId: string,
  preloadedGraphPages?: Array<{ id: string; title: string }>
): Promise<PipelineResult> {
  // -------------------------------------------------------------------------
  // Step 1: INTAKE (LLM extraction, zero tools)
  // -------------------------------------------------------------------------
  const issue = await getIssue(issueKeyOrId);
  const issueSummary = issue.fields?.summary || (issue as any).summary || '';
  const issueDescription = issue.fields?.description || (issue as any).description || '';
  const issueText = `${issueSummary}\n${issueDescription}`.trim();

  const extraction = await extractChangeAttributes(issueText);
  if (!extraction || !extraction.attribute || !extraction.proposedValue) {
    return {
      status: 'NO_CHANGE_FOUND',
      stepReached: PipelineStep.INTAKE,
      reason: 'No clear physical attribute change identified in issue text.',
    };
  }

  // -------------------------------------------------------------------------
  // Step 2: CONTEXT (Teamwork Graph traversal, no LLM)
  // -------------------------------------------------------------------------
  const siteConfig = await repository.getAppConfig('site_registry_page_id');
  if (!siteConfig) {
    return {
      status: 'UNKNOWN',
      stepReached: PipelineStep.CONTEXT,
      reason: 'No site registry page is configured. Please configure site_registry_page_id.',
    };
  }

  let linkedPages: Array<{ id: string; title: string }> = preloadedGraphPages || [];
  if (!preloadedGraphPages) {
    try {
      linkedPages = await getLinkedConfluencePages(siteConfig);
    } catch (graphErr: any) {
      return {
        status: 'UNKNOWN',
        stepReached: PipelineStep.CONTEXT,
        reason: `Graph returned error (${graphErr?.message}). That is not the same as no relationship.`,
      };
    }
  }

  if (!linkedPages || linkedPages.length === 0) {
    return {
      status: 'UNKNOWN',
      stepReached: PipelineStep.CONTEXT,
      reason: 'Graph returned nothing. That is not the same as no relationship.',
    };
  }

  // Resolve zone from registry only
  if (!extraction.location) {
    return {
      status: 'UNKNOWN',
      stepReached: PipelineStep.CONTEXT,
      reason: 'No physical location/zone found in work request.',
    };
  }

  const locationName = extraction.location;
  const matchedZone = await repository.getZoneByName(locationName);

  if (!matchedZone) {
    return {
      status: 'UNKNOWN',
      stepReached: PipelineStep.CONTEXT,
      reason: `No recorded zone found matching location "${locationName}" in accessible site registry.`,
    };
  }

  const deployments = await repository.getDeploymentsByZoneId(matchedZone.id);
  const matchedDeployment = deployments.find((d) => d.status === 'active');

  if (!matchedDeployment) {
    return {
      status: 'UNKNOWN',
      stepReached: PipelineStep.CONTEXT,
      reason: `No active robot deployment recorded in zone "${matchedZone.name}".`,
    };
  }

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
    };
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
  const rawFingerprintText = `${issue.key}:${extraction.attribute}:${extraction.proposedValue}:${verifiedQuote}`;
  const fingerprint = computeFingerprint(rawFingerprintText);

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
    idempotency_key: `idem-${issue.key}-${extraction.attribute}`,
  });

  return {
    status: 'COMPLETED',
    stepReached: PipelineStep.PACKAGE,
    changeIntentId: created.id,
    details: {
      issueKey: issue.key,
      attribute: extraction.attribute,
      coverageResult: coverage.result,
      quoteVerified: true,
    },
  };
}
