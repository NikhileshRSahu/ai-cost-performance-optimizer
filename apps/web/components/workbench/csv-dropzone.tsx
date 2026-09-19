'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { CheckCircle2, FileSpreadsheet, UploadCloud, X } from 'lucide-react';
import { useRef, useState, type DragEvent } from 'react';
import { useFormStatus } from 'react-dom';

function SubmitButton({ ready }: { ready: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      className="inline-flex min-h-12 items-center justify-center rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-40"
      type="submit"
      disabled={!ready || pending}
    >
      {pending ? 'Analyzing your AI usage…' : 'Analyze my AI usage'}
    </button>
  );
}

export function CsvDropzone({
  organizationId,
  action,
  demo = false,
}: {
  organizationId: string;
  action: (formData: FormData) => void | Promise<void>;
  demo?: boolean;
}) {
  const reduceMotion = useReducedMotion();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);

  function handleDrop(event: DragEvent<HTMLButtonElement>) {
    event.preventDefault();
    setDragging(false);
    const next = event.dataTransfer.files.item(0);
    if (!next || !inputRef.current) return;
    const transfer = new DataTransfer();
    transfer.items.add(next);
    inputRef.current.files = transfer.files;
    setFile(next);
  }

  return (
    <form action={action} className="grid gap-4">
      <input type="hidden" name="organizationId" value={organizationId} />
      {demo ? <input type="hidden" name="isDemo" value="true" /> : null}
      <input
        ref={inputRef}
        className="sr-only"
        name="usageCsv"
        type="file"
        accept=".csv,text/csv"
        required
        onChange={(e) => {
          setFile(e.target.files?.item(0) ?? null);
        }}
      />
      <motion.button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragEnter={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
        }}
        onDragLeave={() => {
          setDragging(false);
        }}
        onDrop={handleDrop}
        animate={
          reduceMotion
            ? undefined
            : {
                scale: dragging ? 1.008 : 1,
                borderColor: dragging
                  ? 'rgba(110,231,183,.42)'
                  : 'rgba(255,255,255,.12)',
              }
        }
        className="group relative min-h-52 overflow-hidden rounded-[24px] border border-dashed border-white/[0.12] bg-[linear-gradient(145deg,rgba(255,255,255,.028),rgba(255,255,255,.01))] p-5 text-left"
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-0 transition group-hover:opacity-100"
          style={{
            background:
              'radial-gradient(circle at 50% 0%, rgba(110,231,183,.09), transparent 48%)',
          }}
        />
        {file === null ? (
          <div className="relative grid min-h-40 place-items-center text-center">
            <div>
              <motion.span
                animate={reduceMotion ? undefined : { y: [0, -5, 0] }}
                transition={{
                  duration: 2.2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                className="mx-auto grid size-14 place-items-center rounded-[20px] border border-white/[0.08] bg-white/[0.035]"
              >
                <UploadCloud className="size-6 text-emerald-200/80" />
              </motion.span>
              <p className="m-0 mt-4 text-sm font-semibold text-white/88">
                Drop your usage CSV here
              </p>
              <p className="m-0 mt-1 text-xs text-white/38">
                or click to choose · max 10 MiB
              </p>
            </div>
          </div>
        ) : (
          <div className="relative flex min-h-40 items-center gap-4">
            <span className="grid size-14 shrink-0 place-items-center rounded-[20px] border border-emerald-300/18 bg-emerald-300/[0.055]">
              <FileSpreadsheet className="size-6 text-emerald-200" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-200/70">
                <CheckCircle2 className="size-3.5" /> Ready to analyze
              </div>
              <p className="m-0 mt-2 truncate text-sm font-semibold text-white/88">
                {file.name}
              </p>
              <p className="m-0 mt-1 text-xs text-white/35">
                {(file.size / 1024).toFixed(1)} KiB · CSV
              </p>
            </div>
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                if (inputRef.current) inputRef.current.value = '';
                setFile(null);
              }}
              className="grid size-8 place-items-center rounded-full border border-white/10 text-white/40 hover:bg-white/[0.05] hover:text-white"
              aria-label="Remove selected file"
            >
              <X className="size-3.5" />
            </span>
          </div>
        )}
      </motion.button>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="m-0 text-[11px] leading-5 text-white/35">
          We validate the file before any row becomes evidence.
        </p>
        <SubmitButton ready={file !== null} />
      </div>
    </form>
  );
}
