import { useMemo } from 'react';
import { getMuscleGroup, VOLUME_LANDMARKS } from '../../utils/muscleGroups';
import { computeWeekStreak } from '../../utils/streak';
import { epley1RM } from '../../utils/volumeCalculator';
import { formatDateShort } from '../../utils/formatters';

const DEFAULT_EXERCISES = ['Back Squat', 'Barbell Bench Press', 'Deadlift'];

/**
 * All derived analytics data for the Strength Analytics dashboard, memoized
 * against `workoutHistory` so it doesn't re-run on every render — this
 * previously re-computed several full passes over history on every render,
 * including the once-a-second re-renders WorkoutContext causes while a rest
 * timer is running (its state feeds the shared context value).
 */
export function useAnalyticsData({ workoutHistory, selectedExercise, selectedMetric, activePointState }) {
  const dynamicExercises = useMemo(() => {
    const counts = {};
    workoutHistory?.forEach((session) => {
      const seen = new Set();
      session.logs?.forEach((log) => log.exerciseName && seen.add(log.exerciseName));
      seen.forEach((name) => (counts[name] = (counts[name] || 0) + 1));
    });
    const filtered = Object.keys(counts).filter((name) => counts[name] >= 2);
    return filtered.length > 0 ? filtered : DEFAULT_EXERCISES;
  }, [workoutHistory]);

  const currentData = useMemo(() => {
    const points = [];
    let count = 1;
    workoutHistory?.forEach((session) => {
      const log = session.logs?.find((l) => l.exerciseName === selectedExercise);
      if (!log) return;
      let maxWeight = 0;
      let max1RM = 0;
      log.sets?.forEach((set) => {
        if (set.isComplete) {
          const w = parseFloat(set.weight) || 0;
          if (w > maxWeight) maxWeight = w;
          const rm = epley1RM(set.weight, set.repsCompleted);
          if (rm > max1RM) max1RM = rm;
        }
      });
      if (maxWeight > 0) {
        points.push({
          week: `S${count++}`,
          weight: maxWeight,
          oneRM: Math.round(max1RM * 10) / 10,
          date: formatDateShort(session.completedAt || session.date),
        });
      }
    });
    return points;
  }, [workoutHistory, selectedExercise]);

  const weeklyData = useMemo(() => {
    const weekly = {};
    workoutHistory?.forEach((session) => {
      const date = new Date(session.completedAt || session.date);
      const sunday = new Date(date);
      sunday.setDate(date.getDate() - date.getDay());
      sunday.setHours(0, 0, 0, 0);
      const ts = sunday.getTime();
      if (!weekly[ts]) weekly[ts] = { week: formatDateShort(sunday), volume: 0, timestamp: ts };
      weekly[ts].volume += session.totalVolume || 0;
    });
    return Object.values(weekly).sort((a, b) => a.timestamp - b.timestamp);
  }, [workoutHistory]);

  const activePoint = useMemo(
    () =>
      activePointState && currentData.some((p) => p.week === activePointState.week)
        ? activePointState
        : currentData[currentData.length - 1],
    [activePointState, currentData]
  );

  const metricKey = selectedMetric === '1rm' ? 'oneRM' : 'weight';
  const startWeight = currentData[0]?.[metricKey] || 0;
  const currentWeight = activePoint?.[metricKey] || 0;
  const progressWeight = currentWeight - startWeight;
  const progressPercent = startWeight > 0 ? ((progressWeight / startWeight) * 100).toFixed(1) : '0.0';

  const summaryStats = useMemo(() => {
    const hasHistory = workoutHistory && workoutHistory.length > 0;
    const totalSessionsCount = hasHistory ? workoutHistory.length : 0;
    const sessionsBadge = hasHistory
      ? `+${workoutHistory.filter((s) => {
          const d = new Date(s.completedAt || s.date);
          const now = new Date();
          return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        }).length} this mo`
      : '0 this month';

    const liveTotalVolume = hasHistory ? workoutHistory.reduce((acc, c) => acc + (c.totalVolume || 0), 0) : 0;
    const displayVolumeStr = hasHistory
      ? liveTotalVolume >= 1000
        ? `${(liveTotalVolume / 1000).toFixed(1)}k`
        : liveTotalVolume.toLocaleString()
      : '0';

    const streak = computeWeekStreak(workoutHistory);
    const displayStreakStr = hasHistory ? `${streak} ${streak === 1 ? 'Wk' : 'Wks'}` : '0 Wks';

    return { hasHistory, totalSessionsCount, sessionsBadge, displayVolumeStr, displayStreakStr };
  }, [workoutHistory]);

  const displaySessions = useMemo(() => {
    if (!workoutHistory || workoutHistory.length === 0) return [];
    return [...workoutHistory]
      .reverse()
      .slice(0, 5)
      .map((session, i) => {
        const durationStr = session.duration >= 60 ? `${Math.round(session.duration / 60)} min` : `${session.duration} sec`;
        let badge = 'Completed';
        if (i === 0) badge = 'Latest Log';
        else if (session.totalVolume > 5000) badge = 'Heavy Volume';
        return {
          id: session.id || `live_${i}`,
          name: session.day,
          date: formatDateShort(session.completedAt || session.date),
          duration: durationStr,
          volume: `${(session.totalVolume || 0).toLocaleString()} kg`,
          sets: session.completedSets || 0,
          badge,
        };
      });
  }, [workoutHistory]);

  const muscleRows = useMemo(() => {
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
    return Object.keys(counts)
      .map((muscle) => {
        const sets = counts[muscle];
        const landmark = VOLUME_LANDMARKS[muscle] || VOLUME_LANDMARKS.Other;
        let zone = 'optimal';
        if (sets < landmark.mev) zone = 'low';
        else if (sets > landmark.mrv) zone = 'high';
        const pct = Math.min(100, Math.round((sets / Math.max(landmark.mrv, 1)) * 100));
        return { muscle, sets, zone, pct, landmark };
      })
      .sort((a, b) => b.sets - a.sets);
  }, [workoutHistory]);

  return {
    dynamicExercises,
    currentData,
    weeklyData,
    activePoint,
    metricKey,
    startWeight,
    currentWeight,
    progressWeight,
    progressPercent,
    displaySessions,
    muscleRows,
    ...summaryStats,
  };
}
