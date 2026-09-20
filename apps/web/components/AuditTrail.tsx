'use client';
import { useEffect,useState } from 'react';

type Event={event_id:string;recommendation_id:string;type:string;state:string;occurred_at:string;evidence_ref:string;reason:string|null;invalidates_event_id:string|null};

export default function AuditTrail(){
  const [events,setEvents]=useState<Event[]>([]);
  const [state,setState]=useState<'loading'|'ready'|'error'>('loading');
  useEffect(()=>{void (async()=>{try{const r=await fetch('/api/workspace/audit',{cache:'no-store'});const j=await r.json();if(!r.ok||!j.ok)throw new Error();setEvents(j.events||[]);setState('ready')}catch{setState('error')}})()},[]);
  return <article><h2>Evidence audit trail</h2><p className="settings-note">A read-only history of recommendation state changes used to support review and accountability.</p>
    {state==='loading'?<p>Loading audit trail…</p>:state==='error'?<p className="form-error">Audit trail could not be loaded.</p>:events.length===0?<p className="settings-note">No evidence state changes have been recorded yet.</p>:<div className="knowledge-docs">{events.slice(0,12).map(e=><div key={e.event_id}><div><strong>{e.state} · {e.type}</strong><span>{e.recommendation_id} · {new Date(e.occurred_at).toLocaleString()}</span></div><small>{e.reason||e.evidence_ref}</small></div>)}</div>}
  </article>
}
