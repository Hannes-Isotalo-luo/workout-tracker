import { Sparkles, Award, Trophy } from 'lucide-react';
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
    <Modal onClose={onEditSets} anchorBottom borderClass="border-accent/30" showClose={false} panelClass="shadow-accent/20">
      {stats.isMesocycleComplete ? (
        <>
          <div className="w-16 h-16 rounded-full bg-peak flex items-center justify-center mx-auto mb-4 shadow-lg shadow-peak/20">
            <Sparkles className="w-8 h-8 text-slate-950 animate-bounce" />
          </div>
          <h3 className="text-2xl font-black text-center tracking-tight text-peak mb-1">Mesocycle Complete!</h3>
          <p className="text-xs text-center text-[#8b96a8] mb-6 uppercase tracking-widest font-bold">
            You finished all 8 weeks of {stats.program}!
          </p>
        </>
      ) : (
        <>
          <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center mx-auto mb-4 shadow-lg shadow-accent/20">
            <Award className="w-8 h-8 text-white animate-bounce" />
          </div>
          <h3 className="text-2xl font-black text-center tracking-tight text-[#f8fafc] mb-1">Workout Complete!</h3>
          <p className="text-xs text-center text-[#8b96a8] mb-6 uppercase tracking-widest font-semibold">
            Excellent hypertrophy effort!
          </p>
        </>
      )}

      <div className="space-y-3.5 bg-canvas p-4 rounded-[13px] border border-line-sub mb-5">
        <div className="flex items-center justify-between text-sm">
          <span className="text-[#5b6678] font-bold">WORKOUT DAY</span>
          <span className="text-[#d3dae4] font-extrabold text-right max-w-[150px] truncate">{stats.day}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-[#5b6678] font-bold">TOTAL TIME</span>
          <span className="text-[#d3dae4] font-mono font-extrabold">{formatTime(stats.duration)}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-[#5b6678] font-bold">SETS COMPLETED</span>
          <span className="text-gain-t font-extrabold">{stats.completedSets} Sets</span>
        </div>
        <div className="flex items-center justify-between text-sm border-t border-line-sub pt-3">
          <span className="text-[#5b6678] font-bold">TOTAL VOLUME</span>
          <span className="text-accent font-black text-base">{stats.totalVolume.toLocaleString()} KG</span>
        </div>
      </div>

      {stats.prs && stats.prs.length > 0 && (
        <div className="mb-5 space-y-2">
          <div className="flex items-center gap-1.5 justify-center text-peak">
            <Trophy className="w-4 h-4 fill-current" />
            <span className="text-xs font-black uppercase tracking-wider">New Personal Records!</span>
          </div>
          <div className="bg-peak/10 border border-peak/20 rounded-[13px] p-3.5 space-y-2 text-left">
            {stats.prs.map((pr, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs">
                <span className="text-[#d3dae4] font-bold flex items-center gap-1">
                  <Trophy className="w-3 h-3 text-peak" /> {pr.exerciseName}
                </span>
                <span className="text-peak font-extrabold">
                  {pr.weight} kg {pr.previousWeight > 0 ? `(was ${pr.previousWeight} kg)` : '(First time!)'}
                </span>
              </div>
            ))}
            <p className="text-[10px] text-center text-peak/70 font-bold pt-1 border-t border-peak/10">
              Phenomenal lifting! You are getting stronger!
            </p>
          </div>
        </div>
      )}

      <div className="mb-5 space-y-1.5 text-left">
        <label htmlFor="session-notes" className="text-[10px] font-black text-[#5b6678] uppercase tracking-wider block pl-1">
          Workout Notes / Feedback
        </label>
        <textarea
          id="session-notes"
          rows={2}
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          placeholder="How did the workout feel? Any notes on form, energy levels, or equipment..."
          className="w-full text-xs bg-canvas border border-line-in hover:border-line-hi focus:border-accent rounded-[11px] px-3 py-2 text-[#d3dae4] placeholder-[#3a4558] focus:outline-none transition-all resize-none font-medium"
        />
      </div>

      <div className="flex gap-2.5">
        <button
          type="button"
          onClick={onEditSets}
          className="py-3.5 px-4 rounded-[13px] font-extrabold bg-surf-chip hover:bg-surf-hi text-[#d3dae4] border border-line-c active:scale-[0.98] transition-all duration-200 cursor-pointer text-xs"
        >
          Edit Sets
        </button>
        <button
          type="button"
          onClick={onSave}
          className="flex-1 py-3.5 px-6 rounded-[13px] font-extrabold bg-accent hover:bg-accent/90 text-white shadow-[0_8px_20px_rgba(109,92,240,0.28)] active:scale-[0.97] transition-all duration-200 cursor-pointer text-xs"
        >
          GREAT WORKOUT!
        </button>
      </div>
    </Modal>
  );
}
