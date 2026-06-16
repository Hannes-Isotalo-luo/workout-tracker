import Papa from 'papaparse'

// ─────────────────────────────────────────────────────────────────────
// csvParser.js
//
// Fetches the workout program CSV from /public/data/ and transforms it
// into the nested map structure consumed by the rest of the app:
//
//   programData[Program][Phase][Day] → Exercise[]
//
// Each Exercise object:
//   { exercise, sets, reps, rpe, rest, notes }
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

  console.log(`[csvParser] Parsed ${data.length} exercise rows from CSV`)

  // ── Build the nested structure ──────────────────────────────────
  const programData = {}

  data.forEach((row, index) => {
    const program  = row.Program?.trim()
    const phase    = row.Phase?.trim()
    const day      = row.Day?.trim()
    const exercise = row.Exercise?.trim()

    // Skip rows with missing key fields
    if (!program || !phase || !day || !exercise) {
      console.warn(`[csvParser] Skipping row ${index + 2}: missing required field`, row)
      return
    }

    // Initialize nested levels
    if (!programData[program])                programData[program] = {}
    if (!programData[program][phase])         programData[program][phase] = {}
    if (!programData[program][phase][day])    programData[program][phase][day] = []

    programData[program][phase][day].push({
      exercise: exercise,
      sets:     parseInt(row.Sets, 10) || 3,
      reps:     row.Reps?.trim() || '',       // kept as String (handles "20SEC" for timed sets)
      rpe:      parseInt(row.RPE, 10)  || 0,
      rest:     row.Rest?.trim() || '',
      notes:    row.Notes?.trim() || '',
    })
  })

  // ── Development-phase summary log ───────────────────────────────
  const programs = Object.keys(programData)
  console.log(`[csvParser] ✅ Programs loaded: ${programs.join(', ')}`)
  programs.forEach((p) => {
    const phases = Object.keys(programData[p])
    phases.forEach((ph) => {
      const days = Object.keys(programData[p][ph])
      days.forEach((d) => {
        console.log(`  → ${p} / ${ph} / ${d}: ${programData[p][ph][d].length} exercises`)
      })
    })
  })

  return programData
}


// ─── Exercise ID Generator ──────────────────────────────────────────
// Deterministic, human-readable IDs for each exercise slot.
//
// Format:  {programAbbrev}_{phaseAbbrev}_{dayAbbrev}_{1-basedIndex}
//
// Examples:
//   "Full Body" / "Weeks 1-4" / "Full Body #1" / index 0  →  "fb_w14_fb1_1"
//   "Upper/Lower" / "Weeks 5-8" / "Lower Body #2" / index 3  →  "ul_w58_lb2_4"
//   "Body Part Split" / "Weeks 1-4" / "Chest & Triceps" / index 0  →  "bps_w14_ct_1"

const PROGRAM_ABBREV = {
  'Full Body':       'fb',
  'Upper/Lower':     'ul',
  'Body Part Split': 'bps',
}

const PHASE_ABBREV = {
  'Weeks 1-4': 'w14',
  'Weeks 5-8': 'w58',
}

const DAY_ABBREV = {
  'Full Body #1':      'fb1',
  'Full Body #2':      'fb2',
  'Full Body #3':      'fb3',
  'Lower Body #1':     'lb1',
  'Upper Body #1':     'ub1',
  'Lower Body #2':     'lb2',
  'Upper Body #2':     'ub2',
  'Chest & Triceps':   'ct',
  'Legs & Abs #1':     'la1',
  'Back & Biceps':     'bb',
  'Legs & Abs #2':     'la2',
  'Shoulders & Arms':  'sa',
}

/**
 * Generates a deterministic exercise ID from its position in the program.
 * @param {string} program  — e.g. "Full Body"
 * @param {string} phase    — e.g. "Weeks 1-4"
 * @param {string} day      — e.g. "Full Body #1"
 * @param {number} index    — 0-based index of the exercise within the day
 * @returns {string} e.g. "fb_w14_fb1_1"
 */
export function generateExerciseId(program, phase, day, index) {
  const p  = PROGRAM_ABBREV[program] || program.substring(0, 3).toLowerCase()
  const ph = PHASE_ABBREV[phase]     || phase.replace(/\D/g, '')
  const d  = DAY_ABBREV[day]         || day.replace(/[^a-zA-Z0-9]/g, '').substring(0, 4).toLowerCase()

  return `${p}_${ph}_${d}_${index + 1}`
}


// ─── Convenience Selectors ──────────────────────────────────────────
// Used by ProgramSelector / PhaseSelector / DaySelector components.

/** @returns {string[]} all program names */
export function getPrograms(programData) {
  return Object.keys(programData)
}

/** @returns {string[]} phase names for a given program */
export function getPhases(programData, program) {
  return programData[program] ? Object.keys(programData[program]) : []
}

/** @returns {string[]} day names for a given program + phase */
export function getDays(programData, program, phase) {
  return programData[program]?.[phase] ? Object.keys(programData[program][phase]) : []
}

/** @returns {Object[]} exercise list for a specific day */
export function getExercises(programData, program, phase, day) {
  return programData[program]?.[phase]?.[day] || []
}
