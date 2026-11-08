/**
 * @fileoverview Complete synthetic data for the Aisle 7 floor-finish demonstration scenario.
 *
 * This fixture models the core ANDON use-case: a facilities maintenance ticket
 * (MAINT-1234) proposes changing the floor finish in Aisle 7 from matte epoxy
 * to high-gloss clear. AMR-12 was commissioned under the matte-epoxy condition,
 * so ANDON should discover a potential coverage gap.
 *
 * All IDs, page versions, and timestamps are deterministic so tests are
 * repeatable without external state.
 */

// ---------------------------------------------------------------------------
// Site & Zone
// ---------------------------------------------------------------------------

/** The top-level warehouse site record */
export const DEMO_SITE = {
  id: 'site-warehouse-alpha',
  name: 'Warehouse Alpha',
  confluence_page_id: 'conf-page-site-registry-001',
  confluence_page_version: 2,
  metadata: JSON.stringify({ location: 'Building 3, Industrial Park' }),
} as const;

/** The deployment zone within the warehouse */
export const DEMO_ZONE = {
  id: 'zone-aisle-7',
  site_id: 'site-warehouse-alpha',
  name: 'Aisle 7',
  zone_type: 'aisle',
  confluence_page_id: 'conf-page-aisle7-001',
  metadata: JSON.stringify({ length_m: 45, width_m: 3.5 }),
} as const;

// ---------------------------------------------------------------------------
// Deployment & Conditions
// ---------------------------------------------------------------------------

/** The active robot deployment in Aisle 7 */
export const DEMO_DEPLOYMENT = {
  id: 'deploy-amr-12',
  zone_id: 'zone-aisle-7',
  deployment_identifier: 'AMR-12',
  confluence_page_id: 'conf-page-amr12-commissioning',
  confluence_page_version: 3,
  owner_account_id: 'user-jane-smith',
  status: 'active',
  metadata: JSON.stringify({ robot_type: 'AMR', camera_config: 'C4' }),
} as const;

/** The condition that AMR-12 was commissioned against */
export const DEMO_CONDITION = {
  id: 'cond-surface-finish-aisle7',
  deployment_id: 'deploy-amr-12',
  attribute_name: 'surface_finish',
  attribute_value: 'matte_epoxy',
  source_confluence_page_id: 'conf-page-amr12-commissioning',
  source_page_version: 3,
  source_span_start: 245,
  source_span_end: 389,
  source_quoted_text:
    'Observed route/perception results apply to AMR-12, camera configuration C4, Aisle 7, existing matte epoxy finish.',
  schema_version: '1.0',
} as const;

// ---------------------------------------------------------------------------
// Evidence
// ---------------------------------------------------------------------------

/** The commissioning evidence linked to the deployment */
export const DEMO_EVIDENCE = {
  id: 'ev-commissioning-amr12-v3',
  deployment_id: 'deploy-amr-12',
  evidence_type: 'commissioning' as const,
  confluence_page_id: 'conf-page-amr12-commissioning',
  confluence_page_version: 3,
  source_quoted_text:
    'Commissioning test results for AMR-12 in Aisle 7 demonstrate acceptable route tracking ' +
    'and perception performance under the following conditions: surface_finish = matte_epoxy, ' +
    'lighting_type = standard_warehouse_led, camera_config = C4.',
  declared_scope: JSON.stringify({
    conditions: [
      { attribute_name: 'surface_finish', attribute_value: 'matte_epoxy' },
      { attribute_name: 'lighting_type', attribute_value: 'standard_warehouse_led' },
    ],
    configuration_id: 'C4',
    zone_id: 'zone-aisle-7',
  }),
  approved_by: 'user-jane-smith',
  approved_at: '2026-08-15T10:30:00Z',
  effective_from: '2026-08-15T00:00:00Z',
  recorded_at: '2026-08-15T10:30:00Z',
  status: 'current' as const,
  staleness_reason: null,
  metadata: JSON.stringify({ test_plan_page: 'conf-page-test-plan-amr12' }),
} as const;

// ---------------------------------------------------------------------------
// Jira Issue (facilities ticket)
// ---------------------------------------------------------------------------

/** The maintenance ticket that triggers discovery */
export const DEMO_JIRA_ISSUE = {
  id: 'issue-maint-1234',
  key: 'MAINT-1234',
  fields: {
    summary: 'Apply high-gloss clear finish to Aisle 7 next Saturday',
    description:
      'The facilities team will apply a high-gloss clear finish to the floor of Aisle 7 ' +
      'this coming Saturday during the maintenance window. This is part of the Q4 floor ' +
      'maintenance program. The current matte epoxy surface is showing wear in the main ' +
      'traffic areas.',
    status: { name: 'To Do' },
    issuetype: { name: 'Task' },
    project: { key: 'MAINT', name: 'Facilities Maintenance' },
    created: '2026-11-05T09:00:00Z',
    updated: '2026-11-05T09:00:00Z',
  },
} as const;

// ---------------------------------------------------------------------------
// Confluence Pages
// ---------------------------------------------------------------------------

/** Simulated Confluence page bodies for mock API responses */
export const DEMO_CONFLUENCE_PAGES = {
  siteRegistry: {
    id: 'conf-page-site-registry-001',
    title: 'Warehouse Alpha - Site Registry',
    version: 2,
    body:
      'This page documents all active deployments in Warehouse Alpha.\n\n' +
      'Active Zones:\n' +
      '- Aisle 7: AMR-12 deployment (see Commissioning Record)\n' +
      '- Aisle 12: AMR-15 deployment\n' +
      '- Bay 3: Palletizer P-01\n\n' +
      'Site contacts: facilities@warehouse.example.com',
  },
  commissioning: {
    id: 'conf-page-amr12-commissioning',
    title: 'AMR-12 Commissioning Record',
    version: 3,
    body:
      'AMR-12 Commissioning Record\n\n' +
      'Deployment: AMR-12\n' +
      'Zone: Aisle 7, Warehouse Alpha\n' +
      'Camera Configuration: C4\n\n' +
      'Observed route/perception results apply to AMR-12, camera configuration C4, ' +
      'Aisle 7, existing matte epoxy finish.\n\n' +
      'Test Date: 2026-08-15\n' +
      'Tester: Jane Smith\n' +
      'Result: PASS - All route waypoints reached within tolerance.\n\n' +
      'Conditions at time of test:\n' +
      '- Floor surface: Matte epoxy (standard warehouse grade)\n' +
      '- Lighting: Standard warehouse LED overhead\n' +
      '- Temperature: 22°C\n' +
      '- Traffic: Normal operations paused for test window',
  },
  testPlan: {
    id: 'conf-page-test-plan-amr12',
    title: 'AMR-12 Test Plan',
    version: 1,
    body:
      'AMR-12 Test Plan\n\n' +
      'Procedures:\n' +
      '1. Surface-condition review: Visual inspection and documentation of any floor ' +
      'surface changes in the deployment zone. Compare current condition against commissioning baseline.\n' +
      '2. Route/perception verification: Run standard route waypoint test with current ' +
      'camera configuration. Record perception confidence scores at each waypoint.\n' +
      '3. Environmental assessment: Document lighting, temperature, and any obstructions.\n\n' +
      'Owner: Jane Smith\n' +
      'Review frequency: After any reported environmental change or annually.',
  },
} as const;

// ---------------------------------------------------------------------------
// Teamwork Graph Context
// ---------------------------------------------------------------------------

/** Simulated Teamwork Graph query result */
export const DEMO_GRAPH_CONTEXT = {
  site_page_id: 'conf-page-site-registry-001',
  linked_pages: [
    { page_id: 'conf-page-aisle7-001', title: 'Aisle 7 Zone Details', page_type: 'zone' },
    {
      page_id: 'conf-page-amr12-commissioning',
      title: 'AMR-12 Commissioning Record',
      page_type: 'commissioning',
    },
    {
      page_id: 'conf-page-test-plan-amr12',
      title: 'AMR-12 Test Plan',
      page_type: 'test_plan',
    },
  ],
  page_owners: [
    {
      page_id: 'conf-page-amr12-commissioning',
      owner_account_id: 'user-jane-smith',
      owner_display_name: 'Jane Smith',
    },
    {
      page_id: 'conf-page-test-plan-amr12',
      owner_account_id: 'user-jane-smith',
      owner_display_name: 'Jane Smith',
    },
  ],
} as const;

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

/** Well-known user identities used across the demo scenario */
export const DEMO_USERS = {
  facilitiesCoordinator: { accountId: 'user-bob-wilson', displayName: 'Bob Wilson' },
  roboticsEngineer: { accountId: 'user-jane-smith', displayName: 'Jane Smith' },
  restrictedUser: { accountId: 'user-restricted-01', displayName: 'Restricted User' },
} as const;
