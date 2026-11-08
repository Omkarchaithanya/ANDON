/**
 * @module negative-cases
 * @description Negative test fixtures where ANDON should NOT propose relationships, should return UNKNOWN, or reject changes.
 */

// 1. Similarly named zones on DIFFERENT sites
export const WRONG_SITE_CASE = {
  jiraIssue: {
    id: 'issue-maint-5555',
    key: 'MAINT-5555',
    summary: 'Apply high-gloss clear finish to Aisle 7 at Warehouse Gamma next Saturday',
    description: 'Work scheduled at our new facility Warehouse Gamma, Aisle 7.',
  },
  expected: {
    relationshipFound: false,
    reason: 'Site mismatch: Warehouse Gamma does not match configured site Warehouse Alpha.',
  },
};

// 2. Negated change in ticket text
export const NEGATED_CHANGE_CASE = {
  jiraIssue: {
    id: 'issue-maint-6666',
    key: 'MAINT-6666',
    summary: 'Cancel floor coating: Do NOT apply high-gloss finish to Aisle 7',
    description: 'Previous plan cancelled. Floor coating will not proceed in Aisle 7.',
  },
  expected: {
    hasChange: false,
    candidateCreated: false,
  },
};

// 3. Cancelled Jira ticket
export const CANCELLED_TICKET_CASE = {
  jiraIssue: {
    id: 'issue-maint-7777',
    key: 'MAINT-7777',
    summary: 'Apply high-gloss finish to Aisle 7',
    status: { name: 'Cancelled' },
  },
  expected: {
    skipAnalysis: true,
  },
};

// 4. Cosmetic change with no documented dependency (painting a wall, not floor)
export const COSMETIC_NO_DEPENDENCY_CASE = {
  jiraIssue: {
    id: 'issue-maint-8888',
    key: 'MAINT-8888',
    summary: 'Repaint safety warning lines on north brick wall in Aisle 7',
    description: 'Fresh yellow paint on north retaining wall brick surface.',
  },
  expected: {
    touchesCondition: false,
    candidateCreated: false,
  },
};

// 5. Missing specification (finish type omitted) -> UNKNOWN
export const MISSING_SPECIFICATION_CASE = {
  jiraIssue: {
    id: 'issue-maint-9999',
    key: 'MAINT-9999',
    summary: 'Perform floor maintenance in Aisle 7 next weekend',
    description: 'Floor team will treat surface in Aisle 7. Specific coating product TBD.',
  },
  expected: {
    attributeIdentified: 'surface_finish',
    valueIdentified: null,
    coverageResult: 'unknown',
    message: 'Missing specification: coating product not specified.',
  },
};

// 6. Alternative accepted evidence exists covering both finishes
export const ALTERNATIVE_EVIDENCE_CASE = {
  proposedCondition: {
    attribute_name: 'surface_finish',
    proposed_value: 'high_gloss_clear_finish',
  },
  equivalenceEvidence: {
    id: 'ev-equiv-amr12-001',
    deployment_id: 'deploy-amr-12',
    evidence_type: 'equivalence',
    declared_scope: {
      conditions: [
        { attribute_name: 'surface_finish', attribute_value: 'matte_epoxy' },
        { attribute_name: 'surface_finish', attribute_value: 'high_gloss_clear_finish' },
      ],
    },
    status: 'current',
  },
  expected: {
    coverageResult: 'alternative_path',
  },
};

// 7. Restricted source page
export const RESTRICTED_PAGE_CASE = {
  pageId: 'conf-page-private-vault',
  userHasAccess: false,
  expected: {
    leakContent: false,
    placeholder: '[Restricted document: You do not have permission to view this Confluence page]',
  },
};

