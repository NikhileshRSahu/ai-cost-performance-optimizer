'use client';

import Link from 'next/link';
import {
  ArrowRight,
  CheckCircle2,
  CloudUpload,
  Database,
  FileSpreadsheet,
  FlaskConical,
  Network,
  Play,
  Sparkles,
} from 'lucide-react';
import { useEffect, useState } from 'react';

const steps = [
  { id:'connect', label:'01', title:'Connect or upload', action:'Upload CSV', cursor:['20%','28%'] },
  { id:'analyze', label:'02', title:'Analyze usage', action:'Analyze usage', cursor:['78%','83%'] },
  { id:'detect', label:'03', title:'Detect waste', action:'Inspect signal', cursor:['68%','45%'] },
  { id:'test', label:'04', title:'Test safely', action:'Run benchmark', cursor:['75%','82%'] },
  { id:'verify', label:'05', title:'Verify savings', action:'View verified result', cursor:['72%','48%'] },
] as const;

export function GuidedShowcaseDemo() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const current = steps[active];

  useEffect(() => {
    if (paused) return;
    const id = window.setInterval(() => setActive((v) => (v + 1) % steps.length), 2800);
    return () => window.clearInterval(id);
  }, [paused]);

  return (
    <section className="eval-template-showcase">
      <div className="eval-template-showcase-frame et-demo-showcase-frame">
        <div className="eval-template-showcase-glow eval-motion-decorative" />

        <div className="eval-template-showcase-copy et-demo-copy">
          <span>How Evalomics works</span>
          <h2>See the product in five clicks.</h2>
          <p>
            Connect usage, analyze requests, isolate the strongest waste signal,
            test an optimization against your quality floor, then verify what actually saved money.
          </p>

          <div className="et-demo-step-list">
            {steps.map((step, index) => (
              <button
                key={step.id}
                type="button"
                className={index === active ? 'et-demo-step is-active' : 'et-demo-step'}
                onClick={() => { setActive(index); setPaused(true); }}
              >
                <span>{step.label}</span>
                <strong>{step.title}</strong>
              </button>
            ))}
          </div>
        </div>

        <div className="et-demo-world">
          <div className="et-demo-app-shell">
            <div className="et-demo-app-shell__top">
              <div>
                <span className="et-demo-kicker">Guided product demo</span>
                <h3>{current.title}</h3>
              </div>
              <div className="et-demo-top-actions">
                <button type="button" className="et-demo-chip is-live" onClick={() => setPaused((v) => !v)}>
                  <Play size={13} /> {paused ? 'Resume demo' : 'Auto playing'}
                </button>
                <Link href="/start" className="et-demo-chip">Start free <ArrowRight size={13} /></Link>
              </div>
            </div>

            <div className="et-demo-timeline">
              {steps.map((step, index) => (
                <button
                  type="button"
                  aria-label={step.title}
                  key={step.id}
                  className={
                    index < active
                      ? 'et-demo-timeline__node is-done'
                      : index === active
                        ? 'et-demo-timeline__node is-active'
                        : 'et-demo-timeline__node'
                  }
                  onClick={() => { setActive(index); setPaused(true); }}
                />
              ))}
            </div>

            <div className="et-demo-stage">
              {current.id === 'connect' && (
                <div className="et-demo-stage__content et-demo-stage__stack">
                  <div className="et-demo-source-grid">
                    <button type="button" className="et-demo-source-card is-active">
                      <FileSpreadsheet size={18} />
                      <div><strong>CSV upload</strong><span>demo-usage.csv</span></div>
                    </button>
                    <button type="button" className="et-demo-source-card">
                      <Database size={18} />
                      <div><strong>OpenAI</strong><span>Connect provider</span></div>
                    </button>
                    <button type="button" className="et-demo-source-card">
                      <Network size={18} />
                      <div><strong>Anthropic</strong><span>Connect provider</span></div>
                    </button>
                  </div>
                  <div className="et-demo-message">
                    <CloudUpload size={18} />
                    <div><strong>demo-usage.csv uploaded</strong><span>Ready for analysis</span></div>
                  </div>
                </div>
              )}

              {current.id === 'analyze' && (
                <div className="et-demo-stage__content">
                  <div className="et-demo-analysis">
                    <div className="et-demo-analysis__header">
                      <strong>Analyzing usage</strong><span>22,380 requests</span>
                    </div>
                    <div className="et-demo-progress"><i /></div>
                    <div className="et-demo-analysis__stats">
                      <div><span>Observed spend</span><b>$1,774.78</b></div>
                      <div><span>Requests</span><b>22,380</b></div>
                      <div><span>Models</span><b>7</b></div>
                    </div>
                  </div>
                </div>
              )}

              {current.id === 'detect' && (
                <div className="et-demo-stage__content">
                  <div className="et-demo-detect">
                    <div className="et-demo-signal">
                      <span className="et-demo-kicker">Highest-confidence signal</span>
                      <strong>Repeated input detected</strong>
                      <small>1,248 similar requests</small>
                    </div>
                    <div className="et-demo-detect__grid">
                      <div className="et-demo-detect__metric"><span>Avoidable spend</span><b>$87.42</b></div>
                      <div className="et-demo-detect__metric"><span>Evidence confidence</span><b>High</b></div>
                      <div className="et-demo-detect__metric"><span>Likely fix</span><b>Cache reuse</b></div>
                    </div>
                  </div>
                </div>
              )}

              {current.id === 'test' && (
                <div className="et-demo-stage__content">
                  <div className="et-demo-test">
                    <div className="et-demo-test__columns">
                      <div className="et-demo-test__side"><span>Current</span><b>$1.00 / request</b></div>
                      <div className="et-demo-test__gate">
                        <FlaskConical size={18} />
                        <strong>Quality floor passed</strong>
                        <small>96.8% retained quality</small>
                      </div>
                      <div className="et-demo-test__side right"><span>Optimized</span><b>$0.28 / request</b></div>
                    </div>
                  </div>
                </div>
              )}

              {current.id === 'verify' && (
                <div className="et-demo-stage__content et-demo-stage__stack">
                  <div className="et-demo-proof-row">
                    <div className="et-demo-proof is-potential"><span>Potential</span><b>$286–$421</b></div>
                    <div className="et-demo-proof is-tested"><span>Tested</span><b>$142.17</b></div>
                    <div className="et-demo-proof is-verified"><span>Verified</span><b>$109.32</b></div>
                  </div>
                  <div className="et-demo-verified-result">
                    <CheckCircle2 size={18} />
                    <div><strong>Verified savings: $109.32</strong><span>Production evidence reconciled</span></div>
                  </div>
                </div>
              )}
            </div>

            <div className="et-demo-footer-action">
              <div>
                <strong>{current.action}</strong>
                <span>
                  {current.id === 'connect' && 'Bring usage evidence into Evalomics.'}
                  {current.id === 'analyze' && 'Requests, tokens, models, and spend are reconstructed automatically.'}
                  {current.id === 'detect' && 'The strongest supported waste pattern is surfaced first.'}
                  {current.id === 'test' && 'Savings only advance if the benchmark clears the quality floor.'}
                  {current.id === 'verify' && 'Only production-reconciled savings become Verified.'}
                </span>
              </div>
              <button type="button" className="et-demo-primary-button" onClick={() => { setActive((active + 1) % steps.length); setPaused(true); }}>
                <Sparkles size={15} /> {current.action}
              </button>
            </div>

            <div className="et-demo-click-pulse" style={{ left: current.cursor[0], top: current.cursor[1] }} />
            <div className="et-demo-cursor" style={{ left: current.cursor[0], top: current.cursor[1] }} />
          </div>
        </div>
      </div>
    </section>
  );
}
