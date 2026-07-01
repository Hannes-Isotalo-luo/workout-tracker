import { generateExerciseId } from '../../utils/exerciseIdGenerator.js';

// Session-lifecycle domain: starting, saving, cancelling, and restarting the
// active workout, plus the saved workoutHistory list it feeds into.
// (Editing individual sets within an already-started session lives in
// ./setEditingReducer.js.)
export const SESSION_LIFECYCLE_ACTION_TYPES = new Set([
  'INIT_SESSION',
  'CANCEL_SESSION',
  'SAVE_SESSION',
  'SET_SESSION_NOTES',
  'UNDO_LAST_SESSION',
  'RESTART_LAST_SESSION',
  'SET_HISTORY',
]);

export function sessionLifecycleReducer(state, action) {
  switch (action.type) {
    case "SET_SESSION_NOTES":
      if (!state.activeSession) return state;
      return {
        ...state,
        activeSession: {
          ...state.activeSession,
          notes: action.payload,
          sessionNote: action.payload
        }
      };

    case "INIT_SESSION": {
      const { day, exercises } = action.payload;
      const program = state.selectedProgram;
      const phase = state.selectedPhase;

      if (!program || !phase) {
        console.warn("[workoutReducer] ⚠️ INIT_SESSION called without selected program or phase.");
        return state;
      }

      // Generate a UUID/Session ID
      let sessionId;
      if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        sessionId = crypto.randomUUID();
      } else {
        sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      }

      const startedAt = new Date().toISOString();

      // Find the most recent completed session of the same type to pull previous weights (ignore phase)
      const lastSession = [...state.workoutHistory].reverse().find(
        s => s.program === program && s.day === day
      );

      // Transform each CSV exercise row into the active session log schema
      const logs = exercises.map((ex, index) => {
        const exerciseId = generateExerciseId(program, phase, day, index);

        const parsedRepsMatch = ex.reps ? String(ex.reps).match(/^(\d+)/) : null;
        const defaultReps = parsedRepsMatch ? parsedRepsMatch[1] : "";

        // Find this exercise in the last matching session
        const prevExerciseLog = lastSession
          ? lastSession.logs.find(l => l.exerciseName === ex.exercise)
          : null;

        let shouldAutoProgress = false;
        if (prevExerciseLog && prevExerciseLog.sets && prevExerciseLog.sets.length > 0) {
          let targetProgressionReps = 0;
          if (ex.reps) {
            const nums = String(ex.reps).match(/\d+/g);
            if (nums && nums.length > 0) {
              targetProgressionReps = parseInt(nums[nums.length - 1], 10);
            }
          }

          if (targetProgressionReps > 0) {
            shouldAutoProgress = prevExerciseLog.sets.every(s => {
              if (!s.isComplete) return false;
              const completedReps = parseInt(s.repsCompleted, 10) || 0;
              return completedReps >= targetProgressionReps;
            });
          }
        }

        return {
          exerciseId,
          exerciseName: ex.exercise,
          targetSets: ex.sets,
          targetReps: ex.reps, // Keep as string to handle "20SEC" etc.
          rpe: ex.rpe,
          rest: ex.rest,
          notes: ex.notes,
          sets: Array.from({ length: ex.sets }, (_, i) => {
            const prevSet = prevExerciseLog && prevExerciseLog.sets && prevExerciseLog.sets[i];

            let suggestedWeight = prevSet ? prevSet.weight : "";
            if (shouldAutoProgress && suggestedWeight) {
              const weightNum = parseFloat(suggestedWeight);
              if (!isNaN(weightNum)) {
                const strWeight = String(suggestedWeight);
                const unitMatch = strWeight.match(/[^\d.]+$/);
                const unit = unitMatch ? unitMatch[0] : "";
                suggestedWeight = String(weightNum + 2.5) + unit;
              }
            }

            return {
              setNumber: i + 1,
              weight: suggestedWeight,
              repsCompleted: defaultReps,   // Pre-fill with first number of target range
              isComplete: false,
              previousWeight: prevSet ? prevSet.weight : "",
              previousReps: prevSet ? prevSet.repsCompleted : ""
            };
          })
        };
      });

      const activeSession = {
        id: sessionId,
        date: startedAt,
        program,
        phase,
        day,
        startedAt,
        logs
      };

      console.log(`[workoutReducer] 🏋️‍♂️ Session initialized for ${day} with ${logs.length} exercises. ID: ${sessionId}`);

      return {
        ...state,
        activeSession,
        currentView: "workout"
      };
    }

    case "CANCEL_SESSION":
      console.log("[workoutReducer] 🗑️ Discarding activeSession");
      return {
        ...state,
        activeSession: null,
        currentView: "select"
      };

    case "SAVE_SESSION":
      console.log("[workoutReducer] 💾 Saving Session", action.payload ? action.payload.id : 'No payload');
      if (action.payload) {
        return {
          ...state,
          workoutHistory: [...state.workoutHistory, action.payload],
          activeSession: null,
          currentView: "select",
          restTimer: { ...state.restTimer, isRunning: false, seconds: 0, exerciseId: null }
        };
      }
      return {
        ...state,
        activeSession: null,
        currentView: "select",
        restTimer: { ...state.restTimer, isRunning: false, seconds: 0, exerciseId: null }
      };

    case "UNDO_LAST_SESSION":
      console.log("[workoutReducer] 🔄 UNDO_LAST_SESSION triggered.");
      return {
        ...state,
        workoutHistory: state.workoutHistory.slice(0, -1)
      };

    case "RESTART_LAST_SESSION": {
      console.log("[workoutReducer] 🔄 RESTART_LAST_SESSION triggered.");
      const lastSession = state.workoutHistory[state.workoutHistory.length - 1];
      if (!lastSession) {
        console.warn("[workoutReducer] ⚠️ RESTART_LAST_SESSION ignored: no completed session found in history.");
        return state;
      }
      return {
        ...state,
        workoutHistory: state.workoutHistory.slice(0, -1),
        activeSession: lastSession,
        currentView: "workout"
      };
    }

    case "SET_HISTORY":
      console.log("[workoutReducer] 📚 SET_HISTORY triggered. Payload:", action.payload);
      return {
        ...state,
        workoutHistory: action.payload
      };

    default:
      return state;
  }
}
