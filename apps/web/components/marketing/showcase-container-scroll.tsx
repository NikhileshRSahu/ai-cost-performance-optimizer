'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

export function ShowcaseContainerScroll({
  copy,
  children,
}: Readonly<{
  copy: React.ReactNode;
  children: React.ReactNode;
}>) {
  const containerRef = useRef<HTMLElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  const { scrollYProgress } = useScroll({
    target: containerRef,
  });

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
      ref={containerRef}
      className="eval-template-showcase eval-template-showcase--scroll"
      style={{ minHeight: isMobile ? '60rem' : '80rem', padding: 0 }}
    >
      <div
        className="eval-template-showcase-frame"
        style={{
          perspective: '1000px',
          position: 'sticky',
          top: 0,
          height: '100vh',
          minHeight: '100vh',
        }}
      >
        <div className="eval-template-showcase-glow eval-motion-decorative" />

        <motion.div
          className="eval-template-showcase-copy"
          style={{ translateY: translate }}
        >
          {copy}
        </motion.div>

        <motion.div
          className="eval-template-showcase-layers"
          style={{
            rotateX: rotate,
            scale,
            transformStyle: 'preserve-3d',
            transformOrigin: '50% 62%',
            boxShadow:
              '0 0 #0000004d, 0 9px 20px #0000004a, 0 37px 37px #00000042, 0 84px 50px #00000026, 0 149px 60px #0000000a, 0 233px 65px #00000003',
          }}
        >
          {children}
        </motion.div>
      </div>
    </section>
  );
}
