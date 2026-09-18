import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const page = readFileSync('apps/web/app/o/[organizationId]/page.tsx', 'utf8');
const shell = readFileSync(
  'apps/web/components/workbench/workbench-shell.tsx',
  'utf8',
);

describe('cost dashboard hierarchy', () => {
  it('keeps the default workspace focused on spend, recommendations, and proof', () => {
    expect(page).toContain('Cost Dashboard');
    expect(page).toContain('Observed AI spend');
    expect(page).toContain('Savings signals');
    expect(page).toContain('Modeled upside');
    expect(page).toContain('Verified savings');
    expect(page).toContain('Top recommendation');
    expect(page).not.toContain('<WorkMri');

    for (const expected of [
      'Cost Dashboard',
      'Usage & Import',
      'Recommendations',
      'Prompt Optimizer',
      'Model Calculator',
      'Verified Savings',
      'Settings',
    ]) {
      expect(shell).toContain(expected);
    }
  });
});
