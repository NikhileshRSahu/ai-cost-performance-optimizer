'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { signOutAction } from '@/app/actions';

type Tier='observed'|'potential'|'tested'|'verified';
const opps=[
  {id:'OPP-3118',tier:'potential' as Tier,title:'Ticket routing uses a flagship model',body:'61% of routing requests score below the complexity threshold for the current model. Sampled 8,412 requests.',value:'$3,800–4,900/mo est.',meta:'High confidence · routing / GPT-5 class'},
  {id:'OPP-3112',tier:'potential' as Tier,title:'14k-token system context resent uncached',body:'Identical prefix on 91% of agent steps. Cache write rate is 3% — caching only pays on repetition.',value:'$6,200–8,100/mo est.',meta:'Medium confidence · agent-assist'},
  {id:'OBS-2214',tier:'observed' as Tier,title:'Retry storm on inventory-sync',body:'412 duplicate tool calls in 6 hours on Jun 28. $214 above baseline. Observed, not estimated.',value:'$214 above baseline',meta:'agent / inventory-sync'},
  {id:'EXP-1042',tier:'tested' as Tier,title:'Summarization routed to Haiku-tier',body:'Running on 20% of traffic, day 9 of 14. Interim delta −$306/wk on the test slice.',value:'Day 9 of 14',meta:'summarization'},
  {id:'VER-0521',tier:'verified' as Tier,title:'Prompt caching on agent-assist',body:'Rolled out Jun 9. The delta has held in observed spend for 3 weeks against the pre-change baseline.',value:'$7,412/mo',meta:'Verified since Jun 9'},
  {id:'VER-0498',tier:'verified' as Tier,title:'Retry dedupe on inventory-sync',body:'Rolled out May 22. Duplicate-call volume is down 97% and the spend delta is holding.',value:'$690/mo',meta:'Verified since May 22'},
];

const nav=[['overview','Overview'],['opportunities','Opportunities'],['experiments','Experiments'],['reports','Reports'],['alerts','Alerts'],['integrations','Integrations'],['team','Team'],['billing','Billing'],['settings','Settings']];

function TierBadge({tier}:{tier:Tier}){return <span className={'tier '+tier}>{tier.toUpperCase()}</span>}

function SpendChart(){
  return <div className="chart-box"><div className="chart-grid"></div><svg viewBox="0 0 820 250" preserveAspectRatio="none" role="img" aria-label="Observed spend versus counterfactual baseline"><path d="M20 46 C70 76,90 32,120 48 S155 165,198 46 S240 110,282 90 S330 166,380 88 S438 155,485 90 S530 170,580 86 S635 150,680 95 S730 158,800 88" fill="none" stroke="#111" strokeWidth="3"/><path d="M20 46 C80 70,125 35,182 46 S260 70,325 44 S410 75,480 46 S565 71,630 45 S720 68,800 47" fill="none" stroke="#a1a1aa" strokeWidth="2" strokeDasharray="7 7"/><line x1="240" y1="22" x2="240" y2="225" stroke="#1747b8" strokeWidth="1.5" strokeDasharray="5 5"/><text x="247" y="35" fontSize="12" fill="#1747b8">Rollout: prompt caching</text></svg><div className="chart-axis"><span>Jun 1</span><span>Jun 6</span><span>Jun 11</span><span>Jun 16</span><span>Jun 21</span><span>Jun 26</span></div></div>
}
function ModelBars(){const rows=[['GPT-5 class',88],['Claude Sonnet 5',52],['GPT-5 mini',31],['Claude Haiku 4.5',15],['Other',7]];return <div className="bars">{rows.map(([n,w])=><div key={String(n)}><span>{n}</span><i><b style={{width:w+'%'}}/></i></div>)}</div>}

export default function DashboardApp({userName,userEmail,publicDemo=false,workspaceName='My workspace'}:{userName:string,userEmail:string,publicDemo?:boolean,workspaceName?:string}){
  const path=usePathname(); const router=useRouter();
  const [role,setRole]=useState('Approver'); const [experiment,setExperiment]=useState<'running'|'complete'|'verification'|'verified'>('running');
  const section=useMemo(()=>path.split('/')[2]||'overview',[path]);
  useEffect(()=>{const s=localStorage.getItem('evalomics:experiment') as any;if(s)setExperiment(s)},[]);
  const setExp=(s:typeof experiment)=>{setExperiment(s);localStorage.setItem('evalomics:experiment',s)};
  const workspace=publicDemo?'Meridian — Production':workspaceName;
  const basePath=publicDemo?'/demo':'/dashboard';

  if(!publicDemo){
    return <RealWorkspace userName={userName} userEmail={userEmail} workspaceName={workspaceName}/>;
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


function RealWorkspace({userName,userEmail,workspaceName}:{userName:string,userEmail:string,workspaceName:string}){
  const path=usePathname();
  const section=useMemo(()=>path.split('/')[2]||'overview',[path]);
  return <main className="app-shell">
    <header className="app-top">
      <Link className="logo app-logo" href="/"><span/>Evalomics</Link>
      <div className="workspace-title"><strong>{workspaceName}</strong><span className="quiet-chip">YOUR WORKSPACE</span></div>
      <div className="app-head-actions"><span>{userEmail}</span><Link className="btn outline small" href="/">Back to site</Link></div>
    </header>
    <aside className="sidebar">
      <nav>{nav.map(([id,label])=><Link key={id} className={section===id || (section==='overview'&&id==='overview')?'active':''} href={id==='overview'?'/dashboard':'/dashboard/'+id}><span className="nav-icon">{id==='overview'?'▦':id==='opportunities'?'◇':id==='experiments'?'♜':id==='reports'?'□':id==='alerts'?'♧':id==='integrations'?'⌘':id==='team'?'♧':id==='billing'?'▭':'⚙'}</span>{label}</Link>)}</nav>
      <div className="sync-note">No provider sync yet<br/>Your workspace contains no sample spend.</div>
    </aside>
    <section className="app-content">
      {section==='overview' && <RealOverview userName={userName}/>}
      {section==='integrations' && <RealIntegrations/>}
      {section==='team' && <Team userEmail={userEmail}/>}
      {section==='settings' && <Settings userName={userName} userEmail={userEmail}/>}
      {section==='billing' && <RealBilling/>}
      {!['overview','integrations','team','settings','billing'].includes(section) && <WaitingSection section={section}/>}
    </section>
  </main>
}

function RealOverview({userName}:{userName:string}){
  return <>
    <div className="page-head"><div><p className="eyebrow">YOUR WORKSPACE</p><h1>No production data yet.</h1><p>{userName ? userName+', ' : ''}Evalomics will not invent spend, opportunities, tests, or savings before your own usage arrives.</p></div></div>
    <div className="real-empty-grid">
      <article className="real-empty-main">
        <TierBadge tier="observed"/>
        <h2>Connect usage to start observing</h2>
        <p>Bring in OpenAI, Anthropic, or a CSV usage export. The first thing Evalomics will show is what actually happened — not an estimated saving.</p>
        <div className="real-empty-actions"><Link className="btn black" href="/onboarding?step=3">Connect usage data</Link><Link className="btn outline" href="/demo">Explore sample data</Link></div>
      </article>
      <article><span className="tier observed">OBSERVED</span><strong>—</strong><p>No provider-reconciled spend yet.</p></article>
      <article><span className="tier potential">POTENTIAL</span><strong>—</strong><p>No patterns claimed before enough evidence exists.</p></article>
      <article><span className="tier tested">TESTED</span><strong>—</strong><p>No experiments have run on your traffic.</p></article>
      <article><span className="tier verified">VERIFIED</span><strong>—</strong><p>No savings can be verified before rollout and observation.</p></article>
    </div>
    <div className="real-next">
      <p className="eyebrow">WHAT HAPPENS NEXT</p>
      <div className="real-next-steps"><div><b>1</b><strong>Connect</strong><span>Read-only usage or CSV</span></div><div><b>2</b><strong>Observe</strong><span>Build a trustworthy baseline</span></div><div><b>3</b><strong>Detect</strong><span>Label estimates as Potential</span></div><div><b>4</b><strong>Test</strong><span>Measure changes on real traffic</span></div><div><b>5</b><strong>Verify</strong><span>Only then call it savings</span></div></div>
    </div>
  </>
}

function RealIntegrations(){
  return <>
    <div className="page-head"><div><p className="eyebrow">DATA SOURCES</p><h1>Connect your usage.</h1><p>Your real workspace starts empty. Nothing here is marked connected until you connect it.</p></div></div>
    <div className="integration-grid">
      {[
        ['OpenAI','Not connected','Usage and cost metadata'],
        ['Anthropic','Not connected','Usage and cost metadata'],
        ['CSV import','Available','Upload an export without sharing a provider key'],
        ['Slack','Not connected','Alerts after your workspace has real events'],
        ['Email','Account only','Product and experiment notifications'],
        ['Warehouse','Not connected','Enterprise evidence export']
      ].map(([a,b,c])=><article key={a}><div><strong>{a}</strong><span>{b}</span></div><p>{c}</p>{a==='CSV import'?<Link className="btn outline small" href="/onboarding?step=3">Upload CSV</Link>:a==='OpenAI'||a==='Anthropic'?<Link className="btn outline small" href="/onboarding?step=3">Connect</Link>:<button className="btn outline small" disabled>Not configured</button>}</article>)}
    </div>
  </>
}

function RealBilling(){
  return <><div className="page-head"><div><p className="eyebrow">BILLING</p><h1>No paid plan selected.</h1><p>Billing should reflect your account, not the sample workspace.</p></div></div><div className="billing-card"><div><span>Current plan</span><strong>Observer</strong></div><div><span>Spend under observation</span><strong>—</strong></div><Link className="btn outline" href="/#pricing">View pricing</Link></div></>
}

function WaitingSection({section}:{section:string}){
  const label=section.charAt(0).toUpperCase()+section.slice(1);
  return <div className="workspace-empty-section"><p className="eyebrow">YOUR WORKSPACE</p><h1>{label}</h1><p>This section will populate from your own production evidence. Sample opportunities and experiments are available only in the public demo.</p><Link className="btn black" href="/onboarding?step=3">Connect usage data</Link><Link className="btn outline" href="/demo">Open sample demo</Link></div>
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
