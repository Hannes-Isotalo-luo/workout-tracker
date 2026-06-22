/**
 * Small pill label. Pass `tone` for a preset color, or `className` to fully
 * override. Used for program/phase/RPE/rest tags.
 */
const TONES = {
  slate:  'bg-surf-chip text-[#8b96a8] border-line-c',
  violet: 'bg-accent/10 text-accent border-accent/20',
  green:  'bg-gain/10 text-gain-t border-gain/20',
  amber:  'bg-peak/10 text-peak border-peak/20',
};

export default function Badge({ tone = 'slate', className = '', children }) {
  return (
    <span className={`text-xs font-bold px-2 py-0.5 rounded border ${TONES[tone] || TONES.slate} ${className}`}>
      {children}
    </span>
  );
}
