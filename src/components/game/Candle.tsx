/**
 * A lit tallow candle with a flickering flame, for loading screens.
 * The flicker is CSS (see .candle-flame / .candle-glow in globals.css).
 */
export function Candle({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 80 160" className={className} role="img" aria-label="A lit candle">
      <defs>
        <radialGradient id="candle-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#ffd27a" stopOpacity="0.55" />
          <stop offset="0.45" stopColor="#e0963c" stopOpacity="0.18" />
          <stop offset="1" stopColor="#e0963c" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="candle-wax" x1="0" x2="1">
          <stop offset="0" stopColor="#bfa77c" />
          <stop offset="0.35" stopColor="#efe2c2" />
          <stop offset="0.7" stopColor="#e2d1a9" />
          <stop offset="1" stopColor="#a68e63" />
        </linearGradient>
        <radialGradient id="candle-flame-outer" cx="50%" cy="70%" r="60%">
          <stop offset="0" stopColor="#fff4c8" />
          <stop offset="0.5" stopColor="#ffbf4d" />
          <stop offset="1" stopColor="#e0651f" stopOpacity="0.85" />
        </radialGradient>
        <linearGradient id="candle-flame-core" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#6aa6ff" stopOpacity="0.9" />
          <stop offset="0.3" stopColor="#fffbe8" />
          <stop offset="1" stopColor="#fff6d0" />
        </linearGradient>
      </defs>

      {/* Warm light thrown around the flame */}
      <circle className="candle-glow" cx="40" cy="44" r="38" fill="url(#candle-glow)" />

      {/* Flame: outer, then the bright core; flickers from its base */}
      <g className="candle-flame">
        <path
          d="M40 18 C 47 32, 52 42, 49 52 C 47 59, 33 59, 31 52 C 28 42, 34 31, 40 18 Z"
          fill="url(#candle-flame-outer)"
        />
        <path
          d="M40 33 C 44 41, 46 47, 44 52 C 42.5 56, 37.5 56, 36 52 C 34 47, 36 41, 40 33 Z"
          fill="url(#candle-flame-core)"
        />
      </g>

      {/* Wick */}
      <path d="M40 54 Q 41 58 40 62" stroke="#2a1a10" strokeWidth="2" fill="none" strokeLinecap="round" />

      {/* Candle body with a melted, dripping top */}
      <path
        d="M24 64 Q 32 59 40 61 Q 48 59 56 64 L 56 148 Q 40 152 24 148 Z"
        fill="url(#candle-wax)"
      />
      <path
        d="M24 64 Q 32 59 40 61 Q 48 59 56 64 Q 55 70 53 70 Q 51 82 49 80 Q 48 70 45 69 Q 40 67 35 69 Q 32 71 31 86 Q 29 90 28 84 Q 27 72 24 70 Z"
        fill="#f6ecd2"
        opacity="0.9"
      />
      {/* Iron dish */}
      <ellipse cx="40" cy="150" rx="30" ry="6" fill="#2b2018" stroke="#5a4630" strokeWidth="1" />
      <path d="M12 150 Q 40 162 68 150" stroke="#5a4630" strokeWidth="1.2" fill="none" />
    </svg>
  );
}
