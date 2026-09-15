'use client';

import { useState } from 'react';
import { authClient } from '../lib/auth-client';

export function SignOutButton() {
  const [pending, setPending] = useState(false);

  async function signOut(): Promise<void> {
    setPending(true);
    try {
      await authClient.signOut();
    } finally {
      window.location.assign('/');
    }
  }

  return (
    <button
      className="min-h-9 rounded-lg border border-white/10 bg-white/[0.035] px-3 py-1.5 text-xs font-semibold text-white/55 transition hover:bg-white/[0.07] hover:text-white/80 disabled:opacity-50"
      type="button"
      disabled={pending}
      onClick={() => {
        void signOut();
      }}
    >
      {pending ? 'Signing out…' : 'Sign out'}
    </button>
  );
}
