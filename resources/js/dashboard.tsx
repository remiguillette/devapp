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

type ClassValue = string | false | null | undefined;

type ButtonVariant = 'primary' | 'secondary' | 'ghost';

type ButtonProps = React.PropsWithChildren<
  {
    variant?: ButtonVariant;
    icon?: React.ReactNode;
    className?: string;
  } & React.ButtonHTMLAttributes<HTMLButtonElement>
>;

type CardProps = React.PropsWithChildren<
  {
    title?: string;
    caption?: string;
    adornment?: React.ReactNode;
    className?: string;
  } & React.HTMLAttributes<HTMLDivElement>
>;

type BadgeTone = 'neutral' | 'positive' | 'warning' | 'critical' | 'info';

type BadgeProps = React.PropsWithChildren<
  {
    tone?: BadgeTone;
    className?: string;
  } & React.HTMLAttributes<HTMLSpanElement>
>;

type TagTone = 'default' | 'info' | 'success' | 'danger';

type TagProps = React.PropsWithChildren<
  {
    tone?: TagTone;
    className?: string;
  } & React.HTMLAttributes<HTMLSpanElement>
>;

type LucideIcon = React.ComponentType<
  {
    size?: number | string;
    color?: string;
    strokeWidth?: number | string;
    className?: string;
  }
>;

type AppTileProps = {
  icon?: LucideIcon;
  name: string;
  accent: 'cyan' | 'violet' | 'amber';
};

type GlobalLucide = {
  [key: string]: LucideIcon;
};

declare global {
  interface Window {
    LucideReact?: GlobalLucide;
  }
}

function joinClassNames(...classes: ClassValue[]): string {
  return classes.filter(Boolean).join(' ');
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  icon,
  className = '',
  children,
  ...props
}) => {
  return (
    <button
      className={joinClassNames('ui-button', `ui-button--${variant}`, className)}
      {...props}
    >
      {icon ? (
        <span className="ui-button__icon" aria-hidden="true">
          {icon}
        </span>
      ) : null}
      <span className="ui-button__label">{children}</span>
    </button>
  );
};

const Card: React.FC<CardProps> = ({
  title,
  caption,
  adornment,
  className = '',
  children,
  ...props
}) => {
  return (
    <section className={joinClassNames('ui-card', className)} {...props}>
      {(title || caption || adornment) && (
        <header className="ui-card__header">
          <div>
            {title ? <h2 className="ui-card__title">{title}</h2> : null}
            {caption ? <p className="ui-card__caption">{caption}</p> : null}
          </div>
          {adornment ? <div className="ui-card__adornment">{adornment}</div> : null}
        </header>
      )}
      <div className="ui-card__body">{children}</div>
    </section>
  );
};

const Badge: React.FC<BadgeProps> = ({
  tone = 'neutral',
  className = '',
  children,
  ...props
}) => {
  return (
    <span
      className={joinClassNames('ui-badge', `ui-badge--${tone}`, className)}
      {...props}
    >
      {children}
    </span>
  );
};

const Tag: React.FC<TagProps> = ({
  tone = 'default',
  className = '',
  children,
  ...props
}) => {
  return (
    <span className={joinClassNames('ui-tag', `ui-tag--${tone}`, className)} {...props}>
      {children}
    </span>
  );
};

const AppTile: React.FC<AppTileProps> = ({ icon: Icon, name, accent }) => {
  const fallbackInitial = name ? name.charAt(0).toUpperCase() : '?';

  return (
    <article className={joinClassNames('app-tile', `app-tile--${accent}`)}>
      <div className="app-tile__icon-surface" aria-hidden="true">
        {Icon ? (
          <Icon className="app-tile__icon" strokeWidth={1.75} />
        ) : (
          <span className="app-tile__fallback">{fallbackInitial}</span>
        )}
      </div>
      <h3 className="app-tile__name">{name}</h3>
    </article>
  );
};

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

  const lucideIcons = useMemo(() => {
    const library = window.LucideReact;
    return {
      phone: library?.Smartphone,
      home: library?.Home,
      network: library?.Network,
    };
  }, []);

  const apps = useMemo<AppTileProps[]>(
    () => [
      { icon: lucideIcons.phone, name: 'BeaverPhone', accent: 'cyan' },
      { icon: lucideIcons.home, name: 'BeaverHome', accent: 'violet' },
      { icon: lucideIcons.network, name: 'BeaverNet', accent: 'amber' },
    ],
    [lucideIcons.home, lucideIcons.network, lucideIcons.phone]
  );

  const statusTone: BadgeTone =
    apiStatus === 'ready' ? 'positive' : apiStatus === 'loading' ? 'info' : 'critical';

  const updateTagTone: TagTone = updateMessage
    ? updateMessage.includes('Unable')
      ? 'danger'
      : 'success'
    : 'default';

  return (
    <div className="dashboard">
      <aside className="dashboard__aside">
        <div className="brand">
          <span className="brand__title">BeaverKiosk</span>
          <Tag tone="info">Menu</Tag>
        </div>
        <p className="brand__subtitle">
          Launch kiosk-ready Beaver experiences and monitor runtime state in one
          place.
        </p>
        <div className="brand__actions">
          <Button
            type="button"
            variant="ghost"
            onClick={() => window.dashboardBridge?.openDocs()}
          >
            Documentation
          </Button>
          <Button
            type="button"
            onClick={() => window.dashboardBridge?.openTutorial()}
          >
            Watch tutorial
          </Button>
        </div>

        <Card
          title="Platform overview"
          caption="Neutralino runtime details"
          adornment={<Badge tone={statusTone}>{statusMessages[apiStatus]}</Badge>}
        >
          <dl className="key-value-grid">
            <div>
              <dt>Application</dt>
              <dd>{appInfo?.id ?? 'Loading…'}</dd>
            </div>
            <div>
              <dt>Runtime</dt>
              <dd>{appInfo?.version ?? 'Unknown'}</dd>
            </div>
            <div>
              <dt>Client</dt>
              <dd>{appInfo?.clientVersion ?? 'Unknown'}</dd>
            </div>
            <div>
              <dt>OS</dt>
              <dd>{appInfo?.os ?? 'Unknown'}</dd>
            </div>
            <div>
              <dt>IPC port</dt>
              <dd>{appInfo?.port ?? '—'}</dd>
            </div>
          </dl>
          <div className="aside-actions">
            <Button
              type="button"
              variant="secondary"
              onClick={handleCheckUpdates}
              disabled={checkingUpdates}
            >
              {checkingUpdates ? 'Checking…' : 'Check for updates'}
            </Button>
            <Tag tone={updateTagTone} aria-live="polite">
              {updateMessage || 'No updates requested yet'}
            </Tag>
          </div>
        </Card>

        <Card title="Data refresh" caption="REST API synchronisation">
          <p className="muted-text">
            {apiStatus === 'ready'
              ? `Last refreshed at ${lastUpdated}.`
              : 'The dashboard will retry automatically every minute.'}
          </p>
          <Button type="button" variant="ghost" onClick={() => loadDashboardData()}>
            Refresh now
          </Button>
        </Card>
      </aside>

      <main className="dashboard__main">
        <section className="section">
          <header className="section__header">
            <div>
              <h1 className="section__title">List of apps</h1>
              <p className="section__subtitle">
                Icons and bold naming keep the Beaver suite easy to scan.
              </p>
            </div>
            <Badge tone={statusTone}>{statusMessages[apiStatus]}</Badge>
          </header>
          <div className="app-grid">
            {apps.map((app) => (
              <AppTile key={app.name} {...app} />
            ))}
          </div>
        </section>

        <div className="dashboard__main-grid">
          <Card title="Key metrics" caption="Trend snapshots">
            <div className="metric-grid">
              {metrics.map((metric) => {
                const trendUp = metric.change >= 0;
                return (
                  <div
                    key={metric.label}
                    className={joinClassNames(
                      'metric-pill',
                      trendUp ? 'metric-pill--up' : 'metric-pill--down'
                    )}
                  >
                    <span className="metric-pill__label">{metric.label}</span>
                    <strong className="metric-pill__value">{metric.value}</strong>
                    <Tag tone={trendUp ? 'success' : 'danger'}>
                      {trendUp ? '▲' : '▼'} {Math.abs(metric.change)}%
                    </Tag>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card title="Deployment tasks" caption="Rollout checklist">
            <ul className="ui-list">
              {tasks.map((task) => {
                const tone: TagTone =
                  task.status === 'Completed'
                    ? 'success'
                    : task.status === 'In Progress'
                    ? 'info'
                    : 'danger';

                return (
                  <li key={task.id} className="ui-list__item">
                    <div>
                      <p className="ui-list__title">{task.title}</p>
                      <span className="ui-list__description">{task.status}</span>
                    </div>
                    <Tag tone={tone}>
                      {tone === 'success'
                        ? 'Done'
                        : tone === 'info'
                        ? 'In progress'
                        : 'Action needed'}
                    </Tag>
                  </li>
                );
              })}
            </ul>
          </Card>

          <Card title="Service health" caption="Edge agents">
            <ul className="ui-list">
              {services.map((service) => {
                const tone: BadgeTone =
                  service.status === 'online'
                    ? 'positive'
                    : service.status === 'degraded'
                    ? 'warning'
                    : 'critical';

                return (
                  <li key={service.name} className="ui-list__item">
                    <div>
                      <p className="ui-list__title">{service.name}</p>
                      <span className="ui-list__description">
                        Average latency: {service.responseTime}ms
                      </span>
                    </div>
                    <Badge tone={tone}>{service.status}</Badge>
                  </li>
                );
              })}
            </ul>
          </Card>

          <Card title="Recent tray events" caption="Neutralino tray telemetry">
            {trayEvents.length > 0 ? (
              <ul className="ui-list ui-list--stacked">
                {trayEvents.map((event) => (
                  <li key={`${event.id}-${event.timestamp}`} className="ui-list__item">
                    <div>
                      <p className="ui-list__title">{event.id}</p>
                      <span className="ui-list__description">
                        {formatTime(event.timestamp)}
                      </span>
                    </div>
                    <Tag tone="info">Tray</Tag>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="empty-state">
                Trigger the Neutralino tray actions to see live telemetry here.
              </p>
            )}
          </Card>
        </div>
      </main>
    </div>
  );
};

const container = document.getElementById('root');
if (container) {
  const root = ReactDOM.createRoot(container);
  root.render(<Dashboard />);
}
