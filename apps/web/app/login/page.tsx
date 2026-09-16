import type { Metadata } from 'next';
import Link from 'next/link';
import { headers } from 'next/headers';
import { ArrowLeft, Check, ShieldCheck } from 'lucide-react';
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
    <div className="mx-auto grid min-h-[640px] max-w-5xl overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_30px_100px_rgba(15,23,42,.08)] lg:grid-cols-[1fr_.9fr]">
      <section className="flex flex-col justify-between p-7 sm:p-10 lg:p-12">
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 no-underline hover:text-slate-900"
          >
            <ArrowLeft className="size-3.5" /> Back to Evalomics
          </Link>
          <div className="mt-16 max-w-xl">
            <p className="m-0 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700">
              Private workspace
            </p>
            <h1 className="mt-4 text-[clamp(3rem,6vw,5.3rem)] font-semibold leading-[.92] tracking-[-.065em] text-slate-950">
              Start with real evidence.
            </h1>
            <p className="mt-6 text-base leading-7 text-slate-500">
              Sign in, create your workspace, and upload one usage window.
              Evalomics will diagnose the strongest supported optimization
              before asking you to test a change.
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
                <span className="block mt-1">
                  Use the production domain for authentication while
                  preview-domain trust is being corrected.
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="mt-12 flex flex-wrap gap-x-5 gap-y-2 text-[11px] font-medium text-slate-400">
          <span className="inline-flex items-center gap-1.5">
            <Check className="size-3" /> CSV-first
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Check className="size-3" /> No prompt content required
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Check className="size-3" /> No invented savings
          </span>
        </div>
      </section>

      <section className="relative flex items-center bg-[#070a0f] p-7 text-white sm:p-10 lg:p-12">
        <div>
          <ShieldCheck className="size-5 text-emerald-200/70" />
          <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/30">
            After sign-in
          </p>
          <div className="mt-6 grid gap-5">
            {[
              [
                '01',
                'Import',
                'Upload a usage CSV or connect supported evidence.',
              ],
              [
                '02',
                'Diagnose',
                'Evalomics ranks waste patterns without inventing savings.',
              ],
              [
                '03',
                'Test',
                'Benchmark one candidate against your quality floor.',
              ],
              [
                '04',
                'Verify',
                'Only production evidence can unlock Verified savings.',
              ],
            ].map(([n, title, body]) => (
              <div
                key={title}
                className="grid grid-cols-[36px_1fr] gap-3 border-b border-white/[0.07] pb-5 last:border-0"
              >
                <span className="font-mono text-[10px] text-blue-300/45">
                  {n}
                </span>
                <div>
                  <p className="m-0 text-sm font-semibold text-white/85">
                    {title}
                  </p>
                  <p className="m-0 mt-1 text-xs leading-5 text-white/40">
                    {body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
