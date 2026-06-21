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
    <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800/60">
      <div className="flex items-center justify-between max-w-lg mx-auto px-4 py-3">
        <h1 className="text-lg font-extrabold tracking-tight">
          <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent">
            Workout Tracker
          </span>
        </h1>
        <div className="flex items-center gap-2">
          {syncStatus !== 'idle' && (
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-xl border transition-all ${
                syncStatus === 'syncing'
                  ? 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400'
                  : syncStatus === 'synced'
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
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
            <div className="flex items-center gap-2 bg-slate-950/20 border border-slate-800/30 rounded-xl pl-2.5 pr-1 py-1">
              <div className="hidden sm:flex flex-col items-end mr-0.5">
                <span className="text-[10px] font-black text-slate-200 leading-none">
                  {user.displayName || user.email?.split('@')[0]}
                </span>
                <span className="text-[8px] font-bold text-emerald-400 tracking-wider uppercase mt-0.5 animate-pulse">
                  Cloud Synced
                </span>
              </div>
              <div
                className="w-7 h-7 rounded-lg bg-gradient-to-tr from-violet-600 to-fuchsia-600 flex items-center justify-center text-[10px] font-black text-white shadow border border-violet-400/25 relative group"
                title={`Signed in as: ${user.displayName || user.email} (${user.email})`}
              >
                <div className="absolute inset-0 rounded-lg bg-gradient-to-tr from-violet-500 to-fuchsia-500 opacity-0 group-hover:opacity-20 blur transition-opacity duration-300" />
                {initials}
              </div>
              <button
                type="button"
                onClick={logout}
                className="px-2.5 py-1.5 rounded-xl text-[10px] font-bold bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-rose-400 border border-slate-800 transition-all active:scale-95 transform"
              >
                Sign Out
              </button>
            </div>
          )}
          <button
            type="button"
            onClick={onOpenSettings}
            className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-400 hover:text-slate-100 transition-all flex items-center justify-center active:scale-95 transform"
            title="Open Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
