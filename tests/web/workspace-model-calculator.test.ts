import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const page = readFileSync(
  'apps/web/app/o/[organizationId]/calculator/page.tsx',
  'utf8',
);
const calculator = readFileSync(
  'apps/web/components/workbench/workspace-model-calculator.tsx',
  'utf8',
);

describe('workspace model calculator', () => {
  it('keeps model comparison inside the authenticated workspace', () => {
    expect(page).toContain('WorkspaceModelCalculator');
    expect(page).toContain('Would switching models actually help?');
    expect(calculator).toContain(
      'Compare the detected workload against a candidate',
    );
    expect(calculator).toContain('What should you do?');
    expect(calculator).toContain('Do not switch to this candidate');
    expect(calculator).toContain('Show lowest-cost alternative');
    expect(calculator).toContain('Current monthly inference cost');
    expect(calculator).toContain('Candidate monthly inference cost');
    expect(calculator).toContain('Estimated monthly difference');
    expect(calculator).toContain('economics part of the evaluation');
  });
});
