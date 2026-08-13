import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Camera, RefreshCw, X, AlertCircle, Upload, CheckCircle2 } from 'lucide-react';

// Face bounding box must be at least this fraction of the video width
const MIN_FACE_RATIO    = 0.30;
const ALMOST_FACE_RATIO = 0.20;

export default function ScanCapture({ onCaptureImage, onCancel, onUploadFile }) {
  const videoRef     = useRef(null);
  const canvasRef    = useRef(null);
  const fileInputRef = useRef(null);
  const modelRef     = useRef(null);
  const rafRef       = useRef(null);
  const lastFaceRef  = useRef(null); // { x, y, w, h } in pixel coords
  const streamRef    = useRef(null);

  const [cameraError,  setCameraError]  = useState(null);
  const [capturedUrl,  setCapturedUrl]  = useState(null);
  const [capturedBlob, setCapturedBlob] = useState(null);
  // 'loading' | 'searching' | 'too_small' | 'almost' | 'good'
  const [faceStatus,   setFaceStatus]   = useState('loading');
  const [faceBoxCss,   setFaceBoxCss]   = useState(null); // CSS % overlay
  const [aiReady,      setAiReady]      = useState(false);

  useEffect(() => {
    startCamera();
    loadModel();
    return cleanup;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cleanup = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
  };

  /* ─── Camera ──────────────────────────────────────────── */
  const startCamera = async () => {
    try {
      const ms = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1080 }, height: { ideal: 1080 } },
        audio: false,
      });
      streamRef.current = ms;
      if (videoRef.current) {
        videoRef.current.srcObject = ms;
        videoRef.current.onloadedmetadata = () => videoRef.current.play();
      }
    } catch (err) {
      const msg =
        err.name === 'NotAllowedError'  ? 'Camera access was denied. Please allow camera permissions in your browser settings and refresh.' :
        err.name === 'NotFoundError'    ? 'No camera found on this device.' :
        'Unable to access camera. Please check your browser settings or upload a photo instead.';
      setCameraError(msg);
    }
  };

  /* ─── Load BlazeFace model ─────────────────────────────── */
  const loadModel = async () => {
    try {
      // dynamic imports to avoid blocking the camera startup
      await import('@tensorflow/tfjs-backend-webgl');
      const tf        = await import('@tensorflow/tfjs-core');
      const blazeface = await import('@tensorflow-models/blazeface');

      await tf.setBackend('webgl');
      await tf.ready();

      const model = await blazeface.load({ maxFaces: 1 });
      modelRef.current = model;
      setAiReady(true);
      setFaceStatus('searching');
      startDetectionLoop();
    } catch (err) {
      console.warn('BlazeFace load failed — running without live detection:', err);
      setFaceStatus('searching'); // let them capture anyway
    }
  };

  /* ─── Detection loop ───────────────────────────────────── */
  const startDetectionLoop = useCallback(() => {
    const loop = async () => {
      const video = videoRef.current;
      const model = modelRef.current;

      if (video && model && video.readyState >= 2 && !video.paused) {
        try {
          const predictions = await model.estimateFaces(video, false);

          if (!predictions || predictions.length === 0) {
            lastFaceRef.current = null;
            setFaceBoxCss(null);
            setFaceStatus('searching');
          } else {
            const face = predictions[0];
            const [x1, y1] = face.topLeft;
            const [x2, y2] = face.bottomRight;
            const vw = video.videoWidth;
            const vh = video.videoHeight;

            const fw = x2 - x1;
            const fh = y2 - y1;

            // Store raw pixel coords for cropping later
            lastFaceRef.current = { x: x1, y: y1, w: fw, h: fh, vw, vh };

            // Mirror X for CSS (video is CSS-mirrored with -scale-x-100)
            const normX = 1 - (x2 / vw);
            const normY = y1 / vh;
            const normW = fw / vw;
            const normH = fh / vh;

            setFaceBoxCss({
              left:   `${normX  * 100}%`,
              top:    `${normY  * 100}%`,
              width:  `${normW  * 100}%`,
              height: `${normH  * 100}%`,
            });

            const ratio = fw / vw;
            if      (ratio < ALMOST_FACE_RATIO) setFaceStatus('too_small');
            else if (ratio < MIN_FACE_RATIO)    setFaceStatus('almost');
            else                                 setFaceStatus('good');
          }
        } catch (_) {}
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
  }, []);

  /* ─── Snapshot ─────────────────────────────────────────── */
  const stopCamera = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
  };

  const handleTakeSnapshot = () => {
    const video  = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const vw = video.videoWidth  || 640;
    const vh = video.videoHeight || 640;

    if (lastFaceRef.current) {
      // ── Zoom: scale source region so face fills 70% of the output ──
      // This guarantees YouCam receives a large, unambiguous face
      const { x: fx, y: fy, w: fw, h: fh } = lastFaceRef.current;

      const OUTPUT_SIZE      = 900;   // always 900x900 output
      const TARGET_FACE_FILL = 0.70;  // face should fill 70% of the output

      const faceMaxDim = Math.max(fw, fh);
      const targetPx   = OUTPUT_SIZE * TARGET_FACE_FILL;
      const zoomRatio  = targetPx / faceMaxDim; // how much to zoom

      // Source region in video px that maps to OUTPUT_SIZE at this zoom
      const srcRegion = OUTPUT_SIZE / zoomRatio;

      // Center crop on face center
      const faceCX = fx + fw / 2;
      const faceCY = fy + fh / 2;
      let srcX = faceCX - srcRegion / 2;
      let srcY = faceCY - srcRegion / 2;

      // Clamp to video bounds
      srcX = Math.max(0, Math.min(srcX, vw - srcRegion));
      srcY = Math.max(0, Math.min(srcY, vh - srcRegion));
      const srcSide = Math.min(srcRegion, Math.min(vw - srcX, vh - srcY));

      canvas.width  = OUTPUT_SIZE;
      canvas.height = OUTPUT_SIZE;
      const ctx = canvas.getContext('2d');
      ctx.translate(OUTPUT_SIZE, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, srcX, srcY, srcSide, srcSide, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
    } else {
      // No face — send full square frame at high res
      const side = Math.max(900, Math.min(vw, vh));
      canvas.width  = side;
      canvas.height = side;
      const ctx = canvas.getContext('2d');
      ctx.translate(side, 0);
      ctx.scale(-1, 1);
      const srcX = Math.max(0, (vw - vh) / 2);
      const srcY = Math.max(0, (vh - vw) / 2);
      const srcS = Math.min(vw, vh);
      ctx.drawImage(video, srcX, srcY, srcS, srcS, 0, 0, side, side);
    }

    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      setCapturedBlob(blob);
      setCapturedUrl(url);
      stopCamera();
    }, 'image/jpeg', 0.93);
  };

  const handleRetake = () => {
    if (capturedUrl) URL.revokeObjectURL(capturedUrl);
    setCapturedUrl(null);
    setCapturedBlob(null);
    lastFaceRef.current = null;
    setFaceBoxCss(null);
    setFaceStatus(modelRef.current ? 'searching' : 'loading');
    startCamera();
    if (modelRef.current) startDetectionLoop();
  };

  const handleConfirmScan = () => {
    if (capturedBlob && capturedUrl) onCaptureImage(capturedBlob, capturedUrl);
  };

  const handleFileFallback = (e) => {
    const file = e.target.files?.[0];
    if (file) { stopCamera(); onUploadFile(file); }
  };

  /* ─── Derived styles ───────────────────────────────────── */
  const statusMap = {
    loading:   { border: 'border-bone-muted/40',  badge: 'text-bone-muted',  bar: 'bg-base-hover',   barW: '8%',   label: 'Calibrating AI…'          },
    searching: { border: 'border-amber-400/70',   badge: 'text-amber-300',   bar: 'bg-amber-400/40', barW: '8%',   label: 'Center your face'          },
    too_small: { border: 'border-rose-400/80',    badge: 'text-rose-400',    bar: 'bg-rose-400',     barW: '32%',  label: 'Move closer ↑'             },
    almost:    { border: 'border-yellow-300/80',  badge: 'text-yellow-300',  bar: 'bg-yellow-400',   barW: '68%',  label: 'A little closer…'          },
    good:      { border: 'border-emerald-400',    badge: 'text-emerald-400', bar: 'bg-emerald-400',  barW: '100%', label: '✓ Perfect — hold still!'   },
  };
  const s = statusMap[faceStatus] ?? statusMap.searching;
  const glowStyle = faceStatus === 'good'
    ? { boxShadow: '0 0 32px rgba(52,211,153,0.55)' }
    : faceStatus === 'too_small'
    ? { boxShadow: '0 0 20px rgba(244,63,94,0.35)' }
    : {};

  const canCapture = aiReady
    ? (faceStatus === 'good' || faceStatus === 'almost')
    : true; // no AI = let them capture freely

  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-between py-4 px-4 max-w-md mx-auto">

      {/* Header */}
      <div className="w-full flex items-center justify-between py-2 border-b border-base-border/50">
        <button onClick={() => { stopCamera(); onCancel(); }}
          className="p-2 rounded-full hover:bg-base-card text-bone-muted hover:text-bone transition-colors">
          <X className="w-5 h-5" />
        </button>
        <h2 className="text-sm font-sans font-medium tracking-wide text-bone">
          {capturedUrl ? 'Review Your Photo' : 'Face Scan'}
        </h2>
        <div className="w-8" />
      </div>

      {/* Camera box */}
      <div
        className={`relative w-full aspect-square max-w-sm rounded-3xl overflow-hidden border-2 bg-black shadow-2xl my-4 transition-all duration-500 ${s.border}`}
        style={glowStyle}
      >
        {cameraError ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-base-card space-y-4">
            <AlertCircle className="w-10 h-10 text-amber-400" />
            <p className="text-sm text-bone-muted leading-relaxed font-sans">{cameraError}</p>
            <button onClick={() => fileInputRef.current?.click()}
              className="py-2.5 px-5 rounded-full bg-harmattan text-black text-sm font-sans font-semibold flex items-center gap-2 hover:brightness-110">
              <Upload className="w-4 h-4" /><span>Upload Photo Instead</span>
            </button>
            <input type="file" ref={fileInputRef} onChange={handleFileFallback} accept="image/*" className="hidden" />
          </div>
        ) : capturedUrl ? (
          <img src={capturedUrl} alt="Captured selfie" className="w-full h-full object-cover" />
        ) : (
          <>
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover -scale-x-100" />

            {/* Live face bounding box from BlazeFace */}
            {faceBoxCss && aiReady && (
              <div
                className={`absolute pointer-events-none rounded-lg border-2 transition-all duration-100 ${s.border}`}
                style={{ ...faceBoxCss, position: 'absolute' }}
              />
            )}

            {/* Corner bracket guides */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="relative w-3/4 h-4/5 max-w-[220px] max-h-[280px]">
                <div className={`absolute top-0 left-0   w-7 h-7 border-t-[3px] border-l-[3px] rounded-tl-xl transition-colors duration-500 ${s.border}`} />
                <div className={`absolute top-0 right-0  w-7 h-7 border-t-[3px] border-r-[3px] rounded-tr-xl transition-colors duration-500 ${s.border}`} />
                <div className={`absolute bottom-0 left-0  w-7 h-7 border-b-[3px] border-l-[3px] rounded-bl-xl transition-colors duration-500 ${s.border}`} />
                <div className={`absolute bottom-0 right-0 w-7 h-7 border-b-[3px] border-r-[3px] rounded-br-xl transition-colors duration-500 ${s.border}`} />

                {/* Laser sweep */}
                {(faceStatus === 'searching' || faceStatus === 'good' || faceStatus === 'loading') && (
                  <div
                    className="absolute left-0 w-full h-[2px] animate-scan bg-gradient-to-r from-transparent to-transparent"
                    style={{
                      background: faceStatus === 'good'
                        ? 'linear-gradient(to right, transparent, rgba(52,211,153,0.9), transparent)'
                        : 'linear-gradient(to right, transparent, rgba(201,162,39,0.8), transparent)',
                      boxShadow: faceStatus === 'good'
                        ? '0 0 12px rgba(52,211,153,0.8)'
                        : '0 0 10px rgba(201,162,39,0.7)',
                    }}
                  />
                )}
              </div>
            </div>

            {/* Status badge */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
              <span className={`text-[11px] font-sans font-medium uppercase tracking-widest px-4 py-2 rounded-full bg-black/60 border border-white/10 backdrop-blur-md shadow-lg whitespace-nowrap transition-all duration-500 ${s.badge}`}>
                {aiReady ? s.label : (faceStatus === 'loading' ? 'AI calibrating…' : 'Camera ready')}
              </span>
            </div>
          </>
        )}

        <canvas ref={canvasRef} className="hidden" />
      </div>

      {/* Coverage bar */}
      {!capturedUrl && !cameraError && (
        <div className="w-full max-w-sm mb-3">
          <div className="flex items-center justify-between text-[10px] font-sans text-bone-muted mb-1.5 px-1">
            <span>Face Coverage</span>
            <span className={`font-medium transition-colors duration-500 ${s.badge}`}>
              {aiReady
                ? (faceStatus === 'good' ? 'Optimal ✓' : faceStatus === 'almost' ? 'Almost there' : faceStatus === 'too_small' ? 'Too far away' : 'Looking for face…')
                : 'AI warming up…'
              }
            </span>
          </div>
          <div className="w-full h-1.5 bg-base-border/50 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-700 ${s.bar}`} style={{ width: s.barW }} />
          </div>
        </div>
      )}

      {/* Buttons */}
      <div className="w-full max-w-sm space-y-3 pb-4">
        {capturedUrl ? (
          <div className="grid grid-cols-2 gap-3">
            <button onClick={handleRetake}
              className="py-3 px-4 rounded-2xl bg-base-card border border-base-border text-sm font-sans font-medium text-bone flex items-center justify-center gap-2 hover:bg-base-hover transition-all">
              <RefreshCw className="w-4 h-4" /><span>Retake</span>
            </button>
            <button onClick={handleConfirmScan}
              className="py-3 px-4 rounded-2xl bg-gradient-to-r from-harmattan to-amber-400 text-black text-sm font-sans font-semibold shadow-lg hover:brightness-110 flex items-center justify-center gap-2 transition-all">
              <CheckCircle2 className="w-4 h-4" /><span>Analyze Skin</span>
            </button>
          </div>
        ) : !cameraError ? (
          <>
            <button
              onClick={handleTakeSnapshot}
              disabled={!canCapture}
              className={`w-full py-4 rounded-2xl text-sm font-sans font-semibold shadow-xl flex items-center justify-center gap-3 transition-all duration-500 ${
                canCapture
                  ? 'bg-gradient-to-r from-harmattan to-amber-400 text-black hover:scale-[1.01] hover:brightness-110'
                  : 'bg-base-card border border-base-border/50 text-bone-muted cursor-not-allowed opacity-50'
              }`}
            >
              <Camera className="w-5 h-5" />
              <span>
                {!aiReady ? 'Capture Photo' :
                 canCapture ? 'Capture Photo' : 'Move closer to capture…'}
              </span>
            </button>
            <button onClick={() => fileInputRef.current?.click()}
              className="w-full py-3 rounded-2xl border border-base-border/50 text-bone-muted text-xs font-sans hover:bg-base-card hover:text-bone transition-all flex items-center justify-center gap-2">
              <Upload className="w-4 h-4" /><span>Upload a photo instead</span>
            </button>
            <input type="file" ref={fileInputRef} onChange={handleFileFallback} accept="image/*" className="hidden" />
          </>
        ) : null}
      </div>
    </div>
  );
}
