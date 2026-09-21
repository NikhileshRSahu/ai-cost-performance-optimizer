'use client';

import type { CSSProperties } from 'react';

const steps = [
  { key:'observe', index:'01', label:'OBSERVE', title:'First, reconstruct what actually happened.', text:'Requests, tokens, models, latency and spend become one locked baseline instead of five disconnected dashboards.' },
  { key:'detect', index:'02', label:'DETECT', title:'Then let the waste reveal itself.', text:'Evalomics follows the expensive patterns back to the workflow: repeated context, model overkill, retries and routing choices.' },
  { key:'test', index:'03', label:'TEST', title:'A cheaper route has to earn its place.', text:'A controlled slice moves to a candidate model while cost, latency and the quality floor remain visible together.' },
  { key:'verify', index:'04', label:'VERIFY', title:'Only production gets the final word.', text:'The post-change window is reconciled against the locked baseline. Until then, the number is not called verified savings.' },
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
        <div className="story-shell">
          <div className="story-copy">
            <div className="story-index">THE ECONOMICS TRACE <span>·</span> one workload / four evidence states</div>
            {steps.map((step,i)=>( 
              <article className={'story-copy-step story-copy-'+step.key} key={step.key}>
                <span>{step.index} / {step.label}</span>
                <h2>{step.title}</h2>
                <p>{step.text}</p>
                {i===0 && <small>Illustrative sample scenario — not a customer case study.</small>}
                {i===3 && <small>Verified means observed in production after the change.</small>}
              </article>
            ))}
            <div className="story-nav" aria-label="Jump through the economics trace">
              {steps.map((step,i)=>( 
                <button key={step.key} type="button" onClick={()=>scrollToStep(i)} data-story-nav={step.key} aria-label={'Jump to '+step.label}>
                  <span>{step.index}</span><b>{step.label}</b>
                </button>
              ))}
            </div>
          </div>

          <div className="story-visual" aria-label="Animated economics trace from observed usage to verified savings">
            <div className="story-aurora" aria-hidden="true"><i/><i/></div>
            <svg className="trace-lines" viewBox="0 0 900 620" preserveAspectRatio="none" aria-hidden="true">
              <path className="trace-line trace-1" d="M38 122 C180 68 255 238 390 226 S610 88 858 128"/>
              <path className="trace-line trace-2" d="M28 310 C185 356 250 272 394 307 S630 396 865 315"/>
              <path className="trace-line trace-3" d="M55 512 C220 466 285 382 420 406 S660 525 850 462"/>
              <path className="trace-line trace-hot" d="M66 214 C214 172 302 242 422 250 S660 188 824 218"/>
              <path className="trace-line trace-candidate" d="M425 307 C545 307 618 352 842 350"/>
            </svg>

            <div className="trace-dots" aria-hidden="true">
              {Array.from({length:32},(_,i)=><i key={i} style={{'--x':(8+(i%8)*11.2)+'%','--y':(16+Math.floor(i/8)*18)+'%','--d':((i%7)*-.13)+'s'} as CSSProperties}/>)}
            </div>

            <div className="trace-observe"><span>LOCKED BASELINE</span><strong>$41,208</strong><small>38,421 requests · 30 days</small></div>

            <div className="trace-detect">
              <div className="waste-callout waste-a"><i/><span>repeated context</span><b>+$1.7k/mo</b></div>
              <div className="waste-callout waste-b"><i/><span>model overkill</span><b>61%</b></div>
              <div className="waste-callout waste-c"><i/><span>retry storms</span><b>842 calls</b></div>
              <strong className="detect-number">61%</strong>
            </div>

            <div className="trace-test">
              <div className="route-label route-current"><span>CURRENT</span><b>GPT-5</b><small>$0.021 / task</small></div>
              <div className="route-label route-candidate"><span>CANDIDATE</span><b>GPT-5 mini</b><small>$0.015 / task</small></div>
              <div className="test-slice"><b>20%</b><span>test slice</span></div>
              <div className="quality-floor"><span>QUALITY FLOOR 98%</span><i><b/></i><small>candidate <strong>98.6%</strong></small></div>
              <strong className="test-number">−24.8%</strong>
            </div>

            <div className="trace-verify">
              <div className="verify-ledger">
                <div><span>LOCKED BASELINE</span><b>$41,208</b></div><i>→</i><div><span>POST-CHANGE</span><b>$36,994</b></div>
              </div>
              <div className="verify-result"><span>VERIFIED</span><strong>$4,214/mo</strong><small>production evidence</small></div>
            </div>

            <div className="trace-packet packet-one" aria-hidden="true"/><div className="trace-packet packet-two" aria-hidden="true"/>
            <div className="story-progress" aria-hidden="true"><i/></div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function ProofArtifacts(){
  const after=[31,55,22,68,18];
  return (
    <section id="proof" className="proof-artifacts motion-scene">
      <div className="proof-head" data-reveal><p className="eyebrow">WHAT LEAVES EVALOMICS</p><h2>Not more charts.<br/><em>Evidence you can challenge.</em></h2></div>

      <div className="proof-spread proof-routing motion-scene">
        <div className="proof-copy" data-reveal><span>01 / TRACE</span><h3>Every recommendation keeps its path back to the workload.</h3><p>You can see what triggered the recommendation, what assumption it uses, and what would invalidate it.</p></div>
        <div className="routing-visual" aria-hidden="true">
          <span className="route-node start">request</span><span className="route-node decision">decision</span><span className="route-node candidate">candidate</span>
          <svg viewBox="0 0 620 300" preserveAspectRatio="none"><path d="M50 150 C190 150 180 150 300 150 C420 150 430 78 570 78"/><path d="M300 150 C420 150 430 232 570 232"/></svg>
          <i className="routing-packet"/><small>same request → controlled alternative</small>
        </div>
      </div>

      <div className="proof-spread proof-measure motion-scene">
        <div className="measure-visual" aria-hidden="true">
          {[74,92,61,100,48].map((before,i)=>(<div className="bar-group" key={before}><i className="bar-before" style={{height:before+'%'}}/><i className="bar-after" style={{'--after':after[i]+'%'} as CSSProperties}/></div>))}
          <div className="measure-key"><span>before</span><b>after</b></div>
        </div>
        <div className="proof-copy" data-reveal><span>02 / MEASURE</span><h3>A before/after that does not hide the quality floor.</h3><p>Cost can go down and still be a bad change. Evalomics keeps quality and latency beside the economic result.</p></div>
      </div>

      <div className="proof-spread proof-status motion-scene">
        <div className="proof-copy" data-reveal><span>03 / STATUS</span><h3>The word on the number matters as much as the number.</h3><p>Potential is an estimate. Tested survived a controlled replay. Verified appeared after rollout.</p></div>
        <div className="status-visual" aria-hidden="true"><span>Potential</span><span>Tested</span><strong>Verified</strong><b>$4,214/mo</b></div>
      </div>
    </section>
  );
}