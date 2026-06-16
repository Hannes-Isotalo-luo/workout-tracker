import { db } from './firebase';
import { 
  doc, 
  setDoc, 
  getDoc,
  getDocs, 
  deleteDoc, 
  collection, 
  query, 
  orderBy 
} from 'firebase/firestore';

/**
 * Safely migrating/sanitizing session objects to ensure backward/forward compatibility.
 */
function sanitizeSession(session) {
  return {
    ...session,
    schemaVersion: 1, // Indicate modern schema
    duration: typeof session.duration === 'number' && !isNaN(session.duration) ? session.duration : 0,
    completedSets: typeof session.completedSets === 'number' && !isNaN(session.completedSets) ? session.completedSets : 0,
    totalVolume: typeof session.totalVolume === 'number' && !isNaN(session.totalVolume) ? session.totalVolume : 0,
    notes: session.notes || '',
    sessionNote: session.sessionNote || '',
    completedAt: session.completedAt || new Date().toISOString()
  };
}

/**
 * Saves a completed workout session to the user's Firestore collection.
 * @param {string} userId 
 * @param {Object} session 
 */
export async function saveSessionToCloud(userId, session) {
  if (!userId || !session || !session.id) return;
  try {
    const sessionDocRef = doc(db, 'users', userId, 'sessions', session.id);
    const sanitizedSession = sanitizeSession(session);
    await setDoc(sessionDocRef, sanitizedSession);
    console.log(`[cloudStorage] Session ${session.id} successfully saved to cloud.`);
  } catch (error) {
    console.error('[cloudStorage] Error saving session to cloud:', error);
    throw error;
  }
}

/**
 * Fetches all completed workout sessions for a given user from Firestore.
 * @param {string} userId 
 * @returns {Promise<Array>}
 */
export async function fetchUserHistory(userId) {
  if (!userId) return [];
  try {
    const sessionsCollectionRef = collection(db, 'users', userId, 'sessions');
    const q = query(sessionsCollectionRef, orderBy('completedAt', 'asc'));
    const querySnapshot = await getDocs(q);
    const history = [];
    querySnapshot.forEach((docSnap) => {
      history.push(sanitizeSession(docSnap.data()));
    });
    console.log(`[cloudStorage] Fetched ${history.length} sessions from cloud.`);
    return history;
  } catch (error) {
    console.warn('[cloudStorage] Ordered fetch failed (likely missing index). Falling back to index-free query with client-side sort:', error);
    try {
      const sessionsCollectionRef = collection(db, 'users', userId, 'sessions');
      const querySnapshot = await getDocs(sessionsCollectionRef);
      const history = [];
      querySnapshot.forEach((docSnap) => {
        history.push(sanitizeSession(docSnap.data()));
      });
      // Client-side sort by completedAt ascending
      history.sort((a, b) => {
        const tA = new Date(a.completedAt || a.date || 0).getTime();
        const tB = new Date(b.completedAt || b.date || 0).getTime();
        return tA - tB;
      });
      console.log(`[cloudStorage] Successfully loaded ${history.length} sessions from cloud via fallback query.`);
      return history;
    } catch (fallbackError) {
      console.error('[cloudStorage] Error in fallback fetchUserHistory:', fallbackError);
      throw fallbackError;
    }
  }
}

/**
 * Deletes a completed session from the user's Firestore collection.
 * @param {string} userId 
 * @param {string} sessionId 
 */
export async function deleteSessionFromCloud(userId, sessionId) {
  if (!userId || !sessionId) return;
  try {
    const sessionDocRef = doc(db, 'users', userId, 'sessions', sessionId);
    await deleteDoc(sessionDocRef);
    console.log(`[cloudStorage] Session ${sessionId} successfully deleted from cloud.`);
  } catch (error) {
    console.error('[cloudStorage] Error deleting session from cloud:', error);
    throw error;
  }
}

/**
 * Saves user custom goals to Firestore.
 * @param {string} userId 
 * @param {Object} goals 
 */
export async function saveGoalsToCloud(userId, goals) {
  if (!userId || !goals) return;
  try {
    const docRef = doc(db, 'users', userId, 'config', 'goals');
    await setDoc(docRef, goals);
    console.log(`[cloudStorage] Custom goals successfully saved to cloud.`);
  } catch (error) {
    console.error('[cloudStorage] Error saving goals to cloud:', error);
    throw error;
  }
}

/**
 * Fetches user custom goals from Firestore.
 * @param {string} userId 
 * @returns {Promise<Object|null>}
 */
export async function fetchGoalsFromCloud(userId) {
  if (!userId) return null;
  try {
    const docRef = doc(db, 'users', userId, 'config', 'goals');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data();
    }
    return null;
  } catch (error) {
    console.error('[cloudStorage] Error fetching goals from cloud:', error);
    throw error;
  }
}

/**
 * Saves user settings to Firestore.
 * @param {string} userId 
 * @param {Object} settings 
 */
export async function saveSettingsToCloud(userId, settings) {
  if (!userId || !settings) return;
  try {
    const docRef = doc(db, 'users', userId, 'config', 'settings');
    await setDoc(docRef, settings);
    console.log(`[cloudStorage] Settings successfully saved to cloud.`);
  } catch (error) {
    console.error('[cloudStorage] Error saving settings to cloud:', error);
    throw error;
  }
}

/**
 * Fetches user settings from Firestore.
 * @param {string} userId 
 * @returns {Promise<Object|null>}
 */
export async function fetchSettingsFromCloud(userId) {
  if (!userId) return null;
  try {
    const docRef = doc(db, 'users', userId, 'config', 'settings');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data();
    }
    return null;
  } catch (error) {
    console.error('[cloudStorage] Error fetching settings from cloud:', error);
    throw error;
  }
}

/**
 * Saves active workout state to Firestore.
 * @param {string} userId 
 * @param {Object} activeState 
 */
export async function saveActiveStateToCloud(userId, activeState) {
  if (!userId || !activeState) return;
  try {
    const docRef = doc(db, 'users', userId, 'config', 'activeState');
    await setDoc(docRef, activeState);
    console.log(`[cloudStorage] Active state successfully saved to cloud.`);
  } catch (error) {
    console.error('[cloudStorage] Error saving active state to cloud:', error);
    throw error;
  }
}

/**
 * Fetches active workout state from Firestore.
 * @param {string} userId 
 * @returns {Promise<Object|null>}
 */
export async function fetchActiveStateFromCloud(userId) {
  if (!userId) return null;
  try {
    const docRef = doc(db, 'users', userId, 'config', 'activeState');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data();
    }
    return null;
  } catch (error) {
    console.error('[cloudStorage] Error fetching active state from cloud:', error);
    throw error;
  }
}

/**
 * Saves enrolled program name to Firestore.
 * @param {string} userId 
 * @param {string} programName 
 */
export async function saveEnrolledProgramToCloud(userId, programName) {
  if (!userId) return;
  try {
    const docRef = doc(db, 'users', userId, 'config', 'enrolledProgram');
    await setDoc(docRef, { programName });
    console.log(`[cloudStorage] Enrolled program ${programName} saved to cloud.`);
  } catch (error) {
    console.error('[cloudStorage] Error saving enrolled program to cloud:', error);
    throw error;
  }
}

/**
 * Fetches enrolled program name from Firestore.
 * @param {string} userId 
 * @returns {Promise<string|null>}
 */
export async function fetchEnrolledProgramFromCloud(userId) {
  if (!userId) return null;
  try {
    const docRef = doc(db, 'users', userId, 'config', 'enrolledProgram');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data().programName || null;
    }
    return null;
  } catch (error) {
    console.error('[cloudStorage] Error fetching enrolled program from cloud:', error);
    throw error;
  }
}

/**
 * Saves a custom routine to the user's Firestore collection.
 * @param {string} userId
 * @param {Object} routine
 */
export async function saveRoutineToCloud(userId, routine) {
  if (!userId || !routine || !routine.id) return;
  try {
    const routineDocRef = doc(db, 'users', userId, 'routines', routine.id);
    await setDoc(routineDocRef, routine);
    console.log(`[cloudStorage] Routine ${routine.name} successfully saved to cloud.`);
  } catch (error) {
    console.error('[cloudStorage] Error saving routine to cloud:', error);
    throw error;
  }
}

/**
 * Fetches all custom routines for a user.
 * @param {string} userId
 * @returns {Promise<Array>}
 */
export async function fetchUserRoutines(userId) {
  if (!userId) return [];
  try {
    const routinesCollectionRef = collection(db, 'users', userId, 'routines');
    const querySnapshot = await getDocs(routinesCollectionRef);
    const routines = [];
    querySnapshot.forEach((docSnap) => {
      routines.push(docSnap.data());
    });
    console.log(`[cloudStorage] Fetched ${routines.length} routines from cloud.`);
    return routines;
  } catch (error) {
    console.error('[cloudStorage] Error fetching routines:', error);
    throw error;
  }
}

/**
 * Deletes a routine.
 * @param {string} userId
 * @param {string} routineId
 */
export async function deleteRoutineFromCloud(userId, routineId) {
  if (!userId || !routineId) return;
  try {
    const routineDocRef = doc(db, 'users', userId, 'routines', routineId);
    await deleteDoc(routineDocRef);
    console.log(`[cloudStorage] Routine ${routineId} successfully deleted.`);
  } catch (error) {
    console.error('[cloudStorage] Error deleting routine:', error);
    throw error;
  }
}

/**
 * Shares a routine globally by saving it to a public 'shared_routines' collection.
 * @param {Object} routine
 * @returns {Promise<string>} The shared routine ID
 */
export async function shareRoutineToPublic(routine) {
  if (!routine) return null;
  try {
    // Ensure we give it a unique global ID
    const shareId = routine.id + '-' + Date.now().toString(36);
    const publicRef = doc(db, 'shared_routines', shareId);
    await setDoc(publicRef, { ...routine, id: shareId, isPublic: true });
    console.log(`[cloudStorage] Routine shared globally with ID: ${shareId}`);
    return shareId;
  } catch (error) {
    console.error('[cloudStorage] Error sharing routine:', error);
    throw error;
  }
}

/**
 * Fetches a public routine by ID.
 * @param {string} shareId
 * @returns {Promise<Object|null>}
 */
export async function fetchPublicRoutine(shareId) {
  if (!shareId) return null;
  try {
    const publicRef = doc(db, 'shared_routines', shareId);
    const docSnap = await getDoc(publicRef);
    if (docSnap.exists()) {
      return docSnap.data();
    }
    return null;
  } catch (error) {
    console.error('[cloudStorage] Error fetching public routine:', error);
    throw error;
  }
}

/**
 * Saves PRs to Firestore.
 * @param {string} userId 
 * @param {Object} prs 
 */
export async function savePRsToCloud(userId, prs) {
  if (!userId || !prs) return;
  try {
    const docRef = doc(db, 'users', userId, 'config', 'prs');
    await setDoc(docRef, prs);
    console.log(`[cloudStorage] PRs successfully saved to cloud.`);
  } catch (error) {
    console.error('[cloudStorage] Error saving PRs to cloud:', error);
    throw error;
  }
}

/**
 * Fetches PRs from Firestore.
 * @param {string} userId 
 * @returns {Promise<Object|null>}
 */
export async function fetchPRsFromCloud(userId) {
  if (!userId) return null;
  try {
    const docRef = doc(db, 'users', userId, 'config', 'prs');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data();
    }
    return null;
  } catch (error) {
    console.error('[cloudStorage] Error fetching PRs from cloud:', error);
    throw error;
  }
}

