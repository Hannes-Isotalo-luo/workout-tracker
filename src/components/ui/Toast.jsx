/**
 * Floating status toast pinned below the header. Rendered when `message` is set.
 * `tone="error"` switches the pulse dot to rose.
 */
export default function Toast({ message, tone = 'success' }) {
  if (!message) return null;
  return (
    <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-xs bg-surf border border-accent/30 rounded-[13px] py-3 px-4 shadow-xl flex items-center gap-2.5 animate-slideUp">
      <div className={`w-2 h-2 rounded-full animate-ping ${tone === 'error' ? 'bg-rose-400' : 'bg-gain'}`} />
      <span className="text-[11px] font-extrabold text-[#d3dae4] tracking-tight">{message}</span>
    </div>
  );
}
