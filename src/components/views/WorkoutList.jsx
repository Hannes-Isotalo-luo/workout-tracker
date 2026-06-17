import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Clock, 
  Flame, 
  Dumbbell, 
  ChevronDown, 
  ChevronUp, 
  Plus, 
  Minus, 
  Check, 
  Award, 
  X, 
  Sparkles,
  HelpCircle,
  TrendingUp,
  AlertCircle,
  Repeat,
  Layers,
  History as HistoryIcon
} from 'lucide-react';
import SetInput from '../ui/SetInput';
import { useWorkout } from '../../context/WorkoutContext';
import PlateCalculatorModal from '../ui/PlateCalculatorModal';
import ExerciseSwapModal from '../ui/ExerciseSwapModal';
import { getExercises } from '../../utils/csvParser';

/**
 * Helper to format notes to sentence case
 */
const toSentenceCase = (str) => {
  if (!str) return '';
  return str
    .toLowerCase()
    .replace(/(^\s*|[.!?]\s+)([a-z])/g, (m, p1, p2) => p1 + p2.toUpperCase());
};

/**
 * Helper to format seconds into MM:SS
 */
const formatTime = (totalSeconds) => {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Core WorkoutList View Component
 */
export function WorkoutList({
  session,
  duration,
  onUpdateSet,
  onToggleSetComplete,
  onAddSet,
  onRemoveSet,
  onSave,
  onCancel,
  activeRestTimer,
  onModifyRestTimer,
  onDismissRestTimer
}) {
  const { prs, isPR, swapExercise, programData, workoutHistory } = useWorkout();

  // Modal state for per-exercise tools
  const [plateModal, setPlateModal] = useState(null); // { name, weight }
  const [swapModal, setSwapModal] = useState(null);    // { exerciseId, name }

  // Pool of all known exercise names (program library + anything in history),
  // used to populate the swap picker.
  const exercisePool = React.useMemo(() => {
    const names = new Set();
    if (programData) {
      Object.keys(programData).forEach((prog) =>
        Object.keys(programData[prog]).forEach((phase) =>
          Object.keys(programData[prog][phase]).forEach((day) =>
            getExercises(programData, prog, phase, day).forEach((ex) => names.add(ex.exercise))
          )
        )
      );
    }
    (workoutHistory || []).forEach((s) =>
      s.logs?.forEach((l) => l.exerciseName && names.add(l.exerciseName))
    );
    return Array.from(names);
  }, [programData, workoutHistory]);

  const [expandedNotes, setExpandedNotes] = useState(() => {
    const initial = {};
    if (session && session.logs) {
      session.logs.forEach(log => {
        initial[log.exerciseId] = true;
      });
    }
    return initial;
  });

  useEffect(() => {
    if (session && session.logs) {
      const initial = {};
      session.logs.forEach(log => {
        initial[log.exerciseId] = true;
      });
      setExpandedNotes(initial);
    }
  }, [session?.id]);

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center bg-slate-900 min-h-[50vh]">
        <AlertCircle className="w-12 h-12 text-slate-500 mb-4 animate-pulse" />
        <h3 className="text-lg font-bold text-slate-200">No Active Session</h3>
        <p className="text-sm text-slate-400 mt-2 max-w-xs">
          Please select a program day or launch the demo component.
        </p>
      </div>
    );
  }

  // Calculate Progress Stats
  let totalSets = 0;
  let completedSets = 0;

  session.logs.forEach(log => {
    log.sets.forEach(set => {
      totalSets++;
      if (set.isComplete) {
        completedSets++;
      }
    });
  });

  const progressPercent = totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0;

  const toggleNotes = (exerciseId) => {
    setExpandedNotes(prev => ({
      ...prev,
      [exerciseId]: !prev[exerciseId]
    }));
  };

  return (
    <div className="space-y-6 bg-slate-900 text-slate-100 min-h-screen pb-24">
      {/* ─── Session Active Dashboard ─── */}
      <div className="glass-card p-4 border-slate-800 bg-slate-900/90 backdrop-blur-xl shadow-lg shadow-slate-950/40">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400">
              {session.day}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs font-bold bg-slate-800 px-2 py-0.5 rounded text-slate-400 border border-slate-800">
                {session.program}
              </span>
              <span className="text-xs font-bold bg-slate-800 px-2 py-0.5 rounded text-slate-400 border border-slate-800">
                {session.phase}
              </span>
            </div>
          </div>

          {/* Real-time Timer display */}
          <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
            <Clock className="w-4 h-4 text-violet-400 animate-pulse" />
            <span className="text-sm font-mono font-bold text-violet-400">
              {formatTime(duration)}
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400">
            <span>WORKOUT PROGRESS</span>
            <span className="text-violet-400 font-extrabold">{progressPercent}% ({completedSets}/{totalSets} Sets)</span>
          </div>
          <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
            <div 
              className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* ─── Exercises List ─── */}
      <div className="space-y-4">
        {session.logs.map((exercise, exIndex) => {
          const isNotesExpanded = !!expandedNotes[exercise.exerciseId];
          const completedCount = exercise.sets.filter(s => s.isComplete).length;

          // ── "Last time" reference + auto-progression hint (Feature 1) ──
          const prevSummary = exercise.sets
            .map(s => (s.previousWeight !== '' && s.previousWeight != null)
              ? `${s.previousWeight}×${s.previousReps || '?'}`
              : null)
            .filter(Boolean);
          const hasPrev = prevSummary.length > 0;
          const firstSet = exercise.sets[0];
          const autoProgressed = !!firstSet
            && firstSet.previousWeight !== '' && firstSet.previousWeight != null
            && !isNaN(parseFloat(firstSet.weight))
            && !isNaN(parseFloat(firstSet.previousWeight))
            && parseFloat(firstSet.weight) > parseFloat(firstSet.previousWeight);

          // Suggest a starting weight for the plate calculator
          const plateSeedWeight = (firstSet && firstSet.weight) || (firstSet && firstSet.previousWeight) || '';

          return (
            <div 
              key={exercise.exerciseId} 
              className={`glass-card p-4 transition-all duration-300 ${
                completedCount === exercise.sets.length 
                  ? 'border-emerald-500/30 shadow-md shadow-emerald-500/5 bg-slate-800/40' 
                  : 'hover:border-slate-600'
              }`}
            >
              {/* Exercise Card Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1 flex-1">
                  <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                    <span className="text-violet-400 text-sm font-extrabold font-mono">
                      {(exIndex + 1).toString().padStart(2, '0')}
                    </span>
                    {exercise.exerciseName}
                  </h3>

                  {/* Badges Bar */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-xs font-bold bg-violet-500/10 text-violet-400 px-2 py-0.5 rounded-full border border-violet-500/15">
                      {exercise.targetSets} Sets
                    </span>
                    <span className="text-xs font-bold bg-fuchsia-500/10 text-fuchsia-400 px-2 py-0.5 rounded-full border border-fuchsia-500/15">
                      {exercise.targetReps} Reps
                    </span>
                    <span className="rpe-badge-prominent">
                      RPE {exercise.rpe}
                    </span>
                    <span className="text-xs font-bold bg-cyan-500/10 text-cyan-400 px-2 py-0.5 rounded-full border border-cyan-500/15">
                      ⏱ {exercise.rest}
                    </span>
                  </div>
                </div>

                {/* Per-exercise action buttons */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => setSwapModal({ exerciseId: exercise.exerciseId, name: exercise.exerciseName })}
                    className="w-10 h-10 flex items-center justify-center bg-slate-800 hover:bg-violet-900/40 text-slate-400 hover:text-violet-300 rounded-xl transition-colors border border-slate-700 hover:border-violet-500/40"
                    aria-label="Swap exercise"
                    title="Swap exercise"
                  >
                    <Repeat className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setPlateModal({ name: exercise.exerciseName, weight: plateSeedWeight })}
                    className="w-10 h-10 flex items-center justify-center bg-slate-800 hover:bg-cyan-900/40 text-slate-400 hover:text-cyan-300 rounded-xl transition-colors border border-slate-700 hover:border-cyan-500/40"
                    aria-label="Plate calculator"
                    title="Plate calculator"
                  >
                    <Layers className="w-4 h-4" />
                  </button>
                  {exercise.notes && (
                    <button
                      onClick={() => toggleNotes(exercise.exerciseId)}
                      className="w-10 h-10 flex items-center justify-center bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-100 rounded-xl transition-colors border border-slate-700"
                      aria-label="Toggle exercise info"
                    >
                      {isNotesExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  )}
                </div>
              </div>

              {/* ── "Last time" reference line (Feature 1) ── */}
              {hasPrev && (
                <div className="mt-2.5 flex items-center gap-2 text-[11px] font-bold text-slate-500 flex-wrap">
                  <HistoryIcon className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />
                  <span className="text-slate-600 uppercase tracking-wider">Last:</span>
                  <span className="text-slate-400">{prevSummary.join(' · ')}</span>
                  {autoProgressed && (
                    <span className="flex items-center gap-0.5 text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded-full">
                      <TrendingUp className="w-3 h-3" /> auto +2.5kg
                    </span>
                  )}
                </div>
              )}

              {/* Form Notes Accordion */}
              {exercise.notes && isNotesExpanded && (
                <div className="mt-3 p-3 rounded-xl bg-slate-900/50 border border-slate-800 text-xs text-slate-400 leading-relaxed flex items-start gap-2 animate-fadeIn">
                  <Flame className="w-4 h-4 text-violet-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-300 block mb-0.5">FORM INSTRUCTIONS</span>
                    {toSentenceCase(exercise.notes)}
                  </div>
                </div>
              )}

              {/* Workout Sets Table */}
              <div className="mt-4 space-y-2">
                {/* Column Headers */}
                <div className="flex items-center gap-2 sm:gap-3 px-3 text-xs font-black uppercase text-slate-500 tracking-wider">
                  <span className="w-10 text-center">SET</span>
                  <span className="flex-1 text-center">KG</span>
                  <span className="flex-1 text-center">REPS</span>
                  <span className="w-10 text-center">STATE</span>
                </div>

                {/* SetInput list */}
                {exercise.sets.map((set) => {
                  const isSetPR = set.isComplete && isPR && isPR(exercise.exerciseName, set.weight);
                  return (
                    <SetInput
                      key={`${exercise.exerciseId}-set-${set.setNumber}`}
                      setNumber={set.setNumber}
                      weight={set.weight}
                      repsCompleted={set.repsCompleted}
                      isComplete={set.isComplete}
                      previousWeight={set.previousWeight}
                      previousReps={set.previousReps}
                      isPR={isSetPR}
                      onWeightChange={(val) => onUpdateSet(exercise.exerciseId, set.setNumber, 'weight', val)}
                      onRepsChange={(val) => onUpdateSet(exercise.exerciseId, set.setNumber, 'repsCompleted', val)}
                      onToggleComplete={() => onToggleSetComplete(exercise.exerciseId, set.setNumber)}
                    />
                  );
                })}
              </div>

              {/* Add & Remove Set Actions */}
              <div className="mt-3.5 flex items-center justify-end gap-2 border-t border-slate-800/60 pt-3">
                <button
                  type="button"
                  onClick={() => onRemoveSet(exercise.exerciseId)}
                  disabled={exercise.sets.length <= 1}
                  className="flex items-center justify-center gap-1.5 text-xs font-bold text-slate-500 hover:text-rose-400 bg-slate-900/40 hover:bg-rose-950/20 border border-slate-800 hover:border-rose-900/50 px-3 py-2.5 min-h-[44px] min-w-[44px] rounded-xl transition-all duration-200 disabled:opacity-30 disabled:pointer-events-none"
                >
                  <Minus className="w-3.5 h-3.5" />
                  REMOVE SET
                </button>
                <button
                  type="button"
                  onClick={() => onAddSet(exercise.exerciseId)}
                  className="flex items-center justify-center gap-1.5 text-xs font-bold text-slate-400 hover:text-violet-400 bg-slate-900/40 hover:bg-violet-950/20 border border-slate-800 hover:border-violet-900/50 px-3 py-2.5 min-h-[44px] min-w-[44px] rounded-xl transition-all duration-200"
                >
                  <Plus className="w-3.5 h-3.5" />
                  ADD SET
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ─── Bottom Actions Block ─── */}
      <div className="flex flex-col gap-3 mt-8">
        <button
          type="button"
          onClick={onSave}
          disabled={completedSets === 0}
          className="w-full py-4 px-6 rounded-2xl font-bold tracking-wide flex items-center justify-center gap-2 shadow-lg shadow-violet-500/10 transition-all duration-300 transform active:scale-[0.98] bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white disabled:opacity-40 disabled:pointer-events-none"
        >
          <Award className="w-5 h-5" />
          SAVE WORKOUT LOG
        </button>

        <button
          type="button"
          onClick={onCancel}
          className="w-full py-3.5 px-6 rounded-2xl font-bold text-slate-400 hover:text-slate-200 bg-transparent border border-slate-800 hover:border-slate-700 transition-all duration-200"
        >
          DISCARD CURRENT WORKOUT
        </button>
      </div>

      {/* ─── Floating Rest Timer Alert Indicator ─── */}
      {activeRestTimer && activeRestTimer.active && (
        <div className="fixed bottom-24 left-4 right-4 z-50 glass-card p-3 border-cyan-500/40 bg-slate-950/95 shadow-xl shadow-cyan-950/20 flex items-center justify-between animate-slideUp">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center">
              <Clock className="w-4 h-4 text-cyan-400 animate-spin" style={{ animationDuration: '4s' }} />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-500 block leading-tight">RESTING ({activeRestTimer.exerciseName})</span>
              <span className="text-xs font-semibold text-slate-400">Prepare for next set</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onModifyRestTimer && (
              <div className="flex gap-1.5 mr-1">
                <button
                  type="button"
                  onClick={() => onModifyRestTimer(-30)}
                  className="bg-slate-900/80 hover:bg-slate-800 border border-slate-700/60 hover:border-cyan-500/40 text-cyan-400 font-mono text-xs font-bold min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl transition-all transform active:scale-95"
                >
                  -30s
                </button>
                <button
                  type="button"
                  onClick={() => onModifyRestTimer(30)}
                  className="bg-slate-900/80 hover:bg-slate-800 border border-slate-700/60 hover:border-cyan-500/40 text-cyan-400 font-mono text-xs font-bold min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl transition-all transform active:scale-95"
                >
                  +30s
                </button>
              </div>
            )}
            <span className="text-lg font-mono font-extrabold text-cyan-400 bg-cyan-950/60 px-3 py-1 rounded-xl border border-cyan-900/40 mr-1">
              {formatTime(activeRestTimer.secondsRemaining)}
            </span>
            {onDismissRestTimer && (
              <button
                type="button"
                onClick={onDismissRestTimer}
                className="w-11 h-11 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-700/60 hover:border-rose-500/40 text-slate-400 hover:text-rose-400 flex items-center justify-center transition-all transform active:scale-95 flex-shrink-0"
                title="Dismiss Timer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* ─── Plate Calculator Modal ─── */}
      {plateModal && (
        <PlateCalculatorModal
          exerciseName={plateModal.name}
          initialWeight={plateModal.weight}
          onClose={() => setPlateModal(null)}
        />
      )}

      {/* ─── Exercise Swap Modal ─── */}
      {swapModal && (
        <ExerciseSwapModal
          exerciseName={swapModal.name}
          exercisePool={exercisePool}
          onSwap={(newName) => {
            swapExercise(swapModal.exerciseId, newName);
            setSwapModal(null);
          }}
          onClose={() => setSwapModal(null)}
        />
      )}

    </div>
  );
}
