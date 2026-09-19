'use client';

import {
  Children,
  isValidElement,
  useEffect,
  useMemo,
  useState,
  type DragEvent,
  type ReactNode,
} from 'react';
import { motion } from 'framer-motion';
import { GripVertical, RotateCcw } from 'lucide-react';

export type DashboardWidgetSize = 'sm' | 'wide' | 'tall' | 'lg';

export type DashboardWidgetSpec = Readonly<{
  id: string;
  size: DashboardWidgetSize;
  label: string;
}>;

function spanClass(size: DashboardWidgetSize): string {
  switch (size) {
    case 'wide':
      return 'md:col-span-2';
    case 'tall':
      return 'md:row-span-2';
    case 'lg':
      return 'md:col-span-2 md:row-span-2';
    default:
      return '';
  }
}

function moveBefore(
  order: readonly string[],
  movingId: string,
  targetId: string,
): string[] {
  if (movingId === targetId) return [...order];
  const next = order.filter((id) => id !== movingId);
  const targetIndex = next.indexOf(targetId);
  if (targetIndex < 0) return [...order];
  next.splice(targetIndex, 0, movingId);
  return next;
}

export function DashboardWidgetGrid({
  items,
  storageKey,
  children,
}: Readonly<{
  items: readonly DashboardWidgetSpec[];
  storageKey: string;
  children: ReactNode;
}>) {
  const initialOrder = useMemo(() => items.map((item) => item.id), [items]);
  const childArray = Children.toArray(children);
  const contentById = useMemo(
    () =>
      new Map(items.map((item, index) => [item.id, childArray[index] ?? null])),
    [items, childArray],
  );
  const itemById = useMemo(
    () => new Map(items.map((item) => [item.id, item])),
    [items],
  );

  const [order, setOrder] = useState<string[]>(initialOrder);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [editable, setEditable] = useState(true);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(storageKey);
      if (stored === null) return;
      const parsed = JSON.parse(stored) as unknown;
      if (
        Array.isArray(parsed) &&
        parsed.length === initialOrder.length &&
        parsed.every(
          (value) => typeof value === 'string' && initialOrder.includes(value),
        )
      ) {
        setOrder(parsed);
      }
    } catch {
      // Keep the product usable even when storage is unavailable or stale.
    }
  }, [initialOrder, storageKey]);

  useEffect(() => {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(order));
    } catch {
      // Personalization is optional; rendering must not depend on storage.
    }
  }, [order, storageKey]);

  function resetLayout() {
    setOrder(initialOrder);
  }

  function handleDragStart(event: DragEvent<HTMLDivElement>, id: string) {
    if (!editable) {
      event.preventDefault();
      return;
    }
    setDraggingId(id);
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', id);
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>, targetId: string) {
    if (!editable || draggingId === null || draggingId === targetId) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    setOrder((current) => moveBefore(current, draggingId, targetId));
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDraggingId(null);
  }

  return (
    <section aria-label="Customizable Evalomics dashboard">
      <div className="mb-3 flex items-center justify-between gap-3 border-b border-white/[0.05] pb-3">
        <p className="m-0 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          Dashboard widgets
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setEditable((value) => !value);
            }}
            className="rounded-md border border-white/[0.09] bg-[#111214] px-3 py-2 font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400 transition hover:border-white/[0.16] hover:text-white"
          >
            {editable ? 'Lock layout' : 'Edit layout'}
          </button>
          <button
            type="button"
            onClick={resetLayout}
            className="inline-flex items-center gap-1.5 rounded-md border border-white/[0.09] bg-[#111214] px-3 py-2 font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400 transition hover:border-white/[0.16] hover:text-white"
          >
            <RotateCcw className="size-3" />
            Reset
          </button>
        </div>
      </div>

      <div className="grid auto-rows-[minmax(170px,auto)] grid-cols-1 gap-3 md:grid-cols-4">
        {order.map((id) => {
          const item = itemById.get(id);
          if (item === undefined) return null;
          const content = contentById.get(id);
          const validContent = isValidElement(content) ? content : content;

          return (
            <div
              key={id}
              draggable={editable}
              onDragStart={(event) => {
                handleDragStart(event, id);
              }}
              onDragOver={(event) => {
                handleDragOver(event, id);
              }}
              onDrop={handleDrop}
              onDragEnd={() => {
                setDraggingId(null);
              }}
              className={[
                'group relative min-w-0',
                spanClass(item.size),
                draggingId === id ? 'z-20 opacity-70' : 'z-0',
              ].join(' ')}
              aria-label={item.label}
            >
              <motion.div
                layout
                transition={{
                  layout: {
                    type: 'spring',
                    stiffness: 420,
                    damping: 38,
                  },
                }}
                className="relative h-full"
              >
                {editable ? (
                  <div className="pointer-events-none absolute right-2 top-2 z-20 inline-flex items-center gap-1 rounded border border-white/[0.08] bg-black/70 px-2 py-1 font-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-white/40 opacity-0 backdrop-blur transition group-hover:opacity-100">
                    <GripVertical className="size-3" />
                    drag
                  </div>
                ) : null}
                <div className="h-full [&>*]:h-full">{validContent}</div>
              </motion.div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
