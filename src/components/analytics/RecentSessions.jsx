import { Calendar, Clock, Dumbbell, ChevronRight } from 'lucide-react';

/** Scrollable list of the most recent saved sessions. */
export default function RecentSessions({ sessions }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-[#d3dae4] flex items-center gap-1.5">
          <Calendar className="w-4 h-4 text-accent" />
          Recent Sessions
        </h3>
        <span className="text-[10px] font-extrabold text-accent bg-accent/10 px-2 py-0.5 rounded-md border border-accent/20">
          See All
        </span>
      </div>

      <div className="max-h-[290px] overflow-y-auto pr-1 space-y-2.5">
        {sessions.length > 0 ? (
          sessions.map((session) => (
            <div
              key={session.id}
              className="bg-surf border border-line-c rounded-[13px] p-3 flex items-center justify-between hover:border-line-hi transition-all duration-200 group"
            >
              <div className="flex items-center gap-3">
                <div className="w-[3px] self-stretch rounded-full bg-gain opacity-60 group-hover:opacity-100 transition-opacity" />
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-[#d3dae4] group-hover:text-accent transition-colors">{session.name}</h4>
                    <span className="text-[10px] font-extrabold bg-surf-chip border border-line-c text-[#8b96a8] px-1.5 py-0.5 rounded">
                      {session.badge}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-[10px] text-[#8b96a8] font-medium">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-[#5b6678]" />
                      {session.duration}
                    </span>
                    <span className="flex items-center gap-1">
                      <Dumbbell className="w-3 h-3 text-[#5b6678]" />
                      {session.sets} sets
                    </span>
                    <span className="font-semibold text-[#d3dae4]">Vol: {session.volume}</span>
                  </div>
                </div>
              </div>
              <button
                className="w-11 h-11 rounded-[11px] bg-surf-chip border border-line-c flex items-center justify-center hover:bg-surf-hi hover:text-[#f8fafc] transition-all text-[#5b6678]"
                aria-label="View session details"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center p-8 text-center bg-canvas border border-line-sub rounded-[18px] min-h-[150px] select-none">
            <Calendar className="w-8 h-8 text-[#3a4558] mb-2 animate-pulse" />
            <h4 className="text-xs font-bold text-[#8b96a8]">No Logs Recorded</h4>
            <p className="text-[10px] text-[#5b6678] mt-1 max-w-[200px] leading-tight">
              Saved workout sessions will populate here. Complete your first session to see history!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
