import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { TrendingUp } from 'lucide-react';

const VolumeTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-800/95 border border-slate-700/80 px-3 py-2.5 rounded-xl shadow-xl backdrop-blur-md">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Week of {label}</p>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-cyan-400" />
          <p className="text-sm font-extrabold text-white">
            {payload[0].value.toLocaleString()} <span className="text-xs font-normal text-slate-400">kg</span>
          </p>
        </div>
      </div>
    );
  }
  return null;
};

/** Week-over-week total training volume line chart. */
export default function VolumeChart({ data }) {
  return (
    <div className="h-[210px] w-full mt-2">
      {data.length >= 1 ? (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 10, left: -22, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="#1e293b" strokeDasharray="4" />
            <XAxis dataKey="week" stroke="#475569" fontSize={10} fontWeight={600} tickLine={false} axisLine={false} dy={6} />
            <YAxis
              stroke="#475569"
              fontSize={10}
              fontWeight={600}
              tickLine={false}
              axisLine={false}
              domain={[(dataMin) => Math.max(0, dataMin - 1000), (dataMax) => dataMax + 1000]}
              tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v)}
            />
            <Tooltip content={<VolumeTooltip />} cursor={{ stroke: '#334155', strokeWidth: 1.5, strokeDasharray: '3 3' }} />
            <Line
              type="monotone"
              dataKey="volume"
              stroke="#06b6d4"
              strokeWidth={3}
              dot={{ r: 4.5, stroke: '#0f172a', strokeWidth: 2, fill: '#06b6d4' }}
              activeDot={{ r: 7, stroke: '#0f172a', strokeWidth: 2.5, fill: '#22d3ee' }}
            />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-full w-full flex flex-col items-center justify-center border border-dashed border-slate-800/80 rounded-2xl bg-slate-950/20 text-center p-6 select-none">
          <TrendingUp className="w-8 h-8 text-slate-600 mb-2 animate-pulse" />
          <h4 className="text-xs font-bold text-slate-400">Volume Chart Locked</h4>
          <p className="text-[10px] text-slate-500 mt-1 max-w-[200px] leading-tight">
            Complete at least one workout session to see weekly training volume!
          </p>
        </div>
      )}
    </div>
  );
}
