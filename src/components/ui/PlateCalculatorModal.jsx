import React, { useState } from 'react';
import { X, Layers, Flame } from 'lucide-react';
import { calculatePlates, getWarmupSets, DEFAULT_BAR } from '../../utils/plateCalculator';

/**
 * Lightweight plate + warm-up calculator surfaced from an exercise card.
 * Opens with the set's current/suggested weight pre-filled and lets the
 * lifter tweak the target to see per-side plate loading and a warm-up ramp.
 */
export default function PlateCalculatorModal({ exerciseName, initialWeight = '', onClose }) {
  const [target, setTarget] = useState(() => {
    const n = parseFloat(initialWeight);
    return isNaN(n) ? '' : String(n);
  });

  const { perSide, achievable, leftover, barWeight } = calculatePlates(target, DEFAULT_BAR);
  const warmups = getWarmupSets(target, DEFAULT_BAR);
  const hasTarget = !isNaN(parseFloat(target)) && parseFloat(target) > 0;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm glass-card border-cyan-500/30 bg-slate-900 p-6 shadow-2xl relative transform transition-all duration-300 animate-slideUp"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-slate-200 transition-all"
          aria-label="Close plate calculator"
        >
          <X className="w-4 h-4" />
        </button>

        <h3 className="text-sm font-black tracking-wider text-slate-100 mb-1 flex items-center gap-2 uppercase">
          <Layers className="w-4.5 h-4.5 text-cyan-400" />
          Plate Calculator
        </h3>
        {exerciseName && (
          <p className="text-[11px] text-slate-500 font-bold mb-4 truncate">{exerciseName}</p>
        )}

        {/* Target weight input */}
        <label htmlFor="plate-target" className="text-[10px] font-black text-slate-400 uppercase tracking-wider block pl-1 mb-1.5">
          Target Weight (kg) · {barWeight}kg bar
        </label>
        <input
          id="plate-target"
          type="text"
          inputMode="decimal"
          value={target}
          onChange={(e) => setTarget(e.target.value.replace(',', '.').replace(/[^0-9.]/g, ''))}
          placeholder="e.g. 100"
          className="input-field w-full text-base font-bold py-2.5 px-3 bg-slate-800 border-slate-700 text-slate-100 mb-4"
        />

        {/* Per-side plate breakdown */}
        <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Load per side</span>
            <span className="text-[10px] font-bold text-slate-500">{achievable} kg total</span>
          </div>
          {hasTarget && perSide.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {perSide.map((plate, i) => (
                <span
                  key={i}
                  className="text-sm font-extrabold bg-cyan-500/10 text-cyan-300 border border-cyan-500/25 px-2.5 py-1 rounded-lg"
                >
                  {plate}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 font-bold">
              {hasTarget ? 'Just the empty bar.' : 'Enter a target weight above.'}
            </p>
          )}
          {leftover > 0 && (
            <p className="text-[10px] text-amber-400 font-bold mt-2">
              ⚠ {leftover}kg can't be matched with standard plates (closest: {achievable}kg).
            </p>
          )}
        </div>

        {/* Warm-up ramp */}
        {warmups.length > 0 && (
          <div className="space-y-2">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-orange-400" /> Suggested warm-up
            </span>
            <div className="space-y-1.5">
              {warmups.map((s, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between text-xs bg-slate-950/40 border border-slate-800 rounded-xl px-3 py-2"
                >
                  <span className="text-slate-500 font-bold">{s.label}</span>
                  <span className="text-slate-200 font-extrabold">
                    {s.weight} kg <span className="text-slate-500 font-bold">× {s.reps}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
