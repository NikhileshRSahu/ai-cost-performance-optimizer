import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowLeft,
  Check,
  Database,
  LockKeyhole,
  ScanLine,
  ShieldCheck,
} from 'lucide-react';
import { GoogleSignInButton } from '../../components/google-sign-in-button';
import { hasNeonAuthConfiguration } from '../../lib/neon-auth';

export const metadata: Metadata = {
  title: 'Sign in | Evalomics',
  description:
    'Create your Evalomics workspace with Google and start with evidence you already own.',
};

export default function LoginPage() {
  const configured = hasNeonAuthConfiguration();

  return (
    <div className="grid min-h-[680px] overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_30px_100px_rgba(15,23,42,.08)] lg:grid-cols-[.92fr_1.08fr]">
      <section className="flex flex-col justify-between p-7 sm:p-10 lg:p-12">
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 no-underline transition hover:text-slate-900"
          >
            <ArrowLeft className="size-3.5" /> Back to Evalomics
          </Link>
          <div className="mt-14">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700">
              Private self-serve workspace
            </p>
            <h1
              id="login-title"
              className="mt-4 !text-[clamp(3rem,6vw,5.5rem)] !leading-[.92] !tracking-[-.065em] text-slate-950"
            >
              Start your
              <span className="block text-slate-400">AI Work MRI.</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-slate-500">
              Sign in with Google to create a private Evalomics workspace. Start
              with a CSV; no provider connection or prompt content is required.
            </p>
          </div>

          <div className="mt-8 max-w-md">
            {configured ? (
              <GoogleSignInButton />
            ) : (
              <section
                className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900"
                role="status"
              >
                <strong>Sign-in is not configured on this deployment.</strong>{' '}
                Public calculators and methodology pages remain available.
              </section>
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

      <section className="relative overflow-hidden bg-[#070b11] p-7 text-white sm:p-10 lg:p-12">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_12%,rgba(16,185,129,.15),transparent_34%),radial-gradient(circle_at_15%_90%,rgba(59,130,246,.12),transparent_40%)]" />
        <div className="relative flex h-full flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/30">
              <ScanLine className="size-3.5" />
              What happens after sign-in
            </div>
            <div className="mt-8 grid gap-3">
              {[
                {
                  icon: LockKeyhole,
                  title: 'Private workspace',
                  body: 'Your identity is mapped to an Evalomics organization with tenant-scoped authorization.',
                },
                {
                  icon: Database,
                  title: 'Evidence stays explicit',
                  body: 'Usage, costs, benchmark inputs, and proof states keep their source and provenance.',
                },
                {
                  icon: ShieldCheck,
                  title: 'Verification is earned',
                  body: 'Potential and tested amounts are never relabeled as verified production savings.',
                },
              ].map(({ icon: Icon, title, body }, index) => (
                <article
                  key={title}
                  className="grid grid-cols-[36px_1fr] gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.035] p-4"
                >
                  <div className="grid size-9 place-items-center rounded-xl border border-white/[0.08] bg-white/[0.04] text-white/55">
                    <Icon className="size-4" />
                  </div>
                  <div>
                    <span className="font-mono text-[9px] text-blue-300/50">
                      0{index + 1}
                    </span>
                    <p className="m-0 mt-1 text-sm font-semibold text-white/85">
                      {title}
                    </p>
                    <p className="m-0 mt-1.5 text-xs leading-5 text-white/35">
                      {body}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="mt-12 rounded-2xl border border-emerald-300/12 bg-emerald-300/[0.05] p-4">
            <p className="m-0 text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-200/50">
              Trust boundary
            </p>
            <p className="m-0 mt-2 text-xs leading-5 text-emerald-50/45">
              Google sign-in authenticates you. Deeper AI-provider or workspace
              access is separate and must be explicitly authorized later.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
