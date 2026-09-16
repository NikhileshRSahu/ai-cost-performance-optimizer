import Link from 'next/link';

export default function ResearchPage() {
  return (
    <div className="landing-stack">
      <section className="hero hero-wide" aria-labelledby="research-title">
        <p className="eyebrow">Evalomics Research · Public beta validation</p>
        <h1 id="research-title">
          Real public evidence, visibly separated from customer proof.
        </h1>
        <p className="lede">
          We use public research datasets to regression-test the Work MRI
          against real measured behavior before asking a company to trust its
          own evidence to the system.
        </p>
      </section>

      <section
        className="privacy-levels"
        aria-label="Research evidence sources"
      >
        <article>
          <span>MEASURED COST</span>
          <strong>AI NetCafe / llm-cost-same-prompt</strong>
          <p>
            CC BY 4.0 public measurements including model, provider-reported
            token usage, measured USD cost, cache tokens, latency, task, and
            success status. Rows without measured billing evidence are not
            converted into zero-cost calls.
          </p>
        </article>
        <article>
          <span>WORKLOAD PATTERNS</span>
          <strong>BurstGPT v2.0</strong>
          <p>
            CC BY 4.0 real-world Azure-backed ChatGPT/GPT-4 serving traces
            spanning millions of requests, used to study workload and token
            patterns. We do not infer exact billed USD from this trace.
          </p>
        </article>
      </section>

      <section
        className="landing-grid"
        aria-labelledby="research-boundary-title"
      >
        <div>
          <p className="eyebrow">What this proves</p>
          <h2 id="research-boundary-title">
            Engineering behavior, not market traction.
          </h2>
        </div>
        <ol className="landing-steps">
          <li>
            <strong>It can prove</strong>
            <span>
              That canonical calculations and withheld-claim behavior run
              against real measured public evidence.
            </span>
          </li>
          <li>
            <strong>It cannot prove</strong>
            <span>
              Customer savings, customer count, design-partner success, or
              product-market fit.
            </span>
          </li>
          <li>
            <strong>Attribution</strong>
            <span>
              Reused public research remains attributed under its source license
              and is labeled PUBLIC_RESEARCH_TRACE inside the validation path.
            </span>
          </li>
        </ol>
      </section>

      <div className="hero-actions">
        <Link href="/methodology">Read the claim methodology</Link>
        <Link href="/pricing">See the free launch beta</Link>
      </div>
    </div>
  );
}
