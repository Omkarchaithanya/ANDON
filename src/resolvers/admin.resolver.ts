/**
 * @module admin.resolver
 * @description Enterprise production resolver for configuration management, deployment registration, and audit logs.
 *
 * Replaces synthetic seed data with live enterprise registration endpoints.
 */

import { ActionType, DeploymentStatus, EvidenceStatus, EvidenceType, SourceType, ZoneType } from '../models/enums';
import { ValidationError } from '../utils/errors';
import { isNonEmptyString } from '../utils/validation';
import * as repository from '../db/repository';
import * as authService from '../services/authorization.service';
import * as configService from '../services/config.service';
import * as confluenceService from '../services/confluence.service';
import { verifyExactQuote } from '../utils/quote-verifier';

/**
 * Returns current enterprise application configuration.
 */
export async function handleGetAppConfig(payload: any, context: any): Promise<any> {
  const user = await authService.getCurrentUser();
  const siteRegistryPageId = await repository.getAppConfig('SITE_REGISTRY_PAGE_ID');
  const defaultFollowupProjectKey = await repository.getAppConfig('DEFAULT_FOLLOWUP_PROJECT_KEY');
  const environment = (await repository.getAppConfig('ENVIRONMENT')) || 'production';
  const reviewerPolicy = await authService.getReviewerPolicy();

  return {
    siteRegistryPageId: siteRegistryPageId || '',
    defaultFollowupProjectKey: defaultFollowupProjectKey || '',
    environment,
    reviewerPolicy,
    user,
  };
}

/**
 * Updates application configuration settings.
 */
export async function handleUpdateAppConfig(payload: any, context: any): Promise<any> {
  const user = await authService.getCurrentUser();
  const { siteRegistryPageId, defaultFollowupProjectKey, reviewerPolicy, environment } = payload || {};

  await configService.updateConfiguration({
    siteRegistryPageId,
    defaultFollowupProjectKey,
    environment,
    reviewerPolicyMode: reviewerPolicy?.mode,
    allowedReviewerAccountIds: reviewerPolicy?.allowed_account_ids,
  });

  await repository.insertAuditLog({
    action_type: ActionType.CONFIG_UPDATED,
    entity_type: 'app_config',
    entity_id: 'enterprise_settings',
    actor_account_id: user.accountId,
    detail: { siteRegistryPageId, defaultFollowupProjectKey, environment },
  });

  return { success: true, message: 'Configuration updated successfully.' };
}

/**
 * Reads registered zones and deployments from Forge SQL for the configured registry page.
 * Returns rows matching SiteRegistryView's expected shape:
 * { rows: [{ zoneName, zoneType, deploymentIdentifier, baselinePageId, baselineVersion, sensorRig }] }
 */
export async function handleGetSiteRegistry(payload: any, context: any): Promise<{ rows: any[] }> {
  const configuredPageId = (await repository.getAppConfig('SITE_REGISTRY_PAGE_ID')) || payload?.pageId;

  // Find site matching pageId or find all zones
  let zones: any[] = [];
  if (configuredPageId) {
    const site = await repository.getSiteByConfluencePageId(configuredPageId);
    if (site) {
      zones = await repository.getZonesBySiteId(site.id);
    }
  }

  if (zones.length === 0) {
    zones = await repository.getAllZones();
  }

  const rows: any[] = [];
  for (const zone of zones) {
    const deployments = await repository.getDeploymentsByZoneId(zone.id);
    if (deployments.length === 0) {
      rows.push({
        zoneName: zone.name,
        zoneType: zone.zone_type || 'General Zone',
        deploymentIdentifier: 'Unassigned',
        baselinePageId: zone.confluence_page_id || undefined,
        baselineVersion: 1,
        sensorRig: 'Standard',
        conditions: [],
      });
    } else {
      for (const dep of deployments) {
        const conditions = await repository.getConditionsByDeploymentId(dep.id);
        rows.push({
          zoneName: zone.name,
          zoneType: zone.zone_type || 'General Zone',
          deploymentIdentifier: dep.deployment_identifier,
          baselinePageId: dep.confluence_page_id || undefined,
          baselineVersion: dep.confluence_page_version || 1,
          sensorRig: (dep.metadata as any)?.sensorRig || 'Standard',
          conditions: conditions.map((c) => ({
            id: c.id,
            attributeName: c.attribute_name,
            attributeValue: c.attribute_value,
            quotedText: c.source_quoted_text,
            pageId: c.source_confluence_page_id,
          })),
        });
      }
    }
  }

  return { rows };
}

/**
 * Enterprise Onboarding Endpoint: Registers a real facility, deployment, operating conditions, and baseline evidence.
 */
export async function handleRegisterDeployment(payload: any, context: any): Promise<any> {
  const actorAccountId = context?.localAccountId || context?.accountId || (await authService.getCurrentUser()).accountId;
  const {
    siteName,
    zoneName,
    zoneType = 'aisle',
    deploymentIdentifier,
    ownerAccountId,
    confluenceCommissioningPageId,
    confluenceCommissioningVersion = 1,
    conditions = [],
    commissioningSummary = '',
  } = payload || {};

  if (!isNonEmptyString(siteName) || !isNonEmptyString(zoneName) || !isNonEmptyString(deploymentIdentifier)) {
    throw new ValidationError('siteName, zoneName, and deploymentIdentifier are required.');
  }

  // 1. If commissioning page is provided, fetch page and verify quotes verbatim (Item 5)
  if (confluenceCommissioningPageId) {
    const page = await confluenceService.getPageWithVersion(confluenceCommissioningPageId);
    if (!page || !page.content) {
      throw new ValidationError(`Could not retrieve Confluence commissioning page ${confluenceCommissioningPageId}.`);
    }

    if (commissioningSummary && commissioningSummary.trim()) {
      const summaryCheck = verifyExactQuote(page.content, commissioningSummary.trim());
      if (!summaryCheck.verified) {
        throw new ValidationError(
          `Commissioning summary quote is not an exact substring of Confluence page ${confluenceCommissioningPageId}.`
        );
      }
    }

    for (const cond of conditions) {
      if (!cond.quoted_text || !cond.quoted_text.trim()) {
        throw new ValidationError(
          `Condition "${cond.attribute_name || 'unnamed'}" must include quoted_text from Confluence page ${confluenceCommissioningPageId}.`
        );
      }
      const quoteCheck = verifyExactQuote(page.content, cond.quoted_text.trim());
      if (!quoteCheck.verified) {
        throw new ValidationError(
          `Condition quote "${cond.quoted_text}" is not an exact substring of Confluence page ${confluenceCommissioningPageId}.`
        );
      }
    }
  }

  // 2. Upsert Site (do not insert a second site with the same name)
  let site = await repository.getSiteByName(siteName.trim());
  if (!site && confluenceCommissioningPageId) {
    site = await repository.getSiteByConfluencePageId(confluenceCommissioningPageId);
  }
  if (!site) {
    site = await repository.insertSite({
      name: siteName.trim(),
      confluence_page_id: confluenceCommissioningPageId || null,
      confluence_page_version: confluenceCommissioningVersion,
      metadata: { registeredBy: actorAccountId },
    });
  }

  // 3. Upsert Zone
  let zone = await repository.getZoneByNameAndSiteId(zoneName.trim(), site.id);
  if (!zone) {
    zone = await repository.getZoneByName(zoneName.trim());
  }
  if (!zone) {
    zone = await repository.insertZone({
      site_id: site.id,
      name: zoneName.trim(),
      zone_type: zoneType as ZoneType,
      confluence_page_id: confluenceCommissioningPageId || null,
      metadata: { registeredBy: actorAccountId },
    });
  }

  // 4. Upsert Deployment
  let deployment = await repository.getDeploymentByIdentifier(deploymentIdentifier.trim());
  if (!deployment) {
    deployment = await repository.insertDeployment({
      zone_id: zone.id,
      deployment_identifier: deploymentIdentifier.trim(),
      confluence_page_id: confluenceCommissioningPageId || null,
      confluence_page_version: confluenceCommissioningVersion,
      owner_account_id: ownerAccountId || actorAccountId,
      status: DeploymentStatus.ACTIVE,
      metadata: { registeredBy: actorAccountId },
    });
  }

  // 5. Register Operating Conditions
  const registeredConditions = [];
  for (const cond of conditions) {
    if (cond.attribute_name && cond.attribute_value) {
      const conditionRecord = await repository.insertCondition({
        deployment_id: deployment.id,
        attribute_name: cond.attribute_name.trim(),
        attribute_value: cond.attribute_value.trim(),
        source_confluence_page_id: confluenceCommissioningPageId || null,
        source_page_version: confluenceCommissioningVersion,
        source_quoted_text: cond.quoted_text || commissioningSummary || null,
        schema_version: '1.0',
      });
      registeredConditions.push(conditionRecord);
    }
  }

  // 6. Register Evidence Revision
  const createdEvidence = await repository.insertEvidenceRevision({
    deployment_id: deployment.id,
    evidence_type: EvidenceType.COMMISSIONING,
    confluence_page_id: confluenceCommissioningPageId || null,
    confluence_page_version: confluenceCommissioningVersion,
    source_quoted_text: commissioningSummary || null,
    declared_scope: {
      conditions: conditions.map((c: any) => ({
        attribute_name: c.attribute_name,
        attribute_value: c.attribute_value,
      })),
      zone_id: zone.id,
    },
    approved_by: actorAccountId,
    approved_at: new Date().toISOString(),
    status: EvidenceStatus.CURRENT,
    metadata: { registeredAt: new Date().toISOString() },
  });

  if (confluenceCommissioningPageId) {
    await repository.upsertSourceVersion(
      SourceType.CONFLUENCE_PAGE,
      confluenceCommissioningPageId,
      String(confluenceCommissioningVersion)
    );
  }

  await repository.insertAuditLog({
    action_type: ActionType.CONFIG_UPDATED,
    entity_type: 'deployment',
    entity_id: deployment.id,
    actor_account_id: actorAccountId,
    detail: {
      deploymentIdentifier,
      zoneName,
      conditionsCount: registeredConditions.length,
    },
  });

  return {
    success: true,
    message: `Deployment "${deploymentIdentifier}" successfully registered into ANDON.`,
    deploymentId: deployment.id,
    evidenceId: createdEvidence.id,
  };
}

/**
 * Returns audit trail history for an entity, or review decisions ledger when called with no payload.
 * When called with no payload, returns { decisions: [...] } from review_decisions, newest first,
 * with issue key, zone, deployment, coverage, reviewer, and follow-up key.
 */
export async function handleGetAssessmentHistory(payload?: any, context?: any): Promise<any> {
  const { entityType, entityId } = payload || {};
  if (entityType && entityId) {
    return repository.getActionLogsByEntity(entityType, entityId);
  }

  const allDecisions = await repository.getAllReviewDecisions();

  const formattedDecisions = await Promise.all(
    allDecisions.map(async (dec) => {
      let issueKey: string | null = null;
      let zoneName: string | null = null;
      let deploymentIdentifier: string | null = null;

      if (dec.change_intent_id) {
        const intent = await repository.getChangeIntentById(dec.change_intent_id);
        if (intent) {
          issueKey = intent.jira_issue_key || null;
          if (intent.zone_id) {
            const z = await repository.getZoneById(intent.zone_id);
            if (z) zoneName = z.name;
          }
        }
      }

      if (dec.deployment_id) {
        const dep = await repository.getDeploymentById(dec.deployment_id);
        if (dep) {
          deploymentIdentifier = dep.deployment_identifier;
          if (!zoneName && dep.zone_id) {
            const z = await repository.getZoneById(dep.zone_id);
            if (z) zoneName = z.name;
          }
        }
      }

      return {
        id: dec.id,
        issueKey,
        workRequestKey: issueKey || '',
        zone: zoneName,
        zoneName: zoneName || '',
        deployment: deploymentIdentifier,
        deploymentIdentifier: deploymentIdentifier || '',
        coverage: dec.coverage_result,
        coverageResult: dec.coverage_result,
        reviewer: dec.reviewer_account_id,
        reviewerAccountId: dec.reviewer_account_id,
        followUpKey: dec.followup_jira_issue_key || null,
        followupKey: dec.followup_jira_issue_key || null,
        decisionStatus: dec.review_status,
        timestamp: dec.created_at,
        createdAt: dec.created_at,
      };
    })
  );

  return { decisions: formattedDecisions };
}
