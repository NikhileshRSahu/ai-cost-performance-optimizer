import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const home=readFileSync('apps/web/app/page.tsx','utf8');
const start=readFileSync('apps/web/app/start/page.tsx','utf8');
const startFlow=readFileSync('apps/web/components/marketing/start-flow.tsx','utf8');
const demo=readFileSync('apps/web/components/marketing/public-demo-experience.tsx','utf8');
const csv=readFileSync('apps/web/components/workbench/csv-dropzone.tsx','utf8');
const login=readFileSync('apps/web/app/login/page.tsx','utf8');

describe('guided product flow',()=>{
  it('keeps public actions inside the product before authentication',()=>{
    expect(home).toContain('href="/start"');
    expect(home).toContain('href="/demo"');
    expect(start).toContain('StartFlow');
    expect(start).not.toContain("redirect('/login')");
    expect(startFlow).toContain('Connect a source');
    expect(startFlow).toContain('Upload CSV');
    expect(startFlow).toContain('Anthropic');
    expect(startFlow).toContain('GitHub');
  });

  it('provides a no-login demo and product-related login continuation',()=>{
    expect(demo).toContain('No login');
    expect(demo).toContain('Reading 22,380 requests');
    expect(demo).toContain('Analyze your usage');
    expect(login).toContain('LoginProductMotion');
  });

  it('replaces the raw CSV control with a guided drag-drop experience',()=>{
    expect(csv).toContain('Drop your usage CSV here');
    expect(csv).toContain('Analyze my AI usage');
    expect(csv).toContain('onDrop');
    expect(csv).toContain('Ready to analyze');
  });
});
