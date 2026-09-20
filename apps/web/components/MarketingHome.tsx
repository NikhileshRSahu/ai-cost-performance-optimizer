'use client';

import Link from 'next/link';
import { track } from '@vercel/analytics';
import { LiquidMark } from './EvalomicsVisualSystem';
import MotionRuntime from './MotionRuntime';
import EconomicConstellation from './EconomicConstellation';
import EconomicsStory, { ProofArtifacts } from './EconomicsStory';

export default function MarketingHome(){
  return <main data-cinematic-root>
    <MotionRuntime/>
    <div className="cursor-glow" aria-hidden="true"/>

    <header className="site-nav">
      <Link className="logo liquid-brand" href="/"><LiquidMark size={19}/>Evalomics</Link>
      <nav><a href="#manifesto">Product</a><a href="#proof">Proof</a><a href="#pricing">Pricing</a></nav>
      <div className="nav-actions">
        <Link className="nav-demo-link" href="/demo">Sample analysis</Link>
        <Link className="primary-pill" data-magnetic href="/auth/sign-up">Analyze my usage</Link>
        <Link className="signin-link" href="/auth/sign-in">Sign in</Link>
      </div>
    </header>

    <section className="hero motion-scene" data-hero-scene data-scroll-scene>
      <div className="hero-aurora" aria-hidden="true"><i/><i/><i/></div>
      <div className="hero-copy">
        <div className="hero-kicker"><span>AI ECONOMICS, EXPLAINED</span><i/><b>READ-ONLY</b></div>
        <h1 className="cinematic-headline" aria-label="Find where your AI money disappears.">
          <span className="headline-line" aria-hidden="true"><span>Find where</span></span>
          <span className="headline-line" aria-hidden="true"><span>your AI money</span></span>
          <span className="headline-line" aria-hidden="true"><em>disappears.</em></span>
        </h1>
        <p className="lead">Evalomics reconstructs your AI usage, finds expensive patterns, tests safer alternatives, and only calls a saving verified when production evidence proves it.</p>
        <div className="hero-actions">
          <Link className="primary-pill hero-primary" data-magnetic href="/auth/sign-up" onClick={()=>track('marketing_signup_clicked',{surface:'hero'})}>Analyze my AI usage</Link>
          <Link className="ghost-link" href="/demo" onClick={()=>track('marketing_demo_clicked',{surface:'hero'})}>Watch a sample analysis <span>↗</span></Link>
        </div>
        <div className="hero-trust-row"><span>No production changes</span><span>CSV works</span><span>Evidence on every claim</span></div>
        <p className="sample-disclosure">Illustrative sample metrics appear in the visual — not a customer case study.</p>
      </div>

      <div className="hero-visual">
        <EconomicConstellation/>
      </div>

      <div className="hero-continuation" aria-hidden="true"><span>FOLLOW ONE WORKLOAD</span><i><b/></i><small>observe → detect → test → verify</small></div>
    </section>

    <EconomicsStory/>
    <ProofArtifacts/>

    <section className="principle-band motion-scene">
      <div className="principle-inner" data-reveal>
        <p className="eyebrow">ONE RULE</p>
        <h2>A cheaper model is not a saving.<br/><em>A prediction is not proof.</em></h2>
        <p>Potential stays potential. Tested means the alternative survived a controlled replay. Verified is reserved for a change that appears in production evidence after rollout.</p>
        <div className="evidence-words" aria-hidden="true"><span>Observed</span><i>→</i><span>Potential</span><i>→</i><span>Tested</span><i>→</i><strong>Verified</strong></div>
      </div>
    </section>

    <section id="pricing" className="pricing-editorial motion-scene">
      <div className="pricing-head" data-reveal>
        <p className="eyebrow">START WITH YOUR DATA</p>
        <h2>See the economics first.<br/><em>Pay for deeper proof when it matters.</em></h2>
      </div>
      <div className="pricing-ledger" data-reveal>
        <article>
          <span>01</span>
          <div><small>OBSERVER</small><h3>Bring the usage. See where the money went.</h3><p>CSV Import Doctor, observed spend, model mix, and clearly labeled potential opportunities.</p></div>
          <strong>$0</strong>
          <Link className="ghost-link" href="/auth/sign-up">Try with my data <b>↗</b></Link>
        </article>
        <article>
          <span>02</span>
          <div><small>14-DAY DESIGN-PARTNER PILOT</small><h3>Turn one expensive pattern into a measured decision.</h3><p>Founder-led review, one prioritized test plan, evidence review, and verification when post-change evidence is supplied.</p></div>
          <strong>$199</strong>
          <Link className="primary-pill" data-magnetic href="/auth/sign-up" onClick={()=>track('pilot_cta_clicked',{surface:'pricing'})}>Join the pilot</Link>
        </article>
      </div>
      <div className="connector-note" data-reveal><span>CONNECTORS</span><p>CSV works today. OpenAI connection support is available in the pilot. Anthropic Admin API remains Beta until a real Admin key completes production verification.</p><Link href="/support">Support status ↗</Link></div>
    </section>

    <section className="final-cta motion-scene">
      <div className="final-particles" aria-hidden="true"><i/><i/><i/><i/><i/></div>
      <div className="final-cta-inner" data-reveal>
        <p className="eyebrow">YOUR USAGE ALREADY CONTAINS THE ANSWER</p>
        <h2>MAKE YOUR AI<br/><em>ECONOMICS VISIBLE.</em></h2>
        <p>Connect or upload. Evalomics does the interpretation for you.</p>
        <div><Link className="primary-pill final-primary" data-magnetic href="/auth/sign-up">Analyze my AI usage</Link><Link className="ghost-link" href="/demo">Explore sample demo <span>↗</span></Link></div>
      </div>
    </section>

    <footer className="editorial-footer">
      <div className="footer-top"><Link className="logo footer-logo" href="/"><LiquidMark size={21}/>Evalomics</Link><div className="footer-links"><Link href="/trust">Trust</Link><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><Link href="/security">Security</Link><Link href="/support">Support</Link></div></div>
      <div className="footer-word" aria-hidden="true">EVALOMICS</div>
      <p>© 2026 Evalomics. Early access. Sample figures are labeled as such because that is the whole point.</p>
    </footer>
  </main>
}