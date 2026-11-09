#!/usr/bin/env node
/**
 * @file scripts/no-fakes.js
 * @description Scanner ensuring production source code contains no fake flags,
 * simulated bridges, or hardcoded benchmark fallbacks in production paths.
 */

const fs = require('fs');
const path = require('path');

const FORBIDDEN_PATTERNS = [
  /mockBridge/i,
  /fakeForge/i,
  /simulateForge/i,
  /isSimulated\s*=\s*true/i,
  /__FORGE_MOCK__/i,
];

const SCAN_DIRS = ['src'];

let hasErrors = false;

function scanDir(dir) {
  const fullPath = path.resolve(__dirname, '..', dir);
  if (!fs.existsSync(fullPath)) return;

  const entries = fs.readdirSync(fullPath, { withFileTypes: true });

  for (const entry of entries) {
    const resPath = path.join(fullPath, entry.name);
    if (entry.isDirectory()) {
      scanDir(path.relative(path.resolve(__dirname, '..'), resPath));
    } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.js'))) {
      const content = fs.readFileSync(resPath, 'utf8');
      FORBIDDEN_PATTERNS.forEach((pattern) => {
        if (pattern.test(content)) {
          console.error(`[NO-FAKES VIOLATION] ${resPath} matched forbidden pattern: ${pattern}`);
          hasErrors = true;
        }
      });
    }
  }
}

for (const dir of SCAN_DIRS) {
  scanDir(dir);
}

if (hasErrors) {
  console.error('[NO-FAKES] Shipped production code contains forbidden fake/simulation flags!');
  process.exit(1);
} else {
  console.log('[NO-FAKES] Clean: 0 fake or simulation patterns found in production code.');
  process.exit(0);
}
