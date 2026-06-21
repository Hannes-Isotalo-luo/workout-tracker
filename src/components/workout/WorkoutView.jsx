import React, { useState, useEffect, useMemo } from 'react';
import { Clock, Award, AlertCircle } from 'lucide-react';
import { useWorkout } from '../../context/WorkoutContext';
import { getExercises } from '../../utils/csvParser';
import { formatTime } from '../../utils/formatters';
import ExerciseCard from './ExerciseCard';
import RestTimer from './RestTimer';
import PlateCalculatorModal from '../ui/PlateCalculatorModal';
import ExerciseSwapModal from '../ui/ExerciseSwapModal';

/**
 * Active workout screen — session dashboard, the exercise list, save/discard
 * actions, the floating rest timer, and the plate/swap tool modals.
 */
export default function WorkoutView({
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
  onDismissRestTimer,
}) {
  const { isPR, swapExercise, programData, workoutHistory } = useWorkout();

  const [plateModal, setPlateModal] = useState(null); // { name, weight }
  const [swapModal, setSwapModal] = useState(null); // { exerciseId, name }

  // Pool of known exercise names (program library + history) for the swap picker.
  const exercisePool = useMemo(() => {
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
    (workoutHistory || []).forEach((s) => s.logs?.forEach((l) => l.exerciseName && names.add(l.exerciseName)));
    return Array.from(names);
  }, [programData, workoutHistory]);

  const [expandedNotes, setExpandedNotes] = useState({});
  useEffect(() => {
    if (session?.logs) {
      const initial = {};
      session.logs.forEach((log) => {
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
        <p className="text-sm text-slate-400 mt-2 max-w-xs">Please select a program day to begin.</p>
      </div>
    );
  }

  let totalSets = 0;
  let completedSets = 0;
  session.logs.forEach((log) =>
    log.sets.forEach((set) => {
      totalSets++;
      if (set.isComplete) completedSets++;
    })
  );
  const progressPercent = totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0;

  const toggleNotes = (exerciseId) => setExpandedNotes((prev) => ({ ...prev, [exerciseId]: !prev[exerciseId] }));

  return (
    <div className="space-y-6 bg-slate-900 text-slate-100 min-h-screen pb-24">
      {/* Session dashboard */}
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
          <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
            <Clock className="w-4 h-4 text-violet-400 animate-pulse" />
            <span className="text-sm font-mono font-bold text-violet-400">{formatTime(duration)}</span>
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400">
            <span>WORKOUT PROGRESS</span>
            <span className="text-violet-400 font-extrabold">
              {progressPercent}% ({completedSets}/{totalSets} Sets)
            </span>
          </div>
          <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
            <div
              className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Exercises */}
      <div className="space-y-4">
        {session.logs.map((exercise, exIndex) => (
          <ExerciseCard
            key={exercise.exerciseId}
            exercise={exercise}
            exIndex={exIndex}
            isNotesExpanded={!!expandedNotes[exercise.exerciseId]}
            onToggleNotes={toggleNotes}
            onUpdateSet={onUpdateSet}
            onToggleSetComplete={onToggleSetComplete}
            onAddSet={onAddSet}
            onRemoveSet={onRemoveSet}
            isPR={isPR}
            onOpenPlate={setPlateModal}
            onOpenSwap={setSwapModal}
          />
        ))}
      </div>

      {/* Bottom actions */}
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

      <RestTimer timer={activeRestTimer} onModify={onModifyRestTimer} onDismiss={onDismissRestTimer} />

      {plateModal && (
        <PlateCalculatorModal
          exerciseName={plateModal.name}
          initialWeight={plateModal.weight}
          onClose={() => setPlateModal(null)}
        />
      )}

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
