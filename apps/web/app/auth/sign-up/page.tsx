'use client';
import Link from 'next/link';
import { useActionState, useState } from 'react';
import { authClient } from '@/lib/auth/client';
import { signUpWithEmail } from './actions';

function GoogleMark(){
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.4-.18-2.07H12v3.92h5.38a4.6 4.6 0 0 1-2 3.02v2.54h3.24c1.9-1.75 2.98-4.33 2.98-7.41Z"/><path fill="#34A853" d="M12 22c2.7 0 4.97-.9 6.62-2.36l-3.24-2.54c-.9.6-2.05.96-3.38.96-2.6 0-4.81-1.76-5.6-4.13H3.05v2.62A10 10 0 0 0 12 22Z"/><path fill="#FBBC05" d="M6.4 13.93A6.01 6.01 0 0 1 6.09 12c0-.67.12-1.32.31-1.93V7.45H3.05A10 10 0 0 0 2 12c0 1.62.39 3.15 1.05 4.55l3.35-2.62Z"/><path fill="#EA4335" d="M12 5.94c1.47 0 2.79.51 3.83 1.5l2.87-2.87A9.63 9.63 0 0 0 12 2a10 10 0 0 0-8.95 5.45l3.35 2.62c.79-2.37 3-4.13 5.6-4.13Z"/></svg>
}

export default function SignUpPage() {
  const [state, action, pending] = useActionState(signUpWithEmail, null);
  const [oauthError,setOauthError]=useState('');
  const [googlePending,setGooglePending]=useState(false);
  async function google(){
    setOauthError(''); setGooglePending(true);
    try{
      await authClient.signIn.social({
        provider:'google',
        callbackURL: window.location.origin + '/onboarding',
        newUserCallbackURL: window.location.origin + '/onboarding',
        errorCallbackURL: window.location.origin + '/auth/sign-up?error=google',
      });
    }catch{
      setOauthError('Google sign-up could not start. Please try again.');
      setGooglePending(false);
    }
  }
  return <main className="auth-page auth-clean">
    <header className="simple-top"><Link href="/" className="logo"><span/>Evalomics</Link><Link href="/" className="auth-close" aria-label="Back to Evalomics">×</Link></header>
    <section className="auth-shell auth-centered">
      <div className="auth-card auth-product-card">
        <div className="auth-card-heading"><p className="eyebrow">CREATE YOUR WORKSPACE</p><h1>Start with Evalomics</h1><p>Connect usage read-only, find opportunities, and verify changes before calling them savings.</p></div>
        <button type="button" className="google-button" onClick={google} disabled={googlePending}><GoogleMark/><span>{googlePending?'Opening Google…':'Continue with Google'}</span></button>
        <div className="auth-divider"><span>or create with email</span></div>
        <form action={action}>
          <label>Your name<input name="name" type="text" autoComplete="name" placeholder="Your name" required /></label>
          <label>Work email<input name="email" type="email" autoComplete="email" placeholder="you@company.com" required /></label>
          <label>Password<input name="password" type="password" autoComplete="new-password" placeholder="12+ characters" minLength={12} required /></label>
          {(state?.error || oauthError) && <p className="form-error">{state?.error || oauthError}</p>}
          <button className="btn black full auth-submit" disabled={pending}>{pending ? 'Creating account…' : 'Create account with email'}</button>
        </form>
        <p className="auth-switch">Already have an account? <Link href="/auth/sign-in">Sign in</Link></p>
        <p className="auth-legal">By continuing, you agree to Evalomics’ Terms and Privacy Policy.</p>
      </div>
    </section>
  </main>;
}
