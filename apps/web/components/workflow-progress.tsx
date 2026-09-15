import Link from 'next/link';
import { Check, Circle } from 'lucide-react';

const steps = [
  { id: 'import', label: 'Evidence' },
  { id: 'workloads', label: 'Constraints' },
  { id: 'benchmark', label: 'Benchmark' },
  { id: 'implement', label: 'Implement' },
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
          const href =
            step.id === 'implement' || step.id === 'verify'
              ? `/o/${organizationId}`
              : `/o/${organizationId}/${step.id}`;

          return (
            <li key={step.id} data-state={state}>
              <Link
                href={href}
                aria-current={state === 'current' ? 'step' : undefined}
                className={
                  'flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold no-underline transition ' +
                  (state === 'current'
                    ? 'bg-white/[0.085] text-white'
                    : state === 'complete'
                      ? 'text-emerald-200/70 hover:bg-white/[0.04]'
                      : 'text-white/30 hover:bg-white/[0.04] hover:text-white/55')
                }
              >
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
              </Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
