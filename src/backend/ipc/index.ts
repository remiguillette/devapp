import { startNetIpcServer, IpcServer, IpcHandlers } from './net-ipc';

let activeServer: IpcServer | null = null;

export async function startIpc(handlers: Partial<IpcHandlers> = {}): Promise<IpcServer> {
  if (activeServer) {
    return activeServer;
  }

  activeServer = await startNetIpcServer(handlers);
  return activeServer;
}

export async function stopIpc(): Promise<void> {
  if (!activeServer) {
    return;
  }

  await activeServer.close();
  activeServer = null;
}

export type { IpcHandlers, IpcServer } from './net-ipc';
