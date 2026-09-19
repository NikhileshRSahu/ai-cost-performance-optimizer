'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { useMemo, useRef, useState } from 'react';

type EvidenceState = 'OBSERVED' | 'POTENTIAL' | 'TESTED' | 'VERIFIED';

type Metric = Readonly<{
  id: EvidenceState;
  label: string;
  value: string;
  note: string;
}>;

const stateClass: Record<EvidenceState, string> = {
  OBSERVED: 'eval-metric-widget--observed',
  POTENTIAL: 'eval-metric-widget--potential',
  TESTED: 'eval-metric-widget--tested',
  VERIFIED: 'eval-metric-widget--verified',
};

export function DraggableMetricGrid({
  observedSpend,
  observedSource,
  modeledUpside,
  testedSavings,
  verifiedSavings,
}: Readonly<{
  observedSpend: string;
  observedSource: string;
  modeledUpside: string;
  testedSavings: string;
  verifiedSavings: string;
}>) {
  const reduceMotion = useReducedMotion();
  const metrics = useMemo<Metric[]>(
    () => [
      {
        id: 'OBSERVED',
        label: 'Observed spend',
        value: observedSpend,
        note: observedSource,
      },
      {
        id: 'POTENTIAL',
        label: 'Biggest modeled upside',
        value: modeledUpside,
        note: 'Planning evidence only',
      },
      {
        id: 'TESTED',
        label: 'Tested saving',
        value: testedSavings,
        note: 'Quality-gated benchmark',
      },
      {
        id: 'VERIFIED',
        label: 'Verified saving',
        value: verifiedSavings,
        note: 'Production reconciliation',
      },
    ],
    [modeledUpside, observedSource, observedSpend, testedSavings, verifiedSavings],
  );

  const [order, setOrder] = useState<EvidenceState[]>([
    'OBSERVED',
    'POTENTIAL',
    'TESTED',
    'VERIFIED',
  ]);
  const nodes = useRef(new Map<EvidenceState, HTMLDivElement>());

  function swapWithClosest(id: EvidenceState, x: number, y: number) {
    let closest: EvidenceState | null = null;
    let best = Number.POSITIVE_INFINITY;

    for (const otherId of order) {
      if (otherId === id) continue;
      const node = nodes.current.get(otherId);
      if (!node) continue;
      const rect = node.getBoundingClientRect();
      const distance = Math.hypot(
        rect.left + rect.width / 2 - x,
        rect.top + rect.height / 2 - y,
      );
      if (distance < best) {
        best = distance;
        closest = otherId;
      }
    }

    if (closest === null) return;
    setOrder((current) => {
      const next = [...current];
      const from = next.indexOf(id);
      const to = next.indexOf(closest as EvidenceState);
      if (from < 0 || to < 0) return current;
      [next[from], next[to]] = [next[to], next[from]];
      return next;
    });
  }

  const byId = new Map(metrics.map((metric) => [metric.id, metric]));

  return (
    <section aria-label="Cost evidence metrics">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="m-0 text-[10px] font-semibold uppercase tracking-[0.15em] text-white/28">
          Evidence dashboard
        </p>
        <p className="m-0 hidden text-[10px] text-white/24 sm:block">
          Drag cards to rearrange
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {order.map((id, index) => {
          const metric = byId.get(id);
          if (!metric) return null;

          return (
            <motion.div
              key={id}
              ref={(node) => {
                if (node) nodes.current.set(id, node);
                else nodes.current.delete(id);
              }}
              layout
              drag={!reduceMotion}
              dragSnapToOrigin
              dragMomentum={false}
              whileDrag={
                reduceMotion
                  ? undefined
                  : {
                      scale: 1.045,
                      zIndex: 20,
                      boxShadow: '0 28px 70px rgba(0,0,0,.42)',
                    }
              }
              initial={reduceMotion ? false : { opacity: 0, y: 14, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{
                type: 'spring',
                visualDuration: reduceMotion ? 0 : 0.44,
                bounce: 0.12,
                delay: reduceMotion ? 0 : index * 0.035,
              }}
              onDragEnd={(_, info) => {
                swapWithClosest(id, info.point.x, info.point.y);
              }}
              className={`eval-metric-widget ${stateClass[id]}`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="eval-metric-widget__state">{id}</span>
                <span className="eval-metric-widget__grip" aria-hidden="true">
                  ···
                </span>
              </div>
              <p className="eval-metric-widget__label">{metric.label}</p>
              <p className="eval-metric-widget__value">{metric.value}</p>
              <p className="eval-metric-widget__note">{metric.note}</p>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
