import { generateExerciseId } from '../utils/exerciseIdGenerator.js';

let localHistory = [];
let localActiveState = null;
try {
  if (typeof window !== 'undefined') {
    localHistory = JSON.parse(localStorage.getItem('workoutTracker_history') || '[]');
    localActiveState = JSON.parse(localStorage.getItem('workoutTracker_activeState'));
  }
} catch (e) {
  console.warn("Failed to load local history/state:", e);
}

// Default Initial State
const defaultState = {
  programData: null,         // Parsed nested program CSV data (Program -> Phase -> Day -> Exercise[])
  routinePrograms: {},       // User custom routines, adapted to programData shape and merged in
  isLoading: true,           // Loading state for CSV parsing
  error: null,               // Error string if parsing fails
  selectedProgram: localActiveState ? localActiveState.selectedProgram : null,
  selectedPhase: localActiveState ? localActiveState.selectedPhase : null,
  activeSession: localActiveState ? localActiveState.activeSession : null,
  currentView: localActiveState ? localActiveState.currentView : "select",
  workoutHistory: localHistory, // Persistent array of completed workout history
  enrolledProgram: null,     // Currently enrolled program (e.g., "Full Body")
  restTimer: localActiveState ? localActiveState.restTimer : {
    isRunning: false,
    seconds: 0,
    exerciseId: null
  }
};

export const initialState = {
  ...defaultState
};


// Reducer Function
export function workoutReducer(state, action) {
  console.log(`[workoutReducer] 🚀 Dispatch Action: ${action.type}`, action.payload || '');

  switch (action.type) {
    case "LOAD_PROGRAM_START":
      return {
        ...state,
        isLoading: true,
        error: null
      };

    case "LOAD_PROGRAM_SUCCESS":
      console.log(`[workoutReducer] ✅ Program data loaded successfully. Programs:`, Object.keys(action.payload));
      return {
        ...state,
        programData: action.payload,
        isLoading: false
      };

    case "LOAD_PROGRAM_ERROR":
      console.error(`[workoutReducer] ❌ Error loading program data:`, action.payload);
      return {
        ...state,
        isLoading: false,
        error: action.payload
      };

    case "SET_ROUTINE_PROGRAMS":
      // Custom routines adapted to programData shape; merged with CSV programs
      // at the provider level so they flow through the normal workout pipeline.
      return {
        ...state,
        routinePrograms: action.payload || {}
      };

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

    case "SELECT_PROGRAM":
      console.log(`[workoutReducer] 📋 Selecting Program: "${action.payload.program}"`);
      return {
        ...state,
        selectedProgram: action.payload.program,
        selectedPhase: null, // Reset phase on program change
        activeSession: null
      };

    case "SELECT_PHASE":
      console.log(`[workoutReducer] 📅 Selecting Phase: "${action.payload.phase}"`);
      return {
        ...state,
        selectedPhase: action.payload.phase,
        activeSession: null
      };

    case "CLEAR_SELECTION":
      console.log("[workoutReducer] 🧹 Clearing selector states");
      return {
        ...state,
        selectedProgram: null,
        selectedPhase: null,
        activeSession: null,
        currentView: "select"
      };

    case "ENROLL_PROGRAM":
      console.log(`[workoutReducer] 🎯 Enrolling in Program: "${action.payload.program}"`);
      return {
        ...state,
        enrolledProgram: action.payload.program
      };

    case "ABANDON_PROGRAM":
      console.log("[workoutReducer] 🗑️ Abandoning enrolled program");
      return {
        ...state,
        enrolledProgram: null,
        selectedProgram: null,
        selectedPhase: null,
        activeSession: null,
        currentView: "select"
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

    case "UPDATE_SET": {
      if (!state.activeSession) {
        console.warn("[workoutReducer] ⚠️ UPDATE_SET called but activeSession is null.");
        return state;
      }

      const { exerciseId, setNumber, field, value } = action.payload;

      const updatedLogs = state.activeSession.logs.map((log) => {
        if (log.exerciseId !== exerciseId) {
          return log;
        }

        // Find the old value of the set being edited before applying the new value
        const targetSet = log.sets.find(s => s.setNumber === setNumber);
        const oldValue = targetSet ? targetSet[field] : "";

        const updatedSets = log.sets.map((setObj) => {
          if (setObj.setNumber === setNumber) {
            return {
              ...setObj,
              [field]: value
            };
          }

          // Autopopulate downstream sets only if they have not been customized
          // (i.e. they are empty, or they match the exact old value of the edited set)
          if ((field === "weight" || field === "repsCompleted") && setObj.setNumber > setNumber) {
            if (setObj[field] === "" || setObj[field] === oldValue) {
              return {
                ...setObj,
                [field]: value
              };
            }
          }

          return setObj;
        });

        return {
          ...log,
          sets: updatedSets
        };
      });

      const updatedSession = {
        ...state.activeSession,
        logs: updatedLogs
      };

      console.log(`[workoutReducer] ✏️ UPDATE_SET -> Exercise: ${exerciseId}, Set: ${setNumber}, [${field}]: "${value}"`);

      return {
        ...state,
        activeSession: updatedSession
      };
    }

    case "TOGGLE_SET_COMPLETE": {
      if (!state.activeSession) {
        console.warn("[workoutReducer] ⚠️ TOGGLE_SET_COMPLETE called but activeSession is null.");
        return state;
      }

      const { exerciseId, setNumber } = action.payload;

      const updatedLogs = state.activeSession.logs.map((log) => {
        if (log.exerciseId !== exerciseId) {
          return log;
        }

        const updatedSets = log.sets.map((setObj) => {
          if (setObj.setNumber !== setNumber) {
            return setObj;
          }

          return {
            ...setObj,
            isComplete: !setObj.isComplete
          };
        });

        return {
          ...log,
          sets: updatedSets
        };
      });

      const updatedSession = {
        ...state.activeSession,
        logs: updatedLogs
      };

      console.log(`[workoutReducer] ✅ TOGGLE_SET_COMPLETE -> Exercise: ${exerciseId}, Set: ${setNumber}`);

      return {
        ...state,
        activeSession: updatedSession
      };
    }

    case "ADD_SET": {
      if (!state.activeSession) {
        console.warn("[workoutReducer] ⚠️ ADD_SET called but activeSession is null.");
        return state;
      }

      const { exerciseId } = action.payload;

      const updatedLogs = state.activeSession.logs.map((log) => {
        if (log.exerciseId !== exerciseId) {
          return log;
        }

        const nextSetNumber = log.sets.length + 1;
        const lastSet = log.sets[log.sets.length - 1];
        const newSet = {
          setNumber: nextSetNumber,
          weight: lastSet ? lastSet.weight : "",
          repsCompleted: lastSet ? lastSet.repsCompleted : "",
          isComplete: false,
          // Keep the set shape consistent with INIT_SESSION so "last time"
          // references and PR detection don't choke on missing fields.
          previousWeight: "",
          previousReps: ""
        };

        return {
          ...log,
          sets: [...log.sets, newSet]
        };
      });

      console.log(`[workoutReducer] ➕ ADD_SET -> Exercise: ${exerciseId}`);

      return {
        ...state,
        activeSession: {
          ...state.activeSession,
          logs: updatedLogs
        }
      };
    }

    case "REMOVE_SET": {
      if (!state.activeSession) {
        console.warn("[workoutReducer] ⚠️ REMOVE_SET called but activeSession is null.");
        return state;
      }

      const { exerciseId } = action.payload;

      const updatedLogs = state.activeSession.logs.map((log) => {
        if (log.exerciseId !== exerciseId) {
          return log;
        }

        if (log.sets.length <= 1) {
          console.warn(`[workoutReducer] ⚠️ REMOVE_SET ignored: at least 1 set is required for ${exerciseId}`);
          return log;
        }

        return {
          ...log,
          sets: log.sets.slice(0, -1)
        };
      });

      console.log(`[workoutReducer] ➖ REMOVE_SET -> Exercise: ${exerciseId}`);

      return {
        ...state,
        activeSession: {
          ...state.activeSession,
          logs: updatedLogs
        }
      };
    }

    case "SWAP_EXERCISE": {
      if (!state.activeSession) {
        console.warn("[workoutReducer] ⚠️ SWAP_EXERCISE called but activeSession is null.");
        return state;
      }

      const { exerciseId, newExerciseName } = action.payload;
      if (!newExerciseName) return state;

      // Pull last-time numbers for the new exercise from the most recent
      // completed session that contains it (any program/day).
      let prevExerciseLog = null;
      for (let i = state.workoutHistory.length - 1; i >= 0; i--) {
        const found = state.workoutHistory[i].logs?.find(l => l.exerciseName === newExerciseName);
        if (found) { prevExerciseLog = found; break; }
      }

      const updatedLogs = state.activeSession.logs.map((log) => {
        if (log.exerciseId !== exerciseId) return log;

        // Keep the slot's prescription (sets/reps/rpe/rest) but reset the
        // logged values, since this is now a different movement.
        const sets = log.sets.map((setObj, i) => {
          const prevSet = prevExerciseLog && prevExerciseLog.sets && prevExerciseLog.sets[i];
          return {
            setNumber: i + 1,
            weight: "",
            repsCompleted: "",
            isComplete: false,
            previousWeight: prevSet ? prevSet.weight : "",
            previousReps: prevSet ? prevSet.repsCompleted : ""
          };
        });

        return {
          ...log,
          exerciseName: newExerciseName,
          notes: "",
          sets
        };
      });

      console.log(`[workoutReducer] 🔁 SWAP_EXERCISE -> ${exerciseId} is now "${newExerciseName}"`);

      return {
        ...state,
        activeSession: {
          ...state.activeSession,
          logs: updatedLogs
        }
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

    case "SET_ACTIVE_STATE":
      console.log("[workoutReducer] 🔄 SET_ACTIVE_STATE triggered. Payload:", action.payload);
      if (!action.payload) return state;
      
      let restTimer = action.payload.restTimer !== undefined ? action.payload.restTimer : { isRunning: false, seconds: 0, exerciseId: null };
      
      // Resume or stop timer based on end time comparison
      if (restTimer.isRunning && restTimer.endTime) {
        const now = Date.now();
        if (now >= restTimer.endTime) {
          restTimer = { isRunning: false, seconds: 0, exerciseId: null, endTime: null };
        } else {
          restTimer.seconds = Math.max(0, Math.round((restTimer.endTime - now) / 1000));
        }
      }
      
      return {
        ...state,
        selectedProgram: action.payload.selectedProgram !== undefined ? action.payload.selectedProgram : null,
        selectedPhase: action.payload.selectedPhase !== undefined ? action.payload.selectedPhase : null,
        activeSession: action.payload.activeSession !== undefined ? action.payload.activeSession : null,
        currentView: action.payload.currentView !== undefined ? action.payload.currentView : "select",
        restTimer
      };

    case "SET_VIEW":
      console.log(`[workoutReducer] 🧭 Navigating to View: "${action.payload.view}"`);
      return {
        ...state,
        currentView: action.payload.view
      };

    case "START_REST_TIMER":
      console.log(`[workoutReducer] ⏱️ Starting rest timer: ${action.payload.seconds}s (Exercise: ${action.payload.exerciseId})`);
      return {
        ...state,
        restTimer: {
          isRunning: true,
          seconds: action.payload.seconds,
          exerciseId: action.payload.exerciseId,
          endTime: Date.now() + action.payload.seconds * 1000
        }
      };

    case "MODIFY_REST_TIMER": {
      const nextSeconds = Math.max(0, state.restTimer.seconds + action.payload.seconds);
      const isRunning = nextSeconds > 0;
      return {
        ...state,
        restTimer: {
          ...state.restTimer,
          seconds: nextSeconds,
          isRunning,
          endTime: isRunning ? Date.now() + nextSeconds * 1000 : null
        }
      };
    }

    case "TICK_REST_TIMER": {
      if (!state.restTimer.endTime) return state;
      const nextSeconds = Math.max(0, Math.round((state.restTimer.endTime - Date.now()) / 1000));
      const isRunning = nextSeconds > 0;
      return {
        ...state,
        restTimer: {
          ...state.restTimer,
          isRunning,
          seconds: nextSeconds
        }
      };
    }

    case "STOP_REST_TIMER":
      console.log("[workoutReducer] 🛑 Rest timer stopped.");
      return {
        ...state,
        restTimer: {
          isRunning: false,
          seconds: 0,
          exerciseId: null,
          endTime: null
        }
      };

    case "RESET_ON_LOGOUT":
      console.log("[workoutReducer] 🧹 Resetting state on logout.");
      return {
        ...state,
        selectedProgram: null,
        selectedPhase: null,
        activeSession: null,
        currentView: "select",
        workoutHistory: [],
        enrolledProgram: null,
        routinePrograms: {},
        restTimer: {
          isRunning: false,
          seconds: 0,
          exerciseId: null,
          endTime: null
        }
      };

    default:
      console.warn(`[workoutReducer] ⚠️ Unknown action type: ${action.type}`);
      return state;
  }
}
