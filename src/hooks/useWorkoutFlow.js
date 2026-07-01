import { useState, useCallback } from 'react';
import { parseRestTime } from '../utils/formatters';
import { computeSessionTotals } from '../utils/volumeCalculator';
import { computePRMap, detectSessionPRs } from '../utils/prs';
import { getPhases, getDays, getExercises } from '../utils/csvParser';

/** Determines whether the just-saved session completed the final day of a program. */
function isMesocycleComplete(programData, session) {
  if (!programData || !session) return false;
  const phases = getPhases(programData, session.program);
  if (phases.length === 0) return false;
  const lastPhase = phases[phases.length - 1];
  const days = getDays(programData, session.program, lastPhase);
  if (days.length === 0) return false;
  return session.phase === lastPhase && session.day === days[days.length - 1];
}

/**
 * Owns the in-workout editing handlers and the post-workout summary flow
 * (save → review stats/PRs/notes → finalize or chain into the next session).
 *
 * @param {object} ctx — the full useWorkout() context
 * @param {number} duration — live elapsed seconds for the active session
 * @param {Function} showToast
 */
export function useWorkoutFlow(ctx, duration, showToast) {
  const {
    programData, activeSession, restTimer, settings, workoutHistory,
    updateSetWeight, updateSetReps, completeSet, cancelSession, saveSession, setSessionNotes,
    startRestTimer, stopRestTimer, selectProgram, selectPhase, initSession, isPR,
  } = ctx;

  const [showSummary, setShowSummary] = useState(false);
  const [savedStats, setSavedStats] = useState(null);
  const [sessionNotes, setLocalNotes] = useState('');

  const handleUpdateSet = useCallback((exerciseId, setNumber, field, value) => {
    if (field === 'weight') updateSetWeight(exerciseId, setNumber, value);
    else if (field === 'repsCompleted') updateSetReps(exerciseId, setNumber, value);
  }, [updateSetWeight, updateSetReps]);

  const handleToggleSetComplete = useCallback((exerciseId, setNumber) => {
    const log = activeSession.logs.find((l) => l.exerciseId === exerciseId);
    if (!log) return;
    const setObj = log.sets.find((s) => s.setNumber === setNumber);
    if (!setObj) return;

    const willBeComplete = !setObj.isComplete;
    completeSet(exerciseId, setNumber);

    if (willBeComplete) {
      // Toast for new PR on this set
      const w = parseFloat(setObj.weight) || 0;
      if (w > 0 && isPR(log.exerciseName, w)) {
        showToast(`New PR — ${log.exerciseName} ${w} kg`, 'success', 3500);
      }

      startRestTimer(parseRestTime(log.rest), exerciseId);
      try {
        if (!settings?.silenceAll && settings?.hapticsEnabled && navigator.vibrate) navigator.vibrate(50);
      } catch (e) {
        console.warn('Haptic feedback error:', e);
      }
    } else if (restTimer.exerciseId === exerciseId && restTimer.isRunning) {
      stopRestTimer();
    }
  }, [activeSession, completeSet, isPR, showToast, startRestTimer, settings, restTimer, stopRestTimer]);

  const handleCancelWorkout = useCallback(() => {
    if (window.confirm('Discard this session? All logged sets will be lost.')) {
      cancelSession();
      stopRestTimer();
    }
  }, [cancelSession, stopRestTimer]);

  const handleSaveWorkout = useCallback(() => {
    const { completedSets, totalVolume } = computeSessionTotals(activeSession);
    const prs = detectSessionPRs(activeSession, computePRMap(workoutHistory, activeSession?.id));
    setSavedStats({
      day: activeSession?.day || '',
      program: activeSession?.program || '',
      duration,
      completedSets,
      totalVolume,
      isMesocycleComplete: isMesocycleComplete(programData, activeSession),
      prs,
    });
    setShowSummary(true);
  }, [activeSession, workoutHistory, duration, programData]);

  const handleFinalSave = useCallback(() => {
    if (activeSession && savedStats) {
      setSessionNotes(sessionNotes);
      saveSession(savedStats.duration);
    }
    setShowSummary(false);
    setSavedStats(null);
    setLocalNotes('');
  }, [activeSession, savedStats, sessionNotes, setSessionNotes, saveSession]);

  // Save current session then immediately start the next one.
  const handleStartNext = useCallback((nextSess) => {
    if (activeSession && savedStats) {
      setSessionNotes(sessionNotes);
      saveSession(savedStats.duration);
    }
    setShowSummary(false);
    setSavedStats(null);
    setLocalNotes('');

    if (nextSess && programData) {
      const exercises = getExercises(programData, nextSess.program, nextSess.phase, nextSess.day);
      // All three dispatches are batched by React 18 → one re-render.
      selectProgram(nextSess.program);
      selectPhase(nextSess.phase);
      initSession(nextSess.day, exercises);
    }
  }, [activeSession, savedStats, sessionNotes, saveSession, setSessionNotes, programData, selectProgram, selectPhase, initSession]);

  const handleEditSets = useCallback(() => {
    setShowSummary(false);
    setSavedStats(null);
  }, []);

  return {
    showSummary, savedStats, sessionNotes, setLocalNotes,
    handleUpdateSet, handleToggleSetComplete, handleCancelWorkout,
    handleSaveWorkout, handleFinalSave, handleStartNext, handleEditSets,
  };
}
