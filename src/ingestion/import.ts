import type {
  ImportIssue,
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
  const run: ImportRun = Object.freeze({
    checksum: sha256Bytes(input.bytes),
    source: 'CSV',
    receivedAt: input.receivedAt,
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
