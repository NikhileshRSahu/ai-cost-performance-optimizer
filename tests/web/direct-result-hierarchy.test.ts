import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const page = readFileSync('apps/web/app/o/[organizationId]/page.tsx', 'utf8');
const direct = readFileSync(
  'apps/web/components/workbench/direct-result.tsx',
  'utf8',
);
const shell = readFileSync(
  'apps/web/components/workbench/workbench-shell.tsx',
  'utf8',
);

describe('direct result hierarchy', () => {
  it('puts evidence, strongest action, and optional details ahead of dashboard complexity', () => {
    for (const expected of [
      'Observed spend',
      'Biggest modeled upside',
      'Tested saving',
      'Verified saving',
      'Strongest supported opportunity',
      'confidence',
      'Recommended next action',
      'See details',
    ]) {
      expect(direct).toContain(expected);
    }

    expect(page).toContain('Give Evalomics usage. Get one clear next action.');
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
