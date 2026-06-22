import React from 'react';
import { X, Calendar, Dumbbell } from 'lucide-react';
import { useWorkout } from '../../context/WorkoutContext';
import Modal from '../ui/Modal';

export default function ExerciseHistoryModal({ exerciseName, onClose }) {
  const { workoutHistory } = useWorkout();

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

  historyList.sort((a, b) => b.date - a.date);

  return (
    <Modal onClose={onClose} anchorBottom maxWidth="max-w-md" borderClass="border-accent/30" panelClass="max-h-[80vh] flex flex-col" showClose={false}>
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-accent/40 rounded-t-[18px]" />

        <div className="flex items-start justify-between pb-3 border-b border-line-sub">
          <div>
            <span className="text-[9px] font-black text-accent uppercase tracking-widest block">EXERCISE HISTORY</span>
            <h3 className="text-base font-black text-[#f8fafc] tracking-tight mt-0.5">{exerciseName}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg bg-surf-chip hover:bg-surf-hi text-[#8b96a8] hover:text-white transition-colors cursor-pointer border border-line-c"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-4 pr-1 space-y-4">
          {historyList.length > 0 ? (
            <div className="relative pl-4 border-l-2 border-line-sub space-y-5">
              {historyList.map((item) => (
                <div key={item.id} className="relative group">
                  <div className="absolute -left-[23px] top-1.5 w-3 h-3 rounded-full bg-surf border-2 border-accent group-hover:bg-accent transition-colors shadow-md shadow-accent/20" />

                  <div className="bg-surf border border-line-c rounded-[13px] p-3.5 hover:border-line-hi transition-colors space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-[#8b96a8] font-extrabold flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-[#5b6678]" />
                        {item.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      <span className="text-[9px] font-black bg-accent/10 text-accent px-1.5 py-0.5 rounded border border-accent/20">
                        {item.program}
                      </span>
                    </div>

                    <p className="text-xs font-bold text-[#d3dae4] leading-tight">{item.day}</p>

                    <div className="grid grid-cols-2 gap-1.5 pt-1.5 border-t border-line-sub">
                      {item.sets.map((set) => (
                        <div key={set.setNumber} className="flex justify-between bg-canvas px-2 py-1.5 rounded border border-line-sub text-[9px] font-mono">
                          <span className="text-[#5b6678] font-bold">SET {set.setNumber}</span>
                          <span className="font-extrabold text-[#d3dae4]">
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
            <div className="flex flex-col items-center justify-center p-8 text-center bg-canvas border border-line-sub rounded-[18px] min-h-[180px] select-none">
              <Dumbbell className="w-8 h-8 text-[#3a4558] mb-2 animate-pulse" />
              <h4 className="text-xs font-bold text-[#8b96a8]">No Exercise Logs</h4>
              <p className="text-[10px] text-[#5b6678] mt-1 max-w-[200px] leading-tight">
                No completed logs found for this exercise. Make sure to complete and save sets in your active session!
              </p>
            </div>
          )}
        </div>

        <div className="pt-3 border-t border-line-sub flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-surf-chip hover:bg-surf-hi text-[#d3dae4] hover:text-white rounded-[11px] font-bold text-xs cursor-pointer active:scale-95 transition-all border border-line-c"
          >
            Close
          </button>
        </div>
    </Modal>
  );
}
