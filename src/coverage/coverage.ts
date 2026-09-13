import type { CoverageInterval, CoverageSummary } from '../usage/contracts.js';

function dayKey(date: Date, timezone: string): string {
  return new Intl.DateTimeFormat('en-CA',{timeZone:timezone,year:'numeric',month:'2-digit',day:'2-digit'}).format(date);
}

export function summarizeCoverage(input: Readonly<{
  intervals: readonly CoverageInterval[];
  timezone: string;
}>): CoverageSummary {
  // Throws for invalid IANA timezone.
  new Intl.DateTimeFormat('en-US',{timeZone:input.timezone}).format(new Date(0));
  const complete = new Set<string>();
  const incomplete: CoverageInterval[] = [];
  const excluded: CoverageInterval[] = [];
  for (const interval of input.intervals) {
    const start = new Date(interval.start), end = new Date(interval.end);
    if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()) || end <= start) {
      excluded.push(interval); continue;
    }
    const startDay = dayKey(start,input.timezone);
    const endMinus = new Date(end.getTime()-1);
    const endDay = dayKey(endMinus,input.timezone);
    if (!interval.complete || startDay !== endDay) {
      incomplete.push(interval); continue;
    }
    // A complete interval counts a day only when it spans that entire local day.
    const pieces = new Intl.DateTimeFormat('en-US',{timeZone:input.timezone,hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).formatToParts(start);
    const h = Number(pieces.find(p=>p.type==='hour')?.value ?? -1);
    const m = Number(pieces.find(p=>p.type==='minute')?.value ?? -1);
    const s = Number(pieces.find(p=>p.type==='second')?.value ?? -1);
    const endParts = new Intl.DateTimeFormat('en-US',{timeZone:input.timezone,hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).formatToParts(end);
    const eh = Number(endParts.find(p=>p.type==='hour')?.value ?? -1);
    const em = Number(endParts.find(p=>p.type==='minute')?.value ?? -1);
    const es = Number(endParts.find(p=>p.type==='second')?.value ?? -1);
    const nextDay = dayKey(end,input.timezone) !== startDay;
    if (h===0 && m===0 && s===0 && eh===0 && em===0 && es===0 && nextDay) complete.add(startDay);
    else incomplete.push(interval);
  }
  const completeDays = Object.freeze([...complete].sort());
  return Object.freeze({
    timezone:input.timezone,
    completeDays,
    incompleteIntervals:Object.freeze(incomplete),
    excludedIntervals:Object.freeze(excluded),
    eligibleForThirtyDayProjection: completeDays.length >= 7
  });
}
