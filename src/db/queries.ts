/**
 * @module queries
 * @description Parameterized SQL query strings for Forge SQL (MySQL/TiDB) operations.
 */

export const SITES_QUERIES = {
  findById: `SELECT * FROM sites WHERE id = ?`,
  findByConfluencePageId: `SELECT * FROM sites WHERE confluence_page_id = ?`,
  insert: `
    INSERT INTO sites (id, name, confluence_page_id, confluence_page_version, metadata, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, NOW(), NOW())
  `,
  update: `
    UPDATE sites
    SET name = ?, confluence_page_id = ?, confluence_page_version = ?, metadata = ?, updated_at = NOW()
    WHERE id = ?
  `,
};

export const ZONES_QUERIES = {
  findById: `SELECT * FROM zones WHERE id = ?`,
  findBySiteId: `SELECT * FROM zones WHERE site_id = ?`,
  findByName: `SELECT * FROM zones WHERE name = ?`,
  findByNameAndSiteId: `SELECT * FROM zones WHERE name = ? AND site_id = ?`,
  insert: `
    INSERT INTO zones (id, site_id, name, zone_type, confluence_page_id, metadata, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
  `,
  update: `
    UPDATE zones
    SET name = ?, zone_type = ?, confluence_page_id = ?, metadata = ?, updated_at = NOW()
    WHERE id = ?
  `,
};

export const DEPLOYMENTS_QUERIES = {
  findById: `SELECT * FROM deployments WHERE id = ?`,
  findByZoneId: `SELECT * FROM deployments WHERE zone_id = ?`,
  findByIdentifier: `SELECT * FROM deployments WHERE deployment_identifier = ?`,
  findByZoneIdActive: `SELECT * FROM deployments WHERE zone_id = ? AND status = 'active'`,
  insert: `
    INSERT INTO deployments (id, zone_id, deployment_identifier, confluence_page_id, confluence_page_version, owner_account_id, status, metadata, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
  `,
  update: `
    UPDATE deployments
    SET zone_id = ?, deployment_identifier = ?, confluence_page_id = ?, confluence_page_version = ?, owner_account_id = ?, status = ?, metadata = ?, updated_at = NOW()
    WHERE id = ?
  `,
  updateStatus: `
    UPDATE deployments
    SET status = ?, updated_at = NOW()
    WHERE id = ?
  `,
};

export const CONDITIONS_QUERIES = {
  findById: `SELECT * FROM conditions WHERE id = ?`,
  findByDeploymentId: `SELECT * FROM conditions WHERE deployment_id = ?`,
  findByAttribute: `SELECT * FROM conditions WHERE deployment_id = ? AND attribute_name = ?`,
  insert: `
    INSERT INTO conditions (id, deployment_id, attribute_name, attribute_value, source_confluence_page_id, source_page_version, source_span_start, source_span_end, source_quoted_text, schema_version, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
  `,
  update: `
    UPDATE conditions
    SET attribute_value = ?, source_confluence_page_id = ?, source_page_version = ?, source_span_start = ?, source_span_end = ?, source_quoted_text = ?, schema_version = ?, updated_at = NOW()
    WHERE id = ?
  `,
  deleteById: `DELETE FROM conditions WHERE id = ?`,
};

export const EVIDENCE_REVISIONS_QUERIES = {
  findById: `SELECT * FROM evidence_revisions WHERE id = ?`,
  findByDeploymentId: `SELECT * FROM evidence_revisions WHERE deployment_id = ?`,
  findCurrentByDeploymentId: `SELECT * FROM evidence_revisions WHERE deployment_id = ? AND status = 'current'`,
  findByConfluencePageId: `SELECT * FROM evidence_revisions WHERE confluence_page_id = ?`,
  insert: `
    INSERT INTO evidence_revisions (id, deployment_id, evidence_type, confluence_page_id, confluence_page_version, source_quoted_text, declared_scope, approved_by, approved_at, effective_from, recorded_at, status, staleness_reason, metadata, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
  `,
  updateStatus: `
    UPDATE evidence_revisions
    SET status = ?, staleness_reason = ?, updated_at = NOW()
    WHERE id = ?
  `,
};

export const CHANGE_INTENTS_QUERIES = {
  findById: `SELECT * FROM change_intents WHERE id = ?`,
  findByJiraIssueId: `SELECT * FROM change_intents WHERE jira_issue_id = ?`,
  findByIdempotencyKey: `SELECT * FROM change_intents WHERE idempotency_key = ?`,
  findByFingerprint: `SELECT * FROM change_intents WHERE content_fingerprint = ?`,
  findByZoneId: `SELECT * FROM change_intents WHERE zone_id = ?`,
  findCandidates: `SELECT * FROM change_intents WHERE discovery_status = 'candidate'`,
  insert: `
    INSERT INTO change_intents (id, jira_issue_id, jira_issue_key, site_id, zone_id, proposed_attribute, proposed_value, effective_date, source_quoted_text, content_fingerprint, discovery_status, llm_confidence, llm_reasoning, confirmed_by, confirmed_at, dismissed_by, dismissed_at, dismissal_reason, idempotency_key, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
  `,
  updateStatus: `
    UPDATE change_intents
    SET discovery_status = ?, updated_at = NOW()
    WHERE id = ?
  `,
  confirm: `
    UPDATE change_intents
    SET discovery_status = 'confirmed', confirmed_by = ?, confirmed_at = NOW(), updated_at = NOW()
    WHERE id = ?
  `,
  dismiss: `
    UPDATE change_intents
    SET discovery_status = 'dismissed', dismissed_by = ?, dismissed_at = NOW(), dismissal_reason = ?, updated_at = NOW()
    WHERE id = ?
  `,
};

export const REVIEW_DECISIONS_QUERIES = {
  findById: `SELECT * FROM review_decisions WHERE id = ?`,
  findByChangeIntentId: `SELECT * FROM review_decisions WHERE change_intent_id = ?`,
  findByDeploymentId: `SELECT * FROM review_decisions WHERE deployment_id = ?`,
  findByFollowupIdempotencyKey: `SELECT * FROM review_decisions WHERE followup_idempotency_key = ?`,
  findByEvidenceRevisionId: `SELECT * FROM review_decisions WHERE evidence_revision_id = ?`,
  insert: `
    INSERT INTO review_decisions (id, change_intent_id, deployment_id, evidence_revision_id, coverage_result, coverage_detail, reviewer_account_id, review_status, followup_jira_issue_id, followup_jira_issue_key, followup_creation_status, followup_idempotency_key, source_versions_at_review, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
  `,
  updateStatus: `
    UPDATE review_decisions
    SET review_status = ?, updated_at = NOW()
    WHERE id = ?
  `,
  updateFollowup: `
    UPDATE review_decisions
    SET followup_jira_issue_id = ?, followup_jira_issue_key = ?, followup_creation_status = ?, updated_at = NOW()
    WHERE id = ?
  `,
  updateFollowupStatus: `
    UPDATE review_decisions
    SET followup_creation_status = ?, updated_at = NOW()
    WHERE id = ?
  `,
};

export const ACTION_LOG_QUERIES = {
  insert: `
    INSERT INTO action_log (id, action_type, entity_type, entity_id, actor_account_id, detail, created_at)
    VALUES (?, ?, ?, ?, ?, ?, NOW())
  `,
  findByEntity: `SELECT * FROM action_log WHERE entity_type = ? AND entity_id = ? ORDER BY created_at DESC`,
  findByActor: `SELECT * FROM action_log WHERE actor_account_id = ? ORDER BY created_at DESC`,
};

export const APP_CONFIG_QUERIES = {
  get: `SELECT value FROM app_config WHERE \`key\` = ?`,
  set: `
    INSERT INTO app_config (\`key\`, value, updated_at)
    VALUES (?, ?, NOW())
    ON DUPLICATE KEY UPDATE value = VALUES(value), updated_at = NOW()
  `,
  delete: `DELETE FROM app_config WHERE \`key\` = ?`,
};

export const SOURCE_VERSIONS_QUERIES = {
  findByTypeAndId: `SELECT * FROM source_versions WHERE source_type = ? AND source_id = ?`,
  upsert: `
    INSERT INTO source_versions (id, source_type, source_id, known_version, content_fingerprint, last_checked_at, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, NOW(), 'current', NOW(), NOW())
    ON DUPLICATE KEY UPDATE
      known_version = VALUES(known_version),
      content_fingerprint = VALUES(content_fingerprint),
      last_checked_at = NOW(),
      status = 'current',
      updated_at = NOW()
  `,
  updateCheckTimestamp: `
    UPDATE source_versions
    SET last_checked_at = ?, updated_at = NOW()
    WHERE source_type = ? AND source_id = ?
  `,
  updateVersion: `
    UPDATE source_versions
    SET known_version = ?, last_checked_at = ?, status = 'current', updated_at = NOW()
    WHERE source_type = ? AND source_id = ?
  `,
  markStale: `
    UPDATE source_versions
    SET status = 'stale', updated_at = NOW()
    WHERE source_type = ? AND source_id = ?
  `,
  findStale: `SELECT * FROM source_versions WHERE status = 'stale'`,
};
