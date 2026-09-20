'use client';
import { useEffect,useState } from 'react';
type Doc={id:string;title:string;source:string;created_at:string;chunks:number};
export default function KnowledgeUpload(){
  const [docs,setDocs]=useState<Doc[]>([]);const [busy,setBusy]=useState(false);const [message,setMessage]=useState('');
  async function load(){const r=await fetch('/api/knowledge',{cache:'no-store'});const j=await r.json();if(j.ok)setDocs(j.documents||[])}
  useEffect(()=>{void load()},[]);
  async function upload(file:File){setBusy(true);setMessage('');try{const form=new FormData();form.set('file',file);const r=await fetch('/api/knowledge',{method:'POST',body:form});const j=await r.json();if(!r.ok||!j.ok)throw new Error(j.error||'UPLOAD_FAILED');setMessage(file.name+' is now available to Ask Evalomics.');await load()}catch(e){setMessage(e instanceof Error?e.message:'Upload failed.')}finally{setBusy(false)}}
  async function remove(id:string){setBusy(true);await fetch('/api/knowledge',{method:'DELETE',headers:{'content-type':'application/json'},body:JSON.stringify({id})});await load();setBusy(false)}
  return <section className="knowledge-panel"><div><p className="eyebrow">RETRIEVAL CONTEXT</p><h2>Give Evalomics your operating context.</h2><p>Upload prompt documentation, runbooks, policies or architecture notes. Copilot retrieves only relevant passages; spend and savings still come from the evidence engine.</p></div><div className="knowledge-actions"><label className="btn outline">{busy?'Working…':'Upload .txt / .md / .json'}<input hidden type="file" accept=".txt,.md,.json,text/plain,text/markdown,application/json" disabled={busy} onChange={e=>{const f=e.target.files?.[0];if(f)void upload(f);e.currentTarget.value=''}}/></label></div>{message&&<p className="knowledge-message">{message}</p>}{docs.length>0&&<div className="knowledge-docs">{docs.map(d=><div key={d.id}><div><strong>{d.title}</strong><span>{d.chunks} chunk{d.chunks===1?'':'s'} available for retrieval</span></div><button disabled={busy} onClick={()=>void remove(d.id)}>Remove</button></div>)}</div>}</section>
}
