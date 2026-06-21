// ─────────────────────────────────────────────────────────────────────
// formatters.js — small pure formatting/parsing helpers shared across the UI.
// ─────────────────────────────────────────────────────────────────────

/** Seconds → "M:SS" (e.g. 95 → "1:35"). */
export function formatTime(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds || 0));
  const mins = Math.floor(s / 60);
  const secs = s % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Parses a rest-time string like "3-4 MIN" into seconds.
 * Falls back to 90s when nothing numeric is found.
 */
export function parseRestTime(restStr) {
  if (!restStr) return 90;
  const match = String(restStr).match(/(\d+)/);
  if (match) return parseInt(match[1], 10) * 60;
  return 90;
}

/** Title-cases the first letter of each sentence; everything else lowercase. */
export function toSentenceCase(str) {
  if (!str) return '';
  return String(str)
    .toLowerCase()
    .replace(/(^\s*|[.!?]\s+)([a-z])/g, (m, p1, p2) => p1 + p2.toUpperCase());
}

/** A Date | ISO string → "Jun 21, 2026". */
export function formatDate(value) {
  if (!value) return '';
  const d = value instanceof Date ? value : new Date(value);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/** A Date | ISO string → "Jun 21" (short, no year). */
export function formatDateShort(value) {
  if (!value) return '';
  const d = value instanceof Date ? value : new Date(value);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Human "time ago" label relative to today, by calendar day.
 * → "Today" | "Yesterday" | "N days ago" | "Never" (when no date).
 */
export function relativeDayLabel(value) {
  if (!value) return 'Never';
  const d = value instanceof Date ? value : new Date(value);
  if (isNaN(d.getTime())) return 'Never';
  const completedOnly = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const now = new Date();
  const todayOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffDays = Math.round((todayOnly - completedOnly) / 86400000);
  if (diffDays <= 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  return `${diffDays} days ago`;
}
