import { RoleArt } from "@/components/cards/RoleArt";
import { ROLE_INFO, teamOfRole, type Role } from "@/lib/game";
import { useId } from "react";

const TEAM_LABEL = {
  village: "Village",
  werewolf: "Werewolf team",
  tanner: "On their own",
} as const;

/** Leather card back with a gold lattice and a moon seal. */
export function CardBack({ className = "" }: { className?: string }) {
  const uid = useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 200 280" className={className} role="img" aria-label="Face-down card">
      <defs>
        <pattern id={`${uid}-lattice`} width="20" height="20" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="20" height="20" fill="#3a1410" />
          <path d="M0 0H20M0 0V20" stroke="#a87a3255" strokeWidth="1.2" />
          <circle cx="10" cy="10" r="1.3" fill="#d4a85a66" />
        </pattern>
        <radialGradient id={`${uid}-glow`} cx="50%" cy="50%" r="60%">
          <stop offset="0" stopColor="#5a2418" />
          <stop offset="1" stopColor="#1c0907" />
        </radialGradient>
      </defs>
      <rect width="200" height="280" rx="14" fill={`url(#${uid}-glow)`} />
      <rect x="12" y="12" width="176" height="256" rx="8" fill={`url(#${uid}-lattice)`} opacity="0.9" />
      <rect x="12" y="12" width="176" height="256" rx="8" fill="none" stroke="#d4a85a" strokeWidth="2" />
      <rect x="18" y="18" width="164" height="244" rx="6" fill="none" stroke="#d4a85a66" strokeWidth="1" />
      <circle cx="100" cy="140" r="44" fill="#1c0907" stroke="#d4a85a" strokeWidth="2" />
      <circle cx="100" cy="140" r="38" fill="none" stroke="#d4a85a66" strokeWidth="1" />
      {/* crescent moon */}
      <path d="M112 112a30 30 0 1 0 0 56a24 24 0 1 1 0-56Z" fill="#e9dcc0" />
      {/* howling wolf silhouette across the moon */}
      <path
        d="M76 166c4-8 10-12 14-14l4-12 4 8c6-2 10 0 12 4l8 2-6 4c0 6-4 10-10 12l-2 6H76Z"
        fill="#1c0907"
      />
      {[0, 1, 2, 3].map((corner) => {
        const x = corner % 2 === 0 ? 30 : 170;
        const y = corner < 2 ? 30 : 250;
        return (
          <path
            key={corner}
            d={`M${x} ${y - 6} ${x + 6} ${y} ${x} ${y + 6} ${x - 6} ${y}Z`}
            fill="#d4a85a"
          />
        );
      })}
    </svg>
  );
}

/** A role's face: illustration in a gilded frame with a name banner. */
export function CardFace({
  role,
  className = "",
  small = false,
}: {
  role: Role;
  className?: string;
  /** Tiny thumbnails: shorter banner, name only. */
  small?: boolean;
}) {
  const info = ROLE_INFO[role];
  const uid = useId().replace(/:/g, "");
  return (
    <div
      className={`relative aspect-[5/7] overflow-hidden rounded-[1.1rem] border-2 border-gold-deep bg-[#120d0a] shadow-[0_20px_50px_#000c] ${className}`}
    >
      <RoleArt role={role} uid={`${uid}-${role}`} className="absolute inset-0 h-full w-full" />
      <div className="pointer-events-none absolute inset-[5px] rounded-[0.85rem] border border-[#d4a85a66]" />
      <div
        className={`absolute inset-x-0 bottom-0 bg-[linear-gradient(0deg,#120d0af2_50%,transparent)] text-center ${
          small ? "px-1 pb-1.5 pt-5" : "px-3 pb-3 pt-10"
        }`}
      >
        <p
          className={`truncate font-[family-name:var(--font-display)] leading-none text-[#f3e6c8] [text-shadow:0_2px_6px_#000] ${
            small ? "text-[clamp(0.55rem,11cqw,0.9rem)]" : "text-[clamp(0.7rem,10cqw,2rem)]"
          }`}
        >
          {info.name}
        </p>
        {small ? null : (
          <p className="small-caps mt-1 truncate text-[clamp(0.5rem,6cqw,0.9rem)] tracking-[0.15em] text-[#cdb88c]">
            {TEAM_LABEL[teamOfRole(role)]}
          </p>
        )}
      </div>
    </div>
  );
}

export function RoleCard({
  role,
  flipped = true,
  onClick,
}: {
  role: Role;
  flipped?: boolean;
  onClick?: () => void;
}) {
  const info = ROLE_INFO[role];
  return (
    <div className="mx-auto w-full max-w-[18rem]">
      <button
        type="button"
        onClick={onClick}
        aria-label={flipped ? `Your card: ${info.name}. Tap to hide.` : "Tap to reveal your card"}
        className="block w-full [container-type:inline-size] [perspective:1200px]"
      >
        <div className={`card-flip relative aspect-[5/7] w-full ${flipped ? "is-flipped" : ""}`}>
          <div className="card-face absolute inset-0">
            <CardBack className="h-full w-full drop-shadow-[0_20px_40px_#000c]" />
          </div>
          <div className="card-face card-back absolute inset-0">
            <CardFace role={role} className="h-full w-full" />
          </div>
        </div>
      </button>
      <p className="small-caps mt-3 text-center text-sm tracking-[0.25em] text-muted">
        {flipped ? "Tap to hide" : "Tap to reveal"}
      </p>
      {flipped ? (
        <p className="mt-3 text-center leading-relaxed text-[#e6d8ba]">{info.rules}</p>
      ) : null}
    </div>
  );
}

/** Small card thumbnail used in lists, the night and the reveal. */
export function MiniRole({
  role,
  size = "md",
  caption,
}: {
  role: Role;
  size?: "sm" | "md";
  caption?: string;
}) {
  return (
    <figure className={`mx-auto w-full ${size === "sm" ? "max-w-[5.5rem]" : "max-w-[8rem]"} [container-type:inline-size]`}>
      {caption ? (
        <figcaption className="small-caps mb-1 text-center text-xs tracking-[0.2em] text-muted">
          {caption}
        </figcaption>
      ) : null}
      <CardFace role={role} small={size === "sm"} className="rounded-lg border" />
    </figure>
  );
}
