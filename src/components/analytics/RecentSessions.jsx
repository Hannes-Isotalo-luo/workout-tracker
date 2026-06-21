import { Calendar, Clock, Dumbbell, ChevronRight } from 'lucide-react';

/** Scrollable list of the most recent saved sessions. */
export default function RecentSessions({ sessions }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
          <Calendar className="w-4 h-4 text-violet-400" />
          Recent Sessions
        </h3>
        <span className="text-[10px] font-extrabold text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded-md">See All</span>
      </div>

      <div className="max-h-[290px] overflow-y-auto pr-1 space-y-2.5 custom-scrollbar">
        {sessions.length > 0 ? (
          sessions.map((session) => (
            <div
              key={session.id}
              className="glass-card p-3 flex items-center justify-between border-slate-700/30 hover:border-slate-600/50 transition-all duration-200 group"
            >
              <div className="flex items-center gap-3">
                <div className="w-1 self-stretch rounded-full bg-gradient-to-b from-violet-500 to-fuchsia-500 opacity-60 group-hover:opacity-100 transition-opacity" />
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-slate-200 group-hover:text-violet-400 transition-colors">{session.name}</h4>
                    <span className="text-[10px] font-extrabold bg-slate-900 border border-slate-800 text-slate-400 px-1.5 py-0.5 rounded">
                      {session.badge}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-[10px] text-slate-400 font-medium">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-500" />
                      {session.duration}
                    </span>
                    <span className="flex items-center gap-1">
                      <Dumbbell className="w-3 h-3 text-slate-500" />
                      {session.sets} sets
                    </span>
                    <span className="font-semibold text-slate-300">Vol: {session.volume}</span>
                  </div>
                </div>
              </div>
              <button
                className="w-11 h-11 rounded-lg bg-slate-900 border border-slate-800/80 flex items-center justify-center hover:bg-slate-800 hover:text-white transition-all text-slate-500"
                aria-label="View session details"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center p-8 text-center bg-slate-950/20 border border-slate-900/60 rounded-2xl min-h-[150px] select-none">
            <Calendar className="w-8 h-8 text-slate-600 mb-2 animate-pulse" />
            <h4 className="text-xs font-bold text-slate-400">No Logs Recorded</h4>
            <p className="text-[10px] text-slate-500 mt-1 max-w-[200px] leading-tight">
              Saved workout sessions will populate here. Complete your first session to see history!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
