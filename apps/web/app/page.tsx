import Link from 'next/link';

const findings = [
  ['Repeated context', '$1,420/mo', 'High confidence'],
  ['Model overqualification', '$2,190/mo', 'Benchmark next'],
  ['Cache miss pattern', '$1,260/mo', 'High confidence'],
] as const;

export default function HomePage() {
  return (
    <div className="landing-stack premium-home">
      <section className="premium-hero" aria-labelledby="page-title">
        <div className="premium-hero-copy">
          <p className="eyebrow">Evalomics · AI Efficiency Intelligence</p>
          <h1 id="page-title">
            Find AI waste.
            <span>Prove the fix.</span>
          </h1>
          <p className="lede">
            Turn usage evidence into a Work MRI that finds cost and workflow
            waste, tests safer alternatives against a quality floor, and keeps
            opportunity, tested, and verified savings visibly separate.
          </p>
          <div className="hero-actions">
            <Link className="primary-action" href="/login">
              Run the free Work MRI
            </Link>
            <Link className="ghost-action" href="/tools">
              Explore free tools
            </Link>
          </div>
          <div className="trust-row" aria-label="Product trust signals">
            <span>No provider key required to start</span>
            <span>No prompt content required</span>
            <span>No invented savings</span>
          </div>
        </div>

        <div className="product-stage" aria-label="Illustrative Evalomics Work MRI">
          <div className="stage-topbar">
            <div>
              <span className="stage-kicker">Work MRI</span>
              <strong>Production workload</strong>
            </div>
            <span className="live-pill"><i /> Evidence loaded</span>
          </div>

          <div className="spend-summary">
            <div>
              <span>Observed AI spend</span>
              <strong>$18,420</strong>
              <small>per month</small>
            </div>
            <div className="waste-callout">
              <span>Potential waste</span>
              <strong>$4,870</strong>
              <small>requires testing</small>
            </div>
          </div>

          <div className="finding-list">
            {findings.map(([name, value, state], index) => (
              <article key={name}>
                <span className="finding-index">0{index + 1}</span>
                <div>
                  <strong>{name}</strong>
                  <small>{state}</small>
                </div>
                <b>{value}</b>
              </article>
            ))}
          </div>

          <div className="proof-track">
            <span className="proof-node active">Opportunity</span>
            <i />
            <span className="proof-node active">Tested</span>
            <i />
            <span className="proof-node verified">Verified</span>
          </div>

          <div className="verified-bar">
            <div>
              <span>Verified net saving</span>
              <strong>$1,742/mo</strong>
            </div>
            <span className="quality-pass">Quality floor passed</span>
          </div>
        </div>
      </section>

      <section className="outcome-strip" aria-label="What Evalomics does">
        <article>
          <span>01</span>
          <strong>Observe</strong>
          <p>Import evidence you already own through CSV or authorized providers.</p>
        </article>
        <article>
          <span>02</span>
          <strong>Diagnose</strong>
          <p>Detect spend, retry, cache, model, prompt, and workflow inefficiency.</p>
        </article>
        <article>
          <span>03</span>
          <strong>Benchmark</strong>
          <p>Test bounded changes against explicit quality and performance floors.</p>
        </article>
        <article>
          <span>04</span>
          <strong>Verify</strong>
          <p>Measure post-change evidence before calling any saving verified.</p>
        </article>
      </section>

      <section className="premium-section" aria-labelledby="difference-title">
        <div className="section-copy">
          <p className="eyebrow">Not another cost dashboard</p>
          <h2 id="difference-title">A decision system for AI efficiency.</h2>
          <p className="lede">
            Dashboards tell you what happened. Evalomics is designed to tell you
            what is worth changing, how to test it safely, and whether the change
            actually improved economics without crossing your quality floor.
          </p>
        </div>
        <div className="decision-grid">
          <article>
            <span className="decision-icon">→</span>
            <strong>Waste map</strong>
            <p>See where money, tokens, retries, repeated context, and workflow effort accumulate.</p>
          </article>
          <article>
            <span className="decision-icon">△</span>
            <strong>Ranked next action</strong>
            <p>Prioritize bounded hypotheses by evidence strength, expected value, and risk.</p>
          </article>
          <article>
            <span className="decision-icon">✓</span>
            <strong>Quality guard</strong>
            <p>Require a measurable floor before any optimization is recommended for implementation.</p>
          </article>
          <article>
            <span className="decision-icon">◎</span>
            <strong>Proof state</strong>
            <p>Keep Opportunity, Tested, and Verified states separate so claims stay honest.</p>
          </article>
        </div>
      </section>

      <section className="evidence-band">
        <div>
          <p className="eyebrow">Evidence before claims</p>
          <h2>Every number has a state.</h2>
        </div>
        <div className="state-explainer">
          <div><span>Potential</span><p>A mathematically supported opportunity, not a saving.</p></div>
          <div><span>Tested</span><p>A controlled benchmark passed the configured quality floor.</p></div>
          <div><span>Verified</span><p>Post-change production evidence confirms the net improvement.</p></div>
        </div>
      </section>

      <section className="final-cta">
        <p className="eyebrow">Start with evidence you already own</p>
        <h2>See what your AI workload is really costing you.</h2>
        <p>
          Start free with CSV evidence. Connect deeper sources only when the
          additional access is worth it.
        </p>
        <div className="hero-actions">
          <Link className="primary-action" href="/login">Run the free Work MRI</Link>
          <Link className="ghost-action" href="/methodology">Inspect the methodology</Link>
        </div>
      </section>
    </div>
  );
}
