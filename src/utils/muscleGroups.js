// ─────────────────────────────────────────────────────────────────────
// muscleGroups.js
//
// Maps each exercise to a primary muscle group. Powers:
//   1. Weekly sets-per-muscle-group analytics (hypertrophy volume tracking)
//   2. Exercise-swap suggestions (alternatives that train the same muscle)
//
// The program ships with a fixed exercise list, so most names are mapped
// explicitly. A keyword-based fallback covers custom / renamed movements.
// ─────────────────────────────────────────────────────────────────────

export const MUSCLE_GROUPS = [
  'Chest',
  'Back',
  'Shoulders',
  'Biceps',
  'Triceps',
  'Quads',
  'Hamstrings',
  'Glutes',
  'Calves',
  'Abs',
];

// Explicit mapping for the program's exercises (exact name match).
const EXERCISE_MUSCLE = {
  'Assisted Dip': 'Chest',
  'Back Squat': 'Quads',
  'Barbell Bench Press': 'Chest',
  'Barbell Bent Over Row': 'Back',
  'Barbell Hip Thrust': 'Glutes',
  'Bicycle Crunch': 'Abs',
  'Cable Flye': 'Chest',
  'Cable Lateral Raise': 'Shoulders',
  'Cable Reverse Flye': 'Shoulders',
  'Cable Seated Row': 'Back',
  'Cable Tricep Kickback': 'Triceps',
  'Chest-Supported T-Bar Row': 'Back',
  'Close-Grip Bench Press': 'Triceps',
  'Crunch': 'Abs',
  'Deadlift': 'Back',
  'Dumbbell Bent Over Lateral Raise': 'Shoulders',
  'Dumbbell Floor Press': 'Chest',
  'Dumbbell Incline Press': 'Chest',
  'Dumbbell Lateral Raise': 'Shoulders',
  'Dumbbell Row': 'Back',
  'Dumbbell Seated Shoulder Press': 'Shoulders',
  'Dumbbell Single-Leg Hip Thrust': 'Glutes',
  'Dumbbell Skull Crusher': 'Triceps',
  'Dumbbell Supinated Curl': 'Biceps',
  'Dumbbell Walking Lunge': 'Quads',
  'EZ Bar Curl': 'Biceps',
  'Goblet Squat': 'Quads',
  'Hammer Curl': 'Biceps',
  'Hanging Leg Raise': 'Abs',
  'Lat Pulldown': 'Back',
  'Leg Curl': 'Hamstrings',
  'Leg Extension': 'Quads',
  'Leg Press': 'Quads',
  'Lying Leg Curl': 'Hamstrings',
  'Machine Incline Chest Press': 'Chest',
  'Machine Seated Hip Abduction': 'Glutes',
  'Military Press': 'Shoulders',
  'Neutral-Grip Pulldown': 'Back',
  'Pec Deck': 'Chest',
  'Plank': 'Abs',
  'Reverse Grip Lat Pulldown': 'Back',
  'Reverse Pec Deck': 'Shoulders',
  'Romanian Deadlift': 'Hamstrings',
  'Seated Face Pull': 'Shoulders',
  'Seated Leg Curl': 'Hamstrings',
  'Single Arm Pulldown': 'Back',
  'Single Leg Leg Extension': 'Quads',
  'Single Leg Lying Leg Curl': 'Hamstrings',
  'Single-Arm Cable Curl': 'Biceps',
  'Single-Arm Pulldown': 'Back',
  'Single-Arm Rope Tricep Extension': 'Triceps',
  'Single-Leg Leg Extension': 'Quads',
  'Single-Leg Lying Leg Curl': 'Hamstrings',
  'Standing Calf Raise': 'Calves',
};

// Keyword fallback — order matters (most specific first).
const KEYWORD_RULES = [
  [/calf|calves/i, 'Calves'],
  [/(leg curl|hamstring|romanian|rdl|good morning)/i, 'Hamstrings'],
  [/(hip thrust|glute|abduction|hip extension)/i, 'Glutes'],
  [/(squat|leg press|leg extension|lunge|quad|hack)/i, 'Quads'],
  [/(crunch|plank|leg raise|ab |abs|sit-?up|hollow|woodchop)/i, 'Abs'],
  [/(skull crusher|tricep|pushdown|kickback|close-grip|dip)/i, 'Triceps'],
  [/(curl|bicep)/i, 'Biceps'],
  [/(lateral raise|face pull|rear delt|reverse flye|reverse pec|shoulder press|military|overhead press|ohp)/i, 'Shoulders'],
  [/(row|pulldown|pull-?up|chin-?up|deadlift|lat |t-bar)/i, 'Back'],
  [/(bench|chest|flye|fly|pec|push-?up|press)/i, 'Chest'],
];

/**
 * Returns the primary muscle group for an exercise name.
 * @param {string} exerciseName
 * @returns {string} one of MUSCLE_GROUPS, or 'Other' if unrecognised
 */
export function getMuscleGroup(exerciseName) {
  if (!exerciseName) return 'Other';
  const exact = EXERCISE_MUSCLE[exerciseName.trim()];
  if (exact) return exact;
  for (const [pattern, group] of KEYWORD_RULES) {
    if (pattern.test(exerciseName)) return group;
  }
  return 'Other';
}

/**
 * Weekly hard-set landmarks per muscle (simplified MEV / MRV, Renaissance
 * Periodization style). Used to colour the analytics volume bars.
 *   below mev  → under-stimulating
 *   mev..mrv   → productive range
 *   above mrv  → likely junk / recovery risk
 */
export const VOLUME_LANDMARKS = {
  Chest:      { mev: 10, mrv: 22 },
  Back:       { mev: 10, mrv: 22 },
  Shoulders:  { mev: 8,  mrv: 22 },
  Biceps:     { mev: 8,  mrv: 20 },
  Triceps:    { mev: 6,  mrv: 18 },
  Quads:      { mev: 8,  mrv: 20 },
  Hamstrings: { mev: 6,  mrv: 16 },
  Glutes:     { mev: 4,  mrv: 16 },
  Calves:     { mev: 8,  mrv: 16 },
  Abs:        { mev: 0,  mrv: 16 },
  Other:      { mev: 0,  mrv: 99 },
};

/**
 * Given an exercise name and a pool of available exercise names, return
 * alternative exercises that train the same primary muscle group.
 * @param {string} exerciseName
 * @param {string[]} pool — all known exercise names
 * @returns {string[]} alternatives (excludes the original), name-sorted
 */
export function getAlternatives(exerciseName, pool) {
  const target = getMuscleGroup(exerciseName);
  const seen = new Set();
  const out = [];
  pool.forEach((name) => {
    if (!name || name === exerciseName || seen.has(name)) return;
    if (getMuscleGroup(name) === target) {
      seen.add(name);
      out.push(name);
    }
  });
  return out.sort((a, b) => a.localeCompare(b));
}
