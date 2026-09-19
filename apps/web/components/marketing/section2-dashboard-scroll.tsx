'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

export function Section2DashboardScroll() {
  const containerRef = useRef<HTMLElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const { scrollYProgress } = useScroll({ target: containerRef });

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const rotate = useTransform(scrollYProgress, [0, 1], [20, 0]);
  const scale = useTransform(
    scrollYProgress,
    [0, 1],
    isMobile ? [0.7, 0.9] : [1.05, 1],
  );
  const translate = useTransform(scrollYProgress, [0, 1], [0, -100]);

  return (
    <section
      id="product-story"
      ref={containerRef}
      className="relative flex h-[60rem] items-center justify-center overflow-visible px-4 md:h-[80rem] md:px-8"
      aria-label="Evalomics AI economics dashboard"
    >
      <div
        className="sticky top-0 flex h-screen w-full items-center justify-center overflow-hidden"
        style={{ perspective: '1000px' }}
      >
        <div className="pointer-events-none absolute inset-x-[8%] top-[12%] h-[58%] rounded-full bg-[radial-gradient(circle,rgba(35,191,236,.12),transparent_68%)] blur-3xl" />

        <div className="relative w-full max-w-[1440px] py-10 md:py-24">
          <motion.div
            style={{ translateY: translate }}
            className="relative z-10 mx-auto mb-7 max-w-4xl text-center md:mb-10"
          >
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-300/75">
              Evalomics workspace
            </span>
            <h2 className="mt-4 text-balance text-4xl font-medium tracking-[-0.045em] text-white md:text-6xl">
              Your AI economics, in one view.
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-white/45 md:text-base">
              Spend, usage, cost drivers, optimization opportunities, benchmarks
              and verified outcomes — brought together in one decision surface.
            </p>
          </motion.div>

          <motion.div
            style={{
              rotateX: rotate,
              scale,
              transformStyle: 'preserve-3d',
              transformOrigin: '50% 60%',
              boxShadow:
                '0 0 #0000004d, 0 9px 20px #0000004a, 0 37px 37px #00000042, 0 84px 50px #00000026, 0 149px 60px #0000000a, 0 233px 65px #00000003',
            }}
            className="relative z-10 mx-auto w-full max-w-[1320px] will-change-transform"
          >
            <div className="overflow-hidden rounded-[30px] border border-white/10 bg-[#060a0f] p-2 shadow-[0_0_100px_rgba(35,191,236,0.08)] md:p-3">
              <img
                src="https://d2ol7oe51mr4n9.cloudfront.net/user_3JOZbCBwNL9bBW0BUCVzdU7w8RP/0260a811-a6bc-4554-96bb-e2e6f5074b6e.webp"
                alt="Evalomics dashboard showing AI spend, usage, cost drivers, optimization opportunities, benchmarks and verified savings"
                width={1200}
                height={675}
                loading="eager"
                fetchPriority="high"
                decoding="async"
                className="block aspect-video h-auto w-full rounded-[22px] object-contain"
                draggable={false}
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
