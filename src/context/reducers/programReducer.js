// Program/selection domain: CSV + custom-routine program data, and the
// program → phase selection wizard state.
export const PROGRAM_ACTION_TYPES = new Set([
  'LOAD_PROGRAM_START',
  'LOAD_PROGRAM_SUCCESS',
  'LOAD_PROGRAM_ERROR',
  'SET_ROUTINE_PROGRAMS',
  'SELECT_PROGRAM',
  'SELECT_PHASE',
  'CLEAR_SELECTION',
  'ENROLL_PROGRAM',
  'ABANDON_PROGRAM',
]);

export function programReducer(state, action) {
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

    default:
      return state;
  }
}
