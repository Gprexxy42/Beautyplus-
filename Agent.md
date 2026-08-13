# AGENTS.md — Skin AI Hackathon Build

## 1. Project summary

A mobile-responsive web app that scans a user's skin using Perfect Corp.'s YouCam
Skin Analysis API, then reinterprets the raw results through a **melanin-aware,
climate-aware lens** built specifically for Nigerian/African skin and seasons
(harmattan vs rainy season) — something no generic skin-AI app currently does.

**What the API gives us:** per-concern severity scores (0–100) and mask overlays
showing where each concern is on the face. Nothing else.

**What we build on top:** the entire "so what do I actually do" layer —
PIH (post-inflammatory hyperpigmentation) risk detection, season-adjusted
routine logic, and warm, honest, jargon-free explanations.

This is the whole differentiator. Do not treat the interpretation layer as a
throwaway wrapper — it is the actual product.

---

## 2. Tech stack (locked — do not swap without asking)

- **Build tool:** Vite
- **Framework:** React 18 (JavaScript, not TypeScript — speed over strictness for this timeline)
- **Styling:** Tailwind CSS + shadcn/ui components
- **Camera capture:** browser `getUserMedia` (no native SDK)
- **Deploy target:** Vercel
- **API:** Perfect Corp. YouCam Skin Analysis API (S2S v2.0)

Do not introduce Next.js, Redux, or any state library heavier than React's
built-in `useState`/`useContext`. This app has ~6 screens and one API — keep
the dependency graph small so it stays fast to iterate on and easy to demo.

---

## 3. Environment variables

Create `.env.local` (never commit — must be in `.gitignore`):

```
YOUCAM_API_KEY=your_key_here
YOUCAM_API_BASE=https://yce-api-01.makeupar.com
```

Reference `.env.example` (committed, values blank) so judges/collaborators
know what's required without ever seeing the real key.

---

## 4. API integration contract

**Mode:** SD (not HD) skin analysis — faster, works fine with a standard
selfie, and SD/HD concerns cannot be mixed in a single request, so pick one
and stay consistent everywhere.

**Flow:**
1. Capture/upload image client-side.
2. POST image to create an analysis task → receive `task_id`.
3. Poll `GET /s2s/v2.0/task/skin-analysis/<task_id>` until status is no
   longer `running`. Poll politely (every 2–3s) — no units are consumed while
   status is `running`, so there's no cost pressure to poll aggressively.
4. On completion, receive `score_info.json`-equivalent payload with one entry
   per concern:

```json
{
  "acne":        { "raw_score": 92.3, "ui_score": 88, "output_mask_name": "acne_output.png" },
  "moisture":    { "raw_score": 48.7, "ui_score": 70, "output_mask_name": "moisture_output.png" },
  "age_spot":    { "raw_score": 83.2, "ui_score": 77, "output_mask_name": "age_spot_output.png" },
  "redness":     { "raw_score": 72.0, "ui_score": 77, "output_mask_name": "redness_output.png" },
  "texture":     { "raw_score": 80.1, "ui_score": 76, "output_mask_name": "texture_output.png" },
  "oiliness":    { "raw_score": 60.7, "ui_score": 72, "output_mask_name": "oiliness_output.png" },
  "all":         { "score": 75.8 },
  "skin_age":    37
}
```

**Critical rule:** all *logic and thresholds* in this app must use `raw_score`,
never `ui_score`. `ui_score` is Perfect Corp.'s own artificially-flattered
number and using it would silently undermine the honesty that is this app's
whole point. `ui_score` may only be referenced if we ever need a "for
comparison" display value — default to not showing it at all.

**Score direction:** for every concern, higher `raw_score` = healthier.
(A high "acne" score is good — it means low acne, not high acne. Don't get
this backwards in the interpretation engine.)

---

## 5. Interpretation engine (`src/lib/interpretationEngine.js`)

This is the core IP of the app. Pure functions, fully unit-testable, no API
calls inside this file.

### 5.1 Severity banding
For any raw_score, map to a band:
- `>= 70` → **low concern**
- `40–69` → **moderate concern**
- `< 40` → **high concern**

### 5.2 PIH risk index (our custom composite — does not exist in the raw API)
Post-inflammatory hyperpigmentation is under-addressed by generic skin AI
and disproportionately affects melanin-rich skin. Derive a composite score:

```
pih_risk = 100 - (age_spot.raw_score * 0.5
                 + redness.raw_score * 0.3
                 + texture.raw_score * 0.2)
```

Band the result using the same low/moderate/high thresholds as above, but
**invert the labels** since this is a risk score, not a health score (high
`pih_risk` = bad).

This composite — and the explanation text that accompanies it — is the
single most important "non-obvious use of the API" element of the whole
project. Do not let this get deprioritized under UI polish.

### 5.3 Season adjustment (`src/lib/seasonLogic.js`)
Two modes: `harmattan` and `rainy`. Season does not change the scores — it
changes which concerns get weighted higher when picking the top 2–3 issues
to build a routine around, and which routine steps get recommended.

- **Harmattan:** upweight `moisture`, `texture`, `redness` (barrier stress).
  Routine emphasis: gentle cleanse, barrier-repair moisturizer, no
  harsh actives.
- **Rainy:** upweight `oiliness`, `acne`, `pore`. Routine emphasis:
  lightweight/non-comedogenic products, oil control, avoid heavy occlusives.

### 5.4 Output contract
The interpretation engine returns a plain object — no API calls, no
side effects:

```js
{
  topConcerns: [ /* 2-3 concern keys, ranked */ ],
  pihRisk: { band: "moderate", explanation: "..." },
  routine: [ { step: "cleanse", product: "...", why: "..." }, ... ],
  overallTone: "encouraging" // always encouraging, never alarming
}
```

### 5.5 Tone rules (non-negotiable)
- Never show a bare number to the user as the primary message. Numbers can
  appear as secondary detail, but the headline is always plain language.
- Never use alarming language ("severe," "bad," "damaged"). Use descriptive,
  neutral-to-warm language ("your skin is running dry right now," "this
  needs a bit more attention").
- This is a skin *quality* app, not a medical diagnostic tool. Never use the
  words "diagnose," "disease," "treatment," or "condition" in a clinical
  sense. Add a one-line disclaimer on the results screen: "This is a
  cosmetic skin assessment, not medical advice."

---

## 6. Screen flow (build in this order)

1. **Landing** — intro, camera permission request, brief "why this is
   different" framing (skin-tone + season aware).
2. **Selfie scan** — camera capture via `getUserMedia`, basic framing guide
   overlay, retake option.
3. **Analysis (loading state)** — poll task, show a calm loading animation,
   not a spinner that implies something is broken if it takes a few seconds.
4. **Scan results** — display top concerns with their severity band
   (plain language, not raw numbers), mask overlay on the photo.
5. **Localized insight** — the PIH risk explanation + **live season toggle**
   right on this screen so the user can flip harmattan/rainy and watch the
   insight and routine change in real time. This is the demo-video moment —
   build it to be visually satisfying, not just functionally correct.
6. **Personalized routine** — final output: 3–4 step routine with plain-
   language "why." Stretch goal: a "save routine" action (local state is
   fine, no backend needed for the hackathon).

---

## 7. Design system

**Palette**
- `#1B1712` — base (charcoal-clay, not pure black)
- `#2A241D` — surface/card
- `#C9A227` — harmattan gold (dry-season accent)
- `#3E7C74` — rain teal (wet-season accent)
- `#EDE7DA` — bone (primary text)

**Typography**
- Headings: geometric sans (e.g. Space Grotesk) — confident, unisex, not
  gendered toward "beauty app pink" or "tech bro dark mode."
- Body: humanist sans (e.g. Inter) — warmth and readability.
- Scores/data labels: monospace (e.g. JetBrains Mono) — reinforces "this is
  a real diagnostic reading."

**Signature element:** the season toggle is a dial that visibly shifts the
screen's accent color between gold and teal as it moves — the interface
itself performs the app's core idea, it isn't just a settings switch.

**General rule:** no pastel pink, no baby blue, no generic "clean beauty"
cream-and-serif look. Warm-dark, confident, unisex, slightly clinical-trust
feel — closer to a diagnostic tool than a makeup app.

---

## 8. File structure

```
src/
  components/
    Landing.jsx
    ScanCapture.jsx
    AnalysisLoading.jsx
    ResultsScreen.jsx
    SeasonToggle.jsx
    InsightPanel.jsx
    RoutineOutput.jsx
  lib/
    youcamApi.js          // fetch + polling logic only
    interpretationEngine.js
    seasonLogic.js
    concernThresholds.js
  types/
    skinAnalysis.d.ts     // optional, JSDoc typedefs if not using TS
  App.jsx
  main.jsx
.env.example
.env.local               // gitignored, real key lives here
AGENTS.md
```

---

## 9. Explicit do-nots

- Do not call the interpretation engine from inside a component — keep it a
  pure, importable function so it's easy to demo/test in isolation.
- Do not display `ui_score` as the primary number anywhere.
- Do not store or upload selfies anywhere beyond the active session —
  privacy matters for a face-scanning app, say so in the UI.
- Do not mix SD and HD concern requests in the same API call.
- Do not add authentication/login — out of scope for a hackathon demo,
  adds risk with no judging upside.
- Do not gender the UI (no "for her"/"for him" framing anywhere in copy).

---

## 10. Definition of done (hackathon submission checklist)

- [ ] Working web prototype, deployed and reachable via a public link
- [ ] Public code repository
- [ ] Screenshots of the six core screens
- [ ] 1–3 minute demo video, scripted around: problem → scan → the
      localized-insight moment (the hook) → routine output
- [ ] README explaining the PIH-risk composite and season logic in plain
      terms, so judges reading code understand *why*, not just *what*
- [ ] Disclaimer copy present on results screen
- [ ] Season toggle demonstrably changes both the insight text and the
      routine output live, without a page reload