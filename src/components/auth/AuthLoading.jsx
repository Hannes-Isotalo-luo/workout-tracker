import { Dumbbell } from 'lucide-react';

/** Full-screen branded loader shown while the auth state resolves. */
export default function AuthLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-canvas px-6 text-center animate-fadeIn">
      <div className="relative mb-6">
        <div className="absolute inset-0 rounded-full bg-accent/20 blur-xl animate-pulse" />
        <div className="relative w-16 h-16 rounded-2xl bg-accent flex items-center justify-center shadow-lg shadow-accent/25">
          <Dumbbell className="w-8 h-8 text-white animate-spin" />
        </div>
      </div>
      <h2 className="text-xl font-black tracking-tight text-[#f8fafc] mb-1">Securing Your Session</h2>
      <p className="text-xs text-[#8b96a8] max-w-[200px] tracking-wide font-medium">Resolving authentication state...</p>
    </div>
  );
}
