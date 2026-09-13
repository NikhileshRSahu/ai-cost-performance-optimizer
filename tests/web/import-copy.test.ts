import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

describe('customer import workflow copy', () => {
  it('explains the CSV-first trust boundary clearly', async () => {
    const page = await readFile(
      new URL(
        '../../apps/web/app/o/[organizationId]/import/page.tsx',
        import.meta.url,
      ),
      'utf8',
    );
    const normalizedPage = page.replace(/\s+/g, ' ');
    expect(normalizedPage).toContain('CSV-first · no provider key required');
    expect(normalizedPage).toContain('never turn missing values into zero');
    expect(normalizedPage).toContain(
      'Synthetic demo data — not a customer result.',
    );
    expect(page).not.toMatch(/guaranteed|risk-free/i);
  });
});
