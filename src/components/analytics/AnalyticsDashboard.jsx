import { useState, useEffect, useCallback } from 'react';
import { Dumbbell, TrendingUp, Flame, Calendar, Award, Activity, ArrowUpRight } from 'lucide-react';
import { useWorkout } from '../../context/WorkoutContext';
import StrengthChart from './StrengthChart';
import VolumeChart from './VolumeChart';
import MuscleVolumeCard from './MuscleVolumeCard';
import RecentSessions from './RecentSessions';
import ExerciseHistoryModal from '../history/ExerciseHistoryModal';
import { useAnalyticsData } from './useAnalyticsData';

function StatCardsRow({ totalSessionsCount, sessionsBadge, displayVolumeStr, displayStreakStr, hasHistory }) {
  const statCards = [
    {
      label: 'Sessions',
      value: totalSessionsCount,
      badge: sessionsBadge,
      icon: Dumbbell,
      iconWrap: 'bg-accent/10',
      iconColor: 'text-accent',
      badgeColor: 'text-gain-t',
    },
    {
      label: 'Volume',
      value: displayVolumeStr,
      badge: hasHistory ? 'Live Volume' : '0 kg',
      icon: TrendingUp,
      iconWrap: 'bg-gain/10',
      iconColor: 'text-gain-t',
      badgeColor: 'text-gain-t',
    },
    {
      label: 'Streak',
      value: displayStreakStr,
      badge: hasHistory ? 'Current Streak' : 'Consistency',
      icon: Flame,
      iconWrap: 'bg-peak/10',
      iconColor: 'text-peak',
      badgeColor: 'text-peak',
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-2.5">
      {statCards.map(({ label, value, badge, icon: Icon, iconWrap, iconColor, badgeColor }) => (
        <div key={label} className="glass-card p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-[#5b6678] uppercase tracking-wider">{label}</span>
            <div className={`w-7 h-7 rounded-lg ${iconWrap} flex items-center justify-center`}>
              <Icon className={`w-4 h-4 ${iconColor}`} />
            </div>
          </div>
          <div>
            <p className="text-xl font-black text-[#f8fafc] tracking-tight">{value}</p>
            <p className={`text-[10px] ${badgeColor} font-semibold flex items-center gap-0.5 mt-0.5`}>
              {label !== 'Streak' && <ArrowUpRight className="w-2.5 h-2.5" />} {badge}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AnalyticsDashboard({ minimal = false }) {
  const { workoutHistory, customGoals, updateCustomGoal } = useWorkout();
  const [selectedExercise, setSelectedExercise] = useState('Back Squat');
  const [selectedExerciseForHistory, setSelectedExerciseForHistory] = useState(null);
  const [selectedMetric, setSelectedMetric] = useState('weight');
  const [activePointState, setActivePointState] = useState(null);

  const {
    dynamicExercises, currentData, weeklyData, activePoint, metricKey,
    currentWeight, progressWeight, progressPercent,
    hasHistory, totalSessionsCount, sessionsBadge, displayVolumeStr, displayStreakStr,
    displaySessions, muscleRows,
  } = useAnalyticsData({ workoutHistory, selectedExercise, selectedMetric, activePointState });

  useEffect(() => {
    if (!dynamicExercises.includes(selectedExercise)) setSelectedExercise(dynamicExercises[0]);
  }, [dynamicExercises, selectedExercise]);

  const currentGoal = customGoals[selectedExercise] || 0;

  const handleChartClick = useCallback((state) => {
    if (state?.activePayload?.length > 0) setActivePointState(state.activePayload[0].payload);
  }, []);

  return (
    <div className="space-y-6">
      {!minimal && (
        <>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-[#f8fafc] flex items-center gap-2">
              <Activity className="w-5 h-5 text-accent" />
              Strength Analytics
            </h2>
            <p className="text-xs text-[#8b96a8] mt-0.5">Real-time metrics, streaks, and strength progression.</p>
          </div>

          <StatCardsRow
            totalSessionsCount={totalSessionsCount}
            sessionsBadge={sessionsBadge}
            displayVolumeStr={displayVolumeStr}
            displayStreakStr={displayStreakStr}
            hasHistory={hasHistory}
          />
        </>
      )}

      {/* Strength progression */}
      <div className="glass-card p-4 space-y-4">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <h3
                onClick={() => setSelectedExerciseForHistory(selectedExercise)}
                className="text-sm font-bold text-[#d3dae4] hover:text-accent cursor-pointer flex items-center gap-1.5 transition-colors"
              >
                Strength: <span className="underline decoration-dotted decoration-accent">{selectedExercise}</span>
              </h3>
              <button
                type="button"
                onClick={() => setSelectedExerciseForHistory(selectedExercise)}
                className="p-1 rounded bg-surf-chip hover:bg-surf-hi text-[#8b96a8] hover:text-[#d3dae4] border border-line-c transition-colors flex items-center justify-center"
                title="View full exercise history"
              >
                <Calendar className="w-3.5 h-3.5 text-accent" />
              </button>
            </div>
            <div className="flex gap-1 bg-canvas p-0.5 rounded-xl border border-line-sub overflow-x-auto max-w-[150px] sm:max-w-none">
              {dynamicExercises.map((ex) => (
                <button
                  key={ex}
                  onClick={() => {
                    setSelectedExercise(ex);
                    setActivePointState(null);
                  }}
                  className={`min-h-[36px] px-3 py-2 text-[11px] font-extrabold rounded-[9px] transition-all duration-200 whitespace-nowrap flex-shrink-0 ${
                    selectedExercise === ex
                      ? 'bg-accent text-white shadow-md shadow-accent/20'
                      : 'text-[#8b96a8] hover:text-[#d3dae4]'
                  }`}
                >
                  {ex.split(' ').slice(-2).join(' ') || ex}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2.5 bg-canvas p-2.5 rounded-[13px] border border-line-sub">
            <div className="flex items-center justify-between pb-2 border-b border-line-sub">
              <span className="text-[10px] font-bold text-[#5b6678] uppercase tracking-wider">Chart Metric</span>
              <div className="flex bg-surf-chip p-0.5 rounded-[9px] border border-line-c">
                <button
                  onClick={() => setSelectedMetric('weight')}
                  className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-colors ${
                    selectedMetric === 'weight' ? 'bg-accent/20 text-accent' : 'text-[#5b6678] hover:text-[#d3dae4]'
                  }`}
                >
                  Max Weight
                </button>
                <button
                  onClick={() => setSelectedMetric('1rm')}
                  className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-colors ${
                    selectedMetric === '1rm' ? 'bg-accent/20 text-accent' : 'text-[#5b6678] hover:text-[#d3dae4]'
                  }`}
                >
                  Est. 1RM
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-[10px] font-bold text-[#5b6678] uppercase tracking-wider">Selected ({activePoint?.week || 'N/A'})</p>
                <p className="text-base font-black text-accent tracking-tight">
                  {currentWeight || 0} <span className="text-xs font-normal text-[#8b96a8]">kg</span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-[#5b6678] uppercase tracking-wider">
                  Progress ({currentData[0]?.week || 'N/A'} → {activePoint?.week || 'N/A'})
                </p>
                <p className={`text-base font-black tracking-tight ${progressWeight >= 0 ? 'text-gain-t' : 'text-rose-400'}`}>
                  {progressWeight >= 0 ? `+${progressWeight.toFixed(1)}` : progressWeight.toFixed(1)} kg{' '}
                  <span className="text-xs font-normal text-[#8b96a8]">
                    ({progressWeight >= 0 ? '+' : ''}{progressPercent}%)
                  </span>
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between bg-canvas p-2.5 rounded-[13px] border border-line-sub">
            <div className="flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-peak" />
              <span className="text-xs font-bold text-[#d3dae4]">Target Strength Goal:</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                inputMode="decimal"
                value={currentGoal}
                onChange={(e) => updateCustomGoal(selectedExercise, parseFloat(e.target.value) || 0)}
                className="w-16 bg-canvas text-[#f8fafc] text-xs font-black text-center py-1 px-1.5 rounded-[9px] border border-line-in focus:outline-none focus:border-accent/80 transition-colors"
              />
              <span className="text-[10px] text-[#8b96a8] font-bold">kg</span>
            </div>
          </div>
        </div>

        <StrengthChart data={currentData} metricKey={metricKey} goal={currentGoal} onChartClick={handleChartClick} />

        <p className="text-[10px] text-center text-[#5b6678] italic mt-1 select-none">
          Tap any data point on the chart to view localized progression statistics.
        </p>
      </div>

      {/* Weekly volume */}
      <div className="glass-card p-4 space-y-4">
        <div>
          <h3 className="text-sm font-bold text-[#d3dae4]">Weekly Training Volume</h3>
          <p className="text-[11px] text-[#8b96a8] font-medium">Week-over-week summed workout volume progression</p>
        </div>
        <VolumeChart data={weeklyData} />
      </div>

      <MuscleVolumeCard muscleRows={muscleRows} />
      <RecentSessions sessions={displaySessions} />

      {selectedExerciseForHistory && (
        <ExerciseHistoryModal exerciseName={selectedExerciseForHistory} onClose={() => setSelectedExerciseForHistory(null)} />
      )}
    </div>
  );
}
