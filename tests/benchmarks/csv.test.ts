import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import { parseBenchmarkCsv } from '../../src/benchmarks/csv.js';
import { evaluateBenchmark } from '../../src/benchmarks/evaluate.js';

describe('paired benchmark CSV contract', () => {
  it('parses the hard 30-case x 2-repetition fixture', async () => {
    const bytes = new Uint8Array(
      await readFile(
        new URL(
          '../../fixtures/demo/customer-loop-benchmark.csv',
          import.meta.url,
        ),
      ),
    );
    const cases = parseBenchmarkCsv(bytes);
    expect(cases).toHaveLength(120);

    const result = evaluateBenchmark({
      cases,
      currentConfigurationId: 'model-a',
      candidateConfigurationId: 'model-b',
      evaluatorVersion: 'eval-v1',
      constraints: {
        requiredQuality: '0.90',
        maxP95LatencyMs: '1000',
        maxFailureRate: '0.05',
        targetCases: 30,
      },
    });

    expect(result.decision).toBe('OPTIMIZE');
    expect(result.pairedValidCases).toBe(30);
    expect(result.confidence.band).not.toBe('LOW');
  });
});
