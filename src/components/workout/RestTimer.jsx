import { Clock, X } from 'lucide-react';
import { formatTime } from '../../utils/formatters';

/**
 * Floating rest-timer overlay shown during the active workout.
 * Uses violet (accent) for the active/in-progress state.
 */
export default function RestTimer({ timer, onModify, onDismiss }) {
  if (!timer || !timer.active) return null;

  return (
    <div className="fixed bottom-24 left-4 right-4 z-50 bg-canvas border border-accent/30 rounded-[18px] p-3 shadow-xl flex items-center justify-between animate-slideUp">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/25 flex items-center justify-center">
          <Clock className="w-4 h-4 text-accent animate-spin" style={{ animationDuration: '4s' }} />
        </div>
        <div>
          <span className="text-xs font-bold text-[#5b6678] block leading-tight">RESTING ({timer.exerciseName})</span>
          <span className="text-xs font-semibold text-[#8b96a8]">Prepare for next set</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {onModify && (
          <div className="flex gap-1.5 mr-1">
            <button
              type="button"
              onClick={() => onModify(-30)}
              className="bg-surf-chip hover:bg-surf-hi border border-line-c hover:border-accent/40 text-accent font-mono text-xs font-bold min-w-[44px] min-h-[44px] flex items-center justify-center rounded-[11px] transition-all active:scale-95"
            >
              -30s
            </button>
            <button
              type="button"
              onClick={() => onModify(30)}
              className="bg-surf-chip hover:bg-surf-hi border border-line-c hover:border-accent/40 text-accent font-mono text-xs font-bold min-w-[44px] min-h-[44px] flex items-center justify-center rounded-[11px] transition-all active:scale-95"
            >
              +30s
            </button>
          </div>
        )}
        <span className="text-lg font-mono font-extrabold text-accent bg-accent/10 px-3 py-1 rounded-[11px] border border-accent/20 mr-1">
          {formatTime(timer.secondsRemaining)}
        </span>
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="w-11 h-11 rounded-lg bg-surf-chip hover:bg-surf-hi border border-line-c hover:border-rose-500/40 text-[#8b96a8] hover:text-rose-400 flex items-center justify-center transition-all active:scale-95 flex-shrink-0"
            title="Dismiss Timer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
