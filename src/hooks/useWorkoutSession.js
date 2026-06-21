// Canonical consumer hook for the workout context. Components import this
// (rather than reaching into WorkoutContext directly) per the architecture.
export { useWorkout as useWorkoutSession } from '../context/WorkoutContext';
