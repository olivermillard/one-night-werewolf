import { MiniRole } from "@/components/cards/RoleCard";
import { Button, Panel, Title } from "@/components/game/ui";
import { displayName, effectiveRole } from "@/lib/game";
import type { GameView } from "@/lib/view";

export function RevealScreen({
  view,
  onRestart,
}: {
  view: GameView;
  onRestart: () => void;
}) {
  const reveal = view.private.reveal;
  if (!reveal) return <p>Resolving…</p>;
  const winners = [
    reveal.winners.village ? "Village" : null,
    reveal.winners.werewolf ? "Werewolves" : null,
    reveal.winners.tanner ? "Tanner" : null,
  ].filter(Boolean);
  const nameOf = (id: string) =>
    view.room.players.find((player) => player.id === id)?.name ?? id;

  return (
    <>
      <Title kicker="Dawn">{winners.join(" & ") || "Nobody"} win</Title>
      <Panel>
        {reveal.winners.reasons.map((reason) => (
          <p key={reason} className="mb-2 text-sm leading-relaxed last:mb-0">
            {reason}
          </p>
        ))}
      </Panel>

      <h2 className="mt-6 text-sm uppercase tracking-[0.2em] text-muted">Deaths</h2>
      <p className="mt-2">
        {reveal.deaths.length
          ? reveal.deaths.map(nameOf).join(", ")
          : "Nobody died."}
      </p>

      <h2 className="mt-6 text-sm uppercase tracking-[0.2em] text-muted">Votes</h2>
      <ul className="mt-2 space-y-1 text-sm">
        {Object.entries(reveal.votes).map(([voter, target]) => (
          <li key={voter}>
            {nameOf(voter)} → {nameOf(target)} ({reveal.tally[target] ?? 0} total)
          </li>
        ))}
      </ul>

      <h2 className="mt-6 text-sm uppercase tracking-[0.2em] text-muted">Cards</h2>
      <ul className="mt-2 space-y-3">
        {view.room.players.map((player) => {
          const original = reveal.originalPlayers[player.id];
          const finalCard = reveal.finalPlayers[player.id];
          if (!original || !finalCard) return null;
          const finalEffective = effectiveRole(finalCard, reveal.doppelgangerCopy);
          return (
            <li key={player.id} className="rounded-2xl bg-white/5 p-3">
              <p className="font-semibold">
                {player.name}
                {reveal.deaths.includes(player.id) ? " died" : ""}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="text-xs text-muted">Started</span>
                <MiniRole role={original} />
                <span className="text-xs text-muted">Ended</span>
                <MiniRole role={finalCard} />
              </div>
              {finalCard === "doppelganger" && reveal.doppelgangerCopy ? (
                <p className="mt-2 text-xs text-muted">
                  Doppelgänger card counts as {displayName(finalEffective)}.
                </p>
              ) : null}
            </li>
          );
        })}
      </ul>

      <h2 className="mt-6 text-sm uppercase tracking-[0.2em] text-muted">Center</h2>
      <div className="mt-2 space-y-2">
        {reveal.finalCenter.map((role, index) => (
          <div key={`${role}-${index}`} className="flex items-center gap-2">
            <span className="w-16 text-xs text-muted">
              {["Left", "Middle", "Right"][index]}
            </span>
            <MiniRole role={reveal.originalCenter[index] ?? role} />
            <span className="text-muted">→</span>
            <MiniRole role={role} />
          </div>
        ))}
      </div>

      <h2 className="mt-6 text-sm uppercase tracking-[0.2em] text-muted">Night log</h2>
      <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm">
        {reveal.nightLog.map((entry, index) => (
          <li key={`${entry.step}-${index}`}>{entry.summary}</li>
        ))}
      </ol>

      {view.me.isHost ? (
        <div className="mt-8">
          <Button onClick={onRestart}>Play again</Button>
        </div>
      ) : (
        <p className="mt-8 text-center text-muted">Waiting for the host to start another round.</p>
      )}
    </>
  );
}
