import { Play, ArrowRight } from 'lucide-react';
import { useWorkout } from '../../context/WorkoutContext';

/**
 * "Resume active workout" banner shown on non-workout views when a session is
 * in progress. Self-contained — reads the active session from context.
 */
export default function ActiveWorkoutBanner() {
  const { activeSession, currentView, setView } = useWorkout();
  if (!activeSession || currentView === 'workout') return null;

  return (
    <div
      onClick={() => setView('workout')}
      className="bg-surf-hi border border-accent/30 border-l-[3px] border-l-accent rounded-[13px] p-3 cursor-pointer flex items-center justify-between"
    >
      <div className="flex items-center gap-3">
        <Play className="w-4 h-4 text-accent fill-current" />
        <span className="text-xs font-bold text-[#d3dae4]">Active Workout: {activeSession.day}</span>
      </div>
      <span className="text-[10px] font-black text-accent uppercase tracking-widest flex items-center gap-0.5">
        Resume <ArrowRight className="w-3.5 h-3.5" />
      </span>
    </div>
  );
}
