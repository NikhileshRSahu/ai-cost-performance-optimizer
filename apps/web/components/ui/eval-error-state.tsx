import type { ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

export function EvalErrorState({
  title,
  detail,
  action,
}: Readonly<{
  title: ReactNode;
  detail?: ReactNode;
  action?: ReactNode;
}>) {
  return (
    <div
      role="alert"
      className="rounded-[14px] border border-rose-300/20 bg-rose-300/[0.06] p-4 text-rose-50"
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 size-4 shrink-0 text-rose-200/80" aria-hidden="true" />
        <div>
          <div className="text-sm font-semibold">{title}</div>
          {detail ? (
            <div className="mt-1 text-xs leading-5 text-rose-50/65">{detail}</div>
          ) : null}
          {action ? <div className="mt-3">{action}</div> : null}
        </div>
      </div>
    </div>
  );
}
