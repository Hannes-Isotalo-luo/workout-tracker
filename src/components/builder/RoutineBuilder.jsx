import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { useWorkout } from '../../context/WorkoutContext';
import RoutineEditor from './RoutineEditor';
import RoutineList from './RoutineList';

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

  const handleStart = (routine) => {
    selectProgram(routine.name);
    setView('select');
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center bg-canvas min-h-[50vh]">
        <h3 className="text-lg font-bold text-[#f8fafc]">Login Required</h3>
        <p className="text-sm text-[#8b96a8] mt-2">Log in to build and save custom routines.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  if (editingRoutine) {
    return (
      <RoutineEditor
        routine={editingRoutine}
        onChange={setEditingRoutine}
        onSave={handleSave}
        onCancel={() => setEditingRoutine(null)}
        saving={saving}
      />
    );
  }

  return (
    <RoutineList
      routines={customRoutines}
      shareLink={shareLink}
      onCreateNew={handleCreateNew}
      onStart={handleStart}
      onShare={handleShare}
      onEdit={setEditingRoutine}
      onDelete={handleDelete}
    />
  );
}
