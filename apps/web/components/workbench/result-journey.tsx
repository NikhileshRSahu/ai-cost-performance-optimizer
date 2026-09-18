'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { Check, CircleDot, FlaskConical, ShieldCheck } from 'lucide-react';

const steps=[
  {label:'Observed',caption:'Evidence loaded',icon:Check},
  {label:'Finding',caption:'Action ranked',icon:CircleDot},
  {label:'Tested',caption:'Benchmark passed',icon:FlaskConical},
  {label:'Verified',caption:'Production proof',icon:ShieldCheck},
] as const;

export function ResultJourney({current}:{current:'Observed'|'Finding'|'Tested'|'Verified'}) {
  const reduceMotion=useReducedMotion();
  const index=Math.max(0,steps.findIndex((step)=>step.label===current));
  return <section className="rounded-[20px] border border-white/[0.07] bg-white/[0.018] px-4 py-4 sm:px-5" aria-label="Optimization journey">
    <div className="relative grid grid-cols-4 gap-2">
      <div className="absolute left-[8%] right-[8%] top-4 h-px bg-white/[0.08]" aria-hidden="true" />
      <motion.div className="absolute left-[8%] top-4 h-px bg-emerald-300/60" initial={false} animate={{width:(index/3*84)+'%'}} transition={reduceMotion?{duration:0}:{duration:.7,ease:[.16,1,.3,1]}} aria-hidden="true" />
      {steps.map((step,stepIndex)=>{const reached=stepIndex<=index;const Icon=step.icon;return <div key={step.label} className="relative z-10 grid justify-items-center text-center"><motion.span animate={reduceMotion?undefined:reached?{scale:[.92,1.05,1]}:{scale:1}} className={reached?'grid size-8 place-items-center rounded-full border border-emerald-300/30 bg-[#11241f] text-emerald-200':'grid size-8 place-items-center rounded-full border border-white/[0.09] bg-[#0b1017] text-white/28'}><Icon className="size-3.5" /></motion.span><p className={reached?'m-0 mt-2 text-[10px] font-semibold text-white/80':'m-0 mt-2 text-[10px] font-semibold text-white/32'}>{step.label}</p><p className="m-0 mt-.5 hidden text-[9px] text-white/28 sm:block">{step.caption}</p></div>})}
    </div>
  </section>;
}
