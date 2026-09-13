import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import { parseUsageCsv } from '../../src/ingestion/csv.js';

async function bytes(path: string): Promise<Uint8Array> {
  const data = await readFile(new URL(`../../${path}`, import.meta.url));
  return new Uint8Array(data);
}

describe('customer-loop hard fixtures', () => {
  it('keeps enough valid baseline evidence while rejecting hostile rows', async () => {
    const parsed = parseUsageCsv(
      await bytes('fixtures/demo/customer-loop-tough.csv'),
      'demo-org',
      true,
    );
    expect(parsed.records).toHaveLength(30);
    expect(parsed.issues).toHaveLength(4);
    expect(
      new Set(parsed.records.map((row) => row.intervalStart.slice(0, 10))).size,
    ).toBe(14);
    expect(new Set(parsed.records.map((row) => row.workload))).toEqual(
      new Set(['classification', 'extraction']),
    );
    expect(parsed.records.every((row) => row.isDemo)).toBe(true);
  });

  it('provides seven clean post-change days for verification', async () => {
    const parsed = parseUsageCsv(
      await bytes('fixtures/demo/customer-loop-post-change.csv'),
      'demo-org',
      true,
    );
    expect(parsed.issues).toEqual([]);
    expect(parsed.records).toHaveLength(7);
    expect(
      new Set(parsed.records.map((row) => row.intervalStart.slice(0, 10))).size,
    ).toBe(7);
    expect(new Set(parsed.records.map((row) => row.configurationId))).toEqual(
      new Set(['model-b']),
    );
  });

  it('keeps research/reference data explicitly attributed', async () => {
    const reference = await readFile(
      new URL(
        '../../fixtures/research/model-reference-2026.csv',
        import.meta.url,
      ),
      'utf8',
    );
    const sources = await readFile(
      new URL('../../fixtures/research/SOURCES.md', import.meta.url),
      'utf8',
    );
    expect(reference).toContain('CC-BY-4.0');
    expect(reference).toContain('official-public-pricing');
    expect(sources).toContain('never loaded as customer production usage');
  });
});
