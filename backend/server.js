const http = require('node:http');
const os = require('node:os');
const path = require('node:path');
const express = require('express');
const morgan = require('morgan');

const { createMenuRouter } = require('./routes/menu');

const DEFAULT_PORT = process.env.PORT ? Number(process.env.PORT) : 5000;
const DATA_DIR = path.join(__dirname, 'data');

let server;
let currentPort = DEFAULT_PORT;
let isStarting = false;

function resolveAllowedOrigin(originHeader) {
  if (typeof originHeader !== 'string' || originHeader.length === 0) {
    return '*';
  }

  if (originHeader === 'null') {
    return 'null';
  }

  try {
    const { protocol, hostname } = new URL(originHeader);

    if (
      (protocol === 'http:' || protocol === 'https:') &&
      (hostname === '127.0.0.1' || hostname === 'localhost')
    ) {
      return originHeader;
    }

    if (protocol === 'file:' || protocol === 'neutralino:') {
      return originHeader;
    }
  } catch (error) {
    return '*';
  }

  return '*';
}

function corsMiddleware(req, res, next) {
  const allowedOrigin = resolveAllowedOrigin(req.headers.origin);
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Vary', 'Origin');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  next();
}

function createExpressApp() {
  const app = express();

  app.disable('x-powered-by');
  app.use(morgan('tiny'));
  app.use(corsMiddleware);

  app.get('/health', (_req, res) => {
    res.status(200).json({
      status: 'ok',
      port: currentPort,
      host: os.hostname(),
      timestamp: new Date().toISOString(),
    });
  });

  app.use('/api/menu', createMenuRouter({ dataDir: DATA_DIR }));

  app.use((err, _req, res, _next) => {
    console.error('Backend error', err);
    res.status(500).json({ message: 'Internal server error' });
  });

  return app;
}

function ensureServer(initialPort = DEFAULT_PORT) {
  if (!server) {
    const app = createExpressApp();
    server = http.createServer(app);
    currentPort = initialPort;
  }

  return server;
}

function startServer(port = DEFAULT_PORT) {
  const srv = ensureServer(port);

  if (srv.listening) {
    return Promise.resolve(srv);
  }

  if (isStarting) {
    return new Promise((resolve, reject) => {
      const handleListening = () => {
        srv.off('error', handleError);
        resolve(srv);
      };

      const handleError = (error) => {
        srv.off('listening', handleListening);
        reject(error);
      };

      srv.once('listening', handleListening);
      srv.once('error', handleError);
    });
  }

  isStarting = true;

  return new Promise((resolve, reject) => {
    const handleListening = () => {
      srv.off('error', handleError);
      isStarting = false;
      const address = srv.address();
      if (address && typeof address === 'object') {
        currentPort = address.port;
      } else {
        currentPort = port;
      }
      console.log(`Backend listening on http://localhost:${currentPort}`);
      resolve(srv);
    };

    const handleError = (error) => {
      srv.off('listening', handleListening);
      isStarting = false;
      reject(error);
    };

    srv.once('listening', handleListening);
    srv.once('error', handleError);
    srv.listen(port);
  });
}

function stopServer() {
  if (!server || !server.listening) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}

module.exports = {
  startServer,
  stopServer,
};

if (require.main === module) {
  startServer().catch((error) => {
    console.error('Failed to start backend server', error);
    process.exitCode = 1;
  });
}
