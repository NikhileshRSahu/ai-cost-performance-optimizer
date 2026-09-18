import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const start = readFileSync('apps/web/components/marketing/start-flow.tsx', 'utf8');
const result = readFileSync('apps/web/components/workbench/direct-result.tsx', 'utf8');
const details = readFileSync('apps/web/components/workbench/evidence-details.tsx', 'utf8');
const proof = readFileSync('apps/web/app/o/[organizationId]/proof/page.tsx', 'utf8');
const shell = readFileSync('apps/web/components/workbench/workbench-shell.tsx', 'utf8');
const globals = readFileSync('apps/web/app/globals.css', 'utf8');

describe('full Evalomics redesign contract', () => {
  it('keeps intake to result intentionally short', () => {
    for (const source of ['OpenAI', 'Anthropic', 'Upload CSV']) {
      expect(start).toContain(source);
    }
    expect(start).toContain('analyzes it automatically');
    expect(result).toContain('Recommended next action');
    expect(details).toContain('See details');
  });

  it('keeps evidence maturity distinct through verification', () => {
    for (const state of ['OBSERVED', 'POTENTIAL', 'TESTED', 'VERIFIED']) {
      expect(result + proof).toContain(state);
    }
    expect(proof).toContain('EvidenceProgression');
    expect(proof).toContain('Production reconciled');
  });

  it('uses one shared visual system across workspace and legacy surfaces', () => {
    expect(shell).toContain('var(--eval-bg)');
    expect(globals).toContain('--eval-cyan');
    expect(globals).toContain('--eval-amber');
    expect(globals).toContain('Dark compatibility layer for legacy workflow surfaces');
    expect(globals).toContain('Unified dark treatment for supporting public pages');
  });
});
