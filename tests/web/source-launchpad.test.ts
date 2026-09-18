import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const cardPath = 'apps/web/components/workbench/source-choice-card.tsx';
const pagePath = 'apps/web/app/o/[organizationId]/page.tsx';

describe('source launchpad', () => {
  it('exposes four low-friction source paths', () => {
    const card = readFileSync(cardPath, 'utf8');
    const page = readFileSync(pagePath, 'utf8');

    for (const expected of ['OpenAI', 'Anthropic', 'Upload CSV', 'Try demo']) {
      expect(page).toContain(expected);
    }

    expect(card).not.toContain('credential');
    expect(card).not.toContain('type="file"');
    expect(card).toContain('href');
  });
});
