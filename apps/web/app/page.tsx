import Link from 'next/link';
import {
  ArrowRight,
  BadgeDollarSign,
  FileUp,
  Gauge,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { CinematicVideoHero } from '../components/marketing/cinematic-video-hero';

export default function HomePage() {
  return (
    <div className="bg-[#050510]">
      <CinematicVideoHero />

      <section className="border-t border-white/[0.06] bg-[#080913] py-14 text-white sm:py-18">
        <div className="mx-auto grid w-[min(1320px,calc(100%-2rem))] gap-8">
          <div className="grid gap-5 lg:grid-cols-[.8fr_1.2fr] lg:items-end">
            <div>
              <p className="m-0 text-[10px] font-semibold uppercase tracking-[0.2em] text-sky-200/55">
                One clear product flow
              </p>
              <h2 className="mt-4 max-w-[11ch] text-[clamp(2.7rem,5vw,5rem)] font-semibold leading-[.94] tracking-[-.06em]">
                Input. Dashboard. Recommendations. Proof.
              </h2>
            </div>
            <p className="m-0 max-w-2xl text-sm leading-6 text-white/45 lg:justify-self-end">
              The default experience now behaves like an application, not a
              methodology lesson. Usage comes in once, then every page has one
              obvious job.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              {
                icon: FileUp,
                label: 'Usage & Import',
                body: 'Connect a provider or drop a CSV. Validate it before analysis.',
              },
              {
                icon: Gauge,
                label: 'Cost Dashboard',
                body: 'See observed spend, signals, and the strongest supported move.',
              },
              {
                icon: Sparkles,
                label: 'Recommendations',
                body: 'Review ranked cost-saving actions without dashboard clutter.',
              },
              {
                icon: ShieldCheck,
                label: 'Verified Savings',
                body: 'Separate modeled, tested, and verified impact clearly.',
              },
            ].map(({ icon: Icon, label, body }) => (
              <article
                key={label}
                className="rounded-[22px] border border-white/[0.07] bg-white/[0.025] p-5"
              >
                <span className="grid size-10 place-items-center rounded-xl border border-white/[0.07] bg-white/[0.035]">
                  <Icon className="size-4 text-violet-200/75" />
                </span>
                <h3 className="m-0 mt-6 text-base font-semibold text-white">
                  {label}
                </h3>
                <p className="m-0 mt-2 text-xs leading-5 text-white/38">
                  {body}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-14 sm:py-18">
        <div className="mx-auto grid w-[min(1320px,calc(100%-2rem))] gap-7 rounded-[30px] border border-slate-200 bg-slate-50 p-7 shadow-[0_24px_70px_rgba(15,23,42,.06)] sm:p-10 lg:grid-cols-[.9fr_1.1fr] lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-700">
              <BadgeDollarSign className="size-3.5" />
              Evidence contract
            </div>
            <h2 className="mt-4 max-w-[11ch] text-[clamp(2.5rem,5vw,4.5rem)] font-semibold leading-[.95] tracking-[-.055em] text-slate-950">
              Potential is not verified.
            </h2>
          </div>
          <div>
            <p className="m-0 text-sm leading-6 text-slate-600">
              Evalomics keeps the clarity of a normal cost product while
              preserving one important rule: modeled upside, benchmark-tested
              savings, and verified production savings are different states.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href="/start"
                className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white no-underline"
              >
                Start with your data <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/methodology"
                className="inline-flex min-h-11 items-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-950 no-underline"
              >
                See methodology
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
