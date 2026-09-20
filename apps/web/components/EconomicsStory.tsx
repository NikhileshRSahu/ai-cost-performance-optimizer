'use client';

import type { CSSProperties } from 'react';

const steps = [
  { key:'observe', index:'01', label:'OBSERVE', title:'See the bill as a system.', text:'Reconstruct requests, tokens, models, latency and spend into one baseline you can defend.' },
  { key:'detect', index:'02', label:'DETECT', title:'Find the few patterns that matter.', text:'Separate expensive behavior from normal usage, then rank what is worth testing.' },
  { key:'test', index:'03', label:'TEST', title:'Make the cheaper route prove itself.', text:'Replay the same workload against an alternative while the quality floor stays visible.' },
  { key:'verify', index:'04', label:'VERIFY', title:'Only count what production proves.', text:'Reconcile the post-change window against the locked baseline before calling it savings.' },
] as const;

function scrollToStep(index:number){
  const section=document.querySelector<HTMLElement>('[data-economics-story]');
  if(!section) return;
  const maxTravel=Math.max(0,section.offsetHeight-window.innerHeight);
  const top=section.getBoundingClientRect().top+window.scrollY;
  window.scrollTo({top:top+(maxTravel*(index/3)),behavior:'smooth'});
}

export default function EconomicsStory(){
  return (
    <section id="manifesto" className="economics-story" data-economics-story data-story-step="observe">
      <div className="story-sticky">
        <div className="story-frame">
          <div className="story-topbar">
            <div><span>THE ECONOMICS TRACE</span><b>one workload · four evidence states</b></div>
            <div className="story-progress" aria-hidden="true"><i/></div>
          </div>

          <div className="story-copy">
            {steps.map((step,i)=>(
              <article className={'story-copy-step story-copy-'+step.key} key={step.key}>
                <span>{step.index} / {step.label}</span>
                <h2>{step.title}</h2>
                <p>{step.text}</p>
                {i===0 && <small>Illustrative sample scenario — not a customer case study.</small>}
                {i===3 && <small>Verified means observed in production after the change.</small>}
              </article>
            ))}
          </div>

          <div className="story-visual" aria-label="Animated illustration of AI spend moving from observed usage to verified savings">
            <div className="story-grid" aria-hidden="true"/>
            <svg className="story-wires" viewBox="0 0 900 620" preserveAspectRatio="none" aria-hidden="true">
              <path className="wire wire-a" d="M55 130 C210 130 240 245 405 245 S630 140 845 150"/>
              <path className="wire wire-b" d="M45 300 C205 300 255 305 405 305 S645 310 850 300"/>
              <path className="wire wire-c" d="M60 475 C220 475 250 370 410 370 S640 485 850 470"/>
              <path className="wire wire-hot" d="M90 215 C240 185 305 240 410 262 S625 235 800 210"/>
              <path className="wire wire-test" d="M420 307 C535 307 565 340 660 340 S760 335 830 335"/>
            </svg>

            <div className="request-cloud" aria-hidden="true">
              {Array.from({length:18},(_,i)=><i key={i} style={{'--i':i} as CSSProperties}/>)}
            </div>

            <div className="flow-node node-source"><span>WORKLOAD</span><b>38,421</b><small>requests / 30d</small></div>
            <div className="flow-node node-model"><span>CURRENT ROUTE</span><b>GPT-5</b><small>$0.021 / task</small></div>
            <div className="flow-node node-candidate"><span>CANDIDATE</span><b>GPT-5 mini</b><small>$0.015 / task</small></div>
            <div className="flow-node node-output"><span>BASELINE</span><b>$41,208</b><small>observed spend</small></div>

            <div className="waste-signal signal-context"><i/><span>repeated context</span><b>+$1.7k/mo</b></div>
            <div className="waste-signal signal-model"><i/><span>model overkill</span><b>61%</b></div>
            <div className="waste-signal signal-retry"><i/><span>retry storms</span><b>842</b></div>

            <div className="test-slice" aria-hidden="true"><span>20%</span><small>test slice</small></div>

            <div className="quality-floor">
              <div><span>QUALITY FLOOR</span><b>98%</b></div>
              <i><b/></i>
              <small>candidate result <strong>98.6%</strong></small>
            </div>

            <div className="verify-meter">
              <div className="verify-before"><span>LOCKED BASELINE</span><b>$41,208</b></div>
              <div className="verify-arrow">→</div>
              <div className="verify-after"><span>POST-CHANGE</span><b>$36,994</b></div>
              <div className="verify-badge"><span>VERIFIED</span><strong>$4,214/mo</strong><small>production evidence</small></div>
            </div>

            <div className="story-number">
              <span>current evidence</span>
              <strong className="number-observe">$41,208</strong>
              <strong className="number-detect">61%</strong>
              <strong className="number-test">−24.8%</strong>
              <strong className="number-verify">$4,214/mo</strong>
            </div>
          </div>

          <div className="story-nav" aria-label="Jump through the analysis">
            {steps.map((step,i)=>(
              <button key={step.key} type="button" onClick={()=>scrollToStep(i)} data-story-nav={step.key}>
                <span>{step.index}</span><b>{step.label}</b>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function ProofArtifacts(){
  return (
    <section id="proof" className="proof-artifacts section motion-scene">
      <div className="proof-artifacts-intro" data-reveal>
        <p className="eyebrow">What leaves Evalomics</p>
        <h2>Not another dashboard.<br/><em>Decision-ready evidence.</em></h2>
        <p>Every result should answer one question: what happened, why it matters, and what you should do next.</p>
      </div>

      <div className="artifact-rows">
        <article data-reveal>
          <span>01</span>
          <div><small>USAGE RECONSTRUCTION</small><h3>Where the money actually went.</h3><p>Requests, tokens, models and spend reconstructed into one auditable baseline.</p></div>
          <div className="artifact-visual baseline-visual"><i/><i/><i/><b>$41,208</b></div>
        </article>
        <article data-reveal>
          <span>02</span>
          <div><small>SAFE TEST PLAN</small><h3>The exact change worth testing.</h3><p>Candidate route, expected range, quality floor and test scope in one place.</p></div>
          <div className="artifact-visual test-visual"><b>GPT-5</b><i>→</i><strong>GPT-5 mini</strong></div>
        </article>
        <article data-reveal>
          <span>03</span>
          <div><small>VERIFICATION REPORT</small><h3>What improved after rollout.</h3><p>Post-change evidence reconciled against the locked baseline, with assumptions still visible.</p></div>
          <div className="artifact-visual verify-visual"><span>VERIFIED</span><b>$4,214/mo</b></div>
        </article>
      </div>
    </section>
  );
}
