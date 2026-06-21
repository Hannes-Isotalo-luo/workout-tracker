// ─────────────────────────────────────────────────────────────────────
// routineAdapter.js
//
// Bridges user-built custom routines (RoutineBuilder schema) into the same
// nested `programData` shape produced from the program CSV, so the selector
// wizard, session init, and next-session logic can treat custom routines
// exactly like the built-in programs.
//
// RoutineBuilder schema:
//   { id, name, phases: [ { name, days: [ { name, exercises: [
//       { name, targetSets, targetReps, rpe, rest, notes } ] } ] } ] }
//
// programData schema:
//   { [programName]: { [phaseName]: { [dayName]: Exercise[] } } }
//   Exercise = { exercise, sets, reps, rpe, rest, notes }
// ─────────────────────────────────────────────────────────────────────

/** Converts one custom routine into a `{ [phase]: { [day]: Exercise[] } }` map. */
export function routineToProgram(routine) {
  const program = {};
  (routine?.phases || []).forEach((phase, pIdx) => {
    const phaseName = phase.name || `Phase ${pIdx + 1}`;
    program[phaseName] = {};
    (phase.days || []).forEach((day, dIdx) => {
      const dayName = day.name || `Day ${dIdx + 1}`;
      program[phaseName][dayName] = (day.exercises || []).map((ex) => ({
        exercise: ex.name || 'Exercise',
        sets: parseInt(ex.targetSets, 10) || 3,
        reps: ex.targetReps != null ? String(ex.targetReps) : '',
        rpe: parseInt(ex.rpe, 10) || 0,
        rest: ex.rest || '',
        notes: ex.notes || '',
      }));
    });
  });
  return program;
}

/**
 * Converts an array of custom routines into a programData-compatible map
 * keyed by routine name (so they appear alongside CSV programs).
 * @param {Array} routines
 * @returns {Object} programData-shaped map
 */
export function routinesToProgramData(routines) {
  const map = {};
  (routines || []).forEach((routine) => {
    if (!routine?.name) return;
    map[routine.name] = routineToProgram(routine);
  });
  return map;
}

/** Set of custom-routine program names — lets the UI badge them distinctly. */
export function customProgramNames(routines) {
  return new Set((routines || []).map((r) => r?.name).filter(Boolean));
}
