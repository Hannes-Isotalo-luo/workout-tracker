import React, { useMemo, useState } from 'react';
import { Repeat, Search } from 'lucide-react';
import { getMuscleGroup, getAlternatives } from '../../utils/muscleGroups';
import Modal from './Modal';

/**
 * Lets the lifter substitute the current exercise mid-session (e.g. a
 * machine is taken). Suggests alternatives that train the same muscle
 * group, with a free-text search fallback across the whole pool.
 */
export default function ExerciseSwapModal({ exerciseName, exercisePool, onSwap, onClose }) {
  const [query, setQuery] = useState('');
  const muscle = getMuscleGroup(exerciseName);

  const alternatives = useMemo(
    () => getAlternatives(exerciseName, exercisePool || []),
    [exerciseName, exercisePool]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return alternatives;
    return (exercisePool || [])
      .filter((n) => n !== exerciseName && n.toLowerCase().includes(q))
      .sort((a, b) => a.localeCompare(b));
  }, [query, alternatives, exercisePool, exerciseName]);

  return (
    <Modal onClose={onClose} z={60} borderClass="border-accent/30" panelClass="flex flex-col max-h-[80vh]">
        <h3 className="text-sm font-black tracking-wider text-[#f8fafc] mb-1 flex items-center gap-2 uppercase">
          <Repeat className="w-4.5 h-4.5 text-accent" />
          Swap Exercise
        </h3>
        <p className="text-[11px] text-[#5b6678] font-bold mb-4">
          Replacing <span className="text-[#d3dae4]">{exerciseName}</span>
          {muscle !== 'Other' && <span className="text-accent"> · {muscle}</span>}
        </p>

        <div className="relative mb-3">
          <Search className="w-4 h-4 text-[#5b6678] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search all exercises…"
            className="input-field w-full text-sm py-2.5 pl-9 pr-3"
          />
        </div>

        {!query && (
          <span className="text-[10px] font-black text-[#5b6678] uppercase tracking-wider mb-2">
            Same muscle group
          </span>
        )}

        <div className="overflow-y-auto -mx-1 px-1 space-y-1.5">
          {filtered.length === 0 ? (
            <p className="text-xs text-[#5b6678] font-bold py-4 text-center">
              No matching exercises found.
            </p>
          ) : (
            filtered.map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => onSwap(name)}
                className="w-full text-left text-sm font-bold text-[#d3dae4] bg-canvas hover:bg-surf-hi border border-line-sub hover:border-accent/30 rounded-[11px] px-3.5 py-3 transition-all active:scale-[0.99] flex items-center justify-between group"
              >
                <span className="truncate">{name}</span>
                <span className="text-[10px] font-bold text-[#3a4558] group-hover:text-accent uppercase tracking-wider flex-shrink-0 ml-2">
                  {getMuscleGroup(name)}
                </span>
              </button>
            ))
          )}
        </div>
    </Modal>
  );
}
