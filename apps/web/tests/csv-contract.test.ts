import test from 'node:test';
import assert from 'node:assert/strict';
import { parseUsageCsv } from '../backend/ingestion/csv';

const enc=new TextEncoder();
const parse=(csv:string)=>parseUsageCsv(enc.encode(csv),'org_test',false);

test('canonical request-level row imports',()=>{
  const r=parse('timestamp_start,timestamp_end,provider,model,requests,total_cost,currency,granularity\n2026-09-01T00:00:00Z,2026-09-01T00:00:01Z,OPENAI,gpt-5-mini,1,0.12,USD,REQUEST\n');
  assert.equal(r.records.length,1); assert.equal(r.issues.length,0); assert.equal(r.records[0]?.requests,'1');
});

test('canonical aggregate bucket preserves request count',()=>{
  const r=parse('timestamp_start,timestamp_end,provider,model,requests,total_cost,currency,granularity\n2026-09-01T00:00:00Z,2026-09-01T01:00:00Z,OPENAI,gpt-5-mini,103,4.25,USD,AGGREGATE_BUCKET\n');
  assert.equal(r.records.length,1); assert.equal(r.records[0]?.requests,'103'); assert.equal(r.records[0]?.granularity,'AGGREGATE_BUCKET');
});

test('compatibility timestamp + cost_usd aggregate row is normalized',()=>{
  const r=parse('timestamp,provider,model,requests,cost_usd,status\n2026-09-01T00:00:00,OPENAI,gpt-5-mini,103,4.25,success\n');
  assert.equal(r.records.length,1); assert.equal(r.records[0]?.granularity,'AGGREGATE_BUCKET'); assert.equal(r.records[0]?.successes,'103');
});

test('compatibility request row becomes REQUEST',()=>{
  const r=parse('timestamp,provider,model,requests,cost_usd,success\n2026-09-01T00:00:00,ANTHROPIC,claude-sonnet,1,0.08,true\n');
  assert.equal(r.records.length,1); assert.equal(r.records[0]?.granularity,'REQUEST'); assert.equal(r.records[0]?.successes,'1');
});

test('quoted comma in optional workload is accepted',()=>{
  const r=parse('timestamp_start,timestamp_end,provider,model,requests,total_cost,currency,workload\n2026-09-01T00:00:00Z,2026-09-01T00:05:00Z,OPENAI,gpt-5-mini,4,0.50,USD,"support, tier-1"\n');
  assert.equal(r.records.length,1); assert.equal(r.records[0]?.workload,'support, tier-1');
});

test('explicit timezone offsets are accepted',()=>{
  const r=parse('timestamp_start,timestamp_end,provider,model,requests,total_cost,currency\n2026-09-01T05:30:00+05:30,2026-09-01T06:30:00+05:30,OPENAI,gpt-5-mini,9,0.90,USD\n');
  assert.equal(r.records.length,1); assert.equal(r.issues.length,0);
});

test('REQUEST granularity rejects requests greater than one',()=>{
  const r=parse('timestamp_start,timestamp_end,provider,model,requests,total_cost,currency,granularity\n2026-09-01T00:00:00Z,2026-09-01T00:00:01Z,OPENAI,gpt-5-mini,2,0.12,USD,REQUEST\n');
  assert.equal(r.records.length,0); assert.equal(r.issues[0]?.code,'REQUEST_GRANULARITY_REQUIRES_ONE_ATTEMPT');
});

test('missing required column blocks file',()=>{
  assert.throws(()=>parse('timestamp_start,timestamp_end,provider,model,requests,total_cost\n2026-09-01T00:00:00Z,2026-09-01T00:00:01Z,OPENAI,gpt-5-mini,1,0.12\n'),/MISSING_COLUMN:currency/);
});

test('unsupported column blocks ambiguous schema',()=>{
  assert.throws(()=>parse('timestamp_start,timestamp_end,provider,model,requests,total_cost,currency,mystery\n2026-09-01T00:00:00Z,2026-09-01T00:00:01Z,OPENAI,gpt-5-mini,1,0.12,USD,x\n'),/UNSUPPORTED_COLUMN:mystery/);
});

test('negative cost is rejected without corrupting other rows',()=>{
  const r=parse('timestamp_start,timestamp_end,provider,model,requests,total_cost,currency\n2026-09-01T00:00:00Z,2026-09-01T00:01:00Z,OPENAI,gpt-5-mini,1,-0.12,USD\n2026-09-01T00:01:00Z,2026-09-01T00:02:00Z,OPENAI,gpt-5-mini,1,0.11,USD\n');
  assert.equal(r.records.length,1); assert.equal(r.issues.length,1); assert.equal(r.issues[0]?.code,'NEGATIVE_MONEY');
});

test('outcomes cannot exceed represented requests',()=>{
  const r=parse('timestamp_start,timestamp_end,provider,model,requests,total_cost,currency,successes,failures\n2026-09-01T00:00:00Z,2026-09-01T01:00:00Z,OPENAI,gpt-5-mini,10,1.20,USD,9,2\n');
  assert.equal(r.records.length,0); assert.equal(r.issues[0]?.code,'OUTCOMES_EXCEED_REQUESTS');
});
