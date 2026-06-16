import { ArrowLeft, Play } from 'lucide-react'
import { getDays, getExercises } from '../../utils/csvParser'
import { useWorkout } from '../../context/WorkoutContext'

export function DayStep({ programData, selectedProgram, selectedPhase, initSession, selectProgram }) {
  const days = getDays(programData, selectedProgram, selectedPhase)
  const { workoutHistory } = useWorkout()

  const handleBack = () => {
    // Go back to phase step by re-selecting the current program (resets phase)
    selectProgram(selectedProgram)
  }

  const getLastPerformedLabel = (dayName) => {
    if (!workoutHistory || workoutHistory.length === 0) return 'Never'
    
    // Find the most recent session
    const lastSession = [...workoutHistory]
      .reverse()
      .find(s => s.program === selectedProgram && s.phase === selectedPhase && s.day === dayName)
      
    if (!lastSession) return 'Never'
    
    const dateStr = lastSession.completedAt || lastSession.date
    if (!dateStr) return 'Never'
    
    const completedDate = new Date(dateStr)
    const today = new Date()
    
    // Clear time components for calendar day comparison
    const completedOnly = new Date(completedDate.getFullYear(), completedDate.getMonth(), completedDate.getDate())
    const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    
    const diffTime = todayOnly.getTime() - completedOnly.getTime()
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays > 1) return `${diffDays} days ago`
    return 'Today' // fallback for negative diff or edge cases
  }

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Back button */}
      <button
        onClick={handleBack}
        className="min-h-[44px] flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-slate-200 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        BACK TO BLOCKS
      </button>

      <div className="text-center py-1">
        <div className="flex items-center justify-center gap-2 flex-wrap">
          <span className="text-[10px] font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
            {selectedProgram}
          </span>
          <span className="text-[10px] font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
            {selectedPhase}
          </span>
        </div>
        <h2 className="text-xl font-black text-slate-100 tracking-tight mt-3.5">Choose Session Day</h2>
        <p className="text-xs text-slate-400 mt-1">Select today's layout to load movements, targets, and logs.</p>
      </div>

      <div className="grid grid-cols-1 gap-3.5">
        {days.map((day) => {
          const exercises = getExercises(programData, selectedProgram, selectedPhase, day)
          const lastPerformed = getLastPerformedLabel(day)
          
          return (
            <button
              key={day}
              onClick={() => initSession(day, exercises)}
              className="glass-card p-4 text-left border-slate-800 hover:border-violet-500/50 hover:bg-slate-800/35 transition-all duration-300 transform active:scale-[0.99] group relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-cyan-500 to-violet-500 opacity-60 group-hover:opacity-100 transition-opacity" />
              
              <div className="flex items-start justify-between gap-4 pl-2">
                <div className="space-y-2">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h3 className="text-sm font-extrabold text-slate-100 group-hover:text-violet-400 transition-colors">
                      {day}
                    </h3>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      lastPerformed === 'Never' 
                        ? 'bg-slate-950/40 border-slate-800 text-slate-500' 
                        : 'bg-violet-500/10 border-violet-500/20 text-violet-400'
                    }`}>
                      {lastPerformed === 'Never' ? 'Never' : lastPerformed}
                    </span>
                  </div>
                  
                  {/* Mini exercises index list */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    {exercises.slice(0, 3).map((ex, i) => (
                      <span 
                        key={i} 
                        className="text-[10px] font-bold bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-slate-400 truncate max-w-[110px]"
                      >
                        {ex.exercise}
                      </span>
                    ))}
                    {exercises.length > 3 && (
                      <span className="text-[10px] font-extrabold bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded text-violet-400">
                        +{exercises.length - 3} more
                      </span>
                    )}
                  </div>
                </div>

                <div className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800/80 flex items-center justify-center group-hover:bg-violet-600 group-hover:text-white transition-all duration-300 flex-shrink-0 mt-0.5">
                  <Play className="w-3.5 h-3.5 text-slate-500 group-hover:text-white fill-current" />
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
