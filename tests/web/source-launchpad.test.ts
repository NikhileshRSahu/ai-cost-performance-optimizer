import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const start = readFileSync(
  'apps/web/components/marketing/start-flow.tsx',
  'utf8',
);
const importPage = readFileSync(
  'apps/web/app/o/[organizationId]/import/page.tsx',
  'utf8',
);

describe('source intake flow', () => {
  it('shows all supported source choices before authenticated intake details', () => {
    for (const expected of ['OpenAI', 'Anthropic', 'Upload CSV']) {
      expect(start).toContain(expected);
    }
    expect(start).toContain('Connect your AI usage.');
    expect(start).toContain('takes you');
    expect(start).toContain('straight to the strongest supported result');

    expect(importPage).toContain('Upload your usage CSV');
    expect(importPage).toContain('Connect the source you chose');
    expect(importPage).toContain('Analyze my AI usage');
  });
});
