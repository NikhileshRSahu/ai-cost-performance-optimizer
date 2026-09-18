import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const home = readFileSync('apps/web/app/page.tsx', 'utf8');
const login = readFileSync('apps/web/app/login/page.tsx', 'utf8');

test('public experience names all supported first-value paths', () => {
  assert.equal(home.includes('CSV-first'), false);
  assert.equal(login.includes('CSV-first'), false);

  for (const expected of [
    'OpenAI',
    'Anthropic',
    'CSV',
    'Analyze my AI usage',
    'Try the live demo',
  ]) {
    assert.equal(home.includes(expected), true, `homepage missing ${expected}`);
  }

  for (const expected of ['OpenAI', 'Anthropic', 'CSV', 'demo']) {
    assert.equal(login.includes(expected), true, `login missing ${expected}`);
  }

  assert.equal(home.includes('ContainerScroll'), false);
});
