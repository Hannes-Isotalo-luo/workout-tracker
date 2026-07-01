// Set-editing domain: mutating the sets of an already-started active session
// (weight/reps entry, completion toggling, add/remove rows, exercise swap).
export const SET_EDITING_ACTION_TYPES = new Set([
  'UPDATE_SET',
  'TOGGLE_SET_COMPLETE',
  'ADD_SET',
  'REMOVE_SET',
  'SWAP_EXERCISE',
]);

export function setEditingReducer(state, action) {
  switch (action.type) {
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

    default:
      return state;
  }
}
