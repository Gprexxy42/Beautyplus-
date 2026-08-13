import React from 'react';
import { ShieldAlert, Sun, CloudRain } from 'lucide-react';
import SeasonToggle from './SeasonToggle';
import { SEASON_METADATA } from '../lib/seasonLogic';
import { getSeasonClasses } from '../lib/seasonClasses';

export default function InsightPanel({ pihRisk, season, onToggleSeason, topConcerns }) {
  const currentSeasonMeta = SEASON_METADATA[season];
  const sc = getSeasonClasses(season);

  const getRiskBadgeColor = (band) => {
    switch (band) {
      case 'high': return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'moderate': return 'bg-yellow-500/15 text-yellow-200 border-yellow-500/30';
      default: return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-base-card/60 backdrop-blur-xl p-4 rounded-3xl border border-base-border/40 shadow-xl text-center space-y-3">
        <SeasonToggle currentSeason={season} onToggleSeason={onToggleSeason} />
      </div>

      {/* PIH Risk */}
      <div className="bg-base-card/60 backdrop-blur-xl p-6 rounded-3xl border border-base-border/40 shadow-xl space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-full ${sc.accentBgDim} ${sc.accentText} shadow-inner transition-colors duration-500`}>
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-sans font-medium text-bone tracking-wide">Pigmentation Care</h3>
              <p className="text-xs font-sans text-bone-muted mt-0.5">Focusing on dark spots & tone</p>
            </div>
          </div>
          <span className={`px-3 py-1.5 rounded-full text-[11px] font-sans font-medium border ${getRiskBadgeColor(pihRisk.band)} tracking-wide`}>
            Level {Math.round(pihRisk.score / 10)}
          </span>
        </div>

        <div className="space-y-2">
          <div className="w-full h-1.5 bg-base-border/50 rounded-full overflow-hidden shadow-inner">
            <div
              className="h-full rounded-full transition-all duration-1000 ease-out bg-gradient-to-r from-emerald-400 via-amber-300 to-rose-400 shadow-[0_0_10px_rgba(251,191,36,0.4)]"
              style={{ width: `${pihRisk.score}%` }}
            />
          </div>
        </div>

        <p className="text-sm text-bone/90 font-sans leading-relaxed bg-base-hover/40 p-4 rounded-2xl border border-base-border/30 backdrop-blur-sm">
          {pihRisk.explanation}
        </p>
      </div>

      {/* Climate summary */}
      <div className="bg-base-card/60 backdrop-blur-xl p-6 rounded-3xl border border-base-border/40 shadow-xl space-y-4">
        <div className="flex items-center gap-2 text-base font-sans font-medium text-bone tracking-wide">
          {season === 'harmattan'
            ? <Sun className={`w-5 h-5 ${sc.accentText} transition-colors duration-500 drop-shadow-md`} />
            : <CloudRain className={`w-5 h-5 ${sc.accentText} transition-colors duration-500 drop-shadow-md`} />
          }
          <span>Your {currentSeasonMeta.name} Guide</span>
        </div>
        <p className="text-sm text-bone-muted font-sans leading-relaxed">{currentSeasonMeta.description}</p>
        <div className="pt-4 border-t border-base-border/30">
          <span className="text-xs font-sans font-medium text-bone-muted/80 block mb-3">Suggested Focus Areas:</span>
          <div className="flex flex-wrap gap-2">
            {topConcerns.map((concern) => (
              <span key={concern.key} className="px-3 py-1.5 rounded-full bg-base-hover/50 border border-base-border/50 text-xs font-sans font-medium text-bone/90 backdrop-blur-sm shadow-sm">
                {concern.metadata.label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
