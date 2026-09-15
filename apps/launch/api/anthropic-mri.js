const ANTHROPIC_BASE = 'https://api.anthropic.com';

function send(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}

async function getJson(url, adminKey) {
  const response = await fetch(url, {
    headers: {
      'x-api-key': adminKey,
      'anthropic-version': '2023-06-01',
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`ANTHROPIC_ADMIN_API_${response.status}`);
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
    if (!payload || !Array.isArray(payload.data)) {
      throw new Error('ANTHROPIC_ADMIN_API_INVALID_RESPONSE');
    }
    data.push(...payload.data);
    page = payload.has_more ? payload.next_page : null;
    if (payload.has_more && !page) {
      throw new Error('ANTHROPIC_ADMIN_API_MISSING_NEXT_PAGE');
    }
  } while (page !== null);
  return data;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return send(res, 405, { error: 'METHOD_NOT_ALLOWED' });
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  const adminKey =
    body && typeof body.adminKey === 'string' ? body.adminKey.trim() : '';
  const startingAt =
    body && typeof body.startingAt === 'string' ? body.startingAt : '';
  const endingAt =
    body && typeof body.endingAt === 'string' ? body.endingAt : '';

  if (!adminKey) return send(res, 400, { error: 'ADMIN_KEY_REQUIRED' });
  if (!startingAt || !endingAt) {
    return send(res, 400, { error: 'VALID_INTERVAL_REQUIRED' });
  }

  try {
    const usageUrl = new URL(
      ANTHROPIC_BASE + '/v1/organizations/usage_report/messages',
    );
    usageUrl.searchParams.set('starting_at', startingAt);
    usageUrl.searchParams.set('ending_at', endingAt);
    usageUrl.searchParams.set('bucket_width', '1d');
    usageUrl.searchParams.set('limit', '31');
    usageUrl.searchParams.append('group_by[]', 'model');
    usageUrl.searchParams.append('group_by[]', 'workspace_id');
    usageUrl.searchParams.append('group_by[]', 'api_key_id');

    const costUrl = new URL(
      ANTHROPIC_BASE + '/v1/organizations/cost_report',
    );
    costUrl.searchParams.set('starting_at', startingAt);
    costUrl.searchParams.set('ending_at', endingAt);
    costUrl.searchParams.set('bucket_width', '1d');
    costUrl.searchParams.set('limit', '31');
    costUrl.searchParams.append('group_by[]', 'description');
    costUrl.searchParams.append('group_by[]', 'workspace_id');

    const [usageBuckets, costBuckets] = await Promise.all([
      allPages(usageUrl, adminKey),
      allPages(costUrl, adminKey),
    ]);

    const usage = [];
    for (const bucket of usageBuckets) {
      for (const item of Array.isArray(bucket.results) ? bucket.results : []) {
        const cacheCreation = item.cache_creation || {};
        const cacheWrite =
          Number(cacheCreation.ephemeral_1h_input_tokens || 0) +
          Number(cacheCreation.ephemeral_5m_input_tokens || 0);
        const uncached = Number(item.uncached_input_tokens || 0);
        const cacheRead = Number(item.cache_read_input_tokens || 0);
        usage.push({
          intervalStart: bucket.starting_at,
          intervalEnd: bucket.ending_at,
          provider: 'anthropic',
          model: item.model || 'UNATTRIBUTED_MODEL',
          workspaceId: item.workspace_id || null,
          apiKeyId: item.api_key_id || null,
          requests: String(item.request_count || 0),
          inputTokens: String(uncached + cacheRead + cacheWrite),
          outputTokens: String(item.output_tokens || 0),
          cachedInputTokens: String(cacheRead),
          cacheCreationInputTokens: String(cacheWrite),
        });
      }
    }

    const costs = [];
    for (const bucket of costBuckets) {
      for (const item of Array.isArray(bucket.results) ? bucket.results : []) {
        if (typeof item.amount !== 'string') continue;
        costs.push({
          intervalStart: bucket.starting_at,
          intervalEnd: bucket.ending_at,
          amountFractionalCents: item.amount,
          currency: item.currency || 'USD',
          model: item.model || null,
          workspaceId: item.workspace_id || null,
          description: item.description || null,
          costType: item.cost_type || null,
          tokenType: item.token_type || null,
        });
      }
    }

    return send(res, 200, {
      source: 'ANTHROPIC_USAGE_COST_ADMIN_API',
      usage,
      costs,
      boundaries: {
        currency:
          'Anthropic cost_report amounts are fractional cents. Evalomics converts them to USD only at presentation time.',
        secretHandling:
          'The Admin key is used for this request and is not included in the response or persisted by this function.',
      },
    });
  } catch (error) {
    const code =
      error instanceof Error && /^ANTHROPIC_ADMIN_API_/.test(error.message)
        ? error.message
        : 'ANTHROPIC_ADMIN_API_FAILED';
    return send(
      res,
      code.endsWith('_401') || code.endsWith('_403') ? 401 : 502,
      { error: code },
    );
  }
};
