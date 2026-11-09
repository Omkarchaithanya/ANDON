/**
 * @module schema
 * @description Official MySQL/TiDB compatible DDL statements for Forge SQL.
 * Exported as in-memory constants to eliminate runtime fs.readFileSync in Forge runtime.
 */

export const SCHEMA_VERSION = 'v1_init';

export const DDL_STATEMENTS: string[] = [
  // Sites table
  `CREATE TABLE IF NOT EXISTS sites (
    id VARCHAR(128) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    confluence_page_id VARCHAR(128),
    confluence_page_version INT,
    metadata TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_sites_confluence (confluence_page_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  // Zones table
  `CREATE TABLE IF NOT EXISTS zones (
    id VARCHAR(128) PRIMARY KEY,
    site_id VARCHAR(128) NOT NULL,
    name VARCHAR(255) NOT NULL,
    zone_type VARCHAR(64) NOT NULL,
    confluence_page_id VARCHAR(128),
    metadata TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_zones_site (site_id),
    INDEX idx_zones_name (name)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  // Deployments table
  `CREATE TABLE IF NOT EXISTS deployments (
    id VARCHAR(128) PRIMARY KEY,
    zone_id VARCHAR(128) NOT NULL,
    deployment_identifier VARCHAR(128) NOT NULL,
    confluence_page_id VARCHAR(128),
    confluence_page_version INT,
    owner_account_id VARCHAR(128),
    status VARCHAR(64) NOT NULL DEFAULT 'active',
    metadata TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_deployments_zone (zone_id),
    INDEX idx_deployments_identifier (deployment_identifier)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  // Conditions table
  `CREATE TABLE IF NOT EXISTS conditions (
    id VARCHAR(128) PRIMARY KEY,
    deployment_id VARCHAR(128) NOT NULL,
    attribute_name VARCHAR(128) NOT NULL,
    attribute_value VARCHAR(255) NOT NULL,
    source_confluence_page_id VARCHAR(128),
    source_page_version INT,
    source_span_start INT,
    source_span_end INT,
    source_quoted_text TEXT,
    schema_version VARCHAR(32) NOT NULL DEFAULT '1.0',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_conditions_deployment (deployment_id),
    INDEX idx_conditions_attribute (attribute_name, attribute_value)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  // Evidence Revisions table
  `CREATE TABLE IF NOT EXISTS evidence_revisions (
    id VARCHAR(128) PRIMARY KEY,
    deployment_id VARCHAR(128) NOT NULL,
    evidence_type VARCHAR(64) NOT NULL,
    confluence_page_id VARCHAR(128),
    confluence_page_version INT,
    source_quoted_text TEXT,
    declared_scope TEXT NOT NULL,
    approved_by VARCHAR(128),
    approved_at VARCHAR(128),
    effective_from VARCHAR(128),
    recorded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(64) NOT NULL DEFAULT 'current',
    staleness_reason TEXT,
    metadata TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_evidence_deployment (deployment_id),
    INDEX idx_evidence_status (status)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  // Change Intents table
  `CREATE TABLE IF NOT EXISTS change_intents (
    id VARCHAR(128) PRIMARY KEY,
    jira_issue_id VARCHAR(128) NOT NULL,
    jira_issue_key VARCHAR(128) NOT NULL,
    site_id VARCHAR(128),
    zone_id VARCHAR(128),
    proposed_attribute VARCHAR(128),
    proposed_value VARCHAR(255),
    effective_date VARCHAR(128),
    source_quoted_text TEXT,
    content_fingerprint VARCHAR(128),
    discovery_status VARCHAR(64) NOT NULL DEFAULT 'candidate',
    llm_confidence DOUBLE,
    llm_reasoning TEXT,
    confirmed_by VARCHAR(128),
    confirmed_at TIMESTAMP NULL,
    dismissed_by VARCHAR(128),
    dismissed_at TIMESTAMP NULL,
    dismissal_reason TEXT,
    idempotency_key VARCHAR(128) UNIQUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_change_intents_jira (jira_issue_id),
    INDEX idx_change_intents_zone (zone_id),
    INDEX idx_change_intents_status (discovery_status)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  // Review Decisions table
  `CREATE TABLE IF NOT EXISTS review_decisions (
    id VARCHAR(128) PRIMARY KEY,
    change_intent_id VARCHAR(128) NOT NULL,
    deployment_id VARCHAR(128) NOT NULL,
    evidence_revision_id VARCHAR(128),
    coverage_result VARCHAR(64) NOT NULL,
    coverage_detail TEXT,
    reviewer_account_id VARCHAR(128),
    review_status VARCHAR(64) NOT NULL DEFAULT 'pending',
    followup_jira_issue_id VARCHAR(128),
    followup_jira_issue_key VARCHAR(128),
    followup_creation_status VARCHAR(64) NOT NULL DEFAULT 'not_created',
    followup_idempotency_key VARCHAR(128) UNIQUE,
    source_versions_at_review TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_review_change_intent (change_intent_id),
    INDEX idx_review_deployment (deployment_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  // Action Log table
  `CREATE TABLE IF NOT EXISTS action_log (
    id VARCHAR(128) PRIMARY KEY,
    action_type VARCHAR(64) NOT NULL,
    entity_type VARCHAR(64) NOT NULL,
    entity_id VARCHAR(128) NOT NULL,
    actor_account_id VARCHAR(128),
    detail TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_action_entity (entity_type, entity_id),
    INDEX idx_action_actor (actor_account_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  // App Config table
  `CREATE TABLE IF NOT EXISTS app_config (
    \`key\` VARCHAR(128) PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  // Source Versions table
  `CREATE TABLE IF NOT EXISTS source_versions (
    id VARCHAR(128) PRIMARY KEY,
    source_type VARCHAR(64) NOT NULL,
    source_id VARCHAR(128) NOT NULL,
    known_version INT NOT NULL,
    content_fingerprint VARCHAR(128) NOT NULL,
    last_checked_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(64) NOT NULL DEFAULT 'current',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_source_type_id (source_type, source_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
];

