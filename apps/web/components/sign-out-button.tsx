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
      className="secondary-action"
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
