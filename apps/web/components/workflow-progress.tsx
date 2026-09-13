import Link from 'next/link';

const steps = [
  { id: 'import', label: 'Import' },
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
    <nav className="workflow-progress" aria-label="Optimization journey">
      <ol>
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
              <span className="workflow-index" aria-hidden="true">
                {state === 'complete' ? '✓' : index + 1}
              </span>
              <Link
                href={href}
                aria-current={state === 'current' ? 'step' : undefined}
              >
                {step.label}
              </Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
