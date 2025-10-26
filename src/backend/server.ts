import path from 'path';
import http, { Server as HttpServer } from 'http';
import express, { Request, Response } from 'express';
import { AddressInfo } from 'net';
import { startIpc, stopIpc } from './ipc';
import { getSystemStatus } from './services/system';
import { openApplication, showNotification } from './services/commands';

const DEFAULT_PORT = Number(process.env.PORT ?? 5000);

let server: HttpServer | null = null;
let currentPort = DEFAULT_PORT;
let isStarting = false;

function getReactDir(): string {
  return path.resolve(__dirname, '../web');
}

function getResourcesDir(): string {
  return path.resolve(__dirname, '../../resources');
}

function registerRoutes(app: express.Express) {
  app.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      port: currentPort,
      timestamp: new Date().toISOString(),
    });
  });

  app.get('/api/system', async (_req, res) => {
    try {
      const status = await getSystemStatus();
      res.json(status);
    } catch (error) {
      console.error('Failed to read system status', error);
      res.status(500).json({ message: 'Unable to read system status' });
    }
  });

  app.post('/api/apps/open', async (req, res) => {
    const { command, args } = req.body ?? {};
    if (typeof command !== 'string' || command.trim().length === 0) {
      res.status(400).json({ message: 'Command is required' });
      return;
    }

    try {
      const result = await openApplication(command, Array.isArray(args) ? args : []);
      res.json({
        command: result.command,
        pid: result.pid,
      });
    } catch (error) {
      console.error('Failed to launch application', error);
      res.status(500).json({ message: 'Failed to launch application' });
    }
  });

  app.post('/api/notifications', async (req, res) => {
    const { summary, body, icon } = req.body ?? {};
    if (typeof summary !== 'string' || summary.trim().length === 0) {
      res.status(400).json({ message: 'Notification summary is required' });
      return;
    }

    try {
      await showNotification({ summary, body, icon });
      res.json({ delivered: true });
    } catch (error) {
      console.error('Failed to dispatch notification', error);
      res.status(500).json({ message: 'Failed to dispatch notification' });
    }
  });

  const reactDir = getReactDir();
  const resourcesDir = getResourcesDir();

  app.use('/dashboard', express.static(reactDir));
  app.get('/dashboard/*', (_req, res) => {
    res.sendFile(path.join(reactDir, 'index.html'));
  });

  app.use('/', express.static(resourcesDir));
}

function createExpressApp(): express.Express {
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  registerRoutes(app);

  app.use((req: Request, res: Response) => {
    if (req.accepts('html')) {
      res.status(404).sendFile(path.join(getResourcesDir(), 'index.html'));
      return;
    }

    res.status(404).json({ message: 'Not found' });
  });

  return app;
}

export async function startServer(port: number = DEFAULT_PORT): Promise<HttpServer> {
  if (server && server.listening) {
    return server;
  }

  if (isStarting) {
    return new Promise<HttpServer>((resolve, reject) => {
      const handleListening = () => {
        server?.off('error', handleError);
        resolve(server as HttpServer);
      };
      const handleError = (error: Error) => {
        server?.off('listening', handleListening);
        reject(error);
      };

      server?.once('listening', handleListening);
      server?.once('error', handleError);
    });
  }

  isStarting = true;

  const app = createExpressApp();
  server = http.createServer(app);

  await startIpc({
    systemStatus: getSystemStatus,
    open: async (command, args) => {
      const result = await openApplication(command, args ?? []);
      return { pid: result.pid };
    },
    notify: async (summary, body) => {
      await showNotification({ summary, body });
    },
  });

  await new Promise<void>((resolve, reject) => {
    const handleError = (error: Error) => {
      server?.off('listening', handleListening);
      reject(error);
    };

    const handleListening = () => {
      server?.off('error', handleError);
      const address = server?.address();
      if (address && typeof address === 'object') {
        currentPort = (address as AddressInfo).port;
      } else {
        currentPort = port;
      }
      isStarting = false;
      console.log(`HTTP server listening on http://localhost:${currentPort}`);
      resolve();
    };

    server?.once('error', handleError);
    server?.once('listening', handleListening);
    server?.listen(port);
  });

  return server;
}

export async function stopServer(): Promise<void> {
  await stopIpc();

  if (!server) {
    return;
  }

  await new Promise<void>((resolve, reject) => {
    server?.close((error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });

  server = null;
}

if (require.main === module) {
  startServer().catch((error) => {
    console.error('Failed to start backend', error);
    process.exitCode = 1;
  });
}

export default {
  startServer,
  stopServer,
};
