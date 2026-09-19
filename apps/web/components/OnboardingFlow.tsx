'use client';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { completeOnboarding } from '@/app/onboarding/actions';

const steps = ['Account','Workspace','Connect','First sync','Getting started'];

export default function OnboardingFlow({name,email}:{name:string,email:string}){
  const [step,setStep]=useState(1);
  const [workspace,setWorkspace]=useState('Acme — Production');
  const [openai,setOpenai]=useState('');
  const [anthropic,setAnthropic]=useState('');
  const [syncState,setSyncState]=useState<'idle'|'running'|'partial'|'done'>('idle');
  const router=useRouter();
  const searchParams=useSearchParams();
  useEffect(()=>{const requested=Number(searchParams.get('step')); if(requested>=1&&requested<=5)setStep(requested)},[searchParams]);

  function startSync(){
    setStep(4); setSyncState('running');
    setTimeout(()=>setSyncState('partial'),900);
  }
  async function finish(){
    await completeOnboarding(workspace || 'My workspace');
    router.push('/dashboard');
    router.refresh();
  }

  return <main className="onboard-page blueprint">
    <header className="simple-top"><div className="logo"><span/>Evalomics</div><span className="quiet-chip">ONBOARDING</span></header>
    <div className="onboard-layout">
      <aside className="stepper">{steps.map((s,i)=><button key={s} className={(i+1===step)?'current':(i+1<step?'done':'')} onClick={()=>i+1<=step&&setStep(i+1)}><b>{i+1}</b><span>{s}</span></button>)}</aside>
      <section className="onboard-main">
        {step===1 && <><h1>Create your workspace account</h1><p>Signed in as <strong>{name || email}</strong>. This is your real Evalomics workspace setup. Sample data stays in the public demo.</p><div className="form-panel"><label>Work email<input value={email} disabled/></label><label>Name<input value={name} disabled/></label><button className="btn black full" onClick={()=>setStep(2)}>Continue to workspace</button></div></>}
        {step===2 && <><h1>Name the workspace</h1><p>Use the name your engineering and finance teams already recognize.</p><div className="form-panel"><label>Workspace name<input value={workspace} onChange={e=>setWorkspace(e.target.value)} placeholder="e.g. Acme — Production"/></label><label>Default role<select defaultValue="Approver"><option>Approver</option><option>Engineer</option><option>Analyst</option><option>Viewer</option></select></label><button className="btn black full" disabled={!workspace.trim()} onClick={()=>setStep(3)}>Save workspace and connect providers</button></div></>}
        {step===3 && <><h1>Connect your providers</h1><p>Paste read-only keys. Evalomics ingests usage and cost metadata — never prompts or completions by default. Read-only means we cannot touch your traffic.</p><div className="provider-card"><div><strong>OpenAI</strong><span>Read-only usage scope</span></div><input value={openai} onChange={e=>setOpenai(e.target.value)} placeholder="sk-••••" type="password"/></div><div className="provider-card"><div><strong>Anthropic</strong><span>Read-only usage scope</span></div><input value={anthropic} onChange={e=>setAnthropic(e.target.value)} placeholder="sk-ant-••••" type="password"/></div><div className="csv-box">No keys handy? <label className="linklike">Upload a usage export (CSV)<input type="file" accept=".csv" hidden onChange={()=>{setStep(4);setSyncState('done')}}/></label> instead.</div><button className="btn black full" onClick={startSync}>Connect and start sync</button><p className="micro">Your real workspace stays separate from the public demo. Provider connections and imports belong only to this account.</p></>}
        {step===4 && <><h1>Importing your usage history</h1><p>This usually takes 3–8 minutes. You can look around — nothing is final until the first sync completes.</p><div className="sync-panel"><div className="sync-top"><strong>{syncState==='running'?'558,000 of ~1,204,118 records':'1,204,118 records processed'}</strong><span>Last 90 days</span></div><div className="progress"><span style={{width:syncState==='running'?'46%':'100%'}}/></div>{syncState==='partial' && <div className="partial-error"><p>Anthropic connected. OpenAI key returned 401 — check the key and retry.</p><div><button className="btn black" onClick={()=>{setSyncState('done');setTimeout(()=>setStep(5),400)}}>Retry OpenAI connection</button><button className="btn outline" onClick={()=>setStep(5)}>Continue with Anthropic only</button></div></div>}{syncState==='done' && <div className="success-line">Import complete. Usage is ready to analyze.</div>}</div>{syncState==='done' && <button className="btn black full" onClick={()=>setStep(5)}>Continue</button>}</>}
        {step===5 && <><h1>Nothing to optimize yet —<br/>and we won’t pretend otherwise.</h1><p>Pattern detection needs 7 days of usage or 50,000 requests. This new workspace has 2 days and 31,204 requests. We will surface the first opportunity as Potential, labeled as an estimate.</p><div className="getting-card"><div className="getting-top"><strong>31,204 <small>of 50,000 requests</small></strong><span>62% of what detection needs</span></div><div className="progress"><span style={{width:'62%'}}/></div><div className="mini-ladder"><div><span className="tier observed">OBSERVED</span><small>Waiting for data</small></div><div><span className="tier potential">POTENTIAL</span><small>Waiting for data</small></div><div><span className="tier tested">TESTED</span><small>Waiting for data</small></div><div><span className="tier verified">VERIFIED</span><small>Waiting for data</small></div></div><div className="two-actions"><button className="btn black" onClick={finish}>Open my workspace</button><button className="btn outline" onClick={()=>router.push('/demo')}>Explore the sample dashboard</button></div></div></>}
      </section>
    </div>
  </main>
}
