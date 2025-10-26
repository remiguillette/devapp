import React from 'react';

const FALLBACK_ACCENT = 'amber';

export function AppTile({ name, icon: IconComponent, accent = FALLBACK_ACCENT, onClick }) {
  const fallbackInitial = name.charAt(0).toUpperCase();
  const accentClass = `app-tile--${accent}`;

  return (
    <button type="button" className={`app-tile ${accentClass}`} onClick={onClick}>
      <div className="app-tile__icon" aria-hidden="true">
        {IconComponent ? (
          <IconComponent size={42} strokeWidth={1.75} />
        ) : (
          <span>{fallbackInitial}</span>
        )}
      </div>
      <h3 className="app-tile__name">{name}</h3>
    </button>
  );
}
