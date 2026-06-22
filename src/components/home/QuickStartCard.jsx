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
        className="w-full text-left bg-surf border border-line-c rounded-[18px] p-5 hover:border-accent/40 hover:bg-surf-hi transition-all duration-300 active:scale-[0.99] group relative overflow-hidden shadow-xl"
      >
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-accent/50 rounded-t-[18px]" />

        <div className="flex items-start justify-between gap-4 relative z-10">
          <div className="space-y-3.5 flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-accent" />
              <span className="text-[10px] font-black tracking-widest uppercase text-accent">
                RESUME PROGRAM / UP NEXT
              </span>
            </div>

            <div>
              <h3 className="text-lg font-black text-[#f8fafc] group-hover:text-accent transition-colors tracking-tight">
                {nextSession.day}
              </h3>
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                <span className="text-[#8b96a8] bg-surf-chip px-2 py-0.5 rounded text-[10px] font-bold border border-line-c">
                  {nextSession.program}
                </span>
                <span className="text-[#8b96a8] bg-surf-chip px-2 py-0.5 rounded text-[10px] font-bold border border-line-c">
                  {nextSession.phase}
                </span>
              </div>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-line-sub">
              <span className="text-[9px] font-bold text-[#5b6678] uppercase tracking-wider block">Planned movements:</span>
              <div className="flex flex-wrap items-center gap-1.5">
                {nextExercises.slice(0, 3).map((ex, i) => (
                  <span key={i} className="text-[10px] font-bold bg-canvas border border-line-sub px-2.5 py-1 rounded text-[#8b96a8] truncate max-w-[120px]">
                    {ex.exercise}
                  </span>
                ))}
                {nextExercises.length > 3 && (
                  <span className="text-[10px] font-extrabold bg-canvas border border-line-sub px-2 py-1 rounded text-accent">
                    +{nextExercises.length - 3} more
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="w-10 h-10 rounded-[13px] bg-accent flex items-center justify-center text-white shadow-lg shadow-accent/20 group-hover:scale-105 transition-all duration-300 flex-shrink-0 mt-1">
            <Play className="w-4 h-4 text-white fill-current ml-0.5" />
          </div>
        </div>
      </button>

      {enrolledProgram && (
        <div className="flex items-center justify-between px-1.5 text-xs text-[#8b96a8] font-bold mt-2.5">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-gain" />
            Enrolled Program: <span className="text-gain-t font-black">{enrolledProgram}</span>
          </span>
          <button
            type="button"
            onClick={onChangeSplit}
            className="text-accent hover:text-accent/80 font-extrabold uppercase tracking-wider underline cursor-pointer transition-colors"
          >
            Change Split
          </button>
        </div>
      )}
    </div>
  );
}
