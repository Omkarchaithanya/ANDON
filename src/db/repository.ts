/**
 * @module repository
 * @description Data access layer and entity mapping functions for Forge SQL.
 */

import api, { sql } from '@forge/sql';
import {
  Site,
  CreateSiteInput,
  Zone,
  CreateZoneInput,
  Deployment,
  CreateDeploymentInput,
  Condition,
  CreateConditionInput,
  EvidenceRevision,
  CreateEvidenceRevisionInput,
  ChangeIntent,
  CreateChangeIntentInput,
  ReviewDecision,
  CreateReviewDecisionInput,
  ActionLogEntry,
  CreateActionLogEntryInput,
  SourceVersion,
} from '../models/entities';
import {
  ActionType,
  FollowupCreationStatus,
  SourceType,
} from '../models/enums';
import { generateId } from '../utils/validation';
import {
  SITES_QUERIES,
  ZONES_QUERIES,
  DEPLOYMENTS_QUERIES,
  CONDITIONS_QUERIES,
  EVIDENCE_REVISIONS_QUERIES,
  CHANGE_INTENTS_QUERIES,
  REVIEW_DECISIONS_QUERIES,
  ACTION_LOG_QUERIES,
  APP_CONFIG_QUERIES,
  SOURCE_VERSIONS_QUERIES,
} from './queries';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function safeJsonParse<T>(val: unknown, fallback: T): T {
  if (!val) return fallback;
  if (typeof val === 'object') return val as T;
  try {
    return JSON.parse(String(val)) as T;
  } catch {
    return fallback;
  }
}

function safeJsonStringify(val: unknown): string | null {
  if (val === undefined || val === null) return null;
  if (typeof val === 'string') return val;
  try {
    return JSON.stringify(val);
  } catch {
    return null;
  }
}

function mapRow<T>(row: any, columns: string[]): T {
  if (!row) return row;
  if (Array.isArray(row)) {
    const obj: any = {};
    columns.forEach((col, idx) => {
      obj[col] = row[idx];
    });
    return obj as T;
  }
  return row as T;
}

async function executeSql(query: string, params: any[] = []): Promise<any> {
  const statement = sql.prepare(query);
  if (params && params.length > 0) {
    statement.bindParams(...params);
  }
  return await statement.execute();
}

// ---------------------------------------------------------------------------
// Sites
// ---------------------------------------------------------------------------

export async function getSiteById(id: string): Promise<Site | null> {
  const result = await executeSql(SITES_QUERIES.findById, [id]);
  const row = result.rows?.[0];
  if (!row) return null;
  const site: Site = mapRow(row, ['id', 'name', 'confluence_page_id', 'confluence_page_version', 'metadata', 'created_at', 'updated_at']);
  site.metadata = safeJsonParse(site.metadata, null);
  return site;
}

export async function insertSite(input: CreateSiteInput): Promise<Site> {
  const id = generateId();
  const metaStr = safeJsonStringify(input.metadata);
  await executeSql(SITES_QUERIES.insert, [
    id,
    input.name,
    input.confluence_page_id || null,
    input.confluence_page_version || null,
    metaStr,
  ]);
  return (await getSiteById(id))!;
}

// ---------------------------------------------------------------------------
// Zones
// ---------------------------------------------------------------------------

export async function getZoneById(id: string): Promise<Zone | null> {
  const result = await executeSql(ZONES_QUERIES.findById, [id]);
  const row = result.rows?.[0];
  if (!row) return null;
  const zone: Zone = mapRow(row, ['id', 'site_id', 'name', 'zone_type', 'confluence_page_id', 'metadata', 'created_at', 'updated_at']);
  zone.metadata = safeJsonParse(zone.metadata, null);
  return zone;
}

export async function getZoneByName(name: string): Promise<Zone | null> {
  const result = await executeSql(ZONES_QUERIES.findByName, [name]);
  const row = result.rows?.[0];
  if (!row) return null;
  const zone: Zone = mapRow(row, ['id', 'site_id', 'name', 'zone_type', 'confluence_page_id', 'metadata', 'created_at', 'updated_at']);
  zone.metadata = safeJsonParse(zone.metadata, null);
  return zone;
}

export async function insertZone(input: CreateZoneInput): Promise<Zone> {
  const id = generateId();
  const metaStr = safeJsonStringify(input.metadata);
  await executeSql(ZONES_QUERIES.insert, [
    id,
    input.site_id,
    input.name,
    input.zone_type,
    input.confluence_page_id || null,
    metaStr,
  ]);
  return (await getZoneById(id))!;
}

// ---------------------------------------------------------------------------
// Deployments
// ---------------------------------------------------------------------------

export async function getDeploymentById(id: string): Promise<Deployment | null> {
  const result = await executeSql(DEPLOYMENTS_QUERIES.findById, [id]);
  const row = result.rows?.[0];
  if (!row) return null;
  const deploy: Deployment = mapRow(row, ['id', 'zone_id', 'deployment_identifier', 'confluence_page_id', 'confluence_page_version', 'owner_account_id', 'status', 'metadata', 'created_at', 'updated_at']);
  deploy.metadata = safeJsonParse(deploy.metadata, null);
  return deploy;
}

export async function getDeploymentsByZoneId(zoneId: string): Promise<Deployment[]> {
  const result = await executeSql(DEPLOYMENTS_QUERIES.findByZoneIdActive, [zoneId]);
  return (result.rows || []).map((row: any) => {
    const deploy: Deployment = mapRow(row, ['id', 'zone_id', 'deployment_identifier', 'confluence_page_id', 'confluence_page_version', 'owner_account_id', 'status', 'metadata', 'created_at', 'updated_at']);
    deploy.metadata = safeJsonParse(deploy.metadata, null);
    return deploy;
  });
}

export async function insertDeployment(input: CreateDeploymentInput): Promise<Deployment> {
  const id = generateId();
  const metaStr = safeJsonStringify(input.metadata);
  await executeSql(DEPLOYMENTS_QUERIES.insert, [
    id,
    input.zone_id,
    input.deployment_identifier,
    input.confluence_page_id || null,
    input.confluence_page_version || null,
    input.owner_account_id || null,
    input.status,
    metaStr,
  ]);
  return (await getDeploymentById(id))!;
}

// ---------------------------------------------------------------------------
// Conditions
// ---------------------------------------------------------------------------

export async function getConditionsByDeploymentId(deploymentId: string): Promise<Condition[]> {
  const result = await executeSql(CONDITIONS_QUERIES.findByDeploymentId, [deploymentId]);
  return (result.rows || []).map((row: any) => {
    return mapRow(row, [
      'id',
      'deployment_id',
      'attribute_name',
      'attribute_value',
      'source_confluence_page_id',
      'source_page_version',
      'source_span_start',
      'source_span_end',
      'source_quoted_text',
      'schema_version',
      'created_at',
      'updated_at',
    ]);
  });
}

export async function insertCondition(input: CreateConditionInput): Promise<Condition> {
  const id = generateId();
  await executeSql(CONDITIONS_QUERIES.insert, [
    id,
    input.deployment_id,
    input.attribute_name,
    input.attribute_value,
    input.source_confluence_page_id || null,
    input.source_page_version || null,
    input.source_span_start || null,
    input.source_span_end || null,
    input.source_quoted_text || null,
    input.schema_version || '1.0',
  ]);
  const result = await executeSql(CONDITIONS_QUERIES.findById, [id]);
  return mapRow(result.rows?.[0], [
    'id',
    'deployment_id',
    'attribute_name',
    'attribute_value',
    'source_confluence_page_id',
    'source_page_version',
    'source_span_start',
    'source_span_end',
    'source_quoted_text',
    'schema_version',
    'created_at',
    'updated_at',
  ]);
}

// ---------------------------------------------------------------------------
// Evidence Revisions
// ---------------------------------------------------------------------------

export async function getEvidenceRevisionById(id: string): Promise<EvidenceRevision | null> {
  const result = await executeSql(EVIDENCE_REVISIONS_QUERIES.findById, [id]);
  const row = result.rows?.[0];
  if (!row) return null;
  const ev: EvidenceRevision = mapRow(row, [
    'id',
    'deployment_id',
    'evidence_type',
    'confluence_page_id',
    'confluence_page_version',
    'source_quoted_text',
    'declared_scope',
    'approved_by',
    'approved_at',
    'effective_from',
    'recorded_at',
    'status',
    'staleness_reason',
    'metadata',
    'created_at',
    'updated_at',
  ]);
  ev.declared_scope = safeJsonParse(ev.declared_scope, { conditions: [] });
  ev.metadata = safeJsonParse(ev.metadata, null);
  return ev;
}

export async function getEvidenceRevisionsByDeploymentId(deploymentId: string): Promise<EvidenceRevision[]> {
  const result = await executeSql(EVIDENCE_REVISIONS_QUERIES.findByDeploymentId, [deploymentId]);
  return (result.rows || []).map((row: any) => {
    const ev: EvidenceRevision = mapRow(row, [
      'id',
      'deployment_id',
      'evidence_type',
      'confluence_page_id',
      'confluence_page_version',
      'source_quoted_text',
      'declared_scope',
      'approved_by',
      'approved_at',
      'effective_from',
      'recorded_at',
      'status',
      'staleness_reason',
      'metadata',
      'created_at',
      'updated_at',
    ]);
    ev.declared_scope = safeJsonParse(ev.declared_scope, { conditions: [] });
    ev.metadata = safeJsonParse(ev.metadata, null);
    return ev;
  });
}

export async function getEvidenceRevisionsBySource(
  sourceType: SourceType,
  sourceId: string
): Promise<EvidenceRevision[]> {
  if (sourceType === SourceType.CONFLUENCE_PAGE) {
    const result = await executeSql(EVIDENCE_REVISIONS_QUERIES.findByConfluencePageId, [sourceId]);
    return (result.rows || []).map((row: any) => {
      const ev: EvidenceRevision = mapRow(row, [
        'id',
        'deployment_id',
        'evidence_type',
        'confluence_page_id',
        'confluence_page_version',
        'source_quoted_text',
        'declared_scope',
        'approved_by',
        'approved_at',
        'effective_from',
        'recorded_at',
        'status',
        'staleness_reason',
        'metadata',
        'created_at',
        'updated_at',
      ]);
      ev.declared_scope = safeJsonParse(ev.declared_scope, { conditions: [] });
      return ev;
    });
  }
  return [];
}

export async function updateEvidenceRevisionStatus(
  id: string,
  status: string,
  reason?: string
): Promise<void> {
  await executeSql(EVIDENCE_REVISIONS_QUERIES.updateStatus, [status, reason || null, id]);
}

export async function insertEvidenceRevision(input: CreateEvidenceRevisionInput): Promise<EvidenceRevision> {
  const id = generateId();
  const scopeStr = typeof input.declared_scope === 'string' ? input.declared_scope : JSON.stringify(input.declared_scope);
  const metaStr = safeJsonStringify(input.metadata);
  await executeSql(EVIDENCE_REVISIONS_QUERIES.insert, [
    id,
    input.deployment_id,
    input.evidence_type,
    input.confluence_page_id || null,
    input.confluence_page_version || null,
    input.source_quoted_text || null,
    scopeStr,
    input.approved_by || null,
    input.approved_at || null,
    input.effective_from || null,
    input.status,
    input.staleness_reason || null,
    metaStr,
  ]);
  return (await getEvidenceRevisionById(id))!;
}

// ---------------------------------------------------------------------------
// Change Intents
// ---------------------------------------------------------------------------

export async function getChangeIntentById(id: string): Promise<ChangeIntent | null> {
  const result = await executeSql(CHANGE_INTENTS_QUERIES.findById, [id]);
  const row = result.rows?.[0];
  if (!row) return null;
  return mapRow(row, [
    'id',
    'jira_issue_id',
    'jira_issue_key',
    'site_id',
    'zone_id',
    'proposed_attribute',
    'proposed_value',
    'effective_date',
    'source_quoted_text',
    'content_fingerprint',
    'discovery_status',
    'llm_confidence',
    'llm_reasoning',
    'confirmed_by',
    'confirmed_at',
    'dismissed_by',
    'dismissed_at',
    'dismissal_reason',
    'idempotency_key',
    'created_at',
    'updated_at',
  ]);
}

export async function getChangeIntentsByJiraIssueId(issueId: string): Promise<ChangeIntent[]> {
  const result = await executeSql(CHANGE_INTENTS_QUERIES.findByJiraIssueId, [issueId]);
  return (result.rows || []).map((row: any) => {
    return mapRow(row, [
      'id',
      'jira_issue_id',
      'jira_issue_key',
      'site_id',
      'zone_id',
      'proposed_attribute',
      'proposed_value',
      'effective_date',
      'source_quoted_text',
      'content_fingerprint',
      'discovery_status',
      'llm_confidence',
      'llm_reasoning',
      'confirmed_by',
      'confirmed_at',
      'dismissed_by',
      'dismissed_at',
      'dismissal_reason',
      'idempotency_key',
      'created_at',
      'updated_at',
    ]);
  });
}

export async function getChangeIntentByIdempotencyKey(key: string): Promise<ChangeIntent | null> {
  const result = await executeSql(CHANGE_INTENTS_QUERIES.findByIdempotencyKey, [key]);
  const row = result.rows?.[0];
  if (!row) return null;
  return mapRow(row, [
    'id',
    'jira_issue_id',
    'jira_issue_key',
    'site_id',
    'zone_id',
    'proposed_attribute',
    'proposed_value',
    'effective_date',
    'source_quoted_text',
    'content_fingerprint',
    'discovery_status',
    'llm_confidence',
    'llm_reasoning',
    'confirmed_by',
    'confirmed_at',
    'dismissed_by',
    'dismissed_at',
    'dismissal_reason',
    'idempotency_key',
    'created_at',
    'updated_at',
  ]);
}

export async function insertChangeIntent(input: CreateChangeIntentInput): Promise<ChangeIntent> {
  const id = generateId();
  await executeSql(CHANGE_INTENTS_QUERIES.insert, [
    id,
    input.jira_issue_id,
    input.jira_issue_key,
    input.site_id || null,
    input.zone_id || null,
    input.proposed_attribute || null,
    input.proposed_value || null,
    input.effective_date || null,
    input.source_quoted_text || null,
    input.content_fingerprint || null,
    input.discovery_status,
    input.llm_confidence || null,
    input.llm_reasoning || null,
    input.confirmed_by || null,
    input.confirmed_at || null,
    input.dismissed_by || null,
    input.dismissed_at || null,
    input.dismissal_reason || null,
    input.idempotency_key || null,
  ]);
  return (await getChangeIntentById(id))!;
}

export async function confirmChangeIntent(id: string, confirmedBy: string): Promise<void> {
  await executeSql(CHANGE_INTENTS_QUERIES.confirm, [confirmedBy, id]);
}

export async function dismissChangeIntent(id: string, dismissedBy: string, reason: string): Promise<void> {
  await executeSql(CHANGE_INTENTS_QUERIES.dismiss, [dismissedBy, reason, id]);
}

// ---------------------------------------------------------------------------
// Review Decisions
// ---------------------------------------------------------------------------

export async function getReviewDecisionById(id: string): Promise<ReviewDecision | null> {
  const result = await executeSql(REVIEW_DECISIONS_QUERIES.findById, [id]);
  const row = result.rows?.[0];
  if (!row) return null;
  const dec: ReviewDecision = mapRow(row, [
    'id',
    'change_intent_id',
    'deployment_id',
    'evidence_revision_id',
    'coverage_result',
    'coverage_detail',
    'reviewer_account_id',
    'review_status',
    'followup_jira_issue_id',
    'followup_jira_issue_key',
    'followup_creation_status',
    'followup_idempotency_key',
    'source_versions_at_review',
    'created_at',
    'updated_at',
  ]);
  dec.coverage_detail = safeJsonParse(dec.coverage_detail, null);
  dec.source_versions_at_review = safeJsonParse(dec.source_versions_at_review, null);
  return dec;
}

export async function getReviewDecisionsByChangeIntentId(changeIntentId: string): Promise<ReviewDecision[]> {
  const result = await executeSql(REVIEW_DECISIONS_QUERIES.findByChangeIntentId, [changeIntentId]);
  return (result.rows || []).map((row: any) => {
    const dec: ReviewDecision = mapRow(row, [
      'id',
      'change_intent_id',
      'deployment_id',
      'evidence_revision_id',
      'coverage_result',
      'coverage_detail',
      'reviewer_account_id',
      'review_status',
      'followup_jira_issue_id',
      'followup_jira_issue_key',
      'followup_creation_status',
      'followup_idempotency_key',
      'source_versions_at_review',
      'created_at',
      'updated_at',
    ]);
    dec.coverage_detail = safeJsonParse(dec.coverage_detail, null);
    dec.source_versions_at_review = safeJsonParse(dec.source_versions_at_review, null);
    return dec;
  });
}

export async function getReviewDecisionsByEvidenceId(evidenceId: string): Promise<ReviewDecision[]> {
  const result = await executeSql(REVIEW_DECISIONS_QUERIES.findByEvidenceRevisionId, [evidenceId]);
  return (result.rows || []).map((row: any) => {
    const dec: ReviewDecision = mapRow(row, [
      'id',
      'change_intent_id',
      'deployment_id',
      'evidence_revision_id',
      'coverage_result',
      'coverage_detail',
      'reviewer_account_id',
      'review_status',
      'followup_jira_issue_id',
      'followup_jira_issue_key',
      'followup_creation_status',
      'followup_idempotency_key',
      'source_versions_at_review',
      'created_at',
      'updated_at',
    ]);
    dec.coverage_detail = safeJsonParse(dec.coverage_detail, null);
    dec.source_versions_at_review = safeJsonParse(dec.source_versions_at_review, null);
    return dec;
  });
}

export async function getFollowupByIdempotencyKey(key: string): Promise<ReviewDecision | null> {
  const result = await executeSql(REVIEW_DECISIONS_QUERIES.findByFollowupIdempotencyKey, [key]);
  const row = result.rows?.[0];
  if (!row) return null;
  const dec: ReviewDecision = mapRow(row, [
    'id',
    'change_intent_id',
    'deployment_id',
    'evidence_revision_id',
    'coverage_result',
    'coverage_detail',
    'reviewer_account_id',
    'review_status',
    'followup_jira_issue_id',
    'followup_jira_issue_key',
    'followup_creation_status',
    'followup_idempotency_key',
    'source_versions_at_review',
    'created_at',
    'updated_at',
  ]);
  dec.coverage_detail = safeJsonParse(dec.coverage_detail, null);
  dec.source_versions_at_review = safeJsonParse(dec.source_versions_at_review, null);
  return dec;
}

export async function getUncertainAction(actionId: string): Promise<ReviewDecision | null> {
  return getReviewDecisionById(actionId);
}

export async function resolveUncertainAction(actionId: string, issueKey: string): Promise<void> {
  await executeSql(REVIEW_DECISIONS_QUERIES.updateFollowup, [
    issueKey,
    issueKey,
    FollowupCreationStatus.CREATED,
    actionId,
  ]);
}

export async function markActionConfirmedMissing(actionId: string): Promise<void> {
  await executeSql(REVIEW_DECISIONS_QUERIES.updateFollowupStatus, [
    FollowupCreationStatus.FAILED,
    actionId,
  ]);
}

export async function markFollowupUncertain(reviewDecisionId: string): Promise<void> {
  await executeSql(REVIEW_DECISIONS_QUERIES.updateFollowupStatus, [
    FollowupCreationStatus.UNCERTAIN,
    reviewDecisionId,
  ]);
}

export async function updateReviewDecisionStatus(id: string, status: string): Promise<void> {
  await executeSql(REVIEW_DECISIONS_QUERIES.updateStatus, [status, id]);
}

export async function updateReviewDecisionFollowup(
  id: string,
  issueId: string,
  issueKey: string,
  status: FollowupCreationStatus
): Promise<void> {
  await executeSql(REVIEW_DECISIONS_QUERIES.updateFollowup, [
    issueId,
    issueKey,
    status,
    id,
  ]);
}

export async function insertReviewDecision(input: CreateReviewDecisionInput): Promise<ReviewDecision> {
  const id = generateId();
  const detailStr = safeJsonStringify(input.coverage_detail);
  const snapshotStr = safeJsonStringify(input.source_versions_at_review);
  await executeSql(REVIEW_DECISIONS_QUERIES.insert, [
    id,
    input.change_intent_id,
    input.deployment_id,
    input.evidence_revision_id || null,
    input.coverage_result,
    detailStr,
    input.reviewer_account_id || null,
    input.review_status,
    input.followup_jira_issue_id || null,
    input.followup_jira_issue_key || null,
    input.followup_creation_status || FollowupCreationStatus.NOT_STARTED,
    input.followup_idempotency_key || null,
    snapshotStr,
  ]);
  return (await getReviewDecisionById(id))!;
}

// ---------------------------------------------------------------------------
// Action Log (Audit)
// ---------------------------------------------------------------------------

export async function insertAuditLog(input: CreateActionLogEntryInput): Promise<ActionLogEntry> {
  const id = generateId();
  const detailStr = safeJsonStringify(input.detail);
  await executeSql(ACTION_LOG_QUERIES.insert, [
    id,
    input.action_type,
    input.entity_type,
    input.entity_id,
    input.actor_account_id,
    detailStr,
  ]);
  return {
    id,
    action_type: input.action_type,
    entity_type: input.entity_type,
    entity_id: input.entity_id,
    actor_account_id: input.actor_account_id,
    detail: input.detail,
    created_at: new Date().toISOString(),
  };
}

export async function getActionLogsByEntity(entityType: string, entityId: string): Promise<ActionLogEntry[]> {
  const result = await executeSql(ACTION_LOG_QUERIES.findByEntity, [entityType, entityId]);
  return (result.rows || []).map((row: any) => {
    const entry: ActionLogEntry = mapRow(row, ['id', 'action_type', 'entity_type', 'entity_id', 'actor_account_id', 'detail', 'created_at']);
    entry.detail = safeJsonParse(entry.detail, null);
    return entry;
  });
}

// ---------------------------------------------------------------------------
// App Config
// ---------------------------------------------------------------------------

export async function getAppConfig(key: string): Promise<string | null> {
  const result = await executeSql(APP_CONFIG_QUERIES.get, [key]);
  const row = result.rows?.[0];
  if (!row) return null;
  return Array.isArray(row) ? row[0] : row.value;
}

export async function setAppConfig(key: string, value: string): Promise<void> {
  await executeSql(APP_CONFIG_QUERIES.set, [key, value]);
}

// ---------------------------------------------------------------------------
// Source Versions
// ---------------------------------------------------------------------------

export async function getSourceVersionSnapshot(
  sourceType: SourceType,
  sourceId: string
): Promise<SourceVersion | null> {
  const result = await executeSql(SOURCE_VERSIONS_QUERIES.findByTypeAndId, [sourceType, sourceId]);
  const row = result.rows?.[0];
  if (!row) return null;
  return mapRow(row, [
    'id',
    'source_type',
    'source_id',
    'known_version',
    'content_fingerprint',
    'last_checked_at',
    'status',
    'created_at',
    'updated_at',
  ]);
}

export async function upsertSourceVersion(
  sourceType: SourceType,
  sourceId: string,
  version: string,
  fingerprint?: string
): Promise<void> {
  const id = generateId();
  await executeSql(SOURCE_VERSIONS_QUERIES.upsert, [
    id,
    sourceType,
    sourceId,
    version,
    fingerprint || null,
  ]);
}

export async function updateSourceCheckTimestamp(
  sourceType: SourceType,
  sourceId: string,
  timestamp: string
): Promise<void> {
  await executeSql(SOURCE_VERSIONS_QUERIES.updateCheckTimestamp, [timestamp, sourceType, sourceId]);
}

export async function updateSourceVersion(
  sourceType: SourceType,
  sourceId: string,
  version: string,
  timestamp: string
): Promise<void> {
  await executeSql(SOURCE_VERSIONS_QUERIES.updateVersion, [version, timestamp, sourceType, sourceId]);
}

export async function markSourceStale(sourceType: SourceType, sourceId: string): Promise<void> {
  await executeSql(SOURCE_VERSIONS_QUERIES.markStale, [sourceType, sourceId]);
}

