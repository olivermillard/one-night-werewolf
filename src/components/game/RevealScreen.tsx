import { MiniRole } from "@/components/cards/RoleCard";
import { NightTimeline } from "@/components/game/NightTimeline";
import { Button, Panel, SectionHeading, Title } from "@/components/game/ui";
import {
  CENTER_LABELS,
  displayName,
  effectiveRole,
  type Role,
} from "@/lib/game";
import type { GameView, RevealPayload } from "@/lib/view";

/** Roles worth calling out at the top: who the village was hunting. */
const KEY_ROLES: { role: Role; title: string; plural: string }[] = [
  { role: "werewolf", title: "The Werewolf", plural: "The Werewolves" },
  { role: "minion", title: "The Minion", plural: "The Minions" },
  { role: "tanner", title: "The Tanner", plural: "The Tanners" },
];

export function RevealScreen({
  view,
  onRestart,
}: {
  view: GameView;
  onRestart: () => void;
}) {
  const reveal = view.private.reveal;
  if (!reveal) return <p className="text-center text-muted">Resolving…</p>;

  const nameOf = (id: string) =>
    view.room.players.find((player) => player.id === id)?.name ?? id;
  const finalRole = (id: string): Role | null => {
    const card = reveal.finalPlayers[id];
    return card ? effectiveRole(card, reveal.doppelgangerCopy) : null;
  };
  const players = view.room.players;
  const died = (id: string) => reveal.deaths.includes(id);

  const winners = [
    reveal.winners.village ? "The Village" : null,
    reveal.winners.werewolf ? "The Werewolves" : null,
    reveal.winners.tanner ? "The Tanner" : null,
  ].filter((name): name is string => Boolean(name));
  // "The Werewolves" is plural, as is any pair of winners.
  const plural = winners.length > 1 || winners[0] === "The Werewolves";
  const headline = winners.length
    ? `${winners.join(" & ")} ${plural ? "win" : "wins"}`
    : "Nobody wins";

  const groups = KEY_ROLES.map((group) => ({
    ...group,
    ids: players.map((p) => p.id).filter((id) => finalRole(id) === group.role),
  }));
  const wolvesInCenter = reveal.finalCenter.filter((role) => role === "werewolf").length;
  const byVotes = [...players].sort(
    (a, b) => (reveal.tally[b.id] ?? 0) - (reveal.tally[a.id] ?? 0),
  );

  return (
    <>
      {/* 1. Verdict */}
      <Title kicker="Dawn breaks">{headline}</Title>
      <div className="-mt-2 text-center">
        {reveal.winners.reasons.map((reason) => (
          <p key={reason} className="text-lg leading-relaxed text-[#e6d8ba]">
            {reason}
          </p>
        ))}
        <p className="small-caps mt-2 text-sm tracking-[0.15em] text-muted">
          {reveal.houseRules.allWerewolvesMustDie
            ? "House rule: every Werewolf had to die"
            : "Official rule: one dead Werewolf was enough"}
        </p>
      </div>

      {/* 2. Who was who */}
      <Panel className="mt-6">
        <div className="flex flex-wrap justify-center gap-x-8 gap-y-5">
          {groups
            .filter((group) => group.role === "werewolf" || group.ids.length > 0)
            .map((group) => (
              <section
                key={group.role}
                className={group.role === "werewolf" ? "basis-full" : ""}
              >
                <h2
                  className="small-caps mb-2 text-center text-base tracking-[0.25em]"
                  style={{ color: group.role === "werewolf" ? "#e0715f" : "#d4a85a" }}
                >
                  {group.ids.length === 1 ? group.title : group.plural}
                </h2>
                {group.ids.length ? (
                  <ul className="flex flex-wrap justify-center gap-4">
                    {group.ids.map((id) => (
                      <PlayerCard
                        key={id}
                        name={nameOf(id)}
                        role={reveal.finalPlayers[id]!}
                        startedAs={reveal.originalPlayers[id]}
                        died={died(id)}
                      />
                    ))}
                  </ul>
                ) : (
                  <p className="text-center text-muted">
                    No player was a Werewolf.{" "}
                    {wolvesInCenter
                      ? `${wolvesInCenter === 1 ? "The Werewolf was" : "Both Werewolves were"} in the center.`
                      : null}
                  </p>
                )}
              </section>
            ))}
        </div>
      </Panel>

      {/* 3. The vote */}
      <SectionHeading>The vote</SectionHeading>
      <ul className="divide-y divide-line/60 overflow-hidden rounded-xl border border-line bg-panel/70">
        {byVotes.map((player) => {
          const count = reveal.tally[player.id] ?? 0;
          return (
            <li key={player.id} className="flex min-h-12 items-center gap-3 px-4">
              <span className="flex-1 text-lg">{player.name}</span>
              <span className="flex gap-1" aria-hidden>
                {Array.from({ length: count }, (_, i) => (
                  <span key={i} className="h-2.5 w-2.5 rounded-full bg-gold" />
                ))}
              </span>
              <span className="w-16 text-right text-sm text-muted">
                {count} vote{count === 1 ? "" : "s"}
              </span>
              {died(player.id) ? (
                <span className="small-caps rounded-sm bg-[#7a2116] px-2 py-0.5 text-sm tracking-[0.1em] text-[#f6e6d4]">
                  died
                </span>
              ) : (
                <span className="w-[3.1rem]" />
              )}
            </li>
          );
        })}
      </ul>
      {reveal.deaths.length === 0 ? (
        <p className="mt-2 text-center text-muted">
          Nobody got more than one vote, so nobody died.
        </p>
      ) : null}

      {/* 4. Every card */}
      <SectionHeading>Every card</SectionHeading>
      <ul className="space-y-2">
        {players.map((player) => (
          <CardRow
            key={player.id}
            label={player.name}
            reveal={reveal}
            start={reveal.originalPlayers[player.id]}
            end={reveal.finalPlayers[player.id]}
            died={died(player.id)}
            note={
              (reveal.votes[player.id] ?? []).length
                ? `Voted for ${(reveal.votes[player.id] ?? []).map(nameOf).join(" & ")}`
                : "Skipped their vote"
            }
          />
        ))}
      </ul>
      <h3 className="small-caps mt-6 mb-2 text-center text-sm tracking-[0.25em] text-muted">
        The center
      </h3>
      <ul className="space-y-2">
        {reveal.finalCenter.map((role, index) => (
          <CardRow
            key={index}
            label={CENTER_LABELS[index] ?? `Center ${index + 1}`}
            reveal={reveal}
            start={reveal.originalCenter[index]}
            end={role}
          />
        ))}
      </ul>

      {/* 5. Order of the night (collapsed) */}
      <details className="group mt-8 rounded-xl border border-line bg-panel/70">
        <summary className="flex min-h-13 cursor-pointer list-none items-center justify-between gap-3 px-4 [&::-webkit-details-marker]:hidden">
          <span>
            <span className="block font-[family-name:var(--font-display)] text-xl text-[#f3e6c8]">
              Order of the night
            </span>
            <span className="block text-sm text-muted">What every role did, step by step</span>
          </span>
          <svg
            viewBox="0 0 20 20"
            className="h-5 w-5 shrink-0 text-gold transition-transform duration-200 group-open:rotate-180"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden
          >
            <path d="m5 8 5 5 5-5" />
          </svg>
        </summary>
        <div className="border-t border-line/60 px-3 pt-5">
          <NightTimeline deck={view.room.deck} events={reveal.nightLog} />
        </div>
      </details>

      {view.me.isHost ? (
        <div className="mt-10">
          <Button onClick={onRestart}>Play again</Button>
        </div>
      ) : (
        <p className="mt-10 text-center text-muted">
          Waiting for the host to start another round.
        </p>
      )}
    </>
  );
}

function PlayerCard({
  name,
  role,
  startedAs,
  died,
}: {
  name: string;
  role: Role;
  startedAs: Role | undefined;
  died: boolean;
}) {
  return (
    <li className="w-24 text-center">
      <div className={died ? "opacity-80 grayscale-[35%]" : ""}>
        <MiniRole role={role} />
      </div>
      <p className="mt-1.5 text-lg leading-tight">{name}</p>
      {startedAs && startedAs !== role ? (
        <p className="text-sm leading-tight text-[#cdb88c]">was {displayName(startedAs)}</p>
      ) : null}
      <p
        className={`small-caps text-sm tracking-[0.1em] ${died ? "text-[#e0715f]" : "text-muted"}`}
      >
        {died ? "died" : "survived"}
      </p>
    </li>
  );
}

function CardRow({
  label,
  start,
  end,
  died = false,
  note,
  reveal,
}: {
  label: string;
  start: Role | undefined;
  end: Role | undefined;
  died?: boolean;
  note?: string;
  reveal: RevealPayload;
}) {
  if (!start || !end) return null;
  const changed = start !== end;
  const endEffective = effectiveRole(end, reveal.doppelgangerCopy);
  return (
    <li className="flex items-center gap-3 rounded-xl border border-line/70 bg-panel/60 p-2 pr-3">
      <div className="flex shrink-0 items-center gap-1.5">
        <div className="w-11">
          <MiniRole role={start} size="sm" bare />
        </div>
        <span className={changed ? "text-gold" : "text-line"} aria-hidden>
          →
        </span>
        <div className="w-11">
          <MiniRole role={end} size="sm" bare />
        </div>
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-lg leading-tight">
          {label}
          {died ? (
            <span className="small-caps ml-2 text-sm tracking-[0.1em] text-[#e0715f]">died</span>
          ) : null}
        </p>
        <p className="text-sm leading-snug text-[#cdb88c]">
          {changed
            ? `${displayName(start)} → ${displayName(end)}`
            : displayName(start)}
          {end === "doppelganger" && reveal.doppelgangerCopy
            ? ` (as ${displayName(endEffective)})`
            : ""}
        </p>
        {note ? <p className="text-sm leading-snug text-muted">{note}</p> : null}
      </div>
    </li>
  );
}
