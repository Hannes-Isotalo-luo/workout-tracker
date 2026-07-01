// Rest-timer domain: the countdown shown between sets.
export const REST_TIMER_ACTION_TYPES = new Set([
  'START_REST_TIMER',
  'MODIFY_REST_TIMER',
  'TICK_REST_TIMER',
  'STOP_REST_TIMER',
]);

export function restTimerReducer(state, action) {
  switch (action.type) {
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

    default:
      return state;
  }
}
