import type { Metadata } from 'next';
import Link from 'next/link';
import { GoogleSignInButton } from '../../components/google-sign-in-button';
import { hasGoogleAuthConfiguration } from '../../lib/auth';

export const metadata: Metadata = {
  title: 'Sign in | Proovance',
  description:
    'Create your Proovance workspace with Google and start with evidence you already own.',
};

export default function LoginPage() {
  const configured = hasGoogleAuthConfiguration();

  return (
    <div className="landing-stack">
      <section className="hero auth-hero" aria-labelledby="login-title">
        <p className="eyebrow">Proovance · Self-serve beta</p>
        <h1 id="login-title">Start your AI Work MRI.</h1>
        <p className="lede">
          Sign in with Google to create a private workspace. You can start
          without connecting a provider account or sharing prompt content.
        </p>
        {configured ? (
          <GoogleSignInButton />
        ) : (
          <section className="evidence-note" role="status">
            <strong>Google sign-in is not configured on this deployment.</strong>{' '}
            The product can still be evaluated through its public tools and
            research pages.
          </section>
        )}
        <div className="hero-actions">
          <Link href="/tools/llm-cost-calculator">
            Try the free LLM cost calculator
          </Link>
          <Link href="/methodology">Read the evidence methodology</Link>
        </div>
      </section>
    </div>
  );
}
