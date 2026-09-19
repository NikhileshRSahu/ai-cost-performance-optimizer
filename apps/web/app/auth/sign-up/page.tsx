'use client';
import Link from 'next/link';
import { useActionState } from 'react';
import { signUpWithEmail } from './actions';

export default function SignUpPage() {
  const [state, action, pending] = useActionState(signUpWithEmail, null);
  return <main className="auth-page blueprint">
    <header className="simple-top"><Link href="/" className="logo"><span/>Evalomics</Link><span className="quiet-chip">CREATE WORKSPACE</span></header>
    <section className="auth-shell">
      <div className="auth-copy"><p className="eyebrow">Start with evidence</p><h1>Create your Evalomics account.</h1><p>Connect usage read-only. Nothing changes production traffic until someone with approval authority explicitly rolls out a tested change.</p></div>
      <form action={action} className="auth-card">
        <label>Your name<input name="name" type="text" autoComplete="name" placeholder="Priya Shah" required /></label>
        <label>Work email<input name="email" type="email" autoComplete="email" placeholder="priya@company.com" required /></label>
        <label>Password<input name="password" type="password" autoComplete="new-password" placeholder="12+ characters" minLength={12} required /></label>
        {state?.error && <p className="form-error">{state.error}</p>}
        <button className="btn black full" disabled={pending}>{pending ? 'Creating account…' : 'Create account'}</button>
        <p className="auth-switch">Already have an account? <Link href="/auth/sign-in">Sign in</Link></p>
      </form>
    </section>
  </main>;
}
