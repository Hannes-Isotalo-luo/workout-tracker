import { Dumbbell, TrendingUp } from 'lucide-react';
import { useWorkout } from '../../context/WorkoutContext';

const TABS = [
  { id: 'select', label: 'Train', icon: Dumbbell, activeMatch: ['select', 'workout', 'builder'] },
  { id: 'progress', label: 'Progress', icon: TrendingUp, activeMatch: ['progress', 'history', 'analytics'] },
];

/** Fixed 2-tab bar. No confirm when leaving an active workout — the banner makes resuming obvious. */
export default function BottomNav() {
  const { currentView, activeSession, setView } = useWorkout();

  const handleTabClick = (tab) => {
    if (tab.id === 'select') {
      // Clicking Train while a workout is running resumes it rather than going to Home.
      setView(activeSession && currentView !== 'workout' ? 'workout' : 'select');
    } else {
      setView(tab.id);
    }
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-surf-nav border-t border-line-sub safe-area-pb">
      <div className="flex max-w-lg mx-auto relative">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = tab.activeMatch.includes(currentView);
          return (
            <button
              key={tab.id}
              id={`tab-${tab.id}`}
              onClick={() => handleTabClick(tab)}
              className={`flex-1 flex flex-col items-center gap-1 py-3 relative transition-all duration-300 ease-out ${
                isActive ? 'text-accent' : 'text-[#5b6678] active:text-[#8b96a8]'
              }`}
              aria-label={tab.label}
              aria-selected={isActive}
              role="tab"
            >
              <Icon className={`w-5 h-5 transition-transform duration-300 ${isActive ? 'scale-110' : ''}`} strokeWidth={isActive ? 2.5 : 1.8} />
              <span className={`text-[11px] font-semibold tracking-wide ${isActive ? 'text-accent' : 'text-[#5b6678]'}`}>
                {tab.label}
              </span>
              {isActive && (
                <span className="absolute -top-px left-1/2 -translate-x-1/2 w-10 h-[3px] bg-accent rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
