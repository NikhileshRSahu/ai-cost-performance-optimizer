import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const page = readFileSync('apps/web/app/o/[organizationId]/page.tsx', 'utf8');
const shell = readFileSync(
  'apps/web/components/workbench/workbench-shell.tsx',
  'utf8',
);

describe('direct result hierarchy', () => {
  it('keeps the default workspace answer-first and moves utilities behind secondary navigation', () => {
    expect(page).toContain('Your AI spend at a glance');
    expect(page).toContain('Spend');
    expect(page).toContain('Estimated savings');
    expect(page).toContain('Biggest waste');
    expect(page).toContain('Best change');
    expect(page).toContain('Is this safe?');
    expect(page).toContain('Next step');
    expect(page).toContain('Production result');
    expect(page).not.toContain('<WorkMri');

    for (const expected of [
      'Overview',
      'Usage',
      'Optimization',
      'Results',
      'Tools',
      'Prompt evaluation',
      'Model evaluation',
      'Settings',
    ]) {
      expect(shell).toContain(expected);
    }
  });
});
