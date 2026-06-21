// ─────────────────────────────────────────────────────────────────────
// exerciseIdGenerator.js — deterministic, human-readable IDs for each
// exercise slot, based on its position in the program.
//
// Format:  {programAbbrev}_{phaseAbbrev}_{dayAbbrev}_{1-basedIndex}
//   "Full Body" / "Weeks 1-4" / "Full Body #1" / index 0  →  "fb_w14_fb1_1"
// ─────────────────────────────────────────────────────────────────────

const PROGRAM_ABBREV = {
  'Full Body': 'fb',
  'Upper/Lower': 'ul',
  'Body Part Split': 'bps',
};

const PHASE_ABBREV = {
  'Weeks 1-4': 'w14',
  'Weeks 5-8': 'w58',
};

const DAY_ABBREV = {
  'Full Body #1': 'fb1',
  'Full Body #2': 'fb2',
  'Full Body #3': 'fb3',
  'Lower Body #1': 'lb1',
  'Upper Body #1': 'ub1',
  'Lower Body #2': 'lb2',
  'Upper Body #2': 'ub2',
  'Chest & Triceps': 'ct',
  'Legs & Abs #1': 'la1',
  'Back & Biceps': 'bb',
  'Legs & Abs #2': 'la2',
  'Shoulders & Arms': 'sa',
};

/**
 * @param {string} program — e.g. "Full Body"
 * @param {string} phase   — e.g. "Weeks 1-4"
 * @param {string} day     — e.g. "Full Body #1"
 * @param {number} index   — 0-based index within the day
 * @returns {string} e.g. "fb_w14_fb1_1"
 */
export function generateExerciseId(program, phase, day, index) {
  const p = PROGRAM_ABBREV[program] || program.substring(0, 3).toLowerCase();
  const ph = PHASE_ABBREV[phase] || String(phase).replace(/\D/g, '');
  const d = DAY_ABBREV[day] || String(day).replace(/[^a-zA-Z0-9]/g, '').substring(0, 4).toLowerCase();
  return `${p}_${ph}_${d}_${index + 1}`;
}
