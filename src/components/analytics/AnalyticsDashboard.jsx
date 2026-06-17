import { useState, useEffect } from 'react';
import { 
  Dumbbell, 
  TrendingUp, 
  Flame, 
  Calendar, 
  Clock, 
  ChevronRight, 
  Award,
  Activity,
  ArrowUpRight,
  Play,
  ArrowRight
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip,
  ReferenceLine
} from 'recharts';
import { useWorkout } from '../../context/WorkoutContext';
import ExerciseHistoryModal from '../views/ExerciseHistoryModal';
import { getMuscleGroup, VOLUME_LANDMARKS } from '../../utils/muscleGroups';

// Custom Tooltip Component for Dark Mode ────────────────────────

// Custom Tooltip Component for Dark Mode
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const dataKey = payload[0].dataKey;
    const labelText = dataKey === 'oneRM' ? 'Est. 1RM' : 'Max Weight';
    return (
      <div className="bg-slate-800/95 border border-slate-700/80 px-3 py-2.5 rounded-xl shadow-xl backdrop-blur-md">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
          {label} Progress
        </p>
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

// Custom Tooltip Component for Volume Progression Chart
const VolumeTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-800/95 border border-slate-700/80 px-3 py-2.5 rounded-xl shadow-xl backdrop-blur-md">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
          Week of {label}
        </p>
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

export default function AnalyticsDashboard() {
  const { workoutHistory, activeSession, setView, customGoals, updateCustomGoal } = useWorkout();
  const [selectedExercise, setSelectedExercise] = useState('Back Squat');
  const [selectedExerciseForHistory, setSelectedExerciseForHistory] = useState(null);
  const [selectedMetric, setSelectedMetric] = useState('weight'); // 'weight' or '1rm'

  // Dynamically extract exercises logged at least 2 times, fallback to defaults
  const dynamicExercises = (() => {
    const counts = {};
    workoutHistory?.forEach(session => {
      const seen = new Set();
      session.logs?.forEach(log => {
        if (log.exerciseName) {
          seen.add(log.exerciseName);
        }
      });
      seen.forEach(name => {
        counts[name] = (counts[name] || 0) + 1;
      });
    });
    const filtered = Object.keys(counts).filter(name => counts[name] >= 2);
    return filtered.length > 0 ? filtered : ['Back Squat', 'Barbell Bench Press', 'Deadlift'];
  })();

  // Keep selectedExercise synchronized if it's not in the list of exercises
  useEffect(() => {
    if (!dynamicExercises.includes(selectedExercise)) {
      setSelectedExercise(dynamicExercises[0]);
    }
  }, [dynamicExercises, selectedExercise]);

  const currentGoal = customGoals[selectedExercise] || 0;

  // Dynamic live progression extraction
  const getLiveExerciseProgression = (exerciseName) => {
    const points = [];
    let count = 1;
    
    workoutHistory?.forEach((session) => {
      // Find if this session logged the exercise
      const exerciseLog = session.logs?.find(log => log.exerciseName === exerciseName);
      if (exerciseLog) {
        // Find max weight and 1RM in completed sets
        let maxWeight = 0;
        let max1RM = 0;
        exerciseLog.sets?.forEach(set => {
          if (set.isComplete) {
            const w = parseFloat(set.weight) || 0;
            if (w > maxWeight) {
              maxWeight = w;
            }
            // Epley Formula
            const rCompleted = parseInt(set.repsCompleted, 10) || 0;
            const current1RM = w * (1 + rCompleted / 30);
            if (current1RM > max1RM) {
              max1RM = current1RM;
            }
          }
        });
        
        if (maxWeight > 0) {
          points.push({
            week: `S${count++}`, // Session count e.g. S1, S2, etc.
            weight: maxWeight,
            oneRM: Math.round(max1RM * 10) / 10,
            date: new Date(session.completedAt || session.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          });
        }
      }
    });
    
    return points;
  };

  const livePoints = getLiveExerciseProgression(selectedExercise);
  const useLiveChart = livePoints.length >= 2;
  const currentData = livePoints;

  // Group completed workouts by week and sum the total volume
  const getWeeklyVolumeData = () => {
    const weeklyVolume = {};
    workoutHistory?.forEach(session => {
      const date = new Date(session.completedAt || session.date);
      const dayOfWeek = date.getDay();
      const sunday = new Date(date);
      sunday.setDate(date.getDate() - dayOfWeek);
      sunday.setHours(0, 0, 0, 0);
      
      const timestamp = sunday.getTime();
      
      if (!weeklyVolume[timestamp]) {
        weeklyVolume[timestamp] = {
          week: sunday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          volume: 0,
          timestamp
        };
      }
      weeklyVolume[timestamp].volume += (session.totalVolume || 0);
    });
    
    return Object.values(weeklyVolume).sort((a, b) => a.timestamp - b.timestamp);
  };

  const weeklyData = getWeeklyVolumeData();

  // Local state to track the active clicked point details
  const [activePointState, setActivePointState] = useState(null);

  // Safely resolve the activePoint
  const activePoint = activePointState && currentData.some(p => p.week === activePointState.week)
    ? activePointState
    : currentData[currentData.length - 1];

  // Handle changing exercise tab and reset active point
  const handleExerciseChange = (exercise) => {
    setSelectedExercise(exercise);
    setActivePointState(null);
    console.log(`[Analytics] Changed exercise to: ${exercise}`);
  };

  // Handle chart clicks to show details for that specific week
  const handleChartClick = (state) => {
    if (state && state.activePayload && state.activePayload.length > 0) {
      const point = state.activePayload[0].payload;
      setActivePointState(point);
      console.log(`[Analytics] Selected data point:`, point);
    }
  };

  // Stats calculate
  const currentMetricKey = selectedMetric === '1rm' ? 'oneRM' : 'weight';
  const startWeight = currentData[0]?.[currentMetricKey] || 0;
  const currentWeight = activePoint?.[currentMetricKey] || 0;
  const progressWeight = currentWeight - startWeight;
  const progressPercent = startWeight > 0 ? ((progressWeight / startWeight) * 100).toFixed(1) : '0.0';

  // Dynamic Sessions Stats
  const totalSessionsCount = workoutHistory ? workoutHistory.length : 0;
  const sessionsBadge = workoutHistory && workoutHistory.length > 0 
    ? `+${workoutHistory.filter(s => {
        const d = new Date(s.completedAt || s.date);
        const now = new Date();
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      }).length} this mo`
    : `0 this month`;

  const calculateTotalVolume = () => {
    if (!workoutHistory || workoutHistory.length === 0) return 0;
    return workoutHistory.reduce((acc, curr) => acc + (curr.totalVolume || 0), 0);
  };
  const liveTotalVolume = calculateTotalVolume();
  
  const displayVolumeStr = workoutHistory && workoutHistory.length > 0
    ? (liveTotalVolume >= 1000 ? `${(liveTotalVolume / 1000).toFixed(1)}k` : liveTotalVolume.toLocaleString())
    : "0";
    
  const volumeBadge = workoutHistory && workoutHistory.length > 0
    ? "Live Volume"
    : "0 kg";

  // Calculate consistency streak
  const calculateStreak = () => {
    if (!workoutHistory || workoutHistory.length === 0) return 0;
    
    // Extract unique dates sorted descending
    const uniqueDates = Array.from(
      new Set(
        workoutHistory.map(s => {
          const d = new Date(s.completedAt || s.date);
          return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
        })
      )
    ).sort((a, b) => b - a);

    const today = new Date();
    const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    const yesterdayMidnight = todayMidnight - 86400000;

    const latestWorkoutTime = uniqueDates[0];
    if (latestWorkoutTime !== todayMidnight && latestWorkoutTime !== yesterdayMidnight) {
      return 0;
    }

    let currentStreak = 1;
    let expectedTime = latestWorkoutTime - 86400000;

    for (let i = 1; i < uniqueDates.length; i++) {
      if (uniqueDates[i] === expectedTime) {
        currentStreak++;
        expectedTime -= 86400000;
      } else if (uniqueDates[i] < expectedTime) {
        break;
      }
    }

    return currentStreak;
  };

  const streak = calculateStreak();
  const displayStreakStr = workoutHistory && workoutHistory.length > 0
    ? `${streak} Days`
    : "0 Days";
    
  const streakBadge = workoutHistory && workoutHistory.length > 0
    ? "Current Streak"
    : "Consistency";

  // Dynamic Recent Sessions mapping
  const displaySessions = workoutHistory && workoutHistory.length > 0 
    ? [...workoutHistory].reverse().slice(0, 5).map((session, i) => {
        const sessionDate = new Date(session.completedAt || session.date);
        const formattedDate = sessionDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        const durationStr = session.duration >= 60 ? `${Math.round(session.duration / 60)} min` : `${session.duration} sec`;
        
        let badge = 'Completed';
        if (i === 0) {
          badge = 'Latest Log';
        } else if (session.totalVolume > 5000) {
          badge = 'Heavy Volume';
        }

        return {
          id: session.id || `live_${i}`,
          name: session.day,
          date: formattedDate,
          duration: durationStr,
          volume: `${(session.totalVolume || 0).toLocaleString()} kg`,
          sets: session.completedSets || 0,
          badge
        };
      })
    : [];

  // ── Weekly sets per muscle group (last 7 days) — hypertrophy volume ──
  const weeklyMuscleSets = (() => {
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const counts = {};
    (workoutHistory || []).forEach((session) => {
      const t = new Date(session.completedAt || session.date || 0).getTime();
      if (isNaN(t) || t < weekAgo) return;
      session.logs?.forEach((log) => {
        const completed = (log.sets || []).filter((s) => s.isComplete).length;
        if (completed > 0) {
          const m = getMuscleGroup(log.exerciseName);
          counts[m] = (counts[m] || 0) + completed;
        }
      });
    });
    return counts;
  })();

  const muscleRows = Object.keys(weeklyMuscleSets)
    .map((muscle) => {
      const sets = weeklyMuscleSets[muscle];
      const landmark = VOLUME_LANDMARKS[muscle] || VOLUME_LANDMARKS.Other;
      let zone = 'optimal';
      if (sets < landmark.mev) zone = 'low';
      else if (sets > landmark.mrv) zone = 'high';
      const pct = Math.min(100, Math.round((sets / Math.max(landmark.mrv, 1)) * 100));
      return { muscle, sets, zone, pct, landmark };
    })
    .sort((a, b) => b.sets - a.sets);

  const ZONE_STYLES = {
    low:     { bar: 'from-amber-500 to-orange-500', text: 'text-amber-400', label: 'below target' },
    optimal: { bar: 'from-emerald-500 to-teal-500', text: 'text-emerald-400', label: 'optimal' },
    high:    { bar: 'from-rose-500 to-red-500', text: 'text-rose-400', label: 'high volume' },
  };

  return (
    <div className="space-y-6">
      {/* Active Workout Widget indicator if user navigated away while active */}
      {activeSession && (
        <div 
          onClick={() => setView('workout')}
          className="glass-card p-3 border-violet-500/35 bg-violet-950/20 hover:bg-violet-950/30 transition-all cursor-pointer flex items-center justify-between animate-pulse"
        >
          <div className="flex items-center gap-3">
            <Play className="w-4 h-4 text-violet-400 fill-current" />
            <span className="text-xs font-bold text-violet-300">Active Workout: {activeSession.day}</span>
          </div>
          <span className="text-[10px] font-black text-violet-400 uppercase tracking-widest flex items-center gap-0.5">
            Resume <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>
      )}

      {/* ── Header ── */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
          <Activity className="w-5 h-5 text-violet-400" />
          Strength Analytics
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Real-time metrics, streaks, and strength progression.
        </p>
      </div>

      {/* ── Stat Cards Grid (Mobile First) ── */}
      <div className="grid grid-cols-3 gap-2.5">
        {/* Card 1: Workouts */}
        <div className="glass-card p-3 flex flex-col justify-between relative overflow-hidden group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sessions</span>
            <div className="w-7 h-7 rounded-lg bg-violet-500/15 flex items-center justify-center">
              <Dumbbell className="w-4 h-4 text-violet-400" />
            </div>
          </div>
          <div>
            <p className="text-xl font-black text-slate-100 tracking-tight">{totalSessionsCount}</p>
            <p className="text-[10px] text-emerald-400 font-semibold flex items-center gap-0.5 mt-0.5">
              <ArrowUpRight className="w-2.5 h-2.5" /> {sessionsBadge}
            </p>
          </div>
        </div>

        {/* Card 2: Total Volume */}
        <div className="glass-card p-3 flex flex-col justify-between relative overflow-hidden group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Volume</span>
            <div className="w-7 h-7 rounded-lg bg-cyan-500/15 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
            </div>
          </div>
          <div>
            <p className="text-xl font-black text-slate-100 tracking-tight">{displayVolumeStr}</p>
            <p className="text-[10px] text-emerald-400 font-semibold flex items-center gap-0.5 mt-0.5">
              <ArrowUpRight className="w-2.5 h-2.5" /> {volumeBadge}
            </p>
          </div>
        </div>

        {/* Card 3: Streak */}
        <div className="glass-card p-3 flex flex-col justify-between relative overflow-hidden group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Streak</span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/15 flex items-center justify-center">
              <Flame className="w-4 h-4 text-amber-500" />
            </div>
          </div>
          <div>
            <p className="text-xl font-black text-slate-100 tracking-tight">{displayStreakStr}</p>
            <p className="text-[10px] text-amber-400 font-semibold mt-0.5">
              {streakBadge}
            </p>
          </div>
        </div>
      </div>

      {/* ── Strength Progression Chart Card ── */}
      <div className="glass-card p-4 space-y-4">
        {/* Chart Header & Exercise Selector */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <h3 
                onClick={() => setSelectedExerciseForHistory(selectedExercise)}
                className="text-sm font-bold text-slate-200 hover:text-violet-400 cursor-pointer flex items-center gap-1.5 transition-colors"
              >
                Strength: <span className="underline decoration-dotted decoration-violet-400">{selectedExercise}</span>
              </h3>
              <button
                type="button"
                onClick={() => setSelectedExerciseForHistory(selectedExercise)}
                className="p-1 rounded bg-slate-800 hover:bg-slate-755 text-slate-400 hover:text-slate-200 border border-slate-700/80 transition-colors flex items-center justify-center"
                title="View full exercise history"
              >
                <Calendar className="w-3.5 h-3.5 text-violet-400" />
              </button>
            </div>
            <div className="flex gap-1 bg-slate-900/60 p-0.5 rounded-xl border border-slate-800/80 overflow-x-auto max-w-[150px] xs:max-w-[200px] sm:max-w-none scrollbar-none">
              {dynamicExercises.map((ex) => (
                <button
                  key={ex}
                  onClick={() => handleExerciseChange(ex)}
                  className={`
                    min-h-[36px] px-3 py-2 text-[11px] font-extrabold rounded-lg transition-all duration-200 whitespace-nowrap flex-shrink-0
                    ${selectedExercise === ex 
                      ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-md shadow-violet-500/15'
                      : 'text-slate-400 hover:text-slate-200'
                    }
                  `}
                >
                  {ex.split(' ').slice(-2).join(' ') || ex}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Metric Summary & Toggle */}
          <div className="flex flex-col gap-2.5 bg-slate-900/40 p-2.5 rounded-xl border border-slate-800/40">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800/50">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Chart Metric</span>
              <div className="flex bg-slate-950/80 p-0.5 rounded-lg border border-slate-800/80">
                <button
                  onClick={() => setSelectedMetric('weight')}
                  className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-colors ${selectedMetric === 'weight' ? 'bg-violet-500/20 text-violet-300' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  Max Weight
                </button>
                <button
                  onClick={() => setSelectedMetric('1rm')}
                  className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-colors ${selectedMetric === '1rm' ? 'bg-violet-500/20 text-violet-300' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  Est. 1RM
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Selected ({activePoint?.week || 'N/A'})</p>
                <p className="text-base font-black text-violet-400 tracking-tight">
                  {activePoint?.[currentMetricKey] || 0} <span className="text-xs font-normal text-slate-400">kg</span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Progress ({currentData[0]?.week || 'N/A'} → {activePoint?.week || 'N/A'})</p>
                <p className={`text-base font-black tracking-tight ${progressWeight >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {progressWeight >= 0 ? `+${progressWeight.toFixed(1)}` : progressWeight.toFixed(1)} kg <span className="text-xs font-normal text-slate-400">({progressWeight >= 0 ? '+' : ''}{progressPercent}%)</span>
                </p>
              </div>
            </div>
          </div>

          {/* Editable Goal Weight Input & Plate Calculator Trigger */}
          <div className="flex items-center justify-between bg-slate-900/60 p-2.5 rounded-xl border border-slate-805/85">
            <div className="flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-rose-500" />
              <span className="text-xs font-bold text-slate-300">Target Strength Goal:</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                inputMode="decimal"
                value={currentGoal}
                onChange={(e) => {
                  const val = parseFloat(e.target.value) || 0;
                  updateCustomGoal(selectedExercise, val);
                  console.log(`[Analytics] Updated goal for ${selectedExercise} to: ${val}`);
                }}
                className="w-16 bg-slate-950/80 text-white text-xs font-black text-center py-1 px-1.5 rounded-lg border border-slate-800 focus:outline-none focus:border-rose-500/80 transition-colors"
              />
              <span className="text-[10px] text-slate-400 font-bold">kg</span>
            </div>
          </div>
        </div>

        {/* Recharts Chart Area */}
        <div className="h-[210px] w-full mt-2">
          {useLiveChart ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart 
                data={currentData} 
                margin={{ top: 10, right: 10, left: -22, bottom: 0 }}
                onClick={handleChartClick}
              >
                {/* Radial gradient filter definitions for glowing effects */}
                <defs>
                  <linearGradient id="lineGlow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#a78bfa" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                
                <CartesianGrid 
                  vertical={false} 
                  stroke="#1e293b" 
                  strokeDasharray="4"
                />
                
                <XAxis 
                  dataKey="week" 
                  stroke="#475569" 
                  fontSize={10}
                  fontWeight={600}
                  tickLine={false}
                  axisLine={false}
                  dy={6}
                />
                
                <YAxis 
                  stroke="#475569" 
                  fontSize={10}
                  fontWeight={600}
                  tickLine={false}
                  axisLine={false}
                  domain={[dataMin => Math.max(0, dataMin - 15), dataMax => dataMax + 15]}
                  tickFormatter={(v) => `${v}`}
                />

                <Tooltip 
                  content={<CustomTooltip />}
                  cursor={{ stroke: '#334155', strokeWidth: 1.5, strokeDasharray: '3 3' }}
                />

                <ReferenceLine 
                  y={currentGoal} 
                  stroke="#f43f5e" 
                  strokeDasharray="4 4" 
                  strokeWidth={1.5}
                  label={{ 
                    value: `Goal: ${currentGoal} kg`, 
                    fill: '#f43f5e', 
                    fontSize: 10, 
                    fontWeight: 'bold', 
                    position: 'top',
                    offset: 4
                  }}
                />

                <Line 
                  type="monotone" 
                  dataKey={currentMetricKey} 
                  stroke="#8b5cf6" 
                  strokeWidth={3}
                  dot={{ 
                    r: 4.5, 
                    stroke: '#0f172a', 
                    strokeWidth: 2, 
                    fill: '#8b5cf6' 
                  }}
                  activeDot={{ 
                    r: 7, 
                    stroke: '#0f172a', 
                    strokeWidth: 2.5, 
                    fill: '#c084fc' 
                  }}
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

        <p className="text-[10px] text-center text-slate-500 italic mt-1 select-none">
          💡 Tap any data point on the chart to view localized progression statistics.
        </p>
      </div>

      {/* ── Weekly Training Volume Chart Card ── */}
      <div className="glass-card p-4 space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-200">Weekly Training Volume</h3>
          <p className="text-[11px] text-slate-400 font-medium">Week-over-week summed workout volume progression</p>
        </div>

        <div className="h-[210px] w-full mt-2">
          {weeklyData.length >= 1 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart 
                data={weeklyData} 
                margin={{ top: 10, right: 10, left: -22, bottom: 0 }}
              >
                <CartesianGrid 
                  vertical={false} 
                  stroke="#1e293b" 
                  strokeDasharray="4"
                />
                
                <XAxis 
                  dataKey="week" 
                  stroke="#475569" 
                  fontSize={10}
                  fontWeight={600}
                  tickLine={false}
                  axisLine={false}
                  dy={6}
                />
                
                <YAxis 
                  stroke="#475569" 
                  fontSize={10}
                  fontWeight={600}
                  tickLine={false}
                  axisLine={false}
                  domain={[dataMin => Math.max(0, dataMin - 1000), dataMax => dataMax + 1000]}
                  tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
                />

                <Tooltip 
                  content={<VolumeTooltip />}
                  cursor={{ stroke: '#334155', strokeWidth: 1.5, strokeDasharray: '3 3' }}
                />

                <Line 
                  type="monotone" 
                  dataKey="volume" 
                  stroke="#06b6d4" 
                  strokeWidth={3}
                  dot={{ 
                    r: 4.5, 
                    stroke: '#0f172a', 
                    strokeWidth: 2, 
                    fill: '#06b6d4' 
                  }}
                  activeDot={{ 
                    r: 7, 
                    stroke: '#0f172a', 
                    strokeWidth: 2.5, 
                    fill: '#22d3ee' 
                  }}
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
      </div>

      {/* ── Weekly Sets per Muscle Group Card ── */}
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
                    <div
                      className={`h-full bg-gradient-to-r ${style.bar} transition-all duration-500`}
                      style={{ width: `${pct}%` }}
                    />
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

      {/* ── Recent Sessions Section ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-violet-400" />
            Recent Sessions
          </h3>
          <span className="text-[10px] font-extrabold text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded-md cursor-pointer hover:bg-violet-500/20 transition-all">
            See All
          </span>
        </div>

        {/* Scrollable Container */}
        <div className="max-h-[290px] overflow-y-auto pr-1 space-y-2.5 custom-scrollbar">
          {displaySessions.length > 0 ? (
            displaySessions.map((session) => (
              <div 
                key={session.id} 
                className="glass-card p-3 flex items-center justify-between border-slate-700/30 hover:border-slate-600/50 transition-all duration-200 group"
              >
                <div className="flex items-center gap-3">
                  {/* Visual indicator bar on the side of each card */}
                  <div className="w-1 self-stretch rounded-full bg-gradient-to-b from-violet-500 to-fuchsia-500 opacity-60 group-hover:opacity-100 transition-opacity" />
                  
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-slate-200 group-hover:text-violet-400 transition-colors">
                        {session.name}
                      </h4>
                      <span className="text-[10px] font-extrabold bg-slate-900 border border-slate-800 text-slate-400 px-1.5 py-0.5 rounded">
                        {session.badge}
                      </span>
                    </div>
                    
                    {/* Detailed inline metrics */}
                    <div className="flex items-center gap-3 mt-1 text-[10px] text-slate-400 font-medium">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-500" />
                        {session.duration}
                      </span>
                      <span className="flex items-center gap-1">
                        <Dumbbell className="w-3 h-3 text-slate-500" />
                        {session.sets} sets
                      </span>
                      <span className="font-semibold text-slate-300">
                        Vol: {session.volume}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action trigger button */}
                <button 
                  className="w-11 h-11 rounded-lg bg-slate-900 border border-slate-800/80 flex items-center justify-center hover:bg-slate-800 hover:text-white transition-all text-slate-500"
                  aria-label="View session details"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center p-8 text-center bg-slate-950/20 border border-slate-900/60 rounded-2xl min-h-[150px] select-none">
              <Calendar className="w-8 h-8 text-slate-600 mb-2 animate-pulse" />
              <h4 className="text-xs font-bold text-slate-400">No Logs Recorded</h4>
              <p className="text-[10px] text-slate-500 mt-1 max-w-[200px] leading-tight">
                Saved workout sessions will populate here. Complete your first session to see history!
              </p>
            </div>
          )}
        </div>
      </div>

      {selectedExerciseForHistory && (
        <ExerciseHistoryModal 
          exerciseName={selectedExerciseForHistory} 
          onClose={() => setSelectedExerciseForHistory(null)} 
        />
      )}
    </div>
  );
}
