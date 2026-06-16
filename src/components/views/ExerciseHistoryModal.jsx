import React from 'react';
import { X, Calendar, Dumbbell } from 'lucide-react';
import { useWorkout } from '../../context/WorkoutContext';

export default function ExerciseHistoryModal({ exerciseName, onClose }) {
  const { workoutHistory } = useWorkout();

  // Find all history instances of this exercise
  const historyList = [];
  workoutHistory?.forEach(session => {
    const log = session.logs?.find(l => l.exerciseName === exerciseName);
    if (log) {
      const completedSets = log.sets?.filter(s => s.isComplete) || [];
      if (completedSets.length > 0) {
        historyList.push({
          id: session.id || Math.random().toString(),
          date: new Date(session.completedAt || session.date),
          day: session.day,
          program: session.program,
          sets: completedSets
        });
      }
    }
  });

  // Sort descending (most recent first)
  historyList.sort((a, b) => b.date - a.date);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      {/* Backdrop click close */}
      <div className="absolute inset-0 cursor-default" onClick={onClose} />
      
      <div className="w-full max-w-md glass-card border-violet-500/30 bg-slate-900 p-5 shadow-2xl relative z-10 transform transition-all duration-300 animate-slideUp max-h-[80vh] flex flex-col">
        {/* Top highlighted border accent */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-violet-500/50 via-fuchsia-500/50 to-transparent" />

        {/* Modal Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-800">
          <div>
            <span className="text-[9px] font-black text-violet-400 uppercase tracking-widest block">EXERCISE HISTORY</span>
            <h3 className="text-base font-black text-slate-100 tracking-tight mt-0.5">{exerciseName}</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Timeline */}
        <div className="flex-1 overflow-y-auto py-4 pr-1 space-y-4 custom-scrollbar">
          {historyList.length > 0 ? (
            <div className="relative pl-4 border-l-2 border-slate-800 space-y-5">
              {historyList.map((item) => (
                <div key={item.id} className="relative group">
                  {/* Timeline point */}
                  <div className="absolute -left-[23px] top-1.5 w-3 h-3 rounded-full bg-slate-850 border-2 border-violet-500 group-hover:bg-violet-400 transition-colors shadow-md shadow-violet-500/20" />
                  
                  <div className="glass-card bg-slate-900/40 p-3.5 border-slate-800/80 hover:border-slate-700/60 transition-colors space-y-2">
                    {/* Header info */}
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-400 font-extrabold flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-500" />
                        {item.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      <span className="text-[9px] font-black bg-violet-500/10 text-violet-300 px-1.5 py-0.5 rounded border border-violet-500/20">
                        {item.program}
                      </span>
                    </div>

                    <p className="text-xs font-bold text-slate-300 leading-tight">
                      {item.day}
                    </p>

                    {/* Sets mapping */}
                    <div className="grid grid-cols-2 gap-1.5 pt-1.5 border-t border-slate-850/60">
                      {item.sets.map((set) => (
                        <div key={set.setNumber} className="flex justify-between bg-slate-950/40 px-2 py-1.5 rounded border border-slate-900/60 text-[9px] font-mono">
                          <span className="text-slate-500 font-bold">SET {set.setNumber}</span>
                          <span className="font-extrabold text-slate-300">
                            {set.weight || '—'} kg × {set.repsCompleted || '—'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-8 text-center bg-slate-950/20 border border-slate-900/60 rounded-2xl min-h-[180px] select-none">
              <Dumbbell className="w-8 h-8 text-slate-700 mb-2 animate-pulse" />
              <h4 className="text-xs font-bold text-slate-450">No Exercise Logs</h4>
              <p className="text-[10px] text-slate-500 mt-1 max-w-[200px] leading-tight">
                No completed logs found for this exercise. Make sure to complete and save sets in your active session!
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="pt-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white rounded-xl font-bold text-xs cursor-pointer active:scale-95 transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
