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
      className="glass-card p-3 border-violet-500/35 bg-violet-950/20 hover:bg-violet-950/30 transition-all cursor-pointer flex items-center justify-between animate-pulse"
    >
      <div className="flex items-center gap-3">
        <Play className="w-4 h-4 text-violet-400 fill-current" />
        <span className="text-xs font-bold text-violet-300">Active Workout: {activeSession.day}</span>
      </div>
      <span className="text-[10px] font-black text-violet-400 uppercase tracking-widest flex items-center gap-0.5">
        Resume <ArrowRight className="w-3.5 h-3.5" />
      </span>
    </div>
  );
}
