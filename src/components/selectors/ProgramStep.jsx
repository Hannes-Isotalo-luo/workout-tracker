import { ChevronRight, Layers, Calendar } from 'lucide-react'
import { getPrograms, getPhases, getDays } from '../../utils/csvParser'

export function ProgramStep({ programData, selectProgram }) {
  const programs = getPrograms(programData)
  
  return (
    <div className="space-y-5 animate-fadeIn">
      <div className="text-center py-2">
        <h2 className="text-xl font-black text-slate-100 tracking-tight">Choose Your split</h2>
        <p className="text-xs text-slate-400 mt-1">Select a program template to begin your hypertrophy training block.</p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {programs.map((program) => {
          // Compute summary stats for visual interest
          const phases = getPhases(programData, program)
          const allDays = phases.flatMap(ph => getDays(programData, program, ph))
          const uniqueDaysCount = new Set(allDays).size

          return (
            <button
              key={program}
              onClick={() => selectProgram(program)}
              className="glass-card p-5 text-left border-slate-800 hover:border-violet-500/50 hover:bg-slate-800/30 transition-all duration-300 transform active:scale-[0.99] group flex items-center justify-between relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-violet-500 to-fuchsia-500 opacity-60 group-hover:opacity-100 transition-opacity" />
              
              <div className="space-y-1.5 pl-2">
                <h3 className="text-base font-extrabold text-slate-100 group-hover:text-violet-400 transition-colors">
                  {program}
                </h3>
                <div className="flex items-center gap-3 text-[11px] text-slate-400 font-bold">
                  <span className="flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-slate-500" />
                    {phases.length} Phases
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    {uniqueDaysCount} Split Days
                  </span>
                </div>
              </div>

              <div className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800/80 flex items-center justify-center group-hover:bg-violet-600 group-hover:text-white transition-all duration-300">
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white" />
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
