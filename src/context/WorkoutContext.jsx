import { createContext, useContext, useReducer, useEffect, useState, useRef, useMemo } from 'react';
import { parseProgramCSV } from '../utils/csvParser.js';
import { initialState, workoutReducer } from './workoutReducer';
import { auth, googleProvider } from '../utils/firebase';
import { signInWithPopup, signInWithRedirect, getRedirectResult, signOut, onAuthStateChanged } from 'firebase/auth';
import { 
  saveSessionToCloud, 
  fetchUserHistory, 
  deleteSessionFromCloud,
  saveGoalsToCloud,
  fetchGoalsFromCloud,
  saveSettingsToCloud,
  fetchSettingsFromCloud,
  saveActiveStateToCloud,
  fetchActiveStateFromCloud,
  saveEnrolledProgramToCloud,
  fetchEnrolledProgramFromCloud
} from '../utils/cloudStorage';

// Create the Context
export const WorkoutContext = createContext();

// Provider Component
export function WorkoutProvider({ children }) {
  const [state, dispatch] = useReducer(workoutReducer, initialState);

  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState('idle');

  const [prs, setPrs] = useState({});
  const [customGoals, setCustomGoals] = useState({
    'Back Squat': 100,
    'Barbell Bench Press': 80,
    'Deadlift': 140
  });
  const [isGoalsHydrated, setIsGoalsHydrated] = useState(false);

  // Sync custom goals changes to Cloud
  useEffect(() => {
    if (!user || !isGoalsHydrated) return;
    try {
      saveGoalsToCloud(user.uid, customGoals).catch(err => {
        console.error('[WorkoutProvider] Failed to save custom goals to cloud:', err);
      });
    } catch (error) {
      console.error('[WorkoutProvider] Failed to save custom goals to cloud:', error);
    }
  }, [customGoals, user, isGoalsHydrated]);

  const [lastCompletedSession, setLastCompletedSession] = useState(null);

  // Listen to Firebase Auth state and handle redirects (SSO redirect resolution)
  useEffect(() => {
    let isMounted = true;
    let unsubscribe = () => {};

    const initAuth = async () => {
      try {
        // Resolve redirect session first (essential for mobile SSO)
        const redirectResult = await getRedirectResult(auth);
        if (redirectResult?.user) {
          console.log("[WorkoutProvider] Redirect sign-in resolved:", redirectResult.user.email);
          if (isMounted) {
            setUser(redirectResult.user);
          }
        }
      } catch (error) {
        console.error("[WorkoutProvider] Redirect result error:", error);
        // Surface domain configuration issues if they happen during redirect resolution
        if (error.code === 'auth/unauthorized-domain') {
          console.error("[WorkoutProvider] Domain not authorized for redirects:", window.location.hostname);
          alert(`This domain (${window.location.hostname}) is not authorized in Firebase Console. Please add it to your Authorized Domains list.`);
        }
      }

      // Setup auth state change listener
      if (isMounted) {
        unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
          console.log("[WorkoutProvider] Auth state changed. User:", currentUser?.email);
          setUser(currentUser);
          
          if (currentUser) {
            setSyncStatus('syncing');
            try {
              const [
                cloudHistory,
                cloudGoals,
                cloudSettings,
                cloudActiveState,
                cloudEnrolledProgram
              ] = await Promise.all([
                fetchUserHistory(currentUser.uid),
                fetchGoalsFromCloud(currentUser.uid),
                fetchSettingsFromCloud(currentUser.uid),
                fetchActiveStateFromCloud(currentUser.uid),
                fetchEnrolledProgramFromCloud(currentUser.uid)
              ]);

              if (isMounted) {
                if (cloudHistory && cloudHistory.length > 0) {
                  dispatch({ type: "SET_HISTORY", payload: cloudHistory });
                  const lastCompleted = cloudHistory[cloudHistory.length - 1];
                  setLastCompletedSession(lastCompleted);
                } else {
                  dispatch({ type: "SET_HISTORY", payload: [] });
                  setLastCompletedSession(null);
                }
                
                if (cloudGoals) {
                  setCustomGoals(cloudGoals);
                }
                setIsGoalsHydrated(true);
                if (cloudSettings) {
                  setSettings(cloudSettings);
                }
                setIsSettingsHydrated(true);
                if (cloudEnrolledProgram) {
                  dispatch({ type: "ENROLL_PROGRAM", payload: { program: cloudEnrolledProgram } });
                }
                if (cloudActiveState) {
                  dispatch({ type: "SET_ACTIVE_STATE", payload: cloudActiveState });
                }
                setSyncStatus('synced');
              }
            } catch (error) {
              console.error("[WorkoutProvider] Failed to fetch/sync cloud data on login:", error);
              if (isMounted) {
                setSyncStatus('error');
              }
            }
          } else {
            if (isMounted) {
              setSyncStatus('idle');
            }
          }
          
          // Instantly resolve loading screen as soon as user state is fetched (prevent UI hanging)
          if (isMounted) {
            setAuthLoading(false);
          }
        });
      }
    };

    initAuth();

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const loginWithGoogle = async () => {
    try {
      // Try popup first (desktop-friendly, avoids losing app state)
      const result = await signInWithPopup(auth, googleProvider);
      console.log("[WorkoutProvider] Google signed in via popup:", result.user.email);
    } catch (error) {
      console.warn("[WorkoutProvider] Popup sign-in failed, checking fallback options:", error.code);
      
      // These error codes suggest popup blocking or closure (very common on Safari iOS/mobile)
      const popupBlockedOrClosed = [
        'auth/popup-blocked',
        'auth/popup-closed-by-user',
        'auth/cancelled-popup-request'
      ];
      
      if (popupBlockedOrClosed.includes(error.code)) {
        console.log("[WorkoutProvider] Popup was blocked or closed. Falling back to redirect sign-in...");
        try {
          // Fallback to redirect (works reliably on mobile Safari/iOS)
          await signInWithRedirect(auth, googleProvider);
        } catch (redirectError) {
          console.error("[WorkoutProvider] Redirect sign-in failed:", redirectError);
          alert("Sign-in failed. Please check your internet connection or browser settings.");
        }
      } else if (error.code === 'auth/unauthorized-domain') {
        console.error("[WorkoutProvider] Domain is not authorized:", window.location.hostname);
        alert(`This domain (${window.location.hostname}) is not authorized for Google Sign-in. Please add it to Authorized Domains in Firebase Console.`);
      } else {
        console.error("[WorkoutProvider] Google sign-in failed:", error);
        alert(`Sign-in failed: ${error.message || "Unknown error"}`);
      }
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      console.log("[WorkoutProvider] Signed out.");
      
      // Reset state contexts
      setLastCompletedSession(null);
      setPrs({});
      setCustomGoals({
        'Back Squat': 100,
        'Barbell Bench Press': 80,
        'Deadlift': 140
      });
      dispatch({ type: "RESET_ON_LOGOUT" });
    } catch (error) {
      console.error("[WorkoutProvider] Sign-out failed:", error);
    }
  };

  const [settings, setSettings] = useState({ soundEnabled: true, hapticsEnabled: true, silenceAll: false });
  const [isSettingsHydrated, setIsSettingsHydrated] = useState(false);

  // Sync settings changes to Cloud
  useEffect(() => {
    if (!user || !isSettingsHydrated) return;
    try {
      saveSettingsToCloud(user.uid, settings).catch(err => {
        console.error('[WorkoutProvider] Failed to sync settings to cloud:', err);
      });
    } catch (error) {
      console.error('[WorkoutProvider] Failed to sync settings to cloud:', error);
    }
  }, [settings, user, isSettingsHydrated]);

  // Automatically sync active state to LocalStorage and Cloud (debounced)
  useEffect(() => {
    if (state.isLoading) return;
    const activeState = {
      selectedProgram: state.selectedProgram,
      selectedPhase: state.selectedPhase,
      activeSession: state.activeSession,
      currentView: state.currentView,
      restTimer: state.restTimer
    };
    const handler = setTimeout(() => {
      // 1. Save to local storage for unauth users fallback (debounced)
      try {
        localStorage.setItem('workoutTracker_activeState', JSON.stringify(activeState));
      } catch (e) {
        console.warn('Failed to save active state to local storage', e);
      }

      // 2. Sync to cloud if user is auth'd
      if (user) {
        saveActiveStateToCloud(user.uid, activeState).catch(err => {
          console.error('[WorkoutProvider] Failed to sync active state to cloud:', err);
        });
      }
    }, 1500);

    return () => clearTimeout(handler);
  }, [
    state.selectedProgram,
    state.selectedPhase,
    state.activeSession,
    state.currentView,
    state.restTimer,
    state.isLoading,
    user
  ]);

  // Recalculate and update PRs map automatically from history changes
  useEffect(() => {
    if (state.isLoading) return;
    try {
      const computedPrs = {};
      state.workoutHistory.forEach((session) => {
        if (!session.logs) return;
        session.logs.forEach((log) => {
          const exerciseName = log.exerciseName;
          if (!exerciseName) return;
          log.sets.forEach((set) => {
            if (set.isComplete) {
              const weightVal = parseFloat(set.weight) || 0;
              const currentMax = parseFloat(computedPrs[exerciseName]) || 0;
              if (weightVal > currentMax) {
                computedPrs[exerciseName] = weightVal;
              }
            }
          });
        });
      });

      setPrs(prevPrs => {
        const prevJson = JSON.stringify(prevPrs);
        const nextJson = JSON.stringify(computedPrs);
        if (prevJson !== nextJson) {
          console.log("[WorkoutProvider] 🏆 Recalculating PRs from history:", computedPrs);
          return computedPrs;
        }
        return prevPrs;
      });
    } catch (error) {
      console.error('[WorkoutProvider] Failed to recalculate PRs from history:', error);
    }
  }, [state.workoutHistory, state.isLoading]);

  // Persist workoutHistory to localStorage for unauthenticated users / offline fallback
  useEffect(() => {
    if (!state.isLoading && state.workoutHistory && state.workoutHistory.length > 0) {
      try {
        localStorage.setItem('workoutTracker_history', JSON.stringify(state.workoutHistory));
      } catch (e) {
        console.warn('Failed to save history to localStorage', e);
      }
    }
  }, [state.workoutHistory, state.isLoading]);

  // 1. Automatically load CSV program data on mount
  useEffect(() => {
    let isMounted = true;
    console.log("[WorkoutProvider] 🔄 Initiating automatic CSV load on mount...");

    const loadData = async () => {
      dispatch({ type: "LOAD_PROGRAM_START" });
      try {
        const data = await parseProgramCSV();
        if (isMounted) {
          dispatch({ type: "LOAD_PROGRAM_SUCCESS", payload: data });
        }
      } catch (err) {
        console.error("[WorkoutProvider] ❌ Failed to automatically load CSV:", err);
        if (isMounted) {
          dispatch({ type: "LOAD_PROGRAM_ERROR", payload: err.message || String(err) });
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
      console.log("[WorkoutProvider] ⏹️ Unmounting WorkoutProvider...");
    };
  }, []);

  const audioCtxRef = useRef(null);

  // Web Audio Context gesture warm-up for mobile browsers
  useEffect(() => {
    const warmUpAudio = () => {
      try {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass && !audioCtxRef.current) {
          audioCtxRef.current = new AudioContextClass();
          console.log('[WorkoutProvider] 🔊 AudioContext pre-initialized.');
        }
        if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
          audioCtxRef.current.resume().then(() => {
            console.log('[WorkoutProvider] 🔊 AudioContext resumed via user interaction.');
          });
        }
      } catch (e) {
        console.warn('[WorkoutProvider] Web Audio warmup error:', e);
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('click', warmUpAudio, { capture: true, once: false });
      window.addEventListener('touchstart', warmUpAudio, { capture: true, once: false });
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('click', warmUpAudio, { capture: true });
        window.removeEventListener('touchstart', warmUpAudio, { capture: true });
      }
    };
  }, []);

  // Screen Wake Lock API to prevent device locking during live workouts
  useEffect(() => {
    let wakeLock = null;

    const requestWakeLock = async () => {
      if ('wakeLock' in navigator && state.activeSession) {
        try {
          wakeLock = await navigator.wakeLock.request('screen');
          console.log('[WorkoutProvider] 💡 Screen Wake Lock acquired.');
        } catch (err) {
          console.warn('[WorkoutProvider] ⚠️ Failed to acquire Screen Wake Lock:', err.name, err.message);
        }
      }
    };

    const handleVisibilityChange = async () => {
      if (wakeLock !== null && document.visibilityState === 'visible') {
        await requestWakeLock();
      }
    };

    if (state.activeSession) {
      requestWakeLock();
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (wakeLock) {
        wakeLock.release().then(() => {
          wakeLock = null;
        }).catch(err => {
          console.warn('[WorkoutProvider] Wake lock release error:', err);
        });
      }
    };
  }, [state.activeSession]);

  // Tab Title Timer countdown display
  useEffect(() => {
    const originalTitle = "Workout Tracker";
    if (state.restTimer.isRunning && state.restTimer.seconds > 0) {
      const mins = Math.floor(state.restTimer.seconds / 60);
      const secs = state.restTimer.seconds % 60;
      const formatted = `${mins}:${secs.toString().padStart(2, '0')}`;
      document.title = `⏱️ ${formatted} | Workout Tracker`;
    } else {
      document.title = originalTitle;
    }
    
    return () => {
      document.title = originalTitle;
    };
  }, [state.restTimer.seconds, state.restTimer.isRunning]);

  // Audio & Haptic Alerts Synthesizer
  const playRestCompletedAlert = () => {
    if (settings.silenceAll) {
      console.log("[WorkoutProvider] Alerts are silenced. Skipping chime and haptics.");
      return;
    }
    try {
      if (settings.soundEnabled) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        let audioCtx = audioCtxRef.current;
        if (!audioCtx && AudioContextClass) {
          audioCtx = new AudioContextClass();
        }
        if (audioCtx) {
          if (audioCtx.state === 'suspended') {
            audioCtx.resume();
          }
          const now = audioCtx.currentTime;
          
          // Tone 1: D5 (587.33 Hz) for 0.4s
          const osc1 = audioCtx.createOscillator();
          const gain1 = audioCtx.createGain();
          osc1.type = 'sine';
          osc1.frequency.setValueAtTime(587.33, now);
          gain1.gain.setValueAtTime(0.5, now);
          gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
          osc1.connect(gain1);
          gain1.connect(audioCtx.destination);
          osc1.start(now);
          osc1.stop(now + 0.4);
          
          // Tone 2: A5 (880 Hz) for 0.6s starting at 0.4s
          const osc2 = audioCtx.createOscillator();
          const gain2 = audioCtx.createGain();
          osc2.type = 'sine';
          osc2.frequency.setValueAtTime(880, now + 0.4);
          gain2.gain.setValueAtTime(0.5, now + 0.4);
          gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.4 + 0.6);
          osc2.connect(gain2);
          gain2.connect(audioCtx.destination);
          osc2.start(now + 0.4);
          osc2.stop(now + 0.4 + 0.6);
        }
      }
    } catch (e) {
      console.warn("[WorkoutProvider] Web Audio API chime error:", e);
    }

    try {
      if (settings.hapticsEnabled && typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([100, 50, 100]);
      }
    } catch (error) {
      console.warn("[WorkoutProvider] Haptic vibration error:", error);
    }
  };

  // 2. Self-contained Rest Timer countdown logic with background drift compensation.
  // state.restTimer.endTime is the single source of truth; we recompute the absolute
  // remaining seconds on every tick so the timer always counts DOWN to zero, even after
  // the tab was backgrounded.
  useEffect(() => {
    if (!state.restTimer.isRunning || !state.restTimer.endTime) return;

    console.log(`[WorkoutProvider] Timer started/resumed. Remaining: ${Math.max(0, Math.round((state.restTimer.endTime - Date.now()) / 1000))}s`);

    const checkTime = () => {
      const remaining = Math.max(0, Math.round((state.restTimer.endTime - Date.now()) / 1000));

      if (remaining <= 0) {
        console.log("[WorkoutProvider] Timer reached 0. Triggering audio haptic alert.");
        playRestCompletedAlert();
        dispatch({ type: "STOP_REST_TIMER" });
      } else {
        // Recompute absolute remaining from endTime (counts down)
        dispatch({ type: "TICK_REST_TIMER" });
      }
    };

    // Catch up immediately when returning to the foreground
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkTime();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    const interval = setInterval(checkTime, 1000);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [state.restTimer.isRunning, state.restTimer.endTime, settings]);

  // ─── Dispatcher Helper Wrappers ──────────────────────────────────────

  const selectProgram = (program) => {
    console.log(`[WorkoutProvider Hook] selectProgram("${program}")`);
    dispatch({ type: "SELECT_PROGRAM", payload: { program } });
  };

  const selectPhase = (phase) => {
    console.log(`[WorkoutProvider Hook] selectPhase("${phase}")`);
    dispatch({ type: "SELECT_PHASE", payload: { phase } });
  };

  const clearSelection = () => {
    console.log("[WorkoutProvider Hook] clearSelection()");
    dispatch({ type: "CLEAR_SELECTION" });
  };

  const initSession = (day, exercises) => {
    console.log(`[WorkoutProvider Hook] initSession(day: "${day}", exercisesCount: ${exercises?.length})`);
    dispatch({ type: "INIT_SESSION", payload: { day, exercises } });
  };

  const updateSetWeight = (exerciseId, setNumber, value) => {
    console.log(`[WorkoutProvider Hook] updateSetWeight(exerciseId: "${exerciseId}", setNumber: ${setNumber}, value: "${value}")`);
    dispatch({
      type: "UPDATE_SET",
      payload: { exerciseId, setNumber, field: "weight", value }
    });
  };

  const updateSetReps = (exerciseId, setNumber, value) => {
    console.log(`[WorkoutProvider Hook] updateSetReps(exerciseId: "${exerciseId}", setNumber: ${setNumber}, value: "${value}")`);
    dispatch({
      type: "UPDATE_SET",
      payload: { exerciseId, setNumber, field: "repsCompleted", value }
    });
  };

  /**
   * Toggles the checkmark completed state of a set.
   * If an explicit boolean `value` is supplied, sets it to that value instead of toggling.
   */
  const completeSet = (exerciseId, setNumber, value = null) => {
    console.log(`[WorkoutProvider Hook] completeSet(exerciseId: "${exerciseId}", setNumber: ${setNumber}, explicitValue: ${value})`);
    if (value !== null) {
      dispatch({
        type: "UPDATE_SET",
        payload: { exerciseId, setNumber, field: "isComplete", value: !!value }
      });
    } else {
      dispatch({
        type: "TOGGLE_SET_COMPLETE",
        payload: { exerciseId, setNumber }
      });
    }
  };

  const addSet = (exerciseId) => {
    console.log(`[WorkoutProvider Hook] addSet(exerciseId: "${exerciseId}")`);
    dispatch({ type: "ADD_SET", payload: { exerciseId } });
  };

  const removeSet = (exerciseId) => {
    console.log(`[WorkoutProvider Hook] removeSet(exerciseId: "${exerciseId}")`);
    dispatch({ type: "REMOVE_SET", payload: { exerciseId } });
  };

  const cancelSession = () => {
    console.log("[WorkoutProvider Hook] cancelSession()");
    dispatch({ type: "CANCEL_SESSION" });
  };

  const saveSession = (duration = 0) => {
    console.log("[WorkoutProvider Hook] saveSession(duration:", duration, ")");
    if (state.activeSession) {
      let completedSets = 0;
      let totalVolume = 0;

      state.activeSession.logs.forEach(log => {
        log.sets.forEach(set => {
          if (set.isComplete) {
            completedSets++;
            const w = parseFloat(set.weight) || 0;
            const r = parseInt(set.repsCompleted, 10) || 0;
            totalVolume += (w * r);
          }
        });
      });

      // Personal Records (PR) check & update
      const tempPRs = { ...prs };
      let prsUpdated = false;

      // Clone logs and strip reference placeholders so we keep history lightweight
      const cleanLogs = state.activeSession.logs.map(log => {
        const exerciseName = log.exerciseName;
        return {
          ...log,
          sets: log.sets.map(set => {
            const { previousWeight, previousReps, ...cleanSet } = set;
            if (cleanSet.isComplete) {
              const weightVal = parseFloat(cleanSet.weight) || 0;
              const currentMax = parseFloat(tempPRs[exerciseName]) || 0;
              if (weightVal > currentMax) {
                cleanSet.isPR = true;
                tempPRs[exerciseName] = weightVal;
                prsUpdated = true;
              }
            }
            return cleanSet;
          })
        };
      });

      if (prsUpdated) {
        setPrs(tempPRs);
      }

      const completedSession = {
        ...state.activeSession,
        logs: cleanLogs,
        completedAt: new Date().toISOString(),
        duration,
        completedSets,
        totalVolume
      };

      setLastCompletedSession(completedSession);

      // Async Firestore cloud sync
      if (user) {
        setSyncStatus('syncing');
        saveSessionToCloud(user.uid, completedSession)
          .then(() => {
            setSyncStatus('synced');
          })
          .catch(err => {
            console.error("[WorkoutProvider] Failed to sync session to cloud:", err);
            setSyncStatus('error');
          });
      }

      // Auto-enroll if they complete a workout and are not enrolled in any program yet
      if (!state.enrolledProgram) {
        console.log(`[WorkoutProvider] Auto-enrolling user in program: ${completedSession.program}`);
        if (user) {
          saveEnrolledProgramToCloud(user.uid, completedSession.program).catch(err => {
            console.error("[WorkoutProvider] Failed to save enrolled program to cloud:", err);
          });
        }
        dispatch({ type: "ENROLL_PROGRAM", payload: { program: completedSession.program } });
      }

      dispatch({ type: "SAVE_SESSION", payload: completedSession });
    } else {
      dispatch({ type: "SAVE_SESSION" });
    }
  };

  const undoLastSession = () => {
    console.log("[WorkoutProvider Hook] undoLastSession()");
    const lastWorkout = state.workoutHistory[state.workoutHistory.length - 1];
    const newLast = state.workoutHistory.length > 1 ? state.workoutHistory[state.workoutHistory.length - 2] : null;
    setLastCompletedSession(newLast);

    // Async Firestore cloud delete
    if (user && lastWorkout && lastWorkout.id) {
      deleteSessionFromCloud(user.uid, lastWorkout.id).catch(err => {
        console.error("[WorkoutProvider] Failed to delete session from cloud:", err);
      });
    }

    dispatch({ type: "UNDO_LAST_SESSION" });
  };

  const restartLastSession = () => {
    console.log("[WorkoutProvider Hook] restartLastSession()");
    const lastWorkout = state.workoutHistory[state.workoutHistory.length - 1];
    if (!lastWorkout) {
      console.warn("[WorkoutProvider Hook] restartLastSession: No last workout found to restart.");
      return;
    }
    const newLast = state.workoutHistory.length > 1 ? state.workoutHistory[state.workoutHistory.length - 2] : null;
    setLastCompletedSession(newLast);

    // Async Firestore cloud delete
    if (user && lastWorkout.id) {
      deleteSessionFromCloud(user.uid, lastWorkout.id).catch(err => {
        console.error("[WorkoutProvider] Failed to delete session from cloud during restart:", err);
      });
    }

    dispatch({ type: "RESTART_LAST_SESSION" });
  };

  const setView = (view) => {
    console.log(`[WorkoutProvider Hook] setView("${view}")`);
    dispatch({ type: "SET_VIEW", payload: { view } });
  };

  const enrollInProgram = (program) => {
    console.log(`[WorkoutProvider Hook] enrollInProgram("${program}")`);
    if (user) {
      saveEnrolledProgramToCloud(user.uid, program).catch(err => {
        console.error("[WorkoutProvider] Failed to save enrolled program to cloud:", err);
      });
    }
    dispatch({ type: "ENROLL_PROGRAM", payload: { program } });
  };

  const abandonProgram = () => {
    console.log("[WorkoutProvider Hook] abandonProgram()");
    if (user) {
      saveEnrolledProgramToCloud(user.uid, null).catch(err => {
        console.error("[WorkoutProvider] Failed to remove enrolled program from cloud:", err);
      });
    }
    dispatch({ type: "ABANDON_PROGRAM" });
  };

  const startRestTimer = (seconds, exerciseId) => {
    console.log(`[WorkoutProvider Hook] startRestTimer(seconds: ${seconds}, exerciseId: "${exerciseId}")`);
    dispatch({ type: "START_REST_TIMER", payload: { seconds, exerciseId } });
  };

  const stopRestTimer = () => {
    console.log("[WorkoutProvider Hook] stopRestTimer()");
    dispatch({ type: "STOP_REST_TIMER" });
  };

  const modifyRestTimer = (seconds) => {
    console.log(`[WorkoutProvider Hook] modifyRestTimer(seconds: ${seconds})`);
    dispatch({ type: "MODIFY_REST_TIMER", payload: { seconds } });
  };

  const isPersonalRecord = (exerciseName, weight) => {
    if (!exerciseName) return false;
    const currentMax = parseFloat(prs[exerciseName]) || 0;
    const weightVal = parseFloat(weight) || 0;
    return weightVal > 0 && weightVal > currentMax;
  };

  const updateCustomGoal = (exerciseName, value) => {
    setCustomGoals(prev => {
      const updated = {
        ...prev,
        [exerciseName]: value
      };
      if (user) {
        saveGoalsToCloud(user.uid, updated).catch(err => {
          console.error("[WorkoutProvider] Failed to save custom goals to cloud:", err);
        });
      }
      return updated;
    });
  };

  // Structured Context Value
  const value = useMemo(() => ({
    // State Values
    programData: state.programData,
    isLoading: state.isLoading,
    error: state.error,
    selectedProgram: state.selectedProgram,
    selectedPhase: state.selectedPhase,
    activeSession: state.activeSession,
    currentView: state.currentView,
    restTimer: state.restTimer,
    lastCompletedSession,
    workoutHistory: state.workoutHistory,
    user,
    authLoading,
    syncStatus,
    enrolledProgram: state.enrolledProgram,
    prs,
    customGoals,
    // Settings State
    settings,
    updateSettings: (newSettings) => setSettings(prev => ({ ...prev, ...newSettings })),

    // Dispatcher Actions
    selectProgram,
    selectPhase,
    clearSelection,
    initSession,
    updateSetWeight,
    updateSetReps,
    completeSet,
    addSet,
    removeSet,
    cancelSession,
    saveSession,
    undoLastSession,
    restartLastSession,
    setView,
    enrollInProgram,
    abandonProgram,
    startRestTimer,
    stopRestTimer,
    modifyRestTimer,
    setLastCompletedSession,
    loginWithGoogle,
    logout,
    isPersonalRecord,
    isPR: isPersonalRecord,
    updateCustomGoal,

    // Raw Dispatch (in case components need custom dispatches)
    dispatch
  }), [
    state.programData, state.isLoading, state.error, state.selectedProgram, state.selectedPhase,
    state.activeSession, state.currentView, state.restTimer, lastCompletedSession, state.workoutHistory,
    user, authLoading, syncStatus, state.enrolledProgram, prs, customGoals, settings
  ]);

  return (
    <WorkoutContext.Provider value={value}>
      {children}
    </WorkoutContext.Provider>
  );
}

// Custom Hook to consume Context safely
export function useWorkout() {
  const context = useContext(WorkoutContext);
  if (!context) {
    throw new Error("useWorkout must be used within a WorkoutProvider");
  }
  return context;
}
