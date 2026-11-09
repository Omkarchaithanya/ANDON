// Enforce supported LTS: 22.x (>=22.23.4) or 24.x (>=24.0.0) per Atlassian Forge documentation
const semverMajor = parseInt(process.versions.node.split('.')[0], 10);
const semverMinor = parseInt(process.versions.node.split('.')[1], 10);
const semverPatch = parseInt(process.versions.node.split('.')[2], 10);

console.log(`[CI Node Version Check] Current Node.js version: v${process.versions.node}`);

if (semverMajor < 22) {
  console.error(`[ERROR] Node.js version ${process.versions.node} is not supported by Forge. Minimum is 22.23.4.`);
  process.exit(1);
}

if (semverMajor === 22 && (semverMinor < 23 || (semverMinor === 23 && semverPatch < 4))) {
  console.error(`[ERROR] Node.js 22.x must be >= 22.23.4. Current: ${process.versions.node}`);
  process.exit(1);
}

console.log('✓ Node.js version satisfies Atlassian Forge supported LTS requirements (>=22.23.4).');
process.exit(0);

