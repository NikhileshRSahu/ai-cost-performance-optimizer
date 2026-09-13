import { z } from 'zod';
import type { BenchmarkCase } from './evaluate.js';

const header = [
  'case_id',
  'repetition_id',
  'configuration_id',
  'outcome',
  'quality_score',
  'latency_ms',
  'cost',
  'evaluator_version',
] as const;

const rowSchema = z
  .object({
    case_id: z.string().trim().min(1),
    repetition_id: z.string().trim().min(1),
    configuration_id: z.string().trim().min(1),
    outcome: z.enum(['SUCCESS', 'FAILURE', 'TIMEOUT']),
    quality_score: z.string().trim().nullable(),
    latency_ms: z.string().trim().nullable(),
    cost: z.string().trim().min(1),
    evaluator_version: z.string().trim().min(1),
  })
  .strict();

function parseLine(line: string): string[] {
  const cells: string[] = [];
  let current = '';
  let quoted = false;

  for (let index = 0; index < line.length; index++) {
    const char = line[index];
    if (char === undefined) continue;
    if (quoted) {
      if (char === '"' && line[index + 1] === '"') {
        current += '"';
        index++;
      } else if (char === '"') {
        quoted = false;
      } else {
        current += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === ',') {
      cells.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  if (quoted) throw new Error('BENCHMARK_UNCLOSED_QUOTE');
  cells.push(current);
  return cells;
}

export function parseBenchmarkCsv(bytes: Uint8Array): readonly BenchmarkCase[] {
  const text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter((line) => line.length > 0);

  const first = lines.at(0);
  if (first === undefined) throw new Error('BENCHMARK_EMPTY_CSV');
  const headers = parseLine(first);
  if (headers.join(',') !== header.join(',')) {
    throw new Error('BENCHMARK_HEADER_MISMATCH');
  }

  return Object.freeze(
    lines.slice(1).map((line, offset) => {
      const cells = parseLine(line);
      if (cells.length !== header.length) {
        throw new Error(
          `BENCHMARK_COLUMN_COUNT_MISMATCH:${String(offset + 2)}`,
        );
      }
      const record = Object.fromEntries(
        header.map((key, index) => [key, cells[index] ?? '']),
      );
      if (record.quality_score === '') record.quality_score = null;
      if (record.latency_ms === '') record.latency_ms = null;
      const parsed = rowSchema.parse(record);
      return Object.freeze({
        caseId: parsed.case_id,
        repetitionId: parsed.repetition_id,
        configurationId: parsed.configuration_id,
        outcome: parsed.outcome,
        qualityScore: parsed.quality_score,
        latencyMs: parsed.latency_ms,
        cost: parsed.cost,
        evaluatorVersion: parsed.evaluator_version,
      });
    }),
  );
}
