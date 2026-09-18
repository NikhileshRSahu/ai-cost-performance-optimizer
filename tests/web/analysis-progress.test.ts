import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const componentPath = 'apps/web/components/workbench/analysis-progress.tsx';
const loadingPath = 'apps/web/app/o/[organizationId]/loading.tsx';

describe('semantic analysis progress', () => {
  it('uses meaningful stages without fake percentages', () => {
    const source = readFileSync(componentPath, 'utf8');
    const loading = readFileSync(loadingPath, 'utf8');

    for (const expected of [
      'Reading usage',
      'Normalizing evidence',
      'Finding waste',
      'Ranking supported opportunities',
      'useReducedMotion',
    ]) {
      expect(source).toContain(expected);
    }

    expect(source).not.toContain('%');
    expect(loading).toContain('AnalysisProgress');
    expect(loading).toContain('role="status"');
    expect(loading).toContain('Existing evidence remains unchanged');
  });
});
