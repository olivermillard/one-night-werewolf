"use client";

import { useEffect, useId, useRef, useState } from "react";

const PHASE_CHANGE_MS = 1100;

/**
 * Ease the moon's lit fraction toward `target` so it waxes smoothly when the
 * night moves on, rather than snapping. Instant under reduced motion.
 */
function useAnimatedLit(target: number): number {
  const [shown, setShown] = useState(target);
  const shownRef = useRef(target);
  useEffect(() => {
    const from = shownRef.current;
    if (Math.abs(from - target) < 0.001) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const commit = (value: number) => {
      shownRef.current = value;
      setShown(value);
    };
    if (reduce) {
      commit(target);
      return;
    }
    let frame = 0;
    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / PHASE_CHANGE_MS);
      // Ease in and out, like the light creeping across the face.
      const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      commit(from + (target - from) * eased);
      if (t < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [target]);
  return shown;
}

/**
 * A waxing moon in the deck's woodcut style. `lit` is the illuminated
 * fraction, 0 (new) to 1 (full); the lit side is on the right, as a waxing
 * moon looks from the north. The whole disc is a textured moon; the unlit
 * part is a soft shadow with a little earthshine left showing.
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
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const animatedLit = useAnimatedLit(lit);
  const f = Math.min(1, Math.max(0, animatedLit));
  const r = 10;
  const c = 12;
  // Terminator: an elliptical arc that is a straight line at half moon.
  const rx = Math.max(0.01, Math.abs(1 - 2 * f) * r);
  const sweep = f > 0.5 ? 1 : 0;
  // The shadow runs from well past the left limb to the terminator. It
  // overshoots the disc (which clips it) so blurring only softens the
  // terminator, never the moon's edge.
  const pad = 3;
  const shadow =
    f >= 0.999
      ? null
      : f <= 0.001
        ? `M ${-pad} ${-pad} H ${24 + pad} V ${24 + pad} H ${-pad} Z`
        : `M ${c} ${c - r} V ${-pad} H ${-pad} V ${24 + pad} H ${c} V ${c + r} A ${rx} ${r} 0 0 ${sweep} ${c} ${c - r} Z`;

  return (
    <svg viewBox="0 0 24 24" className={className} overflow="visible" aria-hidden>
      <defs>
        <radialGradient id={`${id}-surface`} cx="62%" cy="38%" r="75%">
          <stop offset="0" stopColor={dim ? "#6e624e" : "#fbf3dd"} />
          <stop offset="0.55" stopColor={dim ? "#5a4f3e" : "#e9dbb8"} />
          <stop offset="1" stopColor={dim ? "#463c2e" : "#c9b48a"} />
        </radialGradient>
        <radialGradient id={`${id}-halo`} cx="50%" cy="50%" r="50%">
          <stop offset="0.55" stopColor="#f3dfa8" stopOpacity="0.55" />
          <stop offset="1" stopColor="#f3dfa8" stopOpacity="0" />
        </radialGradient>
        <clipPath id={`${id}-disc`}>
          <circle cx={c} cy={c} r={r} />
        </clipPath>
        <filter id={`${id}-soft`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="0.55" />
        </filter>
      </defs>

      {/* Glow sits on the lit side and grows as the moon fills. */}
      {glow ? (
        <circle
          cx={c + (1 - f) * 3.5}
          cy={c}
          r={10 + 2 * f}
          fill={`url(#${id}-halo)`}
        />
      ) : null}

      <g clipPath={`url(#${id}-disc)`}>
        {/* Surface */}
        <circle cx={c} cy={c} r={r} fill={`url(#${id}-surface)`} />
        {/* Seas */}
        <g fill={dim ? "#3a3126" : "#b9a47a"} opacity={dim ? 0.4 : 0.55}>
          <path d="M13.2 6.1c1.9-.5 3.9.3 4.3 1.8.4 1.4-.8 2.3-2.3 2.6-1.4.3-2.9.9-3.6-.3-.7-1.3.2-3.7 1.6-4.1Z" />
          <path d="M8.3 9.6c1.2-.4 2.3.4 2.2 1.5-.1 1-1.1 1.4-2 1.3-.9-.1-1.5-.8-1.3-1.6.1-.6.5-1 1.1-1.2Z" />
          <path d="M14.6 12.6c1.6-.3 3.4.6 3.4 2 0 1.5-1.6 2.6-3.1 2.5-1.3-.1-2.2-1-2.1-2.2.1-1.1.7-2.1 1.8-2.3Z" />
          <path d="M9.6 15.4c.9-.2 1.8.4 1.7 1.2-.1.7-.8 1.1-1.5 1-.7-.1-1.1-.6-1-1.2.1-.5.4-.9.8-1Z" />
        </g>
        {/* Craters (left off dim moons, where they only add noise) */}
        {dim ? null : (
          <g fill="none" stroke="#a8916a" strokeWidth={0.35} opacity={0.7}>
            <circle cx="17.6" cy="11.2" r="0.9" />
            <circle cx="11.4" cy="18.6" r="0.7" />
            <circle cx="6.9" cy="13.9" r="0.6" />
            <circle cx="15.8" cy="18.1" r="0.5" />
          </g>
        )}
        {/* Shadow with earthshine: soft-edged, slightly translucent. */}
        {shadow ? (
          <path
            d={shadow}
            fill={dim ? "#0d0b09" : "#10131a"}
            opacity={dim ? 0.94 : 0.92}
            filter={`url(#${id}-soft)`}
          />
        ) : null}
      </g>

      {/* Rim */}
      <circle
        cx={c}
        cy={c}
        r={r - 0.15}
        fill="none"
        stroke={dim ? "#3a2c20" : "#d4a85a"}
        strokeOpacity={dim ? 0.8 : 0.18}
        strokeWidth={0.5}
      />
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
