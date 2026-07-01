import { useEffect } from 'react';
import { X } from 'lucide-react';

/**
 * Shared modal / bottom-sheet wrapper. Handles the backdrop, click-outside
 * close, Escape-to-close, centering, and an optional close button — so
 * individual modals only provide their content.
 *
 * @param {boolean} [open=true]
 * @param {() => void} onClose
 * @param {React.ReactNode} children
 * @param {string} [maxWidth='max-w-sm']
 * @param {string} [borderClass='border-slate-800']
 * @param {boolean} [showClose=true]
 * @param {boolean} [anchorBottom=false] — slide up from the bottom on mobile
 * @param {number} [z=50]
 */
export default function Modal({
  open = true,
  onClose,
  children,
  maxWidth = 'max-w-sm',
  borderClass = 'border-slate-800',
  panelClass = '',
  showClose = true,
  anchorBottom = false,
  z = 50,
}) {
  useEffect(() => {
    if (!open || !onClose) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;
  const align = anchorBottom ? 'items-end sm:items-center' : 'items-center';
  return (
    <div
      className={`fixed inset-0 flex ${align} justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn`}
      style={{ zIndex: z }}
      onClick={onClose}
    >
      <div
        className={`w-full ${maxWidth} glass-card ${borderClass} bg-slate-900 p-6 shadow-2xl relative transform transition-all duration-300 animate-slideUp ${panelClass}`}
        onClick={(e) => e.stopPropagation()}
      >
        {showClose && onClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-slate-200 transition-all"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        {children}
      </div>
    </div>
  );
}
