'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

const frames = [
  '/section2/01-ai-works.svg',
  '/section2/02-work-mri.svg',
  '/section2/03-benchmark.svg',
  '/section2/04-verified.svg',
] as const;

export function Section2ImageScroll() {
  const containerRef = useRef<HTMLElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const { scrollYProgress } = useScroll({ target: containerRef });

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const rotate = useTransform(scrollYProgress, [0, 1], [20, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], isMobile ? [0.7, 0.9] : [1.05, 1]);
  const translate = useTransform(scrollYProgress, [0, 1], [0, -100]);

  return (
    <section
      ref={containerRef}
      className="relative flex h-[60rem] items-center justify-center px-4 md:h-[80rem] md:px-10"
      aria-label="How Evalomics turns AI usage into verified savings"
    >
      <div className="sticky top-0 flex h-screen w-full items-center justify-center overflow-hidden" style={{ perspective: '1000px' }}>
        <div className="pointer-events-none absolute inset-x-[12%] top-[14%] h-[55%] rounded-full bg-[radial-gradient(circle,rgba(207,126,55,.18),transparent_68%)] blur-3xl" />

        <motion.div
          className="relative mx-auto w-full max-w-[1180px]"
          style={{ translateY: translate }}
        >
          <div className="mb-7 text-center">
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-300/75">Inside Evalomics</span>
            <h2 className="mx-auto mt-3 max-w-3xl text-balance text-3xl font-medium tracking-[-0.04em] text-white md:text-5xl">
              Follow the evidence from AI usage to verified savings.
            </h2>
          </div>

          <motion.div
            style={{
              rotateX: rotate,
              scale,
              transformStyle: 'preserve-3d',
              transformOrigin: '50% 60%',
              boxShadow: '0 0 #0000004d, 0 9px 20px #0000004a, 0 37px 37px #00000042, 0 84px 50px #00000026, 0 149px 60px #0000000a, 0 233px 65px #00000003',
            }}
            className="grid w-full grid-cols-2 gap-2 rounded-[26px] border border-white/10 bg-[#080c10]/90 p-2 shadow-2xl md:gap-3 md:p-3"
          >
            {frames.map((src, index) => (
              <div key={src} className="overflow-hidden rounded-[16px] border border-white/[0.07] bg-[#05090d]">
                <img
                  src={src}
                  alt={[
                    'AI request cost trails',
                    'Evalomics Work MRI',
                    'Benchmark current and proposed AI workflow',
                    'Verified AI savings outcome',
                  ][index]}
                  className="block h-auto w-full"
                />
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
