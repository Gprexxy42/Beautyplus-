import React, { useState } from 'react';
import { CheckCircle2, BookmarkCheck, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import SeasonToggle from './SeasonToggle';
import { getSeasonClasses } from '../lib/seasonClasses';

export default function RoutineOutput({ routine, season, onToggleSeason, disclaimer }) {
  const [saved, setSaved] = useState(false);
  const [expandedIdx, setExpandedIdx] = useState(0);
  const sc = getSeasonClasses(season);

  const handleSaveRoutine = () => {
    try {
      localStorage.setItem('saved_skin_routine', JSON.stringify({ season, savedAt: new Date().toISOString(), steps: routine }));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) { console.error('LocalStorage error', e); }
  };

  return (
    <div className="space-y-6">
      <div className="sticky top-4 z-10 bg-base-card/60 backdrop-blur-xl p-4 rounded-3xl border border-base-border/40 shadow-xl text-center">
        <SeasonToggle currentSeason={season} onToggleSeason={onToggleSeason} />
      </div>

      <div className="bg-base-card/60 backdrop-blur-xl p-6 rounded-3xl border border-base-border/40 shadow-xl space-y-5">
        <div className="flex items-center justify-between border-b border-base-border/30 pb-4">
          <div>
            <div className={`flex items-center gap-2 text-xs font-sans font-medium ${sc.accentText} transition-colors duration-500`}>
              <Sparkles className="w-4 h-4" />
              <span className="uppercase tracking-widest">Climate-Adjusted Care</span>
            </div>
            <h2 className="text-xl font-sans font-light tracking-wide text-bone mt-1">
              Daily Ritual ({season === 'harmattan' ? 'Harmattan' : 'Rainy Season'})
            </h2>
          </div>

          <button
            onClick={handleSaveRoutine}
            className={`py-2 px-3.5 rounded-full text-xs font-sans font-medium border transition-all flex items-center gap-2 shadow-sm hover:scale-105 ${
              saved
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : `bg-base-hover/80 border-base-border/50 text-bone ${sc.hoverBorder} backdrop-blur-sm`
            }`}
          >
            {saved ? (
              <><CheckCircle2 className="w-4 h-4 text-emerald-400" /><span>Saved!</span></>
            ) : (
              <><BookmarkCheck className={`w-4 h-4 ${sc.accentText} transition-colors duration-500`} /><span>Save Routine</span></>
            )}
          </button>
        </div>

        <div className="space-y-4 pt-2">
          {routine.map((step, idx) => {
            const isExpanded = expandedIdx === idx;
            return (
            <div 
              key={idx} 
              onClick={() => setExpandedIdx(isExpanded ? null : idx)}
              className={`bg-base-hover/40 backdrop-blur-sm p-5 rounded-2xl border border-base-border/40 space-y-2 cursor-pointer hover:bg-base-hover/70 hover:shadow-lg transition-all duration-300 group`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-xs font-sans font-medium ${sc.accentText} uppercase tracking-widest transition-colors duration-500`}>{step.step}</span>
                <span className="text-[10px] font-sans font-medium text-bone-muted/90 bg-base-card/80 px-2.5 py-1 rounded-full border border-base-border/50 shadow-inner">{step.productType}</span>
              </div>
              <div className="flex items-center justify-between">
                <h3 className="text-base font-sans font-medium text-bone tracking-wide group-hover:text-white transition-colors">{step.title}</h3>
                {isExpanded ? <ChevronUp className="w-5 h-5 text-bone-muted group-hover:text-bone transition-colors" /> : <ChevronDown className="w-5 h-5 text-bone-muted group-hover:text-bone transition-colors" />}
              </div>
              {isExpanded && (
                <div className="pt-3 mt-2 border-t border-base-border/30">
                  <p className="text-sm text-bone-muted/90 font-sans leading-relaxed">
                    <strong className="text-bone font-medium">Why it matters:</strong> {step.why}
                  </p>
                </div>
              )}
            </div>
            );
          })}
        </div>
      </div>

      <div className="bg-base-card/40 backdrop-blur-md p-5 rounded-2xl border border-base-border/30 text-center">
        <p className="text-xs text-bone-muted/80 font-sans leading-relaxed">
          💡 Switch the climate toggle above during seasonal shifts to adjust your ritual for Harmattan or Rainy season.
        </p>
      </div>
    </div>
  );
}
