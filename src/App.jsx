import React, { useState } from 'react';
import Landing from './components/Landing';
import ScanCapture from './components/ScanCapture';
import AnalysisLoading from './components/AnalysisLoading';
import ResultsScreen from './components/ResultsScreen';
import { interpretSkinAnalysis } from './lib/interpretationEngine';
import { analyzeSkinImage, simulateMockAnalysis } from './lib/youcamApi';
import { SEASONS } from './lib/seasonLogic';
import { getSeasonClasses } from './lib/seasonClasses';
import { Sparkles, Sun, CloudRain, Wifi, WifiOff } from 'lucide-react';

export default function App() {
  const [screen, setScreen]             = useState('landing');
  const [season, setSeason]             = useState(SEASONS.HARMATTAN);
  const [loadingStatus, setLoadingStatus] = useState('');
  const [userPhotoUrl, setUserPhotoUrl] = useState(null);
  const [rawScorePayload, setRawScorePayload] = useState(null);
  const [apiSource, setApiSource]       = useState(null); // 'live' | 'mock'
  const [apiError, setApiError]         = useState(null);

  const sc = getSeasonClasses(season);

  React.useEffect(() => {
    document.documentElement.setAttribute('data-season', season);
  }, [season]);

  const handleToggleSeason = (s) => setSeason(s);
  const handleStartCamera  = () => setScreen('capture');

  const handleUploadFile = (file) => {
    setUserPhotoUrl(URL.createObjectURL(file));
    runAnalysis(file);
  };

  const handleCaptureImage = (blob, url) => {
    setUserPhotoUrl(url);
    runAnalysis(blob);
  };

  const handleDemoScan = () => {
    setUserPhotoUrl('https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop');
    runAnalysis(null, true);
  };

  const runAnalysis = async (imageBlob, isDemo = false) => {
    setScreen('loading');
    setApiSource(null);
    setApiError(null);
    setLoadingStatus('Initializing YouCam Skin AI...');

    try {
      const payload = (isDemo || !imageBlob)
        ? await simulateMockAnalysis((msg) => setLoadingStatus(msg))
        : await analyzeSkinImage(imageBlob, (msg) => setLoadingStatus(msg));

      setApiSource(payload._source || 'mock');
      setApiError(payload._apiError || null);
      setRawScorePayload(payload);
      setScreen('results');
    } catch (err) {
      console.error('Fatal scan error:', err);
      const fallback = await simulateMockAnalysis((msg) => setLoadingStatus(msg));
      setApiSource('mock');
      setRawScorePayload(fallback);
      setScreen('results');
    }
  };

  const handleResetScan = () => {
    if (userPhotoUrl?.startsWith('blob:')) URL.revokeObjectURL(userPhotoUrl);
    setUserPhotoUrl(null);
    setRawScorePayload(null);
    setApiSource(null);
    setApiError(null);
    setScreen('landing');
  };

  const analysisReport = rawScorePayload ? interpretSkinAnalysis(rawScorePayload, season) : null;

  const getFriendlyErrorMessage = (errorStr) => {
    if (!errorStr) return "";
    if (errorStr.includes("error_src_face_too_small")) {
      return "Your face is a bit too far away. Step closer to the camera for a better scan!";
    }
    if (errorStr.includes("error_src_face_not_found")) {
      return "We couldn't clearly see a face. Please ensure good lighting and try again.";
    }
    return "Our AI couldn't process this photo. Showing a beautifully crafted demo profile instead.";
  };

  return (
    <div className="min-h-screen bg-base text-bone font-sans flex flex-col">
      {/* ── Navbar ── */}
      <header className="border-b border-base-border/60 bg-base/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          {/* Logo */}
          <button onClick={handleResetScan} className="flex items-center gap-2 hover:opacity-90 transition-opacity">
            <div className={`w-8 h-8 rounded-xl ${sc.gradientBtn} flex items-center justify-center shadow-md`}>
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-heading font-bold tracking-tight text-bone">
              Skin<span className={sc.accentText}>AI</span>
            </span>
          </button>

          {/* Right side: API status badge + season pill */}
          <div className="flex items-center gap-2">
            {/* API status — only show LIVE badge, never show DEMO badge */}
            {screen === 'results' && apiSource === 'live' && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-semibold border bg-emerald-500/15 border-emerald-500/40 text-emerald-300">
                <Wifi className="w-3 h-3" /> LIVE
              </div>
            )}

            {/* Season pill */}
            <div className={`flex items-center gap-2 text-xs font-mono text-bone bg-base-card px-3 py-1 rounded-full border ${sc.accentBorderDim}`}>
              {season === SEASONS.HARMATTAN
                ? <Sun className={`w-3.5 h-3.5 ${sc.accentText}`} />
                : <CloudRain className={`w-3.5 h-3.5 ${sc.accentText}`} />
              }
              <span className="capitalize">{season} Mode</span>
            </div>
          </div>
        </div>

        {/* API error sub-banner — hidden for clean UX, logged to console */}
        {apiError && screen === 'results' && (
          <div className="hidden">
            <p>{getFriendlyErrorMessage(apiError)}</p>
          </div>
        )}
      </header>

      {/* ── Main ── */}
      <main className="flex-1">
        {screen === 'landing'  && <Landing onStartCamera={handleStartCamera} onUploadFile={handleUploadFile} onDemoScan={handleDemoScan} season={season} onToggleSeason={handleToggleSeason} />}
        {screen === 'capture'  && <ScanCapture onCaptureImage={handleCaptureImage} onUploadFile={handleUploadFile} onCancel={handleResetScan} />}
        {screen === 'loading'  && <AnalysisLoading statusMessage={loadingStatus} season={season} />}
        {screen === 'results'  && analysisReport && (
          <ResultsScreen
            analysisReport={analysisReport}
            rawPayload={rawScorePayload}
            userPhotoUrl={userPhotoUrl}
            season={season}
            apiSource={apiSource}
            onToggleSeason={handleToggleSeason}
            onResetScan={handleResetScan}
          />
        )}
      </main>

      <footer className="border-t border-base-border/40 py-4 px-4 text-center text-[11px] font-mono text-bone-muted/60">
        Skin AI — Melanin & Climate-Aware Diagnostics • Powered by YouCam API S2S v2.0
      </footer>
    </div>
  );
}
