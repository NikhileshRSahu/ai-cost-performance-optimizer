import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

const reportPath = new URL(
  '../../apps/web/app/o/[organizationId]/report/[recommendationId]/page.tsx',
  import.meta.url,
);

describe('professional report content', () => {
  it('renders all nine required evidence sections', async () => {
    const page = await readFile(reportPath, 'utf8');
    for (const heading of [
      'Executive summary',
      'Scope and data quality',
      'Opportunity',
      'Benchmark',
      'Economics',
      'Confidence',
      'Implementation and rollback',
      'Verification',
      'Methodology and limitations',
    ]) {
      expect(page).toContain(heading);
    }
  });

  it('keeps print output user initiated', async () => {
    const button = await readFile(
      new URL('../../apps/web/components/print-report-button.tsx', import.meta.url),
      'utf8',
    );
    expect(button).toContain('window.print()');
    expect(button).toContain('Print / Save as PDF');
  });
});
