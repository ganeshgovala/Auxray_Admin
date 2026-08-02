// Dev-server proxy for `npm start` (Create React App).
// CRA automatically loads this file and applies it to the webpack dev server,
// so that browser calls to /api/* reach the backend during local development.
// This mirrors the behaviour of server.js (the production BFF proxy).
const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function (app) {
  const BACKEND_URL = process.env.BACKEND_URL || 'http://13.201.200.98:5000';
  const BACKEND_PATH_PREFIX = process.env.BACKEND_PATH_PREFIX || '/api';

  const normalizedBackendUrl = BACKEND_URL.replace(/\/+$/, '');
  const normalizedBackendPrefix = BACKEND_PATH_PREFIX
    ? `/${BACKEND_PATH_PREFIX.replace(/^\/+|\/+$/g, '')}`
    : '';

  // eslint-disable-next-line no-console
  console.log(
    `[dev-proxy] /api -> ${normalizedBackendUrl}${normalizedBackendPrefix || ''}`
  );

  app.use(
    '/api',
    createProxyMiddleware({
      target: normalizedBackendUrl,
      changeOrigin: true,
      xfwd: true,
      secure: false,
      // /api/users -> <prefix>/users. With BACKEND_PATH_PREFIX=/api this yields /api/users.
      pathRewrite: (pathValue) => {
        const strippedPath = pathValue.replace(/^\/api/, '') || '/';
        return `${normalizedBackendPrefix}${strippedPath}`;
      },
      on: {
        error: (err, req, res) => {
          // eslint-disable-next-line no-console
          console.error(`[dev-proxy] !! ${req.method} ${req.originalUrl}:`, err.message);
          if (res && !res.headersSent && res.writeHead) {
            res.writeHead(502, { 'Content-Type': 'application/json' });
            res.end(
              JSON.stringify({ error: 'Bad Gateway', message: 'Failed to reach backend service' })
            );
          }
        },
      },
    })
  );
};
