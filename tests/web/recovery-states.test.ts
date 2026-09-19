import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

async function source(path: string): Promise<string> {
  return readFile(new URL('../../' + path, import.meta.url), 'utf8');
}

describe('recovery states', () => {
  it('withholds internal exception details from root and organization errors', async () => {
    const root = await source('apps/web/app/error.tsx');
    const organization = await source(
      'apps/web/app/o/[organizationId]/error.tsx',
    );

    for (const page of [root, organization]) {
      expect(page).toContain(
        'Internal exception details are intentionally withheld from this screen.',
      );
      expect(page).not.toMatch(
        /error\.message|error\.stack|JSON\.stringify\(error/i,
      );
      expect(page).toMatch(/Retry/);
      expect(page).toContain('Return home');
    }
  });

  it('provides a simple recovery path after a failed usage import', async () => {
    const page = await source(
      'apps/web/app/o/[organizationId]/import/page.tsx',
    );

    expect(page).toContain('Try another CSV');
    expect(page).toContain('Return to overview');
    expect(page).toContain('{query.error}');
  });

  it('covers loading states without implying evidence mutation', async () => {
    const rootLoading = await source('apps/web/app/loading.tsx');
    const organizationLoading = await source(
      'apps/web/app/o/[organizationId]/loading.tsx',
    );

    expect(rootLoading).toContain('aria-busy="true"');
    expect(organizationLoading).toContain('aria-busy="true"');
    expect(organizationLoading).toContain(
      'Existing evidence remains unchanged',
    );
  });

  it('keeps not-found and unauthorized states actionable', async () => {
    const notFound = await source('apps/web/app/not-found.tsx');
    const unauthorized = await source('apps/web/app/unauthorized/page.tsx');

    expect(notFound).toContain('Return home');
    expect(unauthorized).toContain('Return home');
  });
});
