'use client';

import { useState } from 'react';
import { authClient } from '../lib/auth-client';

export function GoogleSignInButton() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signIn(): Promise<void> {
    setPending(true);
    setError(null);
    try {
      const result = await authClient.signIn.social({
        provider: 'google',
        callbackURL: '/start',
      });
      if (result.error !== null) {
        setError('Google sign-in could not be started. Please try again.');
        setPending(false);
      }
    } catch {
      setError('Google sign-in could not be started. Please try again.');
      setPending(false);
    }
  }

  return (
    <div className="auth-action">
      <button
        className="primary-action"
        type="button"
        disabled={pending}
        onClick={() => {
          void signIn();
        }}
      >
        {pending ? 'Opening Google…' : 'Continue with Google'}
      </button>
      {error === null ? null : <p role="alert">{error}</p>}
    </div>
  );
}
