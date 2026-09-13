import type { WorkMriSnapshot } from '../../../src/efficiency/work-mri';

export function WorkMri({ snapshot }: Readonly<{ snapshot: WorkMriSnapshot }>) {
  return (
    <section className="mri-panel" aria-labelledby="work-mri-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Evidence intelligence</p>
          <h2 id="work-mri-title">{snapshot.title}</h2>
          <p className="lede">
            Depth {snapshot.depth.level}: {snapshot.depth.label}. The MRI only
            states what the current evidence can support.
          </p>
        </div>
        <span className="quality-chip">
          {snapshot.depth.capabilities.length} capabilities unlocked
        </span>
      </div>

      <div className="metrics-grid">
        {snapshot.facts.length === 0 ? (
          <div className="empty-state">
            No trustworthy MRI fact is available yet. Import usage evidence to
            begin.
          </div>
        ) : (
          snapshot.facts.map((fact) => (
            <article className="metric-card" key={fact.label}>
              <span className="metric-label">{fact.label}</span>
              <strong className="metric-value">{fact.value}</strong>
              <span className="metric-detail">
                Evidence: {fact.evidenceRef ?? 'not available'}
              </span>
            </article>
          ))
        )}
      </div>

      {snapshot.strongestAction !== null ? (
        <div className="mri-action">
          <p className="eyebrow">Strongest evidence-backed action</p>
          <h3>{snapshot.strongestAction.title}</h3>
          <p>
            {snapshot.strongestAction.state} ·{' '}
            {snapshot.strongestAction.confidenceBand} confidence
            {snapshot.strongestAction.savingLabel === null
              ? ''
              : ' · ' + snapshot.strongestAction.savingLabel}
          </p>
          {snapshot.strongestAction.limitation !== null ? (
            <p className="projection-note">
              Limitation: {snapshot.strongestAction.limitation}
            </p>
          ) : null}
          <p>
            <strong>Next:</strong> {snapshot.strongestAction.nextAction}
          </p>
        </div>
      ) : null}

      {snapshot.withheldClaims.length > 0 ? (
        <div className="limitations" role="note">
          <h3>What we refuse to guess</h3>
          <ul>
            {snapshot.withheldClaims.map((claim) => (
              <li key={claim}>{claim}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {snapshot.nextUnlock !== null ? (
        <p className="projection-note">
          <strong>Unlock deeper analysis:</strong> {snapshot.nextUnlock}
        </p>
      ) : null}
    </section>
  );
}
