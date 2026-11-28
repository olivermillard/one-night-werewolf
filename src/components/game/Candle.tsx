import { useId } from "react";

/** How far the top of the candle sinks when it has burned all the way down. */
const MAX_BURN_DROP = 54;

/**
 * A tallow candle with a flickering flame. The flicker, the snuff and the
 * smoke are CSS (see .candle-* in globals.css).
 *
 * - `burn`: how much of the candle is left, 1 (new) to 0 (a stub). The flame
 *   and the melted top sink with it.
 * - `out`: the flame goes out and a wisp of smoke rises from the wick.
 */
export function Candle({
  className = "",
  burn = 1,
  out = false,
}: {
  className?: string;
  burn?: number;
  out?: boolean;
}) {
  const id = useId();
  const glowId = `${id}-glow`;
  const waxId = `${id}-wax`;
  const flameOuterId = `${id}-flame-outer`;
  const flameCoreId = `${id}-flame-core`;
  const left = Math.min(1, Math.max(0, burn));
  const drop = (1 - left) * MAX_BURN_DROP;
  const top = 64 + drop;

  return (
    <svg
      viewBox="0 0 80 160"
      className={className}
      role="img"
      aria-label={out ? "A candle, just blown out" : "A lit candle"}
    >
      <defs>
        <radialGradient id={glowId} cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#ffd27a" stopOpacity="0.55" />
          <stop offset="0.45" stopColor="#e0963c" stopOpacity="0.18" />
          <stop offset="1" stopColor="#e0963c" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={waxId} x1="0" x2="1">
          <stop offset="0" stopColor="#bfa77c" />
          <stop offset="0.35" stopColor="#efe2c2" />
          <stop offset="0.7" stopColor="#e2d1a9" />
          <stop offset="1" stopColor="#a68e63" />
        </linearGradient>
        <radialGradient id={flameOuterId} cx="50%" cy="70%" r="60%">
          <stop offset="0" stopColor="#fff4c8" />
          <stop offset="0.5" stopColor="#ffbf4d" />
          <stop offset="1" stopColor="#e0651f" stopOpacity="0.85" />
        </radialGradient>
        <linearGradient id={flameCoreId} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#6aa6ff" stopOpacity="0.9" />
          <stop offset="0.3" stopColor="#fffbe8" />
          <stop offset="1" stopColor="#fff6d0" />
        </linearGradient>
      </defs>

      {/* Candle body with a melted top, cut down as it burns */}
      <path
        d={`M24 ${top} Q 32 ${top - 5} 40 ${top - 3} Q 48 ${top - 5} 56 ${top} L 56 148 Q 40 152 24 148 Z`}
        fill={`url(#${waxId})`}
      />

      {/* Everything that sits on top of the wax sinks with it */}
      <g transform={`translate(0 ${drop})`}>
        {/* Warm light thrown around the flame */}
        <g className={out ? "candle-light-out" : undefined}>
          <circle className="candle-glow" cx="40" cy="44" r="38" fill={`url(#${glowId})`} />
        </g>

        {/* Flame: outer, then the bright core; flickers from its base */}
        <g className={out ? "candle-snuff" : undefined}>
          <g className="candle-flame">
            <path
              d="M40 18 C 47 32, 52 42, 49 52 C 47 59, 33 59, 31 52 C 28 42, 34 31, 40 18 Z"
              fill={`url(#${flameOuterId})`}
            />
            <path
              d="M40 33 C 44 41, 46 47, 44 52 C 42.5 56, 37.5 56, 36 52 C 34 47, 36 41, 40 33 Z"
              fill={`url(#${flameCoreId})`}
            />
          </g>
        </g>

        {/* Wick, with an ember that fades once the flame is out */}
        <path d="M40 54 Q 41 58 40 62" stroke="#2a1a10" strokeWidth="2" fill="none" strokeLinecap="round" />
        {out ? <circle className="candle-ember" cx="40" cy="54.5" r="1.6" fill="#ff8a3d" /> : null}

        {/* A wisp of smoke curling up from the wick */}
        {out ? (
          <g className="candle-smoke" fill="none" stroke="#cbbfa8" strokeLinecap="round">
            <path
              className="candle-smoke-wisp"
              d="M40 54 C 36 46, 45 40, 40 32 C 35 24, 44 18, 39 8"
              strokeWidth="2.2"
              pathLength={1}
            />
            <path
              className="candle-smoke-wisp candle-smoke-wisp-late"
              d="M40 54 C 44 47, 36 41, 41 34 C 46 27, 37 21, 42 12"
              strokeWidth="1.4"
              pathLength={1}
            />
          </g>
        ) : null}

        <path
          d="M24 64 Q 32 59 40 61 Q 48 59 56 64 Q 55 70 53 70 Q 51 82 49 80 Q 48 70 45 69 Q 40 67 35 69 Q 32 71 31 86 Q 29 90 28 84 Q 27 72 24 70 Z"
          fill="#f6ecd2"
          opacity="0.9"
        />
      </g>

      {/* Iron dish */}
      <ellipse cx="40" cy="150" rx="30" ry="6" fill="#2b2018" stroke="#5a4630" strokeWidth="1" />
      <path d="M12 150 Q 40 162 68 150" stroke="#5a4630" strokeWidth="1.2" fill="none" />
    </svg>
  );
}
