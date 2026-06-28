import { db } from './config';
import { doc, setDoc, getDoc, getDocs, deleteDoc, collection } from 'firebase/firestore';

// ─────────────────────────────────────────────────────────────────────
// workoutService.js — all Firestore CRUD for the app. Components and the
// context talk to Firestore exclusively through this module.
// ─────────────────────────────────────────────────────────────────────

/** Sanitizes a session document for forward/backward compatibility. */
function sanitizeSession(session) {
  return {
    ...session,
    schemaVersion: 1,
    duration: typeof session.duration === 'number' && !isNaN(session.duration) ? session.duration : 0,
    completedSets: typeof session.completedSets === 'number' && !isNaN(session.completedSets) ? session.completedSets : 0,
    totalVolume: typeof session.totalVolume === 'number' && !isNaN(session.totalVolume) ? session.totalVolume : 0,
    notes: session.notes || '',
    sessionNote: session.sessionNote || '',
    date: session.date || session.completedAt || new Date().toISOString(),
    completedAt: session.completedAt || session.date || new Date().toISOString(),
  };
}

// ─── Sessions ───────────────────────────────────────────────────────

export async function saveSessionToCloud(userId, session) {
  if (!userId || !session || !session.id) return;
  const ref = doc(db, 'users', userId, 'sessions', session.id);
  await setDoc(ref, sanitizeSession(session));
}

export async function fetchUserHistory(userId) {
  if (!userId) return [];
  // Unordered read + client-side sort on purpose: a Firestore orderBy() silently
  // drops any document missing the sort field, which would hide sessions. The
  // per-user collection is small enough that sorting in memory is trivial.
  const ref = collection(db, 'users', userId, 'sessions');
  const snap = await getDocs(ref);
  const history = [];
  snap.forEach((d) => history.push(sanitizeSession(d.data())));
  history.sort((a, b) => new Date(a.completedAt || a.date || 0) - new Date(b.completedAt || b.date || 0));
  return history;
}

export async function deleteSessionFromCloud(userId, sessionId) {
  if (!userId || !sessionId) return;
  await deleteDoc(doc(db, 'users', userId, 'sessions', sessionId));
}

// ─── Per-user config documents ──────────────────────────────────────

async function saveConfig(userId, key, data) {
  if (!userId || !data) return;
  await setDoc(doc(db, 'users', userId, 'config', key), data);
}

async function fetchConfig(userId, key) {
  if (!userId) return null;
  const snap = await getDoc(doc(db, 'users', userId, 'config', key));
  return snap.exists() ? snap.data() : null;
}

export const saveGoalsToCloud = (userId, goals) => saveConfig(userId, 'goals', goals);
export const fetchGoalsFromCloud = (userId) => fetchConfig(userId, 'goals');

export const saveSettingsToCloud = (userId, settings) => saveConfig(userId, 'settings', settings);
export const fetchSettingsFromCloud = (userId) => fetchConfig(userId, 'settings');

export const saveActiveStateToCloud = (userId, activeState) => saveConfig(userId, 'activeState', activeState);
export const fetchActiveStateFromCloud = (userId) => fetchConfig(userId, 'activeState');

export async function saveEnrolledProgramToCloud(userId, programName) {
  if (!userId) return;
  await setDoc(doc(db, 'users', userId, 'config', 'enrolledProgram'), { programName });
}

export async function fetchEnrolledProgramFromCloud(userId) {
  const data = await fetchConfig(userId, 'enrolledProgram');
  return data ? data.programName || null : null;
}

// ─── Custom routines ────────────────────────────────────────────────

export async function saveRoutineToCloud(userId, routine) {
  if (!userId || !routine || !routine.id) return;
  await setDoc(doc(db, 'users', userId, 'routines', routine.id), routine);
}

export async function fetchUserRoutines(userId) {
  if (!userId) return [];
  const snap = await getDocs(collection(db, 'users', userId, 'routines'));
  const routines = [];
  snap.forEach((d) => routines.push(d.data()));
  return routines;
}

export async function deleteRoutineFromCloud(userId, routineId) {
  if (!userId || !routineId) return;
  await deleteDoc(doc(db, 'users', userId, 'routines', routineId));
}

// ─── Public shared routines ─────────────────────────────────────────

export async function shareRoutineToPublic(routine) {
  if (!routine) return null;
  const shareId = routine.id + '-' + Date.now().toString(36);
  await setDoc(doc(db, 'shared_routines', shareId), { ...routine, id: shareId, isPublic: true });
  return shareId;
}

export async function fetchPublicRoutine(shareId) {
  if (!shareId) return null;
  const snap = await getDoc(doc(db, 'shared_routines', shareId));
  return snap.exists() ? snap.data() : null;
}
