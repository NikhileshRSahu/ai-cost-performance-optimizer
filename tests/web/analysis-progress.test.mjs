import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

const componentPath = 'apps/web/components/workbench/analysis-progress.tsx';
const loadingPath = 'apps/web/app/o/[organizationId]/loading.tsx';

test('analysis loading uses semantic stages without fake percentages', () => {
  assert.equal(existsSync(componentPath), true, 'AnalysisProgress is missing');
  const source = readFileSync(componentPath, 'utf8');
  const loading = readFileSync(loadingPath, 'utf8');

  for (const expected of [
    'Reading usage',
    'Normalizing evidence',
    'Finding waste',
    'Ranking supported opportunities',
    'useReducedMotion',
  ]) {
    assert.equal(
      source.includes(expected),
      true,
      `analysis progress missing ${expected}`,
    );
  }

  assert.equal(
    source.includes('%'),
    false,
    'analysis progress must not fake percentages',
  );
  assert.equal(loading.includes('AnalysisProgress'), true);
  assert.equal(loading.includes('role="status"'), true);
});
