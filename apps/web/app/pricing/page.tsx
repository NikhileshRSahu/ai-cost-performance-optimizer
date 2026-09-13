import Link from 'next/link';

export default function PricingPage() {
  return (
    <div className="landing-stack">
      <section className="hero hero-wide" aria-labelledby="pricing-title">
        <p className="eyebrow">Founding pilot</p>
        <h1 id="pricing-title">Pay for a decision, not another dashboard.</h1>
        <p className="lede">
          Start with evidence you already own. The pilot is designed to find one
          credible optimization opportunity, test it safely, and show exactly
          what is known, what is uncertain, and what should happen next.
        </p>
      </section>

      <section className="privacy-levels" aria-label="Pilot options">
        <article>
          <span>START FREE</span>
          <strong>CSV Efficiency Check</strong>
          <p>
            Import one usage export and get an evidence-bounded Work MRI with
            cost, request, retry, model concentration, token, cache, and outcome
            diagnostics where the data supports them.
          </p>
          <p>
            <strong>$0</strong>
          </p>
        </article>

        <article>
          <span>FOUNDING PILOT</span>
          <strong>Optimization Audit</strong>
          <p>
            One workload, one prioritized hypothesis, explicit quality
            constraints, controlled benchmark, implementation plan, and a
            decision-ready report.
          </p>
          <p>
            <strong>$299 one-time</strong>
          </p>
        </article>

        <article>
          <span>IMPLEMENT + VERIFY</span>
          <strong>Verified Optimization Sprint</strong>
          <p>
            Includes the audit plus rollout guidance, rollback criteria,
            post-change evidence collection, and verified net-impact reporting.
          </p>
          <p>
            <strong>From $999</strong>
          </p>
        </article>

        <article>
          <span>NOT YET SOLD</span>
          <strong>Connected Intelligence</strong>
          <p>
            Authorized workspace memory, cross-tool knowledge analysis, and
            continuous production optimization remain gated until their security
            and connector lifecycle controls pass release review.
          </p>
          <p>
            <strong>Waitlist</strong>
          </p>
        </article>
      </section>

      <section className="evidence-note">
        <strong>Founding-pilot rule:</strong> if the evidence does not support a
        useful optimization decision, we do not manufacture one. Potential,
        tested, and verified savings stay separate throughout the engagement.
      </section>

      <div className="hero-actions">
        <Link className="primary-action" href="/">
          See how the Work MRI works
        </Link>
      </div>
    </div>
  );
}
