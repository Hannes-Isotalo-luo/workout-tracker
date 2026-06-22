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
  const allDone = completedCount === exercise.sets.length && exercise.sets.length > 0;

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
      className={`p-[18px] rounded-[18px] border transition-all duration-300 ${
        allDone
          ? 'bg-surf-ok border-line-ok'
          : 'bg-surf border-line-c'
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1 flex-1">
          <h3 className="text-[18px] font-bold text-[#f8fafc] flex items-center gap-2" style={{ letterSpacing: '-0.01em' }}>
            <span className="text-accent text-sm font-extrabold font-mono">
              {(exIndex + 1).toString().padStart(2, '0')}
            </span>
            {exercise.exerciseName}
          </h3>

          {/* Single metadata line per design spec */}
          <p className="text-[13px] text-[#8b96a8] font-medium">
            {exercise.targetSets} × {exercise.targetReps} reps
            {exercise.rpe ? ` · RPE ${exercise.rpe}` : ''}
            {exercise.rest ? ` · rest ${exercise.rest}` : ''}
          </p>
        </div>

        {/* Per-exercise actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => onOpenSwap({ exerciseId: exercise.exerciseId, name: exercise.exerciseName })}
            className="w-10 h-10 flex items-center justify-center bg-surf-chip hover:bg-surf-hi text-[#8b96a8] hover:text-[#d3dae4] rounded-[9px] transition-colors border border-line-c"
            aria-label="Swap exercise"
            title="Swap exercise"
          >
            <Repeat className="w-4 h-4" />
          </button>
          <button
            onClick={() => onOpenPlate({ name: exercise.exerciseName, weight: plateSeedWeight })}
            className="w-10 h-10 flex items-center justify-center bg-surf-chip hover:bg-surf-hi text-[#8b96a8] hover:text-[#d3dae4] rounded-[9px] transition-colors border border-line-c"
            aria-label="Plate calculator"
            title="Plate calculator"
          >
            <Layers className="w-4 h-4" />
          </button>
          {exercise.notes && (
            <button
              onClick={() => onToggleNotes(exercise.exerciseId)}
              className="w-10 h-10 flex items-center justify-center bg-surf-chip hover:bg-surf-hi text-[#8b96a8] hover:text-[#d3dae4] rounded-[9px] transition-colors border border-line-c"
              aria-label="Toggle exercise info"
            >
              {isNotesExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      {/* "Last time" reference */}
      {hasPrev && (
        <div className="mt-2.5 flex items-center gap-2 text-[11px] font-bold text-[#5b6678] flex-wrap">
          <HistoryIcon className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="uppercase tracking-wider">Last:</span>
          <span className="text-[#8b96a8]">{prevSummary.join(' · ')}</span>
          {autoProgressed && (
            <span className="flex items-center gap-0.5 text-gain-t bg-gain/10 border border-gain/20 px-1.5 py-0.5 rounded-full">
              <TrendingUp className="w-3 h-3" /> auto +2.5kg
            </span>
          )}
        </div>
      )}

      {/* Form notes */}
      {exercise.notes && isNotesExpanded && (
        <div className="mt-3 p-3 rounded-[11px] bg-canvas border border-line-sub text-xs text-[#8b96a8] leading-relaxed flex items-start gap-2 animate-fadeIn">
          <Flame className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-[#d3dae4] block mb-0.5">FORM INSTRUCTIONS</span>
            {toSentenceCase(exercise.notes)}
          </div>
        </div>
      )}

      {/* Sets */}
      <div className="mt-4 space-y-2">
        <div className="flex items-center gap-2 sm:gap-3 px-3 text-[11px] font-bold uppercase text-[#5b6678] tracking-widest">
          <span className="w-10 text-center">SET</span>
          <span className="flex-1 text-center">KG</span>
          <span className="flex-1 text-center">REPS</span>
          <span className="w-10 text-center">✓</span>
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
      <div className="mt-3.5 flex items-center justify-end gap-2 border-t border-line-sub pt-3">
        <button
          type="button"
          onClick={() => onRemoveSet(exercise.exerciseId)}
          disabled={exercise.sets.length <= 1}
          className="flex items-center justify-center gap-1.5 text-xs font-bold text-[#5b6678] hover:text-rose-400 bg-canvas hover:bg-rose-950/20 border border-line-sub hover:border-rose-900/50 px-3 py-2.5 min-h-[44px] min-w-[44px] rounded-[11px] transition-all duration-200 disabled:opacity-30 disabled:pointer-events-none"
        >
          <Minus className="w-3.5 h-3.5" />
          REMOVE SET
        </button>
        <button
          type="button"
          onClick={() => onAddSet(exercise.exerciseId)}
          className="flex items-center justify-center gap-1.5 text-xs font-bold text-[#8b96a8] hover:text-accent bg-canvas hover:bg-accent/10 border border-line-sub hover:border-accent/30 px-3 py-2.5 min-h-[44px] min-w-[44px] rounded-[11px] transition-all duration-200"
        >
          <Plus className="w-3.5 h-3.5" />
          ADD SET
        </button>
      </div>
    </div>
  );
}
