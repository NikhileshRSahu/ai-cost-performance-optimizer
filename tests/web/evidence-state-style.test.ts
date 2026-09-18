import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync('apps/web/app/globals.css', 'utf8');

describe('evidence state style system', () => {
  it('defines semantic state tokens and a reduced-motion path', () => {
    for (const expected of [
      '--eval-observed',
      '--eval-opportunity',
      '--eval-tested',
      '--eval-verified',
      '@media (prefers-reduced-motion: reduce)',
      '.eval-motion-decorative',
    ]) {
      expect(css).toContain(expected);
    }
  });
});
