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
    expect(page).toContain('Evaluate a model candidate');
    expect(calculator).toContain('Compare two model-price scenarios');
    expect(calculator).toContain('Current monthly inference cost');
    expect(calculator).toContain('Candidate monthly inference cost');
    expect(calculator).toContain('Estimated monthly difference');
    expect(calculator).toContain('economics part of the evaluation');
  });
});
