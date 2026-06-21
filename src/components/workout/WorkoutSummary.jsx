import { Sparkles, Award } from 'lucide-react';
import Modal from '../ui/Modal';
import { formatTime } from '../../utils/formatters';

/**
 * Post-workout summary modal: celebrates the session, shows totals + any new
 * PRs, and collects optional notes before the final save.
 *
 * @param {object} stats — { day, program, duration, completedSets, totalVolume, isMesocycleComplete, prs[] }
 * @param {string} notes
 * @param {(value: string) => void} onNotesChange
 * @param {() => void} onEditSets — dismiss summary, return to editing sets
 * @param {() => void} onSave — finalize + persist
 */
export default function WorkoutSummary({ stats, notes, onNotesChange, onEditSets, onSave }) {
  if (!stats) return null;

  return (
    <Modal onClose={onEditSets} anchorBottom borderClass="border-violet-500/30" showClose={false} panelClass="shadow-violet-950/40">
      {stats.isMesocycleComplete ? (
        <>
          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-yellow-500 to-amber-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-yellow-500/20">
            <Sparkles className="w-8 h-8 text-white animate-bounce" />
          </div>
          <h3 className="text-2xl font-black text-center tracking-tight text-amber-400 mb-1">Mesocycle Complete!</h3>
          <p className="text-xs text-center text-slate-400 mb-6 uppercase tracking-widest font-bold">
            🏆 You finished all 8 weeks of {stats.program}!
          </p>
        </>
      ) : (
        <>
          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-violet-500 to-fuchsia-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-violet-500/20">
            <Award className="w-8 h-8 text-white animate-bounce" />
          </div>
          <h3 className="text-2xl font-black text-center tracking-tight text-slate-100 mb-1">Workout Complete!</h3>
          <p className="text-xs text-center text-slate-400 mb-6 uppercase tracking-widest font-semibold">
            Excellent hypertrophy effort!
          </p>
        </>
      )}

      <div className="space-y-3.5 bg-slate-950/50 p-4 rounded-2xl border border-slate-800 mb-5">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500 font-bold">WORKOUT DAY</span>
          <span className="text-slate-200 font-extrabold text-right max-w-[150px] truncate">{stats.day}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500 font-bold">TOTAL TIME</span>
          <span className="text-slate-200 font-mono font-extrabold">{formatTime(stats.duration)}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500 font-bold">SETS COMPLETED</span>
          <span className="text-emerald-400 font-extrabold">{stats.completedSets} Sets</span>
        </div>
        <div className="flex items-center justify-between text-sm border-t border-slate-900 pt-3">
          <span className="text-slate-500 font-bold">TOTAL VOLUME</span>
          <span className="text-violet-400 font-black text-base">{stats.totalVolume.toLocaleString()} KG</span>
        </div>
      </div>

      {stats.prs && stats.prs.length > 0 && (
        <div className="mb-5 space-y-2">
          <div className="flex items-center gap-1.5 justify-center text-amber-400">
            <Sparkles className="w-4 h-4 text-amber-400 fill-current animate-pulse" />
            <span className="text-xs font-black uppercase tracking-wider">New Personal Records!</span>
          </div>
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-3.5 space-y-2 text-left">
            {stats.prs.map((pr, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-bold">🏆 {pr.exerciseName}</span>
                <span className="text-amber-400 font-extrabold">
                  {pr.weight} kg {pr.previousWeight > 0 ? `(was ${pr.previousWeight} kg)` : '(First time!)'}
                </span>
              </div>
            ))}
            <p className="text-[10px] text-center text-amber-300 font-bold pt-1 border-t border-amber-500/10">
              Phenomenal lifting! You are getting stronger!
            </p>
          </div>
        </div>
      )}

      <div className="mb-5 space-y-1.5 text-left">
        <label htmlFor="session-notes" className="text-[10px] font-black text-slate-400 uppercase tracking-wider block pl-1">
          Workout Notes / Feedback
        </label>
        <textarea
          id="session-notes"
          rows={2}
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          placeholder="How did the workout feel? Any notes on form, energy levels, or equipment..."
          className="w-full text-xs bg-slate-950/60 border border-slate-800 hover:border-slate-700 focus:border-violet-500 rounded-xl px-3 py-2 text-slate-200 placeholder-slate-600 focus:outline-none transition-all resize-none font-medium"
        />
      </div>

      <div className="flex gap-2.5">
        <button
          type="button"
          onClick={onEditSets}
          className="py-3.5 px-4 rounded-xl font-extrabold bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 active:scale-[0.98] transition-all duration-200 cursor-pointer text-xs"
        >
          Edit Sets
        </button>
        <button
          type="button"
          onClick={onSave}
          className="flex-1 py-3.5 px-6 rounded-xl font-extrabold bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white shadow-lg shadow-violet-500/10 active:scale-[0.98] transition-all duration-200 cursor-pointer text-xs"
        >
          GREAT WORKOUT!
        </button>
      </div>
    </Modal>
  );
}
