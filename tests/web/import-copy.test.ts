import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

describe('customer import workflow copy', () => {
  it('keeps the upload path focused while preserving the trust boundary', async () => {
    const page = await readFile(
      new URL(
        '../../apps/web/app/o/[organizationId]/import/page.tsx',
        import.meta.url,
      ),
      'utf8',
    );
    const normalizedPage = page.replace(/\s+/g, ' ');

    expect(normalizedPage).toContain('Usage & Import');
    expect(normalizedPage).toContain('No provider key required');
    expect(normalizedPage).toContain(
      'We validate the file before adding it to your analysis',
    );
    expect(normalizedPage).toContain('View my analysis');
    expect(normalizedPage).not.toContain('See import details');
    expect(normalizedPage).not.toContain('Run the synthetic workspace demo');
    expect(normalizedPage).not.toContain('GitHub');
    expect(page).not.toMatch(/guaranteed|risk-free/i);
  });
});
