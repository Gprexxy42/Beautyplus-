import React from 'react';
import { Camera, Upload, ShieldCheck, Sun, CloudRain, Sparkles, ArrowRight, Play, ScanFace, Activity, Droplets } from 'lucide-react';
import SeasonToggle from './SeasonToggle';
import { getSeasonClasses } from '../lib/seasonClasses';

export default function Landing({ onStartCamera, onUploadFile, onDemoScan, season, onToggleSeason }) {
  const fileInputRef = React.useRef(null);
  const sc = getSeasonClasses(season);
  const isHarmattan = season === 'harmattan';

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) onUploadFile(file);
  };

  return (
    <div className="w-full flex flex-col items-center">
      
      {/* ── Hero Section (Split Screen) ── */}
      <div className="flex flex-col lg:flex-row items-center justify-between w-full max-w-6xl mx-auto py-12 px-6 lg:px-8 gap-12 lg:gap-20">
        
        {/* Left Column: Text & CTA */}
        <div className="flex-1 space-y-8 max-w-xl text-center lg:text-left flex flex-col items-center lg:items-start">
          
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-base-card border ${sc.accentBorderDim} text-xs font-mono text-bone-muted transition-colors duration-500`}>
            <Sparkles className={`w-3.5 h-3.5 ${sc.accentText} animate-pulse transition-colors duration-500`} />
            <span>Melanin & Climate-Aware Skin AI</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-heading font-bold text-bone tracking-tight leading-tight">
            Skin AI Built for <br />
            <span className={`text-transparent bg-clip-text bg-gradient-to-r ${sc.gradientText} transition-all duration-500`}>
              Our Skin & Seasons
            </span>
          </h1>

          <p className="text-sm sm:text-base font-sans leading-relaxed" style={{ color: '#C4BDB0' }}>
            Generic skin scanners ignore melanin hyperpigmentation risks and West African climate shifts.
            We analyze your skin using raw AI metrics, calibrated for Harmattan dryness & Rainy humidity.
          </p>

          <SeasonToggle currentSeason={season} onToggleSeason={onToggleSeason} />

          {/* CTA Buttons */}
          <div className="w-full space-y-3 max-w-sm">
            <button
              onClick={onStartCamera}
              className={`w-full py-4 px-6 rounded-2xl ${sc.gradientBtn} text-white font-heading font-bold shadow-[0_0_20px_rgba(0,0,0,0.1)] hover:shadow-[0_0_25px_rgba(255,255,255,0.1)] hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-3 group`}
            >
              <Camera className="w-5 h-5 group-hover:rotate-12 transition-transform" />
              <span>Scan Face with Camera</span>
              <ArrowRight className="w-4 h-4 ml-auto group-hover:translate-x-1 transition-transform" />
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="py-3 px-4 rounded-xl bg-base-card border border-base-border hover:border-bone-muted text-xs font-heading font-semibold text-bone flex items-center justify-center gap-2 transition-all hover:bg-base-hover"
              >
                <Upload className="w-4 h-4 text-bone-muted" />
                <span>Upload Photo</span>
              </button>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />

              <button
                onClick={onDemoScan}
                className={`py-3 px-4 rounded-xl bg-base-card border ${sc.accentBorderDim} text-xs font-heading font-semibold ${sc.accentText} flex items-center justify-center gap-2 transition-all duration-300`}
              >
                <Play className={`w-4 h-4 ${sc.accentText} transition-colors duration-500`} />
                <span>Instant Demo</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Hero Image with AI Scan Line */}
        <div className="flex-1 w-full max-w-md relative hidden md:block">
          {/* Decorative glowing back-blob */}
          <div className={`absolute -inset-4 opacity-30 blur-2xl rounded-full transition-colors duration-700 ${isHarmattan ? 'bg-harmattan' : 'bg-rain'}`}></div>
          
          <div className="relative w-full aspect-[4/5] rounded-3xl overflow-hidden border border-base-border shadow-2xl bg-black">
            <img 
              src="/hero_model.png" 
              alt="Skin AI Model" 
              className="w-full h-full object-cover opacity-90"
            />
            {/* AI Scan Line Overlay */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div className={`w-full h-[2px] shadow-[0_0_15px_3px] ${isHarmattan ? 'bg-harmattan-light shadow-harmattan/50' : 'bg-rain-light shadow-rain/50'} animate-[scan_3s_ease-in-out_infinite]`}></div>
              {/* Grid overlay for tech feel */}
              <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:20px_20px]"></div>
            </div>
            
            <div className="absolute bottom-4 left-4 right-4 bg-black/60 backdrop-blur-md rounded-xl p-3 border border-white/10 flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${isHarmattan ? 'bg-harmattan-light' : 'bg-rain-light'} animate-pulse`}></div>
              <span className="text-[10px] font-mono text-bone-muted uppercase tracking-wider">AI actively mapping 14,000+ facial landmarks</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── How it Works Section ── */}
      <div className="w-full bg-base-card border-t border-b border-base-border/50 py-12 mt-4">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-center text-sm font-mono text-bone-muted uppercase tracking-widest mb-8">How it works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex flex-col items-center text-center space-y-3">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center bg-base border border-base-border ${sc.accentText} transition-colors duration-500`}>
                <ScanFace className="w-6 h-6" />
              </div>
              <h3 className="font-heading font-semibold text-bone">1. Upload Selfie</h3>
              <p className="text-xs text-bone-muted leading-relaxed max-w-[200px]">Ensure your face fills 60% of the screen for accurate mapping.</p>
            </div>
            <div className="flex flex-col items-center text-center space-y-3">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center bg-base border border-base-border ${sc.accentText} transition-colors duration-500`}>
                <Activity className="w-6 h-6" />
              </div>
              <h3 className="font-heading font-semibold text-bone">2. AI Analysis</h3>
              <p className="text-xs text-bone-muted leading-relaxed max-w-[200px]">Our engine measures pigmentation, texture, and moisture levels.</p>
            </div>
            <div className="flex flex-col items-center text-center space-y-3">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center bg-base border border-base-border ${sc.accentText} transition-colors duration-500`}>
                <Droplets className="w-6 h-6" />
              </div>
              <h3 className="font-heading font-semibold text-bone">3. Tailored Routine</h3>
              <p className="text-xs text-bone-muted leading-relaxed max-w-[200px]">Get a climate-adjusted routine targeting your exact needs.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Privacy Note */}
      <p className="text-[10px] text-bone/40 text-center py-6">
        🔒 Private & Session-Only — Photos are processed for analysis and never stored.
      </p>
    </div>
  );
}
