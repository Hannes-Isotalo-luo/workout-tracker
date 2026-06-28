import { useState, useRef, useCallback, lazy, Suspense } from 'react';
import { Dumbbell, AlertCircle } from 'lucide-react';
import { WorkoutProvider, useWorkout } from './context/WorkoutContext';
import { parseRestTime } from './utils/formatters';
import { computeSessionTotals } from './utils/volumeCalculator';
import { computePRMap, detectSessionPRs } from './utils/prs';
import { getPhases, getDays, getExercises } from './utils/csvParser';
import { useWorkoutDuration } from './hooks/useWorkoutDuration';
import { useSyncToast } from './hooks/useSyncToast';
import { useSharedRoutineDeepLink } from './hooks/useSharedRoutineDeepLink';
import { useBrowserHistory } from './hooks/useBrowserHistory';
import AppShell from './components/layout/AppShell';
import AuthLoading from './components/auth/AuthLoading';
import AuthGate from './components/auth/AuthGate';
import HomeView from './components/home/HomeView';
import WorkoutView from './components/workout/WorkoutView';
import WorkoutSummary from './components/workout/WorkoutSummary';
import SettingsModal from './components/settings/SettingsModal';
import Toast from './components/ui/Toast';
import Spinner from './components/ui/Spinner';

const RoutineBuilder = lazy(() => import('./components/builder/RoutineBuilder'));
const ProgressView = lazy(() => import('./components/progress/ProgressView'));

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

function MainAppContent() {
  const ctx = useWorkout();
  const {
    programData,
    isLoading,
    error,
    activeSession,
    currentView,
    restTimer,
    settings,
    workoutHistory,
    user,
    authLoading,
    syncStatus,
    clearSelection,
    initSession,
    updateSetWeight,
    updateSetReps,
    completeSet,
    addSet,
    removeSet,
    cancelSession,
    saveSession,
    setSessionNotes,
    setView,
    startRestTimer,
    stopRestTimer,
    modifyRestTimer,
    loginWithGoogle,
    saveRoutine,
    selectProgram,
    selectPhase,
  } = ctx;

  const duration = useWorkoutDuration(activeSession);

  // ── Toast ──
  const [toast, setToast] = useState(null);
  const toastTimer = useRef();
  const showToast = useCallback((message, tone = 'success', ms = 3000) => {
    clearTimeout(toastTimer.current);
    setToast({ message, tone });
    toastTimer.current = setTimeout(() => setToast(null), ms);
  }, []);

  useSyncToast({ syncStatus, user, historyLength: workoutHistory.length, showToast });
  useSharedRoutineDeepLink({ user, saveRoutine, setView, showToast });
  useBrowserHistory(ctx);

  // ── Local UI state ──
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [savedStats, setSavedStats] = useState(null);
  const [sessionNotes, setLocalNotes] = useState('');

  // ── Handlers ──
  const handleUpdateSet = (exerciseId, setNumber, field, value) => {
    if (field === 'weight') updateSetWeight(exerciseId, setNumber, value);
    else if (field === 'repsCompleted') updateSetReps(exerciseId, setNumber, value);
  };

  const handleToggleSetComplete = (exerciseId, setNumber) => {
    const log = activeSession.logs.find((l) => l.exerciseId === exerciseId);
    if (!log) return;
    const setObj = log.sets.find((s) => s.setNumber === setNumber);
    if (!setObj) return;

    const willBeComplete = !setObj.isComplete;
    completeSet(exerciseId, setNumber);

    if (willBeComplete) {
      // Toast for new PR on this set
      const w = parseFloat(setObj.weight) || 0;
      if (w > 0 && ctx.isPR(log.exerciseName, w)) {
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
  };

  const handleCancelWorkout = () => {
    if (window.confirm('Discard this session? All logged sets will be lost.')) {
      cancelSession();
      stopRestTimer();
    }
  };

  const handleSaveWorkout = () => {
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
  };

  const handleFinalSave = () => {
    if (activeSession && savedStats) {
      setSessionNotes(sessionNotes);
      saveSession(savedStats.duration);
    }
    setShowSummary(false);
    setSavedStats(null);
    setLocalNotes('');
  };

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

  const handleEditSets = () => {
    setShowSummary(false);
    setSavedStats(null);
  };

  // ── Gating screens ──
  if (authLoading) return <AuthLoading />;
  if (!user) return <AuthGate onLogin={loginWithGoogle} />;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
        <Dumbbell className="w-10 h-10 text-accent animate-spin mb-4" />
        <h3 className="text-lg font-bold text-slate-200">Parsing Workout Program...</h3>
        <p className="text-xs text-slate-500 mt-1">Caching split days from local CSV file.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
        <AlertCircle className="w-10 h-10 text-rose-500 mb-4" />
        <h3 className="text-lg font-bold text-slate-200">Error Parsing File</h3>
        <p className="text-xs text-rose-400 mt-1">{error}</p>
        <button onClick={clearSelection} className="mt-6 px-4 py-2 bg-slate-800 text-slate-300 border border-slate-700 rounded-xl font-bold text-xs">
          Reset Setup
        </button>
      </div>
    );
  }

  const mappedRestTimer = {
    active: restTimer.isRunning,
    secondsRemaining: restTimer.seconds,
    exerciseName: restTimer.exerciseId && activeSession
      ? activeSession.logs.find((l) => l.exerciseId === restTimer.exerciseId)?.exerciseName || ''
      : '',
  };

  const isProgress = currentView === 'progress';

  return (
    <>
      <AppShell onOpenSettings={() => setIsSettingsOpen(true)}>
        <Suspense
          fallback={
            <div className="flex justify-center py-16">
              <Spinner variant="brand" className="w-10 h-10 text-accent" />
            </div>
          }
        >
          {currentView === 'workout' ? (
            <WorkoutView
              session={activeSession}
              duration={duration}
              onUpdateSet={handleUpdateSet}
              onToggleSetComplete={handleToggleSetComplete}
              onAddSet={addSet}
              onRemoveSet={removeSet}
              onSave={handleSaveWorkout}
              onCancel={handleCancelWorkout}
              activeRestTimer={mappedRestTimer}
              onModifyRestTimer={modifyRestTimer}
              onDismissRestTimer={stopRestTimer}
            />
          ) : currentView === 'builder' ? (
            <RoutineBuilder />
          ) : isProgress ? (
            <ProgressView />
          ) : (
            <HomeView />
          )}
        </Suspense>
      </AppShell>

      <Toast message={toast?.message} tone={toast?.tone} />

      {showSummary && savedStats && (
        <WorkoutSummary
          stats={savedStats}
          notes={sessionNotes}
          onNotesChange={setLocalNotes}
          onEditSets={handleEditSets}
          onSave={handleFinalSave}
          onStartNext={handleStartNext}
        />
      )}

      {isSettingsOpen && <SettingsModal onClose={() => setIsSettingsOpen(false)} showToast={showToast} />}
    </>
  );
}

export default function App() {
  return (
    <WorkoutProvider>
      <div className="bg-slate-900 text-slate-100 min-h-screen flex flex-col font-sans">
        <MainAppContent />
      </div>
    </WorkoutProvider>
  );
}
