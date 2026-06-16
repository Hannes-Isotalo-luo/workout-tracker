# Agentic Coding Guardrails & Project Rules

## 1. Tech Stack & Environment
* **Framework:** React (via Vite) or Vanilla JS (whichever is specified in the prompt).
* **Styling:** Tailwind CSS.
* **Backend:** Firebase (Firestore & Hosting).
* **Design Paradigm:** Mobile-first strictly. We are building a gym-friendly web app. Ignore desktop responsive breakpoints entirely unless explicitly requested.

## 2. Styling Strictness: Dark Mode Default
* The app must be exclusively dark mode. 
* Root styling must use `bg-slate-900` and `text-slate-100`.
* Do not use inline styles. All styling must be handled via standard Tailwind utility classes.
* Form inputs (weight, reps) must use native number pads on mobile: `type="number"` and `inputmode="decimal"`.

## 3. Firebase & Data Rules (Development Phase)
* **Current State:** The database is in Development/Testing mode. 
* **Security Rules:** Keep Firestore rules completely open for local testing right now. Use:
  `allow read, write: if true; // TODO: Lock down to specific UID before production`
* **Mock Data First:** Do not attempt to wire up Firebase read/write logic until the UI is 100% built and approved using static JSON mock data.

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
