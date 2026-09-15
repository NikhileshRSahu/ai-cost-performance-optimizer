'use client';

import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { authClient } from '../lib/auth-client';

export function GoogleSignInButton() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signIn(): Promise<void> {
    setPending(true);
    setError(null);
    try {
      const origin = window.location.origin;
      const result = await authClient.signIn.social({
        provider: 'google',
        callbackURL: `${origin}/start`,
        errorCallbackURL: `${origin}/login?error=auth`,
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
    <div className="grid gap-3">
      <button
        className="group inline-flex min-h-12 w-full items-center justify-between rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white shadow-[0_12px_32px_rgba(15,23,42,.14)] transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:cursor-wait disabled:opacity-60"
        type="button"
        disabled={pending}
        onClick={() => {
          void signIn();
        }}
      >
        <span className="flex items-center gap-3">
          <span className="grid size-7 place-items-center rounded-full bg-white text-xs font-bold text-slate-950">
            G
          </span>
          {pending ? 'Opening Google…' : 'Continue with Google'}
        </span>
        <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
      </button>
      {error === null ? null : (
        <p
          className="m-0 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800"
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
}
