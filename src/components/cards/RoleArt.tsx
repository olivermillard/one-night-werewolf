import type { JSX } from "react";
import { assertNever, type Role } from "@/lib/game";

/*
 * Original woodcut-style night illustrations for each role card.
 * Every scene is drawn on a 200x280 portrait canvas, full bleed. The card
 * frame, border and title are drawn by the caller around this artwork.
 *
 * All SVG ids are prefixed with `uid` so several cards (including duplicates
 * of the same role) can render on one page without id collisions.
 */

// Shared deck palette
const INK = "#120d0a";
const INK2 = "#1e1611";
const INK3 = "#2b2018";
const PARCH = "#e9dcc0";
const PARCH2 = "#d8c6a0";
const PARCH3 = "#b9a57c";
const GOLD = "#c8963e";
const GOLD2 = "#e0b45c";
const BLOOD = "#8e2a1e";
const FOREST = "#2f4a32";
const WOOD = "#5a3d24";
const WOOD2 = "#7a5634";

const LABELS: Record<Role, string> = {
  werewolf: "Werewolf",
  minion: "Minion",
  mason: "Mason",
  seer: "Seer",
  robber: "Robber",
  troublemaker: "Troublemaker",
  drunk: "Drunk",
  insomniac: "Insomniac",
  villager: "Villager",
  hunter: "Hunter",
  tanner: "Tanner",
  doppelganger: "Doppelganger",
};

export function RoleArt({
  role,
  className,
  uid,
}: {
  role: Role;
  className?: string;
  uid?: string;
}): JSX.Element {
  const u = uid ?? role;
  return (
    <svg
      viewBox="0 0 200 280"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid slice"
      className={className}
      role="img"
      aria-label={`${LABELS[role]} illustration`}
    >
      <defs>
        <linearGradient id={`${u}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1b2433" />
          <stop offset="1" stopColor="#2d3a4f" />
        </linearGradient>
      </defs>
      {scene(role, u)}
    </svg>
  );
}

function scene(role: Role, u: string): JSX.Element {
  switch (role) {
    case "werewolf":
      return <Werewolf u={u} />;
    case "minion":
      return <Minion u={u} />;
    case "mason":
      return <Mason u={u} />;
    case "seer":
      return <Seer u={u} />;
    case "robber":
      return <Robber u={u} />;
    case "troublemaker":
      return <Troublemaker u={u} />;
    case "drunk":
      return <Drunk u={u} />;
    case "insomniac":
      return <Insomniac u={u} />;
    case "villager":
      return <Villager u={u} />;
    case "hunter":
      return <Hunter u={u} />;
    case "tanner":
      return <Tanner u={u} />;
    case "doppelganger":
      return <Doppelganger u={u} />;
    default:
      return assertNever(role);
  }
}

/* ------------------------------------------------------------------ */
/* Shared pieces                                                       */
/* ------------------------------------------------------------------ */

function Sky({ u }: { u: string }) {
  return <rect width="200" height="280" fill={`url(#${u}-sky)`} />;
}

/** Four-pointed woodcut star. */
function starPath(x: number, y: number, s = 3): string {
  const k = s * 0.28;
  return `M${x} ${y - s}L${x + k} ${y - k}L${x + s} ${y}L${x + k} ${y + k}L${x} ${y + s}L${x - k} ${y + k}L${x - s} ${y}L${x - k} ${y - k}Z`;
}

function Stars({ pts }: { pts: [number, number, number?][] }) {
  return (
    <path
      d={pts.map(([x, y, s]) => starPath(x, y, s ?? 3)).join("")}
      fill={PARCH2}
      opacity="0.75"
    />
  );
}

function FullMoon({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={r * 1.12} fill={PARCH} opacity="0.08" />
      <circle cx={cx} cy={cy} r={r} fill={PARCH} />
      <path
        d={`M${cx - r * 0.55} ${cy - r * 0.2}c${r * 0.12} -${r * 0.22} ${r * 0.38} -${r * 0.2} ${r * 0.42} 0s-${r * 0.2} ${r * 0.26} -${r * 0.42} 0Z`}
        fill={PARCH2}
      />
      <ellipse cx={cx + r * 0.3} cy={cy + r * 0.32} rx={r * 0.22} ry={r * 0.14} fill={PARCH2} />
      <ellipse cx={cx + r * 0.18} cy={cy - r * 0.45} rx={r * 0.1} ry={r * 0.08} fill={PARCH2} />
      <ellipse cx={cx - r * 0.35} cy={cy + r * 0.45} rx={r * 0.12} ry={r * 0.08} fill={PARCH2} />
    </g>
  );
}

/** Crescent lit on its left side; rotate to taste. */
function Crescent({
  cx,
  cy,
  r,
  rot = 0,
  fill = PARCH,
}: {
  cx: number;
  cy: number;
  r: number;
  rot?: number;
  fill?: string;
}) {
  return (
    <path
      d={`M${cx} ${cy - r}A${r} ${r} 0 1 0 ${cx} ${cy + r}A${r * 1.25} ${r * 1.25} 0 0 1 ${cx} ${cy - r}Z`}
      fill={fill}
      transform={rot ? `rotate(${rot} ${cx} ${cy})` : undefined}
    />
  );
}

/** Three-tier pine silhouette with its base centred on (x, y). */
function pinePath(x: number, y: number, h: number, w = h * 0.5): string {
  const hw = w / 2;
  return [
    `M${x} ${y - h}`,
    `L${x + hw * 0.55} ${y - h * 0.62}L${x + hw * 0.28} ${y - h * 0.62}`,
    `L${x + hw * 0.8} ${y - h * 0.3}L${x + hw * 0.45} ${y - h * 0.3}`,
    `L${x + hw} ${y - h * 0.06}L${x + hw * 0.12} ${y - h * 0.06}L${x + hw * 0.12} ${y}`,
    `L${x - hw * 0.12} ${y}L${x - hw * 0.12} ${y - h * 0.06}L${x - hw} ${y - h * 0.06}`,
    `L${x - hw * 0.45} ${y - h * 0.3}L${x - hw * 0.8} ${y - h * 0.3}`,
    `L${x - hw * 0.28} ${y - h * 0.62}L${x - hw * 0.55} ${y - h * 0.62}Z`,
  ].join("");
}

function Pines({ trees, fill }: { trees: [number, number, number][]; fill: string }) {
  return <path d={trees.map(([x, y, h]) => pinePath(x, y, h)).join("")} fill={fill} />;
}

/** A low row of village rooftops with a church spire, base at y. */
function Village({ y, fill, lit = true }: { y: number; fill: string; lit?: boolean }) {
  const d = [
    `M0 ${y}V${y - 22}L14 ${y - 34}L28 ${y - 22}V${y - 18}`,
    `H34V${y - 30}L50 ${y - 44}L58 ${y - 37}V${y - 46}H63V${y - 32}L66 ${y - 30}V${y - 16}`,
    `H72V${y - 40}H75L79 ${y - 70}L83 ${y - 40}H86V${y - 20}`,
    `H92L106 ${y - 34}L120 ${y - 20}H124V${y - 26}L140 ${y - 40}L156 ${y - 26}V${y - 14}`,
    `H162V${y - 24}L176 ${y - 36}L186 ${y - 28}V${y - 36}H191V${y - 24}L200 ${y - 18}V${y}Z`,
  ].join("");
  return (
    <g>
      <path d={d} fill={fill} />
      {lit && (
        <path
          d={`M12 ${y - 16}h4v5h-4zM47 ${y - 24}h4v6h-4zM104 ${y - 16}h4v5h-4zM137 ${y - 22}h4v6h-4zM173 ${y - 18}h4v5h-4z`}
          fill={GOLD}
        />
      )}
    </g>
  );
}

/* ------------------------------------------------------------------ */
/* Werewolf: wolf howling against a huge full moon                     */
/* ------------------------------------------------------------------ */

function Werewolf({ u }: { u: string }) {
  return (
    <g>
      <Sky u={u} />
      <Stars pts={[[22, 26], [180, 22, 2.5], [172, 168, 2], [24, 176, 2.5], [40, 52, 2]]} />
      <FullMoon cx={108} cy={98} r={62} />
      <path
        d="M120 138C140 132 162 134 188 130C170 138 150 142 124 142ZM20 112C40 106 56 108 74 104C60 112 44 114 20 112Z"
        fill={INK3}
        opacity="0.6"
      />
      <path d="M0 214C38 198 70 208 102 203C140 196 170 208 200 198V280H0Z" fill={INK3} />
      <Pines
        trees={[
          [14, 214, 46],
          [180, 204, 52],
          [194, 206, 36],
          [162, 210, 34],
          [6, 220, 30],
        ]}
        fill={INK2}
      />
      {/* wolf */}
      <path
        d="M34 280C34 246 44 210 58 182L48 176L62 170L56 160L68 156C66 140 68 126 74 116L70 80L90 102L100 78L106 100C114 96 120 92 126 86L148 64C152 60 159 62 156 69L130 102L150 88C152 92 150 96 146 98L132 114C130 126 128 138 132 150L142 156L134 162L144 172L136 176C146 204 156 240 164 280Z"
        fill={INK}
      />
      {/* fangs */}
      <path d="M146 79l-1 6 5-4zM139 88l-1 6 5-4zM146 91l-4-2 1 5z" fill={PARCH} />
      {/* ear inner */}
      <path d="M99 86l-4 13 7-2z" fill={INK3} />
      {/* eye */}
      <path d="M106 106C110 101 116 100 120 101C117 106 111 108 106 106Z" fill="#b42318" />
      <path d="M112.5 102l1 4.5" stroke={INK} strokeWidth="1.4" />
      <path d="M0 262C40 252 70 258 100 254S170 252 200 258V280H0Z" fill={INK2} />
    </g>
  );
}

/* ------------------------------------------------------------------ */
/* Minion: kneeling hooded servant, lantern, wolf shadow on the wall   */
/* ------------------------------------------------------------------ */

function Minion({ u }: { u: string }) {
  return (
    <g>
      <defs>
        <radialGradient id={`${u}-glow`} cx="0.66" cy="0.7" r="0.6">
          <stop offset="0" stopColor={GOLD2} stopOpacity="0.5" />
          <stop offset="0.5" stopColor={GOLD} stopOpacity="0.15" />
          <stop offset="1" stopColor={GOLD} stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="200" height="280" fill={INK3} />
      {/* masonry */}
      <path
        d="M0 30H200M0 60H200M0 90H200M0 120H200M0 150H200M0 180H200M0 210H200M0 240H200M30 0V30M90 0V30M150 0V30M60 30V60M120 30V60M180 30V60M30 60V90M150 60V90M60 90V120M120 90V120M180 90V120M30 120V150M90 120V150M150 120V150M60 150V180M120 150V180M180 150V180M30 180V210M90 180V210M150 180V210M60 210V240M120 210V240M180 210V240"
        stroke={INK2}
        strokeWidth="2"
      />
      {/* arched window */}
      <path d="M70 98V52A30 30 0 0 1 130 52V98Z" fill={`url(#${u}-sky)`} />
      <Crescent cx={112} cy={50} r={12} rot={-20} />
      <path d="M100 22V98M70 62H130" stroke={INK2} strokeWidth="3" />
      <path d="M70 98V52A30 30 0 0 1 130 52V98Z" fill="none" stroke={PARCH3} strokeWidth="5" />
      <rect x="64" y="96" width="72" height="7" fill={PARCH3} />
      <rect width="200" height="280" fill={`url(#${u}-glow)`} />
      {/* wolf shadow */}
      <path
        d="M10 250C14 214 22 186 36 166L30 118L54 142L66 108L76 146C94 148 112 156 128 168L160 172C164 180 158 190 148 192L124 196C114 206 102 212 90 218C94 232 98 244 102 250Z"
        fill={INK}
        opacity="0.82"
      />
      <path d="M58 158l14 -4-4 8z" fill={BLOOD} opacity="0.9" />
      {/* floor */}
      <rect y="242" width="200" height="38" fill={INK2} />
      <path d="M0 242H200" stroke={INK} strokeWidth="3" />
      {/* kneeling figure */}
      <path
        d="M54 246C50 222 52 194 60 172C64 156 70 146 80 142C94 138 104 150 106 164C108 176 110 186 114 194C120 206 130 220 136 236L138 246Z"
        fill="#5b3a7a"
      />
      <path
        d="M106 164C108 176 110 186 114 194C120 206 130 220 136 236L138 246H118C116 228 110 210 100 196C104 186 106 176 106 164Z"
        fill="#7a5a9a"
      />
      <path d="M70 180C68 204 70 226 74 246M86 196C88 214 92 230 96 246" stroke="#3f2856" strokeWidth="2.5" fill="none" />
      {/* hood opening */}
      <path d="M88 150C96 148 102 156 102 166C102 174 96 178 90 176C86 168 84 158 88 150Z" fill={INK} />
      <path d="M94 162l3 0M98 164l2 0" stroke={GOLD2} strokeWidth="1.6" strokeLinecap="round" />
      {/* arm */}
      <path d="M96 182C104 188 114 192 126 190L127 196C114 200 102 198 92 192Z" fill="#3f2856" />
      <circle cx="128" cy="192" r="4" fill={PARCH3} />
      {/* lantern */}
      <path d="M128 192V200" stroke={GOLD} strokeWidth="2" />
      <path d="M121 200H135L132 205H124Z" fill={GOLD} />
      <rect x="123" y="205" width="10" height="14" fill={GOLD2} />
      <path d="M128 205V219M123 212H133" stroke={INK2} strokeWidth="1.2" />
      <path d="M121 219H135L133 223H123Z" fill={GOLD} />
    </g>
  );
}

/* ------------------------------------------------------------------ */
/* Mason: crossed hammers before a stone arch                          */
/* ------------------------------------------------------------------ */

function Hammer({ rot }: { rot: number }) {
  return (
    <g transform={`rotate(${rot} 100 200)`}>
      <rect x="96" y="150" width="8" height="98" rx="3" fill={WOOD2} />
      <path d="M100 150V248" stroke={WOOD} strokeWidth="2" />
      <path d="M76 140H118L128 146L118 156H76Z" fill="#c9a227" />
      <path d="M76 150H118L128 146L118 156H76Z" fill="#9a7a1c" />
      <rect x="95" y="138" width="10" height="20" fill="#9a7a1c" />
    </g>
  );
}

function Mason({ u }: { u: string }) {
  return (
    <g>
      <Sky u={u} />
      <Stars pts={[[24, 30], [176, 70, 2.5], [30, 90, 2], [150, 20, 2]]} />
      <Crescent cx={160} cy={40} r={16} rot={-25} />
      {/* castle on the horizon */}
      <path
        d="M0 214V196H10V188H16V196H22V172H26V166H30V172H34V160H38V172H42V196H160V176H164V170H168V176H172V156H176V150H180V156H184V176H190V196H200V214Z"
        fill={INK2}
      />
      <path d="M100 214V150L104 136L108 150V214Z" fill={INK2} />
      {/* stone arch */}
      <path
        d="M36 252V140A64 64 0 0 1 164 140V252ZM62 252V146A38 38 0 0 0 138 146V252Z"
        fill={PARCH3}
        fillRule="evenodd"
      />
      <path
        d="M133 127L155 108M119 113L132 85M81 113L68 85M67 127L45 108M36 170H62M36 196H62M36 222H62M138 170H164M138 196H164M138 222H164M49 170V196M49 222V252M151 170V196M151 222V252M36 140H62M138 140H164"
        stroke="#7d6b4b"
        strokeWidth="2"
      />
      <path d="M93 109L107 109L111 77L89 77Z" fill={PARCH2} stroke="#7d6b4b" strokeWidth="2" />
      <path d="M100 84L105 98H95Z" fill="none" stroke={GOLD} strokeWidth="1.8" />
      <path d="M36 252V140A64 64 0 0 1 164 140V252" fill="none" stroke={INK3} strokeWidth="2" />
      {/* ground */}
      <rect y="248" width="200" height="32" fill={INK2} />
      <path d="M0 250H200M20 262h22M60 266h26M110 262h24M150 268h28" stroke={INK} strokeWidth="2" />
      <Hammer rot={-38} />
      <Hammer rot={38} />
      <circle cx="100" cy="200" r="6" fill={INK3} stroke="#c9a227" strokeWidth="2" />
    </g>
  );
}

/* ------------------------------------------------------------------ */
/* Seer: robed figure with a crystal orb, an eye in the sky            */
/* ------------------------------------------------------------------ */

function Seer({ u }: { u: string }) {
  return (
    <g>
      <defs>
        <radialGradient id={`${u}-orb`} cx="0.42" cy="0.38" r="0.62">
          <stop offset="0" stopColor={PARCH} />
          <stop offset="0.45" stopColor="#8fa6c4" />
          <stop offset="1" stopColor="#3d5f8f" />
        </radialGradient>
      </defs>
      <Sky u={u} />
      <Stars pts={[[20, 110, 2.5], [182, 108, 2.5], [16, 20, 2], [186, 24, 2]]} />
      {/* sky eye */}
      <path
        d="M100 14V24M70 22l5 8M130 22l-5 8M46 36l8 6M154 36l-8 6M28 56l10 2M172 56l-10 2"
        stroke={PARCH3}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path d="M36 64Q100 18 164 64Q100 110 36 64Z" fill={INK2} stroke={PARCH2} strokeWidth="3" />
      <circle cx="100" cy="64" r="21" fill={PARCH} />
      <circle cx="100" cy="64" r="9" fill="#3d5f8f" />
      <circle cx="100" cy="64" r="4" fill={INK} />
      <circle cx="94" cy="58" r="3" fill={PARCH} />
      {/* hills */}
      <path d="M0 196C30 184 60 190 84 184C120 176 160 188 200 178V280H0Z" fill={INK3} />
      <Pines trees={[[16, 194, 38], [186, 182, 42], [172, 186, 28]]} fill={INK2} />
      {/* robe */}
      <path
        d="M100 116C82 116 72 132 70 150C56 168 42 204 34 280H166C158 204 144 168 130 150C128 132 118 116 100 116Z"
        fill="#3d5f8f"
      />
      <path
        d="M70 150C58 170 48 210 44 280H60C62 230 70 190 82 164ZM130 150C142 170 152 210 156 280H140C138 230 130 190 118 164Z"
        fill="#2a4466"
      />
      <path d="M100 116C90 116 82 124 80 136" fill="none" stroke="#6f8bb3" strokeWidth="2.5" />
      {/* hood opening */}
      <path d="M100 128C88 128 83 140 85 154C89 166 111 166 115 154C117 140 112 128 100 128Z" fill={INK} />
      <path d="M90 156C94 162 106 162 110 156C106 158 94 158 90 156Z" fill={GOLD2} opacity="0.7" />
      <path d="M94 146h4M102 146h4" stroke={PARCH2} strokeWidth="1.6" strokeLinecap="round" />
      {/* sleeves */}
      <path d="M74 168C70 188 74 206 86 214L94 204C86 196 84 184 86 172Z" fill="#2a4466" />
      <path d="M126 168C130 188 126 206 114 214L106 204C114 196 116 184 114 172Z" fill="#2a4466" />
      {/* orb */}
      <circle cx="100" cy="192" r="27" fill={PARCH} opacity="0.1" />
      <circle cx="100" cy="192" r="20" fill={`url(#${u}-orb)`} />
      <path d="M88 186C90 180 95 176 101 175" stroke={PARCH} strokeWidth="2" fill="none" strokeLinecap="round" />
      {/* hands */}
      <path d="M84 206C90 214 110 214 116 206L114 212C108 218 92 218 86 212Z" fill={PARCH2} />
    </g>
  );
}

/* ------------------------------------------------------------------ */
/* Robber: masked thief tiptoeing over rooftops with a sack            */
/* ------------------------------------------------------------------ */

function Robber({ u }: { u: string }) {
  return (
    <g>
      <Sky u={u} />
      <Stars pts={[[24, 34], [178, 30, 2.5], [170, 72, 2], [30, 80, 2]]} />
      <FullMoon cx={104} cy={120} r={54} />
      <Village y={214} fill={INK2} />
      {/* foreground roof */}
      <path d="M0 196L200 176V280H0Z" fill={INK3} />
      <path
        d="M0 214L200 196M0 234L200 218M0 254L200 240M0 274L200 262M30 193V214M70 189V209M110 185V206M150 181V202M190 177V198M50 211V232M90 207V228M130 203V224M170 199V220M30 230V252M70 226V248M110 222V244M150 218V240"
        stroke={INK2}
        strokeWidth="2"
      />
      <path d="M0 196L200 176" stroke={INK} strokeWidth="4" />
      {/* chimney */}
      <path d="M156 182V146H176V180Z" fill={INK2} />
      <rect x="152" y="140" width="28" height="8" fill={INK} />
      {/* thief */}
      <path d="M98 128C84 132 68 144 56 166C68 164 80 158 92 152Z" fill="#2f5e3c" />
      <path
        d="M70 190L80 174L92 156M114 186L104 170L92 156"
        stroke={INK}
        strokeWidth="8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path d="M100 128L90 158" stroke={INK} strokeWidth="15" strokeLinecap="round" />
      <path
        d="M98 136L112 148L122 142M96 132L84 124L80 110"
        stroke={INK}
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* sack */}
      <path d="M80 104C64 94 54 100 54 114C54 128 66 134 78 128C86 124 88 112 80 104Z" fill={WOOD2} stroke={INK} strokeWidth="2" />
      <path d="M80 104L86 96M80 104L88 104" stroke={INK} strokeWidth="2.5" strokeLinecap="round" />
      <path d="M60 110h8v8h-8z" fill={WOOD} />
      <circle cx="74" cy="122" r="3" fill={GOLD2} />
      {/* head: hood + mask */}
      <circle cx="104" cy="116" r="11" fill={PARCH3} />
      <path d="M93 116C92 104 102 98 112 102C108 106 104 108 96 110L98 126C94 124 93 120 93 116Z" fill="#2f5e3c" />
      <path d="M96 111H116V118H96Z" fill={INK} />
      <path d="M106 113.5h3M111 113.5h3" stroke={PARCH} strokeWidth="1.6" strokeLinecap="round" />
      <path d="M96 114l-8 4M96 115l-7 8" stroke={INK} strokeWidth="2" strokeLinecap="round" />
    </g>
  );
}

/* ------------------------------------------------------------------ */
/* Troublemaker: jester juggling and swapping two cards                */
/* ------------------------------------------------------------------ */

function Troublemaker({ u }: { u: string }) {
  const orange = "#b5541f";
  const dark = "#6e2f10";
  return (
    <g>
      <Sky u={u} />
      <Stars pts={[[180, 140, 2.5], [18, 150, 2.5], [176, 22, 2]]} />
      <Crescent cx={34} cy={34} r={14} rot={-20} />
      <Village y={238} fill={INK2} />
      <rect y="236" width="200" height="44" fill={INK3} />
      <path d="M0 238H200" stroke={INK} strokeWidth="2" />
      {/* swap arrows */}
      <path d="M56 58Q100 14 144 58" stroke={GOLD2} strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M138 48L146 60L132 60Z" fill={GOLD2} />
      <path d="M144 68Q100 40 56 68" stroke={GOLD} strokeWidth="3" fill="none" strokeLinecap="round" strokeDasharray="6 5" />
      <path d="M62 60L54 70L68 72Z" fill={GOLD} />
      {/* cards */}
      <g transform="rotate(-16 50 92)">
        <rect x="38" y="74" width="24" height="34" rx="2" fill={PARCH} stroke={INK3} strokeWidth="2" />
        <path d="M50 82L56 91L50 100L44 91Z" fill={BLOOD} />
      </g>
      <g transform="rotate(16 150 92)">
        <rect x="138" y="74" width="24" height="34" rx="2" fill={PARCH} stroke={INK3} strokeWidth="2" />
        <path d="M150 82L156 91L150 100L144 91Z" fill={FOREST} />
      </g>
      {/* arms */}
      <path d="M82 160C72 146 64 128 56 110" stroke={orange} strokeWidth="9" strokeLinecap="round" fill="none" />
      <path d="M118 160C128 146 136 128 144 110" stroke={dark} strokeWidth="9" strokeLinecap="round" fill="none" />
      <circle cx="55" cy="108" r="5" fill={PARCH2} />
      <circle cx="145" cy="108" r="5" fill={PARCH2} />
      {/* legs */}
      <path d="M90 214L86 240" stroke={dark} strokeWidth="11" strokeLinecap="round" />
      <path d="M110 214L114 240" stroke={orange} strokeWidth="11" strokeLinecap="round" />
      <path d="M90 236C82 238 72 240 66 232C72 246 86 246 92 244Z" fill={INK} />
      <path d="M110 236C118 238 128 240 134 232C128 246 114 246 108 244Z" fill={INK} />
      {/* tunic, harlequin halves */}
      <path d="M100 148H80C76 170 74 196 76 218H100Z" fill={orange} />
      <path d="M100 148H120C124 170 126 196 124 218H100Z" fill={dark} />
      <path d="M100 160L106 172L100 184L94 172ZM100 188L106 200L100 212L94 200Z" fill={GOLD2} />
      <path d="M76 218L82 226L88 218L94 226L100 218L106 226L112 218L118 226L124 218Z" fill={GOLD} />
      {/* ruff */}
      <path d="M76 146L82 156L88 148L94 158L100 148L106 158L112 148L118 156L124 146L116 140H84Z" fill={PARCH2} />
      {/* face */}
      <circle cx="100" cy="128" r="15" fill={PARCH2} />
      <path d="M91 126Q94 122 97 126M103 126Q106 122 109 126" stroke={INK} strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M90 132Q100 144 110 132Q100 138 90 132Z" fill={INK} />
      <circle cx="89" cy="134" r="2.5" fill={BLOOD} opacity="0.7" />
      <circle cx="111" cy="134" r="2.5" fill={BLOOD} opacity="0.7" />
      {/* hat with two points and bells */}
      <path d="M85 122C82 108 76 98 64 92C76 92 88 100 96 114Z" fill={orange} />
      <path d="M115 122C118 108 124 98 136 92C124 92 112 100 104 114Z" fill={dark} />
      <path d="M85 122C88 110 94 106 100 106C106 106 112 110 115 122C106 116 94 116 85 122Z" fill={orange} />
      <path d="M100 106C106 106 112 110 115 122C110 119 105 118 100 118Z" fill={dark} />
      <path d="M85 121C94 115 106 115 115 121" stroke={GOLD} strokeWidth="3" fill="none" />
      <circle cx="63" cy="92" r="4" fill={GOLD2} />
      <circle cx="137" cy="92" r="4" fill={GOLD2} />
    </g>
  );
}

/* ------------------------------------------------------------------ */
/* Drunk: villager slumped against a barrel with a tankard             */
/* ------------------------------------------------------------------ */

function Drunk({ u }: { u: string }) {
  const tunic = "#b07a12";
  return (
    <g>
      <Sky u={u} />
      <Stars pts={[[24, 28], [90, 20, 2], [60, 64, 2.5], [182, 92, 2]]} />
      <Crescent cx={148} cy={48} r={20} rot={40} />
      <Village y={194} fill={INK2} />
      {/* cobbles */}
      <rect y="192" width="200" height="88" fill={INK3} />
      <path
        d="M0 194H200M10 208h18M44 212h22M86 206h18M150 210h24M20 228h24M64 232h20M104 226h22M150 236h22M6 252h22M48 256h24M96 250h20M136 258h28M176 248h20M30 272h26M84 274h22M130 276h24"
        stroke={INK2}
        strokeWidth="3"
        strokeLinecap="round"
      />
      {/* barrel */}
      <path d="M118 150C112 176 112 214 118 240H178C184 214 184 176 178 150Z" fill={WOOD2} />
      <path d="M134 150C130 180 130 212 134 240M150 150V240M166 150C170 180 170 212 166 240" stroke={WOOD} strokeWidth="2.5" />
      <path d="M115 168H181M114 222H182" stroke={INK2} strokeWidth="5" />
      <ellipse cx="148" cy="150" rx="30" ry="7" fill={WOOD} />
      <ellipse cx="148" cy="150" rx="24" ry="4.5" fill="#4a3120" />
      <circle cx="132" cy="196" r="3" fill={INK2} />
      {/* legs */}
      <path d="M100 222L70 232L46 244" stroke="#3a2a1c" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M104 226L88 242L66 254" stroke="#3a2a1c" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M40 236C32 238 30 250 36 252L48 250Z" fill={INK} />
      <path d="M60 246C52 250 52 262 58 262L70 258Z" fill={INK} />
      {/* body slumped against barrel */}
      <path d="M104 160C92 166 86 186 88 210C90 224 100 230 116 228C120 210 120 182 116 164Z" fill={tunic} />
      <path d="M88 208C92 222 102 228 116 228V218C104 220 94 216 88 208Z" fill="#7d560c" />
      <path d="M90 214H116" stroke={WOOD} strokeWidth="4" />
      {/* arm draped on barrel */}
      <path d="M112 172C122 166 132 160 140 156" stroke={tunic} strokeWidth="8" strokeLinecap="round" fill="none" />
      <circle cx="142" cy="155" r="4.5" fill={PARCH3} />
      {/* arm with tankard */}
      <path d="M94 180C84 190 76 198 70 204" stroke="#7d560c" strokeWidth="8" strokeLinecap="round" fill="none" />
      <g transform="rotate(-62 64 206)">
        <rect x="56" y="196" width="16" height="20" rx="2" fill="#8d8a80" />
        <path d="M72 200C80 200 80 212 72 212" stroke="#8d8a80" strokeWidth="3" fill="none" />
        <path d="M56 200H72M56 212H72" stroke="#5f5c55" strokeWidth="2" />
        <path d="M55 196C56 190 72 190 73 196Z" fill={PARCH} />
      </g>
      <path d="M50 214C46 222 44 230 46 236M44 224C40 230 40 236 42 240" stroke={PARCH2} strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <circle cx="40" cy="244" r="2" fill={PARCH2} />
      <circle cx="68" cy="204" r="4.5" fill={PARCH3} />
      {/* head lolling to the side */}
      <circle cx="98" cy="150" r="13" fill={PARCH3} />
      <path d="M90 148q3 3 6 0M100 146q3 3 6 0" stroke={INK} strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <circle cx="96" cy="154" r="3.5" fill={BLOOD} />
      <path d="M92 160q5 3 10 0" stroke={INK} strokeWidth="1.8" fill="none" strokeLinecap="round" />
      {/* floppy cap */}
      <path d="M85 146C84 132 96 126 108 132C116 136 120 146 126 158C118 156 112 150 108 144C102 140 92 140 85 146Z" fill={tunic} />
      <circle cx="126" cy="159" r="4" fill={PARCH2} />
      {/* bubbles */}
      <circle cx="80" cy="126" r="3" fill="none" stroke={PARCH3} strokeWidth="1.5" />
      <circle cx="72" cy="114" r="4.5" fill="none" stroke={PARCH3} strokeWidth="1.5" />
      <circle cx="62" cy="98" r="6" fill="none" stroke={PARCH3} strokeWidth="1.5" />
    </g>
  );
}

/* ------------------------------------------------------------------ */
/* Insomniac: wide-eyed sleeper at a candlelit window                  */
/* ------------------------------------------------------------------ */

function Insomniac({ u }: { u: string }) {
  const indigo = "#4b4f8f";
  return (
    <g>
      <defs>
        <radialGradient id={`${u}-room`} cx="0.62" cy="0.75" r="0.8">
          <stop offset="0" stopColor={GOLD2} />
          <stop offset="0.45" stopColor="#8a5a26" />
          <stop offset="1" stopColor={INK3} />
        </radialGradient>
      </defs>
      <Sky u={u} />
      <Stars pts={[[24, 22], [70, 40, 2], [120, 18, 2.5]]} />
      <Crescent cx={164} cy={34} r={15} rot={-30} />
      {/* wall and eave */}
      <rect y="68" width="200" height="212" fill={INK3} />
      <path d="M0 68L200 58V78L0 88Z" fill={INK} />
      <path
        d="M0 92H200M20 92V280M180 92V280M20 240L56 214M180 240L144 214M0 240H200"
        stroke={INK2}
        strokeWidth="6"
      />
      {/* shutters */}
      <path d="M30 104L52 110V214L30 220Z" fill={INK2} />
      <path d="M170 104L148 110V214L170 220Z" fill={INK2} />
      <path d="M37 108V216M44 110V215M163 108V216M156 110V215" stroke={INK} strokeWidth="1.5" />
      {/* window interior */}
      <path d="M56 214V140A44 36 0 0 1 144 140V214Z" fill={`url(#${u}-room)`} />
      {/* figure */}
      <path d="M62 214C64 194 76 184 100 182C124 184 136 194 138 214Z" fill={indigo} />
      <circle cx="100" cy="160" r="20" fill={PARCH3} />
      <path d="M80 156C80 136 92 126 108 128C122 130 132 140 138 156C130 152 126 150 120 150C110 142 92 142 80 156Z" fill={indigo} />
      <circle cx="139" cy="157" r="4.5" fill={PARCH} />
      <path d="M80 156C92 146 108 146 120 150" stroke={PARCH2} strokeWidth="3" fill="none" />
      {/* wide eyes with dark rings */}
      <circle cx="92" cy="162" r="6.5" fill={PARCH} />
      <circle cx="108" cy="162" r="6.5" fill={PARCH} />
      <circle cx="92" cy="162" r="2.6" fill={INK} />
      <circle cx="108" cy="162" r="2.6" fill={INK} />
      <path d="M85 170Q92 174 99 170M101 170Q108 174 115 170" stroke={indigo} strokeWidth="2" fill="none" />
      <path d="M96 176q4 -2 8 0" stroke={INK} strokeWidth="1.8" fill="none" strokeLinecap="round" />
      {/* frame */}
      <path d="M56 214V140A44 36 0 0 1 144 140V214" fill="none" stroke={PARCH3} strokeWidth="6" />
      <path d="M100 104V128M60 128H140" stroke={PARCH3} strokeWidth="3" />
      <rect x="48" y="212" width="104" height="9" fill={PARCH3} />
      <path d="M48 221H152" stroke="#7d6b4b" strokeWidth="2" />
      {/* candle burned low */}
      <ellipse cx="130" cy="211" rx="10" ry="3" fill={GOLD} />
      <path d="M125 210V200C125 198 135 198 135 200V210Z" fill={PARCH} />
      <path d="M125 202C123 204 124 208 125 210M135 201C137 204 136 207 135 208" stroke={PARCH2} strokeWidth="2" fill="none" />
      <path d="M130 198V195" stroke={INK} strokeWidth="1.2" />
      <path d="M130 184C134 189 134 194 130 196C126 194 126 189 130 184Z" fill={GOLD2} />
      <path d="M130 190C131.5 192 131.5 194 130 195C128.5 194 128.5 192 130 190Z" fill={PARCH} />
    </g>
  );
}

/* ------------------------------------------------------------------ */
/* Villager: thatched cottage, lit window, pitchfork on the fence      */
/* ------------------------------------------------------------------ */

function Villager({ u }: { u: string }) {
  return (
    <g>
      <Sky u={u} />
      <Stars pts={[[160, 26], [120, 50, 2], [182, 70, 2.5], [76, 24, 2]]} />
      <Crescent cx={40} cy={42} r={17} rot={-25} />
      <Pines
        trees={[
          [12, 196, 50],
          [32, 198, 36],
          [168, 196, 56],
          [190, 198, 42],
          [148, 198, 32],
        ]}
        fill={INK2}
      />
      <path d="M0 194C50 186 150 188 200 192V280H0Z" fill={FOREST} />
      <path d="M0 236C60 230 140 232 200 238V280H0Z" fill="#243a27" />
      {/* smoke */}
      <path d="M128 92C122 82 132 74 126 64C122 56 130 48 128 40" stroke={PARCH2} strokeWidth="4" fill="none" opacity="0.45" strokeLinecap="round" />
      {/* chimney */}
      <rect x="120" y="92" width="14" height="32" fill={INK3} />
      {/* walls */}
      <rect x="56" y="148" width="88" height="72" fill={PARCH3} />
      <path d="M56 148V220M144 148V220M56 184H144M80 148V220M122 148V184M56 148L80 184M144 148L122 184" stroke={INK3} strokeWidth="4" />
      {/* thatch */}
      <path d="M40 156C58 124 80 100 100 90C120 100 142 124 160 156C140 162 60 162 40 156Z" fill="#9c7a45" />
      <path
        d="M52 150C66 130 82 114 98 104M70 154C82 134 92 118 100 104M90 156C94 136 98 120 102 106M110 156C108 136 106 120 104 106M130 154C118 134 110 118 104 104M148 150C134 130 120 114 104 104"
        stroke="#6b5230"
        strokeWidth="2"
        fill="none"
      />
      <path d="M40 156C60 162 140 162 160 156" stroke="#6b5230" strokeWidth="3" fill="none" />
      {/* door + window */}
      <path d="M90 220V198A10 10 0 0 1 110 198V220Z" fill={INK3} />
      <circle cx="106" cy="208" r="1.6" fill={GOLD} />
      <rect x="62" y="190" width="14" height="18" fill={GOLD2} />
      <path d="M69 190V208M62 199H76" stroke={INK3} strokeWidth="2" />
      <rect x="125" y="190" width="14" height="18" fill={GOLD} />
      <path d="M132 190V208M125 199H139" stroke={INK3} strokeWidth="2" />
      {/* fence */}
      <path d="M8 226V256M34 228V258M60 230V258M140 230V258M166 228V258M192 226V256" stroke={WOOD} strokeWidth="5" strokeLinecap="round" />
      <path d="M4 236L64 238M136 238L196 236M4 248L64 250M136 250L196 248" stroke={WOOD2} strokeWidth="4" strokeLinecap="round" />
      {/* pitchfork leaning on the fence */}
      <path d="M44 262L22 160" stroke={WOOD2} strokeWidth="3.5" strokeLinecap="round" />
      <path d="M23 164L10 166L4 140M23 164L16 136M23 164L28 138" stroke={PARCH2} strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 166L32 162" stroke={PARCH2} strokeWidth="3" strokeLinecap="round" />
    </g>
  );
}

/* ------------------------------------------------------------------ */
/* Hunter: archer on a ridge, bow drawn, a rising moon behind          */
/* ------------------------------------------------------------------ */

function Hunter({ u }: { u: string }) {
  const cloak = "#7a3a12";
  return (
    <g>
      <Sky u={u} />
      <Stars pts={[[20, 24], [180, 30, 2.5], [150, 70, 2], [40, 70, 2]]} />
      <FullMoon cx={110} cy={178} r={68} />
      {/* distant mountains */}
      <path d="M0 214L30 186L48 200L78 170L102 196L130 176L160 200L184 184L200 196V230H0Z" fill={INK3} />
      <Pines trees={[[150, 216, 30], [166, 218, 38], [182, 214, 28], [196, 218, 34]]} fill={INK2} />
      {/* ridge */}
      <path d="M0 226L40 214L70 222L110 214L140 230L200 238V280H0Z" fill={INK2} />
      <path d="M40 214L52 234M110 214L118 236M10 246l24 -6M140 250l30 4" stroke={INK} strokeWidth="2.5" />
      {/* archer, drawing up and to the right */}
      <g transform="rotate(-14 90 180)">
        {/* cloak */}
        <path d="M86 136C74 150 62 176 58 204C70 196 80 184 88 170Z" fill={cloak} />
        {/* quiver */}
        <path d="M76 138L66 172L74 174L84 140Z" fill={WOOD} />
        <path d="M78 136l-4 -10M82 138l-1 -12M74 134l-8 -8" stroke={PARCH2} strokeWidth="2" strokeLinecap="round" />
        {/* legs */}
        <path d="M88 176L74 198L66 220M88 176L104 196L112 216" stroke={INK} strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        {/* torso */}
        <path d="M92 136L88 176" stroke={INK} strokeWidth="16" strokeLinecap="round" />
        {/* draw arm */}
        <path d="M90 140L106 142L100 128" stroke={INK} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        {/* bow arm */}
        <path d="M94 138L134 128" stroke={INK} strokeWidth="6" strokeLinecap="round" />
        {/* bow */}
        <path d="M124 82C142 100 146 150 128 176" stroke={WOOD2} strokeWidth="4" fill="none" strokeLinecap="round" />
        <path d="M124 82L100 128L128 176" stroke={PARCH2} strokeWidth="1.2" fill="none" />
        {/* arrow */}
        <path d="M100 128L166 118" stroke={PARCH2} strokeWidth="2" />
        <path d="M166 112L178 116L167 124Z" fill={PARCH} />
        <path d="M100 128l-8 -4M100 128l-7 4" stroke={BLOOD} strokeWidth="2.5" strokeLinecap="round" />
        {/* head + hood */}
        <circle cx="98" cy="122" r="9" fill={INK} />
        <path d="M90 118C88 108 96 104 104 108L92 128C86 126 82 124 78 126C84 122 88 120 90 118Z" fill={cloak} />
      </g>
    </g>
  );
}

/* ------------------------------------------------------------------ */
/* Tanner: gloomy worker in a leather apron beside hanging hides       */
/* ------------------------------------------------------------------ */

function hidePath(x: number, y: number, w: number, h: number): string {
  // a stretched pelt with four leg lobes, top edge at y, centred on x
  const hw = w / 2;
  return [
    `M${x - hw * 0.6} ${y}`,
    `L${x + hw * 0.6} ${y}`,
    `L${x + hw} ${y - h * 0.04}L${x + hw * 0.8} ${y + h * 0.2}`,
    `C${x + hw * 0.7} ${y + h * 0.4} ${x + hw * 0.7} ${y + h * 0.6} ${x + hw * 0.82} ${y + h * 0.78}`,
    `L${x + hw * 0.9} ${y + h}L${x + hw * 0.5} ${y + h * 0.88}L${x + hw * 0.1} ${y + h * 0.96}`,
    `L${x - hw * 0.1} ${y + h * 0.96}L${x - hw * 0.5} ${y + h * 0.88}L${x - hw * 0.9} ${y + h}`,
    `L${x - hw * 0.82} ${y + h * 0.78}`,
    `C${x - hw * 0.7} ${y + h * 0.6} ${x - hw * 0.7} ${y + h * 0.4} ${x - hw * 0.8} ${y + h * 0.2}`,
    `L${x - hw} ${y - h * 0.04}Z`,
  ].join("");
}

function Tanner({ u }: { u: string }) {
  const tunic = "#a8a29e";
  return (
    <g>
      <Sky u={u} />
      <Crescent cx={46} cy={40} r={15} rot={-20} fill={PARCH2} />
      {/* heavy clouds */}
      <path d="M0 52C20 40 40 50 56 44C76 36 96 48 120 40C148 32 172 46 200 38V62C170 70 140 58 110 66C80 72 50 60 20 68L0 70Z" fill="#3a4659" />
      <path d="M0 92C30 82 60 94 90 86C130 76 160 92 200 84V100C160 106 120 96 80 104C50 108 24 100 0 106Z" fill="#33405a" opacity="0.8" />
      <Village y={206} fill={INK2} lit={false} />
      <rect y="204" width="200" height="76" fill={INK3} />
      <path d="M0 206H200M14 230q20 -6 40 0M120 250q24 -6 50 0M30 262q20 -4 36 0" stroke={INK2} strokeWidth="3" fill="none" />
      {/* rack */}
      <path d="M108 248V112M184 248V112M100 116H192M108 226L122 248M184 226L170 248" stroke={WOOD} strokeWidth="6" strokeLinecap="round" />
      <path d="M100 116H192" stroke={WOOD2} strokeWidth="2" />
      {/* hides */}
      <path d="M126 116V126M138 116V126M154 116V122M166 116V122M176 116V122" stroke={PARCH3} strokeWidth="1.5" />
      <path d={hidePath(132, 124, 32, 62)} fill="#8a6440" />
      <path d={hidePath(166, 120, 28, 52)} fill="#a8804f" />
      <path d="M132 136V176M124 146q8 6 16 0M166 130V164" stroke="#6b4a2e" strokeWidth="1.5" fill="none" />
      {/* rope coil hung on the post */}
      <ellipse cx="184" cy="150" rx="6" ry="10" fill="none" stroke={PARCH3} strokeWidth="2.5" />
      <ellipse cx="184" cy="152" rx="4" ry="8" fill="none" stroke={PARCH3} strokeWidth="2" />
      {/* vat */}
      <path d="M126 222H170L166 250H130Z" fill={WOOD} />
      <path d="M126 222H170" stroke={INK} strokeWidth="3" />
      <path d="M128 232H168M130 242H166" stroke={INK2} strokeWidth="2" />
      {/* figure */}
      <path d="M66 248L68 222M86 248L84 222" stroke={INK} strokeWidth="9" strokeLinecap="round" />
      <path d="M58 252H72M80 252H94" stroke={INK} strokeWidth="6" strokeLinecap="round" />
      <path d="M70 148C56 152 50 168 52 190C54 208 56 220 58 228H94C96 214 98 196 96 176C94 160 86 148 70 148Z" fill={tunic} />
      {/* leather apron */}
      <path d="M64 170H88C90 190 92 210 94 236H58C60 210 62 190 64 170Z" fill="#6b4a2e" />
      <path d="M64 170L60 156M88 170L86 152" stroke="#6b4a2e" strokeWidth="2.5" />
      <path d="M64 196H90M68 210l4 6M84 204l-3 8" stroke="#4e341f" strokeWidth="2" />
      {/* drooping arms */}
      <path d="M58 164C52 182 52 200 56 214" stroke="#8b8580" strokeWidth="9" strokeLinecap="round" fill="none" />
      <path d="M92 162C100 178 102 196 100 210" stroke="#8b8580" strokeWidth="9" strokeLinecap="round" fill="none" />
      <circle cx="56" cy="216" r="4.5" fill={PARCH3} />
      <circle cx="100" cy="212" r="4.5" fill={PARCH3} />
      <path d="M100 214L108 230" stroke="#8d8a80" strokeWidth="3" strokeLinecap="round" />
      {/* bowed head */}
      <circle cx="78" cy="138" r="13" fill={PARCH3} />
      <path d="M65 136C64 124 74 118 84 122C90 124 93 130 92 136C86 130 76 128 70 134L68 146Z" fill={INK3} />
      <path d="M74 140l6 2M84 140l5 -1" stroke={INK} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M76 149q5 -3 10 0" stroke={INK} strokeWidth="1.8" fill="none" strokeLinecap="round" />
    </g>
  );
}

/* ------------------------------------------------------------------ */
/* Doppelganger: hooded figure behind a mask split into two faces      */
/* ------------------------------------------------------------------ */

function Doppelganger({ u }: { u: string }) {
  const slate = "#94a3b8";
  return (
    <g>
      <defs>
        <linearGradient id={`${u}-other`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2b3442" />
          <stop offset="1" stopColor="#4a5666" />
        </linearGradient>
      </defs>
      <Sky u={u} />
      <rect x="100" width="100" height="280" fill={`url(#${u}-other)`} />
      <Stars pts={[[22, 30], [40, 96, 2], [160, 26, 2.5], [178, 100, 2]]} />
      {/* half moon, one side lit, the other dark */}
      <path d="M100 26A24 24 0 0 0 100 74Z" fill={PARCH} />
      <path d="M100 26A24 24 0 0 1 100 74Z" fill={INK3} stroke={slate} strokeWidth="1.5" />
      {/* mirrored ground */}
      <path d="M0 236C30 228 70 232 100 226V280H0Z" fill={INK2} />
      <path d="M200 236C170 228 130 232 100 226V280H200Z" fill="#232a35" />
      {/* hooded cloak */}
      <path d="M100 90C60 90 46 132 46 172C46 214 32 250 24 280H176C168 250 154 214 154 172C154 132 140 90 100 90Z" fill={INK2} />
      <path d="M100 90C140 90 154 132 154 172C154 214 168 250 176 280H100Z" fill="#1d2430" />
      {/* the mask */}
      <path d="M100 112C124 112 136 130 136 156C136 184 120 206 100 210C80 206 64 184 64 156C64 130 76 112 100 112Z" fill={slate} />
      <path d="M100 112C76 112 64 130 64 156C64 184 80 206 100 210L96 196L102 182L96 168L103 152L97 138L102 124Z" fill={PARCH} />
      <path d="M100 112L102 124L97 138L103 152L96 168L102 182L96 196L100 210" stroke={INK} strokeWidth="2" fill="none" strokeLinejoin="round" />
      {/* left face: calm, closed eye, smile */}
      <path d="M74 148Q82 142 90 148Q82 152 74 148Z" fill={INK} />
      <path d="M72 140Q81 134 90 139" stroke={INK3} strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M80 184Q90 192 99 186" stroke={INK} strokeWidth="3" fill="none" strokeLinecap="round" />
      <circle cx="76" cy="166" r="3" fill={GOLD} opacity="0.8" />
      {/* right face: wide eye, frown */}
      <path d="M110 150Q119 138 128 150Q119 158 110 150Z" fill={INK} />
      <circle cx="119" cy="149" r="2.4" fill={PARCH} />
      <path d="M110 136Q120 132 130 140" stroke="#3a4556" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M101 188Q110 180 120 188" stroke={INK} strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M121 160C122 168 121 174 122 180" stroke="#5a6678" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      {/* hands holding the mask */}
      <path d="M66 196C60 204 62 214 70 216C76 212 78 204 74 196Z" fill={PARCH3} />
      <path d="M134 196C140 204 138 214 130 216C124 212 122 204 126 196Z" fill="#6b7688" />
    </g>
  );
}
