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

  const pathname = `/${pathParts.join('/')}`;
  const queryIndex = req.url.indexOf('?');
  const queryString = queryIndex >= 0 ? req.url.slice(queryIndex) : '';

  return `${backendUrl}${backendPrefix}${pathname}${queryString}`;
}

module.exports = async (req, res) => {
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
    const normalized = key.toLowerCase();
    if (HOP_BY_HOP_HEADERS.has(normalized)) continue;
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

  try {
    console.log(`[Vercel BFF] -> ${method} ${req.url} => ${targetUrl}`);

    const upstream = await fetch(targetUrl, {
      method,
      headers,
      body,
      redirect: 'manual',
    });

    res.status(upstream.status);

    upstream.headers.forEach((value, key) => {
      if (!HOP_BY_HOP_HEADERS.has(key.toLowerCase())) {
        res.setHeader(key, value);
      }
    });

    const buffer = Buffer.from(await upstream.arrayBuffer());
    console.log(`[Vercel BFF] <- ${upstream.status} ${method} ${req.url}`);
    return res.send(buffer);
  } catch (error) {
    console.error(`[Vercel BFF] !! ${method} ${req.url}:`, error.message);
    return res.status(502).json({
      error: 'Bad Gateway',
      message: 'Failed to reach backend service',
    });
  }
};
