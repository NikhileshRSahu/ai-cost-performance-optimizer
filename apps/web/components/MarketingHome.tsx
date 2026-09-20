'use client';
import Link from 'next/link';
import { useState } from 'react';

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
      <Link className="logo" href="/"><span/>Evalomics</Link>
      <nav><a href="#manifesto">Manifesto</a><a href="#ladder">The ladder</a><a href="#pricing">Pricing</a></nav>
      <div className="nav-actions"><Link className="btn outline" href="/demo">See the live demo</Link><Link className="btn black" href="/auth/sign-up">Connect your usage data</Link><Link className="btn signin-button" href="/auth/sign-in">Sign in</Link></div>
    </header>

    <section className="hero blueprint">
      <div className="hero-copy">
        <p className="eyebrow">For teams running production LLM workloads</p><p className="sample-disclosure">ILLUSTRATIVE SAMPLE SCENARIO — NOT A CUSTOMER CASE STUDY</p>
        <h1>Your AI bill says <em>$41,208.</em><br/>It doesn’t say why.</h1>
        <p className="lead">Evalomics reads your production LLM usage, finds the waste, and proves each saving in your own spend data — before anyone claims a dollar.</p>
        <div className="hero-actions"><Link className="btn black big" href="/auth/sign-up">Connect your usage data</Link><Link className="btn outline big" href="/demo">See the live demo</Link></div>
        <p className="micro">Read-only. No traffic changes until you approve an experiment.</p>
      </div>
      <div className="hero-visual">
        <img src="https://images.unsplash.com/photo-1545987796-200677ee1011?auto=format&fit=crop&w=1200&q=82" alt="Abstract black and white network structure"/>
        <div className="verified-float"><div><span>Verified savings</span><b className="stamp">VERIFIED</b></div><strong>$7,412<small>/mo</small></strong><p>Visible in observed spend since Jun 9</p></div>
      </div>
      <div className="stat-strip">
        <div><span className="tier observed">OBSERVED</span><strong>$41,208</strong><p>Observed spend, 30 days</p></div>
        <div><span className="tier potential">POTENTIAL</span><strong>$11.8k–15.6k/mo</strong><p>Identified, not yet proven</p></div>
        <div><span className="tier tested">TESTED</span><strong>2</strong><p>Experiments running</p></div>
        <div><span className="tier verified">VERIFIED</span><strong>$7,412/mo</strong><p>Visible in observed spend</p></div>
      </div>
    </section>

    <section id="manifesto" className="section split-section">
      <div><p className="eyebrow">Why Evalomics exists</p><h2>Cost dashboards tell you what happened.<br/>Optimization needs proof.</h2></div>
      <div className="manifesto-grid">
        <article><span>01</span><h3>Repeated context</h3><p>14k-token system context is resent uncached across a high-volume agent workload.</p></article>
        <article><span>02</span><h3>Model overkill</h3><p>Simple routing decisions run on a flagship model even though a mini tier can handle the task.</p></article>
        <article><span>03</span><h3>Retry storms</h3><p>Hundreds of duplicate tool calls turn an operational error into an invisible spend spike.</p></article>
        <article><span>04</span><h3>Agent loops</h3><p>Long-running tool chains can multiply cost without increasing task completion.</p></article>
      </div>
    </section>

    <section id="ladder" className="section ladder-section">
      <div className="ladder-copy"><p className="eyebrow">The evidence ladder</p><h2>Watch a number earn the right to be called savings.</h2><p>Every dollar in Evalomics sits on one of four tiers: Observed — what your spend data shows right now. Potential — a detected pattern with an estimated range. Tested — a change run on real traffic with real results. Verified — rolled out, and visible in observed spend.</p><div className="tier-tabs">{tiers.map((t,i)=><button key={t.key} onClick={()=>setTier(i)} className={i===tier?'active '+t.key:''}>{t.label}</button>)}</div></div>
      <div className={'proof-card '+current.key}>
        <div className="proof-head"><span className={'tier '+current.key}>{current.label}</span><span>OPP-3118</span></div>
        <div className="proof-body"><h3>{current.title}</h3><p>{current.body}</p>{current.key==='tested' && <div className="progress"><span style={{width:'40%'}}/></div>}<hr/><strong>{current.value}</strong>{current.key==='verified' && <b className="stamp inline">VERIFIED</b>}
          <button className="btn black full" onClick={()=>setTier(tier===3?0:tier+1)}>{tier===0?'Find an opportunity':tier===1?'Run a 20% traffic test':tier===2?'Complete the test':'Reset the demo'}</button>
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
      <p className="eyebrow">Early-access pricing</p><h2>Pay for a useful pilot, not a promise.</h2><p className="pricing-lead">Evalomics is currently selling a small number of design-partner pilots while we prove the full optimization workflow with real teams. We never charge a percentage of estimated savings.</p>
      <div className="pricing-grid">
        <article><h3>Observer</h3><strong>$0</strong><ul><li>CSV Import Doctor and usage analysis</li><li>Observed spend, requests and model mix</li><li>Potential opportunities clearly labeled as estimates</li></ul><Link className="btn outline full" href="/auth/sign-up">Try with my data</Link></article>
        <article className="featured"><h3>14-day design-partner pilot</h3><strong>$199<small> / pilot</small></strong><ul><li>Founder-led onboarding and cost review</li><li>CSV + OpenAI API connection support</li><li>One prioritized optimization experiment</li><li>Verification report when post-change evidence is supplied</li></ul><Link className="btn white full" href="/auth/sign-up">Join the pilot</Link></article>
        <article><h3>Anthropic API</h3><strong>Beta</strong><ul><li>Admin usage + cost connector implemented</li><li>Marked beta until a real Admin key completes production verification</li><li>No claim of support before that proof exists</li></ul><Link className="btn outline full" href="/support">See support status</Link></article>
      </div>
    </section>

    <footer className="site-footer"><h2>Bring a number your VP can defend.</h2><div><Link className="btn white" href="/demo">See the live demo</Link><Link className="btn outline-light" href="/auth/sign-up">Try with my usage</Link></div><div className="footer-links"><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><Link href="/security">Security</Link><Link href="/support">Support</Link></div><p>© 2026 Evalomics. Early access. Sample figures are labeled as such because that is the whole point.</p></footer>
  </main>
}
