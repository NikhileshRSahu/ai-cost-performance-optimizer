import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const componentPath = 'apps/web/components/marketing/evidence-engine-demo.tsx';

function collectFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    return statSync(full).isDirectory() ? collectFiles(full) : [full];
  });
}

describe('Evidence Engine demo', () => {
  it('communicates causality and supports reduced motion', () => {
    const source = readFileSync(componentPath, 'utf8');

    for (const expected of [
      'useReducedMotion',
      'OpenAI',
      'Anthropic',
      'CSV',
      'Reading usage evidence',
      'Ranking supported opportunities',
      'Opportunity',
      'Tested',
      'Verified',
      'Synthetic walkthrough',
    ]) {
      expect(source).toContain(expected);
    }

    const oldImports = collectFiles('apps/web')
      .filter((path) => /\.(tsx?|jsx?)$/.test(path))
      .filter((path) =>
        readFileSync(path, 'utf8').includes('container-scroll-animation'),
      );

    expect(oldImports).toEqual([]);
  });
});
