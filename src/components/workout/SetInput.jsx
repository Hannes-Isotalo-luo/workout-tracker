import React from 'react';
import { Check, Trophy } from 'lucide-react';
import { epley1RM } from '../../utils/volumeCalculator';

/**
 * SetInput - A single workout set logging row.
 * States: active (violet left-border), complete (green left-border + locked inputs).
 *
 * PR treatment: no layout-shifting row. When the set is a PR, the checkmark
 * becomes a trophy icon with peak (amber) accent — height unchanged.
 * The e1RM estimate is shown in the SET column below the set number so it
 * fits within existing row height.
 */
function SetInput({
  setNumber,
  weight,
  repsCompleted,
  isComplete,
  onWeightChange,
  onRepsChange,
  onToggleComplete,
  previousWeight = '',
  previousReps = '',
  placeholderWeight = '—',
  placeholderReps = '—',
  disabled = false,
  isPR = false
}) {
  const handleWeightChange = (e) => {
    let value = e.target.value;
    value = value.replace(',', '.');
    value = value.replace(/[^0-9.]/g, '');
    const dots = value.split('.');
    if (dots.length > 2) value = dots[0] + '.' + dots.slice(1).join('');
    if (onWeightChange) onWeightChange(value);
  };

  const handleRepsChange = (e) => {
    if (onRepsChange) onRepsChange(e.target.value);
  };

  const handleToggleComplete = () => {
    if (navigator.vibrate) navigator.vibrate(50);
    if (onToggleComplete) onToggleComplete();
  };

  const parsedWeight = parseFloat(weight);
  const parsedReps = parseInt(repsCompleted, 10);
  const hasE1RM = isComplete && !isNaN(parsedWeight) && !isNaN(parsedReps) && parsedReps > 0;
  const e1RM = hasE1RM ? epley1RM(parsedWeight, parsedReps).toFixed(1) : null;

  return (
    <div
      className={`flex items-center gap-2 sm:gap-3 py-2 px-3 rounded-[13px] transition-all duration-300 ${
        isComplete
          ? 'bg-surf-ok border-l-[3px] border-l-gain border border-line-ok'
          : 'bg-surf-hi border-l-[3px] border-l-accent border border-line-hi'
      }`}
    >
      {/* Set Number + e1RM (stacked, fits within row height) */}
      <div className="min-w-[56px] flex flex-col items-center justify-center flex-shrink-0 gap-0.5">
        <span className={`text-xs font-bold tracking-wider leading-none ${
          isComplete ? 'text-gain-t font-extrabold' : 'text-[#8b96a8]'
        }`}>
          SET {setNumber}
        </span>
        {hasE1RM && (
          <span className="text-[8px] font-mono text-[#3a4558] leading-none">≈{e1RM}kg</span>
        )}
      </div>

      {/* Weight Input */}
      <div className="flex-1 min-w-[70px]">
        <input
          type="text"
          inputMode="decimal"
          pattern="[0-9]*[.,]?[0-9]*"
          autoComplete="off"
          value={weight}
          onChange={handleWeightChange}
          placeholder={previousWeight ? `Last: ${previousWeight}` : placeholderWeight}
          disabled={disabled || isComplete}
          className={`input-field text-[19px] font-bold py-1.5 px-1.5 h-11 tabular-nums ${
            isComplete
              ? 'opacity-50 bg-canvas border-line-sub text-[#8b96a8] focus:ring-0 focus:border-line-sub select-none'
              : 'bg-canvas border-line-in text-[#f8fafc]'
          }`}
          aria-label={`Weight for set ${setNumber}`}
        />
      </div>

      {/* Reps Input */}
      <div className="flex-1 min-w-[55px]">
        <input
          type="number"
          inputMode="numeric"
          value={repsCompleted}
          onChange={handleRepsChange}
          placeholder={previousReps ? `Last: ${previousReps}` : placeholderReps}
          disabled={disabled || isComplete}
          className={`input-field text-[19px] font-bold py-1.5 px-1.5 h-11 tabular-nums ${
            isComplete
              ? 'opacity-50 bg-canvas border-line-sub text-[#8b96a8] focus:ring-0 focus:border-line-sub select-none'
              : 'bg-canvas border-line-in text-[#f8fafc]'
          }`}
          aria-label={`Reps for set ${setNumber}`}
        />
      </div>

      {/* Checkmark / Trophy button — no height change regardless of PR state */}
      <button
        type="button"
        onClick={handleToggleComplete}
        disabled={disabled}
        aria-label={`Toggle set ${setNumber} completion`}
        className={`w-11 h-11 rounded-[11px] flex items-center justify-center border transition-all duration-300 active:scale-95 outline-none flex-shrink-0 ${
          isComplete && isPR
            ? 'bg-peak/20 border-peak ring-1 ring-peak/30'
            : isComplete
            ? 'bg-gain border-gain shadow-[0_0_10px_rgba(47,170,120,0.25)]'
            : 'bg-transparent border-line-in hover:border-[#8b96a8]'
        }`}
      >
        {isComplete && isPR ? (
          <Trophy className="w-4 h-4 text-peak stroke-[2.5px]" />
        ) : (
          <Check className={`w-5 h-5 stroke-[3px] transition-transform duration-300 ${
            isComplete ? 'scale-110 text-[#0c1a14]' : 'scale-75 text-[#5b6678]'
          }`} />
        )}
      </button>
    </div>
  );
}

// Custom comparator intentionally ignores the on*Change/onToggleComplete
// callbacks: ExerciseCard recreates those closures on every render, but they
// only ever close over the stable exerciseId + setNumber, so re-rendering this
// row on each keystroke elsewhere would be pure waste. If a handler ever starts
// closing over changing state, add it to this comparison or the row will use a
// stale closure.
export default React.memo(SetInput, (prevProps, nextProps) => {
  return (
    prevProps.weight === nextProps.weight &&
    prevProps.repsCompleted === nextProps.repsCompleted &&
    prevProps.isComplete === nextProps.isComplete &&
    prevProps.setNumber === nextProps.setNumber &&
    prevProps.disabled === nextProps.disabled &&
    prevProps.previousWeight === nextProps.previousWeight &&
    prevProps.previousReps === nextProps.previousReps &&
    prevProps.isPR === nextProps.isPR
  );
});
