import Header from './Header';
import BottomNav from './BottomNav';

/** Layout frame: sticky header, scrollable centered main slot, fixed bottom nav. */
export default function AppShell({ onOpenSettings, children }) {
  return (
    <div className="flex-1 flex flex-col w-full">
      <Header onOpenSettings={onOpenSettings} />
      <div className="flex-1 flex flex-col max-w-lg mx-auto w-full px-4 py-6 pb-28">{children}</div>
      <BottomNav />
    </div>
  );
}
