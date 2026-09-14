export default function MethodologyPage() {
  return (
    <div className="landing-stack">
      <section className="hero hero-wide" aria-labelledby="methodology-title">
        <p className="eyebrow">Methodology</p>
        <h1 id="methodology-title">
          Every recommendation should survive an evidence audit.
        </h1>
        <p className="lede">
          Proovance separates observation, hypothesis, benchmark,
          implementation, and verification so an attractive estimate cannot
          quietly become a customer-savings claim.
        </p>
      </section>

      <section className="privacy-levels" aria-label="Decision methodology">
        <article>
          <span>01 · OBSERVE</span>
          <strong>Record what actually happened</strong>
          <p>
            Normalize provider, model, request volume, measured cost, token
            classes, latency, cache, retries, outcomes, and provenance when
            those fields exist.
          </p>
        </article>
        <article>
          <span>02 · DETECT</span>
          <strong>Only diagnose supported inefficiency</strong>
          <p>
            Missing denominators, mixed currencies, incomplete retry evidence,
            and unsupported fields produce withheld claims instead of guesses.
          </p>
        </article>
        <article>
          <span>03 · TEST</span>
          <strong>Make the quality floor explicit</strong>
          <p>
            A cheaper configuration is not recommended merely because it costs
            less. Candidate changes must be benchmarked against declared
            performance constraints.
          </p>
        </article>
        <article>
          <span>04 · VERIFY</span>
          <strong>Measure the post-change result</strong>
          <p>
            Potential, tested, and verified states remain separate. Negative
            verified impact remains visible and rollback guidance is retained.
          </p>
        </article>
      </section>

      <section className="landing-grid" aria-labelledby="claims-title">
        <div>
          <p className="eyebrow">Claim taxonomy</p>
          <h2 id="claims-title">What the words mean.</h2>
        </div>
        <div className="privacy-levels">
          <article>
            <span>OPPORTUNITY</span>
            <strong>Potential</strong>
            <p>
              A bounded hypothesis derived from available evidence. Not savings.
            </p>
          </article>
          <article>
            <span>BENCHMARKED</span>
            <strong>Tested</strong>
            <p>
              A candidate that passed the declared benchmark constraints. Still
              not production savings.
            </p>
          </article>
          <article>
            <span>POST-CHANGE</span>
            <strong>Verified</strong>
            <p>
              Comparable post-change evidence supports the recorded net impact.
            </p>
          </article>
        </div>
      </section>

      <section className="evidence-note">
        <strong>Hard boundary:</strong> synthetic, projected, historical replay,
        research, or inferred savings cannot be labeled as verified customer
        savings.
      </section>
    </div>
  );
}
