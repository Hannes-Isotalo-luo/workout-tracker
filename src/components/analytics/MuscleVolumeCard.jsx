import { Activity } from 'lucide-react';

// low=amber, optimal=green, high=rose (danger state stays rose per existing semantics)
const ZONE_STYLES = {
  low:     { barColor: '#e0a93b', text: 'text-peak',   label: 'below target' },
  optimal: { barColor: '#2faa78', text: 'text-gain-t', label: 'optimal' },
  high:    { barColor: '#f43f5e', text: 'text-rose-400', label: 'high volume' },
};

/** Weekly hard-sets per muscle group vs. MEV/MRV landmarks (last 7 days). */
export default function MuscleVolumeCard({ muscleRows }) {
  return (
    <div className="glass-card p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-[#d3dae4] flex items-center gap-1.5">
          <Activity className="w-4 h-4 text-gain-t" />
          Weekly Volume by Muscle
        </h3>
        <span className="text-[10px] font-bold text-[#5b6678] uppercase tracking-wider">Last 7 days</span>
      </div>

      {muscleRows.length > 0 ? (
        <div className="space-y-3">
          {muscleRows.map(({ muscle, sets, zone, pct, landmark }) => {
            const style = ZONE_STYLES[zone];
            return (
              <div key={muscle} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[#d3dae4]">{muscle}</span>
                  <span className="font-bold text-[#8b96a8]">
                    {sets} <span className="text-[#3a4558]">sets</span>
                    <span className={`ml-2 ${style.text} font-extrabold`}>{style.label}</span>
                  </span>
                </div>
                <div className="w-full h-2 bg-line-sub rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, backgroundColor: style.barColor }}
                  />
                </div>
                <div className="text-[9px] text-[#3a4558] font-bold text-right">
                  target {landmark.mev}–{landmark.mrv} sets/wk
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="w-full flex flex-col items-center justify-center border border-dashed border-line-sub rounded-[18px] bg-canvas text-center p-6 select-none">
          <Activity className="w-8 h-8 text-[#3a4558] mb-2" />
          <h4 className="text-xs font-bold text-[#8b96a8]">No volume logged this week</h4>
          <p className="text-[10px] text-[#5b6678] mt-1 max-w-[200px] leading-tight">
            Complete a workout to see weekly sets per muscle group with optimal-range guidance.
          </p>
        </div>
      )}
    </div>
  );
}
