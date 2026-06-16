import { ArrowLeft, ChevronRight } from 'lucide-react'
import { getPhases } from '../../utils/csvParser'

export function PhaseStep({ programData, selectedProgram, selectPhase, clearSelection }) {
  const phases = getPhases(programData, selectedProgram)

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Back button */}
      <button
        onClick={clearSelection}
        className="min-h-[44px] flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-slate-200 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        BACK TO SPLITS
      </button>

      <div className="text-center py-1">
        <span className="text-[10px] font-bold tracking-widest text-violet-400 uppercase bg-violet-500/10 px-2.5 py-1 rounded-md border border-violet-500/15">
          {selectedProgram}
        </span>
        <h2 className="text-xl font-black text-slate-100 tracking-tight mt-3">Select Training Block</h2>
        <p className="text-xs text-slate-400 mt-1">Each phase introduces fresh progressions to override adaptive plateaus.</p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {phases.map((phase) => (
          <button
            key={phase}
            onClick={() => selectPhase(phase)}
            className="glass-card p-5 text-left border-slate-800 hover:border-violet-500/50 hover:bg-slate-800/30 transition-all duration-300 transform active:scale-[0.99] group flex items-center justify-between relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-fuchsia-500 to-pink-500 opacity-60 group-hover:opacity-100 transition-opacity" />
            
            <div className="space-y-1 pl-2">
              <h3 className="text-base font-extrabold text-slate-100 group-hover:text-fuchsia-400 transition-colors">
                {phase}
              </h3>
              <p className="text-xs text-slate-400 font-medium">
                {phase.includes('1-4') ? 'Foundational loading block' : 'Peak volume & high intensity block'}
              </p>
            </div>

            <div className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800/80 flex items-center justify-center group-hover:bg-fuchsia-600 group-hover:text-white transition-all duration-300">
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white" />
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
