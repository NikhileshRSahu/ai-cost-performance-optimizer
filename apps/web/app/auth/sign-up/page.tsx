import Link from 'next/link';
import { googleOAuthReady } from '@/auth';
import { startGoogleSignUp } from '../google-actions';

function GoogleMark(){
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.4-.18-2.07H12v3.92h5.38a4.6 4.6 0 0 1-2 3.02v2.54h3.24c1.9-1.75 2.98-4.33 2.98-7.41Z"/><path fill="#34A853" d="M12 22c2.7 0 4.97-.9 6.62-2.36l-3.24-2.54c-.9.6-2.05.96-3.38.96-2.6 0-4.81-1.76-5.6-4.13H3.05v2.62A10 10 0 0 0 12 22Z"/><path fill="#FBBC05" d="M6.4 13.93A6.01 6.01 0 0 1 6.09 12c0-.67.12-1.32.31-1.93V7.45H3.05A10 10 0 0 0 2 12c0 1.62.39 3.15 1.05 4.55l3.35-2.62Z"/><path fill="#EA4335" d="M12 5.94c1.47 0 2.79.51 3.83 1.5l2.87-2.87A9.63 9.63 0 0 0 12 2a10 10 0 0 0-8.95 5.45l3.35 2.62c.79-2.37 3-4.13 5.6-4.13Z"/></svg>
}

export default function SignUpPage() {
  return <main className="auth-page auth-clean">
    <header className="simple-top"><Link href="/" className="logo"><span/>Evalomics</Link><Link href="/" className="auth-close" aria-label="Back to Evalomics">×</Link></header>
    <section className="auth-shell auth-centered">
      <div className="auth-card auth-product-card">
        <div className="auth-card-heading">
          <p className="eyebrow">CREATE YOUR WORKSPACE</p>
          <h1>Start with Evalomics</h1>
          <p>Connect usage read-only, find opportunities, and verify changes before calling them savings.</p>
        </div>
        <form action={startGoogleSignUp}>
          <button type="submit" className="google-button" disabled={!googleOAuthReady}>
            <GoogleMark/><span>Continue with Google</span>
          </button>
        </form>
        {!googleOAuthReady && <p className="form-error">Google sign-up is awaiting the production client secret.</p>}
        <p className="auth-switch">Already have an account? <Link href="/auth/sign-in">Sign in</Link></p>
        <p className="auth-legal">By continuing, you agree to Evalomics’ Terms and Privacy Policy.</p>
      </div>
    </section>
  </main>;
}
