import { z } from 'zod';

const usageResultSchema = z.object({
  uncached_input_tokens: z.number().int().nonnegative(),
  cache_creation: z
    .object({
      ephemeral_1h_input_tokens: z.number().int().nonnegative().default(0),
      ephemeral_5m_input_tokens: z.number().int().nonnegative().default(0),
    })
    .default({
      ephemeral_1h_input_tokens: 0,
      ephemeral_5m_input_tokens: 0,
    }),
  cache_read_input_tokens: z.number().int().nonnegative().default(0),
  output_tokens: z.number().int().nonnegative(),
  server_tool_use: z
    .object({
      web_search_requests: z.number().int().nonnegative().default(0),
    })
    .default({ web_search_requests: 0 }),
  api_key_id: z.string().nullable().optional(),
  workspace_id: z.string().nullable().optional(),
  model: z.string().nullable().optional(),
  service_tier: z.string().nullable().optional(),
  context_window: z.string().nullable().optional(),
});

const usageBucketSchema = z.object({
  starting_at: z.iso.datetime({ offset: true }),
  ending_at: z.iso.datetime({ offset: true }),
  results: z.array(usageResultSchema),
});

const usagePageSchema = z.object({
  data: z.array(usageBucketSchema),
  has_more: z.boolean(),
  next_page: z.string().nullable(),
});

const costResultSchema = z.object({
  amount: z.string().regex(/^\d+(\.\d+)?$/),
  currency: z.string().min(3),
  cost_type: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  workspace_id: z.string().nullable().optional(),
  model: z.string().nullable().optional(),
  service_tier: z.string().nullable().optional(),
  token_type: z.string().nullable().optional(),
  context_window: z.string().nullable().optional(),
  inference_geo: z.string().nullable().optional(),
});

const costBucketSchema = z.object({
  starting_at: z.iso.datetime({ offset: true }),
  ending_at: z.iso.datetime({ offset: true }),
  results: z.array(costResultSchema),
});

const costPageSchema = z.object({
  data: z.array(costBucketSchema),
  has_more: z.boolean(),
  next_page: z.string().nullable(),
});

export type AnthropicAdminJson = Readonly<Record<string, unknown>>;

export type AnthropicAdminResponse = Readonly<{
  ok: boolean;
  status: number;
  json: () => AnthropicAdminJson | Promise<AnthropicAdminJson>;
}>;

export type AnthropicAdminFetch = (
  url: string,
  init: Readonly<{
    headers: Readonly<Record<string, string>>;
  }>,
) => AnthropicAdminResponse | Promise<AnthropicAdminResponse>;

export type AnthropicUsageEvidence = Readonly<{
  intervalStart: string;
  intervalEnd: string;
  uncachedInputTokens: string;
  cacheCreationOneHourInputTokens: string;
  cacheCreationFiveMinuteInputTokens: string;
  cacheReadInputTokens: string;
  outputTokens: string;
  webSearchRequests: string;
  apiKeyId: string | null;
  workspaceId: string | null;
  model: string | null;
  serviceTier: string | null;
  contextWindow: string | null;
}>;

export type AnthropicCostEvidence = Readonly<{
  intervalStart: string;
  intervalEnd: string;
  amountLowestUnit: string;
  currency: string;
  costType: string | null;
  description: string | null;
  workspaceId: string | null;
  model: string | null;
  serviceTier: string | null;
  tokenType: string | null;
  contextWindow: string | null;
  inferenceGeo: string | null;
}>;

export type AnthropicAdminSnapshot = Readonly<{
  usage: readonly AnthropicUsageEvidence[];
  costs: readonly AnthropicCostEvidence[];
}>;

const defaultFetch: AnthropicAdminFetch = async (url, init) => {
  const response = await fetch(url, {
    method: 'GET',
    headers: init.headers,
  });

  return {
    ok: response.ok,
    status: response.status,
    json: () => response.json() as Promise<AnthropicAdminJson>,
  };
};

async function getJson(
  fetcher: AnthropicAdminFetch,
  url: string,
  adminKey: string,
): Promise<unknown> {
  const response = await fetcher(url, {
    headers: {
      'x-api-key': adminKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`ANTHROPIC_ADMIN_API_${response.status}`);
  }

  return response.json();
}

function addPage(url: URL, page: string | null): string {
  if (page !== null) {
    url.searchParams.set('page', page);
  }
  return url.toString();
}

function validateInterval(startingAt: string, endingAt: string): void {
  const start = Date.parse(startingAt);
  const end = Date.parse(endingAt);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
    throw new Error('ANTHROPIC_ADMIN_API_INVALID_INTERVAL');
  }
}

async function fetchUsage(
  fetcher: AnthropicAdminFetch,
  adminKey: string,
  startingAt: string,
  endingAt: string,
): Promise<AnthropicUsageEvidence[]> {
  const base = new URL(
    'https://api.anthropic.com/v1/organizations/usage_report/messages',
  );
  base.searchParams.set('starting_at', startingAt);
  base.searchParams.set('ending_at', endingAt);
  base.searchParams.set('bucket_width', '1d');
  base.searchParams.set('limit', '31');
  for (const dimension of [
    'api_key_id',
    'workspace_id',
    'model',
    'service_tier',
  ]) {
    base.searchParams.append('group_by[]', dimension);
  }

  const evidence: AnthropicUsageEvidence[] = [];
  let page: string | null = null;

  do {
    const parsed = usagePageSchema.parse(
      await getJson(fetcher, addPage(new URL(base), page), adminKey),
    );

    for (const bucket of parsed.data) {
      for (const result of bucket.results) {
        evidence.push(
          Object.freeze({
            intervalStart: bucket.starting_at,
            intervalEnd: bucket.ending_at,
            uncachedInputTokens: String(result.uncached_input_tokens),
            cacheCreationOneHourInputTokens: String(
              result.cache_creation.ephemeral_1h_input_tokens,
            ),
            cacheCreationFiveMinuteInputTokens: String(
              result.cache_creation.ephemeral_5m_input_tokens,
            ),
            cacheReadInputTokens: String(result.cache_read_input_tokens),
            outputTokens: String(result.output_tokens),
            webSearchRequests: String(
              result.server_tool_use.web_search_requests,
            ),
            apiKeyId: result.api_key_id ?? null,
            workspaceId: result.workspace_id ?? null,
            model: result.model ?? null,
            serviceTier: result.service_tier ?? null,
            contextWindow: result.context_window ?? null,
          }),
        );
      }
    }

    page = parsed.has_more ? parsed.next_page : null;
    if (parsed.has_more && page === null) {
      throw new Error('ANTHROPIC_ADMIN_API_MISSING_NEXT_PAGE');
    }
  } while (page !== null);

  return evidence;
}

async function fetchCosts(
  fetcher: AnthropicAdminFetch,
  adminKey: string,
  startingAt: string,
  endingAt: string,
): Promise<AnthropicCostEvidence[]> {
  const base = new URL(
    'https://api.anthropic.com/v1/organizations/cost_report',
  );
  base.searchParams.set('starting_at', startingAt);
  base.searchParams.set('ending_at', endingAt);
  base.searchParams.set('bucket_width', '1d');
  base.searchParams.set('limit', '31');
  base.searchParams.append('group_by[]', 'workspace_id');
  base.searchParams.append('group_by[]', 'description');

  const evidence: AnthropicCostEvidence[] = [];
  let page: string | null = null;

  do {
    const parsed = costPageSchema.parse(
      await getJson(fetcher, addPage(new URL(base), page), adminKey),
    );

    for (const bucket of parsed.data) {
      for (const result of bucket.results) {
        evidence.push(
          Object.freeze({
            intervalStart: bucket.starting_at,
            intervalEnd: bucket.ending_at,
            amountLowestUnit: result.amount,
            currency: result.currency.toUpperCase(),
            costType: result.cost_type ?? null,
            description: result.description ?? null,
            workspaceId: result.workspace_id ?? null,
            model: result.model ?? null,
            serviceTier: result.service_tier ?? null,
            tokenType: result.token_type ?? null,
            contextWindow: result.context_window ?? null,
            inferenceGeo: result.inference_geo ?? null,
          }),
        );
      }
    }

    page = parsed.has_more ? parsed.next_page : null;
    if (parsed.has_more && page === null) {
      throw new Error('ANTHROPIC_ADMIN_API_MISSING_NEXT_PAGE');
    }
  } while (page !== null);

  return evidence;
}

export async function fetchAnthropicAdminSnapshot(
  input: Readonly<{
    adminKey: string;
    startingAt: string;
    endingAt: string;
    fetcher?: AnthropicAdminFetch;
  }>,
): Promise<AnthropicAdminSnapshot> {
  if (input.adminKey.trim().length === 0) {
    throw new Error('ANTHROPIC_ADMIN_KEY_REQUIRED');
  }
  validateInterval(input.startingAt, input.endingAt);

  const fetcher = input.fetcher ?? defaultFetch;
  const [usage, costs] = await Promise.all([
    fetchUsage(fetcher, input.adminKey, input.startingAt, input.endingAt),
    fetchCosts(fetcher, input.adminKey, input.startingAt, input.endingAt),
  ]);

  return Object.freeze({
    usage: Object.freeze(usage),
    costs: Object.freeze(costs),
  });
}
