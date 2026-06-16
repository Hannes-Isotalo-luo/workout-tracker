import { getPhases, getDays } from './csvParser.js';

/**
 * Given the parsed CSV program data, last session, and enrolled program,
 * calculates the next sequential workout session using the passed history array.
 * @param {Object} programData - nested program map
 * @param {Object} lastSession - optional { program, phase, day } override
 * @param {string} [enrolledProgram] - active program name
 * @param {Array} [history] - the user's workout history array from context
 * @returns {Object|null} { program, phase, day } for the next session
 */
export function calculateNextSession(programData, lastSession, enrolledProgram, history = []) {
  if (!programData) return null;

  let session = lastSession;
  const targetProgram = enrolledProgram;

  // If no override session is provided, search history
  if (!session) {
    if (targetProgram) {
      // Find the last completed session in history that matches the enrolled program
      session = [...history].reverse().find(s => s.program === targetProgram) || null;
    } else {
      session = history.length > 0 ? history[history.length - 1] : null;
    }
  }

  // If there is no previous session matching this program (or in general), start from the beginning
  if (!session) {
    if (targetProgram) {
      const phases = getPhases(programData, targetProgram);
      if (phases && phases.length > 0) {
        const firstPhase = phases[0];
        const days = getDays(programData, targetProgram, firstPhase);
        if (days && days.length > 0) {
          return {
            program: targetProgram,
            phase: firstPhase,
            day: days[0]
          };
        }
      }
    }
    return null;
  }

  const { program, phase, day } = session;
  if (!program || !phase || !day) return null;

  const phases = getPhases(programData, program);
  if (!phases || phases.length === 0) return null;

  const currentPhaseIndex = phases.indexOf(phase);
  if (currentPhaseIndex === -1) return null;

  const days = getDays(programData, program, phase);
  if (!days || days.length === 0) return null;

  const currentDayIndex = days.indexOf(day);
  if (currentDayIndex === -1) return null;

  // 1. If not the last day, progress to the next day in the same phase
  if (currentDayIndex < days.length - 1) {
    return {
      program,
      phase,
      day: days[currentDayIndex + 1]
    };
  }

  // 2. If it is the last day of the phase, check if there is a next phase
  if (currentPhaseIndex < phases.length - 1) {
    const nextPhase = phases[currentPhaseIndex + 1];
    const nextPhaseDays = getDays(programData, program, nextPhase);
    if (nextPhaseDays && nextPhaseDays.length > 0) {
      return {
        program,
        phase: nextPhase,
        day: nextPhaseDays[0]
      };
    }
  }

  // 3. If it is the last day of the last phase, loop back to the first day of the first phase
  const firstPhase = phases[0];
  const firstPhaseDays = getDays(programData, program, firstPhase);
  if (firstPhaseDays && firstPhaseDays.length > 0) {
    return {
      program,
      phase: firstPhase,
      day: firstPhaseDays[0]
    };
  }

  return null;
}
