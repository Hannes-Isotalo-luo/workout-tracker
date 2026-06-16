import React, { useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Trash2, 
  RotateCcw, 
  Flame, 
  Trophy, 
  Activity,
  ArrowRight,
  Play,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useWorkout } from '../../context/WorkoutContext';
import ExerciseHistoryModal from './ExerciseHistoryModal';

export default function HistoryCalendar() {
  const { 
    workoutHistory, 
    undoLastSession, 
    restartLastSession, 
    setView,
    activeSession
  } = useWorkout();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [expandedSessionId, setExpandedSessionId] = useState(null);
  const [selectedExerciseForHistory, setSelectedExerciseForHistory] = useState(null);

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth(); // 0-indexed

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Helper to format duration MM:SS
  const formatDuration = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Helper to check if two dates are the same calendar day
  const isSameDay = (date1, date2) => {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  };

  // Navigate months
  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  // Calculate Calendar Days
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
  const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate();
  const prevTotalDays = new Date(currentYear, currentMonth, 0).getDate();

  const calendarCells = [];

  // Previous month filler days
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const day = prevTotalDays - i;
    calendarCells.push({
      day,
      month: currentMonth === 0 ? 11 : currentMonth - 1,
      year: currentMonth === 0 ? currentYear - 1 : currentYear,
      isCurrentMonth: false,
    });
  }

  // Current month days
  for (let i = 1; i <= totalDays; i++) {
    calendarCells.push({
      day: i,
      month: currentMonth,
      year: currentYear,
      isCurrentMonth: true,
    });
  }

  // Next month filler days (fill up to multiples of 7)
  const remainingCells = 42 - calendarCells.length;
  for (let i = 1; i <= remainingCells; i++) {
    calendarCells.push({
      day: i,
      month: currentMonth === 11 ? 0 : currentMonth + 1,
      year: currentMonth === 11 ? currentYear + 1 : currentYear,
      isCurrentMonth: false,
    });
  }

  // Get completed workouts on a given day
  const getWorkoutsForDay = (day, month, year) => {
    return workoutHistory.filter(session => {
      const completedDate = new Date(session.completedAt || session.date);
      return (
        completedDate.getFullYear() === year &&
        completedDate.getMonth() === month &&
        completedDate.getDate() === day
      );
    });
  };

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

    // If the latest workout is not today or yesterday, the current streak is broken
    const latestWorkoutTime = uniqueDates[0];
    if (latestWorkoutTime !== todayMidnight && latestWorkoutTime !== yesterdayMidnight) {
      return 0;
    }

    let streak = 1;
    let expectedTime = latestWorkoutTime - 86400000;

    for (let i = 1; i < uniqueDates.length; i++) {
      if (uniqueDates[i] === expectedTime) {
        streak++;
        expectedTime -= 86400000;
      } else if (uniqueDates[i] < expectedTime) {
        // Gap found, streak ends
        break;
      }
    }

    return streak;
  };

  // Month-specific stats
  const workoutsThisMonth = workoutHistory.filter(session => {
    const d = new Date(session.completedAt || session.date);
    return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
  });

  const totalVolumeThisMonth = workoutsThisMonth.reduce((acc, curr) => acc + (curr.totalVolume || 0), 0);

  // Selected Day Details
  const selectedWorkouts = getWorkoutsForDay(
    selectedDate.getDate(),
    selectedDate.getMonth(),
    selectedDate.getFullYear()
  );

  const isSelectedDayWorkoutLast = (session) => {
    if (workoutHistory.length === 0) return false;
    const lastSession = workoutHistory[workoutHistory.length - 1];
    return lastSession.id === session.id;
  };

  const handleRestart = () => {
    if (window.confirm("Restart this session? This will remove it from your history and load it back as your active workout to edit and log again.")) {
      restartLastSession();
      setView('workout');
    }
  };

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to permanently delete this workout log? This action cannot be undone.")) {
      undoLastSession();
    }
  };

  const streak = calculateStreak();

  return (
    <div className="space-y-6 animate-fadeIn pb-6">
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

      {/* Motivational Title */}
      <div className="space-y-1">
        <h2 className="text-xl font-black text-slate-100 flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-violet-400" />
          Motivational Calendar
        </h2>
        <p className="text-xs text-slate-400">Track your consistency and review completed splits.</p>
      </div>

      {/* Monthly Stats Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="glass-card p-3 border-slate-800 bg-slate-900/40 text-center flex flex-col items-center justify-between">
          <Activity className="w-4 h-4 text-violet-400 mb-1" />
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block">Completed</span>
          <span className="text-sm font-black text-slate-200 mt-0.5">{workoutsThisMonth.length}</span>
          <span className="text-[10px] text-slate-500 mt-0.5 font-bold">This Month</span>
        </div>

        <div className="glass-card p-3 border-slate-800 bg-slate-900/40 text-center flex flex-col items-center justify-between">
          <Trophy className="w-4 h-4 text-fuchsia-400 mb-1" />
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block">Volume</span>
          <span className="text-sm font-black text-slate-200 mt-0.5">
            {totalVolumeThisMonth >= 1000 
              ? `${(totalVolumeThisMonth / 1000).toFixed(1)}k` 
              : totalVolumeThisMonth}
            <span className="text-[10px] font-bold text-slate-500 ml-0.5">KG</span>
          </span>
          <span className="text-[10px] text-slate-500 mt-0.5 font-bold">Total Lifted</span>
        </div>

        <div className="glass-card p-3 border-slate-800 bg-slate-900/40 text-center flex flex-col items-center justify-between">
          <Flame className={`w-4 h-4 mb-1 ${streak > 0 ? 'text-orange-400 animate-pulse' : 'text-slate-600'}`} />
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block">Active Streak</span>
          <span className="text-sm font-black text-slate-200 mt-0.5">{streak} Days</span>
          <span className="text-[10px] text-slate-500 mt-0.5 font-bold">Consistency</span>
        </div>
      </div>

      {/* Glassmorphic Calendar Card */}
      <div className="glass-card border-slate-800 bg-slate-900/30 overflow-hidden shadow-xl">
        {/* Calendar Navigation Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-800 bg-slate-950/20">
          <button 
            onClick={handlePrevMonth}
            className="w-11 h-11 flex items-center justify-center rounded-lg border border-slate-800 bg-slate-900/80 hover:bg-slate-800 hover:text-slate-200 text-slate-400 transition"
            aria-label="Previous Month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          <h3 className="text-sm font-extrabold text-slate-200 tracking-wide">
            {monthNames[currentMonth]} {currentYear}
          </h3>

          <button 
            onClick={handleNextMonth}
            className="w-11 h-11 flex items-center justify-center rounded-lg border border-slate-800 bg-slate-900/80 hover:bg-slate-800 hover:text-slate-200 text-slate-400 transition"
            aria-label="Next Month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Days of the Week */}
        <div className="grid grid-cols-7 text-center py-2 bg-slate-950/10 border-b border-slate-900/60">
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day, idx) => (
            <span key={idx} className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
              {day}
            </span>
          ))}
        </div>

        {/* Calendar Grid */}
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
                className={`
                  aspect-square min-h-[44px] flex flex-col items-center justify-between p-1 rounded-xl transition-all relative group
                  ${cell.isCurrentMonth ? 'text-slate-200' : 'text-slate-600'}
                  ${isSelected 
                    ? 'bg-violet-600/25 border border-violet-500/60 shadow-lg shadow-violet-950/30' 
                    : 'hover:bg-slate-800/30 border border-transparent'
                  }
                  ${isToday && !isSelected ? 'border border-slate-700/60 bg-slate-800/10' : ''}
                `}
              >
                {/* Day Number */}
                <span className={`
                  text-xs font-bold mt-0.5
                  ${isToday ? 'text-violet-400 font-extrabold' : ''}
                  ${isSelected ? 'text-white' : ''}
                `}>
                  {cell.day}
                </span>

                {/* Glowing completed dots / indicator */}
                <div className="h-1.5 w-full flex items-center justify-center gap-0.5 mb-0.5">
                  {hasWorkouts ? (
                    workouts.map((w, wIdx) => (
                      <span 
                        key={wIdx} 
                        className={`
                          h-1.5 w-1.5 rounded-full bg-violet-400 shadow-md shadow-violet-500/50 animate-pulse
                          ${isSelected ? 'bg-fuchsia-400 shadow-fuchsia-500/50' : ''}
                        `}
                      />
                    ))
                  ) : null}
                </div>

                {/* Pulse Glow Background on hover if workout completed */}
                {hasWorkouts && !isSelected && (
                  <div className="absolute inset-0 rounded-xl bg-violet-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Daily Logs & Action Drawer */}
      <div className="space-y-4">
        <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest">
          Logs for {selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </h4>

        {selectedWorkouts.length === 0 ? (
          <div className="glass-card p-5 border-dashed border-slate-800 bg-slate-900/10 text-center">
            <CalendarIcon className="w-6 h-6 text-slate-600 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-500">No workout logs recorded on this day.</p>
            <p className="text-[10px] text-slate-600 mt-0.5">Maintain consistency by scheduling a workout split.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {selectedWorkouts.map((session, index) => {
              const isLast = isSelectedDayWorkoutLast(session);
              
              return (
                <div 
                  key={session.id || index}
                  className="glass-card border-slate-800 bg-slate-900/50 p-4 space-y-4 animate-slideUp relative overflow-hidden"
                >
                  {/* Decorative glow for latest completed workout */}
                  {isLast && (
                    <div className="absolute top-0 right-0 -mr-6 -mt-6 w-16 h-16 rounded-full bg-violet-600/10 blur-xl pointer-events-none" />
                  )}

                  {/* Header and Program Meta */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-black text-violet-400 uppercase tracking-wider">
                          {isLast ? 'MOST RECENT LOG' : 'COMPLETED WORKOUT'}
                        </span>
                        {isLast && (
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                        )}
                      </div>
                      <h5 className="text-sm font-black text-slate-200 mt-1">{session.day}</h5>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-[10px] text-slate-400 bg-slate-850 px-2 py-0.5 rounded border border-slate-800 font-bold">
                          {session.program}
                        </span>
                        <span className="text-[10px] text-slate-400 bg-slate-850 px-2 py-0.5 rounded border border-slate-800 font-bold">
                          {session.phase}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 font-bold uppercase block">Volume</span>
                      <span className="text-base font-black text-violet-400 mt-0.5">
                        {(session.totalVolume || 0).toLocaleString()}
                        <span className="text-[10px] font-extrabold text-slate-500 ml-0.5">KG</span>
                      </span>
                    </div>
                  </div>

                  {/* Telemetry Stats */}
                  <div className="grid grid-cols-2 gap-3 bg-slate-950/40 p-3 rounded-xl border border-slate-850">
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold uppercase block">Workout Duration</span>
                      <span className="text-xs font-mono font-extrabold text-slate-300 mt-0.5">
                        {formatDuration(session.duration || 0)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold uppercase block">Sets Logged</span>
                      <span className="text-xs font-mono font-extrabold text-slate-300 mt-0.5">
                        {session.completedSets || 0} Sets
                      </span>
                    </div>
                  </div>

                  {/* Exercises Checklist Preview */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Completed Exercises:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {session.logs?.map((exLog, exIdx) => {
                        const completedSetsCount = exLog.sets?.filter(s => s.isComplete).length || 0;
                        if (completedSetsCount === 0) return null;

                        return (
                          <button 
                            key={exIdx}
                            type="button"
                            onClick={() => setSelectedExerciseForHistory(exLog.exerciseName)}
                            className="text-[10px] font-bold bg-slate-950/60 hover:bg-slate-900 border border-slate-800/80 hover:border-slate-700/60 px-2 py-1 rounded text-slate-300 cursor-pointer transition-all active:scale-[0.98] text-left"
                          >
                            {exLog.exerciseName} <span className="text-violet-400 font-extrabold">({completedSetsCount}s)</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Toggle Details Action */}
                  <div className="flex items-center justify-between border-t border-slate-850/60 pt-3">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Workout Breakdown</span>
                    <button
                      type="button"
                      onClick={() => setExpandedSessionId(expandedSessionId === session.id ? null : session.id)}
                      className="flex items-center gap-1 text-[10px] font-bold text-violet-400 hover:text-violet-300 transition-colors"
                    >
                      {expandedSessionId === session.id ? (
                        <>Hide Details <ChevronUp className="w-3.5 h-3.5" /></>
                      ) : (
                        <>View Details <ChevronDown className="w-3.5 h-3.5" /></>
                      )}
                    </button>
                  </div>

                  {/* Expanded exercise details panel */}
                  {expandedSessionId === session.id && (
                    <div className="space-y-3 pt-3 border-t border-slate-850 animate-fadeIn">
                      {session.logs?.map((exLog, exIdx) => {
                        const completedSets = exLog.sets?.filter(s => s.isComplete) || [];
                        if (completedSets.length === 0) return null;

                        return (
                          <div key={exIdx} className="space-y-1.5 p-3 rounded-xl bg-slate-950/40 border border-slate-850/80">
                            <h6 
                              onClick={() => setSelectedExerciseForHistory(exLog.exerciseName)}
                              className="text-[11px] font-black text-slate-300 hover:text-violet-400 cursor-pointer flex items-center gap-1.5 transition-colors"
                            >
                              <span className="text-[10px] font-black text-violet-400 font-mono">
                                {(exIdx + 1).toString().padStart(2, '0')}
                              </span>
                              <span className="underline decoration-dotted decoration-violet-500/50">{exLog.exerciseName}</span>
                            </h6>
                            <div className="grid grid-cols-2 gap-1.5 text-[10px] font-bold font-mono text-slate-400">
                              {completedSets.map((set, setIdx) => (
                                <div key={setIdx} className="flex justify-between bg-slate-900/50 px-2.5 py-1.5 rounded-lg border border-slate-850/50">
                                  <span className="text-slate-500 font-bold">SET {set.setNumber}</span>
                                  <span className="font-black text-slate-200">
                                    {set.weight || '—'} KG × {set.repsCompleted || '—'}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Action Buttons for the active/most recent session */}
                  {isLast ? (
                    <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-850">
                      <button
                        onClick={handleRestart}
                        className="py-2.5 px-3 rounded-xl font-bold bg-slate-800 hover:bg-slate-700 hover:text-slate-100 text-slate-300 border border-slate-700 flex items-center justify-center gap-2 text-xs active:scale-[0.98] transition-all"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Restart / Edit
                      </button>

                      <button
                        onClick={handleDelete}
                        className="py-2.5 px-3 rounded-xl font-bold bg-rose-950/30 hover:bg-rose-900/40 text-rose-400 border border-rose-900/40 flex items-center justify-center gap-2 text-xs active:scale-[0.98] transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete Log
                      </button>
                    </div>
                  ) : (
                    <div className="pt-2 border-t border-slate-850 text-center">
                      <p className="text-[10px] font-bold text-slate-650">
                        🔒 Restart and Delete actions are restricted to the most recent log.
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
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
