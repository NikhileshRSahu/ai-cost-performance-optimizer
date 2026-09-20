'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

const stages = [
  { key:'observe', label:'OBSERVED', title:'Usage reconstructed', value:'$41,208', meta:'38,421 requests · 30 days' },
  { key:'detect', label:'POTENTIAL', title:'Model overkill detected', value:'$3.8k–4.9k/mo', meta:'61% of routing requests look simple' },
  { key:'test', label:'TESTED', title:'Cheaper route passes', value:'−24.8%', meta:'unit cost · quality delta −0.3%' },
  { key:'verify', label:'VERIFIED', title:'Savings visible in production', value:'$4,214/mo', meta:'post-change window reconciled' },
] as const;

const dwell=[1150,1350,1750,2650];

export default function HeroEconomicsEngine(){
  const shell=useRef<HTMLDivElement|null>(null);
  const [step,setStep]=useState(0);
  const [inView,setInView]=useState(false);
  const [documentVisible,setDocumentVisible]=useState(true);
  const reduced=useMemo(()=>typeof window!=='undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,[]);

  useEffect(()=>{
    const node=shell.current;
    if(!node) return;
    const observer=new IntersectionObserver(([entry])=>setInView(entry.isIntersecting),{threshold:.34});
    observer.observe(node);
    const onVisibility=()=>setDocumentVisible(document.visibilityState==='visible');
    document.addEventListener('visibilitychange',onVisibility);
    onVisibility();
    return ()=>{
      observer.disconnect();
      document.removeEventListener('visibilitychange',onVisibility);
    };
  },[]);

  useEffect(()=>{
    if(reduced){setStep(3);return;}
    if(!inView || !documentVisible) return;
    const id=window.setTimeout(()=>setStep(s=>(s+1)%stages.length),dwell[step]);
    return ()=>window.clearTimeout(id);
  },[step,inView,documentVisible,reduced]);

  const active=stages[step];

  return (
    <div ref={shell} className={'econ-engine step-'+step} data-engine-step={active.key} aria-label="Illustrative Evalomics analysis">
      <div className="econ-window-bar">
        <div className="econ-dots" aria-hidden="true"><i/><i/><i/></div>
        <span>evalomics / economics-engine</span>
        <b>SAMPLE</b>
      </div>

      <div className="econ-engine-body">
        <div className="econ-command">
          <span className="prompt">$</span>
          <span>analyze usage.csv --quality-floor 98%</span>
          <i className="econ-command-pulse" aria-hidden="true"/>
        </div>

        <div className="econ-run">
          <div className={'econ-line '+(step>=0?'show':'')}>
            <span className="econ-check">✓</span>
            <div><b>Usage loaded</b><small>OpenAI + application metadata</small></div>
            <strong>38,421 req</strong>
          </div>
          <div className={'econ-line '+(step>=0?'show':'')}>
            <span className="econ-check">✓</span>
            <div><b>Observed spend</b><small>Provider-reconciled baseline</small></div>
            <strong>$41,208</strong>
          </div>
          <div className={'econ-line warning '+(step>=1?'show':'')}>
            <span className="econ-signal">!</span>
            <div><b>Model overkill</b><small>Flagship model on simple routing tasks</small></div>
            <strong>61%</strong>
          </div>
        </div>

        <div className={'econ-test '+(step>=2?'active':'')}>
          <div className="econ-test-head">
            <span>COUNTERFACTUAL TEST</span>
            <span className="econ-live"><i/> quality floor 98%</span>
          </div>
          <div className="econ-route">
            <div><small>current</small><b>GPT-5</b><span>$0.021 / task</span></div>
            <div className="econ-arrow" aria-hidden="true"><span>→</span></div>
            <div><small>candidate</small><b>GPT-5 mini</b><span>$0.015 / task</span></div>
          </div>
          <div className="econ-bars">
            <div><span>Cost</span><i><b style={{width:'72%'}}/></i><strong>−27.4%</strong></div>
            <div><span>Latency</span><i><b style={{width:'82%'}}/></i><strong>−18.0%</strong></div>
            <div><span>Quality</span><i><b className="quality" style={{width:'98%'}}/></i><strong>98.6%</strong></div>
          </div>
        </div>

        <div className="econ-stage-card" aria-live="polite">
          <div>
            <span className={'tier '+active.key}>{active.label}</span>
            <small>{active.title}</small>
          </div>
          <strong>{active.value}</strong>
          <p>{active.meta}</p>
        </div>

        <div className="econ-stage-rail" aria-label="Evidence progression">
          {stages.map((s,i)=>(
            <button key={s.key} onClick={()=>setStep(i)} className={i===step?'active '+s.key:''} aria-pressed={i===step}>
              <span>{String(i+1).padStart(2,'0')}</span>
              <b>{s.label}</b>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
