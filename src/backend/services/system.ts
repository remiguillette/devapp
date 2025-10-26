import os from 'os';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

export interface BatteryStatus {
  level: number | null;
  state: string;
  source: 'upower' | 'acpi' | 'unknown';
  raw?: string;
}

export interface WifiStatus {
  device: string | null;
  state: string;
  connection: string | null;
  source: 'nmcli' | 'unknown';
  raw?: string;
}

export interface SystemStatus {
  hostname: string;
  battery: BatteryStatus;
  wifi: WifiStatus;
}

async function queryUpower(): Promise<BatteryStatus | undefined> {
  try {
    const listOutput = await execFileAsync('upower', ['-e']);
    const device = listOutput.stdout
      .split('\n')
      .map((line) => line.trim())
      .find((line) => /battery/i.test(line));

    if (!device) {
      return undefined;
    }

    const infoOutput = await execFileAsync('upower', ['-i', device]);
    const raw = infoOutput.stdout;
    const percentageMatch = raw.match(/percentage:\s*(\d+)%/i);
    const stateMatch = raw.match(/state:\s*([\w-]+)/i);

    const level = percentageMatch ? Number(percentageMatch[1]) : null;
    const state = stateMatch ? stateMatch[1].toLowerCase() : 'unknown';

    return {
      level,
      state,
      source: 'upower',
      raw,
    };
  } catch (error) {
    return undefined;
  }
}

async function queryAcpi(): Promise<BatteryStatus | undefined> {
  try {
    const { stdout } = await execFileAsync('acpi', ['-b']);
    const raw = stdout.trim();

    if (!raw) {
      return undefined;
    }

    const levelMatch = raw.match(/(\d+)%/);
    const stateMatch = raw.match(/:\s*([A-Za-z]+)/);

    const level = levelMatch ? Number(levelMatch[1]) : null;
    const state = stateMatch ? stateMatch[1].toLowerCase() : 'unknown';

    return {
      level,
      state,
      source: 'acpi',
      raw,
    };
  } catch (error) {
    return undefined;
  }
}

async function queryNmcli(): Promise<WifiStatus | undefined> {
  try {
    const { stdout } = await execFileAsync('nmcli', [
      '-t',
      '-f',
      'DEVICE,TYPE,STATE,CONNECTION',
      'device',
      'status',
    ]);

    const raw = stdout.trim();

    if (!raw) {
      return undefined;
    }

    const wifiLine = raw
      .split('\n')
      .map((line) => line.trim())
      .find((line) => line.split(':')[1] === 'wifi');

    if (!wifiLine) {
      return undefined;
    }

    const [device, , state, connection] = wifiLine.split(':');

    return {
      device: device || null,
      state: state ? state.toLowerCase() : 'unknown',
      connection: connection && connection !== '--' ? connection : null,
      source: 'nmcli',
      raw,
    };
  } catch (error) {
    return undefined;
  }
}

export async function getBatteryStatus(): Promise<BatteryStatus> {
  const fromUpower = await queryUpower();
  if (fromUpower) {
    return fromUpower;
  }

  const fromAcpi = await queryAcpi();
  if (fromAcpi) {
    return fromAcpi;
  }

  return {
    level: null,
    state: 'unknown',
    source: 'unknown',
  };
}

export async function getWifiStatus(): Promise<WifiStatus> {
  const fromNmcli = await queryNmcli();
  if (fromNmcli) {
    return fromNmcli;
  }

  return {
    device: null,
    state: 'unknown',
    connection: null,
    source: 'unknown',
  };
}

export async function getSystemStatus(): Promise<SystemStatus> {
  const [battery, wifi] = await Promise.all([getBatteryStatus(), getWifiStatus()]);
  return {
    hostname: os.hostname(),
    battery,
    wifi,
  };
}
