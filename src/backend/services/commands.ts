import { spawn } from 'child_process';

export interface CommandResult {
  command: string;
  pid: number | null;
}

export interface NotificationRequest {
  summary: string;
  body?: string;
  icon?: string;
}

export function openApplication(command: string, args: string[] = []): Promise<CommandResult> {
  return new Promise((resolve, reject) => {
    if (!command) {
      reject(new Error('No command provided'));
      return;
    }

    try {
      const child = spawn(command, args, {
        detached: true,
        stdio: 'ignore',
      });
      child.once('error', reject);
      child.once('spawn', () => {
        const pid = child.pid ?? null;
        child.unref();
        resolve({ command, pid });
      });
    } catch (error) {
      reject(error as Error);
    }
  });
}

export function showNotification(request: NotificationRequest): Promise<void> {
  const { summary, body, icon } = request;

  return new Promise((resolve, reject) => {
    if (!summary) {
      reject(new Error('Notification summary is required'));
      return;
    }

    const args = [summary];

    if (body) {
      args.push(body);
    }

    const extra: string[] = [];

    if (icon) {
      extra.push('--icon', icon);
    }

    try {
      const child = spawn('notify-send', [...extra, ...args], {
        detached: true,
        stdio: 'ignore',
      });
      child.on('error', (error) => {
        // notify-send might be missing; resolve gracefully.
        console.warn('Failed to deliver desktop notification', error);
        resolve();
      });
      child.unref();
      resolve();
    } catch (error) {
      console.warn('Notification delivery failed', error);
      resolve();
    }
  });
}
