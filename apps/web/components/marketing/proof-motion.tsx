'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { CheckCircle2, FlaskConical, ScanSearch, ShieldCheck } from 'lucide-react';

const proofCards = [
  {
    eyebrow: 'Visibility',
    title: 'See where AI spend actually goes.',
    body: 'Requests, models, repeated input, and cost drivers become one readable operating picture.',
    accent: 'cyan',
    icon: ScanSearch,
    visual: 'flow',
  },
  {
    eyebrow: 'Testing',
    title: 'Test changes before you trust them.',
    body: 'Candidate optimizations move through a declared quality floor before they can become a stronger claim.',
    accent: 'amber',
    icon: FlaskConical,
    visual: 'gate',
  },
  {
    eyebrow: 'Verification',
    title: 'Potential is not verified savings.',
    body: 'Evalomics keeps modeled, tested, and production-verified outcomes visibly separate.',
    accent: 'verified',
    icon: ShieldCheck,
    visual: 'proof',
  },
] as const;

function ProofVisual({ visual }: { visual: 'flow' | 'gate' | 'proof' }) {
  if (visual === 'flow') {
    return (
      <div className="eval-proof-visual eval-proof-visual--flow" aria-hidden="true">
        <div className="eval-proof-flow-source">
          <span>User requests</span><span>System prompt</span><span>RAG context</span><span>Tool calls</span>
        </div>
        <div className="eval-proof-flow-lines">
          {Array.from({ length: 6 }).map((_, index) => <i key={index} />)}
        </div>
        <div className="eval-proof-flow-output">
          <b>Repeated input</b><b>Long context</b><b>Model mismatch</b>
        </div>
      </div>
    );
  }

  if (visual === 'gate') {
    return (
      <div className="eval-proof-visual eval-proof-visual--gate" aria-hidden="true">
        <div><small>Current</small><strong>$1.00</strong></div>
        <span className="eval-proof-gate-line" />
        <span className="eval-proof-gate-core"><CheckCircle2 size={24} /></span>
        <span className="eval-proof-gate-line is-right" />
        <div className="is-right"><small>Candidate</small><strong>$0.28</strong></div>
      </div>
    );
  }

  return (
    <div className="eval-proof-visual eval-proof-visual--states" aria-hidden="true">
      <div><span>Potential</span><strong>$286–$421</strong></div>
      <div><span>Tested</span><strong>$142.17</strong></div>
      <div className="is-verified"><span>Verified</span><strong>$109.32</strong></div>
    </div>
  );
}

export function ProofMotion() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="eval-proof-section" aria-labelledby="eval-proof-title">
      <div className="eval-proof-heading">
        <span>Proof, not promises</span>
        <h2 id="eval-proof-title">What Evalomics makes visible.</h2>
        <p>
          Product evidence should get stronger as it moves from observation to testing
          to production verification. These are three different jobs — and Evalomics
          keeps them separate.
        </p>
      </div>

      <div className="eval-proof-grid">
        {proofCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <motion.article
              key={card.title}
              initial={reduceMotion ? false : { opacity: 0, y: 28, scale: 0.97 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, amount: 0.28 }}
              whileHover={reduceMotion ? undefined : { y: -7, scale: 1.01 }}
              transition={
                reduceMotion
                  ? { duration: 0 }
                  : { type: 'spring', visualDuration: 0.55, bounce: 0.12, delay: index * 0.08 }
              }
              className={'eval-proof-card eval-proof-card--' + card.accent}
            >
              <div className="eval-proof-card__top">
                <span className="eval-proof-card__icon"><Icon size={17} /></span>
                <span>{card.eyebrow}</span>
              </div>
              <ProofVisual visual={card.visual} />
              <div className="eval-proof-card__copy">
                <h3>{card.title}</h3>
                <p>{card.body}</p>
              </div>
            </motion.article>
          );
        })}
      </div>

      <p className="eval-proof-disclaimer">
        Demo values illustrate the evidence states. They are not presented as verified customer savings.
      </p>
    </section>
  );
}
