import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="landing-stack">
      <section className="hero hero-wide" aria-labelledby="page-title">
        <p className="eyebrow">
          Proovance · Public beta · AI Efficiency Intelligence
        </p>
        <h1 id="page-title">
          See where AI work is wasting money before changing production.
        </h1>
        <p className="lede">
          Proovance Work MRI turns usage evidence into an explainable efficiency
          diagnosis, proposes bounded optimizations, tests them against a
          quality floor, and keeps potential, tested, and verified savings
          separate.
        </p>
        <div className="hero-actions">
          <Link className="primary-action" href="/pricing">
            Start with the free Work MRI
          </Link>
          <Link href="/research">See the evidence behind the beta</Link>
          <Link href="/methodology">Read the methodology</Link>
        </div>
        <div className="hero-actions" aria-label="Product trust signals">
          <span className="trust-chip">No provider key required to start</span>
          <span className="trust-chip">
            No prompt content required for usage MRI
          </span>
          <span className="trust-chip">No invented savings</span>
        </div>
      </section>

      <section className="landing-grid" aria-labelledby="proof-title">
        <div>
          <p className="eyebrow">Evidence before social proof</p>
          <h2 id="proof-title">
            A public beta you can inspect, not a user count you have to trust.
          </h2>
          <p className="lede">
            The product is validated against public measured-cost evidence and
            real-world LLM workload traces. Research evidence is visibly labeled
            and is never presented as customer savings.
          </p>
        </div>
        <div className="metrics-grid" aria-label="Public beta evidence">
          <article className="metric-card">
            <span className="metric-label">Measured-cost replay</span>
            <strong className="metric-value">Real calls</strong>
            <span className="metric-detail">
              Provider-reported token usage, measured USD cost, latency, cache,
              model, and outcome evidence.
            </span>
          </article>
          <article className="metric-card">
            <span className="metric-label">Workload reference</span>
            <strong className="metric-value">Millions of requests</strong>
            <span className="metric-detail">
              BurstGPT real-world Azure-backed traces are used for
              workload-pattern validation, not customer-result claims.
            </span>
          </article>
          <article className="metric-card">
            <span className="metric-label">Claim boundary</span>
            <strong className="metric-value">Potential ≠ verified</strong>
            <span className="metric-detail">
              Every optimization state stays explicit from opportunity through
              benchmark and post-change verification.
            </span>
          </article>
        </div>
      </section>

      <section className="landing-grid" aria-labelledby="how-title">
        <div>
          <p className="eyebrow">How it works</p>
          <h2 id="how-title">Observe → diagnose → test → verify.</h2>
        </div>
        <ol className="landing-steps">
          <li>
            <strong>Observe</strong>
            <span>
              Start with usage evidence you already own. Deeper access is
              optional and must be explicitly authorized.
            </span>
          </li>
          <li>
            <strong>Diagnose</strong>
            <span>
              Measure spend, outcome efficiency, retries, model concentration,
              output intensity, and cache coverage where evidence supports it.
            </span>
          </li>
          <li>
            <strong>Test</strong>
            <span>
              Benchmark candidate changes against an explicit performance floor
              before recommending implementation.
            </span>
          </li>
          <li>
            <strong>Verify</strong>
            <span>
              Compare post-change evidence and keep neutral or negative outcomes
              visible instead of rewriting the story.
            </span>
          </li>
        </ol>
      </section>

      <section className="privacy-ladder" aria-labelledby="privacy-title">
        <div>
          <p className="eyebrow">Progressive privacy</p>
          <h2 id="privacy-title">Earn deeper access by proving value first.</h2>
          <p className="lede">
            Each evidence level unlocks more analysis. The Work MRI must
            withhold any conclusion that the current evidence cannot support.
          </p>
        </div>
        <div className="privacy-levels">
          <article>
            <span>01</span>
            <strong>Usage evidence</strong>
            <p>
              Cost, model, retry, token, cache, latency, and outcome economics.
            </p>
          </article>
          <article>
            <span>02</span>
            <strong>Sanitized AI history</strong>
            <p>Prompt structure, repeated context, and recurring workflows.</p>
          </article>
          <article>
            <span>03</span>
            <strong>Authorized workspace</strong>
            <p>
              Cross-tool duplication and knowledge waste only after connector
              security gates are complete.
            </p>
          </article>
          <article>
            <span>04</span>
            <strong>Production telemetry</strong>
            <p>
              Continuous verification, drift, and cost per successful outcome.
            </p>
          </article>
        </div>
      </section>

      <section className="evidence-note">
        <strong>Public-beta rule:</strong> research evidence is research
        evidence, demo evidence is demo evidence, and customer evidence is
        customer evidence. None are silently relabeled to make the product look
        more popular or more successful than it is.
      </section>
    </div>
  );
}
