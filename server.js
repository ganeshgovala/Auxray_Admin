const path = require('path');
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const BACKEND_URL = process.env.BACKEND_URL;
const BACKEND_PATH_PREFIX = process.env.BACKEND_PATH_PREFIX || '/api';

if (!BACKEND_URL) {
  console.error('[BFF] BACKEND_URL is missing. Add it to your environment variables.');
  process.exit(1);
}

const normalizedBackendUrl = BACKEND_URL.replace(/\/+$/, '');
const normalizedBackendPrefix = BACKEND_PATH_PREFIX
  ? `/${BACKEND_PATH_PREFIX.replace(/^\/+|\/+$/g, '')}`
  : '';

console.log(`[BFF] Backend target: ${normalizedBackendUrl}${normalizedBackendPrefix || ''}`);

app.use(
  '/api',
  createProxyMiddleware({
    target: normalizedBackendUrl,
    changeOrigin: true,
    xfwd: true,
    secure: false,
    // /api/users -> /users by default. Use BACKEND_PATH_PREFIX=/api if backend expects it.
    pathRewrite: (pathValue) => {
      const strippedPath = pathValue.replace(/^\/api/, '') || '/';
      return `${normalizedBackendPrefix}${strippedPath}`;
    },
    on: {
      proxyReq: (proxyReq, req) => {
        console.log(`[BFF] -> ${req.method} ${req.originalUrl}`);
      },
      proxyRes: (proxyRes, req) => {
        console.log(`[BFF] <- ${proxyRes.statusCode} ${req.method} ${req.originalUrl}`);
      },
      error: (err, req, res) => {
        console.error(`[BFF] !! ${req.method} ${req.originalUrl}:`, err.message);
        if (!res.headersSent) {
          res.status(502).json({
            error: 'Bad Gateway',
            message: 'Failed to reach backend service',
          });
        }
      },
    },
  })
);

const buildDir = path.join(__dirname, 'build');
app.use(express.static(buildDir));

app.get(/.*/, (req, res) => {
  res.sendFile(path.join(buildDir, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`[BFF] Server running on port ${PORT}`);
});
