/**
 * Reusable button with a few visual variants. Falls through any extra props
 * (onClick, disabled, type, aria-*, title…) to the underlying <button>.
 */
const VARIANTS = {
  primary:
    'bg-accent hover:bg-accent/90 text-white shadow-lg shadow-accent/20',
  secondary: 'bg-surf hover:bg-surf-hi text-[#d3dae4] border border-line-c',
  ghost: 'bg-transparent border border-line-c hover:border-line-hi text-[#8b96a8] hover:text-[#d3dae4]',
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
      className={`rounded-[15px] font-extrabold transition-all duration-200 active:scale-[0.97] disabled:opacity-40 disabled:pointer-events-none ${VARIANTS[variant] || VARIANTS.primary} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
