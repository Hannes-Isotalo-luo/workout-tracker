import Papa from 'papaparse'

// ─────────────────────────────────────────────────────────────────────
// csvParser.js
//
// Fetches the workout program CSV from /public/data/ and transforms it
// into the nested map structure consumed by the rest of the app:
//
//   programData[Program][Phase][Day] → Exercise[]
//
// Each Exercise object: { exercise, sets, reps, rpe, rest, notes }
// ─────────────────────────────────────────────────────────────────────

/**
 * Fetches and parses the workout program CSV.
 * @param {string} csvPath — path relative to public/ (default: '/data/program.csv')
 * @returns {Promise<Object>} nested map: Program → Phase → Day → Exercise[]
 */
export async function parseProgramCSV(csvPath = '/data/program.csv') {
  const response = await fetch(csvPath)

  if (!response.ok) {
    throw new Error(`[csvParser] Failed to fetch CSV: ${response.status} ${response.statusText}`)
  }

  const csvText = await response.text()

  const { data, errors } = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim(),
  })

  if (errors.length > 0) {
    console.warn('[csvParser] Parse warnings:', errors)
  }

  // ── Build the nested structure ──────────────────────────────────
  const programData = {}

  data.forEach((row, index) => {
    const program = row.Program?.trim()
    const phase = row.Phase?.trim()
    const day = row.Day?.trim()
    const exercise = row.Exercise?.trim()

    // Skip rows with missing key fields
    if (!program || !phase || !day || !exercise) {
      console.warn(`[csvParser] Skipping row ${index + 2}: missing required field`, row)
      return
    }

    if (!programData[program]) programData[program] = {}
    if (!programData[program][phase]) programData[program][phase] = {}
    if (!programData[program][phase][day]) programData[program][phase][day] = []

    programData[program][phase][day].push({
      exercise,
      sets: parseInt(row.Sets, 10) || 3,
      reps: row.Reps?.trim() || '', // kept as String (handles "20SEC" for timed sets)
      rpe: parseInt(row.RPE, 10) || 0,
      rest: row.Rest?.trim() || '',
      notes: row.Notes?.trim() || '',
    })
  })

  return programData
}

// ─── Convenience Selectors ──────────────────────────────────────────
// Used by the selector wizard and the next-session calculator.

/** @returns {string[]} all program names */
export function getPrograms(programData) {
  return programData ? Object.keys(programData) : []
}

/** @returns {string[]} phase names for a given program */
export function getPhases(programData, program) {
  return programData?.[program] ? Object.keys(programData[program]) : []
}

/** @returns {string[]} day names for a given program + phase */
export function getDays(programData, program, phase) {
  return programData?.[program]?.[phase] ? Object.keys(programData[program][phase]) : []
}

/** @returns {Object[]} exercise list for a specific day */
export function getExercises(programData, program, phase, day) {
  return programData?.[program]?.[phase]?.[day] || []
}
