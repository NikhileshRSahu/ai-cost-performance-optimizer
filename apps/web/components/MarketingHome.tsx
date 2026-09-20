'use client';

import Link from 'next/link';
import { track } from '@vercel/analytics';
import { LiquidMark } from './EvalomicsVisualSystem';
import DalaConstellation from './DalaConstellation';

export default function MarketingHome(){
  return <main className="reference-landing">
    <header className="ref-nav">
      <Link className="ref-brand" href="/"><LiquidMark size={18}/>Evalomics</Link>
      <nav>
        <a href="#manifesto">Product</a>
        <a href="#proof">Proof</a>
        <a href="#pricing">Pricing</a>
      </nav>
      <div className="ref-nav-actions">
        <Link className="ref-ghost-link" href="/demo">Explore sample demo</Link>
        <Link className="ref-primary" href="/auth/sign-up">Analyze my usage</Link>
      </div>
    </header>

    <section className="ref-hero">
      <div className="ref-hero-copy">
        <p className="ref-kicker">AI ECONOMICS ENGINE</p>
        <h1>Find where your AI money <em>disappears.</em></h1>
        <p className="ref-lead">Evalomics reconstructs your AI usage, finds expensive patterns, tests safer alternatives, and only calls a saving verified when production evidence proves it.</p>
        <div className="ref-actions">
          <Link className="ref-primary ref-primary-lg" href="/auth/sign-up" onClick={()=>track('marketing_signup_clicked',{surface:'hero'})}>Analyze my AI usage</Link>
          <Link className="ref-ghost-link ref-arrow" href="/demo" onClick={()=>track('marketing_demo_clicked',{surface:'hero'})}>Watch the sample analysis ↗</Link>
        </div>
        <div className="ref-trust"><span>No production changes</span><span>CSV works</span><span>Evidence on every claim</span></div>
        <p className="ref-disclosure">ILLUSTRATIVE SAMPLE SCENARIO — NOT A CUSTOMER CASE STUDY</p>
        <p className="sr-only">Evalomics does not change your production traffic automatically. Observed, Potential, Tested, Verified. Evalomics separates estimates from production-verified savings.</p>
      </div>

      <div className="ref-hero-art">
        <DalaConstellation/>
        <div className="ref-metric ref-metric-a"><span>OBSERVED</span><b>$41,208</b><small>30-day baseline</small></div>
        <div className="ref-metric ref-metric-b"><span>WASTE SIGNAL</span><b>61%</b><small>model overkill</small></div>
        <div className="ref-metric ref-metric-c"><span>QUALITY FLOOR</span><b>98.6%</b><small>candidate result</small></div>
        <div className="ref-metric ref-metric-d"><span>VERIFIED</span><b>$4,214/mo</b><small>production evidence</small></div>
      </div>

      <div className="ref-scroll-cue"><span>FOLLOW THE EVIDENCE</span><i/><small>observe → detect → test → verify</small></div>
    </section>

    <section id="manifesto" className="ref-section ref-split">
      <div>
        <p className="ref-kicker amber">WHAT EVALOMICS SEES</p>
        <h2>Your bill is the symptom.<br/>The workflow is the cause.</h2>
      </div>
      <div className="ref-body">
        <p>Repeated context, oversized models, retry storms and agent loops are not just technical patterns. They are economic behaviors hiding inside normal-looking usage.</p>
        <p>Evalomics reconstructs the workload first, then asks which pattern is worth changing.</p>
      </div>
    </section>

    <section className="ref-section ref-proof-flow" id="proof">
      <div className="ref-proof-art" aria-hidden="true">
        <svg viewBox="0 0 700 500" preserveAspectRatio="none">
          <path d="M30 90 C150 80 170 170 290 170 S500 100 670 120"/>
          <path d="M30 250 C170 310 250 210 350 250 S520 330 670 285"/>
          <path d="M60 420 C210 390 300 350 420 390 S570 430 650 410"/>
        </svg>
        <span className="spark s1"/><span className="spark s2"/><span className="spark s3"/>
        <div className="proof-word p1">Observed</div>
        <div className="proof-word p2">Potential</div>
        <div className="proof-word p3">Tested</div>
        <div className="proof-word p4">Verified</div>
      </div>
      <div className="ref-proof-copy">
        <p className="ref-kicker amber">PROOF, NOT OPTIMISM</p>
        <h2>Watch a number earn the right to be called savings.</h2>
        <p>Observed is what production shows. Potential is an estimate. Tested means the alternative survived a controlled replay. Verified means the change appeared in production evidence after rollout.</p>
        <div className="ref-status-line"><span>Observed</span><i>→</i><span>Potential</span><i>→</i><span>Tested</span><i>→</i><strong>Verified</strong></div>
      </div>
    </section>

    <section className="ref-section ref-split ref-reverse">
      <div>
        <p className="ref-kicker amber">COUNTERFACTUAL TEST</p>
        <h2>A cheaper route has to earn its place.</h2>
      </div>
      <div className="ref-body">
        <p>Evalomics replays a controlled slice against a candidate route while cost, latency and quality remain visible together.</p>
        <div className="ref-inline-metrics">
          <span><small>Current</small><b>GPT-5</b><em>$0.021 / task</em></span>
          <i>→</i>
          <span><small>Candidate</small><b>GPT-5 mini</b><em>$0.015 / task</em></span>
        </div>
      </div>
    </section>

    <section className="ref-principle">
      <p className="ref-kicker amber">ONE RULE</p>
      <h2>A prediction is not proof.<br/><em>A cheaper model is not a saving.</em></h2>
      <p>Potential stays potential. Tested stays tested. Verified is reserved for a change that survives the quality floor and appears in production evidence.</p>
    </section>

    <section id="pricing" className="ref-section ref-pricing">
      <div>
        <p className="ref-kicker amber">START WITH YOUR DATA</p>
        <h2>See the economics first.<br/>Pay for deeper proof when it matters.</h2>
      </div>
      <div className="ref-price-rows">
        <article>
          <span>01</span>
          <div><small>OBSERVER</small><h3>Bring the usage. See where the money went.</h3><p>CSV Import Doctor, observed spend, model mix, and clearly labeled potential opportunities.</p></div>
          <strong>$0</strong>
          <Link className="ref-ghost-link ref-arrow" href="/auth/sign-up">Try with my data ↗</Link>
        </article>
        <article>
          <span>02</span>
          <div><small>14-DAY DESIGN-PARTNER PILOT</small><h3>Turn one expensive pattern into a measured decision.</h3><p>Founder-led review, one prioritized test plan, evidence review, and verification when post-change evidence is supplied.</p></div>
          <strong>$199</strong>
          <Link className="ref-primary" href="/auth/sign-up" onClick={()=>track('pilot_cta_clicked',{surface:'pricing'})}>Join the pilot</Link>
        </article>
      </div>
    </section>

    <section className="ref-final">
      <p className="ref-kicker amber">YOUR USAGE ALREADY CONTAINS THE ANSWER</p>
      <h2>Make your AI<br/><em>economics visible.</em></h2>
      <p>Connect or upload. Evalomics does the interpretation for you.</p>
      <div className="ref-actions"><Link className="ref-primary ref-primary-lg" href="/auth/sign-up">Analyze my AI usage</Link><Link className="ref-ghost-link ref-arrow" href="/demo">Explore sample demo ↗</Link></div>
    </section>

    <footer className="ref-footer">
      <div><Link className="ref-brand" href="/"><LiquidMark size={18}/>Evalomics</Link><div><Link href="/trust">Trust</Link><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><Link href="/security">Security</Link><Link href="/support">Support</Link></div></div>
      <strong aria-hidden="true">EVALOMICS</strong>
      <p>© 2026 Evalomics. Early access. Sample figures are labeled as such because that is the whole point.</p>
    </footer>
  </main>
}
