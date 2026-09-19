import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { PromptEvaluationWorkbench } from '../../../../components/workbench/prompt-evaluation-workbench';

export default async function PromptOptimizerPage({
  params,
}: Readonly<{ params: Promise<{ organizationId: string }> }>) {
  const { organizationId } = await params;

  return (
    <div className="space-y-7">
      <section>
        <p className="m-0 font-mono text-[10px] uppercase tracking-[0.14em] text-white/30">
          Prompt evaluation
        </p>
        <h1 className="m-0 mt-2 text-3xl font-semibold tracking-[-0.045em] text-white">
          Can this prompt be cheaper without hurting quality?
        </h1>
        <p className="m-0 mt-2 max-w-2xl text-sm leading-6 text-white/42">
          Paste the prompt. Evalomics will show where tokens are being wasted,
          draft a leaner version, and tell you what still needs quality testing
          before you use it.
        </p>
      </section>

      <PromptEvaluationWorkbench />

      <Link
        href={'/o/' + organizationId + '/recommendations'}
        className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.025] px-3.5 py-2 text-xs font-semibold text-white/60 no-underline transition hover:text-white"
      >
        <ArrowLeft className="size-3.5" /> Back to optimization
      </Link>
    </div>
  );
}
