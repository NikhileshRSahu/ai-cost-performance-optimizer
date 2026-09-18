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
    return <div className="min-h-screen bg-[#070a0f]">{children}</div>;
  }

  const headerClass = isHome
    ? 'sticky top-0 z-50 border-b border-white/[0.07] bg-[#050510]/90 text-white backdrop-blur-xl'
    : 'sticky top-0 z-50 border-b border-slate-200/80 bg-white/85 backdrop-blur-xl';

  const navClass = isHome
    ? 'hidden items-center gap-6 text-sm font-medium text-white/55 md:flex'
    : 'hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex';

  return (
    <>
      <div
        className={
          isHome
            ? 'bg-[#050510] px-4 py-2 text-center text-[11px] font-semibold text-violet-100/65'
            : 'bg-slate-950 px-4 py-2 text-center text-[11px] font-semibold text-white'
        }
      >
        Launch beta · Full workflow free · No credit card
      </div>
      <header className={headerClass}>
        <div className="mx-auto flex min-h-16 w-[min(1320px,calc(100%-2rem))] items-center justify-between gap-6">
          <Link
            className={
              isHome
                ? 'flex items-center gap-2.5 font-semibold tracking-[-0.02em] text-white no-underline'
                : 'flex items-center gap-2.5 font-semibold tracking-[-0.02em] text-slate-950 no-underline'
            }
            href="/"
            aria-label="Evalomics home"
          >
            <EvalomicsMark />
            <span>Evalomics</span>
          </Link>

          <nav className={navClass} aria-label="Public">
            <Link className="transition hover:text-current" href="/demo">
              Demo
            </Link>
            <Link className="transition hover:text-current" href="/pricing">
              Pricing
            </Link>
            <Link
              className={
                isHome
                  ? 'rounded-lg bg-white px-3.5 py-2 text-slate-950 transition hover:bg-violet-100'
                  : 'rounded-lg bg-slate-950 px-3.5 py-2 text-white transition hover:bg-slate-800'
              }
              href="/start"
            >
              Start free
            </Link>
          </nav>

          <details className="relative md:hidden">
            <summary
              className={
                isHome
                  ? 'cursor-pointer list-none rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm font-semibold text-white'
                  : 'cursor-pointer list-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800'
              }
            >
              Menu
            </summary>
            <nav className="absolute right-0 mt-2 grid min-w-48 gap-1 rounded-xl border border-slate-200 bg-white p-2 text-sm text-slate-800 shadow-xl">
              <Link className="rounded-lg px-3 py-2 hover:bg-slate-50" href="/demo">
                Demo
              </Link>
              <Link className="rounded-lg px-3 py-2 hover:bg-slate-50" href="/pricing">
                Pricing
              </Link>
              <Link className="rounded-lg bg-slate-950 px-3 py-2 text-white" href="/start">
                Start free
              </Link>
            </nav>
          </details>
        </div>
      </header>

      {isHome ? (
        <div className="min-h-[70vh]">{children}</div>
      ) : (
        <div className="mx-auto min-h-[70vh] w-[min(1320px,calc(100%-2rem))] py-8 md:py-12">
          {children}
        </div>
      )}

      <footer
        className={
          isHome
            ? 'border-t border-white/[0.07] bg-[#050510] text-white'
            : 'border-t border-slate-200 bg-white'
        }
      >
        <div
          className={
            isHome
              ? 'mx-auto flex w-[min(1320px,calc(100%-2rem))] flex-col justify-between gap-6 py-8 text-sm text-white/42 md:flex-row md:items-center'
              : 'mx-auto flex w-[min(1320px,calc(100%-2rem))] flex-col justify-between gap-6 py-8 text-sm text-slate-500 md:flex-row md:items-center'
          }
        >
          <div className="grid gap-1">
            <strong className={isHome ? 'text-white' : 'text-slate-900'}>Evalomics</strong>
            <span>AI Efficiency Intelligence · Evidence before claims</span>
          </div>
          <nav className="flex flex-wrap gap-5" aria-label="Trust and legal">
            <Link href="/privacy">Privacy</Link>
            <Link href="/security">Security</Link>
            <Link href="/terms">Terms</Link>
          </nav>
        </div>
      </footer>
    </>
  );
}
