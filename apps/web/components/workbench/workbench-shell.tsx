'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, type ReactNode } from 'react';
import {
  ArrowLeftRight,
  BookOpen,
  FileInput,
  LayoutDashboard,
  Menu,
  Settings2,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react';
import { EvalomicsMark } from '../evalomics-mark';
import { cn } from '../../lib/utils';

const primaryNavigation = [
  { slug: '', label: 'Overview', icon: LayoutDashboard },
  { slug: '/import', label: 'Usage', icon: FileInput },
  { slug: '/recommendations', label: 'Recommendations', icon: Sparkles },
  { slug: '/proof', label: 'Proof', icon: ShieldCheck },
] as const;

const utilityNavigation = [
  { slug: '/prompts', label: 'Prompt Optimizer', icon: BookOpen },
  { slug: '/calculator', label: 'Model Calculator', icon: ArrowLeftRight },
  { slug: '/settings', label: 'Settings', icon: Settings2 },
] as const;

function NavLinks({
  organizationId,
  onNavigate,
}: Readonly<{ organizationId: string; onNavigate?: () => void }>) {
  const pathname = usePathname();
  const base = `/o/${organizationId}`;

  function linkClass(href: string): string {
    const active =
      href === base
        ? pathname === href
        : pathname === href || pathname.startsWith(href + '/');

    return cn(
      'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium no-underline transition-[background,color,transform] duration-200 hover:translate-x-0.5',
      active
        ? 'bg-sky-400/10 text-sky-200 shadow-[inset_2px_0_#38bdf8]'
        : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-100',
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
              {label === 'Recommendations' ? (
                <span className="ml-auto rounded-full bg-emerald-400/10 px-2 py-0.5 font-mono text-[9px] text-emerald-300">
                  savings
                </span>
              ) : null}
            </Link>
          );
        })}
      </div>

      <details className="mt-5 border-t border-white/[0.06] pt-4">
        <summary className="cursor-pointer list-none px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
          Tools & settings
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
    <div className="org-workbench min-h-screen bg-[#08101c] text-white">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-white/[0.07] bg-[#0d1420] px-4 py-5 lg:flex lg:flex-col">
        <div className="mb-9 flex items-start gap-3 px-2">
          <span className="mt-0.5 grid size-8 place-items-center rounded-lg bg-sky-400 text-[#08101c] shadow-[0_0_24px_rgba(56,189,248,.22)]">
            <EvalomicsMark />
          </span>
          <div>
            <p className="m-0 text-sm font-semibold tracking-[-0.02em] text-slate-100">
              Evalomics
            </p>
            <p className="m-0 mt-0.5 text-[11px] text-slate-500">
              AI efficiency intelligence
            </p>
          </div>
        </div>

        <div className="mb-3 flex items-center justify-between px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600">
          <span>Workspace</span>
          <span className="font-mono normal-case tracking-normal text-slate-500">
            {role.toLowerCase()}
          </span>
        </div>

        <nav
          className="flex-1 overflow-y-auto"
          aria-label="Evalomics workspace"
        >
          <NavLinks organizationId={organizationId} />
        </nav>

        <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-3">
          <p className="truncate text-xs font-medium text-slate-300">
            {organizationName}
          </p>
          <p className="mt-1 text-[10px] text-slate-500">{role} workspace</p>
        </div>
      </aside>

      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-white/[0.07] bg-[#0d1420]/92 px-4 backdrop-blur-xl lg:hidden">
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
            className="absolute left-0 top-14 h-[calc(100%-3.5rem)] w-[min(86vw,300px)] border-r border-white/10 bg-[#0d1420] p-4"
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

      <div className="lg:pl-64">
        <div className="mx-auto w-full max-w-[1440px] px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </div>
      </div>
    </div>
  );
}
