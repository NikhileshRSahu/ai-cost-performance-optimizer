'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, type ReactNode } from 'react';
import {
  ArrowLeftRight,
  BookOpen,
  FileInput,
  LineChart,
  LayoutDashboard,
  Menu,
  Settings2,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react';
import { EvalomicsMark } from '../evalomics-mark';
import { EvalomicsCopilot } from './evalomics-copilot';
import { cn } from '../../lib/utils';

const primaryNavigation = [
  { slug: '', label: 'Overview', icon: LayoutDashboard },
  { slug: '/import', label: 'Usage', icon: FileInput },
  { slug: '/recommendations', label: 'Optimization', icon: Sparkles },
  { slug: '/proof', label: 'Results', icon: LineChart },
] as const;

const utilityNavigation = [
  { slug: '/prompts', label: 'Prompt evaluation', icon: BookOpen },
  { slug: '/calculator', label: 'Model evaluation', icon: ArrowLeftRight },
  { slug: '/settings', label: 'Settings', icon: Settings2 },
] as const;

function NavLinks({
  organizationId,
  onNavigate,
}: Readonly<{ organizationId: string; onNavigate?: () => void }>) {
  const pathname = usePathname();
  const base = `/o/${organizationId}`;
  const utilityActive = utilityNavigation.some(({ slug }) =>
    pathname.startsWith(base + slug),
  );

  function linkClass(href: string): string {
    const active =
      href === base
        ? pathname === href
        : pathname === href || pathname.startsWith(href + '/');

    return cn(
      'group flex min-h-10 items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium no-underline transition-[background,color] duration-200',
      active
        ? 'bg-white/[0.055] text-white shadow-[inset_2px_0_#60a5fa]'
        : 'text-white/45 hover:bg-white/[0.035] hover:text-white/78',
    );
  }

  return (
    <>
      <div className="grid gap-1">
        {primaryNavigation.map(({ slug, label, icon: Icon }) => {
          const href = base + slug;
          return (
            <Link
              key={label}
              href={href}
              onClick={onNavigate}
              className={linkClass(href)}
            >
              <Icon className="size-4" strokeWidth={1.8} aria-hidden="true" />
              <span>{label}</span>

            </Link>
          );
        })}
      </div>

      <details
        className="mt-5 border-t border-white/[0.06] pt-4"
        open={utilityActive}
      >
        <summary className="cursor-pointer list-none px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
          Tools
        </summary>
        <div className="mt-2 grid gap-1">
          {utilityNavigation.map(({ slug, label, icon: Icon }) => {
            const href = base + slug;
            return (
              <Link
                key={label}
                href={href}
                onClick={onNavigate}
                className={linkClass(href)}
              >
                <Icon className="size-4" strokeWidth={1.8} aria-hidden="true" />
                <span>{label}</span>
              </Link>
            );
          })}
        </div>
      </details>
    </>
  );
}

export function WorkbenchShell({
  organizationId,
  organizationName,
  role,
  children,
}: Readonly<{
  organizationId: string;
  organizationName: string;
  role: string;
  children: ReactNode;
}>) {
  const [open, setOpen] = useState(false);

  return (
    <div className="org-workbench min-h-screen bg-[#090b0e] text-white">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-56 border-r border-white/[0.06] bg-[#0c0f13] px-3 py-5 lg:flex lg:flex-col">
        <div className="mb-10 flex items-center gap-3 px-2">
          <span className="grid size-7 place-items-center rounded-md bg-blue-400 text-[#071018]">
            <EvalomicsMark />
          </span>
          <div>
            <p className="m-0 text-sm font-semibold tracking-[-0.02em] text-slate-100">
              Evalomics
            </p>
            <p className="m-0 mt-0.5 text-[11px] text-slate-500">
              AI cost intelligence
            </p>
          </div>
        </div>



        <nav
          className="flex-1 overflow-y-auto"
          aria-label="Evalomics workspace"
        >
          <NavLinks organizationId={organizationId} />
        </nav>

        <div className="rounded-lg border border-white/[0.06] bg-white/[0.018] p-3">
          <p className="truncate text-xs font-medium text-slate-300">
            {organizationName}
          </p>
          <p className="mt-1 text-[10px] text-slate-500">{role} workspace</p>
        </div>
      </aside>

      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-white/[0.06] bg-[#0c0f13]/94 px-4 backdrop-blur-xl lg:hidden">
        <Link
          href="/"
          className="flex items-center gap-2 font-semibold no-underline"
        >
          <EvalomicsMark />
          Evalomics
        </Link>
        <button
          type="button"
          aria-label={
            open ? 'Close workspace navigation' : 'Open workspace navigation'
          }
          aria-expanded={open}
          onClick={() => {
            setOpen((value) => !value);
          }}
          className="grid size-9 place-items-center rounded-lg border border-white/10 bg-white/[0.04] text-white"
        >
          {open ? <X className="size-4" /> : <Menu className="size-4" />}
        </button>
      </header>

      {open ? (
        <div
          className="fixed inset-0 z-20 bg-black/55 lg:hidden"
          onClick={() => {
            setOpen(false);
          }}
        >
          <aside
            className="absolute left-0 top-14 h-[calc(100%-3.5rem)] w-[min(86vw,300px)] border-r border-white/10 bg-[#0c0f13] p-4"
            onClick={(event) => {
              event.stopPropagation();
            }}
          >
            <div className="mb-5">
              <p className="truncate text-sm font-semibold">
                {organizationName}
              </p>
              <p className="mt-1 text-xs text-white/34">{role} workspace</p>
            </div>
            <nav aria-label="Evalomics workspace mobile">
              <NavLinks
                organizationId={organizationId}
                onNavigate={() => {
                  setOpen(false);
                }}
              />
            </nav>
          </aside>
        </div>
      ) : null}

      <div className="lg:pl-56">
        <div className="mx-auto w-full max-w-[1500px] px-4 py-5 sm:px-6 lg:px-7 lg:py-6">
          {children}
        </div>
      </div>
      <EvalomicsCopilot organizationId={organizationId} />
    </div>
  );
}
