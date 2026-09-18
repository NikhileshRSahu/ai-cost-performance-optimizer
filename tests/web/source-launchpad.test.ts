import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const start = readFileSync('apps/web/components/marketing/start-flow.tsx', 'utf8');
const importPage = readFileSync(
  'apps/web/app/o/[organizationId]/import/page.tsx',
  'utf8',
);

describe('source intake flow', () => {
  it('keeps source choice before the authenticated intake details', () => {
    for (const expected of ['Connect a source', 'Upload CSV', 'Anthropic', 'OpenAI']) {
      expect(start).toContain(expected);
    }

    expect(importPage).toContain('Upload your usage CSV');
    expect(importPage).toContain('Connect the source you chose');
    expect(importPage).toContain('Analyze my AI usage');
  });
});
