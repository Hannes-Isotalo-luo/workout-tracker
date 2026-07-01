import { useState, useEffect, useCallback } from 'react';
import { auth, googleProvider } from '../firebase/config';
import { signInWithPopup, signInWithRedirect, getRedirectResult, signOut, onAuthStateChanged } from 'firebase/auth';
import {
  fetchUserHistory,
  saveGoalsToCloud,
  fetchGoalsFromCloud,
  saveSettingsToCloud,
  fetchSettingsFromCloud,
  fetchActiveStateFromCloud,
  fetchEnrolledProgramFromCloud,
  fetchUserRoutines,
} from '../firebase/workoutService';
import { routinesToProgramData } from '../utils/routineAdapter';
import { computePRMap } from '../utils/prs';
import { loadActiveState, clearActiveState, purgeLegacyGlobalKeys } from '../utils/localCache';

const DEFAULT_GOALS = { 'Back Squat': 100, 'Barbell Bench Press': 80, Deadlift: 140 };
const DEFAULT_SETTINGS = { soundEnabled: true, hapticsEnabled: true, silenceAll: false };

/**
 * Owns the signed-in user, cloud-sync status, and everything hydrated at
 * login (history, goals, settings, enrolled program, active state, custom
 * routines, and the derived PR map) — dispatching into the workout reducer
 * as data arrives so the rest of the app only ever reads from WorkoutContext.
 *
 * @param {Function} dispatch — the workout reducer dispatch
 * @param {Array} workoutHistory — state.workoutHistory, to keep the PR map in sync
 * @param {boolean} isProgramLoading — state.isLoading, gates the PR recompute
 */
export function useAuthSync(dispatch, workoutHistory, isProgramLoading) {
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
          console.error('[useAuthSync] Redirect result error:', error);
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
            console.error('[useAuthSync] Cloud hydration failed on login:', error);
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
  }, [dispatch]);

  const loginWithGoogle = useCallback(async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      const popupBlockedOrClosed = ['auth/popup-blocked', 'auth/popup-closed-by-user', 'auth/cancelled-popup-request'];
      if (popupBlockedOrClosed.includes(error.code)) {
        try {
          await signInWithRedirect(auth, googleProvider);
        } catch (redirectError) {
          console.error('[useAuthSync] Redirect sign-in failed:', redirectError);
          alert('Sign-in failed. Please check your connection or browser settings.');
        }
      } else if (error.code === 'auth/unauthorized-domain') {
        alert(`This domain (${window.location.hostname}) is not authorized for Google Sign-in.`);
      } else {
        console.error('[useAuthSync] Google sign-in failed:', error);
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
      console.error('[useAuthSync] Sign-out failed:', error);
    }
  }, [dispatch]);

  // ── Persist custom goals to cloud when they change post-hydration ──
  useEffect(() => {
    if (!user || !isGoalsHydrated) return;
    saveGoalsToCloud(user.uid, customGoals).catch((err) =>
      console.error('[useAuthSync] Failed to save goals:', err)
    );
  }, [customGoals, user, isGoalsHydrated]);

  // ── Persist settings to cloud when they change post-hydration ──
  useEffect(() => {
    if (!user || !isSettingsHydrated) return;
    saveSettingsToCloud(user.uid, settings).catch((err) =>
      console.error('[useAuthSync] Failed to sync settings:', err)
    );
  }, [settings, user, isSettingsHydrated]);

  // ── Keep the PR map in sync with history (single source: utils/prs) ──
  useEffect(() => {
    if (isProgramLoading) return;
    const computed = computePRMap(workoutHistory);
    setPrs((prev) => (JSON.stringify(prev) === JSON.stringify(computed) ? prev : computed));
  }, [workoutHistory, isProgramLoading]);

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

  const updateSettings = useCallback((newSettings) => setSettings((prev) => ({ ...prev, ...newSettings })), []);

  return {
    user,
    authLoading,
    syncStatus,
    setSyncStatus,
    prs,
    isPR: isPersonalRecord,
    customGoals,
    updateCustomGoal,
    settings,
    updateSettings,
    lastCompletedSession,
    setLastCompletedSession,
    customRoutines,
    setCustomRoutines,
    loginWithGoogle,
    logout,
  };
}
