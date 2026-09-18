import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../../lib/utils';

export type EvidenceState = 'OBSERVED' | 'POTENTIAL' | 'TESTED' | 'VERIFIED';

const stateClasses: Record<EvidenceState, string> = {
  OBSERVED: 'evidence-badge evidence-badge--observed',
  POTENTIAL: 'evidence-badge evidence-badge--potential',
  TESTED: 'evidence-badge evidence-badge--tested',
  VERIFIED: 'evidence-badge evidence-badge--verified',
};

const defaultLabels: Record<EvidenceState, string> = {
  OBSERVED: 'Observed',
  POTENTIAL: 'Potential',
  TESTED: 'Tested',
  VERIFIED: 'Verified',
};

export function EvidenceBadge({
  state,
  label,
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement> &
  Readonly<{ state: EvidenceState; label?: ReactNode }>) {
  return (
    <span className={cn(stateClasses[state], className)} {...props}>
      {label ?? defaultLabels[state]}
    </span>
  );
}
