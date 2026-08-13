/**
 * YouCam Skin Analysis API Integration (S2S v2.0 - SD Mode)
 *
 * CORRECT 3-STEP FLOW (discovered from API docs):
 *  1. POST /s2s/v2.0/file/skin-analysis  → get { requests.url, file_id }
 *  2. PUT  requests.url                  → upload raw image (no auth headers)
 *  3. POST /s2s/v2.0/task/skin-analysis  → { file_id } → get { task_id }
 *  4. GET  /s2s/v2.0/task/skin-analysis/{task_id}  → poll until task_status=success
 *
 * Requests go through the Vite dev proxy (/youcam-api → yce-api-01.makeupar.com)
 * to avoid browser CORS restrictions.
 */

const API_KEY    = import.meta.env.VITE_YOUCAM_API_KEY    || '';
const API_SECRET = import.meta.env.VITE_YOUCAM_API_SECRET || '';
const PROXY_BASE = '/youcam-api';

function authHeaders(extra = {}) {
  return {
    'Authorization': `Bearer ${API_KEY}`,
    'x-api-key':     API_KEY,
    ...extra,
  };
}

/**
 * Main entry point.
 */
export async function analyzeSkinImage(imageBlob, onProgress = () => {}) {
  const hasKey = API_KEY && API_KEY.trim() !== '' && !API_KEY.includes('your_key');

  if (!hasKey) {
    console.info('ℹ️ No API key — running demo mode.');
    return simulateMockAnalysis(onProgress);
  }

  console.info('🚀 Starting LIVE YouCam API scan (3-step flow)...');
  console.info('🔑 API Key prefix:', API_KEY.substring(0, 15) + '...');

  try {
    // ── Step 0: Enhance image for best YouCam face detection ──
    onProgress('Enhancing photo quality...');
    const processedBlob = await enhanceImageForYouCam(imageBlob);
    
    // ── Step 1: Request a pre-signed upload URL ──────────────────────────────
    onProgress('Requesting upload slot from YouCam...');

    const ext = processedBlob.type === 'image/png' ? 'png' : 'jpg';
    const fileName = `selfie.${ext}`;

    const fileReqBody = JSON.stringify({
      files: [{
        file_name:    fileName,
        file_size:    processedBlob.size,
        content_type: processedBlob.type || 'image/jpeg',
      }]
    });

    console.info('📤 Step 1 — POST /s2s/v2.0/file/skin-analysis, body:', fileReqBody);

    const fileRes = await fetch(`${PROXY_BASE}/s2s/v2.0/file/skin-analysis`, {
      method:  'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body:    fileReqBody,
    });

    const fileText = await fileRes.text();
    console.info('📥 Step 1 response — HTTP', fileRes.status, ':', fileText);

    if (!fileRes.ok) {
      throw new Error(`File request failed (HTTP ${fileRes.status}): ${fileText}`);
    }

    const fileData = JSON.parse(fileText);
    
    // The response structure keeps changing, so let's recursively find the keys
    function findKey(obj, targetKeys) {
      if (!obj || typeof obj !== 'object') return null;
      for (const key of Object.keys(obj)) {
        if (targetKeys.includes(key) && typeof obj[key] === 'string' && obj[key].length > 0) {
          return obj[key];
        }
        if (typeof obj[key] === 'object') {
          const found = findKey(obj[key], targetKeys);
          if (found) return found;
        }
      }
      return null;
    }

    const uploadUrl = findKey(fileData, ['upload_url', 'url']);
    const fileId = findKey(fileData, ['file_id', 'id']);

    if (!uploadUrl || !fileId) {
      console.error("Failed to find uploadUrl or fileId in:", fileText);
      throw new Error(`Missing uploadUrl (${!!uploadUrl}) or fileId (${!!fileId}). Response: ${fileText}`);
    }

    console.info('✅ Step 1 done — file_id:', fileId, '| upload URL:', uploadUrl?.substring(0, 60) + '...');

    // ── Step 2: Upload image to pre-signed URL ───────────────────────────────
    onProgress('Uploading photo to YouCam secure storage...');
    console.info('📤 Step 2 — PUT', uploadUrl.substring(0, 60) + '...');

    // Pre-signed S3/GCS URLs must NOT have our auth headers
    const uploadRes = await fetch(uploadUrl, {
      method:  'PUT',
      headers: { 'Content-Type': processedBlob.type || 'image/jpeg' },
      body:    processedBlob,
    });

    console.info('📥 Step 2 response — HTTP', uploadRes.status);

    if (!uploadRes.ok) {
      const upText = await uploadRes.text();
      throw new Error(`Image upload failed (HTTP ${uploadRes.status}): ${upText}`);
    }

    // ── Step 3: Create the analysis task using file_id ───────────────────────
    onProgress('Initiating skin analysis task...');

    const taskBody = JSON.stringify({ 
      src_file_id: fileId,
      dst_actions: ['acne', 'moisture', 'age_spot', 'redness', 'texture', 'oiliness']
    });
    console.info('📤 Step 3 — POST /s2s/v2.0/task/skin-analysis, body:', taskBody);

    const taskRes = await fetch(`${PROXY_BASE}/s2s/v2.0/task/skin-analysis`, {
      method:  'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body:    taskBody,
    });

    const taskText = await taskRes.text();
    console.info('📥 Step 3 response — HTTP', taskRes.status, ':', taskText);

    if (!taskRes.ok) {
      throw new Error(`Task creation failed (HTTP ${taskRes.status}): ${taskText}`);
    }

    const taskData = JSON.parse(taskText);
    const taskId = taskData?.task_id
      || taskData?.id
      || taskData?.data?.task_id;

    if (!taskId) {
      throw new Error(`No task_id returned: ${taskText}`);
    }

    console.info('✅ Step 3 done — task_id:', taskId);

    // ── Step 4: Poll until task_status = success ─────────────────────────────
    onProgress('AI is analyzing your skin...');
    const scoreInfo = await pollTaskStatus(taskId, onProgress);

    return { ...scoreInfo, _source: 'live', _taskId: taskId };

  } catch (err) {
    console.error('⚠️ YouCam API error — falling back to mock:', err.message);
    onProgress('API issue — using demo analysis...');
    const mock = await simulateMockAnalysis(onProgress);
    return { ...mock, _source: 'mock', _apiError: err.message };
  }
}

/**
 * Polls task status every 2.5s until task_status = "success".
 */
async function pollTaskStatus(taskId, onProgress, maxAttempts = 20) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    await sleep(2500);
    onProgress(`Analyzing skin data... (${attempt}/${maxAttempts})`);

    const url = `${PROXY_BASE}/s2s/v2.0/task/skin-analysis/${taskId}`;
    console.info(`🔄 Poll ${attempt}: GET ${url}`);

    const res  = await fetch(url, { headers: authHeaders() });
    const text = await res.text();
    console.info(`📥 Poll ${attempt} — HTTP ${res.status}:`, text.substring(0, 300));

    if (!res.ok) continue;

    let data;
    try { data = JSON.parse(text); } catch { continue; }

    // Prioritize task_status which is a string, before falling back to status (which could just be HTTP 200)
    let rawStatus = data.task_status
      || data?.data?.task_status
      || data.status
      || data?.data?.status
      || '';
      
    // If the API returns {"status": 200, "data": {"status": "success"}} we don't want the 200.
    if (rawStatus === 200 && data?.data?.status && typeof data.data.status === 'string') {
      rawStatus = data.data.status;
    }
      
    const status = String(rawStatus).toLowerCase();

    console.info(`📊 Poll ${attempt} | Extracted status: "${status}"`);

    if (status === 'success' || status === 'complete' || status === 'done') {
      const apiData = data.data || data;
      
      // If YouCam returns a zip URL in results.url, download and extract it
      if (apiData?.results?.url) {
        onProgress('Downloading analysis results...');
        console.info('📦 Downloading ZIP from:', apiData.results.url);
        
        try {
          const zipRes = await fetch(apiData.results.url);
          const zipBlob = await zipRes.blob();
          
          const zip = new JSZip();
          const unzipped = await zip.loadAsync(zipBlob);
          
          // Find the main json file (usually info.json or score_info.json)
          const jsonFile = Object.values(unzipped.files).find(f => f.name.endsWith('.json'));
          if (jsonFile) {
            const jsonText = await jsonFile.async('string');
            const scoreInfo = JSON.parse(jsonText);
            console.info('🎯 LIVE score_info from ZIP:', JSON.stringify(scoreInfo, null, 2));
            return scoreInfo;
          }
        } catch (err) {
          console.error('Failed to extract YouCam ZIP payload', err);
        }
      }

      const scoreInfo = data.score_info
        || data?.data?.score_info
        || data.result
        || data.data;
      console.info('🎯 LIVE score_info:', JSON.stringify(scoreInfo, null, 2));
      return scoreInfo;
    }

    // Check for error in the data payload (YouCam returns errors as data.data.error or data.data.error_code)
    const dataError = data?.data?.error || data?.data?.error_code || data?.error || data?.error_code;
    if (status === 'error' || status === 'failed' || dataError) {
      console.error('❌ Task failed. Full response from YouCam:', text);
      const errMsg = dataError
        || data.error_message
        || data.message
        || data?.data?.error_message
        || JSON.stringify(data);
      throw new Error(`Analysis failed: ${errMsg}`);
    }
    // 'running' / 'pending' → continue polling
  }

  throw new Error('Polling timed out.');
}

/**
 * Simulated demo payload — always tagged _source: 'mock'.
 */
export async function simulateMockAnalysis(onProgress = () => {}) {
  const steps = [
    'Detecting facial landmarks...',
    'Analyzing moisture barrier...',
    'Evaluating hyperpigmentation & redness...',
    'Calculating texture & sebum balance...',
  ];
  for (const step of steps) {
    onProgress(step);
    await sleep(650);
  }

  return {
    acne:     { raw_score: rnd(75, 95), ui_score: 88, output_mask_name: 'acne_output.png' },
    moisture: { raw_score: rnd(30, 55), ui_score: 65, output_mask_name: 'moisture_output.png' },
    age_spot: { raw_score: rnd(50, 75), ui_score: 72, output_mask_name: 'age_spot_output.png' },
    redness:  { raw_score: rnd(45, 70), ui_score: 70, output_mask_name: 'redness_output.png' },
    texture:  { raw_score: rnd(55, 78), ui_score: 74, output_mask_name: 'texture_output.png' },
    oiliness: { raw_score: rnd(40, 65), ui_score: 68, output_mask_name: 'oiliness_output.png' },
    all:      { score: rnd(55, 75) },
    skin_age: Math.floor(rnd(22, 38)),
    _source:  'mock',
  };
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const rnd   = (min, max) => parseFloat((Math.random() * (max - min) + min).toFixed(1));

/**
 * Enhances image for YouCam:
 * - Runs BlazeFace to find the face, then adds generous padding so the full
 *   head (including hair/forehead) is always inside the frame
 * - Outputs at 1080x1080 (YouCam requirement: short side ≥ 1080px)
 * - Boosts brightness/contrast for dark skin tone detection
 *
 * Padding strategy (critical — prevents error_src_face_out_of_bound):
 *   top:    +60% of face height  (captures hair, forehead)
 *   bottom: +35% of face height  (captures chin, neck)
 *   sides:  +40% of face width   (captures ears, jaw)
 * After padding, the face fills ~55% of the output — safely within YouCam's
 * required 40–80% face-fill window.
 */
async function enhanceImageForYouCam(blob) {
  const OUTPUT_SIZE      = 1080;
  const TARGET_FACE_FILL = 0.55; // conservative fill — full head must stay in frame

  // Load the image
  const img = await new Promise((resolve, reject) => {
    const image = new Image();
    const url   = URL.createObjectURL(blob);
    image.onload  = () => { URL.revokeObjectURL(url); resolve(image); };
    image.onerror = () => reject(new Error('Failed to load image.'));
    image.src = url;
  });

  // Try BlazeFace face detection
  let faceBox = null;
  try {
    await import('@tensorflow/tfjs-backend-webgl');
    const tf        = await import('@tensorflow/tfjs-core');
    const blazeface = await import('@tensorflow-models/blazeface');
    await tf.setBackend('webgl');
    await tf.ready();
    const model       = await blazeface.load({ maxFaces: 1 });
    const predictions = await model.estimateFaces(img, false);
    if (predictions && predictions.length > 0) {
      const [x1, y1] = predictions[0].topLeft;
      const [x2, y2] = predictions[0].bottomRight;
      faceBox = { x: x1, y: y1, w: x2 - x1, h: y2 - y1 };
    }
  } catch (e) {
    console.warn('BlazeFace unavailable — sending padded centre-crop:', e.message);
  }

  const canvas = document.createElement('canvas');
  canvas.width  = OUTPUT_SIZE;
  canvas.height = OUTPUT_SIZE;
  const ctx = canvas.getContext('2d');
  ctx.filter = 'brightness(1.15) contrast(1.10)';

  if (faceBox) {
    const { x: fx, y: fy, w: fw, h: fh } = faceBox;

    // Expand bounding box with generous padding so full head is captured
    const padTop    = fh * 0.60; // extra space for hair/forehead
    const padBottom = fh * 0.35;
    const padSide   = fw * 0.40;

    const expandedX = Math.max(0, fx - padSide);
    const expandedY = Math.max(0, fy - padTop);
    const expandedR = Math.min(img.width,  fx + fw + padSide);
    const expandedB = Math.min(img.height, fy + fh + padBottom);

    const expandedW = expandedR - expandedX;
    const expandedH = expandedB - expandedY;

    // Make it square, centred on the expanded region
    const expandedSide = Math.max(expandedW, expandedH);
    const expandedCX   = expandedX + expandedW / 2;
    const expandedCY   = expandedY + expandedH / 2;

    // Final source square — clamped to image bounds
    let srcX = Math.max(0, expandedCX - expandedSide / 2);
    let srcY = Math.max(0, expandedCY - expandedSide / 2);
    let srcS = Math.min(expandedSide, Math.min(img.width - srcX, img.height - srcY));

    // Safety: if srcS is still too large, clamp it
    srcS = Math.min(srcS, img.width, img.height);

    ctx.drawImage(img, srcX, srcY, srcS, srcS, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
    console.info(
      `✂️ Face crop: detected (${Math.round(fx)},${Math.round(fy)}) ${Math.round(fw)}x${Math.round(fh)}px` +
      ` → padded src square (${Math.round(srcX)},${Math.round(srcY)}) ${Math.round(srcS)}px` +
      ` → ${OUTPUT_SIZE}x${OUTPUT_SIZE} output`
    );
  } else {
    // No face detected — use centre-crop with small inset so edges aren't clipped
    const inset = 0.05; // 5% inset on each side
    const srcS  = Math.min(img.width, img.height) * (1 - inset * 2);
    const srcX  = (img.width  - srcS) / 2;
    const srcY  = (img.height - srcS) / 2;
    ctx.drawImage(img, srcX, srcY, srcS, srcS, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
    console.warn('⚠️ No face detected — sending inset centre-crop');
  }

  ctx.filter = 'none';

  return new Promise((resolve) => {
    canvas.toBlob((enhanced) => resolve(enhanced || blob), 'image/jpeg', 0.97);
  });
}
