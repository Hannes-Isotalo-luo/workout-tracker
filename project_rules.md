# Agentic Coding Guardrails & Project Rules

## 1. Tech Stack & Environment
* **Framework:** React (via Vite) or Vanilla JS (whichever is specified in the prompt).
* **Styling:** Tailwind CSS.
* **Backend:** Firebase (Firestore & Hosting).
* **Design Paradigm:** Mobile-first strictly. We are building a gym-friendly web app. Ignore desktop responsive breakpoints entirely unless explicitly requested.

## 2. Styling Strictness: Dark Mode Default
* The app is exclusively dark mode.
* **Use the semantic design tokens, not raw `slate-*`.** The colour system lives in
  `tailwind.config.js` — `canvas`/`surf`/`surf-*` (backgrounds), `line-*` (borders),
  and the three-colour semantic schema `accent` (violet, primary), `gain` (green,
  progress/PRs), `peak` (amber, intensity/streaks). Body text is `#f8fafc`/`#d3dae4`,
  muted text `#8b96a8`/`#5b6678`. Do **not** reintroduce `bg-slate-900`/`text-slate-100`.
* Prefer Tailwind utility classes; a few `style={{ letterSpacing }}` tweaks aside,
  avoid inline styles.
* Numeric inputs must use native mobile pads: `inputmode="decimal"` for weight,
  `inputmode="numeric"` for reps. (Weight is a `type="text"` field on purpose so it
  can normalise comma decimals — see `SetInput.jsx`.)

## 3. Firebase & Data Rules (Production Posture)
* **Current State:** Firebase Auth (Google) + Firestore are fully wired and in use.
  The app is gated behind sign-in (`AuthGate`).
* **Security Rules:** Rules are locked down — do **not** reopen them. Per-user data
  lives under `users/{uid}/**` and is readable/writable only by that UID;
  `shared_routines` is world-readable with a validated, signed-in-only `create`.
  See `firestore.rules`.
* **Source of truth:** Firestore is authoritative ("cloud wins" on every login).
  Offline support comes from Firestore's `persistentLocalCache`. `localStorage` is
  used only as a **UID-scoped** instant-resume cache for the active session
  (`utils/localCache.js`) — never store another user's data in a global key.

## 4. State Management Blueprint
When building the active workout tracker, use a heavily structured state object to ensure no data is lost before the user hits "Save".

Example structure:
```javascript
{
  date: new Date().toISOString(),
  program: "Full Body",
  day: "Full Body #1",
  logs: [
    {
      exerciseId: "fb_w14_d1_1",
      exerciseName: "Back Squat",
      sets: [
        { setNumber: 1, weight: "", repsCompleted: "", isComplete: false }
      ]
    }
  ]
}
```

## 5. Execution Rules for the Agent
* **Micro-Scoping:** Only modify the exact component or function requested in the prompt. Do not refactor unrelated files just because they are in the context window.
* **No Placeholders:** When writing code, do not use placeholders like `// ... rest of code here`. Output the complete, runnable file so it can be copy-pasted or written directly without breaking the app.
* **Component Isolation:** Keep components small. If a file exceeds 150 lines, suggest breaking it down.
* **Log Aggressively:** In this early phase, utilize `console.log()` for state changes (especially when inputting reps/weights) so data flow can be easily verified in the browser console.
