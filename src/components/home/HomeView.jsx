import { useWorkout } from '../../context/WorkoutContext';
import { calculateNextSession } from '../../utils/nextSession';
import { getExercises } from '../../utils/csvParser';
import ActiveWorkoutBanner from '../layout/ActiveWorkoutBanner';
import QuickStartCard from './QuickStartCard';
import { ProgramStep } from '../selectors/ProgramStep';
import { PhaseStep } from '../selectors/PhaseStep';
import { DayStep } from '../selectors/DayStep';

/** Landing/select view: resume banner, quick-start, and the selector wizard. */
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
  } = useWorkout();

  const nextSession = calculateNextSession(programData, lastCompletedSession, enrolledProgram, workoutHistory);
  const nextExercises = nextSession ? getExercises(programData, nextSession.program, nextSession.phase, nextSession.day) : [];

  const handleQuickStart = () => {
    if (!nextSession) return;
    selectProgram(nextSession.program);
    selectPhase(nextSession.phase);
    initSession(nextSession.day, nextExercises);
  };

  const handleChangeSplit = () => {
    if (
      window.confirm(
        `Are you sure you want to switch your active program from "${enrolledProgram}"? Your progression history will remain, but the next suggested workout will target the new program.`
      )
    ) {
      abandonProgram();
    }
  };

  return (
    <div className="space-y-6">
      <ActiveWorkoutBanner />

      {nextSession && !activeSession && !selectedProgram && (
        <QuickStartCard
          nextSession={nextSession}
          nextExercises={nextExercises}
          onQuickStart={handleQuickStart}
          enrolledProgram={enrolledProgram}
          onChangeSplit={handleChangeSplit}
        />
      )}

      {!selectedProgram && <ProgramStep programData={programData} selectProgram={selectProgram} />}
      {selectedProgram && !selectedPhase && (
        <PhaseStep programData={programData} selectedProgram={selectedProgram} selectPhase={selectPhase} clearSelection={clearSelection} />
      )}
      {selectedProgram && selectedPhase && (
        <DayStep
          programData={programData}
          selectedProgram={selectedProgram}
          selectedPhase={selectedPhase}
          initSession={initSession}
          selectProgram={selectProgram}
        />
      )}
    </div>
  );
}
