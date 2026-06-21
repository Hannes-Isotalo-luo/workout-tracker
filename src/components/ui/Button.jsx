/**
 * Reusable button with a few visual variants. Falls through any extra props
 * (onClick, disabled, type, aria-*, title…) to the underlying <button>.
 */
const VARIANTS = {
  primary:
    'bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white shadow-lg shadow-violet-500/10',
  secondary: 'bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700',
  ghost: 'bg-transparent border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200',
  danger: 'bg-rose-950/30 hover:bg-rose-900/40 text-rose-400 border border-rose-900/40',
};

export default function Button({
  variant = 'primary',
  className = '',
  type = 'button',
  children,
  ...rest
}) {
  return (
    <button
      type={type}
      className={`rounded-xl font-extrabold transition-all duration-200 active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none ${VARIANTS[variant] || VARIANTS.primary} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
