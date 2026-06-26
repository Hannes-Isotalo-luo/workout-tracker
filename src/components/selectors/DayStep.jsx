import { useState } from 'react';
import { ArrowLeft, Play, ChevronDown } from 'lucide-react';
import { getDays, getExercises, getPhases } from '../../utils/csvParser';
import { useWorkout } from '../../context/WorkoutContext';

export function DayStep({ programData, selectedProgram, selectedPhase, initSession, selectProgram, selectPhase }) {
  const days = getDays(programData, selectedProgram, selectedPhase);
  const phases = getPhases(programData, selectedProgram);
  const { workoutHistory } = useWorkout();
  const [showPhaseMenu, setShowPhaseMenu] = useState(false);

  const getLastPerformedLabel = (dayName) => {
    if (!workoutHistory || workoutHistory.length === 0) return 'Never';
    const lastSession = [...workoutHistory]
      .reverse()
      .find(s => s.program === selectedProgram && s.phase === selectedPhase && s.day === dayName);
    if (!lastSession) return 'Never';
    const dateStr = lastSession.completedAt || lastSession.date;
    if (!dateStr) return 'Never';
    const completedDate = new Date(dateStr);
    const today = new Date();
    const cOnly = new Date(completedDate.getFullYear(), completedDate.getMonth(), completedDate.getDate());
    const tOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const diffDays = Math.round((tOnly - cOnly) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays > 1) return `${diffDays} days ago`;
    return 'Today';
  };

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Row: back button + phase toggle */}
      <div className="flex items-center justify-between">
        <button
          onClick={selectProgram}
          className="min-h-[44px] flex items-center gap-1.5 text-xs font-bold text-[#8b96a8] hover:text-[#d3dae4] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {selectedProgram}
        </button>

        {phases.length > 1 && (
          <div className="relative">
            <button
              onClick={() => setShowPhaseMenu(!showPhaseMenu)}
              className="flex items-center gap-1 text-[10px] font-black text-accent uppercase tracking-wider bg-accent/10 border border-accent/25 px-2.5 py-1.5 rounded-[9px] hover:bg-accent/20 transition-colors min-h-[36px]"
            >
              {selectedPhase}
              <ChevronDown className={`w-3 h-3 transition-transform ${showPhaseMenu ? 'rotate-180' : ''}`} />
            </button>
            {showPhaseMenu && (
              <div className="absolute right-0 top-full mt-1.5 z-10 bg-surf border border-line-c rounded-[13px] shadow-xl overflow-hidden min-w-[130px]">
                {phases.map(p => (
                  <button
                    key={p}
                    onClick={() => { selectPhase(p); setShowPhaseMenu(false); }}
                    className={`w-full text-left px-3.5 py-2.5 text-xs font-bold transition-colors ${
                      p === selectedPhase
                        ? 'text-accent bg-accent/10'
                        : 'text-[#d3dae4] hover:bg-surf-hi'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="text-center py-1">
        <h2 className="text-xl font-black text-[#f8fafc] tracking-tight">Choose Session Day</h2>
        <p className="text-xs text-[#8b96a8] mt-1">Select today's layout to load movements, targets, and logs.</p>
      </div>

      <div className="grid grid-cols-1 gap-3.5">
        {days.map((day) => {
          const exercises = getExercises(programData, selectedProgram, selectedPhase, day);
          const lastPerformed = getLastPerformedLabel(day);

          return (
            <button
              key={day}
              onClick={() => initSession(day, exercises)}
              className="bg-surf border border-line-c rounded-[18px] p-4 text-left hover:border-accent/40 hover:bg-surf-hi transition-all duration-300 active:scale-[0.99] group relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-[3px] h-full bg-gain rounded-l-[18px] opacity-60 group-hover:opacity-100 transition-opacity" />

              <div className="flex items-start justify-between gap-4 pl-2">
                <div className="space-y-2">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h3 className="text-sm font-extrabold text-[#f8fafc] group-hover:text-accent transition-colors">
                      {day}
                    </h3>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      lastPerformed === 'Never'
                        ? 'bg-surf-chip border-line-c text-[#5b6678]'
                        : 'bg-gain/10 border-gain/20 text-gain-t'
                    }`}>
                      {lastPerformed}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    {exercises.slice(0, 3).map((ex, i) => (
                      <span
                        key={i}
                        className="text-[10px] font-bold bg-canvas border border-line-sub px-2 py-0.5 rounded text-[#8b96a8] truncate max-w-[110px]"
                      >
                        {ex.exercise}
                      </span>
                    ))}
                    {exercises.length > 3 && (
                      <span className="text-[10px] font-extrabold bg-canvas border border-line-sub px-1.5 py-0.5 rounded text-accent">
                        +{exercises.length - 3}
                      </span>
                    )}
                  </div>
                </div>

                <div className="w-8 h-8 rounded-xl bg-surf-chip border border-line-c flex items-center justify-center group-hover:bg-accent transition-all duration-300 flex-shrink-0 mt-0.5">
                  <Play className="w-3.5 h-3.5 text-[#5b6678] group-hover:text-white fill-current" />
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
