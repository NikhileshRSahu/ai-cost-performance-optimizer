import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const page = readFileSync('apps/web/app/o/[organizationId]/page.tsx', 'utf8');
const card = readFileSync('apps/web/components/recommendation-card.tsx', 'utf8');

test('direct answer remains dominant and evidence depth stays secondary', () => {
  assert.equal(page.includes('Spend analyzed'), true);
  assert.equal(
    page.includes('See why') || page.includes('See details'),
    true,
    'details disclosure missing',
  );

  const resultIndex = page.indexOf('data-testid="direct-answer-result"');
  const detailsIndex = page.indexOf('data-testid="analysis-details"');
  const mriIndex = page.indexOf('<WorkMri');

  assert.ok(resultIndex >= 0, 'direct result is missing');
  assert.ok(detailsIndex > resultIndex, 'details must follow direct result');
  assert.ok(mriIndex > detailsIndex, 'Work MRI must remain inside secondary details');
  assert.equal(card.includes('Test this optimization'), true);
});
