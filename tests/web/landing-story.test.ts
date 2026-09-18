import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const landing = readFileSync(
  'apps/web/components/marketing/launch-exact-evalomics.tsx',
  'utf8',
);
const story = readFileSync(
  'apps/web/components/marketing/guided-showcase-demo.tsx',
  'utf8',
);

describe('Evalomics landing story', () => {
  it('keeps the approved hero and advances into the scroll product story', () => {
    expect(landing).toContain('Make the invisible economics of AI visible');
    expect(landing.indexOf('<Hero />')).toBeLessThan(
      landing.indexOf('<GuidedShowcaseDemo />'),
    );
    expect(story).toContain('From raw usage');
    expect(story).toContain('to verified savings.');
    expect(story).toContain('et-launch-card back');
    expect(story).toContain('et-launch-card middle');
    expect(story).toContain('et-launch-card front');
    expect(story).toContain('et-launch-card final');
    expect(story).not.toContain('fake cursor');
  });
});
