import { MiniRole } from "@/components/cards/RoleCard";
import { CardsInPlay, deckInWakeOrder } from "@/components/game/CardsInPlay";
import { Button, Panel, SectionHeading, Title } from "@/components/game/ui";
import {
  CENTER_LABELS,
  NIGHT_STEP_INFO,
  ROLE_INFO,
  displayName,
  effectiveRole,
  publicNightSteps,
} from "@/lib/game";
import type { GameView } from "@/lib/view";

export function RevealScreen({
  view,
  onRestart,
}: {
  view: GameView;
  onRestart: () => void;
}) {
  const reveal = view.private.reveal;
  if (!reveal) return <p className="text-center text-muted">Resolving…</p>;
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
  const nameOf = (id: string) =>
    view.room.players.find((player) => player.id === id)?.name ?? id;
  const deck = view.room.deck;
  const steps = publicNightSteps(deck);
  const nonWaking = deckInWakeOrder(deck).filter(
    (role) => ROLE_INFO[role].nightOrder === null,
  );

  return (
    <>
      <Title kicker="Dawn breaks">
        {headline}
      </Title>
      <Panel>
        {reveal.winners.reasons.map((reason) => (
          <p key={reason} className="mb-2 leading-relaxed last:mb-0">
            {reason}
          </p>
        ))}
      </Panel>

      <SectionHeading>The fallen</SectionHeading>
      {reveal.deaths.length ? (
        <ul className="flex flex-wrap justify-center gap-4">
          {reveal.deaths.map((id) => {
            const card = reveal.finalPlayers[id];
            return (
              <li key={id} className="w-32 text-center">
                {card ? <MiniRole role={card} /> : null}
                <p className="mt-1 font-semibold">{nameOf(id)}</p>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-center text-muted">Nobody died.</p>
      )}

      <SectionHeading>Cards in play</SectionHeading>
      <p className="mb-3 text-center text-sm text-muted">
        In the order they were called at night
      </p>
      <CardsInPlay deck={deck} />

      <SectionHeading>Order of the night</SectionHeading>
      <ol className="relative space-y-3 border-l border-line pl-5">
        {steps.map((step, index) => {
          const entries = reveal.nightLog.filter((entry) => entry.step === step);
          const info = NIGHT_STEP_INFO[step];
          return (
            <li key={step} className="relative">
              <span className="absolute -left-[1.95rem] top-1 flex h-6 w-6 items-center justify-center rounded-full border border-gold-deep bg-panel font-[family-name:var(--font-display)] text-sm text-gold">
                {index + 1}
              </span>
              <p className="font-[family-name:var(--font-display)] text-xl text-[#f3e6c8]">
                {info.label}
              </p>
              {entries.length ? (
                entries.map((entry, entryIndex) => (
                  <p key={entryIndex} className="mt-1 leading-relaxed">
                    {entry.summary}
                  </p>
                ))
              ) : (
                <p className="mt-1 text-muted">No one acted.</p>
              )}
            </li>
          );
        })}
        {nonWaking.length ? (
          <li className="relative">
            <span className="absolute -left-[1.95rem] top-1 h-6 w-6 rounded-full border border-line bg-panel" />
            <p className="font-[family-name:var(--font-display)] text-xl text-[#f3e6c8]">
              Never woke
            </p>
            <p className="mt-1 text-muted">
              {[...new Set(nonWaking)].map(displayName).join(", ")}
            </p>
          </li>
        ) : null}
      </ol>

      <SectionHeading>Every player&rsquo;s card</SectionHeading>
      <ul className="space-y-3">
        {view.room.players.map((player) => {
          const original = reveal.originalPlayers[player.id];
          const finalCard = reveal.finalPlayers[player.id];
          if (!original || !finalCard) return null;
          const finalEffective = effectiveRole(finalCard, reveal.doppelgangerCopy);
          const died = reveal.deaths.includes(player.id);
          const votes = reveal.votes[player.id] ?? [];
          return (
            <li key={player.id}>
              <Panel className={died ? "border-[#d0604d]" : ""}>
                <div className="flex items-baseline justify-between gap-2">
                  <p className="font-[family-name:var(--font-display)] text-xl">
                    {player.name}
                  </p>
                  <p className="text-sm text-muted">
                    {reveal.tally[player.id] ?? 0} vote
                    {(reveal.tally[player.id] ?? 0) === 1 ? "" : "s"}
                    {died ? " · died" : ""}
                  </p>
                </div>
                <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                  <MiniRole role={original} caption="Started" />
                  <span className="text-gold-deep" aria-hidden>
                    →
                  </span>
                  <MiniRole role={finalCard} caption="Ended" />
                </div>
                {finalCard === "doppelganger" && reveal.doppelgangerCopy ? (
                  <p className="mt-2 text-sm text-muted">
                    The Doppelgänger card counts as {displayName(finalEffective)}.
                  </p>
                ) : null}
                <p className="mt-2 text-sm text-muted">
                  {votes.length
                    ? `Voted for ${votes.map(nameOf).join(" & ")}`
                    : "Skipped their vote"}
                </p>
              </Panel>
            </li>
          );
        })}
      </ul>

      <SectionHeading>The center</SectionHeading>
      <ul className="space-y-3">
        {reveal.finalCenter.map((role, index) => (
          <li
            key={`${role}-${index}`}
            className="grid grid-cols-[4rem_1fr_auto_1fr] items-center gap-2"
          >
            <span className="small-caps text-sm text-muted">{CENTER_LABELS[index]}</span>
            <MiniRole role={reveal.originalCenter[index] ?? role} size="sm" />
            <span className="text-gold-deep" aria-hidden>
              →
            </span>
            <MiniRole role={role} size="sm" />
          </li>
        ))}
      </ul>

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
