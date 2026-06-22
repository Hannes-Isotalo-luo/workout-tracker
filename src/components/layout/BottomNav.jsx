import { Dumbbell, Plus, BarChart3, Calendar } from 'lucide-react';
import { useWorkout } from '../../context/WorkoutContext';

const TABS = [
  { id: 'select', label: 'Workout', icon: Dumbbell, activeMatch: ['select', 'workout'] },
  { id: 'builder', label: 'Builder', icon: Plus, activeMatch: ['builder'] },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, activeMatch: ['analytics'] },
  { id: 'history', label: 'History', icon: Calendar, activeMatch: ['history'] },
];

/** Fixed bottom tab bar. Guards leaving an active workout for other tabs. */
export default function BottomNav() {
  const { currentView, activeSession, setView } = useWorkout();

  const handleTabClick = (tab) => {
    if ((tab.id === 'history' || tab.id === 'analytics') && currentView === 'workout' && activeSession) {
      if (!window.confirm(`You have an active workout in progress. Your session will be preserved in the background. Proceed to ${tab.label}?`)) {
        return;
      }
    }
    if (tab.id === 'select' && activeSession) setView('workout');
    else setView(tab.id);
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
