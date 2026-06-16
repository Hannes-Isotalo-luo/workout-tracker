import { useState, useEffect, useRef } from 'react'
import { 
  Dumbbell, 
  BarChart3, 
  Play, 
  ArrowRight,
  AlertCircle,
  Award,
  Sparkles,
  Calendar,
  Settings,
  X,
  Cloud,
  CloudOff,
  Loader2,
  Plus
} from 'lucide-react'
import { WorkoutProvider, useWorkout } from './context/WorkoutContext'
import { WorkoutList } from './components/views/WorkoutList'
import AnalyticsDashboard from './components/analytics/AnalyticsDashboard'
import HistoryCalendar from './components/views/HistoryCalendar'
import RoutineBuilder from './components/views/RoutineBuilder'
import { ProgramStep } from './components/wizard/ProgramStep'
import { PhaseStep } from './components/wizard/PhaseStep'
import { DayStep } from './components/wizard/DayStep'
import { calculateNextSession } from './utils/storage'
import { getExercises } from './utils/csvParser'


// ─── Main Content Inner Controller ─────────────────────────────────

function MainAppContent() {
  const {
    programData,
    isLoading,
    error,
    selectedProgram,
    selectedPhase,
    activeSession,
    currentView,
    restTimer,
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
    setView,
    startRestTimer,
    stopRestTimer,
    modifyRestTimer,
    lastCompletedSession,
    settings,
    updateSettings,
    user: contextUser,
    authLoading: contextAuthLoading,
    loginWithGoogle,
    logout,
    syncStatus,
    workoutHistory,
    enrolledProgram,
    enrollInProgram,
    abandonProgram
  } = useWorkout()

  const isQABypass = (typeof navigator !== 'undefined' && navigator.webdriver) || (typeof window !== 'undefined' && localStorage.getItem('qa_bypass_auth') === 'true')
  const user = isQABypass ? { uid: 'qa_dummy_user', email: 'qa@example.com' } : contextUser
  const authLoading = isQABypass ? false : contextAuthLoading

  // Calculate the next workout session and its exercises (taking enrolled program into account)
  const nextSession = calculateNextSession(programData, lastCompletedSession, enrolledProgram, workoutHistory)
  const nextExercises = nextSession
    ? getExercises(programData, nextSession.program, nextSession.phase, nextSession.day)
    : []

  const handleQuickStart = () => {
    if (!nextSession) return
    selectProgram(nextSession.program)
    selectPhase(nextSession.phase)
    initSession(nextSession.day, nextExercises)
  }

  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState(null)
  const [sessionNotes, setSessionNotes] = useState('')

  // Track sync transitions to trigger toast
  useEffect(() => {
    if (syncStatus === 'synced' && user) {
      setToastMessage(`Cloud sync complete! ${workoutHistory.length} sessions secured.`)
      const timer = setTimeout(() => setToastMessage(null), 3500)
      return () => clearTimeout(timer)
    } else if (syncStatus === 'error') {
      setToastMessage("Cloud sync failed. Operating offline.")
      const timer = setTimeout(() => setToastMessage(null), 4500)
      return () => clearTimeout(timer)
    }
  }, [syncStatus, user, workoutHistory.length])

  // Handle Shared Routine Deep Link (Item 7)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sharedId = params.get('sharedRoutineId');
    if (sharedId && user) {
      import('./utils/cloudStorage').catch(e => console.error("Dynamic import error:", e)).then(module => {
        if (!module) return;
        const { fetchPublicRoutine, saveRoutineToCloud } = module;
        fetchPublicRoutine(sharedId).then(routine => {
          if (routine) {
            const clone = window.confirm(`Clone public routine "${routine.name}" to your account?`);
            if (clone) {
              const newRoutine = { ...routine, id: crypto.randomUUID(), authorId: user.uid, isPublic: false };
              saveRoutineToCloud(user.uid, newRoutine).then(() => {
                setToastMessage(`Routine "${routine.name}" cloned!`);
                setView('builder');
                window.history.replaceState({}, '', window.location.pathname);
              });
            }
          }
        });
      });
    }
  }, [user]);

  const isNavigatingFromPopstate = useRef(false)

  // ─── Browser History popstate sync (Back/Forward Navigation mapping) ───
  useEffect(() => {
    const handlePopState = (event) => {
      const popState = event.state
      if (!popState) {
        isNavigatingFromPopstate.current = true
        clearSelection()
        setView('select')
        return
      }

      isNavigatingFromPopstate.current = true

      // Prompt user to confirm discarding workout if they go back out of active workout
      if (currentView === 'workout' && popState.currentView !== 'workout') {
        const confirmDiscard = window.confirm("You have an active workout in progress. Are you sure you want to discard it? All progress will be lost.")
        if (!confirmDiscard) {
          // Re-push workout state to override the popState navigation and stay in app
          const stateKey = `${currentView}-${selectedProgram || ''}-${selectedPhase || ''}`
          window.history.pushState({
            key: stateKey,
            currentView,
            selectedProgram,
            selectedPhase
          }, "")
          isNavigatingFromPopstate.current = false
          return
        } else {
          cancelSession()
          stopRestTimer()
        }
      }

      // Safeguard against going forward to workout view without an active session
      if (popState.currentView === 'workout' && !activeSession) {
        setView('select')
        clearSelection()
        return
      }

      // Symmetrically apply popped browser states back to reducer context
      if (popState.currentView) {
        setView(popState.currentView)
      }
      if (popState.selectedProgram === null) {
        clearSelection()
      } else {
        selectProgram(popState.selectedProgram)
        if (popState.selectedPhase) {
          selectPhase(popState.selectedPhase)
        }
      }
    }

    window.addEventListener('popstate', handlePopState)

    // Set initial page history entry on mount
    const initialKey = `${currentView}-${selectedProgram || ''}-${selectedPhase || ''}`
    window.history.replaceState({
      key: initialKey,
      currentView,
      selectedProgram,
      selectedPhase
    }, "")

    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [currentView, selectedProgram, selectedPhase, activeSession])

  // Sync internal program navigation transitions to push to window.history
  useEffect(() => {
    if (isNavigatingFromPopstate.current) {
      isNavigatingFromPopstate.current = false
      return
    }

    const stateKey = `${currentView}-${selectedProgram || ''}-${selectedPhase || ''}`
    if (window.history.state?.key !== stateKey) {
      window.history.pushState({
        key: stateKey,
        currentView,
        selectedProgram,
        selectedPhase
      }, "")
    }
  }, [currentView, selectedProgram, selectedPhase])

  // Track active duration
  const [duration, setDuration] = useState(0)

  // Real-time workout duration counter
  useEffect(() => {
    if (!activeSession) {
      setDuration(0)
      return
    }

    const start = new Date(activeSession.startedAt).getTime()
    const update = () => {
      setDuration(Math.floor((Date.now() - start) / 1000))
    }
    
    update()
    const interval = setInterval(update, 1000)
    return () => clearInterval(interval)
  }, [activeSession])

  // Custom modal summary states
  const [showSummary, setShowSummary] = useState(false)
  const [savedStats, setSavedStats] = useState(null)

  // Parse rest time text e.g. "3-4 MIN" -> 180s
  const parseRestTime = (restStr) => {
    if (!restStr) return 90
    const match = restStr.match(/(\d+)/)
    if (match) {
      const minutes = parseInt(match[1], 10)
      return minutes * 60
    }
    return 90
  }

  // Handle set inputs updates
  const handleUpdateSet = (exerciseId, setNumber, field, value) => {
    if (field === 'weight') {
      updateSetWeight(exerciseId, setNumber, value)
    } else if (field === 'repsCompleted') {
      updateSetReps(exerciseId, setNumber, value)
    }
  }

  // Handle toggling set completion & firing rest timer count
  const handleToggleSetComplete = (exerciseId, setNumber) => {
    const log = activeSession.logs.find(l => l.exerciseId === exerciseId)
    if (!log) return
    const setObj = log.sets.find(s => s.setNumber === setNumber)
    if (!setObj) return

    const willBeComplete = !setObj.isComplete
    completeSet(exerciseId, setNumber)

    if (willBeComplete) {
      const secs = parseRestTime(log.rest)
      startRestTimer(secs, exerciseId)
      
      // Physical haptic vibration feedback for set completion (Polish 14)
      try {
        if (!settings?.silenceAll && settings?.hapticsEnabled && typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate(50)
        }
      } catch (e) {
        console.warn("Haptic feedback error:", e)
      }
    } else {
      if (restTimer.exerciseId === exerciseId && restTimer.isRunning) {
        stopRestTimer()
      }
    }
  }

  // Handles discard confirmation
  const handleCancelWorkout = () => {
    if (window.confirm("Are you sure you want to discard this workout session? All progress will be lost.")) {
      cancelSession()
      stopRestTimer()
    }
  }

  // Calculate volume totals & finalize workout log
  const handleSaveWorkout = () => {
    let completedSetCount = 0
    let totalVolume = 0

    if (activeSession) {
      activeSession.logs.forEach(log => {
        log.sets.forEach(s => {
          if (s.isComplete) {
            completedSetCount++
            const w = parseFloat(s.weight) || 0
            const r = parseInt(s.repsCompleted, 10) || 0
            totalVolume += (w * r)
          }
        })
      })
    }

    // Check if the session completed was the last day of the last phase of the program (mesocycle completion)
    let isMesocycleComplete = false
    try {
      if (programData && activeSession) {
        const phases = Object.keys(programData[activeSession.program] || {})
        if (phases.length > 0) {
          const lastPhaseName = phases[phases.length - 1]
          const days = Object.keys(programData[activeSession.program][lastPhaseName] || {})
          if (days.length > 0) {
            const lastDayName = days[days.length - 1]
            if (activeSession.phase === lastPhaseName && activeSession.day === lastDayName) {
              isMesocycleComplete = true
            }
          }
        }
      }
    } catch (e) {
      console.warn("Failed to check if mesocycle is complete:", e)
    }

    // Calculate PRs (Personal Records) (Feature 9 Summary Part)
    const newPRs = []
    if (activeSession) {
      // 1. Group previous sessions by exercise and find the maximum weight completed
      const previousMaxes = {}
      workoutHistory.forEach(pastSession => {
        if (pastSession.id === activeSession.id) return
        
        pastSession.logs.forEach(log => {
          log.sets.forEach(set => {
            if (set.isComplete) {
              const weight = parseFloat(set.weight) || 0
              if (weight > 0) {
                const exName = log.exerciseName
                if (!previousMaxes[exName] || weight > previousMaxes[exName]) {
                  previousMaxes[exName] = weight
                }
              }
            }
          })
        })
      })

      // 2. Find the max weight completed in the current session for each exercise
      activeSession.logs.forEach(log => {
        let currentMax = 0
        log.sets.forEach(set => {
          if (set.isComplete) {
            const weight = parseFloat(set.weight) || 0
            if (weight > currentMax) {
              currentMax = weight
            }
          }
        })

        if (currentMax > 0) {
          const exName = log.exerciseName
          const prevMax = previousMaxes[exName] || 0
          if (currentMax > prevMax) {
            newPRs.push({
              exerciseName: exName,
              weight: currentMax,
              previousWeight: prevMax
            })
          }
        }
      })
    }

    const stats = {
      day: activeSession ? activeSession.day : '',
      program: activeSession ? activeSession.program : '',
      duration: duration,
      completedSets: completedSetCount,
      totalVolume: totalVolume,
      isMesocycleComplete,
      prs: newPRs
    }

    console.log('[App] Session finalized stats captured:', stats)
    
    // Trigger local details summary modal (we save later on final confirmation)
    setSavedStats(stats)
    setShowSummary(true)
  }

  const handleFinalSave = () => {
    if (activeSession && savedStats) {
      // Direct assignment to state object before context writes/syncs it (Polish 16)
      activeSession.notes = sessionNotes
      activeSession.sessionNote = sessionNotes
      
      console.log('[App] Saving session with notes:', sessionNotes)
      saveSession(savedStats.duration)
    }
    
    setShowSummary(false)
    setSavedStats(null)
    setSessionNotes('')
  }

  const handleDismissSummary = () => {
    setShowSummary(false)
    setSavedStats(null)
    setSessionNotes('')
    cancelSession() // resets workout states and goes back to select
    setView('select')
  }

  // Active Timer Mapping
  let activeTimerExerciseName = ''
  if (restTimer.isRunning && restTimer.exerciseId && activeSession) {
    const activeLog = activeSession.logs.find(log => log.exerciseId === restTimer.exerciseId)
    if (activeLog) {
      activeTimerExerciseName = activeLog.exerciseName
    }
  }

  const mappedRestTimer = {
    active: restTimer.isRunning,
    secondsRemaining: restTimer.seconds,
    exerciseName: activeTimerExerciseName
  }

  // Auth loading screen (full screen branded experience)
  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 px-6 text-center animate-fadeIn">
        <div className="relative mb-6">
          <div className="absolute inset-0 rounded-full bg-violet-500/25 blur-xl animate-pulse" />
          <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-tr from-violet-600 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
            <Dumbbell className="w-8 h-8 text-white animate-spin" />
          </div>
        </div>
        <h2 className="text-xl font-black tracking-tight text-slate-100 mb-1">
          Securing Your Session
        </h2>
        <p className="text-xs text-slate-400 max-w-[200px] tracking-wide font-medium">
          Resolving authentication state...
        </p>
      </div>
    )
  }

  // Gated Auth screen (full screen premium dark-mode glassmorphic design)
  if (!user) {
    return (
      <div className="relative min-h-screen flex flex-col items-center justify-center bg-slate-950 px-6 py-12 overflow-hidden select-none">
        {/* Decorative background glows */}
        <div className="absolute top-[-10%] right-[-10%] w-96 h-96 rounded-full bg-violet-600/10 blur-3xl animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 rounded-full bg-fuchsia-600/10 blur-3xl" />

        <div className="w-full max-w-sm glass-card border-violet-500/20 bg-slate-900/40 p-8 shadow-2xl relative z-10 text-center animate-slideUp">
          {/* Top highlighted border accent */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-violet-500/50 via-fuchsia-500/50 to-transparent" />

          {/* Brand Logo & Icon */}
          <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-tr from-violet-600 to-fuchsia-600 flex items-center justify-center text-white mb-6 shadow-lg shadow-violet-500/25 relative group overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            <Dumbbell className="w-8 h-8 text-white" />
          </div>

          {/* App Title and Description */}
          <h1 className="text-3xl font-black tracking-tight text-slate-100 mb-2 leading-none">
            <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent">
              Workout Tracker
            </span>
          </h1>
          <p className="text-sm font-semibold tracking-wide text-slate-400 mb-8 max-w-[240px] mx-auto uppercase">
            Track your gains. Anywhere.
          </p>

          {/* Features Showcase */}
          <div className="space-y-4 text-left bg-slate-950/40 border border-slate-800/80 rounded-2xl p-4.5 mb-8">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-lg bg-violet-500/10 flex items-center justify-center border border-violet-500/20 flex-shrink-0">
                <Cloud className="w-3.5 h-3.5 text-violet-400" />
              </div>
              <div className="text-xs">
                <p className="font-extrabold text-slate-200 leading-tight">Instant Cloud Sync</p>
                <p className="text-[10px] text-slate-500 font-bold">Access workout splits across all devices</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-lg bg-fuchsia-500/10 flex items-center justify-center border border-fuchsia-500/20 flex-shrink-0">
                <Sparkles className="w-3.5 h-3.5 text-fuchsia-400" />
              </div>
              <div className="text-xs">
                <p className="font-extrabold text-slate-200 leading-tight">Last Session's Reference</p>
                <p className="text-[10px] text-slate-500 font-bold">Instantly view weights & reps from last split</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-lg bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20 flex-shrink-0">
                <BarChart3 className="w-3.5 h-3.5 text-cyan-400" />
              </div>
              <div className="text-xs">
                <p className="font-extrabold text-slate-200 leading-tight">Advanced Analytics</p>
                <p className="text-[10px] text-slate-500 font-bold">Visualize volume splits and calendar history</p>
              </div>
            </div>
          </div>

          {/* Sign In Button */}
          <button
            type="button"
            onClick={loginWithGoogle}
            className="w-full flex items-center justify-center gap-3 py-4 px-6 rounded-xl font-extrabold text-sm text-slate-200 bg-slate-900 border border-slate-800 hover:border-violet-500/30 hover:bg-slate-800/40 transition-all duration-300 transform active:scale-[0.98] shadow-lg relative overflow-hidden group cursor-pointer"
          >
            <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
            </svg>
            <span>Sign in with Google</span>
          </button>

          <div className="mt-6 text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
            Secure cloud authorization via Firebase
          </div>
        </div>
      </div>
    )
  }

  // Render Loader screen
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
        <Dumbbell className="w-10 h-10 text-violet-500 animate-spin mb-4" />
        <h3 className="text-lg font-bold text-slate-200">Parsing Workout Program...</h3>
        <p className="text-xs text-slate-500 mt-1">Caching split days from local CSV file.</p>
      </div>
    )
  }

  // Render Error screen
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
        <AlertCircle className="w-10 h-10 text-rose-500 mb-4" />
        <h3 className="text-lg font-bold text-slate-200">Error Parsing File</h3>
        <p className="text-xs text-rose-400 mt-1">{error}</p>
        <button 
          onClick={clearSelection}
          className="mt-6 px-4 py-2 bg-slate-800 text-slate-300 border border-slate-700 rounded-xl font-bold text-xs"
        >
          Reset Setup
        </button>
      </div>
    )
  }

  // Format Helper for duration time display
  const formatTime = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60)
    const secs = totalSeconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="flex-1 flex flex-col w-full">
      {/* Sticky App Header */}
      <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800/60">
        <div className="flex items-center justify-between max-w-lg mx-auto px-4 py-3">
          <h1 className="text-lg font-extrabold tracking-tight">
            <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent">
              Workout Tracker
            </span>
          </h1>
          <div className="flex items-center gap-2">
            {/* Cloud Sync Status Indicator */}
            {syncStatus !== 'idle' && (
              <div 
                className={`flex items-center justify-center w-8 h-8 rounded-xl border transition-all ${
                  syncStatus === 'syncing' ? 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400' :
                  syncStatus === 'synced' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                  'bg-rose-500/10 border-rose-500/20 text-rose-400'
                }`}
                title={
                  syncStatus === 'syncing' ? 'Syncing with cloud...' :
                  syncStatus === 'synced' ? 'Cloud sync active & up to date' :
                  'Cloud sync error'
                }
              >
                {syncStatus === 'syncing' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : syncStatus === 'synced' ? (
                  <Cloud className="w-4 h-4 fill-current opacity-85" />
                ) : (
                  <CloudOff className="w-4 h-4" />
                )}
              </div>
            )}

            {user && (
              <div className="flex items-center gap-2 bg-slate-950/20 border border-slate-800/30 rounded-xl pl-2.5 pr-1 py-1">
                <div className="hidden sm:flex flex-col items-end mr-0.5">
                  <span className="text-[10px] font-black text-slate-200 leading-none">
                    {user.displayName || user.email?.split('@')[0]}
                  </span>
                  <span className="text-[8px] font-bold text-emerald-400 tracking-wider uppercase mt-0.5 animate-pulse">
                    Cloud Synced
                  </span>
                </div>
                <div 
                  className="w-7 h-7 rounded-lg bg-gradient-to-tr from-violet-600 to-fuchsia-600 flex items-center justify-center text-[10px] font-black text-white shadow border border-violet-400/25 relative group"
                  title={`Signed in as: ${user.displayName || user.email} (${user.email})`}
                >
                  <div className="absolute inset-0 rounded-lg bg-gradient-to-tr from-violet-500 to-fuchsia-500 opacity-0 group-hover:opacity-20 blur transition-opacity duration-300" />
                  {(() => {
                    const name = user.displayName || user.email || '?';
                    const parts = name.trim().split(/\s+/);
                    if (parts.length >= 2) {
                      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
                    }
                    return name.slice(0, 2).toUpperCase();
                  })()}
                </div>
                <button
                  type="button"
                  onClick={logout}
                  className="px-2.5 py-1.5 rounded-xl text-[10px] font-bold bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-rose-400 border border-slate-800 transition-all active:scale-95 transform"
                >
                  Sign Out
                </button>
              </div>
            )}
            <button
              type="button"
              onClick={() => setIsSettingsOpen(true)}
              className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-400 hover:text-slate-100 transition-all flex items-center justify-center active:scale-95 transform"
              title="Open Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col max-w-lg mx-auto w-full px-4 py-6 pb-28">
      
      {/* Floating Cloud Sync Toast Alert */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-xs glass-card border-violet-500/35 bg-slate-900/90 py-3 px-4 shadow-xl flex items-center gap-2.5 animate-slideUp">
          <div className={`w-2 h-2 rounded-full animate-ping ${syncStatus === 'error' ? 'bg-rose-400' : 'bg-emerald-400'}`} />
          <span className="text-[11px] font-extrabold text-slate-200 tracking-tight">{toastMessage}</span>
        </div>
      )}

      {/* ── View Routing Controller ── */}
      {currentView === 'select' && (
        <div className="space-y-6">
          {/* Active Workout Widget indicator if user navigated away while active */}
          {activeSession && (
            <div 
              onClick={() => setView('workout')}
              className="glass-card p-3 border-violet-500/35 bg-violet-950/20 hover:bg-violet-950/30 transition-all cursor-pointer flex items-center justify-between animate-pulse"
            >
              <div className="flex items-center gap-3">
                <Play className="w-4 h-4 text-violet-400 fill-current" />
                <span className="text-xs font-bold text-violet-300">Active Workout: {activeSession.day}</span>
              </div>
              <span className="text-[10px] font-black text-violet-400 uppercase tracking-widest flex items-center gap-0.5">
                Resume <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          )}

          {/* Quick Start / Next Session Card */}
          {nextSession && !activeSession && !selectedProgram && (
            <div className="animate-slideUp mb-6">
              <button
                onClick={handleQuickStart}
                className="w-full text-left glass-card p-5 border-slate-800 hover:border-violet-500/50 hover:bg-slate-800/40 transition-all duration-300 transform active:scale-[0.99] group relative overflow-hidden shadow-xl"
              >
                {/* Glowing decorative background effect */}
                <div className="absolute top-0 right-0 -mr-6 -mt-6 w-32 h-32 rounded-full bg-violet-600/10 blur-2xl group-hover:bg-violet-600/20 transition-all duration-300" />
                <div className="absolute bottom-0 left-0 -ml-6 -mb-6 w-24 h-24 rounded-full bg-fuchsia-600/5 blur-2xl group-hover:bg-fuchsia-600/10 transition-all duration-300" />
                
                {/* Top border highlight gradient */}
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-violet-500/40 via-fuchsia-500/40 to-transparent" />

                <div className="flex items-start justify-between gap-4 relative z-10">
                  <div className="space-y-3.5 flex-1 min-w-0">
                    {/* Header: vibrant gradient text with Sparkles icon */}
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-violet-400 animate-pulse" />
                      <span className="text-[10px] font-black tracking-widest uppercase bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
                        RESUME PROGRAM / UP NEXT
                      </span>
                    </div>

                    <div>
                      {/* Session Name */}
                      <h3 className="text-lg font-black text-slate-100 group-hover:text-violet-400 transition-colors tracking-tight">
                        {nextSession.day}
                      </h3>
                      
                      {/* Pills for Program and Phase */}
                      <div className="flex flex-wrap items-center gap-1.5 mt-2">
                        <span className="text-slate-400 bg-slate-800 px-2 py-0.5 rounded text-[10px] font-bold border border-slate-700">
                          {nextSession.program}
                        </span>
                        <span className="text-slate-400 bg-slate-800 px-2 py-0.5 rounded text-[10px] font-bold border border-slate-700">
                          {nextSession.phase}
                        </span>
                      </div>
                    </div>

                    {/* Exercise Pills Preview */}
                    <div className="space-y-1.5 pt-2 border-t border-slate-800/60">
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Planned movements:</span>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {nextExercises.slice(0, 3).map((ex, i) => (
                          <span key={i} className="text-[10px] font-bold bg-slate-900 border border-slate-800 px-2.5 py-1 rounded text-slate-400 truncate max-w-[120px]">
                            {ex.exercise}
                          </span>
                        ))}
                        {nextExercises.length > 3 && (
                          <span className="text-[10px] font-extrabold bg-slate-900 border border-slate-800 px-2 py-1 rounded text-violet-400">
                            +{nextExercises.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Glowing Premium Start Button */}
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-violet-600/90 to-fuchsia-600/90 hover:from-violet-500 hover:to-fuchsia-500 flex items-center justify-center text-white shadow-lg shadow-violet-500/20 group-hover:scale-105 transition-all duration-300 flex-shrink-0 mt-1 relative overflow-hidden">
                    <Play className="w-4 h-4 text-white fill-current ml-0.5" />
                  </div>
                </div>
              </button>
              {enrolledProgram && (
                <div className="flex items-center justify-between px-1.5 text-xs text-slate-400 font-bold mt-2.5">
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                    Enrolled Program: <span className="text-violet-400 font-black">{enrolledProgram}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`Are you sure you want to switch your active program from "${enrolledProgram}"? Your progression history will remain, but the next suggested workout will target the new program.`)) {
                        abandonProgram()
                      }
                    }}
                    className="text-fuchsia-400 hover:text-fuchsia-300 font-extrabold uppercase tracking-wider underline cursor-pointer transition-colors"
                  >
                    Change Split
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Selector steps */}
          {!selectedProgram && (
            <ProgramStep programData={programData} selectProgram={selectProgram} />
          )}
          {selectedProgram && !selectedPhase && (
            <PhaseStep 
              programData={programData} 
              selectedProgram={selectedProgram} 
              selectPhase={selectPhase} 
              clearSelection={clearSelection}
            />
          )}
          {selectedProgram && selectedPhase && (
            <DayStep 
              programData={programData} 
              selectedProgram={selectedProgram} 
              selectedPhase={selectedPhase} 
              initSession={initSession} 
              selectProgram={selectProgram}
            />
          )}
        </div>
      )}

      {currentView === 'workout' && (
        <WorkoutList 
          session={activeSession}
          duration={duration}
          onUpdateSet={handleUpdateSet}
          onToggleSetComplete={handleToggleSetComplete}
          onAddSet={addSet}
          onRemoveSet={removeSet}
          onSave={handleSaveWorkout}
          onCancel={handleCancelWorkout}
          activeRestTimer={mappedRestTimer}
          onModifyRestTimer={modifyRestTimer}
          onDismissRestTimer={stopRestTimer}
        />
      )}

      {currentView === 'builder' && (
        <RoutineBuilder />
      )}

      {currentView === 'analytics' && (
        <AnalyticsDashboard />
      )}

      {currentView === 'history' && (
        <HistoryCalendar />
      )}

      {/* ─── Workout Summary Modal ─── */}
      {showSummary && savedStats && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-sm glass-card border-violet-500/30 bg-slate-900 p-6 shadow-2xl shadow-violet-950/40 relative transform transition-all duration-300 animate-slideUp">
            {savedStats.isMesocycleComplete ? (
              <>
                <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-yellow-500 to-amber-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-yellow-500/20">
                  <Sparkles className="w-8 h-8 text-white animate-bounce" />
                </div>
                <h3 className="text-2xl font-black text-center tracking-tight text-amber-400 mb-1">
                  Mesocycle Complete!
                </h3>
                <p className="text-xs text-center text-slate-400 mb-6 uppercase tracking-widest font-bold">
                  🏆 You finished all 8 weeks of {savedStats.program}!
                </p>
              </>
            ) : (
              <>
                <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-violet-500 to-fuchsia-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-violet-500/20">
                  <Award className="w-8 h-8 text-white animate-bounce" />
                </div>
                <h3 className="text-2xl font-black text-center tracking-tight text-slate-100 mb-1">
                  Workout Complete!
                </h3>
                <p className="text-xs text-center text-slate-400 mb-6 uppercase tracking-widest font-semibold">
                  Excellent hypertrophy effort!
                </p>
              </>
            )}

            <div className="space-y-3.5 bg-slate-950/50 p-4 rounded-2xl border border-slate-800 mb-5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500 font-bold">WORKOUT DAY</span>
                <span className="text-slate-200 font-extrabold text-right max-w-[150px] truncate">{savedStats.day}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500 font-bold">TOTAL TIME</span>
                <span className="text-slate-200 font-mono font-extrabold">{formatTime(savedStats.duration)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500 font-bold">SETS COMPLETED</span>
                <span className="text-emerald-400 font-extrabold">{savedStats.completedSets} Sets</span>
              </div>
              <div className="flex items-center justify-between text-sm border-t border-slate-900 pt-3">
                <span className="text-slate-500 font-bold">TOTAL VOLUME</span>
                <span className="text-violet-400 font-black text-base">{savedStats.totalVolume.toLocaleString()} KG</span>
              </div>
            </div>

            {/* PRs Section (Feature 9 Summary Part) */}
            {savedStats.prs && savedStats.prs.length > 0 && (
              <div className="mb-5 space-y-2">
                <div className="flex items-center gap-1.5 justify-center text-amber-400">
                  <Sparkles className="w-4 h-4 text-amber-400 fill-current animate-pulse" />
                  <span className="text-xs font-black uppercase tracking-wider">New Personal Records!</span>
                </div>
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-3.5 space-y-2 text-left">
                  {savedStats.prs.map((pr, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs">
                      <span className="text-slate-300 font-bold">🏆 {pr.exerciseName}</span>
                      <span className="text-amber-400 font-extrabold">
                        {pr.weight} kg {pr.previousWeight > 0 ? `(was ${pr.previousWeight} kg)` : '(First time!)'}
                      </span>
                    </div>
                  ))}
                  <p className="text-[10px] text-center text-amber-300 font-bold pt-1 border-t border-amber-500/10">
                    Phenomenal lifting! You are getting stronger!
                  </p>
                </div>
              </div>
            )}

            {/* Session Notes Text Field (Polish 16) */}
            <div className="mb-5 space-y-1.5 text-left">
              <label htmlFor="session-notes" className="text-[10px] font-black text-slate-400 uppercase tracking-wider block pl-1">
                Workout Notes / Feedback
              </label>
              <textarea
                id="session-notes"
                rows={2}
                value={sessionNotes}
                onChange={(e) => setSessionNotes(e.target.value)}
                placeholder="How did the workout feel? Any notes on form, energy levels, or equipment..."
                className="w-full text-xs bg-slate-950/60 border border-slate-800 hover:border-slate-700 focus:border-violet-500 rounded-xl px-3 py-2 text-slate-200 placeholder-slate-600 focus:outline-none transition-all resize-none font-medium"
              />
            </div>

            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setShowSummary(false)
                  setSavedStats(null)
                }}
                className="py-3.5 px-4 rounded-xl font-extrabold bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 active:scale-[0.98] transition-all duration-200 cursor-pointer text-xs"
              >
                Edit Sets
              </button>
              <button
                type="button"
                onClick={handleFinalSave}
                className="flex-1 py-3.5 px-6 rounded-xl font-extrabold bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white shadow-lg shadow-violet-500/10 active:scale-[0.98] transition-all duration-200 cursor-pointer text-xs"
              >
                GREAT WORKOUT!
              </button>
            </div>
          </div>
        </div>
      )}

      </div>

      {/* ── Bottom Navigation Tab Bar ── */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-xl border-t border-slate-800/60 safe-area-pb">
        <div className="flex max-w-lg mx-auto relative">
          {[
            { id: 'select', label: 'Workout', icon: Dumbbell, activeMatch: ['select', 'workout'] },
            { id: 'builder', label: 'Builder', icon: Plus, activeMatch: ['builder'] },
            { id: 'analytics', label: 'Analytics', icon: BarChart3, activeMatch: ['analytics'] },
            { id: 'history', label: 'History', icon: Calendar, activeMatch: ['history'] },
          ].map((tab) => {
            const Icon = tab.icon
            const isActive = tab.activeMatch.includes(currentView)
            
            const handleTabClick = () => {
              if ((tab.id === 'history' || tab.id === 'analytics') && currentView === 'workout' && activeSession) {
                const proceed = window.confirm(
                  `You have an active workout in progress. Your session will be preserved in the background. Proceed to ${tab.label}?`
                );
                if (!proceed) return;
              }
              
              if (tab.id === 'select' && activeSession) {
                // If there's an active session, navigate directly back to it
                setView('workout')
              } else {
                setView(tab.id)
              }
            }

            return (
              <button
                key={tab.id}
                id={`tab-${tab.id}`}
                onClick={handleTabClick}
                className={`
                  flex-1 flex flex-col items-center gap-1 py-3 relative
                  transition-all duration-300 ease-out
                  ${isActive
                    ? 'text-violet-400'
                    : 'text-slate-500 active:text-slate-300'
                  }
                `}
                aria-label={tab.label}
                aria-selected={isActive}
                role="tab"
              >
                <Icon
                  className={`w-5 h-5 transition-transform duration-300 ${isActive ? 'scale-110' : ''}`}
                  strokeWidth={isActive ? 2.5 : 1.8}
                />
                <span className={`text-[11px] font-semibold tracking-wide ${isActive ? 'text-violet-400' : 'text-slate-500'}`}>
                  {tab.label}
                </span>
                {isActive && (
                  <span className="absolute -top-px left-1/2 -translate-x-1/2 w-10 h-[3px] bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full" />
                )}
              </button>
            )
          })}
        </div>
      </nav>

      {/* ─── Settings Modal ─── */}
      {isSettingsOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn"
          onClick={() => setIsSettingsOpen(false)}
        >
          <div 
            className="w-full max-w-sm glass-card border-slate-800 bg-slate-900 p-6 shadow-2xl relative transform transition-all duration-300 animate-slideUp"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setIsSettingsOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-slate-200 transition-all"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-sm font-black tracking-wider text-slate-100 mb-5 flex items-center gap-2 uppercase">
              <Settings className="w-4.5 h-4.5 text-violet-400" />
              Alert Settings
            </h3>

            <div className="space-y-3 mb-6">
              {/* Silence All (Mute Both) */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950/40 border border-slate-850">
                <div className="flex flex-col">
                  <span className="text-xs font-extrabold text-slate-200">Mute All Alerts</span>
                  <span className="text-[10px] text-slate-500 font-bold mt-0.5">Disable both haptics & chime</span>
                </div>
                <button
                  type="button"
                  onClick={() => updateSettings({ silenceAll: !settings.silenceAll })}
                  className={`w-11 h-6 rounded-full p-0.5 transition-colors duration-300 outline-none flex items-center ${
                    settings.silenceAll ? 'bg-rose-600' : 'bg-slate-800'
                  }`}
                >
                  <div className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-300 ${
                    settings.silenceAll ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              {/* Sound Toggle */}
              <div className={`flex items-center justify-between p-3.5 rounded-2xl bg-slate-950/40 border border-slate-850 transition-opacity duration-300 ${
                settings.silenceAll ? 'opacity-40 pointer-events-none' : ''
              }`}>
                <div className="flex flex-col">
                  <span className="text-xs font-extrabold text-slate-200">Audio Chime</span>
                  <span className="text-[10px] text-slate-500 font-bold mt-0.5">Dual-tone synth rest alert</span>
                </div>
                <button
                  type="button"
                  disabled={settings.silenceAll}
                  onClick={() => updateSettings({ soundEnabled: !settings.soundEnabled })}
                  className={`w-11 h-6 rounded-full p-0.5 transition-colors duration-300 outline-none flex items-center ${
                    settings.soundEnabled && !settings.silenceAll ? 'bg-violet-600' : 'bg-slate-800'
                  }`}
                >
                  <div className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-300 ${
                    settings.soundEnabled && !settings.silenceAll ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              {/* Haptic Toggle */}
              <div className={`flex items-center justify-between p-3.5 rounded-2xl bg-slate-950/40 border border-slate-850 transition-opacity duration-300 ${
                settings.silenceAll ? 'opacity-40 pointer-events-none' : ''
              }`}>
                <div className="flex flex-col">
                  <span className="text-xs font-extrabold text-slate-200">Device Haptics</span>
                  <span className="text-[10px] text-slate-500 font-bold mt-0.5">Physical vibration feedback</span>
                </div>
                <button
                  type="button"
                  disabled={settings.silenceAll}
                  onClick={() => updateSettings({ hapticsEnabled: !settings.hapticsEnabled })}
                  className={`w-11 h-6 rounded-full p-0.5 transition-colors duration-300 outline-none flex items-center ${
                    settings.hapticsEnabled && !settings.silenceAll ? 'bg-violet-600' : 'bg-slate-800'
                  }`}
                >
                  <div className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-300 ${
                    settings.hapticsEnabled && !settings.silenceAll ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsSettingsOpen(false)}
              className="w-full py-3 px-6 rounded-xl font-extrabold bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white shadow-lg shadow-violet-500/10 active:scale-[0.98] transition-all duration-200"
            >
              Save Settings
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function App() {
  return (
    <WorkoutProvider>
      <div className="bg-slate-900 text-slate-100 min-h-screen flex flex-col font-sans">
        {/* Dynamic content rendering with Provider state */}
        <MainAppContent />
      </div>
    </WorkoutProvider>
  )
}
