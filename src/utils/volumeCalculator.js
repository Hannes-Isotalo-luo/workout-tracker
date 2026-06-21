// ─────────────────────────────────────────────────────────────────────
// volumeCalculator.js — pure helpers for set/volume/1RM math.
// Completed sets only count toward volume; weights/reps are stored as strings.
// ─────────────────────────────────────────────────────────────────────

/** Epley estimated 1-rep-max. Returns 0 for invalid input. */
export function epley1RM(weight, reps) {
  const w = parseFloat(weight) || 0;
  const r = parseInt(reps, 10) || 0;
  if (w <= 0 || r <= 0) return 0;
  return w * (1 + r / 30);
}

/**
 * Totals completed sets and volume (Σ weight × reps) across a session's logs.
 * @param {Object} session — has `logs[]`
 * @returns {{ completedSets: number, totalVolume: number }}
 */
export function computeSessionTotals(session) {
  let completedSets = 0;
  let totalVolume = 0;
  if (session && Array.isArray(session.logs)) {
    session.logs.forEach((log) => {
      (log.sets || []).forEach((set) => {
        if (set.isComplete) {
          completedSets++;
          const w = parseFloat(set.weight) || 0;
          const r = parseInt(set.repsCompleted, 10) || 0;
          totalVolume += w * r;
        }
      });
    });
  }
  return { completedSets, totalVolume };
}
