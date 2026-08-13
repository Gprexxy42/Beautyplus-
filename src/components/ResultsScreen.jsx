import React, { useState } from 'react';
import { Eye, Sparkles, RefreshCw } from 'lucide-react';
import InsightPanel from './InsightPanel';
import RoutineOutput from './RoutineOutput';
import { getSeasonClasses } from '../lib/seasonClasses';

const CONCERN_KEYS = ['acne', 'moisture', 'age_spot', 'redness', 'texture', 'oiliness'];

export default function ResultsScreen({ analysisReport, rawPayload, apiSource, userPhotoUrl, season, onToggleSeason, onResetScan }) {
  const [activeTab, setActiveTab] = useState('overview');
  const sc = getSeasonClasses(season);

  const { topConcerns, allConcerns, pihRisk, routine, disclaimer } = analysisReport;

  const getBandBadgeClass = (band) => {
    switch (band) {
      case 'low': return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border-emerald-500/20';
      case 'moderate': return 'bg-amber-500/10 text-amber-600 dark:text-amber-300 border-amber-500/20';
      case 'high': return 'bg-rose-500/10 text-rose-600 dark:text-rose-300 border-rose-500/20';
      default: return 'bg-base-border text-bone-muted';
    }
  };

  const getBandLabel = (band) => {
    switch (band) {
      case 'low': return 'Looking Great';
      case 'moderate': return 'Gentle Care Needed';
      case 'high': return 'Primary Focus';
      default: return band;
    }
  };

  const tabs = ['overview', 'insight', 'routine'];

  return (
    <div className="min-h-[85vh] max-w-xl mx-auto py-4 px-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-base-border pb-3">
        <div>
          <span className={`text-[10px] font-sans uppercase tracking-widest ${sc.accentText} font-medium transition-colors duration-500`}>
            Your Personalized Profile
          </span>
          <h1 className="text-2xl font-sans font-light text-bone mt-1 tracking-wide">Skin Health & Climate Report</h1>
        </div>
        <button
          onClick={onResetScan}
          className="p-2.5 rounded-full bg-base-card/50 backdrop-blur-md border border-base-border/50 text-bone-muted hover:text-bone hover:bg-base-hover hover:scale-105 transition-all shadow-sm flex items-center justify-center"
          title="New Scan"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-3 gap-1 bg-base-card p-1 rounded-2xl border border-base-border">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`py-3 rounded-xl text-xs font-sans font-medium transition-all duration-300 relative capitalize ${
              activeTab === tab
                ? `bg-base-hover/80 text-bone shadow-sm border ${sc.accentBorderDim} backdrop-blur-sm`
                : 'text-bone-muted hover:text-bone'
            }`}
          >
            {tab === 'overview' ? 'Skin Overview' : tab === 'insight' ? 'Climate Insight' : 'Your Ritual'}
            {tab === 'insight' && (
              <span className={`absolute top-1.5 right-1.5 w-2 h-2 rounded-full ${sc.accentBg} animate-pulse transition-colors duration-500`} />
            )}
          </button>
        ))}
      </div>

      {/* Tab: Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="bg-base-card/60 backdrop-blur-xl p-5 rounded-3xl border border-base-border/40 shadow-2xl shadow-black/20 space-y-4">
            <div className="flex items-center justify-center">
              <span className="text-sm font-sans font-medium text-bone flex items-center gap-2">
                <Sparkles className={`w-4 h-4 ${sc.accentText} transition-colors duration-500`} />
                <span>Your Analysis</span>
              </span>
            </div>

            <div className="relative w-full aspect-[4/5] max-w-sm mx-auto rounded-2xl overflow-hidden border border-base-border/50 bg-black shadow-inner group">
              <img
                src={userPhotoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop'}
                alt="Selfie scan"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
            </div>
          </div>

          {/* Concerns list */}
          <div className="space-y-3">
            <h2 className="text-sm font-sans font-medium text-bone flex items-center gap-2 ml-2">
              <Eye className={`w-4 h-4 ${sc.accentText} transition-colors duration-500`} />
              <span>Key Discoveries</span>
            </h2>
            {allConcerns.map((concern) => (
              <div key={concern.key} className={`bg-base-card/60 backdrop-blur-md p-5 rounded-2xl border border-base-border/40 space-y-2 hover:bg-base-hover/80 hover:shadow-lg transition-all duration-300`}>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-sans font-medium text-bone tracking-wide">{concern.metadata.label}</h3>
                  <span className={`px-3 py-1 rounded-full text-[11px] font-sans font-medium border ${getBandBadgeClass(concern.band)}`}>
                    {getBandLabel(concern.band)}
                  </span>
                </div>
                <p className="text-sm text-bone-muted font-sans leading-relaxed pt-1">{concern.headline}</p>
                <div className="pt-3 mt-3 border-t border-base-border/30 text-xs font-sans text-bone-muted/70 italic">
                  <span>{concern.metadata.description}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'insight' && (
        <InsightPanel pihRisk={pihRisk} season={season} onToggleSeason={onToggleSeason} topConcerns={topConcerns} />
      )}
      {activeTab === 'routine' && (
        <RoutineOutput routine={routine} season={season} onToggleSeason={onToggleSeason} disclaimer={disclaimer} />
      )}

      {/* Disclaimer Copy */}
      <div className="text-center pt-4 border-t border-base-border/50">
        <p className="text-[11px] text-bone-muted/80 font-sans italic">ℹ️ {disclaimer}</p>
      </div>
    </div>
  );
}
