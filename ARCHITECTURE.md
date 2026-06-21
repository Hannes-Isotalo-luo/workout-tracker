# ARCHITECTURE.md — Workout Tracker System Blueprint

> **Version:** 2.0  
> **Last Updated:** 2026-06-21  
> **Status:** Source of truth for all coding agents
>
> **v2.0 note:** The codebase was decomposed to match this blueprint — every file
> is now small and single-purpose (see §2 Folder Structure, which reflects the
> actual tree). PR/streak/volume logic is centralized in `utils/`, custom
> routines launch through the normal workout pipeline via `utils/routineAdapter`,
> and heavy routes (Analytics/Builder/History) are lazy-loaded. The component
> tree and tables in §3+ are indicative; §2 is authoritative for file layout.

---

## 1. System Overview

### Purpose

A **mobile-first, single-page web application** for tracking hypertrophy-focused gym workouts. The user selects a pre-loaded workout program (parsed from local CSV files), logs weights and reps per set during their session via native mobile number pads, saves the completed session to a cloud database, and reviews historical progress on per-exercise charts.

### Tech Stack

| Layer             | Technology                    | Notes                                                                 |
| ----------------- | ----------------------------- | --------------------------------------------------------------------- |
| **Build Tool**    | Vite                          | Fast HMR, ESM-native dev server                                      |
| **UI Framework**  | React 18+                     | Functional components, hooks only                                     |
| **Styling**       | Tailwind CSS                  | Utility-first; **dark mode exclusively** (`bg-slate-900 text-slate-100`) |
| **State**         | React Context + `useReducer`  | Single `WorkoutContext` for the active session                        |
| **Backend / DB**  | Firebase Firestore             | NoSQL document store for persisted workout logs                       |
| **Hosting**       | Firebase Hosting              | Static SPA deployment                                                 |
| **Charting**      | Recharts                      | Lightweight, composable React charting library                        |
| **CSV Parsing**   | PapaParse                     | Client-side CSV → JSON at build time or on first load                 |

### Design Constraints (from Project Guardrails)

- **Mobile-first only.** No desktop responsive breakpoints unless explicitly requested.
- **Dark mode exclusively.** Root: `bg-slate-900`, text: `text-slate-100`. No inline styles.
- **Native number pads** on all numeric inputs: `type="number"` + `inputmode="decimal"`.
- **Mock data first.** Firebase read/write is wired only after UI is fully built and approved.
- **Firestore rules wide-open** during development: `allow read, write: if true;`
- **Component isolation.** Max ~150 lines per file; split if exceeded.
- **Aggressive console logging** of state changes during development phase.

---

## 2. Folder Structure

> **Note:** Program/glossary CSVs are served as static assets from `public/data/`
> (`program.csv`, `keyTerms.csv`), not bundled under `src/`.

```
src/
├── components/
│   ├── layout/
│   │   ├── AppShell.jsx                 # Layout frame: Header + main slot + BottomNav
│   │   ├── Header.jsx                   # Title, cloud-sync indicator, user chip, settings button
│   │   ├── BottomNav.jsx                # Bottom tab bar (Workout · Builder · Analytics · History)
│   │   └── ActiveWorkoutBanner.jsx      # Shared "resume active workout" banner (self-contained)
│   │
│   ├── auth/
│   │   ├── AuthGate.jsx                 # Sign-in screen for unauthenticated users
│   │   └── AuthLoading.jsx             # Full-screen loader while auth resolves
│   │
│   ├── home/
│   │   ├── HomeView.jsx                 # Select view: banner + quick-start + selector wizard
│   │   └── QuickStartCard.jsx          # "Up next" sequential-session card
│   │
│   ├── selectors/
│   │   ├── ProgramStep.jsx             # Step 1: pick a program (CSV + custom routines)
│   │   ├── PhaseStep.jsx               # Step 2: pick a phase
│   │   └── DayStep.jsx                 # Step 3: pick a day → INIT_SESSION
│   │
│   ├── workout/
│   │   ├── WorkoutView.jsx             # Active workout screen — dashboard + ExerciseCard list
│   │   ├── ExerciseCard.jsx           # Single exercise: badges, last-time ref, sets, add/remove
│   │   ├── SetInput.jsx               # Single set row (memoized) — weight/reps/complete + e1RM
│   │   ├── RestTimer.jsx              # Floating rest-timer overlay (±30s, dismiss)
│   │   └── WorkoutSummary.jsx         # Post-save summary modal (volume, sets, PRs, notes)
│   │
│   ├── history/
│   │   ├── HistoryView.jsx            # Calendar + monthly stats + selected-day logs
│   │   ├── SessionDetail.jsx          # Expandable card for one completed session
│   │   └── ExerciseHistoryModal.jsx   # Per-exercise historical sets timeline
│   │
│   ├── analytics/
│   │   ├── AnalyticsDashboard.jsx     # Orchestrator: computes metrics, lays out cards/charts
│   │   ├── StrengthChart.jsx          # Per-exercise progression line chart (Recharts)
│   │   ├── VolumeChart.jsx            # Weekly volume line chart (Recharts)
│   │   ├── MuscleVolumeCard.jsx       # Weekly hard-sets per muscle vs. MEV/MRV
│   │   └── RecentSessions.jsx         # Recent saved-session list
│   │
│   ├── builder/
│   │   └── RoutineBuilder.jsx         # Build/edit/share custom routines; launch into workout flow
│   │
│   ├── settings/
│   │   └── SettingsModal.jsx          # Alert toggles + CSV export
│   │
│   └── ui/
│       ├── Button.jsx                 # Reusable button (primary/secondary/ghost/danger)
│       ├── Badge.jsx                  # Small pill (program/phase/RPE/rest)
│       ├── Modal.jsx                  # Shared modal/bottom-sheet wrapper (backdrop, close)
│       ├── Spinner.jsx                # Loading spinner (brand/default)
│       ├── Toast.jsx                  # Floating status toast
│       ├── PlateCalculatorModal.jsx   # Barbell plate + warm-up calculator
│       └── ExerciseSwapModal.jsx      # Mid-session exercise substitution
│
├── context/
│   ├── WorkoutContext.jsx             # Provider: composes hooks, dispatchers, cloud sync, routines
│   └── workoutReducer.js             # Pure reducer + action types
│
├── hooks/
│   ├── useWorkoutSession.js          # Canonical context consumer hook
│   ├── useProgramData.js             # Loads + parses the program CSV on mount
│   ├── useRestTimer.js               # Rest countdown + audio/haptic alert + tab title
│   ├── useWakeLock.js                # Screen wake lock during active sessions
│   ├── useWorkoutDuration.js         # Live elapsed-seconds counter
│   ├── useSyncToast.js               # Toasts on cloud sync success/failure
│   ├── useSharedRoutineDeepLink.js   # ?sharedRoutineId= clone flow
│   └── useBrowserHistory.js          # Back/forward navigation ↔ view-state mapping
│
├── utils/
│   ├── csvParser.js                  # PapaParse: CSV → nested program map + selectors
│   ├── exerciseIdGenerator.js        # Deterministic exercise IDs
│   ├── volumeCalculator.js           # computeSessionTotals(), epley1RM()
│   ├── prs.js                        # Personal-record map + detection (single source of truth)
│   ├── streak.js                     # Consecutive-day streak
│   ├── nextSession.js                # Next sequential session calculator
│   ├── routineAdapter.js             # Custom routine → programData shape (RoutineBuilder bridge)
│   ├── muscleGroups.js               # Exercise → muscle map, volume landmarks, alternatives
│   ├── plateCalculator.js            # Plate loading + warm-up ramp math
│   ├── exportCsv.js                  # Flatten history → downloadable CSV
│   └── formatters.js                 # Time/date/rest formatting helpers
│
├── firebase/
│   ├── config.js                     # Firebase app init + Auth + Firestore instances
│   └── workoutService.js            # All Firestore CRUD (sessions, config, routines, shares)
│
├── App.jsx                           # Root: provider + controller (gating, handlers, router)
├── main.jsx                          # Vite entry point + service-worker registration
└── index.css                         # Tailwind directives + dark-mode base + component utilities
```

### Top-level Project Files (outside `src/`)

```
workout-tracker/
├── public/
│   └── favicon.svg
├── src/                                 # (see above)
├── index.html                           # Vite HTML entry point
├── package.json
├── vite.config.js
├── tailwind.config.js                   # content: ["./src/**/*.{js,jsx}"]
├── postcss.config.js
├── firebase.json                        # Hosting config
├── .firebaserc                          # Firebase project alias
├── ARCHITECTURE.md                      # ← This file
├── project_rules.md                     # Agent guardrails
├── Fundamentals Hypertrophy Program V2*.csv   # Source workout data
└── Fundamentals Hypertrophy Key Terms*.csv    # Source glossary data
```

---

## 3. Component Tree

Below is the full React component hierarchy. Indentation represents parent → child nesting.

```
<App>                                    ── Root: holds view state (selector|workout|history), wraps providers
│
├── <WorkoutProvider>                    ── Context provider: makes activeSession available to all descendants
│   │
│   ├── <AppShell>                       ── Layout frame: sticky header + scrollable main + fixed bottom nav
│   │   ├── <Header />                   ── App title ("Workout Tracker"), optional back-arrow on sub-views
│   │   ├── [main content slot]          ── One of the views below, based on navigation state
│   │   └── <BottomNav />                ── 3 tabs: Workout · History · Settings
│   │
│   ├── ── VIEW: SELECTOR FLOW ──
│   │   ├── <ProgramSelector />          ── Cards for: "Full Body", "Upper/Lower", "Body Part Split"
│   │   ├── <PhaseSelector />            ── Cards for: "Weeks 1-4", "Weeks 5-8"
│   │   └── <DaySelector />             ── Cards for days within chosen program+phase
│   │
│   ├── ── VIEW: ACTIVE WORKOUT ──
│   │   └── <WorkoutView>               ── Scrollable list of exercises for the selected day
│   │       ├── <ExerciseCard>           ── Collapsible card per exercise (name, notes, RPE, rest)
│   │       │   ├── <Badge />            ── RPE badge (e.g. "RPE 8") and rest badge (e.g. "3-4 MIN")
│   │       │   └── <SetInput />         ── Per-set row: [Set #] [Weight ___] [Reps ___] [✓]
│   │       │       └── (native inputs)  ── type="number" inputmode="decimal"
│   │       ├── <RestTimer />            ── Floating countdown overlay (appears after marking set complete)
│   │       └── <WorkoutSummary />       ── Modal after "Save Workout" (total volume, # sets, duration)
│   │
│   └── ── VIEW: HISTORY ──
│       ├── <HistoryView>                ── Date-sorted list of past sessions
│       │   └── <SessionDetail />        ── Expandable detail for a single past workout
│       └── <ProgressChart />            ── Recharts LineChart: weight progression per exercise over time
│
└── (global) <Modal />, <Spinner />, <Button />  ── Shared UI primitives used across views
```

### Component Responsibilities

| Component            | Responsibility                                                                                              |
| -------------------- | ----------------------------------------------------------------------------------------------------------- |
| `App`                | Manages top-level navigation state (`currentView`), wraps everything in `<WorkoutProvider>`.                |
| `WorkoutProvider`    | Initializes `useReducer` with `workoutReducer`. Exposes `state` and `dispatch` via React Context.           |
| `AppShell`           | Provides the fixed layout frame: sticky header, scrollable `<main>`, and fixed-bottom navigation bar.       |
| `Header`             | Displays app title. Shows a back arrow when inside a sub-view (workout, session detail).                    |
| `BottomNav`          | Three tab buttons. Updates `currentView` in `App` state. Highlights the active tab.                         |
| `ProgramSelector`    | Reads parsed CSV data (via `useProgramData`). Renders one card per unique `Program` value.                  |
| `PhaseSelector`      | Filters phases for the selected program. Renders one card per unique `Phase` value.                         |
| `DaySelector`        | Filters days for the selected program + phase. Renders one card per unique `Day`. On selection, dispatches `INIT_SESSION` to context. |
| `WorkoutView`        | Reads `activeSession.logs[]` from context. Maps each exercise log to an `<ExerciseCard>`.                   |
| `ExerciseCard`       | Displays exercise name, notes tooltip/expand, RPE + rest badges. Maps `sets[]` to `<SetInput>` rows.       |
| `SetInput`           | Controlled inputs for weight and reps. On change, dispatches `UPDATE_SET` to context. Checkbox toggles `isComplete`. |
| `RestTimer`          | Triggered when a set's `isComplete` flips to `true`. Counts down from the exercise's rest time.             |
| `WorkoutSummary`     | Modal shown after `saveWorkout()`. Displays total volume (Σ weight × reps), completed sets, workout duration. |
| `HistoryView`        | Calls `useFirestore().getHistory()` on mount. Renders a scrollable list of past sessions sorted by date.    |
| `SessionDetail`      | Receives a single saved workout document. Renders exercise-by-exercise breakdown of weights and reps.       |
| `ProgressChart`      | Receives an exercise name. Queries Firestore for all sessions containing it. Renders a Recharts `LineChart`. |

---

## 4. State Management (Context / Store)

### Architecture

```
WorkoutContext.jsx (Provider)
    └── useReducer(workoutReducer, initialState)
         ├── state   →  consumed by components via useWorkoutSession()
         └── dispatch →  called by components via useWorkoutSession()
```

### 4.1 Active Session State Shape

This is the **single source of truth** for any in-progress workout. It lives in `WorkoutContext` and is never persisted until the user explicitly saves.

```javascript
// context/WorkoutContext.jsx → initial state
const initialState = {
  // ── Session Metadata ──────────────────────────────────
  activeSession: null,       // null when no workout is active; object when in progress:
  // {
  //   id:        String,    // UUID generated at session init (crypto.randomUUID())
  //   date:      String,    // ISO 8601 timestamp (new Date().toISOString())
  //   program:   String,    // "Full Body" | "Upper/Lower" | "Body Part Split"
  //   phase:     String,    // "Weeks 1-4" | "Weeks 5-8"
  //   day:       String,    // "Full Body #1" | "Lower Body #2" | "Chest & Triceps" etc.
  //   startedAt: String,    // ISO timestamp of when the user entered the workout view
  //   logs: [
  //     {
  //       exerciseId:    String,   // deterministic: "fb_w14_d1_1" (see exerciseIdGenerator.js)
  //       exerciseName:  String,   // "Back Squat"
  //       targetSets:    Number,   // from CSV: 3
  //       targetReps:    String,   // from CSV: "6" or "20SEC" (kept as string for timed exercises)
  //       rpe:           Number,   // from CSV: 7
  //       rest:          String,   // from CSV: "3-4MIN"
  //       notes:         String,   // from CSV: "SIT BACK AND DOWN, 15° TOE FLARE, ..."
  //       sets: [
  //         {
  //           setNumber:     Number,   // 1-indexed
  //           weight:        String,   // "" until user types (kept as string for input binding)
  //           repsCompleted: String,   // "" until user types
  //           isComplete:    Boolean   // false → true when user taps the checkmark
  //         }
  //       ]
  //     }
  //   ]
  // }

  // ── Selection State (wizard steps) ────────────────────
  selectedProgram: null,     // String | null
  selectedPhase:   null,     // String | null

  // ── UI State ──────────────────────────────────────────
  currentView:     "select", // "select" | "workout" | "history"
  restTimer: {
    isRunning:   false,
    seconds:     0,
    exerciseId:  null        // which exercise triggered it
  }
};
```

### 4.2 Reducer Actions

```javascript
// context/workoutReducer.js

const ACTION_TYPES = {
  // ── Selection Flow ──
  SELECT_PROGRAM:    "SELECT_PROGRAM",     // payload: { program: String }
  SELECT_PHASE:      "SELECT_PHASE",       // payload: { phase: String }
  CLEAR_SELECTION:   "CLEAR_SELECTION",     // payload: none — resets wizard to step 1

  // ── Session Lifecycle ──
  INIT_SESSION:      "INIT_SESSION",       // payload: { day: String, exercises: ExerciseLog[] }
                                            //   Populates activeSession from parsed CSV data
  CANCEL_SESSION:    "CANCEL_SESSION",     // payload: none — discards activeSession, returns to selector
  SAVE_SESSION:      "SAVE_SESSION",       // payload: none — marks session as ready-to-persist
                                            //   (actual Firestore write happens in the hook, not the reducer)

  // ── Set-Level Updates ──
  UPDATE_SET:        "UPDATE_SET",         // payload: { exerciseId, setNumber, field, value }
                                            //   field: "weight" | "repsCompleted" | "isComplete"
  TOGGLE_SET_COMPLETE: "TOGGLE_SET_COMPLETE", // payload: { exerciseId, setNumber }

  // ── Rest Timer ──
  START_REST_TIMER:  "START_REST_TIMER",   // payload: { seconds: Number, exerciseId: String }
  TICK_REST_TIMER:   "TICK_REST_TIMER",    // payload: none — decrements by 1
  STOP_REST_TIMER:   "STOP_REST_TIMER",    // payload: none

  // ── Navigation ──
  SET_VIEW:          "SET_VIEW"            // payload: { view: "select" | "workout" | "history" }
};
```

### 4.3 Custom Hook API

```javascript
// hooks/useWorkoutSession.js
// Convenience wrapper around useContext(WorkoutContext)

function useWorkoutSession() {
  const { state, dispatch } = useContext(WorkoutContext);

  return {
    // ── Read ──
    activeSession:    state.activeSession,
    selectedProgram:  state.selectedProgram,
    selectedPhase:    state.selectedPhase,
    currentView:      state.currentView,
    restTimer:        state.restTimer,

    // ── Write (dispatch wrappers) ──
    selectProgram:    (program)                          => dispatch({ type: "SELECT_PROGRAM", payload: { program } }),
    selectPhase:      (phase)                            => dispatch({ type: "SELECT_PHASE", payload: { phase } }),
    clearSelection:   ()                                 => dispatch({ type: "CLEAR_SELECTION" }),
    initSession:      (day, exercises)                   => dispatch({ type: "INIT_SESSION", payload: { day, exercises } }),
    updateSet:        (exerciseId, setNumber, field, value) => dispatch({ type: "UPDATE_SET", payload: { exerciseId, setNumber, field, value } }),
    toggleSetComplete:(exerciseId, setNumber)             => dispatch({ type: "TOGGLE_SET_COMPLETE", payload: { exerciseId, setNumber } }),
    cancelSession:    ()                                 => dispatch({ type: "CANCEL_SESSION" }),
    saveSession:      ()                                 => dispatch({ type: "SAVE_SESSION" }),
    setView:          (view)                             => dispatch({ type: "SET_VIEW", payload: { view } }),
    startRestTimer:   (seconds, exerciseId)              => dispatch({ type: "START_REST_TIMER", payload: { seconds, exerciseId } }),
    tickRestTimer:    ()                                 => dispatch({ type: "TICK_REST_TIMER" }),
    stopRestTimer:    ()                                 => dispatch({ type: "STOP_REST_TIMER" }),
  };
}
```

---

## 5. Database Schema (Firebase Firestore)

### Development Phase Rules

```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true; // TODO: Lock down to specific UID before production
    }
  }
}
```

### Collection Map

```
Firestore Root
│
└── workoutLogs/                         ← Top-level collection
    └── {logId}/                         ← Auto-generated document ID (or UUID from client)
        ├── id:           String         ← Same UUID used as the doc ID
        ├── date:         Timestamp      ← Firestore Timestamp of when session was saved
        ├── program:      String         ← "Full Body" | "Upper/Lower" | "Body Part Split"
        ├── phase:        String         ← "Weeks 1-4" | "Weeks 5-8"
        ├── day:          String         ← "Full Body #1" | "Lower Body #2" | etc.
        ├── startedAt:    Timestamp      ← When the user entered the workout view
        ├── completedAt:  Timestamp      ← When the user pressed "Save Workout"
        ├── totalVolume:  Number         ← Σ(weight × reps) across all completed sets
        ├── totalSets:    Number         ← Count of sets where isComplete === true
        └── exercises:    Array          ← Ordered array of exercise log objects
            └── [index]
                ├── exerciseId:    String     ← "fb_w14_d1_1"
                ├── exerciseName:  String     ← "Back Squat"
                ├── targetSets:    Number     ← 3
                ├── targetReps:    String     ← "6"
                ├── rpe:           Number     ← 7
                └── sets:          Array      ← Ordered array of set objects
                    └── [index]
                        ├── setNumber:     Number     ← 1
                        ├── weight:        Number     ← 135  (converted from String on save)
                        ├── repsCompleted: Number     ← 6    (converted from String on save)
                        └── isComplete:    Boolean    ← true
```

### Indexing Strategy

The following **composite indexes** should be configured for efficient querying:

| Query Purpose                        | Fields (ascending unless noted)           |
| ------------------------------------ | ----------------------------------------- |
| History list (date-sorted)           | `program` ASC, `date` DESC                |
| Per-exercise progress chart          | `exercises.exerciseName` (array-contains query not ideal — see note below) |

> **Note on per-exercise queries:** Firestore does not support `array-contains` on nested object fields. For the progress chart, the recommended approach during development is:
> 1. Query all `workoutLogs` for a given `program` (optionally filtered by `day`), ordered by `date` DESC.
> 2. Client-side filter: extract the matching exercise from each document's `exercises[]` array.
> 3. If performance becomes an issue at scale, denormalize into a subcollection: `workoutLogs/{logId}/exerciseSets/{exerciseId}`.

### Example Firestore Document

```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "date": "2026-05-31T16:00:00.000Z",
  "program": "Full Body",
  "phase": "Weeks 1-4",
  "day": "Full Body #1",
  "startedAt": "2026-05-31T15:30:00.000Z",
  "completedAt": "2026-05-31T16:45:00.000Z",
  "totalVolume": 12450,
  "totalSets": 21,
  "exercises": [
    {
      "exerciseId": "fb_w14_d1_1",
      "exerciseName": "Back Squat",
      "targetSets": 3,
      "targetReps": "6",
      "rpe": 7,
      "sets": [
        { "setNumber": 1, "weight": 225, "repsCompleted": 6, "isComplete": true },
        { "setNumber": 2, "weight": 225, "repsCompleted": 6, "isComplete": true },
        { "setNumber": 3, "weight": 215, "repsCompleted": 6, "isComplete": true }
      ]
    },
    {
      "exerciseId": "fb_w14_d1_2",
      "exerciseName": "Barbell Bench Press",
      "targetSets": 3,
      "targetReps": "8",
      "rpe": 7,
      "sets": [
        { "setNumber": 1, "weight": 185, "repsCompleted": 8, "isComplete": true },
        { "setNumber": 2, "weight": 185, "repsCompleted": 7, "isComplete": true },
        { "setNumber": 3, "weight": 175, "repsCompleted": 8, "isComplete": true }
      ]
    }
  ]
}
```

---

## 6. Data Initialization Flow

This section describes exactly how the local CSV files become an active workout session in the app.

### 6.1 Source CSV Structure

The primary CSV file (`Fundamentals Hypertrophy Program V2 - *.csv`) contains 156 exercise rows with the following columns:

```
Program, Phase, Day, Exercise, Sets, Reps, RPE, Rest, Notes
```

**Unique values found in the source data:**

| Column    | Unique Values                                                                                     |
| --------- | ------------------------------------------------------------------------------------------------- |
| Program   | `Full Body`, `Upper/Lower`, `Body Part Split`                                                     |
| Phase     | `Weeks 1-4`, `Weeks 5-8`                                                                         |
| Day       | Full Body: `#1`, `#2`, `#3` — Upper/Lower: `Lower Body #1`, `Upper Body #1`, `Lower Body #2`, `Upper Body #2` — Body Part Split: `Chest & Triceps`, `Legs & Abs #1`, `Back & Biceps`, `Legs & Abs #2`, `Shoulders & Arms` |

### 6.2 Step-by-Step Flow

```
┌──────────────────────────────────────────────────────────────────────┐
│  STEP 1: CSV FILE PLACEMENT                                         │
│                                                                      │
│  During project setup, the raw CSV files are copied into:            │
│    src/assets/data/program.csv                                       │
│    src/assets/data/keyTerms.csv                                      │
│                                                                      │
│  Vite treats these as static assets importable via:                  │
│    import programCsvUrl from '../assets/data/program.csv?url'        │
│                                                                      │
│  Alternatively, for build-time inlining:                             │
│    import programCsvRaw from '../assets/data/program.csv?raw'        │
└──────────────────────────┬───────────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────────┐
│  STEP 2: PARSE CSV → STRUCTURED JAVASCRIPT OBJECT                    │
│                                                                      │
│  Location: utils/csvParser.js                                        │
│  Library:  PapaParse                                                 │
│                                                                      │
│  Input:  Raw CSV string (via ?raw import)                            │
│  Output: Nested map structure:                                       │
│                                                                      │
│  {                                                                   │
│    "Full Body": {                                                    │
│      "Weeks 1-4": {                                                  │
│        "Full Body #1": [                                             │
│          {                                                           │
│            exercise: "Back Squat",                                   │
│            sets: 3,                                                  │
│            reps: "6",                                                │
│            rpe: 7,                                                   │
│            rest: "3-4MIN",                                           │
│            notes: "SIT BACK AND DOWN, ..."                           │
│          },                                                          │
│          ...                                                         │
│        ],                                                            │
│        "Full Body #2": [ ... ],                                      │
│        "Full Body #3": [ ... ]                                       │
│      },                                                              │
│      "Weeks 5-8": { ... }                                            │
│    },                                                                │
│    "Upper/Lower": { ... },                                           │
│    "Body Part Split": { ... }                                        │
│  }                                                                   │
│                                                                      │
│  The parser function:                                                │
│  1. Calls Papa.parse(csvString, { header: true, skipEmptyLines: true }) │
│  2. Iterates each row, trimming whitespace from all fields           │
│  3. Casts `Sets` to Number, `RPE` to Number                         │
│  4. Keeps `Reps` as String (handles "20SEC" for timed exercises)     │
│  5. Groups rows into the nested Program → Phase → Day → Exercise[]  │
│     map using reduce()                                               │
└──────────────────────────┬───────────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────────┐
│  STEP 3: CACHE IN CUSTOM HOOK (useProgramData)                       │
│                                                                      │
│  Location: hooks/useProgramData.js                                   │
│                                                                      │
│  This hook:                                                          │
│  1. Runs once on mount (useEffect with [] deps)                      │
│  2. Imports the raw CSV string                                       │
│  3. Calls csvParser.parseProgramCSV(rawString)                       │
│  4. Stores the result in useState                                    │
│  5. Exposes:                                                         │
│     - programData:          the full nested map                      │
│     - getPrograms():        Object.keys(programData)                 │
│                              → ["Full Body", "Upper/Lower", ...]     │
│     - getPhases(program):   Object.keys(programData[program])        │
│                              → ["Weeks 1-4", "Weeks 5-8"]           │
│     - getDays(program, phase): Object.keys(...)                      │
│                              → ["Full Body #1", "Full Body #2", ...] │
│     - getExercises(program, phase, day): Exercise[]                  │
│     - isLoading:            boolean                                  │
└──────────────────────────┬───────────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────────┐
│  STEP 4: USER SELECTS PROGRAM → PHASE → DAY                         │
│                                                                      │
│  UI Flow (3-step wizard):                                            │
│                                                                      │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐  │
│  │ ProgramSelector │ →  │ PhaseSelector   │ →  │ DaySelector     │  │
│  │                 │    │                 │    │                 │  │
│  │ ○ Full Body     │    │ ○ Weeks 1-4     │    │ ○ Full Body #1  │  │
│  │ ○ Upper/Lower   │    │ ○ Weeks 5-8     │    │ ○ Full Body #2  │  │
│  │ ○ Body Part     │    │                 │    │ ○ Full Body #3  │  │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘  │
│                                                                      │
│  Each selection dispatches to the reducer:                           │
│  1. ProgramSelector → dispatch(SELECT_PROGRAM, { program })         │
│  2. PhaseSelector   → dispatch(SELECT_PHASE, { phase })             │
│  3. DaySelector     → triggers INIT_SESSION (see Step 5)            │
└──────────────────────────┬───────────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────────┐
│  STEP 5: INIT_SESSION — BUILD THE ACTIVE SESSION STATE               │
│                                                                      │
│  Triggered: When the user taps a Day card in DaySelector             │
│                                                                      │
│  DaySelector calls:                                                  │
│    const exercises = programData[selectedProgram][selectedPhase][day] │
│    initSession(day, exercises)                                       │
│                                                                      │
│  The reducer handles INIT_SESSION by:                                │
│                                                                      │
│  1. Generating a UUID for the session:                               │
│       id = crypto.randomUUID()                                       │
│                                                                      │
│  2. Recording metadata:                                              │
│       date = new Date().toISOString()                                │
│       program = state.selectedProgram                                │
│       phase = state.selectedPhase                                    │
│       day = action.payload.day                                       │
│       startedAt = new Date().toISOString()                           │
│                                                                      │
│  3. Transforming each CSV exercise into an exercise log object:      │
│                                                                      │
│       exercises.map((exercise, index) => ({                          │
│         exerciseId: generateExerciseId(program, phase, day, index),  │
│         exerciseName: exercise.exercise,                             │
│         targetSets: exercise.sets,                  // Number        │
│         targetReps: exercise.reps,                  // String        │
│         rpe: exercise.rpe,                          // Number        │
│         rest: exercise.rest,                        // String        │
│         notes: exercise.notes,                      // String        │
│         sets: Array.from(                                            │
│           { length: exercise.sets },                                 │
│           (_, i) => ({                                               │
│             setNumber: i + 1,                                        │
│             weight: "",                 // empty — user fills in     │
│             repsCompleted: "",          // empty — user fills in     │
│             isComplete: false                                        │
│           })                                                         │
│         )                                                            │
│       }))                                                            │
│                                                                      │
│  4. Setting currentView to "workout"                                 │
│                                                                      │
│  Result: activeSession is now fully populated, WorkoutView renders.  │
└──────────────────────────┬───────────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────────┐
│  STEP 6: USER LOGS SETS → SAVE TO FIRESTORE                         │
│                                                                      │
│  During workout:                                                     │
│    - SetInput dispatches UPDATE_SET on every keystroke                │
│    - Checkbox dispatches TOGGLE_SET_COMPLETE                         │
│    - RestTimer auto-starts on set completion                         │
│                                                                      │
│  On "Save Workout" button press:                                     │
│    1. dispatch(SAVE_SESSION) — reducer marks session as saved        │
│    2. useFirestore().saveWorkout(activeSession) is called:           │
│       a. Converts weight/reps strings to Numbers                     │
│       b. Computes totalVolume and totalSets                          │
│       c. Adds completedAt timestamp                                  │
│       d. Writes to Firestore: addDoc(collection(db, "workoutLogs")) │
│    3. WorkoutSummary modal appears with stats                        │
│    4. On modal dismiss: dispatch(CANCEL_SESSION) + SET_VIEW("select")│
└──────────────────────────────────────────────────────────────────────┘
```

### 6.3 Exercise ID Generation

The `exerciseIdGenerator.js` utility produces deterministic, human-readable IDs:

```
Format:  {programAbbrev}_{phaseAbbrev}_{dayAbbrev}_{exerciseIndex}

Examples:
  "Full Body"       + "Weeks 1-4" + "Full Body #1"    + index 0 → "fb_w14_d1_1"
  "Full Body"       + "Weeks 1-4" + "Full Body #1"    + index 1 → "fb_w14_d1_2"
  "Upper/Lower"     + "Weeks 5-8" + "Lower Body #2"   + index 3 → "ul_w58_lb2_4"
  "Body Part Split" + "Weeks 1-4" + "Chest & Triceps"  + index 0 → "bps_w14_ct_1"

Abbreviation rules:
  Program:  "Full Body" → "fb", "Upper/Lower" → "ul", "Body Part Split" → "bps"
  Phase:    "Weeks 1-4" → "w14", "Weeks 5-8" → "w58"
  Day:      First letter(s) of words + number → "d1", "lb2", "ub1", "ct", "la1", "bb", "sa"
  Index:    1-based (index + 1)
```

---

## Appendix A: Key Terms Glossary (from CSV)

These definitions are sourced from `Fundamentals Hypertrophy Key Terms.csv` and may be displayed in a tooltip or info modal within the app.

| Term     | Definition                                                                                                |
| -------- | --------------------------------------------------------------------------------------------------------- |
| Program  | The specific split or routine being followed (e.g., Full Body or Upper/Lower).                            |
| Phase    | The training block or specific weeks of the program (e.g., Weeks 1-4).                                    |
| Day      | The specific workout session within the training phase.                                                   |
| Exercise | The specific movement to be performed.                                                                    |
| Sets     | A group of consecutive repetitions performed without rest.                                                |
| Reps     | Short for repetitions, the number of times you perform the movement in a single set.                      |
| RPE      | Rate of Perceived Exertion. A 1-10 scale measuring intensity. RPE 8 = 2 reps in reserve, RPE 10 = failure. |
| Rest     | The recommended amount of time to rest between sets.                                                      |
| Notes    | Specific form cues or instructions for the exercise.                                                      |

---

## Appendix B: Program Summary (from CSV)

Quick reference for the scope of workout data loaded into the app:

| Program          | Phase       | Days                                                                          | Exercises per Day |
| ---------------- | ----------- | ----------------------------------------------------------------------------- | ----------------- |
| Full Body        | Weeks 1-4   | Full Body #1, #2, #3                                                          | 7, 7, 7           |
| Full Body        | Weeks 5-8   | Full Body #1, #2, #3                                                          | 7, 7, 7           |
| Upper/Lower      | Weeks 1-4   | Lower Body #1, Upper Body #1, Lower Body #2, Upper Body #2                    | 7, 7, 7, 7        |
| Upper/Lower      | Weeks 5-8   | Lower Body #1, Upper Body #1, Lower Body #2, Upper Body #2                    | 7, 7, 7, 7        |
| Body Part Split  | Weeks 1-4   | Chest & Triceps, Legs & Abs #1, Back & Biceps, Legs & Abs #2, Shoulders & Arms | 5, 7, 5, 7, 5     |
| Body Part Split  | Weeks 5-8   | Chest & Triceps, Legs & Abs #1, Back & Biceps, Legs & Abs #2, Shoulders & Arms | 5, 7, 5, 7, 5     |

**Total exercise rows in CSV:** 156
