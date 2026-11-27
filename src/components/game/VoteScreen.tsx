import { NightTimeline } from "@/components/game/NightTimeline";
import { Button, SectionHeading, Title } from "@/components/game/ui";
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
  const locked = view.private.myVotes;
  const voted = view.private.hasVoted;
  const skipped = voted && locked.length === 0;
  const [choices, setChoices] = useState<string[]>(locked);
  const selected = voted ? locked : choices;
  const others = view.room.players.filter((player) => player.id !== view.me.id);

  function toggle(id: string) {
    setChoices((current) => {
      if (current.includes(id)) return current.filter((item) => item !== id);
      if (current.length >= MAX_VOTES_PER_PLAYER) {
        return [...current.slice(1), id];
      }
      return [...current, id];
    });
  }

  return (
    <>
      <Title kicker="Vote">Point at up to two players</Title>
      <p className="mb-5 text-center text-muted">
        {view.private.voteCount}/{view.private.playerCount} votes in. Votes stay hidden until everyone has voted.
        <br />
        The two players with the most votes die (2 votes or more).
      </p>
      {view.room.houseRules.allWerewolvesMustDie ? (
        <p className="small-caps mb-4 text-center text-sm tracking-[0.15em] text-gold">
          House rule: every Werewolf must die
        </p>
      ) : null}
      <div className="space-y-2">
        {others.map((player) => (
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
                ? "Pick up to two players"
                : `Lock vote (${choices.length} of ${MAX_VOTES_PER_PLAYER})`}
        </Button>
        {voted ? null : (
          <Button variant="ghost" onClick={() => onVote([])}>
            Skip my vote
          </Button>
        )}
      </div>
      <SectionHeading>Order of the night</SectionHeading>
      <p className="-mt-1 mb-4 text-center text-sm text-muted">
        Every card in the deck, in the order it is called. Three are in the center, so not every step had someone awake.
      </p>
      <NightTimeline deck={view.room.deck} />
    </>
  );
}
