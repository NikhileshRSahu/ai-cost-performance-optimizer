import Link from 'next/link';
import {
  ArrowRight,
  Database,
  FileText,
  PlayCircle,
  Sparkles,
} from 'lucide-react';

type SourceKind = 'OPENAI' | 'ANTHROPIC' | 'CSV' | 'DEMO';

const icons = {
  OPENAI: Database,
  ANTHROPIC: Sparkles,
  CSV: FileText,
  DEMO: PlayCircle,
} as const;

export function SourceChoiceCard({
  kind,
  title,
  description,
  meta,
  href,
  actionLabel,
}: Readonly<{
  kind: SourceKind;
  title: string;
  description: string;
  meta: string;
  href: string;
  actionLabel: string;
}>) {
  const Icon = icons[kind];

  return (
    <Link
      href={href}
      className="group flex min-h-56 flex-col rounded-[22px] border border-white/[0.08] bg-[#0a0f16] p-5 no-underline transition duration-200 hover:-translate-y-0.5 hover:border-white/[0.15] hover:bg-[#0d131b]"
    >
      <div className="flex items-start justify-between gap-4">
        <span className="grid size-10 place-items-center rounded-xl border border-white/[0.08] bg-white/[0.035]">
          <Icon className="size-4 text-blue-200/80" aria-hidden="true" />
        </span>
        <ArrowRight
          className="size-4 text-white/28 transition group-hover:translate-x-0.5 group-hover:text-white/65"
          aria-hidden="true"
        />
      </div>
      <h2 className="m-0 mt-5 text-xl font-semibold tracking-[-0.03em] text-white">
        {title}
      </h2>
      <p className="m-0 mt-2 text-sm leading-6 text-white/48">{description}</p>
      <div className="mt-auto pt-5">
        <p className="m-0 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/32">
          {meta}
        </p>
        <p className="m-0 mt-2 text-xs font-semibold text-blue-100/75">
          {actionLabel}
        </p>
      </div>
    </Link>
  );
}
