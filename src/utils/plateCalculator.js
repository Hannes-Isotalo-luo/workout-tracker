// ─────────────────────────────────────────────────────────────────────
// plateCalculator.js
//
// Pure helpers for the in-workout plate & warm-up calculator.
// All weights in kilograms.
// ─────────────────────────────────────────────────────────────────────

// Standard kg plates available per side, largest first.
export const DEFAULT_PLATES = [25, 20, 15, 10, 5, 2.5, 1.25];
export const DEFAULT_BAR = 20;

/**
 * Computes the plates to load on EACH side of the barbell.
 * @param {number} targetWeight — total weight including the bar
 * @param {number} [barWeight=20]
 * @param {number[]} [plates=DEFAULT_PLATES]
 * @returns {{ perSide: number[], achievable: number, leftover: number, barWeight: number }}
 */
export function calculatePlates(targetWeight, barWeight = DEFAULT_BAR, plates = DEFAULT_PLATES) {
  const total = parseFloat(targetWeight);
  if (isNaN(total) || total <= barWeight) {
    return { perSide: [], achievable: barWeight, leftover: 0, barWeight };
  }

  let perSideWeight = (total - barWeight) / 2;
  const perSide = [];
  let remaining = perSideWeight;

  for (const plate of plates) {
    while (remaining >= plate - 1e-9) {
      perSide.push(plate);
      remaining -= plate;
    }
  }

  const loadedPerSide = perSide.reduce((a, b) => a + b, 0);
  const achievable = barWeight + loadedPerSide * 2;
  // leftover = weight we couldn't represent with available plates
  const leftover = Math.round((perSideWeight - loadedPerSide) * 2 * 100) / 100;

  return { perSide, achievable, leftover, barWeight };
}

/**
 * Generates a warm-up ramp leading up to the working weight.
 * Percentages are of the working set; bar-only first, then ascending.
 * @param {number} workingWeight
 * @param {number} [barWeight=20]
 * @returns {{ label: string, weight: number, reps: number, pct: number }[]}
 */
export function getWarmupSets(workingWeight, barWeight = DEFAULT_BAR) {
  const w = parseFloat(workingWeight);
  if (isNaN(w) || w <= barWeight) return [];

  const steps = [
    { pct: 0.40, reps: 10 },
    { pct: 0.60, reps: 6 },
    { pct: 0.80, reps: 3 },
  ];

  return steps
    .map((s) => {
      // Round to nearest 2.5kg, never below the empty bar
      const raw = w * s.pct;
      const rounded = Math.max(barWeight, Math.round(raw / 2.5) * 2.5);
      return {
        label: `${Math.round(s.pct * 100)}%`,
        weight: rounded,
        reps: s.reps,
        pct: s.pct,
      };
    })
    // Drop steps that collapse to the working weight or duplicate each other
    .filter((s, i, arr) => s.weight < w && (i === 0 || s.weight !== arr[i - 1].weight));
}
