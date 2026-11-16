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
      });
    } else {
      for (const dep of deployments) {
        rows.push({
          zoneName: zone.name,
          zoneType: zone.zone_type || 'General Zone',
          deploymentIdentifier: dep.deployment_identifier,
          baselinePageId: dep.confluence_page_id || undefined,
          baselineVersion: dep.confluence_page_version || 1,
          sensorRig: (dep.metadata as any)?.sensorRig || 'Standard',
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

  // 1. If commissioning page is provided, fetch page and verify quotes verbatim (Item 4)
  if (confluenceCommissioningPageId) {
    const page = await confluenceService.getPageWithVersion(confluenceCommissioningPageId);
    if (!page || !page.content) {
      throw new ValidationError(`Could not retrieve Confluence commissioning page ${confluenceCommissioningPageId}.`);
    }

    if (commissioningSummary && commissioningSummary.trim()) {
      const summaryCheck = verifyExactQuote(page.content, commissioningSummary.trim());
      if (!summaryCheck.verified) {
        throw new ValidationError(
          `Commissioning summary quote is not a verbatim NFKC substring of Confluence page ${confluenceCommissioningPageId}.`
        );
      }
    }

    for (const cond of conditions) {
      if (cond.quoted_text && cond.quoted_text.trim()) {
        const quoteCheck = verifyExactQuote(page.content, cond.quoted_text.trim());
        if (!quoteCheck.verified) {
          throw new ValidationError(
            `Condition quote "${cond.quoted_text}" is not a verbatim substring of Confluence page ${confluenceCommissioningPageId}.`
          );
        }
      }
    }
  }

  // 2. Upsert Site (do not duplicate sites)
  let site = null;
  if (confluenceCommissioningPageId) {
    site = await repository.getSiteByConfluencePageId(confluenceCommissioningPageId);
  }
  if (!site) {
    site = await repository.getSiteByName(siteName.trim());
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
 * Returns audit trail history for an entity.
 */
export async function handleGetAssessmentHistory(payload: any, context: any): Promise<any> {
  const { entityType, entityId } = payload || {};
  if (!entityType || !entityId) return [];
  return repository.getActionLogsByEntity(entityType, entityId);
}
