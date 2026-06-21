import { getPhases, getDays } from './csvParser.js';

/**
 * Given the parsed program data, last session, and enrolled program,
 * calculates the next sequential workout session.
 * @param {Object} programData - nested program map (CSV + custom routines merged)
 * @param {Object} lastSession - optional { program, phase, day } override
 * @param {string} [enrolledProgram] - active program name
 * @param {Array} [history] - the user's workout history
 * @returns {Object|null} { program, phase, day } for the next session
 */
export function calculateNextSession(programData, lastSession, enrolledProgram, history = []) {
  if (!programData) return null;

  let session = lastSession;
  const targetProgram = enrolledProgram;

  // If no override session is provided, search history.
  if (!session) {
    if (targetProgram) {
      session = [...history].reverse().find((s) => s.program === targetProgram) || null;
    } else {
      session = history.length > 0 ? history[history.length - 1] : null;
    }
  }

  // No prior session: start at the beginning of the enrolled program (if any).
  if (!session) {
    if (targetProgram) {
      const phases = getPhases(programData, targetProgram);
      if (phases.length > 0) {
        const days = getDays(programData, targetProgram, phases[0]);
        if (days.length > 0) return { program: targetProgram, phase: phases[0], day: days[0] };
      }
    }
    return null;
  }

  const { program, phase, day } = session;
  if (!program || !phase || !day) return null;

  const phases = getPhases(programData, program);
  if (phases.length === 0) return null;
  const currentPhaseIndex = phases.indexOf(phase);
  if (currentPhaseIndex === -1) return null;

  const days = getDays(programData, program, phase);
  if (days.length === 0) return null;
  const currentDayIndex = days.indexOf(day);
  if (currentDayIndex === -1) return null;

  // 1. Not the last day → next day in the same phase.
  if (currentDayIndex < days.length - 1) {
    return { program, phase, day: days[currentDayIndex + 1] };
  }

  // 2. Last day of the phase → first day of the next phase.
  if (currentPhaseIndex < phases.length - 1) {
    const nextPhase = phases[currentPhaseIndex + 1];
    const nextPhaseDays = getDays(programData, program, nextPhase);
    if (nextPhaseDays.length > 0) return { program, phase: nextPhase, day: nextPhaseDays[0] };
  }

  // 3. Last day of the last phase → loop back to the very first day.
  const firstPhaseDays = getDays(programData, program, phases[0]);
  if (firstPhaseDays.length > 0) return { program, phase: phases[0], day: firstPhaseDays[0] };

  return null;
}
