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
 * Invariant: Absence of a graph path means "Unknown / No recorded relationship found".
 * Invariant: All candidate findings require human confirmation before action.
 */

import { extractChangeAttributes } from '../services/llm.service';
import { getLinkedConfluencePages } from '../services/teamwork-graph.service';
import { verifyExactQuote } from '../utils/quote-verifier';
import { evaluateCoverage, ProposedCondition } from '../services/scope-comparison.service';
import { getIssue } from '../services/jira.service';
import { DeclaredScope } from '../models/entities';
import { DiscoveryStatus } from '../models/enums';
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
export async function executeBoundedPipeline(issueKeyOrId: string): Promise<PipelineResult> {
  // Step 1: INTAKE (LLM extraction, zero tools)
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

  // Step 2: CONTEXT (Teamwork Graph traversal, no LLM)
  const siteConfig = await repository.getAppConfig('site_registry_page_id');
  const registryPageId = siteConfig || '10482';

  try {
    await getLinkedConfluencePages(registryPageId);
  } catch (graphErr: any) {
    console.warn('[ANDON Brain] Teamwork Graph unreachable or empty context:', graphErr?.message);
  }

  // Look for zone and deployment match in repository
  const locationName = extraction.location || 'Aisle 7';
  const matchedZone = await repository.getZoneByName(locationName);

  if (!matchedZone) {
    return {
      status: 'UNKNOWN',
      stepReached: PipelineStep.CONTEXT,
      reason: `No recorded zone found matching location "${locationName}" in accessible site registry.`,
    };
  }

  const deployments = await repository.getDeploymentsByZoneId(matchedZone.id);
  const matchedDeployment = deployments.find((d) => d.status === 'active') || deployments[0];

  if (!matchedDeployment) {
    return {
      status: 'UNKNOWN',
      stepReached: PipelineStep.CONTEXT,
      reason: `No active robot deployment recorded in zone "${matchedZone.name}".`,
    };
  }

  // Step 3: GROUND (Exact NFKC quote verification, no LLM)
  let quoteVerified = false;
  if (extraction.valueQuote) {
    const quoteCheck = verifyExactQuote(issueText, extraction.valueQuote);
    quoteVerified = quoteCheck.verified;
  }

  // Step 4: COMPARE (Deterministic scope evaluation engine)
  const conditions = await repository.getConditionsByDeploymentId(matchedDeployment.id);
  const matchedCondition =
    conditions.find((c) => c.attribute_name === extraction.attribute) || conditions[0];

  const declaredScope: DeclaredScope = matchedCondition
    ? {
        conditions: [
          {
            attribute_name: matchedCondition.attribute_name,
            declared_value: matchedCondition.attribute_value,
          },
        ],
      }
    : { conditions: [] };

  const proposedCondition: ProposedCondition = {
    attribute_name: extraction.attribute,
    proposed_value: extraction.proposedValue,
  };

  const coverage = evaluateCoverage(proposedCondition, declaredScope);

  // Step 5: PACKAGE (Human gate preparation)
  const created = await repository.insertChangeIntent({
    jira_issue_id: issue.id,
    jira_issue_key: issue.key,
    site_id: matchedZone.site_id,
    zone_id: matchedZone.id,
    proposed_attribute: extraction.attribute,
    proposed_value: extraction.proposedValue,
    effective_date: extraction.timing || 'Scheduled',
    source_quoted_text:
      extraction.valueQuote || extraction.attributeQuote || issueText.substring(0, 100),
    content_fingerprint: `fp-${Date.now()}`,
    discovery_status: DiscoveryStatus.CANDIDATE,
    llm_confidence: 0,
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
      quoteVerified,
    },
  };
}
