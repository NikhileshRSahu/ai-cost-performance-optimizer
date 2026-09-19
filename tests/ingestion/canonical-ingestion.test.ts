import { describe, expect, it } from 'vitest';
import { summarizeCoverage } from '../../src/coverage/coverage.js';
import { parseUsageCsv } from '../../src/ingestion/csv.js';
import { importUsageCsv } from '../../src/ingestion/import.js';
import { excludeUnreconciledOverlaps } from '../../src/usage/overlap.js';

const enc = new TextEncoder();
const header =
  'timestamp_start,timestamp_end,provider,model,requests,total_cost,currency,source_event_id,operation_id,attempt_number,granularity\n';
const row =
  '2026-09-01T00:00:00Z,2026-09-02T00:00:00Z,openai,gpt-x,1,1.25,USD,e1,op1,1,AGGREGATE_BUCKET\n';

describe('canonical CSV ingestion', () => {
  it('defaults missing optional values to null and preserves exact money strings', () => {
    const csv =
      'timestamp_start,timestamp_end,provider,model,requests,total_cost,currency\n' +
      '2026-09-01T00:00:00Z,2026-09-02T00:00:00Z,openai,gpt-x,2,1.2300,USD\n';
    const result = parseUsageCsv(enc.encode(csv), 'org');

    expect(result.records[0]?.granularity).toBe('AGGREGATE_BUCKET');
    expect(result.records[0]?.totalCost).toBe('1.2300');
    expect(result.records[0]?.workload).toBeNull();
  });

  it('skips exact source-event duplicates', () => {
    const result = importUsageCsv({
      bytes: enc.encode(header + row + row),
      organizationId: 'org',
      receivedAt: '2026-09-13T00:00:00Z',
    });

    expect(result.run.accepted).toBe(1);
    expect(result.run.skippedDuplicates).toBe(1);
    expect(result.run.blocked).toBe(false);
  });

  it('rejects conflicting duplicate event ids only for affected row', () => {
    const other =
      '2026-09-01T00:00:00Z,2026-09-02T00:00:00Z,openai,gpt-x,1,2.25,USD,e1,op1,1,AGGREGATE_BUCKET\n';
    const result = importUsageCsv({
      bytes: enc.encode(header + row + other),
      organizationId: 'org',
      receivedAt: '2026-09-13T00:00:00Z',
    });

    expect(result.run.accepted).toBe(1);
    expect(result.run.rejected).toBe(1);
    expect(result.run.partial).toBe(true);
  });

  it('retains repeated attempts when operation id is shared', () => {
    const h =
      'timestamp_start,timestamp_end,provider,model,requests,total_cost,currency,operation_id,attempt_number,granularity\n';
    const a =
      '2026-09-01T00:00:00Z,2026-09-01T00:01:00Z,openai,gpt-x,1,1,USD,op,1,REQUEST\n';
    const b =
      '2026-09-01T00:01:00Z,2026-09-01T00:02:00Z,openai,gpt-x,1,1,USD,op,2,REQUEST\n';
    const result = importUsageCsv({
      bytes: enc.encode(h + a + b),
      organizationId: 'org',
      receivedAt: '2026-09-13T00:00:00Z',
    });

    expect(result.run.accepted).toBe(2);
  });

  it('accepts common request-level AI usage export aliases', () => {
    const csv =
      'timestamp,provider,model,request_id,workspace,user_or_service,input_tokens,output_tokens,cached_input_tokens,requests,cost_usd,latency_ms,status,retry_count,tool_calls,workflow,prompt_category,quality_score,success\n' +
      '2026-09-19T10:00:00Z,OpenAI,gpt-4o,req_001,support,support_agent,1200,240,0,1,0.42,1380,success,0,2,support_answer,generation,0.94,true\n';

    const parsed = parseUsageCsv(enc.encode(csv), 'org');

    expect(parsed.records).toHaveLength(1);
    expect(parsed.records[0]).toMatchObject({
      provider: 'OpenAI',
      model: 'gpt-4o',
      sourceEventId: 'req_001',
      workspace: 'support',
      workload: 'support_answer',
      requests: '1',
      totalCost: '0.42',
      currency: 'USD',
      latencyP50Ms: '1380',
      successes: '1',
      failures: '0',
      granularity: 'REQUEST',
    });
    expect(parsed.records[0]?.intervalStart).toBe('2026-09-19T10:00:00Z');
    expect(Date.parse(parsed.records[0]?.intervalEnd ?? '')).toBe(
      Date.parse('2026-09-19T10:00:00Z') + 1,
    );
  });

  it('normalizes timezone-less request-level timestamps to UTC', () => {
    const csv =
      'timestamp,provider,model,request_id,workspace,input_tokens,output_tokens,cached_input_tokens,requests,cost_usd,latency_ms,status,retry_count,tool_calls,workflow,success\n' +
      '2026-09-19T10:00:00,OpenAI,gpt-4o,req_utc_001,support,1200,240,0,1,0.42,1380,success,0,2,support_answer,true\n';

    const parsed = parseUsageCsv(enc.encode(csv), 'org');

    expect(parsed.records).toHaveLength(1);
    expect(parsed.records[0]?.intervalStart).toBe('2026-09-19T10:00:00.000Z');
    expect(parsed.records[0]?.intervalEnd).toBe('2026-09-19T10:00:00.001Z');
  });

  it('rejects server-owned and unknown CSV columns', () => {
    expect(() =>
      parseUsageCsv(
        enc.encode(
          'timestamp_start,timestamp_end,provider,model,requests,total_cost,currency,organization_id\n',
        ),
        'org',
      ),
    ).toThrow(/UNSUPPORTED_COLUMN/);
  });

  it('blocks analysis when all rows fail', () => {
    const bad =
      'timestamp_start,timestamp_end,provider,model,requests,total_cost,currency\nnope,nope,p,m,1,1,USD\n';
    const result = importUsageCsv({
      bytes: enc.encode(bad),
      organizationId: 'org',
      receivedAt: '2026-09-13T00:00:00Z',
    });

    expect(result.run.blocked).toBe(true);
    expect(result.run.accepted).toBe(0);
  });
});

describe('coverage', () => {
  it('requires seven explicit complete local days', () => {
    const intervals = Array.from({ length: 7 }, (_, i) => ({
      start: `2026-09-${String(i + 1).padStart(2, '0')}T00:00:00Z`,
      end: `2026-09-${String(i + 2).padStart(2, '0')}T00:00:00Z`,
      complete: true,
    }));

    expect(
      summarizeCoverage({ intervals, timezone: 'UTC' })
        .eligibleForThirtyDayProjection,
    ).toBe(true);
  });

  it('does not count partial buckets as complete days', () => {
    const summary = summarizeCoverage({
      intervals: [
        {
          start: '2026-09-01T01:00:00Z',
          end: '2026-09-01T23:00:00Z',
          complete: true,
        },
      ],
      timezone: 'UTC',
    });

    expect(summary.completeDays).toEqual([]);
  });
});

describe('overlap safety', () => {
  it('excludes unreconciled request/aggregate overlaps', () => {
    const a = parseUsageCsv(enc.encode(header + row), 'org').records[0];
    expect(a).toBeDefined();
    if (a === undefined) throw new Error('expected parsed record');
    const b = {
      ...a,
      granularity: 'REQUEST' as const,
      fingerprint: 'f'.repeat(64),
      sourceLine: 99,
    };
    const result = excludeUnreconciledOverlaps([a, b]);

    expect(result.included).toHaveLength(0);
    expect(result.excluded).toHaveLength(2);
  });
});
