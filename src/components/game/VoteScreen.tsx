import { NightTimeline } from "@/components/game/NightTimeline";
import { Button, Panel, SectionHeading, Title } from "@/components/game/ui";
import { MAX_VOTES_PER_PLAYER } from "@/lib/game";
import type { GameView } from "@/lib/view";
import { useState } from "react";

export function VoteScreen({
  view,
  onVote,
}: {
  view: GameView;
  onVote: (playerIds: string[]) => void;
}) {
  const runoff = view.runoff;
  return (
    <>
      {runoff ? (
        // Keyed so choices from the first round don't carry over.
        <Ballot key="runoff" view={view} onVote={onVote} runoff={runoff} />
      ) : (
        <Ballot key="main" view={view} onVote={onVote} runoff={null} />
      )}
      <SectionHeading>Order of the night</SectionHeading>
      <p className="-mt-1 mb-4 text-center text-sm text-muted">
        Every card in the deck, in the order it is called. Three are in the center, so not every step had someone awake.
      </p>
      <NightTimeline deck={view.room.deck} />
    </>
  );
}

function Ballot({
  view,
  onVote,
  runoff,
}: {
  view: GameView;
  onVote: (playerIds: string[]) => void;
  runoff: GameView["runoff"];
}) {
  const maxPicks = runoff ? 1 : MAX_VOTES_PER_PLAYER;
  const locked = view.private.myVotes;
  const voted = view.private.hasVoted;
  const skipped = voted && locked.length === 0;
  const [choices, setChoices] = useState<string[]>(locked);
  const selected = voted ? locked : choices;
  const nameOf = (id: string) =>
    view.room.players.find((player) => player.id === id)?.name ?? id;
  const options = view.room.players.filter(
    (player) =>
      player.id !== view.me.id && (!runoff || runoff.candidates.includes(player.id)),
  );

  function toggle(id: string) {
    setChoices((current) => {
      if (current.includes(id)) return current.filter((item) => item !== id);
      if (current.length >= maxPicks) return [...current.slice(1), id];
      return [...current, id];
    });
  }

  return (
    <>
      {runoff ? (
        <>
          <Title kicker="It's a tie">Tie-break vote</Title>
          <Panel className="mb-5 text-center">
            <p className="text-lg leading-snug text-[#f3e6c8]">
              {listNames(runoff.candidates.map(nameOf))} are tied.
            </p>
            <p className="mt-1 text-muted">
              {runoff.seats === 1 ? "One of them dies" : `${runoff.seats} of them die`}. Everyone
              gets one vote.
              {runoff.locked.length
                ? ` ${listNames(runoff.locked.map(nameOf))} already ${runoff.locked.length === 1 ? "has" : "have"} the most votes and will die.`
                : ""}
            </p>
          </Panel>
        </>
      ) : (
        <Title kicker="Vote">Point at up to two players</Title>
      )}
      <p className="mb-5 text-center text-muted">
        {view.private.voteCount}/{view.private.playerCount} votes in. Votes stay hidden until everyone has voted.
        {runoff ? null : (
          <>
            <br />
            The two players with the most votes die (2 votes or more). A tie for those
            places goes to a tie-break vote.
          </>
        )}
      </p>
      {!runoff && view.room.houseRules.allWerewolvesMustDie ? (
        <p className="small-caps mb-4 text-center text-sm tracking-[0.15em] text-gold">
          House rule: every Werewolf must die
        </p>
      ) : null}
      <div className="space-y-2">
        {options.map((player) => (
          <button
            key={player.id}
            type="button"
            disabled={voted}
            aria-pressed={selected.includes(player.id)}
            onClick={() => toggle(player.id)}
            className={`min-h-14 w-full rounded-lg border px-4 text-left text-xl transition-colors duration-150 ${
              selected.includes(player.id)
                ? "border-[#f0d89a] bg-gold text-[#1c120a]"
                : "border-line bg-panel/80"
            }`}
          >
            {player.name}
          </button>
        ))}
        {runoff && options.length < runoff.candidates.length ? (
          <p className="text-center text-sm text-muted">You&rsquo;re in the tie, so you can&rsquo;t vote for yourself.</p>
        ) : null}
      </div>
      <div className="mt-6 space-y-3">
        <Button
          disabled={voted || choices.length === 0}
          onClick={() => choices.length && onVote(choices)}
        >
          {skipped
            ? "You skipped your vote"
            : voted
              ? "Vote locked"
              : choices.length === 0
                ? runoff
                  ? "Pick one player"
                  : "Pick up to two players"
                : runoff
                  ? "Lock vote"
                  : `Lock vote (${choices.length} of ${MAX_VOTES_PER_PLAYER})`}
        </Button>
        {voted ? null : (
          <Button variant="ghost" onClick={() => onVote([])}>
            Skip my vote
          </Button>
        )}
      </div>
    </>
  );
}

/** "Ann", "Ann and Ben", "Ann, Ben and Cat". */
function listNames(names: string[]): string {
  if (names.length <= 1) return names.join("");
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}
