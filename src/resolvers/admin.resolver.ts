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
 * Enterprise Onboarding Endpoint: Registers a real facility, deployment, operating conditions, and baseline evidence.
 */
export async function handleRegisterDeployment(payload: any, context: any): Promise<any> {
  const user = await authService.getCurrentUser();
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

  // 1. Register or find Site
  let site = await repository.getZoneByName(siteName);
  const createdSite = await repository.insertSite({
    name: siteName.trim(),
    confluence_page_id: confluenceCommissioningPageId || null,
    confluence_page_version: confluenceCommissioningVersion,
    metadata: { registeredBy: user.accountId },
  });

  // 2. Register Zone
  const createdZone = await repository.insertZone({
    site_id: createdSite.id,
    name: zoneName.trim(),
    zone_type: zoneType as ZoneType,
    confluence_page_id: confluenceCommissioningPageId || null,
    metadata: { registeredBy: user.accountId },
  });

  // 3. Register Deployment
  const createdDeployment = await repository.insertDeployment({
    zone_id: createdZone.id,
    deployment_identifier: deploymentIdentifier.trim(),
    confluence_page_id: confluenceCommissioningPageId || null,
    confluence_page_version: confluenceCommissioningVersion,
    owner_account_id: ownerAccountId || user.accountId,
    status: DeploymentStatus.ACTIVE,
    metadata: { registeredBy: user.accountId },
  });

  // 4. Register Operating Conditions
  const registeredConditions = [];
  for (const cond of conditions) {
    if (cond.attribute_name && cond.attribute_value) {
      const conditionRecord = await repository.insertCondition({
        deployment_id: createdDeployment.id,
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

  // 5. Register Evidence Revision
  const createdEvidence = await repository.insertEvidenceRevision({
    deployment_id: createdDeployment.id,
    evidence_type: EvidenceType.COMMISSIONING,
    confluence_page_id: confluenceCommissioningPageId || null,
    confluence_page_version: confluenceCommissioningVersion,
    source_quoted_text: commissioningSummary || null,
    declared_scope: {
      conditions: conditions.map((c: any) => ({
        attribute_name: c.attribute_name,
        attribute_value: c.attribute_value,
      })),
      zone_id: createdZone.id,
    },
    approved_by: user.accountId,
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
    entity_id: createdDeployment.id,
    actor_account_id: user.accountId,
    detail: {
      deploymentIdentifier,
      zoneName,
      conditionsCount: registeredConditions.length,
    },
  });

  return {
    success: true,
    message: `Deployment "${deploymentIdentifier}" successfully registered into ANDON.`,
    deploymentId: createdDeployment.id,
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
