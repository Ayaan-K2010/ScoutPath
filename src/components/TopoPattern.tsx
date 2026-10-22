/**
 * Original topographic contour artwork, generated deterministically.
 * Decorative only: hidden from assistive technology.
 */
interface Hill {
  cx: number;
  cy: number;
  rings: number;
  base: number;
  step: number;
  seed: number;
}

function ring(h: Hill, r: number, index: number): string {
  const points = 96;
  let d = '';
  for (let i = 0; i <= points; i++) {
    const t = (i / points) * Math.PI * 2;
    const wobble =
      1 +
      0.11 * Math.sin(3 * t + h.seed + index * 0.18) +
      0.06 * Math.sin(5 * t + h.seed * 1.7 - index * 0.11) +
      0.035 * Math.cos(7 * t + h.seed * 0.6);
    const x = h.cx + Math.cos(t) * r * wobble * 1.18;
    const y = h.cy + Math.sin(t) * r * wobble * 0.86;
    d += `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`;
  }
  return `${d}Z`;
}

function contours(hills: Hill[]): string[] {
  return hills.flatMap((h) => Array.from({ length: h.rings }, (_, i) => ring(h, h.base + i * h.step, i)));
}

const HERO = contours([
  { cx: 520, cy: 300, rings: 14, base: 18, step: 26, seed: 0.7 },
  { cx: 150, cy: 520, rings: 7, base: 14, step: 24, seed: 2.3 },
]);

const COMPACT = contours([{ cx: 400, cy: 300, rings: 12, base: 20, step: 30, seed: 1.4 }]);

export function TopoPattern({ variant = 'hero', className }: { variant?: 'hero' | 'compact'; className?: string }) {
  const paths = variant === 'hero' ? HERO : COMPACT;
  return (
    <svg className={className} viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
      <g fill="none" stroke="currentColor" strokeWidth="1.1">
        {paths.map((d, i) => (
          <path key={i} d={d} strokeOpacity={i % 5 === 4 ? 1 : 0.55} strokeWidth={i % 5 === 4 ? 1.6 : 1} />
        ))}
      </g>
    </svg>
  );
}
