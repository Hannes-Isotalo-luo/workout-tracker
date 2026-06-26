import React, { useState } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Flame, Trophy, Activity } from 'lucide-react';
import { useWorkout } from '../../context/WorkoutContext';
import { computeStreak } from '../../utils/streak';
import { formatDate } from '../../utils/formatters';
import SessionDetail from './SessionDetail';
import ExerciseHistoryModal from './ExerciseHistoryModal';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const isSameDay = (a, b) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

export default function HistoryView() {
  const { workoutHistory, undoLastSession, restartLastSession, setView } = useWorkout();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [expandedSessionId, setExpandedSessionId] = useState(null);
  const [selectedExerciseForHistory, setSelectedExerciseForHistory] = useState(null);

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
  const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate();
  const prevTotalDays = new Date(currentYear, currentMonth, 0).getDate();

  const calendarCells = [];
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    calendarCells.push({
      day: prevTotalDays - i,
      month: currentMonth === 0 ? 11 : currentMonth - 1,
      year: currentMonth === 0 ? currentYear - 1 : currentYear,
      isCurrentMonth: false,
    });
  }
  for (let i = 1; i <= totalDays; i++) {
    calendarCells.push({ day: i, month: currentMonth, year: currentYear, isCurrentMonth: true });
  }
  const remainingCells = 42 - calendarCells.length;
  for (let i = 1; i <= remainingCells; i++) {
    calendarCells.push({
      day: i,
      month: currentMonth === 11 ? 0 : currentMonth + 1,
      year: currentMonth === 11 ? currentYear + 1 : currentYear,
      isCurrentMonth: false,
    });
  }

  const getWorkoutsForDay = (day, month, year) =>
    workoutHistory.filter((session) => {
      const d = new Date(session.completedAt || session.date);
      return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day;
    });

  const workoutsThisMonth = workoutHistory.filter((session) => {
    const d = new Date(session.completedAt || session.date);
    return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
  });
  const totalVolumeThisMonth = workoutsThisMonth.reduce((acc, c) => acc + (c.totalVolume || 0), 0);

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

  const streak = computeStreak(workoutHistory);

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
          <span className="text-sm font-black text-[#f8fafc] mt-0.5">{streak} Days</span>
          <span className="text-[10px] text-[#5b6678] mt-0.5 font-bold">Consistency</span>
        </div>
      </div>

      {/* Calendar */}
      <div className="glass-card overflow-hidden shadow-xl">
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-line-sub">
          <button
            onClick={() => setCurrentDate(new Date(currentYear, currentMonth - 1, 1))}
            className="w-11 h-11 flex items-center justify-center rounded-[11px] border border-line-c bg-surf-chip hover:bg-surf-hi text-[#8b96a8] transition"
            aria-label="Previous Month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <h3 className="text-sm font-extrabold text-[#d3dae4] tracking-wide">
            {MONTH_NAMES[currentMonth]} {currentYear}
          </h3>
          <button
            onClick={() => setCurrentDate(new Date(currentYear, currentMonth + 1, 1))}
            className="w-11 h-11 flex items-center justify-center rounded-[11px] border border-line-c bg-surf-chip hover:bg-surf-hi text-[#8b96a8] transition"
            aria-label="Next Month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-7 text-center py-2 border-b border-line-sub">
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day, idx) => (
            <span key={idx} className="text-[10px] font-extrabold text-[#5b6678] uppercase tracking-wider">
              {day}
            </span>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1 p-2">
          {calendarCells.map((cell, idx) => {
            const cellDate = new Date(cell.year, cell.month, cell.day);
            const workouts = getWorkoutsForDay(cell.day, cell.month, cell.year);
            const hasWorkouts = workouts.length > 0;
            const isSelected = isSameDay(cellDate, selectedDate);
            const isToday = isSameDay(cellDate, new Date());

            return (
              <button
                key={idx}
                onClick={() => setSelectedDate(cellDate)}
                className={`aspect-square min-h-[44px] flex flex-col items-center justify-between p-1 rounded-[11px] transition-all relative group
                  ${cell.isCurrentMonth ? 'text-[#d3dae4]' : 'text-[#3a4558]'}
                  ${isSelected ? 'bg-accent/20 border border-accent/50 shadow-lg shadow-accent/10' : 'hover:bg-surf-hi border border-transparent'}
                  ${isToday && !isSelected ? 'border border-line-hi bg-surf-chip' : ''}`}
              >
                <span className={`text-xs font-bold mt-0.5 ${isToday ? 'text-accent font-extrabold' : ''} ${isSelected ? 'text-white' : ''}`}>
                  {cell.day}
                </span>
                <div className="h-1.5 w-full flex items-center justify-center gap-0.5 mb-0.5">
                  {hasWorkouts
                    ? workouts.map((w, wIdx) => (
                        <span
                          key={wIdx}
                          className="h-1.5 w-1.5 rounded-full bg-gain"
                        />
                      ))
                    : null}
                </div>
              </button>
            );
          })}
        </div>
      </div>

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
