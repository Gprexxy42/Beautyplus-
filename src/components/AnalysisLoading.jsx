import React, { useEffect, useState } from 'react';
import { Sparkles, ShieldCheck } from 'lucide-react';
import { getSeasonClasses } from '../lib/seasonClasses';

const EDUCATIONAL_TIPS = [
  "Harmattan winds dry out epidermal lipids — barrier repair is key.",
  "Melanin-rich skin responds to inflammation by producing post-breakout dark marks.",
  "We analyze raw skin metrics directly without artificial score boosting.",
  "High humidity during Rainy season requires lightweight non-comedogenic hydration."
];

export default function AnalysisLoading({ statusMessage, season }) {
  const [tipIndex, setTipIndex] = useState(0);
  const sc = getSeasonClasses(season || 'harmattan');

  useEffect(() => {
    const interval = setInterval(() => setTipIndex((prev) => (prev + 1) % EDUCATIONAL_TIPS.length), 3200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 max-w-md mx-auto text-center space-y-8">
      {/* Pulsing radar */}
      <div className="relative w-36 h-36 flex items-center justify-center">
        <div className={`absolute inset-0 rounded-full border ${sc.accentBorder} animate-ping opacity-20 transition-colors duration-500`} />
        <div className={`absolute inset-2 rounded-full border ${sc.accentBorderDim} animate-pulse transition-colors duration-500`} />
        <div className={`w-24 h-24 rounded-full bg-base-card border border-base-border flex items-center justify-center shadow-2xl`}>
          <Sparkles className={`w-10 h-10 ${sc.accentText} animate-bounce transition-colors duration-500`} />
        </div>
      </div>

      <div className="space-y-2 max-w-xs">
        <h2 className="text-lg font-heading font-semibold text-bone">Analyzing Skin Profile</h2>
        <p className={`text-xs font-mono ${sc.accentText} transition-colors duration-500`}>
          {statusMessage || 'Processing skin metrics via YouCam AI...'}
        </p>
      </div>

      <div className="w-full bg-base-card/80 p-4 rounded-2xl border border-base-border shadow-lg text-left">
        <div className="flex items-center gap-2 text-xs font-mono text-bone-muted mb-1">
          <ShieldCheck className={`w-3.5 h-3.5 ${sc.accentText} transition-colors duration-500`} />
          <span>Melanin Skincare Insight</span>
        </div>
        <p className="text-xs text-bone font-sans leading-relaxed">"{EDUCATIONAL_TIPS[tipIndex]}"</p>
      </div>

      <p className="text-[11px] text-bone-muted">Evaluating raw metrics • Applying climate weighting</p>
    </div>
  );
}
