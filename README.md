# Auxray Admin

A React.js application for Auxray Admin panel.

## Getting Started

### Prerequisites
- Node.js (version 14 or higher)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

### Available Scripts

#### `npm start`
Runs the app in development mode.
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

#### `npm test`
Launches the test runner in interactive watch mode.

#### `npm run build`
Builds the app for production to the `build` folder.

#### `npm run start:proxy`
Runs the Express BFF proxy server that serves the built frontend and proxies `/api/*` requests to the backend.

#### `npm run serve`
Builds the frontend and starts the BFF proxy server.

## API Proxy (BFF) Setup

This project includes a proxy layer so browsers only call same-origin routes:

Frontend -> `/api/*` -> BFF proxy -> HTTP backend (`BACKEND_URL`)

### Folder Structure

```
auxray_admin/
├── api/
│   └── [...path].js           # Vercel serverless BFF proxy (/api/*)
├── server.js                 # BFF proxy + static frontend server
├── .env.example              # Environment variable template
└── src/
		└── utils/
				└── apiConfig.js      # Frontend API base (/api)
```

### Environment Variables

Create `.env` from `.env.example` and set:

```bash
BACKEND_URL=http://localhost:5000
BACKEND_PATH_PREFIX=/api
PORT=3000
REACT_APP_API_BASE=/api
```

Notes:
- Default proxy behavior rewrites `/api/users` -> `/api/users` on backend.
- If your backend routes do not include `/api`, set `BACKEND_PATH_PREFIX=`.

### Example Frontend Usage

```js
import { buildApiUrl } from '../utils/apiConfig';

const res = await fetch(buildApiUrl('/users'), {
	method: 'GET',
	credentials: 'include',
	headers: {
		Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
	},
});

if (!res.ok) {
	throw new Error(`Request failed: ${res.status}`);
}

const data = await res.json();
```

### What the Proxy Handles

- Methods: GET, POST, PUT, DELETE (and other HTTP methods)
- Forwarding: headers, auth headers, cookies, query params, and request body
- Response passthrough: backend status and body are returned as-is
- Errors: network failures return `502 Bad Gateway`
- Logging: request/response/error logs are printed in server console

### Vercel Deployment Note

`server.js` is for self-hosted runtime. On Vercel, the proxy is handled by `api/[...path].js`.

Set these variables in Vercel Project Settings -> Environment Variables:

```bash
BACKEND_URL=http://your-backend-host:5000
BACKEND_PATH_PREFIX=/api
REACT_APP_API_BASE=/api
```

## Project Structure

```
auxray_admin/
├── public/
│   └── index.html
├── src/
│   ├── App.css
│   ├── App.js
│   ├── index.css
│   └── index.js
├── .gitignore
├── package.json
└── README.md
```

## Learn More

- [React Documentation](https://react.dev/)
- [Create React App Documentation](https://create-react-app.dev/)
