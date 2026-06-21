import { RotateCcw, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { formatTime } from '../../utils/formatters';

/**
 * Expandable card for a single completed session in the History view.
 * Restart/Delete are only offered for the most recent log (`isLast`).
 */
export default function SessionDetail({ session, isLast, expanded, onToggleExpand, onSelectExercise, onRestart, onDelete }) {
  return (
    <div className="glass-card border-slate-800 bg-slate-900/50 p-4 space-y-4 animate-slideUp relative overflow-hidden">
      {isLast && (
        <div className="absolute top-0 right-0 -mr-6 -mt-6 w-16 h-16 rounded-full bg-violet-600/10 blur-xl pointer-events-none" />
      )}

      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-black text-violet-400 uppercase tracking-wider">
              {isLast ? 'MOST RECENT LOG' : 'COMPLETED WORKOUT'}
            </span>
            {isLast && <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />}
          </div>
          <h5 className="text-sm font-black text-slate-200 mt-1">{session.day}</h5>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="text-[10px] text-slate-400 bg-slate-850 px-2 py-0.5 rounded border border-slate-800 font-bold">
              {session.program}
            </span>
            <span className="text-[10px] text-slate-400 bg-slate-850 px-2 py-0.5 rounded border border-slate-800 font-bold">
              {session.phase}
            </span>
          </div>
        </div>
        <div className="text-right">
          <span className="text-[10px] text-slate-500 font-bold uppercase block">Volume</span>
          <span className="text-base font-black text-violet-400 mt-0.5">
            {(session.totalVolume || 0).toLocaleString()}
            <span className="text-[10px] font-extrabold text-slate-500 ml-0.5">KG</span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 bg-slate-950/40 p-3 rounded-xl border border-slate-850">
        <div>
          <span className="text-[10px] text-slate-500 font-bold uppercase block">Workout Duration</span>
          <span className="text-xs font-mono font-extrabold text-slate-300 mt-0.5">{formatTime(session.duration || 0)}</span>
        </div>
        <div>
          <span className="text-[10px] text-slate-500 font-bold uppercase block">Sets Logged</span>
          <span className="text-xs font-mono font-extrabold text-slate-300 mt-0.5">{session.completedSets || 0} Sets</span>
        </div>
      </div>

      <div className="space-y-1.5">
        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Completed Exercises:</span>
        <div className="flex flex-wrap gap-1.5">
          {session.logs?.map((exLog, exIdx) => {
            const completedSetsCount = exLog.sets?.filter((s) => s.isComplete).length || 0;
            if (completedSetsCount === 0) return null;
            return (
              <button
                key={exIdx}
                type="button"
                onClick={() => onSelectExercise(exLog.exerciseName)}
                className="text-[10px] font-bold bg-slate-950/60 hover:bg-slate-900 border border-slate-800/80 hover:border-slate-700/60 px-2 py-1 rounded text-slate-300 cursor-pointer transition-all active:scale-[0.98] text-left"
              >
                {exLog.exerciseName} <span className="text-violet-400 font-extrabold">({completedSetsCount}s)</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-slate-850/60 pt-3">
        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Workout Breakdown</span>
        <button
          type="button"
          onClick={onToggleExpand}
          className="flex items-center gap-1 text-[10px] font-bold text-violet-400 hover:text-violet-300 transition-colors"
        >
          {expanded ? (
            <>Hide Details <ChevronUp className="w-3.5 h-3.5" /></>
          ) : (
            <>View Details <ChevronDown className="w-3.5 h-3.5" /></>
          )}
        </button>
      </div>

      {expanded && (
        <div className="space-y-3 pt-3 border-t border-slate-850 animate-fadeIn">
          {session.logs?.map((exLog, exIdx) => {
            const completedSets = exLog.sets?.filter((s) => s.isComplete) || [];
            if (completedSets.length === 0) return null;
            return (
              <div key={exIdx} className="space-y-1.5 p-3 rounded-xl bg-slate-950/40 border border-slate-850/80">
                <h6
                  onClick={() => onSelectExercise(exLog.exerciseName)}
                  className="text-[11px] font-black text-slate-300 hover:text-violet-400 cursor-pointer flex items-center gap-1.5 transition-colors"
                >
                  <span className="text-[10px] font-black text-violet-400 font-mono">
                    {(exIdx + 1).toString().padStart(2, '0')}
                  </span>
                  <span className="underline decoration-dotted decoration-violet-500/50">{exLog.exerciseName}</span>
                </h6>
                <div className="grid grid-cols-2 gap-1.5 text-[10px] font-bold font-mono text-slate-400">
                  {completedSets.map((set, setIdx) => (
                    <div key={setIdx} className="flex justify-between bg-slate-900/50 px-2.5 py-1.5 rounded-lg border border-slate-850/50">
                      <span className="text-slate-500 font-bold">SET {set.setNumber}</span>
                      <span className="font-black text-slate-200">
                        {set.weight || '—'} KG × {set.repsCompleted || '—'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {isLast ? (
        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-850">
          <button
            onClick={onRestart}
            className="py-2.5 px-3 rounded-xl font-bold bg-slate-800 hover:bg-slate-700 hover:text-slate-100 text-slate-300 border border-slate-700 flex items-center justify-center gap-2 text-xs active:scale-[0.98] transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Restart / Edit
          </button>
          <button
            onClick={onDelete}
            className="py-2.5 px-3 rounded-xl font-bold bg-rose-950/30 hover:bg-rose-900/40 text-rose-400 border border-rose-900/40 flex items-center justify-center gap-2 text-xs active:scale-[0.98] transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete Log
          </button>
        </div>
      ) : (
        <div className="pt-2 border-t border-slate-850 text-center">
          <p className="text-[10px] font-bold text-slate-650">
            🔒 Restart and Delete actions are restricted to the most recent log.
          </p>
        </div>
      )}
    </div>
  );
}
