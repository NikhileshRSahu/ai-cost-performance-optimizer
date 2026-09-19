import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const landing = readFileSync(
  'apps/web/components/marketing/launch-template-evalomics.tsx',
  'utf8',
);
const start = readFileSync('apps/web/app/start/page.tsx', 'utf8');
const startFlow = readFileSync(
  'apps/web/components/marketing/start-flow.tsx',
  'utf8',
);
const demo = readFileSync(
  'apps/web/components/marketing/public-demo-dashboard.tsx',
  'utf8',
);
const csv = readFileSync(
  'apps/web/components/workbench/csv-dropzone.tsx',
  'utf8',
);
const login = readFileSync('apps/web/app/login/page.tsx', 'utf8');

describe('guided product flow', () => {
  it('keeps source choice inside the product before authentication', () => {
    expect(landing).toContain('href="/start?intent=analyze"');
    expect(landing).toContain('href="/start?intent=start"');
    expect(landing).toContain('href="/demo"');
    expect(start).toContain('StartFlow');
    expect(start).not.toContain("redirect('/login')");
    expect(startFlow).toContain('Connect usage');
    expect(startFlow).toContain('Upload file');
    expect(startFlow).toContain('Anthropic');
    expect(startFlow).toContain('OpenAI');
    expect(startFlow).toContain("'/login?returnTo='");
    expect(startFlow).not.toContain('GitHub');
  });

  it('provides a no-login demo and product-related login continuation', () => {
    expect(demo).toContain('Demo data · synthetic · not customer results');
    expect(demo).toContain('22,380 requests');
    expect(demo).toContain('Analyze my usage');
    expect(login).toContain('LoginProductMotion');
  });

  it('replaces the raw CSV control with a guided drag-drop experience', () => {
    expect(csv).toContain('Drop your usage CSV here');
    expect(csv).toContain('Analyze my AI usage');
    expect(csv).toContain('onDrop');
    expect(csv).toContain('Ready to analyze');
  });
});
