/**
 * @module demo/import-synthetic-demo
 * @description Standalone import script to populate synthetic demonstration records into an evaluation environment.
 *
 * CRITICAL SEPARATION NOTICE:
 * This script is completely separate from production resolvers, runtime startup, and database migrations.
 * A fresh production installation never runs this script.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as repository from '../src/db/repository';
import { ActionType, DeploymentStatus, EvidenceStatus, EvidenceType, SourceType, ZoneType } from '../src/models/enums';

export async function importSyntheticDemo(): Promise<{ success: boolean; message: string; recordIds: Record<string, string> }> {
  const jsonPath = path.resolve(__dirname, 'synthetic-scenario.json');
  const demoData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

  // 1. Create Synthetic Site
  const site = await repository.insertSite({
    name: demoData.site.name,
    confluence_page_id: demoData.site.confluence_page_id,
    confluence_page_version: 1,
    metadata: demoData.site.metadata,
  });

  // 2. Create Synthetic Zone
  const zone = await repository.insertZone({
    site_id: site.id,
    name: demoData.zone.name,
    zone_type: ZoneType.AISLE,
    confluence_page_id: demoData.site.confluence_page_id,
    metadata: demoData.zone.metadata,
  });

  // 3. Create Synthetic Deployment
  const deployment = await repository.insertDeployment({
    zone_id: zone.id,
    deployment_identifier: demoData.deployment.deployment_identifier,
    confluence_page_id: demoData.deployment.confluence_page_id,
    confluence_page_version: demoData.deployment.confluence_page_version,
    owner_account_id: demoData.deployment.owner_account_id,
    status: DeploymentStatus.ACTIVE,
    metadata: demoData.deployment.metadata,
  });

  // 4. Create Synthetic Baseline Condition
  const condition = await repository.insertCondition({
    deployment_id: deployment.id,
    attribute_name: demoData.condition.attribute_name,
    attribute_value: demoData.condition.attribute_value,
    source_confluence_page_id: demoData.condition.source_confluence_page_id,
    source_page_version: demoData.condition.source_page_version,
    source_quoted_text: demoData.condition.source_quoted_text,
    schema_version: '1.0',
  });

  // 5. Create Synthetic Commissioning Evidence Revision
  const evidence = await repository.insertEvidenceRevision({
    deployment_id: deployment.id,
    evidence_type: EvidenceType.COMMISSIONING,
    confluence_page_id: demoData.deployment.confluence_page_id,
    confluence_page_version: demoData.deployment.confluence_page_version,
    source_quoted_text: demoData.evidence.source_quoted_text,
    declared_scope: {
      ...demoData.evidence.declared_scope,
      zone_id: zone.id,
    },
    approved_by: demoData.deployment.owner_account_id,
    approved_at: new Date().toISOString(),
    status: EvidenceStatus.CURRENT,
    metadata: demoData.evidence.metadata,
  });

  // 6. Set app configuration to link this site registry
  await repository.setAppConfig('SITE_REGISTRY_PAGE_ID', demoData.site.confluence_page_id);

  // 7. Track source versions
  await repository.upsertSourceVersion(
    SourceType.CONFLUENCE_PAGE,
    demoData.site.confluence_page_id,
    '1'
  );
  await repository.upsertSourceVersion(
    SourceType.CONFLUENCE_PAGE,
    demoData.deployment.confluence_page_id,
    String(demoData.deployment.confluence_page_version)
  );

  await repository.insertAuditLog({
    action_type: ActionType.CONFIG_UPDATED,
    entity_type: 'demo_import',
    entity_id: deployment.id,
    actor_account_id: 'system:developer-import',
    detail: { notice: demoData.notice },
  });

  return {
    success: true,
    message: 'Synthetic demonstration scenario imported into test environment.',
    recordIds: {
      siteId: site.id,
      zoneId: zone.id,
      deploymentId: deployment.id,
      conditionId: condition.id,
      evidenceId: evidence.id,
    },
  };
}

if (require.main === module) {
  importSyntheticDemo()
    .then((res) => {
      console.log('Demo import finished:', res);
      process.exit(0);
    })
    .catch((err) => {
      console.error('Demo import failed:', err);
      process.exit(1);
    });
}

