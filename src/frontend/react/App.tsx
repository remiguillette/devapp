import { useCallback, useEffect, useMemo, useState } from 'react';

type BatteryStatus = {
  level: number | null;
  state: string;
  source: string;
};

type WifiStatus = {
  device: string | null;
  state: string;
  connection: string | null;
  source: string;
};

type SystemStatus = {
  hostname: string;
  battery: BatteryStatus;
  wifi: WifiStatus;
};

const REFRESH_INTERVAL = 15000;

export function App() {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [command, setCommand] = useState('');
  const [notification, setNotification] = useState({ summary: '', body: '' });
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/system');
      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }
      const json = (await response.json()) as SystemStatus;
      setStatus(json);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch system status', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  const batteryDescription = useMemo(() => {
    if (!status) {
      return '–';
    }
    const { level, state } = status.battery;
    if (typeof level === 'number') {
      return `${level}% (${state})`;
    }
    return state;
  }, [status]);

  const wifiDescription = useMemo(() => {
    if (!status) {
      return '–';
    }
    const { connection, state } = status.wifi;
    if (connection) {
      return `${state} → ${connection}`;
    }
    return state;
  }, [status]);

  const runCommand = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      if (!command.trim()) {
        setActionMessage('Enter a command to launch.');
        return;
      }
      try {
        const response = await fetch('/api/apps/open', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ command: command.trim() }),
        });
        if (!response.ok) {
          throw new Error(`Launch failed with status ${response.status}`);
        }
        const payload = await response.json();
        setActionMessage(`Launched ${payload.command} (pid: ${payload.pid ?? 'unknown'})`);
        setCommand('');
      } catch (err) {
        setActionMessage(
          err instanceof Error ? err.message : 'Unable to launch the requested application.'
        );
      }
    },
    [command]
  );

  const sendNotification = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      if (!notification.summary.trim()) {
        setActionMessage('Notification summary is required.');
        return;
      }
      try {
        const response = await fetch('/api/notifications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(notification),
        });
        if (!response.ok) {
          throw new Error(`Notification failed with status ${response.status}`);
        }
        setActionMessage('Notification dispatched.');
        setNotification({ summary: '', body: '' });
      } catch (err) {
        setActionMessage(
          err instanceof Error ? err.message : 'Unable to deliver notification.'
        );
      }
    },
    [notification]
  );

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>BeaverKiosk System Dashboard</h1>
        {status && <p style={styles.subtitle}>Host: {status.hostname}</p>}
      </header>

      {loading ? (
        <p style={styles.message}>Loading system status…</p>
      ) : error ? (
        <p style={{ ...styles.message, color: '#ffb4b4' }}>Failed to load: {error}</p>
      ) : (
        <section style={styles.statusGrid}>
          <article style={styles.card}>
            <h2 style={styles.cardTitle}>Battery</h2>
            <p style={styles.cardValue}>{batteryDescription}</p>
            <p style={styles.cardMeta}>Source: {status?.battery.source}</p>
          </article>
          <article style={styles.card}>
            <h2 style={styles.cardTitle}>Wi-Fi</h2>
            <p style={styles.cardValue}>{wifiDescription}</p>
            <p style={styles.cardMeta}>Device: {status?.wifi.device ?? '—'}</p>
          </article>
        </section>
      )}

      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Launch application</h2>
        <form style={styles.form} onSubmit={runCommand}>
          <input
            style={styles.input}
            placeholder="Command (e.g. firefox)"
            value={command}
            onChange={(event) => setCommand(event.target.value)}
          />
          <button style={styles.button} type="submit">
            Launch
          </button>
        </form>
      </section>

      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Send notification</h2>
        <form style={styles.form} onSubmit={sendNotification}>
          <input
            style={styles.input}
            placeholder="Summary"
            value={notification.summary}
            onChange={(event) => setNotification((prev) => ({ ...prev, summary: event.target.value }))}
          />
          <input
            style={styles.input}
            placeholder="Body"
            value={notification.body}
            onChange={(event) => setNotification((prev) => ({ ...prev, body: event.target.value }))}
          />
          <button style={styles.button} type="submit">
            Notify
          </button>
        </form>
      </section>

      {actionMessage && <p style={styles.feedback}>{actionMessage}</p>}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
    background: 'rgba(9, 18, 34, 0.92)',
    borderRadius: '20px',
    padding: '2rem',
    boxShadow: '0 32px 80px rgba(0, 0, 0, 0.45)',
    border: '1px solid rgba(134, 169, 255, 0.2)',
  },
  header: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  },
  title: {
    margin: 0,
    fontSize: '1.75rem',
    fontWeight: 600,
  },
  subtitle: {
    margin: 0,
    fontSize: '1rem',
    opacity: 0.75,
  },
  statusGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1rem',
  },
  card: {
    background: 'rgba(15, 26, 48, 0.85)',
    borderRadius: '16px',
    padding: '1.5rem',
    border: '1px solid rgba(97, 136, 255, 0.25)',
  },
  cardTitle: {
    margin: 0,
    fontSize: '1.1rem',
    fontWeight: 600,
    color: '#9fb7ff',
  },
  cardValue: {
    margin: '0.75rem 0 0.25rem',
    fontSize: '2rem',
    fontWeight: 600,
    color: '#ffffff',
  },
  cardMeta: {
    margin: 0,
    fontSize: '0.85rem',
    opacity: 0.65,
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    background: 'rgba(15, 26, 48, 0.7)',
    borderRadius: '16px',
    padding: '1.5rem',
    border: '1px solid rgba(97, 136, 255, 0.25)',
  },
  sectionTitle: {
    margin: 0,
    fontSize: '1.25rem',
    fontWeight: 600,
    color: '#9fb7ff',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  input: {
    borderRadius: '12px',
    border: '1px solid rgba(97, 136, 255, 0.35)',
    padding: '0.75rem 1rem',
    fontSize: '1rem',
    background: 'rgba(5, 11, 21, 0.75)',
    color: '#f5f9ff',
  },
  button: {
    alignSelf: 'flex-start',
    borderRadius: '999px',
    padding: '0.6rem 1.4rem',
    fontSize: '1rem',
    fontWeight: 600,
    color: '#050b15',
    background: 'linear-gradient(90deg, #7ab8ff, #ab7cff)',
    border: 'none',
    cursor: 'pointer',
  },
  message: {
    fontSize: '1rem',
    opacity: 0.8,
  },
  feedback: {
    margin: 0,
    fontSize: '0.95rem',
    color: '#bcd6ff',
  },
};

export default App;
