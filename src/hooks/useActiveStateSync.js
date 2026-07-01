import { useEffect, useRef } from 'react';
import { saveActiveState } from '../utils/localCache';
import { saveActiveStateToCloud } from '../firebase/workoutService';

/**
 * Mirrors the active-session snapshot (selection + activeSession + view +
 * restTimer) to both the fast UID-scoped localStorage cache (instant resume)
 * and Firestore (cross-device resume). Both writes are throttled — measured
 * from the time of the *last actual write*, not a plain debounce — so a
 * continuously-ticking rest timer (which changes state every second while
 * running) can't starve either write indefinitely. History is never mirrored
 * locally; Firestore's persistentLocalCache already serves it offline.
 *
 * @param {object} state — the workout reducer state
 * @param {object|null} user
 */
export function useActiveStateSync(state, user) {
  const lastLocalSyncRef = useRef(0);
  const localSyncTimerRef = useRef(null);
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

    const LOCAL_MIN_INTERVAL = 1500;
    const flushLocal = () => {
      lastLocalSyncRef.current = Date.now();
      saveActiveState(user.uid, activeState);
    };
    clearTimeout(localSyncTimerRef.current);
    const localElapsed = Date.now() - lastLocalSyncRef.current;
    if (localElapsed >= LOCAL_MIN_INTERVAL) flushLocal();
    else localSyncTimerRef.current = setTimeout(flushLocal, LOCAL_MIN_INTERVAL - localElapsed);

    const CLOUD_MIN_INTERVAL = 10000;
    const flushCloud = () => {
      lastCloudSyncRef.current = Date.now();
      saveActiveStateToCloud(user.uid, activeState).catch((err) =>
        console.error('[useActiveStateSync] Failed to sync active state:', err)
      );
    };
    clearTimeout(cloudSyncTimerRef.current);
    const cloudElapsed = Date.now() - lastCloudSyncRef.current;
    if (cloudElapsed >= CLOUD_MIN_INTERVAL) flushCloud();
    else cloudSyncTimerRef.current = setTimeout(flushCloud, CLOUD_MIN_INTERVAL - cloudElapsed);

    return () => {
      clearTimeout(localSyncTimerRef.current);
      clearTimeout(cloudSyncTimerRef.current);
    };
  }, [state.selectedProgram, state.selectedPhase, state.activeSession, state.currentView, state.restTimer, state.isLoading, user]);
}
