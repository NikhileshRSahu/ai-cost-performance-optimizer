'use client';

import { useCallback, useEffect, useState } from 'react';

type CredentialSummary = Readonly<{
  credentialId: string;
  label: string;
  createdAt: string;
  lastUsedAt: string | null;
  revokedAt: string | null;
}>;

type IssuedCredential = Readonly<{
  credentialId: string;
  label: string;
  token: string;
  createdAt: string;
  warning: string;
}>;

export function TelemetryCredentials({
  organizationId,
}: Readonly<{ organizationId: string }>) {
  const [credentials, setCredentials] = useState<readonly CredentialSummary[]>(
    [],
  );
  const [issued, setIssued] = useState<IssuedCredential | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const endpoint = '/o/' + organizationId + '/telemetry/credentials';

  const refresh = useCallback(async () => {
    const response = await fetch(endpoint, { cache: 'no-store' });
    const body = (await response.json()) as {
      credentials?: readonly CredentialSummary[];
      error?: string;
    };
    if (!response.ok || body.credentials === undefined) {
      setError(body.error ?? 'CREDENTIAL_LIST_FAILED');
      return;
    }
    setCredentials(body.credentials);
  }, [endpoint]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function create(formData: FormData) {
    const labelEntry = formData.get('label');
    const label = typeof labelEntry === 'string' ? labelEntry : '';
    setBusy(true);
    setError(null);
    setIssued(null);
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ label }),
      });
      const body = (await response.json()) as IssuedCredential & {
        error?: string;
      };
      if (!response.ok || typeof body.token !== 'string') {
        setError(body.error ?? 'CREDENTIAL_CREATE_FAILED');
        return;
      }
      setIssued(body);
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  async function rotate(credentialId: string) {
    setBusy(true);
    setError(null);
    setIssued(null);
    try {
      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ credentialId }),
      });
      const body = (await response.json()) as IssuedCredential & {
        error?: string;
      };
      if (!response.ok || typeof body.token !== 'string') {
        setError(body.error ?? 'CREDENTIAL_ROTATE_FAILED');
        return;
      }
      setIssued(body);
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  async function revoke(credentialId: string) {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(endpoint, {
        method: 'DELETE',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ credentialId }),
      });
      if (!response.ok) {
        const body = (await response.json()) as { error?: string };
        setError(body.error ?? 'CREDENTIAL_REVOKE_FAILED');
        return;
      }
      setIssued(null);
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <section className="workflow-card">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Create credential</p>
            <h2>Issue a telemetry-only machine token</h2>
          </div>
        </div>
        <form
          className="benchmark-form"
          action={(formData) => {
            void create(formData);
          }}
        >
          <label>
            <span>Agent label</span>
            <input
              name="label"
              minLength={2}
              maxLength={80}
              placeholder="production-agent"
              required
            />
          </label>
          <div className="action-row">
            <button className="primary-button" type="submit" disabled={busy}>
              {busy ? 'Working…' : 'Create telemetry credential'}
            </button>
          </div>
        </form>

        {error !== null ? (
          <p className="blocking-note" role="alert">
            Credential operation failed: {error}
          </p>
        ) : null}

        {issued !== null ? (
          <div className="telemetry-token-card" role="status">
            <p className="telemetry-token-kicker">Copy now</p>
            <h3>{issued.warning}</h3>
            <label className="token-display">
              Telemetry bearer token
              <textarea readOnly rows={4} value={issued.token} />
            </label>
            <p className="projection-note">
              Only a keyed hash is stored. Closing this result loses access to
              the raw token; rotate the credential if you lose it.
            </p>
          </div>
        ) : null}
      </section>

      <section className="workflow-card">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Credentials</p>
            <h2>Active and revoked telemetry agents</h2>
          </div>
        </div>

        {credentials.length === 0 ? (
          <p>No telemetry credentials have been issued yet.</p>
        ) : (
          <div className="credential-list">
            {credentials.map((credential) => {
              const active = credential.revokedAt === null;
              return (
                <article key={credential.credentialId}>
                  <div>
                    <strong>{credential.label}</strong>
                    <span>
                      {active ? 'Active' : 'Revoked'} · created{' '}
                      {credential.createdAt}
                    </span>
                    <small>
                      Last used: {credential.lastUsedAt ?? 'Never'} · ID:{' '}
                      {credential.credentialId}
                    </small>
                  </div>
                  {active ? (
                    <div className="action-row">
                      <button
                        className="secondary-action"
                        type="button"
                        disabled={busy}
                        onClick={() => {
                          void rotate(credential.credentialId);
                        }}
                      >
                        Rotate
                      </button>
                      <button
                        className="danger-button"
                        type="button"
                        disabled={busy}
                        onClick={() => {
                          void revoke(credential.credentialId);
                        }}
                      >
                        Revoke
                      </button>
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}
