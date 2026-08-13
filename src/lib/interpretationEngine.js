import { getSeverityBand, getBandHeadline, CONCERN_METADATA } from './concernThresholds';
import { SEASON_METADATA, getSeasonalRoutine } from './seasonLogic';

/**
 * Pure Interpretation Engine
 * Evaluates raw YouCam skin analysis scores through melanin-aware and climate-aware logic.
 *
 * @param {Object} rawScores Payload containing raw_scores for acne, moisture, age_spot, redness, texture, oiliness
 * @param {string} season 'harmattan' | 'rainy'
 * @returns {Object} Structured interpretation report
 */
export function interpretSkinAnalysis(rawScores, season = 'harmattan') {
  // Fallback defaults if any score is missing
  const scores = {
    acne: rawScores?.acne?.raw_score ?? 80,
    moisture: rawScores?.moisture?.raw_score ?? 60,
    age_spot: rawScores?.age_spot?.raw_score ?? 75,
    redness: rawScores?.redness?.raw_score ?? 70,
    texture: rawScores?.texture?.raw_score ?? 75,
    oiliness: rawScores?.oiliness?.raw_score ?? 65,
  };

  // 1. Calculate PIH Risk Index (Post-Inflammatory Hyperpigmentation)
  // Formula: pih_risk = 100 - (age_spot * 0.5 + redness * 0.3 + texture * 0.2)
  const pihCompositeHealth = (
    scores.age_spot * 0.5 +
    scores.redness * 0.3 +
    scores.texture * 0.2
  );
  const pihRiskScore = Math.min(100, Math.max(0, 100 - pihCompositeHealth));

  // Banding PIH risk (Inverted: high pihRiskScore = high risk)
  let pihBand = 'low';
  let pihExplanation = '';

  if (pihRiskScore >= 60) {
    pihBand = 'high';
    pihExplanation = 'Melanin-rich skin responds to barrier stress or inflammation by producing extra pigment. Your current surface readings suggest elevated risk of stubborn dark spots after breakouts. Prioritize gentle soothing care and SPF 50.';
  } else if (pihRiskScore >= 35) {
    pihBand = 'moderate';
    pihExplanation = 'Moderate susceptibility to post-breakout marks and uneven tone. Consistent sun protection and non-stripping hydration will keep pigment production balanced.';
  } else {
    pihBand = 'low';
    pihExplanation = 'Low current hyperpigmentation risk. Your skin barrier is resilient and pigment production is operating stably.';
  }

  // 2. Evaluate individual concerns and compute weighted priority for active season
  const seasonWeights = SEASON_METADATA[season]?.concernWeights || {};

  const evaluatedConcerns = Object.keys(CONCERN_METADATA).map((key) => {
    const raw = scores[key];
    const band = getSeverityBand(raw);
    const headline = getBandHeadline(band, key);
    const weight = seasonWeights[key] || 1.0;
    
    // Concern severity = (100 - raw_score) * seasonWeight
    // Higher weighted severity means higher priority for routine targeting
    const weightedSeverity = (100 - raw) * weight;

    return {
      key,
      rawScore: raw,
      band,
      headline,
      weight,
      weightedSeverity,
      metadata: CONCERN_METADATA[key],
      maskOutput: rawScores?.[key]?.output_mask_name || null,
    };
  });

  // Sort by weighted severity descending to find top 3 concerns
  const sortedConcerns = [...evaluatedConcerns].sort(
    (a, b) => b.weightedSeverity - a.weightedSeverity
  );

  const topConcerns = sortedConcerns.slice(0, 3);

  // 3. Generate tailored routine
  const routine = getSeasonalRoutine(season, topConcerns.map(c => c.key));

  return {
    season,
    pihRisk: {
      score: Math.round(pihRiskScore * 10) / 10,
      band: pihBand,
      explanation: pihExplanation,
    },
    topConcerns,
    allConcerns: evaluatedConcerns,
    routine,
    overallTone: 'encouraging',
    disclaimer: 'This is a cosmetic skin assessment designed for skincare guidance, not medical diagnosis or clinical advice.'
  };
}
