import { Sparkles, Play } from 'lucide-react';

/**
 * "Up next" quick-start card surfacing the next sequential session for the
 * enrolled program, with a peek at its planned movements.
 */
export default function QuickStartCard({ nextSession, nextExercises, onQuickStart, enrolledProgram, onChangeSplit }) {
  return (
    <div className="animate-slideUp mb-6">
      <button
        onClick={onQuickStart}
        className="w-full text-left glass-card p-5 border-slate-800 hover:border-violet-500/50 hover:bg-slate-800/40 transition-all duration-300 transform active:scale-[0.99] group relative overflow-hidden shadow-xl"
      >
        <div className="absolute top-0 right-0 -mr-6 -mt-6 w-32 h-32 rounded-full bg-violet-600/10 blur-2xl group-hover:bg-violet-600/20 transition-all duration-300" />
        <div className="absolute bottom-0 left-0 -ml-6 -mb-6 w-24 h-24 rounded-full bg-fuchsia-600/5 blur-2xl group-hover:bg-fuchsia-600/10 transition-all duration-300" />
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-violet-500/40 via-fuchsia-500/40 to-transparent" />

        <div className="flex items-start justify-between gap-4 relative z-10">
          <div className="space-y-3.5 flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-violet-400 animate-pulse" />
              <span className="text-[10px] font-black tracking-widest uppercase bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
                RESUME PROGRAM / UP NEXT
              </span>
            </div>

            <div>
              <h3 className="text-lg font-black text-slate-100 group-hover:text-violet-400 transition-colors tracking-tight">
                {nextSession.day}
              </h3>
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                <span className="text-slate-400 bg-slate-800 px-2 py-0.5 rounded text-[10px] font-bold border border-slate-700">
                  {nextSession.program}
                </span>
                <span className="text-slate-400 bg-slate-800 px-2 py-0.5 rounded text-[10px] font-bold border border-slate-700">
                  {nextSession.phase}
                </span>
              </div>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-slate-800/60">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Planned movements:</span>
              <div className="flex flex-wrap items-center gap-1.5">
                {nextExercises.slice(0, 3).map((ex, i) => (
                  <span key={i} className="text-[10px] font-bold bg-slate-900 border border-slate-800 px-2.5 py-1 rounded text-slate-400 truncate max-w-[120px]">
                    {ex.exercise}
                  </span>
                ))}
                {nextExercises.length > 3 && (
                  <span className="text-[10px] font-extrabold bg-slate-900 border border-slate-800 px-2 py-1 rounded text-violet-400">
                    +{nextExercises.length - 3} more
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-violet-600/90 to-fuchsia-600/90 hover:from-violet-500 hover:to-fuchsia-500 flex items-center justify-center text-white shadow-lg shadow-violet-500/20 group-hover:scale-105 transition-all duration-300 flex-shrink-0 mt-1 relative overflow-hidden">
            <Play className="w-4 h-4 text-white fill-current ml-0.5" />
          </div>
        </div>
      </button>

      {enrolledProgram && (
        <div className="flex items-center justify-between px-1.5 text-xs text-slate-400 font-bold mt-2.5">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
            Enrolled Program: <span className="text-violet-400 font-black">{enrolledProgram}</span>
          </span>
          <button
            type="button"
            onClick={onChangeSplit}
            className="text-fuchsia-400 hover:text-fuchsia-300 font-extrabold uppercase tracking-wider underline cursor-pointer transition-colors"
          >
            Change Split
          </button>
        </div>
      )}
    </div>
  );
}
