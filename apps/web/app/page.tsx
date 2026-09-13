export default function HomePage() {
  return (
    <div className="landing-stack">
      <section className="hero hero-wide" aria-labelledby="page-title">
        <p className="eyebrow">AI Efficiency Intelligence</p>
        <h1 id="page-title">
          Find where your AI work is wasting money, time, and context.
        </h1>
        <p className="lede">
          Start with a usage CSV or authorized evidence you already own. The
          Work MRI measures what it can prove, shows the strongest action first,
          tests changes against your quality floor, and keeps potential, tested,
          and verified savings separate.
        </p>
        <div className="hero-actions" aria-label="Product trust path">
          <span className="trust-chip">CSV-first</span>
          <span className="trust-chip">No provider key required</span>
          <span className="trust-chip">No invented savings</span>
        </div>
      </section>

      <section className="landing-grid" aria-labelledby="how-title">
        <div>
          <p className="eyebrow">How it works</p>
          <h2 id="how-title">From evidence to a safer decision.</h2>
        </div>
        <ol className="landing-steps">
          <li>
            <strong>Observe</strong>
            <span>Import usage or explicitly authorize deeper evidence.</span>
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
              Benchmark candidate changes against the performance constraints
              you define.
            </span>
          </li>
          <li>
            <strong>Verify</strong>
            <span>
              Compare post-change evidence and keep negative results visible.
            </span>
          </li>
        </ol>
      </section>

      <section className="privacy-ladder" aria-labelledby="privacy-title">
        <div>
          <p className="eyebrow">Progressive privacy</p>
          <h2 id="privacy-title">Prove value before asking for deeper access.</h2>
          <p className="lede">
            Each level unlocks more analysis. The product must never claim an
            insight that the current evidence cannot support.
          </p>
        </div>
        <div className="privacy-levels">
          <article>
            <span>01</span>
            <strong>Usage CSV</strong>
            <p>Cost, model, retry, token, cache, and outcome economics.</p>
          </article>
          <article>
            <span>02</span>
            <strong>Sanitized AI history</strong>
            <p>Prompt structure, repeated context, and recurring workflows.</p>
          </article>
          <article>
            <span>03</span>
            <strong>Authorized workspace</strong>
            <p>Cross-tool duplication, buried decisions, and knowledge waste.</p>
          </article>
          <article>
            <span>04</span>
            <strong>Production telemetry</strong>
            <p>Continuous verification, drift, and cost per successful outcome.</p>
          </article>
        </div>
      </section>

      <section className="evidence-note">
        <strong>The product rule:</strong> surprising capability must come from
        evidence-backed engineering. If the data cannot support a claim, the
        Work MRI says what is missing instead of guessing.
      </section>
    </div>
  );
}
