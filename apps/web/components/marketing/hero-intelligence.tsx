'use client';

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  Database,
  FileSpreadsheet,
  Sparkles,
} from 'lucide-react';
import { useEffect, useState } from 'react';

const phases = [
  'Evidence entering',
  'Patterns resolving',
  'Weak guesses removed',
  'One action ranked',
] as const;

export function HeroIntelligence() {
  const reduceMotion = useReducedMotion();
  const [phase, setPhase] = useState(reduceMotion ? 3 : 0);

  useEffect(() => {
    if (reduceMotion) return;
    const timers = [900, 2050, 3250].map((delay, index) =>
      window.setTimeout(() => setPhase(index + 1), delay),
    );
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [reduceMotion]);

  return (
    <div className="relative isolate min-h-[430px] overflow-hidden rounded-[28px] border border-white/[0.08] bg-[#090d13] p-5 shadow-[0_30px_100px_rgba(0,0,0,.34)] sm:p-6">
      <div
        className="pointer-events-none absolute inset-0 opacity-80"
        aria-hidden="true"
        style={{
          background:
            'radial-gradient(circle at 50% 45%, rgba(41,211,145,.12), transparent 28%), radial-gradient(circle at 90% 20%, rgba(70,120,255,.13), transparent 27%)',
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.12]"
        aria-hidden="true"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,.12) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.12) 1px, transparent 1px)',
          backgroundSize: '34px 34px',
          maskImage: 'linear-gradient(to bottom, black, transparent 88%)',
        }}
      />

      <div className="relative flex items-center justify-between">
        <div>
          <p className="m-0 text-[9px] font-semibold uppercase tracking-[0.18em] text-white/34">
            Live product preview
          </p>
          <p className="m-0 mt-1 text-sm font-semibold text-white/82">
            {phases[phase]}
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300/15 bg-emerald-300/[0.06] px-2.5 py-1 text-[10px] font-semibold text-emerald-100/80">
          <span className="size-1.5 rounded-full bg-emerald-300 shadow-[0_0_12px_rgba(110,231,183,.8)]" />{' '}
          Engine active
        </span>
      </div>

      <div className="relative mt-7 min-h-[320px]">
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full"
          viewBox="0 0 620 320"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          {[
            'M 92 68 C 210 68, 214 140, 310 150',
            'M 92 160 C 210 160, 220 160, 310 160',
            'M 92 252 C 210 252, 214 182, 310 170',
            'M 338 160 C 430 160, 445 160, 530 160',
          ].map((d, index) => (
            <g key={d}>
              <path
                d={d}
                fill="none"
                stroke="rgba(255,255,255,.09)"
                strokeWidth="1.4"
              />
              <motion.path
                d={d}
                fill="none"
                stroke={
                  index === 3
                    ? 'rgba(110,231,183,.88)'
                    : 'rgba(122,167,255,.72)'
                }
                strokeWidth="2"
                strokeLinecap="round"
                strokeDasharray="18 34"
                animate={
                  reduceMotion ? undefined : { strokeDashoffset: [0, -104] }
                }
                transition={{
                  duration: index === 3 ? 1.6 : 2.2,
                  repeat: Infinity,
                  ease: 'linear',
                  delay: index * 0.12,
                }}
              />
            </g>
          ))}
        </svg>

        <div className="absolute left-0 top-2 grid gap-4">
          {[
            ['OpenAI', 'Usage + cost', Database],
            ['Anthropic', 'Usage + cost', Bot],
            ['CSV', 'Export', FileSpreadsheet],
          ].map(([label, meta, Icon], index) => {
            const SourceIcon = Icon as typeof Database;
            return (
              <motion.div
                key={String(label)}
                initial={false}
                animate={
                  reduceMotion
                    ? undefined
                    : {
                        opacity: phase >= Math.min(index, 1) ? 1 : 0.42,
                        x: phase >= Math.min(index, 1) ? 0 : -5,
                      }
                }
                className="flex w-[154px] items-center gap-3 rounded-2xl border border-white/[0.08] bg-black/25 p-3 backdrop-blur"
              >
                <span className="grid size-8 place-items-center rounded-xl border border-white/[0.08] bg-white/[0.04]">
                  <SourceIcon className="size-3.5 text-blue-200/80" />
                </span>
                <div>
                  <p className="m-0 text-xs font-semibold text-white/86">
                    {String(label)}
                  </p>
                  <p className="m-0 mt-.5 text-[9px] text-white/34">
                    {String(meta)}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          animate={
            reduceMotion ? undefined : { scale: phase >= 1 ? [1, 1.035, 1] : 1 }
          }
          transition={{
            duration: 1.2,
            repeat: phase >= 1 && phase < 3 ? Infinity : 0,
          }}
          className="absolute left-1/2 top-1/2 grid size-28 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-[30px] border border-emerald-300/18 bg-[#0d1517] shadow-[0_0_60px_rgba(110,231,183,.08)]"
        >
          <div className="text-center">
            <span className="mx-auto grid size-10 place-items-center rounded-2xl bg-emerald-300 text-slate-950 shadow-[0_0_35px_rgba(110,231,183,.26)]">
              <Sparkles className="size-5" />
            </span>
            <p className="m-0 mt-3 text-xs font-semibold text-white">
              Evalomics
            </p>
            <p className="m-0 mt-1 text-[9px] text-white/34">rank + evidence</p>
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          <motion.div
            key={phase >= 3 ? 'ready' : 'building'}
            initial={reduceMotion ? false : { opacity: 0, x: 14 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, x: -8 }}
            transition={{ duration: 0.42 }}
            className="absolute right-0 top-[74px] w-[205px] rounded-[22px] border border-white/[0.09] bg-[#10161f] p-4 shadow-[0_22px_70px_rgba(0,0,0,.28)]"
          >
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-semibold uppercase tracking-[0.14em] text-amber-100/70">
                Strongest move
              </span>
              {phase >= 3 ? (
                <CheckCircle2 className="size-3.5 text-emerald-300" />
              ) : null}
            </div>
            <p className="m-0 mt-4 text-lg font-semibold leading-[1.05] tracking-[-0.04em] text-white">
              {phase >= 3 ? 'Increase cache reuse.' : 'Ranking candidates…'}
            </p>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-2.5">
                <p className="m-0 text-[8px] uppercase tracking-[0.11em] text-white/32">
                  Spend
                </p>
                <p className="m-0 mt-1 font-mono text-xs text-white/82">
                  $1,774
                </p>
              </div>
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-2.5">
                <p className="m-0 text-[8px] uppercase tracking-[0.11em] text-white/32">
                  Savings
                </p>
                <p className="m-0 mt-1 text-xs font-semibold text-white/82">
                  Unmeasured
                </p>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-1.5 text-[10px] font-semibold text-emerald-100/75">
              Test before claiming <ArrowRight className="size-3" />
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
