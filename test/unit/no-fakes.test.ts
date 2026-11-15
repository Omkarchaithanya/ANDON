import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

describe('scripts/no-fakes.js scanner verification', () => {
  it('exits with code 0 on the clean codebase', () => {
    const output = execSync('node scripts/no-fakes.js', {
      encoding: 'utf8',
      cwd: path.resolve(__dirname, '../..'),
    });
    expect(output).toContain('[NO-FAKES PASSED]');
  });

  it('fails with exit code 1 when a forbidden fake/demo pattern is detected in src', () => {
    const tempFile = path.resolve(__dirname, '../../src/temp-violation.ts');
    try {
      // Write forbidden mock bridge pattern
      fs.writeFileSync(tempFile, 'const test = "mockBridge";\n', 'utf8');

      let failed = false;
      try {
        execSync('node scripts/no-fakes.js', {
          encoding: 'utf8',
          cwd: path.resolve(__dirname, '../..'),
          stdio: 'pipe',
        });
      } catch (err: any) {
        failed = true;
        expect(err.status).toBe(1);
      }
      expect(failed).toBe(true);
    } finally {
      if (fs.existsSync(tempFile)) {
        fs.unlinkSync(tempFile);
      }
    }
  });
});
