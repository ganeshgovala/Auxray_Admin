const HOP_BY_HOP_HEADERS = new Set([
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailers',
  'transfer-encoding',
  'upgrade',
  'host',
  'content-length',
]);

function normalizePrefix(prefix) {
  if (!prefix) return '';
  return `/${String(prefix).replace(/^\/+|\/+$/g, '')}`;
}

async function readRawBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return chunks.length ? Buffer.concat(chunks) : null;
}

function buildTargetUrl(req) {
  const backendUrl = (process.env.BACKEND_URL || '').replace(/\/+$/, '');
  const backendPrefix = normalizePrefix(process.env.BACKEND_PATH_PREFIX || '/api');
  const pathParts = Array.isArray(req.query.path)
    ? req.query.path
    : req.query.path
      ? [req.query.path]
      : [];

  const pathname = pathParts.length ? `/${pathParts.join('/')}` : '';

  const queryParams = new URLSearchParams();
  Object.entries(req.query || {}).forEach(([key, value]) => {
    if (key === 'path') return;

    if (Array.isArray(value)) {
      value.forEach((v) => queryParams.append(key, String(v)));
      return;
    }

    if (value != null) {
      queryParams.append(key, String(value));
    }
  });

  const queryString = queryParams.toString();
  return `${backendUrl}${backendPrefix}${pathname}${queryString ? `?${queryString}` : ''}`;
}

module.exports = async (req, res) => {
  try {
    const backendUrl = process.env.BACKEND_URL;
    if (!backendUrl) {
      return res.status(500).json({
        error: 'Server misconfiguration',
        message: 'BACKEND_URL is missing',
      });
    }

    const targetUrl = buildTargetUrl(req);
    const method = req.method.toUpperCase();

    const headers = {};
    for (const [key, value] of Object.entries(req.headers || {})) {
      if (HOP_BY_HOP_HEADERS.has(key.toLowerCase())) continue;
      headers[key] = value;
    }

    let body;
    if (!['GET', 'HEAD'].includes(method)) {
      if (req.body == null) {
        body = await readRawBody(req);
      } else if (Buffer.isBuffer(req.body) || typeof req.body === 'string') {
        body = req.body;
      } else {
        body = JSON.stringify(req.body);
        if (!headers['content-type'] && !headers['Content-Type']) {
          headers['content-type'] = 'application/json';
        }
      }
    }

    console.log(`[Vercel BFF] -> ${method} ${req.url} => ${targetUrl}`);

    const upstream = await fetch(targetUrl, {
      method,
      headers,
      body,
      redirect: 'manual',
    });

    res.status(upstream.status);
    res.setHeader('x-proxy-target', targetUrl);

    upstream.headers.forEach((value, key) => {
      if (!HOP_BY_HOP_HEADERS.has(key.toLowerCase())) {
        res.setHeader(key, value);
      }
    });

    const responseBuffer = Buffer.from(await upstream.arrayBuffer());
    console.log(`[Vercel BFF] <- ${upstream.status} ${method} ${req.url}`);
    return res.send(responseBuffer);
  } catch (error) {
    console.error('[Vercel BFF] Unhandled proxy error:', error);
    return res.status(502).json({
      error: 'Bad Gateway',
      message: 'Failed to reach backend service',
      details: error?.message || 'Unknown proxy error',
    });
  }
};
