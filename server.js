const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const url = require('url');

const PORT = process.env.PORT ? Number(process.env.PORT) : 5000;
const RESOURCES_DIR = path.join(__dirname, 'resources');
const DATA_DIR = path.join(RESOURCES_DIR, 'data');
const DEFAULT_FILE = 'index.html';

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
};

function serveHealth(res) {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(
    JSON.stringify({
      status: 'ok',
      port: PORT,
      host: os.hostname(),
      timestamp: new Date().toISOString(),
    })
  );
}

function resolveAllowedOrigin(req) {
  const origin = req.headers ? req.headers.origin : undefined;

  if (typeof origin !== 'string' || origin.length === 0) {
    return '*';
  }

  if (origin === 'null') {
    return 'null';
  }

  try {
    const { protocol, hostname } = new URL(origin);

    if (
      (protocol === 'http:' || protocol === 'https:') &&
      (hostname === '127.0.0.1' || hostname === 'localhost')
    ) {
      return origin;
    }

    if (protocol === 'neutralino:') {
      return origin;
    }
  } catch (error) {
    return '*';
  }

  return '*';
}

function setCorsHeaders(req, res) {
  const allowedOrigin = resolveAllowedOrigin(req);
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Vary', 'Origin');
}

function serveJson(res, payload, statusCode = 200) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
}

function handleMenuRequest(req, res) {
  setCorsHeaders(req, res);

  if (req.method === 'HEAD') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end();
    return;
  }

  const menuPath = path.join(DATA_DIR, 'menu.json');

  fs.readFile(menuPath, 'utf8', (error, raw) => {
    if (error) {
      res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(
        JSON.stringify({ message: 'Unable to load menu configuration.' })
      );
      return;
    }

    try {
      const parsed = JSON.parse(raw);
      serveJson(res, parsed);
    } catch (parseError) {
      res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ message: 'Invalid menu configuration.' }));
    }
  });
}

function getContentType(filePath) {
  const extension = path.extname(filePath).toLowerCase();
  return MIME_TYPES[extension] || 'application/octet-stream';
}

function resolveFilePath(urlPath) {
  const decodedPath = decodeURIComponent(urlPath.split('?')[0]);
  let normalizedPath = path.normalize(decodedPath).replace(/^([/\\])+/, '');

  if (normalizedPath.includes('..')) {
    return null;
  }

  if (normalizedPath === '') {
    normalizedPath = DEFAULT_FILE;
  }

  return path.join(RESOURCES_DIR, normalizedPath);
}

function fallbackToIndex(res, method) {
  const indexPath = path.join(RESOURCES_DIR, DEFAULT_FILE);
  fs.readFile(indexPath, (readError, data) => {
    if (readError) {
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Unable to load application shell.');
      return;
    }

    res.writeHead(200, { 'Content-Type': getContentType(indexPath) });
    if (method !== 'HEAD') {
      res.end(data);
    } else {
      res.end();
    }
  });
}

function serveStaticFile(res, filePath, method, shouldFallback) {
  fs.stat(filePath, (statError, stats) => {
    if (statError || !stats.isFile()) {
      if (shouldFallback) {
        fallbackToIndex(res, method);
        return;
      }

      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not found');
      return;
    }

    res.writeHead(200, { 'Content-Type': getContentType(filePath) });

    if (method === 'HEAD') {
      res.end();
      return;
    }

    const stream = fs.createReadStream(filePath);
    stream.on('error', () => {
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Error reading file');
    });
    stream.pipe(res);
  });
}

const server = http.createServer((req, res) => {
  if (!req.url) {
    res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Bad request');
    return;
  }

  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname || '/';
  const isApiRequest = pathname.startsWith('/api/');

  if (req.method === 'OPTIONS' && isApiRequest) {
    setCorsHeaders(req, res);
    res.writeHead(204, { 'Content-Length': '0' });
    res.end();
    return;
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    if (isApiRequest) {
      setCorsHeaders(req, res);
    }
    res.writeHead(405, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Method not allowed');
    return;
  }

  if (req.url === '/health') {
    serveHealth(res);
    return;
  }

  if (pathname === '/api/menu') {
    handleMenuRequest(req, res);
    return;
  }

  const filePath = resolveFilePath(req.url);

  if (!filePath) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Access denied');
    return;
  }

  const hasExtension = path.extname(filePath) !== '';
  serveStaticFile(res, filePath, req.method, !hasExtension);
});

server.listen(PORT, () => {
  console.log(`Application available at http://localhost:${PORT}`);
});
