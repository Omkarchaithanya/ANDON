const fs = require('fs');
const path = require('path');

console.log('[CI Secret Scan] Auditing codebase for hardcoded credentials, secrets, and auth tokens...');

const secretPatterns = [
  /-----BEGIN (?:RSA |EC )?PRIVATE KEY-----/,
  /ghp_[0-9a-zA-Z]{36}/,
  /xox[baprs]-[0-9a-zA-Z]{10,48}/,
  /eyJ[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*/, // JWT
  /(?:api[_-]?key|secret|password|auth[_-]?token)\s*[:=]\s*['"][a-zA-Z0-9_\-]{16,}['"]/i
];

const ignoredDirs = ['node_modules', '.git', 'dist', 'build', '.idea', '.vscode'];
let violationCount = 0;

function scanDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!ignoredDirs.includes(entry.name)) {
        scanDir(fullPath);
      }
    } else if (entry.isFile()) {
      // Exclude tests, documentation, binary, and lockfiles
      if (
        fullPath.endsWith('.md') ||
        fullPath.endsWith('.json') ||
        fullPath.endsWith('.lock') ||
        fullPath.includes('test') ||
        fullPath.endsWith('.png') ||
        fullPath.endsWith('.jpg') ||
        fullPath.endsWith('.svg')
      ) {
        continue;
      }

      const content = fs.readFileSync(fullPath, 'utf8');
      for (const pattern of secretPatterns) {
        if (pattern.test(content)) {
          console.error(`[SECRET VIOLATION] Potential secret matched ${pattern} in ${fullPath}`);
          violationCount++;
        }
      }
    }
  }
}

scanDir(path.resolve(__dirname, '..'));

if (violationCount > 0) {
  console.error(`[CI FAILED] Found ${violationCount} potential secret leaks!`);
  process.exit(1);
} else {
  console.log('✓ Secret scan clean: 0 hardcoded credentials or private keys detected.');
  process.exit(0);
}

