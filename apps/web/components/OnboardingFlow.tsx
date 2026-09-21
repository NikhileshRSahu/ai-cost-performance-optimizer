'use client';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { track } from '@vercel/analytics';
import { completeOnboarding, saveWorkspaceName } from '@/app/onboarding/actions';

const steps=['Welcome','Name','Add usage','Analyze','See results'];

type Preflight=Readonly<{
  canImport:boolean;parserError:string|null;
  file:Readonly<{name:string;size:number;headers:readonly string[]}>;
  accepted:number;rejected:number;totalRows:number;acceptanceRate:number;
  requests:number;spend:number;granularities:readonly string[];currencies:readonly string[];
  providers:readonly string[];models:readonly string[];
  issueGroups:readonly Readonly<{code:string;count:number}>[];
}>;
type Doctor=Readonly<{answer:string;why:string;evidence:readonly string[];nextAction:string;confidence:string;caveats:readonly string[]}>;
type Summary=Readonly<{
  observedSpend:string|null;currency:string;requests:string;completeImports:number;
  providers:readonly Readonly<{provider:string;status:string;lastSyncAt:string|null}>[];
  evidenceCounts:Readonly<{potential:number;tested:number;verified:number}>;
}>;

function errorCopy(code:string){
  const map:Record<string,string>={
    PROVIDER_CREDENTIAL_REJECTED:'The provider rejected this admin key. Check that it has organization usage/cost access.',
    PROVIDER_RATE_LIMITED:'The provider rate-limited the sync. Wait a moment and retry.',
    PROVIDER_CONNECTION_NOT_CONFIGURED:'The provider connection is not configured.',
    PROVIDER_SYNC_FAILED:'The provider sync failed. No evidence was marked ready.',
    FILE_TOO_LARGE:'The CSV is larger than 10 MB.',
    TOO_MANY_ROWS:'The CSV contains more than 50,000 rows.',
    EMPTY_CSV:'The CSV is empty.',
    IMPORT_FAILED:'The CSV could not be imported. Check the required columns and formats.'
  };
  if(code.startsWith('MISSING_COLUMN:')) return 'Missing required CSV column: '+code.slice('MISSING_COLUMN:'.length);
  if(code.startsWith('UNSUPPORTED_COLUMN:')) return 'Unsupported CSV column: '+code.slice('UNSUPPORTED_COLUMN:'.length);
  return map[code] ?? 'The operation failed. Nothing was marked complete.';
}

export default function OnboardingFlow({name,email,initialWorkspace}:{name:string,email:string,initialWorkspace:string}){
  const [step,setStep]=useState(1);
  const [workspace,setWorkspace]=useState(initialWorkspace || 'My AI Workspace');
  const [openai,setOpenai]=useState('');
  const [anthropic,setAnthropic]=useState('');
  const [syncState,setSyncState]=useState<'idle'|'running'|'partial'|'done'|'error'>('idle');
  const [messages,setMessages]=useState<string[]>([]);
  const [summary,setSummary]=useState<Summary|null>(null);
  const [pendingCsv,setPendingCsv]=useState<File|null>(null);
  const [preflight,setPreflight]=useState<Preflight|null>(null);
  const [doctor,setDoctor]=useState<Doctor|null>(null);
  const [preflightLoading,setPreflightLoading]=useState(false);
  const router=useRouter();
  const searchParams=useSearchParams();

  useEffect(()=>{
    const requested=Number(searchParams.get('step'));
    if(requested>=1&&requested<=5)setStep(requested);
  },[searchParams]);

  async function refreshSummary(){
    const response=await fetch('/api/workspace/summary',{cache:'no-store'});
    const json=await response.json();
    if(json.ok){setSummary(json.summary);return json.summary as Summary}
    return null;
  }

  async function saveWorkspace(){
    if(!workspace.trim()) return;
    await saveWorkspaceName(workspace);
    setStep(3);
  }

  async function connectOne(provider:'OPENAI'|'ANTHROPIC',adminKey:string){
    const response=await fetch('/api/providers/connect',{
      method:'POST',headers:{'content-type':'application/json'},
      body:JSON.stringify({provider,adminKey})
    });
    const json=await response.json();
    if(!json.ok) throw new Error(json.error || 'PROVIDER_SYNC_FAILED');
    return json.result;
  }

  async function startSync(){
    const jobs:Array<Promise<{provider:string;ok:boolean;message:string}>>=[];
    if(openai.trim()) jobs.push(connectOne('OPENAI',openai).then(r=>({provider:'OpenAI API',ok:true,message:(Number(r.usageRows||0)+Number(r.costRows||0))>0?'Connected and synced '+String(r.usageRows)+' usage rows + '+String(r.costRows)+' cost rows.':'Connected successfully, but OpenAI returned no usage or cost rows for the last 7 days.'})).catch(e=>({provider:'OpenAI API',ok:false,message:errorCopy(e.message)})));
    if(anthropic.trim()) jobs.push(connectOne('ANTHROPIC',anthropic).then(r=>({provider:'Anthropic API (beta)',ok:true,message:(Number(r.usageRows||0)+Number(r.costRows||0))>0?'Beta connection succeeded and synced '+String(r.usageRows)+' usage rows + '+String(r.costRows)+' cost rows.':'Beta connection succeeded, but Anthropic returned no usage or cost rows for the last 7 days.'})).catch(e=>({provider:'Anthropic API (beta)',ok:false,message:errorCopy(e.message)})));
    if(jobs.length===0){
      setMessages(['Enter at least one provider admin key, or upload a CSV instead.']);
      return;
    }
    setStep(4);setSyncState('running');setMessages([]);
    const results=await Promise.all(jobs);
    setOpenai('');setAnthropic('');
    setMessages(results.map(r=>r.provider+': '+r.message));
    const ok=results.filter(r=>r.ok).length;
    setSyncState(ok===results.length?'done':ok>0?'partial':'error');track('provider_sync_completed',{providers:results.length,succeeded:ok});
    await refreshSummary();
  }

  async function inspectCsv(file:File){
    setPendingCsv(file);setPreflight(null);setDoctor(null);setPreflightLoading(true);setMessages([]);track('csv_preflight_started',{size:file.size});
    const form=new FormData();form.set('file',file);
    try{
      const response=await fetch('/api/imports/preflight',{method:'POST',body:form});
      const json=await response.json();
      if(!response.ok||!json.ok) throw new Error(json.error||'PREFLIGHT_FAILED');
      setPreflight(json.profile);setDoctor(json.doctor||null);track('csv_preflight_completed',{canImport:Boolean(json.profile?.canImport),accepted:Number(json.profile?.accepted||0),rejected:Number(json.profile?.rejected||0)});
    }catch{
      setMessages(['Evalomics could not inspect this file. Nothing was imported.']);
    }finally{setPreflightLoading(false)}
  }

  async function confirmCsvImport(){
    if(!pendingCsv)return;
    await uploadCsv(pendingCsv);
    setPendingCsv(null);setPreflight(null);setDoctor(null);
  }

  async function uploadCsv(file:File){
    setStep(4);setSyncState('running');setMessages(['Uploading '+file.name+'…']);
    const form=new FormData();form.set('file',file);
    const response=await fetch('/api/imports/csv',{method:'POST',body:form});
    const json=await response.json();
    if(!json.ok){
      setSyncState('error');setMessages([errorCopy(json.error || 'IMPORT_FAILED')]);return;
    }
    const r=json.result;
    setMessages([
      file.name+': '+String(r.accepted)+' rows accepted, '+String(r.rejected)+' rejected, '+String(r.warnings)+' warnings.'
    ]);
    setSyncState(r.rejected>0?'partial':'done');track('csv_import_completed',{accepted:Number(r.accepted||0),rejected:Number(r.rejected||0),warnings:Number(r.warnings||0)});
    await refreshSummary();
  }

  async function finish(){
    await completeOnboarding(workspace || 'My AI Workspace');
    track('onboarding_completed',{hasEvidence});router.push('/dashboard');
    router.refresh();
  }

  const hasEvidence=Boolean(summary?.observedSpend)||(summary?.completeImports??0)>0||(summary?.providers.length??0)>0;
  const requestCount=Number(summary?.requests??0);

  return <main className="onboard-page blueprint">
    <header className="simple-top"><div className="logo"><span/>Evalomics</div><span className="quiet-chip">ONBOARDING</span></header>
    <div className="onboard-layout">
      <aside className="stepper">{steps.map((s,i)=><button key={s} className={(i+1===step)?'current':(i+1<step?'done':'')} onClick={()=>i+1<=step&&setStep(i+1)}><b>{i+1}</b><span>{s}</span></button>)}</aside>
      <section className="onboard-main">
        {step===1&&<><h1>You’re in.</h1><p>Signed in as <strong>{name||email}</strong>. Next, we’ll help you add AI usage so Evalomics can show where your money is going. You do not need to understand APIs or cost analytics to continue.</p><div className="form-panel"><label>Work email<input value={email} disabled/></label><label>Name<input value={name} disabled/></label><button className="btn black full" onClick={()=>setStep(2)}>Continue</button></div></>}
        {step===2&&<><h1>What should we call this?</h1><p>This is only the name of the place where your AI usage and results will live. Your company name is usually the easiest choice.</p><div className="form-panel"><label>Workspace name<input value={workspace} onChange={e=>setWorkspace(e.target.value)} placeholder="e.g. Acme"/></label><label>Your role<select value="OWNER" disabled><option value="OWNER">Owner</option></select></label><button className="btn black full" disabled={!workspace.trim()} onClick={saveWorkspace}>Save and continue</button></div></>}
        {step===3&&<><h1>Add your AI usage</h1><p>Choose the easiest option for you. If you already have a usage CSV, upload it. If you manage your company’s OpenAI or Anthropic account, you can connect it directly. Both options are read-only.</p>
          <div className="provider-card"><div><strong>OpenAI</strong><span>For people who manage the company OpenAI API account. This is not your normal ChatGPT login.</span></div><input value={openai} onChange={e=>setOpenai(e.target.value)} placeholder="sk-admin-••••" type="password" autoComplete="off"/></div>
          <div className="provider-card"><div><strong>Anthropic <small className="beta-chip">BETA</small></strong><span>For people who manage the company Anthropic API account.</span></div><input value={anthropic} onChange={e=>setAnthropic(e.target.value)} placeholder="sk-ant-admin-••••" type="password" autoComplete="off"/></div>
          <div className="csv-box"><strong>Don’t have an admin key?</strong> <label className="linklike">Upload a usage CSV<input type="file" accept=".csv,text/csv" hidden onChange={e=>{const f=e.target.files?.[0];if(f)void inspectCsv(f);e.currentTarget.value=''}}/></label> — this is usually the easiest way to start.</div>
          {preflightLoading&&<div className="import-doctor loading"><span className="doctor-mark">✦</span><div><strong>Evalomics is reading the file before import.</strong><p>Checking structure, row semantics, request aggregation and data coverage. Nothing has been written yet.</p></div></div>}
          {preflight&&!preflightLoading&&<div className={'import-doctor '+(preflight.canImport?'ready':'blocked')}>
            <div className="doctor-head"><div><span className="doctor-mark">✦</span><div><small>IMPORT DOCTOR</small><strong>{doctor?.answer||(preflight.canImport?'I can understand this file.':'This file needs attention before import.')}</strong></div></div><span>{Math.round(preflight.acceptanceRate*100)}% parseable</span></div>
            <p>{doctor?.why||(preflight.parserError?'Parser issue: '+preflight.parserError:'Evalomics profiled the file without writing it to your workspace.')}</p>
            <div className="doctor-stats"><div><span>Rows understood</span><b>{preflight.accepted.toLocaleString()}{preflight.totalRows?'/'+preflight.totalRows.toLocaleString():''}</b></div><div><span>Requests represented</span><b>{preflight.requests.toLocaleString()}</b></div><div><span>Spend represented</span><b>{preflight.currencies.length===1?preflight.currencies[0]+' ':''}{preflight.spend.toLocaleString(undefined,{maximumFractionDigits:2})}</b></div><div><span>Granularity</span><b>{preflight.granularities.join(' + ')||'Unknown'}</b></div></div>
            {(doctor?.evidence?.length??0)>0&&<ul className="doctor-evidence">{doctor?.evidence?.slice(0,4).map((e,i)=><li key={i}>{e}</li>)}</ul>}
            {preflight.issueGroups.length>0&&<div className="doctor-issues"><strong>What needs attention</strong>{preflight.issueGroups.slice(0,4).map(x=><span key={x.code}>{x.count} × {x.code}</span>)}</div>}
            <div className="doctor-next"><span>Next action</span><strong>{doctor?.nextAction||(preflight.canImport?'Import this dataset and analyze it.':'Correct the mapping or source file, then inspect again.')}</strong></div>
            <div className="two-actions">{preflight.canImport&&<button className="btn black" onClick={()=>void confirmCsvImport()}>Import this data</button>}<label className="btn outline">Choose another CSV<input type="file" accept=".csv,text/csv" hidden onChange={e=>{const f=e.target.files?.[0];if(f)void inspectCsv(f);e.currentTarget.value=''}}/></label></div>
            <small className="doctor-foot">AI explains the profile. The deterministic parser decides what can actually be imported.</small>
          </div>}
          {messages.length>0&&<div className="partial-error">{messages.map((m,i)=><p key={i}>{m}</p>)}</div>}
          <button className="btn black full" onClick={startSync}>Connect and analyze</button><p className="micro">Not sure which option to use? Start with a CSV. You can add or change sources later.</p></>}
        {step===4&&<><h1>{syncState==='running'?'Reading your AI usage':syncState==='error'?'We could not finish that import':'Your usage is ready'}</h1><p>{syncState==='running'?'Evalomics is checking the data, adding up your spend, and looking for useful patterns. You can wait here — there is nothing else you need to configure.':syncState==='partial'?'Some evidence loaded, but one part failed. The successful source remains isolated and usable.':syncState==='done'?'Your data is ready. Next you’ll see what Evalomics found and what is worth looking at first.':'Nothing was changed. Go back and try the connection again, or use a CSV instead.'}</p>
          <div className="sync-panel"><div className="sync-top"><strong>{syncState==='running'?'Processing…':syncState==='done'?'Ready':syncState==='partial'?'Partially ready':'Needs attention'}</strong><span>Your data</span></div><div className="progress"><span style={{width:syncState==='running'?'55%':syncState==='error'?'0%':'100%'}}/></div>{messages.map((m,i)=><div className={syncState==='error'?'partial-error':'success-line'} key={i}>{m}</div>)}</div>
          <div className="two-actions">{syncState==='error'?<button className="btn black" onClick={()=>setStep(3)}>Back to connections</button>:<button className="btn black" onClick={()=>setStep(5)}>Continue</button>}<button className="btn outline" onClick={()=>setStep(3)}>Try another source</button></div></>}
        {step===5&&<>{hasEvidence?<><h1>Your first analysis is ready.</h1><p>Open your workspace to see three things first: what you spent, the biggest area worth investigating, and what Evalomics recommends you do next.</p></>:<><h1>We still need some usage data.</h1><p>Add a provider or upload a CSV first. Once we have enough data, Evalomics will show you what is happening and what to do next.</p></>}
          <div className="getting-card"><div className="getting-top"><strong>{requestCount>0?requestCount.toLocaleString()+' requests':'No request count yet'}</strong><span>{summary?.observedSpend?summary.currency+' '+summary.observedSpend+' observed':'Waiting for observed spend'}</span></div>
            <div className="mini-ladder"><div><span className="tier observed">OBSERVED</span><small>{hasEvidence?'Evidence loaded':'Waiting for data'}</small></div><div><span className="tier potential">POTENTIAL</span><small>{summary?.evidenceCounts.potential??0} items</small></div><div><span className="tier tested">TESTED</span><small>{summary?.evidenceCounts.tested??0} items</small></div><div><span className="tier verified">VERIFIED</span><small>{summary?.evidenceCounts.verified??0} items</small></div></div>
            <div className="two-actions"><button className="btn black" onClick={finish}>Show me my results</button><button className="btn outline" onClick={()=>router.push('/demo')}>Show me an example first</button></div></div></>}
      </section>
    </div>
  </main>
}
