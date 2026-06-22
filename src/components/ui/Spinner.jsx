import { Dumbbell, Loader2 } from 'lucide-react';

/**
 * Loading spinner. `variant="brand"` spins the dumbbell mark (used on full
 * screens); the default is a plain rotating loader for inline use.
 */
export default function Spinner({ variant = 'default', className = 'w-8 h-8 text-accent' }) {
  const Icon = variant === 'brand' ? Dumbbell : Loader2;
  return <Icon className={`animate-spin ${className}`} />;
}
