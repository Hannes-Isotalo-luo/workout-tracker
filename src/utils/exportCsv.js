// ─────────────────────────────────────────────────────────────────────
// exportCsv.js
//
// Flattens the user's saved workout history into a downloadable CSV.
// One row per logged set, so the file is easy to pivot in any spreadsheet.
// ─────────────────────────────────────────────────────────────────────

const COLUMNS = [
  'Date',
  'Program',
  'Phase',
  'Day',
  'Exercise',
  'Set',
  'Weight (kg)',
  'Reps',
  'Completed',
  'Volume (kg)',
  'Est 1RM (kg)',
];

/** Wraps a value for safe CSV output (quotes + escapes embedded quotes). */
function csvCell(value) {
  const s = value == null ? '' : String(value);
  if (/[",\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

/**
 * Builds a CSV string from the workout history array.
 * @param {Array} history
 * @returns {string}
 */
export function buildHistoryCsv(history) {
  const rows = [COLUMNS.join(',')];

  (history || []).forEach((session) => {
    const date = session.completedAt || session.date || '';
    const dateStr = date ? new Date(date).toISOString().slice(0, 10) : '';

    (session.logs || []).forEach((log) => {
      (log.sets || []).forEach((set) => {
        const weight = parseFloat(set.weight) || 0;
        const reps = parseInt(set.repsCompleted, 10) || 0;
        const volume = set.isComplete ? weight * reps : 0;
        const e1rm = set.isComplete && reps > 0 ? Math.round(weight * (1 + reps / 30) * 10) / 10 : '';

        rows.push([
          csvCell(dateStr),
          csvCell(session.program),
          csvCell(session.phase),
          csvCell(session.day),
          csvCell(log.exerciseName),
          csvCell(set.setNumber),
          csvCell(set.weight ?? ''),
          csvCell(set.repsCompleted ?? ''),
          csvCell(set.isComplete ? 'yes' : 'no'),
          csvCell(volume),
          csvCell(e1rm),
        ].join(','));
      });
    });
  });

  return rows.join('\n');
}

/**
 * Triggers a browser download of the workout history as a CSV file.
 * @param {Array} history
 * @returns {number} number of sessions exported
 */
export function exportHistoryToCsv(history) {
  const csv = buildHistoryCsv(history);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const stamp = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `workout-history-${stamp}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  return (history || []).length;
}
