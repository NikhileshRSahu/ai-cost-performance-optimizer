import { describe, expect, it } from 'vitest';
import { summarizeCoverage } from '../../src/coverage/coverage.js';
import { MAX_BYTES, MAX_CELL, parseUsageCsv } from '../../src/ingestion/csv.js';
import { importUsageCsv } from '../../src/ingestion/import.js';

const enc = new TextEncoder();

describe('ingestion hardening', () => {
  it('records source capabilities and effective import interval', () => {
    const csv =
      'timestamp_start,timestamp_end,provider,model,requests,total_cost,currency,source_event_id,input_tokens,latency_p95_ms,successes,tool_calls,granularity\n' +
      '2026-09-02T00:00:00Z,2026-09-03T00:00:00Z,openai,gpt-x,2,2,USD,e2,20,100,2,1,AGGREGATE_BUCKET\n' +
      '2026-09-01T00:00:00Z,2026-09-02T00:00:00Z,openai,gpt-x,2,1,USD,e1,10,90,2,0,AGGREGATE_BUCKET\n';

    const result = importUsageCsv({
      bytes: enc.encode(csv),
      organizationId: 'org',
      receivedAt: '2026-09-13T00:00:00Z',
      requestedInterval: {
        start: '2026-09-01T00:00:00Z',
        end: '2026-09-04T00:00:00Z',
      },
    });

    expect(result.run.effectiveInterval).toEqual({
      start: '2026-09-01T00:00:00Z',
      end: '2026-09-03T00:00:00Z',
    });
    expect(result.run.capabilities).toMatchObject({
      requestGranularity: true,
      tokenClasses: true,
      latency: true,
      success: true,
      toolUsage: true,
      stableEventIdentifier: true,
      apiKeyIdentifier: false,
    });
  });

  it('rejects unsupported ISO currency codes', () => {
    const csv =
      'timestamp_start,timestamp_end,provider,model,requests,total_cost,currency\n' +
      '2026-09-01T00:00:00Z,2026-09-02T00:00:00Z,openai,gpt-x,2,1,ZZZ\n';
    const parsed = parseUsageCsv(enc.encode(csv), 'org');

    expect(parsed.records).toHaveLength(0);
    expect(parsed.issues[0]?.code).toBe('UNSUPPORTED_CURRENCY');
  });

  it('enforces byte and decoded cell limits', () => {
    expect(() => parseUsageCsv(new Uint8Array(MAX_BYTES + 1), 'org')).toThrow(
      'FILE_TOO_LARGE',
    );

    const hugeModel = 'x'.repeat(MAX_CELL + 1);
    const csv =
      'timestamp_start,timestamp_end,provider,model,requests,total_cost,currency\n' +
      `2026-09-01T00:00:00Z,2026-09-02T00:00:00Z,openai,${hugeModel},1,1,USD\n`;

    const parsed = parseUsageCsv(enc.encode(csv), 'org');
    expect(parsed.records).toHaveLength(0);
    expect(parsed.issues[0]?.code).toBe('CELL_TOO_LARGE');
  });
});

describe('coverage union', () => {
  it('combines adjacent complete intervals into one complete day', () => {
    const summary = summarizeCoverage({
      timezone: 'UTC',
      intervals: [
        {
          start: '2026-09-01T00:00:00Z',
          end: '2026-09-01T12:00:00Z',
          complete: true,
        },
        {
          start: '2026-09-01T12:00:00Z',
          end: '2026-09-02T00:00:00Z',
          complete: true,
        },
      ],
    });

    expect(summary.completeDays).toEqual(['2026-09-01']);
  });

  it('does not invent a complete day across a coverage gap', () => {
    const summary = summarizeCoverage({
      timezone: 'UTC',
      intervals: [
        {
          start: '2026-09-01T00:00:00Z',
          end: '2026-09-01T12:00:00Z',
          complete: true,
        },
        {
          start: '2026-09-01T13:00:00Z',
          end: '2026-09-02T00:00:00Z',
          complete: true,
        },
      ],
    });

    expect(summary.completeDays).toEqual([]);
  });

  it('counts a 23-hour DST day by local calendar boundaries', () => {
    const summary = summarizeCoverage({
      timezone: 'America/New_York',
      intervals: [
        {
          start: '2026-03-08T00:00:00-05:00',
          end: '2026-03-09T00:00:00-04:00',
          complete: true,
        },
      ],
    });

    expect(summary.completeDays).toEqual(['2026-03-08']);
  });

  it('counts overlapping coverage once and still requires seven days', () => {
    const intervals = Array.from({ length: 7 }, (_, index) => {
      const day = String(index + 1).padStart(2, '0');
      const next = String(index + 2).padStart(2, '0');
      return {
        start: `2026-09-${day}T00:00:00Z`,
        end: `2026-09-${next}T00:00:00Z`,
        complete: true,
      };
    });
    intervals.push({
      start: '2026-09-01T06:00:00Z',
      end: '2026-09-01T18:00:00Z',
      complete: true,
    });

    const summary = summarizeCoverage({ timezone: 'UTC', intervals });

    expect(summary.completeDays).toHaveLength(7);
    expect(summary.eligibleForThirtyDayProjection).toBe(true);
  });
});
