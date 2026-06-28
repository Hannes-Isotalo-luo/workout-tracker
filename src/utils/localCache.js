// ─────────────────────────────────────────────────────────────────────
// localCache.js — UID-scoped localStorage cache for instant resume.
//
// Only the *active session* is mirrored here, and always under a key scoped
// to the signed-in user's UID, so two accounts on a shared device can never
// see or resume each other's data (the previous global keys leaked across
// accounts). Saved history is NOT mirrored here — Firestore's
// persistentLocalCache already serves it offline, and Firestore remains the
// single source of truth ("cloud wins" on every login).
// ─────────────────────────────────────────────────────────────────────

const activeKey = (uid) => `workoutTracker_activeState_${uid}`;

/** Reads the cached active-session state for a user, or null. */
export function loadActiveState(uid) {
  if (!uid || typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(activeKey(uid));
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.warn('[localCache] Failed to read active state:', e);
    return null;
  }
}

/** Persists the active-session state for a user. */
export function saveActiveState(uid, activeState) {
  if (!uid || typeof window === 'undefined') return;
  try {
    localStorage.setItem(activeKey(uid), JSON.stringify(activeState));
  } catch (e) {
    console.warn('[localCache] Failed to save active state:', e);
  }
}

/** Clears the active-session cache for a user (called on logout). */
export function clearActiveState(uid) {
  if (!uid || typeof window === 'undefined') return;
  try {
    localStorage.removeItem(activeKey(uid));
  } catch (e) {
    console.warn('[localCache] Failed to clear active state:', e);
  }
}

/**
 * One-time cleanup of the legacy *global* (unscoped) keys used before
 * per-user scoping existed. These leaked one account's history/active session
 * to the next account on a shared device, so we purge them on startup.
 */
export function purgeLegacyGlobalKeys() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem('workoutTracker_history');
    localStorage.removeItem('workoutTracker_activeState');
  } catch {
    /* ignore */
  }
}
