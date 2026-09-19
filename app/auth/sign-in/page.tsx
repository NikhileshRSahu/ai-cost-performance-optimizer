'use client';
import Link from 'next/link';
import { useActionState } from 'react';
import { signInWithEmail } from './actions';

export default function SignInPage() {
  const [state, action, pending] = useActionState(signInWithEmail, null);
  return <main className="auth-page blueprint">
    <header className="simple-top"><Link href="/" className="logo"><span/>Evalomics</Link><span className="quiet-chip">SECURE SIGN IN</span></header>
    <section className="auth-shell">
      <div className="auth-copy"><p className="eyebrow">Welcome back</p><h1>Sign in to Evalomics.</h1><p>Open your workspace, review evidence, and continue from the last decision your team made.</p></div>
      <form action={action} className="auth-card">
        <label>Work email<input name="email" type="email" autoComplete="email" placeholder="you@company.com" required /></label>
        <label>Password<input name="password" type="password" autoComplete="current-password" placeholder="Your password" required /></label>
        {state?.error && <p className="form-error">{state.error}</p>}
        <button className="btn black full" disabled={pending}>{pending ? 'Signing in…' : 'Sign in'}</button>
        <p className="auth-switch">New to Evalomics? <Link href="/auth/sign-up">Create an account</Link></p>
      </form>
    </section>
  </main>;
}
