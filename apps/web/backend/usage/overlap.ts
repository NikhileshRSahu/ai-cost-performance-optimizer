import type { UsageRecord } from './contracts.js';

export type OverlapResult = Readonly<{
  included: readonly UsageRecord[];
  excluded: readonly UsageRecord[];
  reasons: readonly string[];
}>;

function overlaps(a: UsageRecord, b: UsageRecord): boolean {
  const aStart = Date.parse(a.intervalStart);
  const aEnd = Date.parse(a.intervalEnd);
  const bStart = Date.parse(b.intervalStart);
  const bEnd = Date.parse(b.intervalEnd);
  return aStart < bEnd && bStart < aEnd;
}

function sameScope(a: UsageRecord, b: UsageRecord): boolean {
  return (
    a.organizationId === b.organizationId &&
    a.provider === b.provider &&
    a.model === b.model &&
    a.workload === b.workload
  );
}

export function excludeUnreconciledOverlaps(
  records: readonly UsageRecord[],
): OverlapResult {
  const excluded = new Set<UsageRecord>();
  const reasons: string[] = [];

  for (let i = 0; i < records.length; i++) {
    for (let j = i + 1; j < records.length; j++) {
      const a = records[i];
      const b = records[j];
      if (a === undefined || b === undefined) continue;

      if (!sameScope(a, b) || !overlaps(a, b)) continue;

      if (a.granularity !== b.granularity || a.fingerprint !== b.fingerprint) {
        excluded.add(a);
        excluded.add(b);
        const reason =
          'UNRECONCILED_OVERLAP:' +
          String(a.sourceLine) +
          ':' +
          String(b.sourceLine);
        reasons.push(reason);
      }
    }
  }

  const included = records.filter((record) => !excluded.has(record));
  const excludedRecords = records.filter((record) => excluded.has(record));

  return Object.freeze({
    included: Object.freeze(included),
    excluded: Object.freeze(excludedRecords),
    reasons: Object.freeze(reasons),
  });
}
