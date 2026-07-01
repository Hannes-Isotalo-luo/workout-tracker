import React, { useState, useMemo, useCallback } from 'react';
import { Calendar as CalendarIcon, Flame, Trophy, Activity } from 'lucide-react';
import { useWorkout } from '../../context/WorkoutContext';
import { computeWeekStreak } from '../../utils/streak';
import { formatDate } from '../../utils/formatters';
import Calendar from './Calendar';
import SessionDetail from './SessionDetail';
import ExerciseHistoryModal from './ExerciseHistoryModal';

export default function HistoryView() {
  const { workoutHistory, undoLastSession, restartLastSession, setView } = useWorkout();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [expandedSessionId, setExpandedSessionId] = useState(null);
  const [selectedExerciseForHistory, setSelectedExerciseForHistory] = useState(null);

  // Index sessions by calendar day once per history change, instead of
  // re-scanning the full history for each of the 42 rendered calendar cells.
  const workoutsByDay = useMemo(() => {
    const map = new Map();
    (workoutHistory || []).forEach((session) => {
      const d = new Date(session.completedAt || session.date);
      if (isNaN(d.getTime())) return;
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(session);
    });
    return map;
  }, [workoutHistory]);

  const getWorkoutsForDay = useCallback(
    (day, month, year) => workoutsByDay.get(`${year}-${month}-${day}`) || [],
    [workoutsByDay]
  );

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  const { workoutsThisMonth, totalVolumeThisMonth } = useMemo(() => {
    const inMonth = (workoutHistory || []).filter((session) => {
      const d = new Date(session.completedAt || session.date);
      return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
    });
    return {
      workoutsThisMonth: inMonth,
      totalVolumeThisMonth: inMonth.reduce((acc, c) => acc + (c.totalVolume || 0), 0),
    };
  }, [workoutHistory, currentYear, currentMonth]);

  const streak = useMemo(() => computeWeekStreak(workoutHistory), [workoutHistory]);

  const selectedWorkouts = getWorkoutsForDay(selectedDate.getDate(), selectedDate.getMonth(), selectedDate.getFullYear());
  const lastSessionId = workoutHistory.length > 0 ? workoutHistory[workoutHistory.length - 1].id : null;

  const handleRestart = () => {
    if (window.confirm('Restart this session? This removes it from history and loads it back as your active workout to log again.')) {
      restartLastSession();
      setView('workout');
    }
  };
  const handleDelete = () => {
    if (window.confirm('Permanently delete this workout log? This cannot be undone.')) {
      undoLastSession();
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-6">

      <div className="space-y-1">
        <h2 className="text-xl font-black text-[#f8fafc] flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-accent" />
          Motivational Calendar
        </h2>
        <p className="text-xs text-[#8b96a8]">Track your consistency and review completed splits.</p>
      </div>

      {/* Monthly stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="glass-card p-3 text-center flex flex-col items-center justify-between">
          <Activity className="w-4 h-4 text-accent mb-1" />
          <span className="text-[10px] font-bold text-[#5b6678] uppercase tracking-wide block">Completed</span>
          <span className="text-sm font-black text-[#f8fafc] mt-0.5">{workoutsThisMonth.length}</span>
          <span className="text-[10px] text-[#5b6678] mt-0.5 font-bold">This Month</span>
        </div>
        <div className="glass-card p-3 text-center flex flex-col items-center justify-between">
          <Trophy className="w-4 h-4 text-gain-t mb-1" />
          <span className="text-[10px] font-bold text-[#5b6678] uppercase tracking-wide block">Volume</span>
          <span className="text-sm font-black text-[#f8fafc] mt-0.5">
            {totalVolumeThisMonth >= 1000 ? `${(totalVolumeThisMonth / 1000).toFixed(1)}k` : totalVolumeThisMonth}
            <span className="text-[10px] font-bold text-[#5b6678] ml-0.5">KG</span>
          </span>
          <span className="text-[10px] text-[#5b6678] mt-0.5 font-bold">Total Lifted</span>
        </div>
        <div className="glass-card p-3 text-center flex flex-col items-center justify-between">
          <Flame className={`w-4 h-4 mb-1 ${streak > 0 ? 'text-peak' : 'text-[#3a4558]'}`} />
          <span className="text-[10px] font-bold text-[#5b6678] uppercase tracking-wide block">Active Streak</span>
          <span className="text-sm font-black text-[#f8fafc] mt-0.5">{streak} {streak === 1 ? 'Wk' : 'Wks'}</span>
          <span className="text-[10px] text-[#5b6678] mt-0.5 font-bold">Consistency</span>
        </div>
      </div>

      <Calendar
        currentDate={currentDate}
        selectedDate={selectedDate}
        onMonthChange={setCurrentDate}
        onSelectDate={setSelectedDate}
        getWorkoutsForDay={getWorkoutsForDay}
      />

      {/* Selected day logs */}
      <div className="space-y-4">
        <h4 className="text-[11px] font-black text-[#5b6678] uppercase tracking-widest" style={{ letterSpacing: '0.06em' }}>
          Logs for {formatDate(selectedDate)}
        </h4>

        {selectedWorkouts.length === 0 ? (
          <div className="glass-card p-5 border-dashed border-line-sub text-center">
            <CalendarIcon className="w-6 h-6 text-[#3a4558] mx-auto mb-2" />
            <p className="text-xs font-bold text-[#8b96a8]">No workout logs recorded on this day.</p>
            <p className="text-[10px] text-[#5b6678] mt-0.5">Maintain consistency by scheduling a workout split.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {selectedWorkouts.map((session, index) => (
              <SessionDetail
                key={session.id || index}
                session={session}
                isLast={session.id === lastSessionId}
                expanded={expandedSessionId === session.id}
                onToggleExpand={() => setExpandedSessionId(expandedSessionId === session.id ? null : session.id)}
                onSelectExercise={setSelectedExerciseForHistory}
                onRestart={handleRestart}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
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
