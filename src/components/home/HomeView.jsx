import { useState } from 'react';
import { BookOpen, ChevronRight } from 'lucide-react';
import { useWorkout } from '../../context/WorkoutContext';
import { calculateNextSession } from '../../utils/nextSession';
import { getExercises, getPhases } from '../../utils/csvParser';
import QuickStartCard from './QuickStartCard';
import { ProgramStep } from '../selectors/ProgramStep';
import { DayStep } from '../selectors/DayStep';

/** Train tab: quick-start at top, My Routines, optional Browse, then day picker. */
export default function HomeView() {
  const {
    programData,
    selectedProgram,
    selectedPhase,
    activeSession,
    lastCompletedSession,
    enrolledProgram,
    workoutHistory,
    selectProgram,
    selectPhase,
    clearSelection,
    initSession,
    abandonProgram,
    setView,
  } = useWorkout();

  // Collapsed by default for enrolled/returning users; open for first-timers.
  const [isBrowseOpen, setIsBrowseOpen] = useState(!enrolledProgram && !workoutHistory?.length);

  const nextSession = calculateNextSession(programData, lastCompletedSession, enrolledProgram, workoutHistory);
  const nextExercises = nextSession
    ? getExercises(programData, nextSession.program, nextSession.phase, nextSession.day)
    : [];

  const handleQuickStart = () => {
    if (!nextSession) return;
    selectProgram(nextSession.program);
    selectPhase(nextSession.phase);
    initSession(nextSession.day, nextExercises);
  };

  const handleChangeSplit = () => {
    if (window.confirm(`Switch from "${enrolledProgram}"? Your progression history stays; suggestions will follow the new program.`)) {
      abandonProgram();
      setIsBrowseOpen(true);
    }
  };

  // Auto-derive phase when a program is selected — skip the Phase step entirely.
  const handleProgramSelect = (program) => {
    selectProgram(program);
    const phases = getPhases(programData, program);
    if (phases.length === 0) return;
    const lastForProgram = [...(workoutHistory || [])].reverse().find(s => s.program === program);
    const inferred =
      lastForProgram?.phase && phases.includes(lastForProgram.phase)
        ? lastForProgram.phase
        : phases[0];
    selectPhase(inferred);
  };

  return (
    <div className="space-y-4">
      {/* ── 1. Quick-start (primary CTA for returning users) ── */}
      {nextSession && !activeSession && (
        <QuickStartCard
          nextSession={nextSession}
          nextExercises={nextExercises}
          onQuickStart={handleQuickStart}
          enrolledProgram={enrolledProgram}
          onChangeSplit={handleChangeSplit}
        />
      )}

      {/* ── 2. My Routines secondary action ── */}
      {!selectedProgram && (
        <button
          onClick={() => setView('builder')}
          className="w-full flex items-center justify-between bg-surf border border-line-c rounded-[13px] px-4 py-3 hover:border-accent/30 hover:bg-surf-hi transition-all group min-h-[52px]"
        >
          <span className="flex items-center gap-2 text-sm font-bold text-[#d3dae4]">
            <BookOpen className="w-4 h-4 text-accent" />
            My Routines
          </span>
          <ChevronRight className="w-4 h-4 text-[#5b6678] group-hover:text-accent transition-colors" />
        </button>
      )}

      {/* ── 3. Browse splits (collapsed disclosure for enrolled users) ── */}
      {!selectedProgram && (
        (enrolledProgram || nextSession) && !isBrowseOpen ? (
          <button
            onClick={() => setIsBrowseOpen(true)}
            className="w-full text-center text-xs font-bold text-[#5b6678] hover:text-[#8b96a8] py-2 transition-colors"
          >
            Browse other splits...
          </button>
        ) : (
          <ProgramStep programData={programData} selectProgram={handleProgramSelect} />
        )
      )}

      {/* ── 4. Day selector (phase auto-derived; inline override available) ── */}
      {selectedProgram && selectedPhase && (
        <DayStep
          programData={programData}
          selectedProgram={selectedProgram}
          selectedPhase={selectedPhase}
          initSession={initSession}
          selectProgram={() => { clearSelection(); setIsBrowseOpen(true); }}
          selectPhase={selectPhase}
        />
      )}
    </div>
  );
}
