import { memo } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine } from 'recharts';
import { TrendingUp } from 'lucide-react';

const StrengthTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const labelText = payload[0].dataKey === 'oneRM' ? 'Est. 1RM' : 'Max Weight';
    return (
      <div className="bg-surf border border-line-c px-3 py-2.5 rounded-[13px] shadow-xl">
        <p className="text-[10px] font-bold text-[#5b6678] uppercase tracking-wider mb-1">{label} Progress</p>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-accent" />
          <p className="text-sm font-extrabold text-[#f8fafc]">
            {payload[0].value} <span className="text-xs font-normal text-[#8b96a8]">kg ({labelText})</span>
          </p>
        </div>
      </div>
    );
  }
  return null;
};

/**
 * Strength-progression line chart for the selected exercise + metric.
 * Line uses accent violet (#6d5cf0); goal reference uses amber (#e0a93b).
 */
function StrengthChart({ data, metricKey, goal, onChartClick }) {
  const unlocked = data.length >= 2;

  return (
    <div className="h-[210px] w-full mt-2">
      {unlocked ? (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 10, left: -22, bottom: 0 }} onClick={onChartClick}>
            <CartesianGrid vertical={false} stroke="#1d2738" strokeDasharray="4" />
            <XAxis dataKey="week" stroke="#5b6678" fontSize={10} fontWeight={600} tickLine={false} axisLine={false} dy={6} />
            <YAxis
              stroke="#5b6678"
              fontSize={10}
              fontWeight={600}
              tickLine={false}
              axisLine={false}
              domain={[(dataMin) => Math.max(0, dataMin - 15), (dataMax) => dataMax + 15]}
              tickFormatter={(v) => `${v}`}
            />
            <Tooltip content={<StrengthTooltip />} cursor={{ stroke: '#2e3a52', strokeWidth: 1.5, strokeDasharray: '3 3' }} />
            <ReferenceLine
              y={goal}
              stroke="#e0a93b"
              strokeDasharray="4 4"
              strokeWidth={1.5}
              label={{ value: `Goal: ${goal} kg`, fill: '#e0a93b', fontSize: 10, fontWeight: 'bold', position: 'top', offset: 4 }}
            />
            <Line
              type="monotone"
              dataKey={metricKey}
              stroke="#6d5cf0"
              strokeWidth={3}
              dot={{ r: 4.5, stroke: '#101725', strokeWidth: 2, fill: '#6d5cf0' }}
              activeDot={{ r: 7, stroke: '#101725', strokeWidth: 2.5, fill: '#6d5cf0' }}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-full w-full flex flex-col items-center justify-center border border-dashed border-line-sub rounded-[18px] bg-canvas text-center p-6 select-none">
          <TrendingUp className="w-8 h-8 text-[#3a4558] mb-2 animate-pulse" />
          <h4 className="text-xs font-bold text-[#8b96a8]">Progression Chart Locked</h4>
          <p className="text-[10px] text-[#5b6678] mt-1 max-w-[200px] leading-tight">
            Log at least 2 workout sessions with this exercise to unlock strength progression charts!
          </p>
        </div>
      )}
    </div>
  );
}

export default memo(StrengthChart);
