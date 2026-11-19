/**
 * Contour ground: nested, closed isolines rising toward a summit (the landing).
 * `levels` sets how many rings are drawn; each ring is a smooth closed curve with
 * a stable irregular radius, so the figure reads as terrain, not as waves.
 */
export default function Contours({ className = "", levels = 9, cx = 0.78, cy = 0.35 }: { className?: string; levels?: number; cx?: number; cy?: number }) {
  const W = 1000;
  const H = 700;
  const bumps = [0.12, -0.08, 0.1, -0.05, 0.07, -0.1, 0.06, -0.04];
  const ring = (r: number, k: number) => {
    const pts = Array.from({ length: 48 }, (_, i) => {
      const a = (i / 48) * Math.PI * 2;
      let m = 1;
      bumps.forEach((b, j) => (m += b * Math.sin(a * (j + 2) + k * 0.35 + j)));
      return [cx * W + Math.cos(a) * r * 1.5 * m, cy * H + Math.sin(a) * r * m] as const;
    });
    // Catmull-Rom to cubic Bézier for a smooth closed line
    let d = `M ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
    for (let i = 0; i < pts.length; i++) {
      const p0 = pts[(i - 1 + pts.length) % pts.length];
      const p1 = pts[i];
      const p2 = pts[(i + 1) % pts.length];
      const p3 = pts[(i + 2) % pts.length];
      const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
      const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
      d += ` C ${c1[0].toFixed(1)} ${c1[1].toFixed(1)}, ${c2[0].toFixed(1)} ${c2[1].toFixed(1)}, ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
    }
    return d + " Z";
  };
  return (
    <svg className={`pointer-events-none absolute inset-0 h-full w-full ${className}`} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" aria-hidden>
      {Array.from({ length: levels }, (_, i) => {
        const r = 28 + i * 44;
        const index = i % 4 === 3;
        return <path key={i} d={ring(r, i)} fill="none" stroke="#4f46e5" strokeOpacity={index ? 0.2 : 0.09} strokeWidth={index ? 1.3 : 0.9} vectorEffect="non-scaling-stroke" />;
      })}
    </svg>
  );
}
