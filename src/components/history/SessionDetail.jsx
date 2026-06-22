import { RotateCcw, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { formatTime } from '../../utils/formatters';

/**
 * Expandable card for a single completed session in the History view.
 * Restart/Delete are only offered for the most recent log (`isLast`).
 */
export default function SessionDetail({ session, isLast, expanded, onToggleExpand, onSelectExercise, onRestart, onDelete }) {
  return (
    <div className="bg-surf-ok border-l-[3px] border-l-gain border border-line-ok rounded-[13px] p-4 space-y-4 animate-slideUp">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-black text-gain-t uppercase tracking-wider">
              {isLast ? 'MOST RECENT LOG' : 'COMPLETED WORKOUT'}
            </span>
            {isLast && <span className="h-1.5 w-1.5 rounded-full bg-gain animate-ping" />}
          </div>
          <h5 className="text-sm font-black text-[#f8fafc] mt-1">{session.day}</h5>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="text-[10px] text-[#8b96a8] bg-surf-chip px-2 py-0.5 rounded border border-line-c font-bold">
              {session.program}
            </span>
            <span className="text-[10px] text-[#8b96a8] bg-surf-chip px-2 py-0.5 rounded border border-line-c font-bold">
              {session.phase}
            </span>
          </div>
        </div>
        <div className="text-right">
          <span className="text-[10px] text-[#5b6678] font-bold uppercase block">Volume</span>
          <span className="text-base font-black text-gain-t mt-0.5">
            {(session.totalVolume || 0).toLocaleString()}
            <span className="text-[10px] font-extrabold text-[#5b6678] ml-0.5">KG</span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 bg-canvas p-3 rounded-[11px] border border-line-sub">
        <div>
          <span className="text-[10px] text-[#5b6678] font-bold uppercase block">Workout Duration</span>
          <span className="text-xs font-mono font-extrabold text-[#d3dae4] mt-0.5">{formatTime(session.duration || 0)}</span>
        </div>
        <div>
          <span className="text-[10px] text-[#5b6678] font-bold uppercase block">Sets Logged</span>
          <span className="text-xs font-mono font-extrabold text-[#d3dae4] mt-0.5">{session.completedSets || 0} Sets</span>
        </div>
      </div>

      <div className="space-y-1.5">
        <span className="text-[10px] text-[#5b6678] font-bold uppercase tracking-wider block">Completed Exercises:</span>
        <div className="flex flex-wrap gap-1.5">
          {session.logs?.map((exLog, exIdx) => {
            const completedSetsCount = exLog.sets?.filter((s) => s.isComplete).length || 0;
            if (completedSetsCount === 0) return null;
            return (
              <button
                key={exIdx}
                type="button"
                onClick={() => onSelectExercise(exLog.exerciseName)}
                className="text-[10px] font-bold bg-canvas hover:bg-surf-chip border border-line-sub px-2 py-1 rounded text-[#d3dae4] cursor-pointer transition-all active:scale-[0.98] text-left"
              >
                {exLog.exerciseName} <span className="text-accent font-extrabold">({completedSetsCount}s)</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-line-sub pt-3">
        <span className="text-[10px] text-[#5b6678] font-bold uppercase tracking-widest">Workout Breakdown</span>
        <button
          type="button"
          onClick={onToggleExpand}
          className="flex items-center gap-1 text-[10px] font-bold text-accent hover:text-accent/80 transition-colors"
        >
          {expanded ? (
            <>Hide Details <ChevronUp className="w-3.5 h-3.5" /></>
          ) : (
            <>View Details <ChevronDown className="w-3.5 h-3.5" /></>
          )}
        </button>
      </div>

      {expanded && (
        <div className="space-y-3 pt-3 border-t border-line-sub animate-fadeIn">
          {session.logs?.map((exLog, exIdx) => {
            const completedSets = exLog.sets?.filter((s) => s.isComplete) || [];
            if (completedSets.length === 0) return null;
            return (
              <div key={exIdx} className="space-y-1.5 p-3 rounded-[11px] bg-canvas border border-line-sub">
                <h6
                  onClick={() => onSelectExercise(exLog.exerciseName)}
                  className="text-[11px] font-black text-[#d3dae4] hover:text-accent cursor-pointer flex items-center gap-1.5 transition-colors"
                >
                  <span className="text-[10px] font-black text-gain-t font-mono">
                    {(exIdx + 1).toString().padStart(2, '0')}
                  </span>
                  <span className="underline decoration-dotted decoration-accent/50">{exLog.exerciseName}</span>
                </h6>
                <div className="grid grid-cols-2 gap-1.5 text-[10px] font-bold font-mono text-[#8b96a8]">
                  {completedSets.map((set, setIdx) => (
                    <div key={setIdx} className="flex justify-between bg-surf-chip px-2.5 py-1.5 rounded-lg border border-line-c">
                      <span className="text-[#5b6678] font-bold">SET {set.setNumber}</span>
                      <span className="font-black text-[#d3dae4]">
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
        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-line-sub">
          <button
            onClick={onRestart}
            className="py-2.5 px-3 rounded-[11px] font-bold bg-surf-chip hover:bg-surf-hi text-[#d3dae4] border border-line-c flex items-center justify-center gap-2 text-xs active:scale-[0.98] transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Restart / Edit
          </button>
          <button
            onClick={onDelete}
            className="py-2.5 px-3 rounded-[11px] font-bold bg-rose-950/30 hover:bg-rose-900/40 text-rose-400 border border-rose-900/40 flex items-center justify-center gap-2 text-xs active:scale-[0.98] transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete Log
          </button>
        </div>
      ) : (
        <div className="pt-2 border-t border-line-sub text-center">
          <p className="text-[10px] font-bold text-[#5b6678]">
            Restart and Delete actions are restricted to the most recent log.
          </p>
        </div>
      )}
    </div>
  );
}
