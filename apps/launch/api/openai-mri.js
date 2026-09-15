const OPENAI_BASE = 'https://api.openai.com/v1';

function send(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}

function safeInt(value) {
  const number = Number(value);
  return Number.isInteger(number) ? number : null;
}

async function getJson(url, adminKey) {
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${adminKey}`,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    const error = new Error(`OPENAI_ADMIN_API_${response.status}`);
    error.status = response.status;
    throw error;
  }
  return response.json();
}

async function allPages(baseUrl, adminKey) {
  const data = [];
  let page = null;
  do {
    const url = new URL(baseUrl);
    if (page !== null) url.searchParams.set('page', page);
    const payload = await getJson(url, adminKey);
    if (!payload || payload.object !== 'page' || !Array.isArray(payload.data)) {
      throw new Error('OPENAI_ADMIN_API_INVALID_RESPONSE');
    }
    data.push(...payload.data);
    page = payload.has_more ? payload.next_page : null;
    if (payload.has_more && !page) {
      throw new Error('OPENAI_ADMIN_API_MISSING_NEXT_PAGE');
    }
  } while (page !== null);
  return data;
}

function iso(seconds) {
  return new Date(seconds * 1000).toISOString();
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return send(res, 405, { error: 'METHOD_NOT_ALLOWED' });
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  const adminKey =
    body && typeof body.adminKey === 'string' ? body.adminKey.trim() : '';
  const startTime = safeInt(body?.startTime);
  const endTime = safeInt(body?.endTime);

  if (!adminKey) return send(res, 400, { error: 'ADMIN_KEY_REQUIRED' });
  if (
    startTime === null ||
    endTime === null ||
    endTime <= startTime ||
    endTime - startTime > 31 * 24 * 60 * 60
  ) {
    return send(res, 400, { error: 'INVALID_INTERVAL_MAX_31_DAYS' });
  }

  try {
    const usageUrl = new URL(
      OPENAI_BASE + '/organization/usage/completions',
    );
    usageUrl.searchParams.set('start_time', String(startTime));
    usageUrl.searchParams.set('end_time', String(endTime));
    usageUrl.searchParams.set('bucket_width', '1d');
    usageUrl.searchParams.append('group_by', 'project_id');
    usageUrl.searchParams.append('group_by', 'model');
    usageUrl.searchParams.append('group_by', 'api_key_id');

    const costsUrl = new URL(OPENAI_BASE + '/organization/costs');
    costsUrl.searchParams.set('start_time', String(startTime));
    costsUrl.searchParams.set('end_time', String(endTime));
    costsUrl.searchParams.set('bucket_width', '1d');
    costsUrl.searchParams.append('group_by', 'project_id');
    costsUrl.searchParams.append('group_by', 'line_item');

    const [usageBuckets, costBuckets] = await Promise.all([
      allPages(usageUrl, adminKey),
      allPages(costsUrl, adminKey),
    ]);

    const usage = [];
    for (const bucket of usageBuckets) {
      for (const item of Array.isArray(bucket.results) ? bucket.results : []) {
        usage.push({
          intervalStart: iso(bucket.start_time),
          intervalEnd: iso(bucket.end_time),
          provider: 'openai',
          model: item.model ?? 'UNATTRIBUTED_MODEL',
          projectId: item.project_id ?? null,
          apiKeyId: item.api_key_id ?? null,
          requests: String(item.num_model_requests ?? 0),
          inputTokens: String(item.input_tokens ?? 0),
          outputTokens: String(item.output_tokens ?? 0),
          cachedInputTokens: String(item.input_cached_tokens ?? 0),
        });
      }
    }

    const costs = [];
    for (const bucket of costBuckets) {
      for (const item of Array.isArray(bucket.results) ? bucket.results : []) {
        const amount = item.amount?.value;
        const currency = item.amount?.currency;
        if (typeof amount !== 'number' || typeof currency !== 'string') continue;
        costs.push({
          intervalStart: iso(bucket.start_time),
          intervalEnd: iso(bucket.end_time),
          amount: String(amount),
          currency: currency.toUpperCase(),
          projectId: item.project_id ?? null,
          lineItem: item.line_item ?? null,
        });
      }
    }

    return send(res, 200, {
      source: 'OPENAI_ADMIN_API',
      usage,
      costs,
      boundaries: {
        costAttribution:
          'OpenAI usage and cost evidence are returned separately. Evalomics does not fabricate model-level cost attribution.',
        secretHandling:
          'The Admin key is used for this request and is not included in the response or persisted by this function.',
      },
    });
  } catch (error) {
    const code =
      error instanceof Error && /^OPENAI_ADMIN_API_/.test(error.message)
        ? error.message
        : 'OPENAI_ADMIN_API_FAILED';
    return send(res, code.endsWith('_401') || code.endsWith('_403') ? 401 : 502, {
      error: code,
    });
  }
}
