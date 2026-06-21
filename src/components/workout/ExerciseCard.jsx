import {
  ChevronDown,
  ChevronUp,
  Plus,
  Minus,
  Flame,
  TrendingUp,
  Repeat,
  Layers,
  History as HistoryIcon,
} from 'lucide-react';
import SetInput from './SetInput';
import { toSentenceCase } from '../../utils/formatters';

/**
 * A single exercise within the active workout: header, badges, "last time"
 * reference, optional form notes, the set rows, and add/remove controls.
 */
export default function ExerciseCard({
  exercise,
  exIndex,
  isNotesExpanded,
  onToggleNotes,
  onUpdateSet,
  onToggleSetComplete,
  onAddSet,
  onRemoveSet,
  isPR,
  onOpenPlate,
  onOpenSwap,
}) {
  const completedCount = exercise.sets.filter((s) => s.isComplete).length;

  // "Last time" reference + auto-progression hint.
  const prevSummary = exercise.sets
    .map((s) => (s.previousWeight !== '' && s.previousWeight != null ? `${s.previousWeight}×${s.previousReps || '?'}` : null))
    .filter(Boolean);
  const hasPrev = prevSummary.length > 0;
  const firstSet = exercise.sets[0];
  const autoProgressed =
    !!firstSet &&
    firstSet.previousWeight !== '' &&
    firstSet.previousWeight != null &&
    !isNaN(parseFloat(firstSet.weight)) &&
    !isNaN(parseFloat(firstSet.previousWeight)) &&
    parseFloat(firstSet.weight) > parseFloat(firstSet.previousWeight);

  const plateSeedWeight = (firstSet && firstSet.weight) || (firstSet && firstSet.previousWeight) || '';

  return (
    <div
      className={`glass-card p-4 transition-all duration-300 ${
        completedCount === exercise.sets.length
          ? 'border-emerald-500/30 shadow-md shadow-emerald-500/5 bg-slate-800/40'
          : 'hover:border-slate-600'
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1 flex-1">
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <span className="text-violet-400 text-sm font-extrabold font-mono">
              {(exIndex + 1).toString().padStart(2, '0')}
            </span>
            {exercise.exerciseName}
          </h3>

          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-xs font-bold bg-violet-500/10 text-violet-400 px-2 py-0.5 rounded-full border border-violet-500/15">
              {exercise.targetSets} Sets
            </span>
            <span className="text-xs font-bold bg-fuchsia-500/10 text-fuchsia-400 px-2 py-0.5 rounded-full border border-fuchsia-500/15">
              {exercise.targetReps} Reps
            </span>
            <span className="rpe-badge-prominent">RPE {exercise.rpe}</span>
            <span className="text-xs font-bold bg-cyan-500/10 text-cyan-400 px-2 py-0.5 rounded-full border border-cyan-500/15">
              ⏱ {exercise.rest}
            </span>
          </div>
        </div>

        {/* Per-exercise actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => onOpenSwap({ exerciseId: exercise.exerciseId, name: exercise.exerciseName })}
            className="w-10 h-10 flex items-center justify-center bg-slate-800 hover:bg-violet-900/40 text-slate-400 hover:text-violet-300 rounded-xl transition-colors border border-slate-700 hover:border-violet-500/40"
            aria-label="Swap exercise"
            title="Swap exercise"
          >
            <Repeat className="w-4 h-4" />
          </button>
          <button
            onClick={() => onOpenPlate({ name: exercise.exerciseName, weight: plateSeedWeight })}
            className="w-10 h-10 flex items-center justify-center bg-slate-800 hover:bg-cyan-900/40 text-slate-400 hover:text-cyan-300 rounded-xl transition-colors border border-slate-700 hover:border-cyan-500/40"
            aria-label="Plate calculator"
            title="Plate calculator"
          >
            <Layers className="w-4 h-4" />
          </button>
          {exercise.notes && (
            <button
              onClick={() => onToggleNotes(exercise.exerciseId)}
              className="w-10 h-10 flex items-center justify-center bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-100 rounded-xl transition-colors border border-slate-700"
              aria-label="Toggle exercise info"
            >
              {isNotesExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      {/* "Last time" reference */}
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

      {/* Form notes */}
      {exercise.notes && isNotesExpanded && (
        <div className="mt-3 p-3 rounded-xl bg-slate-900/50 border border-slate-800 text-xs text-slate-400 leading-relaxed flex items-start gap-2 animate-fadeIn">
          <Flame className="w-4 h-4 text-violet-400 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-slate-300 block mb-0.5">FORM INSTRUCTIONS</span>
            {toSentenceCase(exercise.notes)}
          </div>
        </div>
      )}

      {/* Sets */}
      <div className="mt-4 space-y-2">
        <div className="flex items-center gap-2 sm:gap-3 px-3 text-xs font-black uppercase text-slate-500 tracking-wider">
          <span className="w-10 text-center">SET</span>
          <span className="flex-1 text-center">KG</span>
          <span className="flex-1 text-center">REPS</span>
          <span className="w-10 text-center">STATE</span>
        </div>

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

      {/* Add / remove set */}
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
}
