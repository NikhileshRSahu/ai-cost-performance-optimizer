import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

describe('customer import workflow copy', () => {
  it('keeps the upload path simple while preserving the trust boundary', async () => {
    const page = await readFile(
      new URL(
        '../../apps/web/app/o/[organizationId]/import/page.tsx',
        import.meta.url,
      ),
      'utf8',
    );
    const normalizedPage = page.replace(/\s+/g, ' ');
    expect(normalizedPage).toContain('No provider key required');
    expect(normalizedPage).toContain(
      'We validate the file before adding it to your analysis',
    );
    expect(normalizedPage).toContain('View my analysis');
    expect(normalizedPage).toContain('See import details');
    expect(normalizedPage).toContain(
      'Synthetic demo data — not a customer result.',
    );
    expect(page).not.toMatch(/guaranteed|risk-free/i);
  });
});
