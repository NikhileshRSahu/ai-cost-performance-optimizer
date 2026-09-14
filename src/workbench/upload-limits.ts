export const UPLOAD_LIMITS = Object.freeze({
  usageCsvBytes: 10 * 1024 * 1024,
  benchmarkCsvBytes: 10 * 1024 * 1024,
  sanitizedHistoryJsonBytes: 5 * 1024 * 1024,
});

export type UploadKind = 'USAGE_CSV' | 'BENCHMARK_CSV' | 'SANITIZED_HISTORY_JSON';

export function assertUploadWithinLimit(
  input: Readonly<{
    kind: UploadKind;
    sizeBytes: number;
  }>,
): void {
  if (!Number.isSafeInteger(input.sizeBytes) || input.sizeBytes < 0) {
    throw new Error('INVALID_UPLOAD_SIZE');
  }

  const limit =
    input.kind === 'USAGE_CSV'
      ? UPLOAD_LIMITS.usageCsvBytes
      : input.kind === 'BENCHMARK_CSV'
        ? UPLOAD_LIMITS.benchmarkCsvBytes
        : UPLOAD_LIMITS.sanitizedHistoryJsonBytes;

  if (input.sizeBytes > limit) {
    throw new Error(input.kind + '_TOO_LARGE');
  }
}
