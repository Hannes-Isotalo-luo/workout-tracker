import { Plus, Trash2, Save, ArrowLeft, Loader2 } from 'lucide-react';

const newId = () => crypto.randomUUID();

/** Full-screen editor for a single custom routine's phases/days/exercises. */
export default function RoutineEditor({ routine, onChange, onSave, onCancel, saving }) {
  const addPhase = () =>
    onChange({
      ...routine,
      phases: [...routine.phases, { id: newId(), name: `Phase ${routine.phases.length + 1}`, days: [] }],
    });

  const addDay = (pIdx) => {
    const phases = [...routine.phases];
    phases[pIdx].days.push({ id: newId(), name: `Day ${phases[pIdx].days.length + 1}`, exercises: [] });
    onChange({ ...routine, phases });
  };

  const addExercise = (pIdx, dIdx) => {
    const phases = [...routine.phases];
    phases[pIdx].days[dIdx].exercises.push({ id: newId(), name: 'New Exercise', targetSets: 3, targetReps: 10, rest: '2-3 MIN', rpe: 8, notes: '' });
    onChange({ ...routine, phases });
  };

  const updateExercise = (pIdx, dIdx, eIdx, field, value) => {
    const phases = [...routine.phases];
    phases[pIdx].days[dIdx].exercises[eIdx][field] = value;
    onChange({ ...routine, phases });
  };

  const removeExercise = (pIdx, dIdx, eIdx) => {
    const phases = [...routine.phases];
    phases[pIdx].days[dIdx].exercises.splice(eIdx, 1);
    onChange({ ...routine, phases });
  };

  const renamePhase = (pIdx, name) => {
    const phases = [...routine.phases];
    phases[pIdx].name = name;
    onChange({ ...routine, phases });
  };

  const renameDay = (pIdx, dIdx, name) => {
    const phases = [...routine.phases];
    phases[pIdx].days[dIdx].name = name;
    onChange({ ...routine, phases });
  };

  return (
    <div className="space-y-6 bg-canvas text-[#f8fafc] min-h-screen pb-24 p-4">
      <div className="flex items-center justify-between mb-4 mt-2">
        <button onClick={onCancel} className="p-2 rounded-full bg-surf-chip border border-line-c text-[#8b96a8]">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <button
          onClick={onSave}
          disabled={saving}
          className="flex items-center gap-2 py-2 px-4 rounded-[11px] font-extrabold bg-accent hover:bg-accent/90 text-white disabled:opacity-50 text-sm border border-accent/30"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save
        </button>
      </div>

      <div className="bg-surf border border-line-c rounded-[18px] p-4">
        <label className="text-xs font-bold text-[#5b6678] uppercase tracking-wide">Routine Name</label>
        <input
          type="text"
          value={routine.name}
          onChange={(e) => onChange({ ...routine, name: e.target.value })}
          className="w-full bg-canvas border border-line-in rounded-[11px] p-3 text-lg font-bold text-[#f8fafc] mt-1 focus:border-accent outline-none transition-colors"
        />
      </div>

      {routine.phases.map((phase, pIdx) => (
        <div key={phase.id} className="bg-surf border border-line-c rounded-[18px] p-4 space-y-4">
          <input
            type="text"
            value={phase.name}
            onChange={(e) => renamePhase(pIdx, e.target.value)}
            className="bg-transparent border-b border-accent text-accent font-black text-xl outline-none w-full"
          />

          {phase.days.map((day, dIdx) => (
            <div key={day.id} className="p-3 bg-canvas rounded-[13px] border border-line-sub space-y-3">
              <input
                type="text"
                value={day.name}
                onChange={(e) => renameDay(pIdx, dIdx, e.target.value)}
                className="bg-transparent text-[#d3dae4] font-bold text-lg outline-none w-full border-b border-line-c pb-1"
              />

              {day.exercises.map((ex, eIdx) => (
                <div key={ex.id} className="flex flex-col gap-2 p-3 bg-surf rounded-[13px] border-l-[3px] border-l-gain border border-line-ok relative">
                  <button
                    onClick={() => removeExercise(pIdx, dIdx, eIdx)}
                    className="absolute top-2 right-2 text-rose-400 hover:text-rose-300 bg-canvas p-1 rounded-md"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <div className="flex items-center gap-2">
                    <span className="text-gain-t text-xs font-extrabold font-mono">
                      {(eIdx + 1).toString().padStart(2, '0')}
                    </span>
                    <input
                      type="text"
                      value={ex.name}
                      onChange={(e) => updateExercise(pIdx, dIdx, eIdx, 'name', e.target.value)}
                      placeholder="Exercise Name"
                      className="bg-transparent text-[#f8fafc] font-semibold outline-none w-[75%] text-sm"
                    />
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    <input
                      type="number"
                      value={ex.targetSets}
                      onChange={(e) => updateExercise(pIdx, dIdx, eIdx, 'targetSets', parseInt(e.target.value) || 0)}
                      className="w-12 bg-canvas border border-line-in rounded p-1 text-center text-xs text-[#f8fafc]"
                    />
                    <span className="text-[#5b6678] text-[10px] font-bold">sets ×</span>
                    <input
                      type="number"
                      value={ex.targetReps}
                      onChange={(e) => updateExercise(pIdx, dIdx, eIdx, 'targetReps', parseInt(e.target.value) || 0)}
                      className="w-12 bg-canvas border border-line-in rounded p-1 text-center text-xs text-[#f8fafc]"
                    />
                    <span className="text-[#5b6678] text-[10px] font-bold">reps</span>
                    <span className={`text-[10px] font-bold ml-2 ${ex.rpe >= 9 ? 'text-peak' : 'text-[#5b6678]'}`}>RPE</span>
                    <input
                      type="number"
                      value={ex.rpe}
                      onChange={(e) => updateExercise(pIdx, dIdx, eIdx, 'rpe', parseFloat(e.target.value) || 0)}
                      className="w-12 bg-canvas border border-line-in rounded p-1 text-center text-xs text-[#f8fafc]"
                    />
                  </div>
                </div>
              ))}

              <button
                onClick={() => addExercise(pIdx, dIdx)}
                className="w-full py-2 border border-dashed border-line-c text-[#8b96a8] rounded-[13px] flex items-center justify-center gap-2 hover:border-accent hover:text-accent transition-colors text-xs font-bold"
              >
                <Plus className="w-4 h-4" /> Add Exercise
              </button>
            </div>
          ))}

          <button
            onClick={() => addDay(pIdx)}
            className="py-2 px-4 bg-surf-chip text-[#d3dae4] rounded-[11px] font-bold text-xs hover:bg-surf-hi w-full text-center border border-line-c"
          >
            + Add Day to Phase
          </button>
        </div>
      ))}

      <button
        onClick={addPhase}
        className="w-full py-3 border-[1.5px] border-dashed border-accent/40 text-accent rounded-[18px] flex items-center justify-center gap-2 hover:border-accent hover:bg-accent/10 transition-colors font-black text-sm"
      >
        <Plus className="w-5 h-5" /> Add Phase
      </button>
    </div>
  );
}
