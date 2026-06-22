import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { TrendingUp } from 'lucide-react';

const VolumeTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-surf border border-line-c px-3 py-2.5 rounded-[13px] shadow-xl">
        <p className="text-[10px] font-bold text-[#5b6678] uppercase tracking-wider mb-1">Week of {label}</p>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-gain" />
          <p className="text-sm font-extrabold text-[#f8fafc]">
            {payload[0].value.toLocaleString()} <span className="text-xs font-normal text-[#8b96a8]">kg</span>
          </p>
        </div>
      </div>
    );
  }
  return null;
};

/** Week-over-week total training volume line chart. Uses gain green for volume data. */
export default function VolumeChart({ data }) {
  return (
    <div className="h-[210px] w-full mt-2">
      {data.length >= 1 ? (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 10, left: -22, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="#1d2738" strokeDasharray="4" />
            <XAxis dataKey="week" stroke="#5b6678" fontSize={10} fontWeight={600} tickLine={false} axisLine={false} dy={6} />
            <YAxis
              stroke="#5b6678"
              fontSize={10}
              fontWeight={600}
              tickLine={false}
              axisLine={false}
              domain={[(dataMin) => Math.max(0, dataMin - 1000), (dataMax) => dataMax + 1000]}
              tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v)}
            />
            <Tooltip content={<VolumeTooltip />} cursor={{ stroke: '#2e3a52', strokeWidth: 1.5, strokeDasharray: '3 3' }} />
            <Line
              type="monotone"
              dataKey="volume"
              stroke="#2faa78"
              strokeWidth={3}
              dot={{ r: 4.5, stroke: '#101725', strokeWidth: 2, fill: '#2faa78' }}
              activeDot={{ r: 7, stroke: '#101725', strokeWidth: 2.5, fill: '#5cc99a' }}
            />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-full w-full flex flex-col items-center justify-center border border-dashed border-line-sub rounded-[18px] bg-canvas text-center p-6 select-none">
          <TrendingUp className="w-8 h-8 text-[#3a4558] mb-2 animate-pulse" />
          <h4 className="text-xs font-bold text-[#8b96a8]">Volume Chart Locked</h4>
          <p className="text-[10px] text-[#5b6678] mt-1 max-w-[200px] leading-tight">
            Complete at least one workout session to see weekly training volume!
          </p>
        </div>
      )}
    </div>
  );
}
