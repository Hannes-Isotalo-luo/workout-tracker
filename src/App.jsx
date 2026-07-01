import { useState, useRef, useCallback, lazy, Suspense } from 'react';
import { Dumbbell, AlertCircle } from 'lucide-react';
import { WorkoutProvider, useWorkout } from './context/WorkoutContext';
import { useWorkoutDuration } from './hooks/useWorkoutDuration';
import { useSyncToast } from './hooks/useSyncToast';
import { useSharedRoutineDeepLink } from './hooks/useSharedRoutineDeepLink';
import { useBrowserHistory } from './hooks/useBrowserHistory';
import { useWorkoutFlow } from './hooks/useWorkoutFlow';
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

function MainAppContent() {
  const ctx = useWorkout();
  const {
    isLoading, error, activeSession, currentView, restTimer,
    user, authLoading, clearSelection, addSet, removeSet, setView,
    modifyRestTimer, stopRestTimer, loginWithGoogle, saveRoutine,
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

  useSyncToast({ syncStatus: ctx.syncStatus, user, historyLength: ctx.workoutHistory.length, showToast });
  useSharedRoutineDeepLink({ user, saveRoutine, setView, showToast });
  useBrowserHistory(ctx);

  const {
    showSummary, savedStats, sessionNotes, setLocalNotes,
    handleUpdateSet, handleToggleSetComplete, handleCancelWorkout,
    handleSaveWorkout, handleFinalSave, handleStartNext, handleEditSets,
  } = useWorkoutFlow(ctx, duration, showToast);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

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
