'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { FlaskConical, ScanSearch, ShieldCheck } from 'lucide-react';

const proofCards = [
  {
    eyebrow: 'Visibility',
    title: 'See where AI spend actually goes.',
    body: 'Requests, models, repeated input, and cost drivers become one readable operating picture.',
    accent: 'cyan',
    icon: ScanSearch,
    image: '/proof/evalomics-proof-visibility.webp',
    alt: 'Evalomics proof visual showing AI usage, total spend, model mix, and cost-driver analysis.',
  },
  {
    eyebrow: 'Testing',
    title: 'Test changes before you trust them.',
    body: 'Candidate optimizations move through a declared quality floor before they can become a stronger claim.',
    accent: 'amber',
    icon: FlaskConical,
    image: '/proof/evalomics-proof-testing.webp',
    alt: 'Evalomics proof visual comparing current and optimized model cost and quality before applying a recommendation.',
  },
  {
    eyebrow: 'Verification',
    title: 'Potential is not verified savings.',
    body: 'Evalomics keeps modeled, tested, and production-verified outcomes visibly separate.',
    accent: 'verified',
    icon: ShieldCheck,
    image: '/proof/evalomics-proof-verification.webp',
    alt: 'Evalomics proof visual showing potential, tested, and verified savings as separate evidence states.',
  },
] as const;

export function ProofMotion() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="eval-proof-section" aria-labelledby="eval-proof-title">
      <div className="eval-proof-heading">
        <span>Proof, not promises</span>
        <h2 id="eval-proof-title">What Evalomics makes visible.</h2>
        <p>
          Product evidence should get stronger as it moves from observation to
          testing to production verification. These are three different jobs —
          and Evalomics keeps them separate.
        </p>
      </div>

      <div className="eval-proof-grid">
        {proofCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <motion.article
              key={card.title}
              initial={
                reduceMotion ? false : { opacity: 0, y: 28, scale: 0.97 }
              }
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, amount: 0.24 }}
              whileHover={reduceMotion ? undefined : { y: -7, scale: 1.01 }}
              transition={
                reduceMotion
                  ? { duration: 0 }
                  : {
                      type: 'spring',
                      visualDuration: 0.55,
                      bounce: 0.12,
                      delay: index * 0.08,
                    }
              }
              className={'eval-proof-card eval-proof-card--' + card.accent}
            >
              <div className="eval-proof-card__top">
                <span className="eval-proof-card__icon">
                  <Icon size={17} />
                </span>
                <span>{card.eyebrow}</span>
              </div>

              <motion.div
                className="eval-proof-card__image-wrap"
                whileHover={reduceMotion ? undefined : { scale: 1.025, y: -2 }}
                transition={{
                  type: 'spring',
                  visualDuration: 0.38,
                  bounce: 0.1,
                }}
              >
                <img
                  src={card.image}
                  alt={card.alt}
                  width={360}
                  height={290}
                  loading="lazy"
                  decoding="async"
                  className="eval-proof-card__image"
                />
              </motion.div>

              <div className="eval-proof-card__copy">
                <h3>{card.title}</h3>
                <p>{card.body}</p>
              </div>
            </motion.article>
          );
        })}
      </div>

      <p className="eval-proof-disclaimer">
        The visual values are synthetic examples that demonstrate product
        states. They are not verified customer savings.
      </p>
    </section>
  );
}
