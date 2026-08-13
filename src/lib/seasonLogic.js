/**
 * Seasonal logic module for Harmattan vs. Rainy season adjustments.
 * Note: Season does not mutate raw API scores — it modifies concern weighting
 * and tailors recommended skincare steps.
 */

export const SEASONS = {
  HARMATTAN: 'harmattan',
  RAINY: 'rainy',
};

export const SEASON_METADATA = {
  harmattan: {
    name: 'Harmattan Season',
    subtitle: 'Dry, dusty winds & low humidity',
    accentColor: '#C9A227',
    icon: 'SunDim',
    description: 'During Harmattan, dry air strips skin barrier lipids. Focus shifts to intensive hydration, barrier restoration, and soothing inflammation.',
    concernWeights: {
      moisture: 1.8,
      texture: 1.5,
      redness: 1.4,
      age_spot: 1.0,
      acne: 0.9,
      oiliness: 0.7,
    },
    routineFocus: 'Barrier Repair & Intensive Hydration',
  },
  rainy: {
    name: 'Rainy Season',
    subtitle: 'High humidity & elevated temperature',
    accentColor: '#3E7C74',
    icon: 'CloudRain',
    description: 'High humidity increases sweat and sebum production, clogging pores. Focus shifts to lightweight hydration, gentle exfoliation, and oil control.',
    concernWeights: {
      oiliness: 1.8,
      acne: 1.6,
      texture: 1.2,
      redness: 1.0,
      age_spot: 1.0,
      moisture: 0.8,
    },
    routineFocus: 'Sebum Control & Pore Clarity',
  },
};

/**
 * Returns seasonal product recommendations tailored to primary concern and current season.
 * @param {string} season 'harmattan' | 'rainy'
 * @param {Array<string>} topConcerns Array of primary concern keys
 * @returns {Array<{step: string, title: string, productType: string, why: string}>}
 */
export function getSeasonalRoutine(season, topConcerns) {
  const isHarmattan = season === SEASONS.HARMATTAN;

  if (isHarmattan) {
    return [
      {
        step: 'Step 1: Cleanse',
        title: 'Hydrating Cream-Gel Cleanser',
        productType: 'Non-stripping, low-pH cleanser',
        why: 'Sweeps away Harmattan dust without disrupting fragile skin barrier lipids.'
      },
      {
        step: 'Step 2: Treat & Soothe',
        title: 'Niacinamide (5%) & Hyaluronic Serum',
        productType: 'Barrier strengthening & hydrating serum',
        why: 'Deeply binds moisture into epidermal layers while soothing dry air reactivity and hyperpigmentation.'
      },
      {
        step: 'Step 3: Moisturize',
        title: 'Ceramide Rich Lipid Cream',
        productType: 'Nourishing barrier moisturizer',
        why: 'Locks in hydration and protects skin from transepidermal water loss caused by dry Harmattan winds.'
      },
      {
        step: 'Step 4: Protect',
        title: 'Broad-Spectrum Mineral Sunscreen SPF 50',
        productType: 'No-cast moisturizing SPF',
        why: 'Shields melanin-rich skin from intense UV exposure even during hazy Harmattan sun.'
      }
    ];
  }

  // Rainy Season
  return [
    {
      step: 'Step 1: Cleanse',
      title: 'Foaming Gel Cleanser with Salicylic Acid',
      productType: 'Gentle clarifying cleanser',
      why: 'Dissolves excess sebum and clears humidity-induced pore blockage.'
    },
    {
      step: 'Step 2: Treat & Balance',
      title: 'Niacinamide (10%) & Zinc PCA Serum',
      productType: 'Sebum-regulating & pore refining serum',
      why: 'Controls excess surface oil shine while reducing post-breakout dark marks.'
    },
    {
      step: 'Step 3: Hydrate',
      title: 'Oil-Free Gel Hydrator',
      productType: 'Lightweight non-comedogenic moisturizer',
      why: 'Provides weightless water hydration without clogging pores in high humidity.'
    },
    {
      step: 'Step 4: Protect',
      title: 'Matte Fluid Sunscreen SPF 50',
      productType: 'Invisible matte finish SPF',
      why: 'Delivers high UV defense without feeling heavy or greasy in warm rainy weather.'
    }
  ];
}
