'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { EvalomicsMark } from './evalomics-mark';

export function SiteChrome({ children }: Readonly<{ children: ReactNode }>) {
  const pathname = usePathname();
  const isWorkbench = pathname.startsWith('/o/');
  const isHome = pathname === '/';

  if (isWorkbench) {
    return <div className="min-h-screen bg-[var(--eval-bg)]">{children}</div>;
  }

  if (isHome) {
    return <div className="min-h-screen bg-[#060708]">{children}</div>;
  }

  const publicLinks = [
    { href: '/demo', label: 'Demo' },
    { href: '/pricing', label: 'Pricing' },
    { href: '/methodology', label: 'Methodology' },
  ] as const;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_70%_0%,rgba(240,163,91,.08),transparent_28%),var(--eval-bg)] text-white">
      <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#050708]/88 px-3 py-3 backdrop-blur-xl">
        <div className="mx-auto flex min-h-12 w-[min(1180px,100%)] items-center justify-between gap-5">
          <Link
            className="flex items-center gap-2.5 font-semibold tracking-[-0.025em] text-white no-underline"
            href="/"
            aria-label="Evalomics home"
          >
            <EvalomicsMark size={28} />
            <span>Evalomics</span>
          </Link>

          <nav
            className="hidden items-center gap-1 rounded-xl border border-white/[0.06] bg-white/[0.02] p-1 text-sm font-medium text-white/48 lg:flex"
            aria-label="Public"
          >
            {publicLinks.map((link) => (
              <Link
                key={link.href}
                className="rounded-lg px-3 py-2 transition hover:bg-white/[0.045] hover:text-white"
                href={link.href}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-2 md:flex">
            <Link
              className="rounded-lg px-3 py-2 text-sm font-semibold text-white/48 transition hover:text-white"
              href="/login"
            >
              Sign in
            </Link>
            <Link
              className="rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-[#071018] shadow-[0_8px_26px_rgba(255,255,255,.06)] transition hover:-translate-y-0.5"
              href="/start"
            >
              Start free
            </Link>
          </div>

          <details className="relative md:hidden">
            <summary className="cursor-pointer list-none rounded-xl border border-white/[0.09] bg-white/[0.04] px-3 py-2 text-sm font-semibold text-white">
              Menu
            </summary>
            <nav
              className="absolute right-0 mt-2 grid min-w-52 gap-1 rounded-2xl border border-white/[0.10] bg-[#0b1017]/98 p-2 text-sm text-white shadow-2xl backdrop-blur-xl"
              aria-label="Mobile public navigation"
            >
              {publicLinks.map((link) => (
                <Link
                  key={link.href}
                  className="rounded-lg px-3 py-2.5 text-white/62 hover:bg-white/[0.05] hover:text-white"
                  href={link.href}
                >
                  {link.label}
                </Link>
              ))}
              <Link
                className="rounded-lg px-3 py-2.5 text-white/62 hover:bg-white/[0.05] hover:text-white"
                href="/login"
              >
                Sign in
              </Link>
              <Link
                className="mt-1 rounded-xl bg-white px-3 py-2.5 text-center font-semibold text-[#071018]"
                href="/start"
              >
                Start free
              </Link>
            </nav>
          </details>
        </div>
      </header>

      <div className="mx-auto min-h-[70vh] w-[min(1180px,calc(100%-2rem))] py-8 md:py-12">
        {children}
      </div>

      <footer className="border-t border-white/[0.06] bg-[#050708] text-white">
        <div className="mx-auto grid w-[min(1180px,calc(100%-2rem))] gap-8 py-10 text-sm text-white/38 md:grid-cols-[1fr_auto] md:items-end">
          <div className="max-w-md">
            <div className="flex items-center gap-2.5">
              <EvalomicsMark size={26} />
              <strong className="text-white">Evalomics</strong>
            </div>
            <p className="m-0 mt-3 leading-6">
              AI Efficiency Intelligence that keeps observed, potential, tested,
              and verified outcomes visibly separate.
            </p>
          </div>
          <nav className="flex flex-wrap gap-x-5 gap-y-2" aria-label="Trust and legal">
            <Link href="/methodology">Methodology</Link>
            <Link href="/privacy">Privacy</Link>
            <Link href="/security">Security</Link>
            <Link href="/terms">Terms</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
