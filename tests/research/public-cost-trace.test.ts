import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import { diagnoseUsage } from '../../src/efficiency/usage-diagnosis.js';
import {
  parsePublicCostTrace,
  toResearchUsageRecords,
} from '../../src/research/public-cost-trace.js';

describe('public research cost-trace replay', () => {
  it('normalizes measured public calls without inventing missing financial evidence', async () => {
    const csv = await readFile(
      new URL('../../fixtures/research/ainetcafe-public-source-sample.csv', import.meta.url),
      'utf8',
    );
    const sourceRows = parsePublicCostTrace(csv);
    const records = toResearchUsageRecords(sourceRows);

    expect(records).toHaveLength(24);
    expect(records.every((row) => row.project === 'PUBLIC_RESEARCH_TRACE')).toBe(
      true,
    );
    expect(records.every((row) => row.currency === 'USD')).toBe(true);
    expect(records.every((row) => row.successes === '1')).toBe(true);
    expect(records.some((row) => BigInt(row.cachedInputTokens ?? '0') > 0n)).toBe(
      true,
    );
  });

  it('runs the canonical Work MRI diagnosis on the measured research slice', async () => {
    const csv = await readFile(
      new URL('../../fixtures/research/ainetcafe-public-source-sample.csv', import.meta.url),
      'utf8',
    );
    const diagnosis = diagnoseUsage({
      records: toResearchUsageRecords(parsePublicCostTrace(csv)),
      reportingCurrency: 'USD',
    });

    expect(diagnosis.includedRecords).toBe(24);
    expect(diagnosis.facts.map((fact) => fact.key)).toEqual(
      expect.arrayContaining([
        'TOTAL_SPEND',
        'COST_PER_REQUEST',
        'COST_PER_SUCCESS',
        'TOP_MODEL_COST_SHARE',
        'OUTPUT_TOKENS_PER_REQUEST',
        'CACHE_HIT_RATIO',
      ]),
    );
    expect(diagnosis.limitations).toContain(
      'Retry cost is withheld because request-level attempt evidence is incomplete.',
    );
  });
});
