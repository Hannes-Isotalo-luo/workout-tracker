import { Clock, X } from 'lucide-react';
import { formatTime } from '../../utils/formatters';

/**
 * Floating rest-timer overlay shown during the active workout. Lets the lifter
 * add/subtract 30s or dismiss the timer.
 *
 * @param {{ active: boolean, secondsRemaining: number, exerciseName: string }} timer
 * @param {(delta: number) => void} [onModify]
 * @param {() => void} [onDismiss]
 */
export default function RestTimer({ timer, onModify, onDismiss }) {
  if (!timer || !timer.active) return null;

  return (
    <div className="fixed bottom-24 left-4 right-4 z-50 glass-card p-3 border-cyan-500/40 bg-slate-950/95 shadow-xl shadow-cyan-950/20 flex items-center justify-between animate-slideUp">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center">
          <Clock className="w-4 h-4 text-cyan-400 animate-spin" style={{ animationDuration: '4s' }} />
        </div>
        <div>
          <span className="text-xs font-bold text-slate-500 block leading-tight">RESTING ({timer.exerciseName})</span>
          <span className="text-xs font-semibold text-slate-400">Prepare for next set</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {onModify && (
          <div className="flex gap-1.5 mr-1">
            <button
              type="button"
              onClick={() => onModify(-30)}
              className="bg-slate-900/80 hover:bg-slate-800 border border-slate-700/60 hover:border-cyan-500/40 text-cyan-400 font-mono text-xs font-bold min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl transition-all transform active:scale-95"
            >
              -30s
            </button>
            <button
              type="button"
              onClick={() => onModify(30)}
              className="bg-slate-900/80 hover:bg-slate-800 border border-slate-700/60 hover:border-cyan-500/40 text-cyan-400 font-mono text-xs font-bold min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl transition-all transform active:scale-95"
            >
              +30s
            </button>
          </div>
        )}
        <span className="text-lg font-mono font-extrabold text-cyan-400 bg-cyan-950/60 px-3 py-1 rounded-xl border border-cyan-900/40 mr-1">
          {formatTime(timer.secondsRemaining)}
        </span>
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="w-11 h-11 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-700/60 hover:border-rose-500/40 text-slate-400 hover:text-rose-400 flex items-center justify-center transition-all transform active:scale-95 flex-shrink-0"
            title="Dismiss Timer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
