/**
 * Skin concern threshold definitions & severity banding logic.
 * Note: Perfect Corp raw_score direction is HIGHER = HEALTHIER.
 * (e.g. raw_score 92 for acne = 92% clear = low concern)
 */

export const SEVERITY_BANDS = {
  LOW: 'low',         // Healthy / minor concern (raw_score >= 70)
  MODERATE: 'moderate', // Needs attention (raw_score 40-69)
  HIGH: 'high',       // Primary focus area (raw_score < 40)
};

export const CONCERN_METADATA = {
  acne: {
    label: 'Acne & Clarity',
    description: 'Presence of active breakouts or clogged pores',
    icon: 'Sparkles',
  },
  moisture: {
    label: 'Skin Hydration',
    description: 'Epidermal moisture retention and barrier integrity',
    icon: 'Droplets',
  },
  age_spot: {
    label: 'Hyperpigmentation & Tone',
    description: 'Dark spots, sun marks, or uneven skin patches',
    icon: 'Sun',
  },
  redness: {
    label: 'Redness & Sensitivity',
    description: 'Surface vascular reactivity and barrier stress',
    icon: 'HeartPulse',
  },
  texture: {
    label: 'Skin Texture & Smoothness',
    description: 'Surface roughness, bumpiness, or fine irregularity',
    icon: 'Layers',
  },
  oiliness: {
    label: 'Sebum Balance',
    description: 'Excess surface oil production and shine',
    icon: 'Zap',
  },
};

/**
 * Returns severity band for a raw score.
 * @param {number} rawScore 
 * @returns {'low'|'moderate'|'high'}
 */
export function getSeverityBand(rawScore) {
  if (rawScore >= 70) return SEVERITY_BANDS.LOW;
  if (rawScore >= 40) return SEVERITY_BANDS.MODERATE;
  return SEVERITY_BANDS.HIGH;
}

/**
 * Returns human-readable status text for a concern band.
 * @param {string} band 
 * @param {string} concernKey 
 * @returns {string}
 */
export function getBandHeadline(band, concernKey) {
  const labels = {
    acne: {
      low: 'Skin is clear with minimal breakout activity',
      moderate: 'Mild breakout susceptibility noticed',
      high: 'Active inflammation & breakouts present',
    },
    moisture: {
      low: 'Hydration levels are well-balanced',
      moderate: 'Slight dryness — hydration needs a boost',
      high: 'Skin barrier is running dry & compromised',
    },
    age_spot: {
      low: 'Skin tone is uniform with low spot activity',
      moderate: 'Mild pigment concentration developing',
      high: 'Noticeable hyperpigmentation focus needed',
    },
    redness: {
      low: 'Vascular calm with minimal redness',
      moderate: 'Slight reactivity to environmental stress',
      high: 'Elevated sensitivity & surface redness',
    },
    texture: {
      low: 'Smooth skin surface',
      moderate: 'Mild texture irregularity felt',
      high: 'Roughness or uneven surface texture present',
    },
    oiliness: {
      low: 'Balanced sebum production',
      moderate: 'Moderate shine along the T-zone',
      high: 'Excess surface oil production active',
    },
  };

  return labels[concernKey]?.[band] || `${concernKey} is currently at ${band} concern level`;
}
