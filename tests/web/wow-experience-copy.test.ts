import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const home = readFileSync('apps/web/app/page.tsx', 'utf8');
const hero = readFileSync(
  'apps/web/components/marketing/launch-template-evalomics.tsx',
  'utf8',
);
const login = readFileSync('apps/web/app/login/page.tsx', 'utf8');

describe('public first-value copy', () => {
  it('keeps the landing focused on supported source paths', () => {
    const publicExperience = home + hero;
    expect(publicExperience).not.toContain('CSV-first');
    expect(login).not.toContain('CSV-first');

    for (const expected of [
      'OpenAI',
      'Anthropic',
      'CSV',
      'Analyze my own AI usage',
      'Try with demo data',
    ]) {
      expect(publicExperience).toContain(expected);
    }

    for (const expected of ['OpenAI', 'Anthropic', 'CSV', 'demo']) {
      expect(login).toContain(expected);
    }

    expect(publicExperience).not.toContain('ContainerScroll');
  });
});
