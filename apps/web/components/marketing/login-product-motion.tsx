'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { CheckCircle2, Database, FileSpreadsheet, Sparkles } from 'lucide-react';

export function LoginProductMotion() {
  const reduceMotion=useReducedMotion();
  return (
    <div className="relative overflow-hidden rounded-[26px] border border-white/[0.08] bg-[#090d13] p-5">
      <div className="pointer-events-none absolute inset-0 opacity-60" aria-hidden="true"
        style={{background:'radial-gradient(circle at 50% 35%, rgba(110,231,183,.12), transparent 30%), radial-gradient(circle at 85% 85%, rgba(122,167,255,.10), transparent 26%)'}} />
      <div className="relative">
        <p className="m-0 text-[9px] font-semibold uppercase tracking-[0.16em] text-white/34">What happens after sign-in</p>
        <div className="mt-5 grid gap-3">
          {[
            ['1','Source selected','Anthropic, OpenAI, or CSV',Database],
            ['2','Evidence analyzed','Usage → patterns → strongest action',Sparkles],
            ['3','Decision ready','One next move, not another dashboard',CheckCircle2],
          ].map(([n,title,body,Icon],index)=>{
            const StepIcon=Icon as typeof Database;
            return (
              <motion.div key={String(n)}
                initial={reduceMotion?false:{opacity:0,x:18}}
                animate={{opacity:1,x:0}}
                transition={{delay:index*.16,duration:.45,ease:[.16,1,.3,1]}}
                className="grid grid-cols-[36px_1fr] gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4">
                <span className="grid size-9 place-items-center rounded-xl border border-white/[0.07] bg-white/[0.035]"><StepIcon className="size-4 text-emerald-200/75" /></span>
                <div><div className="flex items-center gap-2"><span className="font-mono text-[9px] text-blue-200/60">{String(n).padStart(2,'0')}</span><p className="m-0 text-sm font-semibold text-white/86">{String(title)}</p></div><p className="m-0 mt-1 text-[11px] leading-5 text-white/38">{String(body)}</p></div>
              </motion.div>
            );
          })}
        </div>
        <div className="mt-4 flex items-center gap-3 rounded-2xl border border-amber-300/12 bg-amber-300/[0.045] p-4">
          <FileSpreadsheet className="size-4 text-amber-100/70" />
          <p className="m-0 text-[11px] leading-5 text-amber-50/60">Private-data paths ask you to sign in only after you have chosen what you want to do.</p>
        </div>
      </div>
    </div>
  );
}
