/**
 * Small pill label. Pass `tone` for a preset color, or `className` to fully
 * override. Used for program/phase/RPE/rest tags.
 */
const TONES = {
  slate: 'bg-slate-800 text-slate-400 border-slate-700',
  violet: 'bg-violet-500/10 text-violet-400 border-violet-500/15',
  fuchsia: 'bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/15',
  cyan: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/15',
  emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
};

export default function Badge({ tone = 'slate', className = '', children }) {
  return (
    <span className={`text-xs font-bold px-2 py-0.5 rounded border ${TONES[tone] || TONES.slate} ${className}`}>
      {children}
    </span>
  );
}
