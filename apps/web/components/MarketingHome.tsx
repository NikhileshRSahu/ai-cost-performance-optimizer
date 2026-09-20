'use client';

import Link from 'next/link';
import { track } from '@vercel/analytics';
import { LiquidMark, ShaderField } from './EvalomicsVisualSystem';
import HeroEconomicsEngine from './HeroEconomicsEngine';
import MotionRuntime from './MotionRuntime';
import EconomicsStory, { ProofArtifacts } from './EconomicsStory';

export default function MarketingHome(){
  return <main data-cinematic-root>
    <MotionRuntime/>

    <header className="site-nav">
      <Link className="logo liquid-brand" href="/"><LiquidMark size={20}/>Evalomics</Link>
      <nav><a href="#manifesto">Product</a><a href="#proof">Proof</a><a href="#pricing">Pricing</a></nav>
      <div className="nav-actions">
        <Link className="nav-demo-link" href="/demo">Explore sample demo</Link>
        <Link className="btn black liquid-glass-cta" href="/auth/sign-up">Analyze my usage</Link>
        <Link className="signin-link" href="/auth/sign-in">Sign in</Link>
      </div>
    </header>

    <section className="hero blueprint hero-liquid-shell motion-scene" data-hero-scene data-scroll-scene>
      <ShaderField/>
      <div className="hero-copy">
        <div className="hero-kicker"><span>AI ECONOMICS ENGINE</span><i/><b>READ-ONLY</b></div>
        <p className="sample-disclosure">ILLUSTRATIVE SAMPLE SCENARIO — NOT A CUSTOMER CASE STUDY</p>

        <h1 className="cinematic-headline" aria-label="Find where your AI money disappears.">
          <span className="headline-line" aria-hidden="true"><span>Find where</span></span>
          <span className="headline-line" aria-hidden="true"><span>your AI</span></span>
          <span className="headline-line" aria-hidden="true"><span>money</span></span>
          <span className="headline-line" aria-hidden="true"><em>disappears.</em></span>
        </h1>

        <p className="lead">Evalomics reconstructs your AI usage, finds expensive patterns, tests safer alternatives, and only calls a saving verified when production evidence proves it.</p>

        <div className="hero-actions">
          <Link className="btn black big liquid-glass-cta" href="/auth/sign-up" onClick={()=>track('marketing_signup_clicked',{surface:'hero'})}>Analyze my AI usage</Link>
          <Link className="btn outline big liquid-glass-soft" href="/demo" onClick={()=>track('marketing_demo_clicked',{surface:'hero'})}>Watch the sample analysis</Link>
        </div>

        <div className="hero-trust-row"><span>No production changes</span><span>CSV works</span><span>Evidence on every claim</span></div>
        <p className="sr-only">Evalomics does not change your production traffic automatically. Observed, Potential, Tested, Verified. Evalomics separates estimates from production-verified savings.</p>
      </div>

      <div className="hero-visual liquid-product-stage"><HeroEconomicsEngine/></div>

      <div className="hero-continuation" aria-hidden="true">
        <span>FOLLOW THE ECONOMICS TRACE</span>
        <i><b/></i>
        <small>scroll</small>
      </div>
    </section>

    <EconomicsStory/>
    <ProofArtifacts/>

    <section className="principle-band motion-scene">
      <div className="principle-band-inner" data-reveal>
        <span className="eyebrow light">One rule</span>
        <h2>A saving is not a saving<br/>because a model predicted it.</h2>
        <p>Potential stays potential. Tested stays tested. Verified is reserved for a change that survives the quality floor and appears in production evidence.</p>
        <div className="principle-evidence" aria-hidden="true">
          <span>Observed</span><i>→</i><span>Potential</span><i>→</i><span>Tested</span><i>→</i><strong>Verified</strong>
        </div>
      </div>
    </section>

    <section id="pricing" className="pricing-editorial section motion-scene">
      <div className="pricing-intro" data-reveal>
        <p className="eyebrow">Start with your own data</p>
        <h2>See the waste first.<br/><em>Pay for deeper proof only when it matters.</em></h2>
        <p>Evalomics is currently working with a small number of design partners while we validate the full optimization workflow with real teams. We never charge a percentage of estimated savings.</p>
      </div>

      <div className="pricing-ledger" data-reveal>
        <article>
          <span className="price-index">01</span>
          <div><small>OBSERVER</small><h3>Bring the usage. See the economics.</h3><p>CSV Import Doctor, observed spend, model mix, and clearly labeled potential opportunities.</p></div>
          <strong>$0</strong>
          <Link className="ledger-action" href="/auth/sign-up">Try with my data <span>↗</span></Link>
        </article>
        <article className="pilot-row">
          <span className="price-index">02</span>
          <div><small>14-DAY DESIGN-PARTNER PILOT</small><h3>Turn one expensive pattern into a measured decision.</h3><p>Founder-led review, one prioritized test plan, evidence review, and a verification report when post-change evidence is supplied.</p></div>
          <strong>$199</strong>
          <Link className="ledger-action" href="/auth/sign-up" onClick={()=>track('pilot_cta_clicked',{surface:'pricing'})}>Join the pilot <span>↗</span></Link>
        </article>
      </div>

      <div className="connector-note" data-reveal>
        <span>CONNECTORS</span>
        <p>CSV works today. OpenAI connection support is available in the pilot. Anthropic Admin API remains marked Beta until a real Admin key completes production verification.</p>
        <Link href="/support">Support status ↗</Link>
      </div>
    </section>

    <section className="final-cta motion-scene">
      <div className="final-cta-field" aria-hidden="true"><span/><span/><span/></div>
      <div className="final-cta-inner" data-reveal>
        <p className="eyebrow light">Your usage already contains the answer</p>
        <h2>MAKE YOUR AI<br/><em>ECONOMICS VISIBLE.</em></h2>
        <p>Connect or upload. Evalomics does the interpretation for you.</p>
        <div>
          <Link className="btn white big" href="/auth/sign-up">Analyze my AI usage</Link>
          <Link className="btn outline-light big" href="/demo">Explore sample demo</Link>
        </div>
      </div>
    </section>

    <footer className="site-footer editorial-footer">
      <div className="footer-top">
        <Link className="logo footer-logo" href="/"><LiquidMark size={22}/>Evalomics</Link>
        <div className="footer-links"><Link href="/trust">Trust center</Link><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><Link href="/security">Security</Link><Link href="/support">Support</Link></div>
      </div>
      <div className="footer-word" aria-hidden="true">EVALOMICS</div>
      <p>© 2026 Evalomics. Early access. Sample figures are labeled as such because that is the whole point.</p>
    </footer>
  </main>
}
