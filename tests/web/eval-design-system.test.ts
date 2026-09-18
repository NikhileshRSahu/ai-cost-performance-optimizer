import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const globals = readFileSync('apps/web/app/globals.css', 'utf8');
const badge = readFileSync('apps/web/components/ui/evidence-badge.tsx', 'utf8');

describe('Evalomics shared design system', () => {
  it('defines the approved dark visual tokens', () => {
    for (const token of [
      '--eval-bg',
      '--eval-panel',
      '--eval-panel-raised',
      '--eval-border',
      '--eval-cyan',
      '--eval-amber',
      '--eval-tested',
      '--eval-verified',
      '--eval-danger',
    ]) {
      expect(globals).toContain(token);
    }
  });

  it('keeps evidence maturity states explicit and text-labelled', () => {
    for (const state of ['OBSERVED', 'POTENTIAL', 'TESTED', 'VERIFIED']) {
      expect(badge).toContain(state);
    }
    expect(badge).toContain('EvidenceState');
    expect(badge).toContain('children');
  });
});
