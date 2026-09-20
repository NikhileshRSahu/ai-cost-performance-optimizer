'use client';
import { useState } from 'react';

export default function SupportRequestCard(){
  const [subject,setSubject]=useState('');
  const [message,setMessage]=useState('');
  const [state,setState]=useState<'idle'|'sending'|'done'|'error'>('idle');
  const [ticket,setTicket]=useState('');
  async function submit(){
    if(subject.trim().length<3||message.trim().length<10)return;
    setState('sending');
    try{
      const r=await fetch('/api/support',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({category:'PRODUCT',subject,message})});
      const j=await r.json();if(!r.ok||!j.ok)throw new Error(j.error||'SUPPORT_REQUEST_FAILED');
      setTicket(j.ticket.id);setSubject('');setMessage('');setState('done');
    }catch{setState('error')}
  }
  return <article><h2>Contact support</h2><p className="settings-note">Send a workspace-scoped support request without exposing provider secrets.</p>
    <label>Subject<input value={subject} onChange={e=>setSubject(e.target.value)} placeholder="What needs help?"/></label>
    <label>What happened?<textarea rows={4} value={message} onChange={e=>setMessage(e.target.value)} placeholder="What did you expect, and what happened instead?"/></label>
    <button className="btn outline" disabled={state==='sending'||subject.trim().length<3||message.trim().length<10} onClick={()=>void submit()}>{state==='sending'?'Sending…':'Send support request'}</button>
    {state==='done'&&<p className="success-line">Support request created: {ticket}</p>}
    {state==='error'&&<p className="form-error">Support request could not be created. You can still use the Support page.</p>}
  </article>
}
