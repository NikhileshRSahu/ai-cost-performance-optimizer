import type { UsageRecord } from './contracts.js';

export type OverlapResult = Readonly<{
  included: readonly UsageRecord[];
  excluded: readonly UsageRecord[];
  reasons: readonly string[];
}>;

function overlaps(a: UsageRecord, b: UsageRecord): boolean {
  return (
    Date.parse(a.intervalStart) < Date.parse(b.intervalEnd) &&
    Date.parse(b.intervalStart) < Date.parse(a.intervalEnd)
  );
}

export function excludeUnreconciledOverlaps(records: readonly UsageRecord[]): OverlapResult {
  const excluded = new Set<UsageRecord>();
  const reasons: string[] = [];

  for (let i = 0; i < records.length; i++) {
    for (let j = i + 1; j < records.length; j++) {
      const a = records[i]!;
      const b = records[j]!;
      const sameScope =
        a.organizationId === b.organizationId &&
        a.provider === b.provider &&
        a.model === b.model &&
        a.workload === b.workload;

      if (!sameScope || !overlaps(a, b)) continue;

      if (a.granularity !== b.granularity || a.fingerprint !== b.fingerprint) {
        excluded.add(a);
        excluded.add(b);
        reasons.push(
          `UNRECONCILED_OVERLAP:${a.sourceLine}:${b.sourceLine}`,
        );
      }
    }
  }

  return Object.freeze({
    included: Object.freeze(
      records.filter((record) => !excluded.has(record)),
    ),
    excluded: Object.freeze(
      records.filter((record) => excluded.has(record)),
    ),
    reasons: Object.freeze(reasons),
  });
}
