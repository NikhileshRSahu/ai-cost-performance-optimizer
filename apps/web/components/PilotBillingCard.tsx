'use client';
import { useState } from 'react';

export default function PilotBillingCard({workspaceName,role}:{workspaceName:string;role:string}){
  const [company,setCompany]=useState(workspaceName);
  const [state,setState]=useState<'idle'|'sending'|'done'|'error'>('idle');
  const [status,setStatus]=useState('');
  async function requestPilot(){
    setState('sending');
    try{
      const r=await fetch('/api/billing/pilot',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({companyName:company})});
      const j=await r.json();if(!r.ok||!j.ok)throw new Error(j.error||'PILOT_REQUEST_FAILED');
      setStatus(j.result.status);setState('done');
    }catch{setState('error')}
  }
  return <article className="billing-card"><div><span>14-day design-partner pilot</span><strong>$199</strong></div><p>Founder-led onboarding, one prioritized optimization test, and a verification review when post-change evidence is available.</p>
    {role==='OWNER'?<><label>Company name<input value={company} onChange={e=>setCompany(e.target.value)}/></label><button className="btn black" disabled={state==='sending'||company.trim().length<2} onClick={()=>void requestPilot()}>{state==='sending'?'Requesting…':'Request pilot'}</button></>:<p className="settings-note">Only the workspace owner can request a paid pilot.</p>}
    {state==='done'&&<p className="success-line">Pilot request status: {status}. We will use the workspace owner email for billing follow-up.</p>}
    {state==='error'&&<p className="form-error">Pilot request could not be created.</p>}
  </article>
}
