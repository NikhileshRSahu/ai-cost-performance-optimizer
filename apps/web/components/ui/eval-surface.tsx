import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../../lib/utils';

type EvalSurfaceTone = 'default' | 'raised' | 'subtle' | 'amber' | 'verified';

const toneClasses: Record<EvalSurfaceTone, string> = {
  default: 'eval-surface',
  raised: 'eval-surface eval-surface--raised',
  subtle: 'eval-surface eval-surface--subtle',
  amber: 'eval-surface eval-surface--amber',
  verified: 'eval-surface eval-surface--verified',
};

export function EvalSurface({
  tone = 'default',
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement> & Readonly<{ tone?: EvalSurfaceTone; children: ReactNode }>) {
  return (
    <div className={cn(toneClasses[tone], className)} {...props}>
      {children}
    </div>
  );
}
