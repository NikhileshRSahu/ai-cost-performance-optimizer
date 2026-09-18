import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const landing = readFileSync(
  'apps/web/components/marketing/launch-exact-evalomics.tsx',
  'utf8',
);
const story = readFileSync(
  'apps/web/components/marketing/guided-showcase-demo.tsx',
  'utf8',
);
const login = readFileSync('apps/web/app/login/page.tsx', 'utf8');

describe('public first-value copy', () => {
  it('keeps the landing focused on supported source paths and evidence maturity', () => {
    const publicExperience = landing + story;
    expect(publicExperience).not.toContain('CSV-first');
    expect(login).not.toContain('CSV-first');

    for (const expected of [
      'OpenAI',
      'Anthropic',
      'CSV',
      'Analyze my AI usage',
      'Potential',
      'Tested',
      'Verified',
    ]) {
      expect(publicExperience).toContain(expected);
    }

    for (const expected of ['OpenAI', 'Anthropic', 'CSV']) {
      expect(login).toContain(expected);
    }

    expect(publicExperience).not.toContain('ContainerScroll');
  });
});
