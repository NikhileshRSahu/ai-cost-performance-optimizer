'use client';

import { motion, useReducedMotion } from 'framer-motion';
import {
  CheckCircle2,
  CircleDot,
  FlaskConical,
  Rocket,
  ShieldCheck,
} from 'lucide-react';

const steps = [
  {
    label: 'Connected',
    caption: 'Usage evidence loaded',
    icon: CheckCircle2,
  },
  {
    label: 'Found',
    caption: 'Best opportunity identified',
    icon: CircleDot,
  },
  {
    label: 'Evaluated',
    caption: 'Candidate checked by Evalomics',
    icon: FlaskConical,
  },
  {
    label: 'Ready',
    caption: 'Safe next action prepared',
    icon: Rocket,
  },
  {
    label: 'Proven',
    caption: 'Production result confirmed',
    icon: ShieldCheck,
  },
] as const;

export type ResultJourneyStage =
  'Connected' | 'Found' | 'Evaluated' | 'Ready' | 'Proven';

export function ResultJourney({
  current,
}: Readonly<{
  current: ResultJourneyStage;
}>) {
  const reduceMotion = useReducedMotion();
  const index = Math.max(
    0,
    steps.findIndex((step) => step.label === current),
  );

  return (
    <section
      className="rounded-xl border border-white/[0.07] bg-[#0e1013] px-4 py-3"
      aria-label="Evalomics optimization journey"
    >
      <div className="flex items-center gap-3 overflow-x-auto">
        <span className="shrink-0 font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-white/28">
          Progress
        </span>
        <div className="flex min-w-[520px] flex-1 items-center">
          {steps.map((step, stepIndex) => {
            const reached = stepIndex <= index;
            const active = stepIndex === index;
            const Icon = step.icon;

            return (
              <div
                key={step.label}
                className="flex min-w-0 flex-1 items-center"
              >
                <div className="flex items-center gap-2">
                  <motion.span
                    animate={
                      reduceMotion
                        ? undefined
                        : active
                          ? { scale: [0.96, 1.06, 1] }
                          : { scale: 1 }
                    }
                    className={
                      reached
                        ? 'grid size-6 shrink-0 place-items-center rounded-full border border-emerald-300/25 bg-emerald-300/[0.07] text-emerald-200'
                        : 'grid size-6 shrink-0 place-items-center rounded-full border border-white/[0.08] bg-black/15 text-white/25'
                    }
                  >
                    <Icon className="size-3" />
                  </motion.span>
                  <span
                    className={
                      active
                        ? 'whitespace-nowrap text-[10px] font-semibold text-white/85'
                        : reached
                          ? 'whitespace-nowrap text-[10px] font-medium text-white/48'
                          : 'whitespace-nowrap text-[10px] font-medium text-white/24'
                    }
                  >
                    {step.label}
                  </span>
                </div>
                {stepIndex < steps.length - 1 ? (
                  <span
                    className={
                      stepIndex < index
                        ? 'mx-2 h-px flex-1 bg-emerald-300/35'
                        : 'mx-2 h-px flex-1 bg-white/[0.07]'
                    }
                    aria-hidden="true"
                  />
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
