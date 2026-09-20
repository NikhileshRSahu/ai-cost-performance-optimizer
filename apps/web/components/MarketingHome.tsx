'use client';
import Link from 'next/link';
import { useState } from 'react';
import { track } from '@vercel/analytics';
import { LiquidMark, ShaderField } from './EvalomicsVisualSystem';
import HeroEconomicsEngine from './HeroEconomicsEngine';

const tiers = [
  { key:'observed', label:'OBSERVED', title:'What production shows', body:'Provider-reconciled usage and spend. No counterfactual claim.', value:'$41,208' },
  { key:'potential', label:'POTENTIAL', title:'A pattern is detected', body:'Routing runs on a flagship model, but 61% of requests are trivially simple. Estimate only.', value:'$3,800–4,900/mo' },
  { key:'tested', label:'TESTED', title:'The test is running', body:'20% of routing traffic moves to a cheaper model. Quality guardrail: no worse than −1% vs control.', value:'−24.8% unit cost' },
  { key:'verified', label:'VERIFIED', title:'Now it’s savings', body:'The rollout has held in observed spend against the pre-change baseline for the verification window.', value:'$4,214/mo' },
];

export default function MarketingHome(){
  const [tier, setTier] = useState(1);
  const current = tiers[tier];
  return <main>
    <header className="site-nav">
      <Link className="logo liquid-brand" href="/"><LiquidMark size={20}/>Evalomics</Link>
      <nav><a href="#manifesto">Product</a><a href="#ladder">Proof</a><a href="#pricing">Pricing</a></nav>
      <div className="nav-actions"><Link className="nav-demo-link" href="/demo">Live demo</Link><Link className="btn black liquid-glass-cta" href="/auth/sign-up">Analyze my usage</Link><Link className="signin-link" href="/auth/sign-in">Sign in</Link></div>
    </header>

    <section className="hero blueprint hero-liquid-shell"><ShaderField/>
      <div className="hero-copy">
        <div className="hero-kicker"><span>AI ECONOMICS ENGINE</span><i/> <b>READ-ONLY</b></div><p className="sample-disclosure">ILLUSTRATIVE SAMPLE — NOT A CUSTOMER CASE STUDY</p>
        <h1>Find where your AI money <em>disappears.</em></h1>
        <p className="lead">Evalomics reconstructs your AI usage, finds expensive patterns, tests safer alternatives, and only calls a saving verified when production evidence proves it.</p>
        <div className="hero-actions"><Link className="btn black big liquid-glass-cta" href="/auth/sign-up" onClick={()=>track('marketing_signup_clicked',{surface:'hero'})}>Analyze my AI usage</Link><Link className="btn outline big liquid-glass-soft" href="/demo" onClick={()=>track('marketing_demo_clicked',{surface:'hero'})}>Watch the sample analysis</Link></div>
        <div className="hero-trust-row"><span>No production changes</span><span>CSV works</span><span>Evidence on every claim</span></div>
      </div>
      <div className="hero-visual liquid-product-stage"><HeroEconomicsEngine/></div>
      <div className="stat-strip proof-strip">
        <div><span>01</span><strong>Observe</strong><p>Reconstruct requests, tokens, models and spend.</p></div>
        <div><span>02</span><strong>Detect</strong><p>Find waste patterns worth investigating.</p></div>
        <div><span>03</span><strong>Test</strong><p>Compare cheaper options against your quality floor.</p></div>
        <div><span>04</span><strong>Verify</strong><p>Only count savings that appear in production.</p></div>
      </div>
    </section>

    <section id="manifesto" className="section split-section">
      <div><p className="eyebrow">What Evalomics sees</p><h2>Your bill is the symptom.<br/>The workflow is the cause.</h2></div>
      <div className="manifesto-grid">
        <article><span>01</span><h3>Repeated context</h3><p>14k-token system context is resent uncached across a high-volume agent workload.</p></article>
        <article><span>02</span><h3>Model overkill</h3><p>Simple routing decisions run on a flagship model even though a mini tier can handle the task.</p></article>
        <article><span>03</span><h3>Retry storms</h3><p>Hundreds of duplicate tool calls turn an operational error into an invisible spend spike.</p></article>
        <article><span>04</span><h3>Agent loops</h3><p>Long-running tool chains can multiply cost without increasing task completion.</p></article>
      </div>
    </section>

    <section id="ladder" className="section ladder-section">
      <div className="ladder-copy"><p className="eyebrow">Proof, not optimism</p><h2>Watch a number earn the right to be called savings.</h2><p>Every dollar in Evalomics sits on one of four tiers: Observed — what your spend data shows right now. Potential — a detected pattern with an estimated range. Tested — measured experiment evidence from a controlled change. Verified — rolled out, and visible in observed spend.</p><div className="tier-tabs">{tiers.map((t,i)=><button key={t.key} onClick={()=>setTier(i)} className={i===tier?'active '+t.key:''}>{t.label}</button>)}</div></div>
      <div className={'proof-card '+current.key}>
        <div className="proof-head"><span className={'tier '+current.key}>{current.label}</span><span>OPP-3118</span></div>
        <div className="proof-body"><h3>{current.title}</h3><p>{current.body}</p>{current.key==='tested' && <div className="progress"><span style={{width:'40%'}}/></div>}<hr/><strong>{current.value}</strong>{current.key==='verified' && <b className="stamp inline">VERIFIED</b>}
          <button className="btn black full" onClick={()=>setTier(tier===3?0:tier+1)}>{tier===0?'Find an opportunity':tier===1?'See sample test result':tier===2?'Complete the test':'Reset the demo'}</button>
        </div>
      </div>
    </section>

    <section className="section dark-block">
      <div><p className="eyebrow light">Illustrative sample workload</p><h2>Meridian’s bill moved. Evalomics explains the decision, not just the chart.</h2></div>
      <div className="story-rows">
        <div><b>$41,208</b><span>Observed AI spend in the last 30 days</span></div>
        <div><b>$3.8k–4.9k/mo</b><span>Potential routing saving, explicitly still an estimate</span></div>
        <div><b>−24.8%</b><span>Measured unit-cost change on a controlled slice</span></div>
        <div><b>$4,214/mo</b><span>Verified after rollout and reconciliation</span></div>
      </div>
    </section>

    <section id="pricing" className="section pricing-section">
      <p className="eyebrow">Start with evidence</p><h2>See the waste first. Pay when deeper proof is useful.</h2><p className="pricing-lead">Evalomics is currently selling a small number of design-partner pilots while we prove the full optimization workflow with real teams. We never charge a percentage of estimated savings.</p>
      <div className="pricing-grid">
        <article><h3>Observer</h3><strong>$0</strong><ul><li>CSV Import Doctor and usage analysis</li><li>Observed spend, requests and model mix</li><li>Potential opportunities clearly labeled as estimates</li></ul><Link className="btn outline full" href="/auth/sign-up">Try with my data</Link></article>
        <article className="featured"><h3>14-day design-partner pilot</h3><strong>$199<small> / pilot</small></strong><ul><li>Founder-led onboarding and cost review</li><li>CSV + OpenAI API connection support</li><li>One prioritized optimization test plan + evidence review</li><li>Verification report when post-change evidence is supplied</li></ul><Link className="btn white full" href="/auth/sign-up" onClick={()=>track('pilot_cta_clicked',{surface:'pricing'})}>Join the pilot</Link></article>
        <article><h3>Anthropic API</h3><strong>Beta</strong><ul><li>Admin usage + cost connector implemented</li><li>Marked beta until a real Admin key completes production verification</li><li>No claim of support before that proof exists</li></ul><Link className="btn outline full" href="/support">See support status</Link></article>
      </div>
    </section>

    <footer className="site-footer"><h2>Bring a number your VP can defend.</h2><div><Link className="btn white" href="/demo">Explore sample demo</Link><Link className="btn outline-light" href="/auth/sign-up">Try with my usage</Link></div><div className="footer-links"><Link href="/trust">Trust center</Link><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><Link href="/security">Security</Link><Link href="/support">Support</Link></div><p>© 2026 Evalomics. Early access. Sample figures are labeled as such because that is the whole point.</p></footer>
  </main>
}
