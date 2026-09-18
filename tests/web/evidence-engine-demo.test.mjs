import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const componentPath = 'apps/web/components/marketing/evidence-engine-demo.tsx';

function collectFiles(dir) {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    return statSync(full).isDirectory() ? collectFiles(full) : [full];
  });
}

test('evidence engine communicates causality and supports reduced motion', () => {
  assert.equal(existsSync(componentPath), true, 'EvidenceEngineDemo is missing');
  const source = readFileSync(componentPath, 'utf8');

  for (const expected of [
    'useReducedMotion',
    'OpenAI',
    'Anthropic',
    'CSV',
    'Reading usage evidence',
    'Ranking supported opportunities',
    'Opportunity',
    'Tested',
    'Verified',
    'Synthetic walkthrough',
  ]) {
    assert.equal(source.includes(expected), true, `demo missing ${expected}`);
  }

  const oldImports = collectFiles('apps/web')
    .filter((path) => /\.(tsx?|jsx?)$/.test(path))
    .filter((path) => readFileSync(path, 'utf8').includes('container-scroll-animation'));

  assert.deepEqual(oldImports, []);
});
