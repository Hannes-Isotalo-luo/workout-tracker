import React from 'react';
import { Check, Trophy } from 'lucide-react';

/**
 * SetInput - A single workout set logging row.
 * States: active (violet left-border), complete (green left-border + locked inputs).
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
    if (dots.length > 2) {
      value = dots[0] + '.' + dots.slice(1).join('');
    }
    console.log(`[SetInput] [Set #${setNumber}] Weight value updated: "${value}"`);
    if (onWeightChange) onWeightChange(value);
  };

  const handleRepsChange = (e) => {
    const value = e.target.value;
    console.log(`[SetInput] [Set #${setNumber}] Reps value updated: "${value}"`);
    if (onRepsChange) onRepsChange(value);
  };

  const handleToggleComplete = () => {
    console.log(`[SetInput] [Set #${setNumber}] Complete toggle clicked. New state: ${!isComplete}`);
    if (navigator.vibrate) navigator.vibrate(50);
    if (onToggleComplete) onToggleComplete();
  };

  const parsedWeight = parseFloat(weight);
  const parsedReps = parseInt(repsCompleted, 10);
  const hasE1RM = isComplete && !isNaN(parsedWeight) && !isNaN(parsedReps) && parsedReps > 0;
  const e1RM = hasE1RM ? (parsedWeight * (1 + parsedReps / 30)).toFixed(1) : null;

  return (
    <div className="flex flex-col gap-1">
      <div
        className={`flex items-center gap-2 sm:gap-3 py-2 px-3 rounded-[13px] transition-all duration-300 ${
          isComplete
            ? 'bg-surf-ok border-l-[3px] border-l-gain border border-line-ok'
            : 'bg-surf-hi border-l-[3px] border-l-accent border border-line-hi'
        }`}
      >
        {/* Set Number */}
        <div className="min-w-[52px] flex items-center justify-center flex-shrink-0">
          <span className={`text-xs font-bold tracking-wider ${
            isComplete ? 'text-gain-t font-extrabold' : 'text-[#8b96a8]'
          }`}>
            SET {setNumber}
          </span>
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

        {/* Checkmark Button */}
        <button
          type="button"
          onClick={handleToggleComplete}
          disabled={disabled}
          aria-label={`Toggle set ${setNumber} completion`}
          className={`w-11 h-11 rounded-[11px] flex items-center justify-center border transition-all duration-300 active:scale-95 outline-none flex-shrink-0 ${
            isComplete
              ? 'bg-gain border-gain shadow-[0_0_10px_rgba(47,170,120,0.25)]'
              : 'bg-transparent border-line-in hover:border-[#8b96a8]'
          }`}
        >
          <Check className={`w-5 h-5 stroke-[3px] transition-transform duration-300 ${
            isComplete ? 'scale-110 text-[#0c1a14]' : 'scale-75 text-[#5b6678]'
          }`} />
        </button>
      </div>

      {/* PR badge and e1RM info */}
      {(isPR || hasE1RM) && (
        <div className="flex items-center justify-between px-3 text-[10px] font-bold -mt-0.5 mb-1.5 animate-fadeIn">
          <div>
            {isPR && (
              <span className="text-peak flex items-center gap-1">
                <Trophy className="w-3 h-3" />
                <span className="uppercase tracking-wider">New Personal Record!</span>
              </span>
            )}
          </div>
          <div>
            {hasE1RM && (
              <span className="text-[#6b7689]">
                e1RM: <span className="text-[#d3dae4] font-extrabold">{e1RM} kg</span>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

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
