import React from 'react';
import { Sun, CloudRain, Sparkles } from 'lucide-react';
import { SEASONS } from '../lib/seasonLogic';
import { getSeasonClasses } from '../lib/seasonClasses';

export default function SeasonToggle({ currentSeason, onToggleSeason, className = '' }) {
  const isHarmattan = currentSeason === SEASONS.HARMATTAN;
  const sc = getSeasonClasses(currentSeason);

  return (
    <div className={`inline-flex flex-col items-center ${className}`}>
      <div className="text-xs uppercase tracking-widest font-mono text-bone-muted mb-2 flex items-center gap-1.5">
        <Sparkles className={`w-3.5 h-3.5 ${sc.accentText} animate-pulse transition-colors duration-500`} />
        <span>Active Climate Lens</span>
      </div>

      {/* Toggle pill */}
      <div
        className={`relative bg-base-card p-1.5 rounded-full border ${sc.accentBorderDim} shadow-xl flex items-center cursor-pointer w-64 select-none transition-colors duration-500`}
        onClick={() => onToggleSeason(isHarmattan ? SEASONS.RAINY : SEASONS.HARMATTAN)}
      >
        {/* Sliding active pill */}
        <div
          className={`absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] rounded-full flex items-center justify-center shadow-lg font-semibold transition-all duration-500 ease-out ${sc.pillBg}`}
          style={{ left: isHarmattan ? '6px' : 'calc(50% + 3px)' }}
        >
          {isHarmattan ? (
            <div className="flex items-center gap-1.5 text-xs font-heading uppercase tracking-wide text-base-DEFAULT">
              <Sun className="w-4 h-4" />
              <span>Harmattan</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-xs font-heading uppercase tracking-wide text-bone">
              <CloudRain className="w-4 h-4" />
              <span>Rainy</span>
            </div>
          )}
        </div>

        {/* Inactive label: Harmattan */}
        <div className={`w-1/2 text-center py-2 text-xs font-heading uppercase tracking-wide z-10 ${isHarmattan ? 'opacity-0' : 'text-bone-muted'} transition-opacity duration-300`}>
          <div className="flex items-center justify-center gap-1.5">
            <Sun className="w-3.5 h-3.5" />
            <span>Harmattan</span>
          </div>
        </div>

        {/* Inactive label: Rainy */}
        <div className={`w-1/2 text-center py-2 text-xs font-heading uppercase tracking-wide z-10 ${!isHarmattan ? 'opacity-0' : 'text-bone-muted'} transition-opacity duration-300`}>
          <div className="flex items-center justify-center gap-1.5">
            <CloudRain className="w-3.5 h-3.5" />
            <span>Rainy</span>
          </div>
        </div>
      </div>

      <p className="text-[11px] text-bone-muted mt-2 text-center max-w-xs font-sans">
        {isHarmattan
          ? '☀️ Dry wind lens: Priorities shift to hydration & barrier seal'
          : '🌧️ High humidity lens: Priorities shift to pore clarity & oil balance'}
      </p>
    </div>
  );
}
