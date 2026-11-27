import { RoleIcon } from "@/components/cards/RoleIcon";
import { ROLE_INFO, teamOfRole, type Role } from "@/lib/game";

const TEAM_LABEL = {
  village: "Village",
  werewolf: "Werewolf team",
  tanner: "Tanner",
} as const;

export function RoleCard({
  role,
  flipped = true,
  compact = false,
  onClick,
}: {
  role: Role;
  flipped?: boolean;
  compact?: boolean;
  onClick?: () => void;
}) {
  const info = ROLE_INFO[role];
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full max-w-sm [perspective:1200px]"
    >
      <div
        className={`card-flip relative w-full ${flipped ? "is-flipped" : ""}`}
        style={{ minHeight: compact ? 88 : 280 }}
      >
        <div className="card-face absolute inset-0 rounded-3xl border border-white/10 bg-[#16131f] p-4 shadow-[0_20px_60px_#0008]">
          <div className="flex h-full flex-col items-center justify-center gap-3">
            <div className="h-24 w-16 rounded-xl border-2 border-[#d4b46a]/50 bg-[linear-gradient(160deg,#2a2438,black)]" />
            <p className="font-[family-name:var(--font-display)] text-lg tracking-[0.3em] text-gold">
              ONE NIGHT
            </p>
            <p className="text-xs uppercase tracking-[0.4em] text-muted">Tap to reveal</p>
          </div>
        </div>
        <div
          className="card-face card-back absolute inset-0 overflow-hidden rounded-3xl border p-4 text-left shadow-[0_20px_60px_#0008]"
          style={{
            borderColor: `${info.accent}99`,
            background: `linear-gradient(165deg, ${info.accentSoft}, #0b0c12 55%)`,
          }}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-[0.25em] text-muted">
                {TEAM_LABEL[teamOfRole(role)]}
                {info.nightOrder ? ` · Night #${info.nightOrder}` : " · No wake"}
              </p>
              <h2 className="font-[family-name:var(--font-display)] text-2xl text-white">
                {info.name}
              </h2>
            </div>
            <div style={{ color: info.accent }}>
              <RoleIcon role={role} className="h-12 w-12" />
            </div>
          </div>
          {!compact ? (
            <p className="mt-4 text-sm leading-relaxed text-[#efe7d4]/90">{info.rules}</p>
          ) : (
            <p className="mt-2 text-sm text-[#efe7d4]/90">{info.blurb}</p>
          )}
        </div>
      </div>
    </button>
  );
}

export function MiniRole({ role }: { role: Role }) {
  const info = ROLE_INFO[role];
  return (
    <div
      className="flex items-center gap-2 rounded-2xl border px-3 py-2"
      style={{ borderColor: `${info.accent}66`, background: info.accentSoft }}
    >
      <span style={{ color: info.accent }}>
        <RoleIcon role={role} className="h-6 w-6" />
      </span>
      <span className="text-sm font-semibold">{info.name}</span>
    </div>
  );
}
