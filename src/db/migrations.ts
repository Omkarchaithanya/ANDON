/**
 * @module migrations
 * @description Schema migration runner applying Forge SQL DDL statements.
 * Uses official Forge SQL migrationRunner without runtime fs.readFileSync.
 */

import { sql, migrationRunner } from '@forge/sql';
import { DDL_STATEMENTS, SCHEMA_VERSION } from './schema';

/**
 * Applies database DDL statements sequentially to Forge SQL (MySQL/TiDB backend).
 */
export async function runMigrations(): Promise<{ success: boolean; appliedCount: number; errors: string[] }> {
  let appliedCount = 0;
  const errors: string[] = [];

  // Try official migrationRunner enqueue first if available
  if (typeof (migrationRunner as any)?.enqueue === 'function') {
    try {
      for (let i = 0; i < DDL_STATEMENTS.length; i++) {
        const stmt = DDL_STATEMENTS[i];
        const stepName = `${SCHEMA_VERSION}_step_${i + 1}`;
        await (migrationRunner as any).enqueue(stepName, stmt);
        appliedCount++;
      }
      return { success: true, appliedCount, errors: [] };
    } catch (enqueueErr: any) {
      // Fall through to direct DDL execution if enqueue not available in this context
      console.warn('[ANDON Migration] migrationRunner.enqueue fallback to direct DDL:', enqueueErr?.message);
    }
  }

  // Direct DDL execution via sql.executeDDL / sql.prepare
  for (const statement of DDL_STATEMENTS) {
    try {
      if (typeof (sql as any).executeDDL === 'function') {
        await (sql as any).executeDDL(statement);
      } else if (typeof (sql as any).prepare === 'function') {
        await (sql as any).prepare(statement).execute();
      }
      appliedCount++;
    } catch (err: any) {
      if (err.message && (err.message.includes('already exists') || err.message.includes('Duplicate'))) {
        appliedCount++;
      } else {
        errors.push(`Error executing DDL statement: ${err.message}`);
      }
    }
  }

  return {
    success: errors.length === 0,
    appliedCount,
    errors,
  };
}
