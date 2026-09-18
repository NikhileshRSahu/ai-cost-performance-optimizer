'use client';

import Link from 'next/link';
import {
  ArrowRightIcon,
  BarChart3,
  BrainCircuit,
  CheckCircle2,
  CloudUpload,
  Database,
  FileSpreadsheet,
  FlaskConical,
  Gauge,
  Menu,
  ScanSearch,
  ShieldCheck,
  Sparkles,
  Workflow,
  Zap,
  ChevronDown,
} from 'lucide-react';
import { EvalomicsMark } from '../evalomics-mark';

const buttonBase =
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0';
const buttonDefault =
  'text-primary-foreground shadow-sm hover:from-primary/80 hover:to-primary/70 bg-linear-to-b from-primary/100 to-primary/70 border-t-primary';
const buttonGlow = 'glass-4 hover:glass-5 shadow-md';
const buttonLg = 'h-10 rounded-md px-5';

function EvalomicsDashboard() {
  const nav = ['Overview', 'AI usage', 'Opportunities', 'Testing', 'Verified'];
  return (
    <div className="w-full bg-[#090d12] text-white">
      <div className="grid min-h-[620px] grid-cols-[190px_1fr]">
        <aside className="border-r border-white/7 bg-[#070a0f] p-5">
          <div className="mb-7 flex items-center gap-2.5 text-sm font-semibold">
            <EvalomicsMark size={22} />
            <span>Evalomics</span>
          </div>
          <div className="space-y-1.5">
            {nav.map((item, index) => (
              <div
                key={item}
                className={
                  index === 0
                    ? 'flex items-center gap-2 rounded-md bg-cyan-400/10 px-3 py-2.5 text-xs text-cyan-100'
                    : 'flex items-center gap-2 rounded-md px-3 py-2.5 text-xs text-white/40'
                }
              >
                <span className="size-1.5 rounded-full bg-current" />
                {item}
              </div>
            ))}
          </div>
        </aside>

        <div className="p-6">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-300">
                OpenAI usage · analyzed
              </div>
              <h3 className="mt-2 text-xl font-semibold tracking-tight">Cost intelligence</h3>
            </div>
            <div className="rounded-md border border-white/8 bg-white/[0.025] px-3 py-2 text-[11px] text-white/50">
              Last 30 days
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {[
              ['Observed spend', '$1,774.78', 'Measured'],
              ['Modeled upside', '$286–$421', 'Potential'],
              ['Verified savings', '$0.00', 'Not yet verified'],
            ].map(([label, value, meta], i) => (
              <div key={label} className="rounded-xl border border-white/8 bg-white/[0.025] p-4">
                <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/35">
                  {label}
                </div>
                <div className="mt-4 text-2xl font-semibold tracking-tight">{value}</div>
                <div className="mt-1 text-[11px] text-white/30">{meta}</div>
                <div className="mt-5 flex gap-2">
                  {[0,1,2,3,4].map((n) => (
                    <span
                      key={n}
                      className={
                        i === 1
                          ? 'block h-1 w-8 -skew-x-[35deg] bg-emerald-400'
                          : i === 2
                            ? 'block h-1 w-8 -skew-x-[35deg] bg-cyan-400/35'
                            : 'block h-1 w-8 -skew-x-[35deg] bg-cyan-400'
                      }
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between rounded-xl border border-cyan-400/10 bg-cyan-400/[0.035] p-4">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-cyan-300">
                Recommended next action
              </div>
              <div className="mt-1.5 text-sm font-medium text-white/80">
                Benchmark repeated input against your quality floor.
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs font-semibold text-cyan-300">
              See details <ArrowRightIcon className="size-3.5" />
            </div>
          </div>

          <div className="mt-4 grid grid-cols-[1.2fr_.8fr] gap-4">
            <div className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
              <div className="text-xs font-semibold text-white/65">Request flow</div>
              <div className="mt-4 space-y-3">
                {['User requests','System prompts','RAG / context','Tool calls','Fine-tuned models'].map((label, index) => (
                  <div key={label} className="grid grid-cols-[100px_1fr_100px] items-center gap-3">
                    <span className="text-[10px] text-white/30">{label}</span>
                    <span className="h-px bg-linear-to-r from-cyan-400/15 via-cyan-400/75 to-amber-300/50" style={{opacity: 1 - index * .12}} />
                    <span className="text-[10px] text-amber-200/50">{index % 2 === 0 ? 'Repeated input' : ''}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
              <div className="text-xs font-semibold text-white/65">Top cost drivers</div>
              <div className="mt-4 space-y-3">
                {[
                  ['gpt-4o','42%',82],
                  ['gpt-4-turbo','24%',58],
                  ['gpt-3.5-turbo','18%',44],
                  ['embeddings','7%',24],
                ].map(([name, value, width]) => (
                  <div key={String(name)} className="grid grid-cols-[82px_1fr_32px] items-center gap-2 text-[10px] text-white/35">
                    <span>{name}</span>
                    <span className="h-1 overflow-hidden rounded-full bg-white/5">
                      <span className="block h-full rounded-full bg-linear-to-r from-cyan-400 to-emerald-400" style={{width: width + '%'}} />
                    </span>
                    <span>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Navbar() {
  return (
    <header className="sticky top-0 z-50 -mb-4 px-4 pb-4">
      <div className="fade-bottom bg-background/15 absolute left-0 h-24 w-full backdrop-blur-lg" />
      <div className="max-w-container relative mx-auto">
        <nav className="flex items-center justify-between py-4">
          <div className="flex items-center justify-start gap-4">
            <Link href="/" className="flex items-center gap-2 text-xl font-bold">
              <EvalomicsMark size={24} />
              Evalomics
            </Link>
            <div className="hidden items-center gap-1 md:flex">
              {[
                ['Product', '#product'],
                ['Methodology', '/methodology'],
                ['Pricing', '/pricing'],
                ['Docs', '/research'],
              ].map(([text, href]) => (
                <Link key={text} href={href} className="rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
                  {text}
                </Link>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-end gap-4">
            <Link href="/login" className="hidden text-sm md:block">Sign in</Link>
            <Link href="/start" className={[buttonBase, buttonDefault, buttonLg].join(' ')}>Start free</Link>
            <button className="inline-flex size-9 items-center justify-center rounded-md md:hidden" aria-label="Toggle navigation">
              <Menu className="size-5" />
            </button>
          </div>
        </nav>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section id="product" className="line-b fade-bottom overflow-hidden px-4 pb-0 pt-12 sm:pt-24 md:pt-32">
      <div className="max-w-container mx-auto flex flex-col gap-12 pt-4 sm:gap-24">
        <div className="flex flex-col items-center gap-6 text-center sm:gap-12">
          <div className="animate-appear inline-flex items-center rounded-full border border-border/20 px-2.5 py-1 text-xs font-semibold">
            <span className="text-muted-foreground">Evidence-first AI cost optimization</span>
            <Link href="/methodology" className="ml-2 flex items-center gap-1">
              See methodology <ArrowRightIcon className="size-3" />
            </Link>
          </div>

          <h1 className="animate-appear from-foreground to-foreground dark:to-muted-foreground relative z-10 inline-block max-w-[1100px] bg-linear-to-r bg-clip-text text-4xl leading-tight font-semibold text-balance text-transparent drop-shadow-2xl sm:text-6xl sm:leading-tight md:text-8xl md:leading-tight">
            Make the invisible economics of AI visible
          </h1>

          <p className="text-md animate-appear text-muted-foreground relative z-10 max-w-[740px] font-medium text-balance opacity-0 delay-100 sm:text-xl">
            Connect OpenAI or Anthropic, or upload CSV usage. Evalomics reveals where AI spend goes, detects inefficient patterns, tests safer alternatives, and keeps Potential, Tested, and Verified savings separate.
          </p>

          <div className="animate-appear relative z-10 flex justify-center gap-4 opacity-0 delay-300">
            <Link href="/start" className={[buttonBase, buttonDefault, buttonLg].join(' ')}>
              Analyze my AI usage <ArrowRightIcon />
            </Link>
            <Link href="/demo" className={[buttonBase, buttonGlow, buttonLg].join(' ')}>
              Explore live demo
            </Link>
          </div>

          <div className="relative w-full pt-12">
            <div className="animate-appear relative z-10 flex overflow-hidden rounded-2xl bg-border/10 p-2 opacity-0 delay-700">
              <div className="relative z-10 flex w-full overflow-hidden rounded-md border border-border/5 border-t-border/15 bg-background/90 shadow-2xl">
                <EvalomicsDashboard />
              </div>
            </div>
            <div className="animate-appear-zoom absolute top-0 left-0 w-full opacity-0 delay-1000">
              <div className="from-brand-foreground/50 to-brand-foreground/0 absolute left-1/2 h-[512px] w-[60%] -translate-x-1/2 scale-[2.5] rounded-[50%] bg-radial from-10% to-60%" />
              <div className="from-brand/30 to-brand-foreground/0 absolute left-1/2 h-[256px] w-[40%] -translate-x-1/2 scale-200 rounded-[50%] bg-radial from-10% to-60%" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Logos() {
  const sources = [
    [Database, 'OpenAI'],
    [BrainCircuit, 'Anthropic'],
    [FileSpreadsheet, 'CSV'],
    [Workflow, 'Work MRI'],
    [FlaskConical, 'Benchmarks'],
  ] as const;

  return (
    <section className="line-b px-4 py-12 sm:py-24 md:py-32">
      <div className="max-w-container mx-auto flex flex-col items-center gap-8 text-center">
        <div className="flex flex-col items-center gap-6">
          <div className="border-brand/30 text-brand inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold">
            Observed → Potential → Tested → Verified
          </div>
          <h2 className="text-md font-semibold sm:text-2xl">Built around the evidence your AI systems already produce</h2>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-8">
          {sources.map(([Icon, name]) => (
            <div key={name} className="flex items-center gap-2 text-sm font-medium">
              <Icon className="size-6 opacity-70" />
              <span>{name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Items() {
  const items = [
    ['Evidence-first savings', 'Potential, tested, and verified claims never collapse into one number.', BarChart3],
    ['Provider ingestion', 'OpenAI, Anthropic, and CSV usage in one evidence model.', CloudUpload],
    ['Work MRI', 'See model, prompt, context, workflow, and spend patterns together.', BrainCircuit],
    ['Benchmark safely', 'Compare alternatives against your required quality floor.', FlaskConical],
    ['Workflow optimization', 'Find safer routing, caching, context, and workflow changes.', Workflow],
    ['Production verification', 'Reconcile tested changes against production evidence.', ShieldCheck],
    ['Prompt insights', 'Surface repeated input, oversized context, and tool waste.', ScanSearch],
    ['Direct next actions', 'Rank the strongest supported move instead of endless charts.', Zap],
  ] as const;

  return (
    <section className="line-b px-4 py-12 sm:py-24 md:py-32">
      <div className="max-w-container mx-auto flex flex-col items-center gap-6 sm:gap-20">
        <h2 className="max-w-[620px] text-center text-3xl leading-tight font-semibold sm:text-5xl sm:leading-tight">
          Everything you need. Nothing you don’t.
        </h2>
        <div className="grid auto-rows-fr grid-cols-2 gap-0 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
          {items.map(([title, description, Icon]) => (
            <div key={title} className="text-foreground flex flex-col gap-4 p-4">
              <h3 className="flex items-center gap-2 text-sm leading-none font-semibold tracking-tight sm:text-base">
                <span className="flex items-center self-start"><Icon className="size-5 stroke-1" /></span>
                {title}
              </h3>
              <div className="text-muted-foreground flex max-w-[240px] flex-col gap-2 text-sm text-balance">
                {description}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Stats() {
  const stats = [
    ['observe', '$1,774.78', 'measured spend in the evidence window'],
    ['model', '$286–$421', 'supported savings opportunity'],
    ['test', '$142.17', 'savings that passed benchmark conditions'],
    ['verify', '$109.32', 'production-reconciled savings'],
  ];

  return (
    <section className="line-b px-4 py-12 sm:py-24 md:py-32">
      <div className="container mx-auto max-w-[960px]">
        <div className="grid grid-cols-2 gap-12 sm:grid-cols-4">
          {stats.map(([label, value, description]) => (
            <div key={label} className="flex flex-col items-start gap-3 text-left">
              <div className="text-muted-foreground text-sm font-semibold">{label}</div>
              <div className="from-foreground to-foreground dark:to-brand bg-linear-to-r bg-clip-text text-3xl font-medium text-transparent drop-shadow-[2px_1px_24px_var(--brand-foreground)] transition-all duration-300 sm:text-4xl md:text-5xl">
                {value}
              </div>
              <div className="text-muted-foreground text-sm font-semibold text-pretty">{description}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Pricing() {
  const plans = [
    {
      name: 'Free check',
      description: 'See the product flow and analyze demo usage.',
      price: '$0',
      note: 'No credit card required.',
      features: ['Live demo', 'CSV example', 'Evidence maturity model'],
      featured: false,
    },
    {
      name: 'Pilot',
      description: 'For teams that want an evidence-backed AI efficiency review.',
      price: 'Custom',
      note: 'Scope depends on usage volume and providers.',
      features: ['Usage analysis', 'Benchmark recommendations', 'Verification plan'],
      featured: true,
    },
    {
      name: 'Team',
      description: 'For ongoing optimization across multiple AI workloads.',
      price: 'Talk to us',
      note: 'Designed around measurable verified savings.',
      features: ['Multiple workloads', 'Ongoing measurement', 'Production verification'],
      featured: false,
    },
  ];

  return (
    <section className="line-b px-4 py-12 sm:py-24 md:py-32">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-12">
        <div className="flex flex-col items-center gap-4 px-4 text-center sm:gap-8">
          <h2 className="text-3xl leading-tight font-semibold sm:text-5xl sm:leading-tight">Start with evidence, not promises.</h2>
          <p className="text-md text-muted-foreground max-w-[600px] font-medium sm:text-xl">
            Begin with a free product walkthrough, then move to a pilot when you have real usage to analyze.
          </p>
        </div>
        <div className="max-w-container mx-auto grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={
                plan.featured
                  ? "glass-3 from-card/100 to-card/100 relative flex flex-col gap-6 overflow-hidden rounded-2xl p-8 shadow-xl after:absolute after:-top-[128px] after:left-1/2 after:h-[128px] after:w-full after:-translate-x-1/2 after:rounded-[50%] after:bg-brand-foreground/70 after:blur-[72px]"
                  : "glass-2 relative flex flex-col gap-6 overflow-hidden rounded-2xl p-8 shadow-xl"
              }
            >
              <div className="relative z-10 flex flex-col gap-7">
                <header className="flex flex-col gap-2">
                  <h3 className="font-bold">{plan.name}</h3>
                  <p className="text-muted-foreground max-w-[240px] text-sm">{plan.description}</p>
                </header>
                <div className="text-4xl font-bold">{plan.price}</div>
                <Link href="/start" className={[buttonBase, plan.featured ? buttonDefault : buttonGlow, buttonLg].join(' ')}>
                  Get started
                </Link>
                <p className="text-muted-foreground min-h-[40px] max-w-[240px] text-sm">{plan.note}</p>
                <hr className="border-input" />
              </div>
              <ul className="relative z-10 flex flex-col gap-2">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="text-muted-foreground size-4 shrink-0" /> {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQ() {
  const faqs = [
    ['What does Evalomics actually analyze?', 'Provider or CSV usage evidence: requests, models, tokens, spend, repeated patterns, context load, and supported optimization opportunities.'],
    ['Why are Potential, Tested, and Verified separate?', 'Because a modeled opportunity is not the same thing as a benchmark result, and a benchmark result is not the same thing as production-reconciled savings.'],
    ['Do I have to connect an API?', 'No. CSV upload is supported for users who want to evaluate the workflow before connecting a provider.'],
    ['Does Evalomics automatically change my production models?', 'No. Recommendations remain recommendations until you choose to test and implement them.'],
    ['How is quality protected?', 'Optimization candidates are benchmarked against a required quality floor before they can advance to a tested state.'],
  ];

  return (
    <section className="line-b px-4 py-12 sm:py-24 md:py-32">
      <div className="max-w-container mx-auto grid gap-12 lg:grid-cols-[.7fr_1.3fr] lg:gap-20">
        <div>
          <h2 className="text-3xl leading-tight font-semibold sm:text-5xl">Questions, answered.</h2>
          <p className="text-muted-foreground mt-5 max-w-md text-base sm:text-lg">
            Evalomics is designed to make AI efficiency claims inspectable instead of magical.
          </p>
        </div>
        <div className="divide-y divide-border/15">
          {faqs.map(([q, a]) => (
            <details key={q} className="group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">
                {q}
                <ChevronDown className="size-4 shrink-0 transition-transform group-open:rotate-180" />
              </summary>
              <p className="text-muted-foreground max-w-2xl pt-4 text-sm leading-6">{a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="line-b group relative overflow-hidden px-4 py-12 sm:py-24 md:py-32">
      <div className="max-w-container relative z-10 mx-auto flex flex-col items-center gap-6 text-center sm:gap-8">
        <h2 className="max-w-[700px] text-3xl leading-tight font-semibold sm:text-5xl sm:leading-tight">
          See what your AI usage costs. And what is safe to change.
        </h2>
        <div className="flex justify-center gap-4">
          <Link href="/start" className={[buttonBase, buttonDefault, buttonLg].join(' ')}>
            Analyze my AI usage <ArrowRightIcon />
          </Link>
        </div>
      </div>
      <div className="absolute top-0 left-0 h-full w-full translate-y-[1rem] opacity-80 transition-all duration-500 ease-in-out group-hover:translate-y-[-2rem] group-hover:opacity-100">
        <div className="absolute bottom-0 w-full">
          <div className="from-brand-foreground/50 to-brand-foreground/0 absolute left-1/2 h-[512px] w-[60%] -translate-x-1/2 scale-[2.5] rounded-[50%] bg-radial from-10% to-60%" />
          <div className="from-brand/30 to-brand-foreground/0 absolute left-1/2 h-[256px] w-[40%] -translate-x-1/2 scale-200 rounded-[50%] bg-radial from-10% to-60%" />
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-background w-full px-4">
      <div className="max-w-container mx-auto">
        <div className="grid grid-cols-2 gap-8 py-10 sm:grid-cols-4 md:grid-cols-5">
          <div className="col-span-2 sm:col-span-4 md:col-span-2">
            <div className="flex items-center gap-2">
              <EvalomicsMark size={23} />
              <h3 className="text-xl font-bold">Evalomics</h3>
            </div>
          </div>
          {[
            ['Product', [['Demo','/demo'],['Methodology','/methodology']]],
            ['Company', [['Pricing','/pricing'],['Research','/research']]],
            ['Legal', [['Privacy','/privacy'],['Security','/security'],['Terms','/terms']]],
          ].map(([title, links]) => (
            <div key={String(title)} className="flex flex-col gap-3">
              <h3 className="text-md pt-1 font-semibold">{String(title)}</h3>
              {(links as string[][]).map(([text, href]) => (
                <Link key={text} href={href} className="text-muted-foreground text-sm">{text}</Link>
              ))}
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-4 border-t border-border/10 py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>© 2026 Evalomics. All rights reserved.</span>
          <span>Landing structure adapted from Launch UI (MIT).</span>
        </div>
      </div>
    </footer>
  );
}

export function LaunchExactEvalomics() {
  return (
    <div className="dark launch-exact-page bg-background text-foreground min-h-screen w-full">
      <section className="pointer-events-none fixed inset-0 top-0">
        <div className="max-w-container line-y line-dashed mx-auto flex h-full flex-col" />
      </section>
      <Navbar />
      <main>
        <Hero />
        <Logos />
        <Items />
        <Stats />
        <Pricing />
        <FAQ />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
