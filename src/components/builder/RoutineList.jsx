import { Plus, Trash2, Share2, Sparkles, Play } from 'lucide-react';

const routineHasExercises = (routine) =>
  (routine.phases || []).some((p) => (p.days || []).some((d) => (d.exercises || []).length > 0));

/** "My Routines" list: create/start/share/edit/delete each saved custom routine. */
export default function RoutineList({ routines, shareLink, onCreateNew, onStart, onShare, onEdit, onDelete }) {
  return (
    <div className="space-y-6 bg-canvas text-[#f8fafc] min-h-screen pb-24 p-4">
      <div className="flex items-center justify-between mb-2 mt-4">
        <h1 className="text-2xl font-black text-[#f8fafc]" style={{ letterSpacing: '-0.02em' }}>My Routines</h1>
        <button
          onClick={onCreateNew}
          className="p-2 rounded-full bg-accent text-white hover:bg-accent/90 transition-colors shadow-lg shadow-accent/20"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {shareLink && (
        <div className="p-4 bg-gain/10 border border-gain/30 rounded-[18px] animate-fadeIn">
          <p className="text-xs text-gain-t font-bold mb-2 flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> Share Link Generated!
          </p>
          <input
            type="text"
            readOnly
            value={shareLink}
            className="w-full bg-canvas border border-gain/30 rounded-[11px] p-2 text-[10px] text-[#d3dae4] outline-none"
            onClick={(e) => e.target.select()}
          />
        </div>
      )}

      {routines.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center border-[1.5px] border-dashed border-line-c rounded-[18px] mt-8">
          <Sparkles className="w-10 h-10 text-[#3a4558] mb-3" />
          <p className="text-[#8b96a8] font-bold text-sm">No custom routines yet.</p>
          <p className="text-[10px] text-[#5b6678] mt-1">Tap + to build your own workout plan.</p>
        </div>
      ) : (
        <div className="space-y-3 mt-4">
          {routines.map((routine) => (
            <div key={routine.id} className="bg-surf border border-line-c rounded-[18px] p-4 flex items-center justify-between">
              <div className="min-w-0">
                <h3 className="font-bold text-sm text-[#f8fafc] truncate">{routine.name}</h3>
                <p className="text-[10px] text-[#8b96a8] mt-0.5">
                  {routine.phases.length} Phases • {routine.phases.reduce((acc, p) => acc + p.days.length, 0)} Days
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {routineHasExercises(routine) && (
                  <button
                    onClick={() => onStart(routine)}
                    title="Start workout from this routine"
                    className="flex items-center gap-1 px-3 py-1.5 bg-accent hover:bg-accent/90 rounded-[11px] text-white text-xs font-bold transition-colors"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" /> Start
                  </button>
                )}
                <button
                  onClick={() => onShare(routine)}
                  className="p-2 bg-surf-chip rounded-[11px] text-gain-t hover:bg-surf-hi transition-colors border border-line-c"
                  title="Share"
                >
                  <Share2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onEdit(routine)}
                  className="px-3 py-1.5 bg-accent/10 rounded-[11px] text-accent hover:bg-accent/20 text-xs font-bold transition-colors border border-accent/20"
                >
                  Edit
                </button>
                <button
                  onClick={() => onDelete(routine.id)}
                  className="p-2 bg-surf-chip rounded-[11px] text-rose-400 hover:bg-surf-hi transition-colors border border-line-c"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
