import type {
  ImportIssue,
  ImportInterval,
  ImportRun,
  UsageRecord,
} from '../usage/contracts.js';
import { sha256Bytes } from '../usage/fingerprint.js';
import { parseUsageCsv } from './csv.js';

export type ImportResult = Readonly<{
  run: ImportRun;
  records: readonly UsageRecord[];
}>;

export function importUsageCsv(
  input: Readonly<{
    bytes: Uint8Array;
    organizationId: string;
    receivedAt: string;
    requestedInterval?: ImportInterval | null;
    isDemo?: boolean;
  }>,
): ImportResult {
  const parsed = parseUsageCsv(
    input.bytes,
    input.organizationId,
    input.isDemo ?? false,
  );
  const accepted: UsageRecord[] = [];
  const issues: ImportIssue[] = [...parsed.issues];
  let skippedDuplicates = 0;
  let rejectedConflicts = 0;
  const seen = new Map<string, string>();

  for (const record of parsed.records) {
    const key = record.sourceEventId
      ? `event:${record.organizationId}:${record.source}:${record.sourceEventId}`
      : `fingerprint:${record.fingerprint}`;
    const existing = seen.get(key);

    if (existing === undefined) {
      seen.set(key, record.fingerprint);
      accepted.push(record);
    } else if (existing === record.fingerprint) {
      skippedDuplicates++;
    } else {
      rejectedConflicts++;
      issues.push({
        line: record.sourceLine,
        code: 'CONFLICTING_DUPLICATE',
        message: 'Duplicate key has different canonical content',
      });
    }
  }

  const rejected = parsed.issues.length + rejectedConflicts;
  const effectiveInterval =
    accepted.length === 0
      ? null
      : Object.freeze({
          start: accepted.reduce(
            (earliest, record) =>
              Date.parse(record.intervalStart) < Date.parse(earliest)
                ? record.intervalStart
                : earliest,
            accepted[0]?.intervalStart ?? '',
          ),
          end: accepted.reduce(
            (latest, record) =>
              Date.parse(record.intervalEnd) > Date.parse(latest)
                ? record.intervalEnd
                : latest,
            accepted[0]?.intervalEnd ?? '',
          ),
        });
  const run: ImportRun = Object.freeze({
    checksum: sha256Bytes(input.bytes),
    source: 'CSV',
    receivedAt: input.receivedAt,
    requestedInterval: input.requestedInterval ?? null,
    effectiveInterval,
    capabilities: parsed.capabilities,
    accepted: accepted.length,
    skippedDuplicates,
    rejected,
    warnings: 0,
    blocked: accepted.length === 0,
    partial: accepted.length > 0 && rejected > 0,
    issues: Object.freeze(issues.map((issue) => Object.freeze(issue))),
  });

  return Object.freeze({
    run,
    records: Object.freeze(accepted.map((record) => Object.freeze(record))),
  });
}
