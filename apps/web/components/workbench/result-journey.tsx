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
  | 'Connected'
  | 'Found'
  | 'Evaluated'
  | 'Ready'
  | 'Proven';

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
      className="rounded-[22px] border border-white/[0.08] bg-[#0f1115] px-4 py-4 sm:px-5"
      aria-label="Evalomics optimization journey"
    >
      <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="m-0 font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-sky-300/65">
            Your Evalomics story
          </p>
          <p className="m-0 mt-1 text-sm font-medium text-white/80">
            Data in → decision out → result proven
          </p>
        </div>
        <p className="m-0 text-[10px] text-white/30">
          Current stage: {current}
        </p>
      </div>

      <div className="relative grid grid-cols-5 gap-2">
        <div
          className="absolute left-[7%] right-[7%] top-4 h-px bg-white/[0.08]"
          aria-hidden="true"
        />
        <motion.div
          className="absolute left-[7%] top-4 h-px bg-emerald-300/60"
          initial={false}
          animate={{ width: String((index / 4) * 86) + '%' }}
          transition={
            reduceMotion
              ? { duration: 0 }
              : { duration: 0.7, ease: [0.16, 1, 0.3, 1] }
          }
          aria-hidden="true"
        />

        {steps.map((step, stepIndex) => {
          const reached = stepIndex <= index;
          const active = stepIndex === index;
          const Icon = step.icon;

          return (
            <div
              key={step.label}
              className="relative z-10 grid justify-items-center text-center"
            >
              <motion.span
                animate={
                  reduceMotion
                    ? undefined
                    : active
                      ? { scale: [0.94, 1.08, 1] }
                      : { scale: 1 }
                }
                className={
                  reached
                    ? 'grid size-8 place-items-center rounded-full border border-emerald-300/30 bg-[#11241f] text-emerald-200'
                    : 'grid size-8 place-items-center rounded-full border border-white/[0.09] bg-[#0b1017] text-white/28'
                }
              >
                <Icon className="size-3.5" />
              </motion.span>
              <p
                className={
                  reached
                    ? 'm-0 mt-2 text-[10px] font-semibold text-white/82'
                    : 'm-0 mt-2 text-[10px] font-semibold text-white/32'
                }
              >
                {step.label}
              </p>
              <p className="m-0 mt-0.5 hidden max-w-24 text-[9px] leading-4 text-white/28 md:block">
                {step.caption}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
