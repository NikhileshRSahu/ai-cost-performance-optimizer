import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read=(path:string)=>readFileSync(new URL(path,import.meta.url),'utf8');

const marketing=read('../components/MarketingHome.tsx');
const landing=read('../public/evalomics-final.html');
const dashboard=read('../components/DashboardApp.tsx');

test('marketing labels the public demo as sample, not live',()=>{
  assert.equal(marketing.includes('See the live demo'),false);
  assert.equal(marketing.includes('Explore sample demo'),true);
  assert.equal(marketing.includes('ILLUSTRATIVE SAMPLE SCENARIO'),true);
});

test('marketing does not imply Evalomics automatically changes production traffic',()=>{
  assert.equal(marketing.includes('No traffic changes until you approve an experiment.'),false);
  assert.equal(marketing.includes('does not change your production traffic automatically'),true);
});

test('sample workspace never presents itself as production',()=>{
  assert.equal(dashboard.includes("Meridian — Production"),false);
  assert.equal(dashboard.includes("Meridian — Sample workspace"),true);
  assert.equal(dashboard.includes('Running on live traffic.'),false);
  assert.equal(dashboard.includes('Illustrative snapshot'),true);
});

test('sample-only controls are visibly non-persistent',()=>{
  assert.equal(dashboard.includes('disabled>Sample workspace</button>'),true);
  assert.equal(dashboard.includes('disabled>Sample billing</button>'),true);
  assert.equal(dashboard.includes('disabled>Sample only</button>'),true);
});

test('evidence ladder language remains explicit',()=>{
  for(const tier of ['Observed','Potential','Tested','Verified']){
    assert.equal(marketing.includes(tier),true);
  }
  assert.equal(marketing.includes('estimates from production-verified savings'),true);
});


test('deployed landing clearly frames fictional metrics as an example',()=>{
  assert.equal(landing.includes('Example analysis'),true);
  assert.equal(landing.includes('what you should investigate first'),true);
});

test('deployed landing wires primary product actions',()=>{
  for(const href of ['/auth/sign-in','/auth/sign-up','/demo']){
    assert.equal(landing.includes('href="'+href+'"'),true);
  }
});

test('deployed landing does not use the removed engineering announcement or long disclaimer',()=>{
  assert.equal(landing.includes('V0 milestone'),false);
  assert.equal(landing.includes('Sample workspace — every figure is illustrative'),false);
});
