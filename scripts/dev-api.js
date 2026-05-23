import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const ROOT = process.cwd();
const API_DIR = path.join(ROOT, 'api');
const ENV_FILES = ['.env.local', '.env'];
const PORT = Number(process.env.API_PORT || 3000);

loadEnvFiles();

const server = http.createServer(async (req, res) => {
  try {
    const requestUrl = new URL(req.url, `http://${req.headers.host || `localhost:${PORT}`}`);

    if (!requestUrl.pathname.startsWith('/api/')) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not found' }));
      return;
    }

    const routeName = requestUrl.pathname.replace(/^\/api\//, '');
    const handlerPath = path.join(API_DIR, `${routeName}.js`);

    if (!fs.existsSync(handlerPath)) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: `API route not found: ${routeName}` }));
      return;
    }

    const body = await readJsonBody(req);
    const handlerModule = await import(`${pathToFileURL(handlerPath).href}?ts=${Date.now()}`);
    const handler = handlerModule.default;

    if (typeof handler !== 'function') {
      throw new Error(`Route ${routeName} does not export a default handler`);
    }

    const wrappedReq = {
      ...req,
      body,
      headers: req.headers,
      method: req.method,
      query: Object.fromEntries(requestUrl.searchParams.entries()),
      url: req.url,
    };
    const wrappedRes = createResponse(res);

    await handler(wrappedReq, wrappedRes);

    if (!res.writableEnded) {
      wrappedRes.end();
    }
  } catch (error) {
    console.error('Local API server error:', error);

    if (!res.writableEnded) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Internal server error', details: error.message }));
    }
  }
});

server.listen(PORT, () => {
  console.log(`Local API server listening on http://localhost:${PORT}`);
});

server.on('error', (error) => {
  console.error('Failed to start local API server:', error);
  process.exit(1);
});

function createResponse(res) {
  return {
    status(code) {
      res.statusCode = code;
      return this;
    },
    setHeader(name, value) {
      res.setHeader(name, value);
      return this;
    },
    json(payload) {
      if (!res.hasHeader('Content-Type')) {
        res.setHeader('Content-Type', 'application/json');
      }
      res.end(JSON.stringify(payload));
      return this;
    },
    send(payload) {
      if (Buffer.isBuffer(payload) || typeof payload === 'string') {
        res.end(payload);
      } else if (payload === undefined || payload === null) {
        res.end();
      } else {
        if (!res.hasHeader('Content-Type')) {
          res.setHeader('Content-Type', 'application/json');
        }
        res.end(JSON.stringify(payload));
      }
      return this;
    },
    end(payload) {
      res.end(payload);
      return this;
    },
  };
}

async function readJsonBody(req) {
  if (req.method === 'GET' || req.method === 'HEAD') {
    return undefined;
  }

  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }

  if (!chunks.length) {
    return undefined;
  }

  const rawBody = Buffer.concat(chunks).toString('utf8');
  const contentType = req.headers['content-type'] || '';

  if (contentType.includes('application/json')) {
    return JSON.parse(rawBody);
  }

  return rawBody;
}

function loadEnvFiles() {
  for (const fileName of ENV_FILES) {
    const filePath = path.join(ROOT, fileName);
    if (!fs.existsSync(filePath)) {
      continue;
    }

    const content = fs.readFileSync(filePath, 'utf8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();

      if (!trimmed || trimmed.startsWith('#')) {
        continue;
      }

      const separatorIndex = trimmed.indexOf('=');
      if (separatorIndex === -1) {
        continue;
      }

      const key = trimmed.slice(0, separatorIndex).trim();
      const value = trimmed.slice(separatorIndex + 1).trim().replace(/^['"]|['"]$/g, '');

      if (!(key in process.env)) {
        process.env[key] = value;
      }
    }
  }
}
