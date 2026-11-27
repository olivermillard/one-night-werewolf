/**
 * A waxing moon. `lit` is the illuminated fraction, 0 (new) to 1 (full);
 * the lit side is on the right, as a waxing moon looks from the north.
 */
export function Moon({
  lit,
  className = "",
  glow = false,
  dim = false,
}: {
  lit: number;
  className?: string;
  glow?: boolean;
  dim?: boolean;
}) {
  const f = Math.min(1, Math.max(0, lit));
  const r = 10;
  const c = 12;
  // Terminator: an elliptical arc whose width shrinks to zero at half moon.
  const rx = Math.abs(1 - 2 * f) * r;
  // Crescent: return along the inside (right); gibbous: bulge out to the left.
  const sweep = f > 0.5 ? 1 : 0;
  const litPath =
    f >= 0.999
      ? null
      : `M ${c} ${c - r} A ${r} ${r} 0 0 1 ${c} ${c + r} A ${rx} ${r} 0 0 ${sweep} ${c} ${c - r} Z`;
  const litColor = dim ? "#6b5d48" : "#efe3c6";
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      {glow ? <circle cx={c} cy={c} r={11.5} fill="#e0b45c" opacity={0.25} /> : null}
      <circle cx={c} cy={c} r={r} fill={dim ? "#241b14" : "#2e2419"} stroke={dim ? "#3a2c20" : "#5a4630"} strokeWidth={0.6} />
      {f >= 0.999 ? (
        <circle cx={c} cy={c} r={r} fill={litColor} />
      ) : f > 0.001 && litPath ? (
        <path d={litPath} fill={litColor} />
      ) : null}
    </svg>
  );
}

/**
 * How much of the moon is lit at a given night step: a thin crescent for the
 * first role called, waxing to full for the last.
 */
export function moonForStep(index: number, total: number): number {
  if (total <= 0) return 1;
  const progress = Math.min(1, Math.max(0, (index + 1) / total));
  return 0.12 + 0.88 * progress;
}
