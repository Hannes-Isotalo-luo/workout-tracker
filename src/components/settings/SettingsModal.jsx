import { Settings, Download } from 'lucide-react';
import Modal from '../ui/Modal';
import { useWorkout } from '../../context/WorkoutContext';
import { exportHistoryToCsv } from '../../utils/exportCsv';

/** A labeled on/off switch row. */
function ToggleRow({ title, subtitle, on, onToggle, disabled = false, activeColor = 'bg-violet-600' }) {
  return (
    <div
      className={`flex items-center justify-between p-3.5 rounded-2xl bg-slate-950/40 border border-slate-850 transition-opacity duration-300 ${
        disabled ? 'opacity-40 pointer-events-none' : ''
      }`}
    >
      <div className="flex flex-col">
        <span className="text-xs font-extrabold text-slate-200">{title}</span>
        <span className="text-[10px] text-slate-500 font-bold mt-0.5">{subtitle}</span>
      </div>
      <button
        type="button"
        disabled={disabled}
        onClick={onToggle}
        className={`w-11 h-6 rounded-full p-0.5 transition-colors duration-300 outline-none flex items-center ${on ? activeColor : 'bg-slate-800'}`}
      >
        <div className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-300 ${on ? 'translate-x-5' : 'translate-x-0'}`} />
      </button>
    </div>
  );
}

/** Alert preferences + data export. */
export default function SettingsModal({ onClose, showToast }) {
  const { settings, updateSettings, workoutHistory } = useWorkout();

  const handleExport = () => {
    if (!workoutHistory || workoutHistory.length === 0) {
      showToast('No workout history to export yet.');
      return;
    }
    const count = exportHistoryToCsv(workoutHistory);
    showToast(`Exported ${count} session${count === 1 ? '' : 's'} to CSV.`);
  };

  return (
    <Modal onClose={onClose}>
      <h3 className="text-sm font-black tracking-wider text-slate-100 mb-5 flex items-center gap-2 uppercase">
        <Settings className="w-4.5 h-4.5 text-violet-400" />
        Alert Settings
      </h3>

      <div className="space-y-3 mb-6">
        <ToggleRow
          title="Mute All Alerts"
          subtitle="Disable both haptics & chime"
          on={settings.silenceAll}
          onToggle={() => updateSettings({ silenceAll: !settings.silenceAll })}
          activeColor="bg-rose-600"
        />
        <ToggleRow
          title="Audio Chime"
          subtitle="Dual-tone synth rest alert"
          on={settings.soundEnabled && !settings.silenceAll}
          onToggle={() => updateSettings({ soundEnabled: !settings.soundEnabled })}
          disabled={settings.silenceAll}
        />
        <ToggleRow
          title="Device Haptics"
          subtitle="Physical vibration feedback"
          on={settings.hapticsEnabled && !settings.silenceAll}
          onToggle={() => updateSettings({ hapticsEnabled: !settings.hapticsEnabled })}
          disabled={settings.silenceAll}
        />
      </div>

      <div className="mb-5 pt-1">
        <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-2 pl-1">Your Data</span>
        <button
          type="button"
          onClick={handleExport}
          className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-slate-950/40 border border-slate-850 hover:border-emerald-500/40 hover:bg-emerald-950/15 transition-all group"
        >
          <div className="flex flex-col text-left">
            <span className="text-xs font-extrabold text-slate-200">Export History (CSV)</span>
            <span className="text-[10px] text-slate-500 font-bold mt-0.5">Download all sessions as a spreadsheet</span>
          </div>
          <Download className="w-5 h-5 text-slate-400 group-hover:text-emerald-400 transition-colors" />
        </button>
      </div>

      <button
        type="button"
        onClick={onClose}
        className="w-full py-3 px-6 rounded-xl font-extrabold bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white shadow-lg shadow-violet-500/10 active:scale-[0.98] transition-all duration-200"
      >
        Save Settings
      </button>
    </Modal>
  );
}
