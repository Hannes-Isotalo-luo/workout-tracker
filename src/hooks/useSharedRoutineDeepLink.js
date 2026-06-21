import { useEffect } from 'react';
import { fetchPublicRoutine } from '../firebase/workoutService';

/**
 * Handles `?sharedRoutineId=…` deep links: once a user is signed in, offers to
 * clone the public routine into their account, then routes to the builder.
 *
 * @param {{ user: object, saveRoutine: Function, setView: Function, showToast: Function }} args
 */
export function useSharedRoutineDeepLink({ user, saveRoutine, setView, showToast }) {
  useEffect(() => {
    if (!user) return;
    const sharedId = new URLSearchParams(window.location.search).get('sharedRoutineId');
    if (!sharedId) return;

    let cancelled = false;
    fetchPublicRoutine(sharedId)
      .then((routine) => {
        if (cancelled || !routine) return;
        if (window.confirm(`Clone public routine "${routine.name}" to your account?`)) {
          const clone = { ...routine, id: crypto.randomUUID(), authorId: user.uid, isPublic: false };
          return saveRoutine(clone).then(() => {
            showToast(`Routine "${routine.name}" cloned!`);
            setView('builder');
            window.history.replaceState({}, '', window.location.pathname);
          });
        }
      })
      .catch((e) => console.error('[deepLink] Failed to clone shared routine:', e));

    return () => {
      cancelled = true;
    };
  }, [user, saveRoutine, setView, showToast]);
}
