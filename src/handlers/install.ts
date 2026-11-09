/**
 * @module install
 * @description Handler for Forge app install and upgrade lifecycle triggers.
 * Automatically runs Forge SQL schema migrations on app install or upgrade.
 */

import { runMigrations } from '../db/migrations';

export async function onInstallOrUpgrade(event: any): Promise<void> {
  console.log('[ANDON Lifecycle] App install/upgrade triggered:', JSON.stringify(event));
  try {
    const result = await runMigrations();
    if (result.success) {
      console.log(`[ANDON Lifecycle] Applied ${result.appliedCount} DDL statements successfully.`);
    } else {
      console.error('[ANDON Lifecycle] Schema migration finished with errors:', result.errors);
    }
  } catch (err: any) {
    console.error('[ANDON Lifecycle] Failed to run migrations on install/upgrade:', err?.message || err);
  }
}

