import { Activity } from 'lucide-react';

const ZONE_STYLES = {
  low: { bar: 'from-amber-500 to-orange-500', text: 'text-amber-400', label: 'below target' },
  optimal: { bar: 'from-emerald-500 to-teal-500', text: 'text-emerald-400', label: 'optimal' },
  high: { bar: 'from-rose-500 to-red-500', text: 'text-rose-400', label: 'high volume' },
};

/** Weekly hard-sets per muscle group vs. MEV/MRV landmarks (last 7 days). */
export default function MuscleVolumeCard({ muscleRows }) {
  return (
    <div className="glass-card p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
          <Activity className="w-4 h-4 text-emerald-400" />
          Weekly Volume by Muscle
        </h3>
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Last 7 days</span>
      </div>

      {muscleRows.length > 0 ? (
        <div className="space-y-3">
          {muscleRows.map(({ muscle, sets, zone, pct, landmark }) => {
            const style = ZONE_STYLES[zone];
            return (
              <div key={muscle} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-300">{muscle}</span>
                  <span className="font-bold text-slate-400">
                    {sets} <span className="text-slate-600">sets</span>
                    <span className={`ml-2 ${style.text} font-extrabold`}>{style.label}</span>
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700/60 relative">
                  <div className={`h-full bg-gradient-to-r ${style.bar} transition-all duration-500`} style={{ width: `${pct}%` }} />
                </div>
                <div className="text-[9px] text-slate-600 font-bold text-right">
                  target {landmark.mev}–{landmark.mrv} sets/wk
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="w-full flex flex-col items-center justify-center border border-dashed border-slate-800/80 rounded-2xl bg-slate-950/20 text-center p-6 select-none">
          <Activity className="w-8 h-8 text-slate-600 mb-2" />
          <h4 className="text-xs font-bold text-slate-400">No volume logged this week</h4>
          <p className="text-[10px] text-slate-500 mt-1 max-w-[200px] leading-tight">
            Complete a workout to see weekly sets per muscle group with optimal-range guidance.
          </p>
        </div>
      )}
    </div>
  );
}
