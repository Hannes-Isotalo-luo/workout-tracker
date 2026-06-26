import Header from './Header';
import BottomNav from './BottomNav';
import ActiveWorkoutBanner from './ActiveWorkoutBanner';

/** Layout frame: sticky header, scrollable centered main, resume banner pinned above nav. */
export default function AppShell({ onOpenSettings, children }) {
  return (
    <div className="flex-1 flex flex-col w-full">
      <Header onOpenSettings={onOpenSettings} />
      {/* pb-40 clears the fixed nav (~64px) + optional resume banner (~56px) + breathing room */}
      <div className="flex-1 flex flex-col max-w-lg mx-auto w-full px-4 py-6 pb-40">{children}</div>
      {/* Resume banner — pinned above the tab bar on every tab when a session is active */}
      <div className="fixed inset-x-0 bottom-16 z-40 pointer-events-none">
        <div className="max-w-lg mx-auto px-4 pointer-events-auto">
          <ActiveWorkoutBanner />
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
