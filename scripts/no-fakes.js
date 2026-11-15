#!/usr/bin/env node
/**
 * @file scripts/no-fakes.js
 * @description Scanner ensuring production source code and builds contain no fake flags,
 * simulated bridges, hardcoded benchmark fallbacks, or demo payloads.
 */

const fs = require('fs');
const path = require('path');

// Break strings up so the scanner file itself doesn't trigger false positives
const FORBIDDEN_WORDS = [
  ['FAC', '-1042'].join(''),
  ['AMR', '-12'].join(''),
  ['Page', ' 10482'].join(''),
  ['Page', ' 10483'].join(''),
  ['Hotel', ' Booking Agent'].join(''),
  ['mock', '-data'].join(''),
  ['__isStandalone', 'Dev'].join(''),
  ['fallback', 'Invoke'].join(''),
];

const FORBIDDEN_REGEXES = [
  /mockBridge/i,
  /fakeForge/i,
  /simulateForge/i,
  /isSimulated\s*=\s*true/i,
  /__FORGE_MOCK__/i,
];

const SCAN_DIRS = ['src', 'static/frontend/src', 'scripts'];
const BUILD_DIR = 'static/frontend/build';

let hasErrors = false;

function scanDir(dir) {
  const fullPath = path.resolve(__dirname, '..', dir);
  if (!fs.existsSync(fullPath)) return;

  const entries = fs.readdirSync(fullPath, { withFileTypes: true });

  for (const entry of entries) {
    const resPath = path.join(fullPath, entry.name);
    // Skip self
    if (resPath === __filename) continue;

    if (entry.isDirectory()) {
      scanDir(path.relative(path.resolve(__dirname, '..'), resPath));
    } else if (
      entry.isFile() &&
      (entry.name.endsWith('.ts') ||
        entry.name.endsWith('.tsx') ||
        entry.name.endsWith('.js') ||
        entry.name.endsWith('.jsx') ||
        entry.name.endsWith('.html'))
    ) {
      const content = fs.readFileSync(resPath, 'utf8');

      FORBIDDEN_WORDS.forEach((word) => {
        if (content.includes(word)) {
          console.error(`[NO-FAKES VIOLATION] ${resPath} contained forbidden test/benchmark fixture: "${word}"`);
          hasErrors = true;
        }
      });

      FORBIDDEN_REGEXES.forEach((pattern) => {
        if (pattern.test(content)) {
          console.error(`[NO-FAKES VIOLATION] ${resPath} matched forbidden fake/mock pattern: ${pattern}`);
          hasErrors = true;
        }
      });
    }
  }
}

console.log('[NO-FAKES] Scanning source directories: ' + SCAN_DIRS.join(', '));
for (const dir of SCAN_DIRS) {
  scanDir(dir);
}

if (fs.existsSync(path.resolve(__dirname, '..', BUILD_DIR))) {
  console.log('[NO-FAKES] Scanning build output directory: ' + BUILD_DIR);
  scanDir(BUILD_DIR);
}

if (hasErrors) {
  console.error('\n[NO-FAKES FAILED] Shipped production code contains forbidden fake/simulation flags or hardcoded benchmark fixtures!');
  process.exit(1);
} else {
  console.log('[NO-FAKES PASSED] Clean: 0 fake, simulation, or hardcoded benchmark patterns found.');
  process.exit(0);
}
