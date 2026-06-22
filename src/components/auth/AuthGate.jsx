import { Dumbbell, Cloud, Sparkles, BarChart3 } from 'lucide-react';

const FEATURES = [
  { icon: Cloud,     wrap: 'bg-accent/10 border-accent/20',   color: 'text-accent',  title: 'Instant Cloud Sync',        sub: 'Access workout splits across all devices' },
  { icon: Sparkles,  wrap: 'bg-gain/10 border-gain/20',       color: 'text-gain-t',  title: "Last Session's Reference",  sub: 'Instantly view weights & reps from last split' },
  { icon: BarChart3, wrap: 'bg-peak/10 border-peak/20',       color: 'text-peak',    title: 'Advanced Analytics',        sub: 'Visualize volume splits and calendar history' },
];

/** Sign-in gate shown to unauthenticated users. */
export default function AuthGate({ onLogin }) {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-canvas px-6 py-12 overflow-hidden select-none">
      <div className="absolute top-[-10%] right-[-10%] w-96 h-96 rounded-full bg-accent/8 blur-3xl animate-pulse" />
      <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 rounded-full bg-gain/5 blur-3xl" />

      <div className="w-full max-w-sm bg-surf border border-line-c rounded-[18px] p-8 shadow-2xl relative z-10 text-center animate-slideUp">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-accent/40 rounded-t-[18px]" />

        <div className="mx-auto w-16 h-16 rounded-2xl bg-accent flex items-center justify-center text-white mb-6 shadow-lg shadow-accent/25">
          <Dumbbell className="w-8 h-8 text-white" />
        </div>

        <h1 className="text-3xl font-black tracking-tight text-[#f8fafc] mb-2 leading-none">
          Workout Tracker
        </h1>
        <p className="text-sm font-semibold tracking-wide text-[#8b96a8] mb-8 max-w-[240px] mx-auto uppercase">
          Track your gains. Anywhere.
        </p>

        <div className="space-y-4 text-left bg-canvas border border-line-sub rounded-[13px] p-4 mb-8">
          {FEATURES.map(({ icon: Icon, wrap, color, title, sub }) => (
            <div key={title} className="flex items-center gap-3">
              <div className={`w-6 h-6 rounded-lg flex items-center justify-center border flex-shrink-0 ${wrap}`}>
                <Icon className={`w-3.5 h-3.5 ${color}`} />
              </div>
              <div className="text-xs">
                <p className="font-extrabold text-[#d3dae4] leading-tight">{title}</p>
                <p className="text-[10px] text-[#5b6678] font-bold">{sub}</p>
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={onLogin}
          className="w-full flex items-center justify-center gap-3 py-4 px-6 rounded-[13px] font-extrabold text-sm text-[#d3dae4] bg-surf-chip border border-line-c hover:border-accent/30 hover:bg-surf-hi transition-all duration-300 active:scale-[0.98] shadow-lg cursor-pointer"
        >
          <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
          </svg>
          <span>Sign in with Google</span>
        </button>

        <div className="mt-6 text-[10px] text-[#5b6678] font-semibold uppercase tracking-wider">
          Secure cloud authorization via Firebase
        </div>
      </div>
    </div>
  );
}
