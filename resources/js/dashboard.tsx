/// <reference path="./neutralino.d.ts" />

type AppInfo = {
  id: string;
  port: number;
  os: string;
  version: string;
  clientVersion: string;
};

type Metric = {
  label: string;
  value: string;
  change: number;
};

type Task = {
  id: number;
  title: string;
  status: string;
};

type Service = {
  name: string;
  status: 'online' | 'offline' | 'degraded';
  responseTime: number;
};

type DashboardData = {
  metrics: Metric[];
  tasks: Task[];
  services: Service[];
};

type TrayEvent = {
  id: string;
  timestamp: number;
};

type DashboardBridge = {
  getAppInfo: () => AppInfo;
  openDocs: () => void;
  openTutorial: () => void;
  onTrayEvent?: (listener: (event: TrayEvent) => void) => () => void;
  checkForUpdates?: () => Promise<string>;
  sendLog?: (message: string) => void;
};

declare global {
  interface Window {
    dashboardBridge?: DashboardBridge;
  }

  const NL_APPID: string;
  const NL_PORT: number;
  const NL_OS: string;
  const NL_VERSION: string;
  const NL_CVERSION: string;
}

const { useEffect, useMemo, useState, useCallback } = React;

const statusMessages: Record<'loading' | 'ready' | 'error', string> = {
  loading: 'Attempting to contact the Node.js API service…',
  ready: 'Synced with the Node.js API successfully.',
  error: 'Unable to reach the Node.js API. Falling back to cached data.',
};

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

const Dashboard: React.FC = () => {
  const [appInfo, setAppInfo] = useState<AppInfo | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [apiStatus, setApiStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [trayEvents, setTrayEvents] = useState<TrayEvent[]>([]);
  const [checkingUpdates, setCheckingUpdates] = useState<boolean>(false);
  const [updateMessage, setUpdateMessage] = useState<string>('');

  useEffect(() => {
    const bridge = window.dashboardBridge;

    if (bridge) {
      setAppInfo(bridge.getAppInfo());
      bridge.sendLog?.('React dashboard initialized.');

      if (bridge.onTrayEvent) {
        const unsubscribe = bridge.onTrayEvent((event) => {
          setTrayEvents((current) => {
            const next = [event, ...current];
            return next.slice(0, 6);
          });
        });

        return () => {
          unsubscribe?.();
        };
      }
    } else {
      setAppInfo({
        id: typeof NL_APPID !== 'undefined' ? NL_APPID : 'unknown-app',
        port: typeof NL_PORT !== 'undefined' ? NL_PORT : 0,
        os: typeof NL_OS !== 'undefined' ? NL_OS : 'Unknown OS',
        version: typeof NL_VERSION !== 'undefined' ? NL_VERSION : '0.0.0',
        clientVersion:
          typeof NL_CVERSION !== 'undefined' ? NL_CVERSION : '0.0.0',
      });
    }
  }, []);

  const loadDashboardData = useCallback(async () => {
    try {
      setApiStatus('loading');
      const response = await fetch('/data/dashboard.json', {
        headers: {
          'Cache-Control': 'no-cache',
        },
      });

      if (!response.ok) {
        throw new Error('Unable to load dashboard data');
      }

      const data: DashboardData = await response.json();
      setDashboardData(data);
      setApiStatus('ready');
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (error) {
      console.error('Dashboard data request failed', error);
      setApiStatus('error');
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const initialise = async () => {
      await loadDashboardData();
    };

    initialise();

    const interval = window.setInterval(() => {
      if (mounted) {
        loadDashboardData();
      }
    }, 60000);

    return () => {
      mounted = false;
      window.clearInterval(interval);
    };
  }, [loadDashboardData]);

  const handleCheckUpdates = useCallback(async () => {
    if (checkingUpdates) {
      return;
    }

    try {
      setCheckingUpdates(true);
      const version = await window.dashboardBridge?.checkForUpdates?.();
      if (version) {
        setUpdateMessage('Running Neutralino bundle version ' + version);
      } else {
        setUpdateMessage('No update metadata returned.');
      }
    } catch (error) {
      console.error('Update check failed', error);
      setUpdateMessage('Unable to contact the Neutralino backend.');
    } finally {
      setTimeout(() => setUpdateMessage(''), 5000);
      setCheckingUpdates(false);
    }
  }, [checkingUpdates]);

  const metrics = dashboardData?.metrics ?? [];
  const tasks = dashboardData?.tasks ?? [];
  const services = dashboardData?.services ?? [];

  const apiStatusBadge = useMemo(() => {
    return (
      <span className={`status-badge status-badge--${apiStatus}`}>
        {statusMessages[apiStatus]}
      </span>
    );
  }, [apiStatus]);

  return (
    <div className="dashboard">
      <header className="dashboard__header">
        <div>
          <h1 className="dashboard__title">Application Control Center</h1>
          <p className="dashboard__subtitle">
            Observability console for the Node.js backend, Neutralino runtime, and
            React TypeScript interface communicating over IPC and REST.
          </p>
        </div>
        <div className="dashboard__header-actions">
          <button
            type="button"
            className="button button--ghost"
            onClick={() => window.dashboardBridge?.openDocs()}
          >
            Open documentation
          </button>
          <button
            type="button"
            className="button"
            onClick={() => window.dashboardBridge?.openTutorial()}
          >
            Watch tutorial
          </button>
        </div>
      </header>

      <section className="dashboard__info">
        <article className="info-card">
          <div className="info-card__grid">
            <span>Application ID</span>
            <strong>{appInfo?.id ?? 'Loading&hellip;'}</strong>
            <span>Runtime version</span>
            <strong>{appInfo?.version ?? 'Unknown'}</strong>
            <span>Client version</span>
            <strong>{appInfo?.clientVersion ?? 'Unknown'}</strong>
            <span>Operating system</span>
            <strong>{appInfo?.os ?? 'Unknown'}</strong>
            <span>IPC port</span>
            <strong>{appInfo?.port ?? '-'}</strong>
          </div>
          <div className="info-card__grid">
            <span>Update status</span>
            <strong>{updateMessage || 'No updates requested yet'}</strong>
          </div>
          <button
            type="button"
            className="button button--secondary"
            onClick={handleCheckUpdates}
            disabled={checkingUpdates}
          >
            {checkingUpdates ? 'Checking for updates…' : 'Check for updates'}
          </button>
        </article>

        <article className="info-card">
          {apiStatusBadge}
          <p className="info-card__subtitle">
            {apiStatus === 'ready'
              ? `Last refreshed at ${lastUpdated}.`
              : 'The dashboard will retry automatically every minute.'}
          </p>
          <button
            type="button"
            className="button button--ghost"
            onClick={() => loadDashboardData()}
          >
            Refresh now
          </button>
        </article>
      </section>

      <section className="dashboard__metrics">
        {metrics.map((metric) => (
          <article key={metric.label} className="metric-card">
            <span className="metric-card__label">{metric.label}</span>
            <p className="metric-card__value">{metric.value}</p>
            <span
              className={`metric-card__trend metric-card__trend--${
                metric.change >= 0 ? 'up' : 'down'
              }`}
            >
              {metric.change >= 0 ? '▲' : '▼'} {Math.abs(metric.change)}%
            </span>
          </article>
        ))}
      </section>

      <section className="dashboard__main-grid">
        <article className="card">
          <h2>Service health</h2>
          <ul className="service-list">
            {services.map((service) => (
              <li key={service.name} className="service-item">
                <div className="service-item__meta">
                  <strong>{service.name}</strong>
                  <span className="service-item__latency">
                    Average latency: {service.responseTime}ms
                  </span>
                </div>
                <span className={`service-status service-status--${service.status}`}>
                  {service.status}
                </span>
              </li>
            ))}
          </ul>
        </article>

        <article className="card">
          <h2>Deployment tasks</h2>
          <ul className="task-list">
            {tasks.map((task) => {
              const badgeVariant =
                task.status === 'Completed'
                  ? 'ready'
                  : task.status === 'In Progress'
                  ? 'loading'
                  : 'error';

              return (
                <li key={task.id} className="task-item">
                  <div>
                    <p className="task-item__title">{task.title}</p>
                    <span className="task-item__status">{task.status}</span>
                  </div>
                  <span className={`status-badge status-badge--${badgeVariant}`}>
                    {badgeVariant === 'ready'
                      ? 'Done'
                      : badgeVariant === 'loading'
                      ? 'In progress'
                      : 'Action needed'}
                  </span>
                </li>
              );
            })}
          </ul>
        </article>

        <article className="card">
          <h2>Recent tray interactions</h2>
          {trayEvents.length > 0 ? (
            <ul className="tray-feed">
              {trayEvents.map((event) => (
                <li key={`${event.id}-${event.timestamp}`} className="tray-feed__item">
                  <span>{event.id}</span>
                  <span className="tray-feed__time">{formatTime(event.timestamp)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="empty-state">
              Trigger the Neutralino tray actions to see live telemetry here.
            </p>
          )}
        </article>
      </section>
    </div>
  );
};

const container = document.getElementById('root');
if (container) {
  const root = ReactDOM.createRoot(container);
  root.render(<Dashboard />);
}
