import Link from 'next/link';
import { Check, Circle } from 'lucide-react';

const steps = [
  { id: 'import', label: 'Data' },
  { id: 'workloads', label: 'Safety' },
  { id: 'benchmark', label: 'Test' },
  { id: 'implement', label: 'Apply' },
  { id: 'verify', label: 'Verify' },
] as const;

export type WorkflowStep = (typeof steps)[number]['id'];

export function WorkflowProgress({
  organizationId,
  current,
}: Readonly<{ organizationId: string; current: WorkflowStep }>) {
  const currentIndex = steps.findIndex((step) => step.id === current);

  return (
    <nav
      className="overflow-x-auto rounded-2xl border border-white/[0.07] bg-white/[0.025] p-2"
      aria-label="Optimization journey"
    >
      <ol className="grid min-w-[680px] grid-cols-5 gap-1">
        {steps.map((step, index) => {
          const state =
            index < currentIndex
              ? 'complete'
              : index === currentIndex
                ? 'current'
                : 'upcoming';
          const requiresRecommendation =
            step.id === 'implement' || step.id === 'verify';
          const href = requiresRecommendation
            ? null
            : `/o/${organizationId}/${step.id}`;
          const content = (
            <>
              <span
                className={
                  'grid size-5 shrink-0 place-items-center rounded-full border ' +
                  (state === 'complete'
                    ? 'border-emerald-300/25 bg-emerald-300/10'
                    : state === 'current'
                      ? 'border-white/25 bg-white/[0.08]'
                      : 'border-white/10')
                }
                aria-hidden="true"
              >
                {state === 'complete' ? (
                  <Check className="size-3" />
                ) : (
                  <Circle className="size-2" />
                )}
              </span>
              {step.label}
            </>
          );
          const className =
            'flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold no-underline transition ' +
            (state === 'current'
              ? 'bg-white/[0.085] text-white'
              : state === 'complete'
                ? 'text-emerald-200/70 hover:bg-white/[0.04]'
                : requiresRecommendation
                  ? 'cursor-default text-white/32'
                  : 'text-white/70 hover:bg-white/[0.04] hover:text-white/90');

          return (
            <li key={step.id} data-state={state}>
              {href === null ? (
                <span
                  className={className}
                  aria-current={state === 'current' ? 'step' : undefined}
                  title="Available after you choose a tested recommendation"
                >
                  {content}
                </span>
              ) : (
                <Link
                  href={href}
                  aria-current={state === 'current' ? 'step' : undefined}
                  className={className}
                >
                  {content}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
