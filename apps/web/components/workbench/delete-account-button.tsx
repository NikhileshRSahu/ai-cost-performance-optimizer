'use client';

import { useState } from 'react';
import { authClient } from '../../lib/auth-client';

export function DeleteAccountButton() {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <div>
      {error ? (
        <p className="blocking-note" role="alert">
          {error}
        </p>
      ) : null}
      <button
        type="button"
        className="danger-button"
        disabled={busy}
        onClick={async () => {
          if (
            !window.confirm(
              'Permanently delete your Evalomics account? Owned workspaces must be deleted first.',
            )
          )
            return;
          setBusy(true);
          setError(null);
          const result = await authClient.deleteUser({ callbackURL: '/' });
          if (result.error) {
            setError(result.error.message ?? 'Account deletion failed.');
            setBusy(false);
          }
        }}
      >
        {busy ? 'Deleting account…' : 'Delete my account'}
      </button>
    </div>
  );
}
