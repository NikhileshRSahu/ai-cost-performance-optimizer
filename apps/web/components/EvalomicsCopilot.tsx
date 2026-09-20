'use client';
import { useMemo, useState } from 'react';

type AIResult=Readonly<{
  answer:string;why:string;evidence:readonly string[];nextAction:string;
  confidence:'high'|'medium'|'low';caveats:readonly string[];
}>;

const suggestions:Record<string,string[]>={
  overview:[
    'What should I investigate first?',
    'Where is most of my AI spend going?',
    'Is my latest import trustworthy?',
    'What can I safely optimize next?'
  ],
  opportunities:[
    'Which opportunity deserves attention first?',
    'Why are these opportunities not savings yet?',
    'What evidence is missing before I test something?'
  ],
  experiments:[
    'What would make an experiment safe to run?',
    'What guardrails should I use?',
    'What evidence is still missing?'
  ],
  reports:[
    'What can I safely tell finance right now?',
    'Why is nothing verified yet?',
    'Explain the evidence ladder for my CFO.'
  ],
  integrations:[
    'Which data source should I connect next?',
    'Is CSV enough or should I connect a provider?'
  ],
  billing:[
    'What does spend under observation mean?',
    'How should I think about Evalomics pricing?'
  ],
  settings:[
    'What verification window should I use?',
    'What quality guardrail should I choose?'
  ]
};

export default function EvalomicsCopilot({screen}:{screen:string}){
  const [open,setOpen]=useState(false);
  const [question,setQuestion]=useState('');
  const [result,setResult]=useState<AIResult|null>(null);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState('');
  const [mode,setMode]=useState<'ai'|'fallback'|null>(null);
  const prompts=useMemo(()=>suggestions[screen]||suggestions.overview,[screen]);

  async function ask(value?:string){
    const q=(value??question).trim();
    if(!q||loading)return;
    setQuestion(q);setLoading(true);setError('');
    try{
      const response=await fetch('/api/ai/copilot',{
        method:'POST',headers:{'content-type':'application/json'},
        body:JSON.stringify({question:q,screen})
      });
      const json=await response.json();
      if(!response.ok||!json.ok) throw new Error(json.error||'AI_UNAVAILABLE');
      setResult(json.result);setMode(json.mode==='ai'?'ai':'fallback');
    }catch{
      setError('Evalomics Intelligence is temporarily unavailable. Your evidence and ledger were not changed.');
    }finally{setLoading(false)}
  }

  return <>
    <button className="btn outline small copilot-trigger" onClick={()=>setOpen(true)}>✦ Ask Evalomics</button>
    {open&&<div className="copilot-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setOpen(false)}}>
      <aside className="copilot-drawer">
        <header><div><span className="copilot-mark">✦</span><strong>Ask Evalomics</strong><small>Grounded in this workspace</small></div><button onClick={()=>setOpen(false)} aria-label="Close">×</button></header>
        <div className="copilot-body">
          {!result&&<section className="copilot-start">
            <p className="eyebrow">THIS SCREEN · {screen.toUpperCase()}</p>
            <h2>What do you want to understand?</h2>
            <p>I’ll answer from your workspace evidence. I cannot mark Potential or Tested values as saved.</p>
            <div className="copilot-suggestions">{prompts.map(p=><button key={p} onClick={()=>void ask(p)}>{p}<span>→</span></button>)}</div>
          </section>}
          {result&&<section className="copilot-answer">
            <p className="eyebrow">ANSWER · {mode==='ai'?'AI REASONING + MEASURED EVIDENCE':'DETERMINISTIC EVIDENCE'}</p><h2>{result.answer}</h2>
            <div className="copilot-block"><span>Why</span><p>{result.why}</p></div>
            {result.evidence?.length>0&&<div className="copilot-block"><span>Evidence used</span><ul>{result.evidence.map((e,i)=><li key={i}>{e}</li>)}</ul></div>}
            <div className="copilot-next"><span>Do this next</span><strong>{result.nextAction}</strong></div>
            <div className="copilot-meta"><span>AI confidence: {result.confidence}</span>{result.caveats?.length>0&&<span>{result.caveats[0]}</span>}</div>
            <button className="copilot-new" onClick={()=>{setResult(null);setQuestion('');setMode(null)}}>Ask another question</button>
          </section>}
          {error&&<div className="form-error">{error}</div>}
        </div>
        <form className="copilot-compose" onSubmit={e=>{e.preventDefault();void ask()}}>
          <input value={question} onChange={e=>setQuestion(e.target.value)} placeholder="Ask about this workspace…" maxLength={2000}/>
          <button className="btn black" disabled={loading||!question.trim()}>{loading?'Thinking…':'Ask'}</button>
        </form>
        <footer>AI explains and proposes. The deterministic evidence engine remains the source of truth.</footer>
      </aside>
    </div>}
  </>;
}
