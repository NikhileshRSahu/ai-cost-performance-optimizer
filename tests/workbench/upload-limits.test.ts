import { describe, expect, it } from 'vitest';
import {
  assertUploadWithinLimit,
  UPLOAD_LIMITS,
} from '../../src/workbench/upload-limits.js';

describe('upload limits', () => {
  it('accepts a file exactly at the configured boundary', () => {
    expect(() =>
      assertUploadWithinLimit({
        kind: 'USAGE_CSV',
        sizeBytes: UPLOAD_LIMITS.usageCsvBytes,
      }),
    ).not.toThrow();
  });

  it('rejects usage CSVs above the configured boundary', () => {
    expect(() =>
      assertUploadWithinLimit({
        kind: 'USAGE_CSV',
        sizeBytes: UPLOAD_LIMITS.usageCsvBytes + 1,
      }),
    ).toThrow('USAGE_CSV_TOO_LARGE');
  });

  it('rejects benchmark CSVs above the configured boundary', () => {
    expect(() =>
      assertUploadWithinLimit({
        kind: 'BENCHMARK_CSV',
        sizeBytes: UPLOAD_LIMITS.benchmarkCsvBytes + 1,
      }),
    ).toThrow('BENCHMARK_CSV_TOO_LARGE');
  });

  it('rejects sanitized history above its tighter boundary', () => {
    expect(() =>
      assertUploadWithinLimit({
        kind: 'SANITIZED_HISTORY_JSON',
        sizeBytes: UPLOAD_LIMITS.sanitizedHistoryJsonBytes + 1,
      }),
    ).toThrow('SANITIZED_HISTORY_JSON_TOO_LARGE');
  });
});
