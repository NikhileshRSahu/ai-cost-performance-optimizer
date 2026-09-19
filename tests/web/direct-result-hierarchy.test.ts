import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const page = readFileSync('apps/web/app/o/[organizationId]/page.tsx', 'utf8');
const shell = readFileSync(
  'apps/web/components/workbench/workbench-shell.tsx',
  'utf8',
);

describe('direct result hierarchy', () => {
  it('keeps the default workspace answer-first and moves utilities behind secondary navigation', () => {
    expect(page).toContain('We analyzed your AI usage');
    expect(page).toContain('Observed AI spend');
    expect(page).toContain('Opportunities found');
    expect(page).toContain('Estimated savings');
    expect(page).toContain('Evaluation status');
    expect(page).toContain('Recommended action');
    expect(page).toContain('Supporting evidence summary');
    expect(page).not.toContain('<WorkMri');

    for (const expected of [
      'Your Result',
      '1 · Connect Data',
      '2 · Next Action',
      '3 · Results & Evidence',
      'Evaluation tools',
      'Prompt Evaluation',
      'Model Evaluation',
      'Settings',
    ]) {
      expect(shell).toContain(expected);
    }
  });
});
