'use client';
import Link from 'next/link';
import { track } from '@vercel/analytics';
import { LiquidMark, ShaderField } from './EvalomicsVisualSystem';
import HeroEconomicsEngine from './HeroEconomicsEngine';
import MotionRuntime from './MotionRuntime';
import { CounterfactualReplay, ObserveDetectScene, SignalRibbon, VerifyScene } from './CinematicSections';

export default function MarketingHome(){
  return <main data-cinematic-root>
    <MotionRuntime/>

    <header className="site-nav">
      <Link className="logo liquid-brand" href="/"><LiquidMark size={20}/>Evalomics</Link>
      <nav><a href="#manifesto">Product</a><a href="#ladder">Proof</a><a href="#pricing">Pricing</a></nav>
      <div className="nav-actions"><Link className="nav-demo-link" href="/demo">Explore sample demo</Link><Link className="btn black liquid-glass-cta" href="/auth/sign-up">Analyze my usage</Link><Link className="signin-link" href="/auth/sign-in">Sign in</Link></div>
    </header>

    <section className="hero blueprint hero-liquid-shell motion-scene" data-hero-scene data-scroll-scene>
      <ShaderField/>
      <div className="hero-copy">
        <div className="hero-kicker"><span>AI ECONOMICS ENGINE</span><i/> <b>READ-ONLY</b></div>
        <p className="sample-disclosure">ILLUSTRATIVE SAMPLE SCENARIO — NOT A CUSTOMER CASE STUDY</p>
        <h1 className="cinematic-headline" aria-label="Find where your AI money disappears.">
          <span className="headline-line" aria-hidden="true"><span>Find where</span></span>
          <span className="headline-line" aria-hidden="true"><span>your AI</span></span>
          <span className="headline-line" aria-hidden="true"><span>money</span></span>
          <span className="headline-line" aria-hidden="true"><em>disappears.</em></span>
        </h1>
        <p className="lead">Evalomics reconstructs your AI usage, finds expensive patterns, tests safer alternatives, and only calls a saving verified when production evidence proves it.</p>
        <div className="hero-actions"><Link className="btn black big liquid-glass-cta" href="/auth/sign-up" onClick={()=>track('marketing_signup_clicked',{surface:'hero'})}>Analyze my AI usage</Link><Link className="btn outline big liquid-glass-soft" href="/demo" onClick={()=>track('marketing_demo_clicked',{surface:'hero'})}>Watch the sample analysis</Link></div>
        <div className="hero-trust-row"><span>No production changes</span><span>CSV works</span><span>Evidence on every claim</span></div>
        <p className="sr-only">Evalomics does not change your production traffic automatically. Observed, Potential, Tested, Verified. Evalomics separates estimates from production-verified savings.</p>
      </div>

      <div className="hero-visual liquid-product-stage"><HeroEconomicsEngine/></div>

      <div className="stat-strip proof-strip">
        <div><span>01</span><strong>Observe</strong><p>Reconstruct requests, tokens, models and spend.</p></div>
        <div><span>02</span><strong>Detect</strong><p>Find waste patterns worth investigating.</p></div>
        <div><span>03</span><strong>Test</strong><p>Compare cheaper options against your quality floor.</p></div>
        <div><span>04</span><strong>Verify</strong><p>Only count savings that appear in production.</p></div>
      </div>
    </section>

    <SignalRibbon/>
    <ObserveDetectScene/>
    <CounterfactualReplay/>
    <VerifyScene/>

    <section className="section dark-block motion-scene" data-reveal>
      <div><p className="eyebrow light">Illustrative sample workload</p><h2>Meridian’s bill moved. Evalomics explains the decision, not just the chart.</h2></div>
      <div className="story-rows">
        <div><b>$41,208</b><span>Observed AI spend in the last 30 days</span></div>
        <div><b>$3.8k–4.9k/mo</b><span>Potential routing saving, explicitly still an estimate</span></div>
        <div><b>−24.8%</b><span>Measured unit-cost change on a controlled slice</span></div>
        <div><b>$4,214/mo</b><span>Verified after rollout and reconciliation</span></div>
      </div>
    </section>

    <section id="pricing" className="section pricing-section motion-scene">
      <div data-reveal>
        <p className="eyebrow">Start with evidence</p>
        <h2>See the waste first. Pay when deeper proof is useful.</h2>
        <p className="pricing-lead">Evalomics is currently selling a small number of design-partner pilots while we prove the full optimization workflow with real teams. We never charge a percentage of estimated savings.</p>
      </div>
      <div className="pricing-grid" data-reveal>
        <article><h3>Observer</h3><strong>$0</strong><ul><li>CSV Import Doctor and usage analysis</li><li>Observed spend, requests and model mix</li><li>Potential opportunities clearly labeled as estimates</li></ul><Link className="btn outline full" href="/auth/sign-up">Try with my data</Link></article>
        <article className="featured"><h3>14-day design-partner pilot</h3><strong>$199<small> / pilot</small></strong><ul><li>Founder-led onboarding and cost review</li><li>CSV + OpenAI API connection support</li><li>One prioritized optimization test plan + evidence review</li><li>Verification report when post-change evidence is supplied</li></ul><Link className="btn white full" href="/auth/sign-up" onClick={()=>track('pilot_cta_clicked',{surface:'pricing'})}>Join the pilot</Link></article>
        <article><h3>Anthropic API</h3><strong>Beta</strong><ul><li>Admin usage + cost connector implemented</li><li>Marked beta until a real Admin key completes production verification</li><li>No claim of support before that proof exists</li></ul><Link className="btn outline full" href="/support">See support status</Link></article>
      </div>
    </section>

    <footer className="site-footer"><h2>Bring a number your VP can defend.</h2><div><Link className="btn white" href="/demo">Explore sample demo</Link><Link className="btn outline-light" href="/auth/sign-up">Try with my usage</Link></div><div className="footer-links"><Link href="/trust">Trust center</Link><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><Link href="/security">Security</Link><Link href="/support">Support</Link></div><p>© 2026 Evalomics. Early access. Sample figures are labeled as such because that is the whole point.</p></footer>
  </main>
}
