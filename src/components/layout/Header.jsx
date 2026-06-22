import { Settings, Cloud, CloudOff, Loader2 } from 'lucide-react';
import { useWorkout } from '../../context/WorkoutContext';

/** Sticky app header: title, cloud-sync indicator, user chip, settings button. */
export default function Header({ onOpenSettings }) {
  const { user, syncStatus, logout } = useWorkout();

  const initials = (() => {
    const name = user?.displayName || user?.email || '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  })();

  return (
    <header className="sticky top-0 z-50 bg-surf-nav border-b border-line-sub">
      <div className="flex items-center justify-between max-w-lg mx-auto px-4 py-3">
        <h1 className="text-lg font-bold tracking-tight text-[#f8fafc]">
          Workout Tracker
        </h1>
        <div className="flex items-center gap-2">
          {syncStatus !== 'idle' && (
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-xl border transition-all ${
                syncStatus === 'syncing'
                  ? 'bg-accent/10 border-accent/20 text-accent'
                  : syncStatus === 'synced'
                  ? 'bg-gain/10 border-gain/20 text-gain-t'
                  : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
              }`}
              title={
                syncStatus === 'syncing'
                  ? 'Syncing with cloud...'
                  : syncStatus === 'synced'
                  ? 'Cloud sync active & up to date'
                  : 'Cloud sync error'
              }
            >
              {syncStatus === 'syncing' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : syncStatus === 'synced' ? (
                <Cloud className="w-4 h-4 fill-current opacity-85" />
              ) : (
                <CloudOff className="w-4 h-4" />
              )}
            </div>
          )}

          {user && (
            <div className="flex items-center gap-2 bg-surf border border-line-c rounded-xl pl-2.5 pr-1 py-1">
              <div className="hidden sm:flex flex-col items-end mr-0.5">
                <span className="text-[10px] font-black text-[#f8fafc] leading-none">
                  {user.displayName || user.email?.split('@')[0]}
                </span>
                <span className="text-[8px] font-bold text-gain-t tracking-wider uppercase mt-0.5">
                  Cloud Synced
                </span>
              </div>
              <div
                className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center text-[10px] font-black text-white shadow border border-accent/25"
                title={`Signed in as: ${user.displayName || user.email} (${user.email})`}
              >
                {initials}
              </div>
              <button
                type="button"
                onClick={logout}
                className="px-2.5 py-1.5 rounded-xl text-[10px] font-bold bg-surf-chip hover:bg-surf-hi text-[#8b96a8] hover:text-rose-400 border border-line-c transition-all active:scale-95 transform"
              >
                Sign Out
              </button>
            </div>
          )}
          <button
            type="button"
            onClick={onOpenSettings}
            className="w-9 h-9 rounded-xl bg-surf-chip hover:bg-surf-hi border border-line-c text-[#8b96a8] hover:text-[#f8fafc] transition-all flex items-center justify-center active:scale-95 transform"
            title="Open Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
