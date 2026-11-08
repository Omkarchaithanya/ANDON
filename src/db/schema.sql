-- ============================================================================
-- ANDON: Forge SQL DDL Schema (SQLite Compatible)
-- ============================================================================

-- Sites (Physical facilities/warehouses)
CREATE TABLE IF NOT EXISTS sites (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    confluence_page_id TEXT,
    confluence_page_version INTEGER,
    metadata TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_sites_confluence ON sites(confluence_page_id);

-- Zones (Sub-areas: aisles, bays, cells)
CREATE TABLE IF NOT EXISTS zones (
    id TEXT PRIMARY KEY,
    site_id TEXT NOT NULL,
    name TEXT NOT NULL,
    zone_type TEXT NOT NULL CHECK (zone_type IN ('aisle', 'bay', 'cell')),
    confluence_page_id TEXT,
    metadata TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_zones_site ON zones(site_id);
CREATE INDEX IF NOT EXISTS idx_zones_name ON zones(name);

-- Deployments (Active mobile robots / AMR installations)
CREATE TABLE IF NOT EXISTS deployments (
    id TEXT PRIMARY KEY,
    zone_id TEXT NOT NULL,
    deployment_identifier TEXT NOT NULL,
    confluence_page_id TEXT,
    confluence_page_version INTEGER,
    owner_account_id TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'decommissioned', 'suspended')),
    metadata TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_deployments_zone ON deployments(zone_id);
CREATE INDEX IF NOT EXISTS idx_deployments_identifier ON deployments(deployment_identifier);

-- Conditions (Documented operating conditions & assumptions)
CREATE TABLE IF NOT EXISTS conditions (
    id TEXT PRIMARY KEY,
    deployment_id TEXT NOT NULL,
    attribute_name TEXT NOT NULL,
    attribute_value TEXT NOT NULL,
    source_confluence_page_id TEXT,
    source_page_version INTEGER,
    source_span_start INTEGER,
    source_span_end INTEGER,
    source_quoted_text TEXT,
    schema_version TEXT NOT NULL DEFAULT '1.0',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_conditions_deployment ON conditions(deployment_id);
CREATE INDEX IF NOT EXISTS idx_conditions_attribute ON conditions(attribute_name, attribute_value);

-- Evidence Revisions (Formal commissioning tests and equivalence records)
CREATE TABLE IF NOT EXISTS evidence_revisions (
    id TEXT PRIMARY KEY,
    deployment_id TEXT NOT NULL,
    evidence_type TEXT NOT NULL CHECK (evidence_type IN ('commissioning', 'test_result', 'equivalence')),
    confluence_page_id TEXT,
    confluence_page_version INTEGER,
    source_quoted_text TEXT,
    declared_scope TEXT NOT NULL,
    approved_by TEXT,
    approved_at TEXT,
    effective_from TEXT,
    recorded_at TEXT NOT NULL DEFAULT (datetime('now')),
    status TEXT NOT NULL DEFAULT 'current' CHECK (status IN ('current', 'stale', 'superseded')),
    staleness_reason TEXT,
    metadata TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_evidence_deployment ON evidence_revisions(deployment_id);
CREATE INDEX IF NOT EXISTS idx_evidence_status ON evidence_revisions(status);

-- Change Intents (Discovered physical changes from Jira tickets)
CREATE TABLE IF NOT EXISTS change_intents (
    id TEXT PRIMARY KEY,
    jira_issue_id TEXT NOT NULL,
    jira_issue_key TEXT NOT NULL,
    site_id TEXT,
    zone_id TEXT,
    proposed_attribute TEXT,
    proposed_value TEXT,
    effective_date TEXT,
    source_quoted_text TEXT,
    content_fingerprint TEXT,
    discovery_status TEXT NOT NULL DEFAULT 'candidate' CHECK (discovery_status IN ('candidate', 'confirmed', 'dismissed', 'stale', 'unknown')),
    llm_confidence REAL,
    llm_reasoning TEXT,
    confirmed_by TEXT,
    confirmed_at TEXT,
    dismissed_by TEXT,
    dismissed_at TEXT,
    dismissal_reason TEXT,
    idempotency_key TEXT UNIQUE,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_change_intents_issue ON change_intents(jira_issue_id);
CREATE INDEX IF NOT EXISTS idx_change_intents_status ON change_intents(discovery_status);
CREATE INDEX IF NOT EXISTS idx_change_intents_zone ON change_intents(zone_id);
CREATE INDEX IF NOT EXISTS idx_change_intents_fingerprint ON change_intents(content_fingerprint);

-- Review Decisions (Evaluated coverage gap and follow-up state)
CREATE TABLE IF NOT EXISTS review_decisions (
    id TEXT PRIMARY KEY,
    change_intent_id TEXT NOT NULL,
    deployment_id TEXT NOT NULL,
    evidence_revision_id TEXT,
    coverage_result TEXT NOT NULL CHECK (coverage_result IN ('gap', 'covered', 'unknown', 'alternative_path')),
    coverage_detail TEXT,
    reviewer_account_id TEXT,
    review_status TEXT NOT NULL DEFAULT 'pending' CHECK (review_status IN ('pending', 'confirmed_gap', 'confirmed_covered', 'outcome_uncertain', 'stale')),
    followup_jira_issue_id TEXT,
    followup_jira_issue_key TEXT,
    followup_creation_status TEXT DEFAULT 'not_started' CHECK (followup_creation_status IN ('not_started', 'pending', 'created', 'failed', 'uncertain')),
    followup_idempotency_key TEXT UNIQUE,
    source_versions_at_review TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_review_change ON review_decisions(change_intent_id);
CREATE INDEX IF NOT EXISTS idx_review_deployment ON review_decisions(deployment_id);
CREATE INDEX IF NOT EXISTS idx_review_status ON review_decisions(review_status);

-- Action Log (Immutable audit trail)
CREATE TABLE IF NOT EXISTS action_log (
    id TEXT PRIMARY KEY,
    action_type TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    actor_account_id TEXT NOT NULL,
    detail TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_action_entity ON action_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_action_type ON action_log(action_type);

-- App Config (Key-value settings)
CREATE TABLE IF NOT EXISTS app_config (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Source Versions (Document tracking and staleness anchors)
CREATE TABLE IF NOT EXISTS source_versions (
    id TEXT PRIMARY KEY,
    source_type TEXT NOT NULL CHECK (source_type IN ('confluence_page', 'jira_issue')),
    source_id TEXT NOT NULL,
    known_version TEXT,
    content_fingerprint TEXT,
    last_checked_at TEXT NOT NULL DEFAULT (datetime('now')),
    status TEXT NOT NULL DEFAULT 'current' CHECK (status IN ('current', 'stale', 'deleted')),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(source_type, source_id)
);
CREATE INDEX IF NOT EXISTS idx_source_versions_lookup ON source_versions(source_type, source_id);

