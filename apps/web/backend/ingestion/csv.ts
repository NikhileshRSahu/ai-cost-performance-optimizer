import { parseDecimal } from '../economics/exact.js';
import type {
  Granularity,
  ImportIssue,
  SourceCapability,
  UsageRecord,
} from '../usage/contracts.js';
import { fingerprintRow } from '../usage/fingerprint.js';

export const MAX_BYTES = 10 * 1024 * 1024;
export const MAX_ROWS = 50_000;
export const MAX_CELL = 64 * 1024;

const required = [
  'timestamp_start',
  'timestamp_end',
  'provider',
  'model',
  'requests',
  'total_cost',
  'currency',
] as const;

const optional = [
  'source_event_id',
  'project',
  'workspace',
  'workload',
  'input_tokens',
  'cached_input_tokens',
  'cache_write_tokens',
  'output_tokens',
  'output_cost',
  'tool_calls',
  'tool_cost',
  'successes',
  'failures',
  'latency_p50_ms',
  'latency_p95_ms',
  'granularity',
  'configuration_id',
  'operation_id',
  'attempt_number',
  'retry_count',
  'stable_prefix_hash',
  'stable_prefix_tokens',
  'cache_eligible_input_tokens',
] as const;

const allowed = new Set<string>([...required, ...optional]);

const compatibilityAliases = new Map<string, string>([
  ['timestamp', 'timestamp_start'],
  ['request_id', 'source_event_id'],
  ['cost_usd', 'total_cost'],
  ['latency_ms', 'latency_p50_ms'],
  ['workflow', 'workload'],
]);

const compatibilityEnrichment = new Set([
  'user_or_service',
  'prompt_category',
  'quality_score',
  'status',
  'success',
]);

const integer = /^(0|[1-9]\d{0,25})$/;

function normalizeCompatibilityCsv(rows: string[][]): string[][] {
  const rawHeaders = rows[0];
  if (rawHeaders === undefined) return rows;

  const canonicalHeaders: string[] = [];
  const sources: Array<
    | { kind: 'source'; index: number }
    | { kind: 'timestamp_start'; index: number }
    | { kind: 'timestamp_end'; startIndex: number }
    | { kind: 'currency' }
    | {
        kind: 'successes';
        successIndex: number | null;
        statusIndex: number | null;
        requestsIndex: number;
      }
    | {
        kind: 'failures';
        successIndex: number | null;
        statusIndex: number | null;
        requestsIndex: number;
      }
    | { kind: 'granularity'; requestsIndex: number }
  > = [];

  for (let index = 0; index < rawHeaders.length; index++) {
    const header = rawHeaders[index];
    if (header === undefined) continue;

    if (
      !allowed.has(header) &&
      !compatibilityAliases.has(header) &&
      !compatibilityEnrichment.has(header)
    ) {
      throw new Error(`UNSUPPORTED_COLUMN:${header}`);
    }

    if (compatibilityEnrichment.has(header)) continue;

    const canonical = compatibilityAliases.get(header) ?? header;
    if (canonicalHeaders.includes(canonical)) {
      throw new Error(`DUPLICATE_CANONICAL_COLUMN:${canonical}`);
    }
    canonicalHeaders.push(canonical);
    sources.push(
      header === 'timestamp'
        ? { kind: 'timestamp_start', index }
        : { kind: 'source', index },
    );
  }

  const timestampIndex = rawHeaders.indexOf('timestamp');
  if (timestampIndex >= 0 && !canonicalHeaders.includes('timestamp_end')) {
    canonicalHeaders.push('timestamp_end');
    sources.push({ kind: 'timestamp_end', startIndex: timestampIndex });
  }

  if (
    rawHeaders.includes('cost_usd') &&
    !canonicalHeaders.includes('currency')
  ) {
    canonicalHeaders.push('currency');
    sources.push({ kind: 'currency' });
  }

  const successIndex = rawHeaders.indexOf('success');
  const statusIndex = rawHeaders.indexOf('status');
  const requestsIndex = rawHeaders.indexOf('requests');
  if (
    (successIndex >= 0 || statusIndex >= 0) &&
    !canonicalHeaders.includes('successes')
  ) {
    canonicalHeaders.push('successes');
    sources.push({
      kind: 'successes',
      successIndex: successIndex >= 0 ? successIndex : null,
      statusIndex: statusIndex >= 0 ? statusIndex : null,
      requestsIndex,
    });
  }
  if (
    (successIndex >= 0 || statusIndex >= 0) &&
    !canonicalHeaders.includes('failures')
  ) {
    canonicalHeaders.push('failures');
    sources.push({
      kind: 'failures',
      successIndex: successIndex >= 0 ? successIndex : null,
      statusIndex: statusIndex >= 0 ? statusIndex : null,
      requestsIndex,
    });
  }

  if (timestampIndex >= 0 && !canonicalHeaders.includes('granularity')) {
    canonicalHeaders.push('granularity');
    sources.push({ kind: 'granularity', requestsIndex });
  }

  const normalizedRows = rows.slice(1).map((row) =>
    sources.map((source) => {
      if (source.kind === 'source') return row[source.index] ?? '';
      if (source.kind === 'timestamp_start') {
        const raw = (row[source.index] ?? '').trim();
        if (raw === '') return raw;
        if (/(Z|[+-]\d\d:\d\d)$/.test(raw)) return raw;

        const parsed = Date.parse(raw + 'Z');
        return Number.isFinite(parsed) ? new Date(parsed).toISOString() : raw;
      }
      if (source.kind === 'currency') return 'USD';
      if (source.kind === 'granularity') {
        const rawRequests = (row[source.requestsIndex] ?? '').trim();
        return rawRequests === '1' ? 'REQUEST' : 'AGGREGATE_BUCKET';
      }

      if (source.kind === 'timestamp_end') {
        const rawStart = (row[source.startIndex] ?? '').trim();
        const normalizedStart =
          rawStart !== '' && !/(Z|[+-]\d\d:\d\d)$/.test(rawStart)
            ? rawStart + 'Z'
            : rawStart;
        const parsed = Date.parse(normalizedStart);
        return Number.isFinite(parsed)
          ? new Date(parsed + 1).toISOString()
          : rawStart;
      }

      const successValue =
        source.successIndex === null
          ? null
          : (row[source.successIndex] ?? '').trim().toLowerCase();
      const statusValue =
        source.statusIndex === null
          ? null
          : (row[source.statusIndex] ?? '').trim().toLowerCase();

      const succeeded =
        successValue === 'true' ||
        successValue === '1' ||
        (successValue === null && statusValue === 'success');

      const rowRequests = (row[source.requestsIndex] ?? '').trim();
      const outcomeCount = integer.test(rowRequests) ? rowRequests : '1';
      return source.kind === 'successes'
        ? succeeded
          ? outcomeCount
          : '0'
        : succeeded
          ? '0'
          : outcomeCount;
    }),
  );

  return [canonicalHeaders, ...normalizedRows];
}

function parseCsvText(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === undefined) break;

    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i++;
        } else {
          quoted = false;
        }
      } else {
        cell += c;
      }
    } else if (c === '"') {
      quoted = true;
    } else if (c === ',') {
      row.push(cell);
      cell = '';
    } else if (c === '\n') {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
    } else if (c !== '\r') {
      cell += c;
    }
  }

  if (quoted) throw new Error('UNCLOSED_QUOTE');

  if (cell.length || row.length) {
    row.push(cell);
    rows.push(row);
  }

  return rows;
}

function value(row: string[], headers: string[], key: string): string | null {
  const index = headers.indexOf(key);
  if (index < 0) return null;
  const v = row[index] ?? '';
  return v === '' ? null : v;
}

function ensureMoney(v: string, nonNegative = true): void {
  const r = parseDecimal(v);
  if (nonNegative && r.numerator < 0n) {
    throw new Error('NEGATIVE_MONEY');
  }
}

function ensureInteger(v: string | null, key: string): void {
  if (v !== null && !integer.test(v)) {
    throw new Error(`INVALID_${key.toUpperCase()}`);
  }
}

export type ParsedCsv = Readonly<{
  records: UsageRecord[];
  issues: ImportIssue[];
  capabilities: SourceCapability;
}>;

function sourceCapabilities(headers: readonly string[]): SourceCapability {
  return Object.freeze({
    requestGranularity: headers.includes('granularity'),
    model: true,
    projectOrWorkspace:
      headers.includes('project') || headers.includes('workspace'),
    apiKeyIdentifier: false,
    tokenClasses:
      headers.includes('input_tokens') ||
      headers.includes('cached_input_tokens') ||
      headers.includes('cache_write_tokens') ||
      headers.includes('output_tokens'),
    cost: true,
    latency:
      headers.includes('latency_p50_ms') || headers.includes('latency_p95_ms'),
    success: headers.includes('successes') || headers.includes('failures'),
    toolUsage: headers.includes('tool_calls') || headers.includes('tool_cost'),
    stableEventIdentifier: headers.includes('source_event_id'),
  });
}

export function parseUsageCsv(
  bytes: Uint8Array,
  organizationId: string,
  isDemo = false,
): ParsedCsv {
  if (bytes.byteLength > MAX_BYTES) throw new Error('FILE_TOO_LARGE');

  const text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  const parsedRows = parseCsvText(text);

  if (parsedRows.length === 0) throw new Error('EMPTY_CSV');

  const rows = normalizeCompatibilityCsv(parsedRows);
  const headers = rows[0];
  if (headers === undefined) throw new Error('EMPTY_CSV');
  if (new Set(headers).size !== headers.length) {
    throw new Error('DUPLICATE_HEADER');
  }

  for (const requiredHeader of required) {
    if (!headers.includes(requiredHeader)) {
      throw new Error(`MISSING_COLUMN:${requiredHeader}`);
    }
  }

  if (rows.length - 1 > MAX_ROWS) throw new Error('TOO_MANY_ROWS');

  const records: UsageRecord[] = [];
  const issues: ImportIssue[] = [];

  for (let i = 1; i < rows.length; i++) {
    const line = i + 1;
    const row = rows[i];
    if (row === undefined) continue;

    try {
      if (row.length !== headers.length) {
        throw new Error('COLUMN_COUNT_MISMATCH');
      }

      if (row.some((cellValue) => cellValue.length > MAX_CELL)) {
        throw new Error('CELL_TOO_LARGE');
      }

      const start = value(row, headers, 'timestamp_start');
      const end = value(row, headers, 'timestamp_end');

      if (
        !start ||
        !end ||
        !Number.isFinite(Date.parse(start)) ||
        !Number.isFinite(Date.parse(end))
      ) {
        throw new Error('INVALID_TIMESTAMP');
      }

      if (
        !/(Z|[+-]\d\d:\d\d)$/.test(start) ||
        !/(Z|[+-]\d\d:\d\d)$/.test(end)
      ) {
        throw new Error('TIMESTAMP_OFFSET_REQUIRED');
      }

      if (Date.parse(end) <= Date.parse(start)) {
        throw new Error('INVALID_INTERVAL');
      }

      const requests = value(row, headers, 'requests');
      if (!requests || !integer.test(requests)) {
        throw new Error('INVALID_REQUESTS');
      }

      const totalCost = value(row, headers, 'total_cost');
      if (!totalCost) throw new Error('MISSING_TOTAL_COST');
      ensureMoney(totalCost);

      const currency = value(row, headers, 'currency');
      if (!currency || !/^[A-Z]{3}$/.test(currency)) {
        throw new Error('INVALID_CURRENCY');
      }
      const supportedCurrencies = Intl.supportedValuesOf('currency');
      if (!supportedCurrencies.includes(currency)) {
        throw new Error('UNSUPPORTED_CURRENCY');
      }

      const countKeys = [
        'input_tokens',
        'cached_input_tokens',
        'cache_write_tokens',
        'output_tokens',
        'tool_calls',
        'successes',
        'failures',
        'attempt_number',
        'retry_count',
        'stable_prefix_tokens',
        'cache_eligible_input_tokens',
      ];

      for (const key of countKeys) {
        ensureInteger(value(row, headers, key), key);
      }

      const attempt = value(row, headers, 'attempt_number');
      if (attempt === '0') throw new Error('ATTEMPT_NUMBER_MIN_1');

      for (const key of ['output_cost', 'tool_cost']) {
        const v = value(row, headers, key);
        if (v !== null) ensureMoney(v);
      }

      const successes = value(row, headers, 'successes');
      const failures = value(row, headers, 'failures');

      if (
        successes !== null &&
        failures !== null &&
        BigInt(successes) + BigInt(failures) > BigInt(requests)
      ) {
        throw new Error('OUTCOMES_EXCEED_REQUESTS');
      }

      const granularity = (value(row, headers, 'granularity') ??
        'AGGREGATE_BUCKET') as Granularity;

      if (!['REQUEST', 'AGGREGATE_BUCKET'].includes(granularity)) {
        throw new Error('INVALID_GRANULARITY');
      }

      if (granularity === 'REQUEST' && requests !== '1') {
        throw new Error('REQUEST_GRANULARITY_REQUIRES_ONE_ATTEMPT');
      }

      const raw: Record<string, string | null> = {
        intervalStart: start,
        intervalEnd: end,
        provider: value(row, headers, 'provider'),
        model: value(row, headers, 'model'),
        requests,
        totalCost,
        currency,
        sourceEventId: value(row, headers, 'source_event_id'),
        project: value(row, headers, 'project'),
        workspace: value(row, headers, 'workspace'),
        workload: value(row, headers, 'workload'),
        configurationId: value(row, headers, 'configuration_id'),
        operationId: value(row, headers, 'operation_id'),
        attemptNumber: attempt,
        retryCount: value(row, headers, 'retry_count'),
        inputTokens: value(row, headers, 'input_tokens'),
        cachedInputTokens: value(row, headers, 'cached_input_tokens'),
        cacheWriteTokens: value(row, headers, 'cache_write_tokens'),
        outputTokens: value(row, headers, 'output_tokens'),
        outputCost: value(row, headers, 'output_cost'),
        toolCalls: value(row, headers, 'tool_calls'),
        toolCost: value(row, headers, 'tool_cost'),
        successes,
        failures,
        latencyP50Ms: value(row, headers, 'latency_p50_ms'),
        latencyP95Ms: value(row, headers, 'latency_p95_ms'),
        granularity,
        stablePrefixHash: value(row, headers, 'stable_prefix_hash'),
        stablePrefixTokens: value(row, headers, 'stable_prefix_tokens'),
        cacheEligibleInputTokens: value(
          row,
          headers,
          'cache_eligible_input_tokens',
        ),
      };

      if (!raw.provider || !raw.model) {
        throw new Error('MISSING_PROVIDER_OR_MODEL');
      }

      const fingerprint = fingerprintRow(raw);

      records.push({
        organizationId,
        source: 'CSV',
        granularity,
        intervalStart: start,
        intervalEnd: end,
        provider: raw.provider,
        model: raw.model,
        requests,
        totalCost,
        currency,
        sourceEventId: raw.sourceEventId ?? null,
        project: raw.project ?? null,
        workspace: raw.workspace ?? null,
        workload: raw.workload ?? null,
        configurationId: raw.configurationId ?? null,
        operationId: raw.operationId ?? null,
        attemptNumber: raw.attemptNumber ?? null,
        retryCount: raw.retryCount ?? null,
        inputTokens: raw.inputTokens ?? null,
        cachedInputTokens: raw.cachedInputTokens ?? null,
        cacheWriteTokens: raw.cacheWriteTokens ?? null,
        outputTokens: raw.outputTokens ?? null,
        outputCost: raw.outputCost ?? null,
        toolCalls: raw.toolCalls ?? null,
        toolCost: raw.toolCost ?? null,
        successes: raw.successes ?? null,
        failures: raw.failures ?? null,
        latencyP50Ms: raw.latencyP50Ms ?? null,
        latencyP95Ms: raw.latencyP95Ms ?? null,
        stablePrefixHash: raw.stablePrefixHash ?? null,
        stablePrefixTokens: raw.stablePrefixTokens ?? null,
        cacheEligibleInputTokens: raw.cacheEligibleInputTokens ?? null,
        sourceLine: line,
        fingerprint,
        isDemo,
      });
    } catch (error) {
      issues.push({
        line,
        code: error instanceof Error ? error.message : 'ROW_ERROR',
        message: 'Row rejected by CSV contract',
      });
    }
  }

  return { records, issues, capabilities: sourceCapabilities(headers) };
}
