'use client';

import { useEffect, useRef, useState } from 'react';

export function SignalRibbon(){
  return (
    <section className="motion-scene signal-ribbon-scene" data-scroll-scene aria-label="Common AI waste signals">
      <div className="signal-ribbon-orbit" aria-hidden="true"/>
      <div className="signal-ribbon-track" aria-hidden="true">
        <span>MODEL OVERKILL</span><i>✦</i><span>CONTEXT BLOAT</span><i>✦</i><span>CACHE MISS</span><i>✦</i><span>RETRY STORMS</span><i>✦</i><span>ROUTING WASTE</span><i>✦</i><span>AGENT LOOPS</span>
      </div>
      <div className="signal-ribbon-caption">
        <span>THE BILL MOVES FIRST.</span>
        <strong>Evalomics traces the reason.</strong>
      </div>
    </section>
  );
}

export function ObserveDetectScene(){
  return (
    <section id="manifesto" className="section motion-scene observe-detect-scene">
      <div className="scene-heading" data-reveal>
        <p className="eyebrow">01 / Observe → Detect</p>
        <h2>Your bill is the symptom.<br/><em>The workflow is the cause.</em></h2>
        <p>Evalomics reconstructs requests, model choices and repeated context, then isolates the few patterns that deserve a real test.</p>
      </div>

      <div className="economics-map" aria-label="Illustrative request flow revealing waste">
        <div className="map-field" aria-hidden="true">
          <svg viewBox="0 0 900 520" preserveAspectRatio="none">
            <path className="flow-path p1" d="M20 120 C180 70 250 220 410 178 S650 95 880 130"/>
            <path className="flow-path p2" d="M10 280 C170 350 300 230 450 290 S700 420 890 340"/>
            <path className="flow-path p3" d="M60 440 C240 390 300 470 490 390 S700 250 850 250"/>
            <path className="flow-path hot" d="M80 205 C250 160 335 220 455 230 S650 205 820 205"/>
          </svg>
          <span className="map-node n1">support</span>
          <span className="map-node n2">routing</span>
          <span className="map-node n3">agent</span>
          <span className="map-node n4">summaries</span>
          <div className="waste-pulse"><i/><b>61%</b><span>model overkill</span></div>
        </div>

        <div className="map-findings">
          <article data-reveal><span>01</span><div><b>Repeated context</b><p>14k-token system context is resent uncached across a high-volume workload.</p></div><strong>+$1.7k/mo</strong></article>
          <article data-reveal><span>02</span><div><b>Model overkill</b><p>Flagship inference is used for simple routing decisions.</p></div><strong>61%</strong></article>
          <article data-reveal><span>03</span><div><b>Retry storms</b><p>Duplicate tool calls amplify an operational error into spend.</p></div><strong>842 calls</strong></article>
        </div>
      </div>
    </section>
  );
}

export function CounterfactualReplay(){
  const ref=useRef<HTMLElement|null>(null);
  const [active,setActive]=useState(false);

  useEffect(()=>{
    const node=ref.current;
    if(!node) return;
    const observer=new IntersectionObserver(([entry])=>setActive(entry.isIntersecting),{threshold:.42});
    observer.observe(node);
    return ()=>observer.disconnect();
  },[]);

  return (
    <section ref={ref} className={'section motion-scene counterfactual-scene '+(active?'replay-active':'')}>
      <div className="scene-heading compact" data-reveal>
        <p className="eyebrow">02 / Test</p>
        <h2>Don’t trust the cheaper model.<br/><em>Make it earn the route.</em></h2>
        <p>The same workload is replayed against a candidate while cost, latency and quality remain visible together.</p>
      </div>

      <div className="replay-shell">
        <div className="replay-topline"><span>COUNTERFACTUAL REPLAY</span><b><i/> quality floor 98%</b></div>
        <div className="replay-lanes">
          <article className="replay-lane current">
            <span>CURRENT</span><h3>GPT-5</h3><small>$0.021 / task</small>
            <div className="request-stream" aria-hidden="true">{Array.from({length:8},(_,i)=><i key={i}/>)}</div>
          </article>
          <div className="replay-switch" aria-hidden="true"><span>→</span><b>20% test slice</b></div>
          <article className="replay-lane candidate">
            <span>CANDIDATE</span><h3>GPT-5 mini</h3><small>$0.015 / task</small>
            <div className="request-stream" aria-hidden="true">{Array.from({length:8},(_,i)=><i key={i}/>)}</div>
          </article>
        </div>
        <div className="replay-metrics">
          <div><span>Cost</span><i><b className="cost"/></i><strong>−27.4%</strong></div>
          <div><span>Latency</span><i><b className="latency"/></i><strong>−18.0%</strong></div>
          <div><span>Quality</span><i><b className="quality"/></i><strong>98.6%</strong></div>
        </div>
        <div className="replay-result"><span>TEST PASSED</span><strong>Cheaper route stays above the quality floor.</strong><small>Still tested — not yet verified savings.</small></div>
      </div>
    </section>
  );
}

export function VerifyScene(){
  return (
    <section id="ladder" className="section motion-scene verify-scene">
      <div className="scene-heading" data-reveal>
        <p className="eyebrow">03 / Verify</p>
        <h2>A number changes status<br/><em>only when the evidence changes.</em></h2>
        <p>Evalomics separates what happened, what might improve, what survived a test, and what production actually proved.</p>
      </div>
      <div className="evidence-triptych">
        <article className="evidence-panel observed" data-reveal><span>01 / OBSERVED</span><h3>$41,208</h3><p>Provider-reconciled spend. This is what production already shows.</p><small>baseline · 30 days</small></article>
        <article className="evidence-panel tested" data-reveal><span>02 / TESTED</span><h3>−24.8%</h3><p>Measured unit-cost change while the quality floor remained intact.</p><small>controlled slice · not rollout proof</small></article>
        <article className="evidence-panel verified" data-reveal><span>03 / VERIFIED</span><h3>$4,214/mo</h3><p>Post-change spend is reconciled against the locked baseline.</p><small>production evidence · verified</small></article>
      </div>
    </section>
  );
}
