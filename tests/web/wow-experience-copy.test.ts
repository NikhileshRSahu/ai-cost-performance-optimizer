import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const home = readFileSync('apps/web/app/page.tsx', 'utf8');
const login = readFileSync('apps/web/app/login/page.tsx', 'utf8');

describe('wow experience public copy', () => {
  it('names every supported first-value path', () => {
    expect(home).not.toContain('CSV-first');
    expect(login).not.toContain('CSV-first');

    for (const expected of [
      'OpenAI',
      'Anthropic',
      'CSV',
      'Analyze my AI usage',
      'Try the live demo',
    ]) {
      expect(home).toContain(expected);
    }

    for (const expected of ['OpenAI', 'Anthropic', 'CSV', 'demo']) {
      expect(login).toContain(expected);
    }

    expect(home).not.toContain('ContainerScroll');
  });
});
