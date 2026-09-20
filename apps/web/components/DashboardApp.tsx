'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { signOutAction } from '@/app/actions';
import EvalomicsCopilot from '@/components/EvalomicsCopilot';
import KnowledgeUpload from '@/components/KnowledgeUpload';

type Tier='observed'|'potential'|'tested'|'verified';
type RealSummary=Readonly<{
  organizationId:string;organizationName:string;role:string;onboardingCompleted:boolean;
  observedSpend:string|null;currency:string;requests:string;completeImports:number;
  dataRange:Readonly<{start:string|null;end:string|null}>;
  latestImport:Readonly<{
    id:string;status:string;accepted:number;rejected:number;skipped:number;warnings:number;
    totalRows:number;acceptanceRate:number;rangeStart:string|null;rangeEnd:string|null;receivedAt:string;
  }>|null;
  providers:readonly Readonly<{provider:string;status:string;lastSyncAt:string|null;safeError:string|null;evidenceRows:number;dataStatus:'SYNCED_WITH_DATA'|'CONNECTED_NO_DATA'|'SYNC_FAILED'|'SYNC_PENDING'}>[];
  topModels:readonly Readonly<{model:string;provider:string;spend:string;requests:string;share:number}>[];
  evidenceCounts:Readonly<{potential:number;tested:number;verified:number}>;
  verifiedSavings:string|null;
  members:readonly Readonly<{email:string;role:string}>[];
  recommendations:readonly Readonly<{
    id:string;state:string;decision:string;confidence:string|null;amount:string|null;currency:string|null;
    title:string;measuredFact:string|null;nextAction:string|null;limitation:string|null;kind:string|null;
    sourceImportId:string|null;currentConfigurationId:string|null;
  }>[];
}>;


const opps=[
  {id:'OPP-3118',tier:'potential' as Tier,title:'Ticket routing uses a flagship model',body:'61% of routing requests score below the complexity threshold for the current model. Sampled 8,412 requests.',value:'$3,800–4,900/mo est.',meta:'High confidence · routing / GPT-5 class'},
  {id:'OPP-3112',tier:'potential' as Tier,title:'14k-token system context resent uncached',body:'Identical prefix on 91% of agent steps. Cache write rate is 3% — caching only pays on repetition.',value:'$6,200–8,100/mo est.',meta:'Medium confidence · agent-assist'},
  {id:'OBS-2214',tier:'observed' as Tier,title:'Retry storm on inventory-sync',body:'412 duplicate tool calls in 6 hours on Jun 28. $214 above baseline. Observed, not estimated.',value:'$214 above baseline',meta:'agent / inventory-sync'},
  {id:'EXP-1042',tier:'tested' as Tier,title:'Summarization routed to Haiku-tier',body:'Running on 20% of traffic, day 9 of 14. Interim delta −$306/wk on the test slice.',value:'Day 9 of 14',meta:'summarization'},
  {id:'VER-0521',tier:'verified' as Tier,title:'Prompt caching on agent-assist',body:'Rolled out Jun 9. The delta has held in observed spend for 3 weeks against the pre-change baseline.',value:'$7,412/mo',meta:'Verified since Jun 9'},
  {id:'VER-0498',tier:'verified' as Tier,title:'Retry dedupe on inventory-sync',body:'Rolled out May 22. Duplicate-call volume is down 97% and the spend delta is holding.',value:'$690/mo',meta:'Verified since May 22'},
];

const nav=[['overview','Overview'],['opportunities','Opportunities'],['experiments','Experiments'],['reports','Reports'],['alerts','Alerts'],['integrations','Integrations'],['team','Team'],['billing','Billing'],['settings','Settings']];
const realNav=nav.filter(([id])=>id!=='alerts');

function TierBadge({tier}:{tier:Tier}){return <span className={'tier '+tier}>{tier.toUpperCase()}</span>}

function SpendChart(){
  return <div className="chart-box"><div className="chart-grid"></div><svg viewBox="0 0 820 250" preserveAspectRatio="none" role="img" aria-label="Observed spend versus counterfactual baseline"><path d="M20 46 C70 76,90 32,120 48 S155 165,198 46 S240 110,282 90 S330 166,380 88 S438 155,485 90 S530 170,580 86 S635 150,680 95 S730 158,800 88" fill="none" stroke="#111" strokeWidth="3"/><path d="M20 46 C80 70,125 35,182 46 S260 70,325 44 S410 75,480 46 S565 71,630 45 S720 68,800 47" fill="none" stroke="#a1a1aa" strokeWidth="2" strokeDasharray="7 7"/><line x1="240" y1="22" x2="240" y2="225" stroke="#1747b8" strokeWidth="1.5" strokeDasharray="5 5"/><text x="247" y="35" fontSize="12" fill="#1747b8">Rollout: prompt caching</text></svg><div className="chart-axis"><span>Jun 1</span><span>Jun 6</span><span>Jun 11</span><span>Jun 16</span><span>Jun 21</span><span>Jun 26</span></div></div>
}
function ModelBars(){const rows=[['GPT-5 class',88],['Claude Sonnet 5',52],['GPT-5 mini',31],['Claude Haiku 4.5',15],['Other',7]];return <div className="bars">{rows.map(([n,w])=><div key={String(n)}><span>{n}</span><i><b style={{width:w+'%'}}/></i></div>)}</div>}

export default function DashboardApp({userName,userEmail,publicDemo=false,workspaceName='My workspace',realSummary}:{userName:string,userEmail:string,publicDemo?:boolean,workspaceName?:string,realSummary?:RealSummary}){
  const path=usePathname(); const router=useRouter();
  const [role,setRole]=useState('Approver'); const [experiment,setExperiment]=useState<'running'|'complete'|'verification'|'verified'>('running');
  const section=useMemo(()=>path.split('/')[2]||'overview',[path]);
  useEffect(()=>{const s=localStorage.getItem('evalomics:experiment') as any;if(s)setExperiment(s)},[]);
  const setExp=(s:typeof experiment)=>{setExperiment(s);localStorage.setItem('evalomics:experiment',s)};
  const workspace=publicDemo?'Meridian — Production':workspaceName;
  const basePath=publicDemo?'/demo':'/dashboard';

  if(!publicDemo){
    return <RealWorkspace userName={userName} userEmail={userEmail} workspaceName={workspaceName} summary={realSummary}/>;
  }

  return <main className="app-shell">
    <header className="app-top"><Link className="logo app-logo" href="/"><span/>Evalomics</Link><div className="workspace-title"><strong>{workspace}</strong><span className="quiet-chip">SAMPLE WORKSPACE</span></div><div className="app-head-actions"><span>Jun 1 – Jun 30, 2026</span><label>Role <select value={role} onChange={e=>setRole(e.target.value)}><option>Approver</option><option>Engineer</option><option>Analyst</option><option>Viewer</option></select></label><Link className="btn outline small" href="/">Back to site</Link></div></header>
    <aside className="sidebar"><nav>{nav.map(([id,label])=><Link key={id} className={section===id || (section==='overview'&&id==='overview')?'active':''} href={id==='overview'?basePath:basePath+'/'+id}><span className="nav-icon">{id==='overview'?'▦':id==='opportunities'?'◇':id==='experiments'?'♜':id==='reports'?'□':id==='alerts'?'♧':id==='integrations'?'⌘':id==='team'?'♧':id==='billing'?'▭':'⚙'}</span>{label}</Link>)}</nav><div className="sync-note">Last sync 4 min ago<br/>1.2M requests, 2 providers</div></aside>
    <section className="app-content">
      {section==='overview' && <Overview router={router} basePath={basePath}/>}
      {section==='opportunities' && (path.split('/').length>3?<OpportunityDetail role={role} router={router} basePath={basePath}/>:<Opportunities router={router} basePath={basePath}/>)}
      {section==='experiments' && <Experiments state={experiment} setState={setExp} role={role}/>}
      {section==='reports' && <Reports basePath={basePath}/>}
      {section==='alerts' && <Alerts/>}
      {section==='integrations' && <Integrations/>}
      {section==='team' && <Team userEmail={userEmail}/>}
      {section==='billing' && <Billing/>}
      {section==='settings' && <Settings userName={userName} userEmail={userEmail}/>}
    </section>
  </main>
}


function money(amount:string|null,currency:string){
  if(amount===null) return '—';
  const n=Number(amount);
  if(!Number.isFinite(n)) return '—';
  try{return new Intl.NumberFormat('en-US',{style:'currency',currency,maximumFractionDigits:2}).format(n)}
  catch{return currency+' '+n.toFixed(2)}
}

function formatPeriod(start:string|null|undefined,end:string|null|undefined){
  if(!start||!end) return 'No complete date range';
  const a=new Date(start),b=new Date(end);
  const days=Math.max(1,Math.round((b.getTime()-a.getTime())/86400000));
  return days+' day'+(days===1?'':'s')+' analyzed';
}

function importIsIncomplete(summary?:RealSummary){
  const latest=summary?.latestImport;
  return Boolean(latest && (latest.status==='PARTIAL'||latest.rejected>0) && latest.acceptanceRate<0.98);
}

type GroupedRecommendation=RealSummary['recommendations'][number]&{sourceCount:number};
function groupedRecommendations(summary?:RealSummary,filter?:string):GroupedRecommendation[]{
  const map=new Map<string,GroupedRecommendation>();
  for(const r of summary?.recommendations??[]){
    if(filter&&r.state!==filter) continue;
    const key=r.kind||r.title;
    const existing=map.get(key);
    if(existing){existing.sourceCount+=1;continue}
    map.set(key,{...r,sourceCount:1});
  }
  return [...map.values()];
}

function RealWorkspace({userName,userEmail,workspaceName,summary}:{userName:string,userEmail:string,workspaceName:string,summary?:RealSummary}){
  const path=usePathname();
  const section=useMemo(()=>path.split('/')[2]||'overview',[path]);
  const providerCount=summary?.providers.length ?? 0;
  const evidenceCount=groupedRecommendations(summary).length;
  return <main className="app-shell">
    <header className="app-top">
      <Link className="logo app-logo" href="/"><span/>Evalomics</Link>
      <div className="workspace-title"><strong>{workspaceName}</strong><span className="quiet-chip">YOUR WORKSPACE</span></div>
      <div className="app-head-actions"><span>{userEmail}</span><EvalomicsCopilot screen={section}/><Link className="btn outline small" href="/">Back to site</Link></div>
    </header>
    <aside className="sidebar">
      <nav>{realNav.map(([id,label])=><Link key={id} className={section===id || (section==='overview'&&id==='overview')?'active':''} href={id==='overview'?'/dashboard':'/dashboard/'+id}><span className="nav-icon">{id==='overview'?'▦':id==='opportunities'?'◇':id==='experiments'?'♜':id==='reports'?'□':id==='integrations'?'⌘':id==='team'?'♧':id==='billing'?'▭':'⚙'}</span>{label}</Link>)}</nav>
      <div className="sync-note">{providerCount>0?providerCount+' provider'+(providerCount===1?'':'s')+' connected':summary?.completeImports?summary.completeImports+' usage import'+(summary.completeImports===1?'':'s'):'No usage connected'}<br/>{evidenceCount} decision area{evidenceCount===1?'':'s'} detected</div>
    </aside>
    <section className="app-content">
      {section==='overview' && <RealOverview userName={userName} summary={summary}/>}
      {section==='opportunities' && <RealOpportunities summary={summary}/>}
      {section==='experiments' && <RealExperiments summary={summary}/>}
      {section==='reports' && <RealReports summary={summary}/>}
      {section==='integrations' && <><RealIntegrations summary={summary}/><KnowledgeUpload/></>}
      {section==='team' && <RealTeam summary={summary} userEmail={userEmail}/>}
      {section==='billing' && <RealBilling/>}
      {section==='settings' && <RealSettings userName={userName} userEmail={userEmail} workspaceName={workspaceName}/>}
    </section>
  </main>
}

function RealOverview({userName,summary}:{userName:string,summary?:RealSummary}){
  const hasData=Boolean(summary?.observedSpend)||Boolean(summary?.completeImports)||Boolean(summary?.providers.length);
  const incomplete=importIsIncomplete(summary);
  const latest=summary?.latestImport;
  const recs=groupedRecommendations(summary,'OPPORTUNITY');
  const requestCount=Number(summary?.requests??0);
  const spend=Number(summary?.observedSpend??0);
  const unitCost=requestCount>0?spend/requestCount*1000:null;

  if(!hasData){
    return <>
      <div className="page-head"><div><p className="eyebrow">YOUR WORKSPACE</p><h1>No production data yet.</h1><p>{userName ? userName+', ' : ''}connect usage and Evalomics will tell you what happened before it suggests what to change.</p></div></div>
      <div className="real-empty-grid">
        <article className="real-empty-main"><TierBadge tier="observed"/><h2>Connect usage to get your first answer</h2><p>Bring in OpenAI, Anthropic, or a CSV usage export. Your first dashboard will show spend, requests, data quality, cost drivers, and the next useful action.</p><div className="real-empty-actions"><Link className="btn black" href="/onboarding?step=3">Connect usage data</Link><Link className="btn outline" href="/demo">Explore sample data</Link></div></article>
      </div>
    </>
  }

  return <>
    <div className="answer-first">
      <p className="eyebrow">{incomplete?'DATA NEEDS ATTENTION':'YOUR AI USAGE'}</p>
      <h1>{incomplete?'Your latest import is incomplete.':'Here is what your AI usage is doing.'}</h1>
      <p>{incomplete
        ? latest?.accepted+' of '+latest?.totalRows+' CSV rows were accepted. Spend and recommendations are partial, so Evalomics is pausing optimization decisions until you repair the import.'
        : money(summary?.observedSpend??null,summary?.currency??'USD')+' across '+requestCount.toLocaleString()+' requests. '+recs.length+' decision area'+(recs.length===1?' is':'s are')+' worth reviewing. '+(summary?.verifiedSavings?'Verified savings are visible below.':'Nothing is verified as savings yet.')
      }</p>
      {incomplete&&<Link className="btn black" href="/onboarding?step=3">Re-upload the CSV</Link>}
    </div>

    {incomplete&&latest&&<div className="data-integrity-banner">
      <div><strong>Do not optimize from this import yet.</strong><p>The current dashboard contains only {(latest.acceptanceRate*100).toFixed(1)}% of the latest CSV. {latest.rejected.toLocaleString()} rows were rejected.</p></div>
      <div className="integrity-meter"><span style={{width:(latest.acceptanceRate*100)+'%'}}/></div>
      <b>{latest.accepted.toLocaleString()} / {latest.totalRows.toLocaleString()} rows accepted</b>
    </div>}

    <div className="kpi-grid decision-kpis">
      <article><div><span>{incomplete?'Observed so far':'Observed spend'}</span><TierBadge tier="observed"/></div><strong>{money(summary?.observedSpend??null,summary?.currency??'USD')}</strong><p>{formatPeriod(summary?.dataRange.start,summary?.dataRange.end)}{incomplete?' · partial':''}</p></article>
      <article><div><span>Requests measured</span></div><strong>{requestCount.toLocaleString()}</strong><p>{incomplete?'Partial request coverage':'Across accepted usage evidence'}</p></article>
      <article><div><span>Cost per 1k requests</span></div><strong>{unitCost===null?'—':money(unitCost.toFixed(2),summary?.currency??'USD')}</strong><p>Useful for comparing workload efficiency over time</p></article>
      <article><div><span>{incomplete?'Data coverage':'What to review next'}</span></div><strong>{incomplete&&latest?(latest.acceptanceRate*100).toFixed(0)+'%':recs.length}</strong><p>{incomplete?'Latest CSV acceptance':'Distinct optimization decision areas'}</p></article>
    </div>

    <div className="decision-layout">
      <section className="decision-main">
        <div className="section-title-row"><div><p className="eyebrow">WHAT NEEDS YOUR ATTENTION</p><h1>{incomplete?'Fix the data before changing production.':recs.length?'Review these opportunities.':'No optimization action yet.'}</h1></div></div>
        {incomplete?<div className="next-action-card"><strong>Why this comes first</strong><p>An optimization recommendation built on 14% of a file can point at the wrong model, workload, or token pattern. Evalomics will keep detected patterns secondary until the import is complete.</p><Link className="btn black" href="/onboarding?step=3">Repair import</Link></div>:<RealRecommendationList summary={summary} filter="OPPORTUNITY" compact/>}
      </section>
      <aside className="decision-side">
        <p className="eyebrow">WHERE YOUR SPEND GOES</p>
        <h2>Top models</h2>
        <div className="real-model-bars">{(summary?.topModels??[]).map(m=><div key={m.provider+'-'+m.model}><div><span>{m.model}</span><b>{money(m.spend,summary?.currency??'USD')}</b></div><i><em style={{width:Math.max(2,m.share*100)+'%'}}/></i><small>{m.provider} · {(m.share*100).toFixed(0)}% of observed spend</small></div>)}</div>
      </aside>
    </div>

    <div className="evidence-status-row">
      <div><TierBadge tier="potential"/><strong>{groupedRecommendations(summary,'OPPORTUNITY').length}</strong><span>ideas to test</span></div>
      <div><TierBadge tier="tested"/><strong>{groupedRecommendations(summary,'TESTED').length}</strong><span>measured changes</span></div>
      <div><TierBadge tier="verified"/><strong>{money(summary?.verifiedSavings??null,summary?.currency??'USD')}</strong><span>proven savings</span></div>
      <p>Evidence moves right only when the proof does.</p>
    </div>
  </>
}

function RealRecommendationList({summary,filter,compact=false}:{summary?:RealSummary,filter?:string,compact?:boolean}){
  const items=groupedRecommendations(summary,filter);
  if(items.length===0) return <div className="workspace-empty-section compact-empty"><h1>{filter==='TESTED'?'No experiments yet.':filter==='VERIFIED'?'Nothing verified yet.':'Nothing needs action yet.'}</h1><p>{filter==='TESTED'?'Start with a Potential opportunity. A change becomes Tested only after measured evidence exists.':filter==='VERIFIED'?'Potential and Tested values never count as savings. Verified will appear only after rollout and production reconciliation.':'Evalomics has not found a defensible action from the current evidence.'}</p>{filter==='TESTED'?<Link className="btn black" href="/dashboard/opportunities">Review opportunities</Link>:filter==='VERIFIED'?<Link className="btn black" href="/dashboard/opportunities">Review what can be tested</Link>:null}</div>;

  return <div className={'opportunity-stack'+(compact?' compact':'')}>{items.map(r=><article className="real-opportunity-card" key={r.kind||r.id}>
    <header><div><TierBadge tier={r.state==='OPPORTUNITY'?'potential':r.state==='TESTED'?'tested':'verified'}/><h3>{r.title}</h3></div><span>{r.sourceCount>1?r.sourceCount+' evidence sources':r.confidence?r.confidence.toLowerCase()+' confidence':'evidence available'}</span></header>
    {r.measuredFact&&<div className="opportunity-fact"><span>What we measured</span><strong>{r.measuredFact}</strong></div>}
    <div className="opportunity-explain"><div><span>What this means</span><p>{r.limitation||'This pattern is worth testing, but it is not proof of savings.'}</p></div><div><span>Do this next</span><p>{r.nextAction||'Run a controlled benchmark before changing production.'}</p></div></div>
    <footer><span>{r.currentConfigurationId?'Current: '+r.currentConfigurationId:'No production change recommended yet'}</span><b>{r.amount?money(r.amount,r.currency??summary?.currency??'USD'):'Not savings yet'}</b></footer>
  </article>)}</div>
}

function RealOpportunities({summary}:{summary?:RealSummary}){
  const incomplete=importIsIncomplete(summary);
  const count=groupedRecommendations(summary,'OPPORTUNITY').length;
  return <><div className="page-head"><div><p className="eyebrow">WHAT SHOULD I TEST?</p><h1>{count} opportunity{count===1?'':'ies'} worth reviewing</h1><p>Evalomics combines repeated detections into decision areas so you do not have to interpret duplicate technical records.</p></div></div>
  {incomplete&&<div className="data-integrity-banner"><div><strong>Latest import is incomplete.</strong><p>These patterns are visible for transparency, but do not act on them until the CSV is repaired.</p></div><Link className="btn black" href="/onboarding?step=3">Repair import</Link></div>}
  <RealRecommendationList summary={summary} filter="OPPORTUNITY"/></>
}

function RealExperiments({summary}:{summary?:RealSummary}){return <><div className="page-head"><div><p className="eyebrow">WHAT HAVE WE ACTUALLY TESTED?</p><h1>Experiments</h1><p>This page contains measured changes only. Potential ideas do not appear here.</p></div></div><RealRecommendationList summary={summary} filter="TESTED"/></>}

function RealReports({summary}:{summary?:RealSummary}){return <><div className="page-head"><div><p className="eyebrow">WHAT CAN FINANCE DEFEND?</p><h1>Verified savings</h1><p>Only production-reconciled results belong in this report.</p></div></div><div className="report-total"><span>Verified in this workspace</span><strong>{money(summary?.verifiedSavings??null,summary?.currency??'USD')}</strong><p>{summary?.verifiedSavings?'This amount is backed by completed verification windows.':'Nothing is being claimed as saved yet. That is the correct state.'}</p></div><RealRecommendationList summary={summary} filter="VERIFIED"/></>}

function RealIntegrations({summary}:{summary?:RealSummary}){
  const provider=(name:string)=>summary?.providers.find(x=>x.provider===name);
  const label=(p:ReturnType<typeof provider>)=>!p?'Not connected':p.dataStatus==='SYNCED_WITH_DATA'?'Synced with data':p.dataStatus==='CONNECTED_NO_DATA'?'Connected — no data found':p.dataStatus==='SYNC_FAILED'?'Sync failed':'Connected — sync pending';
  const latest=summary?.latestImport;
  const openai=provider('OPENAI');
  const anthropic=provider('ANTHROPIC');
  return <>
    <div className="page-head"><div><p className="eyebrow">WHERE DOES THE DATA COME FROM?</p><h1>Data sources</h1><p>Connection state is separate from data availability. Evalomics will not call an empty provider response “synced with data.”</p></div><Link className="btn black" href="/onboarding?step=3">Add or repair source</Link></div>
    <div className="integration-grid">
      <article className={openai?.dataStatus==='CONNECTED_NO_DATA'||openai?.dataStatus==='SYNC_FAILED'?'integration-warning':''}><div><strong>OpenAI API</strong><span>{label(openai)}</span></div><p>{openai?.dataStatus==='CONNECTED_NO_DATA'?'The Admin key is valid, but the provider returned zero usage and cost rows for the sync window.':'OpenAI API Platform organization usage and costs. This is not personal ChatGPT usage.'}</p><Link className="btn outline small" href="/onboarding?step=3">{openai?'Manage':'Connect'}</Link></article>
      <article className={anthropic?.dataStatus==='SYNC_FAILED'?'integration-warning':''}><div><strong>Anthropic API <small className="beta-chip">BETA</small></strong><span>{label(anthropic)}</span></div><p>Anthropic Admin API usage and costs. Production connector code is present, but this integration remains beta until a real Admin key completes an end-to-end sync.</p><Link className="btn outline small" href="/onboarding?step=3">{anthropic?'Manage':'Connect beta'}</Link></article>
      <article className={latest&&latest.rejected>0?'integration-warning':''}><div><strong>Latest CSV import</strong><span>{latest?latest.status:'None yet'}</span></div><p>{latest?latest.accepted.toLocaleString()+' accepted · '+latest.rejected.toLocaleString()+' rejected':'Upload a usage export without provider credentials.'}</p><Link className="btn outline small" href="/onboarding?step=3">{latest&&latest.rejected>0?'Repair import':'Upload CSV'}</Link></article>
    </div>
  </>
}

function RealTeam({summary,userEmail}:{summary?:RealSummary,userEmail:string}){
  const members=summary?.members??[{email:userEmail,role:'OWNER'}];
  return <><div className="page-head"><div><p className="eyebrow">WHO CAN ACT?</p><h1>Team & roles</h1><p>Production authority is separate from analysis access.</p></div></div><div className="report-table"><div className="thead"><span>Member</span><span>Role</span><span>Can roll out</span><span>Status</span></div>{members.map(m=><div key={m.email}><strong>{m.email}</strong><span>{m.role}</span><b>{m.role==='OWNER'||m.role==='OPERATOR'?'Yes':'No'}</b><span>Active</span></div>)}</div></>
}

function RealBilling(){
  return <><div className="page-head"><div><p className="eyebrow">PLAN</p><h1>Observer</h1><p>Your plan is separate from your AI spend. We do not repeat usage metrics here because this page is about Evalomics billing.</p></div></div><div className="billing-card"><div><span>Current plan</span><strong>Observer · $0/month</strong></div><div><span>Billing account</span><strong>Not activated</strong></div><Link className="btn outline" href="/#pricing">Compare plans</Link></div></>
}

function RealSettings({userName,userEmail,workspaceName}:{userName:string,userEmail:string,workspaceName:string}){
  return <><div className="page-head"><div><p className="eyebrow">WORKSPACE ADMINISTRATION</p><h1>Settings</h1><p>Only controls that really persist belong here.</p></div></div>
  <div className="settings-grid">
    <article><h2>Account</h2><p><strong>{userName}</strong><br/>{userEmail}</p><p className="settings-note">Name and email come from your Google account.</p></article>
    <article><h2>Workspace</h2><p><strong>{workspaceName}</strong></p><Link className="btn outline" href="/onboarding?step=2">Rename workspace</Link></article>
    <article><h2>Evidence policy</h2><p><strong>Verified means production-reconciled.</strong></p><p className="settings-note">Potential and Tested values are never promoted into savings totals without a completed verification window.</p></article>
    <article><h2>Session</h2><p className="settings-note">Sign out of this browser when you are finished.</p><form action={signOutAction}><button className="btn outline">Sign out</button></form></article>
  </div></>
}

function Overview({router,basePath}:{router:any,basePath:string}){return <><p className="workspace-note">Every number on this page carries its evidence tier. Sample workspace — every figure is illustrative, which is exactly how we treat an unverified number.</p><div className="kpi-grid"><article><div><span>Observed spend (30 days)</span><TierBadge tier="observed"/></div><strong>$41,208</strong><p>Prior 30 days: $43,930, down 6.2% after verified rollouts</p></article><article><div><span>Verified savings</span><TierBadge tier="verified"/></div><strong>$7,412/mo</strong><p>2 changes live, both holding in observed spend</p></article><article><div><span>Identified, not yet proven</span><TierBadge tier="potential"/></div><strong>$11.8k–15.6k/mo</strong><p>3 patterns detected. Estimates only — nothing claimed.</p></article><article><div><span>Experiments running</span><TierBadge tier="tested"/></div><strong>2</strong><p>EXP-1042 ends Jul 4, guardrails green</p></article></div><div className="section-title-row"><h1>The ladder</h1><p>A number only moves right when the evidence does.</p></div><div className="ladder-board">{(['observed','potential','tested','verified'] as Tier[]).map(t=><div className={'ladder-col '+t} key={t}><div className="ladder-col-head"><TierBadge tier={t}/><span>{opps.filter(o=>o.tier===t).length}</span></div>{opps.filter(o=>o.tier===t).map(o=><button className="opp-card" key={o.id} onClick={()=>o.id==='OPP-3118'?router.push(basePath+'/opportunities/OPP-3118'):undefined}><div><strong>{o.title}</strong><small>{o.id}</small></div><p>{o.body}</p><footer><span>{o.meta}</span><b>{o.value}</b></footer></button>)}</div>)}</div><div className="charts-grid"><article className="panel"><h2>Observed spend vs. counterfactual baseline</h2><p>The dashed line is what you would have spent with no changes. The gap after Jun 9 is the verified saving.</p><SpendChart/></article><article className="panel"><h2>Spend by model, 30 days</h2><p>Where the $41,208 actually goes.</p><ModelBars/></article></div></>}

function Opportunities({router,basePath}:{router:any,basePath:string}){return <><div className="page-head"><div><p className="eyebrow">Decision queue</p><h1>Opportunities</h1><p>Potential means worth investigating — not money saved.</p></div></div><div className="table-list">{opps.filter(o=>o.tier==='potential'||o.tier==='observed').map(o=><button key={o.id} onClick={()=>o.id==='OPP-3118'&&router.push(basePath+'/opportunities/OPP-3118')}><div><TierBadge tier={o.tier}/><strong>{o.title}</strong><span>{o.id}</span></div><p>{o.body}</p><footer><span>{o.meta}</span><b>{o.value}</b></footer></button>)}</div></>}

function OpportunityDetail({role,router,basePath}:{role:string,router:any,basePath:string}){return <><button className="back-link" onClick={()=>router.push(basePath)}>← Back to the ladder</button><article className="detail-card"><header><div><TierBadge tier="potential"/><h1>Ticket routing uses a flagship model</h1></div><span>OPP-3118</span></header><div className="detail-grid"><section><p className="eyebrow">The estimate</p><div className="big-money">$3,800–4,900<small>/mo</small></div><p>Confidence: High</p><p>We replayed 14 days of routing traffic (118,404 requests) against current mini-tier list prices and took the difference. The range reflects alternative targets. What this cannot tell you is whether answer quality holds — that is exactly what the experiment is for.</p><div className="callout">This is an estimate, not a result. It earns the Tested tier only after an experiment runs on real traffic.</div><hr/><p className="eyebrow">The evidence</p><ul className="evidence-list"><li>61% of routing requests score below the complexity threshold for the current model. Sampled 8,412 requests over 14 days.</li><li>Median routing call: 38 input tokens, 4 output tokens — a short classification of a short ticket.</li><li>Cost per routing call on the flagship model averages $0.0019. The mini-tier equivalent is $0.0002.</li><li>Routing volume is flat week over week, so this estimate is not riding a growth trend.</li></ul></section><aside><p className="eyebrow">What happens next</p><h2>Test it on a slice of traffic</h2><p>An experiment routes a percentage of real traffic to the cheaper path, with a quality guardrail. If results hold, an Approver rolls it out — and only time in observed spend makes it Verified.</p><button className="btn black full" disabled={role==='Viewer'} onClick={()=>router.push(basePath+'/experiments/EXP-1042')}>Design an experiment</button><hr/><p className="eyebrow">Where this sits on the ladder</p><div className="inline-ladder"><TierBadge tier="potential"/><span>then</span><TierBadge tier="tested"/><span>then</span><TierBadge tier="verified"/></div><small>Nothing skips a tier. That is the product.</small></aside></div></article></>}

function Experiments({state,setState,role}:{state:'running'|'complete'|'verification'|'verified',setState:(s:any)=>void,role:string}){return <><div className="page-head"><div><p className="eyebrow">EXP-1042</p><h1>Summarization routed to Haiku-tier</h1><p>{state==='running'?'Running on live traffic.':state==='complete'?'Test complete. Review the result before rollout.':state==='verification'?'Rolled out. Production verification is running.':'Verified in production.'}</p></div><TierBadge tier={state==='verified'?'verified':'tested'}/></div>{state==='running'&&<div className="experiment-banner"><strong>Day 9 of 14</strong><span>Ends Jul 4 · 20% of traffic</span><div className="progress"><span style={{width:'64%'}}/></div><button className="btn outline" onClick={()=>setState('complete')}>Simulate test completion</button></div>}<article className="panel experiment-panel"><p>Cost per 1k agent-assist requests</p><div className="line-comparison"><svg viewBox="0 0 900 240" preserveAspectRatio="none"><path d="M20 55 C150 50,250 65,370 50 S590 65,880 52" fill="none" stroke="#b5b5b5" strokeWidth="2"/><path d="M20 56 C85 90,130 125,190 135 S350 138,470 145 S650 140,880 142" fill="none" stroke="#111" strokeWidth="3"/></svg></div><div className="result-grid"><div><span>Cache hit rate</span><strong>3% → 61% (+58pt)</strong></div><div><span>Quality</span><strong>+0.1% vs control</strong><small>guardrail: no worse than −1%</small></div><div><span>Cost delta</span><strong>−$289/wk</strong><small>on the 20% test slice</small></div><div><span>Projected at 100%</span><strong>$5,900–6,700/mo</strong><small>a projection, not yet verified</small></div><div><span>Sample</span><strong>22,610 test / 90,318 control</strong></div><div><span>Guardrails</span><strong>Held for all 14 days</strong></div></div>{state==='complete'&&<div className="decision-row"><div><strong>Test passed its guardrails.</strong><p>Rolling out changes production behavior. Verification starts only after rollout.</p></div><button className="btn black" disabled={role!=='Approver'} onClick={()=>setState('verification')}>{role==='Approver'?'Approve rollout':'Approver role required'}</button></div>}{state==='verification'&&<div className="verification-box"><strong>Production verification window: day 6 of 14</strong><p>Evalomics is measuring the normalized delta against observed spend. This does not become Verified before day 14.</p><div className="progress"><span style={{width:'43%'}}/></div><button className="btn outline" onClick={()=>setState('verified')}>Simulate day 14 verification</button></div>}{state==='verified'&&<div className="verified-box"><TierBadge tier="verified"/><strong>$4,214/mo verified</strong><p>The production delta held against the pre-change baseline for 14 days with quality and reliability guardrails intact. This line can now go in the cost report.</p></div>}</article></>}

function Reports({basePath}:{basePath:string}){return <><div className="page-head"><div><p className="eyebrow">Finance-ready evidence</p><h1>Verified savings report</h1><p>Only production-verified changes appear in the headline total.</p></div><button className="btn outline" onClick={()=>window.print()}>Print / save PDF</button></div><div className="report-total"><span>Q2 2026 verified run-rate</span><strong>$8,102/mo</strong><p>Two changes currently meet the Verified definition.</p></div><div className="report-table"><div className="thead"><span>Change</span><span>Verified since</span><span>Savings /mo</span><span>Evidence</span></div><div><strong>Prompt caching on agent-assist</strong><span>Jun 9, 2026</span><b>$7,412</b><a href={basePath+"/opportunities/OPP-3118"}>View evidence</a></div><div><strong>Retry dedupe on inventory-sync</strong><span>May 22, 2026</span><b>$690</b><a href={basePath}>View evidence</a></div></div><p className="footnote">Potential and Tested estimates are intentionally excluded from the report total.</p></>}
function Alerts(){return <><div className="page-head"><div><p className="eyebrow">What needs attention</p><h1>Alerts</h1><p>Alerts are written as decisions, not telemetry noise.</p></div></div><div className="table-list"><button><div><span className="alert-dot danger"></span><strong>Inventory-sync spend is 2.3× its weekday baseline</strong><span>12 min ago</span></div><p>412 duplicate tool calls drove $214 above baseline. Inspect before the retry storm continues.</p><footer><span>Observed anomaly</span><b>Open workload</b></footer></button><button><div><span className="alert-dot"></span><strong>Experiment EXP-1042 has enough data for a decision</strong><span>Today</span></div><p>Quality guardrail held; cost fell on the treatment slice. An Approver can review rollout.</p><footer><span>Tested</span><b>Review experiment</b></footer></button></div></>}
function Integrations(){return <><div className="page-head"><div><p className="eyebrow">Data in and decisions out</p><h1>Integrations</h1><p>Provider connections begin read-only.</p></div></div><div className="integration-grid">{[['OpenAI','Connected','Usage + cost metadata'],['Anthropic','Connected','Usage + cost metadata'],['CSV','Available','Upload provider or internal exports'],['Slack','Not connected','Opportunity, experiment, regression alerts'],['Email','Connected','Digests + experiment completion'],['Snowflake','Enterprise','Verified evidence export']].map(([a,b,c])=><article key={a}><div><strong>{a}</strong><span>{b}</span></div><p>{c}</p><button className="btn outline small">{b==='Connected'?'Manage':'Connect'}</button></article>)}</div></>}
function Team({userEmail}:{userEmail:string}){return <><div className="page-head"><div><p className="eyebrow">Authority follows risk</p><h1>Team & roles</h1><p>Investigation is separated from production approval.</p></div><button className="btn black">Invite member</button></div><div className="report-table"><div className="thead"><span>Member</span><span>Role</span><span>Can roll out</span><span>Status</span></div><div><strong>{userEmail}</strong><span>Approver</span><b>Yes</b><span>Active</span></div><div><strong>alex@meridian.io</strong><span>Engineer</span><b>No</b><span>Active</span></div><div><strong>finance@meridian.io</strong><span>Viewer</span><b>No</b><span>Active</span></div></div><div className="role-notes"><article><h3>Viewer</h3><p>Can read dashboards and reports.</p></article><article><h3>Analyst</h3><p>Can investigate evidence and create drafts.</p></article><article><h3>Engineer</h3><p>Can configure and run experiments.</p></article><article><h3>Approver</h3><p>Can authorize production rollout.</p></article></div></>}
function Billing(){return <><div className="page-head"><div><p className="eyebrow">Scale plan</p><h1>Billing</h1><p>Priced on spend under observation, never a percentage of claimed savings.</p></div></div><div className="billing-card"><div><span>Current plan</span><strong>Scale · $490/month</strong></div><div><span>Spend under observation</span><strong>$41,208 of $100,000</strong><div className="progress"><span style={{width:'41%'}}/></div></div><div><span>Next invoice</span><strong>Oct 1, 2026</strong></div><button className="btn outline">Manage billing</button></div></>}
function Settings({userName,userEmail}:{userName:string,userEmail:string}){return <><div className="page-head"><div><p className="eyebrow">Workspace administration</p><h1>Settings</h1><p>Security and product defaults are visible in one place.</p></div></div><div className="settings-grid"><article><h2>Profile</h2><label>Name<input defaultValue={userName}/></label><label>Email<input defaultValue={userEmail} disabled/></label><button className="btn black">Save profile</button></article><article><h2>Evidence policy</h2><label>Verification window<select defaultValue="14"><option value="7">7 days</option><option value="14">14 days</option><option value="30">30 days</option></select></label><label>Default quality guardrail<select defaultValue="1"><option value="0.5">−0.5%</option><option value="1">−1%</option><option value="2">−2%</option></select></label><button className="btn black">Save policy</button></article><article><h2>Session</h2><p>Sign out of this browser when you are finished.</p><form action={signOutAction}><button className="btn outline">Sign out</button></form></article></div></>}
