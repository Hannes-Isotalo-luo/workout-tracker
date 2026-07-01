import { memo, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const isSameDay = (a, b) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

/** Month grid with a green dot per day that has a logged workout. */
function Calendar({ currentDate, selectedDate, onMonthChange, onSelectDate, getWorkoutsForDay }) {
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  const calendarCells = useMemo(() => {
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
    const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate();
    const prevTotalDays = new Date(currentYear, currentMonth, 0).getDate();

    const cells = [];
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      cells.push({
        day: prevTotalDays - i,
        month: currentMonth === 0 ? 11 : currentMonth - 1,
        year: currentMonth === 0 ? currentYear - 1 : currentYear,
        isCurrentMonth: false,
      });
    }
    for (let i = 1; i <= totalDays; i++) {
      cells.push({ day: i, month: currentMonth, year: currentYear, isCurrentMonth: true });
    }
    const remainingCells = 42 - cells.length;
    for (let i = 1; i <= remainingCells; i++) {
      cells.push({
        day: i,
        month: currentMonth === 11 ? 0 : currentMonth + 1,
        year: currentMonth === 11 ? currentYear + 1 : currentYear,
        isCurrentMonth: false,
      });
    }
    return cells;
  }, [currentYear, currentMonth]);

  return (
    <div className="glass-card overflow-hidden shadow-xl">
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-line-sub">
        <button
          onClick={() => onMonthChange(new Date(currentYear, currentMonth - 1, 1))}
          className="w-11 h-11 flex items-center justify-center rounded-[11px] border border-line-c bg-surf-chip hover:bg-surf-hi text-[#8b96a8] transition"
          aria-label="Previous Month"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <h3 className="text-sm font-extrabold text-[#d3dae4] tracking-wide">
          {MONTH_NAMES[currentMonth]} {currentYear}
        </h3>
        <button
          onClick={() => onMonthChange(new Date(currentYear, currentMonth + 1, 1))}
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
              onClick={() => onSelectDate(cellDate)}
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
                      <span key={wIdx} className="h-1.5 w-1.5 rounded-full bg-gain" />
                    ))
                  : null}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default memo(Calendar);
