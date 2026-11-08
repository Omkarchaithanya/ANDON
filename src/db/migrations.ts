/**
 * @module migrations
 * @description Schema migration runner applying Forge SQL DDL statements sequentially.
 */

import { sql } from '@forge/sql';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Applies database DDL statements one by one.
 */
export async function runMigrations(): Promise<{ success: boolean; appliedCount: number; errors: string[] }> {
  const schemaPath = path.resolve(__dirname, 'schema.sql');
  let ddlContent = '';

  try {
    ddlContent = fs.readFileSync(schemaPath, 'utf8');
  } catch (err: any) {
    return {
      success: false,
      appliedCount: 0,
      errors: [`Failed to read schema.sql: ${err.message}`],
    };
  }

  // Split on semicolons, ignoring comments and whitespace
  const rawStatements = ddlContent
    .split(';')
    .map(stmt => stmt.trim())
    .filter(stmt => {
      if (!stmt) return false;
      const stripped = stmt.replace(/--.*$/gm, '').trim();
      return stripped.length > 0;
    });

  let appliedCount = 0;
  const errors: string[] = [];

  for (const statement of rawStatements) {
    try {
      await (sql as any).executeDDL(statement);
      appliedCount++;
    } catch (err: any) {
      // In SQLite, table already exists or index already exists is safe to pass if IF NOT EXISTS was used
      if (err.message && err.message.includes('already exists')) {
        appliedCount++;
      } else {
        errors.push(`Error executing statement [${statement.substring(0, 40)}...]: ${err.message}`);
      }
    }
  }

  return {
    success: errors.length === 0,
    appliedCount,
    errors,
  };
}

