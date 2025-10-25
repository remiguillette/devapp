/// <reference path="./neutralino.d.ts" />

type Accent = 'amber' | 'violet' | 'cyan' | 'red' | 'green';

type LucideIcon = React.ComponentType<
  {
    size?: number | string;
    color?: string;
    strokeWidth?: number | string;
    className?: string;
  } & React.SVGProps<SVGSVGElement>
>;

type AppTileProps = {
  name: string;
  icon?: LucideIcon;
  accent: Accent;
  onClick?: () => void;
};

function resolveIcon(iconName: string): LucideIcon | undefined {
  const lucideReact = (window as typeof window & {
    LucideReact?: {
      icons?: Record<string, LucideIcon | undefined>;
    };
  }).LucideReact;

  return lucideReact?.icons?.[iconName];
}

const icons = {
  Smartphone: resolveIcon('Smartphone'),
  Home: resolveIcon('Home'),
  Shield: resolveIcon('Shield'),
  FileText: resolveIcon('FileText'),
  Network: resolveIcon('Network'),
};

const AppTile: React.FC<AppTileProps> = ({ name, icon: Icon, accent, onClick }) => {
  const fallbackInitial = name.charAt(0).toUpperCase();

  return (
    <button
      type="button"
      className={`app-tile app-tile--${accent}`}
      onClick={onClick}
    >
      <div className="app-tile__icon" aria-hidden="true">
        {Icon ? <Icon size={42} strokeWidth={1.75} /> : <span>{fallbackInitial}</span>}
      </div>
      <h3 className="app-tile__name">{name}</h3>
    </button>
  );
};

const BeaverMenu: React.FC = () => {
  const apps: AppTileProps[] = [
    { name: 'BeaverPhone', icon: icons.Smartphone, accent: 'cyan' },
    { name: 'BeaverHome', icon: icons.Home, accent: 'violet' },
    { name: 'BeaverAlarm', icon: icons.Shield, accent: 'amber' },
    { name: 'BeaverDoc', icon: icons.FileText, accent: 'red' },
    { name: 'BeaverNet', icon: icons.Network, accent: 'green' },
  ];

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
      </main>

      <footer className="menu-footer">
        <small>NeutralinoJS • React • Beaver Suite ©2025</small>
      </footer>
    </div>
  );
};

const rootElement = document.getElementById('root');

if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(<BeaverMenu />);
}
