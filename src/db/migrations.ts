/**
 * @module migrations
 * @description Schema migration runner applying Forge SQL DDL statements.
 * Uses chained migrationRunner.enqueue(...).run() without runtime fs.readFileSync or sql.executeDDL fallback.
 */

import { migrationRunner } from '@forge/sql';
import { DDL_STATEMENTS, SCHEMA_VERSION } from './schema';

/**
 * Applies database DDL statements using chained migrationRunner.enqueue(...).run().
 * Called ONLY from the install and upgrade trigger handlers.
 */
export async function runMigrations(): Promise<{ success: boolean; appliedCount: number; errors: string[] }> {
  try {
    let runner = migrationRunner;
    for (let i = 0; i < DDL_STATEMENTS.length; i++) {
      const stepName = `${SCHEMA_VERSION}_step_${i + 1}`;
      runner = runner.enqueue(stepName, DDL_STATEMENTS[i]);
    }
    const applied = await runner.run();
    return {
      success: true,
      appliedCount: applied ? applied.length : DDL_STATEMENTS.length,
      errors: [],
    };
  } catch (err: any) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('[ANDON Migration Error]', errorMsg);
    return {
      success: false,
      appliedCount: 0,
      errors: [errorMsg],
    };
  }
}
