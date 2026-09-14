import { createHash } from 'node:crypto';
import type { UsageRecord } from '../usage/contracts.js';

export type PublicCostTraceRow = Readonly<{
  timestamp: string;
  task: string;
  model: string;
  promptTokens: string;
  completionTokens: string;
  cachedPromptTokens: string;
  usd: string;
  latencyMs: string;
  ok: '1';
}>;

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;

  for (let index = 0; index < text.length; index++) {
    const character = text[index];
    if (character === undefined) break;

    if (quoted) {
      if (character === '"') {
        if (text[index + 1] === '"') {
          cell += '"';
          index++;
        } else {
          quoted = false;
        }
      } else {
        cell += character;
      }
    } else if (character === '"') {
      quoted = true;
    } else if (character === ',') {
      row.push(cell);
      cell = '';
    } else if (character === '\n') {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
    } else if (character !== '\r') {
      cell += character;
    }
  }

  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }

  return rows;
}

function exactCell(
  row: readonly string[],
  headers: readonly string[],
  key: string,
): string {
  const index = headers.indexOf(key);
  if (index < 0) throw new Error(`MISSING_RESEARCH_COLUMN:${key}`);
  return row[index] ?? '';
}

function normalizedTimestamp(value: string): string {
  const candidate = value.trim().replace(' ', 'T') + 'Z';
  if (!Number.isFinite(Date.parse(candidate))) {
    throw new Error('INVALID_RESEARCH_TIMESTAMP');
  }
  return candidate;
}

function sourceFingerprint(row: PublicCostTraceRow): string {
  return createHash('sha256')
    .update(
      [
        row.timestamp,
        row.task,
        row.model,
        row.promptTokens,
        row.completionTokens,
        row.cachedPromptTokens,
        row.usd,
        row.latencyMs,
      ].join('|'),
    )
    .digest('hex');
}

export function parsePublicCostTrace(
  csv: string,
): readonly PublicCostTraceRow[] {
  const rows = parseCsv(csv);
  const headers = rows.shift();
  if (headers === undefined) throw new Error('EMPTY_RESEARCH_CSV');

  const normalized: PublicCostTraceRow[] = [];
  for (const row of rows) {
    if (row.every((cell) => cell.trim().length === 0)) continue;
    const ok = exactCell(row, headers, 'ok');
    const usd = exactCell(row, headers, 'usd');
    const promptTokens = exactCell(row, headers, 'prompt_tokens');
    const completionTokens = exactCell(row, headers, 'completion_tokens');

    // Missing billing/token evidence is excluded rather than converted to zero.
    if (
      ok !== '1' ||
      usd.trim().length === 0 ||
      promptTokens.trim().length === 0 ||
      completionTokens.trim().length === 0
    ) {
      continue;
    }

    normalized.push(
      Object.freeze({
        timestamp: exactCell(row, headers, 'timestamp'),
        task: exactCell(row, headers, 'task'),
        model: exactCell(row, headers, 'model'),
        promptTokens,
        completionTokens,
        cachedPromptTokens:
          exactCell(row, headers, 'cached_prompt_tokens') || '0',
        usd,
        latencyMs: exactCell(row, headers, 'latency_ms'),
        ok: '1' as const,
      }),
    );
  }

  return Object.freeze(normalized);
}

export function toResearchUsageRecords(
  rows: readonly PublicCostTraceRow[],
  organizationId = 'public-research-validation',
): readonly UsageRecord[] {
  return Object.freeze(
    rows.map((row, index) => {
      const start = normalizedTimestamp(row.timestamp);
      const latencyMs = Number(row.latencyMs);
      if (!Number.isFinite(latencyMs) || latencyMs < 0) {
        throw new Error('INVALID_RESEARCH_LATENCY');
      }
      const end = new Date(
        Date.parse(start) + Math.max(1, latencyMs),
      ).toISOString();
      const cached = BigInt(row.cachedPromptTokens);
      const input = BigInt(row.promptTokens);

      return Object.freeze({
        organizationId,
        source: 'CSV' as const,
        granularity: 'REQUEST' as const,
        intervalStart: start,
        intervalEnd: end,
        provider: 'public-research-benchmark',
        model: row.model,
        requests: '1',
        totalCost: row.usd,
        currency: 'USD',
        sourceEventId: `ainetcafe:${sourceFingerprint(row)}`,
        project: 'PUBLIC_RESEARCH_TRACE',
        workspace: 'mario0369/llm-cost-same-prompt',
        workload: row.task,
        configurationId: null,
        operationId: null,
        attemptNumber: null,
        retryCount: null,
        inputTokens: row.promptTokens,
        cachedInputTokens: row.cachedPromptTokens,
        cacheWriteTokens: null,
        outputTokens: row.completionTokens,
        outputCost: null,
        toolCalls: null,
        toolCost: null,
        successes: '1',
        failures: '0',
        latencyP50Ms: row.latencyMs,
        latencyP95Ms: row.latencyMs,
        stablePrefixHash: null,
        stablePrefixTokens: null,
        cacheEligibleInputTokens:
          input > 0n
            ? input.toString()
            : cached > 0n
              ? cached.toString()
              : null,
        sourceLine: index + 2,
        fingerprint: sourceFingerprint(row),
        isDemo: false,
      });
    }),
  );
}
