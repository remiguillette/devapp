import React from 'react';
import * as Icons from 'lucide-react';

import { fetchMenu } from '../api/menu.js';
import { AppTile } from '../components/AppTile.jsx';

const VALID_ACCENTS = new Set(['amber', 'violet', 'cyan', 'red', 'green']);

function resolveIcon(iconName) {
  if (!iconName) {
    return undefined;
  }

  return Icons[iconName] || undefined;
}

function resolveAccent(accent) {
  if (VALID_ACCENTS.has(accent)) {
    return accent;
  }

  return 'amber';
}

export default function MenuPage() {
  const [apps, setApps] = React.useState([]);
  const [error, setError] = React.useState(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;

    async function loadMenu() {
      try {
        setIsLoading(true);
        setError(null);
        const payload = await fetchMenu();
        if (cancelled) {
          return;
        }

        const mappedApps = Array.isArray(payload?.apps)
          ? payload.apps
              .map((app) => ({
                name: typeof app?.name === 'string' ? app.name.trim() : '',
                accent: resolveAccent(app?.accent),
                icon: resolveIcon(app?.icon),
              }))
              .filter((app) => app.name.length > 0)
          : [];

        setApps(mappedApps);
        setError(mappedApps.length === 0 ? 'No applications available.' : null);
      } catch (loadError) {
        if (!cancelled) {
          console.error('Failed to load menu data', loadError);
          setError('Unable to reach the BeaverKiosk backend (port 5000).');
          setApps([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadMenu();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="menu-root">
      <header className="menu-header">
        <h1>BeaverKiosk</h1>
        <p className="subtitle">Unified application launcher</p>
      </header>

      <main className="menu-grid">
        {apps.map((app) => (
          <AppTile key={app.name} {...app} />
        ))}

        {apps.length === 0 && isLoading && (
          <div className="menu-status" role="status">
            <p>Loading menu from Node backend&hellip;</p>
          </div>
        )}

        {apps.length === 0 && !isLoading && error && (
          <div className="menu-status" role="status">
            <p>{error}</p>
            <p className="menu-status__hint">
              Ensure the Node.js backend is running on port 5000.
            </p>
          </div>
        )}
      </main>

      <footer className="menu-footer">
        <small>Electron • React • Beaver Suite ©2025</small>
      </footer>
    </div>
  );
}
