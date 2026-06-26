import React, { useState, useEffect, useMemo } from 'react';
import { Award, AlertCircle, Trash2 } from 'lucide-react';
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
      <div className="flex flex-col items-center justify-center p-8 text-center bg-canvas min-h-[50vh]">
        <AlertCircle className="w-12 h-12 text-[#5b6678] mb-4 animate-pulse" />
        <h3 className="text-lg font-bold text-[#f8fafc]">No Active Session</h3>
        <p className="text-sm text-[#8b96a8] mt-2 max-w-xs">Please select a program day to begin.</p>
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
    <div className="space-y-6 bg-canvas text-[#f8fafc] min-h-screen pb-24">
      {/* Session dashboard — breathes on background, no card wrapper */}
      <div className="px-[18px] pt-4 pb-2">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-[#f8fafc]" style={{ letterSpacing: '-0.02em' }}>
              {session.day}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs font-bold bg-surf-chip px-2 py-0.5 rounded text-[#8b96a8]">
                {session.program}
              </span>
              <span className="text-xs font-bold bg-surf-chip px-2 py-0.5 rounded text-[#8b96a8]">
                {session.phase}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 bg-surf px-3 py-1.5 rounded-xl border border-line-c">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            <span className="text-sm font-mono font-bold text-accent">{formatTime(duration)}</span>
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-[#8b96a8]">
            <span>WORKOUT PROGRESS</span>
            <span className="text-accent font-extrabold">
              {progressPercent}% ({completedSets}/{totalSets} Sets)
            </span>
          </div>
          <div className="w-full h-1.5 bg-line-sub rounded-full overflow-hidden">
            <div
              className="h-full bg-accent transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Exercises */}
      <div className="space-y-[14px] px-[18px]">
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

      {/* Finish action */}
      <div className="mt-8 px-[18px]">
        <button
          type="button"
          onClick={onSave}
          disabled={completedSets === 0}
          className="w-full py-4 px-6 rounded-[15px] font-bold text-[15px] tracking-wide flex items-center justify-center gap-2 shadow-[0_8px_20px_rgba(109,92,240,0.28)] transition-all duration-300 active:scale-[0.97] bg-accent hover:bg-accent/90 text-white disabled:opacity-40 disabled:pointer-events-none"
        >
          <Award className="w-5 h-5" />
          FINISH WORKOUT
        </button>
      </div>

      {/* Discard — separated visually and requires confirm (in onCancel handler) */}
      <div className="flex justify-center pb-8 px-[18px]">
        <button
          type="button"
          onClick={onCancel}
          className="flex items-center gap-1.5 px-5 py-2.5 min-h-[44px] text-[12px] font-bold text-[#5b6678] hover:text-rose-400 border border-line-sub hover:border-rose-900/50 hover:bg-rose-950/10 rounded-[11px] transition-all duration-200"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Discard session
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
