import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Save, Share2, ArrowLeft, Loader2, Sparkles, Play } from 'lucide-react';
import { useWorkout } from '../../context/WorkoutContext';

const newId = () => crypto.randomUUID();

export default function RoutineBuilder() {
  const { user, setView, selectProgram, customRoutines, saveRoutine, deleteRoutine, shareRoutine, reloadRoutines } = useWorkout();

  const [loading, setLoading] = useState(true);
  const [editingRoutine, setEditingRoutine] = useState(null);
  const [saving, setSaving] = useState(false);
  const [shareLink, setShareLink] = useState(null);

  // Refresh from cloud on mount so the list is current.
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    let active = true;
    reloadRoutines().finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [user, reloadRoutines]);

  const routines = customRoutines;

  const handleCreateNew = () => {
    setEditingRoutine({
      id: newId(),
      name: 'New Custom Routine',
      authorId: user.uid,
      isPublic: false,
      phases: [{ id: newId(), name: 'Phase 1', days: [{ id: newId(), name: 'Day 1', exercises: [] }] }],
    });
  };

  const handleSave = async () => {
    if (!editingRoutine) return;
    setSaving(true);
    try {
      await saveRoutine(editingRoutine);
      setEditingRoutine(null);
    } catch (e) {
      console.error('Save failed', e);
    }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this routine?')) return;
    await deleteRoutine(id);
  };

  const handleShare = async (routine) => {
    try {
      const shareId = await shareRoutine(routine);
      const url = new URL(window.location.href);
      url.searchParams.set('sharedRoutineId', shareId);
      setShareLink(url.toString());
    } catch (e) {
      console.error('Failed to share', e);
    }
  };

  // Launch a saved routine into the normal workout selector flow.
  const handleStart = (routine) => {
    selectProgram(routine.name);
    setView('select');
  };

  const routineHasExercises = (routine) =>
    (routine.phases || []).some((p) => (p.days || []).some((d) => (d.exercises || []).length > 0));

  const addPhase = () =>
    setEditingRoutine((prev) => ({
      ...prev,
      phases: [...prev.phases, { id: newId(), name: `Phase ${prev.phases.length + 1}`, days: [] }],
    }));

  const addDay = (pIdx) =>
    setEditingRoutine((prev) => {
      const phases = [...prev.phases];
      phases[pIdx].days.push({ id: newId(), name: `Day ${phases[pIdx].days.length + 1}`, exercises: [] });
      return { ...prev, phases };
    });

  const addExercise = (pIdx, dIdx) =>
    setEditingRoutine((prev) => {
      const phases = [...prev.phases];
      phases[pIdx].days[dIdx].exercises.push({ id: newId(), name: 'New Exercise', targetSets: 3, targetReps: 10, rest: '2-3 MIN', rpe: 8, notes: '' });
      return { ...prev, phases };
    });

  const updateExercise = (pIdx, dIdx, eIdx, field, value) =>
    setEditingRoutine((prev) => {
      const phases = [...prev.phases];
      phases[pIdx].days[dIdx].exercises[eIdx][field] = value;
      return { ...prev, phases };
    });

  const removeExercise = (pIdx, dIdx, eIdx) =>
    setEditingRoutine((prev) => {
      const phases = [...prev.phases];
      phases[pIdx].days[dIdx].exercises.splice(eIdx, 1);
      return { ...prev, phases };
    });

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center bg-slate-900 min-h-[50vh]">
        <h3 className="text-lg font-bold text-slate-200">Login Required</h3>
        <p className="text-sm text-slate-400 mt-2">Log in to build and save custom routines.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
      </div>
    );
  }

  if (editingRoutine) {
    return (
      <div className="space-y-6 bg-slate-900 text-slate-100 min-h-screen pb-24 p-4">
        <div className="flex items-center justify-between mb-4 mt-2">
          <button onClick={() => setEditingRoutine(null)} className="p-2 rounded-full bg-slate-800 text-slate-300">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 py-2 px-4 rounded-xl font-extrabold bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white disabled:opacity-50 text-sm"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save
          </button>
        </div>

        <div className="glass-card p-4 border border-slate-800 bg-slate-900/90 rounded-2xl">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Routine Name</label>
          <input
            type="text"
            value={editingRoutine.name}
            onChange={(e) => setEditingRoutine({ ...editingRoutine, name: e.target.value })}
            className="w-full bg-slate-950/50 border border-slate-700 rounded-lg p-3 text-lg font-bold text-white mt-1 focus:border-violet-500 outline-none transition-colors"
          />
        </div>

        {editingRoutine.phases.map((phase, pIdx) => (
          <div key={phase.id} className="glass-card p-4 border border-violet-900/50 bg-slate-800/30 rounded-2xl space-y-4">
            <input
              type="text"
              value={phase.name}
              onChange={(e) => {
                const phases = [...editingRoutine.phases];
                phases[pIdx].name = e.target.value;
                setEditingRoutine({ ...editingRoutine, phases });
              }}
              className="bg-transparent border-b border-violet-500 text-violet-400 font-black text-xl outline-none w-full"
            />

            {phase.days.map((day, dIdx) => (
              <div key={day.id} className="p-3 bg-slate-900 rounded-xl border border-slate-700 space-y-3">
                <input
                  type="text"
                  value={day.name}
                  onChange={(e) => {
                    const phases = [...editingRoutine.phases];
                    phases[pIdx].days[dIdx].name = e.target.value;
                    setEditingRoutine({ ...editingRoutine, phases });
                  }}
                  className="bg-transparent text-slate-200 font-bold text-lg outline-none w-full border-b border-slate-700 pb-1"
                />

                {day.exercises.map((ex, eIdx) => (
                  <div key={ex.id} className="flex flex-col gap-2 p-3 bg-slate-800/50 rounded-lg border border-slate-600 relative">
                    <button onClick={() => removeExercise(pIdx, dIdx, eIdx)} className="absolute top-2 right-2 text-rose-400 hover:text-rose-300 bg-slate-900 p-1 rounded-md">
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <input
                      type="text"
                      value={ex.name}
                      onChange={(e) => updateExercise(pIdx, dIdx, eIdx, 'name', e.target.value)}
                      placeholder="Exercise Name"
                      className="bg-transparent text-white font-semibold outline-none w-[85%] text-sm"
                    />
                    <div className="flex items-center gap-1 mt-1">
                      <input
                        type="number"
                        value={ex.targetSets}
                        onChange={(e) => updateExercise(pIdx, dIdx, eIdx, 'targetSets', parseInt(e.target.value) || 0)}
                        className="w-12 bg-slate-900 border border-slate-600 rounded p-1 text-center text-xs"
                      />
                      <span className="text-slate-400 text-[10px] font-bold">sets ×</span>
                      <input
                        type="number"
                        value={ex.targetReps}
                        onChange={(e) => updateExercise(pIdx, dIdx, eIdx, 'targetReps', parseInt(e.target.value) || 0)}
                        className="w-12 bg-slate-900 border border-slate-600 rounded p-1 text-center text-xs"
                      />
                      <span className="text-slate-400 text-[10px] font-bold">reps</span>
                      <span className="text-slate-400 text-[10px] font-bold ml-2">RPE</span>
                      <input
                        type="number"
                        value={ex.rpe}
                        onChange={(e) => updateExercise(pIdx, dIdx, eIdx, 'rpe', parseFloat(e.target.value) || 0)}
                        className="w-12 bg-slate-900 border border-slate-600 rounded p-1 text-center text-xs"
                      />
                    </div>
                  </div>
                ))}

                <button onClick={() => addExercise(pIdx, dIdx)} className="w-full py-2 border border-dashed border-slate-600 text-slate-400 rounded-lg flex items-center justify-center gap-2 hover:border-violet-500 hover:text-violet-400 transition-colors text-xs font-bold">
                  <Plus className="w-4 h-4" /> Add Exercise
                </button>
              </div>
            ))}

            <button onClick={() => addDay(pIdx)} className="py-2 px-4 bg-slate-800 text-slate-300 rounded-lg font-bold text-xs hover:bg-slate-700 w-full text-center">
              + Add Day to Phase
            </button>
          </div>
        ))}

        <button onClick={addPhase} className="w-full py-3 border-2 border-dashed border-violet-500/50 text-violet-400 rounded-2xl flex items-center justify-center gap-2 hover:border-violet-500 hover:bg-violet-500/10 transition-colors font-black text-sm">
          <Plus className="w-5 h-5" /> Add Phase
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-slate-900 text-slate-100 min-h-screen pb-24 p-4">
      <div className="flex items-center justify-between mb-2 mt-4">
        <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400">My Routines</h1>
        <button onClick={handleCreateNew} className="p-2 rounded-full bg-violet-600 text-white hover:bg-violet-500 transition-colors shadow-lg shadow-violet-500/20">
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {shareLink && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl animate-fadeIn">
          <p className="text-xs text-emerald-400 font-bold mb-2 flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> Share Link Generated!
          </p>
          <input
            type="text"
            readOnly
            value={shareLink}
            className="w-full bg-slate-900 border border-emerald-500/50 rounded-lg p-2 text-[10px] text-slate-300 outline-none"
            onClick={(e) => e.target.select()}
          />
        </div>
      )}

      {routines.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-slate-700 rounded-3xl mt-8">
          <Sparkles className="w-10 h-10 text-slate-500 mb-3" />
          <p className="text-slate-400 font-bold text-sm">No custom routines yet.</p>
          <p className="text-[10px] text-slate-500 mt-1">Tap + to build your own workout plan.</p>
        </div>
      ) : (
        <div className="space-y-3 mt-4">
          {routines.map((routine) => (
            <div key={routine.id} className="glass-card p-4 border border-slate-700 bg-slate-800/50 rounded-2xl flex items-center justify-between">
              <div className="min-w-0">
                <h3 className="font-bold text-sm text-white truncate">{routine.name}</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {routine.phases.length} Phases • {routine.phases.reduce((acc, p) => acc + p.days.length, 0)} Days
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {routineHasExercises(routine) && (
                  <button
                    onClick={() => handleStart(routine)}
                    title="Start workout from this routine"
                    className="flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 rounded-lg text-white text-xs font-bold transition-colors"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" /> Start
                  </button>
                )}
                <button onClick={() => handleShare(routine)} className="p-2 bg-slate-700 rounded-lg text-emerald-400 hover:bg-slate-600 transition-colors" title="Share">
                  <Share2 className="w-4 h-4" />
                </button>
                <button onClick={() => setEditingRoutine(routine)} className="px-3 py-1.5 bg-violet-600/20 rounded-lg text-violet-400 hover:bg-violet-600/40 text-xs font-bold transition-colors">
                  Edit
                </button>
                <button onClick={() => handleDelete(routine.id)} className="p-2 bg-slate-700 rounded-lg text-rose-400 hover:bg-slate-600 transition-colors" title="Delete">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
