import { ArrowLeft, ChevronRight } from 'lucide-react'
import { getPhases } from '../../utils/csvParser'

export function PhaseStep({ programData, selectedProgram, selectPhase, clearSelection }) {
  const phases = getPhases(programData, selectedProgram)

  return (
    <div className="space-y-5 animate-fadeIn">
      <button
        onClick={clearSelection}
        className="min-h-[44px] flex items-center gap-1.5 text-xs font-bold text-[#8b96a8] hover:text-[#d3dae4] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        BACK TO SPLITS
      </button>

      <div className="text-center py-1">
        <span className="text-[10px] font-bold tracking-widest text-accent uppercase bg-accent/10 px-2.5 py-1 rounded-md border border-accent/20">
          {selectedProgram}
        </span>
        <h2 className="text-xl font-black text-[#f8fafc] tracking-tight mt-3">Select Training Block</h2>
        <p className="text-xs text-[#8b96a8] mt-1">Each phase introduces fresh progressions to override adaptive plateaus.</p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {phases.map((phase) => (
          <button
            key={phase}
            onClick={() => selectPhase(phase)}
            className="bg-surf border border-line-c rounded-[18px] p-5 text-left hover:border-accent/40 hover:bg-surf-hi transition-all duration-300 active:scale-[0.99] group flex items-center justify-between relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-[3px] h-full bg-accent opacity-60 group-hover:opacity-100 transition-opacity rounded-l-[18px]" />

            <div className="space-y-1 pl-2">
              <h3 className="text-base font-extrabold text-[#f8fafc] group-hover:text-accent transition-colors">
                {phase}
              </h3>
              <p className="text-xs text-[#8b96a8] font-medium">
                {phase.includes('1-4') ? 'Foundational loading block' : 'Peak volume & high intensity block'}
              </p>
            </div>

            <div className="w-8 h-8 rounded-xl bg-surf-chip border border-line-c flex items-center justify-center group-hover:bg-accent transition-all duration-300">
              <ChevronRight className="w-4 h-4 text-[#5b6678] group-hover:text-white" />
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
