import { useCallback } from 'react';
import { fetchUserRoutines, saveRoutineToCloud, deleteRoutineFromCloud, shareRoutineToPublic } from '../firebase/workoutService';
import { routinesToProgramData } from '../utils/routineAdapter';

/**
 * Custom-routine CRUD. All cloud calls for routines funnel through here —
 * components never touch workoutService directly. `customRoutines` itself is
 * owned by useAuthSync (it's part of what gets hydrated on login); this hook
 * just operates on it via the passed-in setter.
 *
 * @param {object|null} user
 * @param {Function} dispatch — the workout reducer dispatch (merges routines into programData)
 * @param {Array} customRoutines
 * @param {Function} setCustomRoutines
 */
export function useRoutines(user, dispatch, customRoutines, setCustomRoutines) {
  const reloadRoutines = useCallback(async () => {
    if (!user) return;
    const routines = await fetchUserRoutines(user.uid);
    setCustomRoutines(routines);
    dispatch({ type: 'SET_ROUTINE_PROGRAMS', payload: routinesToProgramData(routines) });
  }, [user, dispatch, setCustomRoutines]);

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

  return { customRoutines, reloadRoutines, saveRoutine, deleteRoutine, shareRoutine };
}
