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
└── Fundamentals Hypertrophy Program V2*.csv   # Source workout data
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

### 4.1 Reducer State Shape

The reducer owns program data, the active session, saved history, and UI/timer
state. `initialState` is **pure** (no `localStorage` reads) — hydration happens
in the provider after auth resolves (see §4.4). `activeSession` is the single
source of truth for an in-progress workout and is not written to the `sessions`
collection until the user saves.

```javascript
// context/workoutReducer.js → initialState (pure)
const initialState = {
  // ── Program data ──────────────────────────────────────
  programData:     null,     // nested CSV map (Program → Phase → Day → Exercise[])
  routinePrograms: {},       // custom routines adapted to the same shape, merged in the provider
  isLoading:       true,     // true while the CSV is being fetched/parsed
  error:           null,     // parse/error string, if any

  // ── Selection State (wizard steps) ────────────────────
  selectedProgram: null,     // String | null
  selectedPhase:   null,     // String | null

  // ── Active session ────────────────────────────────────
  activeSession:   null,     // null when idle; otherwise:
  // {
  //   id, date, program, phase, day, startedAt,          // metadata
  //   notes, sessionNote,                                // optional free-text note
  //   logs: [
  //     {
  //       exerciseId, exerciseName, targetSets, targetReps, rpe, rest, notes,
  //       sets: [
  //         {
  //           setNumber, weight, repsCompleted, isComplete,  // weight/reps kept as strings
  //           previousWeight, previousReps,                  // "last time" refs (stripped on save)
  //           isPR                                           // set at save time (utils/prs)
  //         }
  //       ]
  //     }
  //   ]
  // }

  // ── History & enrollment ──────────────────────────────
  workoutHistory:  [],       // saved sessions, hydrated from Firestore on login
  enrolledProgram: null,     // active program for the "Up Next" quick-start

  // ── UI / timer state ──────────────────────────────────
  currentView:     "select", // "select" | "workout" | "builder" | "progress"
  restTimer: {
    isRunning:  false,
    seconds:    0,
    exerciseId: null,        // which exercise triggered it
    endTime:    null         // absolute epoch ms — countdown is derived from this (survives backgrounding)
  }
};
```

### 4.2 Reducer Actions

```javascript
// context/workoutReducer.js — handled action types

// ── Program data ──
"LOAD_PROGRAM_START" | "LOAD_PROGRAM_SUCCESS" | "LOAD_PROGRAM_ERROR"  // CSV lifecycle
"SET_ROUTINE_PROGRAMS"                                                // custom routines → programData shape

// ── Selection / enrollment ──
"SELECT_PROGRAM" | "SELECT_PHASE" | "CLEAR_SELECTION"
"ENROLL_PROGRAM" | "ABANDON_PROGRAM"

// ── Session lifecycle ──
"INIT_SESSION"        // { day, exercises } — builds activeSession; pulls "last time" weights + auto-progression
"CANCEL_SESSION"      // discard activeSession
"SAVE_SESSION"        // { ...completedSession }? — appends to workoutHistory (cloud write done in the provider)
"UNDO_LAST_SESSION" | "RESTART_LAST_SESSION"
"SET_SESSION_NOTES"

// ── Set-level updates ──
"UPDATE_SET"          // { exerciseId, setNumber, field, value } — cascades to untouched downstream sets
"TOGGLE_SET_COMPLETE" // { exerciseId, setNumber }
"ADD_SET" | "REMOVE_SET" | "SWAP_EXERCISE"

// ── History / hydration ──
"SET_HISTORY"         // replace workoutHistory (from cloud)
"SET_ACTIVE_STATE"    // restore selection + activeSession + restTimer (from local cache / cloud)
"RESET_ON_LOGOUT"     // wipe per-user state

// ── Rest timer (endTime-anchored) ──
"START_REST_TIMER" | "MODIFY_REST_TIMER" | "TICK_REST_TIMER" | "STOP_REST_TIMER"

// ── Navigation ──
"SET_VIEW"            // { view: "select" | "workout" | "builder" | "progress" }
```

### 4.3 Custom Hook API

The canonical consumer hook is **`useWorkout()`**, exported from
`context/WorkoutContext.jsx` (`hooks/useWorkoutSession.js` is a thin alias kept
for the name in this doc). The provider composes reducer state with auth, cloud
sync, and derived values, then exposes a single memoized object of **state +
action creators** (all dispatchers are `useCallback`-stable):

```javascript
const {
  // state
  programData, isLoading, error, selectedProgram, selectedPhase,
  activeSession, currentView, restTimer, workoutHistory, enrolledProgram,
  lastCompletedSession, user, authLoading, syncStatus, prs, customGoals,
  customRoutines, settings,
  // session actions
  selectProgram, selectPhase, clearSelection, initSession,
  updateSetWeight, updateSetReps, completeSet, addSet, removeSet, swapExercise,
  cancelSession, saveSession, setSessionNotes, undoLastSession, restartLastSession,
  // navigation / timer / program
  setView, startRestTimer, stopRestTimer, modifyRestTimer, abandonProgram,
  // auth / routines / goals
  loginWithGoogle, logout, isPR, updateCustomGoal,
  reloadRoutines, saveRoutine, deleteRoutine, shareRoutine,
} = useWorkout();
```

### 4.4 Persistence & Hydration

- **Firestore is the source of truth** ("cloud wins" on every login). On
  `onAuthStateChanged`, the provider hydrates history, goals, settings, enrolled
  program, custom routines, and active state, then dispatches `SET_HISTORY` /
  `SET_ACTIVE_STATE`.
- **Offline** is handled by Firestore's `persistentLocalCache` (see
  `firebase/config.js`) — history is *not* mirrored to `localStorage`.
- **Instant resume** uses a **UID-scoped** `localStorage` active-session cache
  (`utils/localCache.js`), written on a 1.5 s debounce; the cloud copy of the
  active state is written on a throttle (≤ 1 write / 10 s). Logout clears the
  cache; legacy global keys are purged on startup.

---

## 5. Database Schema (Firebase Firestore)

### Security Rules (production)

Rules are **locked down** (see `firestore.rules`): per-user data under
`users/{uid}/**` is readable/writable only by that authenticated UID;
`shared_routines` is world-readable with a signed-in-only, shape/size-validated
`create` (immutable — no update/delete).

```javascript
// firestore.rules (summary)
match /users/{userId} {
  allow read, write: if request.auth != null && request.auth.uid == userId;
  match /{allChildren=**} {
    allow read, write: if request.auth != null && request.auth.uid == userId;
  }
}
match /shared_routines/{shareId} {
  allow read: if true;
  allow create: if request.auth != null
    && request.resource.data.name is string
    && request.resource.data.name.size() > 0 && request.resource.data.name.size() <= 120
    && request.resource.data.phases is list && request.resource.data.phases.size() <= 50;
}
```

### Collection Map

All persistence is **per-user** under `users/{uid}` (managed in
`firebase/workoutService.js`). There is no top-level `workoutLogs` collection.

```
Firestore Root
│
└── users/{uid}/
    ├── sessions/{sessionId}             ← one doc per completed workout (client UUID = doc id)
    │   ├── id, date, program, phase, day, startedAt, completedAt
    │   ├── duration, completedSets, totalVolume   ← numbers (backfilled by sanitizeSession)
    │   ├── notes, sessionNote, schemaVersion
    │   └── logs: Array                  ← NOTE: field is "logs" (not "exercises")
    │       └── [i]: { exerciseId, exerciseName, targetSets, targetReps, rpe, rest, notes,
    │                  sets: [ { setNumber, weight, repsCompleted, isComplete, isPR? } ] }
    │
    ├── config/{key}                     ← single-doc settings:
    │   ├── goals            ← { [exerciseName]: targetWeight }
    │   ├── settings         ← { soundEnabled, hapticsEnabled, silenceAll }
    │   ├── activeState      ← in-progress session snapshot (throttled autosave)
    │   └── enrolledProgram  ← { programName }
    │
    └── routines/{routineId}             ← user's custom routines (RoutineBuilder)

shared_routines/{shareId}                ← public, world-readable shared routines
```

### Query Strategy

History is read with an **unordered** `getDocs` on `users/{uid}/sessions` and
sorted client-side by `completedAt || date` (`fetchUserHistory`). This is
deliberate: a Firestore `orderBy()` silently drops any document missing the sort
field, and the per-user collection is small enough that an in-memory sort is
trivial — so no composite indexes are required. Per-exercise progress is derived
client-side by scanning each session's `logs[]`.

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
  "completedSets": 21,
  "logs": [
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

> **Corrections to the diagram below (authoritative):**
> - **Step 1 (CSV location):** the CSVs are **served as static assets from
>   `public/data/`** (`program.csv`, `keyTerms.csv`) and **fetched at runtime**
>   — `parseProgramCSV()` calls `fetch('/data/program.csv')` (see
>   `utils/csvParser.js`). They are *not* imported from `src/assets` via
>   `?url`/`?raw`.
> - **Step 6 (save target):** saving writes to **`users/{uid}/sessions/{id}`** via
>   `setDoc` (`workoutService.saveSessionToCloud`), not `addDoc(collection(db,
>   "workoutLogs"))`. Volume/PR/totals are computed in the provider's
>   `saveSession`, and weights/reps are kept as strings in the stored `logs[]`.

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

## Appendix A: Key Terms Glossary (reference only, not shipped in-app)

These terms are not surfaced anywhere in the app UI; kept here purely as reference for anyone extending the program data.

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
