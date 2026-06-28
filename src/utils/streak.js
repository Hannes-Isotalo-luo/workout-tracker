// ─────────────────────────────────────────────────────────────────────
// streak.js — consecutive-day workout streak from saved history.
// A streak is "live" only if the latest workout was today or yesterday.
// ─────────────────────────────────────────────────────────────────────

const DAY_MS = 86400000;

/**
 * @param {Array} history — saved sessions (each with completedAt|date)
 * @returns {number} current consecutive-day streak (0 if broken)
 */
export function computeStreak(history) {
  if (!history || history.length === 0) return 0;

  const uniqueDates = Array.from(
    new Set(
      history.map((s) => {
        const d = new Date(s.completedAt || s.date);
        return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
      })
    )
  ).sort((a, b) => b - a);

  const now = new Date();
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const yesterdayMidnight = todayMidnight - DAY_MS;

  const latest = uniqueDates[0];
  if (latest !== todayMidnight && latest !== yesterdayMidnight) return 0;

  let streak = 1;
  let expected = latest - DAY_MS;
  for (let i = 1; i < uniqueDates.length; i++) {
    if (uniqueDates[i] === expected) {
      streak++;
      expected -= DAY_MS;
    } else if (uniqueDates[i] < expected) {
      break;
    }
  }
  return streak;
}

const WEEK_MS = 7 * DAY_MS;

// Sunday-anchored week start, computed in UTC so the 7-day arithmetic below is
// immune to daylight-saving shifts. Uses the local calendar day as the anchor.
function weekStart(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() - d.getUTCDay());
  return d.getTime();
}

/**
 * Consecutive-week training streak. A "week" is a Sunday-anchored calendar week
 * (matching the analytics volume buckets). The streak is "live" only if the
 * most recent workout fell in the current or previous week. This suits a
 * hypertrophy program with rest days far better than a raw consecutive-day
 * count, which would almost always read 1.
 * @param {Array} history — saved sessions (each with completedAt|date)
 * @returns {number} number of consecutive weeks with at least one session
 */
export function computeWeekStreak(history) {
  if (!history || history.length === 0) return 0;

  const uniqueWeeks = Array.from(
    new Set(history.map((s) => weekStart(new Date(s.completedAt || s.date))))
  ).sort((a, b) => b - a);

  const thisWeek = weekStart(new Date());
  const lastWeek = thisWeek - WEEK_MS;

  const latest = uniqueWeeks[0];
  if (latest !== thisWeek && latest !== lastWeek) return 0;

  let streak = 1;
  let expected = latest - WEEK_MS;
  for (let i = 1; i < uniqueWeeks.length; i++) {
    if (uniqueWeeks[i] === expected) {
      streak++;
      expected -= WEEK_MS;
    } else if (uniqueWeeks[i] < expected) {
      break;
    }
  }
  return streak;
}
