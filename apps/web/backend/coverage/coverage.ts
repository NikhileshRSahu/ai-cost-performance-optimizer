import type {
  CoverageInterval,
  CoverageSummary,
} from '../usage/contracts.js';

type LocalParts = Readonly<{
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}>;

function localParts(date: Date, timezone: string): LocalParts {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);

  const read = (type: Intl.DateTimeFormatPartTypes): number => {
    const raw = parts.find((part) => part.type === type)?.value;
    if (raw === undefined) throw new Error('INVALID_TIMEZONE_PARTS');
    return Number(raw);
  };

  return {
    year: read('year'),
    month: read('month'),
    day: read('day'),
    hour: read('hour'),
    minute: read('minute'),
    second: read('second'),
  };
}

function dayKey(date: Date, timezone: string): string {
  const parts = localParts(date, timezone);
  return [
    String(parts.year).padStart(4, '0'),
    String(parts.month).padStart(2, '0'),
    String(parts.day).padStart(2, '0'),
  ].join('-');
}

function parseDayKey(day: string): readonly [number, number, number] {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(day);
  if (match === null) throw new Error('INVALID_DAY_KEY');
  const year = Number(match[1]);
  const month = Number(match[2]);
  const date = Number(match[3]);
  return [year, month, date];
}

function incrementDay(day: string): string {
  const [year, month, date] = parseDayKey(day);
  return new Date(Date.UTC(year, month - 1, date + 1))
    .toISOString()
    .slice(0, 10);
}

function zonedMidnightMs(day: string, timezone: string): number {
  const [year, month, date] = parseDayKey(day);
  const desiredWallClock = Date.UTC(year, month - 1, date);
  let candidate = desiredWallClock;

  for (let iteration = 0; iteration < 4; iteration++) {
    const parts = localParts(new Date(candidate), timezone);
    const representedAsUtc = Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day,
      parts.hour,
      parts.minute,
      parts.second,
    );
    const offset = representedAsUtc - candidate;
    const nextCandidate = desiredWallClock - offset;
    if (nextCandidate === candidate) break;
    candidate = nextCandidate;
  }

  const resolved = localParts(new Date(candidate), timezone);
  if (
    resolved.year !== year ||
    resolved.month !== month ||
    resolved.day !== date ||
    resolved.hour !== 0 ||
    resolved.minute !== 0 ||
    resolved.second !== 0
  ) {
    throw new Error('LOCAL_MIDNIGHT_UNRESOLVED');
  }

  return candidate;
}

function intervalBounds(
  interval: CoverageInterval,
): readonly [number, number] | null {
  const start = Date.parse(interval.start);
  const end = Date.parse(interval.end);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
    return null;
  }
  return [start, end];
}

function fullyCovered(
  dayStart: number,
  dayEnd: number,
  intervals: readonly (readonly [number, number])[],
): boolean {
  const clipped = intervals
    .map(([start, end]) => [
      Math.max(start, dayStart),
      Math.min(end, dayEnd),
    ] as const)
    .filter(([start, end]) => end > start)
    .sort((a, b) => a[0] - b[0]);

  if (clipped.length === 0) return false;

  let cursor = dayStart;
  for (const [start, end] of clipped) {
    if (start > cursor) return false;
    if (end > cursor) cursor = end;
    if (cursor >= dayEnd) return true;
  }
  return cursor >= dayEnd;
}

export function summarizeCoverage(
  input: Readonly<{
    intervals: readonly CoverageInterval[];
    timezone: string;
  }>,
): CoverageSummary {
  new Intl.DateTimeFormat('en-US', {
    timeZone: input.timezone,
  }).format(new Date(0));

  const validComplete: Array<readonly [number, number]> = [];
  const incomplete: CoverageInterval[] = [];
  const excluded: CoverageInterval[] = [];
  const candidateDays = new Set<string>();

  for (const interval of input.intervals) {
    const bounds = intervalBounds(interval);
    if (bounds === null) {
      excluded.push(interval);
      continue;
    }

    if (!interval.complete) {
      incomplete.push(interval);
      continue;
    }

    validComplete.push(bounds);
    const [start, end] = bounds;
    let day = dayKey(new Date(start), input.timezone);
    const finalDay = dayKey(new Date(end - 1), input.timezone);

    while (day <= finalDay) {
      candidateDays.add(day);
      day = incrementDay(day);
    }
  }

  const completeDays: string[] = [];
  for (const day of [...candidateDays].sort()) {
    const dayStart = zonedMidnightMs(day, input.timezone);
    const dayEnd = zonedMidnightMs(incrementDay(day), input.timezone);
    if (fullyCovered(dayStart, dayEnd, validComplete)) {
      completeDays.push(day);
    }
  }

  return Object.freeze({
    timezone: input.timezone,
    completeDays: Object.freeze(completeDays),
    incompleteIntervals: Object.freeze(incomplete),
    excludedIntervals: Object.freeze(excluded),
    eligibleForThirtyDayProjection: completeDays.length >= 7,
  });
}
