import { createContext, useContext, useReducer, useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { initialState, workoutReducer } from './workoutReducer';
import { auth, googleProvider } from '../firebase/config';
import { signInWithPopup, signInWithRedirect, getRedirectResult, signOut, onAuthStateChanged } from 'firebase/auth';
import {
  saveSessionToCloud,
  fetchUserHistory,
  deleteSessionFromCloud,
  saveGoalsToCloud,
  fetchGoalsFromCloud,
  saveSettingsToCloud,
  fetchSettingsFromCloud,
  saveActiveStateToCloud,
  fetchActiveStateFromCloud,
  saveEnrolledProgramToCloud,
  fetchEnrolledProgramFromCloud,
  fetchUserRoutines,
  saveRoutineToCloud,
  deleteRoutineFromCloud,
  shareRoutineToPublic,
} from '../firebase/workoutService';
import { useProgramData } from '../hooks/useProgramData';
import { useRestTimer } from '../hooks/useRestTimer';
import { useWakeLock } from '../hooks/useWakeLock';
import { computePRMap, annotateSessionPRs } from '../utils/prs';
import { computeSessionTotals } from '../utils/volumeCalculator';
import { routinesToProgramData } from '../utils/routineAdapter';
import { loadActiveState, saveActiveState, clearActiveState, purgeLegacyGlobalKeys } from '../utils/localCache';

const DEFAULT_GOALS = { 'Back Squat': 100, 'Barbell Bench Press': 80, Deadlift: 140 };
const DEFAULT_SETTINGS = { soundEnabled: true, hapticsEnabled: true, silenceAll: false };

export const WorkoutContext = createContext();

export function WorkoutProvider({ children }) {
  const [state, dispatch] = useReducer(workoutReducer, initialState);

  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState('idle');

  const [prs, setPrs] = useState({});
  const [customGoals, setCustomGoals] = useState(DEFAULT_GOALS);
  const [isGoalsHydrated, setIsGoalsHydrated] = useState(false);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [isSettingsHydrated, setIsSettingsHydrated] = useState(false);
  const [lastCompletedSession, setLastCompletedSession] = useState(null);
  const [customRoutines, setCustomRoutines] = useState([]);

  // ── Side-effect hooks (CSV load, rest timer + audio, screen wake lock) ──
  useProgramData(dispatch);
  useRestTimer({ restTimer: state.restTimer, settings, dispatch });
  useWakeLock(!!state.activeSession);

  // ── Auth: resolve redirect, then listen and hydrate cloud data on login ──
  useEffect(() => {
    let isMounted = true;
    let unsubscribe = () => {};

    // Remove the old global (unscoped) localStorage keys that leaked data
    // across accounts on shared devices.
    purgeLegacyGlobalKeys();

    const initAuth = async () => {
      try {
        const redirectResult = await getRedirectResult(auth);
        if (redirectResult?.user && isMounted) setUser(redirectResult.user);
      } catch (error) {
        if (error.code === 'auth/unauthorized-domain') {
          alert(`This domain (${window.location.hostname}) is not authorized in Firebase Console. Add it to Authorized Domains.`);
        } else {
          console.error('[WorkoutProvider] Redirect result error:', error);
        }
      }

      if (!isMounted) return;
      unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
        setUser(currentUser);

        if (currentUser) {
          setSyncStatus('syncing');

          // Instant resume from the UID-scoped local cache while the cloud
          // round-trip is in flight; the cloud value overlays it below.
          const localActive = loadActiveState(currentUser.uid);
          if (localActive && isMounted) dispatch({ type: 'SET_ACTIVE_STATE', payload: localActive });

          try {
            const [cloudHistory, cloudGoals, cloudSettings, cloudActiveState, cloudEnrolledProgram, cloudRoutines] =
              await Promise.all([
                fetchUserHistory(currentUser.uid),
                fetchGoalsFromCloud(currentUser.uid),
                fetchSettingsFromCloud(currentUser.uid),
                fetchActiveStateFromCloud(currentUser.uid),
                fetchEnrolledProgramFromCloud(currentUser.uid),
                fetchUserRoutines(currentUser.uid),
              ]);

            if (isMounted) {
              if (cloudHistory && cloudHistory.length > 0) {
                dispatch({ type: 'SET_HISTORY', payload: cloudHistory });
                setLastCompletedSession(cloudHistory[cloudHistory.length - 1]);
              } else {
                dispatch({ type: 'SET_HISTORY', payload: [] });
                setLastCompletedSession(null);
              }
              if (cloudGoals) setCustomGoals(cloudGoals);
              setIsGoalsHydrated(true);
              if (cloudSettings) setSettings(cloudSettings);
              setIsSettingsHydrated(true);
              if (cloudEnrolledProgram) dispatch({ type: 'ENROLL_PROGRAM', payload: { program: cloudEnrolledProgram } });
              if (cloudActiveState) dispatch({ type: 'SET_ACTIVE_STATE', payload: cloudActiveState });
              setCustomRoutines(cloudRoutines || []);
              dispatch({ type: 'SET_ROUTINE_PROGRAMS', payload: routinesToProgramData(cloudRoutines || []) });
              setSyncStatus('synced');
            }
          } catch (error) {
            console.error('[WorkoutProvider] Cloud hydration failed on login:', error);
            if (isMounted) setSyncStatus('error');
          }
        } else if (isMounted) {
          setSyncStatus('idle');
        }

        if (isMounted) setAuthLoading(false);
      });
    };

    initAuth();
    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const loginWithGoogle = useCallback(async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      const popupBlockedOrClosed = ['auth/popup-blocked', 'auth/popup-closed-by-user', 'auth/cancelled-popup-request'];
      if (popupBlockedOrClosed.includes(error.code)) {
        try {
          await signInWithRedirect(auth, googleProvider);
        } catch (redirectError) {
          console.error('[WorkoutProvider] Redirect sign-in failed:', redirectError);
          alert('Sign-in failed. Please check your connection or browser settings.');
        }
      } else if (error.code === 'auth/unauthorized-domain') {
        alert(`This domain (${window.location.hostname}) is not authorized for Google Sign-in.`);
      } else {
        console.error('[WorkoutProvider] Google sign-in failed:', error);
        alert(`Sign-in failed: ${error.message || 'Unknown error'}`);
      }
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      const uid = auth.currentUser?.uid;
      await signOut(auth);
      clearActiveState(uid);
      setLastCompletedSession(null);
      setPrs({});
      setCustomGoals(DEFAULT_GOALS);
      setCustomRoutines([]);
      dispatch({ type: 'RESET_ON_LOGOUT' });
    } catch (error) {
      console.error('[WorkoutProvider] Sign-out failed:', error);
    }
  }, []);

  // ── Persist custom goals to cloud when they change post-hydration ──
  useEffect(() => {
    if (!user || !isGoalsHydrated) return;
    saveGoalsToCloud(user.uid, customGoals).catch((err) =>
      console.error('[WorkoutProvider] Failed to save goals:', err)
    );
  }, [customGoals, user, isGoalsHydrated]);

  // ── Persist settings to cloud when they change post-hydration ──
  useEffect(() => {
    if (!user || !isSettingsHydrated) return;
    saveSettingsToCloud(user.uid, settings).catch((err) =>
      console.error('[WorkoutProvider] Failed to sync settings:', err)
    );
  }, [settings, user, isSettingsHydrated]);

  // ── Fast, UID-scoped local cache of the active session (instant resume) ──
  // Debounced so we don't write on every keystroke. History is NOT mirrored
  // locally — Firestore's persistentLocalCache already serves it offline.
  useEffect(() => {
    if (state.isLoading || !user) return;
    const activeState = {
      selectedProgram: state.selectedProgram,
      selectedPhase: state.selectedPhase,
      activeSession: state.activeSession,
      currentView: state.currentView,
      restTimer: state.restTimer,
    };
    const handler = setTimeout(() => saveActiveState(user.uid, activeState), 1500);
    return () => clearTimeout(handler);
  }, [state.selectedProgram, state.selectedPhase, state.activeSession, state.currentView, state.restTimer, state.isLoading, user]);

  // ── Throttled cloud sync of active state (≤ 1 write / 10s, trailing) ──
  // Keeps Firestore write volume sane during a long session while still
  // converging on the latest state.
  const lastCloudSyncRef = useRef(0);
  const cloudSyncTimerRef = useRef(null);
  useEffect(() => {
    if (state.isLoading || !user) return;
    const activeState = {
      selectedProgram: state.selectedProgram,
      selectedPhase: state.selectedPhase,
      activeSession: state.activeSession,
      currentView: state.currentView,
      restTimer: state.restTimer,
    };
    const CLOUD_MIN_INTERVAL = 10000;
    const flush = () => {
      lastCloudSyncRef.current = Date.now();
      saveActiveStateToCloud(user.uid, activeState).catch((err) =>
        console.error('[WorkoutProvider] Failed to sync active state:', err)
      );
    };
    clearTimeout(cloudSyncTimerRef.current);
    const elapsed = Date.now() - lastCloudSyncRef.current;
    if (elapsed >= CLOUD_MIN_INTERVAL) flush();
    else cloudSyncTimerRef.current = setTimeout(flush, CLOUD_MIN_INTERVAL - elapsed);
    return () => clearTimeout(cloudSyncTimerRef.current);
  }, [state.selectedProgram, state.selectedPhase, state.activeSession, state.currentView, state.restTimer, state.isLoading, user]);

  // ── Keep the PR map in sync with history (single source: utils/prs) ──
  useEffect(() => {
    if (state.isLoading) return;
    const computed = computePRMap(state.workoutHistory);
    setPrs((prev) => (JSON.stringify(prev) === JSON.stringify(computed) ? prev : computed));
  }, [state.workoutHistory, state.isLoading]);

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
  const updateSettings = useCallback((newSettings) => setSettings((prev) => ({ ...prev, ...newSettings })), []);

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
    [state.activeSession, state.enrolledProgram, prs, user]
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
  }, [state.workoutHistory, user]);

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
  }, [state.workoutHistory, user]);

  const abandonProgram = useCallback(() => {
    if (user) {
      saveEnrolledProgramToCloud(user.uid, null).catch((err) =>
        console.error('[WorkoutProvider] Failed to clear enrolled program:', err)
      );
    }
    dispatch({ type: 'ABANDON_PROGRAM' });
  }, [user]);

  const isPersonalRecord = useCallback(
    (exerciseName, weight) => {
      if (!exerciseName) return false;
      const w = parseFloat(weight) || 0;
      return w > 0 && w > (parseFloat(prs[exerciseName]) || 0);
    },
    [prs]
  );

  const updateCustomGoal = useCallback((exerciseName, value) => {
    setCustomGoals((prev) => ({ ...prev, [exerciseName]: value }));
  }, []);

  // ── Custom routines (cloud calls funnel through here, not components) ──
  const reloadRoutines = useCallback(async () => {
    if (!user) return;
    const routines = await fetchUserRoutines(user.uid);
    setCustomRoutines(routines);
    dispatch({ type: 'SET_ROUTINE_PROGRAMS', payload: routinesToProgramData(routines) });
  }, [user]);

  const saveRoutine = useCallback(
    async (routine) => {
      if (!user) return;
      await saveRoutineToCloud(user.uid, routine);
      await reloadRoutines();
    },
    [user, reloadRoutines]
  );

  const deleteRoutine = useCallback(
    async (routineId) => {
      if (!user) return;
      await deleteRoutineFromCloud(user.uid, routineId);
      await reloadRoutines();
    },
    [user, reloadRoutines]
  );

  const shareRoutine = useCallback((routine) => shareRoutineToPublic(routine), []);

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
      isPersonalRecord,
      isPR: isPersonalRecord,
      updateCustomGoal,
      reloadRoutines,
      saveRoutine,
      deleteRoutine,
      shareRoutine,
      dispatch,
    }),
    [
      programData, state.isLoading, state.error, state.selectedProgram, state.selectedPhase,
      state.activeSession, state.currentView, state.restTimer, lastCompletedSession, state.workoutHistory,
      state.enrolledProgram, user, authLoading, syncStatus, prs, customGoals, customRoutines, settings,
      updateSettings, selectProgram, selectPhase, clearSelection, initSession, updateSetWeight, updateSetReps,
      completeSet, addSet, removeSet, swapExercise, cancelSession, saveSession, setSessionNotes, undoLastSession,
      restartLastSession, setView, abandonProgram, startRestTimer, stopRestTimer, modifyRestTimer,
      loginWithGoogle, logout, isPersonalRecord, updateCustomGoal, reloadRoutines, saveRoutine, deleteRoutine, shareRoutine,
    ]
  );

  return <WorkoutContext.Provider value={value}>{children}</WorkoutContext.Provider>;
}

export function useWorkout() {
  const context = useContext(WorkoutContext);
  if (!context) throw new Error('useWorkout must be used within a WorkoutProvider');
  return context;
}
