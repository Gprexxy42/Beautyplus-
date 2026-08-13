/**
 * test-season-logic.mjs
 * Run with: node test-season-logic.mjs
 *
 * Tests the full interpretation engine:
 *  1. Shows how season weights re-rank concerns
 *  2. Shows the personalised routine changes based on top concern + season
 *  3. Runs multiple mock profiles to prove different people get different results
 */

import { SEASONS, SEASON_METADATA, getSeasonalRoutine } from './src/lib/seasonLogic.js';

// ── Helpers ────────────────────────────────────────────────────────────────────

const CONCERN_WEIGHTS_HARMATTAN = SEASON_METADATA.harmattan.concernWeights;
const CONCERN_WEIGHTS_RAINY     = SEASON_METADATA.rainy.concernWeights;

function getSeverityBand(raw) {
  if (raw >= 70) return 'LOW CONCERN   ✅';
  if (raw >= 40) return 'MODERATE      ⚠️ ';
  return           'HIGH CONCERN  🔴';
}

function rankConcerns(scores, season) {
  const weights = season === SEASONS.HARMATTAN
    ? CONCERN_WEIGHTS_HARMATTAN
    : CONCERN_WEIGHTS_RAINY;

  return Object.entries(scores)
    .map(([key, raw]) => ({
      key,
      raw,
      weight: weights[key] || 1.0,
      weightedSeverity: (100 - raw) * (weights[key] || 1.0),
    }))
    .sort((a, b) => b.weightedSeverity - a.weightedSeverity);
}

function calcPIH(scores) {
  const composite = scores.age_spot * 0.5 + scores.redness * 0.3 + scores.texture * 0.2;
  const risk = Math.round(100 - composite);
  let band = risk >= 60 ? 'HIGH RISK'
           : risk >= 35 ? 'MODERATE RISK'
           :              'LOW RISK';
  return { risk, band };
}

function printRoutine(routine) {
  routine.forEach(step => {
    console.log(`  ${step.step}`);
    console.log(`    Product: ${step.title}`);
    console.log(`    Type:    ${step.productType}`);
    console.log(`    Why:     ${step.why}`);
    console.log('');
  });
}

function runTest(label, scores) {
  console.log('\n' + '='.repeat(70));
  console.log(` PROFILE: ${label}`);
  console.log('='.repeat(70));

  // Raw scores
  console.log('\nRAW SCORES FROM YOUCAM API:');
  Object.entries(scores).forEach(([k, v]) => {
    console.log(`  ${k.padEnd(10)} ${String(v).padStart(5)}  ->  ${getSeverityBand(v)}`);
  });

  // PIH risk
  const { risk, band } = calcPIH(scores);
  console.log(`\nPIH RISK INDEX: ${risk}/100 -- ${band}`);

  // Harmattan
  console.log('\n--- HARMATTAN MODE ---');
  const hRanked = rankConcerns(scores, SEASONS.HARMATTAN);
  console.log('Concern ranking (after season weighting):');
  hRanked.forEach((c, i) => {
    console.log(`  ${i + 1}. ${c.key.padEnd(10)} raw=${c.raw}  weight=${c.weight}x  -> weighted severity=${c.weightedSeverity.toFixed(1)}`);
  });
  const hTop = hRanked.map(c => c.key);
  console.log(`\nTop concern: ${hTop[0].toUpperCase()} -- drives treatment step`);
  console.log('\nROUTINE:');
  printRoutine(getSeasonalRoutine(SEASONS.HARMATTAN, hTop));

  // Rainy
  console.log('--- RAINY SEASON MODE ---');
  const rRanked = rankConcerns(scores, SEASONS.RAINY);
  console.log('Concern ranking (after season weighting):');
  rRanked.forEach((c, i) => {
    console.log(`  ${i + 1}. ${c.key.padEnd(10)} raw=${c.raw}  weight=${c.weight}x  -> weighted severity=${c.weightedSeverity.toFixed(1)}`);
  });
  const rTop = rRanked.map(c => c.key);
  console.log(`\nTop concern: ${rTop[0].toUpperCase()} -- drives treatment step`);
  console.log('\nROUTINE:');
  printRoutine(getSeasonalRoutine(SEASONS.RAINY, rTop));
}

// ── TEST PROFILES ──────────────────────────────────────────────────────────────

runTest('DRY SKIN (moisture=25)', {
  acne: 80, moisture: 25, age_spot: 70, redness: 45, texture: 65, oiliness: 75,
});

runTest('OILY / ACNE-PRONE (acne=35, oiliness=38)', {
  acne: 35, moisture: 70, age_spot: 68, redness: 60, texture: 55, oiliness: 38,
});

runTest('DARK SPOTS / PIH FOCUS (age_spot=30, redness=35)', {
  acne: 75, moisture: 65, age_spot: 30, redness: 35, texture: 50, oiliness: 72,
});

runTest('BALANCED SKIN / TEXTURE ISSUE (texture=38)', {
  acne: 72, moisture: 68, age_spot: 71, redness: 74, texture: 38, oiliness: 70,
});

console.log('\n' + '='.repeat(70));
console.log('All tests done. Same scores + different season = different routine.');
console.log('='.repeat(70) + '\n');
