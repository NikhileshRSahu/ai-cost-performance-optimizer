'use client';

import { useState } from 'react';

type HistoryDiagnosis = Readonly<{
  messagesAnalyzed: number;
  userPromptsAnalyzed: number;
  conversationsAnalyzed: number;
  repeatedPromptPatterns: readonly Readonly<{
    fingerprint: string;
    occurrences: number;
    charactersPerOccurrence: number;
    avoidableRepeatedCharactersAfterFirst: number;
    automationCandidate: boolean;
  }>[];
  promptStructureFindings: readonly Readonly<{
    signal: string;
    affectedPrompts: number;
    promptShareNumerator: number;
    promptShareDenominator: number;
    interpretation: string;
    advice: string;
  }>[];
  limitations: readonly string[];
}>;

export function HistoryAnalyzer({
  organizationId,
}: Readonly<{ organizationId: string }>) {
  const [diagnosis, setDiagnosis] = useState<HistoryDiagnosis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);

  async function analyze(formData: FormData) {
    setRunning(true);
    setError(null);
    setDiagnosis(null);
    try {
      const response = await fetch(
        '/o/' + organizationId + '/history/analyze',
        {
          method: 'POST',
          body: formData,
        },
      );
      const body = (await response.json()) as {
        diagnosis?: HistoryDiagnosis;
        error?: string;
      };
      if (!response.ok || body.diagnosis === undefined) {
        setError(body.error ?? 'HISTORY_ANALYSIS_FAILED');
        return;
      }
      setDiagnosis(body.diagnosis);
    } catch {
      setError('HISTORY_ANALYSIS_FAILED');
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="workflow-page">
      <section className="workflow-card">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Level 2 · Sanitized AI history</p>
            <h2>
              Analyze prompt and workflow patterns without storing raw chats
            </h2>
          </div>
        </div>
        <p>
          Upload the normalized sanitized JSON format. Raw conversation content
          is analyzed for this request and is not persisted by this endpoint.
          Results contain derived counts, fingerprints, and advice.
        </p>
        <form
          className="upload-form"
          action={(formData) => {
            void analyze(formData);
          }}
        >
          <label className="file-drop">
            <span>Choose sanitized AI-history JSON</span>
            <small>Maximum 5 MiB · strict schema validation</small>
            <input
              type="file"
              name="historyJson"
              accept=".json,application/json"
              required
            />
          </label>
          <button className="primary-button" type="submit" disabled={running}>
            {running ? 'Analyzing…' : 'Analyze sanitized history'}
          </button>
        </form>
        {error !== null ? (
          <div className="blocking-note" role="alert">
            Analysis failed: {error}
          </div>
        ) : null}
      </section>

      {diagnosis !== null ? (
        <>
          <section className="workflow-card">
            <div className="section-heading">
              <div>
                <p className="eyebrow">History MRI</p>
                <h2>Derived usage patterns</h2>
              </div>
              <span className="trust-chip">Raw content not persisted</span>
            </div>
            <div className="summary-grid">
              <div>
                <span>Messages analyzed</span>
                <strong>{diagnosis.messagesAnalyzed}</strong>
              </div>
              <div>
                <span>User prompts</span>
                <strong>{diagnosis.userPromptsAnalyzed}</strong>
              </div>
              <div>
                <span>Conversations</span>
                <strong>{diagnosis.conversationsAnalyzed}</strong>
              </div>
              <div>
                <span>Repeat patterns</span>
                <strong>{diagnosis.repeatedPromptPatterns.length}</strong>
              </div>
            </div>
          </section>

          <section className="workflow-card">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Repeated context</p>
                <h2>Exact repeat candidates</h2>
              </div>
            </div>
            {diagnosis.repeatedPromptPatterns.length === 0 ? (
              <p>No exact repeated prompt pattern crossed the threshold.</p>
            ) : (
              <div className="recommendation-list">
                {diagnosis.repeatedPromptPatterns.map((pattern) => (
                  <article
                    className="recommendation-card"
                    key={pattern.fingerprint}
                  >
                    <h3>
                      {pattern.occurrences} exact uses ·{' '}
                      {pattern.automationCandidate
                        ? 'automation candidate'
                        : 'repeat detected'}
                    </h3>
                    <p>
                      {pattern.avoidableRepeatedCharactersAfterFirst.toLocaleString()}{' '}
                      repeated characters after the first occurrence.
                    </p>
                    <p className="projection-note">
                      Fingerprint: {pattern.fingerprint.slice(0, 16)}…
                    </p>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="workflow-card">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Prompt advisor</p>
                <h2>Structure opportunities worth testing</h2>
              </div>
            </div>
            <div className="recommendation-list">
              {diagnosis.promptStructureFindings.map((finding) => (
                <article className="recommendation-card" key={finding.signal}>
                  <h3>{finding.signal.replaceAll('_', ' ')}</h3>
                  <p>
                    Affected: {finding.affectedPrompts}/
                    {finding.promptShareDenominator} user prompts.
                  </p>
                  <p>{finding.interpretation}</p>
                  <p>
                    <strong>Test:</strong> {finding.advice}
                  </p>
                </article>
              ))}
            </div>
          </section>

          <section className="limitations" role="note">
            <h3>Limits of this analysis</h3>
            <ul>
              {diagnosis.limitations.map((limitation) => (
                <li key={limitation}>{limitation}</li>
              ))}
            </ul>
          </section>
        </>
      ) : null}
    </div>
  );
}
