import { z } from 'zod';

const usageResultSchema = z.object({
  object: z.string(),
  input_tokens: z.number().int().nonnegative(),
  output_tokens: z.number().int().nonnegative(),
  input_cached_tokens: z.number().int().nonnegative().default(0),
  num_model_requests: z.number().int().nonnegative(),
  project_id: z.string().nullable().optional(),
  user_id: z.string().nullable().optional(),
  api_key_id: z.string().nullable().optional(),
  model: z.string().nullable().optional(),
  batch: z.boolean().nullable().optional(),
  service_tier: z.string().nullable().optional(),
});

const usageBucketSchema = z.object({
  object: z.string(),
  start_time: z.number().int(),
  end_time: z.number().int(),
  results: z.array(usageResultSchema),
});

const usagePageSchema = z.object({
  object: z.literal('page'),
  data: z.array(usageBucketSchema),
  has_more: z.boolean(),
  next_page: z.string().nullable(),
});

const costResultSchema = z.object({
  object: z.string(),
  amount: z.object({
    value: z.number().nonnegative(),
    currency: z.string().min(3),
  }),
  line_item: z.string().nullable().optional(),
  project_id: z.string().nullable().optional(),
});

const costBucketSchema = z.object({
  object: z.string(),
  start_time: z.number().int(),
  end_time: z.number().int(),
  results: z.array(costResultSchema),
});

const costPageSchema = z.object({
  object: z.literal('page'),
  data: z.array(costBucketSchema),
  has_more: z.boolean(),
  next_page: z.string().nullable(),
});

export type OpenAIAdminResponse = Readonly<{
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
}>;

export type OpenAIAdminFetch = (
  url: string,
  init: Readonly<{
    headers: Readonly<Record<string, string>>;
  }>,
) => OpenAIAdminResponse | Promise<OpenAIAdminResponse>;

export type OpenAIUsageEvidence = Readonly<{
  intervalStart: string;
  intervalEnd: string;
  inputTokens: string;
  outputTokens: string;
  inputCachedTokens: string;
  requests: string;
  projectId: string | null;
  userId: string | null;
  apiKeyId: string | null;
  model: string | null;
  batch: boolean | null;
  serviceTier: string | null;
}>;

export type OpenAICostEvidence = Readonly<{
  intervalStart: string;
  intervalEnd: string;
  amount: string;
  currency: string;
  projectId: string | null;
  lineItem: string | null;
}>;

export type OpenAIAdminSnapshot = Readonly<{
  usage: readonly OpenAIUsageEvidence[];
  costs: readonly OpenAICostEvidence[];
}>;

const defaultFetch: OpenAIAdminFetch = async (url, init) => {
  const response = await fetch(url, {
    method: 'GET',
    headers: init.headers,
  });

  return {
    ok: response.ok,
    status: response.status,
    json: () => response.json() as Promise<unknown>,
  };
};

function isoFromUnix(seconds: number): string {
  return new Date(seconds * 1000).toISOString();
}

function decimalFromNumber(value: number): string {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error('OPENAI_ADMIN_API_INVALID_COST');
  }
  return String(value);
}

async function getJson(
  fetcher: OpenAIAdminFetch,
  url: string,
  adminKey: string,
): Promise<unknown> {
  const response = await fetcher(url, {
    headers: {
      Authorization: `Bearer ${adminKey}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('OPENAI_ADMIN_API_' + String(response.status));
  }

  return response.json();
}

function addPage(url: URL, page: string | null): string {
  if (page !== null) {
    url.searchParams.set('page', page);
  }
  return url.toString();
}

async function fetchUsage(
  fetcher: OpenAIAdminFetch,
  adminKey: string,
  startTime: number,
  endTime: number,
): Promise<OpenAIUsageEvidence[]> {
  const base = new URL(
    'https://api.openai.com/v1/organization/usage/completions',
  );
  base.searchParams.set('start_time', String(startTime));
  base.searchParams.set('end_time', String(endTime));
  base.searchParams.set('bucket_width', '1d');
  base.searchParams.append('group_by', 'project_id');
  base.searchParams.append('group_by', 'model');
  base.searchParams.append('group_by', 'api_key_id');

  const evidence: OpenAIUsageEvidence[] = [];
  let page: string | null = null;

  do {
    const parsed = usagePageSchema.parse(
      await getJson(fetcher, addPage(new URL(base), page), adminKey),
    );

    for (const bucket of parsed.data) {
      for (const result of bucket.results) {
        evidence.push(
          Object.freeze({
            intervalStart: isoFromUnix(bucket.start_time),
            intervalEnd: isoFromUnix(bucket.end_time),
            inputTokens: String(result.input_tokens),
            outputTokens: String(result.output_tokens),
            inputCachedTokens: String(result.input_cached_tokens),
            requests: String(result.num_model_requests),
            projectId: result.project_id ?? null,
            userId: result.user_id ?? null,
            apiKeyId: result.api_key_id ?? null,
            model: result.model ?? null,
            batch: result.batch ?? null,
            serviceTier: result.service_tier ?? null,
          }),
        );
      }
    }

    page = parsed.has_more ? parsed.next_page : null;
    if (parsed.has_more && page === null) {
      throw new Error('OPENAI_ADMIN_API_MISSING_NEXT_PAGE');
    }
  } while (page !== null);

  return evidence;
}

async function fetchCosts(
  fetcher: OpenAIAdminFetch,
  adminKey: string,
  startTime: number,
  endTime: number,
): Promise<OpenAICostEvidence[]> {
  const base = new URL('https://api.openai.com/v1/organization/costs');
  base.searchParams.set('start_time', String(startTime));
  base.searchParams.set('end_time', String(endTime));
  base.searchParams.set('bucket_width', '1d');
  base.searchParams.append('group_by', 'project_id');
  base.searchParams.append('group_by', 'line_item');

  const evidence: OpenAICostEvidence[] = [];
  let page: string | null = null;

  do {
    const parsed = costPageSchema.parse(
      await getJson(fetcher, addPage(new URL(base), page), adminKey),
    );

    for (const bucket of parsed.data) {
      for (const result of bucket.results) {
        evidence.push(
          Object.freeze({
            intervalStart: isoFromUnix(bucket.start_time),
            intervalEnd: isoFromUnix(bucket.end_time),
            amount: decimalFromNumber(result.amount.value),
            currency: result.amount.currency.toUpperCase(),
            projectId: result.project_id ?? null,
            lineItem: result.line_item ?? null,
          }),
        );
      }
    }

    page = parsed.has_more ? parsed.next_page : null;
    if (parsed.has_more && page === null) {
      throw new Error('OPENAI_ADMIN_API_MISSING_NEXT_PAGE');
    }
  } while (page !== null);

  return evidence;
}

export async function fetchOpenAIAdminSnapshot(
  input: Readonly<{
    adminKey: string;
    startTime: number;
    endTime: number;
    fetcher?: OpenAIAdminFetch;
  }>,
): Promise<OpenAIAdminSnapshot> {
  if (input.adminKey.trim().length === 0) {
    throw new Error('OPENAI_ADMIN_KEY_REQUIRED');
  }
  if (
    !Number.isInteger(input.startTime) ||
    !Number.isInteger(input.endTime) ||
    input.endTime <= input.startTime
  ) {
    throw new Error('OPENAI_ADMIN_API_INVALID_INTERVAL');
  }

  const fetcher = input.fetcher ?? defaultFetch;
  const [usage, costs] = await Promise.all([
    fetchUsage(fetcher, input.adminKey, input.startTime, input.endTime),
    fetchCosts(fetcher, input.adminKey, input.startTime, input.endTime),
  ]);

  return Object.freeze({
    usage: Object.freeze(usage),
    costs: Object.freeze(costs),
  });
}
