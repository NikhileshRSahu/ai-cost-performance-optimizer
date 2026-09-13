import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

async function read(path: string): Promise<string> {
  return readFile(new URL(`../../${path}`, import.meta.url), 'utf8');
}

describe('founder workbench web workspace', () => {
  it('pins the stable Next and React releases selected for V0', async () => {
    const pkg = JSON.parse(await read('apps/web/package.json')) as {
      dependencies: Record<string, string>;
    };
    expect(pkg.dependencies.next).toBe('16.3.4');
    expect(pkg.dependencies.react).toBe('19.3.0');
    expect(pkg.dependencies['react-dom']).toBe('19.3.0');
  });

  it('starts from a server-rendered shell without client auth state', async () => {
    const page = await read('apps/web/app/page.tsx');
    const layout = await read('apps/web/app/layout.tsx');

    expect(page).not.toContain("'use client'");
    expect(layout).not.toContain("'use client'");
    expect(layout).toContain('Skip to content');
    expect(layout).toContain('<main');
  });
});
