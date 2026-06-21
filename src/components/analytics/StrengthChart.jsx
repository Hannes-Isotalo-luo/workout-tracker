import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine } from 'recharts';
import { TrendingUp } from 'lucide-react';

const StrengthTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const labelText = payload[0].dataKey === 'oneRM' ? 'Est. 1RM' : 'Max Weight';
    return (
      <div className="bg-slate-800/95 border border-slate-700/80 px-3 py-2.5 rounded-xl shadow-xl backdrop-blur-md">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{label} Progress</p>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-violet-400" />
          <p className="text-sm font-extrabold text-white">
            {payload[0].value} <span className="text-xs font-normal text-slate-400">kg ({labelText})</span>
          </p>
        </div>
      </div>
    );
  }
  return null;
};

/**
 * Strength-progression line chart for the selected exercise + metric, with a
 * goal reference line. Unlocks at 2+ logged sessions; otherwise a hint.
 */
export default function StrengthChart({ data, metricKey, goal, onChartClick }) {
  const unlocked = data.length >= 2;

  return (
    <div className="h-[210px] w-full mt-2">
      {unlocked ? (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 10, left: -22, bottom: 0 }} onClick={onChartClick}>
            <CartesianGrid vertical={false} stroke="#1e293b" strokeDasharray="4" />
            <XAxis dataKey="week" stroke="#475569" fontSize={10} fontWeight={600} tickLine={false} axisLine={false} dy={6} />
            <YAxis
              stroke="#475569"
              fontSize={10}
              fontWeight={600}
              tickLine={false}
              axisLine={false}
              domain={[(dataMin) => Math.max(0, dataMin - 15), (dataMax) => dataMax + 15]}
              tickFormatter={(v) => `${v}`}
            />
            <Tooltip content={<StrengthTooltip />} cursor={{ stroke: '#334155', strokeWidth: 1.5, strokeDasharray: '3 3' }} />
            <ReferenceLine
              y={goal}
              stroke="#f43f5e"
              strokeDasharray="4 4"
              strokeWidth={1.5}
              label={{ value: `Goal: ${goal} kg`, fill: '#f43f5e', fontSize: 10, fontWeight: 'bold', position: 'top', offset: 4 }}
            />
            <Line
              type="monotone"
              dataKey={metricKey}
              stroke="#8b5cf6"
              strokeWidth={3}
              dot={{ r: 4.5, stroke: '#0f172a', strokeWidth: 2, fill: '#8b5cf6' }}
              activeDot={{ r: 7, stroke: '#0f172a', strokeWidth: 2.5, fill: '#c084fc' }}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-full w-full flex flex-col items-center justify-center border border-dashed border-slate-800/80 rounded-2xl bg-slate-950/20 text-center p-6 select-none">
          <TrendingUp className="w-8 h-8 text-slate-600 mb-2 animate-pulse" />
          <h4 className="text-xs font-bold text-slate-400">Progression Chart Locked</h4>
          <p className="text-[10px] text-slate-500 mt-1 max-w-[200px] leading-tight">
            Log at least 2 workout sessions with this exercise to unlock strength progression charts!
          </p>
        </div>
      )}
    </div>
  );
}
