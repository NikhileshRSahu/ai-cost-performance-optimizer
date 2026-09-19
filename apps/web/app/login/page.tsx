import type { Metadata } from 'next';
import Link from 'next/link';
import { headers } from 'next/headers';
import { ArrowLeft, Check } from 'lucide-react';
import { LoginProductMotion } from '../../components/marketing/login-product-motion';
import { GoogleSignInButton } from '../../components/google-sign-in-button';
import { hasSelfHostedAuthConfiguration } from '../../lib/auth-config';

export const metadata: Metadata = {
  title: 'Sign in | Evalomics',
  description:
    'Create your Evalomics workspace and start with real usage evidence.',
};

function authHostAllowed(host: string | null): boolean {
  const vercelEnvironment = process.env.VERCEL_ENV?.toLowerCase();

  if (vercelEnvironment === 'production') return true;
  if (vercelEnvironment === 'preview') return false;

  if (host === null) return false;
  const normalized = host.split(':')[0]?.toLowerCase() ?? '';
  return (
    normalized === 'evalomics.vercel.app' ||
    normalized === 'evalomics-evalomics.vercel.app' ||
    normalized === 'localhost' ||
    normalized === '127.0.0.1'
  );
}

export default async function LoginPage({
  searchParams,
}: Readonly<{
  searchParams: Promise<{ returnTo?: string }>;
}>) {
  const { returnTo } = await searchParams;
  const callbackPath =
    typeof returnTo === 'string' &&
    returnTo.startsWith('/') &&
    !returnTo.startsWith('//')
      ? returnTo
      : '/start';
  const requestHeaders = await headers();
  const host = requestHeaders.get('host');
  const authConfigured = hasSelfHostedAuthConfiguration();
  const canSignIn = authConfigured && authHostAllowed(host);

  return (
    <div className="eval-glass-panel relative mx-auto grid min-h-[620px] max-w-5xl overflow-hidden rounded-[28px] text-white lg:grid-cols-[1fr_.9fr]">
      <section className="flex flex-col justify-between p-7 sm:p-10 lg:p-12">
        <div>
          <Link
            href="/start"
            className="inline-flex items-center gap-2 text-xs font-semibold text-white/42 no-underline hover:text-white"
          >
            <ArrowLeft className="size-3.5" /> Back to your chosen flow
          </Link>

          <div className="mt-14 max-w-xl">
            <p className="m-0 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-300/75">
              Private workspace
            </p>
            <h1 className="mt-4 text-[clamp(3rem,6vw,5.2rem)] font-semibold leading-[.92] tracking-[-.065em] text-white">
              Give us usage. Get one answer.
            </h1>
            <p className="mt-6 text-base leading-7 text-white/42">
              You already chose what you want to do. Sign in only to create the
              private workspace for OpenAI, Anthropic, CSV, or demo evidence.
            </p>
          </div>

          <div className="mt-9 max-w-md">
            {canSignIn ? (
              <GoogleSignInButton callbackPath={callbackPath} />
            ) : (
              <div
                className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900"
                role="status"
              >
                <strong>
                  Google sign-in is disabled on this preview host.
                </strong>
                <span className="mt-1 block">
                  Use the production domain for authentication while
                  preview-domain trust is being corrected.
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="mt-12 flex flex-wrap gap-x-5 gap-y-2 text-[11px] font-medium text-white/42">
          {[
            'Full beta · free',
            'No credit card',
            'No prompt content required for supported aggregate-data paths',
            'No invented savings',
          ].map((item) => (
            <span key={item} className="inline-flex items-center gap-1.5">
              <Check className="size-3" /> {item}
            </span>
          ))}
        </div>
      </section>

      <section className="relative flex items-center border-l border-white/[0.06] bg-[radial-gradient(circle_at_50%_15%,rgba(249,115,22,.18),transparent_40%),rgba(5,7,8,.46)] p-7 text-white backdrop-blur-2xl sm:p-10 lg:p-12">
        <div className="w-full">
          <LoginProductMotion />
        </div>
      </section>
    </div>
  );
}
