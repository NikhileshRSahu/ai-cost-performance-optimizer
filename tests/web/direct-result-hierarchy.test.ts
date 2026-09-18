import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const page = readFileSync('apps/web/app/o/[organizationId]/page.tsx', 'utf8');
const card = readFileSync(
  'apps/web/components/recommendation-card.tsx',
  'utf8',
);

describe('direct result hierarchy', () => {
  it('keeps the answer dominant and evidence depth secondary', () => {
    expect(page).toContain('Spend analyzed');
    expect(page.includes('See why') || page.includes('See details')).toBe(true);

    const resultIndex = page.indexOf('data-testid="direct-answer-result"');
    const detailsIndex = page.indexOf('data-testid="analysis-details"');
    const mriIndex = page.indexOf('<WorkMri');

    expect(resultIndex).toBeGreaterThanOrEqual(0);
    expect(detailsIndex).toBeGreaterThan(resultIndex);
    expect(mriIndex).toBeGreaterThan(detailsIndex);
    expect(card).toContain('Test this optimization');
  });
});
