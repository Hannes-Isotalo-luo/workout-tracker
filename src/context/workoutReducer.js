import { programReducer, PROGRAM_ACTION_TYPES } from './reducers/programReducer.js';
import { sessionLifecycleReducer, SESSION_LIFECYCLE_ACTION_TYPES } from './reducers/sessionLifecycleReducer.js';
import { setEditingReducer, SET_EDITING_ACTION_TYPES } from './reducers/setEditingReducer.js';
import { restTimerReducer, REST_TIMER_ACTION_TYPES } from './reducers/restTimerReducer.js';

// Pure initial state. Persistence is intentionally kept out of this module:
// the provider hydrates from the UID-scoped local cache and the cloud after
// auth resolves (see WorkoutContext). This keeps the reducer pure/testable and
// prevents one account's cached data from seeding another account's session.
const defaultState = {
  programData: null,         // Parsed nested program CSV data (Program -> Phase -> Day -> Exercise[])
  routinePrograms: {},       // User custom routines, adapted to programData shape and merged in
  isLoading: true,           // Loading state for CSV parsing
  error: null,               // Error string if parsing fails
  selectedProgram: null,
  selectedPhase: null,
  activeSession: null,
  currentView: "select",
  workoutHistory: [],        // Completed workout history (hydrated from cloud on login)
  enrolledProgram: null,     // Currently enrolled program (e.g., "Full Body")
  restTimer: {
    isRunning: false,
    seconds: 0,
    exerciseId: null
  }
};

export const initialState = {
  ...defaultState
};

// Top-level reducer: handles the few actions that are genuinely cross-cutting
// (touch fields spanning multiple domains), then delegates everything else to
// the domain sub-reducer that owns that action type. Splitting by domain keeps
// each sub-reducer focused and independently readable; see ./reducers/.
export function workoutReducer(state, action) {
  console.log(`[workoutReducer] 🚀 Dispatch Action: ${action.type}`, action.payload || '');

  switch (action.type) {
    case "SET_VIEW":
      console.log(`[workoutReducer] 🧭 Navigating to View: "${action.payload.view}"`);
      return {
        ...state,
        currentView: action.payload.view
      };

    case "SET_ACTIVE_STATE": {
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
    }

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
      break;
  }

  if (PROGRAM_ACTION_TYPES.has(action.type)) return programReducer(state, action);
  if (SESSION_LIFECYCLE_ACTION_TYPES.has(action.type)) return sessionLifecycleReducer(state, action);
  if (SET_EDITING_ACTION_TYPES.has(action.type)) return setEditingReducer(state, action);
  if (REST_TIMER_ACTION_TYPES.has(action.type)) return restTimerReducer(state, action);

  console.warn(`[workoutReducer] ⚠️ Unknown action type: ${action.type}`);
  return state;
}
