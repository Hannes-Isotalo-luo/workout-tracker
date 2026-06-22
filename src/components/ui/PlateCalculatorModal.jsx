import React, { useState } from 'react';
import { Layers, Flame } from 'lucide-react';
import { calculatePlates, getWarmupSets, DEFAULT_BAR } from '../../utils/plateCalculator';
import Modal from './Modal';

/**
 * Lightweight plate + warm-up calculator surfaced from an exercise card.
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
    <Modal onClose={onClose} z={60} borderClass="border-accent/30">
        <h3 className="text-sm font-black tracking-wider text-[#f8fafc] mb-1 flex items-center gap-2 uppercase">
          <Layers className="w-4.5 h-4.5 text-accent" />
          Plate Calculator
        </h3>
        {exerciseName && (
          <p className="text-[11px] text-[#5b6678] font-bold mb-4 truncate">{exerciseName}</p>
        )}

        <label htmlFor="plate-target" className="text-[10px] font-black text-[#5b6678] uppercase tracking-wider block pl-1 mb-1.5">
          Target Weight (kg) · {barWeight}kg bar
        </label>
        <input
          id="plate-target"
          type="text"
          inputMode="decimal"
          value={target}
          onChange={(e) => setTarget(e.target.value.replace(',', '.').replace(/[^0-9.]/g, ''))}
          placeholder="e.g. 100"
          className="input-field w-full text-base font-bold py-2.5 px-3 mb-4"
        />

        <div className="bg-canvas p-4 rounded-[13px] border border-line-sub mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black text-[#5b6678] uppercase tracking-wider">Load per side</span>
            <span className="text-[10px] font-bold text-[#5b6678]">{achievable} kg total</span>
          </div>
          {hasTarget && perSide.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {perSide.map((plate, i) => (
                <span
                  key={i}
                  className="text-sm font-extrabold bg-accent/10 text-accent border border-accent/25 px-2.5 py-1 rounded-[9px]"
                >
                  {plate}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[#5b6678] font-bold">
              {hasTarget ? 'Just the empty bar.' : 'Enter a target weight above.'}
            </p>
          )}
          {leftover > 0 && (
            <p className="text-[10px] text-peak font-bold mt-2">
              ⚠ {leftover}kg can't be matched with standard plates (closest: {achievable}kg).
            </p>
          )}
        </div>

        {warmups.length > 0 && (
          <div className="space-y-2">
            <span className="text-[10px] font-black text-[#5b6678] uppercase tracking-wider flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-peak" /> Suggested warm-up
            </span>
            <div className="space-y-1.5">
              {warmups.map((s, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between text-xs bg-canvas border border-line-sub rounded-[11px] px-3 py-2"
                >
                  <span className="text-[#5b6678] font-bold">{s.label}</span>
                  <span className="text-[#d3dae4] font-extrabold">
                    {s.weight} kg <span className="text-[#5b6678] font-bold">× {s.reps}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
    </Modal>
  );
}
