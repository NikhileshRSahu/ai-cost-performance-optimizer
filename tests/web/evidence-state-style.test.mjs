import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const css = readFileSync('apps/web/app/globals.css', 'utf8');

test('global evidence state system defines semantic tokens and reduced motion', () => {
  for (const expected of [
    '--eval-observed',
    '--eval-opportunity',
    '--eval-tested',
    '--eval-verified',
    '@media (prefers-reduced-motion: reduce)',
    '.eval-motion-decorative',
  ]) {
    assert.equal(css.includes(expected), true, `globals missing ${expected}`);
  }
});
