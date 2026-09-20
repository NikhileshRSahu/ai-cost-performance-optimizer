import test from 'node:test';
import assert from 'node:assert/strict';
import { enforceRateLimit } from '../lib/rate-limit';

function fakePool(){
  let count=0;
  return {
    query:async()=>({rows:[{request_count:++count}]})
  } as any;
}

test('rate limiter allows requests through the configured limit',async()=>{
  const pool=fakePool();
  await enforceRateLimit({pool,organizationId:'org_test',scope:'copilot',limit:2,windowSeconds:60});
  const result=await enforceRateLimit({pool,organizationId:'org_test',scope:'copilot',limit:2,windowSeconds:60});
  assert.equal(result.count,2);
});

test('rate limiter rejects requests over the configured limit',async()=>{
  const pool=fakePool();
  await enforceRateLimit({pool,organizationId:'org_test',scope:'copilot',limit:1,windowSeconds:60});
  await assert.rejects(
    ()=>enforceRateLimit({pool,organizationId:'org_test',scope:'copilot',limit:1,windowSeconds:60}),
    /RATE_LIMITED/
  );
});
