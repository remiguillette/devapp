import net, { Server as NetServer } from 'net';
import { unlinkSync } from 'fs';
import { getSystemStatus, SystemStatus } from '../services/system';
import { openApplication, showNotification } from '../services/commands';

export interface IpcServer {
  close(): Promise<void>;
}

export interface IpcHandlers {
  systemStatus(): Promise<SystemStatus>;
  open(command: string, args?: string[]): Promise<{ pid: number | null }>; 
  notify(summary: string, body?: string): Promise<void>;
}

const DEFAULT_SOCKET_PATH = '/tmp/beaverkiosk.sock';

function parseMessage(raw: string): { type: string; payload?: any } | null {
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed === 'object' && parsed !== null && typeof parsed.type === 'string') {
      return parsed;
    }
  } catch (error) {
    // fallback to legacy protocol
  }

  const normalized = raw.trim();

  if (normalized === 'get-status') {
    return { type: 'system.status' };
  }

  if (normalized.startsWith('open:')) {
    const command = normalized.slice(5).trim();
    return { type: 'app.open', payload: { command } };
  }

  if (normalized.startsWith('notify:')) {
    const [, summary, body] = normalized.split(':');
    return { type: 'notification.show', payload: { summary, body } };
  }

  return null;
}

function serializeResponse(data: unknown): string {
  try {
    return `${JSON.stringify({ ok: true, data })}\n`;
  } catch (error) {
    return JSON.stringify({ ok: false, error: 'Unable to serialize response' });
  }
}

function serializeError(error: unknown): string {
  if (error instanceof Error) {
    return `${JSON.stringify({ ok: false, error: error.message })}\n`;
  }

  return `${JSON.stringify({ ok: false, error })}\n`;
}

export function startNetIpcServer(
  handlers: Partial<IpcHandlers> = {}
): Promise<IpcServer> {
  const socketPath = process.env.BEAVERKIOSK_IPC || DEFAULT_SOCKET_PATH;

  const ipcHandlers: IpcHandlers = {
    async systemStatus() {
      if (handlers.systemStatus) {
        return handlers.systemStatus();
      }
      return getSystemStatus();
    },
    async open(command: string, args: string[] = []) {
      if (handlers.open) {
        return handlers.open(command, args);
      }
      const result = await openApplication(command, args);
      return { pid: result.pid };
    },
    async notify(summary: string, body?: string) {
      if (handlers.notify) {
        return handlers.notify(summary, body);
      }
      return showNotification({ summary, body });
    },
  };

  return new Promise((resolve, reject) => {
    try {
      unlinkSync(socketPath);
    } catch (error: any) {
      if (error?.code !== 'ENOENT') {
        // The socket might still be in use; log and continue.
        console.warn(`Unable to cleanup socket ${socketPath}:`, error.message || error);
      }
    }

    const server: NetServer = net.createServer((socket) => {
      console.log('IPC client connected');
      let buffer = '';

      socket.setEncoding('utf8');

      socket.on('data', (chunk) => {
        buffer += chunk;
        let newlineIndex = buffer.indexOf('\n');

        while (newlineIndex !== -1) {
          const raw = buffer.slice(0, newlineIndex).trim();
          buffer = buffer.slice(newlineIndex + 1);
          newlineIndex = buffer.indexOf('\n');

          const message = parseMessage(raw);

          if (!message) {
            socket.write(
              serializeError(new Error('Unsupported IPC message format'))
            );
            continue;
          }

          (async () => {
            try {
              switch (message.type) {
                case 'system.status': {
                  const status = await ipcHandlers.systemStatus();
                  socket.write(serializeResponse(status));
                  break;
                }
                case 'app.open': {
                  const command = message.payload?.command as string;
                  const args = Array.isArray(message.payload?.args)
                    ? message.payload.args
                    : undefined;
                  if (!command) {
                    throw new Error('Command is required');
                  }
                  const result = await ipcHandlers.open(command, args);
                  socket.write(serializeResponse(result));
                  break;
                }
                case 'notification.show': {
                  const summary = message.payload?.summary as string;
                  const body = message.payload?.body as string | undefined;
                  if (!summary) {
                    throw new Error('Notification summary is required');
                  }
                  await ipcHandlers.notify(summary, body);
                  socket.write(serializeResponse({ delivered: true }));
                  break;
                }
                default: {
                  throw new Error(`Unsupported IPC command: ${message.type}`);
                }
              }
            } catch (error) {
              socket.write(serializeError(error));
            }
          })().catch((error) => {
            socket.write(serializeError(error));
          });
        }
      });

      socket.on('error', (error) => {
        console.warn('IPC client error', error);
      });
    });

    server.once('error', (error) => {
      reject(error);
    });

    server.listen(socketPath, () => {
      console.log(`IPC server listening on ${socketPath}`);
      resolve({
        close: () =>
          new Promise<void>((closeResolve) => {
            server.close(() => closeResolve());
          }),
      });
    });
  });
}
