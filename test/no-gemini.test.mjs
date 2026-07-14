// Security regression test: this repo's Gemini/AI integration (and the
// hardcoded API key that shipped with it) must never come back.
//
// Run with: node --test test/no-gemini.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const selfRelativePath = path.relative(repoRoot, fileURLToPath(import.meta.url));
const selfTestCommand = `node --test ${selfRelativePath}`;

function trackedFiles() {
  return execSync('git ls-files', { cwd: repoRoot, encoding: 'utf8' })
    .split('\n')
    .filter(Boolean);
}

// Patterns that must never appear in tracked source again. This intentionally
// matches on the *shape* of a Google API key rather than embedding the real
// secret, so this test never needs to hold the credential itself.
const FORBIDDEN_PATTERNS = [
  { name: '@google/genai package', re: /@google\/genai/i },
  { name: 'GoogleGenAI SDK usage', re: /GoogleGenAI/ },
  { name: 'gemini storage key / references', re: /gemini/i },
  { name: 'Google API key shape', re: /AIzaSy[A-Za-z0-9_-]{10,}/ },
];

const FORBIDDEN_PATHS = [
  'setup.ts',
  'setup.js',
  'services/geminiService.ts',
  'services/geminiService.js',
  'content_script_bundle.js',
];

test('Gemini/AI setup files are removed from the repository', () => {
  const files = trackedFiles();
  for (const forbidden of FORBIDDEN_PATHS) {
    assert.ok(
      !files.includes(forbidden),
      `expected "${forbidden}" to be removed from tracked files`
    );
  }
});

test('no tracked file contains Gemini/AI integration references or an API key', () => {
  const files = trackedFiles().filter((f) => f !== selfRelativePath);
  const offenders = [];

  for (const file of files) {
    const full = path.join(repoRoot, file);
    let stat;
    try {
      stat = statSync(full);
    } catch {
      continue;
    }
    if (!stat.isFile()) continue;

    let content;
    try {
      content = readFileSync(full, 'utf8');
    } catch {
      continue; // binary file, not a text reference
    }

    if (file === 'package.json') {
      const pkg = JSON.parse(content);
      if (pkg.scripts?.test === selfTestCommand) {
        pkg.scripts.test = '';
        content = JSON.stringify(pkg);
      }
    }

    for (const { name, re } of FORBIDDEN_PATTERNS) {
      if (re.test(content)) {
        offenders.push(`${file} (${name})`);
        break;
      }
    }
  }

  assert.deepEqual(offenders, [], `found forbidden references in: ${offenders.join(', ')}`);
});

test('package.json does not depend on @google/genai', () => {
  const pkg = JSON.parse(readFileSync(path.join(repoRoot, 'package.json'), 'utf8'));
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };
  assert.ok(!('@google/genai' in deps), 'expected @google/genai dependency to be removed');
});
