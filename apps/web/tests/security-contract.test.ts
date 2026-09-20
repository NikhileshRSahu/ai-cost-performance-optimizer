import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read=(path:string)=>readFileSync(new URL(path,import.meta.url),'utf8');

test('provider credentials are owner-only',()=>{
  const source=read('../app/api/providers/connect/route.ts');
  assert.equal(source.includes("workspace.role!=='OWNER'"),true);
  assert.equal(source.includes("OWNER_REQUIRED"),true);
});

test('usage import rejects viewers',()=>{
  for(const path of ['../app/api/imports/preflight/route.ts','../app/api/imports/csv/route.ts']){
    const source=read(path);
    assert.equal(source.includes("workspace.role==='VIEWER'"),true);
    assert.equal(source.includes('OPERATOR_REQUIRED'),true);
  }
});

test('knowledge mutations reject viewers',()=>{
  const source=read('../app/api/knowledge/route.ts');
  assert.equal(source.includes("workspace.role==='VIEWER'"),true);
  assert.equal(source.includes('OPERATOR_REQUIRED'),true);
});

test('workspace onboarding mutations require owner',()=>{
  const source=read('../app/onboarding/actions.ts');
  const matches=source.match(/OWNER_REQUIRED/g)??[];
  assert.ok(matches.length>=2);
});

test('destructive evidence deletion remains owner-only',()=>{
  const source=read('../app/api/workspace/evidence/route.ts');
  assert.equal(source.includes("workspace.role!=='OWNER'"),true);
  assert.equal(source.includes('CONFIRMATION_MISMATCH'),true);
});

test('support, billing and audit routes are tenant-scoped',()=>{
  const support=read('../app/api/support/route.ts');
  const billing=read('../app/api/billing/pilot/route.ts');
  const audit=read('../app/api/workspace/audit/route.ts');
  assert.equal(support.includes('withRuntimeWorkspace'),true);
  assert.equal(billing.includes('withRuntimeWorkspace'),true);
  assert.equal(billing.includes("workspace.role!=='OWNER'"),true);
  assert.equal(audit.includes('organization_id=$1'),true);
});
