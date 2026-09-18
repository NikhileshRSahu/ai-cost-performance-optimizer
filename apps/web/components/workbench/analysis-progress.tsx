'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { CheckCircle2, CircleDot } from 'lucide-react';
import { useEffect, useState } from 'react';

const stages = [
  'Reading usage',
  'Normalizing evidence',
  'Finding waste',
  'Ranking supported opportunities',
] as const;

export function AnalysisProgress() {
  const reduceMotion = useReducedMotion();
  const [current, setCurrent] = useState(reduceMotion ? stages.length - 1 : 0);

  useEffect(() => {
    if (reduceMotion) {
      setCurrent(stages.length - 1);
      return;
    }

    const timers = [700, 1450, 2250].map((delay, index) =>
      window.setTimeout(() => setCurrent(index + 1), delay),
    );

    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [reduceMotion]);

  return (
    <div className="grid gap-5">
      <div>
        <p className="m-0 text-[10px] font-semibold uppercase tracking-[0.16em] text-blue-200/55">
          Evalomics analysis
        </p>
        <h1 className="m-0 mt-3 max-w-[13ch] !text-[clamp(2.2rem,5vw,4rem)] !leading-[.98] !tracking-[-.05em] text-white">
          Analyzing usage evidence…
        </h1>
        <p className="m-0 mt-3 max-w-2xl text-sm leading-6 text-white/50">
          Evalomics is turning the source into comparable evidence and looking
          for the strongest supported action.
        </p>
      </div>

      <div className="grid gap-2.5" aria-label="Analysis stages">
        {stages.map((label, index) => {
          const active = index === current;
          const reached = index < current;
          return (
            <motion.div
              key={label}
              animate={
                reduceMotion
                  ? undefined
                  : {
                      opacity: index <= current ? 1 : 0.38,
                      x: active ? 4 : 0,
                    }
              }
              transition={{ duration: 0.25 }}
              className={
                active
                  ? 'flex items-center gap-3 rounded-xl border border-blue-300/18 bg-blue-300/[0.055] px-4 py-3'
                  : 'flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.018] px-4 py-3'
              }
            >
              {reached ? (
                <CheckCircle2
                  className="size-4 text-emerald-200/75"
                  aria-hidden="true"
                />
              ) : (
                <CircleDot
                  className={
                    active ? 'size-4 text-blue-200' : 'size-4 text-white/26'
                  }
                  aria-hidden="true"
                />
              )}
              <span
                className={
                  active
                    ? 'text-sm font-semibold text-white/86'
                    : 'text-sm font-medium text-white/48'
                }
              >
                {label}
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
