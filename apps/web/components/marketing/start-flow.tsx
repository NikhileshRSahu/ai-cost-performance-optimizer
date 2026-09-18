'use client';

import Link from 'next/link';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Database, FileSpreadsheet, Github, Link2, ShieldCheck, Sparkles, UploadCloud } from 'lucide-react';
import { useState } from 'react';

type Step = 'choice' | 'connect' | 'csv';

function BrandIcon({brand}:{brand:'anthropic'|'github'|'openai'}) {
  if (brand === 'github') return <Github className="size-6" aria-hidden="true" />;
  return (
    <img
      alt=""
      aria-hidden="true"
      width={24}
      height={24}
      src={brand === 'anthropic'
        ? 'https://cdn.simpleicons.org/anthropic/FFFFFF'
        : 'https://cdn.simpleicons.org/openai/FFFFFF'}
    />
  );
}

export function StartFlow({
  organizationId,
}: Readonly<{organizationId: string | null}>) {
  const reduceMotion=useReducedMotion();
  const [step,setStep]=useState<Step>('choice');

  const transition=reduceMotion
    ? {duration:0}
    : {duration:.42,ease:[.16,1,.3,1] as [number,number,number,number]};

  function realHref(mode:'connect'|'csv',provider?:'ANTHROPIC'|'OPENAI') {
    if (organizationId !== null) {
      const query = provider ? '?mode='+mode+'&provider='+provider : '?mode='+mode;
      return '/o/'+organizationId+'/import'+query;
    }
    const returnTo = provider
      ? '/start?mode='+mode+'&provider='+provider
      : '/start?mode='+mode;
    return '/login?returnTo='+encodeURIComponent(returnTo);
  }

  return (
    <section className="mx-auto w-full max-w-5xl overflow-hidden rounded-[32px] border border-slate-200 bg-[#080c12] text-white shadow-[0_36px_120px_rgba(15,23,42,.16)]">
      <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4 sm:px-7">
        <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.17em] text-white/40">
          <Sparkles className="size-3.5 text-emerald-200/70" />
          Start an Evalomics analysis
        </div>
        <div className="flex items-center gap-2 text-[10px] text-white/32">
          <span className={step==='choice'?'size-1.5 rounded-full bg-emerald-300':'size-1.5 rounded-full bg-white/20'} />
          <span className={step!=='choice'?'size-1.5 rounded-full bg-emerald-300':'size-1.5 rounded-full bg-white/20'} />
        </div>
      </div>

      <div className="relative min-h-[560px] overflow-hidden p-6 sm:p-8 lg:p-10">
        <div className="pointer-events-none absolute inset-0 opacity-70" aria-hidden="true"
          style={{background:'radial-gradient(circle at 80% 20%, rgba(81,120,255,.11), transparent 29%), radial-gradient(circle at 18% 86%, rgba(110,231,183,.09), transparent 26%)'}} />
        <AnimatePresence mode="wait">
          {step==='choice' ? (
            <motion.div key="choice" initial={reduceMotion?false:{opacity:0,y:18}} animate={{opacity:1,y:0}} exit={reduceMotion?undefined:{opacity:0,y:-12}} transition={transition} className="relative">
              <p className="m-0 text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-200/65">Step 1 · choose the easiest path</p>
              <h1 className="mt-4 max-w-[13ch] text-[clamp(2.8rem,6vw,5.4rem)] font-semibold leading-[.92] tracking-[-.065em] text-white">
                How do you want to give us usage?
              </h1>
              <p className="mt-5 max-w-2xl text-sm leading-6 text-white/48">
                Pick one. We keep the rest of the workflow out of your way until the evidence is ready.
              </p>

              <div className="mt-9 grid gap-4 md:grid-cols-2">
                <button type="button" onClick={()=>setStep('connect')}
                  className="group min-h-64 rounded-[26px] border border-white/[0.08] bg-white/[0.025] p-6 text-left transition hover:-translate-y-1 hover:border-emerald-300/25 hover:bg-emerald-300/[0.045]">
                  <span className="grid size-12 place-items-center rounded-2xl border border-emerald-300/15 bg-emerald-300/[0.055]"><Link2 className="size-5 text-emerald-200" /></span>
                  <h2 className="m-0 mt-8 text-2xl font-semibold tracking-[-0.035em] text-white">Connect a source</h2>
                  <p className="m-0 mt-2 max-w-sm text-sm leading-6 text-white/43">Use a supported provider connection. We fetch the evidence and analyze it automatically.</p>
                  <span className="mt-7 inline-flex items-center gap-2 text-xs font-semibold text-emerald-100/75">Choose a provider <ArrowRight className="size-3.5 transition group-hover:translate-x-1" /></span>
                </button>

                <button type="button" onClick={()=>setStep('csv')}
                  className="group min-h-64 rounded-[26px] border border-white/[0.08] bg-white/[0.025] p-6 text-left transition hover:-translate-y-1 hover:border-blue-300/25 hover:bg-blue-300/[0.04]">
                  <span className="grid size-12 place-items-center rounded-2xl border border-blue-300/15 bg-blue-300/[0.055]"><FileSpreadsheet className="size-5 text-blue-200" /></span>
                  <h2 className="m-0 mt-8 text-2xl font-semibold tracking-[-0.035em] text-white">Upload CSV</h2>
                  <p className="m-0 mt-2 max-w-sm text-sm leading-6 text-white/43">Already have an export? Upload it, validate it, then run the exact same analysis engine.</p>
                  <span className="mt-7 inline-flex items-center gap-2 text-xs font-semibold text-blue-100/75">Use a usage file <ArrowRight className="size-3.5 transition group-hover:translate-x-1" /></span>
                </button>
              </div>
            </motion.div>
          ) : step==='connect' ? (
            <motion.div key="connect" initial={reduceMotion?false:{opacity:0,x:28}} animate={{opacity:1,x:0}} exit={reduceMotion?undefined:{opacity:0,x:-20}} transition={transition} className="relative">
              <button type="button" onClick={()=>setStep('choice')} className="inline-flex items-center gap-2 text-xs font-semibold text-white/42 hover:text-white"><ArrowLeft className="size-3.5" /> Back</button>
              <p className="m-0 mt-8 text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-200/65">Connect · provider</p>
              <h1 className="mt-3 text-[clamp(2.6rem,5vw,4.8rem)] font-semibold leading-[.94] tracking-[-.06em] text-white">Choose the source.</h1>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-white/45">The connection screen appears only after you choose a provider.</p>

              <div className="mt-8 grid gap-4 md:grid-cols-3">
                {[
                  {brand:'anthropic' as const,name:'Anthropic',meta:'Admin API · available',href:realHref('connect','ANTHROPIC'),active:true},
                  {brand:'github' as const,name:'GitHub',meta:'Workflow context · coming next',href:'#',active:false},
                  {brand:'openai' as const,name:'OpenAI',meta:'Admin API · available',href:realHref('connect','OPENAI'),active:true},
                ].map((provider)=>(
                  <motion.div key={provider.name} whileHover={reduceMotion?undefined:{y:-5}} className="relative overflow-hidden rounded-[24px] border border-white/[0.08] bg-white/[0.025] p-5">
                    <div className="flex items-start justify-between gap-3">
                      <span className="grid size-11 place-items-center rounded-2xl border border-white/[0.08] bg-white/[0.045]"><BrandIcon brand={provider.brand} /></span>
                      <span className={provider.active?'rounded-full border border-emerald-300/15 bg-emerald-300/[0.055] px-2.5 py-1 text-[9px] font-semibold text-emerald-100/75':'rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[9px] font-semibold text-white/35'}>{provider.active?'Available':'Coming soon'}</span>
                    </div>
                    <h2 className="m-0 mt-7 text-xl font-semibold text-white">{provider.name}</h2>
                    <p className="m-0 mt-1 text-xs text-white/34">{provider.meta}</p>
                    {provider.active ? (
                      <Link href={provider.href} className="mt-7 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-950 no-underline">
                        Continue <ArrowRight className="size-3.5" />
                      </Link>
                    ) : (
                      <button type="button" disabled className="mt-7 min-h-11 w-full rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-2.5 text-sm font-semibold text-white/28">Not faked</button>
                    )}
                  </motion.div>
                ))}
              </div>
              <p className="m-0 mt-5 flex items-center gap-2 text-[11px] text-white/30"><ShieldCheck className="size-3.5" /> GitHub is visible because it is in the roadmap; it is not pretending to be a working usage connector today.</p>
            </motion.div>
          ) : (
            <motion.div key="csv" initial={reduceMotion?false:{opacity:0,x:28}} animate={{opacity:1,x:0}} exit={reduceMotion?undefined:{opacity:0,x:-20}} transition={transition} className="relative">
              <button type="button" onClick={()=>setStep('choice')} className="inline-flex items-center gap-2 text-xs font-semibold text-white/42 hover:text-white"><ArrowLeft className="size-3.5" /> Back</button>
              <p className="m-0 mt-8 text-[10px] font-semibold uppercase tracking-[0.16em] text-blue-200/65">Upload · CSV</p>
              <h1 className="mt-3 max-w-[14ch] text-[clamp(2.6rem,5vw,4.8rem)] font-semibold leading-[.94] tracking-[-.06em] text-white">Bring your usage export.</h1>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-white/45">Your secure workspace will validate the file before any row becomes evidence.</p>

              <div className="mt-8 rounded-[26px] border border-dashed border-white/[0.13] bg-[linear-gradient(145deg,rgba(122,167,255,.055),rgba(255,255,255,.015))] p-7 sm:p-10">
                <div className="grid min-h-56 place-items-center text-center">
                  <div>
                    <motion.span animate={reduceMotion?undefined:{y:[0,-5,0]}} transition={{duration:2.2,repeat:Infinity,ease:'easeInOut'}} className="mx-auto grid size-14 place-items-center rounded-[20px] border border-blue-300/18 bg-blue-300/[0.06]">
                      <UploadCloud className="size-6 text-blue-200" />
                    </motion.span>
                    <h2 className="m-0 mt-5 text-xl font-semibold text-white">Drag. Validate. Analyze.</h2>
                    <p className="m-0 mt-2 text-sm text-white/36">CSV up to 10 MiB · no provider key needed</p>
                  </div>
                </div>
              </div>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="m-0 text-[11px] text-white/30">{organizationId===null?'Sign in only now, because you chose a private-data path.':'Your workspace is ready for the file.'}</p>
                <Link href={realHref('csv')} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-950 no-underline">
                  {organizationId===null?'Continue to secure upload':'Choose CSV'} <ArrowRight className="size-4" />
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
