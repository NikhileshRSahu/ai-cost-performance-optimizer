import Link from 'next/link';
import { ArrowRight, CheckCircle2, ShieldCheck } from 'lucide-react';
import { HeroIntelligence } from '../components/marketing/hero-intelligence';

export default function HomePage() {
  return (
    <div className="grid gap-14 pb-8 md:gap-18">
      <section className="relative overflow-hidden rounded-[32px] border border-slate-800 bg-[#070a0f] px-6 py-8 text-white shadow-[0_40px_120px_rgba(2,6,23,.18)] sm:px-8 sm:py-10 lg:px-10">
        <div className="grid gap-9 lg:grid-cols-[.92fr_1.08fr] lg:items-center">
          <div className="relative z-10 py-4 lg:py-8">
            <p className="m-0 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-300/70">AI Efficiency Intelligence</p>
            <h1 className="mt-5 max-w-[8ch] text-[clamp(3.4rem,7vw,6.7rem)] font-semibold leading-[.88] tracking-[-.075em] text-white">
              Find AI waste.<span className="block text-white/58">Prove the fix.</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-white/62">
              Connect OpenAI or Anthropic, or upload a CSV. Evalomics analyzes the evidence, rejects unsupported guesses, and returns the strongest action it can support.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/start" className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-950 no-underline transition hover:-translate-y-0.5 hover:bg-emerald-100">
                Analyze my AI usage <ArrowRight className="size-4" />
              </Link>
              <Link href="/demo" className="inline-flex min-h-12 items-center rounded-xl border border-white/15 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-white no-underline transition hover:bg-white/[0.08]">
                Try the live demo
              </Link>
            </div>
            <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-[11px] text-white/52">
              {['Free during beta','No credit card','No invented savings'].map((item)=>(
                <span key={item} className="inline-flex items-center gap-1.5"><CheckCircle2 className="size-3 text-emerald-200/70" />{item}</span>
              ))}
            </div>
          </div>
          <HeroIntelligence />
        </div>
      </section>

      <section className="grid gap-7">
        <div className="grid gap-4 lg:grid-cols-[.8fr_1.2fr] lg:items-end">
          <div><p className="m-0 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700">The product flow</p><h2 className="mt-4 max-w-[10ch] text-[clamp(2.6rem,5vw,4.8rem)] font-semibold leading-[.94] tracking-[-.06em] text-slate-950">Choose. Analyze. Decide.</h2></div>
          <p className="m-0 max-w-2xl text-base leading-7 text-slate-600 lg:justify-self-end">No forced tour. No dashboard maze. Each step appears only when it becomes useful.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            ['01','Choose your source','Connect a supported provider or use a CSV.'],
            ['02','Watch the evidence resolve','Usage is normalized, weak guesses fall away, and the strongest supported action survives.'],
            ['03','Act on one clear result','Test the optimization, then upgrade the claim only when stronger evidence exists.'],
          ].map(([n,title,body])=>(
            <article key={n} className="group rounded-[26px] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,.045)] transition hover:-translate-y-1 hover:shadow-[0_28px_80px_rgba(15,23,42,.08)]">
              <span className="font-mono text-xs text-emerald-700">{n}</span><h3 className="mt-10 text-xl font-semibold tracking-[-0.035em] text-slate-950">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-7 rounded-[28px] border border-slate-200 bg-white p-7 shadow-[0_24px_70px_rgba(15,23,42,.05)] sm:p-10 lg:grid-cols-[.95fr_1.05fr] lg:items-center">
        <div><div className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-700"><ShieldCheck className="size-3.5" />Product contract</div><h2 className="mt-4 max-w-[11ch] text-[clamp(2.45rem,5vw,4.5rem)] font-semibold leading-[.95] tracking-[-.055em] text-slate-950">No evidence, no claim.</h2></div>
        <div><p className="m-0 text-sm leading-6 text-slate-600">Opportunity, Tested, and Verified are different states. Evalomics only upgrades the label when stronger evidence exists.</p><div className="mt-5 flex flex-wrap gap-3"><Link href="/start" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white no-underline">Start with your data <ArrowRight className="size-4" /></Link><Link href="/demo" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-950 no-underline">See demo</Link></div></div>
      </section>
    </div>
  );
}
