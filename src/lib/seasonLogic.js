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
 * Step 2 (treatment) is dynamically chosen based on the user's actual #1 ranked concern.
 * @param {string} season 'harmattan' | 'rainy'
 * @param {Array<string>} topConcerns Array of primary concern keys, ranked by weighted severity
 * @returns {Array<{step: string, title: string, productType: string, why: string}>}
 */
export function getSeasonalRoutine(season, topConcerns) {
  const isHarmattan = season === SEASONS.HARMATTAN;
  const primaryConcern = topConcerns?.[0] || null;

  // ── Concern-specific treatment steps, split by season ──────────────────────
  const treatmentSteps = {
    harmattan: {
      moisture: {
        title: 'Hyaluronic Acid (3 Molecular Weights) + Ceramide Serum',
        productType: 'Multi-depth hydration serum',
        why: 'Your skin is actively losing water to dry Harmattan air. Multi-weight HA draws moisture into all epidermal layers while ceramides lock it in.',
      },
      redness: {
        title: 'Centella Asiatica + Azelaic Acid (10%) Serum',
        productType: 'Barrier-calming anti-redness serum',
        why: 'Harmattan wind irritates capillaries. Centella cools inflammation while azelaic acid keeps redness-triggered pigment in check.',
      },
      texture: {
        title: 'Lactic Acid (5%) + Ceramide Toning Serum',
        productType: 'Gentle hydrating exfoliant',
        why: 'Lactic acid lifts dead surface buildup that Harmattan dust traps, without stripping your moisture barrier like harsher acids would.',
      },
      age_spot: {
        title: 'Vitamin C (10%) + Kojic Acid Brightening Serum',
        productType: 'Melanin-targeting brightening serum',
        why: 'Age spots and uneven tone need a dual-action approach. Vitamin C neutralises free radicals; Kojic acid interrupts excess melanin production at the source.',
      },
      acne: {
        title: 'Niacinamide (5%) + Willow Bark BHA Serum',
        productType: 'Pore-refining anti-inflammatory serum',
        why: 'Controls breakouts gently — no harsh actives that would aggravate Harmattan-stressed skin or trigger post-inflammatory dark marks.',
      },
      oiliness: {
        title: 'Niacinamide (5%) + Zinc PCA Serum',
        productType: 'Lightweight sebum-balancing serum',
        why: 'Even in dry season, some skin overproduces oil as a stress response to low humidity. Niacinamide + Zinc regulates output without over-drying.',
      },
    },
    rainy: {
      oiliness: {
        title: 'Niacinamide (10%) + Zinc PCA + Kaolin Serum',
        productType: 'Sebum-regulation and mattifying serum',
        why: 'High humidity supercharges sebum production. This trio visibly controls shine within hours and tightens the look of enlarged pores.',
      },
      acne: {
        title: 'Salicylic Acid (2%) + Tea Tree Spot Serum',
        productType: 'Oil-soluble clarifying treatment',
        why: 'Salicylic acid cuts through humidity-thickened sebum inside the pore; tea tree calms active inflammation without over-drying melanin-rich skin.',
      },
      texture: {
        title: 'AHA/BHA Dual-Acid Clarifying Toner (Glycolic 5% + Salicylic 1%)',
        productType: 'Surface + pore exfoliant',
        why: 'Rainy weather traps congestion. This dual exfoliant clears dead cell buildup on the surface and inside pores simultaneously.',
      },
      redness: {
        title: 'Azelaic Acid (15%) + Green Tea Extract Serum',
        productType: 'Anti-redness & brightening serum',
        why: 'Azelaic acid calms heat-triggered redness and is clinically proven to reduce post-inflammatory pigment — critical for melanin-rich skin.',
      },
      age_spot: {
        title: 'Alpha Arbutin (2%) + Vitamin C (5%) Brightening Serum',
        productType: 'Targeted dark spot corrector',
        why: 'Alpha arbutin is a gentle melanin inhibitor ideal for reactive skin. Vitamin C amplifies brightening and provides antioxidant defence in humid heat.',
      },
      moisture: {
        title: 'Sodium Hyaluronate + Aloe Vera Gel Serum',
        productType: 'Weightless hydrating gel serum',
        why: 'Even oily skin in rainy season needs hydration. A lightweight HA gel provides water without any occlusive weight that triggers more oil.',
      },
    },
  };

  // Resolve the treatment step for this user's top concern + season
  const seasonTreatments = treatmentSteps[season] || treatmentSteps.harmattan;
  const chosenTreatment = (primaryConcern && seasonTreatments[primaryConcern])
    ? seasonTreatments[primaryConcern]
    : seasonTreatments[isHarmattan ? 'moisture' : 'oiliness']; // sensible fallback

  if (isHarmattan) {
    return [
      {
        step: 'Step 1: Cleanse',
        title: 'Hydrating Cream-Gel Cleanser',
        productType: 'Non-stripping, low-pH cleanser',
        why: 'Sweeps away Harmattan dust without disrupting fragile skin barrier lipids.',
      },
      {
        step: 'Step 2: Treat',
        title: chosenTreatment.title,
        productType: chosenTreatment.productType,
        why: chosenTreatment.why,
      },
      {
        step: 'Step 3: Moisturize',
        title: 'Ceramide-Rich Lipid Cream',
        productType: 'Nourishing barrier moisturizer',
        why: 'Locks in hydration and protects skin from transepidermal water loss caused by dry Harmattan winds.',
      },
      {
        step: 'Step 4: Protect',
        title: 'Broad-Spectrum Mineral Sunscreen SPF 50',
        productType: 'No white-cast moisturizing SPF',
        why: 'Shields melanin-rich skin from intense UV exposure even during hazy Harmattan sun.',
      },
    ];
  }

  // Rainy Season
  return [
    {
      step: 'Step 1: Cleanse',
      title: 'Foaming Gel Cleanser with Salicylic Acid',
      productType: 'Gentle clarifying cleanser',
      why: 'Dissolves excess sebum and clears humidity-induced pore blockage.',
    },
    {
      step: 'Step 2: Treat',
      title: chosenTreatment.title,
      productType: chosenTreatment.productType,
      why: chosenTreatment.why,
    },
    {
      step: 'Step 3: Hydrate',
      title: 'Oil-Free Gel Hydrator',
      productType: 'Lightweight non-comedogenic moisturizer',
      why: 'Provides weightless water hydration without clogging pores in high humidity.',
    },
    {
      step: 'Step 4: Protect',
      title: 'Matte Fluid Sunscreen SPF 50',
      productType: 'Invisible matte-finish SPF',
      why: 'Delivers high UV defense without feeling heavy or greasy in warm rainy weather.',
    },
  ];
}
