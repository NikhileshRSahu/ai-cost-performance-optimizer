import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

const cardPath = 'apps/web/components/workbench/source-choice-card.tsx';
const pagePath = 'apps/web/app/o/[organizationId]/page.tsx';

test('empty workspace exposes four low-friction source paths', () => {
  assert.equal(existsSync(cardPath), true, 'SourceChoiceCard is missing');
  const card = readFileSync(cardPath, 'utf8');
  const page = readFileSync(pagePath, 'utf8');

  for (const expected of ['OpenAI', 'Anthropic', 'Upload CSV', 'Try demo']) {
    assert.equal(
      page.includes(expected),
      true,
      `workspace missing ${expected}`,
    );
  }

  assert.equal(
    card.includes('credential'),
    false,
    'launchpad must not handle credentials',
  );
  assert.equal(
    card.includes('type="file"'),
    false,
    'launchpad must not upload files itself',
  );
  assert.equal(card.includes('href'), true);
});
