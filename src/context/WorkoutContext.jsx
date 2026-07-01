import { createContext, useContext, useReducer, useMemo, useCallback } from 'react';
import { initialState, workoutReducer } from './workoutReducer';
import { saveSessionToCloud, deleteSessionFromCloud, saveEnrolledProgramToCloud } from '../firebase/workoutService';
import { useProgramData } from '../hooks/useProgramData';
import { useRestTimer } from '../hooks/useRestTimer';
import { useWakeLock } from '../hooks/useWakeLock';
import { useAuthSync } from '../hooks/useAuthSync';
import { useRoutines } from '../hooks/useRoutines';
import { useActiveStateSync } from '../hooks/useActiveStateSync';
import { annotateSessionPRs } from '../utils/prs';
import { computeSessionTotals } from '../utils/volumeCalculator';

export const WorkoutContext = createContext();

export function WorkoutProvider({ children }) {
  const [state, dispatch] = useReducer(workoutReducer, initialState);

  // ── User identity, cloud hydration, and derived PR map ──
  const {
    user, authLoading, syncStatus, setSyncStatus,
    prs, isPR,
    customGoals, updateCustomGoal,
    settings, updateSettings,
    lastCompletedSession, setLastCompletedSession,
    customRoutines, setCustomRoutines,
    loginWithGoogle, logout,
  } = useAuthSync(dispatch, state.workoutHistory, state.isLoading);

  // ── Custom-routine CRUD (operates on the routines useAuthSync hydrated) ──
  const { reloadRoutines, saveRoutine, deleteRoutine, shareRoutine } = useRoutines(user, dispatch, customRoutines, setCustomRoutines);

  // ── Side-effect hooks (CSV load, rest timer + audio, screen wake lock) ──
  useProgramData(dispatch);
  useRestTimer({ restTimer: state.restTimer, settings, dispatch });
  useWakeLock(!!state.activeSession);

  // ── Local + cloud mirroring of the active session (instant/cross-device resume) ──
  useActiveStateSync(state, user);

  // ── Dispatcher helpers ──────────────────────────────────────────────
  const selectProgram = useCallback((program) => dispatch({ type: 'SELECT_PROGRAM', payload: { program } }), []);
  const selectPhase = useCallback((phase) => dispatch({ type: 'SELECT_PHASE', payload: { phase } }), []);
  const clearSelection = useCallback(() => dispatch({ type: 'CLEAR_SELECTION' }), []);
  const initSession = useCallback((day, exercises) => dispatch({ type: 'INIT_SESSION', payload: { day, exercises } }), []);
  const updateSetWeight = useCallback(
    (exerciseId, setNumber, value) => dispatch({ type: 'UPDATE_SET', payload: { exerciseId, setNumber, field: 'weight', value } }),
    []
  );
  const updateSetReps = useCallback(
    (exerciseId, setNumber, value) => dispatch({ type: 'UPDATE_SET', payload: { exerciseId, setNumber, field: 'repsCompleted', value } }),
    []
  );
  const completeSet = useCallback((exerciseId, setNumber, value = null) => {
    if (value !== null) {
      dispatch({ type: 'UPDATE_SET', payload: { exerciseId, setNumber, field: 'isComplete', value: !!value } });
    } else {
      dispatch({ type: 'TOGGLE_SET_COMPLETE', payload: { exerciseId, setNumber } });
    }
  }, []);
  const addSet = useCallback((exerciseId) => dispatch({ type: 'ADD_SET', payload: { exerciseId } }), []);
  const removeSet = useCallback((exerciseId) => dispatch({ type: 'REMOVE_SET', payload: { exerciseId } }), []);
  const swapExercise = useCallback(
    (exerciseId, newExerciseName) => dispatch({ type: 'SWAP_EXERCISE', payload: { exerciseId, newExerciseName } }),
    []
  );
  const cancelSession = useCallback(() => dispatch({ type: 'CANCEL_SESSION' }), []);
  const setView = useCallback((view) => dispatch({ type: 'SET_VIEW', payload: { view } }), []);
  const setSessionNotes = useCallback((notes) => dispatch({ type: 'SET_SESSION_NOTES', payload: notes }), []);
  const startRestTimer = useCallback((seconds, exerciseId) => dispatch({ type: 'START_REST_TIMER', payload: { seconds, exerciseId } }), []);
  const stopRestTimer = useCallback(() => dispatch({ type: 'STOP_REST_TIMER' }), []);
  const modifyRestTimer = useCallback((seconds) => dispatch({ type: 'MODIFY_REST_TIMER', payload: { seconds } }), []);

  const saveSession = useCallback(
    (duration = 0) => {
      if (!state.activeSession) {
        dispatch({ type: 'SAVE_SESSION' });
        return;
      }

      const { completedSets, totalVolume } = computeSessionTotals(state.activeSession);

      // Flag PR sets against the pre-session record map (single source: utils/prs),
      // then strip the transient "last time" fields before persisting.
      const annotated = annotateSessionPRs(state.activeSession, prs);
      const cleanLogs = annotated.logs.map((log) => ({
        ...log,
        sets: log.sets.map(({ previousWeight, previousReps, ...cleanSet }) => cleanSet),
      }));

      const completedSession = {
        ...state.activeSession,
        logs: cleanLogs,
        completedAt: new Date().toISOString(),
        duration,
        completedSets,
        totalVolume,
      };

      setLastCompletedSession(completedSession);

      if (user) {
        setSyncStatus('syncing');
        saveSessionToCloud(user.uid, completedSession)
          .then(() => setSyncStatus('synced'))
          .catch((err) => {
            console.error('[WorkoutProvider] Failed to sync session:', err);
            setSyncStatus('error');
          });
      }

      // Auto-enroll on first completed workout if not enrolled yet.
      if (!state.enrolledProgram) {
        if (user) {
          saveEnrolledProgramToCloud(user.uid, completedSession.program).catch((err) =>
            console.error('[WorkoutProvider] Failed to save enrolled program:', err)
          );
        }
        dispatch({ type: 'ENROLL_PROGRAM', payload: { program: completedSession.program } });
      }

      dispatch({ type: 'SAVE_SESSION', payload: completedSession });
    },
    [state.activeSession, state.enrolledProgram, prs, user, setLastCompletedSession, setSyncStatus]
  );

  const undoLastSession = useCallback(() => {
    const lastWorkout = state.workoutHistory[state.workoutHistory.length - 1];
    setLastCompletedSession(state.workoutHistory.length > 1 ? state.workoutHistory[state.workoutHistory.length - 2] : null);
    if (user && lastWorkout?.id) {
      deleteSessionFromCloud(user.uid, lastWorkout.id).catch((err) =>
        console.error('[WorkoutProvider] Failed to delete session:', err)
      );
    }
    dispatch({ type: 'UNDO_LAST_SESSION' });
  }, [state.workoutHistory, user, setLastCompletedSession]);

  const restartLastSession = useCallback(() => {
    const lastWorkout = state.workoutHistory[state.workoutHistory.length - 1];
    if (!lastWorkout) return;
    setLastCompletedSession(state.workoutHistory.length > 1 ? state.workoutHistory[state.workoutHistory.length - 2] : null);
    if (user && lastWorkout.id) {
      deleteSessionFromCloud(user.uid, lastWorkout.id).catch((err) =>
        console.error('[WorkoutProvider] Failed to delete session during restart:', err)
      );
    }
    dispatch({ type: 'RESTART_LAST_SESSION' });
  }, [state.workoutHistory, user, setLastCompletedSession]);

  const abandonProgram = useCallback(() => {
    if (user) {
      saveEnrolledProgramToCloud(user.uid, null).catch((err) =>
        console.error('[WorkoutProvider] Failed to clear enrolled program:', err)
      );
    }
    dispatch({ type: 'ABANDON_PROGRAM' });
  }, [user]);

  // Merge custom routines into program data so they flow through the normal
  // selector → init → next-session pipeline. Stays null until the CSV loads.
  const programData = useMemo(() => {
    if (!state.programData) return state.programData;
    return { ...state.programData, ...state.routinePrograms };
  }, [state.programData, state.routinePrograms]);

  const value = useMemo(
    () => ({
      // State
      programData,
      isLoading: state.isLoading,
      error: state.error,
      selectedProgram: state.selectedProgram,
      selectedPhase: state.selectedPhase,
      activeSession: state.activeSession,
      currentView: state.currentView,
      restTimer: state.restTimer,
      lastCompletedSession,
      workoutHistory: state.workoutHistory,
      enrolledProgram: state.enrolledProgram,
      user,
      authLoading,
      syncStatus,
      prs,
      customGoals,
      customRoutines,
      settings,
      // Actions
      updateSettings,
      selectProgram,
      selectPhase,
      clearSelection,
      initSession,
      updateSetWeight,
      updateSetReps,
      completeSet,
      addSet,
      removeSet,
      swapExercise,
      cancelSession,
      saveSession,
      setSessionNotes,
      undoLastSession,
      restartLastSession,
      setView,
      abandonProgram,
      startRestTimer,
      stopRestTimer,
      modifyRestTimer,
      setLastCompletedSession,
      loginWithGoogle,
      logout,
      isPR,
      updateCustomGoal,
      reloadRoutines,
      saveRoutine,
      deleteRoutine,
      shareRoutine,
    }),
    [
      programData, state.isLoading, state.error, state.selectedProgram, state.selectedPhase,
      state.activeSession, state.currentView, state.restTimer, lastCompletedSession, state.workoutHistory,
      state.enrolledProgram, user, authLoading, syncStatus, prs, customGoals, customRoutines, settings,
      updateSettings, selectProgram, selectPhase, clearSelection, initSession, updateSetWeight, updateSetReps,
      completeSet, addSet, removeSet, swapExercise, cancelSession, saveSession, setSessionNotes, undoLastSession,
      restartLastSession, setView, abandonProgram, startRestTimer, stopRestTimer, modifyRestTimer,
      setLastCompletedSession, loginWithGoogle, logout, isPR, updateCustomGoal, reloadRoutines, saveRoutine, deleteRoutine, shareRoutine,
    ]
  );

  return <WorkoutContext.Provider value={value}>{children}</WorkoutContext.Provider>;
}

export function useWorkout() {
  const context = useContext(WorkoutContext);
  if (!context) throw new Error('useWorkout must be used within a WorkoutProvider');
  return context;
}
