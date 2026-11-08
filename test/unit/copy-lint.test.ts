/**
 * @file test/unit/copy-lint.test.ts
 * @description Regression test ensuring no forbidden claims, fake risk language,
 * or fabricated procedures exist in frontend source files or test fixtures.
 */

import * as fs from 'fs';
import * as path from 'path';

const FORBIDDEN_PHRASES = [
  'localized emergency stops',
  'specular glare',
  'specular reflection',
  'braking distance',
  'floor friction',
  'friction co-efficient',
  'the robot will fail',
  'the floor is unsafe',
  'the deployment is now illegal',
  'SOP-ROBOT-04',
  'SOP-ROBOT-11',
  'Confidence: 94%',
  'Confidence: 9',
  'CODEGEIST 2026',
];

function getFilesRecursively(dir: string, extensions: string[]): string[] {
  let results: string[] = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.git' && file !== 'dist' && file !== 'build') {
        results = results.concat(getFilesRecursively(filePath, extensions));
      }
    } else {
      if (extensions.some((ext) => file.endsWith(ext))) {
        results.push(filePath);
      }
    }
  }
  return results;
}

describe('Copy-Lint & Integrity Denylist Test', () => {
  const targetDir = path.resolve(__dirname, '../../static/frontend/src');
  const files = getFilesRecursively(targetDir, ['.ts', '.tsx', '.html']);

  test('target files exist for linting', () => {
    expect(files.length).toBeGreaterThan(0);
  });

  files.forEach((filePath) => {
    const relPath = path.relative(path.resolve(__dirname, '../..'), filePath);
    test(`File ${relPath} contains no forbidden claims`, () => {
      const content = fs.readFileSync(filePath, 'utf-8');
      for (const phrase of FORBIDDEN_PHRASES) {
        const found = content.toLowerCase().includes(phrase.toLowerCase());
        expect({ file: relPath, forbiddenPhrase: phrase, found }).toEqual({
          file: relPath,
          forbiddenPhrase: phrase,
          found: false,
        });
      }
    });
  });
});
