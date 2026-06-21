// ─────────────────────────────────────────────────────────────────────
// prs.js — single source of truth for personal-record (max weight) logic.
//
// A "PR" here is the heaviest completed weight ever logged for an exercise.
// Used by the analytics PR map, the save flow (to flag set.isPR), and the
// post-workout summary (to list newly-set records).
// ─────────────────────────────────────────────────────────────────────

/**
 * Builds a map of exerciseName → heaviest completed weight across history.
 * @param {Array} history — saved sessions
 * @param {string} [excludeId] — session id to skip (e.g. the one being saved)
 * @returns {Object<string, number>}
 */
export function computePRMap(history, excludeId = null) {
  const map = {};
  (history || []).forEach((session) => {
    if (excludeId && session.id === excludeId) return;
    (session.logs || []).forEach((log) => {
      const name = log.exerciseName;
      if (!name) return;
      (log.sets || []).forEach((set) => {
        if (set.isComplete) {
          const w = parseFloat(set.weight) || 0;
          if (w > 0 && (!map[name] || w > map[name])) map[name] = w;
        }
      });
    });
  });
  return map;
}

/** Heaviest completed weight for one exercise within a single session. */
export function sessionMaxWeight(log) {
  let max = 0;
  (log?.sets || []).forEach((set) => {
    if (set.isComplete) {
      const w = parseFloat(set.weight) || 0;
      if (w > max) max = w;
    }
  });
  return max;
}

/**
 * Compares a session against a prior PR map and returns the records it beats.
 * @param {Object} session — the session being evaluated
 * @param {Object<string, number>} prevMap — exerciseName → prior max
 * @returns {{ exerciseName: string, weight: number, previousWeight: number }[]}
 */
export function detectSessionPRs(session, prevMap) {
  const prs = [];
  (session?.logs || []).forEach((log) => {
    const currentMax = sessionMaxWeight(log);
    if (currentMax > 0) {
      const prev = prevMap[log.exerciseName] || 0;
      if (currentMax > prev) {
        prs.push({ exerciseName: log.exerciseName, weight: currentMax, previousWeight: prev });
      }
    }
  });
  return prs;
}
