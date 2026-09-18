import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const home = readFileSync('apps/web/app/page.tsx', 'utf8');
const landing = readFileSync(
  'apps/web/components/marketing/launch-exact-evalomics.tsx',
  'utf8',
);
const start = readFileSync('apps/web/app/start/page.tsx', 'utf8');
const startFlow = readFileSync(
  'apps/web/components/marketing/start-flow.tsx',
  'utf8',
);
const demo = readFileSync(
  'apps/web/components/marketing/public-demo-experience.tsx',
  'utf8',
);
const csv = readFileSync(
  'apps/web/components/workbench/csv-dropzone.tsx',
  'utf8',
);
const login = readFileSync('apps/web/app/login/page.tsx', 'utf8');

describe('guided product flow', () => {
  it('keeps source choice simple before authentication', () => {
    expect(home).toContain('LaunchExactEvalomics');
    expect(landing).toContain('href="/start"');
    expect(landing).toContain('href="/demo"');
    expect(start).toContain('StartFlow');
    expect(start).not.toContain("redirect('/login')");

    for (const expected of ['OpenAI', 'Anthropic', 'Upload CSV']) {
      expect(startFlow).toContain(expected);
    }
    expect(startFlow).toContain('Connect your AI usage.');
    expect(startFlow).not.toContain('GitHub');
  });

  it('provides a no-login demo and product-related login continuation', () => {
    expect(demo).toContain('No login');
    expect(demo).toContain('Reading 22,380 requests');
    expect(demo).toContain('Analyze your usage');
    expect(login).toContain('LoginProductMotion');
  });

  it('keeps CSV intake focused on analysis', () => {
    expect(csv).toContain('Drop your usage CSV here');
    expect(csv).toContain('Analyze my AI usage');
    expect(csv).toContain('onDrop');
    expect(csv).toContain('Ready to analyze');
  });
});
