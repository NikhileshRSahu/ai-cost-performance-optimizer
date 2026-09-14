'use client';

import { useState, type FormEvent } from 'react';

type ReplayResult = Readonly<{
  status: 'PROJECTED' | 'INELIGIBLE_BENCHMARK' | 'INELIGIBLE_BASELINE';
  reasons: readonly string[];
  currency: string;
  historicalBaselineCost: string | null;
  projectedCandidateCost: string | null;
  projectedGrossSaving: string | null;
  benchmarkConfidenceBand: 'LOW' | 'MEDIUM' | 'HIGH';
  claimBoundary: string;
  persistedAsVerifiedSavings: false;
}>;

export function HistoricalReplay({
  organizationId,
  recommendationId,
}: Readonly<{
  organizationId: string;
  recommendationId: string;
}>) {
  const [result, setResult] = useState<ReplayResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);

  async function replay(formData: FormData) {
    setRunning(true);
    setError(null);
    setResult(null);

    try {
      const baselineEntry = formData.get('historicalBaselineCost');
      const historicalBaselineCost =
        typeof baselineEntry === 'string' ? baselineEntry : '';

      const response = await fetch(
        '/o/' + organizationId + '/lab/' + recommendationId + '/replay',
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            historicalBaselineCost,
            historicalWindowComparable:
              formData.get('historicalWindowComparable') === 'true',
          }),
        },
      );
      const body = (await response.json()) as ReplayResult & {
        error?: string;
      };
      if (!response.ok) {
        setError(body.error ?? 'REPLAY_FAILED');
        return;
      }
      setResult(body);
    } catch {
      setError('REPLAY_FAILED');
    } finally {
      setRunning(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await replay(new FormData(event.currentTarget));
  }

  return (
    <section className="lab-section" aria-labelledby="historical-replay-title">
      <p className="eyebrow">Counterfactual replay</p>
      <h2 id="historical-replay-title">
        What if this candidate had handled a comparable historical window?
      </h2>
      <p>
        Enter the actual cost of a historical window that represents the same
        workload mix. The product applies the tested benchmark cost ratio only;
        it does not call the result verified savings.
      </p>

      <form
        className="benchmark-form"
        onSubmit={(event) => {
          void handleSubmit(event);
        }}
      >
        <label>
          <span>Historical baseline cost</span>
          <input
            name="historicalBaselineCost"
            inputMode="decimal"
            pattern="(?:0|[1-9]\d*)(?:\.\d+)?"
            required
          />
        </label>
        <label className="checkbox-row">
          <input
            name="historicalWindowComparable"
            type="checkbox"
            value="true"
            required
          />
          <span>
            I confirm this window represents a comparable workload and volume
            basis for this projection.
          </span>
        </label>
        <button className="primary-button" type="submit" disabled={running}>
          {running ? 'Replaying…' : 'Replay historical cost'}
        </button>
      </form>

      {error !== null ? (
        <div className="blocking-note" role="alert">
          Replay failed: {error}
        </div>
      ) : null}

      {result !== null ? (
        <div className="mri-action" aria-live="polite">
          <p className="eyebrow">{result.status}</p>
          {result.status === 'PROJECTED' ? (
            <div className="metrics-grid">
              <div className="metric-card">
                <p className="metric-label">Historical baseline</p>
                <p className="metric-value">
                  {result.currency} {result.historicalBaselineCost}
                </p>
              </div>
              <div className="metric-card">
                <p className="metric-label">Projected candidate cost</p>
                <p className="metric-value">
                  {result.currency} {result.projectedCandidateCost}
                </p>
              </div>
              <div className="metric-card">
                <p className="metric-label">Projected gross saving</p>
                <p className="metric-value">
                  {result.currency} {result.projectedGrossSaving}
                </p>
              </div>
              <div className="metric-card">
                <p className="metric-label">Benchmark confidence</p>
                <p className="metric-value">{result.benchmarkConfidenceBand}</p>
              </div>
            </div>
          ) : (
            <ul>
              {result.reasons.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
          )}
          <p className="projection-note">{result.claimBoundary}</p>
          <p className="projection-note">
            This replay is never written to the VERIFIED savings ledger.
          </p>
        </div>
      ) : null}
    </section>
  );
}
