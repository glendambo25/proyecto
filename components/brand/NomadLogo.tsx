/**
 * Nomad logo, drawn inline from public/brand/nomad-logo.svg so the wordmark can follow the text colour
 * (ink on paper, paper on the dark sidebar). The mark keeps its own colours.
 * SVG geometry does not mirror in RTL, which is what a logo needs.
 */
export function NomadMark({ size = 32, className = "" }: { size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} className={className} aria-hidden>
      <rect width="64" height="64" rx="16" fill="#111827" />
      <path d="M18 46 V30 a14 14 0 0 1 28 0 V40" fill="none" stroke="#ffffff" strokeWidth="7" strokeLinecap="round" />
      <circle cx="46" cy="47.5" r="4.5" fill="#4f46e5" />
    </svg>
  );
}

export default function NomadLogo({ height = 28, className = "", onDark = false }: { height?: number; className?: string; onDark?: boolean }) {
  return (
    <svg viewBox="0 0 268 64" height={height} width={(height * 268) / 64} className={className} role="img" aria-label="Nomad">
      {/* On a dark ground the mark gets a hairline so its ink square still reads. */}
      <rect width="64" height="64" rx="16" fill="#111827" stroke={onDark ? "rgba(255,255,255,0.35)" : "none"} strokeWidth="2" />
      <path d="M18 46 V30 a14 14 0 0 1 28 0 V40" fill="none" stroke="#ffffff" strokeWidth="7" strokeLinecap="round" />
      <circle cx="46" cy="47.5" r="4.5" fill="#4f46e5" />
      <g transform="translate(84 18)" fill="none" stroke="currentColor" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 30 V14 a10 10 0 0 1 20 0 V30" />
        <circle cx="44" cy="18" r="12" />
        <path d="M66 30 V14 a8 8 0 0 1 16 0 V30 M82 14 a8 8 0 0 1 16 0 V30" />
        <circle cx="120" cy="18" r="12" />
        <path d="M132 6 V30" />
        <circle cx="156" cy="18" r="12" />
        <path d="M168 -8 V30" />
      </g>
      <circle cx="258" cy="45.5" r="4.5" fill="#4f46e5" />
    </svg>
  );
}
