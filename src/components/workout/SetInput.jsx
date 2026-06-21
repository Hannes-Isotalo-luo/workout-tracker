import React from 'react';
import { Check } from 'lucide-react';

/**
 * SetInput - A single workout set logging row.
 * Includes set number, native decimal inputs for weight/reps with no spinners,
 * and a high-contrast checkmark toggle that changes color upon completion.
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
    
    // Normalize comma to dot
    value = value.replace(',', '.');
    
    // Allow only digits and a single dot
    value = value.replace(/[^0-9.]/g, '');
    
    // Prevent multiple dots
    const dots = value.split('.');
    if (dots.length > 2) {
      value = dots[0] + '.' + dots.slice(1).join('');
    }
    
    console.log(`[SetInput] [Set #${setNumber}] Weight value updated: "${value}"`);
    if (onWeightChange) {
      onWeightChange(value);
    }
  };

  const handleRepsChange = (e) => {
    const value = e.target.value;
    console.log(`[SetInput] [Set #${setNumber}] Reps value updated: "${value}"`);
    if (onRepsChange) {
      onRepsChange(value);
    }
  };

  const handleToggleComplete = () => {
    console.log(`[SetInput] [Set #${setNumber}] Complete toggle clicked. New state: ${!isComplete}`);
    if (navigator.vibrate) navigator.vibrate(50);
    if (onToggleComplete) {
      onToggleComplete();
    }
  };

  const parsedWeight = parseFloat(weight);
  const parsedReps = parseInt(repsCompleted, 10);
  const hasE1RM = isComplete && !isNaN(parsedWeight) && !isNaN(parsedReps) && parsedReps > 0;
  const e1RM = hasE1RM ? (parsedWeight * (1 + parsedReps / 30)).toFixed(1) : null;

  return (
    <div className="flex flex-col gap-1">
      <div className={`flex items-center gap-2 sm:gap-3 py-2 px-3 rounded-xl transition-all duration-300 ${
        isComplete 
          ? 'bg-emerald-500/10 border border-emerald-500/20 shadow-[inset_0_1px_1px_rgba(16,185,129,0.05)]' 
          : 'bg-slate-800/20 border border-slate-800/40'
      }`}>
        {/* Set Number */}
        <div className="min-w-[52px] flex items-center justify-center flex-shrink-0">
          <span className={`text-xs font-bold tracking-wider ${
            isComplete ? 'text-emerald-400 font-extrabold' : 'text-slate-400'
          }`}>
            SET {setNumber}
          </span>
        </div>

        {/* Weight Input */}
        <div className="flex-1 min-w-[70px] relative">
          <input
            type="text"
            inputMode="decimal"
            pattern="[0-9]*[.,]?[0-9]*"
            autoComplete="off"
            value={weight}
            onChange={handleWeightChange}
            placeholder={previousWeight ? `Last: ${previousWeight}` : placeholderWeight}
            disabled={disabled || isComplete}
            className={`input-field text-sm py-1.5 px-1.5 h-11 ${
              isComplete 
                ? 'opacity-50 bg-slate-900/60 border-slate-800 text-slate-400 focus:ring-0 focus:border-slate-800 select-none' 
                : 'bg-slate-800 hover:bg-slate-800/80 border-slate-700/80 text-slate-100'
            }`}
            aria-label={`Weight for set ${setNumber}`}
          />
        </div>

        {/* Reps Input (type="number", inputMode="numeric") */}
        <div className="flex-1 min-w-[55px] relative">
          <input
            type="number"
            inputMode="numeric"
            value={repsCompleted}
            onChange={handleRepsChange}
            placeholder={previousReps ? `Last: ${previousReps}` : placeholderReps}
            disabled={disabled || isComplete}
            className={`input-field text-sm py-1.5 px-1.5 h-11 ${
              isComplete 
                ? 'opacity-50 bg-slate-900/60 border-slate-800 text-slate-400 focus:ring-0 focus:border-slate-800 select-none' 
                : 'bg-slate-800 hover:bg-slate-800/80 border-slate-700/80 text-slate-100'
            }`}
            aria-label={`Reps for set ${setNumber}`}
          />
        </div>

        {/* Checkmark Button Toggle */}
        <button
          type="button"
          onClick={handleToggleComplete}
          disabled={disabled}
          aria-label={`Toggle set ${setNumber} completion`}
          className={`w-11 h-11 rounded-xl flex items-center justify-center border transition-all duration-300 transform active:scale-95 outline-none flex-shrink-0 ${
            isComplete
              ? 'bg-emerald-500 border-emerald-500 text-slate-950 scale-100 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
              : 'bg-slate-900/50 border-slate-700 text-transparent hover:border-slate-500 hover:text-slate-400'
          }`}
        >
          <Check className={`w-5 h-5 stroke-[3px] transition-transform duration-300 ${
            isComplete ? 'scale-110 text-slate-950' : 'scale-75 text-slate-500'
          }`} />
        </button>
      </div>

      {/* Footer Sub-row for PR badge and e1RM info */}
      {(isPR || hasE1RM) && (
        <div className="flex items-center justify-between px-3 text-[10px] font-bold -mt-0.5 mb-1.5 animate-fadeIn">
          <div>
            {isPR && (
              <span className="text-amber-400 flex items-center gap-1">
                🏆 <span className="uppercase tracking-wider">New Personal Record!</span>
              </span>
            )}
          </div>
          <div>
            {hasE1RM && (
              <span className="text-slate-400">
                e1RM: <span className="text-slate-200 font-extrabold">{e1RM} kg</span>
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
